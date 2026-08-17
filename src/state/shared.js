/**
 * Die drei geteilten Sachen: Nest, Abstimmung, Bewerten.
 *
 * Alle drei folgen demselben Muster, weil es sich bewährt hat: Jeder legt
 * seine Antwort ab, sichtbar wird sie erst, wenn beide abgegeben haben.
 * Das nimmt der Sache das Taktieren — man kann sich nicht anpassen, wenn
 * man die Antwort des anderen schon kennt.
 *
 * Weil beide Seiten Einträge anlegen können und niemand Schiedsrichter
 * spielt, trägt jeder Eintrag eine ID aus dem Code seines Erfinders. Damit
 * kollidiert nichts, egal wer wann offline war, und dasselbe Ereignis
 * zweimal zugestellt ändert nichts.
 */

import { pushFeed, addBondXp } from './model.js';

/* ═══════════════════════════════════════════════════════
   Gemeinsames Nest
   ═══════════════════════════════════════════════════════ */

/** Wie wichtig ist dir das? Vier Stufen reichen — mehr wird zur Rechenaufgabe. */
export const WEIGHTS = [
  { w: 0, label: 'Egal',          short: 'egal',   tone: 'off' },
  { w: 1, label: 'Wäre schön',    short: 'schön',  tone: 'calm' },
  { w: 2, label: 'Wichtig',       short: 'wichtig', tone: 'warm' },
  { w: 3, label: 'Unverzichtbar', short: 'muss',   tone: 'love' }
];

export const weightLabel = (w) => WEIGHTS.find((x) => x.w === w)?.label || 'Egal';

/**
 * Vorschläge für das, was man sich unter einer gemeinsamen Wohnung vorstellt.
 * Absichtlich konkret: „großer Esstisch“ streitet sich besser als „gemütlich“.
 */
export const NEST_CATALOG = [
  { key: 'kitchen',  icon: 'roomKitchen',  cat: 'Räume',    text: 'Küche zum wirklich Kochen' },
  { key: 'table',    icon: 'roomGuests',   cat: 'Räume',    text: 'Großer Tisch für Gäste' },
  { key: 'sofa',     icon: 'roomSofa',     cat: 'Räume',    text: 'Sofa, auf dem man einschlafen kann' },
  { key: 'bed',      icon: 'roomBed',      cat: 'Räume',    text: 'Richtig großes Bett' },
  { key: 'desk',     icon: 'roomDesk',     cat: 'Räume',    text: 'Platz zum Arbeiten für beide' },
  { key: 'bath',     icon: 'roomBath',     cat: 'Räume',    text: 'Badewanne' },
  { key: 'guest',    icon: 'roomGuests',   cat: 'Räume',    text: 'Ecke für Übernachtungsbesuch' },
  { key: 'storage',  icon: 'roomStorage',  cat: 'Räume',    text: 'Genug Stauraum' },
  { key: 'balcony',  icon: 'roomBalcony',  cat: 'Draußen',  text: 'Balkon oder Terrasse' },
  { key: 'garden',   icon: 'roomNature',   cat: 'Draußen',  text: 'Ein Stück Garten' },
  { key: 'water',    icon: 'roomWater',    cat: 'Draußen',  text: 'Wasser in der Nähe' },
  { key: 'green',    icon: 'roomPlant',    cat: 'Draußen',  text: 'Viele Pflanzen drinnen' },
  { key: 'city',     icon: 'roomCity',     cat: 'Lage',     text: 'Mitten in der Stadt' },
  { key: 'quiet',    icon: 'roomQuiet',    cat: 'Lage',     text: 'Ruhige Straße' },
  { key: 'nature',   icon: 'roomNature',   cat: 'Lage',     text: 'Grün vor der Tür' },
  { key: 'light',    icon: 'roomLight',    cat: 'Gefühl',   text: 'Viel Tageslicht' },
  { key: 'cozy',     icon: 'nest',         cat: 'Gefühl',   text: 'Warm und wuschelig eingerichtet' },
  { key: 'tidy',     icon: 'broom',        cat: 'Gefühl',   text: 'Eher aufgeräumt als voll' },
  { key: 'books',    icon: 'roomBooks',    cat: 'Alltag',   text: 'Wand voller Bücher' },
  { key: 'music',    icon: 'roomMusic',    cat: 'Alltag',   text: 'Musik in guter Qualität' },
  { key: 'cinema',   icon: 'actShow',      cat: 'Alltag',   text: 'Filmabend-Ecke' },
  { key: 'games',    icon: 'tabPlay',      cat: 'Alltag',   text: 'Platz für Spiele' },
  { key: 'sport',    icon: 'roomSport',    cat: 'Alltag',   text: 'Ecke für Sport' },
  { key: 'coffee',   icon: 'coffee',       cat: 'Alltag',   text: 'Ordentliche Kaffeemaschine' },
  { key: 'wash',     icon: 'roomWash',     cat: 'Alltag',   text: 'Eigene Waschmaschine' },
  { key: 'pet',      icon: 'roomPet',      cat: 'Alltag',   text: 'Ein Tier darf einziehen' }
];

export const NEST_CATS = ['Räume', 'Draußen', 'Lage', 'Gefühl', 'Alltag', 'Eigenes'];

export const catalogByKey = (key) => NEST_CATALOG.find((c) => c.key === key) || null;

/* ═══════════════════════════════════════════════════════
   Vorlagen fürs Abstimmen
   ═══════════════════════════════════════════════════════ */

export const POLL_TEMPLATES = [
  {
    key: 'evening',
    q: 'Was machen wir heute Abend?',
    opts: [
      { k: 'film', label: 'Film zusammen', icon: 'actShow' },
      { k: 'talk', label: 'Einfach reden', icon: 'nudgeThink' },
      { k: 'play', label: 'Zocken', icon: 'tabPlay' },
      { k: 'early', label: 'Früh schlafen', icon: 'careSleep' }
    ]
  },
  {
    key: 'food',
    q: 'Was essen wir heute?',
    opts: [
      { k: 'cook', label: 'Selbst kochen', icon: 'actCook' },
      { k: 'pizza', label: 'Pizza', icon: 'pizza' },
      { k: 'soup', label: 'Was Warmes', icon: 'soup' },
      { k: 'quick', label: 'Nur schnell was', icon: 'bread' }
    ]
  },
  {
    key: 'weekend',
    q: 'Was machen wir am Wochenende?',
    opts: [
      { k: 'out', label: 'Raus in die Natur', icon: 'roomNature' },
      { k: 'city', label: 'Stadt und Café', icon: 'roomCity' },
      { k: 'home', label: 'Zuhause bleiben', icon: 'nest' },
      { k: 'friends', label: 'Leute treffen', icon: 'roomGuests' }
    ]
  },
  {
    key: 'call',
    q: 'Wann telefonieren wir?',
    opts: [
      { k: 'now', label: 'Jetzt gleich', icon: 'clock' },
      { k: 'evening', label: 'Heute Abend', icon: 'nudgeNight' },
      { k: 'tomorrow', label: 'Morgen früh', icon: 'nudgeMorning' },
      { k: 'later', label: 'Später diese Woche', icon: 'sunrise' }
    ]
  }
];

/* ═══════════════════════════════════════════════════════
   Gerüst
   ═══════════════════════════════════════════════════════ */

export function ensureShared(state) {
  if (!Array.isArray(state.nest)) state.nest = [];
  if (!Array.isArray(state.polls)) state.polls = [];
  if (!Array.isArray(state.rates)) state.rates = [];
  return state;
}

let seq = 0;
/** ID mit dem Code des Erfinders: eindeutig, ohne dass jemand koordiniert. */
export function newId(state, prefix) {
  const who = state.me?.code || 'x';
  return `${prefix}-${who}-${Date.now().toString(36)}-${(seq++).toString(36)}`;
}

const byId = (list, id) => list.find((x) => x.id === id) || null;

/* ═══════════════════════════════════════════════════════
   Nest
   ═══════════════════════════════════════════════════════ */

/**
 * Wunsch anlegen oder die eigene Gewichtung ändern.
 * @returns {object} der Eintrag, so wie er jetzt aussieht
 */
export function nestSet(state, wish, w) {
  ensureShared(state);
  const key = wish.key || null;
  let item = wish.id ? byId(state.nest, wish.id) : (key ? state.nest.find((x) => x.key === key) : null);
  if (!item) {
    item = {
      id: wish.id || newId(state, 'n'),
      key,
      text: wish.text || '',
      icon: wish.icon || 'nest',
      cat: wish.cat || 'Eigenes',
      by: state.me.code,
      mine: 0,
      theirs: null,
      at: Date.now()
    };
    state.nest.push(item);
  }
  item.mine = Math.max(0, Math.min(3, w | 0));
  item.at = Date.now();
  return item;
}

export function nestRemove(state, id) {
  ensureShared(state);
  const i = state.nest.findIndex((x) => x.id === id);
  if (i < 0) return false;
  // Was der andere auch bewertet hat, gehört nicht mehr mir allein
  if (state.nest[i].theirs != null) { state.nest[i].mine = 0; return true; }
  state.nest.splice(i, 1);
  return true;
}

/** Gegenstück zu nestSet für hereinkommende Ereignisse. */
export function nestApplyRemote(state, d = {}) {
  ensureShared(state);
  if (!d.id && !d.key) return null;
  let item = (d.id && byId(state.nest, d.id))
    || (d.key && state.nest.find((x) => x.key === d.key))
    || null;
  if (!item) {
    item = {
      id: d.id || newId(state, 'n'),
      key: d.key || null,
      text: d.text || '',
      icon: d.icon || 'nest',
      cat: d.cat || 'Eigenes',
      by: d.by || state.partner?.code || '',
      mine: 0,
      theirs: null,
      at: Date.now()
    };
    state.nest.push(item);
  }
  if (d.text && !item.text) item.text = d.text;
  item.theirs = Math.max(0, Math.min(3, d.w | 0));
  return item;
}

/**
 * Auswertung: worüber ihr euch einig seid und worüber nicht.
 * Der Reibungswert ist absichtlich einfach — je weiter zwei Zahlen
 * auseinanderliegen, desto mehr gibt es zu bereden.
 */
export function nestSummary(state) {
  ensureShared(state);
  const both = state.nest.filter((x) => x.theirs != null);
  const agreed = [], talk = [], solo = [];

  for (const x of state.nest) {
    const m = x.mine || 0;
    const t = x.theirs;
    if (t == null) { if (m > 0) solo.push(x); continue; }
    const gap = Math.abs(m - t);
    if (m >= 2 && t >= 2) agreed.push({ ...x, gap });
    else if (gap >= 2) talk.push({ ...x, gap });
    else if (m >= 1 && t >= 1) agreed.push({ ...x, gap });
    else if (m > 0 || t > 0) talk.push({ ...x, gap });
  }

  agreed.sort((a, b) => (b.mine + b.theirs) - (a.mine + a.theirs));
  talk.sort((a, b) => b.gap - a.gap);

  const match = both.length
    ? Math.round((1 - both.reduce((s, x) => s + Math.abs((x.mine || 0) - x.theirs), 0) / (3 * both.length)) * 100)
    : null;

  return { agreed, talk, solo, match, rated: both.length, total: state.nest.length };
}

/* ═══════════════════════════════════════════════════════
   Abstimmung
   ═══════════════════════════════════════════════════════ */

export function pollCreate(state, q, opts, myVote = null) {
  ensureShared(state);
  const poll = {
    id: newId(state, 'p'),
    q: String(q || '').slice(0, 120),
    opts: opts.slice(0, 6).map((o, i) => ({
      k: o.k || `o${i}`,
      label: String(o.label || '').slice(0, 60),
      icon: o.icon || 'ballot'
    })),
    by: state.me.code,
    at: Date.now(),
    mine: myVote,
    theirs: null,
    doneAt: null
  };
  state.polls.unshift(poll);
  if (state.polls.length > 40) state.polls.length = 40;
  return poll;
}

/** @returns {{poll:object, revealed:boolean, agree:boolean}|null} */
export function pollVote(state, id, k) {
  ensureShared(state);
  const poll = byId(state.polls, id);
  if (!poll || poll.mine === k) return null;
  poll.mine = k;
  return finishPoll(state, poll);
}

export function pollApplyRemote(state, d = {}) {
  ensureShared(state);
  if (!d.id) return null;
  let poll = byId(state.polls, d.id);
  if (!poll) {
    poll = {
      id: d.id,
      q: String(d.q || '').slice(0, 120),
      opts: Array.isArray(d.opts) ? d.opts.slice(0, 6) : [],
      by: d.by || state.partner?.code || '',
      at: d.at || Date.now(),
      mine: null,
      theirs: null,
      doneAt: null
    };
    state.polls.unshift(poll);
    if (state.polls.length > 40) state.polls.length = 40;
  }
  if (d.v != null) poll.theirs = d.v;
  return finishPoll(state, poll);
}

function finishPoll(state, poll) {
  const revealed = poll.mine != null && poll.theirs != null;
  const fresh = revealed && !poll.doneAt;
  if (fresh) poll.doneAt = Date.now();
  return { poll, revealed, fresh, agree: revealed && poll.mine === poll.theirs };
}

export const pollOpen = (state) => (state.polls || []).filter((p) => !p.doneAt);
export const pollWaitingForMe = (state) => (state.polls || []).filter((p) => p.mine == null && p.theirs != null);

/* ═══════════════════════════════════════════════════════
   Bewerten und Raten
   ═══════════════════════════════════════════════════════ */

/**
 * Nur echte Web-Adressen dürfen zu einem anklickbaren Link werden.
 *
 * Der Link kommt aus fremder Hand. `javascript:` oder `data:` in einem href
 * führt Code aus, sobald jemand darauf tippt — Escaping hilft dagegen nicht,
 * weil das Problem nicht die Anführungszeichen sind, sondern das Schema.
 * Was hier nicht durchkommt, wird als Text angezeigt statt als Link.
 *
 * @returns {string} die Adresse, oder '' wenn sie nicht sicher verlinkbar ist
 */
export function safeUrl(raw) {
  const s = String(raw || '').trim();
  if (!s) return '';
  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(s);
  try {
    // Ohne Schema als https lesen — „open.spotify.com/…“ ist gut gemeint
    const u = new URL(hasScheme ? s : `https://${s}`);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return '';
    // Ohne Punkt im Namen ist es kein Host, sondern nur Text
    if (!hasScheme && !u.hostname.includes('.')) return '';
    return u.href;
  } catch {
    return '';
  }
}

/** Song, Link oder einfach eine Sache — bestimmt nur das Bild. */
export function kindOf(url) {
  const u = String(url || '').toLowerCase();
  if (!u) return 'thing';
  if (/spotify|music\.apple|soundcloud|bandcamp|deezer|tidal/.test(u)) return 'song';
  if (/youtube|youtu\.be|vimeo|netflix|twitch/.test(u)) return 'film';
  if (/^https?:\/\//.test(u)) return 'link';
  return 'thing';
}

export const KIND_ICON = { song: 'disc', film: 'actShow', link: 'globe', thing: 'sparkle' };
export const KIND_LABEL = { song: 'Song', film: 'Video', link: 'Link', thing: 'Sache' };

export function rateCreate(state, { title, url = '', note = '' }, mine = null) {
  ensureShared(state);
  const kind = kindOf(url);
  const entry = {
    id: newId(state, 'r'),
    title: String(title || '').slice(0, 100),
    url: safeUrl(url).slice(0, 500),
    note: String(note || '').slice(0, 200),
    kind,
    by: state.me.code,
    at: Date.now(),
    mine,                 // { score, guess }
    theirs: null,
    doneAt: null
  };
  state.rates.unshift(entry);
  if (state.rates.length > 40) state.rates.length = 40;
  return entry;
}

/**
 * Eigene Note und die Vermutung über den anderen. Beides zusammen, sonst
 * könnte man die Vermutung nachträglich anpassen.
 */
export function rateSubmit(state, id, score, guess) {
  ensureShared(state);
  const e = byId(state.rates, id);
  if (!e || e.mine) return null;
  e.mine = { score: clamp10(score), guess: clamp10(guess), at: Date.now() };
  return finishRate(state, e);
}

export function rateApplyRemote(state, d = {}) {
  ensureShared(state);
  if (!d.id) return null;
  let e = byId(state.rates, d.id);
  if (!e) {
    e = {
      id: d.id,
      title: String(d.title || '').slice(0, 100),
      url: safeUrl(d.url).slice(0, 500),
      note: String(d.note || '').slice(0, 200),
      kind: d.kind || kindOf(d.url),
      by: d.by || state.partner?.code || '',
      at: d.at || Date.now(),
      mine: null,
      theirs: null,
      doneAt: null
    };
    state.rates.unshift(e);
    if (state.rates.length > 40) state.rates.length = 40;
  }
  if (d.s != null && !e.theirs) {
    e.theirs = { score: clamp10(d.s), guess: clamp10(d.g), at: d.at || Date.now() };
  }
  return finishRate(state, e);
}

const clamp10 = (n) => Math.max(1, Math.min(10, Math.round(Number(n) || 1)));

function finishRate(state, e) {
  const revealed = !!(e.mine && e.theirs);
  const fresh = revealed && !e.doneAt;
  if (fresh) e.doneAt = Date.now();
  return { entry: e, revealed, fresh, ...(revealed ? rateScore(e) : {}) };
}

/**
 * Wie gut kennt ihr euch? 10 Punkte für eine perfekte Vermutung, dann
 * fallend. Beide Vermutungen zusammen ergeben die Runde.
 */
export function rateScore(e) {
  if (!e?.mine || !e?.theirs) return null;
  const myMiss = Math.abs(e.mine.guess - e.theirs.score);
  const theirMiss = Math.abs(e.theirs.guess - e.mine.score);
  const pts = (miss) => Math.max(0, 10 - miss * 2);
  const same = Math.abs(e.mine.score - e.theirs.score);
  return {
    myMiss,
    theirMiss,
    myPts: pts(myMiss),
    theirPts: pts(theirMiss),
    total: pts(myMiss) + pts(theirMiss),
    taste: Math.max(0, 10 - same),      // wie ähnlich ihr etwas findet
    verdict: verdictFor(myMiss, theirMiss, same)
  };
}

function verdictFor(myMiss, theirMiss, same) {
  const miss = myMiss + theirMiss;
  if (miss === 0) return 'Ihr habt euch beide exakt getroffen. Unheimlich.';
  if (miss <= 2) return 'Fast perfekt geraten — ihr kennt euch.';
  if (same === 0) return 'Gleiche Note, unterschiedlich geraten. Interessant.';
  if (miss <= 5) return 'Ordentlich daneben, aber die Richtung stimmt.';
  if (same >= 5) return 'Ihr seht das ziemlich verschieden. Darüber lohnt ein Gespräch.';
  return 'Weit daneben. Zeit für mehr gemeinsame Musik.';
}

/** Laufender Punktestand über alle abgeschlossenen Runden. */
export function rateStats(state) {
  ensureShared(state);
  const done = state.rates.filter((e) => e.doneAt);
  if (!done.length) return { rounds: 0, me: 0, them: 0, taste: null };
  let me = 0, them = 0, taste = 0;
  for (const e of done) {
    const s = rateScore(e);
    me += s.myPts; them += s.theirPts; taste += s.taste;
  }
  return { rounds: done.length, me, them, taste: Math.round((taste / done.length) * 10) };
}

/* ═══════════════════════════════════════════════════════
   Belohnungen — dieselbe Logik für beide Seiten
   ═══════════════════════════════════════════════════════ */

export function rewardShared(state, kind, text, iconName) {
  const xp = kind === 'nest' ? 3 : kind === 'poll' ? 6 : 8;
  addBondXp(state, xp);
  if (text) pushFeed(state, { from: 'system', type: kind, icon: iconName || 'nest', text });
  return xp;
}
