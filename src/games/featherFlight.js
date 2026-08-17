/**
 * Federflug — ein Finger, viele Zaunlücken.
 *
 * Hühner können bekanntlich nicht fliegen. Knuddl versucht es trotzdem:
 * Antippen gibt einen Flügelschlag, dazwischen zieht die Schwerkraft.
 *
 * Der Zaun kommt aus dem Runden-Seed, ist also bei euch beiden identisch.
 * Und weil man wissen will, wie weit der andere gekommen ist, steht an
 * genau dieser Stelle ein Fähnchen im Weg — der Geist deines Menschen.
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

const GRAVITY = 1500;      // px pro Sekunde²
const FLAP = -430;         // Impuls nach oben
const SPEED0 = 190;        // Startgeschwindigkeit in px/s
const GAP0 = 210;          // Anfangs­lücke

function buildFence(seed) {
  const r = rng(seed);
  const gates = [];
  let x = 520;
  for (let i = 0; i < 120; i++) {
    gates.push({
      x,
      // Lücke wandert langsam, wird nach und nach enger
      c: 0.28 + r() * 0.44,
      gap: Math.max(140, GAP0 - i * 2.6),
      passed: false
    });
    x += 250 + r() * 90 - Math.min(70, i * 1.4);
  }
  return gates;
}

export function summary(state) {
  const d = duel(state, meta.id);
  if (d.theirs && !d.mine) return { badge: 'wait', text: `${d.theirs.score} Lücken zu schlagen` };
  if (d.mine && !d.theirs) return { badge: 'off', text: `Dein Ergebnis: ${d.mine.score}` };
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
        <div class="fly-field" data-field>
          <div class="fly-sky"></div>
          <div class="fly-gates" data-gates></div>
          <div class="fly-hero" data-hero>${renderChicken(st.me.pet.look, { mood: 'happy', size: 84, shadow: false })}</div>
          <div class="fly-ground"></div>
        </div>
        <p class="catch-hint" data-hint>Tippen zum Flattern</p>
      </div>`;
    bindClose();

    const field = root.querySelector('[data-field]');
    const gatesHost = root.querySelector('[data-gates]');
    const hero = root.querySelector('[data-hero]');
    const elScore = root.querySelector('[data-score]');
    const elHint = root.querySelector('[data-hint]');

    let W = field.clientWidth, H = field.clientHeight;
    const resize = () => { W = field.clientWidth; H = field.clientHeight; };
    window.addEventListener('resize', resize);
    cleanups.push(() => window.removeEventListener('resize', resize));

    const HERO_X = 0.26;
    const R = 30;                 // Trefferradius des Huhns
    let y = H * 0.4, vy = 0, dist = 0, score = 0, dead = false;
    let last = performance.now();

    const flap = () => {
      if (dead) return;
      vy = FLAP;
      fx('tap');
      playAction(hero, 'flap', 420);
      elHint.classList.add('gone');
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
      const dt = Math.min(0.048, (now - last) / 1000);
      last = now;

      const speed = SPEED0 + Math.min(150, score * 5);
      dist += speed * dt;
      vy += GRAVITY * dt;
      y += vy * dt;

      const tilt = Math.max(-24, Math.min(52, vy / 12));
      hero.style.transform = `translate(${HERO_X * W - 42}px, ${y - 46}px) rotate(${tilt}deg)`;

      // Zaunteile zeichnen und mitschieben
      for (const g of gates) {
        const gx = g.x - dist;
        if (gx < -140 || gx > W + 140) {
          if (g.el) { g.el.remove(); g.el = null; }
          continue;
        }
        if (!g.el) {
          const node = document.createElement('div');
          node.className = 'fly-gate';
          node.innerHTML = `<div class="fly-post top"></div><div class="fly-post bot"></div>
            <div class="fly-flag" hidden>${icon('feather', { size: 22 })}</div>`;
          gatesHost.appendChild(node);
          g.el = node;
        }
        const cy = g.c * H;
        const half = g.gap / 2;
        g.el.style.transform = `translateX(${gx}px)`;
        g.el.querySelector('.top').style.height = `${Math.max(0, cy - half)}px`;
        g.el.querySelector('.bot').style.height = `${Math.max(0, H - (cy + half))}px`;
        const flag = g.el.querySelector('.fly-flag');
        const isGhost = ghostAt != null && gates.indexOf(g) === ghostAt;
        flag.hidden = !isGhost;
        if (isGhost) flag.style.top = `${cy - 14}px`;

        // Kollision
        const hx = HERO_X * W;
        if (Math.abs(gx - hx) < 26 + R) {
          if (y - R < cy - half || y + R > cy + half) die();
        }
        if (!g.passed && gx < hx - 26) {
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

      if (y > H - 24 || y < 8) die();
      if (!dead) raf = requestAnimationFrame(frame);
    }

    function die() {
      if (dead) return;
      dead = true;
      running = false;
      cancelAnimationFrame(raf);
      fx('fail');
      playAction(hero, 'bump');
      hero.classList.add('crashed');
      setTimeout(() => finish(score), 750);
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
