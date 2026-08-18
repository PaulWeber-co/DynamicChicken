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
      // Damit die Wetterkarte auch allein etwas zu zeigen hat
      place: { name: 'Hamburg', region: 'Hamburg', country: 'Deutschland', lat: 53.55, lon: 9.99 },
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
    if (roll < 0.26) emitEv('mood', { key: pick(MOODS).key, note: Math.random() < 0.35 ? pick(NOTES) : '' });
    else if (roll < 0.50) emitEv('act', { key: pick(ACTIVITIES).key });
    else if (roll < 0.68) emitEv('nudge', { key: pick(NUDGES).key });
    else if (roll < 0.78) maybeGameMove(state);
    else if (roll < 0.90) maybeSharedMove(state);
    else emitEv('profile', { pet: { asleep: false } });
  } else if (Math.random() < 0.25) {
    emitEv('nudge', { key: 'gutenacht' });
  }

  later(loop, jitter(70_000, 190_000));
}

/**
 * Der simulierte Mensch baut am Nest mit, stimmt ab und bewertet — sonst
 * blieben drei von vier Abschnitten im Solo-Modus tot.
 */
function maybeSharedMove(state) {
  // Etwas Offenes, auf das eine Antwort fehlt, hat Vorrang
  const poll = (state.polls || []).find((p) => p.theirs == null && !p.doneAt);
  if (poll?.opts?.length) {
    emitEv('poll', { id: poll.id, q: poll.q, opts: poll.opts, by: poll.by, at: poll.at, v: pick(poll.opts).k });
    return;
  }
  const rate = (state.rates || []).find((r) => !r.theirs && !r.doneAt);
  if (rate) {
    const own = 1 + Math.floor(Math.random() * 10);
    const tip = rate.mine
      ? Math.max(1, Math.min(10, rate.mine.score + Math.round(jitter(-2.4, 2.4))))
      : 1 + Math.floor(Math.random() * 10);
    emitEv('rate', {
      id: rate.id, title: rate.title, url: rate.url, note: rate.note,
      kind: rate.kind, by: rate.by, at: rate.at, s: own, g: tip
    });
    return;
  }
  const wish = (state.nest || []).find((w) => w.theirs == null);
  if (wish) {
    // Meist ähnlich, manchmal deutlich anders — sonst gäbe es nie was zu bereden
    const w = Math.random() < 0.62
      ? Math.max(0, Math.min(3, (wish.mine || 0) + (Math.random() < 0.5 ? 0 : 1)))
      : Math.floor(Math.random() * 4);
    emitEv('nest', { id: wish.id, key: wish.key, text: wish.text, icon: wish.icon, cat: wish.cat, w });
    return;
  }
  // Nichts offen: von sich aus etwas fragen
  if (Math.random() < 0.5) {
    const t = pick(SOLO_POLLS);
    emitEv('poll', {
      id: `p-DEMO01-${Date.now().toString(36)}`,
      q: t.q, opts: t.opts, by: 'DEMO01', at: Date.now(),
      v: pick(t.opts).k
    });
  } else {
    const r = pick(SOLO_RATES);
    emitEv('rate', {
      id: `r-DEMO01-${Date.now().toString(36)}`,
      title: r.title, url: r.url || '', note: r.note || '',
      kind: r.url ? 'link' : 'thing', by: 'DEMO01', at: Date.now(),
      s: 1 + Math.floor(Math.random() * 10), g: 1 + Math.floor(Math.random() * 10)
    });
  }
}

const SOLO_POLLS = [
  {
    q: 'Was machen wir heute Abend?',
    opts: [
      { k: 'film', label: 'Film zusammen', icon: 'actShow' },
      { k: 'talk', label: 'Einfach reden', icon: 'nudgeThink' },
      { k: 'play', label: 'Zocken', icon: 'tabPlay' },
      { k: 'early', label: 'Früh schlafen', icon: 'careSleep' }
    ]
  },
  {
    q: 'Wo wollen wir irgendwann hin?',
    opts: [
      { k: 'sea', label: 'Ans Meer', icon: 'roomWater' },
      { k: 'mount', label: 'In die Berge', icon: 'roomNature' },
      { k: 'city', label: 'Große Stadt', icon: 'roomCity' }
    ]
  },
  {
    q: 'Wann telefonieren wir?',
    opts: [
      { k: 'now', label: 'Jetzt gleich', icon: 'clock' },
      { k: 'evening', label: 'Heute Abend', icon: 'nudgeNight' },
      { k: 'tomorrow', label: 'Morgen früh', icon: 'nudgeMorning' }
    ]
  }
];

const SOLO_RATES = [
  { title: 'Der Song, der mir nicht aus dem Kopf geht', note: 'Lief heute dreimal.' },
  { title: 'Kaffee mit Zimt', note: 'Klingt komisch, ist gut.' },
  { title: 'Sonntags früh aufstehen', note: 'Ehrliche Antwort bitte.' },
  { title: 'Die Serie, die alle schauen', note: 'Ich bin bei Folge vier.' }
];

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

    /* Auf eine Abstimmung kommt eine Stimme zurück — sonst bliebe sie ewig offen. */
    case 'poll': {
      const d = ev.d || {};
      if (!d.id || !Array.isArray(d.opts) || !d.opts.length) break;
      later(() => emitEv('poll', {
        id: d.id, q: d.q, opts: d.opts, by: d.by, at: d.at,
        v: pick(d.opts).k
      }), jitter(12_000, 55_000));
      break;
    }

    /* Auf eine Bewertung folgt eine eigene Note plus ein Tipp über mich. */
    case 'rate': {
      const d = ev.d || {};
      if (!d.id) break;
      const own = 1 + Math.floor(Math.random() * 10);
      const tip = d.s != null
        ? Math.max(1, Math.min(10, d.s + Math.round(jitter(-2.4, 2.4))))
        : 1 + Math.floor(Math.random() * 10);
      later(() => emitEv('rate', {
        id: d.id, title: d.title, url: d.url, note: d.note,
        kind: d.kind, by: d.by, at: d.at, s: own, g: tip
      }), jitter(15_000, 65_000));
      break;
    }

    /* Beim Nest antwortet der simulierte Mensch mit einer eigenen Gewichtung. */
    case 'nest': {
      const d = ev.d || {};
      if (!d.id && !d.key) break;
      const w = Math.random() < 0.62
        ? Math.max(0, Math.min(3, (d.w || 0) + (Math.random() < 0.5 ? 0 : -1)))
        : Math.floor(Math.random() * 4);
      later(() => emitEv('nest', {
        id: d.id, key: d.key, text: d.text, icon: d.icon, cat: d.cat, w
      }), jitter(9_000, 48_000));
      break;
    }

    default:
      break;
  }
}

const SOLO_CATS = [
  'Dinge, die ich an dir mag',
  'Was ich nie wieder essen will',
  'Beste Ausreden für Zuspätkommen',
  'Was auf jeden Roadtrip gehört',
  'Die besten Geräusche der Welt'
];

const SOLO_MEMES = [
  'Ich, wenn dein Name auf dem Display steht',
  'Mein Gesicht beim Wecker um sechs',
  'Wenn ich sage „nur kurz aufs Handy schauen“',
  'Wie ich aussehe nach drei Stunden Videocall'
];

/** Antworten für Top Fünf — passen ungefähr auf jede Kategorie. */
const SOLO_TOP5 = [
  'Ein sehr entschlossener Blick',
  'Zwei Tafeln Schokolade',
  'Das gute alte Bauchgefühl',
  'Ein Schlauchboot aus dem Internet',
  'Einfach laut „nein“ sagen',
  'Meine beste Freundin anrufen',
  'Ein Handtuch, immer ein Handtuch',
  'So tun, als hätte ich das geplant'
];

/** Reihenfolge würfeln, ohne das Original anzufassen. */
function shuffled(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
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
    // Der simulierte Mensch spielt „später“ und liegt in deiner Nähe.
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

  /* Meme-Duell: der simulierte Mensch hat keine Bildersammlung, also
     schickt er ein gezeichnetes Hühner-Meme — die Oberfläche kann das. */
  if (d.kind === 'memePrompt') {
    later(() => emitEv('game', { g: 'meme', kind: 'memeShot', r: d.r, drawn: true }), jitter(20_000, 80_000));
    return;
  }
  if (d.kind === 'memeShot') {
    // Meist wohlwollend, selten streng — sonst wäre jede Runde gleich
    const score = Math.random() < 0.55 ? 4 + Math.round(Math.random()) : 2 + Math.round(Math.random());
    later(() => emitEv('game', { g: 'meme', kind: 'memeScore', r: d.r, score }), jitter(18_000, 70_000));
    return;
  }

  /* Top Fünf: auf eine Kategorie kommt eine Liste, auf eine Liste ein Tipp. */
  if (d.kind === 'topCat') {
    const items = shuffled(SOLO_TOP5).slice(0, 5);
    const sol = shuffled([1, 2, 3, 4, 5]);
    later(() => emitEv('game', { g: 'top5', kind: 'topList', r: d.r, items, sol }), jitter(25_000, 95_000));
    return;
  }
  if (d.kind === 'topList') {
    // Ein bisschen richtig, ein bisschen daneben: die echte Lösung leicht
    // durchgeschüttelt, damit die Punktzahl nicht immer im Keller liegt.
    const sol = Array.isArray(d.sol) && d.sol.length === 5 ? d.sol.slice() : [1, 2, 3, 4, 5];
    const guess = sol.slice();
    const swaps = 1 + Math.floor(Math.random() * 3);
    for (let n = 0; n < swaps; n++) {
      const i = Math.floor(Math.random() * 5);
      const j = Math.floor(Math.random() * 5);
      [guess[i], guess[j]] = [guess[j], guess[i]];
    }
    later(() => emitEv('game', { g: 'top5', kind: 'topGuess', r: d.r, guess }), jitter(20_000, 85_000));
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
  // Top Fünf und Meme fangen von sich aus an, statt nur einzuladen —
  // beide brauchen eine Vorgabe, bevor überhaupt etwas zu tun ist.
  const roll = Math.random();
  if (roll < 0.18 && !state.games?.top5?.cur) {
    emitEv('game', { g: 'top5', kind: 'topCat', r: state.games?.top5?.r || 1, cat: pick(SOLO_CATS) });
    return;
  }
  if (roll < 0.32 && !state.games?.meme?.cur) {
    emitEv('game', { g: 'meme', kind: 'memePrompt', r: state.games?.meme?.r || 1, prompt: pick(SOLO_MEMES) });
    return;
  }
  emitEv('game', { g: pick(['grain', 'memo', 'poker', 'hue']), kind: 'invite', r: 1 });
}

export function publish() { /* im Solo-Modus gibt es nichts hochzuladen */ }
export function onPair() { /* echtes Pairing verlässt den Solo-Modus */ }
export function onUnpair(state) {
  if (state.partner?.demo) { state.partner = null; commit('solo-unpair'); }
}
