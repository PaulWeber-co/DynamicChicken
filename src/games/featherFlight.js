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
const BALKEN_H = 36;       // Klotz in der Lücke, ab Stufe 5

/** Sechs Stufen. Danach von vorn, aber der Zaun bleibt der von Stufe 6. */
export const STUFEN = 6;
export const stufeFuer = (runde) => 1 + ((Math.max(1, Math.floor(runde)) - 1) % STUFEN);

/**
 * Was auf dieser Stufe im Zaun steht.
 *
 * Der alte Zaun war über 120 Lücken hinweg immer derselbe: enger werden und
 * sonst nichts. Das ist nach der dritten Partie auswendig gelernt. Jetzt
 * kommt pro Stufe ein Element dazu, und der Vorspann sagt vorher, welches —
 * überrascht werden ist gut, überrumpelt werden nicht.
 */
export function plan(stufe) {
  const s = Math.max(1, stufe);
  return {
    stufe: s,
    gap0: GAP0 - (s - 1) * 8,
    gapMin: Math.max(132, GAP_MIN - (s - 1) * 5),
    enger: 2.2 + (s - 1) * 0.35,       // wie schnell die Lücke schrumpft
    tempo: 1 + (s - 1) * 0.07,
    wandert: s >= 2,                    // Lücken fahren auf und ab
    feder: s >= 2,                      // eine Feder verzeiht eine Berührung
    doppel: s >= 3,                     // zwei Tore dicht hintereinander
    boe: s >= 4,                        // Aufwind und Fallwind im Wechsel
    balken: s >= 5,                     // ein Klotz mitten in der Lücke
    neu: ['', '', 'Federn schützen, Lücken wandern', 'Doppeltore',
      'Böen ziehen dich hoch und runter', 'Klötze mitten in der Lücke', 'Alles zusammen'][s] || ''
  };
}

/**
 * Darf die nächste Lücke dort sitzen, wo der Zufall sie hinlegt?
 *
 * Bisher würfelte jedes Tor seine Höhe frei aus. Meistens ging das gut —
 * und manchmal lagen zwei Tore so weit auseinander, dass die Strecke
 * dazwischen selbst mit ununterbrochenem Flattern nicht reicht. Das merkt
 * man als Spieler nicht als Pech, sondern als kaputtes Spiel.
 *
 * Also wird der Wunschwert an dem gemessen, was in der Zeit bis dorthin
 * überhaupt geht: Steigen schafft gut 230 Pixel pro Sekunde, Fallen etwa
 * 430. Gerechnet wird mit einem hohen Bildschirm, weil dieselbe
 * Bildschirmhälfte dort mehr Pixel bedeutet — was auf dem Tablet passt,
 * passt auf dem Handy erst recht.
 */
const H_REF = 700, STEIGEN = 230, FALLEN = 430;

function erreichbar(vor, wunsch, x, i, wandert, p) {
  if (!vor) return wunsch;
  const tempo = (SPEED0 + Math.min(140, i * 4.5)) * p.tempo;
  const t = Math.max(0.15, (x - vor.x) / tempo);
  // Zwei Drittel des Machbaren, damit auch ein Verzögern noch verziehen wird
  const rauf = (0.62 * STEIGEN * t) / H_REF;
  const runter = (0.62 * FALLEN * t) / H_REF;
  // Was beide Lücken an Höhe wandern, muss zusätzlich überwunden werden
  const spiel = vor.wandert + wandert;
  return Math.max(vor.c - rauf + spiel, Math.min(vor.c + runter - spiel, wunsch));
}

function buildFence(seed, p = plan(1)) {
  const r = rng(seed);
  const gates = [];
  let x = 640;               // erste Lücke erst nach ein paar Sekunden Luft
  for (let i = 0; i < 120; i++) {
    const eng = Math.max(p.gapMin, p.gap0 - i * p.enger);
    // Ein Doppeltor steht dicht hinter seinem Vorgänger — dafür ist seine
    // Lücke etwas größer, sonst wäre es keine Aufgabe, sondern eine Falle.
    const zwilling = p.doppel && i > 5 && r() < 0.18 && !gates[gates.length - 1]?.zwilling;
    const balken = p.balken && i > 8 && r() < 0.20;
    // Ein Tor mit Klotz bekommt den Platz des Klotzes obendrauf. Sonst wäre
    // die Lücke auf Stufe 6 schmaler als das Huhn — kein Kunststück mehr,
    // sondern eine Sackgasse.
    // Ein Doppeltor sitzt auf fast derselben Höhe wie sein Vorgänger. Sonst
    // müsste man in einer Dreiviertelsekunde quer durchs Bild — das ist kein
    // Doppeltor mehr, sondern ein Zufallsgenerator.
    const vor = gates[gates.length - 1];
    const wandert = !zwilling && p.wandert && i > 3 && r() < 0.38 ? 0.04 + r() * 0.055 : 0;
    const c = zwilling && vor
      ? Math.max(0.26, Math.min(0.74, vor.c + (r() - 0.5) * 0.10))
      : erreichbar(vor, 0.3 + r() * 0.4, x, i, wandert, p);
    gates.push({
      i,
      x,
      c,
      gap: eng + (zwilling ? 26 : 0) + (balken ? BALKEN_H + 22 : 0),
      zwilling,
      // Wandern: Ausschlag in Bildschirmanteilen, plus eine eigene Phase
      wandert,
      phase: r() * Math.PI * 2,
      feder: p.feder && i > 2 && r() < 0.16,
      balken,
      federWeg: false,
      passed: false,
      el: null
    });
    const luft = zwilling ? 168 : (268 + r() * 80 - Math.min(64, i * 1.2));
    x += luft / p.tempo;
  }
  return gates;
}

export { buildFence };

/** Ein Zaunelement: Pfosten mit Latten, Kappe und ggf. Fähnchen. */
function gateMarkup(g, ghost) {
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
    ${g.balken ? '<div class="fly-balken"></div>' : ''}
    ${g.feder ? `<div class="fly-feder">${icon('feather', { size: 26 })}</div>` : ''}
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
    const p = plan(stufeFuer(d.r));
    root.innerHTML = `
      <div class="game-wrap">
        ${header()}
        <div class="game-center">
          <div class="game-hero">${icon('gameFlight', { size: 68 })}</div>
          <div class="game-kicker">Runde ${d.r} · Stufe ${p.stufe} von ${STUFEN}${p.neu ? ` · neu: ${esc(p.neu)}` : ''}</div>
          <h2 class="game-h">${esc(['', 'Erster Zaun', 'Federleicht', 'Doppelt hält', 'Gegenwind', 'Klotzig', 'Alles auf einmal'][p.stufe] || 'Federflug')}</h2>
          <p class="game-p">${target != null
            ? `<b>${esc(partner)}</b> hat <b>${target}</b> Lücken geschafft. Bei Lücke ${target} steht das Fähnchen.`
            : 'Antippen lässt Knuddl flattern. Der Zaun wird enger, je weiter du kommst.'}</p>
          ${p.feder ? `<div class="game-legend"><span class="legend">${icon('feather', { size: 15 })} eine Feder verzeiht eine Berührung</span></div>` : ''}
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
    const p = plan(stufeFuer(d.r));
    const gates = buildFence(seedFor(meta.id, d.r, st), p);
    const ghostAt = d.theirs?.score ?? null;
    let schild = 0;              // eingesammelte Federn = verzeihbare Berührungen

    root.innerHTML = `
      <div class="game-wrap game-playing">
        ${header()}
        <div class="game-hud">
          <div class="hud-score"><span data-score>0</span><small>Lücken</small></div>
          <div class="hud-combo" data-combo></div>
          <div class="fly-schild" data-schild></div>
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
    const elSchild = root.querySelector('[data-schild]');
    const zeigeSchild = () => {
      elSchild.innerHTML = Array.from({ length: schild }, () =>
        `<span>${icon('feather', { size: 15 })}</span>`).join('');
    };

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
        const speed = (SPEED0 + Math.min(140, score * 4.5)) * p.tempo;
        dist += speed * dt;
        // Böen: die Schwerkraft schwankt um ein Fünftel, langsam genug, dass
        // man es ausgleichen kann, schnell genug, dass man es merkt.
        const wind = p.boe ? Math.sin(dist / 340) * 0.14 : 0;
        vy = Math.min(VY_MAX, vy + GRAVITY * (1 + wind) * dt);
        y += vy * dt;
        field.classList.toggle('aufwind', wind < -0.12);
        field.classList.toggle('fallwind', wind > 0.12);
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
          node.innerHTML = gateMarkup(g, ghostAt != null && g.i === ghostAt);
          gatesHost.appendChild(node);
          g.el = node;
          g.top = node.querySelector('.top');
          g.bot = node.querySelector('.bot');
          g.flag = node.querySelector('.fly-flag');
          g.federEl = node.querySelector('.fly-feder');
          g.balkenEl = node.querySelector('.fly-balken');
        }
        // Wandernde Lücken: die Mitte fährt auf und ab, aber nie so weit,
        // dass sie den Boden oder die Decke berührt.
        const cy = Math.max(g.gap / 2 + 30, Math.min(H - GROUND - g.gap / 2 - 10,
          (g.c + (g.wandert ? Math.sin(dist / 190 + g.phase) * g.wandert : 0)) * H));
        const half = g.gap / 2;
        g.cy = cy;
        g.el.style.transform = `translateX(${gx}px)`;
        g.top.style.height = `${Math.max(0, cy - half)}px`;
        g.bot.style.height = `${Math.max(0, H - GROUND - (cy + half))}px`;
        if (g.flag) g.flag.style.top = `${cy + half - 30}px`;
        if (g.federEl) g.federEl.style.top = `${cy - 13}px`;
        // Der Klotz sitzt an der oberen Kante der Lücke und lässt unten durch
        if (g.balkenEl) g.balkenEl.style.top = `${cy - half + 4}px`;

        if (started && Math.abs(gx + GATE_W / 2 - hx) < HIT_X + GATE_W / 2) {
          const balkenTrifft = g.balken && y - HIT_Y < cy - half + BALKEN_H;
          if (y - HIT_Y < cy - half || y + HIT_Y > cy + half || balkenTrifft) {
            if (!verzeih(g)) { die(); break; }
          }
        }
        // Feder einsammeln — sie hängt genau in der Mitte der Lücke
        if (started && !g.federWeg && g.feder
            && Math.abs(gx + GATE_W / 2 - hx) < 40 && Math.abs(y - cy) < 40) {
          g.federWeg = true;
          schild = Math.min(3, schild + 1);
          zeigeSchild();
          g.federEl?.remove();
          g.federEl = null;
          fx('coin');
          burst(['feather'], { from: hero, count: 5, rise: 90 });
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

    /**
     * Eine Berührung mit Feder überleben.
     *
     * Ohne Nachsicht wäre die Feder wertlos: Man würde zwei Bilder später am
     * selben Pfosten wieder hängen. Also wird sie verbraucht, das Tor gilt
     * als durch, und ein kurzer Stoß schiebt Knuddl zurück in die Lücke.
     */
    function verzeih(g) {
      if (!schild) return false;
      schild--;
      zeigeSchild();
      g.passed = true;
      y = Math.max(40, Math.min(H - GROUND - 30, g.cy ?? (g.c * H)));
      vy = -120;
      fx('fail');
      field.classList.remove('gerettet'); void field.offsetWidth; field.classList.add('gerettet');
      burst(['feather'], { from: hero, count: 6, rise: 110 });
      return true;
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
      setTimeout(() => finish(score, p, schild), 820);
    }

    raf = requestAnimationFrame(frame);
  }

  function finish(score, p = plan(1), federn = 0) {
    const { settled } = submitScore(meta.id, score, { stufe: p.stufe, federn });
    fx(settled?.result === 'me' ? 'yay' : 'pop');
    root.innerHTML = `
      <div class="game-wrap">
        ${header()}
        <div class="game-center">
          <div class="game-hero">${icon(settled?.result === 'me' ? 'trophy' : 'feather', { size: 68 })}</div>
          <div class="game-kicker">Stufe ${p.stufe} von ${STUFEN}</div>
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
