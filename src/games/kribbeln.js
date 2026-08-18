/**
 * Kribbeln — sechs Karten, zwei heimliche Meinungen, nur die Treffer zählen.
 *
 * Jede Runde legt die App sechs Wünsche auf den Tisch. Beide kreuzen für
 * sich an: Ja, Vielleicht oder Nein. Aufgedeckt wird ausschließlich, wo ihr
 * euch trefft — was einer weglässt, taucht nirgends auf. Kein „X wollte
 * nicht“, keine Liste der Absagen, keine Rechtfertigung.
 *
 * Genau darin liegt der Reiz. Man kann etwas ankreuzen, das man sich nie
 * getraut hätte auszusprechen, ohne etwas zu riskieren: Sagt der andere
 * Nein, hat man es nie gesagt. Sagt der andere Ja, steht es plötzlich auf
 * eurer gemeinsamen Liste.
 *
 * Drei Hitzegrade, und jeder mischt die milderen mit — auch die heißeste
 * Runde fängt harmlos an. Die oberste Stufe gibt es nur, wenn die freizügigen
 * Inhalte unter „Mehr“ eingeschaltet sind; sonst taucht sie gar nicht auf.
 *
 * Ehrlich bleibt zu sagen: Die Kreuze reisen zum anderen Gerät, damit dort
 * dieselbe Auswertung herauskommt. Die App zeigt sie nicht — wer in den
 * Browser-Speicher schaut, sieht sie trotzdem. Ohne Server ginge es nicht
 * anders, und es gilt für jedes Spiel hier.
 */

import { rng } from '../util/rng.js';
import { esc } from '../util/dom.js';
import { fx, burst, confetti } from '../util/feedback.js';
import { get, commit, subscribe } from '../state/store.js';
import { icon } from '../ui/icons.js';
import { pushFeed, addBondXp } from '../state/model.js';
import { REWARDS } from '../state/catalog.js';
import { sendEvent } from '../sync/index.js';
import { relTime } from '../util/time.js';
import { toast } from '../ui/toast.js';
import { seedFor } from './index.js';

export const meta = {
  id: 'krib',
  icon: 'gameSpark',
  title: 'Kribbeln',
  tagline: 'Beide kreuzen heimlich an — aufgedeckt wird nur, was passt',
  modes: ['async'],
  tone: 'love',
  howto: 'Sechs Wünsche, beide sagen heimlich Ja, Vielleicht oder Nein. Sichtbar wird nur, wo ihr euch trefft.'
};

/* ── Die Karten ─────────────────────────────────────────── */

export const CARDS = {
  sanft: [
    'Den ganzen Sonntag im Bett bleiben',
    'Zusammen duschen, ohne Eile',
    'Rücken massieren, bis einer wegdöst',
    'Einschlafen, ohne dass ein Handy leuchtet',
    'Frühstück im Bett, Krümel inklusive',
    'Stundenlang Löffelchen',
    'Vorlesen, bis der andere einschläft',
    'Zusammen in die Wanne',
    'Ganz langsam küssen und sonst nichts',
    'In der Küche tanzen, ohne Musik',
    'Unter einer Decke, während es draußen regnet',
    'Sich gegenseitig die Haare waschen',
    'Einen ganzen Film lang Händchen halten',
    'Ein Nickerchen zu zweit',
    'Barfuß spazieren und über nichts reden',
    'Nebeneinander liegen und an die Decke starren'
  ],
  frech: [
    'Knutschen, bis die Lippen kribbeln',
    'Nackt kochen — Schürze erlaubt',
    'Strip-Poker mit echten Einsätzen',
    'Ein Foto, das sonst niemand sehen darf',
    'Im Auto rumknutschen wie mit siebzehn',
    'Sich gegenseitig ausziehen, ganz langsam',
    'Kitzeln, bis einer kapituliert',
    'Wäsche, die für niemanden sonst gedacht ist',
    'Eine Massage, die nicht bei den Schultern aufhört',
    'Duschen zu zweit — diesmal mit Absicht',
    'Augen verbinden und raten lassen',
    'Eine Nachricht, die man besser wieder löscht',
    'Kuss in den Nacken, ohne Vorwarnung',
    'Auf dem Sofa übereinander herfallen',
    'Beim Umziehen zusehen dürfen',
    'Ein Kompliment, das rot macht'
  ],
  heiss: [
    'Ein Abend, an dem nur einer bestimmt',
    'Einmal die Rollen tauschen',
    'Augenbinde ausprobieren',
    'Handschellen ausprobieren',
    'Etwas, das wir beide noch nie gemacht haben',
    'Spät nachts am Telefon, weit voneinander weg',
    'Videocall, wenn längst alle schlafen',
    'Ein Spielzeug mitbringen',
    'Im Dunkeln, ohne ein einziges Wort',
    'Morgens, bevor der Wecker klingelt',
    'Irgendwo, wo wir eigentlich nicht sollten',
    'Sehr lange Vorfreude, sehr wenig Geduld',
    'Eine Fantasie erzählen, die noch nie jemand gehört hat',
    'Ganz laut sein dürfen',
    'Eiswürfel, Federn, was auch immer da ist',
    'Erst aufhören, wenn beide nicht mehr können'
  ]
};

export const TIERS = [
  { id: 'sanft', label: 'Sanft',  sub: 'Nähe, Wärme, nichts weiter', icon: 'nudgeHug', spicy: false },
  { id: 'frech', label: 'Frech',  sub: 'Da wird jemand rot',         icon: 'statJoy',  spicy: false },
  { id: 'heiss', label: 'Heiß',   sub: 'Nur mit freizügigen Inhalten', icon: 'gameSpark', spicy: true }
];

/** Auch die heißeste Runde beginnt harmlos — jede Stufe mischt die milderen mit. */
const MIX = {
  sanft: [['sanft', 6]],
  frech: [['sanft', 3], ['frech', 3]],
  heiss: [['sanft', 2], ['frech', 2], ['heiss', 2]]
};

export const CARDS_PER_ROUND = 6;

/**
 * Die sechs Karten einer Runde — aus dem Rundenschlüssel, also auf beiden
 * Geräten identisch.
 */
export function deal(seed, tier) {
  const r = rng(seed);
  const out = [];
  for (const [pool, n] of (MIX[tier] || MIX.sanft)) {
    const rest = CARDS[pool].slice();
    for (let i = 0; i < n && rest.length; i++) {
      out.push(rest.splice(Math.floor(r() * rest.length), 1)[0]);
    }
  }
  return out;
}

/* ── Auswertung ─────────────────────────────────────────── */

/** 0 = Nein, 1 = Vielleicht, 2 = Ja */
export const NEIN = 0, VIELLEICHT = 1, JA = 2;

export const MARKS = [
  { v: JA,         label: 'Ja',         short: 'Ja',   icon: 'statJoy',   cls: 'ja' },
  { v: VIELLEICHT, label: 'Vielleicht', short: 'Naja', icon: 'nudgeThink', cls: 'vielleicht' },
  { v: NEIN,       label: 'Nein',       short: 'Nein', icon: 'close',     cls: 'nein' }
];

/**
 * Ein Treffer entsteht nur, wenn niemand Nein gesagt hat.
 *
 * @returns {{level: 'beide'|'fast'|null, pts: number}}
 */
export function matchOf(a, b) {
  if (a === NEIN || b === NEIN) return { level: null, pts: 0 };
  if (a === JA && b === JA) return { level: 'beide', pts: 3 };
  return { level: 'fast', pts: 1 };
}

export function scoreRound(mine, theirs) {
  let pts = 0, beide = 0, fast = 0;
  for (let i = 0; i < mine.length; i++) {
    const m = matchOf(mine[i], theirs[i]);
    pts += m.pts;
    if (m.level === 'beide') beide++;
    else if (m.level === 'fast') fast++;
  }
  return { pts, beide, fast };
}

function verdictFor({ beide, fast }) {
  if (beide >= 4) return 'Ihr wollt praktisch dasselbe. Das wird ein Wiedersehen.';
  if (beide >= 2) return 'Mehrere Volltreffer — die stehen jetzt auf eurer Liste.';
  if (beide === 1) return 'Einer sitzt. Fängt gut an.';
  if (fast) return 'Noch kein klares Ja, aber ein paar Vielleichts.';
  return 'Diesmal nichts. Nächste Runde, andere Karten.';
}

/* ── Zustand ────────────────────────────────────────────── */

function kb(state) {
  if (!state.games.krib) {
    state.games.krib = { r: 1, turn: null, cur: null, score: { me: 0, them: 0 }, hist: [], list: [] };
  }
  const g = state.games.krib;
  g.score ||= { me: 0, them: 0 };
  g.hist ||= [];
  g.list ||= [];
  if (!g.turn) g.turn = iAmFirst(state) ? 'me' : 'them';
  return g;
}

const iAmFirst = (state) => (state.me.code || '') < (state.partner?.code || '~');

/** Sechs saubere Kreuze — oder nichts. */
function cleanMarks(raw) {
  if (!Array.isArray(raw) || raw.length !== CARDS_PER_ROUND) return null;
  const m = raw.map((n) => Math.round(Number(n)));
  return m.every((n) => n === NEIN || n === VIELLEICHT || n === JA) ? m : null;
}

const validTier = (t) => (TIERS.some((x) => x.id === t) ? t : 'sanft');

/** Treffer landen dauerhaft auf eurer Liste — doppelt aber nur einmal. */
function addToList(g, text, level) {
  const found = g.list.find((e) => e.text === text);
  if (found) {
    // Aus einem Vielleicht kann später ein Ja werden, andersherum nicht
    if (level === 'beide') { found.level = 'beide'; found.at = Date.now(); }
    return;
  }
  g.list.unshift({ text, level, at: Date.now() });
  if (g.list.length > 40) g.list.length = 40;
}

/** Beide Kreuze da? Dann abrechnen. */
function settle(state, g) {
  if (!g.cur?.mine || !g.cur?.theirs) return null;
  const res = scoreRound(g.cur.mine, g.cur.theirs);
  const treffer = [];

  g.cur.cards.forEach((text, i) => {
    const m = matchOf(g.cur.mine[i], g.cur.theirs[i]);
    if (!m.level) return;
    treffer.push({ text, level: m.level });
    addToList(g, text, m.level);
  });

  g.score.me += res.pts;
  g.score.them += res.pts;
  g.hist.unshift({ r: g.r, tier: g.cur.tier, ...res, at: Date.now() });
  if (g.hist.length > 20) g.hist.length = 20;

  state.me.coins += res.beide >= 3 ? REWARDS.gameWon : REWARDS.gamePlayed;
  addBondXp(state, 4 + res.beide * 2);
  state.me.pet.stats.joy = Math.min(100, state.me.pet.stats.joy + 5);
  pushFeed(state, {
    from: 'system', type: 'game', icon: 'gameSpark',
    text: `Kribbeln: ${res.beide} Volltreffer, ${res.fast} Vielleicht`
  });

  const view = { r: g.r, cards: g.cur.cards.slice(), mine: g.cur.mine.slice(), theirs: g.cur.theirs.slice(), treffer, ...res };
  /**
   * Die Auflösung überlebt die Runde.
   *
   * Wer zuerst angekreuzt hat, ist beim Abrechnen gar nicht in der App —
   * für ihn wäre das Ergebnis sonst nur eine Bannerzeile. Also bleibt es
   * liegen, bis er es einmal gesehen hat. Danach fliegt es raus.
   */
  g.last = { ...view, seen: false };
  g.r++;
  g.turn = g.turn === 'me' ? 'them' : 'me';
  g.cur = null;
  return view;
}

function abortRound(g) {
  g.cur = null;
  g.last = null;
  g.r++;
  g.turn = g.turn === 'me' ? 'them' : 'me';
}

/* ── Netzwerk ───────────────────────────────────────────── */

const KINDS = ['kribDeal', 'kribMarks', 'kribSkip'];

export function handleRemote(state, msg, { partnerName }) {
  if (!KINDS.includes(msg.kind)) return undefined;
  const g = kb(state);

  if (msg.kind === 'kribSkip') {
    if (msg.r < g.r || !g.cur) return null;
    abortRound(g);
    commit('krib');
    return {
      kind: 'gameTurn', icon: 'gameSpark', avatar: 'them',
      title: `${partnerName} hat die Runde verworfen`,
      sub: 'Kribbeln',
      body: 'Neue Karten beim nächsten Mal.',
      actions: [{ label: 'Weiter', act: 'game:krib', primary: true }, { label: 'Ok', act: 'dismiss' }],
      tone: 'calm'
    };
  }

  if (msg.kind === 'kribDeal') {
    if (msg.r < g.r) return null;
    // Gleichzeitig ausgeteilt: auf beiden Geräten gewinnt derselbe Code
    if (g.cur && msg.r === g.r && iAmFirst(state)) return null;

    const tier = validTier(msg.tier);
    g.r = msg.r;
    g.turn = 'them';
    g.cur = { tier, cards: deal(seedFor('krib', `${msg.r}-${tier}`, state), tier), mine: null, theirs: null };
    commit('krib');
    return {
      kind: 'gameTurn', icon: 'gameSpark', avatar: 'them',
      title: `${partnerName} hat ausgeteilt`,
      sub: `Kribbeln · ${TIERS.find((t) => t.id === tier)?.label}`,
      body: 'Sechs Karten liegen bereit. Kreuz an, was du willst — gezeigt wird nur, wo ihr euch trefft.',
      actions: [{ label: 'Ansehen', act: 'game:krib', primary: true }, { label: 'Später', act: 'dismiss' }],
      tone: 'love'
    };
  }

  // Kreuze des anderen
  if (!g.cur || g.cur.theirs) return null;
  const marks = cleanMarks(msg.marks);
  if (!marks) return null;
  g.cur.theirs = marks;

  const view = settle(state, g);
  commit('krib');

  if (!view) {
    return {
      kind: 'gameWaiting', icon: 'gameSpark', avatar: 'them',
      title: `${partnerName} hat angekreuzt`,
      sub: 'Kribbeln',
      body: 'Sobald du auch durch bist, seht ihr die Treffer.',
      actions: [{ label: 'Jetzt ankreuzen', act: 'game:krib', primary: true }, { label: 'Später', act: 'dismiss' }],
      tone: 'love'
    };
  }

  return {
    kind: 'gameResult', icon: view.beide ? 'trophy' : 'gameSpark', avatar: 'them',
    title: view.beide ? `${view.beide}× seid ihr euch einig` : 'Diesmal kein Treffer',
    sub: `Kribbeln · ${view.pts} Punkte`,
    body: verdictFor(view),
    actions: [{ label: 'Ansehen', act: 'game:krib', primary: true }, { label: 'Ok', act: 'dismiss' }],
    tone: view.beide ? 'love' : 'calm'
  };
}

export function summary(state) {
  const g = kb(state);
  if (g.cur && !g.cur.mine) return { badge: 'wait', text: 'Sechs Karten warten' };
  if (g.cur) return { badge: 'off', text: 'Wartet auf Antwort' };
  if (g.turn === 'me') {
    return g.hist.length
      ? { badge: 'wait', text: 'Du teilst aus' }
      : { badge: null, text: 'Du fängst an' };
  }
  return g.list.length
    ? { badge: null, text: `${g.list.length} auf eurer Liste` }
    : { badge: null, text: 'Neu' };
}

/* ── Oberfläche ─────────────────────────────────────────── */

export function mount(root, ctx) {
  const partner = get().partner?.name || 'Dein Mensch';
  /** Welcher Bildschirm gerade steht — nur passive dürfen sich selbst ablösen. */
  let screen = '';

  const shell = (inner) => `
    <div class="game-wrap">
      <div class="game-top">
        <button class="game-x" data-close aria-label="Schließen">${icon('close', { size: 15 })}</button>
        <div class="game-title">Kribbeln</div>
        <div class="game-right"><span class="badge">${kb(get()).list.length}</span></div>
      </div>
      <div class="game-scroll">${inner}</div>
    </div>`;

  const bindClose = () => {
    root.querySelectorAll('[data-close]').forEach((b) => { b.onclick = () => ctx.close(); });
    const skip = root.querySelector('[data-skip]');
    if (skip) skip.onclick = () => {
      const g = kb(get());
      if (!g.cur) { route(); return; }
      sendEvent('game', { g: 'krib', kind: 'kribSkip', r: g.r });
      abortRound(g);
      commit('krib');
      toast('Runde verworfen');
      fx('tap');
      route();
    };
    const list = root.querySelector('[data-list]');
    if (list) list.onclick = () => screenList();
  };

  const skipLink = (label = 'Runde verwerfen') =>
    `<button class="btn btn-ghost btn-sm btn-block" data-skip style="margin-top:2px">${label}</button>`;

  /* — Austeilen: Hitzegrad wählen — */
  function screenDeal() {
    screen = 'deal';
    const st = get();
    const g = kb(st);
    const spicyOn = !!st.settings.spicy;

    root.innerHTML = shell(`
      <div class="hue-lead">
        <span class="doodle-kicker">Runde ${g.r} · du teilst aus</span>
        <b>Wie heiß darf es werden?</b>
      </div>
      <p class="tiny muted center" style="margin:0 0 14px">
        Sechs Karten für euch beide. Jede Stufe mischt die milderen mit.
      </p>
      <div class="krib-tiers">
        ${TIERS.map((t) => {
          const off = t.spicy && !spicyOn;
          return `<button class="krib-tier ${off ? 'off' : ''}" data-tier="${t.id}" ${off ? 'disabled' : ''}>
            <span class="krib-tier-e">${icon(t.icon, { size: 24 })}</span>
            <span class="grow">
              <span class="krib-tier-t">${esc(t.label)}</span>
              <span class="krib-tier-s">${off ? 'Erst unter Mehr → freizügige Inhalte' : esc(t.sub)}</span>
            </span>
            ${off ? icon('lock', { size: 14 }) : icon('chevron', { size: 14 })}
          </button>`;
        }).join('')}
      </div>
      <p class="tiny muted center" style="margin:14px 4px 0">
        ${icon('lock', { size: 12, cls: 'ic-inline' })}
        Sichtbar wird nur, wo ihr euch trefft. Was du weglässt, erfährt niemand.
      </p>
      ${listTeaser()}`);

    root.querySelectorAll('[data-tier]').forEach((b) => {
      b.onclick = () => {
        const tier = b.dataset.tier;
        const st2 = get();
        const g2 = kb(st2);
        g2.cur = { tier, cards: deal(seedFor('krib', `${g2.r}-${tier}`, st2), tier), mine: null, theirs: null };
        g2.turn = 'me';
        commit('krib');
        sendEvent('game', { g: 'krib', kind: 'kribDeal', r: g2.r, tier });
        fx('pop');
        screenMark();
      };
    });
    bindClose();
  }

  /* — Ankreuzen — */
  function screenMark() {
    screen = 'mark';
    const g = kb(get());
    const marks = new Array(CARDS_PER_ROUND).fill(null);
    const tier = TIERS.find((t) => t.id === g.cur.tier);

    const draw = () => {
      const offen = marks.filter((m) => m === null).length;
      root.innerHTML = shell(`
        <div class="hue-lead">
          <span class="doodle-kicker">Runde ${g.r} · ${esc(tier?.label || '')}</span>
          <b>Was davon willst du?</b>
        </div>
        <p class="tiny muted center" style="margin:0 0 14px">
          Ehrlich sein kostet nichts — ${esc(partner)} sieht nur, wo ihr euch trefft.
        </p>
        <div class="krib-cards">
          ${g.cur.cards.map((text, i) => `<div class="krib-card ${marks[i] !== null ? 'done' : ''}">
            <div class="krib-text">${esc(text)}</div>
            <div class="krib-marks">
              ${MARKS.map((m) => `<button class="krib-mark ${m.cls} ${marks[i] === m.v ? 'on' : ''}"
                data-mark="${i}:${m.v}" aria-label="${esc(text)}: ${m.label}"
                aria-pressed="${marks[i] === m.v}">${esc(m.short)}</button>`).join('')}
            </div>
          </div>`).join('')}
        </div>
        <button class="btn btn-love btn-block" data-send style="margin-top:14px" ${offen ? 'disabled' : ''}>
          ${offen ? `Noch ${offen}` : 'Verdeckt abschicken'}
        </button>
        ${skipLink()}`);

      root.querySelectorAll('[data-mark]').forEach((b) => {
        b.onclick = () => {
          const [i, v] = b.dataset.mark.split(':').map(Number);
          marks[i] = v;
          fx('tap');
          draw();
        };
      });
      const send = root.querySelector('[data-send]');
      if (send) send.onclick = () => submit(marks.slice());
      bindClose();
    };
    draw();
  }

  function submit(marks) {
    const st = get();
    const g = kb(st);
    if (!g.cur || g.cur.mine) { route(); return; }
    g.cur.mine = marks;
    sendEvent('game', { g: 'krib', kind: 'kribMarks', r: g.r, marks });
    const view = settle(st, g);
    commit('krib');
    fx('pop');
    if (view) {
      if (view.beide >= 3) confetti(['gameSpark', 'statJoy', 'sparkle']);
      screenResult(view);
    } else {
      screenWait();
    }
  }

  function screenWait() {
    screen = 'wait';
    root.innerHTML = shell(`
      <div class="game-center">
        <div class="game-hero">${icon('lock', { size: 56 })}</div>
        <h2 class="game-h">Verdeckt abgeschickt</h2>
        <p class="game-p">Sobald ${esc(partner)} auch angekreuzt hat, seht ihr gleichzeitig, wo ihr euch trefft.</p>
        <button class="btn btn-ghost btn-block" data-close>Fertig</button>
        ${skipLink()}
      </div>
      ${listTeaser()}`);
    bindClose();
  }

  /* — Auflösung — */
  function screenResult(v) {
    screen = 'result';
    const st = get();
    const bis = st.reunion?.date ? ` bis zum ${dateShort(st.reunion.date)}` : '';
    root.innerHTML = shell(`
      <div class="game-center">
        <div class="game-hero">${icon(v.beide ? 'trophy' : 'gameSpark', { size: 58 })}</div>
        <h2 class="game-h">${v.beide ? `${v.beide}× einig` : 'Diesmal nichts'}</h2>
        <p class="game-p">${esc(verdictFor(v))}<br>
          <span class="tiny muted">+${v.pts} Punkte für euch beide</span></p>
      </div>
      <div class="krib-reveal">
        ${v.cards.map((text, i) => {
          const m = matchOf(v.mine[i], v.theirs[i]);
          if (!m.level) {
            return `<div class="krib-line geheim">
              ${icon('lock', { size: 14 })}<span class="grow">Bleibt geheim</span></div>`;
          }
          return `<div class="krib-line ${m.level}">
            ${icon(m.level === 'beide' ? 'check' : 'nudgeThink', { size: 15 })}
            <span class="grow">${esc(text)}</span>
            <span class="krib-tag">${m.level === 'beide' ? 'beide' : 'vielleicht'}</span>
          </div>`;
        }).join('')}
      </div>
      <p class="tiny muted center" style="margin:12px 4px 0">
        Verdeckte Zeilen bleiben verdeckt — auch für ${esc(partner)}. Niemand erfährt, wer was weggelassen hat.
      </p>
      ${v.treffer.length ? `<p class="tiny muted center" style="margin:6px 4px 0">
        Die Treffer stehen jetzt auf eurer Liste${esc(bis)}.</p>` : ''}
      <button class="btn btn-primary btn-block" data-next style="margin-top:14px">Weiter</button>
      <button class="btn btn-ghost btn-block" data-list>Eure Liste ansehen</button>`);
    root.querySelector('[data-next]').onclick = () => { ack(); route(); };
    const first = root.querySelector('.krib-line.beide');
    if (first) burst(['statJoy'], { from: first, count: 5, rise: 100 });
    bindClose();
  }

  /* — Die gemeinsame Liste — */
  function screenList() {
    screen = 'list';
    const st = get();
    const g = kb(st);
    const bis = st.reunion?.date ? `Bis zum ${dateShort(st.reunion.date)}` : 'Fürs nächste Wiedersehen';
    root.innerHTML = shell(`
      <div class="hue-lead">
        <span class="doodle-kicker">${esc(bis)}</span>
        <b>Eure Liste</b>
      </div>
      ${g.list.length ? `
        <p class="tiny muted center" style="margin:0 0 14px">
          Alles hier haben beide angekreuzt. Nichts davon hat jemand allein entschieden.
        </p>
        <div class="krib-reveal">
          ${g.list.map((e) => `<div class="krib-line ${e.level}">
            ${icon(e.level === 'beide' ? 'check' : 'nudgeThink', { size: 15 })}
            <span class="grow">${esc(e.text)}</span>
            <span class="krib-tag">${e.level === 'beide' ? 'beide' : 'vielleicht'}</span>
          </div>`).join('')}
        </div>` : `
        <div class="empty">
          <span class="empty-emoji">${icon('gameSpark', { size: 40 })}</span>
          Noch nichts drauf.<br>Spielt eine Runde, dann füllt sie sich von allein.
        </div>`}
      <button class="btn btn-primary btn-block" data-next style="margin-top:14px">Zurück</button>`);
    root.querySelector('[data-next]').onclick = () => route();
    bindClose();
  }

  function listTeaser() {
    const g = kb(get());
    if (!g.list.length) return '';
    const beide = g.list.filter((e) => e.level === 'beide').length;
    return `<div class="section-label">Eure Liste</div>
      <div class="list">
        <button class="li" data-list>
          <div class="li-ico">${icon('gameSpark', { size: 19 })}</div>
          <div class="grow">
            <div class="li-title">${g.list.length} ${g.list.length === 1 ? 'Wunsch' : 'Wünsche'}</div>
            <div class="li-sub">${beide} davon wollt ihr beide · zuletzt ${relTime(g.list[0].at)}</div>
          </div>
          <span class="li-chev">${icon('chevron', { size: 16 })}</span>
        </button>
      </div>`;
  }

  function screenIdle() {
    screen = 'idle';
    root.innerHTML = shell(`
      <div class="game-center">
        <div class="game-hero">${icon('gameSpark', { size: 60 })}</div>
        <h2 class="game-h">${esc(partner)} teilt aus</h2>
        <p class="game-p">Die nächsten sechs Karten kommen von drüben.</p>
        <button class="btn btn-ghost btn-block" data-close>Fertig</button>
      </div>
      ${listTeaser()}`);
    bindClose();
  }

  /** Die Auflösung ist gesehen — beim nächsten Öffnen wieder normal weiter. */
  function ack() {
    const g = kb(get());
    if (g.last && !g.last.seen) { g.last.seen = true; commit('krib'); }
  }

  function route() {
    const g = kb(get());
    if (g.cur && !g.cur.mine) screenMark();
    else if (g.cur) screenWait();
    else if (g.last && !g.last.seen) screenResult(g.last);
    else if (g.turn === 'me') screenDeal();
    else screenIdle();
  }

  route();

  // Kommt der Zug des anderen herein, während man zuschaut, soll der
  // Bildschirm nicht auf „warten“ stehen bleiben. Nur passive Ansichten
  // lösen sich selbst ab — mitten im Ankreuzen wäre das eine Frechheit.
  // subscribe ruft mit (state, reason) auf — der Grund ist das zweite Argument.
  const unsub = subscribe((_, reason) => {
    if (reason !== 'krib' && reason !== 'remote') return;
    if (screen === 'wait' || screen === 'idle') route();
  });
  return () => unsub();
}

/** „2026-09-12“ → „12.9.“ */
function dateShort(iso) {
  const d = new Date(`${iso}T12:00:00`);
  return Number.isNaN(d.getTime()) ? iso : `${d.getDate()}.${d.getMonth() + 1}.`;
}
