/**
 * Federflug — ein Finger, viele Zaunlücken.
 *
 * Hühner können bekanntlich nicht fliegen. Knuddl versucht es trotzdem:
 * Antippen gibt einen Flügelschlag, dazwischen zieht die Schwerkraft.
 *
 * Der Zaun kommt aus dem Runden-Seed, ist also bei euch beiden identisch.
 * Und weil man wissen will, wie weit der andere gekommen ist, steht an
 * genau dieser Stelle ein Fähnchen im Weg — der Geist deines Menschen.
 *
 * Zur Physik: sie ist absichtlich weich. Es beginnt schwebend und wartet
 * auf den ersten Tipp, die Neigung wird gedämpft und bleibt in einem
 * Bereich, in dem Knuddl noch aussieht wie ein Huhn und nicht wie ein
 * abstürzender Stein. Ein kurzer Moment Nachsicht am Zaun gehört dazu.
 */

import { rng } from '../util/rng.js';
import { esc } from '../util/dom.js';
import { fx, burst } from '../util/feedback.js';
import { get } from '../state/store.js';
import { renderChicken, playAction } from '../pet/chicken.js';
import { icon } from '../ui/icons.js';
import { duel, seedFor, submitScore, inviteToPlay } from './index.js';

export const meta = {
  id: 'flight',
  icon: 'gameFlight',
  title: 'Federflug',
  tagline: 'Tippen, flattern, nicht anecken',
  modes: ['async'],
  tone: 'calm',
  howto: 'Jeder Tipp ist ein Flügelschlag. Das Fähnchen zeigt, wie weit dein Mensch kam.'
};

const GRAVITY = 1150;      // px pro Sekunde²
const FLAP = -370;         // Impuls nach oben
const VY_MAX = 620;        // damit das Fallen nicht in Raserei ausartet
const SPEED0 = 168;        // Startgeschwindigkeit in px/s
const GAP0 = 230;          // Anfangs­lücke
const GAP_MIN = 158;       // enger wird es nicht — sonst ist es kein Spiel mehr
const GATE_W = 56;

function buildFence(seed) {
  const r = rng(seed);
  const gates = [];
  let x = 640;               // erste Lücke erst nach ein paar Sekunden Luft
  for (let i = 0; i < 120; i++) {
    gates.push({
      i,
      x,
      // Lücke wandert langsam, wird nach und nach enger
      c: 0.3 + r() * 0.4,
      gap: Math.max(GAP_MIN, GAP0 - i * 2.2),
      passed: false,
      el: null
    });
    x += 268 + r() * 80 - Math.min(64, i * 1.2);
  }
  return gates;
}

/** Ein Zaunelement: Pfosten mit Latten, Kappe und ggf. Fähnchen. */
function gateMarkup(ghost) {
  const planks = (n) => Array.from({ length: n }, (_, k) =>
    `<span class="fly-plank" style="--k:${k}"></span>`).join('');
  return `
    <div class="fly-post top">
      <span class="fly-grain"></span>${planks(6)}
      <span class="fly-cap down"></span>
    </div>
    <div class="fly-post bot">
      <span class="fly-cap up"></span>
      <span class="fly-grain"></span>${planks(6)}
    </div>
    ${ghost ? `<div class="fly-flag">${icon('feather', { size: 18 })}</div>` : ''}`;
}

export function summary(state) {
  const d = duel(state, meta.id);
  if (d.theirs && !d.mine) return { badge: 'wait', text: `${d.theirs.score} zu schlagen` };
  if (d.mine && !d.theirs) return { badge: 'off', text: `Du: ${d.mine.score}` };
  const n = d.wins.me + d.wins.them + d.wins.draw;
  return n ? { badge: null, text: `${d.wins.me}–${d.wins.them}` } : { badge: null, text: 'Neu' };
}

export function mount(root, ctx) {
  const state = get();
  const partner = state.partner?.name || 'Dein Mensch';
  let raf = 0, running = false;
  const cleanups = [];

  const header = (right = '') => `<div class="game-top">
    <button class="game-x" data-close aria-label="Schließen">${icon('close', { size: 15 })}</button>
    <div class="game-title">${esc(meta.title)}</div>
    <div class="game-right">${right}</div>
  </div>`;
  const bindClose = () => root.querySelectorAll('[data-close]').forEach((b) => { b.onclick = () => ctx.close(); });

  function intro() {
    const d = duel(get(), meta.id);
    const target = d.theirs?.score ?? null;
    root.innerHTML = `
      <div class="game-wrap">
        ${header()}
        <div class="game-center">
          <div class="game-hero">${icon('gameFlight', { size: 68 })}</div>
          <h2 class="game-h">Runde ${d.r}</h2>
          <p class="game-p">${target != null
            ? `<b>${esc(partner)}</b> hat <b>${target}</b> Lücken geschafft. Bei Lücke ${target} steht das Fähnchen.`
            : 'Antippen lässt Knuddl flattern. Der Zaun wird enger, je weiter du kommst.'}</p>
          <button class="btn btn-primary btn-block" data-go>Abheben</button>
          ${target == null && get().partner ? `<button class="btn btn-ghost btn-block" data-invite>${esc(partner)} anstupsen</button>` : ''}
        </div>
      </div>`;
    root.querySelector('[data-go]').onclick = () => { fx('pop'); play(); };
    const inv = root.querySelector('[data-invite]');
    if (inv) inv.onclick = () => { inviteToPlay(meta.id); fx('tap'); inv.textContent = 'Angestupst'; inv.disabled = true; };
    bindClose();
  }

  function play() {
    running = true;
    const st = get();
    const d = duel(st, meta.id);
    const gates = buildFence(seedFor(meta.id, d.r, st));
    const ghostAt = d.theirs?.score ?? null;

    root.innerHTML = `
      <div class="game-wrap game-playing">
        ${header()}
        <div class="game-hud">
          <div class="hud-score"><span data-score>0</span><small>Lücken</small></div>
          <div class="hud-combo" data-combo></div>
          ${ghostAt != null ? `<div class="hud-live"><span data-ghost>${ghostAt}</span><small>${esc(partner)}</small></div>` : ''}
        </div>
        <div class="fly-field fly-ready" data-field>
          <div class="fly-sky"></div>
          <div class="fly-clouds" data-clouds>
            <span class="fly-cloud c1"></span><span class="fly-cloud c2"></span>
            <span class="fly-cloud c3"></span><span class="fly-cloud c4"></span>
          </div>
          <div class="fly-hills" data-hills></div>
          <div class="fly-gates" data-gates></div>
          <div class="fly-hero" data-hero>${renderChicken(st.me.pet.look, { mood: 'excited', size: 84, shadow: false })}</div>
          <div class="fly-ground"></div>
        </div>
        <p class="catch-hint" data-hint>Tippen zum Abheben</p>
      </div>`;
    bindClose();

    const field = root.querySelector('[data-field]');
    const gatesHost = root.querySelector('[data-gates]');
    const clouds = root.querySelector('[data-clouds]');
    const hills = root.querySelector('[data-hills]');
    const hero = root.querySelector('[data-hero]');
    const elScore = root.querySelector('[data-score]');
    const elHint = root.querySelector('[data-hint]');

    let W = field.clientWidth, H = field.clientHeight;
    const resize = () => { W = field.clientWidth; H = field.clientHeight; };
    window.addEventListener('resize', resize);
    cleanups.push(() => window.removeEventListener('resize', resize));

    const HERO_X = 0.26;
    const HERO_HALF = 42;         // halbe Breite des gerenderten Huhns
    const HIT_X = 22;             // Trefferbreite horizontal
    const HIT_Y = 24;             // … und vertikal: kleiner als das Bild, verzeiht knappe Lücken
    const GROUND = 22;

    let y = H * 0.42, vy = 0, dist = 0, score = 0;
    let started = false, dead = false, tilt = 0;
    let last = performance.now();

    const placeHero = () => {
      hero.style.transform =
        `translate(${HERO_X * W - HERO_HALF}px, ${y - 46}px) rotate(${tilt.toFixed(1)}deg)`;
    };
    placeHero();

    const flap = () => {
      if (dead) return;
      if (!started) {                       // erster Tipp startet erst die Schwerkraft
        started = true;
        field.classList.remove('fly-ready');
        elHint.classList.add('gone');
        last = performance.now();
      }
      vy = FLAP;
      fx('tap');
      playAction(hero, 'flap', 420);
    };
    const onDown = (e) => { e.preventDefault(); flap(); };
    const onKey = (e) => { if (e.key === ' ' || e.key === 'ArrowUp') { e.preventDefault(); flap(); } };
    field.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey);
    cleanups.push(() => {
      field.removeEventListener('pointerdown', onDown);
      window.removeEventListener('keydown', onKey);
    });

    function frame(now) {
      if (!running) return;
      const dt = Math.min(0.042, (now - last) / 1000);
      last = now;

      if (started) {
        const speed = SPEED0 + Math.min(140, score * 4.5);
        dist += speed * dt;
        vy = Math.min(VY_MAX, vy + GRAVITY * dt);
        y += vy * dt;
      } else {
        // Warteschleife: Knuddl schwebt und wartet höflich auf den ersten Tipp
        y = H * 0.42 + Math.sin(now / 420) * 7;
      }

      // Neigung gedämpft nachziehen — nie so steil, dass das Gesicht kippt
      const want = started ? Math.max(-15, Math.min(30, vy / 17)) : Math.sin(now / 420) * 4;
      tilt += (want - tilt) * Math.min(1, dt * 9);
      placeHero();

      // Hintergrund in zwei Ebenen mitziehen: das gibt Tiefe
      clouds.style.transform = `translateX(${-(dist * 0.18) % (W + 260)}px)`;
      hills.style.backgroundPositionX = `${-dist * 0.42}px`;

      const hx = HERO_X * W;
      for (const g of gates) {
        const gx = g.x - dist;
        if (gx < -GATE_W - 40 || gx > W + 160) {
          if (g.el) { g.el.remove(); g.el = null; }
          continue;
        }
        if (!g.el) {
          const node = document.createElement('div');
          node.className = 'fly-gate';
          node.innerHTML = gateMarkup(ghostAt != null && g.i === ghostAt);
          gatesHost.appendChild(node);
          g.el = node;
          g.top = node.querySelector('.top');
          g.bot = node.querySelector('.bot');
          g.flag = node.querySelector('.fly-flag');
        }
        const cy = g.c * H;
        const half = g.gap / 2;
        g.el.style.transform = `translateX(${gx}px)`;
        g.top.style.height = `${Math.max(0, cy - half)}px`;
        g.bot.style.height = `${Math.max(0, H - GROUND - (cy + half))}px`;
        if (g.flag) g.flag.style.top = `${cy + half - 30}px`;

        if (started && Math.abs(gx + GATE_W / 2 - hx) < HIT_X + GATE_W / 2) {
          if (y - HIT_Y < cy - half || y + HIT_Y > cy + half) { die(); break; }
        }
        if (started && !g.passed && gx + GATE_W < hx - HIT_X) {
          g.passed = true;
          score++;
          elScore.textContent = score;
          fx('coin');
          if (ghostAt != null && score === ghostAt + 1) {
            burst(['trophy', 'sparkle'], { from: hero, count: 8, rise: 130 });
            fx('yay');
          }
        }
      }

      // Oben ist die Decke nur eine Decke, kein Todesurteil — wer zu eifrig
      // tippt, stößt sanft an statt zu sterben. Der Boden zählt.
      if (started && y < 26) { y = 26; if (vy < 0) vy = 0; }
      if (started && y > H - GROUND - 16) die();
      if (!dead) raf = requestAnimationFrame(frame);
    }

    function die() {
      if (dead) return;
      dead = true;
      running = false;
      cancelAnimationFrame(raf);
      fx('fail');
      // Trudeln statt Überschlag: das Gesicht bleibt sichtbar
      hero.innerHTML = renderChicken(get().me.pet.look, { mood: 'dizzy', size: 84, shadow: false });
      // Die Keyframes ersetzen das inline gesetzte transform komplett, also
      // bekommen sie den aktuellen Stand als Startpunkt mit.
      hero.style.setProperty('--hx', `${(HERO_X * W - HERO_HALF).toFixed(1)}px`);
      hero.style.setProperty('--hy', `${(y - 46).toFixed(1)}px`);
      hero.style.setProperty('--land', `${Math.max(0, H - GROUND - 46 - y).toFixed(1)}px`);
      hero.style.setProperty('--tilt', `${tilt.toFixed(1)}deg`);
      hero.classList.add('crashed');
      setTimeout(() => finish(score), 820);
    }

    raf = requestAnimationFrame(frame);
  }

  function finish(score) {
    const { settled } = submitScore(meta.id, score);
    fx(settled?.result === 'me' ? 'yay' : 'pop');
    root.innerHTML = `
      <div class="game-wrap">
        ${header()}
        <div class="game-center">
          <div class="game-hero">${icon(settled?.result === 'me' ? 'trophy' : 'feather', { size: 68 })}</div>
          <h2 class="game-h">${score} ${score === 1 ? 'Lücke' : 'Lücken'}</h2>
          <p class="game-p">${!settled
            ? `Unterwegs zu ${esc(partner)}. Derselbe Zaun wartet dort.`
            : settled.result === 'me' ? `Du gewinnst ${settled.mine}:${settled.theirs}. +${settled.reward} Körner.`
            : settled.result === 'draw' ? `Beide ${settled.mine}. Unheimlich. +${settled.reward} Körner.`
            : `${esc(partner)} kam ${settled.theirs} weit. +${settled.reward} Körner.`}</p>
          <button class="btn btn-primary btn-block" data-again>Nochmal</button>
          <button class="btn btn-ghost btn-block" data-close>Fertig</button>
        </div>
      </div>`;
    root.querySelector('[data-again]').onclick = () => intro();
    bindClose();
  }

  intro();
  return () => { running = false; cancelAnimationFrame(raf); cleanups.forEach((f) => f()); };
}
