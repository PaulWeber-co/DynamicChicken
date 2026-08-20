/**
 * Körner-Jagd — dein Huhn fängt, was vom Himmel fällt.
 *
 * Statt auf Ziele zu tippen, steuerst du Knuddl selbst: Finger auf den
 * Bildschirm und schieben. Das Huhn ist dasselbe wie zu Hause, mit Hut und
 * allem — deshalb läuft es als echtes SVG mit, nicht als Punkt auf einer
 * Leinwand.
 *
 * Der Regen ist aus dem Runden-Seed vorberechnet: Beide bekommen exakt
 * dieselben Körner, Würmer und Steine zur selben Millisekunde.
 */

import { rng } from '../util/rng.js';
import { esc } from '../util/dom.js';
import { fx, burst } from '../util/feedback.js';
import { get } from '../state/store.js';
import { renderChicken, playAction } from '../pet/chicken.js';
import { icon } from '../ui/icons.js';
import { duel, seedFor, submitScore, sendLiveTick, inviteToPlay } from './index.js';

export const meta = {
  id: 'grain',
  icon: 'gameGrain',
  title: 'Körner-Jagd',
  tagline: 'Steuere Knuddl und fang alles Essbare',
  modes: ['live', 'async'],
  tone: 'warm',
  howto: 'Finger auf den Bildschirm und schieben. Steine tun weh.'
};

const DURATION = 35_000;

/**
 * Was fallen kann.
 *
 * `w` ist das Gewicht in der Ziehung, nicht die Punktzahl — je größer, desto
 * öfter kommt es. Die drei unteren sind keine Nahrung, sondern Zustände:
 * Sie ändern für ein paar Sekunden die Regeln, und genau das macht aus
 * fünfunddreißig Sekunden Regen eine Runde mit Verlauf.
 */
const KINDS = [
  { id: 'korn',  icon: 'corn',    pts: 1,  w: 40, speed: .20, size: 40 },
  { id: 'wurm',  icon: 'worm',    pts: 2,  w: 18, speed: .26, size: 40 },
  { id: 'beere', icon: 'berries', pts: 2,  w: 13, speed: .29, size: 38 },
  { id: 'kuchen',icon: 'cake',    pts: 5,  w: 6,  speed: .34, size: 42, rare: true },
  { id: 'herz',  icon: 'statJoy', pts: 3,  w: 7,  speed: .22, size: 36, heal: true },
  { id: 'stein', icon: 'symStein',pts: -4, w: 16, speed: .30, size: 40, bad: true },
  { id: 'chili', icon: 'flame',   pts: 2,  w: 5,  speed: .27, size: 38, rare: true,
    effekt: 'doppelt', dauer: 6000, ruf: 'Doppelte Punkte!' },
  { id: 'feder', icon: 'feather', pts: 2,  w: 5,  speed: .18, size: 38, rare: true,
    effekt: 'magnet', dauer: 5000, ruf: 'Alles fliegt dir zu!' },
  { id: 'kaffee',icon: 'coffee',  pts: 0,  w: 6,  speed: .32, size: 38, bad: true,
    effekt: 'verkehrt', dauer: 2600, ruf: 'Zu heiß — verkehrt herum!' }
];

const kindById = (id) => KINDS.find((k) => k.id === id);

/** Sechs Stufen, danach von vorn — aber der Regen bleibt schneller. */
export const STUFEN = 6;
export const stufeFuer = (runde) => 1 + ((Math.max(1, Math.floor(runde)) - 1) % STUFEN);

/**
 * Was auf dieser Stufe im Spiel ist.
 *
 * Alles auf einmal wäre am ersten Tag Chaos und am zehnten trotzdem
 * langweilig. Stattdessen kommt pro Stufe eine Regel dazu, und der Vorspann
 * sagt, welche — man weiß dann, worauf man diesmal achten muss.
 */
export function plan(stufe) {
  const s = Math.max(1, stufe);
  return {
    stufe: s,
    tempo: 1 + (s - 1) * 0.085,
    dichte: 1 + (s - 1) * 0.10,
    steine: 1 + (s - 1) * 0.24,
    chili: s >= 2,
    wind: s >= 3,
    magnet: s >= 4,
    kaffee: s >= 5,
    neu: ['', '', 'Chili: doppelte Punkte', 'Böen: der Regen weht schräg',
      'Federn ziehen alles an', 'Heißer Kaffee dreht die Steuerung', 'Alles zusammen'][s] || ''
  };
}

/**
 * Die drei Abschnitte einer Runde.
 *
 * Der letzte ist der Grund, warum man bis zum Schluss dranbleibt: Da zählt
 * alles doppelt, und ein Rückstand von zehn Punkten ist plötzlich nichts.
 */
export const PHASEN = [
  { bis: 0.40, name: 'Ruhig',      sub: 'Warm werden' },
  { bis: 0.74, name: 'Böig',       sub: 'Der Wind dreht' },
  { bis: 1.00, name: 'Goldrausch', sub: 'Alles zählt doppelt' }
];

export const phaseBei = (anteil) => PHASEN.findIndex((p) => anteil <= p.bis + 1e-9);

function buildRain(seed, p = plan(1)) {
  const r = rng(seed);
  const erlaubt = KINDS.filter((k) =>
    (k.id !== 'chili' || p.chili) && (k.id !== 'feder' || p.magnet) && (k.id !== 'kaffee' || p.kaffee));
  const gewicht = (k) => (k.id === 'stein' ? k.w * p.steine : k.w);
  const total = erlaubt.reduce((s, k) => s + gewicht(k), 0);
  const items = [];
  let t = 600;
  while (t < DURATION - 700) {
    const roll = r() * total;
    let acc = 0, kind = erlaubt[0];
    for (const k of erlaubt) { acc += gewicht(k); if (roll <= acc) { kind = k; break; } }
    items.push({
      t,
      x: 0.10 + r() * 0.80,
      kind,
      speed: kind.speed * (0.88 + r() * 0.34) * p.tempo,
      spin: (r() - 0.5) * 220,
      // Wie stark dieses Stück im böigen Abschnitt schwankt
      boe: (0.5 + r() * 0.5) * (r() < 0.5 ? -1 : 1),
      hit: false,
      el: null
    });
    const pace = (560 - 260 * (t / DURATION)) / p.dichte;
    t += pace * (0.62 + r() * 0.76);
  }
  return items;
}

export { buildRain, KINDS, kindById };

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
  let raf = 0, tickTimer = 0, running = false;
  const cleanups = [];

  const header = (right = '') => `<div class="game-top">
    <button class="game-x" data-close aria-label="Schließen">${icon('close', { size: 15 })}</button>
    <div class="game-title">${esc(meta.title)}</div>
    <div class="game-right">${right}</div>
  </div>`;

  const bindClose = () => root.querySelectorAll('[data-close]').forEach((b) => { b.onclick = () => ctx.close(); });

  /* ── Startbildschirm ── */
  function intro() {
    const d = duel(get(), meta.id);
    const target = d.theirs?.score ?? null;
    const p = plan(stufeFuer(d.r));
    const sichtbar = KINDS.filter((k) =>
      (k.id !== 'chili' || p.chili) && (k.id !== 'feder' || p.magnet) && (k.id !== 'kaffee' || p.kaffee));
    root.innerHTML = `
      <div class="game-wrap">
        ${header()}
        <div class="game-center">
          <div class="game-hero">${icon('gameGrain', { size: 68 })}</div>
          <div class="game-kicker">Runde ${d.r} · Stufe ${p.stufe} von ${STUFEN}${p.neu ? ` · neu: ${esc(p.neu)}` : ''}</div>
          <h2 class="game-h">${esc(['', 'Erste Körner', 'Scharf', 'Böig', 'Anziehend', 'Wach', 'Volles Programm'][p.stufe] || 'Körner-Jagd')}</h2>
          <p class="game-p">${target != null
            ? `<b>${esc(partner)}</b> hat <b>${target}</b> Punkte geholt. Gleicher Regen, gleiche Chance.`
            : `35 Sekunden in drei Abschnitten — ruhig, böig, und am Ende zählt alles doppelt.`}</p>
          <div class="game-legend">
            ${sichtbar.map((k) => `<span class="legend">${icon(k.icon, { size: 20 })} ${k.effekt
              ? esc(k.ruf.replace(/[!—].*$/, '').trim())
              : `${k.pts > 0 ? '+' : ''}${k.pts}`}</span>`).join('')}
          </div>
          <button class="btn btn-primary btn-block" data-go>Los geht’s</button>
          ${target == null && get().partner ? `<button class="btn btn-ghost btn-block" data-invite>${esc(partner)} anstupsen</button>` : ''}
        </div>
      </div>`;
    root.querySelector('[data-go]').onclick = () => { fx('pop'); play(); };
    const inv = root.querySelector('[data-invite]');
    if (inv) inv.onclick = () => { inviteToPlay(meta.id); fx('tap'); inv.textContent = 'Angestupst'; inv.disabled = true; };
    bindClose();
  }

  /* ── Runde ── */
  function play() {
    running = true;
    const st = get();
    const d = duel(st, meta.id);
    const p = plan(stufeFuer(d.r));
    const items = buildRain(seedFor(meta.id, d.r, st), p);
    let score = 0, combo = 0, bestCombo = 0, caught = 0, missed = 0;
    const live = !!(st.partner && ctx.partnerOnline);
    const start = performance.now();
    // Laufende Zustände: bis wann gilt was
    const bis = { doppelt: 0, magnet: 0, verkehrt: 0 };
    let phase = -1;

    root.innerHTML = `
      <div class="game-wrap game-playing">
        ${header(`<span class="game-clock" data-clock>35.0</span>`)}
        <div class="game-hud">
          <div class="hud-score"><span data-score>0</span><small>Punkte</small></div>
          <div class="hud-combo" data-combo></div>
          ${live ? `<div class="hud-live"><span class="dot-live"></span><span data-livescore>0</span><small>${esc(partner)}</small></div>` : ''}
        </div>
        <div class="catch-field" data-field>
          <div class="catch-lane" data-lane></div>
          <div class="catch-hero" data-hero>${renderChicken(st.me.pet.look, { mood: 'happy', size: 96, shadow: false })}</div>
          <div class="catch-ground"></div>
          <div class="catch-phase" data-phase></div>
          <div class="catch-effekte" data-effekte></div>
        </div>
        <div class="game-flash" data-flash></div>
        <p class="catch-hint" data-hint>Finger auf den Bildschirm und schieben</p>
      </div>`;
    bindClose();

    const elPhase = root.querySelector('[data-phase]');
    const elEffekte = root.querySelector('[data-effekte]');

    const field = root.querySelector('[data-field]');
    const lane = root.querySelector('[data-lane]');
    const hero = root.querySelector('[data-hero]');
    const elScore = root.querySelector('[data-score]');
    const elCombo = root.querySelector('[data-combo]');
    const elClock = root.querySelector('[data-clock]');
    const elFlash = root.querySelector('[data-flash]');
    const elLive = root.querySelector('[data-livescore]');
    const elHint = root.querySelector('[data-hint]');

    let W = field.clientWidth, H = field.clientHeight;
    let heroX = 0.5;               // 0..1
    const HERO_W = 96;
    const HERO_BOTTOM = 34;        // muss zu .catch-hero in games.css passen
    const HERO_H = 108;

    const resize = () => { W = field.clientWidth; H = field.clientHeight; placeHero(); };
    window.addEventListener('resize', resize);
    cleanups.push(() => window.removeEventListener('resize', resize));

    function placeHero() {
      hero.style.transform = `translateX(${(heroX * W) - HERO_W / 2}px)`;
    }
    placeHero();

    /* Steuerung: ziehen, überall im Feld */
    let dragging = false;
    const setFromEvent = (e) => {
      const r = field.getBoundingClientRect();
      let ziel = (e.clientX - r.left) / r.width;
      // Heißer Kaffee: der Finger sagt links, das Huhn geht rechts
      if (performance.now() < bis.verkehrt) ziel = 1 - ziel;
      const next = Math.max(0.07, Math.min(0.93, ziel));
      if (next !== heroX) {
        hero.classList.toggle('flip', next < heroX);
        heroX = next;
        placeHero();
      }
    };
    const onDown = (e) => { dragging = true; elHint.classList.add('gone'); setFromEvent(e); field.setPointerCapture?.(e.pointerId); };
    const onMove = (e) => { if (dragging) setFromEvent(e); };
    const onUp = () => { dragging = false; };
    field.addEventListener('pointerdown', onDown);
    field.addEventListener('pointermove', onMove);
    field.addEventListener('pointerup', onUp);
    field.addEventListener('pointercancel', onUp);
    cleanups.push(() => {
      field.removeEventListener('pointerdown', onDown);
      field.removeEventListener('pointermove', onMove);
      field.removeEventListener('pointerup', onUp);
      field.removeEventListener('pointercancel', onUp);
    });

    // Tastatur, damit es auch am Rechner spielbar ist
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') { heroX = Math.max(0.07, heroX - 0.06); hero.classList.add('flip'); placeHero(); }
      if (e.key === 'ArrowRight') { heroX = Math.min(0.93, heroX + 0.06); hero.classList.remove('flip'); placeHero(); }
    };
    window.addEventListener('keydown', onKey);
    cleanups.push(() => window.removeEventListener('keydown', onKey));

    if (live) {
      tickTimer = setInterval(() => sendLiveTick(meta.id, score), 2000);
      cleanups.push(() => clearInterval(tickTimer));
    }

    function renderCombo() {
      if (combo >= 4) { elCombo.textContent = `×${combo} Serie`; elCombo.classList.add('on'); }
      else { elCombo.textContent = ''; elCombo.classList.remove('on'); }
    }

    /** Ein Zustand beginnt — oder wird verlängert, wenn er schon läuft. */
    function starte(effekt, dauer, ruf) {
      const jetzt = performance.now();
      bis[effekt] = Math.max(bis[effekt], jetzt) + dauer;
      elCombo.textContent = ruf;
      elCombo.classList.add('on');
      setTimeout(() => { if (elCombo.textContent === ruf) elCombo.classList.remove('on'); }, 1400);
      field.classList.toggle('verkehrt', effekt === 'verkehrt');
    }

    function grab(it, x, y) {
      it.hit = true;
      it.el?.classList.add('caught');
      const px = field.getBoundingClientRect().left + x;
      const py = field.getBoundingClientRect().top + y;
      const jetzt = performance.now();
      const doppelt = jetzt < bis.doppelt;
      const gold = phase === 2;

      if (it.kind.effekt) {
        // Zustände zählen mit ihren Punkten und schalten dann die Regel um
        combo++;
        caught++;
        bestCombo = Math.max(bestCombo, combo);
        score += it.kind.pts * (doppelt ? 2 : 1) * (gold ? 2 : 1);
        starte(it.kind.effekt, it.kind.dauer, it.kind.ruf);
        fx(it.kind.bad ? 'fail' : 'coin');
        playAction(hero, it.kind.bad ? 'bump' : 'hop', 420);
        burst([it.kind.icon], { x: px, y: py, count: 7, rise: 90, duration: 700 });
      } else if (it.kind.bad) {
        score = Math.max(0, score + it.kind.pts);
        combo = 0;
        missed++;
        fx('fail');
        playAction(hero, 'bump');
        elFlash.classList.remove('boom'); void elFlash.offsetWidth; elFlash.classList.add('boom');
      } else {
        combo++;
        caught++;
        bestCombo = Math.max(bestCombo, combo);
        const bonus = combo >= 12 ? 3 : combo >= 7 ? 2 : combo >= 4 ? 1 : 0;
        // Chili und Goldrausch stapeln sich — vier Punkte für ein Korn sind
        // selten genug, dass man sie sich merkt.
        score += (it.kind.pts + bonus) * (doppelt ? 2 : 1) * (gold ? 2 : 1);
        fx(it.kind.rare ? 'coin' : 'eat');
        playAction(hero, it.kind.rare ? 'hop' : 'peck', 420);
        burst([it.kind.icon], { x: px, y: py, count: it.kind.rare ? 6 : 3, rise: 80, duration: 620 });
      }
      elScore.textContent = score;
      renderCombo();
      setTimeout(() => it.el?.remove(), 260);
    }

    function frame(now) {
      if (!running) return;
      const el = now - start;
      const left = Math.max(0, DURATION - el);
      elClock.textContent = (left / 1000).toFixed(1);
      if (left < 6000) elClock.classList.add('urgent');

      /* Abschnittswechsel ankündigen */
      const neuePhase = phaseBei(el / DURATION);
      if (neuePhase !== phase) {
        phase = neuePhase;
        const ph = PHASEN[phase];
        // Der böige Abschnitt heißt erst ab Stufe 3 so — vorher weht nichts
        const zeigen = phase !== 1 || p.wind;
        if (zeigen && phase > 0) {
          elPhase.innerHTML = `<b>${esc(ph.name)}</b><small>${esc(ph.sub)}</small>`;
          elPhase.classList.remove('an'); void elPhase.offsetWidth; elPhase.classList.add('an');
          fx(phase === 2 ? 'coin' : 'tap');
        }
        field.classList.toggle('gold', phase === 2);
      }

      const magnet = now < bis.magnet;
      hero.classList.toggle('magnet', magnet);
      const fangweite = magnet ? 132 : 52;
      // Böen wehen nur im mittleren Abschnitt und erst ab Stufe 3
      const boeig = phase === 1 && p.wind ? Math.sin(el / 620) : 0;

      const heroPx = heroX * W;

      for (const it of items) {
        if (it.hit || el < it.t) continue;
        const y = (el - it.t) * it.speed;
        // Der Magnet zieht nicht am Punktestand, sondern am Bild: Was in
        // Reichweite ist, driftet sichtbar aufs Huhn zu.
        const zug = magnet ? Math.max(0, 1 - Math.abs(y - (H * 0.62)) / (H * 0.6)) : 0;
        const xPx = it.x * W
          + boeig * it.boe * 46
          + zug * (heroPx - it.x * W) * 0.55;

        if (!it.el) {
          const node = document.createElement('span');
          node.className = `catch-item${it.kind.bad ? ' is-bad' : ''}${it.kind.rare ? ' is-rare' : ''}`;
          node.innerHTML = icon(it.kind.icon, { size: it.kind.size });
          lane.appendChild(node);
          it.el = node;
        }
        // Waagerecht über `left`, senkrecht über `transform`: Das Einsammeln
        // animiert `transform` weiter, und ein Sprung an die Ausgangsstelle
        // mitten in der Animation sähe aus wie ein Fehler.
        it.el.style.left = `${xPx}px`;
        it.el.style.transform = `translate(-50%, ${y}px) rotate(${(el - it.t) / 1000 * it.spin}deg)`;

        // Fangen, wenn das Ding auf Schnabelhöhe und über dem Huhn ist
        const beakY = H - HERO_BOTTOM - HERO_H * 0.62;
        if (y > beakY - 34 && y < beakY + 46) {
          if (Math.abs(xPx - heroPx) < fangweite) { grab(it, xPx, y); continue; }
        }
        if (y > H + 60) {
          it.hit = true;
          if (!it.kind.bad) { combo = 0; renderCombo(); }
          it.el.remove();
        }
      }

      /* Laufende Zustände in der Ecke anzeigen */
      const laufend = [
        now < bis.doppelt && ['flame', Math.ceil((bis.doppelt - now) / 1000)],
        magnet && ['feather', Math.ceil((bis.magnet - now) / 1000)],
        now < bis.verkehrt && ['coffee', Math.ceil((bis.verkehrt - now) / 1000)]
      ].filter(Boolean);
      elEffekte.innerHTML = laufend
        .map(([ic, s]) => `<span class="catch-effekt">${icon(ic, { size: 15 })}${s}</span>`).join('');
      if (now >= bis.verkehrt) field.classList.remove('verkehrt');

      if (live && elLive) {
        const ls = duel(get(), meta.id).liveScore;
        if (ls) elLive.textContent = ls.score;
      }

      if (left <= 0) { finish(score, bestCombo, caught, missed, p); return; }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
  }

  /* ── Ergebnis ── */
  function finish(score, bestCombo, caught, missed, p = plan(1)) {
    running = false;
    cancelAnimationFrame(raf);
    clearInterval(tickTimer);
    const { settled } = submitScore(meta.id, score, { combo: bestCombo, caught, stufe: p.stufe });
    fx(settled?.result === 'me' ? 'yay' : 'pop');

    root.innerHTML = `
      <div class="game-wrap">
        ${header()}
        <div class="game-center">
          <div class="game-hero">${icon(settled ? (settled.result === 'me' ? 'trophy' : settled.result === 'draw' ? 'nudgeHug' : 'gameGrain') : 'gameGrain', { size: 68 })}</div>
          <div class="game-kicker">Stufe ${p.stufe} von ${STUFEN}</div>
          <h2 class="game-h">${score} Punkte</h2>
          <div class="game-stats">
            <div><b>${caught}</b><small>gefangen</small></div>
            <div><b>×${bestCombo}</b><small>beste Serie</small></div>
            <div><b>${missed}</b><small>Steine</small></div>
          </div>
          <p class="game-p">${resultLine(settled, partner)}</p>
          <button class="btn btn-primary btn-block" data-again>Nochmal</button>
          <button class="btn btn-ghost btn-block" data-close>Fertig</button>
        </div>
      </div>`;
    root.querySelector('[data-again]').onclick = () => intro();
    bindClose();
  }

  function resultLine(settled, name) {
    if (!settled) return `Ergebnis abgeschickt. Sobald ${esc(name)} dieselbe Runde gespielt hat, wird abgerechnet.`;
    if (settled.result === 'me') return `Du gewinnst ${settled.mine}:${settled.theirs}. +${settled.reward} Körner.`;
    if (settled.result === 'draw') return `Unentschieden, ${settled.mine}:${settled.theirs}. +${settled.reward} Körner.`;
    return `${esc(name)} gewinnt ${settled.theirs}:${settled.mine}. +${settled.reward} Körner für den Mut.`;
  }

  intro();
  return () => {
    running = false;
    cancelAnimationFrame(raf);
    clearInterval(tickTimer);
    cleanups.forEach((f) => f());
  };
}
