/**
 * Farbfunk — ein Wort, ein Farbfeld, zwei Köpfe.
 *
 * Einer bekommt eine Farbe aus dem Raster und darf genau ein Wort dazu
 * sagen. Der andere sucht die Farbe. Je näher der Tipp liegt, desto mehr
 * Punkte gibt es — für beide, denn ein guter Hinweis ist genauso viel wert
 * wie ein guter Tipp.
 *
 * Warum das für eine Fernbeziehung taugt: Es geht nicht um Reaktion oder
 * Geschick, sondern darum, ob ihr ähnlich denkt. „Herbst“ landet bei euch
 * beiden irgendwo im selben Eck — oder eben nicht, und dann habt ihr etwas
 * zu bereden.
 *
 * Wer dran ist, wechselt nach jeder Runde. Das Raster ist aus dem
 * Rundenschlüssel gebaut, beide sehen also exakt dieselben Farben.
 */

import { rng } from '../util/rng.js';
import { esc } from '../util/dom.js';
import { fx, burst, confetti } from '../util/feedback.js';
import { get, commit } from '../state/store.js';
import { icon } from '../ui/icons.js';
import { pushFeed, addBondXp } from '../state/model.js';
import { REWARDS } from '../state/catalog.js';
import { sendEvent } from '../sync/index.js';
import { relTime } from '../util/time.js';
import { toast } from '../ui/toast.js';
import { seedFor } from './index.js';

export const meta = {
  id: 'hue',
  icon: 'palette',
  title: 'Farbfunk',
  tagline: 'Ein Wort, eine Farbe, findest du sie?',
  modes: ['async'],
  tone: 'calm',
  howto: 'Einer nennt ein einziges Wort zu einer Farbe, der andere sucht sie im Raster.'
};

const COLS = 8;
const ROWS = 6;

/* ── Das Raster ─────────────────────────────────────────── */

/**
 * Farbverlauf über Ton und Helligkeit, mit einem aus dem Seed gedrehten
 * Startwinkel. Dadurch sieht jede Runde anders aus, bleibt aber auf beiden
 * Geräten identisch — und benachbarte Felder ähneln sich, sonst wäre ein
 * knapper Tipp nicht besser als ein weiter danebener.
 */
export function grid(seed) {
  const r = rng(seed);
  const shift = Math.floor(r() * 360);
  const cells = [];
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const hue = (shift + (x / COLS) * 360) % 360;
      const light = 78 - (y / (ROWS - 1)) * 46;
      const sat = 52 + (1 - Math.abs(y / (ROWS - 1) - 0.45) * 2) * 34;
      cells.push(`hsl(${hue.toFixed(0)} ${sat.toFixed(0)}% ${light.toFixed(0)}%)`);
    }
  }
  return cells;
}

const idxOf = (x, y) => y * COLS + x;
const posOf = (i) => ({ x: i % COLS, y: Math.floor(i / COLS) });

/** Abstand in Feldern — schräg zählt wie gerade, das reicht hier. */
function distance(a, b) {
  const p = posOf(a), q = posOf(b);
  return Math.max(Math.abs(p.x - q.x), Math.abs(p.y - q.y));
}

/** 0 Felder daneben = 10 Punkte, danach fallend. */
export function pointsFor(dist) {
  return Math.max(0, 10 - dist * 2);
}

function verdictFor(dist) {
  if (dist === 0) return 'Volltreffer. Ihr denkt in derselben Farbe.';
  if (dist === 1) return 'Direkt daneben — das war fast perfekt.';
  if (dist === 2) return 'Nah dran.';
  if (dist <= 4) return 'Die Richtung stimmte immerhin.';
  return 'Völlig anderes Eck. Erzähl mal, wie du darauf kommst.';
}

/* ── Zustand ────────────────────────────────────────────── */

function hg(state) {
  if (!state.games.hue) {
    state.games.hue = {
      r: 1,
      /** Wer gibt in dieser Runde den Hinweis: 'me' oder 'them' */
      turn: null,
      /** Laufende Runde: { target, clue, guess } */
      cur: null,
      score: { me: 0, them: 0 },
      hist: [],
      at: 0
    };
  }
  const g = state.games.hue;
  g.score ||= { me: 0, them: 0 };
  g.hist ||= [];
  // Wer anfängt, hängt am Paar-Code — sonst wollten beide gleichzeitig geben
  if (!g.turn) g.turn = (state.me.code || '') < (state.partner?.code || '~') ? 'me' : 'them';
  return g;
}

function closeRound(state, g, dist, partnerName) {
  const pts = pointsFor(dist);
  // Beide bekommen dieselben Punkte: guter Hinweis, guter Tipp
  g.score.me += pts;
  g.score.them += pts;
  g.hist.unshift({
    r: g.r, clue: g.cur.clue, dist, pts,
    gave: g.turn === 'me' ? 'me' : 'them',
    at: Date.now()
  });
  if (g.hist.length > 20) g.hist.length = 20;

  state.me.coins += pts >= 8 ? REWARDS.gameWon : REWARDS.gamePlayed;
  addBondXp(state, 4 + Math.round(pts / 3));
  pushFeed(state, {
    from: 'system', type: 'game', icon: 'palette',
    text: `Farbfunk „${g.cur.clue}“: ${dist === 0 ? 'Volltreffer' : `${dist} daneben`} · ${pts} Punkte`
  });

  g.r++;
  g.turn = g.turn === 'me' ? 'them' : 'me';   // abwechselnd geben
  g.cur = null;
  return pts;
}

/* ── Netzwerk ───────────────────────────────────────────── */

export function handleRemote(state, msg, { partnerName }) {
  if (msg.kind !== 'hueClue' && msg.kind !== 'hueGuess') return undefined;
  const g = hg(state);

  if (msg.kind === 'hueClue') {
    // Der andere hat einen Hinweis gegeben — ab hier bin ich am Raten
    if (msg.r < g.r) return null;
    g.r = msg.r;
    g.turn = 'them';
    g.cur = { target: msg.target, clue: String(msg.clue || '').slice(0, 24), guess: null };
    commit('hue');
    return {
      kind: 'gameTurn',
      icon: 'palette',
      avatar: 'them',
      title: `${partnerName} funkt: „${g.cur.clue}“`,
      sub: 'Welche Farbe ist gemeint?',
      body: `${partnerName} hat eine Farbe im Kopf und nur ein Wort dazu gesagt: „${g.cur.clue}“.`,
      actions: [{ label: 'Suchen', act: 'game:hue', primary: true }, { label: 'Später', act: 'dismiss' }],
      tone: 'warm'
    };
  }

  // Antwort auf meinen Hinweis
  if (!g.cur || g.cur.guess != null) return null;
  g.cur.guess = msg.guess;
  const dist = distance(g.cur.target, msg.guess);
  const clue = g.cur.clue;
  const pts = closeRound(state, g, dist, partnerName);
  commit('hue');

  return {
    kind: 'gameResult',
    icon: dist === 0 ? 'trophy' : 'palette',
    avatar: 'them',
    title: dist === 0 ? 'Volltreffer!' : `${dist} Felder daneben`,
    sub: `„${clue}“ · ${pts} Punkte`,
    body: `${partnerName} hat auf dein „${clue}“ getippt. ${verdictFor(dist)}`,
    actions: [{ label: 'Weiter', act: 'game:hue', primary: true }, { label: 'Ok', act: 'dismiss' }],
    tone: dist <= 1 ? 'warm' : 'calm'
  };
}

export function summary(state) {
  const g = hg(state);
  if (g.cur && g.turn === 'them' && g.cur.guess == null) {
    return { badge: 'wait', text: `„${g.cur.clue}“ — du suchst` };
  }
  if (g.cur && g.turn === 'me') return { badge: 'off', text: 'Wartet auf den Tipp' };
  if (g.turn === 'me') return { badge: 'wait', text: 'Du gibst den Hinweis' };
  return g.hist.length
    ? { badge: null, text: `${g.score.me} Punkte zusammen` }
    : { badge: null, text: 'Neu' };
}

/* ── Oberfläche ─────────────────────────────────────────── */

export function mount(root, ctx) {
  const partner = get().partner?.name || 'Dein Mensch';

  const shell = (inner) => `
    <div class="game-wrap">
      <div class="game-top">
        <button class="game-x" data-close aria-label="Schließen">${icon('close', { size: 15 })}</button>
        <div class="game-title">Farbfunk</div>
        <div class="game-right"><span class="badge">${hg(get()).score.me}</span></div>
      </div>
      <div class="game-scroll">${inner}</div>
    </div>`;

  const bindClose = () => root.querySelectorAll('[data-close]').forEach((b) => { b.onclick = () => ctx.close(); });

  function cells(seed) { return grid(seed); }

  /** Das Raster als Knöpfe; markiert wird höchstens ein Feld. */
  function board(colors, { pick = null, target = null, guess = null, clickable = false }) {
    return `<div class="hue-grid ${clickable ? 'pickable' : ''}" data-grid>
      ${colors.map((c, i) => {
        const marks = [];
        if (target === i) marks.push('<i class="hue-target"></i>');
        if (guess === i) marks.push('<i class="hue-guess"></i>');
        if (pick === i) marks.push('<i class="hue-pick"></i>');
        return `<button class="hue-cell" style="background:${c}" data-i="${i}"
          ${clickable ? '' : 'disabled'} aria-label="Feld ${i + 1}">${marks.join('')}</button>`;
      }).join('')}
    </div>`;
  }

  /* — Ich gebe den Hinweis — */
  function screenClue() {
    const st = get();
    const g = hg(st);
    const colors = cells(seedFor('hue', g.r, st));
    // Das Zielfeld ist aus demselben Seed gezogen, aber erst nach dem
    // Hinweis für den anderen sichtbar
    const target = Math.floor(rng(seedFor('hue', `t${g.r}`, st))() * colors.length);
    let clue = '';

    root.innerHTML = shell(`
      <div class="hue-lead">
        <span class="doodle-kicker">Runde ${g.r} · du funkst</span>
        <b>Ein Wort für diese Farbe</b>
      </div>
      <div class="hue-target-swatch" style="background:${colors[target]}">
        ${icon('palette', { size: 26 })}
      </div>
      ${board(colors, { target, clickable: false })}
      <input class="input" data-clue maxlength="22" placeholder="Ein einziges Wort" autocomplete="off">
      <p class="tiny muted" style="margin:10px 4px">
        Kein Farbname, keine Zahlen — sonst wäre es zu leicht. „Herbst“, „Oma“, „Meer“.
      </p>
      <button class="btn btn-primary btn-block" data-send>Funken</button>`);

    const inp = root.querySelector('[data-clue]');
    inp.focus();
    root.querySelector('[data-send]').onclick = () => {
      clue = inp.value.trim();
      if (!clue) { toast('Ein Wort brauchen wir'); return; }
      if (/\s/.test(clue)) { toast('Nur ein einziges Wort'); return; }
      const st2 = get();
      const g2 = hg(st2);
      g2.cur = { target, clue, guess: null };
      g2.turn = 'me';
      commit('hue');
      sendEvent('game', { g: 'hue', kind: 'hueClue', r: g2.r, target, clue });
      fx('pop');
      screenWait();
    };
    bindClose();
  }

  /* — Warten auf den Tipp — */
  function screenWait() {
    const g = hg(get());
    root.innerHTML = shell(`
      <div class="game-center">
        <div class="game-hero">${icon('dove', { size: 68 })}</div>
        <h2 class="game-h">„${esc(g.cur?.clue || '')}“ ist unterwegs</h2>
        <p class="game-p">${esc(partner)} sucht jetzt deine Farbe. Du erfährst, wie nah der Tipp war.</p>
        <button class="btn btn-ghost btn-block" data-close>Fertig</button>
      </div>
      ${history()}`);
    bindClose();
  }

  /* — Ich suche — */
  function screenGuess() {
    const st = get();
    const g = hg(st);
    const colors = cells(seedFor('hue', g.r, st));
    let pick = null;

    const draw = () => {
      root.innerHTML = shell(`
        <div class="hue-lead">
          <span class="doodle-kicker">Von ${esc(partner)}</span>
          <b>„${esc(g.cur.clue)}“</b>
        </div>
        <p class="tiny muted center" style="margin:0 0 12px">Welche Farbe ist gemeint?</p>
        ${board(colors, { pick, clickable: true })}
        <button class="btn btn-love btn-block" data-send ${pick == null ? 'disabled' : ''}>
          ${pick == null ? 'Feld antippen' : 'Das ist es'}
        </button>`);

      root.querySelectorAll('.hue-cell').forEach((b) => {
        b.onclick = () => { pick = Number(b.dataset.i); fx('tap'); draw(); };
      });
      const send = root.querySelector('[data-send]');
      if (send) send.onclick = () => submit(pick);
      bindClose();
    };
    draw();
  }

  function submit(pick) {
    const st = get();
    const g = hg(st);
    if (pick == null || !g.cur) return;
    const target = g.cur.target;
    const clue = g.cur.clue;
    const dist = distance(target, pick);
    g.cur.guess = pick;
    const pts = closeRound(st, g, dist, partner);
    commit('hue');
    sendEvent('game', { g: 'hue', kind: 'hueGuess', r: g.r - 1, guess: pick });

    fx(dist === 0 ? 'yay' : dist <= 2 ? 'pop' : 'fail');
    if (dist === 0) confetti(['palette', 'sparkle', 'trophy']);
    screenResult({ target, pick, dist, pts, clue });
  }

  function screenResult({ target, pick, dist, pts, clue }) {
    const st = get();
    // Das Raster der gerade beendeten Runde
    const colors = cells(seedFor('hue', hg(st).r - 1, st));
    root.innerHTML = shell(`
      <div class="game-center">
        <div class="game-hero">${icon(dist === 0 ? 'trophy' : 'palette', { size: 62 })}</div>
        <h2 class="game-h">${dist === 0 ? 'Volltreffer!' : `${dist} ${dist === 1 ? 'Feld' : 'Felder'} daneben`}</h2>
        <p class="game-p">„${esc(clue)}“ · +${pts} Punkte für euch beide</p>
      </div>
      ${board(colors, { target, guess: pick, clickable: false })}
      <div class="hue-legend">
        <span><i class="hue-target"></i> gemeint</span>
        <span><i class="hue-guess"></i> getippt</span>
      </div>
      <div class="rate-verdict">${esc(verdictFor(dist))}</div>
      <button class="btn btn-primary btn-block" data-next style="margin-top:12px">Weiter</button>
      ${history()}`);
    root.querySelector('[data-next]').onclick = () => route();
    bindClose();
  }

  function history() {
    const g = hg(get());
    if (!g.hist.length) return '';
    return `<div class="section-label">Bisher</div>
      <div class="list">
        ${g.hist.slice(0, 8).map((h) => `<div class="li">
          <div class="li-ico">${icon(h.dist === 0 ? 'trophy' : 'palette', { size: 19 })}</div>
          <div class="grow">
            <div class="li-title">„${esc(h.clue)}“</div>
            <div class="li-sub">${h.gave === 'me' ? 'du hast gefunkt' : `${esc(partner)} hat gefunkt`}
              · ${h.dist === 0 ? 'Volltreffer' : `${h.dist} daneben`} · ${h.pts} Punkte · ${relTime(h.at)}</div>
          </div>
        </div>`).join('')}
      </div>`;
  }

  function route() {
    const g = hg(get());
    if (g.cur && g.cur.guess == null && g.turn === 'them') screenGuess();
    else if (g.cur && g.turn === 'me') screenWait();
    else if (g.turn === 'me') screenClue();
    else screenIdle();
  }

  function screenIdle() {
    root.innerHTML = shell(`
      <div class="game-center">
        <div class="game-hero">${icon('palette', { size: 68 })}</div>
        <h2 class="game-h">${esc(partner)} ist dran</h2>
        <p class="game-p">Der nächste Hinweis kommt von drüben. Sobald er da ist, wirst du gefragt.</p>
        <button class="btn btn-ghost btn-block" data-close>Fertig</button>
      </div>
      ${history()}`);
    bindClose();
  }

  route();
  return () => {};
}
