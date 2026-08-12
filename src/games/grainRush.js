/**
 * Körner-Jagd — 30 Sekunden, fallende Leckereien, ein Finger.
 *
 * Der Regen ist aus dem Runden-Seed vorberechnet: Beide bekommen exakt
 * dieselben Körner, Würmer und Bomben zur selben Millisekunde. Wer
 * gleichzeitig spielt, sieht den Punktestand des anderen live mitlaufen.
 */

import { rng } from '../util/rng.js';
import { esc } from '../util/dom.js';
import { fx, burst } from '../util/feedback.js';
import { get } from '../state/store.js';
import { duel, seedFor, submitScore, sendLiveTick, inviteToPlay } from './index.js';

export const meta = {
  id: 'grain',
  emoji: '🌽',
  title: 'Körner-Jagd',
  tagline: '30 Sekunden, ein Finger, viel zu viele Körner',
  modes: ['live', 'async'],
  tone: 'warm',
  howto: 'Tippe alles Essbare an. Bomben nicht. Serien geben Extrapunkte.'
};

const DURATION = 30_000;

const KINDS = [
  { e: '🌽', pts: 1,  w: 46, r: 26, speed: 0.20 },
  { e: '🪱', pts: 2,  w: 20, r: 26, speed: 0.26 },
  { e: '🫐', pts: 2,  w: 14, r: 24, speed: 0.30 },
  { e: '⭐️', pts: 5,  w: 7,  r: 24, speed: 0.36 },
  { e: '💗', pts: 3,  w: 6,  r: 26, speed: 0.22 },
  { e: '💣', pts: -4, w: 15, r: 26, speed: 0.28 }
];

function buildRain(seed) {
  const r = rng(seed);
  const items = [];
  let t = 500;
  while (t < DURATION - 600) {
    const roll = r() * KINDS.reduce((s, k) => s + k.w, 0);
    let acc = 0, kind = KINDS[0];
    for (const k of KINDS) { acc += k.w; if (roll <= acc) { kind = k; break; } }
    items.push({
      t,
      x: 0.10 + r() * 0.80,
      kind,
      speed: kind.speed * (0.85 + r() * 0.4),
      spin: (r() - 0.5) * 2,
      hit: false
    });
    // gegen Ende wird es dichter
    const pace = 620 - 300 * (t / DURATION);
    t += pace * (0.6 + r() * 0.8);
  }
  return items;
}

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
  let raf = 0, tickTimer = 0, running = false;
  const cleanupFns = [];

  function screenIntro() {
    const d = duel(get(), meta.id);
    const target = d.theirs?.score ?? null;
    root.innerHTML = `
      <div class="game-wrap">
        ${header()}
        <div class="game-center">
          <div class="game-hero">🌽</div>
          <h2 class="game-h">Runde ${d.r}</h2>
          <p class="game-p">${target != null
            ? `<b>${esc(partner)}</b> hat <b>${target}</b> Punkte gemacht. Gleicher Körnerregen, gleiche Chance.`
            : `30 Sekunden. Tippe alles Essbare, meide die Bomben. Danach ist ${esc(partner)} dran — mit exakt demselben Regen.`}</p>
          <div class="game-legend">
            ${KINDS.map((k) => `<span class="legend"><span>${k.e}</span> ${k.pts > 0 ? '+' : ''}${k.pts}</span>`).join('')}
          </div>
          <button class="btn btn-primary btn-block" data-go>Los geht's</button>
          ${target == null && state.partner ? `<button class="btn btn-ghost btn-block" data-invite>${esc(partner)} anstupsen</button>` : ''}
        </div>
      </div>`;
    root.querySelector('[data-go]').onclick = () => { fx('pop'); play(); };
    const inv = root.querySelector('[data-invite]');
    if (inv) inv.onclick = () => { inviteToPlay(meta.id); fx('tap'); inv.textContent = 'Angestupst 💌'; inv.disabled = true; };
    bindClose();
  }

  function header(right = '') {
    return `<div class="game-top">
      <button class="game-x" data-close aria-label="Schließen">✕</button>
      <div class="game-title">${meta.emoji} ${meta.title}</div>
      <div class="game-right">${right}</div>
    </div>`;
  }

  function play() {
    running = true;
    const d = duel(get(), meta.id);
    const items = buildRain(seedFor(meta.id, d.r, state));
    let score = 0, combo = 0, bestCombo = 0;
    const start = performance.now();
    const live = !!(state.partner && ctx.partnerOnline);

    root.innerHTML = `
      <div class="game-wrap game-playing">
        ${header(`<span class="game-clock" data-clock>30.0</span>`)}
        <div class="game-hud">
          <div class="hud-score"><span data-score>0</span><small>Punkte</small></div>
          <div class="hud-combo" data-combo></div>
          ${live ? `<div class="hud-live"><span class="dot-live"></span><span data-livescore>0</span><small>${esc(partner)}</small></div>` : ''}
        </div>
        <canvas class="game-canvas" data-canvas></canvas>
        <div class="game-flash" data-flash></div>
      </div>`;

    bindClose();
    const canvas = root.querySelector('[data-canvas]');
    const cctx = canvas.getContext('2d');
    const elScore = root.querySelector('[data-score]');
    const elCombo = root.querySelector('[data-combo]');
    const elClock = root.querySelector('[data-clock]');
    const elFlash = root.querySelector('[data-flash]');
    const elLive = root.querySelector('[data-livescore]');

    let W = 0, H = 0, dpr = Math.min(2.5, window.devicePixelRatio || 1);
    function resize() {
      const r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      cctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    const onResize = () => resize();
    window.addEventListener('resize', onResize);
    cleanupFns.push(() => window.removeEventListener('resize', onResize));

    function tap(clientX, clientY) {
      const r = canvas.getBoundingClientRect();
      const px = clientX - r.left, py = clientY - r.top;
      const el = performance.now() - start;
      let caught = null;

      for (const it of items) {
        if (it.hit || el < it.t) continue;
        const y = (el - it.t) * it.speed;
        if (y > H + 40) continue;
        const cx = it.x * W, cy = y;
        if (Math.hypot(px - cx, py - cy) < it.kind.r + 12) { caught = it; break; }
      }

      if (!caught) { combo = 0; renderCombo(); return; }
      caught.hit = true;

      if (caught.kind.pts < 0) {
        score = Math.max(0, score + caught.kind.pts);
        combo = 0;
        fx('fail');
        elFlash.classList.remove('boom'); void elFlash.offsetWidth; elFlash.classList.add('boom');
      } else {
        combo++;
        bestCombo = Math.max(bestCombo, combo);
        const bonus = combo >= 12 ? 3 : combo >= 7 ? 2 : combo >= 4 ? 1 : 0;
        score += caught.kind.pts + bonus;
        fx(caught.kind.pts >= 5 ? 'coin' : 'tap');
        burst([caught.kind.e], { x: clientX, y: clientY, count: 3, rise: 70, spread: 50, duration: 620 });
      }
      elScore.textContent = score;
      renderCombo();
    }

    function renderCombo() {
      if (combo >= 4) {
        elCombo.textContent = `×${combo} Serie!`;
        elCombo.classList.add('on');
      } else {
        elCombo.textContent = '';
        elCombo.classList.remove('on');
      }
    }

    const onPointer = (e) => { e.preventDefault(); tap(e.clientX, e.clientY); };
    canvas.addEventListener('pointerdown', onPointer);
    cleanupFns.push(() => canvas.removeEventListener('pointerdown', onPointer));

    if (live) {
      tickTimer = setInterval(() => sendLiveTick(meta.id, score), 2000);
      cleanupFns.push(() => clearInterval(tickTimer));
    }

    function frame(now) {
      if (!running) return;
      const el = now - start;
      const left = Math.max(0, DURATION - el);
      elClock.textContent = (left / 1000).toFixed(1);
      if (left < 5500) elClock.classList.add('urgent');

      cctx.clearRect(0, 0, W, H);
      cctx.textAlign = 'center';
      cctx.textBaseline = 'middle';

      for (const it of items) {
        if (it.hit || el < it.t) continue;
        const y = (el - it.t) * it.speed;
        if (y > H + 50) continue;
        const x = it.x * W;
        cctx.save();
        cctx.translate(x, y);
        cctx.rotate(((el - it.t) / 900) * it.spin);
        cctx.font = `${it.kind.r * 1.7}px system-ui`;
        cctx.fillText(it.kind.e, 0, 0);
        cctx.restore();
      }

      if (live && elLive) {
        const ls = duel(get(), meta.id).liveScore;
        if (ls) elLive.textContent = ls.score;
      }

      if (left <= 0) { finish(score, bestCombo); return; }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
  }

  function finish(score, bestCombo) {
    running = false;
    cancelAnimationFrame(raf);
    clearInterval(tickTimer);
    const { settled } = submitScore(meta.id, score, { combo: bestCombo });
    fx(settled?.result === 'me' ? 'yay' : 'pop');
    root.innerHTML = `
      <div class="game-wrap">
        ${header()}
        <div class="game-center">
          <div class="game-hero">${settled ? (settled.result === 'me' ? '🏆' : settled.result === 'draw' ? '🤝' : '🐣') : '🌽'}</div>
          <h2 class="game-h">${score} Punkte</h2>
          <p class="game-p">${resultLine(settled, bestCombo, partner)}</p>
          <button class="btn btn-primary btn-block" data-again>Nochmal</button>
          <button class="btn btn-ghost btn-block" data-close>Fertig</button>
        </div>
      </div>`;
    root.querySelector('[data-again]').onclick = () => screenIntro();
    bindClose();
  }

  function resultLine(settled, combo, partnerName) {
    const comboLine = combo >= 4 ? ` Beste Serie: ×${combo}.` : '';
    if (!settled) return `Ergebnis abgeschickt.${comboLine} Sobald ${esc(partnerName)} dieselbe Runde gespielt hat, wird abgerechnet.`;
    if (settled.result === 'me') return `Du gewinnst ${settled.mine}:${settled.theirs}.${comboLine} +${settled.reward} Körner.`;
    if (settled.result === 'draw') return `Unentschieden, ${settled.mine}:${settled.theirs}.${comboLine} +${settled.reward} Körner.`;
    return `${esc(partnerName)} gewinnt ${settled.theirs}:${settled.mine}.${comboLine} +${settled.reward} Körner für den Mut.`;
  }

  function bindClose() {
    root.querySelectorAll('[data-close]').forEach((b) => { b.onclick = () => ctx.close(); });
  }

  screenIntro();

  return () => {
    running = false;
    cancelAnimationFrame(raf);
    clearInterval(tickTimer);
    cleanupFns.forEach((f) => f());
  };
}
