/**
 * Haptik, Töne und Konfetti.
 *
 * Klänge werden per WebAudio synthetisiert statt geladen — die App bleibt
 * dadurch komplett asset-frei und funktioniert offline ab der ersten Sekunde.
 */

import { icon } from '../ui/icons.js';

let audioCtx = null;
let prefs = { haptics: true, sound: true };

export function setFeedbackPrefs(p) { prefs = { ...prefs, ...p }; }

function ctx() {
  if (!prefs.sound) return null;
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

/** Weiche Sinustöne, kurze Hüllkurve — nie schrill. */
function blip(freq, dur = 0.11, type = 'sine', gain = 0.07, delay = 0) {
  const ac = ctx();
  if (!ac) return;
  const t0 = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

const CHORDS = {
  tap:     [[660, 0.07, 'sine', 0.05, 0]],
  pop:     [[880, 0.09, 'sine', 0.06, 0], [1320, 0.07, 'sine', 0.035, 0.04]],
  yay:     [[523, 0.1, 'sine', 0.06, 0], [659, 0.1, 'sine', 0.06, 0.08], [784, 0.18, 'sine', 0.06, 0.16]],
  love:    [[698, 0.12, 'sine', 0.055, 0], [880, 0.2, 'sine', 0.05, 0.1]],
  eat:     [[320, 0.07, 'triangle', 0.06, 0], [260, 0.08, 'triangle', 0.05, 0.07]],
  coin:    [[988, 0.06, 'square', 0.03, 0], [1319, 0.11, 'square', 0.025, 0.05]],
  fail:    [[300, 0.14, 'sawtooth', 0.035, 0], [220, 0.2, 'sawtooth', 0.03, 0.1]],
  arrive:  [[587, 0.09, 'sine', 0.05, 0], [880, 0.14, 'sine', 0.045, 0.07]],
  cluck:   [[440, 0.05, 'square', 0.028, 0], [620, 0.05, 'square', 0.022, 0.05], [380, 0.07, 'square', 0.02, 0.1]]
};

const HAPTICS = {
  tap: 8, pop: 14, yay: [18, 40, 22], love: [12, 30, 12, 30, 24],
  eat: [10, 20, 10], coin: 10, fail: [30, 50, 30], arrive: [14, 26, 14], cluck: [6, 18, 6]
};

/** Ein Effekt = ein Klang + eine Vibration. */
export function fx(kind = 'tap') {
  const chord = CHORDS[kind];
  if (chord) chord.forEach((a) => blip(...a));
  if (prefs.haptics && navigator.vibrate) {
    try { navigator.vibrate(HAPTICS[kind] ?? 8); } catch { /* egal */ }
  }
}

export const haptic = (pattern = 8) => {
  if (prefs.haptics && navigator.vibrate) {
    try { navigator.vibrate(pattern); } catch { /* egal */ }
  }
};

/* ── Konfetti / Herzchen ────────────────────────────────── */


let fxLayer = null;
function layer() {
  if (!fxLayer || !fxLayer.isConnected) {
    fxLayer = document.createElement('div');
    fxLayer.className = 'fx-layer';
    document.body.appendChild(fxLayer);
  }
  return fxLayer;
}

/**
 * Lässt kleine Icons von einem Punkt (oder einem Element) aufsteigen.
 * @param {string[]} names  Icon-Namen aus ui/icons.js
 * @param {object} o { x, y, from, count, spread, rise, duration }
 */
export function burst(names = ['statJoy'], o = {}) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const host = layer();
  let { x, y } = o;
  if (o.from) {
    const r = o.from.getBoundingClientRect();
    x = r.left + r.width / 2;
    y = r.top + r.height / 2;
  }
  if (x == null) x = window.innerWidth / 2;
  if (y == null) y = window.innerHeight / 2;

  const count = o.count ?? 10;
  const spread = o.spread ?? 130;
  const rise = o.rise ?? 170;
  const dur = o.duration ?? 1250;

  for (let i = 0; i < count; i++) {
    const b = document.createElement('span');
    b.className = 'fx-bit';
    b.innerHTML = icon(names[Math.floor(Math.random() * names.length)], { size: 16 + Math.round(Math.random() * 16) });
    b.style.left = `${x}px`;
    b.style.top = `${y}px`;
    b.style.setProperty('--fx-x', `${(Math.random() - 0.5) * spread}px`);
    b.style.setProperty('--fx-y', `${-rise - Math.random() * 110}px`);
    b.style.setProperty('--fx-r', `${(Math.random() - 0.5) * 220}deg`);
    b.style.setProperty('--fx-dur', `${dur + Math.random() * 500}ms`);
    b.style.animationDelay = `${Math.random() * 160}ms`;
    host.appendChild(b);
    setTimeout(() => b.remove(), dur + 900);
  }
}

/** Großer Moment: Regen von oben. */
export function confetti(names = ['statJoy', 'sparkle', 'grain', 'egg', 'feather']) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const host = layer();
  for (let i = 0; i < 26; i++) {
    const b = document.createElement('span');
    b.className = 'fx-bit';
    b.innerHTML = icon(names[Math.floor(Math.random() * names.length)], { size: 16 + Math.round(Math.random() * 18) });
    b.style.left = `${Math.random() * 100}vw`;
    b.style.top = `-30px`;
    b.style.setProperty('--fx-x', `${(Math.random() - 0.5) * 160}px`);
    b.style.setProperty('--fx-y', `${window.innerHeight + 80}px`);
    b.style.setProperty('--fx-r', `${(Math.random() - 0.5) * 720}deg`);
    b.style.setProperty('--fx-dur', `${1800 + Math.random() * 1400}ms`);
    b.style.animationDelay = `${Math.random() * 700}ms`;
    host.appendChild(b);
    setTimeout(() => b.remove(), 4200);
  }
}
