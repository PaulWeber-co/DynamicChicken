/**
 * Federblock — fallende Steine, volle Reihen lösen sich auf.
 *
 * Das klassische Stapelspiel, mit einem Zusatz, der hier wichtig ist: Die
 * Steinfolge kommt aus dem Runden-Seed. Beide bekommen also exakt dieselben
 * Steine in derselben Reihenfolge — wer besser stapelt, gewinnt, nicht wer
 * das bessere Blatt gezogen hat. Ohne das wäre ein zeitversetztes Duell
 * reine Glückssache.
 *
 * Gezogen wird nicht frei gewürfelt, sondern aus einem Beutel: Alle sieben
 * Steine werden gemischt und abgearbeitet, dann kommt der nächste Beutel.
 * So gibt es keine Serie aus fünf Z-Steinen, und man kann planen.
 */

import { rng } from '../util/rng.js';
import { esc } from '../util/dom.js';
import { fx, burst, confetti } from '../util/feedback.js';
import { get } from '../state/store.js';
import { icon } from '../ui/icons.js';
import { duel, seedFor, submitScore, inviteToPlay } from './index.js';

export const meta = {
  id: 'blocks',
  icon: 'gameBlocks',
  title: 'Federblock',
  tagline: 'Stapeln, bis die Reihe voll ist',
  modes: ['async'],
  tone: 'calm',
  howto: 'Steine drehen und schieben, volle Reihen lösen sich auf. Beide bekommen dieselbe Steinfolge.'
};

const COLS = 10;
const ROWS = 18;

/**
 * Die sieben Steine, jeder in seinen vier Drehungen.
 *
 * Als Koordinatenlisten statt als Matrizen: Das Drehen ist dann ein
 * Nachschlagen statt einer Rechnung, und ein Stein kann nie durch einen
 * Rundungsfehler die Form wechseln.
 */
const SHAPES = {
  I: { farbe: 0, dreh: [[[0, 1], [1, 1], [2, 1], [3, 1]], [[2, 0], [2, 1], [2, 2], [2, 3]], [[0, 2], [1, 2], [2, 2], [3, 2]], [[1, 0], [1, 1], [1, 2], [1, 3]]] },
  O: { farbe: 1, dreh: [[[1, 0], [2, 0], [1, 1], [2, 1]]] },
  T: { farbe: 2, dreh: [[[1, 0], [0, 1], [1, 1], [2, 1]], [[1, 0], [1, 1], [2, 1], [1, 2]], [[0, 1], [1, 1], [2, 1], [1, 2]], [[1, 0], [0, 1], [1, 1], [1, 2]]] },
  S: { farbe: 3, dreh: [[[1, 0], [2, 0], [0, 1], [1, 1]], [[1, 0], [1, 1], [2, 1], [2, 2]], [[1, 1], [2, 1], [0, 2], [1, 2]], [[0, 0], [0, 1], [1, 1], [1, 2]]] },
  Z: { farbe: 4, dreh: [[[0, 0], [1, 0], [1, 1], [2, 1]], [[2, 0], [1, 1], [2, 1], [1, 2]], [[0, 1], [1, 1], [1, 2], [2, 2]], [[1, 0], [0, 1], [1, 1], [0, 2]]] },
  J: { farbe: 5, dreh: [[[0, 0], [0, 1], [1, 1], [2, 1]], [[1, 0], [2, 0], [1, 1], [1, 2]], [[0, 1], [1, 1], [2, 1], [2, 2]], [[1, 0], [1, 1], [0, 2], [1, 2]]] },
  L: { farbe: 6, dreh: [[[2, 0], [0, 1], [1, 1], [2, 1]], [[1, 0], [1, 1], [1, 2], [2, 2]], [[0, 1], [1, 1], [2, 1], [0, 2]], [[0, 0], [1, 0], [1, 1], [1, 2]]] }
};
const NAMEN = Object.keys(SHAPES);

/** Pastell statt Neon — der Rest der App sieht schließlich auch so aus. */
const FARBEN = ['#7FB9E4', '#FFC94D', '#C7BAF7', '#7FC98F', '#FF7E8E', '#FFB44D', '#9AD3E8'];

/** Punkte je gleichzeitig gelöster Reihe, mal Stufe. */
const REIHEN_PUNKTE = [0, 40, 100, 300, 1200];

/**
 * Der Beutel: alle sieben Steine gemischt, dann der nächste Beutel.
 * `nummer` ist fortlaufend — daraus ergibt sich, welcher Beutel und welche
 * Stelle darin, also für beide Geräte dasselbe.
 */
export function steinFolge(seed, anzahl) {
  const out = [];
  for (let beutel = 0; out.length < anzahl; beutel++) {
    const r = rng(`${seed}|beutel|${beutel}`);
    const rest = NAMEN.slice();
    while (rest.length) out.push(rest.splice(Math.floor(r() * rest.length), 1)[0]);
  }
  return out.slice(0, anzahl);
}

/** Fallgeschwindigkeit in Millisekunden je Zeile. */
export const fallTempo = (stufe) => Math.max(90, 800 - (stufe - 1) * 70);

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
    root.innerHTML = `
      <div class="game-wrap">
        ${header()}
        <div class="game-center">
          <div class="game-hero">${icon('gameBlocks', { size: 68 })}</div>
          <h2 class="game-h">Runde ${d.r}</h2>
          <p class="game-p">${target != null
            ? `<b>${esc(partner)}</b> hat <b>${target}</b> Punkte gestapelt. Ihr bekommt dieselbe Steinfolge.`
            : 'Volle Reihen lösen sich auf. Vier auf einmal bringen das Zwanzigfache — wer sich traut zu warten, liegt vorn. Ihr bekommt beide dieselben Steine.'}</p>
          <button class="btn btn-primary btn-block" data-go>Loslegen</button>
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
    const folge = steinFolge(seedFor(meta.id, d.r, st), 400);

    root.innerHTML = `
      <div class="game-wrap game-playing">
        ${header()}
        <div class="game-hud">
          <div class="hud-score"><span data-score>0</span><small>Punkte</small></div>
          <div class="hud-combo" data-combo></div>
          <div class="hud-live"><span data-lines>0</span><small>Reihen</small></div>
          <div class="blk-next">
            <span class="blk-next-label">Nächster</span>
            <canvas class="blk-next-canvas" data-next></canvas>
          </div>
        </div>
        <div class="blk-field" data-field>
          <canvas class="blk-canvas" data-canvas></canvas>
        </div>
        <div class="blk-pad">
          <button class="blk-key" data-key="left" aria-label="Nach links">${icon('chevron', { size: 22 })}</button>
          <button class="blk-key" data-key="rot" aria-label="Drehen">${icon('shuffle', { size: 20 })}</button>
          <button class="blk-key" data-key="right" aria-label="Nach rechts">${icon('chevron', { size: 22 })}</button>
          <button class="blk-key wide" data-key="drop" aria-label="Fallen lassen">${icon('download', { size: 20 })}</button>
        </div>
      </div>`;
    bindClose();

    const cv = root.querySelector('[data-canvas]');
    const nx = root.querySelector('[data-next]');
    const g = cv.getContext('2d');
    const gn = nx.getContext('2d');
    const elScore = root.querySelector('[data-score]');
    const elLines = root.querySelector('[data-lines]');
    const elCombo = root.querySelector('[data-combo]');

    const feld = root.querySelector('[data-field]');
    let zelle = 20, dpr = 1;
    function messen() {
      // Gemessen wird der *Rahmen*, nicht die Leinwand: Die hat vor dem
      // ersten Messen noch gar keine Größe und würde 300×150 melden.
      const b = feld.getBoundingClientRect();
      dpr = Math.min(3, window.devicePixelRatio || 1);
      zelle = Math.max(12, Math.floor(Math.min((b.width - 24) / COLS, (b.height - 8) / ROWS)));
      cv.width = Math.round(zelle * COLS * dpr);
      cv.height = Math.round(zelle * ROWS * dpr);
      cv.style.width = `${zelle * COLS}px`;
      cv.style.height = `${zelle * ROWS}px`;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const nb = Math.round(zelle * 0.62);
      nx.width = nb * 4 * dpr; nx.height = nb * 2 * dpr;
      nx.style.width = `${nb * 4}px`; nx.style.height = `${nb * 2}px`;
      gn.setTransform(dpr, 0, 0, dpr, 0, 0);
      zeichnen();
      naechsterZeichnen();
    }
    window.addEventListener('resize', messen);
    cleanups.push(() => window.removeEventListener('resize', messen));

    // -1 = leer, sonst Farbindex
    const brett = Array.from({ length: ROWS }, () => new Array(COLS).fill(-1));
    let index = 0, stein = null, punkte = 0, reihen = 0, stufe = 1, kombo = 0;
    let letzterFall = 0, vorbei = false;

    const zellen = (s) => SHAPES[s.name].dreh[s.d % SHAPES[s.name].dreh.length]
      .map(([x, y]) => [s.x + x, s.y + y]);

    const passt = (s) => zellen(s).every(([x, y]) =>
      x >= 0 && x < COLS && y < ROWS && (y < 0 || brett[y][x] < 0));

    function neuerStein() {
      const name = folge[index++ % folge.length];
      stein = { name, d: 0, x: Math.floor((COLS - 4) / 2), y: -1 };
      if (!passt(stein)) { ende(); return false; }
      naechsterZeichnen();
      return true;
    }

    function ablegen() {
      for (const [x, y] of zellen(stein)) if (y >= 0) brett[y][x] = SHAPES[stein.name].farbe;
      // Volle Reihen einsammeln
      let weg = 0;
      for (let y = ROWS - 1; y >= 0; y--) {
        if (brett[y].every((c) => c >= 0)) {
          brett.splice(y, 1);
          brett.unshift(new Array(COLS).fill(-1));
          weg++;
          y++;
        }
      }
      if (weg) {
        reihen += weg;
        kombo = weg >= 4 ? kombo + 1 : 0;
        punkte += REIHEN_PUNKTE[weg] * stufe + (kombo > 1 ? 400 * (kombo - 1) : 0);
        stufe = 1 + Math.floor(reihen / 10);
        elLines.textContent = reihen;
        fx(weg >= 4 ? 'yay' : 'coin');
        const box = cv.getBoundingClientRect();
        burst(['sparkle'], { x: box.left + box.width / 2, y: box.top + box.height / 2, count: 4 + weg * 2, rise: 90 });
        elCombo.textContent = weg >= 4 ? 'Vierling!' : weg === 3 ? 'Dreier' : weg === 2 ? 'Doppel' : `Stufe ${stufe}`;
        elCombo.classList.add('on');
        setTimeout(() => elCombo.classList.remove('on'), 1100);
      } else {
        kombo = 0;
        fx('tap');
      }
      elScore.textContent = punkte;
      neuerStein();
    }

    function bewegen(dx, dy) {
      if (!stein || vorbei) return false;
      const versuch = { ...stein, x: stein.x + dx, y: stein.y + dy };
      if (!passt(versuch)) return false;
      stein = versuch;
      zeichnen();
      return true;
    }

    /**
     * Drehen mit Wandschubs: Steht der Stein an der Wand, wird die Drehung
     * um bis zu zwei Felder verschoben versucht. Ohne das fühlt sich das
     * Spiel am Rand kaputt an — der Stein weigert sich scheinbar grundlos.
     */
    function drehen() {
      if (!stein || vorbei) return;
      const naechste = (stein.d + 1) % SHAPES[stein.name].dreh.length;
      for (const dx of [0, -1, 1, -2, 2]) {
        const versuch = { ...stein, d: naechste, x: stein.x + dx };
        if (passt(versuch)) { stein = versuch; fx('tap'); zeichnen(); return; }
      }
    }

    function fallenLassen() {
      if (!stein || vorbei) return;
      let n = 0;
      while (bewegen(0, 1)) n++;
      punkte += n * 2;
      elScore.textContent = punkte;
      fx('pop');
      ablegen();
      zeichnen();
    }

    /* ── Zeichnen ── */

    function block(ctx2d, x, y, s, farbe) {
      ctx2d.fillStyle = farbe;
      const r = Math.max(2, s * 0.18);
      ctx2d.beginPath();
      ctx2d.roundRect(x + 1, y + 1, s - 2, s - 2, r);
      ctx2d.fill();
      // Ein heller Streifen oben gibt dem Stein Volumen, ohne Bilddateien
      ctx2d.fillStyle = 'rgba(255,255,255,.28)';
      ctx2d.beginPath();
      ctx2d.roundRect(x + 1 + s * 0.14, y + 1 + s * 0.12, s * 0.72, s * 0.2, r * 0.6);
      ctx2d.fill();
    }

    function zeichnen() {
      const w = zelle * COLS, h = zelle * ROWS;
      g.clearRect(0, 0, w, h);
      // Raster
      g.strokeStyle = 'rgba(140,120,100,.13)';
      g.lineWidth = 1;
      for (let x = 1; x < COLS; x++) { g.beginPath(); g.moveTo(x * zelle + .5, 0); g.lineTo(x * zelle + .5, h); g.stroke(); }
      for (let y = 1; y < ROWS; y++) { g.beginPath(); g.moveTo(0, y * zelle + .5); g.lineTo(w, y * zelle + .5); g.stroke(); }

      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          if (brett[y][x] >= 0) block(g, x * zelle, y * zelle, zelle, FARBEN[brett[y][x]]);
        }
      }
      if (!stein) return;

      // Schatten dorthin, wo der Stein landen würde — ohne den rät man nur
      let geist = { ...stein };
      while (passt({ ...geist, y: geist.y + 1 })) geist.y++;
      g.fillStyle = 'rgba(120,100,80,.18)';
      for (const [x, y] of zellen(geist)) {
        if (y < 0) continue;
        g.beginPath();
        g.roundRect(x * zelle + 2, y * zelle + 2, zelle - 4, zelle - 4, Math.max(2, zelle * 0.16));
        g.fill();
      }
      for (const [x, y] of zellen(stein)) {
        if (y >= 0) block(g, x * zelle, y * zelle, zelle, FARBEN[SHAPES[stein.name].farbe]);
      }
    }

    function naechsterZeichnen() {
      const name = folge[index % folge.length];
      const s = Math.round(zelle * 0.62);
      gn.clearRect(0, 0, s * 4, s * 2);
      for (const [x, y] of SHAPES[name].dreh[0]) block(gn, x * s, y * s, s, FARBEN[SHAPES[name].farbe]);
    }

    /* ── Steuerung ── */

    const tasten = { left: () => bewegen(-1, 0), right: () => bewegen(1, 0), rot: drehen, drop: fallenLassen };
    root.querySelectorAll('[data-key]').forEach((b) => {
      let halten = 0, wieder = 0;
      const los = (e) => {
        e.preventDefault();
        const f = tasten[b.dataset.key];
        f();
        // Links und rechts wiederholen beim Halten — sonst tippt man sich wund
        if (b.dataset.key === 'left' || b.dataset.key === 'right') {
          halten = setTimeout(() => { wieder = setInterval(f, 70); }, 260);
        }
      };
      const stop = () => { clearTimeout(halten); clearInterval(wieder); };
      b.addEventListener('pointerdown', los);
      b.addEventListener('pointerup', stop);
      b.addEventListener('pointercancel', stop);
      b.addEventListener('pointerleave', stop);
      cleanups.push(stop);
    });

    let weich = false;
    const onKey = (e) => {
      if (vorbei) return;
      const k = e.key;
      if (k === 'ArrowLeft') { e.preventDefault(); bewegen(-1, 0); }
      else if (k === 'ArrowRight') { e.preventDefault(); bewegen(1, 0); }
      else if (k === 'ArrowUp' || k === 'x') { e.preventDefault(); drehen(); }
      else if (k === 'ArrowDown') { e.preventDefault(); weich = true; }
      else if (k === ' ') { e.preventDefault(); fallenLassen(); }
    };
    const onKeyUp = (e) => { if (e.key === 'ArrowDown') weich = false; };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKeyUp);
    cleanups.push(() => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKeyUp);
    });

    function frame(now) {
      if (!running) return;
      const tempo = weich ? 55 : fallTempo(stufe);
      if (now - letzterFall >= tempo) {
        letzterFall = now;
        if (!bewegen(0, 1) && stein) { ablegen(); zeichnen(); }
        else if (weich) { punkte += 1; elScore.textContent = punkte; }
      }
      raf = requestAnimationFrame(frame);
    }

    function ende() {
      vorbei = true;
      stein = null;
      running = false;
      cancelAnimationFrame(raf);
      setTimeout(() => finish(punkte, reihen), 420);
    }

    messen();
    neuerStein();
    zeichnen();
    letzterFall = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function finish(punkte, reihen) {
    running = false;
    cancelAnimationFrame(raf);
    const { settled } = submitScore(meta.id, punkte, { reihen });
    fx(settled?.result === 'me' ? 'yay' : 'pop');
    if (reihen >= 12) confetti(['sparkle', 'trophy', 'grain']);

    root.innerHTML = `
      <div class="game-wrap">
        ${header()}
        <div class="game-center">
          <div class="game-hero">${icon(settled?.result === 'me' ? 'trophy' : 'gameBlocks', { size: 68 })}</div>
          <h2 class="game-h">${punkte} Punkte</h2>
          <div class="game-stats">
            <div><b>${reihen}</b><small>Reihen</small></div>
            <div><b>${1 + Math.floor(reihen / 10)}</b><small>Stufe</small></div>
          </div>
          <p class="game-p">${!settled
            ? `Ergebnis unterwegs zu ${esc(partner)}. Ihr hattet dieselben Steine.`
            : settled.result === 'me' ? `Du gewinnst ${settled.mine}:${settled.theirs}. +${settled.reward} Körner.`
            : settled.result === 'draw' ? `Unentschieden bei ${settled.mine}. +${settled.reward} Körner.`
            : `${esc(partner)} stapelt besser: ${settled.theirs}:${settled.mine}. +${settled.reward} Körner.`}</p>
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
