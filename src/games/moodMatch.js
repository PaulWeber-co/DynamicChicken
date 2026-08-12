/**
 * Gefühls-Duett — wie gut kennt ihr euch heute?
 *
 * Beide sagen (geheim), wie sie sich fühlen, und raten, wie der andere sich
 * fühlt. Aufgedeckt wird erst, wenn beide dran waren. Punkte gibt es fürs
 * richtige Raten — aber eigentlich gewinnt man hier ein Gespräch.
 */

import { esc } from '../util/dom.js';
import { fx, confetti, burst } from '../util/feedback.js';
import { get, commit } from '../state/store.js';
import { pushFeed, addBondXp } from '../state/model.js';
import { REWARDS } from '../state/catalog.js';
import { MOODS, moodByKey } from '../pet/moods.js';
import { sendEvent } from '../sync/index.js';
import { dayKey, relTime } from '../util/time.js';

export const meta = {
  id: 'duett',
  emoji: '🎭',
  title: 'Gefühls-Duett',
  tagline: 'Rate, wie es dem anderen geht',
  modes: ['async'],
  tone: 'love',
  howto: 'Beide wählen ihr eigenes Gefühl und tippen das des anderen. Aufgedeckt wird gemeinsam.'
};

function mm(state) {
  if (!state.games.duett) {
    state.games.duett = { day: null, mine: null, theirs: null, revealed: false, hist: [], hits: 0, rounds: 0 };
  }
  const g = state.games.duett;
  const today = dayKey();
  if (g.day !== today) {
    if (g.mine || g.theirs) archive(g);
    g.day = today; g.mine = null; g.theirs = null; g.revealed = false;
  }
  return g;
}

function archive(g) {
  if (!g.mine || !g.theirs) return;
  g.hist.unshift({
    day: g.day,
    mine: g.mine, theirs: g.theirs,
    iGuessedRight: g.mine.guess === g.theirs.actual,
    theyGuessedRight: g.theirs.guess === g.mine.actual,
    at: Date.now()
  });
  if (g.hist.length > 30) g.hist.length = 30;
}

/**
 * Hinweis zur Fairness: Beide Hälften einer Antwort reisen zusammen, weil
 * ein zweiter Austausch den Brieftauben-Modus verdoppeln würde. Der
 * empfangende Client hält die Antwort zurück, bis auch du geantwortet hast.
 * Für ein Paar ist das die richtige Menge Vertrauen.
 */
function tryReveal(state, g) {
  if (!g.mine || !g.theirs || g.revealed) return null;
  g.revealed = true;
  g.rounds++;
  const iRight = g.mine.guess === g.theirs.actual;
  const theyRight = g.theirs.guess === g.mine.actual;
  if (iRight) g.hits++;

  let coins = REWARDS.gamePlayed;
  if (iRight) coins += REWARDS.gameWon;
  if (iRight && theyRight) coins += 10;
  state.me.coins += coins;
  addBondXp(state, iRight && theyRight ? 12 : iRight || theyRight ? 7 : 4);

  pushFeed(state, {
    from: 'system', type: 'game', emoji: '🎭',
    text: iRight && theyRight ? 'Gefühls-Duett: ihr habt euch beide erraten'
      : iRight ? 'Gefühls-Duett: du lagst richtig'
      : theyRight ? 'Gefühls-Duett: er/sie lag richtig'
      : 'Gefühls-Duett: heute lagt ihr beide daneben'
  });

  return { iRight, theyRight, coins };
}

export function handleRemote(state, msg, { partnerName }) {
  if (msg.kind !== 'duett') return undefined;
  const g = mm(state);
  if (msg.day !== g.day) {
    // Antwort aus einem anderen Tag: als eigenen Tag übernehmen
    archive(g);
    g.day = msg.day; g.mine = null; g.theirs = null; g.revealed = false;
  }
  g.theirs = { actual: msg.actual, guess: msg.guess, at: Date.now() };
  const rev = tryReveal(state, g);
  commit('duett');

  if (rev) {
    return {
      kind: 'gameResult',
      emoji: rev.iRight ? '🎯' : '🎭',
      title: rev.iRight ? 'Du hast ihn/sie richtig gelesen' : 'Aufgedeckt',
      sub: `${partnerName} fühlt sich ${moodByKey(g.theirs.actual)?.label.toLowerCase() || '…'}`,
      body: `Gefühls-Duett aufgedeckt. ${partnerName} fühlt sich ${moodByKey(g.theirs.actual)?.label.toLowerCase() || '…'}${rev.theyRight ? ' — und hat dich auch richtig erraten.' : '.'}`,
      actions: [{ label: 'Ansehen', act: 'game:duett', primary: true }],
      tone: 'love'
    };
  }

  return {
    kind: 'gameTurn',
    emoji: '🎭',
    title: `${partnerName} hat getippt`,
    sub: 'Gefühls-Duett wartet auf dich',
    body: `${partnerName} hat verraten, wie es ihm/ihr geht — und geraten, wie es dir geht. Sichtbar wird beides, sobald du dran warst.`,
    actions: [{ label: 'Mitmachen', act: 'game:duett', primary: true }, { label: 'Später', act: 'dismiss' }],
    tone: 'love'
  };
}

export function summary(state) {
  const g = mm(state);
  if (g.revealed) return { badge: null, text: `Heute erledigt · ${g.hits}/${g.rounds} getroffen` };
  if (g.theirs && !g.mine) return { badge: 'wait', text: 'Du bist dran' };
  if (g.mine && !g.theirs) return { badge: 'off', text: 'Wartet auf Antwort' };
  return { badge: 'wait', text: 'Heute noch offen' };
}

/* ── Oberfläche ─────────────────────────────────────────── */

export function mount(root, ctx) {
  const partner = get().partner?.name || 'Dein Mensch';
  let actual = null, guess = null;

  function shell(inner) {
    return `<div class="game-wrap">
      <div class="game-top">
        <button class="game-x" data-close aria-label="Schließen">✕</button>
        <div class="game-title">🎭 Gefühls-Duett</div>
        <div class="game-right"></div>
      </div>
      <div class="game-scroll">${inner}</div>
    </div>`;
  }
  const bind = () => root.querySelectorAll('[data-close]').forEach((b) => { b.onclick = () => ctx.close(); });

  function moodGrid(name, selected) {
    return `<div class="mood-grid">
      ${MOODS.map((m) => `<button class="mood-cell ${selected === m.key ? 'on' : ''}" data-${name}="${m.key}">
        <span class="mood-e">${m.emoji}</span><span class="mood-l">${m.label}</span>
      </button>`).join('')}
    </div>`;
  }

  function screenPlay() {
    const g = mm(get());
    root.innerHTML = shell(`
      <div class="card game-card">
        <div class="game-kicker">Schritt 1</div>
        <h2 class="game-h">Wie geht es dir wirklich?</h2>
        <p class="game-p">Niemand sieht das, bis ihr beide dran wart.</p>
        ${moodGrid('actual', actual)}
      </div>
      <div class="card game-card">
        <div class="game-kicker">Schritt 2</div>
        <h2 class="game-h">Und wie geht es ${esc(partner)}?</h2>
        <p class="game-p">${g.theirs ? `${esc(partner)} hat schon getippt.` : 'Dein Bauchgefühl reicht.'}</p>
        ${moodGrid('guess', guess)}
      </div>
      <button class="btn btn-love btn-block" data-submit ${actual && guess ? '' : 'disabled'}>Abschicken</button>
      ${history()}
    `);
    bind();

    root.querySelectorAll('[data-actual]').forEach((b) => {
      b.onclick = () => { actual = b.dataset.actual; fx('tap'); screenPlay(); };
    });
    root.querySelectorAll('[data-guess]').forEach((b) => {
      b.onclick = () => { guess = b.dataset.guess; fx('tap'); screenPlay(); };
    });
    const s = root.querySelector('[data-submit]');
    if (s) s.onclick = submit;
  }

  function submit() {
    const state = get();
    const g = mm(state);
    g.mine = { actual, guess, at: Date.now() };
    // Das eigene Gefühl gilt auch als Stimmung fürs Profil
    state.me.mood = { key: actual, note: state.me.mood?.note || '', at: Date.now() };
    const rev = tryReveal(state, g);
    commit('duett');
    sendEvent('game', { g: 'duett', kind: 'duett', day: g.day, actual, guess });
    sendEvent('mood', { key: actual, note: '' });
    fx('love');
    if (rev) screenReveal(rev); else screenWaiting();
  }

  function screenWaiting() {
    root.innerHTML = shell(`
      <div class="card game-card center">
        <div class="game-hero">🎭</div>
        <h2 class="game-h">Verdeckt abgelegt</h2>
        <p class="game-p">Sobald ${esc(partner)} auch geantwortet hat, klappt bei euch beiden gleichzeitig alles auf.</p>
        <button class="btn btn-ghost btn-block" data-close>Fertig</button>
      </div>
      ${history()}`);
    bind();
  }

  function screenReveal(rev) {
    const g = mm(get());
    const mMine = moodByKey(g.mine.actual), mTheirs = moodByKey(g.theirs.actual);
    const mMyGuess = moodByKey(g.mine.guess), mTheirGuess = moodByKey(g.theirs.guess);
    if (rev?.iRight && rev?.theyRight) confetti(['🎯', '💗', '✨']);

    root.innerHTML = shell(`
      <div class="card game-card center">
        <div class="game-hero">${rev?.iRight && rev?.theyRight ? '🎯' : rev?.iRight || rev?.theyRight ? '💛' : '🎭'}</div>
        <h2 class="game-h">${rev?.iRight && rev?.theyRight ? 'Ihr habt euch beide gelesen'
          : rev?.iRight ? 'Du lagst richtig'
          : rev?.theyRight ? `${esc(partner)} lag richtig`
          : 'Heute lagt ihr beide daneben'}</h2>
        <p class="game-p">Und genau darüber lohnt es sich jetzt zu reden.</p>
      </div>

      <div class="duett-cards">
        <div class="card duett-card">
          <div class="duett-who">Du fühlst dich</div>
          <div class="duett-e">${mMine?.emoji || '❓'}</div>
          <div class="duett-l">${esc(mMine?.label || '—')}</div>
          <div class="duett-guess ${g.theirs.guess === g.mine.actual ? 'hit' : ''}">
            ${esc(partner)} tippte: ${mTheirGuess?.emoji || '❓'} ${esc(mTheirGuess?.label || '—')}
          </div>
        </div>
        <div class="card duett-card">
          <div class="duett-who">${esc(partner)} fühlt sich</div>
          <div class="duett-e">${mTheirs?.emoji || '❓'}</div>
          <div class="duett-l">${esc(mTheirs?.label || '—')}</div>
          <div class="duett-guess ${g.mine.guess === g.theirs.actual ? 'hit' : ''}">
            Du tipptest: ${mMyGuess?.emoji || '❓'} ${esc(mMyGuess?.label || '—')}
          </div>
        </div>
      </div>

      <button class="btn btn-love btn-block" data-talk>${esc(partner)} knuddeln</button>
      <button class="btn btn-ghost btn-block" data-close>Fertig</button>
      ${history()}`);
    bind();
    const t = root.querySelector('[data-talk]');
    if (t) t.onclick = () => {
      sendEvent('nudge', { key: 'knuddel' });
      burst(['🫂', '💗'], { from: t, count: 8 });
      fx('love');
      t.textContent = 'Geknuddelt 💗';
      t.disabled = true;
    };
  }

  function history() {
    const g = mm(get());
    if (!g.hist.length) return '';
    return `<div class="section-label">Frühere Tage</div>
      <div class="list">
        ${g.hist.slice(0, 7).map((h) => `<div class="li">
          <div class="li-ico">${h.iGuessedRight && h.theyGuessedRight ? '🎯' : h.iGuessedRight || h.theyGuessedRight ? '💛' : '🎭'}</div>
          <div class="grow">
            <div class="li-title">${moodByKey(h.mine.actual)?.emoji || '·'} du · ${moodByKey(h.theirs.actual)?.emoji || '·'} ${esc(partner)}</div>
            <div class="li-sub">${relTime(h.at)}</div>
          </div>
        </div>`).join('')}
      </div>`;
  }

  const g0 = mm(get());
  if (g0.revealed) screenReveal(null);
  else if (g0.mine) screenWaiting();
  else screenPlay();

  return () => {};
}
