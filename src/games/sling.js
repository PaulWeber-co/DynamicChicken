/**
 * Federschleuder — ziehen, zielen, loslassen.
 *
 * Rechts steht ein Bau aus Holz, Stein und Glas, darin hocken Füchse. Links
 * steht die Schleuder. Drei Eier, danach wird abgerechnet.
 *
 * Zur Physik: Das ist bewusst keine echte Starrkörper-Simulation. Die wäre
 * mehrere hundert Zeilen groß, auf zwei Geräten nie bitgleich und auf einem
 * älteren Handy zäh. Stattdessen: Das Ei fliegt auf einer Wurfparabel, jeder
 * Treffer nimmt einem Kasten Stabilität, und nach jedem Schuss fällt zusammen,
 * was keine Auflage mehr hat. Das sieht aus wie Physik, ist aber
 * nachvollziehbar und läuft überall gleich — was hier zählt, denn beide
 * bekommen denselben Bau.
 */

import { rng } from '../util/rng.js';
import { esc } from '../util/dom.js';
import { fx, burst, confetti } from '../util/feedback.js';
import { get } from '../state/store.js';
import { icon } from '../ui/icons.js';
import { duel, seedFor, submitScore, inviteToPlay } from './index.js';

export const meta = {
  id: 'sling',
  icon: 'gameSling',
  title: 'Federschleuder',
  tagline: 'Drei Eier, ein Bau, viele Füchse',
  modes: ['async'],
  tone: 'warm',
  howto: 'Ziehen, zielen, loslassen. Drei Eier — jeder Fuchs zählt, jedes übrige Ei auch.'
};

export const SCHUESSE = 3;
const SCHWERKRAFT = 620;
const MAX_ZUG = 120;        // Wie weit man die Schleuder spannen kann
const TEMPO = 6.4;          // Zug in Startgeschwindigkeit umrechnen

/** Baustoffe: wie viel sie aushalten und was sie wert sind. */
export const STOFFE = {
  holz:  { leben: 34, punkte: 10, farbe: '#C99268', kante: '#A9724A' },
  glas:  { leben: 14, punkte: 15, farbe: '#A9D6F5', kante: '#7FB9E4' },
  stein: { leben: 70, punkte: 25, farbe: '#B9AFA2', kante: '#8E857A' }
};

/**
 * Der Bau. Zwei bis drei Türme, in jedem ein bis zwei Füchse.
 *
 * Aufgebaut wird von unten: Pfosten links und rechts, Decke drüber, Fuchs
 * dazwischen — dann die nächste Etage. Rein zufällig gestapelte Kästen
 * ergäben Bauten, die schon von allein zusammenfallen.
 */
export function bauen(seed) {
  const r = rng(seed);
  const kaesten = [];
  const fuechse = [];
  // Hochkant ist der Bildschirm schmal. Der Bau steht deshalb dicht bei der
  // Schleuder und baut lieber in die Höhe als in die Breite — sonst schrumpft
  // die ganze Szene auf Briefmarkengröße, damit sie überhaupt hineinpasst.
  let x = 210;
  const tuerme = 2 + (r() < 0.45 ? 1 : 0);

  for (let t = 0; t < tuerme; t++) {
    const etagen = 1 + Math.floor(r() * 3);
    const breite = 84 + Math.floor(r() * 26);
    let y = 0;
    for (let e = 0; e < etagen; e++) {
      const stoff = r() < 0.2 ? 'stein' : r() < 0.72 ? 'holz' : 'glas';
      const s = STOFFE[stoff];
      // Zwei Pfosten
      kaesten.push({ x, y, w: 18, h: 62, stoff, leben: s.leben });
      kaesten.push({ x: x + breite - 18, y, w: 18, h: 62, stoff, leben: s.leben });
      // Ein Fuchs sitzt dazwischen
      if (r() < 0.85) fuechse.push({ x: x + breite / 2, y: y + 20, weg: false });
      // Decke
      const deckStoff = r() < 0.3 ? 'stein' : 'holz';
      kaesten.push({ x, y: y + 62, w: breite, h: 18, stoff: deckStoff, leben: STOFFE[deckStoff].leben });
      y += 80;
    }
    // Ein Fuchs oben drauf, wenn Platz ist
    if (r() < 0.6) fuechse.push({ x: x + breite / 2, y, weg: false });
    x += breite + 26 + Math.floor(r() * 22);
  }
  const hoehe = kaesten.reduce((h, k) => Math.max(h, k.y + k.h), 0);
  return { kaesten, fuechse, breite: x + 30, hoehe: hoehe + 90 };
}

/** Punkte: Füchse zählen am meisten, übrige Eier bringen den Rest. */
export function bewerten(fuechseWeg, kaestenWeg, restEier) {
  return fuechseWeg * 120 + kaestenWeg * 12 + restEier * 150;
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
    root.innerHTML = `
      <div class="game-wrap">
        ${header()}
        <div class="game-center">
          <div class="game-hero">${icon('gameSling', { size: 68 })}</div>
          <h2 class="game-h">Bau ${d.r}</h2>
          <p class="game-p">${target != null
            ? `<b>${esc(partner)}</b> hat <b>${target}</b> Punkte aus dem Bau geholt. Derselbe Bau wartet auf dich.`
            : 'Ziehen, zielen, loslassen. Drei Eier. Jeder Fuchs zählt am meisten — und wer mit weniger Eiern auskommt, bekommt den Rest gutgeschrieben.'}</p>
          <button class="btn btn-primary btn-block" data-go>Spannen</button>
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
    const B = bauen(seedFor(meta.id, d.r, st));

    root.innerHTML = `
      <div class="game-wrap game-playing">
        ${header()}
        <div class="game-hud">
          <div class="hud-score"><span data-score>0</span><small>Punkte</small></div>
          <div class="hud-combo" data-combo></div>
          <div class="hud-live" data-eggs></div>
        </div>
        <div class="sling-field" data-field>
          <canvas class="sling-canvas" data-canvas></canvas>
        </div>
        <p class="catch-hint" data-hint>Am Ei ziehen und loslassen</p>
      </div>`;
    bindClose();

    const field = root.querySelector('[data-field]');
    const cv = root.querySelector('[data-canvas]');
    const g = cv.getContext('2d');
    const elScore = root.querySelector('[data-score]');
    const elCombo = root.querySelector('[data-combo]');
    const elEggs = root.querySelector('[data-eggs]');
    const elHint = root.querySelector('[data-hint]');

    let W = 0, H = 0, dpr = 1, skala = 1;
    // Die Welt ist so breit wie der Bau; alles wird in die Breite eingepasst.
    // Die Höhe bindet nur auf ganz flachen Bildschirmen.
    const weltB = B.breite + 40;
    const weltH = Math.max(240, B.hoehe);

    function messen() {
      const b = field.getBoundingClientRect();
      dpr = Math.min(3, window.devicePixelRatio || 1);
      W = b.width; H = b.height;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      cv.style.width = `${W}px`; cv.style.height = `${H}px`;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      skala = Math.min((W - 30) / weltB, (H - 60) / weltH);
    }
    window.addEventListener('resize', messen);
    cleanups.push(() => window.removeEventListener('resize', messen));
    messen();

    const bodenY = () => H - 34;
    const wx = (x) => 24 + x * skala;
    const wy = (y) => bodenY() - y * skala;

    const SCHLEUDER = { x: 70, y: 100 };
    let eier = SCHUESSE, punkte = 0;
    let kaesten = B.kaesten.map((k) => ({ ...k, weg: false }));
    let fuechse = B.fuechse.map((f) => ({ ...f }));
    let splitter = [];
    let ei = null;                 // { x, y, vx, vy }
    let zug = null;                // { x, y } während des Ziehens
    let ruht = 0;                  // wie lange nichts mehr passiert ist

    const zeigeEier = () => {
      elEggs.innerHTML = Array.from({ length: SCHUESSE }, (_, i) =>
        `<span class="sling-egg${i < eier ? '' : ' leer'}">${icon('egg', { size: 17 })}</span>`).join('');
    };
    zeigeEier();

    /* ── Ziehen ── */

    const zeigerWelt = (e) => {
      const b = cv.getBoundingClientRect();
      return { x: e.clientX - b.left, y: e.clientY - b.top };
    };

    const onDown = (e) => {
      if (ei || !eier || !running) return;
      const p = zeigerWelt(e);
      // Großzügiger Fangbereich — auf dem Handy trifft man sonst nichts
      if (Math.hypot(p.x - wx(SCHLEUDER.x), p.y - wy(SCHLEUDER.y)) > 90) return;
      e.preventDefault();
      zug = p;
      elHint.classList.add('gone');
      cv.setPointerCapture?.(e.pointerId);
    };
    const onMove = (e) => { if (zug) { e.preventDefault(); zug = zeigerWelt(e); } };
    const onUp = () => {
      if (!zug) return;
      const dx = wx(SCHLEUDER.x) - zug.x;
      const dy = wy(SCHLEUDER.y) - zug.y;
      const laenge = Math.min(MAX_ZUG, Math.hypot(dx, dy) / Math.max(0.2, skala));
      zug = null;
      if (laenge < 12) return;                    // versehentliches Antippen
      const winkel = Math.atan2(dy, dx);
      eier--;
      zeigeEier();
      ei = {
        x: SCHLEUDER.x, y: SCHLEUDER.y,
        vx: Math.cos(winkel) * laenge * TEMPO,
        vy: -Math.sin(winkel) * laenge * TEMPO
      };
      ruht = 0;
      fx('pop');
    };
    cv.addEventListener('pointerdown', onDown);
    cv.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    cleanups.push(() => {
      cv.removeEventListener('pointerdown', onDown);
      cv.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    });

    /* ── Simulation ── */

    function treffer(k, wucht) {
      k.leben -= wucht;
      if (k.leben > 0) return false;
      k.weg = true;
      punkte += STOFFE[k.stoff].punkte;
      for (let i = 0; i < 5; i++) {
        splitter.push({
          x: k.x + k.w / 2, y: k.y + k.h / 2,
          vx: (Math.random() - 0.5) * 220, vy: Math.random() * 200 + 40,
          leben: 0.7, farbe: STOFFE[k.stoff].farbe
        });
      }
      return true;
    }

    function fuchsWeg(f, grund) {
      if (f.weg) return;
      f.weg = true;
      punkte += 120;
      fx('coin');
      elCombo.textContent = grund === 'kiste' ? 'Erschlagen!' : 'Volltreffer!';
      elCombo.classList.add('on');
      setTimeout(() => elCombo.classList.remove('on'), 1100);
      const b = cv.getBoundingClientRect();
      burst(['sparkle', 'feather'], { x: b.left + wx(f.x), y: b.top + wy(f.y), count: 6, rise: 80 });
    }

    /**
     * Was nichts mehr unter sich hat, fällt.
     *
     * „Unter sich“ heißt: Boden oder ein Kasten, der die eigene Unterkante
     * berührt und waagerecht überlappt. Das läuft so lange, bis sich nichts
     * mehr bewegt — ein Einsturz kann sich fortpflanzen.
     */
    function einsturz() {
      let nochmal = true, runden = 0;
      while (nochmal && runden++ < 12) {
        nochmal = false;
        for (const k of kaesten) {
          if (k.weg || k.y <= 0.5) continue;
          const traeger = kaesten.some((o) => !o.weg && o !== k
            && Math.abs(o.y + o.h - k.y) < 3
            && o.x < k.x + k.w - 2 && o.x + o.w > k.x + 2);
          if (traeger) continue;
          // Fällt eine Höhe tiefer und erwischt dabei, was darunter sitzt
          for (const f of fuechse) {
            if (!f.weg && Math.abs(f.x - (k.x + k.w / 2)) < k.w / 2 + 14 && f.y < k.y) fuchsWeg(f, 'kiste');
          }
          k.y = Math.max(0, k.y - 80);
          k.leben -= 18;
          if (k.leben <= 0) { k.weg = true; punkte += STOFFE[k.stoff].punkte; }
          nochmal = true;
        }
      }
      // Füchse ohne Boden unter den Füßen plumpsen auf den Boden
      for (const f of fuechse) {
        if (f.weg || f.y <= 0.5) continue;
        const traeger = kaesten.some((o) => !o.weg && Math.abs(o.y + o.h - f.y) < 4
          && o.x < f.x + 12 && o.x + o.w > f.x - 12);
        if (!traeger) f.y = Math.max(0, f.y - 80);
      }
      elScore.textContent = punkte;
    }

    function schritt(dt) {
      // Splitter
      for (const s of splitter) {
        s.vy -= SCHWERKRAFT * dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.leben -= dt;
      }
      splitter = splitter.filter((s) => s.leben > 0 && s.y > -20);

      if (!ei) {
        ruht += dt;
        if (!eier && ruht > 1.2 && !splitter.length) ende();
        return;
      }

      ei.vy -= SCHWERKRAFT * dt;
      ei.x += ei.vx * dt;
      ei.y += ei.vy * dt;

      const wucht = Math.min(60, Math.hypot(ei.vx, ei.vy) / 12);

      // Kästen
      for (const k of kaesten) {
        if (k.weg) continue;
        if (ei.x + 9 > k.x && ei.x - 9 < k.x + k.w && ei.y + 9 > k.y && ei.y - 9 < k.y + k.h) {
          treffer(k, wucht);
          fx('tap');
          // Das Ei verliert Schwung und prallt ab, statt durchzufliegen
          ei.vx *= 0.42;
          ei.vy = -ei.vy * 0.3;
          ei.y = k.y + k.h + 10;
          break;
        }
      }

      // Füchse
      for (const f of fuechse) {
        if (!f.weg && Math.hypot(f.x - ei.x, f.y + 14 - ei.y) < 24) { fuchsWeg(f, 'ei'); ei.vx *= 0.5; }
      }

      // Boden oder aus dem Bild
      if (ei.y <= 6) {
        ei.y = 6;
        ei.vy = -ei.vy * 0.28;
        ei.vx *= 0.62;
        if (Math.abs(ei.vy) < 40) ei = null;
      }
      if (ei && (ei.x > weltB + 60 || ei.x < -40)) ei = null;

      if (!ei) {
        einsturz();
        ruht = 0;
        if (!fuechse.some((f) => !f.weg)) { setTimeout(ende, 700); running = false; }
      }
      elScore.textContent = punkte;
    }

    /* ── Zeichnen ── */

    function kiste(k) {
      const x = wx(k.x), y = wy(k.y + k.h), w = k.w * skala, h = k.h * skala;
      const s = STOFFE[k.stoff];
      const angeschlagen = k.leben < s.leben * 0.55;
      g.fillStyle = s.farbe;
      g.globalAlpha = k.stoff === 'glas' ? 0.72 : 1;
      g.beginPath(); g.roundRect(x, y, w, h, 3); g.fill();
      g.globalAlpha = 1;
      g.strokeStyle = s.kante; g.lineWidth = 1.6;
      g.beginPath(); g.roundRect(x + .8, y + .8, w - 1.6, h - 1.6, 3); g.stroke();
      if (angeschlagen) {
        g.strokeStyle = 'rgba(60,40,30,.4)';
        g.lineWidth = 1.2;
        g.beginPath();
        g.moveTo(x + w * 0.3, y + 2); g.lineTo(x + w * 0.55, y + h * 0.5); g.lineTo(x + w * 0.35, y + h - 2);
        g.stroke();
      }
    }

    function fuchs(f) {
      const x = wx(f.x), y = wy(f.y);
      const s = skala;
      g.fillStyle = '#E08A4A';
      g.beginPath(); g.ellipse(x, y - 15 * s, 14 * s, 13 * s, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#FFF6E4';
      g.beginPath(); g.ellipse(x, y - 10 * s, 8 * s, 7 * s, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#E08A4A';
      g.beginPath();
      g.moveTo(x - 12 * s, y - 24 * s); g.lineTo(x - 6 * s, y - 30 * s); g.lineTo(x - 4 * s, y - 22 * s);
      g.moveTo(x + 12 * s, y - 24 * s); g.lineTo(x + 6 * s, y - 30 * s); g.lineTo(x + 4 * s, y - 22 * s);
      g.fill();
      g.fillStyle = '#3A2C21';
      g.beginPath();
      g.arc(x - 5 * s, y - 18 * s, 1.9 * s, 0, Math.PI * 2);
      g.arc(x + 5 * s, y - 18 * s, 1.9 * s, 0, Math.PI * 2);
      g.fill();
    }

    function zeichnen() {
      g.clearRect(0, 0, W, H);
      const himmel = g.createLinearGradient(0, 0, 0, H);
      himmel.addColorStop(0, '#D9ECF8');
      himmel.addColorStop(0.7, '#F6EFE1');
      himmel.addColorStop(1, '#EADFC7');
      g.fillStyle = himmel;
      g.fillRect(0, 0, W, H);

      // Wolken und ein Hügel dahinter — sonst ist die obere Bildhälfte leer
      g.fillStyle = 'rgba(255,255,255,.7)';
      for (let i = 0; i < 4; i++) {
        const cx = 50 + i * (W / 3.4) + (i % 2 ? 18 : -14);
        const cy = 46 + (i % 3) * 44;
        const cr = 17 + (i % 3) * 6;
        g.beginPath();
        g.ellipse(cx, cy, cr * 1.7, cr * 0.6, 0, 0, Math.PI * 2);
        g.ellipse(cx - cr * 0.6, cy - cr * 0.22, cr * 0.8, cr * 0.56, 0, 0, Math.PI * 2);
        g.ellipse(cx + cr * 0.7, cy - cr * 0.1, cr * 0.62, cr * 0.46, 0, 0, Math.PI * 2);
        g.fill();
      }
      g.fillStyle = '#C6E3BE';
      for (let i = -1; i < 4; i++) {
        g.beginPath();
        g.ellipse(i * (W / 2.6) + W / 5, bodenY() + 6, W / 3, 74, 0, Math.PI, 0);
        g.fill();
      }

      g.fillStyle = '#A9D89E';
      g.fillRect(0, bodenY(), W, H - bodenY());
      g.fillStyle = '#8FBF7A';
      g.fillRect(0, bodenY(), W, 5);

      for (const k of kaesten) if (!k.weg) kiste(k);
      for (const f of fuechse) if (!f.weg) fuchs(f);

      // Schleuder
      const sx = wx(SCHLEUDER.x), sy = wy(SCHLEUDER.y);
      g.strokeStyle = '#A9724A';
      g.lineWidth = 6 * Math.max(0.6, skala);
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(sx, bodenY()); g.lineTo(sx, sy + 6);
      g.moveTo(sx - 11, sy + 8); g.lineTo(sx - 15, sy - 12);
      g.moveTo(sx + 11, sy + 8); g.lineTo(sx + 15, sy - 12);
      g.stroke();

      // Gummi und Vorschau während des Ziehens
      if (zug) {
        const dx = sx - zug.x, dy = sy - zug.y;
        const laenge = Math.min(MAX_ZUG * skala, Math.hypot(dx, dy));
        const w = Math.atan2(dy, dx);
        const px = sx - Math.cos(w) * laenge, py = sy - Math.sin(w) * laenge;
        g.strokeStyle = '#E05A72'; g.lineWidth = 4;
        g.beginPath();
        g.moveTo(sx - 15, sy - 12); g.lineTo(px, py); g.lineTo(sx + 15, sy - 12);
        g.stroke();
        eiZeichnen(px, py, 1);
        // Gepunktete Flugbahn
        const v = { x: Math.cos(w) * (laenge / Math.max(0.2, skala)) * TEMPO, y: -Math.sin(w) * (laenge / Math.max(0.2, skala)) * TEMPO };
        g.fillStyle = 'rgba(70,55,40,.34)';
        for (let t = 0.06; t < 1.5; t += 0.06) {
          const bx = wx(SCHLEUDER.x + v.x * t);
          const by = wy(SCHLEUDER.y + v.y * t - 0.5 * SCHWERKRAFT * t * t);
          if (by > bodenY()) break;
          g.beginPath(); g.arc(bx, by, 2.6, 0, Math.PI * 2); g.fill();
        }
      } else if (ei) {
        eiZeichnen(wx(ei.x), wy(ei.y), 1);
      } else if (eier > 0) {
        eiZeichnen(sx, sy - 4, 1);
      }

      for (const s of splitter) {
        g.globalAlpha = Math.max(0, s.leben);
        g.fillStyle = s.farbe;
        g.beginPath(); g.arc(wx(s.x), wy(s.y), 3.4, 0, Math.PI * 2); g.fill();
      }
      g.globalAlpha = 1;
    }

    function eiZeichnen(x, y, f) {
      g.fillStyle = '#FFF6E4';
      g.beginPath(); g.ellipse(x, y, 9 * f, 11 * f, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#FBE7C6';
      g.beginPath(); g.ellipse(x + 2 * f, y + 2 * f, 5 * f, 6 * f, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#fff';
      g.beginPath(); g.ellipse(x - 3 * f, y - 4 * f, 2.4 * f, 3 * f, 0, 0, Math.PI * 2); g.fill();
    }

    let letzte = 0;
    function frame(now) {
      if (!running) { zeichnen(); return; }
      if (!letzte) letzte = now;
      const dt = Math.min(0.05, (now - letzte) / 1000);
      letzte = now;
      for (let rest = dt; rest > 0; rest -= 0.008) schritt(Math.min(0.008, rest));
      zeichnen();
      raf = requestAnimationFrame(frame);
    }

    let beendet = false;
    function ende() {
      if (beendet) return;
      beendet = true;
      running = false;
      cancelAnimationFrame(raf);
      const weg = fuechse.filter((f) => f.weg).length;
      const kw = kaesten.filter((k) => k.weg).length;
      setTimeout(() => finish(weg, fuechse.length, kw, eier), 450);
    }

    raf = requestAnimationFrame(frame);
  }

  function finish(fuechseWeg, fuechseGes, kaestenWeg, restEier) {
    running = false;
    cancelAnimationFrame(raf);
    const alle = fuechseWeg === fuechseGes;
    const punkte = bewerten(fuechseWeg, kaestenWeg, alle ? restEier : 0);
    const { settled } = submitScore(meta.id, punkte, { fuechse: fuechseWeg, kaesten: kaestenWeg, rest: restEier });
    fx(settled?.result === 'me' ? 'yay' : 'pop');
    if (alle) confetti(['sparkle', 'egg', 'trophy']);

    root.innerHTML = `
      <div class="game-wrap">
        ${header()}
        <div class="game-center">
          <div class="game-hero">${icon(settled?.result === 'me' ? 'trophy' : 'gameSling', { size: 68 })}</div>
          <h2 class="game-h">${punkte} Punkte</h2>
          <div class="game-stats">
            <div><b>${fuechseWeg}/${fuechseGes}</b><small>Füchse</small></div>
            <div><b>${kaestenWeg}</b><small>Kisten</small></div>
            <div><b>${restEier}</b><small>Eier übrig</small></div>
          </div>
          <p class="game-p">${alle ? 'Der Bau ist leer. ' : 'Da sitzt noch jemand. '}${!settled
            ? `Ergebnis unterwegs zu ${esc(partner)} — gleicher Bau.`
            : settled.result === 'me' ? `Du gewinnst ${settled.mine}:${settled.theirs}. +${settled.reward} Körner.`
            : settled.result === 'draw' ? `Unentschieden bei ${settled.mine}. +${settled.reward} Körner.`
            : `${esc(partner)} war treffsicherer: ${settled.theirs}:${settled.mine}. +${settled.reward} Körner.`}</p>
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
