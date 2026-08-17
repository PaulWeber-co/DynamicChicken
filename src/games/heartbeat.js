/**
 * Herzschlag — du tippst einen Rhythmus, dein Mensch spürt ihn und versucht,
 * ihn nachzutippen.
 *
 * Kein Punkte-Duell im engeren Sinn: Es geht darum, dass etwas von dir
 * ankommt, das keine Nachricht transportieren kann. Die App spielt den
 * Rhythmus mit Ton und Vibration ab.
 */

import { esc } from '../util/dom.js';
import { fx, haptic, burst } from '../util/feedback.js';
import { get, commit } from '../state/store.js';
import { icon } from '../ui/icons.js';
import { pushFeed, addBondXp } from '../state/model.js';
import { REWARDS } from '../state/catalog.js';
import { sendEvent } from '../sync/index.js';
import { relTime } from '../util/time.js';

export const meta = {
  id: 'beat',
  icon: 'gameBeat',
  title: 'Herzschlag',
  tagline: 'Tippe einen Rhythmus — dein Mensch spürt ihn',
  modes: ['async'],
  tone: 'love',
  howto: 'Bis zu acht Taps. Der andere hört und fühlt sie und tippt sie nach.'
};

const MAX_TAPS = 8;
const MIN_TAPS = 3;

function bs(state) {
  if (!state.games.beat) {
    state.games.beat = { pending: null, last: null, scores: [], sent: 0, got: 0 };
  }
  return state.games.beat;
}

/** Rhythmen vergleichen: Tempo egal, Verhältnis zählt. */
export function compare(a, b) {
  const ia = intervals(a), ib = intervals(b);
  if (!ia.length || !ib.length) return 0;
  const n = Math.min(ia.length, ib.length);
  const na = normalize(ia.slice(0, n)), nb = normalize(ib.slice(0, n));
  let err = 0;
  for (let i = 0; i < n; i++) err += Math.abs(na[i] - nb[i]);
  err /= n;
  const countPenalty = Math.abs(ia.length - ib.length) * 14;
  return Math.max(0, Math.min(100, Math.round(100 - err * 210 - countPenalty)));
}

const intervals = (t) => t.slice(1).map((v, i) => v - t[i]);
function normalize(iv) {
  const sum = iv.reduce((s, v) => s + v, 0) || 1;
  return iv.map((v) => v / sum);
}

export function handleRemote(state, msg, { partnerName }) {
  const g = bs(state);

  if (msg.kind === 'beat') {
    g.pending = { from: 'them', taps: msg.taps || [], id: msg.id, at: Date.now() };
    g.got++;
    commit('beat');
    pushFeed(state, { from: 'them', type: 'game', icon: 'gameBeat', text: `${partnerName} hat dir einen Herzschlag geschickt` });
    return {
      kind: 'gameTurn',
      icon: 'gameBeat',
      avatar: 'them',
      title: `${partnerName} schickt einen Herzschlag`,
      sub: `${(msg.taps || []).length} Schläge`,
      body: `${partnerName} hat einen Rhythmus getippt. Hör ihn dir an und versuch, ihn nachzufühlen.`,
      actions: [{ label: 'Anhören', act: 'game:beat', primary: true }, { label: 'Später', act: 'dismiss' }],
      tone: 'love'
    };
  }

  if (msg.kind === 'beatScore') {
    g.last = { role: 'sender', score: msg.score, at: Date.now() };
    g.scores.unshift({ who: 'them', score: msg.score, at: Date.now() });
    if (g.scores.length > 20) g.scores.length = 20;
    addBondXp(state, Math.round(msg.score / 12));
    state.me.coins += REWARDS.gamePlayed;
    commit('beat');
    return {
      kind: 'gameResult',
      icon: msg.score >= 80 ? 'trophy' : 'gameBeat',
      avatar: 'them',
      title: `${msg.score}% getroffen`,
      sub: `${partnerName} hat deinen Herzschlag nachgefühlt`,
      body: msg.score >= 80
        ? `${partnerName} hat deinen Rhythmus zu ${msg.score}% getroffen. Ihr seid im Takt.`
        : `${partnerName} hat deinen Rhythmus zu ${msg.score}% getroffen. Übung macht das Herz.`,
      actions: [{ label: 'Neuen schicken', act: 'game:beat', primary: true }, { label: 'Ok', act: 'dismiss' }],
      tone: 'love'
    };
  }

  return undefined;
}

export function summary(state) {
  const g = bs(state);
  if (g.pending?.from === 'them') return { badge: 'wait', text: 'Ein Herzschlag wartet' };
  if (g.pending?.from === 'me') return { badge: 'off', text: 'Unterwegs zu ihm/ihr' };
  const last = g.scores[0];
  return { badge: null, text: last ? `Zuletzt ${last.score}%` : 'Neu' };
}

/* ── Oberfläche ─────────────────────────────────────────── */

export function mount(root, ctx) {
  const partner = get().partner?.name || 'Dein Mensch';
  let timers = [];
  const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };

  function shell(inner, right = '') {
    return `<div class="game-wrap">
      <div class="game-top">
        <button class="game-x" data-close aria-label="Schließen">${icon('close', { size: 15 })}</button>
        <div class="game-title">Herzschlag</div>
        <div class="game-right">${right}</div>
      </div>
      <div class="game-scroll">${inner}</div>
    </div>`;
  }

  function bind() {
    root.querySelectorAll('[data-close]').forEach((b) => { b.onclick = () => ctx.close(); });
  }

  /** Rhythmus abspielen: Ton + Vibration. */
  function playback(taps, onDone) {
    clearTimers();
    const t0 = taps[0] || 0;
    taps.forEach((t, i) => {
      timers.push(setTimeout(() => {
        fx('cluck');
        haptic(i === 0 ? 26 : 18);
        const h = root.querySelector('[data-pulse]');
        if (h) { h.classList.remove('thump'); void h.offsetWidth; h.classList.add('thump'); }
      }, t - t0));
    });
    timers.push(setTimeout(() => onDone && onDone(), (taps[taps.length - 1] || 0) - t0 + 500));
  }

  /* — Aufnehmen — */
  function screenRecord() {
    const taps = [];
    root.innerHTML = shell(`
      <div class="card game-card center">
        <div class="game-kicker">Für ${esc(partner)}</div>
        <h2 class="game-h">Tipp deinen Herzschlag</h2>
        <p class="game-p">${MIN_TAPS}–${MAX_TAPS} Schläge. So wie du dich gerade fühlst.</p>
        <button class="beat-pad" data-pad data-pulse>
          <span class="beat-heart">${icon('statJoy', { size: 74 })}</span>
        </button>
        <div class="beat-dots" data-dots></div>
        <div class="beat-actions">
          <button class="btn btn-line btn-sm" data-clear>Nochmal</button>
          <button class="btn btn-primary" data-send disabled>Schicken</button>
        </div>
      </div>
      ${history()}
    `);
    bind();

    const pad = root.querySelector('[data-pad]');
    const dots = root.querySelector('[data-dots]');
    const send = root.querySelector('[data-send]');
    let t0 = 0;

    const draw = () => {
      dots.innerHTML = taps.map((t, i) =>
        `<span class="beat-dot" style="animation-delay:${i * 40}ms"></span>`).join('');
      send.disabled = taps.length < MIN_TAPS;
    };

    pad.onpointerdown = (e) => {
      e.preventDefault();
      if (taps.length >= MAX_TAPS) return;
      const now = performance.now();
      if (!taps.length) t0 = now;
      taps.push(Math.round(now - t0));
      pad.classList.remove('thump'); void pad.offsetWidth; pad.classList.add('thump');
      fx('cluck'); haptic(16);
      draw();
    };

    root.querySelector('[data-clear]').onclick = () => { taps.length = 0; draw(); fx('tap'); };

    send.onclick = () => {
      const state = get();
      const g = bs(state);
      const id = `${Date.now().toString(36)}`;
      g.pending = { from: 'me', taps: taps.slice(), id, at: Date.now() };
      g.sent++;
      addBondXp(state, 4);
      pushFeed(state, { from: 'me', type: 'game', icon: 'gameBeat', text: `Herzschlag an ${partner} geschickt` });
      commit('beat');
      sendEvent('game', { g: 'beat', kind: 'beat', id, taps: taps.slice() });
      fx('love');
      burst(['statJoy', 'gameBeat'], { from: send, count: 8 });
      screenSent();
    };
  }

  function screenSent() {
    root.innerHTML = shell(`
      <div class="card game-card center">
        <div class="game-hero">${icon('dove', { size: 68 })}</div>
        <h2 class="game-h">Unterwegs</h2>
        <p class="game-p">${esc(partner)} bekommt deinen Herzschlag beim nächsten Öffnen. Dann versucht er/sie, ihn nachzufühlen — und du erfährst, wie nah es war.</p>
        <button class="btn btn-ghost btn-block" data-close>Fertig</button>
      </div>
      ${history()}`);
    bind();
  }

  /* — Anhören & nachtippen — */
  function screenListen() {
    const g = bs(get());
    let plays = 0;
    root.innerHTML = shell(`
      <div class="card game-card center">
        <div class="game-kicker">Von ${esc(partner)}</div>
        <h2 class="game-h">Hör hin</h2>
        <p class="game-p">${g.pending.taps.length} Schläge. Du darfst zweimal hören, dann tippst du sie nach.</p>
        <div class="beat-pad listen" data-pulse><span class="beat-heart">${icon('gameBeat', { size: 74 })}</span></div>
        <button class="btn btn-primary btn-block" data-listen>Abspielen</button>
        <button class="btn btn-line btn-block" data-try disabled>Ich bin bereit</button>
      </div>`);
    bind();

    const bListen = root.querySelector('[data-listen]');
    const bTry = root.querySelector('[data-try]');
    bListen.onclick = () => {
      plays++;
      bListen.disabled = true;
      playback(g.pending.taps, () => {
        bTry.disabled = false;
        if (plays >= 2) { bListen.disabled = true; bListen.textContent = 'Genug gehört'; }
        else { bListen.disabled = false; bListen.textContent = `Nochmal (${2 - plays} übrig)`; }
      });
    };
    bTry.onclick = () => screenRepeat(g.pending);
  }

  function screenRepeat(pending) {
    const taps = [];
    root.innerHTML = shell(`
      <div class="card game-card center">
        <div class="game-kicker">Jetzt du</div>
        <h2 class="game-h">Tipp nach</h2>
        <p class="game-p">Vertrau deinem Gefühl, nicht deinem Kopf.</p>
        <button class="beat-pad" data-pad data-pulse><span class="beat-heart">${icon('gameBeat', { size: 74 })}</span></button>
        <div class="beat-dots" data-dots></div>
        <button class="btn btn-primary btn-block" data-done disabled>Fertig</button>
      </div>`);
    bind();

    const pad = root.querySelector('[data-pad]');
    const dots = root.querySelector('[data-dots]');
    const done = root.querySelector('[data-done]');
    let t0 = 0;

    pad.onpointerdown = (e) => {
      e.preventDefault();
      if (taps.length >= MAX_TAPS + 2) return;
      const now = performance.now();
      if (!taps.length) t0 = now;
      taps.push(Math.round(now - t0));
      pad.classList.remove('thump'); void pad.offsetWidth; pad.classList.add('thump');
      fx('cluck'); haptic(16);
      dots.innerHTML = taps.map(() => '<span class="beat-dot"></span>').join('');
      done.disabled = taps.length < 2;
    };

    done.onclick = () => {
      const score = compare(pending.taps, taps);
      const state = get();
      const g = bs(state);
      g.pending = null;
      g.scores.unshift({ who: 'me', score, at: Date.now() });
      if (g.scores.length > 20) g.scores.length = 20;
      state.me.coins += score >= 70 ? REWARDS.gameWon : REWARDS.gamePlayed;
      addBondXp(state, Math.round(score / 12));
      pushFeed(state, { from: 'me', type: 'game', icon: 'gameBeat', text: `Herzschlag zu ${score}% nachgefühlt` });
      commit('beat');
      sendEvent('game', { g: 'beat', kind: 'beatScore', id: pending.id, score });
      fx(score >= 70 ? 'yay' : 'pop');
      screenScore(score);
    };
  }

  function screenScore(score) {
    const line = score >= 92 ? 'Das war fast schon unheimlich.'
      : score >= 75 ? 'Ihr seid ziemlich im Takt.'
      : score >= 50 ? 'Nah dran. Der Rhythmus wohnt in euch.'
      : 'Anderer Takt, gleiches Herz.';
    root.innerHTML = shell(`
      <div class="card game-card center">
        <div class="beat-score">${score}<small>%</small></div>
        <h2 class="game-h">${line}</h2>
        <p class="game-p">${esc(partner)} bekommt dein Ergebnis. Möchtest du jetzt einen eigenen Rhythmus zurückschicken?</p>
        <button class="btn btn-love btn-block" data-record>Meinen schicken</button>
        <button class="btn btn-ghost btn-block" data-close>Später</button>
      </div>
      ${history()}`);
    bind();
    root.querySelector('[data-record]').onclick = () => screenRecord();
  }

  function history() {
    const g = bs(get());
    if (!g.scores.length) return '';
    return `<div class="section-label">Bisher</div>
      <div class="list">
        ${g.scores.slice(0, 6).map((s) => `<div class="li">
          <div class="li-ico">${icon(s.score >= 80 ? 'trophy' : 'gameBeat', { size: 19 })}</div>
          <div class="grow">
            <div class="li-title">${s.score}% getroffen</div>
            <div class="li-sub">${s.who === 'me' ? 'du hast nachgefühlt' : `${esc(partner)} hat nachgefühlt`} · ${relTime(s.at)}</div>
          </div>
        </div>`).join('')}
      </div>`;
  }

  const g = bs(get());
  if (g.pending?.from === 'them') screenListen();
  else if (g.pending?.from === 'me') screenSent();
  else screenRecord();

  return () => clearTimers();
}
