/**
 * Nest-Turm — Zweig auf Zweig, bis es kippt.
 *
 * Ein Zweig schwingt hin und her, ein Tipp lässt ihn fallen. Was übersteht,
 * ist die neue Auflagefläche — daneben abgelegtes Holz bricht ab. Der Turm
 * wird also mit jedem Fehler schmaler, und irgendwann ist Schluss.
 *
 * Punkte gibt es fürs Stapeln, Extrapunkte für perfekte Treffer. Beide
 * bekommen dieselbe Schwing-Geschwindigkeit aus dem Runden-Seed.
 */

import { rng } from '../util/rng.js';
import { esc } from '../util/dom.js';
import { fx, burst, confetti } from '../util/feedback.js';
import { get } from '../state/store.js';
import { icon } from '../ui/icons.js';
import { duel, seedFor, submitScore, inviteToPlay } from './index.js';

export const meta = {
  id: 'tower',
  icon: 'gameTower',
  title: 'Nest-Turm',
  tagline: 'Zweig auf Zweig, ruhige Hand',
  modes: ['async'],
  tone: 'warm',
  howto: 'Tippen legt den Zweig ab. Was übersteht, bricht weg.'
};

const BASE_W = 190;     // Breite der Grundfläche
const LAYER_H = 26;     // Höhe einer Lage
const PERFECT = 7;      // Toleranz für einen Volltreffer in px

const TWIGS = ['#C99268', '#B8834F', '#D6A87A', '#A9724A'];
const GOLD = '#F2C14E';

/** Sechs Stufen, dann von vorn. */
export const STUFEN = 6;
export const stufeFuer = (runde) => 1 + ((Math.max(1, Math.floor(runde)) - 1) % STUFEN);

/**
 * Was auf dieser Stufe gebaut wird.
 *
 * Das Grundspiel war auf jeder Stufe dasselbe: schmaler werden und schneller
 * schwingen. Das ist eine Kurve, keine Runde. Jetzt kommen Sachen dazu, die
 * eine Entscheidung verlangen — ein goldener Zweig zählt doppelt, ein
 * Geschenkzweig ist breiter als die Auflage und macht den Turm wieder heil.
 * Beides kündigt sich an, damit man den Tipp anders setzt.
 */
export function plan(stufe) {
  const s = Math.max(1, stufe);
  return {
    stufe: s,
    basis: BASE_W - (s - 1) * 9,
    perfekt: Math.max(4, PERFECT - (s - 1) * 0.6),
    tempo: 1 + (s - 1) * 0.11,
    gold: s >= 2,          // jeder vierte Zweig zählt doppelt
    zittern: s >= 3,       // der Zweig schwingt nicht mehr sauber
    geschenk: s >= 4,      // jeder siebte Zweig ist breiter als die Auflage
    schmal: s >= 5,        // Volltreffer verbreitern weniger
    neu: ['', '', 'Goldene Zweige zählen doppelt', 'Der Zweig zittert',
      'Geschenkzweige reparieren den Turm', 'Volltreffer verbreitern weniger', 'Alles zusammen'][s] || ''
  };
}

/** Was ist der Zweig für Lage `n`? Aus der Nummer, also auf beiden Seiten gleich. */
export function zweigArt(n, p) {
  if (p.geschenk && n > 0 && n % 7 === 0) return 'geschenk';
  if (p.gold && n > 0 && n % 4 === 0) return 'gold';
  return 'normal';
}

export function summary(state) {
  const d = duel(state, meta.id);
  if (d.theirs && !d.mine) return { badge: 'wait', text: `${d.theirs.score} zu schlagen` };
  if (d.mine && !d.theirs) return { badge: 'off', text: `Du: ${d.mine.score}` };
  const n = d.wins.me + d.wins.them + d.wins.draw;
  return n ? { badge: null, text: `${d.wins.me}–${d.wins.them}` } : { badge: null, text: 'Neu' };
}

export function mount(root, ctx) {
  const partner = get().partner?.name || 'Dein Mensch';
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
    const p = plan(stufeFuer(d.r));
    root.innerHTML = `
      <div class="game-wrap">
        ${header()}
        <div class="game-center">
          <div class="game-hero">${icon('gameTower', { size: 68 })}</div>
          <div class="game-kicker">Runde ${d.r} · Stufe ${p.stufe} von ${STUFEN}${p.neu ? ` · neu: ${esc(p.neu)}` : ''}</div>
          <h2 class="game-h">${esc(['', 'Erstes Nest', 'Goldrand', 'Zittrig', 'Geschenkt', 'Knapp', 'Alles auf einmal'][p.stufe] || 'Nest-Turm')}</h2>
          <p class="game-p">${target != null
            ? `<b>${esc(partner)}</b> hat <b>${target}</b> Punkte gestapelt.`
            : 'Ein Tipp legt den Zweig ab. Genau treffen gibt Extrapunkte und macht die Fläche wieder etwas breiter.'}</p>
          <div class="game-legend">
            ${p.gold ? '<span class="legend"><i class="tower-probe gold"></i> zählt doppelt</span>' : ''}
            ${p.geschenk ? '<span class="legend"><i class="tower-probe geschenk"></i> breiter als die Auflage</span>' : ''}
            <span class="legend">Volltreffer ±${Math.round(p.perfekt)} px</span>
          </div>
          <button class="btn btn-primary btn-block" data-go>Bauen</button>
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
    const r = rng(seedFor(meta.id, d.r, st));
    const p = plan(stufeFuer(d.r));
    // Startrichtung und Tempoverlauf kommen aus dem Seed — für beide gleich
    let dir = r() < 0.5 ? -1 : 1;
    const speedJitter = (0.9 + r() * 0.25) * p.tempo;

    root.innerHTML = `
      <div class="game-wrap game-playing">
        ${header()}
        <div class="game-hud">
          <div class="hud-score"><span data-score>0</span><small>Punkte</small></div>
          <div class="hud-combo" data-combo></div>
          <div class="hud-live"><span data-height>0</span><small>Lagen</small></div>
        </div>
        <div class="tower-field" data-field>
          <div class="tower-stack" data-stack></div>
          <div class="tower-twig" data-twig></div>
          <div class="tower-base" data-base></div>
        </div>
        <p class="catch-hint" data-hint>Tippen zum Ablegen</p>
      </div>`;
    bindClose();

    const field = root.querySelector('[data-field]');
    const stack = root.querySelector('[data-stack]');
    const twig = root.querySelector('[data-twig]');
    const base = root.querySelector('[data-base]');
    const elScore = root.querySelector('[data-score]');
    const elHeight = root.querySelector('[data-height]');
    const elCombo = root.querySelector('[data-combo]');
    const elHint = root.querySelector('[data-hint]');

    let W = field.clientWidth, H = field.clientHeight;
    const resize = () => { W = field.clientWidth; H = field.clientHeight; };
    window.addEventListener('resize', resize);
    cleanups.push(() => window.removeEventListener('resize', resize));

    let layers = [];                         // { x, w }
    let curW = p.basis;
    let curX = W / 2;                        // Mitte des schwingenden Zweigs
    let score = 0, perfectRun = 0, placed = 0;
    let dropping = false;
    let last = performance.now();

    base.style.width = `${p.basis}px`;

    function stackTop() { return 44 + layers.length * LAYER_H; }

    function drawStack() {
      // Nur die obersten Lagen zeichnen — der Rest schiebt sich nach unten weg
      const visible = layers.slice(-11);
      stack.innerHTML = visible.map((l, i) => `
        <div class="tower-layer${l.art === 'gold' ? ' gold' : l.art === 'geschenk' ? ' geschenk' : ''}" style="
          width:${l.w}px;
          left:${l.x - l.w / 2}px;
          bottom:${44 + i * LAYER_H}px;
          background:${l.art === 'gold' ? GOLD : TWIGS[(layers.length - visible.length + i) % TWIGS.length]}"></div>`).join('');
      base.style.width = `${(visible.length ? p.basis : curW)}px`;
      elHeight.textContent = layers.length;
    }

    function place() {
      if (dropping || !running) return;
      dropping = true;
      elHint.classList.add('gone');

      const art = zweigArt(layers.length, p);
      const prev = layers.length ? layers[layers.length - 1] : { x: W / 2, w: p.basis };
      const offset = curX - prev.x;
      const overlap = prev.w - Math.abs(offset);

      if (overlap <= 8) {
        fx('fail');
        twig.classList.add('falling');
        setTimeout(() => finish(score, layers.length, p), 620);
        return;
      }

      const perfect = Math.abs(offset) <= p.perfekt;
      // Ein Geschenkzweig überragt die Auflage — er repariert den Turm um
      // genau so viel, wie ein Volltreffer sonst über Runden aufbaut.
      const breiter = art === 'geschenk' ? 34 : (p.schmal ? 4 : 6);
      const newW = perfect ? Math.min(p.basis, prev.w + breiter)
        : art === 'geschenk' ? Math.min(p.basis, overlap + 22) : overlap;
      const newX = perfect ? prev.x : prev.x + offset / 2;

      layers.push({ x: newX, w: newW, art });
      placed++;
      curW = newW;

      let punkte;
      if (perfect) {
        perfectRun++;
        punkte = 3 + Math.min(7, perfectRun);
        fx('coin');
        burst(['sparkle'], { x: field.getBoundingClientRect().left + newX, y: field.getBoundingClientRect().top + H - stackTop(), count: 5, rise: 70 });
        elCombo.textContent = `perfekt ×${perfectRun}`;
        elCombo.classList.add('on');
      } else {
        perfectRun = 0;
        punkte = 1;
        fx('pop');
        elCombo.classList.remove('on');
      }
      if (art === 'gold') {
        punkte *= 2;
        elCombo.textContent = perfect ? `golden perfekt ×${perfectRun}` : 'golden — doppelt';
        elCombo.classList.add('on');
      }
      score += punkte;

      // Meilenstein alle fünf Lagen: ein Ruf und ein kleiner Zuschlag
      if (layers.length % 5 === 0) {
        score += layers.length;
        elCombo.textContent = `${layers.length} Lagen! +${layers.length}`;
        elCombo.classList.add('on');
        fx('yay');
      }

      elScore.textContent = score;
      drawStack();
      // Der Zweig schwingt von dort weiter, wo er abgelegt wurde — er darf
      // nicht an den Rand springen, sonst ist die nächste Lage unmöglich.
      dropping = false;
    }

    const onDown = (e) => { e.preventDefault(); place(); };
    const onKey = (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); place(); } };
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

      const speed = (150 + Math.min(260, placed * 11)) * speedJitter;
      curX += dir * speed * dt;
      if (curX > W - 26) { curX = W - 26; dir = -1; }
      if (curX < 26) { curX = 26; dir = 1; }

      // Zittern ab Stufe 3: ein Ausschlag von wenigen Pixeln, schnell genug,
      // dass man ihn nicht aussitzen kann, klein genug, dass er nicht ärgert.
      const zit = p.zittern ? Math.sin(now / 52) * 5 : 0;
      const art = zweigArt(layers.length, p);
      const breite = art === 'geschenk' ? curW + 34 : curW;

      twig.className = `tower-twig${art === 'gold' ? ' gold' : art === 'geschenk' ? ' geschenk' : ''}`;
      twig.style.width = `${breite}px`;
      twig.style.background = art === 'gold' ? GOLD : TWIGS[layers.length % TWIGS.length];
      twig.style.transform = `translate(${curX + zit - breite / 2}px, ${-stackTop() - 8}px)`;

      raf = requestAnimationFrame(frame);
    }

    drawStack();
    raf = requestAnimationFrame(frame);
  }

  function finish(score, height, p = plan(1)) {
    running = false;
    cancelAnimationFrame(raf);
    const { settled } = submitScore(meta.id, score, { height, stufe: p.stufe });
    fx(settled?.result === 'me' ? 'yay' : 'pop');
    if (height >= 12) confetti(['nest', 'feather', 'sparkle']);

    root.innerHTML = `
      <div class="game-wrap">
        ${header()}
        <div class="game-center">
          <div class="game-hero">${icon(settled?.result === 'me' ? 'trophy' : 'gameTower', { size: 68 })}</div>
          <div class="game-kicker">Stufe ${p.stufe} von ${STUFEN}</div>
          <h2 class="game-h">${score} Punkte</h2>
          <div class="game-stats">
            <div><b>${height}</b><small>Lagen</small></div>
            <div><b>${height >= 12 ? 'stabil' : height >= 6 ? 'ganz gut' : 'wacklig'}</b><small>Bauwerk</small></div>
          </div>
          <p class="game-p">${!settled
            ? `Ergebnis unterwegs zu ${esc(partner)}.`
            : settled.result === 'me' ? `Du gewinnst ${settled.mine}:${settled.theirs}. +${settled.reward} Körner.`
            : settled.result === 'draw' ? `Unentschieden bei ${settled.mine}. +${settled.reward} Körner.`
            : `${esc(partner)} baut höher: ${settled.theirs}:${settled.mine}. +${settled.reward} Körner.`}</p>
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
