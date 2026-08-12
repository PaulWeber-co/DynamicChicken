/**
 * Ei-Duell — Schnick-Schnack-Schnuck für Hühner, fünf Symbole, fünf Runden.
 *
 * Das ideale Zeitzonen-Spiel: Du wählst, wann du kannst. Die Wahl bleibt
 * verdeckt, bis beide gewählt haben — dann klappt die Runde für beide
 * gleichzeitig auf.
 */

import { esc } from '../util/dom.js';
import { fx, burst, confetti } from '../util/feedback.js';
import { get, commit } from '../state/store.js';
import { pushFeed, addBondXp } from '../state/model.js';
import { REWARDS } from '../state/catalog.js';
import { sendEvent } from '../sync/index.js';

export const meta = {
  id: 'egg',
  emoji: '🥚',
  title: 'Ei-Duell',
  tagline: 'Fünf Symbole, fünf Runden, null Zeitdruck',
  modes: ['async', 'live'],
  tone: 'calm',
  howto: 'Jedes Symbol schlägt die zwei, die im Kreis danach kommen.'
};

export const SYMBOLS = [
  { id: 'korn',  e: '🌽', label: 'Korn' },
  { id: 'ei',    e: '🥚', label: 'Ei' },
  { id: 'feder', e: '🪶', label: 'Feder' },
  { id: 'wurm',  e: '🪱', label: 'Wurm' },
  { id: 'stein', e: '🪨', label: 'Stein' }
];

const IDX = Object.fromEntries(SYMBOLS.map((s, i) => [s.id, i]));

const LINES = {
  'korn>ei': 'Das Korn war zuerst da. Uraltes Thema.',
  'korn>feder': 'Korn beschwert die Feder.',
  'ei>feder': 'Aus dem Ei kommt die Feder.',
  'ei>wurm': 'Das Ei erwischt den frühen Wurm.',
  'feder>wurm': 'Die Feder kitzelt den Wurm hervor.',
  'feder>stein': 'Feder segelt, Stein liegt nur rum.',
  'wurm>stein': 'Der Wurm untergräbt den Stein.',
  'wurm>korn': 'Der Wurm frisst das Korn.',
  'stein>korn': 'Stein zermahlt das Korn.',
  'stein>ei': 'Stein trifft Ei. Rührei.'
};

/** @returns 1 = a gewinnt, -1 = b gewinnt, 0 = gleich */
export function beats(a, b) {
  if (a === b) return 0;
  const d = (IDX[b] - IDX[a] + 5) % 5;
  return d === 1 || d === 2 ? 1 : -1;
}

const lineFor = (a, b) => LINES[`${a}>${b}`] || LINES[`${b}>${a}`] || '';

const ROUNDS = 5;

function match(state) {
  if (!state.games.egg) {
    state.games.egg = { m: 1, n: 1, mine: [], theirs: [], score: { me: 0, them: 0 }, wins: { me: 0, them: 0, draw: 0 }, done: false, at: 0 };
  }
  return state.games.egg;
}

function resolveRound(g) {
  const n = g.n - 1;
  const a = g.mine[n], b = g.theirs[n];
  if (!a || !b) return null;
  const r = beats(a, b);
  if (r > 0) g.score.me++;
  else if (r < 0) g.score.them++;
  g.n++;
  return { a, b, r };
}

/** Schaut nach, ob jetzt Runden aufgelöst werden können. */
function advance(state, partnerName) {
  const g = match(state);
  const resolved = [];
  while (g.n <= ROUNDS && g.mine[g.n - 1] && g.theirs[g.n - 1]) {
    resolved.push(resolveRound(g));
  }
  let finished = null;
  if (g.n > ROUNDS && !g.done) {
    g.done = true;
    const result = g.score.me > g.score.them ? 'me' : g.score.them > g.score.me ? 'them' : 'draw';
    const reward = result === 'me' ? REWARDS.gameWon : result === 'draw' ? REWARDS.gameDraw : REWARDS.gamePlayed;
    state.me.coins += reward;
    g.wins[result]++;
    addBondXp(state, 5);
    pushFeed(state, {
      from: 'system', type: 'game', emoji: '🥚',
      text: result === 'me'
        ? `Ei-Duell gewonnen ${g.score.me}:${g.score.them}`
        : result === 'them'
          ? `Ei-Duell verloren ${g.score.me}:${g.score.them} gegen ${partnerName}`
          : `Ei-Duell unentschieden ${g.score.me}:${g.score.them}`
    });
    finished = { result, reward, score: { ...g.score } };
  }
  return { resolved, finished };
}

function newMatch(state, m) {
  const g = match(state);
  g.m = m ?? g.m + 1;
  g.n = 1;
  g.mine = [];
  g.theirs = [];
  g.score = { me: 0, them: 0 };
  g.done = false;
  g.at = Date.now();
  return g;
}

/* ── Netzwerk ───────────────────────────────────────────── */

export function handleRemote(state, msg, { partnerName }) {
  if (msg.kind !== 'pick') return undefined;
  const g = match(state);

  if (msg.m > g.m) newMatch(state, msg.m);      // Partner hat neu angefangen
  if (msg.m < g.m) return null;                  // veraltet

  g.theirs[msg.n - 1] = msg.pick;
  const { finished } = advance(state, partnerName);
  commit('egg');

  if (finished) {
    const won = finished.result === 'me';
    return {
      kind: 'gameResult',
      emoji: won ? '🏆' : finished.result === 'draw' ? '🤝' : '🥚',
      title: won ? 'Ei-Duell gewonnen!' : finished.result === 'draw' ? 'Ei-Duell: unentschieden' : `${partnerName} gewinnt das Ei-Duell`,
      sub: `${finished.score.me}:${finished.score.them}`,
      body: `Das Ei-Duell ist durch: ${finished.score.me}:${finished.score.them}. +${finished.reward} Körner.`,
      actions: [{ label: 'Revanche', act: 'game:egg', primary: true }, { label: 'Ok', act: 'dismiss' }],
      tone: won ? 'warm' : 'calm'
    };
  }

  const waitingForMe = !g.mine[g.n - 1];
  return {
    kind: 'gameTurn',
    emoji: '🥚',
    title: `${partnerName} hat gewählt`,
    sub: waitingForMe ? `Ei-Duell · Runde ${g.n} von ${ROUNDS}` : 'Warte auf die Auflösung',
    body: waitingForMe
      ? `${partnerName} hat für Runde ${g.n} verdeckt gewählt. Jetzt du.`
      : `${partnerName} ist mitgezogen.`,
    actions: [{ label: 'Wählen', act: 'game:egg', primary: true }, { label: 'Später', act: 'dismiss' }],
    tone: 'warm'
  };
}

export function summary(state) {
  const g = match(state);
  if (g.done || (!g.mine.length && !g.theirs.length)) {
    const n = g.wins.me + g.wins.them + g.wins.draw;
    return n ? { badge: null, text: `${g.wins.me}–${g.wins.them}` } : { badge: null, text: 'Neu' };
  }
  if (!g.mine[g.n - 1]) return { badge: 'wait', text: `Runde ${g.n}: du bist dran` };
  return { badge: 'off', text: `Runde ${g.n}: wartet` };
}

/* ── Oberfläche ─────────────────────────────────────────── */

export function mount(root, ctx) {
  const partner = get().partner?.name || 'Dein Mensch';

  function render(justResolved = []) {
    const state = get();
    const g = match(state);
    const myTurn = !g.done && !g.mine[g.n - 1];
    const waiting = !g.done && g.mine[g.n - 1] && !g.theirs[g.n - 1];

    root.innerHTML = `
      <div class="game-wrap">
        <div class="game-top">
          <button class="game-x" data-close aria-label="Schließen">✕</button>
          <div class="game-title">🥚 Ei-Duell</div>
          <div class="game-right"><span class="badge">${g.score.me} : ${g.score.them}</span></div>
        </div>
        <div class="game-scroll">
          <div class="egg-pips">
            ${Array.from({ length: ROUNDS }, (_, i) => {
              const a = g.mine[i], b = g.theirs[i];
              const open = a && b;
              const r = open ? beats(a, b) : null;
              const cls = !open ? (i === g.n - 1 ? 'now' : '') : r > 0 ? 'win' : r < 0 ? 'lose' : 'tie';
              return `<span class="egg-pip ${cls}">${open ? (r > 0 ? '✓' : r < 0 ? '✕' : '=') : i + 1}</span>`;
            }).join('')}
          </div>

          ${g.done ? doneCard(g) : myTurn ? turnCard(g) : waiting ? waitCard(g) : ''}

          ${justResolved.length ? justResolved.map(reveal).join('') : ''}

          <div class="egg-history">
            ${g.mine.slice(0, g.n - 1).map((a, i) => {
              const b = g.theirs[i];
              if (!b) return '';
              const r = beats(a, b);
              return `<div class="egg-row ${r > 0 ? 'win' : r < 0 ? 'lose' : 'tie'}">
                <span class="egg-r">R${i + 1}</span>
                <span class="egg-sym">${SYMBOLS[IDX[a]].e}</span>
                <span class="egg-vs">${r > 0 ? 'schlägt' : r < 0 ? 'verliert gegen' : 'gleich wie'}</span>
                <span class="egg-sym">${SYMBOLS[IDX[b]].e}</span>
                <span class="egg-line">${esc(lineFor(a, b))}</span>
              </div>`;
            }).join('')}
          </div>

          <details class="game-howto">
            <summary>Wer schlägt wen?</summary>
            <div class="egg-wheel">
              ${SYMBOLS.map((s, i) => `<div class="egg-wheel-row">
                <b>${s.e} ${s.label}</b> schlägt ${SYMBOLS[(i + 1) % 5].e} und ${SYMBOLS[(i + 2) % 5].e}
              </div>`).join('')}
            </div>
          </details>
        </div>
      </div>`;

    root.querySelectorAll('[data-close]').forEach((b) => { b.onclick = () => ctx.close(); });
    root.querySelectorAll('[data-pick]').forEach((b) => {
      b.onclick = () => pick(b.dataset.pick, b);
    });
    const again = root.querySelector('[data-again]');
    if (again) again.onclick = () => {
      newMatch(get());
      commit('egg');
      fx('pop');
      render();
    };
  }

  function turnCard(g) {
    return `<div class="card game-card">
      <div class="game-kicker">Runde ${g.n} von ${ROUNDS}</div>
      <h2 class="game-h">Was legst du?</h2>
      <p class="game-p">${g.theirs[g.n - 1]
        ? `${esc(partner)} hat schon verdeckt gewählt.`
        : `Deine Wahl bleibt geheim, bis ${esc(partner)} auch gewählt hat.`}</p>
      <div class="egg-picks">
        ${SYMBOLS.map((s) => `<button class="egg-pick" data-pick="${s.id}">
          <span class="egg-pick-e">${s.e}</span>
          <span class="egg-pick-l">${s.label}</span>
        </button>`).join('')}
      </div>
    </div>`;
  }

  function waitCard(g) {
    const mine = SYMBOLS[IDX[g.mine[g.n - 1]]];
    return `<div class="card game-card center">
      <div class="game-kicker">Runde ${g.n} von ${ROUNDS}</div>
      <div class="egg-sealed">${mine.e}</div>
      <h2 class="game-h">Verdeckt abgelegt</h2>
      <p class="game-p">Du hast ${mine.label} gewählt. Sobald ${esc(partner)} zieht, klappt die Runde auf — bei euch beiden gleichzeitig.</p>
    </div>`;
  }

  function doneCard(g) {
    const res = g.score.me > g.score.them ? 'me' : g.score.them > g.score.me ? 'them' : 'draw';
    return `<div class="card game-card center">
      <div class="game-hero">${res === 'me' ? '🏆' : res === 'draw' ? '🤝' : '🐣'}</div>
      <h2 class="game-h">${res === 'me' ? 'Gewonnen!' : res === 'draw' ? 'Unentschieden' : `${esc(partner)} gewinnt`}</h2>
      <p class="game-p">Endstand ${g.score.me}:${g.score.them} · Gesamtbilanz ${g.wins.me}–${g.wins.them}</p>
      <button class="btn btn-primary btn-block" data-again>Neues Duell</button>
    </div>`;
  }

  function reveal(x) {
    if (!x) return '';
    return `<div class="egg-reveal ${x.r > 0 ? 'win' : x.r < 0 ? 'lose' : 'tie'}">
      <span>${SYMBOLS[IDX[x.a]].e}</span>
      <b>${x.r > 0 ? 'gewinnt' : x.r < 0 ? 'verliert' : 'gleich'}</b>
      <span>${SYMBOLS[IDX[x.b]].e}</span>
      <em>${esc(lineFor(x.a, x.b))}</em>
    </div>`;
  }

  function pick(id, btn) {
    const state = get();
    const g = match(state);
    if (g.done || g.mine[g.n - 1]) return;
    g.mine[g.n - 1] = id;
    fx('pop');
    burst([SYMBOLS[IDX[id]].e], { from: btn, count: 4, rise: 90 });

    sendEvent('game', { g: 'egg', kind: 'pick', m: g.m, n: g.n, pick: id });

    const { resolved, finished } = advance(state, partner);
    commit('egg');
    if (finished) {
      fx(finished.result === 'me' ? 'yay' : 'pop');
      if (finished.result === 'me') confetti(['🥚', '🏆', '✨', '💛']);
    }
    render(resolved);
  }

  render();
  return () => {};
}
