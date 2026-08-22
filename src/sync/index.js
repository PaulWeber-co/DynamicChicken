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
import { newSecret, derive, formatInvite, parseInvite, isSupported } from '../util/crypto.js';

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

  // Profil regelmäßig auffrischen — das ist gleichzeitig unser „online“.
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
    d: data,
    // Nachrichten, von denen nur die neueste zählt, tragen denselben
    // Schlüssel — siehe unten.
    ...(opts.ersetzt ? { k: opts.ersetzt } : {})
  };

  // Für den Brieftauben-Modus (und als Notnagel, falls die Cloud klemmt)
  if (!opts.volatile) {
    /**
     * Manche Nachrichten überholen sich selbst.
     *
     * Der automatische Standort meldet sich alle paar Kilometer. Ohne diese
     * Zeile stünden in einem Brieftauben-Code irgendwann vierzig Positionen
     * derselben Fahrt — und die vierzig Spielzüge, die eigentlich hinein
     * gehörten, wären hinausgedrängt. Nur die letzte Meldung ist etwas
     * wert, also fliegen die älteren mit demselben Schlüssel raus.
     */
    if (opts.ersetzt) {
      for (let i = s.outbox.length - 1; i >= 0; i--) {
        if (s.outbox[i].k === opts.ersetzt) s.outbox.splice(i, 1);
      }
    }
    s.outbox.push(ev);
    if (s.outbox.length > 60) s.outbox.splice(0, s.outbox.length - 60);
    commit('outbox');
  }

  try { current?.send?.(ev, get()); } catch (err) { console.warn('[knuddl] send:', err); }
  return ev;
}

/** Mein öffentliches Profil hochladen (Aussehen, Level, Stimmung, „online“). */
export function publishProfile() {
  const s = get();
  s.me.lastActive = Date.now();
  try { current?.publish?.(publicProfile(s), s); } catch (err) { console.warn('[knuddl] publish:', err); }
}

/* ── Verbinden ──────────────────────────────────────────── */

/**
 * Legt das gemeinsame Geheimnis fest.
 *
 * Falls beide Seiten unabhängig eines erzeugt haben, gewinnt das
 * alphabetisch kleinere. Weil beide dieselbe Regel anwenden, landen sie nach
 * einem einzigen Austausch beim selben Schlüssel.
 */
export function adoptSecret(theirs) {
  const s = get();
  s.pair ||= { secret: null, room: null, at: 0 };
  if (!theirs) return s.pair.secret;
  const mine = s.pair.secret;
  const winner = !mine ? theirs : (mine < theirs ? mine : theirs);
  if (winner !== mine) {
    s.pair = { secret: winner, room: null, at: Date.now() };
    commit('pair-secret');
  }
  return winner;
}

/** Die Einladung, die du deinem Menschen schickst. */
export function myInvite() {
  const s = get();
  s.pair ||= { secret: null, room: null, at: 0 };
  if (!s.pair.secret && isSupported()) {
    s.pair = { secret: newSecret(), room: null, at: Date.now() };
    commit('pair-secret');
  }
  return s.pair.secret ? formatInvite(s.me.code, s.pair.secret) : s.me.code;
}

export function inviteLink() {
  const base = location.href.split('#')[0].split('?')[0];
  return `${base}?join=${encodeURIComponent(myInvite())}`;
}

/** Verschlüsselt diese Verbindung? */
export const isEncrypted = () => !!get().pair?.secret && isSupported();

/**
 * Verbinden. Nimmt eine ganze Einladung, einen Link oder einen nackten Code.
 */
export async function pairWith(input) {
  const s = get();
  const parsed = parseInvite(input);
  if (!parsed) throw new Error('Das sieht nicht nach einer Einladung aus.');
  if (parsed.code === s.me.code) throw new Error('Das ist deine eigene Einladung.');

  if (!parsed.secret) {
    // Ein nackter Code trägt keinen Schlüssel. Das funktioniert nur, wenn die
    // Gegenseite ebenfalls ohne Einladung verbindet — und bleibt Klartext.
    console.warn('[knuddl] Ohne Einladung: unverschlüsselte Verbindung.');
  }

  if (parsed.secret) {
    // Die Einladung bringt das Geheimnis mit — sie gewinnt immer, sonst
    // würde der Einladende in einen anderen Raum schreiben.
    s.pair = { secret: parsed.secret, room: null, at: Date.now() };
    commit('pair-secret');
    // Prüfen, ob wir daraus wirklich Schlüssel ableiten können
    try { await derive(parsed.secret); }
    catch { throw new Error('Der Code ist unvollständig oder vertippt.'); }
  }

  s.partner = {
    linked: true,
    code: parsed.code,
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

  if (current?.onPair) await current.onPair(parsed.code, s);
  publishProfile();
  sendEvent('hello', { ...publicProfile(s), k: s.pair?.secret || null });
  emit('sync', syncStatus());
  return { ...s.partner, encrypted: !!parsed.secret };
}

export function unpair() {
  const s = get();
  s.partner = null;
  s.outbox = [];
  s.pair = { secret: null, room: null, at: 0 };
  commit('unpair');
  current?.onUnpair?.(s);
  emit('sync', syncStatus());
}

/* ── Brieftaube (wird von der Einstellungs-Seite genutzt) ─ */

export const buildCarrierCode = (...a) => post.buildCode(...a);
export const consumeCarrierCode = (...a) => post.consumeCode(...a);
