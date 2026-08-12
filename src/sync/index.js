/**
 * Sync — drei Wege, dasselbe Ziel.
 *
 *   solo    Ein simulierter Partner. Damit die App sofort lebt, auch bevor
 *           ihr euch verbindet — und damit man alles ausprobieren kann.
 *   cloud   Firebase Realtime Database, angesprochen mit fetch() und
 *           EventSource. Kein SDK, kein Backend, echtes Live-Spielen.
 *   post    Brieftaube: kurze Codes, die ihr euch per Messenger schickt.
 *           Null Server, funktioniert überall, dafür zeitversetzt.
 *
 * Von außen sieht alles gleich aus: `sendEvent(type, data)` raus,
 * `applyEvent(ev)` rein.
 */

import { get, commit, emit } from '../state/store.js';
import { publicProfile } from '../state/model.js';
import { applyEvent } from '../state/events.js';
import CONFIG from '../../config.js';

import * as solo from './solo.js';
import * as cloud from './cloud.js';
import * as post from './carrier.js';

const ADAPTERS = { solo, cloud, post };

let current = null;
let currentMode = 'solo';
let status = 'idle';
let publishTimer = 0;

const ctx = {
  /** Ein Ereignis vom Partner ist angekommen. */
  receive(ev) {
    const notify = applyEvent(ev);
    if (notify) emit('notify', notify);
    emit('partner', get().partner);
  },
  setStatus(s) {
    if (status === s) return;
    status = s;
    emit('sync', syncStatus());
  },
  get state() { return get(); },
  config: CONFIG
};

/* ── Steuerung ──────────────────────────────────────────── */

export async function initSync() {
  const s = get();
  await setMode(s.settings.syncMode || 'solo', { silent: true });
}

export async function setMode(mode, { silent = false } = {}) {
  if (!ADAPTERS[mode]) mode = 'solo';
  if (current) {
    try { await current.stop(); } catch { /* egal */ }
    current = null;
  }
  clearInterval(publishTimer);

  currentMode = mode;
  const s = get();
  s.settings.syncMode = mode;
  if (!silent) commit('sync-mode');

  current = ADAPTERS[mode];
  ctx.setStatus('starting');
  try {
    await current.start(ctx);
  } catch (err) {
    console.warn('[knuddl] Sync-Start fehlgeschlagen:', err);
    ctx.setStatus('error');
  }

  // Profil regelmäßig auffrischen — das ist gleichzeitig unser „online".
  if (mode === 'cloud') {
    publishTimer = setInterval(() => publishProfile(), 32_000);
  }
  publishProfile();
  emit('sync', syncStatus());
}

export function syncStatus() {
  const s = get();
  const partner = s.partner;
  const online = current?.partnerOnline?.(s) ?? false;
  return {
    mode: currentMode,
    status,
    online,
    linked: !!partner?.linked,
    label: labelFor(currentMode, status, online, !!partner?.linked)
  };
}

function labelFor(mode, st, online, linked) {
  if (mode === 'solo') return 'Solo-Modus';
  if (mode === 'post') return linked ? 'Brieftaube' : 'Brieftaube · nicht verbunden';
  if (st === 'live') return online ? 'Live verbunden' : 'Cloud · Partner offline';
  if (st === 'starting') return 'Verbinde …';
  if (st === 'error') return 'Cloud nicht erreichbar';
  return 'Cloud';
}

export const partnerOnline = () => syncStatus().online;

/* ── Senden ─────────────────────────────────────────────── */

let seq = 0;

/**
 * Ereignis an den Partner schicken.
 * @param {string} type  'mood' | 'act' | 'nudge' | 'game' | 'daily' | 'cuddle' | 'profile'
 * @param {object} data
 * @param {object} [opts] { volatile } — flüchtige Ereignisse landen nicht im Outbox-Stapel
 */
export function sendEvent(type, data, opts = {}) {
  const s = get();
  const ev = {
    id: `${s.me.code}-${Date.now().toString(36)}-${(seq++).toString(36)}`,
    t: type,
    at: Date.now(),
    from: s.me.code,
    d: data
  };

  // Für den Brieftauben-Modus (und als Notnagel, falls die Cloud klemmt)
  if (!opts.volatile) {
    s.outbox.push(ev);
    if (s.outbox.length > 60) s.outbox.splice(0, s.outbox.length - 60);
    commit('outbox');
  }

  try { current?.send?.(ev, get()); } catch (err) { console.warn('[knuddl] send:', err); }
  return ev;
}

/** Mein öffentliches Profil hochladen (Aussehen, Level, Stimmung, „online"). */
export function publishProfile() {
  const s = get();
  s.me.lastActive = Date.now();
  try { current?.publish?.(publicProfile(s), s); } catch (err) { console.warn('[knuddl] publish:', err); }
}

/* ── Verbinden ──────────────────────────────────────────── */

export async function pairWith(code) {
  const s = get();
  const clean = String(code || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (clean.length !== 6) throw new Error('Ein Knuddl-Code hat sechs Zeichen.');
  if (clean === s.me.code) throw new Error('Das ist dein eigener Code. 🙂');

  s.partner = {
    linked: true,
    code: clean,
    name: 'Dein Mensch',
    tz: s.me.tz,
    pet: s.partner?.pet || null,
    mood: null,
    activity: null,
    lastSeen: 0,
    updatedAt: 0
  };
  if (!s.partner.pet) {
    const { newPet } = await import('../state/model.js');
    s.partner.pet = newPet('Pieps', 3);
  }
  if (!s.bond.since) s.bond.since = Date.now();
  commit('pair');

  if (current?.onPair) await current.onPair(clean, s);
  publishProfile();
  sendEvent('hello', publicProfile(s));
  emit('sync', syncStatus());
  return s.partner;
}

export function unpair() {
  const s = get();
  s.partner = null;
  s.outbox = [];
  commit('unpair');
  current?.onUnpair?.(s);
  emit('sync', syncStatus());
}

/* ── Brieftaube (wird von der Einstellungs-Seite genutzt) ─ */

export const buildCarrierCode = (...a) => post.buildCode(...a);
export const consumeCarrierCode = (...a) => post.consumeCode(...a);
