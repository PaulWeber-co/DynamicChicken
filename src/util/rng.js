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

/** Kurze, gut vorlesbare Codes (ohne verwechselbare Zeichen). */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function shortCode(len = 6) {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
}
