/**
 * Solo-Modus — ein simulierter Mensch am anderen Ende.
 *
 * Zweck: Die App soll vom ersten Öffnen an lebendig sein. Man sieht, wie
 * sich eine Stimmung anfühlt, wenn sie ankommt, wie ein Spielzug hereinflattert
 * und wie ein Banner hereinfährt — ohne dass jemand anderes mitspielen
 * muss. Sobald ihr euch verbindet, ersetzt der echte Mensch die Simulation.
 */

import { get, commit } from '../state/store.js';
import { newPet } from '../state/model.js';
import { defaultLook } from '../pet/chicken.js';
import { MOODS, ACTIVITIES, NUDGES } from '../pet/moods.js';
import { pick } from '../util/rng.js';
import { hourIn, dayKey } from '../util/time.js';
import { SYMBOLS } from './../games/eggDuel.js';

export const id = 'solo';

let ctxRef = null;
let timers = [];
let stopped = true;

const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; };
const clearAll = () => { timers.forEach(clearTimeout); timers = []; };
const jitter = (a, b) => a + Math.random() * (b - a);

function ensureDemoPartner(state) {
  const name = state.settings.soloName || 'Mila';
  if (!state.partner || state.partner.demo) {
    state.partner = {
      linked: true,
      demo: true,
      code: 'DEMO01',
      name,
      tz: state.me.tz,
      pet: {
        ...newPet('Pieps', 3),
        look: { ...defaultLook(3), body: 'rose', comb: 'heart', eyes: 'sparkle', acc: 'bowtie' }
      },
      mood: { key: 'gluecklich', at: Date.now() - 3_600_000 },
      activity: { key: 'chillen', at: Date.now() - 1_800_000 },
      lastSeen: Date.now(),
      updatedAt: Date.now()
    };
    if (!state.bond.since) state.bond.since = Date.now();
    commit('solo-partner');
  } else {
    state.partner.name = name;
  }
  return state.partner;
}

/** Schläft der simulierte Mensch gerade? Nachts ist eben Ruhe. */
function asleepNow(state) {
  const h = hourIn(state.partner?.tz || state.me.tz);
  return h >= 1 && h < 7;
}

export function partnerOnline(state) {
  return !!state.partner && !asleepNow(state);
}

export async function start(ctx) {
  ctxRef = ctx;
  stopped = false;
  const state = get();
  ensureDemoPartner(state);
  ctx.setStatus('live');

  // Erster Lebenszeichen-Moment kurz nach dem Start — nicht sofort,
  // sonst wirkt es wie ein Skript.
  later(loop, jitter(25_000, 55_000));
}

export async function stop() {
  stopped = true;
  clearAll();
}

function emitEv(t, d, at = Date.now()) {
  if (stopped || !ctxRef) return;
  const state = get();
  ctxRef.receive({
    id: `demo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    t, at, from: state.partner?.code || 'DEMO01', d
  });
}

/* ── Der Tagesrhythmus des simulierten Menschen ─────────── */

function loop() {
  if (stopped) return;
  const state = get();
  ensureDemoPartner(state);

  if (!asleepNow(state)) {
    const roll = Math.random();
    if (roll < 0.30) emitEv('mood', { key: pick(MOODS).key, note: Math.random() < 0.35 ? pick(NOTES) : '' });
    else if (roll < 0.58) emitEv('act', { key: pick(ACTIVITIES).key });
    else if (roll < 0.80) emitEv('nudge', { key: pick(NUDGES).key });
    else if (roll < 0.90) maybeGameMove(state);
    else emitEv('profile', { pet: { asleep: false } });
  } else if (Math.random() < 0.25) {
    emitEv('nudge', { key: 'gutenacht' });
  }

  later(loop, jitter(70_000, 190_000));
}

const NOTES = [
  'Bin gleich fertig hier',
  'Denk an dich',
  'Heute war lang',
  'Kaffee Nr. 3',
  'Sonne scheint hier gerade',
  'Zug hat Verspätung, klar'
];

/* ── Reaktionen auf das, was ich schicke ────────────────── */

export function send(ev, state) {
  if (stopped) return;

  switch (ev.t) {
    case 'nudge':
      // Kein Pingpong-Zwang: manchmal kommt eben nichts zurück.
      if (Math.random() < 0.72) {
        later(() => emitEv('nudge', { key: pick(NUDGES).key }), jitter(6_000, 24_000));
      }
      break;

    case 'mood':
      if (Math.random() < 0.55) {
        later(() => emitEv('mood', { key: pick(MOODS).key, note: '' }), jitter(20_000, 70_000));
      }
      break;

    case 'daily':
      later(() => emitEv('daily', {
        day: ev.d?.day || dayKey(),
        q: ev.d?.q || '',
        answer: pick(DAILY_ANSWERS)
      }), jitter(15_000, 60_000));
      break;

    case 'game':
      answerGame(ev, state);
      break;

    default:
      break;
  }
}

const DAILY_ANSWERS = [
  'Als ich heute Morgen dein Bild gesehen habe.',
  'Ehrlich? Der Moment, als endlich Feierabend war.',
  'Ein Hund im Park, der genau wie du geguckt hat.',
  'Dass wir bald wieder am selben Ort sind.',
  'Nichts Großes. Aber es war ein guter Tag.',
  'Der Gedanke, dass du das hier gleich liest.'
];

function answerGame(ev, state) {
  const d = ev.d || {};

  if (d.kind === 'score') {
    // Der simulierte Mensch spielt „später" und liegt in deiner Nähe.
    const mine = d.score || 0;
    const theirs = Math.max(1, Math.round(mine * jitter(0.65, 1.35) + jitter(-4, 8)));
    later(() => emitEv('game', { g: d.g, kind: 'score', r: d.r, score: theirs }), jitter(18_000, 75_000));
    return;
  }

  if (d.kind === 'pick') {
    later(() => emitEv('game', {
      g: 'egg', kind: 'pick', m: d.m, n: d.n, pick: pick(SYMBOLS).id
    }), jitter(8_000, 40_000));
    return;
  }

  if (d.kind === 'beat') {
    const score = Math.round(jitter(42, 97));
    later(() => emitEv('game', { g: 'beat', kind: 'beatScore', id: d.id, score }), jitter(25_000, 90_000));
    return;
  }

  if (d.kind === 'duett') {
    // Manchmal liegt er/sie richtig, manchmal daneben — wie im echten Leben.
    const guessRight = Math.random() < 0.45;
    later(() => emitEv('game', {
      g: 'duett', kind: 'duett',
      day: d.day,
      actual: pick(MOODS).key,
      guess: guessRight ? d.actual : pick(MOODS).key
    }), jitter(12_000, 55_000));
  }
}

function maybeGameMove(state) {
  const g = state.games?.egg;
  if (g && !g.done && !g.theirs[g.n - 1]) {
    emitEv('game', { g: 'egg', kind: 'pick', m: g.m, n: g.n, pick: pick(SYMBOLS).id });
    return;
  }
  emitEv('game', { g: pick(['grain', 'memo']), kind: 'invite', r: 1 });
}

export function publish() { /* im Solo-Modus gibt es nichts hochzuladen */ }
export function onPair() { /* echtes Pairing verlässt den Solo-Modus */ }
export function onUnpair(state) {
  if (state.partner?.demo) { state.partner = null; commit('solo-unpair'); }
}
