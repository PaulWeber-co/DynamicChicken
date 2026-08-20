/**
 * Federschleuder — ziehen, zielen, loslassen.
 *
 * Rechts steht ein Bau aus Holz, Glas und Stein, darin hocken Füchse. Links
 * steht die Schleuder. Ein paar Eier, danach wird abgerechnet.
 *
 * Die Physik liegt in `slingPhysik.js`, die Bauten in `slingLevel.js` — hier
 * geht es nur um Eingabe, Bild und Ablauf. Diese Trennung ist der Grund,
 * warum sich beides einzeln prüfen lässt: Der Physiktest braucht keinen
 * Bildschirm, und ein neues Level ist eine Datenzeile, kein Eingriff.
 */

import { esc } from '../util/dom.js';
import { fx, burst, confetti } from '../util/feedback.js';
import { get } from '../state/store.js';
import { icon } from '../ui/icons.js';
import { duel, seedFor, submitScore, inviteToPlay } from './index.js';
import { schritt, STOFFE, EI_R, SCHWERKRAFT, SCHRITT } from './slingPhysik.js';
import { levelFuer, bewerten, LEVEL } from './slingLevel.js';

export const meta = {
  id: 'sling',
  icon: 'gameSling',
  title: 'Federschleuder',
  tagline: 'Zieh, ziel, lass los',
  modes: ['async'],
  tone: 'warm',
  howto: 'Am Ei ziehen, zielen, loslassen. Jeder Fuchs zählt, jedes übrige Ei auch. Zwölf Bauten, danach mit weniger Eiern von vorn.'
};

/**
 * Der Zug wird in Bildschirmpixeln gemessen, nicht in Weltmaßen.
 *
 * Das klingt nach einem Detail, ist aber der Unterschied zwischen „spielbar“
 * und „geht nicht“: Die Schleuder steht bei Welt-x 70, auf einem 402 Pixel
 * breiten Handy sind das keine 60 Pixel vom linken Rand. Wer den vollen Zug
 * in Welteinheiten verlangt, verlangt einen Wisch aus dem Bildschirm heraus —
 * der flache, weite Schuss wäre schlicht nicht erreichbar. Also: voller Zug
 * genau dann, wenn man bis an den linken Rand zieht, egal wie groß das Bild
 * ist.
 */
export const V_MAX = 720;   // Startgeschwindigkeit bei vollem Zug
const MIN_ZUG = 0.12;       // darunter zählt es als Verwackeln
export { bewerten, LEVEL };

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
    const L = levelFuer(d.r);
    const target = d.theirs?.score ?? null;
    root.innerHTML = `
      <div class="game-wrap">
        ${header()}
        <div class="game-center">
          <div class="game-hero">${icon('gameSling', { size: 68 })}</div>
          <div class="game-kicker">Bau ${L.index} von ${LEVEL.length}${L.durchgang ? ` · ${L.durchgang + 1}. Durchgang` : ''}</div>
          <h2 class="game-h">${esc(L.titel.split(' · ')[0])}</h2>
          <p class="game-p">${target != null
            ? `<b>${esc(partner)}</b> hat <b>${target}</b> Punkte aus diesem Bau geholt. Derselbe Bau wartet auf dich.`
            : esc(L.tipp)}</p>
          <div class="game-legend">
            <span class="legend">${icon('egg', { size: 15 })} ${L.eier} Eier</span>
            <span class="legend" style="color:#E08A4A">${L.fuechse.length} Füchse</span>
            <span class="legend">${L.kisten.length} Teile</span>
          </div>
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
    const L = levelFuer(d.r);
    // Der Seed wird hier nicht mehr fürs Bauen gebraucht — die Level stehen
    // fest. Er bleibt trotzdem im Spiel, damit spätere Zufälle (Wind o.Ä.)
    // ohne Umbau angeflanscht werden können.
    void seedFor(meta.id, d.r, st);

    root.innerHTML = `
      <div class="game-wrap game-playing">
        ${header(`<span class="tiny muted">${esc(L.titel.split(' · ')[0])}</span>`)}
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

    const welt = { kisten: L.kisten, fuechse: L.fuechse, ei: null };
    const SCHLEUDER = { x: 70, y: 105 };
    let eier = L.eier, punkte = 0, splitter = [], zug = null;
    let ruht = 0, beendet = false;

    let W = 0, H = 0, dpr = 1, skala = 1;
    /**
     * Wie groß wird gezeichnet?
     *
     * Die Breite bestimmt den Maßstab — beide Enden, Schleuder und Bau,
     * müssen nebeneinander passen. Die Höhe richtet sich danach: ein Feld,
     * das den ganzen Rest des Bildschirms nimmt, wäre zu neun Zehnteln Himmel
     * und der Bau darin eine Briefmarke. Also nur so hoch, wie Boden, Bau und
     * der höchste sinnvolle Bogen es brauchen — der Rest bleibt Hintergrund.
     */
    function messen() {
      const b = field.getBoundingClientRect();
      dpr = Math.min(3, window.devicePixelRatio || 1);
      W = b.width;
      const breit = (W - 24) / L.breite;
      H = Math.min(b.height, Math.round(46 + breit * Math.max(L.hoehe, 380)));
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      cv.style.width = `${W}px`; cv.style.height = `${H}px`;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      skala = Math.min(breit, (H - 70) / L.hoehe);
    }
    window.addEventListener('resize', messen);
    cleanups.push(() => window.removeEventListener('resize', messen));
    messen();

    const bodenY = () => H - 30;
    const wx = (x) => 12 + x * skala;
    const wy = (y) => bodenY() - y * skala;
    /** Voller Zug = bis an den linken Rand, aber nie absurd weit. */
    const zugWeite = () => Math.min(112, Math.max(52, wx(SCHLEUDER.x) - 6));

    const zeigeEier = () => {
      elEggs.innerHTML = Array.from({ length: L.eier }, (_, i) =>
        `<span class="sling-egg${i < eier ? '' : ' leer'}">${icon('egg', { size: 17 })}</span>`).join('');
    };
    zeigeEier();

    /* ── Ziehen ── */

    const zeiger = (e) => {
      const b = cv.getBoundingClientRect();
      return { x: e.clientX - b.left, y: e.clientY - b.top };
    };
    const onDown = (e) => {
      if (welt.ei || !eier || !running) return;
      const p = zeiger(e);
      if (Math.hypot(p.x - wx(SCHLEUDER.x), p.y - wy(SCHLEUDER.y)) > Math.max(104, zugWeite())) return;
      e.preventDefault();
      zug = p;
      elHint.classList.add('gone');
      cv.setPointerCapture?.(e.pointerId);
    };
    const onMove = (e) => { if (zug) { e.preventDefault(); zug = zeiger(e); } };
    const onUp = () => {
      if (!zug) return;
      const dx = wx(SCHLEUDER.x) - zug.x;
      const dy = wy(SCHLEUDER.y) - zug.y;
      const kraft = Math.min(1, Math.hypot(dx, dy) / zugWeite());
      zug = null;
      if (kraft < MIN_ZUG) return;
      const w = Math.atan2(dy, dx);
      eier--;
      zeigeEier();
      welt.ei = {
        x: SCHLEUDER.x, y: SCHLEUDER.y, r: EI_R,
        vx: Math.cos(w) * kraft * V_MAX,
        vy: -Math.sin(w) * kraft * V_MAX
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

    /* ── Was bei Schaden passiert ── */

    function beiSchaden(k, wucht, zerstoert) {
      if (!zerstoert) return;
      const istFuchs = k.r != null;
      punkte += istFuchs ? 120 : STOFFE[k.stoff].punkte;
      elScore.textContent = punkte;
      for (let i = 0; i < (istFuchs ? 7 : 5); i++) {
        splitter.push({
          x: k.r != null ? k.x : k.x + k.w / 2,
          y: k.r != null ? k.y : k.y + k.h / 2,
          vx: (Math.random() - 0.5) * 240, vy: Math.random() * 220 + 50,
          leben: 0.8, farbe: istFuchs ? '#E08A4A' : STOFFE[k.stoff].farbe
        });
      }
      if (istFuchs) {
        fx('coin');
        elCombo.textContent = 'Fuchs erwischt!';
        elCombo.classList.add('on');
        setTimeout(() => elCombo.classList.remove('on'), 1000);
      }
    }

    /* ── Zeichnen ── */

    function kisteZeichnen(k) {
      const s = STOFFE[k.stoff];
      const x = wx(k.x), y = wy(k.y + k.h), w = k.w * skala, h = k.h * skala;
      const kaputt = k.leben < k.maxLeben * 0.6;
      g.globalAlpha = k.stoff === 'glas' ? 0.7 : 1;
      g.fillStyle = s.farbe;
      g.beginPath(); g.roundRect(x, y, w, h, 3); g.fill();
      g.globalAlpha = 1;
      g.strokeStyle = s.kante; g.lineWidth = 1.6;
      g.beginPath(); g.roundRect(x + .8, y + .8, Math.max(1, w - 1.6), Math.max(1, h - 1.6), 3); g.stroke();
      if (kaputt) {
        g.strokeStyle = 'rgba(60,40,30,.42)';
        g.lineWidth = 1.3;
        g.beginPath();
        g.moveTo(x + w * 0.3, y + 2);
        g.lineTo(x + w * 0.55, y + h * 0.5);
        g.lineTo(x + w * 0.32, y + h - 2);
        g.stroke();
      }
    }

    function fuchsZeichnen(f) {
      const x = wx(f.x), y = wy(f.y), s = skala;
      g.fillStyle = '#E08A4A';
      g.beginPath(); g.ellipse(x, y - 2 * s, 15 * s, 14 * s, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#FFF6E4';
      g.beginPath(); g.ellipse(x, y + 2 * s, 8 * s, 7 * s, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#E08A4A';
      g.beginPath();
      g.moveTo(x - 13 * s, y - 11 * s); g.lineTo(x - 7 * s, y - 19 * s); g.lineTo(x - 4 * s, y - 10 * s);
      g.moveTo(x + 13 * s, y - 11 * s); g.lineTo(x + 7 * s, y - 19 * s); g.lineTo(x + 4 * s, y - 10 * s);
      g.fill();
      g.fillStyle = '#3A2C21';
      const angst = f.leben < 40;
      g.beginPath();
      g.arc(x - 5 * s, y - 5 * s, (angst ? 2.6 : 2) * s, 0, Math.PI * 2);
      g.arc(x + 5 * s, y - 5 * s, (angst ? 2.6 : 2) * s, 0, Math.PI * 2);
      g.fill();
    }

    function eiZeichnen(x, y, f = 1) {
      g.fillStyle = '#FFF6E4';
      g.beginPath(); g.ellipse(x, y, 9 * f, 11 * f, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#FBE7C6';
      g.beginPath(); g.ellipse(x + 2 * f, y + 2 * f, 5 * f, 6 * f, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#fff';
      g.beginPath(); g.ellipse(x - 3 * f, y - 4 * f, 2.4 * f, 3 * f, 0, 0, Math.PI * 2); g.fill();
    }

    function zeichnen() {
      // Der Himmel kommt als CSS-Verlauf vom Feld darunter — so läuft er über
      // die volle Höhe durch, auch dort, wo das Canvas gar nicht mehr liegt.
      // Deshalb hier nur löschen statt füllen.
      g.clearRect(0, 0, W, H);

      // Sonne oben rechts, damit der Himmel nicht bloß leer ist
      g.fillStyle = 'rgba(255,236,190,.75)';
      g.beginPath(); g.arc(W - 46, 44, 30, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#FFF2CE';
      g.beginPath(); g.arc(W - 46, 44, 19, 0, Math.PI * 2); g.fill();

      g.fillStyle = 'rgba(255,255,255,.7)';
      for (let i = 0; i < 4; i++) {
        const cx = 50 + i * (W / 3.4) + (i % 2 ? 18 : -14);
        const cy = 52 + (i % 3) * 44;
        const cr = 16 + (i % 3) * 6;
        g.beginPath();
        g.ellipse(cx, cy, cr * 1.7, cr * 0.6, 0, 0, Math.PI * 2);
        g.ellipse(cx - cr * 0.6, cy - cr * 0.22, cr * 0.8, cr * 0.56, 0, 0, Math.PI * 2);
        g.ellipse(cx + cr * 0.7, cy - cr * 0.1, cr * 0.62, cr * 0.46, 0, 0, Math.PI * 2);
        g.fill();
      }
      // Zwei Hügelreihen: die hintere blasser und höher — das gibt Tiefe
      g.fillStyle = '#D6E8CE';
      for (let i = -1; i < 4; i++) {
        g.beginPath();
        g.ellipse(i * (W / 2.2) + W / 3, bodenY() - 26, W / 2.6, 84, 0, Math.PI, 0);
        g.fill();
      }
      g.fillStyle = '#C6E3BE';
      for (let i = -1; i < 4; i++) {
        g.beginPath();
        g.ellipse(i * (W / 2.6) + W / 5, bodenY() + 6, W / 3, 70, 0, Math.PI, 0);
        g.fill();
      }
      g.fillStyle = '#A9D89E';
      g.fillRect(0, bodenY(), W, H - bodenY());
      g.fillStyle = '#8FBF7A';
      g.fillRect(0, bodenY(), W, 5);

      for (const k of welt.kisten) if (!k.weg) kisteZeichnen(k);
      for (const f of welt.fuechse) if (!f.weg) fuchsZeichnen(f);

      // Schleuder
      const sx = wx(SCHLEUDER.x), sy = wy(SCHLEUDER.y);
      g.strokeStyle = '#A9724A';
      g.lineWidth = Math.max(4, 6 * skala);
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(sx, bodenY()); g.lineTo(sx, sy + 6);
      g.moveTo(sx - 11, sy + 8); g.lineTo(sx - 15, sy - 12);
      g.moveTo(sx + 11, sy + 8); g.lineTo(sx + 15, sy - 12);
      g.stroke();

      if (zug) {
        const dx = sx - zug.x, dy = sy - zug.y;
        const kraft = Math.min(1, Math.hypot(dx, dy) / zugWeite());
        const laenge = kraft * zugWeite();
        const w = Math.atan2(dy, dx);
        const px = sx - Math.cos(w) * laenge, py = sy - Math.sin(w) * laenge;
        g.strokeStyle = '#E05A72'; g.lineWidth = 4;
        g.beginPath();
        g.moveTo(sx - 15, sy - 12); g.lineTo(px, py); g.lineTo(sx + 15, sy - 12);
        g.stroke();
        eiZeichnen(px, py);
        // Gepunktete Flugbahn — dieselbe Rechnung wie die Physik
        const v = { x: Math.cos(w) * kraft * V_MAX, y: -Math.sin(w) * kraft * V_MAX };
        for (let t = 0.08, i = 0; t < 2.6; t += 0.08, i++) {
          const bx = wx(SCHLEUDER.x + v.x * t);
          const by = wy(SCHLEUDER.y + v.y * t - 0.5 * SCHWERKRAFT * t * t);
          if (by > bodenY() || bx > W) break;
          // Die Bahn verblasst nach hinten: nah ist sie ein Versprechen,
          // weit hinten nur noch eine Ahnung.
          g.fillStyle = `rgba(70,55,40,${Math.max(0.08, 0.4 - i * 0.016)})`;
          g.beginPath(); g.arc(bx, by, Math.max(1.6, 3 - i * 0.06), 0, Math.PI * 2); g.fill();
        }
        // Kraftanzeige direkt am Zug — sonst rät man beim ersten Schuss
        g.fillStyle = kraft > 0.92 ? '#E05A72' : 'rgba(70,55,40,.5)';
        g.font = '600 12px system-ui, sans-serif';
        g.textAlign = 'center';
        g.fillText(`${Math.round(kraft * 100)}%`, Math.min(W - 20, Math.max(20, px)), py - 18);
        g.textAlign = 'start';
      } else if (welt.ei) {
        eiZeichnen(wx(welt.ei.x), wy(welt.ei.y));
      } else if (eier > 0) {
        eiZeichnen(sx, sy - 4);
      }

      for (const s of splitter) {
        g.globalAlpha = Math.max(0, s.leben);
        g.fillStyle = s.farbe;
        g.beginPath(); g.arc(wx(s.x), wy(s.y), 3.4, 0, Math.PI * 2); g.fill();
      }
      g.globalAlpha = 1;
    }

    /* ── Schleife ── */

    let uebrig = 0, letzte = 0;
    function frame(now) {
      if (!running) { zeichnen(); return; }
      if (!letzte) letzte = now;
      uebrig += Math.min(0.1, (now - letzte) / 1000);
      letzte = now;

      let bewegt = false;
      // Fester Zeitschritt: Nur so kommen beide Geräte auf dasselbe Bild
      while (uebrig >= SCHRITT) {
        uebrig -= SCHRITT;
        bewegt = schritt(welt, beiSchaden) || bewegt;
        for (const s of splitter) {
          s.vy -= SCHWERKRAFT * SCHRITT;
          s.x += s.vx * SCHRITT;
          s.y += s.vy * SCHRITT;
          s.leben -= SCHRITT;
        }
        if (welt.ei && (welt.ei.x > L.breite + 120 || welt.ei.x < -60 || Math.hypot(welt.ei.vx, welt.ei.vy) < 26)) {
          welt.ei = null;
        }
      }
      splitter = splitter.filter((s) => s.leben > 0 && s.y > -30);

      if (!welt.ei && !bewegt && !splitter.length) {
        ruht += 0.016;
        const fertig = !welt.fuechse.some((f) => !f.weg);
        if (fertig || (!eier && ruht > 0.9)) { ende(); return; }
      } else {
        ruht = 0;
      }

      zeichnen();
      raf = requestAnimationFrame(frame);
    }

    function ende() {
      if (beendet) return;
      beendet = true;
      running = false;
      cancelAnimationFrame(raf);
      zeichnen();
      const weg = welt.fuechse.filter((f) => f.weg).length;
      const kw = welt.kisten.filter((k) => k.weg).length;
      setTimeout(() => finish(weg, welt.fuechse.length, kw, eier, L), 500);
    }

    raf = requestAnimationFrame(frame);
  }

  function finish(fuechseWeg, fuechseGes, kaestenWeg, restEier, L) {
    running = false;
    cancelAnimationFrame(raf);
    const alle = fuechseWeg === fuechseGes;
    const punkte = bewerten(fuechseWeg, kaestenWeg, alle ? restEier : 0, L.nummer);
    const { settled } = submitScore(meta.id, punkte, { fuechse: fuechseWeg, kaesten: kaestenWeg, rest: restEier, bau: L.index });
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
            <div><b>${kaestenWeg}</b><small>Teile</small></div>
            <div><b>${restEier}</b><small>Eier übrig</small></div>
          </div>
          <p class="game-p">${alle ? 'Der Bau ist leer. ' : 'Da sitzt noch jemand. '}${!settled
            ? `Ergebnis unterwegs zu ${esc(partner)} — gleicher Bau.`
            : settled.result === 'me' ? `Du gewinnst ${settled.mine}:${settled.theirs}. +${settled.reward} Körner.`
            : settled.result === 'draw' ? `Unentschieden bei ${settled.mine}. +${settled.reward} Körner.`
            : `${esc(partner)} war treffsicherer: ${settled.theirs}:${settled.mine}. +${settled.reward} Körner.`}</p>
          <button class="btn btn-primary btn-block" data-again>${alle ? 'Nächster Bau' : 'Nochmal'}</button>
          <button class="btn btn-ghost btn-block" data-close>Fertig</button>
        </div>
      </div>`;
    root.querySelector('[data-again]').onclick = () => intro();
    bindClose();
  }

  intro();
  return () => { running = false; cancelAnimationFrame(raf); cleanups.forEach((f) => f()); };
}
