/**
 * Cloud-Sync über eine Firebase Realtime Database — ohne SDK.
 *
 * Warum ausgerechnet die? Weil sie sich als reine REST-Schnittstelle
 * ansprechen lässt und Änderungen als Server-Sent-Events ausliefert. Beides
 * kann ein Browser von Haus aus. Damit bleibt die App eine statische Seite
 * auf GitHub Pages und kann trotzdem live synchronisieren.
 *
 *   PUT    /u/<meinCode>.json         mein öffentliches Profil
 *   POST   /m/<partnerCode>.json      ein Ereignis in seinen/ihren Briefkasten
 *   STREAM /m/<meinCode>.json         mein Briefkasten, live
 *   STREAM /u/<partnerCode>.json      sein/ihr Profil, live
 *   DELETE /m/<meinCode>/<key>.json   verarbeitete Nachricht aufräumen
 */

import { get, commit } from '../state/store.js';
import CONFIG from '../../config.js';

export const id = 'cloud';

let ctxRef = null;
let streams = [];
let pollTimer = 0;
let stopped = true;
let streamFailures = 0;

const base = () => {
  const s = get();
  const raw = (s.settings.cloudUrl || CONFIG.cloudUrl || '').trim().replace(/\/+$/, '');
  if (!raw) return null;
  const ns = (CONFIG.cloudNamespace || 'knuddl').replace(/[^A-Za-z0-9_-]/g, '');
  return `${raw}/${ns}`;
};

const inboxUrl = (code) => `${base()}/m/${code}.json`;
const profileUrl = (code) => `${base()}/u/${code}.json`;

/* ── Start / Stop ───────────────────────────────────────── */

export async function start(ctx) {
  ctxRef = ctx;
  stopped = false;
  streamFailures = 0;

  const state = get();
  // Ein simulierter Partner hat in der echten Cloud nichts verloren.
  if (state.partner?.demo) { state.partner = null; commit('cloud-clear-demo'); }

  if (!base()) { ctx.setStatus('error'); return; }

  const reachable = await ping();
  if (!reachable) { ctx.setStatus('error'); startPolling(); return; }

  ctx.setStatus('live');
  openStreams();
}

export async function stop() {
  stopped = true;
  streams.forEach((es) => { try { es.close(); } catch { /* egal */ } });
  streams = [];
  clearInterval(pollTimer);
}

async function ping() {
  try {
    const res = await fetch(`${base()}/ping.json`, { method: 'GET', cache: 'no-store' });
    return res.ok;
  } catch {
    return false;
  }
}

/* ── Live-Streams ───────────────────────────────────────── */

function openStreams() {
  const s = get();
  streams.forEach((es) => { try { es.close(); } catch { /* egal */ } });
  streams = [];

  if (typeof EventSource === 'undefined') { startPolling(); return; }

  streams.push(stream(inboxUrl(s.me.code), handleInboxPush));
  if (s.partner?.code) streams.push(stream(profileUrl(s.partner.code), handleProfilePush));
}

function stream(url, onData) {
  const es = new EventSource(url);
  es.addEventListener('put', (e) => safe(() => onData(JSON.parse(e.data))));
  es.addEventListener('patch', (e) => safe(() => onData(JSON.parse(e.data))));
  es.addEventListener('keep-alive', () => { streamFailures = 0; });
  es.onopen = () => { streamFailures = 0; ctxRef?.setStatus('live'); };
  es.onerror = () => {
    // EventSource verbindet sich selbst neu; erst bei hartnäckigen Fehlern
    // schalten wir auf Polling um.
    streamFailures++;
    if (streamFailures >= 4 && !pollTimer) {
      ctxRef?.setStatus('error');
      startPolling();
    }
  };
  return es;
}

const safe = (fn) => { try { fn(); } catch (err) { console.warn('[knuddl] cloud:', err); } };

function handleInboxPush(msg) {
  if (!msg || msg.data == null) return;
  const s = get();

  if (msg.path === '/') {
    // Erstzustand: alles, was seit dem letzten Mal liegen geblieben ist
    Object.entries(msg.data).forEach(([key, ev]) => deliver(key, ev, s.me.code));
  } else {
    const key = String(msg.path).replace(/^\//, '');
    if (key) deliver(key, msg.data, s.me.code);
  }
}

function deliver(key, ev, myCode) {
  if (!ev || !ev.t) return;
  ctxRef?.receive(ev);
  // Briefkasten aufräumen, damit er nicht endlos wächst
  fetch(`${base()}/m/${myCode}/${key}.json`, { method: 'DELETE' }).catch(() => {});
}

function handleProfilePush(msg) {
  if (!msg || msg.data == null) return;
  const profile = msg.path === '/' ? msg.data : null;
  if (!profile || !profile.at) return;
  ctxRef?.receive({ id: `prof-${profile.at}`, t: 'profile', at: profile.at, from: profile.code, d: profile });
}

/* ── Notfall-Polling ────────────────────────────────────── */

function startPolling() {
  clearInterval(pollTimer);
  pollTimer = setInterval(pollOnce, 6500);
  pollOnce();
}

async function pollOnce() {
  if (stopped || !base()) return;
  const s = get();
  try {
    const [inbox, profile] = await Promise.all([
      fetch(inboxUrl(s.me.code), { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      s.partner?.code
        ? fetch(profileUrl(s.partner.code), { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)).catch(() => null)
        : null
    ]);

    if (inbox) Object.entries(inbox).forEach(([key, ev]) => deliver(key, ev, s.me.code));
    if (profile?.at) {
      ctxRef?.receive({ id: `prof-${profile.at}`, t: 'profile', at: profile.at, from: profile.code, d: profile });
    }
    ctxRef?.setStatus('live');
  } catch {
    ctxRef?.setStatus('error');
  }
}

/* ── Senden ─────────────────────────────────────────────── */

export function send(ev, state) {
  const partner = state.partner?.code;
  if (!partner || !base()) return;
  fetch(inboxUrl(partner), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ev)
  }).catch((err) => console.warn('[knuddl] cloud send:', err));
}

export function publish(profile, state) {
  if (!base() || !state.me?.code) return;
  fetch(profileUrl(state.me.code), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile)
  }).catch(() => {});
}

/* ── Präsenz ────────────────────────────────────────────── */

export function partnerOnline(state) {
  const seen = state.partner?.lastSeen || 0;
  if (!seen) return false;
  return Date.now() - seen < (CONFIG.presenceTimeout || 75) * 1000;
}

export function onPair() { openStreams(); }
export function onUnpair() { openStreams(); }
