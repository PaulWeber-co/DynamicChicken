/**
 * Top Fünf — wie gut kennst du die Rangliste im Kopf des anderen?
 *
 * Einer gibt eine Kategorie vor: „Dinge, um sich von der Titanic zu retten“.
 * Der andere schreibt fünf Antworten und sortiert sie selbst von 1 bis 5.
 * Zurück kommen die fünf Antworten in wilder Reihenfolge — die Nummern sind
 * verdeckt. Wer die Kategorie gestellt hat, muss die Rangfolge erraten.
 *
 * Punkte gibt es zweifach: drei für jede Antwort, die auf der exakt
 * richtigen Nummer landet, und einen für jedes Paar, das zueinander richtig
 * herum steht. Damit ist ein Tipp, der die Richtung trifft, aber um eins
 * verrutscht ist, immer noch etwas wert — und ein Volltreffer bringt die
 * vollen 25.
 *
 * Beide bekommen dieselben Punkte. Das Spiel misst nicht, wer schlauer ist,
 * sondern wie nah ihr beieinander denkt.
 *
 * Zur Ehrlichkeit: Die Lösung reist zusammen mit den Antworten und liegt
 * damit auf dem Gerät des Ratenden, bevor geraten wird — nur eben nicht
 * sichtbar. Anders ginge es nicht ohne Server, und wer in den Speicher
 * schaut, betrügt sich vor allem selbst. Genauso hält es der Farbfunk.
 */

import { esc } from '../util/dom.js';
import { fx, burst, confetti } from '../util/feedback.js';
import { get, commit } from '../state/store.js';
import { icon } from '../ui/icons.js';
import { pushFeed, addBondXp } from '../state/model.js';
import { REWARDS } from '../state/catalog.js';
import { sendEvent } from '../sync/index.js';
import { relTime } from '../util/time.js';
import { toast } from '../ui/toast.js';
import { rng, cycledMany } from '../util/rng.js';
import { seedFor, pairKey, dranIn } from './index.js';

export const meta = {
  id: 'top5',
  icon: 'gameTop5',
  title: 'Top Fünf',
  tagline: 'Fünf Antworten, verdeckte Reihenfolge — errate sie',
  modes: ['async'],
  tone: 'warm',
  howto: 'Einer gibt eine Kategorie vor, der andere schreibt fünf Antworten und sortiert sie heimlich. Erraten wird die Reihenfolge.'
};

export const N = 5;
export const MAX_POINTS = N * 3 + (N * (N - 1)) / 2;   // 15 Treffer + 10 Paare

/**
 * Kategorien für alle, die gerade nichts einfällt.
 *
 * Angezeigt wird immer nur eine Handvoll davon (`ideaChips`), sonst wäre die
 * Liste eine Wand aus Knöpfen. Welche das sind, hängt an der Runde: jede
 * Partie schlägt andere vor, und dieselbe Runde zeigt auf beiden Geräten
 * dasselbe.
 */
export const IDEAS = [
  /* Alltag */
  'Ausreden, warum ich zu spät bin',
  'Die schlimmsten Dinge im Supermarkt',
  'Gründe, das Bett heute nicht zu verlassen',
  'Die nervigsten Geräusche der Welt',
  'Dinge, die man nie laut sagen sollte',
  'Sachen, die in jeder Wohnung fehlen',
  'Die überflüssigsten Erfindungen',
  'Dinge, die ich ständig verlege',
  'Sätze, die nichts Gutes bedeuten',
  'Die schlimmsten Momente am Montagmorgen',
  'Dinge, die immer im letzten Moment kaputtgehen',
  'Was in einer WG sofort verboten gehört',
  'Die besten Ausreden, um nach Hause zu gehen',
  'Kleinigkeiten, die einen Tag retten',
  'Dinge, für die ich zu alt bin',
  'Was man niemals im Großraumbüro tun sollte',

  /* Essen */
  'Beste Snacks um drei Uhr nachts',
  'Was ich niemals essen würde',
  'Die besten Sachen aufs Brot',
  'Gerichte, die immer funktionieren',
  'Überschätzte Restaurants',
  'Was in jede Tiefkühltruhe gehört',
  'Die besten Kombinationen, die komisch klingen',
  'Dinge, die man kalt essen darf',
  'Was ich mir nach einem schlechten Tag bestelle',
  'Die besten Süßigkeiten aus der Kindheit',

  /* Wir */
  'Was ich als Erstes mache, wenn wir wieder zusammen sind',
  'Orte, an die wir unbedingt mal müssen',
  'Unsere besten gemeinsamen Momente',
  'Die Dinge, die uns immer zum Lachen bringen',
  'Was ich an dir zuerst gemerkt habe',
  'Sachen, die wir zusammen lernen sollten',
  'Was in unsere erste Wohnung muss',
  'Filme, die wir zusammen sehen müssen',
  'Dinge, die wir viel zu selten machen',
  'Kleine Rituale, die wir behalten sollten',
  'Was ich mitbringe, wenn ich dich besuche',
  'Die besten Geschenke, die du mir gemacht hast',
  'Städte, in denen wir mal wohnen könnten',
  'Was uns in zwanzig Jahren noch verbindet',

  /* Ich */
  'Sachen, die ich auf eine einsame Insel mitnehme',
  'Was ich mit einer Million machen würde',
  'Superkräfte, die im Alltag echt nützlich wären',
  'Tiere, die ich als Haustier hätte',
  'Dinge, auf die ich stolz bin',
  'Was ich an mir nie ändern werde',
  'Meine unnötigsten Talente',
  'Sachen, die ich viel zu ernst nehme',
  'Was ich als Kind werden wollte',
  'Lieder, die immer funktionieren',
  'Bücher oder Serien, die mich verändert haben',
  'Meine unpopulärsten Meinungen',
  'Was ich in fünf Jahren geschafft haben will',
  'Dinge, die mich sofort beruhigen',

  /* Albern */
  'Dinge, um sich von der Titanic zu retten',
  'Die besten Verstecke in einer Wohnung',
  'Was ich tun würde, wenn ich unsichtbar wäre',
  'Berufe, in denen ich sofort scheitern würde',
  'Die schlechtesten Namen für ein Haustier',
  'Was ich in einer Zombie-Apokalypse zuerst hole',
  'Die besten Ausreden gegenüber der Polizei',
  'Dinge, die man einem Außerirdischen erklären müsste',
  'Was ich mit einer Zeitmaschine als Erstes mache',
  'Die albernsten Gründe für einen Streit',
  'Was in einem Museum über mich hängen würde',
  'Regeln für ein Land, in dem ich bestimme',
  /* Nachschub: über uns */
  'Momente, in denen ich dich am meisten vermisse',
  'Die Sätze, an denen ich dich sofort erkenne',
  'Was ich an dir zuerst bemerkt habe, ohne es zu sagen',
  'Verabredungen, die wir immer wieder verschieben',
  'Die besten Ausreden, um dich anzurufen',
  'Was ich mir für unser erstes gemeinsames Zuhause wünsche',
  'Orte, an denen ich dich gern wiedersehen würde',
  'Die kleinsten Dinge, die mich an dich denken lassen',
  'Was ich dir noch nie erzählt habe',
  'Unsere seltsamsten gemeinsamen Angewohnheiten',
  /* Nachschub: hätte, wäre, wenn */
  'Was ich täte, wenn Geld egal wäre',
  'Die Superkräfte, die eigentlich nutzlos wären',
  'Wofür ich sofort aufstehen würde, egal wie früh',
  'Was ich in einer Zeitmaschine als Erstes ansehen würde',
  'Die Berufe, in denen ich nach einer Woche gefeuert wäre',
  'Womit man mich sofort bestechen kann',
  'Was ich auf eine einsame Insel mitnehmen würde',
  'Die Regeln, die ich in meinem eigenen Land aufstellen würde',
  /* Nachschub: peinlich */
  'Lieder, die ich heimlich mag',
  'Dinge, die ich gegoogelt habe und lieber nicht',
  'Was ich als Kind für die Wahrheit gehalten habe',
  'Die peinlichsten Verletzungen meines Lebens',
  'Was in meinem Suchverlauf keiner sehen darf',
  'Ausreden, die niemand geglaubt hat',
  /* Nachschub: streitbar */
  'Essen, das völlig überbewertet ist',
  'Regeln, die es nicht bräuchte',
  'Was auf jeder Party fehlt',
  'Dinge, bei denen alle so tun, als würden sie sie mögen',
  'Die schlechtesten Ratschläge, die man ständig hört',
  'Filme, die niemand zweimal braucht',
  'Was sofort abgeschafft gehört',
  /* Nachschub: zärtlich */
  'Wo ich am liebsten berührt werde',
  'Die besten Gerüche der Welt',
  'Momente, in denen ich mich sicher fühle',
  'Was mich sofort beruhigt',
  'Die schönsten Arten, geweckt zu werden',
  'Wofür ich dankbar bin, ohne es zu sagen'
];

/** Wie viele Vorschläge unter dem Eingabefeld stehen. */
export const IDEA_CHIPS = 8;

/** Acht Vorschläge, die zur Runde passen — auf beiden Geräten dieselben. */
export const ideaChips = (runde, paar = '') => cycledMany(IDEAS, IDEA_CHIPS, Math.max(0, runde - 1), `top5|${paar}`);

/**
 * Zusatzregeln — eine pro Runde, aus dem Rundenschlüssel.
 *
 * Dieselbe Mechanik wird nach ein paar Partien vorhersehbar. Eine Auflage
 * an die fünf Antworten zwingt zu ungewohnten Listen, und weil beide
 * Geräte sie aus demselben Schlüssel errechnen, sehen beide dieselbe.
 * „Ohne Regel“ bleibt der häufigste Fall, sonst wird es anstrengend.
 */
export const RULES = [
  { id: 'keine',   label: '',                    hint: '', w: 6 },
  { id: 'zuhause', label: 'Nur von zu Hause',    hint: 'Alle fünf Dinge müssen bei dir in der Wohnung sein.', w: 2 },
  { id: 'gratis',  label: 'Nichts, was Geld kostet', hint: 'Kein Gegenstand, den man kaufen muss.', w: 2 },
  { id: 'buchstabe', label: 'Alle mit demselben Buchstaben', hint: 'Alle fünf Antworten fangen gleich an.', w: 2 },
  { id: 'kurz',    label: 'Höchstens zwei Wörter', hint: 'Jede Antwort passt in zwei Wörter.', w: 2 },
  { id: 'peinlich', label: 'Je peinlicher, desto besser', hint: 'Nimm die Antworten, die du sonst nicht sagen würdest.', w: 2 },
  { id: 'anders',  label: 'Nichts Naheliegendes', hint: 'Streich deine erste Idee. Nimm die zweite.', w: 2 },
  { id: 'reihe',   label: 'Von harmlos nach heftig', hint: 'Platz 1 ist zahm, Platz 5 traust du dich kaum.', w: 2 },
  { id: 'begruenden', label: 'Mit halbem Satz', hint: 'Zu jeder Antwort gehört ein „weil …".', w: 2 },
  { id: 'fremd',   label: 'Aus seiner Sicht', hint: 'Antworte so, wie dein Mensch antworten würde.', w: 2 }
];

export function ruleFor(seed) {
  const total = RULES.reduce((n, r) => n + r.w, 0);
  let roll = rng(`${seed}-rule`)() * total;
  for (const r of RULES) { roll -= r.w; if (roll < 0) return r; }
  return RULES[0];
}

export const ruleById = (id) => RULES.find((r) => r.id === id) || RULES[0];

/** Was der Joker kostet: eine Antwort wird aufgedeckt. */
export const JOKER_COST = 4;

/* ── Punkte ─────────────────────────────────────────────── */

/**
 * `sol` und `guess` sind gleich lang und enthalten pro Anzeigeplatz die
 * Nummer 1..5 — einmal die wahre, einmal die geratene.
 *
 * @returns {{exact:number, pairs:number, pts:number}}
 */
export function scoreGuess(sol, guess, joker = false) {
  let exact = 0;
  let pairs = 0;
  for (let i = 0; i < sol.length; i++) if (sol[i] === guess[i]) exact++;
  for (let i = 0; i < sol.length; i++) {
    for (let j = i + 1; j < sol.length; j++) {
      if (Math.sign(sol[i] - sol[j]) === Math.sign(guess[i] - guess[j])) pairs++;
    }
  }
  const roh = exact * 3 + pairs;
  return { exact, pairs, joker, pts: Math.max(0, roh - (joker ? JOKER_COST : 0)) };
}

export function verdictFor(pts) {
  if (pts >= MAX_POINTS) return 'Alle fünf auf den Punkt. Das war Gedankenlesen.';
  if (pts >= 18) return 'Fast die ganze Liste getroffen — ihr tickt ähnlich.';
  if (pts >= 11) return 'Die grobe Richtung saß. Zwei Plätze haben gefehlt.';
  if (pts >= 5) return 'Ein paar Paare stimmten, der Rest war Bauchgefühl.';
  return 'Komplett anders sortiert. Das müsst ihr besprechen.';
}

/* ── Zustand ────────────────────────────────────────────── */

function tf(state) {
  if (!state.games.top5) {
    state.games.top5 = { r: 1, turn: null, cur: null, score: { me: 0, them: 0 }, hist: [] };
  }
  const g = state.games.top5;
  g.score ||= { me: 0, them: 0 };
  g.hist ||= [];
  /**
   * Wer dran ist, steht nicht im Speicher — es folgt aus der Runde.
   *
   * Vorher wurde `turn` bei jeder Runde umgelegt und mitgeschleppt. Ging
   * dabei eine Nachricht verloren, legte nur eine Seite um, und danach
   * stand auf beiden Geräten „der andere ist dran". Jetzt kann das nicht
   * mehr passieren: derselbe Wert entsteht auf beiden Seiten aus derselben
   * Rundennummer.
   */
  g.turn = dranIn(state, g.r);
  return g;
}

const iAmFirst = (state) => (state.me.code || '') < (state.partner?.code || '~');

/** Fünf saubere Strings aus dem, was hereinkommt. */
function cleanItems(raw) {
  if (!Array.isArray(raw)) return null;
  const items = raw.slice(0, N).map((t) => String(t ?? '').trim().slice(0, 60)).filter(Boolean);
  return items.length === N ? items : null;
}

/** Eine gültige Permutation von 1..5 — oder nichts. */
function cleanRanks(raw) {
  if (!Array.isArray(raw) || raw.length !== N) return null;
  const nums = raw.map((n) => Math.round(Number(n)));
  const seen = new Set(nums);
  if (seen.size !== N) return null;
  if (nums.some((n) => !Number.isFinite(n) || n < 1 || n > N)) return null;
  return nums;
}

/**
 * Runde abschließen — und die Auflösung liegen lassen.
 *
 * Wer die Liste gestellt hat, erfuhr bisher nur die Punktzahl. Genau das
 * Interessante fehlte: welche Antwort der andere wohin gelegt hat. Also
 * bleibt die fertige Runde in `offen` stehen, bis man sie einmal gesehen
 * und weggetippt hat — auf beiden Seiten dieselbe Ansicht.
 */
function closeRound(state, g, { exact, pairs, pts, joker }) {
  g.offen = {
    cat: g.cur.cat,
    items: (g.cur.items || []).slice(),
    sol: (g.cur.sol || []).slice(),
    guess: (g.cur.guess || []).slice(),
    // Wer geraten hat: `me`, wenn ich die Liste bekommen habe
    riet: g.cur.by === 'me' ? 'me' : 'them',
    exact, pairs, pts, joker: !!joker
  };
  // Beide bekommen dieselben Punkte — gute Liste, guter Tipp
  g.score.me += pts;
  g.score.them += pts;
  g.hist.unshift({
    r: g.r, cat: g.cur.cat, exact, pairs, pts, joker: !!joker,
    rule: g.cur.rule || 'keine',
    asked: g.cur.by === 'me' ? 'me' : 'them',
    at: Date.now()
  });
  if (g.hist.length > 20) g.hist.length = 20;

  state.me.coins += pts >= 18 ? REWARDS.gameWon : REWARDS.gamePlayed;
  addBondXp(state, 4 + Math.round(pts / 5));
  state.me.pet.stats.joy = Math.min(100, state.me.pet.stats.joy + 4);
  pushFeed(state, {
    from: 'system', type: 'game', icon: 'gameTop5',
    text: `Top Fünf „${g.cur.cat}“: ${exact}/${N} richtig · ${pts} Punkte`
  });

  g.r++;
  g.cur = null;
}

/**
 * Notausgang: Runde wegwerfen und weiterziehen.
 *
 * Zeitversetzt gespielt hängt irgendwann jede Runde — die Kategorie ist zu
 * schwer, jemand hat das Handy gewechselt, es kommt einfach nichts zurück.
 * Ohne diesen Weg bliebe das Spiel für immer stehen.
 */
function abortRound(g) {
  g.cur = null;
  g.r++;
}

/* ── Netzwerk ───────────────────────────────────────────── */

const KINDS = ['topCat', 'topList', 'topGuess', 'topSkip'];

export function handleRemote(state, msg, { partnerName }) {
  if (!KINDS.includes(msg.kind)) return undefined;
  const g = tf(state);

  if (msg.kind === 'topSkip') {
    if (msg.r < g.r || !g.cur) return null;
    abortRound(g);
    g.turn = dranIn(state, g.r);
    commit('top5');
    return {
      kind: 'gameTurn',
      icon: 'gameTop5',
      avatar: 'them',
      title: `${partnerName} hat die Runde verworfen`,
      sub: 'Top Fünf',
      body: `Die Kategorie war wohl zu schwer. ${g.turn === 'me' ? 'Du gibst die nächste vor.' : `${partnerName} gibt die nächste vor.`}`,
      actions: [{ label: 'Weiter', act: 'game:top5', primary: true }, { label: 'Ok', act: 'dismiss' }],
      tone: 'calm'
    };
  }

  if (msg.kind === 'topCat') {
    if (msg.r < g.r) return null;
    // Gleichzeitig losgeschrieben? Auf beiden Geräten gewinnt dieselbe
    // Seite, sonst wartete jeder auf die Liste zur eigenen Kategorie.
    if (g.cur?.by === 'me' && msg.r === g.r && iAmFirst(state)) return null;

    const cat = String(msg.cat || '').trim().slice(0, 90);
    if (!cat) return null;
    const rule = ruleById(msg.rule || ruleFor(seedFor('top5', msg.r, state)).id);
    g.r = msg.r;
    g.cur = { cat, by: 'them', rule: rule.id, items: null, sol: null, guess: null };
    commit('top5');
    return {
      kind: 'gameTurn',
      icon: 'gameTop5',
      avatar: 'them',
      title: `${partnerName} will deine Top Fünf`,
      sub: rule.id === 'keine' ? cat : `${cat} · ${rule.label}`,
      body: `„${cat}“ — schreib fünf Antworten und sortiere sie.${rule.id === 'keine' ? '' : ` Regel: ${rule.hint}`}`,
      actions: [{ label: 'Liste schreiben', act: 'game:top5', primary: true }, { label: 'Später', act: 'dismiss' }],
      tone: 'warm'
    };
  }

  if (msg.kind === 'topList') {
    if (!g.cur || g.cur.by !== 'me' || g.cur.items) return null;
    const items = cleanItems(msg.items);
    const sol = cleanRanks(msg.sol);
    if (!items || !sol) return null;
    g.cur.items = items;
    g.cur.sol = sol;
    commit('top5');
    return {
      kind: 'gameTurn',
      icon: 'gameTop5',
      avatar: 'them',
      title: `${partnerName} hat sortiert`,
      sub: g.cur.cat,
      body: `Fünf Antworten zu „${g.cur.cat}“ liegen bereit — in welcher Reihenfolge?`,
      actions: [{ label: 'Raten', act: 'game:top5', primary: true }, { label: 'Später', act: 'dismiss' }],
      tone: 'warm'
    };
  }

  // Der andere hat meine Liste geraten
  if (!g.cur || g.cur.by !== 'them' || !g.cur.sol) return null;
  const guess = cleanRanks(msg.guess);
  if (!guess) return null;
  g.cur.guess = guess;
  const res = scoreGuess(g.cur.sol, guess, !!msg.joker);
  const cat = g.cur.cat;
  closeRound(state, g, res);
  commit('top5');

  return {
    kind: 'gameResult',
    icon: res.pts >= 18 ? 'trophy' : 'gameTop5',
    avatar: 'them',
    title: `${res.exact}/${N} auf dem richtigen Platz`,
    sub: `„${cat}“ · ${res.pts} Punkte${res.joker ? ' (Joker)' : ''}`,
    body: `${partnerName} hat deine Liste geraten. ${verdictFor(res.pts)} Öffne das Spiel, um zu sehen, was wohin getippt wurde.`,
    actions: [{ label: 'Ansehen', act: 'game:top5', primary: true }, { label: 'Später', act: 'dismiss' }],
    tone: res.pts >= 18 ? 'warm' : 'calm'
  };
}

export function summary(state) {
  const g = tf(state);
  if (g.cur?.by === 'them' && !g.cur.items) return { badge: 'wait', text: 'Fünf Antworten' };
  if (g.cur?.by === 'me' && g.cur.items) return { badge: 'wait', text: 'Reihenfolge raten' };
  if (g.cur) return { badge: 'off', text: 'Unterwegs' };
  // „Du bist dran“ heißt: drüben wartet jemand. Ein Spiel, das noch nie
  // gelaufen ist, wartet auf niemanden — es steht einfach bereit.
  if (g.turn === 'me') {
    return g.hist.length
      ? { badge: 'wait', text: 'Du gibst vor' }
      : { badge: null, text: 'Du fängst an' };
  }
  return g.hist.length
    ? { badge: null, text: `${g.score.me} Punkte` }
    : { badge: null, text: 'Neu' };
}

/* ── Oberfläche ─────────────────────────────────────────── */

export function mount(root, ctx) {
  const partner = get().partner?.name || 'Dein Mensch';

  const shell = (inner) => `
    <div class="game-wrap">
      <div class="game-top">
        <button class="game-x" data-close aria-label="Schließen">${icon('close', { size: 15 })}</button>
        <div class="game-title">Top Fünf</div>
        <div class="game-right"><span class="badge">${tf(get()).score.me}</span></div>
      </div>
      <div class="game-scroll">${inner}</div>
    </div>`;

  const bindClose = () => {
    root.querySelectorAll('[data-close]').forEach((b) => { b.onclick = () => ctx.close(); });
    const skip = root.querySelector('[data-skip]');
    if (skip) skip.onclick = () => {
      const st = get();
      const g = tf(st);
      if (!g.cur) { route(); return; }
      sendEvent('game', { g: 'top5', kind: 'topSkip', r: g.r });
      abortRound(g);
      commit('top5');
      toast('Runde verworfen');
      fx('tap');
      route();
    };
  };

  /** Immer erreichbar, solange eine Runde offen ist. */
  const skipLink = (label = 'Runde verwerfen') =>
    `<button class="btn btn-ghost btn-sm btn-block" data-skip style="margin-top:2px">${label}</button>`;

  /** Die Zusatzregel dieser Runde — beide Seiten sehen dieselbe. */
  function ruleChip(rule) {
    if (!rule || rule.id === 'keine') return '';
    return `<div class="hue-rule">${icon('sparkle', { size: 15 })}
      <span><b>${esc(rule.label)}</b> · ${esc(rule.hint)}</span></div>`;
  }

  /* — Kategorie vorgeben — */
  /* Wie oft schon „Andere“ gedrückt wurde — nur für diese Sitzung. */
  let ideaOffset = 0;
  const chipHtml = (runde, st) => ideaChips(runde + ideaOffset, pairKey(st))
    .map((t) => `<button class="chip" data-idea="${esc(t)}">${esc(t)}</button>`).join('');

  function screenCategory() {
    const st0 = get();
    const g = tf(st0);
    const rule = ruleFor(seedFor('top5', g.r, st0));
    root.innerHTML = shell(`
      <div class="hue-lead">
        <span class="doodle-kicker">Runde ${g.r} · du gibst vor</span>
        <b>Wovon die Top Fünf?</b>
      </div>
      ${ruleChip(rule)}
      <p class="tiny muted center" style="margin:0 0 14px">
        ${esc(partner)} schreibt dann fünf Antworten und sortiert sie heimlich.
      </p>
      <input class="input" data-cat maxlength="88" autocomplete="off"
        placeholder="Dinge, um sich von der Titanic zu retten">
      <div class="section-label idea-head" style="margin:14px 4px 8px">
        <span>Oder nimm eine davon</span>
        <button class="link-btn" data-more>${icon('shuffle', { size: 14 })} Andere</button>
      </div>
      <div class="meme-ideas" data-chips>
        ${chipHtml(g.r, st0)}
      </div>
      <button class="btn btn-primary btn-block" data-send style="margin-top:14px">Abschicken</button>
      ${history()}`);

    const inp = root.querySelector('[data-cat]');
    inp.focus();
    const bindIdeas = () => root.querySelectorAll('[data-idea]').forEach((b) => {
      b.onclick = () => { inp.value = b.dataset.idea; fx('tap'); inp.focus(); };
    });
    bindIdeas();
    // Der Vorrat ist größer als der Platz — auf Wunsch die nächsten acht.
    root.querySelector('[data-more]').onclick = () => {
      ideaOffset++;
      root.querySelector('[data-chips]').innerHTML = chipHtml(g.r, get());
      bindIdeas();
      fx('tap');
    };
    root.querySelector('[data-send]').onclick = () => {
      const cat = inp.value.trim().slice(0, 88);
      if (cat.length < 4) { toast('Ein bisschen mehr Kategorie'); return; }
      const st = get();
      const g2 = tf(st);
      g2.cur = { cat, by: 'me', rule: rule.id, items: null, sol: null, guess: null };
      g2.turn = 'me';
      commit('top5');
      sendEvent('game', { g: 'top5', kind: 'topCat', r: g2.r, cat, rule: rule.id });
      fx('pop');
      screenWaitList();
    };
    bindClose();
  }

  function screenWaitList() {
    const g = tf(get());
    root.innerHTML = shell(`
      <div class="game-center">
        <div class="game-hero">${icon('dove', { size: 62 })}</div>
        <h2 class="game-h">Kategorie unterwegs</h2>
        <p class="game-p">„${esc(g.cur?.cat || '')}“ liegt bei ${esc(partner)}. Sobald die fünf Antworten da sind, darfst du raten.</p>
        <button class="btn btn-ghost btn-block" data-close>Fertig</button>
        ${skipLink('Kategorie zurücknehmen')}
      </div>
      ${history()}`);
    bindClose();
  }

  /* — Fünf Antworten schreiben und sortieren — */
  function screenList() {
    const g = tf(get());
    /**
     * Reihenfolge im Formular = Rang. Oben ist Platz 1.
     *
     * Der Entwurf wird mitgespeichert: Fünf Antworten sind zu viel Arbeit,
     * um sie zu verlieren, weil zwischendurch das Handy klingelt. Er hängt
     * an der Runde und verschwindet mit ihr.
     */
    let rows = Array.isArray(g.cur.draft) && g.cur.draft.length === N
      ? g.cur.draft.slice()
      : ['', '', '', '', ''];

    const draw = (focusRow = -1) => {
      root.innerHTML = shell(`
        <div class="hue-lead">
          <span class="doodle-kicker">Von ${esc(partner)}</span>
          <b>„${esc(g.cur.cat)}“</b>
        </div>
        ${ruleChip(ruleById(g.cur.rule))}
        <p class="tiny muted center" style="margin:0 0 14px">
          Fünf Antworten, oben die beste. Die Nummern sieht ${esc(partner)} nicht —
          nur die Antworten, kreuz und quer.
        </p>
        <div class="top-rows">
          ${rows.map((v, i) => `<div class="top-row">
            <span class="top-num">${i + 1}</span>
            <input class="input top-in" data-row="${i}" maxlength="58" autocomplete="off"
              value="${esc(v)}" placeholder="${i === 0 ? 'Der beste Vorschlag' : 'Antwort ' + (i + 1)}">
            <span class="top-move">
              <button class="top-arrow" data-up="${i}" ${i === 0 ? 'disabled' : ''} aria-label="Nach oben">${icon('chevron', { size: 13 })}</button>
              <button class="top-arrow down" data-down="${i}" ${i === N - 1 ? 'disabled' : ''} aria-label="Nach unten">${icon('chevron', { size: 13 })}</button>
            </span>
          </div>`).join('')}
        </div>
        <button class="btn btn-primary btn-block" data-send style="margin-top:14px">Verdeckt abschicken</button>
        ${skipLink('Mir fällt nichts ein — überspringen')}
        ${history()}`);

      const read = () => root.querySelectorAll('[data-row]').forEach((el) => { rows[Number(el.dataset.row)] = el.value; });
      const keep = () => {
        const st = get();
        const g2 = tf(st);
        if (!g2.cur) return;
        g2.cur.draft = rows.slice();
        commit('top5-draft');
      };
      // Beim Verlassen eines Feldes sichern — nicht bei jedem Tastendruck,
      // das schriebe hundertmal in den Speicher.
      root.querySelectorAll('[data-row]').forEach((el) => {
        el.onblur = () => { read(); keep(); };
      });

      root.querySelectorAll('[data-up]').forEach((b) => {
        b.onclick = () => { read(); const i = Number(b.dataset.up); swap(i, i - 1); keep(); fx('tap'); draw(i - 1); };
      });
      root.querySelectorAll('[data-down]').forEach((b) => {
        b.onclick = () => { read(); const i = Number(b.dataset.down); swap(i, i + 1); keep(); fx('tap'); draw(i + 1); };
      });
      root.querySelector('[data-send]').onclick = () => { read(); send(); };

      const target = root.querySelector(`[data-row="${focusRow < 0 ? 0 : focusRow}"]`);
      if (target && focusRow >= 0) target.focus();
      bindClose();
    };

    const swap = (a, b) => { const t = rows[a]; rows[a] = rows[b]; rows[b] = t; };

    function send() {
      const clean = rows.map((t) => t.trim().slice(0, 58));
      if (clean.some((t) => !t)) { toast('Alle fünf Zeilen bitte'); return; }
      // Anzeige-Reihenfolge würfeln, damit die Rangfolge nicht mitgeliefert wird
      const order = clean.map((t, i) => ({ t, rank: i + 1 }));
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
      const items = order.map((o) => o.t);
      const sol = order.map((o) => o.rank);

      const st = get();
      const g2 = tf(st);
      if (!g2.cur) { route(); return; }
      g2.cur.items = items;
      g2.cur.sol = sol;
      delete g2.cur.draft;
      commit('top5');
      sendEvent('game', { g: 'top5', kind: 'topList', r: g2.r, items, sol });
      fx('pop');
      screenWaitGuess();
    }

    draw(-1);
  }

  function screenWaitGuess() {
    const g = tf(get());
    const mine = g.cur?.items
      ? g.cur.items.map((t, i) => ({ t, rank: g.cur.sol[i] })).sort((a, b) => a.rank - b.rank)
      : [];
    root.innerHTML = shell(`
      <div class="game-center">
        <div class="game-hero">${icon('lock', { size: 56 })}</div>
        <h2 class="game-h">Verdeckt abgeschickt</h2>
        <p class="game-p">${esc(partner)} sieht deine fünf Antworten jetzt durcheinander und muss sie sortieren.</p>
      </div>
      <div class="section-label">Deine Reihenfolge</div>
      <div class="top-solution">
        ${mine.map((m) => `<div class="top-line"><span class="top-num">${m.rank}</span><b>${esc(m.t)}</b></div>`).join('')}
      </div>
      <button class="btn btn-ghost btn-block" data-close style="margin-top:14px">Fertig</button>
      ${skipLink()}
      ${history()}`);
    bindClose();
  }

  /* — Raten: der Reihe nach antippen — */
  function screenGuess() {
    const g = tf(get());
    const items = g.cur.items;
    /** picks[displayIndex] = vergebene Nummer, oder 0 */
    let picks = new Array(items.length).fill(0);
    let next = 1;
    /**
     * Der Joker deckt eine Antwort auf und kostet vier Punkte.
     *
     * Er macht aus dem Raten eine Entscheidung: Reicht das Bauchgefühl, oder
     * ist der eine Platz, bei dem man gar keine Ahnung hat, den Abzug wert?
     * Aufgedeckt wird die Antwort, bei der man am unsichersten ist — die
     * darf man selbst wählen.
     */
    let joker = -1;
    let jokerModus = false;

    const draw = () => {
      const done = next > N;
      root.innerHTML = shell(`
        <div class="hue-lead">
          <span class="doodle-kicker">Von ${esc(partner)}</span>
          <b>„${esc(g.cur.cat)}“</b>
        </div>
        ${ruleChip(ruleById(g.cur.rule))}
        <p class="tiny muted center" style="margin:0 0 14px">
          ${jokerModus
            ? 'Welche Antwort soll aufgedeckt werden?'
            : done
              ? 'Passt das so? Sonst noch mal von vorn.'
              : `Was hat ${esc(partner)} auf <b>Platz ${next}</b> gesetzt?`}
        </p>
        <div class="top-picks">
          ${items.map((t, i) => {
            const auf = joker === i;
            const wahl = jokerModus ? joker !== i : !picks[i] && next <= N;
            return `<button class="top-pick ${picks[i] ? 'taken' : ''} ${auf ? 'joker' : ''}" data-i="${i}"
              ${wahl ? '' : 'disabled'}>
              <span class="top-num ${picks[i] ? '' : 'blank'}">${picks[i] || '?'}</span>
              <span class="grow">${esc(t)}</span>
              ${auf ? `<span class="top-tip">${icon('lock', { size: 12, cls: 'ic-inline' })} ${g.cur.sol[i]}</span>` : ''}
            </button>`;
          }).join('')}
        </div>
        <div class="top-actions">
          <button class="btn btn-soft" data-undo ${next === 1 || jokerModus ? 'disabled' : ''}>Zurück</button>
          <button class="btn btn-primary grow" data-send ${done && !jokerModus ? '' : 'disabled'}>
            ${done ? 'Auflösen' : `Noch ${N - next + 1}`}
          </button>
        </div>
        ${joker < 0 && !jokerModus ? `<button class="btn btn-line btn-sm btn-block" data-joker style="margin-top:8px">
          ${icon('sparkle', { size: 15 })} Joker: eine Antwort aufdecken (−${JOKER_COST} Punkte)
        </button>` : ''}
        <p class="tiny muted center" style="margin:12px 4px 0">
          Drei Punkte je richtiger Nummer, einer für jedes Paar in der richtigen Reihenfolge.${
            joker >= 0 ? ` Joker gezogen: −${JOKER_COST}.` : ''}
        </p>`);

      root.querySelectorAll('[data-i]').forEach((b) => {
        b.onclick = () => {
          const i = Number(b.dataset.i);
          if (jokerModus) {
            joker = i;
            jokerModus = false;
            // Die aufgedeckte Antwort sitzt sofort auf ihrem Platz
            const nr = g.cur.sol[i];
            const alt = picks.indexOf(nr);
            if (alt >= 0) picks[alt] = 0;
            picks[i] = nr;
            next = 1;
            while (picks.includes(next)) next++;
            fx('pop');
            draw();
            return;
          }
          if (picks[i] || next > N) return;
          picks[i] = next;
          while (picks.includes(next)) next++;
          fx('tap');
          draw();
        };
      });
      root.querySelector('[data-undo]').onclick = () => {
        if (next === 1 || jokerModus) return;
        // Zurück nimmt die zuletzt vergebene Nummer weg, überspringt aber
        // die vom Joker gesetzte — die ist gekauft.
        let n = next - 1;
        while (n >= 1 && picks.indexOf(n) === joker) n--;
        if (n < 1) return;
        const i = picks.indexOf(n);
        if (i >= 0) picks[i] = 0;
        next = 1;
        while (picks.includes(next)) next++;
        fx('tap');
        draw();
      };
      const jb = root.querySelector('[data-joker]');
      if (jb) jb.onclick = () => { jokerModus = true; fx('tap'); draw(); };
      root.querySelector('[data-send]').onclick = () => { if (next > N) submit(picks.slice(), joker >= 0); };
      bindClose();
    };
    draw();
  }

  function submit(guess, joker) {
    const st = get();
    const g = tf(st);
    if (!g.cur?.sol) { route(); return; }
    const res = scoreGuess(g.cur.sol, guess, joker);
    g.cur.guess = guess;
    sendEvent('game', { g: 'top5', kind: 'topGuess', r: g.r, guess, joker: !!joker });
    closeRound(st, g, res);
    commit('top5');

    fx(res.pts >= 18 ? 'yay' : res.pts >= 8 ? 'pop' : 'fail');
    if (res.exact === N) confetti(['gameTop5', 'trophy', 'sparkle']);
    screenResult(g.offen);
  }

  /**
   * Die Auflösung — dieselbe für beide, nur die Beschriftung dreht sich.
   *
   * Links steht, wohin die Antwort wirklich gehörte, rechts, wohin sie
   * getippt wurde. Wer selbst geraten hat, liest „du"; wer die Liste
   * gestellt hat, liest den Namen des anderen und sieht endlich, was
   * drüben passiert ist.
   */
  function screenResult(v) {
    if (!v) { route(); return; }
    const selbst = v.riet !== 'them';
    const wer = selbst ? 'du' : esc(partner);
    // Nach wahrer Nummer sortiert — so liest sich die Auflösung von selbst
    const rows = v.items
      .map((t, i) => ({ t, sol: v.sol[i], guess: v.guess[i] }))
      .sort((a, b) => a.sol - b.sol);

    root.innerHTML = shell(`
      <div class="game-center">
        <div class="game-hero">${icon(v.pts >= 18 ? 'trophy' : 'gameTop5', { size: 60 })}</div>
        <div class="game-kicker">${selbst ? 'Dein Tipp' : `${esc(partner)} hat geraten`}</div>
        <h2 class="game-h">${v.exact}/${N} auf dem Punkt</h2>
        <p class="game-p">„${esc(v.cat)}“ · ${v.pts} von ${MAX_POINTS} Punkten<br>
          <span class="tiny muted">${v.exact} Treffer · ${v.pairs} Paare richtig herum${
            v.joker ? ` · Joker −${JOKER_COST}` : ''}</span></p>
      </div>
      <div class="top-kopf">
        <span>Richtig</span><span class="grow">Antwort</span><span>${wer}</span>
      </div>
      <div class="top-solution">
        ${rows.map((r) => `<div class="top-line ${r.sol === r.guess ? 'hit' : ''}">
          <span class="top-num">${r.sol}</span>
          <b class="grow">${esc(r.t)}</b>
          <span class="top-tip">${r.sol === r.guess
            ? icon('check', { size: 14, cls: 'ic-inline' })
            : r.guess}</span>
        </div>`).join('')}
      </div>
      <div class="rate-verdict" style="margin-top:12px">${esc(verdictFor(v.pts))}</div>
      <button class="btn btn-primary btn-block" data-next style="margin-top:12px">Weiter</button>
      <button class="btn btn-ghost btn-block" data-close>Fertig</button>
      ${history()}`);
    root.querySelector('[data-next]').onclick = () => {
      // Gesehen ist gesehen — sonst stünde die Auflösung beim nächsten Mal
      // wieder da, statt der neuen Runde.
      const st = get();
      const g = tf(st);
      if (g.offen) { g.offen = null; commit('top5'); }
      route();
    };
    const first = root.querySelector('.top-line.hit');
    if (first) burst(['sparkle'], { from: first, count: 4, rise: 90 });
    bindClose();
  }

  /**
   * Warten — mit Ausweg.
   *
   * Selbst wenn beide Seiten dieselbe Runde kennen, kann eine Nachricht
   * hängen bleiben, und dann wartet man auf etwas, das nie kommt. Der
   * Knopf zieht die Runde einfach an sich: eine Runde weiter, damit ist
   * man dran, und die nächste Kategorie synchronisiert drüben mit.
   */
  function screenIdle() {
    root.innerHTML = shell(`
      <div class="game-center">
        <div class="game-hero">${icon('gameTop5', { size: 62 })}</div>
        <h2 class="game-h">${esc(partner)} ist dran</h2>
        <p class="game-p">Die nächste Kategorie kommt von drüben.</p>
        <button class="btn btn-ghost btn-block" data-uebernehmen>Ich fange an</button>
        <button class="btn btn-ghost btn-block" data-close>Fertig</button>
      </div>
      ${history()}`);
    root.querySelector('[data-uebernehmen]').onclick = () => {
      const st = get();
      const g = tf(st);
      g.r++;
      g.cur = null;
      g.turn = dranIn(st, g.r);
      commit('top5');
      fx('tap');
      route();
    };
    bindClose();
  }

  function history() {
    const g = tf(get());
    if (!g.hist.length) return '';
    return `<div class="section-label">Bisher</div>
      <div class="list">
        ${g.hist.slice(0, 8).map((h) => `<div class="li">
          <div class="li-ico">${icon(h.pts >= 18 ? 'trophy' : 'gameTop5', { size: 19 })}</div>
          <div class="grow">
            <div class="li-title">„${esc(h.cat)}“</div>
            <div class="li-sub">${h.rule && h.rule !== 'keine' ? `${esc(ruleById(h.rule).label)} · ` : ''}${
              h.exact}/${N} richtig · ${h.pts} Punkte${h.joker ? ' (Joker)' : ''} · ${relTime(h.at)}</div>
          </div>
        </div>`).join('')}
      </div>`;
  }

  function route() {
    const g = tf(get());
    if (g.offen) { screenResult(g.offen); return; }
    if (g.cur?.by === 'them' && !g.cur.items) screenList();
    else if (g.cur?.by === 'them') screenWaitGuess();
    else if (g.cur?.by === 'me' && g.cur.items) screenGuess();
    else if (g.cur?.by === 'me') screenWaitList();
    else if (g.turn === 'me') screenCategory();
    else screenIdle();
  }

  route();
  return () => {};
}
