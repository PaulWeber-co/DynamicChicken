/**
 * Feder-Memory — 16 Karten, acht Paare, ein Nervenkostüm.
 *
 * Das Blatt wird aus dem Runden-Seed gemischt: Ihr bekommt garantiert
 * dieselbe Anordnung. Punkte gibt es für Tempo und wenige Fehlversuche.
 */

import { rng, shuffle } from '../util/rng.js';
import { esc } from '../util/dom.js';
import { fx, burst } from '../util/feedback.js';
import { get } from '../state/store.js';
import { duel, seedFor, submitScore, inviteToPlay } from './index.js';

export const meta = {
  id: 'memo',
  emoji: '🃏',
  title: 'Feder-Memory',
  tagline: 'Acht Paare, gleiches Blatt für euch beide',
  modes: ['async'],
  tone: 'calm',
  howto: 'Schnell und mit wenigen Fehlversuchen — daraus entsteht der Punktestand.'
};

const FACES = ['🐣', '🌽', '🪶', '🥚', '🪱', '🌻', '🫐', '🧺', '🌾', '🐛', '🍄', '☀️'];

function deckFor(seed) {
  const r = rng(seed);
  const faces = shuffle(FACES, r).slice(0, 8);
  return shuffle([...faces, ...faces], r);
}

const scoreFor = (ms, misses) =>
  Math.max(50, Math.round(1400 - (ms / 1000) * 9 - misses * 26));

export function summary(state) {
  const d = duel(state, meta.id);
  if (d.theirs && !d.mine) return { badge: 'wait', text: `${d.theirs.score} Punkte zu schlagen` };
  if (d.mine && !d.theirs) return { badge: 'off', text: `Dein Ergebnis: ${d.mine.score}` };
  const n = d.wins.me + d.wins.them + d.wins.draw;
  return n ? { badge: null, text: `${d.wins.me}–${d.wins.them}` } : { badge: null, text: 'Neu' };
}

export function mount(root, ctx) {
  const state = get();
  const partner = state.partner?.name || 'Dein Mensch';
  let timer = 0;

  function shell(inner, right = '') {
    return `<div class="game-wrap">
      <div class="game-top">
        <button class="game-x" data-close aria-label="Schließen">✕</button>
        <div class="game-title">🃏 Feder-Memory</div>
        <div class="game-right">${right}</div>
      </div>
      ${inner}
    </div>`;
  }
  const bind = () => root.querySelectorAll('[data-close]').forEach((b) => { b.onclick = () => ctx.close(); });

  function intro() {
    const d = duel(get(), meta.id);
    const target = d.theirs?.score ?? null;
    root.innerHTML = shell(`
      <div class="game-center">
        <div class="game-hero">🃏</div>
        <h2 class="game-h">Runde ${d.r}</h2>
        <p class="game-p">${target != null
          ? `<b>${esc(partner)}</b> hat <b>${target}</b> Punkte. Gleiches Blatt, gleiche Reihenfolge.`
          : `Acht Paare. Je schneller und je weniger Fehlversuche, desto mehr Punkte.`}</p>
        <button class="btn btn-primary btn-block" data-go>Aufdecken</button>
        ${target == null && get().partner ? `<button class="btn btn-ghost btn-block" data-invite>${esc(partner)} anstupsen</button>` : ''}
      </div>`);
    bind();
    root.querySelector('[data-go]').onclick = () => { fx('pop'); play(); };
    const inv = root.querySelector('[data-invite]');
    if (inv) inv.onclick = () => { inviteToPlay(meta.id); fx('tap'); inv.textContent = 'Angestupst 💌'; inv.disabled = true; };
  }

  function play() {
    const d = duel(get(), meta.id);
    const deck = deckFor(seedFor(meta.id, d.r, get()));
    const found = new Set();
    let open = [];
    let misses = 0, busy = false;
    const start = performance.now();

    root.innerHTML = shell(`
      <div class="game-hud">
        <div class="hud-score"><span data-pairs>0</span><small>von 8</small></div>
        <div class="hud-combo" data-miss></div>
        <div class="hud-live"><span data-time>0.0</span><small>Sekunden</small></div>
      </div>
      <div class="memo-grid" data-grid>
        ${deck.map((f, i) => `<button class="memo-card" data-i="${i}">
          <span class="memo-in">
            <span class="memo-back">🪶</span>
            <span class="memo-front">${f}</span>
          </span>
        </button>`).join('')}
      </div>`);
    bind();

    const elPairs = root.querySelector('[data-pairs]');
    const elMiss = root.querySelector('[data-miss]');
    const elTime = root.querySelector('[data-time]');
    timer = setInterval(() => {
      elTime.textContent = ((performance.now() - start) / 1000).toFixed(1);
    }, 100);

    root.querySelectorAll('.memo-card').forEach((card) => {
      card.onclick = () => {
        const i = Number(card.dataset.i);
        if (busy || found.has(i) || open.some((o) => o.i === i)) return;
        card.classList.add('flipped');
        fx('tap');
        open.push({ i, card });

        if (open.length < 2) return;
        busy = true;
        const [a, b] = open;
        if (deck[a.i] === deck[b.i]) {
          found.add(a.i); found.add(b.i);
          setTimeout(() => {
            a.card.classList.add('matched');
            b.card.classList.add('matched');
            fx('coin');
            burst([deck[a.i]], { from: b.card, count: 4, rise: 70, duration: 600 });
            open = []; busy = false;
            elPairs.textContent = found.size / 2;
            if (found.size === deck.length) finish(performance.now() - start, misses);
          }, 230);
        } else {
          misses++;
          elMiss.textContent = `${misses} daneben`;
          setTimeout(() => {
            a.card.classList.remove('flipped');
            b.card.classList.remove('flipped');
            open = []; busy = false;
          }, 640);
        }
      };
    });
  }

  function finish(ms, misses) {
    clearInterval(timer);
    const score = scoreFor(ms, misses);
    const { settled } = submitScore(meta.id, score, { ms: Math.round(ms), misses });
    fx(settled?.result === 'me' ? 'yay' : 'pop');
    root.innerHTML = shell(`
      <div class="game-center">
        <div class="game-hero">${settled ? (settled.result === 'me' ? '🏆' : settled.result === 'draw' ? '🤝' : '🃏') : '🃏'}</div>
        <h2 class="game-h">${score} Punkte</h2>
        <p class="game-p">${(ms / 1000).toFixed(1)} Sekunden, ${misses} Fehlversuche.
          ${settled
            ? settled.result === 'me' ? ` Du gewinnst ${settled.mine}:${settled.theirs}.`
            : settled.result === 'draw' ? ` Unentschieden, ${settled.mine}:${settled.theirs}.`
            : ` ${esc(partner)} gewinnt ${settled.theirs}:${settled.mine}.`
            : ` Ergebnis unterwegs zu ${esc(partner)}.`}</p>
        <button class="btn btn-primary btn-block" data-again>Nochmal</button>
        <button class="btn btn-ghost btn-block" data-close>Fertig</button>
      </div>`);
    bind();
    root.querySelector('[data-again]').onclick = () => intro();
  }

  intro();
  return () => clearInterval(timer);
}
