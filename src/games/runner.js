/**
 * Federlauf — einmal quer durch die Strecke, auf Zeit.
 *
 * Das Huhn rennt von allein nach rechts, du bestimmst nur, wann es springt.
 * Damit wird aus einem Hüpfspiel eine Zeitfahrt: Die Strecke ist für beide
 * identisch (sie kommt aus dem Runden-Seed), es gibt keine Zufallsgegner,
 * und der einzige Unterschied zwischen zwei Läufen bist du. Genau das macht
 * es zum Nachlaufen geeignet — man kennt die Strecke beim zweiten Mal und
 * will die eigene Zeit unterbieten.
 *
 * Gewertet wird trotzdem in Punkten, nicht in Sekunden: Das Duell im Rest
 * der App rechnet „mehr ist besser“, und ein Zeitwert müsste da überall
 * umgedreht werden. Also gibt es einen Zeitbonus wie bei den alten
 * Klassikern — je schneller im Ziel, desto mehr. Körner unterwegs zählen
 * extra, und wer stürzt, verliert Zeit statt Leben.
 */

import { rng } from '../util/rng.js';
import { esc } from '../util/dom.js';
import { fx, burst, confetti } from '../util/feedback.js';
import { get } from '../state/store.js';
import { icon } from '../ui/icons.js';
import { duel, seedFor, submitScore, inviteToPlay } from './index.js';

export const meta = {
  id: 'runner',
  icon: 'gameRun',
  title: 'Federlauf',
  tagline: 'Einmal durch die Strecke, auf Zeit',
  modes: ['async'],
  tone: 'warm',
  howto: 'Tippen springt, länger halten springt höher. Beide laufen dieselbe Strecke — es zählt die Zeit.'
};

/* ── Maße der Spielwelt (in Weltpixeln, nicht Bildschirmpixeln) ── */
const BODEN = 0;          // Bodenhöhe = 0, nach oben positiv
const HELD_B = 34;        // Breite des Huhns
const HELD_H = 34;
const TEMPO = 260;        // Laufgeschwindigkeit in px/s
const SCHWERKRAFT = 1750;
const SPRUNG = 620;       // Anfangsgeschwindigkeit nach oben
const HALTE_SCHUB = 1250; // Zusatzschub, solange gehalten wird
const HALTE_MAX = 0.22;   // so lange wirkt der Schub höchstens
const STURZ_STRAFE = 1.6; // Sekunden, die ein Sturz kostet

/** Zielzeit, gegen die der Bonus rechnet. */
export const parZeit = (laenge) => laenge / TEMPO + 6;

/**
 * Die Strecke.
 *
 * Aufgebaut aus Abschnitten, damit sie sich fair anfühlt: Nach jeder Lücke
 * kommt ein Stück Boden zum Landen, und schwierige Stücke stehen nie direkt
 * hintereinander. Rein zufällig gestreute Hindernisse ergeben sonst
 * regelmäßig Stellen, die gar nicht schaffbar sind.
 *
 * @returns {{platten:Array, hindernisse:Array, koerner:Array, punkte:Array, laenge:number}}
 */
export function strecke(seed) {
  const r = rng(seed);
  const platten = [];      // { x, w, y }  y = Oberkante
  const hindernisse = [];  // { x, w, h, y, art }
  const koerner = [];      // { x, y }
  const punkte = [];       // Rettungspunkte (x)

  let x = 0;
  /**
   * Breite Platten auf Bodenhöhe sind die einzigen Stellen, an denen man
   * gefahrlos wieder eingesetzt werden kann. Sie werden gleich beim Bauen
   * gemerkt — sonst landet ein Rettungspunkt irgendwann in einer Lücke und
   * der Sturz wiederholt sich endlos.
   */
  const sicher = [];
  const grund = (w, y = BODEN) => {
    platten.push({ x, w, y });
    if (y === BODEN && w >= 200) sicher.push({ x: x + 70, y });
    x += w;
  };

  grund(360);              // Anlauf, ohne alles

  const bausteine = [
    /* Lücke — springen oder fallen */
    () => {
      const luecke = 90 + Math.floor(r() * 60);
      x += luecke;
      grund(220 + Math.floor(r() * 120));
    },
    /* Stufe hoch, dann wieder runter */
    () => {
      const h = 60 + Math.floor(r() * 40);
      x += 70 + Math.floor(r() * 40);
      grund(200 + Math.floor(r() * 100), h);
      koerner.push({ x: x - 120, y: h + 60 });
      x += 80 + Math.floor(r() * 40);
      grund(240);
    },
    /* Busch auf dem Boden — drüberspringen */
    () => {
      const start = x;
      grund(340);
      hindernisse.push({ x: start + 150, w: 30, h: 44, y: BODEN, art: 'busch' });
    },
    /* Zwei Büsche kurz hintereinander */
    () => {
      const start = x;
      grund(430);
      hindernisse.push({ x: start + 120, w: 26, h: 40, y: BODEN, art: 'busch' });
      hindernisse.push({ x: start + 290, w: 26, h: 40, y: BODEN, art: 'busch' });
      koerner.push({ x: start + 205, y: 96 });
    },
    /* Schwebende Insel mit Körnern darauf */
    () => {
      x += 100;
      const h = 96 + Math.floor(r() * 40);
      const w = 150 + Math.floor(r() * 80);
      platten.push({ x, w, y: h });
      for (let i = 0; i < 3; i++) koerner.push({ x: x + 30 + i * 42, y: h + 44 });
      x += w + 100;
      grund(260);
    },
    /* Treppe */
    () => {
      for (let i = 1; i <= 3; i++) { x += 26; grund(96, i * 44); }
      x += 40;
      koerner.push({ x: x - 20, y: 3 * 44 + 60 });
      grund(280);
    },
    /* Lange Lücke mit Trittstein in der Mitte */
    () => {
      x += 110;
      platten.push({ x, w: 76, y: 54 });
      koerner.push({ x: x + 38, y: 110 });
      x += 76 + 110;
      grund(280);
    }
  ];

  // Acht Abschnitte ergeben rund 4500 px — knapp zwanzig Sekunden Laufzeit.
  // Länger wird eine Zeitfahrt zäh: Man will sie noch einmal laufen, und das
  // tut niemand, wenn ein Versuch eine Minute kostet.
  let letzter = -1;
  for (let i = 0; i < 8; i++) {
    let k = Math.floor(r() * bausteine.length);
    if (k === letzter) k = (k + 1) % bausteine.length;   // nie zweimal dasselbe
    letzter = k;
    bausteine[k]();
  }

  grund(340);              // Zielgerade
  const laenge = x - 120;

  // Alle rund 900 px einer der gemerkten sicheren Plätze
  let zuletzt = -Infinity;
  for (const s of sicher) {
    if (s.x - zuletzt < 900) continue;
    punkte.push(s);
    zuletzt = s.x;
  }
  if (!punkte.length) punkte.push({ x: 60, y: BODEN });

  return { platten, hindernisse, koerner, punkte, laenge };
}

/** Punkte aus Zeit, Körnern und Ziel. */
export function bewerten(sekunden, koerner, imZiel, laenge) {
  if (!imZiel) return Math.max(0, koerner * 10);
  const par = parZeit(laenge);
  const bonus = Math.max(0, Math.round((par - sekunden) * 40));
  return 300 + bonus + koerner * 15;
}

export const zeitText = (s) => `${s.toFixed(1).replace('.', ',')} s`;

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
    const beste = d.mine?.detail?.zeit ?? d.history?.find((h) => h.mine)?.zeit ?? null;
    root.innerHTML = `
      <div class="game-wrap">
        ${header()}
        <div class="game-center">
          <div class="game-hero">${icon('gameRun', { size: 68 })}</div>
          <h2 class="game-h">Strecke ${d.r}</h2>
          <p class="game-p">${target != null
            ? `<b>${esc(partner)}</b> war schon durch: <b>${target}</b> Punkte${d.theirs?.detail?.zeit ? ` in ${zeitText(d.theirs.detail.zeit)}` : ''}. Gleiche Strecke für dich.`
            : 'Das Huhn rennt von allein. Tippen springt, halten springt höher. Je schneller im Ziel, desto mehr Punkte — Körner unterwegs zählen extra.'}</p>
          ${beste ? `<p class="game-kicker">Deine letzte Zeit: ${zeitText(beste)}</p>` : ''}
          <button class="btn btn-primary btn-block" data-go>Loslaufen</button>
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
    const S = strecke(seedFor(meta.id, d.r, st));

    root.innerHTML = `
      <div class="game-wrap game-playing">
        ${header()}
        <div class="game-hud">
          <div class="hud-score"><span data-clock>0,0</span><small>Sekunden</small></div>
          <div class="hud-combo" data-combo></div>
          <div class="hud-live">${icon('grain', { size: 15 })}<span data-corn>0</span></div>
        </div>
        <div class="run-field" data-field>
          <canvas class="run-canvas" data-canvas></canvas>
          <div class="run-progress"><span data-bar></span></div>
        </div>
        <p class="catch-hint" data-hint>Tippen springt · halten springt höher</p>
      </div>`;
    bindClose();

    const field = root.querySelector('[data-field]');
    const cv = root.querySelector('[data-canvas]');
    const g = cv.getContext('2d');
    const elClock = root.querySelector('[data-clock]');
    const elCorn = root.querySelector('[data-corn]');
    const elCombo = root.querySelector('[data-combo]');
    const elBar = root.querySelector('[data-bar]');
    const elHint = root.querySelector('[data-hint]');

    let W = 0, H = 0, dpr = 1, skala = 1;
    function messen() {
      const b = field.getBoundingClientRect();
      dpr = Math.min(3, window.devicePixelRatio || 1);
      W = b.width; H = b.height;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      cv.style.width = `${W}px`; cv.style.height = `${H}px`;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Die Welt ist 300 Einheiten hoch gedacht; alles Weitere skaliert mit
      skala = Math.min(1.25, Math.max(0.7, H / 300));
    }
    window.addEventListener('resize', messen);
    cleanups.push(() => window.removeEventListener('resize', messen));
    messen();

    const held = { x: 40, y: BODEN, vy: 0, amBoden: true };
    let zeit = 0, geholt = 0, stuerze = 0, fertig = false, gestartet = 0;
    let haltenSeit = -1, coyote = 0, puffer = -1;
    let rettung = S.punkte[0];                 // letzter erreichter Rettungspunkt
    const genommen = new Set();

    /** Oberkante der Platte unter einem Punkt, oder null über der Lücke. */
    function bodenUnter(px, py) {
      let best = null;
      for (const p of S.platten) {
        if (px + HELD_B * 0.35 < p.x || px - HELD_B * 0.35 > p.x + p.w) continue;
        if (p.y <= py + 2 && (best === null || p.y > best)) best = p.y;
      }
      return best;
    }

    function springen() {
      if (fertig) return;
      if (held.amBoden || coyote > 0) {
        held.vy = SPRUNG;
        held.amBoden = false;
        coyote = 0;
        haltenSeit = 0;
        fx('pop');
        elHint.classList.add('gone');
      } else {
        // Zu früh gedrückt? Der Sprung wird kurz gemerkt und beim Landen
        // sofort ausgelöst — sonst „schluckt“ das Spiel Eingaben.
        puffer = 0.12;
      }
    }

    const onDown = (e) => { e.preventDefault(); springen(); };
    const onUp = () => { haltenSeit = -1; };
    field.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    const onKey = (e) => { if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'Enter') { e.preventDefault(); springen(); } };
    const onKeyUp = (e) => { if (e.key === ' ' || e.key === 'ArrowUp') haltenSeit = -1; };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKeyUp);
    cleanups.push(() => {
      field.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKeyUp);
    });

    function sturz() {
      stuerze++;
      zeit += STURZ_STRAFE;
      fx('fail');
      held.x = rettung.x;
      held.y = rettung.y + 90;
      held.vy = 0;
      held.amBoden = false;
      elCombo.textContent = `Sturz +${STURZ_STRAFE.toString().replace('.', ',')} s`;
      elCombo.classList.add('on');
      setTimeout(() => elCombo.classList.remove('on'), 1200);
      const b = field.getBoundingClientRect();
      burst(['feather'], { x: b.left + b.width * 0.3, y: b.top + b.height * 0.6, count: 5 });
    }

    function schritt(dt) {
      zeit += dt;

      // Waagerecht: konstantes Tempo, kein Bremsen — das ist der Kern
      held.x += TEMPO * dt;

      // Senkrecht
      if (haltenSeit >= 0 && haltenSeit < HALTE_MAX && held.vy > 0) {
        held.vy += HALTE_SCHUB * dt;
        haltenSeit += dt;
      }
      held.vy -= SCHWERKRAFT * dt;
      const vorher = held.y;
      held.y += held.vy * dt;

      // Landen: nur beim Fallen, und nur wenn wir die Kante von oben kreuzen
      if (held.vy <= 0) {
        const b = bodenUnter(held.x, vorher);
        if (b !== null && held.y <= b) {
          held.y = b;
          held.vy = 0;
          if (!held.amBoden && puffer > 0) { held.amBoden = true; puffer = -1; springen(); }
          else held.amBoden = true;
          coyote = 0.1;
        } else {
          held.amBoden = false;
        }
      } else {
        held.amBoden = false;
      }
      if (!held.amBoden && coyote > 0) coyote -= dt;
      if (puffer > 0) puffer -= dt;

      // Ins Leere gefallen
      if (held.y < -120) { sturz(); return; }

      // Hindernisse: von oben drauf ist erlaubt, seitlich hinein nicht
      for (const h of S.hindernisse) {
        const treffer = held.x + HELD_B * 0.3 > h.x && held.x - HELD_B * 0.3 < h.x + h.w
          && held.y < h.y + h.h - 4 && held.y + HELD_H > h.y;
        if (treffer) { sturz(); return; }
      }

      // Körner
      for (let i = 0; i < S.koerner.length; i++) {
        if (genommen.has(i)) continue;
        const k = S.koerner[i];
        if (Math.abs(k.x - held.x) < 30 && Math.abs(k.y - (held.y + HELD_H / 2)) < 40) {
          genommen.add(i);
          geholt++;
          elCorn.textContent = geholt;
          fx('coin');
        }
      }

      // Rettungspunkte
      for (const p of S.punkte) if (held.x > p.x && p.x > rettung.x) rettung = p;

      if (held.x >= S.laenge) { ziel(); return; }
      elClock.textContent = zeit.toFixed(1).replace('.', ',');
      elBar.style.width = `${Math.min(100, (held.x / S.laenge) * 100)}%`;
    }

    /* ── Zeichnen ── */

    const bodenY = () => H - 42;
    const w2s = (wx, kamera) => (wx - kamera) * skala;
    const h2s = (wy) => bodenY() - wy * skala;

    function zeichnen() {
      const kamera = Math.max(0, held.x - W / (3 * skala));
      g.clearRect(0, 0, W, H);

      // Himmel und Hügel — zwei Ebenen, damit Tempo sichtbar wird
      const himmel = g.createLinearGradient(0, 0, 0, H);
      himmel.addColorStop(0, '#CFE9FA');
      himmel.addColorStop(0.62, '#F3EDE0');
      himmel.addColorStop(1, '#E8DFCB');
      g.fillStyle = himmel;
      g.fillRect(0, 0, W, H);

      // Wolken, damit der obere Bildrand nicht leer ist und man das Tempo sieht
      g.fillStyle = 'rgba(255,255,255,.72)';
      for (let i = 0; i < 5; i++) {
        const cx = (((i * 430 + 120) - kamera * 0.14) % (W + 520)) - 60;
        const cy = 40 + ((i * 67) % Math.max(60, H * 0.34));
        const cr = 20 + (i % 3) * 7;
        g.beginPath();
        g.ellipse(cx, cy, cr * 1.7, cr * 0.62, 0, 0, Math.PI * 2);
        g.ellipse(cx - cr * 0.6, cy - cr * 0.2, cr * 0.8, cr * 0.6, 0, 0, Math.PI * 2);
        g.ellipse(cx + cr * 0.7, cy - cr * 0.1, cr * 0.66, cr * 0.5, 0, 0, Math.PI * 2);
        g.fill();
      }

      g.fillStyle = '#BFE0C4';
      for (let i = -1; i < 6; i++) {
        const hx = ((i * 320 - kamera * 0.25) % (W + 640)) + (kamera * 0.25 % 1);
        g.beginPath();
        g.ellipse(hx, bodenY() + 10, 190, 96, 0, Math.PI, 0);
        g.fill();
      }
      g.fillStyle = '#A9D6A2';
      for (let i = -1; i < 8; i++) {
        const hx = ((i * 240 - kamera * 0.5) % (W + 480));
        g.beginPath();
        g.ellipse(hx, bodenY() + 22, 140, 70, 0, Math.PI, 0);
        g.fill();
      }

      // Platten
      for (const p of S.platten) {
        const sx = w2s(p.x, kamera), sw = p.w * skala;
        if (sx > W || sx + sw < 0) continue;
        const sy = h2s(p.y);
        g.fillStyle = '#8FBF7A';
        g.beginPath();
        g.roundRect(sx, sy, sw, Math.max(10, H - sy), 8);
        g.fill();
        g.fillStyle = '#6FA65C';
        g.fillRect(sx, sy, sw, 6 * skala);
      }

      // Hindernisse
      for (const h of S.hindernisse) {
        const sx = w2s(h.x, kamera);
        if (sx > W || sx + h.w * skala < 0) continue;
        g.fillStyle = '#5E8F63';
        g.beginPath();
        g.ellipse(sx + (h.w * skala) / 2, h2s(h.y) - (h.h * skala) / 2, (h.w * skala) / 2 + 4, (h.h * skala) / 2, 0, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = '#E05A72';
        g.beginPath();
        g.arc(sx + h.w * skala * 0.3, h2s(h.y) - h.h * skala * 0.7, 3.2, 0, Math.PI * 2);
        g.arc(sx + h.w * skala * 0.75, h2s(h.y) - h.h * skala * 0.45, 3.2, 0, Math.PI * 2);
        g.fill();
      }

      // Körner
      for (let i = 0; i < S.koerner.length; i++) {
        if (genommen.has(i)) continue;
        const k = S.koerner[i];
        const sx = w2s(k.x, kamera);
        if (sx > W + 20 || sx < -20) continue;
        const wippe = Math.sin(zeit * 4 + i) * 3;
        g.fillStyle = '#FFC94D';
        g.beginPath();
        g.ellipse(sx, h2s(k.y) + wippe, 7, 9, 0, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = '#EDA820';
        g.beginPath();
        g.ellipse(sx, h2s(k.y) + wippe + 2, 3, 4, 0, 0, Math.PI * 2);
        g.fill();
      }

      // Ziel
      const zx = w2s(S.laenge, kamera);
      if (zx < W + 60) {
        g.strokeStyle = '#8C6B4A';
        g.lineWidth = 4;
        g.beginPath(); g.moveTo(zx, h2s(0)); g.lineTo(zx, h2s(0) - 120 * skala); g.stroke();
        g.fillStyle = '#FF7E8E';
        g.beginPath();
        g.moveTo(zx, h2s(0) - 120 * skala);
        g.lineTo(zx + 46, h2s(0) - 104 * skala);
        g.lineTo(zx, h2s(0) - 88 * skala);
        g.closePath(); g.fill();
      }

      // Das Huhn
      const hx = w2s(held.x, kamera), hy = h2s(held.y);
      const neigung = Math.max(-0.3, Math.min(0.3, -held.vy / 2600));
      g.save();
      g.translate(hx, hy - HELD_H * skala * 0.5);
      g.rotate(neigung);
      const s = skala;
      // Beine — im Lauf abwechselnd, im Sprung angezogen
      g.strokeStyle = '#EE9430'; g.lineWidth = 3.4 * s; g.lineCap = 'round';
      const takt = held.amBoden ? Math.sin(zeit * 18) * 9 : 4;
      g.beginPath();
      g.moveTo(-4 * s, 14 * s); g.lineTo((-4 + takt) * s, 22 * s);
      g.moveTo(5 * s, 14 * s); g.lineTo((5 - takt) * s, 22 * s);
      g.stroke();
      g.fillStyle = '#FFC94D';
      g.beginPath(); g.ellipse(0, 0, 17 * s, 15 * s, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#FFF6E4';
      g.beginPath(); g.ellipse(-1 * s, 4 * s, 10 * s, 9 * s, 0, 0, Math.PI * 2); g.fill();
      // Flügel schlägt beim Springen
      g.fillStyle = '#EDA820';
      g.save();
      g.translate(-6 * s, -1 * s);
      g.rotate(held.amBoden ? Math.sin(zeit * 16) * 0.2 : -0.9);
      g.beginPath(); g.ellipse(0, 0, 9 * s, 6 * s, 0, 0, Math.PI * 2); g.fill();
      g.restore();
      g.fillStyle = '#FF7E8E';
      g.beginPath();
      g.ellipse(2 * s, -15 * s, 5 * s, 4 * s, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#3A2C21';
      g.beginPath(); g.arc(7 * s, -4 * s, 2.4 * s, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#FFB44D';
      g.beginPath();
      g.moveTo(15 * s, -2 * s); g.lineTo(24 * s, 1 * s); g.lineTo(15 * s, 4 * s);
      g.closePath(); g.fill();
      g.restore();
    }

    let letzte = 0;
    function frame(now) {
      if (!running) return;
      if (!gestartet) { gestartet = now; letzte = now; }
      let dt = (now - letzte) / 1000;
      letzte = now;
      // Bei einem Bildsprung (Tab im Hintergrund) nicht durch die halbe
      // Strecke teleportieren, sondern in kleinen Schritten nachrechnen
      dt = Math.min(0.1, dt);
      for (let rest = dt; rest > 0 && !fertig; rest -= 0.016) schritt(Math.min(0.016, rest));
      zeichnen();
      raf = requestAnimationFrame(frame);
    }

    function ziel() {
      if (fertig) return;
      fertig = true;
      running = false;
      cancelAnimationFrame(raf);
      fx('yay');
      finish(zeit, geholt, true, stuerze, S.laenge);
    }

    raf = requestAnimationFrame(frame);
  }

  function finish(zeit, koerner, imZiel, stuerze, laenge) {
    running = false;
    cancelAnimationFrame(raf);
    const punkte = bewerten(zeit, koerner, imZiel, laenge);
    const { settled } = submitScore(meta.id, punkte, { zeit: Math.round(zeit * 10) / 10, koerner, stuerze });
    if (settled?.result === 'me') confetti(['trophy', 'sparkle', 'feather']);

    const par = parZeit(laenge);
    const note = zeit <= par - 6 ? 'blitzsauber' : zeit <= par - 2 ? 'flott' : zeit <= par ? 'solide' : 'gemütlich';

    root.innerHTML = `
      <div class="game-wrap">
        ${header()}
        <div class="game-center">
          <div class="game-hero">${icon(settled?.result === 'me' ? 'trophy' : 'gameRun', { size: 68 })}</div>
          <h2 class="game-h">${zeitText(zeit)}</h2>
          <div class="game-stats">
            <div><b>${punkte}</b><small>Punkte</small></div>
            <div><b>${koerner}</b><small>Körner</small></div>
            <div><b>${stuerze}</b><small>Stürze</small></div>
          </div>
          <p class="game-p">${note.charAt(0).toUpperCase() + note.slice(1)}. ${!settled
            ? `Ergebnis unterwegs zu ${esc(partner)} — gleiche Strecke.`
            : settled.result === 'me' ? `Du gewinnst ${settled.mine}:${settled.theirs}. +${settled.reward} Körner.`
            : settled.result === 'draw' ? `Unentschieden bei ${settled.mine}. +${settled.reward} Körner.`
            : `${esc(partner)} war schneller: ${settled.theirs}:${settled.mine}. +${settled.reward} Körner.`}</p>
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
