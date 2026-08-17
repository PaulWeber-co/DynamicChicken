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
import { STARTER_INVENTORY } from './catalog.js';

export const SCHEMA_VERSION = 1;

/** Verfall pro Stunde, wach. */
const DECAY = { full: 6.5, energy: 4.6, clean: 3.2, joy: 4.0 };
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
      inv: { ...STARTER_INVENTORY },
      owned: { hat: ['none'], acc: ['none'] },
      mood: null,
      activity: null,
      lastActive: t
    },
    partner: null,
    bond: { xp: 0, level: 1, streak: 0, lastDay: null, hugs: 0, since: null },
    feed: [],
    games: {},
    daily: null,
    outbox: [],
    seen: [],
    settings: {
      theme: 'auto',
      haptics: true,
      sound: true,
      notify: false,
      syncMode: 'solo',
      cloudUrl: '',
      soloName: 'Mila'
    }
  };
}

export function newPet(name = 'Knuddl', seed = 0, t = Date.now()) {
  return {
    name,
    look: defaultLook(seed),
    stats: { full: 78, energy: 84, clean: 88, joy: 82 },
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
 * Holt die Statuswerte auf „jetzt" nach.
 * @returns {{hours:number, wokeUp:boolean}} was in der Pause passiert ist
 */
export function tickPet(pet, t = Date.now()) {
  const last = pet.lastTick || t;
  const hours = Math.max(0, (t - last) / HOUR);
  pet.lastTick = t;
  if (hours <= 0) return { hours: 0, wokeUp: false };

  const s = pet.stats;
  let wokeUp = false;

  if (pet.asleep) {
    s.energy = clamp100(s.energy + SLEEP_GAIN.energy * hours);
    s.joy = clamp100(s.joy + SLEEP_GAIN.joy * hours);
    // Hunger läuft im Schlaf langsamer weiter
    s.full = clamp100(s.full - DECAY.full * 0.45 * hours);
    s.clean = clamp100(s.clean - DECAY.clean * 0.3 * hours);
    if (s.energy >= 100) {
      pet.asleep = false;
      pet.asleepSince = null;
      wokeUp = true;
    }
  } else {
    s.full = clamp100(s.full - DECAY.full * hours);
    s.energy = clamp100(s.energy - DECAY.energy * hours);
    s.clean = clamp100(s.clean - DECAY.clean * hours);

    // Vernachlässigung schlägt auf die Laune
    let joyDrain = DECAY.joy;
    if (s.full < 25) joyDrain += 3.5;
    if (s.clean < 25) joyDrain += 2.5;
    if (s.energy < 20) joyDrain += 2.0;
    s.joy = clamp100(s.joy - joyDrain * hours);
  }

  return { hours, wokeUp };
}

/** Gesamtzustand 0–100, für Level-Boni und die „Turnierform". */
export function wellbeing(pet) {
  const s = pet.stats;
  return Math.round((s.full + s.energy + s.clean + s.joy) / 4);
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
    { key: 'full',   v: s.full,   icon: 'statFull',  text: 'hat Hunger' },
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

/** Macht aus einem alten oder kaputten Speicherstand einen gültigen. */
export function migrate(raw) {
  const base = createState();
  if (!raw || typeof raw !== 'object') return base;

  const s = { ...base, ...raw, v: SCHEMA_VERSION };
  s.me = { ...base.me, ...(raw.me || {}) };
  s.me.pet = { ...base.me.pet, ...(raw.me?.pet || {}) };
  s.me.pet.stats = { ...base.me.pet.stats, ...(raw.me?.pet?.stats || {}) };
  s.me.pet.look = { ...base.me.pet.look, ...(raw.me?.pet?.look || {}) };
  s.me.owned = {
    hat: Array.from(new Set(['none', ...(raw.me?.owned?.hat || [])])),
    acc: Array.from(new Set(['none', ...(raw.me?.owned?.acc || [])]))
  };
  s.me.inv = { ...(raw.me?.inv || {}) };
  s.settings = { ...base.settings, ...(raw.settings || {}) };
  s.bond = { ...base.bond, ...(raw.bond || {}) };
  s.feed = Array.isArray(raw.feed) ? raw.feed.slice(0, 90) : [];
  s.games = raw.games && typeof raw.games === 'object' ? raw.games : {};
  s.outbox = Array.isArray(raw.outbox) ? raw.outbox : [];
  s.seen = Array.isArray(raw.seen) ? raw.seen.slice(-200) : [];

  if (raw.partner && raw.partner.code) {
    s.partner = {
      linked: true,
      code: raw.partner.code,
      name: raw.partner.name || 'Dein Mensch',
      tz: raw.partner.tz || base.me.tz,
      pet: { ...newPet('Pieps', 3), ...(raw.partner.pet || {}) },
      mood: raw.partner.mood || null,
      activity: raw.partner.activity || null,
      lastSeen: raw.partner.lastSeen || 0,
      updatedAt: raw.partner.updatedAt || 0
    };
  } else {
    s.partner = null;
  }
  return s;
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
    bondXp: state.bond.xp,
    at: Date.now()
  };
}
