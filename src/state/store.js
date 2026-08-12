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

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('[knuddl] Konnte nicht speichern:', err);
  }
}

function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(save, 350);
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
