/**
 * Cloud-Sync über eine Firebase Realtime Database — ohne SDK, verschlüsselt.
 *
 * Warum ausgerechnet die? Weil sie sich als reine REST-Schnittstelle
 * ansprechen lässt **und** Änderungen als Server-Sent-Events ausliefert.
 * Beides kann ein Browser von Haus aus — kein Bundle, kein Build, kein npm.
 * Die Seite bleibt statisch und synchronisiert trotzdem in Echtzeit.
 *
 * Was die Datenbank zu sehen bekommt:
 *
 *   PUT    /r/<raum>/u/<meinCode>.json      { v, iv, ct }
 *   POST   /r/<raum>/m/<partnerCode>.json   { v, iv, ct }
 *   STREAM /r/<raum>/m/<meinCode>.json
 *   STREAM /r/<raum>/u/<partnerCode>.json
 *   DELETE /r/<raum>/m/<meinCode>/<key>.json
 *
 * Der Raum ist aus eurem gemeinsamen Geheimnis abgeleitet und damit nicht
 * auffindbar; der Inhalt ist AES-GCM-verschlüsselt. Ohne euren Code sieht
 * jemand mit Datenbankzugriff nur Zufallszahlen an einer zufälligen Stelle.
 *
 * Fehlt das Geheimnis (alte Verbindung), läuft alles unverschlüsselt am
 * alten Pfad weiter — die Einstellungen sagen das dann auch deutlich.
 */

import { get, commit } from '../state/store.js';
import CONFIG from '../../config.js';
import { derive, seal, open as unseal } from '../util/crypto.js';

export const id = 'cloud';

let ctxRef = null;
let streams = [];
let pollTimer = 0;
let stopped = true;
let streamFailures = 0;

/** Abgeleitete Raum-ID und Schlüssel — hängen am aktuellen Geheimnis. */
let vault = { secret: null, room: null, key: null };

const base = () => {
  const s = get();
  const raw = (s.settings.cloudUrl || CONFIG.cloudUrl || '').trim().replace(/\/+$/, '');
  if (!raw) return null;
  const ns = (CONFIG.cloudNamespace || 'knuddl').replace(/[^A-Za-z0-9_-]/g, '');
  return `${raw}/${ns}`;
};

/** Wurzel für diese Verbindung: eigener Raum, wenn verschlüsselt. */
const rootPath = () => (vault.room ? `${base()}/r/${vault.room}` : base());

const inboxUrl = (code) => `${rootPath()}/m/${code}.json`;
const profileUrl = (code) => `${rootPath()}/u/${code}.json`;

/** Schlüssel zum aktuellen Geheimnis besorgen. */
async function ensureVault() {
  const secret = get().pair?.secret || null;
  if (vault.secret === secret) return vault;
  if (!secret) { vault = { secret: null, room: null, key: null }; return vault; }
  try {
    const { room, key } = await derive(secret);
    vault = { secret, room, key };
  } catch (err) {
    console.warn('[knuddl] Schlüssel nicht ableitbar, sende unverschlüsselt:', err);
    vault = { secret: null, room: null, key: null };
  }
  return vault;
}

const box = (obj) => (vault.key ? seal(vault.key, obj) : Promise.resolve(obj));
const unbox = async (data) => {
  if (!data) return null;
  if (data.v === 1 && data.iv && data.ct) {
    if (!vault.key) return null;              // fremder Raum oder Schlüssel fehlt
    return unseal(vault.key, data);
  }
  return data;                                 // unverschlüsselte Altdaten
};

/* ── Start / Stop ───────────────────────────────────────── */

export async function start(ctx) {
  ctxRef = ctx;
  stopped = false;
  streamFailures = 0;

  const state = get();
  // Ein simulierter Partner hat in der echten Cloud nichts verloren.
  if (state.partner?.demo) { state.partner = null; commit('cloud-clear-demo'); }

  if (!base()) { ctx.setStatus('error'); return; }
  await ensureVault();

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
  const handle = (e) => { try { onData(JSON.parse(e.data)); } catch (err) { console.warn('[knuddl] cloud:', err); } };
  es.addEventListener('put', handle);
  es.addEventListener('patch', handle);
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

async function handleInboxPush(msg) {
  if (!msg || msg.data == null) return;
  const s = get();

  if (msg.path === '/') {
    // Erstzustand: alles, was seit dem letzten Mal liegen geblieben ist
    for (const [key, raw] of Object.entries(msg.data)) await deliver(key, raw, s.me.code);
  } else {
    const key = String(msg.path).replace(/^\//, '');
    if (key) await deliver(key, msg.data, s.me.code);
  }
}

async function deliver(key, raw, myCode) {
  const ev = await unbox(raw);
  if (!ev || !ev.t) {
    // Nicht entschlüsselbar: liegen lassen, es könnte ein anderer Raum sein
    return;
  }
  ctxRef?.receive(ev);
  // Briefkasten aufräumen, damit er nicht endlos wächst
  fetch(`${rootPath()}/m/${myCode}/${key}.json`, { method: 'DELETE' }).catch(() => {});
}

async function handleProfilePush(msg) {
  if (!msg || msg.data == null) return;
  if (msg.path !== '/') return;
  const profile = await unbox(msg.data);
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

    if (inbox) for (const [key, raw] of Object.entries(inbox)) await deliver(key, raw, s.me.code);
    if (profile) {
      const p = await unbox(profile);
      if (p?.at) ctxRef?.receive({ id: `prof-${p.at}`, t: 'profile', at: p.at, from: p.code, d: p });
    }
    ctxRef?.setStatus('live');
  } catch {
    ctxRef?.setStatus('error');
  }
}

/* ── Senden ─────────────────────────────────────────────── */

export async function send(ev, state) {
  const partner = state.partner?.code;
  if (!partner || !base()) return;
  await ensureVault();
  try {
    await fetch(inboxUrl(partner), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(await box(ev))
    });
  } catch (err) {
    console.warn('[knuddl] cloud send:', err);
  }
}

export async function publish(profile, state) {
  if (!base() || !state.me?.code) return;
  // Vor dem Verbinden gibt es niemanden, der das lesen könnte — und ohne
  // Raum landete es unverschlüsselt in der Datenbank.
  if (!state.partner?.code) return;
  await ensureVault();
  fetch(profileUrl(state.me.code), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(await box(profile))
  }).catch(() => {});
}

/* ── Präsenz ────────────────────────────────────────────── */

export function partnerOnline(state) {
  const seen = state.partner?.lastSeen || 0;
  if (!seen) return false;
  return Date.now() - seen < (CONFIG.presenceTimeout || 75) * 1000;
}

export async function onPair() { await ensureVault(); openStreams(); }
export function onUnpair() { vault = { secret: null, room: null, key: null }; openStreams(); }
