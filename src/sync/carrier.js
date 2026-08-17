/**
 * Brieftaube — Synchronisieren ohne jeden Server.
 *
 * Ein Code enthält dein aktuelles Profil und alles, was du seit dem letzten
 * Austausch getan hast. Du schickst ihn per Messenger, dein Mensch fügt ihn
 * ein — und umgekehrt. Ereignisse tragen IDs, deshalb macht es nichts, wenn
 * ein Code doppelt ankommt oder einer verloren geht: Der nächste holt alles
 * nach.
 *
 * Das ist die einzige Betriebsart, die wirklich *überall* funktioniert —
 * ohne Konto, ohne Datenbank, ohne Vertrauen in irgendeinen Anbieter.
 */

import { get, commit, emit } from '../state/store.js';
import { publicProfile, newPet } from '../state/model.js';
import { applyEvent } from '../state/events.js';
import { pack, unpack, extractCode } from '../util/codec.js';

export const id = 'post';

let ctxRef = null;

export async function start(ctx) {
  ctxRef = ctx;
  const state = get();
  if (state.partner?.demo) { state.partner = null; commit('post-clear-demo'); }
  ctx.setStatus(state.partner ? 'ready' : 'idle');
}

export async function stop() { ctxRef = null; }

/** Im Brieftauben-Modus wandert alles in den Outbox-Stapel (siehe sync/index). */
export function send() { /* absichtlich leer */ }
export function publish() { /* absichtlich leer */ }
export function partnerOnline() { return false; }
export function onPair() {}
export function onUnpair() {}

/* ── Code erzeugen ──────────────────────────────────────── */

/**
 * @returns {Promise<{code:string, events:number, chars:number}>}
 */
export async function buildCode() {
  const state = get();
  const events = state.outbox.slice(-40);
  const payload = {
    v: 1,
    p: publicProfile(state),
    e: events
  };
  const code = await pack(payload);
  return { code, events: events.length, chars: code.length };
}

/* ── Code einlesen ──────────────────────────────────────── */

/**
 * Nimmt einen eingefügten Text entgegen, findet den Code darin und wendet
 * alles an, was neu ist.
 * @returns {Promise<{name:string, applied:number, firstContact:boolean}>}
 */
export async function consumeCode(text) {
  const found = extractCode(text) || String(text || '').trim();
  const payload = await unpack(found);
  if (!payload || payload.v !== 1 || !payload.p) {
    throw new Error('Der Code gehört zu einer anderen Version von Knuddl.');
  }

  const state = get();
  const profile = payload.p;
  if (profile.code === state.me.code) {
    throw new Error('Das ist dein eigener Code — den braucht dein Mensch.');
  }

  const firstContact = !state.partner || state.partner.code !== profile.code;
  if (firstContact) {
    state.partner = {
      linked: true,
      code: profile.code,
      name: profile.name || 'Dein Mensch',
      tz: profile.tz || state.me.tz,
      pet: newPet(profile.pet?.name || 'Pieps', 3),
      mood: null,
      activity: null,
      lastSeen: 0,
      updatedAt: 0
    };
    if (!state.bond.since) state.bond.since = Date.now();
    commit('post-pair');
  }

  // Profil zuerst — dann verstehen die Ereignisse, zu wem sie gehören.
  applyEvent({ id: `prof-${profile.at}`, t: 'profile', at: profile.at, from: profile.code, d: profile }, { silent: true });

  let applied = 0;
  let lastNotify = null;
  for (const ev of payload.e || []) {
    const n = applyEvent(ev, { silent: true });
    if (n) lastNotify = n;
    applied++;
  }

  commit('post-consume');
  emit('partner', state.partner);
  if (lastNotify) emit('notify', lastNotify);

  return { name: state.partner.name, applied, firstContact };
}
