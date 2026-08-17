/**
 * Ein sehr kleiner reaktiver Store.
 *
 * Mutieren, `commit()` rufen, fertig — alle Abonnenten rendern neu und der
 * Zustand landet gedrosselt im localStorage. Reicht vollkommen für eine App
 * dieser Größe und spart 40 kB Framework.
 */

import { createState, migrate } from './model.js';

const KEY = 'knuddl.state.v1';

let state = createState();
const subs = new Set();
const bus = new Map();
let saveTimer = null;
let batching = 0;
let dirty = false;

/* ── Laden / Speichern ──────────────────────────────────── */

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    state = raw ? migrate(JSON.parse(raw)) : createState();
  } catch (err) {
    console.warn('[knuddl] Speicherstand unlesbar, starte neu:', err);
    state = createState();
  }
  return state;
}

/**
 * Der Speicher ist begrenzt (meist 5 MB) und Zeichnungen aus dem
 * Kritzel-Telefon sind das Größte, was hier hineinwandert. Läuft er voll,
 * hilft stilles Scheitern niemandem — dann fliegt der älteste Ballast raus
 * und es wird noch einmal versucht. Erst wenn auch das nichts bringt, geben
 * wir auf und sagen es.
 */
export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch (err) {
    if (!isQuota(err)) { console.warn('[knuddl] Konnte nicht speichern:', err); return false; }

    // Nach Größe geordnet: die liegen gebliebene Zeichnung ist der dickste
    // Brocken, danach Verlauf und Briefkasten.
    const trims = [
      () => { if (state.games?.doodle) state.games.doodle.pending = null; },
      () => { state.games?.doodle?.hist?.splice(6); },
      () => { state.feed.splice(30); },
      () => { state.outbox.splice(0, Math.max(0, state.outbox.length - 20)); },
      () => { state.rates?.splice(12); state.polls?.splice(12); },
      () => { state.seen.splice(0, Math.max(0, state.seen.length - 60)); },
      () => { state.feed.splice(8); }
    ];

    for (const trim of trims) {
      try { trim(); } catch { /* egal */ }
      try {
        localStorage.setItem(KEY, JSON.stringify(state));
        console.warn('[knuddl] Speicher war voll — Ältestes verworfen.');
        return true;
      } catch (again) {
        if (!isQuota(again)) return false;
      }
    }

    console.error('[knuddl] Speicher voll, nichts mehr zu verwerfen.');
    emit('storage-full', null);
    return false;
  }
}

const isQuota = (err) =>
  err && (err.name === 'QuotaExceededError'
    || err.name === 'NS_ERROR_DOM_QUOTA_REACHED'
    || err.code === 22 || err.code === 1014);

let pendingSave = false;

function scheduleSave() {
  pendingSave = true;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { pendingSave = false; save(); }, 350);
}

/**
 * Sofort schreiben, aber nur wenn wirklich etwas aussteht.
 *
 * Gedacht für den Moment, in dem die App weggewischt wird — da wäre der
 * gedrosselte Timer noch nicht gelaufen. Ohne die Prüfung würde jeder
 * Tabwechsel den Stand blind überschreiben, auch den, den ein zweiter
 * offener Tab gerade frisch geschrieben hat.
 */
export function flushSave() {
  if (!pendingSave) return false;
  clearTimeout(saveTimer);
  pendingSave = false;
  return save();
}

/* ── Lesen / Schreiben ──────────────────────────────────── */

export const get = () => state;

/** Änderung anwenden und alle informieren. */
export function commit(reason = 'update') {
  if (batching > 0) { dirty = true; return; }
  scheduleSave();
  subs.forEach((fn) => {
    try { fn(state, reason); } catch (err) { console.error('[knuddl] Subscriber-Fehler:', err); }
  });
}

/** Mehrere Mutationen zu einem einzigen Render zusammenfassen. */
export function batch(fn, reason = 'batch') {
  batching++;
  try { fn(state); } finally {
    batching--;
    if (batching === 0 && dirty) { dirty = false; commit(reason); }
  }
}

/** Bequemer Einzeiler: update(s => { s.me.coins += 5 }) */
export function update(fn, reason = 'update') {
  const r = fn(state);
  commit(reason);
  return r;
}

export function subscribe(fn) {
  subs.add(fn);
  return () => subs.delete(fn);
}

/* ── Event-Bus (App-intern, nicht persistiert) ──────────── */

export function emit(type, detail) {
  (bus.get(type) || []).slice().forEach((fn) => {
    try { fn(detail); } catch (err) { console.error(`[knuddl] on(${type}):`, err); }
  });
}

export function on(type, fn) {
  if (!bus.has(type)) bus.set(type, []);
  bus.get(type).push(fn);
  return () => {
    const arr = bus.get(type) || [];
    const i = arr.indexOf(fn);
    if (i >= 0) arr.splice(i, 1);
  };
}

/* ── Sicherung ──────────────────────────────────────────── */

export function exportJson() {
  return JSON.stringify(state, null, 2);
}

export function importJson(text) {
  const parsed = JSON.parse(text);
  state = migrate(parsed);
  save();
  commit('import');
  return state;
}

export function reset() {
  state = createState();
  save();
  commit('reset');
  return state;
}

/** Nur für Tests / den Sync-Layer: Zustand komplett ersetzen. */
export function replace(next) {
  state = next;
  commit('replace');
  return state;
}
