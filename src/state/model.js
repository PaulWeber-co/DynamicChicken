/**
 * Datenmodell und Simulation.
 *
 * Knuddl altert in Echtzeit: Statt eines Timers, der nur läuft, solange die
 * App offen ist, wird beim Öffnen ausgerechnet, was in der Zwischenzeit
 * passiert wäre. Das ist genauer, spart Akku und funktioniert auch, wenn ihr
 * die App drei Tage nicht anfasst.
 */

import { defaultLook } from '../pet/chicken.js';
import { shortCode } from '../util/rng.js';
import { guessTz, dayKey, daysBetween, HOUR } from '../util/time.js';

export const SCHEMA_VERSION = 9;

/** Verfall pro Stunde, wach. */
const DECAY = { energy: 4.6, clean: 3.2, joy: 4.0 };
/** Erholung pro Stunde, schlafend. */
const SLEEP_GAIN = { energy: 19, joy: 1.2 };

export const clamp100 = (n) => Math.max(0, Math.min(100, n));

export function createState() {
  const t = Date.now();
  return {
    v: SCHEMA_VERSION,
    createdAt: t,
    onboarded: false,
    me: {
      id: crypto.randomUUID ? crypto.randomUUID() : String(t),
      code: shortCode(6),
      name: '',
      tz: guessTz(),
      pet: newPet('Knuddl', 0, t),
      coins: 60,
      owned: { hat: ['none'], acc: ['none'] },
      mood: null,
      activity: null,
      /** Grob gerundeter Ort fürs Wetter — nur, wenn selbst ausgesucht. */
      place: null,
      lastActive: t
    },
    partner: null,
    /** Gemeinsames Geheimnis für Raum-ID und Verschlüsselung. */
    pair: { secret: null, room: null, at: 0 },
    bond: { xp: 0, level: 1, streak: 0, lastDay: null, hugs: 0, since: null },
    feed: [],
    games: {},
    daily: null,
    /** Gemeinsames Nest: Wohnwünsche mit Gewichtung von beiden Seiten. */
    nest: [],
    /** Abstimmungen — sichtbar, sobald beide gewählt haben. */
    polls: [],
    /** Bewerten und Raten: eigene Note plus Tipp über den anderen. */
    rates: [],
    /** Nächstes Wiedersehen: { date: 'YYYY-MM-DD', label, by, at } */
    reunion: null,
    outbox: [],
    seen: [],
    settings: {
      theme: 'auto',
      haptics: true,
      sound: true,
      notify: false,
      syncMode: 'solo',
      cloudUrl: '',
      soloName: 'Mila',
      /** Zweiter, freizügigerer Fragenkatalog — nur auf Wunsch. */
      spicy: false,
      /**
       * Standort automatisch mitführen.
       *
       * Aus, bis jemand aktiv Ja sagt. `ortGefragt` merkt sich, dass die
       * Frage schon gestellt wurde — einmal abgelehnt heißt abgelehnt,
       * nicht „bei jedem Start noch mal".
       */
      autoOrt: false,
      ortGefragt: false
    }
  };
}

export function newPet(name = 'Knuddl', seed = 0, t = Date.now()) {
  return {
    name,
    look: defaultLook(seed),
    stats: { energy: 84, clean: 88, joy: 82 },
    xp: 0,
    level: 1,
    born: t,
    asleep: false,
    asleepSince: null,
    lastTick: t
  };
}

/* ── Level ──────────────────────────────────────────────── */

export const xpForLevel = (lvl) => Math.round(55 + (lvl - 1) * 42 + Math.pow(lvl - 1, 1.6) * 8);

export function addXp(pet, amount) {
  pet.xp += amount;
  let leveled = 0;
  while (pet.xp >= xpForLevel(pet.level)) {
    pet.xp -= xpForLevel(pet.level);
    pet.level++;
    leveled++;
  }
  return leveled;
}

export const bondLevelFor = (xp) => Math.max(1, Math.floor(Math.sqrt(Math.max(0, xp) / 32)) + 1);
export const bondXpForLevel = (lvl) => Math.pow(lvl - 1, 2) * 32;

export function addBondXp(state, amount) {
  const before = state.bond.level;
  state.bond.xp += amount;
  state.bond.level = bondLevelFor(state.bond.xp);
  return state.bond.level - before;
}

/* ── Simulation ─────────────────────────────────────────── */

/**
 * Höchstens so viele Stunden werden nachgeholt.
 *
 * Wer zwei Wochen nicht reinschaut, soll kein totes Huhn vorfinden. Das
 * wäre Schuldgefühl statt Freude — und seit das Füttern raus ist, gäbe es
 * nicht einmal einen schnellen Weg zurück. Nach einer langen Pause sieht
 * Knuddl aus wie nach einer durchgemachten Nacht, mehr nicht.
 */
const MAX_CATCHUP_HOURS = 10;

/**
 * Holt die Statuswerte auf „jetzt“ nach.
 * @returns {{hours:number, wokeUp:boolean}} was in der Pause passiert ist
 */
export function tickPet(pet, t = Date.now()) {
  const last = pet.lastTick || t;
  const hours = Math.min(MAX_CATCHUP_HOURS, Math.max(0, (t - last) / HOUR));
  pet.lastTick = t;
  if (hours <= 0) return { hours: 0, wokeUp: false };

  const s = pet.stats;
  let wokeUp = false;

  if (pet.asleep) {
    s.energy = clamp100(s.energy + SLEEP_GAIN.energy * hours);
    s.joy = clamp100(s.joy + SLEEP_GAIN.joy * hours);
    s.clean = clamp100(s.clean - DECAY.clean * 0.3 * hours);
    if (s.energy >= 100) {
      pet.asleep = false;
      pet.asleepSince = null;
      wokeUp = true;
    }
  } else {
    s.energy = clamp100(s.energy - DECAY.energy * hours);
    s.clean = clamp100(s.clean - DECAY.clean * hours);

    // Vernachlässigung schlägt auf die Laune
    let joyDrain = DECAY.joy;
    if (s.clean < 25) joyDrain += 2.5;
    if (s.energy < 20) joyDrain += 2.0;
    s.joy = clamp100(s.joy - joyDrain * hours);
  }

  return { hours, wokeUp };
}

/** Gesamtzustand 0–100, für Level-Boni und die „Turnierform“. */
export function wellbeing(pet) {
  const s = pet.stats;
  return Math.round((s.energy + s.clean + s.joy) / 3);
}

/** Kampfkraft fürs Duell: gepflegte Hühner sind fitter. */
export function petPower(pet) {
  return Math.round(wellbeing(pet) * 0.6 + Math.min(40, pet.level * 2.6));
}

/** Was braucht Knuddl gerade am dringendsten? */
export function urgentNeed(pet) {
  if (pet.asleep) return null;
  const s = pet.stats;
  const needs = [
    { key: 'energy', v: s.energy, icon: 'careSleep', text: 'ist müde' },
    { key: 'clean',  v: s.clean,  icon: 'careWash',  text: 'braucht ein Bad' },
    { key: 'joy',    v: s.joy,    icon: 'carePlay',  text: 'langweilt sich' }
  ].filter((n) => n.v < 30).sort((a, b) => a.v - b.v);
  return needs[0] || null;
}

/* ── Tagesstreak ────────────────────────────────────────── */

export function touchStreak(state, t = Date.now()) {
  const today = dayKey(t);
  const b = state.bond;
  if (b.lastDay === today) return { changed: false, streak: b.streak };
  const gap = b.lastDay ? daysBetween(b.lastDay, today) : 99;
  b.streak = gap === 1 ? b.streak + 1 : 1;
  b.lastDay = today;
  if (!b.since) b.since = t;
  return { changed: true, streak: b.streak, broken: gap > 1 && gap < 99 };
}

/* ── Timeline ───────────────────────────────────────────── */

let feedSeq = 0;

export function pushFeed(state, entry) {
  const item = {
    id: `${Date.now().toString(36)}-${(feedSeq++).toString(36)}`,
    at: Date.now(),
    from: 'me',
    ...entry
  };
  state.feed.unshift(item);
  if (state.feed.length > 90) state.feed.length = 90;
  return item;
}

/* ── Migration ──────────────────────────────────────────── */

/**
 * Umbauten, die alte Daten wirklich umformen müssen.
 *
 * Neue Felder brauchen hier nichts: `migrate()` legt den Standard aus
 * `createState()` darunter, alles Alte bleibt stehen. Auch ein neues Spiel
 * kommt von allein, weil `games` ein freier Container ist.
 *
 * Nötig wird ein Schritt erst, wenn ein Feld umbenannt wird, seinen Typ
 * ändert oder etwas anders gemeint ist als vorher. Dann:
 *
 *   1. SCHEMA_VERSION um eins erhöhen
 *   2. hier einen Eintrag mit der *neuen* Nummer anlegen
 *
 * Der Schritt bekommt den Stand so, wie er auf dem Gerät lag, und darf ihn
 * direkt anfassen. Sie laufen der Reihe nach, ein Gerät holt also auch
 * mehrere verpasste Versionen auf einmal nach.
 *
 * @type {Record<number, (s: object) => void>}
 */
const STEPS = {
  // Herzschlag ist raus — die Vibration war auf zu vielen Geräten still.
  // Der Spielstand bliebe sonst als toter Ballast liegen.
  2: (s) => { if (s.games) delete s.games.beat; },

  // Füttern ist raus. Der Kühlschrank war eine Pflicht, kein Vergnügen —
  // und ein Huhn, das verhungert, während man arbeitet, macht Druck statt
  // Freude. Übriges Futter wird zu Körnern, damit niemand das Gefühl hat,
  // dass ihm etwas weggenommen wurde. Der Satt-Balken verschwindet mit.
  3: (s) => {
    const PREISE = {
      korn: 4, wurm: 7, beeren: 9, salat: 6, brot: 5,
      smoothie: 14, kaffee: 12, suppe: 19, kuchen: 17, pizza: 23
    };
    const inv = s.me?.inv;
    if (inv && typeof inv === 'object') {
      let zurueck = 0;
      for (const [id, n] of Object.entries(inv)) {
        zurueck += (PREISE[id] || 4) * Math.max(0, Math.min(999, Number(n) || 0));
      }
      if (zurueck > 0 && s.me) s.me.coins = (Number(s.me.coins) || 0) + zurueck;
    }
    if (s.me) delete s.me.inv;
    if (s.me?.pet?.stats) delete s.me.pet.stats.full;
    if (s.partner?.pet?.stats) delete s.partner.pet.stats.full;
    if (Array.isArray(s.feed)) s.feed = s.feed.filter((f) => f?.type !== 'feed');
  },

  // Vier Spiele sind raus: Ei-Duell, Feder-Memory, Gefühls-Duett und
  // Federpoker. Ihre Spielstände blieben sonst als toter Ballast liegen und
  // zählten in `games` weiter mit.
  4: (s) => {
    if (!s.games) return;
    for (const id of ['egg', 'memo', 'duett', 'poker']) delete s.games[id];
  },

  // Aus einer Frage pro Tag werden zwei: erst die normale, dann die spicy.
  // Der Tagesstand ist jetzt eine Liste von Plätzen. Eine schon getippte
  // Antwort von heute soll dabei nicht verloren gehen, also wandert sie auf
  // den Platz, zu dem sie gehört. `ensureDaily()` füllt den Rest auf.
  5: (s) => {
    const d = s.daily;
    if (!d || typeof d !== 'object' || Array.isArray(d.slots)) return;
    if (!d.q) { s.daily = null; return; }
    s.daily = {
      day: d.day,
      slots: [{
        id: d.spicy ? 'spicy' : 'normal',
        spicy: !!d.spicy,
        q: d.q,
        mine: d.mine || null,
        theirs: d.theirs || null,
        revealedAt: d.revealedAt || null
      }]
    };
  },

  // Aus dem Maskenball (einer las, einer klickte) wurde Federgarn (beide
  // schreiben). Andere Mechanik, anderer Zustand — der alte Spielstand
  // passt nirgends mehr hinein und bliebe sonst als Ballast liegen.
  6: (s) => { if (s.games) delete s.games.story; },
  7: (s) => { if (s.games) delete s.games.blocks; },
  8: (s) => { if (s.games) delete s.games.garn; },
  9: (s) => { if (s.games) delete s.games.sling; }
};

/** Vor einem Umbau eine Kopie wegschreiben — einmal, nicht bei jedem Start. */
function backup(raw, from) {
  try {
    const key = `knuddl.backup.v${from}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, JSON.stringify(raw));
    console.info(`[knuddl] Sicherung des alten Stands unter ${key} abgelegt.`);
  } catch { /* voller Speicher: dann eben ohne Netz und doppelten Boden */ }
}

/** Macht aus einem alten oder kaputten Speicherstand einen gültigen. */
export function migrate(raw) {
  const base = createState();
  if (!raw || typeof raw !== 'object') return base;

  const from = Number(raw.v) || 1;
  if (from < SCHEMA_VERSION) {
    backup(raw, from);
    for (let v = from + 1; v <= SCHEMA_VERSION; v++) {
      try {
        STEPS[v]?.(raw);
      } catch (err) {
        console.warn(`[knuddl] Migrationsschritt ${v} fehlgeschlagen:`, err);
      }
    }
  }

  const s = { ...base, ...raw, v: SCHEMA_VERSION };
  s.me = { ...base.me, ...(raw.me || {}) };
  s.me.pet = { ...base.me.pet, ...(raw.me?.pet || {}) };
  s.me.pet.stats = { ...base.me.pet.stats, ...(raw.me?.pet?.stats || {}) };
  s.me.pet.look = { ...base.me.pet.look, ...(raw.me?.pet?.look || {}) };
  s.me.owned = {
    hat: Array.from(new Set(['none', ...(raw.me?.owned?.hat || [])])),
    acc: Array.from(new Set(['none', ...(raw.me?.owned?.acc || [])]))
  };
  s.settings = { ...base.settings, ...(raw.settings || {}) };
  s.bond = { ...base.bond, ...(raw.bond || {}) };
  s.pair = { ...base.pair, ...(raw.pair || {}) };
  s.feed = Array.isArray(raw.feed) ? raw.feed.slice(0, 90) : [];
  s.games = raw.games && typeof raw.games === 'object' ? raw.games : {};
  s.outbox = Array.isArray(raw.outbox) ? raw.outbox : [];
  s.seen = Array.isArray(raw.seen) ? raw.seen.slice(-200) : [];
  s.nest = Array.isArray(raw.nest) ? raw.nest : [];
  s.polls = Array.isArray(raw.polls) ? raw.polls.slice(0, 40) : [];
  s.rates = Array.isArray(raw.rates) ? raw.rates.slice(0, 40) : [];
  s.reunion = validReunion(raw.reunion);
  s.me.place = validPlace(raw.me?.place);

  if (raw.partner && raw.partner.code) {
    s.partner = {
      linked: true,
      code: raw.partner.code,
      name: raw.partner.name || 'Dein Mensch',
      tz: raw.partner.tz || base.me.tz,
      pet: { ...newPet('Pieps', 3), ...(raw.partner.pet || {}) },
      mood: raw.partner.mood || null,
      activity: raw.partner.activity || null,
      place: validPlace(raw.partner.place),
      lastSeen: raw.partner.lastSeen || 0,
      updatedAt: raw.partner.updatedAt || 0
    };
  } else {
    s.partner = null;
  }
  return s;
}

/** Ein Wiedersehen braucht ein Datum, das der Browser auch versteht. */
export function validReunion(r) {
  if (!r || typeof r !== 'object') return null;
  const date = String(r.date || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  if (Number.isNaN(Date.parse(`${date}T12:00:00`))) return null;
  return {
    date,
    label: String(r.label || '').slice(0, 60),
    by: String(r.by || '').slice(0, 12),
    at: Number(r.at) || Date.now()
  };
}

/** Ein Ort ist nur gültig, wenn er wirklich Koordinaten hat. */
export function validPlace(p) {
  if (!p || typeof p !== 'object') return null;
  const lat = Number(p.lat), lon = Number(p.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  const at = Number(p.at);
  return {
    name: String(p.name || '').slice(0, 60),
    region: String(p.region || '').slice(0, 60),
    country: String(p.country || '').slice(0, 60),
    // Zwei Nachkommastellen, egal woher der Ort kommt. Beim automatischen
    // Standort ist das keine Bequemlichkeit, sondern die Grenze: gut einen
    // Kilometer genau reist auch dann, wenn das Gerät es auf drei Meter
    // wüsste.
    lat: Math.round(lat * 100) / 100,
    lon: Math.round(lon * 100) / 100,
    // Woher er kommt und wie frisch er ist — beides zeigt die Karte an
    auto: !!p.auto,
    at: Number.isFinite(at) && at > 0 ? at : 0
  };
}

/** Das, was der Partner von mir sehen darf. */
export function publicProfile(state) {
  const p = state.me.pet;
  return {
    code: state.me.code,
    name: state.me.name || 'Dein Mensch',
    tz: state.me.tz,
    pet: {
      name: p.name,
      look: p.look,
      stats: p.stats,
      level: p.level,
      asleep: !!p.asleep
    },
    mood: state.me.mood,
    activity: state.me.activity,
    // Nur der grobe Ort, und nur wenn selbst gesetzt — fürs Wetter reicht das
    place: state.me.place || null,
    bondXp: state.bond.xp,
    at: Date.now()
  };
}
