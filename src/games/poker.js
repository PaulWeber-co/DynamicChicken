/**
 * Federpoker — fünf Karten, einmal tauschen, beste Hand gewinnt.
 *
 * Das Problem beim Poker ohne Server: Wer mischt? Wer garantiert, dass
 * niemand schummelt oder dass beide dieselben Karten sehen?
 *
 * Die Lösung ist dieselbe wie bei den anderen Duellen: Der Stapel kommt aus
 * dem Rundenschlüssel, den beide Geräte allein aus dem Paar-Code berechnen.
 * Damit ist die Mischung identisch und trotzdem unvorhersehbar. Feste
 * Plätze im Stapel trennen die Blätter:
 *
 *   Karten  0–4   deine Hand
 *   Karten  5–9   die des anderen
 *   Karten 10–14  dein Nachziehstapel
 *   Karten 15–19  seiner
 *
 * Dadurch kann keiner die Karten des anderen beeinflussen, und beide
 * rechnen unabhängig dasselbe Ergebnis aus. Was übertragen wird, ist nur:
 * welche Karten getauscht wurden.
 */

import { rng } from '../util/rng.js';
import { esc } from '../util/dom.js';
import { fx, burst, confetti } from '../util/feedback.js';
import { get, commit } from '../state/store.js';
import { icon } from '../ui/icons.js';
import { pushFeed, addBondXp } from '../state/model.js';
import { REWARDS } from '../state/catalog.js';
import { sendEvent } from '../sync/index.js';
import { relTime } from '../util/time.js';
import { seedFor } from './index.js';

export const meta = {
  id: 'poker',
  icon: 'gamePoker',
  title: 'Federpoker',
  tagline: 'Fünf Karten, einmal tauschen, beste Hand',
  modes: ['async'],
  tone: 'warm',
  howto: 'Beide bekommen aus demselben Stapel fünf Karten und dürfen bis zu drei tauschen.'
};

/* ── Karten ─────────────────────────────────────────────── */

/** Vier Farben aus der Hühnerwelt statt Kreuz und Pik. */
export const SUITS = [
  { id: 'korn',  icon: 'symKorn',  label: 'Korn',  color: '#EDA820' },
  { id: 'ei',    icon: 'symEi',    label: 'Ei',    color: '#C9A24B' },
  { id: 'feder', icon: 'symFeder', label: 'Feder', color: '#7FB9E4' },
  { id: 'herz',  icon: 'statJoy',  label: 'Herz',  color: '#FF7E8E' }
];

const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'B', 'D', 'K', 'A'];

/** 0…51 → { r, s } */
export const cardOf = (n) => ({ r: n % 13, s: Math.floor(n / 13) });
export const rankLabel = (r) => RANKS[r];

/** Deterministisch gemischtes Deck (Fisher-Yates mit dem Rundenseed). */
export function deck(seed) {
  const r = rng(seed);
  const d = Array.from({ length: 52 }, (_, i) => i);
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

/* ── Handbewertung ──────────────────────────────────────── */

const HAND_NAMES = [
  'Hohe Karte', 'Ein Paar', 'Zwei Paare', 'Drilling',
  'Straße', 'Flush', 'Full House', 'Vierling', 'Straight Flush'
];

/**
 * Bewertet fünf Karten.
 * @returns {{cat:number, tie:number[], name:string}} cat höher = besser;
 *          tie entscheidet bei gleicher Kategorie, absteigend verglichen.
 */
export function score(cards) {
  const rs = cards.map((c) => cardOf(c).r).sort((a, b) => b - a);
  const ss = cards.map((c) => cardOf(c).s);
  const flush = ss.every((x) => x === ss[0]);

  const counts = new Map();
  rs.forEach((r) => counts.set(r, (counts.get(r) || 0) + 1));
  // Erst nach Häufigkeit, dann nach Wert — genau die Reihenfolge, in der
  // bei Gleichstand verglichen wird
  const groups = [...counts.entries()]
    .sort((a, b) => (b[1] - a[1]) || (b[0] - a[0]));
  const shape = groups.map((g) => g[1]).join('');

  const uniq = [...new Set(rs)];
  let straight = false, high = rs[0];
  if (uniq.length === 5) {
    if (uniq[0] - uniq[4] === 4) straight = true;
    // Das Ass darf auch unten stehen: A-2-3-4-5
    else if (uniq[0] === 12 && uniq[1] === 3 && uniq[4] === 0) { straight = true; high = 3; }
  }

  const tie = groups.map((g) => g[0]);
  if (straight && flush) return { cat: 8, tie: [high], name: HAND_NAMES[8] };
  if (shape === '41') return { cat: 7, tie, name: HAND_NAMES[7] };
  if (shape === '32') return { cat: 6, tie, name: HAND_NAMES[6] };
  if (flush) return { cat: 5, tie: rs, name: HAND_NAMES[5] };
  if (straight) return { cat: 4, tie: [high], name: HAND_NAMES[4] };
  if (shape === '311') return { cat: 3, tie, name: HAND_NAMES[3] };
  if (shape === '221') return { cat: 2, tie, name: HAND_NAMES[2] };
  if (shape === '2111') return { cat: 1, tie, name: HAND_NAMES[1] };
  return { cat: 0, tie: rs, name: HAND_NAMES[0] };
}

/** @returns 1 = a gewinnt, -1 = b gewinnt, 0 = gleich */
export function compare(a, b) {
  if (a.cat !== b.cat) return a.cat > b.cat ? 1 : -1;
  for (let i = 0; i < Math.max(a.tie.length, b.tie.length); i++) {
    const x = a.tie[i] ?? -1, y = b.tie[i] ?? -1;
    if (x !== y) return x > y ? 1 : -1;
  }
  return 0;
}

/* ── Blätter aus dem Stapel ─────────────────────────────── */

/**
 * @param {number[]} d      gemischter Stapel
 * @param {boolean} first   bin ich der erste Platz? (aus dem Code abgeleitet)
 * @param {number[]} swap   Indizes 0–4, die getauscht wurden
 */
export function handFor(d, first, swap = []) {
  const base = first ? 0 : 5;
  const draw = first ? 10 : 15;
  const cards = d.slice(base, base + 5);
  swap.slice(0, 3).forEach((idx, n) => { cards[idx] = d[draw + n]; });
  return cards;
}

/** Wer sitzt auf Platz eins? Beide rechnen dasselbe aus. */
const isFirst = (state) => (state.me.code || '') < (state.partner?.code || '~');

/* ── Zustand ────────────────────────────────────────────── */

function pk(state) {
  if (!state.games.poker) {
    state.games.poker = { r: 1, mine: null, theirs: null, wins: { me: 0, them: 0, draw: 0 }, hist: [] };
  }
  const g = state.games.poker;
  g.wins ||= { me: 0, them: 0, draw: 0 };
  g.hist ||= [];
  return g;
}

/** Runde abrechnen, sobald beide getauscht haben. */
function settle(state, partnerName) {
  const g = pk(state);
  if (!g.mine || !g.theirs) return null;

  const d = deck(seedFor('poker', g.r, state));
  const first = isFirst(state);
  const myCards = handFor(d, first, g.mine.swap);
  const theirCards = handFor(d, !first, g.theirs.swap);
  const a = score(myCards), b = score(theirCards);
  const cmp = compare(a, b);
  const result = cmp > 0 ? 'me' : cmp < 0 ? 'them' : 'draw';

  g.wins[result]++;
  g.hist.unshift({
    r: g.r, result, mine: a.name, theirs: b.name,
    myCards, theirCards, at: Date.now()
  });
  if (g.hist.length > 20) g.hist.length = 20;

  const reward = result === 'me' ? REWARDS.gameWon : result === 'draw' ? REWARDS.gameDraw : REWARDS.gamePlayed;
  state.me.coins += reward;
  addBondXp(state, 5);
  pushFeed(state, {
    from: 'system', type: 'game', icon: 'gamePoker',
    text: result === 'me'
      ? `Federpoker gewonnen: ${a.name} schlägt ${b.name}`
      : result === 'them'
        ? `Federpoker verloren: ${b.name} von ${partnerName} schlägt ${a.name}`
        : `Federpoker unentschieden — beide ${a.name}`
  });

  g.r++;
  g.mine = null;
  g.theirs = null;
  return { result, reward, a, b, myCards, theirCards };
}

/* ── Netzwerk ───────────────────────────────────────────── */

export function handleRemote(state, msg, { partnerName }) {
  if (msg.kind !== 'pokerSwap') return undefined;
  const g = pk(state);

  if (msg.r < g.r) return null;                 // alte Runde
  if (msg.r > g.r) { g.r = msg.r; g.mine = null; }
  g.theirs = { swap: Array.isArray(msg.swap) ? msg.swap.slice(0, 3) : [], at: Date.now() };

  const done = settle(state, partnerName);
  commit('poker');

  if (done) {
    const won = done.result === 'me';
    return {
      kind: 'gameResult',
      icon: won ? 'trophy' : done.result === 'draw' ? 'nudgeHug' : 'gamePoker',
      avatar: 'them',
      title: won ? 'Federpoker gewonnen!' : done.result === 'draw' ? 'Gleichstand' : `${partnerName} gewinnt`,
      sub: `${done.a.name} gegen ${done.b.name}`,
      body: `Dein Blatt: ${done.a.name}. ${partnerName}: ${done.b.name}. +${done.reward} Körner.`,
      actions: [{ label: 'Revanche', act: 'game:poker', primary: true }, { label: 'Ok', act: 'dismiss' }],
      tone: won ? 'warm' : 'calm'
    };
  }

  return {
    kind: 'gameTurn',
    icon: 'gamePoker',
    avatar: 'them',
    title: `${partnerName} hat getauscht`,
    sub: `Federpoker · Runde ${g.r}`,
    body: `${partnerName} hat sein Blatt fertig. Deine fünf Karten liegen bereit.`,
    actions: [{ label: 'Karten ansehen', act: 'game:poker', primary: true }, { label: 'Später', act: 'dismiss' }],
    tone: 'warm'
  };
}

export function summary(state) {
  const g = pk(state);
  if (g.theirs && !g.mine) return { badge: 'wait', text: 'Du bist dran' };
  if (g.mine && !g.theirs) return { badge: 'off', text: 'Wartet auf Antwort' };
  const n = g.wins.me + g.wins.them + g.wins.draw;
  return n ? { badge: null, text: `${g.wins.me}–${g.wins.them}` } : { badge: null, text: 'Neu' };
}

/* ── Oberfläche ─────────────────────────────────────────── */

export function mount(root, ctx) {
  const partner = get().partner?.name || 'Dein Mensch';

  const shell = (inner) => {
    const g = pk(get());
    return `<div class="game-wrap">
      <div class="game-top">
        <button class="game-x" data-close aria-label="Schließen">${icon('close', { size: 15 })}</button>
        <div class="game-title">Federpoker</div>
        <div class="game-right"><span class="badge">${g.wins.me} : ${g.wins.them}</span></div>
      </div>
      <div class="game-scroll">${inner}</div>
    </div>`;
  };
  const bindClose = () => root.querySelectorAll('[data-close]').forEach((b) => { b.onclick = () => ctx.close(); });

  /** Eine Spielkarte. `held` markiert „behalte ich“. */
  function card(n, { i = null, held = false, dim = false } = {}) {
    const c = cardOf(n);
    const s = SUITS[c.s];
    return `<button class="pk-card ${held ? 'held' : ''} ${dim ? 'dim' : ''}"
      ${i == null ? 'disabled' : `data-i="${i}"`} style="--suit:${s.color}"
      aria-label="${rankLabel(c.r)} ${s.label}${held ? ', behalten' : ''}">
      <span class="pk-rank">${rankLabel(c.r)}</span>
      <span class="pk-suit">${icon(s.icon, { size: 26 })}</span>
      ${held ? `<span class="pk-held">${icon('check', { size: 12 })}</span>` : ''}
    </button>`;
  }

  /* — Tauschen — */
  function screenPlay() {
    const st = get();
    const g = pk(st);
    const d = deck(seedFor('poker', g.r, st));
    const first = isFirst(st);
    const start = handFor(d, first, []);
    /** Indizes, die ich abwerfe */
    let swap = [];

    const draw = () => {
      const shown = handFor(d, first, swap);
      const s = score(shown);
      root.innerHTML = shell(`
        <div class="hue-lead">
          <span class="doodle-kicker">Runde ${g.r}${g.theirs ? ` · ${esc(partner)} hat schon getauscht` : ''}</span>
          <b>${esc(s.name)}</b>
        </div>
        <div class="pk-hand">
          ${shown.map((n, i) => card(n, { i, held: !swap.includes(i) })).join('')}
        </div>
        <p class="tiny muted center" style="margin:2px 0 14px">
          Antippen wirft ab — bis zu drei Karten. ${swap.length}/3 getauscht.
        </p>
        <button class="btn btn-primary btn-block" data-send>
          ${swap.length ? `${swap.length} tauschen und abgeben` : 'So abgeben'}
        </button>
        ${history()}`);

      root.querySelectorAll('[data-i]').forEach((b) => {
        b.onclick = () => {
          const i = Number(b.dataset.i);
          if (swap.includes(i)) swap = swap.filter((x) => x !== i);
          else if (swap.length < 3) swap = [...swap, i].sort((a, z) => a - z);
          else { fx('fail'); return; }
          fx('tap');
          draw();
        };
      });
      root.querySelector('[data-send]').onclick = () => submit(swap);
      bindClose();
    };
    draw();
  }

  function submit(swap) {
    const st = get();
    const g = pk(st);
    g.mine = { swap, at: Date.now() };
    sendEvent('game', { g: 'poker', kind: 'pokerSwap', r: g.r, swap });
    const done = settle(st, partner);
    commit('poker');

    if (done) {
      fx(done.result === 'me' ? 'yay' : done.result === 'draw' ? 'pop' : 'fail');
      if (done.result === 'me') confetti(['gamePoker', 'trophy', 'sparkle']);
      screenResult(done);
    } else {
      fx('pop');
      screenWait();
    }
  }

  function screenWait() {
    const st = get();
    const g = pk(st);
    const d = deck(seedFor('poker', g.r, st));
    const shown = handFor(d, isFirst(st), g.mine?.swap || []);
    root.innerHTML = shell(`
      <div class="game-center">
        <div class="game-hero">${icon('dove', { size: 62 })}</div>
        <h2 class="game-h">Abgegeben</h2>
        <p class="game-p">Dein Blatt liegt verdeckt. Sobald ${esc(partner)} getauscht hat, deckt es sich für euch beide auf.</p>
      </div>
      <div class="pk-hand small">${shown.map((n) => card(n)).join('')}</div>
      <button class="btn btn-ghost btn-block" data-close style="margin-top:14px">Fertig</button>
      ${history()}`);
    bindClose();
  }

  function screenResult(done) {
    root.innerHTML = shell(`
      <div class="game-center">
        <div class="game-hero">${icon(done.result === 'me' ? 'trophy' : done.result === 'draw' ? 'nudgeHug' : 'gamePoker', { size: 62 })}</div>
        <h2 class="game-h">${done.result === 'me' ? 'Gewonnen!' : done.result === 'draw' ? 'Gleichstand' : `${esc(partner)} gewinnt`}</h2>
        <p class="game-p">+${done.reward} Körner</p>
      </div>
      <div class="pk-side">
        <div class="pk-side-h">Du · <b>${esc(done.a.name)}</b></div>
        <div class="pk-hand small">${done.myCards.map((n) => card(n)).join('')}</div>
      </div>
      <div class="pk-side">
        <div class="pk-side-h">${esc(partner)} · <b>${esc(done.b.name)}</b></div>
        <div class="pk-hand small">${done.theirCards.map((n) => card(n, { dim: true })).join('')}</div>
      </div>
      <button class="btn btn-primary btn-block" data-again style="margin-top:14px">Nächste Runde</button>
      ${history()}`);
    root.querySelector('[data-again]').onclick = () => route();
    bindClose();
  }

  function history() {
    const g = pk(get());
    if (!g.hist.length) return '';
    return `<div class="section-label">Bisher</div>
      <div class="list">
        ${g.hist.slice(0, 8).map((h) => `<div class="li">
          <div class="li-ico">${icon(h.result === 'me' ? 'trophy' : 'gamePoker', { size: 19 })}</div>
          <div class="grow">
            <div class="li-title">${esc(h.mine)} gegen ${esc(h.theirs)}</div>
            <div class="li-sub">${h.result === 'me' ? 'gewonnen' : h.result === 'them' ? 'verloren' : 'unentschieden'} · ${relTime(h.at)}</div>
          </div>
        </div>`).join('')}
      </div>`;
  }

  function route() {
    const g = pk(get());
    if (g.mine && !g.theirs) screenWait();
    else screenPlay();
  }

  route();
  return () => {};
}
