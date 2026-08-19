/**
 * Deterministischer Zufall.
 *
 * Der Grund, warum das hier wichtig ist: Wenn ihr zeitversetzt spielt, müsst
 * ihr beide *exakt dieselbe* Runde bekommen — dieselben Körner, dieselben
 * Karten, dieselben Bomben. Mit einem gemeinsamen Seed erzeugt jedes Gerät
 * die Runde lokal neu, ganz ohne Server.
 */

/**
 * mulberry32 — klein, schnell, gut genug.
 *
 * Nimmt auch eine Zeichenkette an. Ohne diese Zeile würde `'abc' >>> 0`
 * still zu 0 werden: jede Runde bekäme dieselben Karten, ohne dass es
 * irgendwo knallt.
 */
export function rng(seed) {
  let a = (typeof seed === 'string' ? hashSeed(seed) : Number(seed) || 0) >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashSeed(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Runden-Seed aus Spiel-ID + Datum + Paarcode: für beide Seiten gleich. */
export function roundSeed(gameId, roundKey, pairKey = '') {
  return hashSeed(`${gameId}|${roundKey}|${pairKey}`);
}

export const pick = (arr, r = Math.random) => arr[Math.floor(r() * arr.length)];

export function shuffle(arr, r = Math.random) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Ziehen ohne Zurücklegen — über beliebig viele Runden hinweg.
 *
 * Ein reiner Hash („Frage Nummer h % 18“) trifft nach ein paar Wochen
 * zwangsläufig wieder dieselbe Frage, oft sogar zweimal hintereinander. Statt
 * dessen wird der ganze Vorrat einmal gemischt und der Reihe nach abgearbeitet:
 * Erst wenn er leer ist, wird neu gemischt — mit anderem Startwert, damit die
 * zweite Runde eine andere Reihenfolge hat.
 *
 * Das Ergebnis hängt nur an `index` und `salt`, nicht an gespeicherten Daten.
 * Beide Geräte rechnen also dasselbe aus, ohne sich abzusprechen.
 *
 * @param {Array} pool    der Vorrat
 * @param {number} index  fortlaufende Nummer (Tag, Runde, …)
 * @param {number|string} salt  pro Paar verschieden, damit nicht alle dasselbe sehen
 */
export function cycled(pool, index, salt = 0) {
  if (!pool.length) return undefined;
  const i = Math.max(0, Math.floor(index));
  const s = typeof salt === 'string' ? hashSeed(salt) : (Number(salt) || 0) >>> 0;
  return reihenfolge(pool, Math.floor(i / pool.length), s)[i % pool.length];
}

/**
 * Die Reihenfolge einer Runde.
 *
 * Neu mischen allein reicht nicht: Was ganz am Ende der alten Runde lag,
 * könnte gleich am Anfang der neuen wieder auftauchen — dann stünde dieselbe
 * Frage zwei Tage später nochmal da, obwohl der Vorrat über hundert Einträge
 * hat. Deshalb wird der Anfang jeder neuen Runde vom Ende der vorigen
 * freigeräumt (`entzerren`). Weil das auf der vorigen Reihenfolge aufbaut,
 * werden ein paar Runden davor mitgerechnet — vier reichen, weiter zurück
 * ändert am Anfang nichts mehr.
 */
let cacheKey = '';
let cacheVal = null;
function reihenfolge(pool, runde, s) {
  const key = `${pool.length}|${runde}|${s}|${pool[0]}`;
  if (key === cacheKey && cacheVal) return cacheVal;
  let vor = null, cur = null;
  for (let n = Math.max(0, runde - 4); n <= runde; n++) {
    cur = shuffle(pool, rng((s ^ Math.imul(n + 1, 0x9e3779b1)) >>> 0));
    if (vor) entzerren(cur, vor);
    vor = cur;
  }
  cacheKey = key;
  cacheVal = cur;
  return cur;
}

/** Was zuletzt dran war, darf am Anfang der nächsten Runde nicht stehen. */
function entzerren(neu, alt) {
  const abstand = Math.floor(neu.length * 0.4);
  if (abstand < 2) return;
  const schwanz = new Set(alt.slice(alt.length - abstand));
  for (let i = 0; i < abstand; i++) {
    if (!schwanz.has(neu[i])) continue;
    for (let j = abstand; j < neu.length; j++) {
      if (schwanz.has(neu[j])) continue;
      [neu[i], neu[j]] = [neu[j], neu[i]];
      break;
    }
  }
}

/**
 * Dasselbe für mehrere auf einmal: `n` verschiedene Einträge pro Ziehung,
 * und auch über die Ziehungen hinweg wiederholt sich nichts, solange der
 * Vorrat reicht.
 */
export function cycledMany(pool, n, index, salt = 0) {
  const out = [];
  if (!pool.length) return out;
  const anzahl = Math.min(n, pool.length);
  // An der Nahtstelle zwischen zwei Mischungen kann ein Eintrag zweimal
  // fallen — dann wird einfach weitergezogen, bis `n` verschiedene da sind.
  for (let k = 0; out.length < anzahl && k < anzahl + pool.length; k++) {
    const x = cycled(pool, index * anzahl + k, salt);
    if (!out.includes(x)) out.push(x);
  }
  return out;
}

/** Kurze, gut vorlesbare Codes (ohne verwechselbare Zeichen). */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function shortCode(len = 6) {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
}
