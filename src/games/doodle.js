/**
 * Kritzel-Telefon — du malst, dein Mensch rät.
 *
 * Du bekommst ein Wort und dreißig Sekunden. Dein Kritzel reist als Liste
 * von Strichpunkten mit (auf ein 100×100-Raster gerundet, damit auch ein
 * Brieftauben-Code sie noch tragen kann), und drüben werden die Striche in
 * derselben Reihenfolge nachgezeichnet — man sieht also beim Zusehen, wie es
 * entstanden ist.
 *
 * Danach ist der andere dran. Punkte gibt es fürs Raten und fürs Gemaltwerden.
 */

import { rng } from '../util/rng.js';
import { esc } from '../util/dom.js';
import { fx, burst, confetti } from '../util/feedback.js';
import { get, commit } from '../state/store.js';
import { pushFeed, addBondXp } from '../state/model.js';
import { REWARDS } from '../state/catalog.js';
import { icon } from '../ui/icons.js';
import { sendEvent } from '../sync/index.js';
import { relTime } from '../util/time.js';

export const meta = {
  id: 'doodle',
  icon: 'gameDoodle',
  title: 'Kritzel-Telefon',
  tagline: 'Du malst, dein Mensch rät',
  modes: ['async'],
  tone: 'love',
  howto: 'Ein Wort, dreißig Sekunden, vier Antwortmöglichkeiten drüben.'
};

/** Wörter, die sich mit vier Strichen andeuten lassen. */
const WORDS = [
  'Nest', 'Regenbogen', 'Kaffeetasse', 'Zugfahrt', 'Vollmond', 'Regenschirm',
  'Sonnenblume', 'Fahrrad', 'Kuscheldecke', 'Pizzastück', 'Brille', 'Herzschlag',
  'Berg', 'Leuchtturm', 'Gitarre', 'Schneemann', 'Kerze', 'Briefkasten',
  'Wollknäuel', 'Teekanne', 'Hängematte', 'Sternenhimmel', 'Wasserfall', 'Koffer'
];

const MAX_POINTS = 420;
const DRAW_MS = 30_000;

function dd(state) {
  if (!state.games.doodle) {
    state.games.doodle = { round: 1, pending: null, hist: [], hits: 0, sent: 0 };
  }
  return state.games.doodle;
}

/** Wort und Ablenker aus dem Rundenschlüssel — beide Seiten sehen dieselben. */
function wordSet(seedKey) {
  const r = rng(hashish(seedKey));
  const pool = WORDS.slice();
  const pick = () => pool.splice(Math.floor(r() * pool.length), 1)[0];
  const answer = pick();
  const options = [answer, pick(), pick(), pick()];
  // deterministisch mischen
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  return { answer, options };
}

function hashish(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/* ── Netzwerk ───────────────────────────────────────────── */

export function handleRemote(state, msg, { partnerName }) {
  const g = dd(state);

  if (msg.kind === 'doodle') {
    g.pending = { from: 'them', strokes: msg.strokes || [], key: msg.key, id: msg.id, at: Date.now() };
    commit('doodle');
    pushFeed(state, { from: 'them', type: 'game', icon: 'gameDoodle', text: `${partnerName} hat etwas gemalt` });
    return {
      kind: 'gameTurn',
      icon: 'gameDoodle',
      avatar: 'them',
      title: `${partnerName} hat gekritzelt`,
      sub: 'Rate, was es sein soll',
      body: `${partnerName} hat etwas für dich gemalt. Vier Möglichkeiten stehen zur Wahl.`,
      actions: [{ label: 'Ansehen', act: 'game:doodle', primary: true }, { label: 'Später', act: 'dismiss' }],
      tone: 'love'
    };
  }

  if (msg.kind === 'doodleGuess') {
    g.hist.unshift({ who: 'them', word: msg.word, right: !!msg.right, at: Date.now() });
    if (g.hist.length > 20) g.hist.length = 20;
    state.me.coins += msg.right ? REWARDS.gameWon : REWARDS.gamePlayed;
    addBondXp(state, msg.right ? 8 : 4);
    commit('doodle');
    return {
      kind: 'gameResult',
      icon: msg.right ? 'trophy' : 'gameDoodle',
      avatar: 'them',
      title: msg.right ? `${partnerName} hat es erkannt!` : `${partnerName} lag daneben`,
      sub: `Es war „${msg.word}"`,
      body: msg.right
        ? `${partnerName} hat dein Bild richtig erraten. Ihr versteht euch auch ohne Worte.`
        : `${partnerName} kam nicht drauf — es war „${msg.word}".`,
      actions: [{ label: 'Neues malen', act: 'game:doodle', primary: true }, { label: 'Ok', act: 'dismiss' }],
      tone: msg.right ? 'warm' : 'calm'
    };
  }

  return undefined;
}

export function summary(state) {
  const g = dd(state);
  if (g.pending?.from === 'them') return { badge: 'wait', text: 'Ein Kritzel wartet' };
  if (g.pending?.from === 'me') return { badge: 'off', text: 'Unterwegs' };
  return { badge: null, text: g.hist.length ? `${g.hits}/${g.hist.length} erraten` : 'Neu' };
}

/* ── Oberfläche ─────────────────────────────────────────── */

export function mount(root, ctx) {
  const partner = get().partner?.name || 'Dein Mensch';
  let timer = 0, raf = 0;
  const cleanups = [];

  const shell = (inner, right = '') => `<div class="game-wrap">
    <div class="game-top">
      <button class="game-x" data-close aria-label="Schließen">${icon('close', { size: 15 })}</button>
      <div class="game-title">${esc(meta.title)}</div>
      <div class="game-right">${right}</div>
    </div>
    ${inner}
  </div>`;
  const bindClose = () => root.querySelectorAll('[data-close]').forEach((b) => { b.onclick = () => ctx.close(); });

  /* — Malen — */
  function screenDraw() {
    const st = get();
    const g = dd(st);
    const key = `${st.me.code}-${g.round}`;
    const { answer } = wordSet(key);
    const strokes = [];
    let cur = null, points = 0, started = 0;

    root.innerHTML = shell(`
      <div class="doodle-word">
        <span class="doodle-kicker">Dein Wort</span>
        <b>${esc(answer)}</b>
      </div>
      <div class="doodle-pad" data-pad>
        <canvas data-canvas></canvas>
        <div class="doodle-timer" data-timer hidden></div>
      </div>
      <div class="doodle-tools">
        <button class="btn btn-line btn-sm" data-undo>Zurück</button>
        <button class="btn btn-line btn-sm" data-clear>Leeren</button>
        <button class="btn btn-love grow" data-send disabled>Schicken</button>
      </div>
      <p class="tiny muted center" style="padding:0 20px">Dreißig Sekunden ab dem ersten Strich. ${esc(partner)} bekommt vier Möglichkeiten.</p>
    `);
    bindClose();

    const pad = root.querySelector('[data-pad]');
    const canvas = root.querySelector('[data-canvas]');
    const cx = canvas.getContext('2d');
    const elTimer = root.querySelector('[data-timer]');
    const bSend = root.querySelector('[data-send]');

    let size = 0, dpr = Math.min(2.5, window.devicePixelRatio || 1);
    function fit() {
      // Innenmaß nehmen, sonst wächst die Leinwand über die Polsterung hinaus
      size = Math.max(160, Math.min(pad.clientWidth - 36, pad.clientHeight - 12));
      canvas.width = Math.round(size * dpr);
      canvas.height = Math.round(size * dpr);
      canvas.style.width = canvas.style.height = `${size}px`;
      cx.setTransform(dpr, 0, 0, dpr, 0, 0);
      redraw();
    }
    const onResize = () => fit();
    window.addEventListener('resize', onResize);
    cleanups.push(() => window.removeEventListener('resize', onResize));

    function redraw() {
      cx.clearRect(0, 0, size, size);
      cx.lineCap = cx.lineJoin = 'round';
      cx.lineWidth = Math.max(3, size * 0.022);
      cx.strokeStyle = '#3A2C21';
      for (const st2 of strokes) drawStroke(cx, st2, size);
    }

    const toLocal = (e) => {
      const r = canvas.getBoundingClientRect();
      return [
        Math.max(0, Math.min(99, Math.round(((e.clientX - r.left) / r.width) * 99))),
        Math.max(0, Math.min(99, Math.round(((e.clientY - r.top) / r.height) * 99)))
      ];
    };

    const down = (e) => {
      if (points >= MAX_POINTS) return;
      e.preventDefault();
      if (!started) { started = Date.now(); startTimer(); }
      cur = [toLocal(e)];
      strokes.push(cur);
      points++;
      redraw();
    };
    const move = (e) => {
      if (!cur || points >= MAX_POINTS) return;
      const p = toLocal(e);
      const last = cur[cur.length - 1];
      if (Math.abs(p[0] - last[0]) + Math.abs(p[1] - last[1]) < 2) return;
      cur.push(p);
      points++;
      redraw();
      bSend.disabled = points < 6;
    };
    const up = () => { cur = null; bSend.disabled = points < 6; };
    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    cleanups.push(() => window.removeEventListener('pointerup', up));

    function startTimer() {
      elTimer.hidden = false;
      const tick = () => {
        const left = Math.max(0, DRAW_MS - (Date.now() - started));
        elTimer.textContent = `${Math.ceil(left / 1000)}s`;
        elTimer.classList.toggle('urgent', left < 8000);
        if (left <= 0) { send(); return; }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }

    root.querySelector('[data-undo]').onclick = () => {
      const removed = strokes.pop();
      if (removed) points -= removed.length;
      bSend.disabled = points < 6;
      fx('tap');
      redraw();
    };
    root.querySelector('[data-clear]').onclick = () => {
      strokes.length = 0; points = 0; bSend.disabled = true; fx('tap'); redraw();
    };
    bSend.onclick = () => send();

    function send() {
      cancelAnimationFrame(raf);
      if (points < 6) { screenDraw(); return; }
      const st2 = get();
      const g2 = dd(st2);
      const id = Date.now().toString(36);
      g2.pending = { from: 'me', key, word: answer, id, at: Date.now() };
      g2.sent++;
      g2.round++;
      addBondXp(st2, 4);
      pushFeed(st2, { from: 'me', type: 'game', icon: 'gameDoodle', text: `„${answer}" für ${partner} gemalt` });
      commit('doodle');
      sendEvent('game', { g: 'doodle', kind: 'doodle', id, key, strokes });
      fx('love');
      screenSent(answer);
    }

    fit();
  }

  function screenSent(word) {
    root.innerHTML = shell(`
      <div class="game-center">
        <div class="game-hero">${icon('dove', { size: 68 })}</div>
        <h2 class="game-h">Unterwegs</h2>
        <p class="game-p">Dein „${esc(word)}" fliegt zu ${esc(partner)}. Du erfährst, ob es erkannt wurde.</p>
        <button class="btn btn-ghost btn-block" data-close>Fertig</button>
      </div>
      ${history()}`);
    bindClose();
  }

  /* — Raten — */
  function screenGuess() {
    const st = get();
    const g = dd(st);
    const { answer, options } = wordSet(g.pending.key);

    root.innerHTML = shell(`
      <div class="doodle-word"><span class="doodle-kicker">Von ${esc(partner)}</span><b>Was ist das?</b></div>
      <div class="doodle-pad show" data-pad><canvas data-canvas></canvas></div>
      <div class="doodle-options" data-options>
        ${options.map((o) => `<button class="btn btn-line" data-guess="${esc(o)}">${esc(o)}</button>`).join('')}
      </div>
      <button class="btn btn-ghost btn-block" data-replay style="margin-top:6px">Nochmal zeichnen lassen</button>
    `);
    bindClose();

    const pad = root.querySelector('[data-pad]');
    const canvas = root.querySelector('[data-canvas]');
    const cx = canvas.getContext('2d');
    let size = 0;
    const dpr = Math.min(2.5, window.devicePixelRatio || 1);

    function fit() {
      size = Math.max(160, Math.min(pad.clientWidth - 36, pad.clientHeight - 12));
      canvas.width = Math.round(size * dpr);
      canvas.height = Math.round(size * dpr);
      canvas.style.width = canvas.style.height = `${size}px`;
      cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    const onResize = () => { fit(); replay(); };
    window.addEventListener('resize', onResize);
    cleanups.push(() => window.removeEventListener('resize', onResize));

    /** Striche in Originalreihenfolge nachzeichnen — wie beim Zuschauen. */
    function replay() {
      cancelAnimationFrame(raf);
      const strokes = g.pending.strokes;
      const total = strokes.reduce((n, st2) => n + st2.length, 0);
      const perFrame = Math.max(1, Math.round(total / 90));
      let shown = 0;
      const step = () => {
        shown = Math.min(total, shown + perFrame);
        cx.clearRect(0, 0, size, size);
        cx.lineCap = cx.lineJoin = 'round';
        cx.lineWidth = Math.max(3, size * 0.022);
        cx.strokeStyle = '#3A2C21';
        let left = shown;
        for (const st2 of strokes) {
          if (left <= 0) break;
          drawStroke(cx, st2.slice(0, left), size);
          left -= st2.length;
        }
        if (shown < total) raf = requestAnimationFrame(step);
      };
      step();
    }

    fit();
    replay();

    root.querySelector('[data-replay]').onclick = () => { fx('tap'); replay(); };
    root.querySelectorAll('[data-guess]').forEach((b) => {
      b.onclick = () => guess(b.dataset.guess, answer, b);
    });
  }

  function guess(picked, answer, btn) {
    const st = get();
    const g = dd(st);
    const right = picked === answer;
    const id = g.pending?.id;

    g.pending = null;
    g.hist.unshift({ who: 'me', word: answer, right, at: Date.now() });
    if (g.hist.length > 20) g.hist.length = 20;
    if (right) g.hits++;
    st.me.coins += right ? REWARDS.gameWon : REWARDS.gamePlayed;
    addBondXp(st, right ? 8 : 3);
    pushFeed(st, {
      from: 'me', type: 'game', icon: 'gameDoodle',
      text: right ? `„${answer}" richtig erraten` : `„${answer}" nicht erkannt`
    });
    commit('doodle');
    sendEvent('game', { g: 'doodle', kind: 'doodleGuess', id, word: answer, right });

    fx(right ? 'yay' : 'fail');
    if (right) { confetti(['gameDoodle', 'sparkle', 'statJoy']); burst(['sparkle'], { from: btn, count: 8 }); }
    screenResult(right, answer);
  }

  function screenResult(right, answer) {
    root.innerHTML = shell(`
      <div class="game-center">
        <div class="game-hero">${icon(right ? 'trophy' : 'gameDoodle', { size: 68 })}</div>
        <h2 class="game-h">${right ? 'Richtig!' : `Es war „${esc(answer)}"`}</h2>
        <p class="game-p">${right
          ? `Ihr versteht euch auch ohne Worte. ${esc(partner)} erfährt es sofort.`
          : `Knapp daneben. ${esc(partner)} bekommt Bescheid — und du bist jetzt dran mit Malen.`}</p>
        <button class="btn btn-love btn-block" data-draw>Jetzt male ich</button>
        <button class="btn btn-ghost btn-block" data-close>Später</button>
      </div>
      ${history()}`);
    bindClose();
    root.querySelector('[data-draw]').onclick = () => screenDraw();
  }

  function history() {
    const g = dd(get());
    if (!g.hist.length) return '';
    return `<div class="game-scroll">
      <div class="section-label">Bisher</div>
      <div class="list">
        ${g.hist.slice(0, 7).map((h) => `<div class="li">
          <div class="li-ico">${icon(h.right ? 'trophy' : 'gameDoodle', { size: 19 })}</div>
          <div class="grow">
            <div class="li-title">${esc(h.word)}</div>
            <div class="li-sub">${h.who === 'me' ? 'du hast geraten' : `${esc(partner)} hat geraten`} · ${h.right ? 'richtig' : 'daneben'} · ${relTime(h.at)}</div>
          </div>
        </div>`).join('')}
      </div>
    </div>`;
  }

  const g0 = dd(get());
  if (g0.pending?.from === 'them') screenGuess();
  else if (g0.pending?.from === 'me') screenSent(g0.pending.word || '…');
  else screenDraw();

  return () => {
    clearTimeout(timer);
    cancelAnimationFrame(raf);
    cleanups.forEach((f) => f());
  };
}

/** Ein Strich aus 0–99-Koordinaten auf die aktuelle Leinwandgröße malen. */
function drawStroke(cx, pts, size) {
  if (!pts || pts.length === 0) return;
  const S = (v) => (v / 99) * size;
  cx.beginPath();
  cx.moveTo(S(pts[0][0]), S(pts[0][1]));
  if (pts.length === 1) {
    cx.lineTo(S(pts[0][0]) + 0.1, S(pts[0][1]));
  } else {
    for (let i = 1; i < pts.length; i++) cx.lineTo(S(pts[i][0]), S(pts[i][1]));
  }
  cx.stroke();
}
