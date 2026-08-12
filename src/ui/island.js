/**
 * Die Dynamic Island.
 *
 * Ehrlich gesagt: Auf dem Web gibt es keinen Zugriff auf die echte Insel des
 * iPhones — die gehört dem Betriebssystem. Was hier passiert, ist die
 * konsequente Nachbildung: eine schwarze Pille direkt unter der Notch, die
 * sich mit derselben Federkurve morpht, Benachrichtigungen als Tropfen
 * heranfliegen lässt und laufende Aktivitäten anzeigt. Als Home-Screen-App
 * sitzt sie exakt dort, wo das Hardware-Pendant wäre — und auf jedem anderen
 * Gerät bekommt man dasselbe Gefühl geschenkt.
 *
 * Drei Zustände:
 *   dormant   schmale Pille, Knuddl lugt heraus, Punkt zeigt den Partner
 *   compact   eine Zeile: was ist gerade passiert
 *   expanded  volle Karte mit Aktionen
 */

import { $, esc } from '../util/dom.js';
import { fx, haptic } from '../util/feedback.js';
import { get, on as onBus, emit } from '../state/store.js';
import { renderPeek, renderHead } from '../pet/chicken.js';
import { urgentNeed } from '../state/model.js';
import { partnerOnline } from '../sync/index.js';
import { hourIn } from '../util/time.js';

let elLayer, elIsland, elShape, elInner, elSat, elScrim;
let mode = 'dormant';
let queue = [];
let showing = null;
let live = new Map();
let collapseTimer = 0;
let expandTimer = 0;
let onAction = () => {};

/* ── Aufbau ─────────────────────────────────────────────── */

export function initIsland({ onAct } = {}) {
  elLayer = $('#island-layer');
  elIsland = $('#island');
  elShape = $('.island-shape');
  elInner = $('#island-inner');
  elSat = $('#island-satellite');
  elScrim = $('#island-scrim');
  onAction = onAct || (() => {});

  elIsland.addEventListener('click', (e) => {
    const act = e.target.closest('[data-isl-act]');
    if (act) {
      e.stopPropagation();
      const a = act.dataset.islAct;
      fx('tap');
      if (a === 'dismiss') { collapse(true); return; }
      onAction(a, showing);
      collapse(true);
      return;
    }
    toggle();
  });

  elIsland.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    if (e.key === 'Escape') collapse(true);
  });

  elScrim.addEventListener('click', () => collapse(true));

  onBus('notify', (n) => notify(n));
  onBus('sync', () => { if (mode === 'dormant') renderDormant(); });
  onBus('partner', () => { if (mode === 'dormant') renderDormant(); });

  renderDormant();
  return { notify, setLive, clearLive, collapse, expandNow };
}

/* ── Zustandswechsel ────────────────────────────────────── */

function setMode(next) {
  mode = next;
  elLayer.dataset.mode = next;
  elIsland.setAttribute('aria-label',
    next === 'expanded' ? 'Dynamic Island schließen' : 'Dynamic Island öffnen');
  elScrim.hidden = next !== 'expanded';
}

function toggle() {
  haptic(10);
  if (mode === 'expanded') { collapse(true); return; }
  if (showing) { expand(); return; }
  // Ohne Benachrichtigung wird die Insel zum kleinen Schnellzugriff.
  showing = quickPanel();
  expand();
}

export function expandNow(n) {
  showing = n;
  expand();
}

function expand() {
  clearTimeout(collapseTimer);
  setMode('expanded');
  renderExpanded(showing);
  fx('pop');
}

export function collapse(immediate = false) {
  clearTimeout(collapseTimer);
  clearTimeout(expandTimer);
  if (immediate) {
    showing = null;
    setMode('dormant');
    renderDormant();
    next();
    return;
  }
  setMode('compact');
}

/* ── Warteschlange ──────────────────────────────────────── */

/**
 * Zeigt eine Benachrichtigung. Kommt eine herein, während schon eine läuft,
 * stellt sie sich an — genau wie beim Original.
 */
export function notify(n) {
  if (!n) return;
  queue.push(n);
  if (mode === 'dormant') next();
}

function next() {
  if (mode === 'expanded') return;
  const n = queue.shift();
  if (!n) { showing = null; setMode('dormant'); renderDormant(); return; }

  showing = n;
  flySatellite();
  setTimeout(() => {
    setMode('compact');
    renderCompact(n);
    elLayer.classList.remove('jiggle');
    void elLayer.offsetWidth;
    elLayer.classList.add('jiggle');
    fx(n.tone === 'love' ? 'love' : 'arrive');
    maybeSystemNotification(n);
  }, 260);

  clearTimeout(collapseTimer);
  collapseTimer = setTimeout(() => {
    if (mode === 'compact') { showing = null; setMode('dormant'); renderDormant(); next(); }
  }, n.quiet ? 3600 : 5600);
}

function flySatellite() {
  elSat.classList.remove('fly');
  void elSat.offsetWidth;
  elSat.classList.add('fly');
}

/* ── Live-Aktivitäten ───────────────────────────────────── */

/**
 * Etwas, das andauert: Knuddl schläft, ihr kuschelt gerade, eine Spielrunde
 * läuft. Wird gezeigt, solange nichts Wichtigeres da ist.
 */
export function setLive(key, data) {
  live.set(key, data);
  if (mode === 'dormant') renderDormant();
}

export function clearLive(key) {
  live.delete(key);
  if (mode === 'dormant') renderDormant();
}

/* ── Darstellung ────────────────────────────────────────── */

function renderDormant() {
  const s = get();
  const act = [...live.values()].sort((a, b) => (b.priority || 0) - (a.priority || 0))[0];

  if (act) {
    // Optisch breit wie „compact", logisch weiter im Ruhezustand:
    // die laufende Aktivität darf jederzeit von einer Meldung abgelöst werden.
    mode = 'dormant';
    elLayer.dataset.mode = 'compact';
    elInner.innerHTML = `
      <div class="isl-compact">
        <div class="isl-lead">${act.emoji}</div>
        <div class="isl-text">
          <div class="isl-t1">${esc(act.title)}</div>
          ${act.sub ? `<div class="isl-t2">${esc(act.sub)}</div>` : ''}
        </div>
        <div class="isl-trail">${act.trail || ''}</div>
      </div>`;
    syncShape();
    return;
  }

  elLayer.dataset.mode = 'dormant';
  const state = presenceState(s);
  elInner.innerHTML = `
    <div class="isl-dormant">
      <span class="isl-peek">${renderPeek(s.me.pet.look)}</span>
      <span class="isl-pulse" data-state="${state}" title="${presenceLabel(state, s)}"></span>
    </div>`;
  syncShape();
}

/**
 * Die gefilterte schwarze Form kennt den Inhalt nicht — sie liegt auf einer
 * eigenen Ebene. Nach jedem Rendern messen wir die Inhaltsebene und geben der
 * Form dieselbe Höhe, damit nichts über den Rand hinausragt.
 */
function syncShape() {
  requestAnimationFrame(() => {
    if (!elShape || !elIsland) return;
    elShape.style.height = `${elIsland.offsetHeight}px`;
  });
}

function renderCompact(n) {
  elInner.innerHTML = `
    <div class="isl-compact">
      <div class="isl-lead">${n.emoji || '💛'}</div>
      <div class="isl-text">
        <div class="isl-t1">${esc(n.title || '')}</div>
        ${n.sub ? `<div class="isl-t2">${esc(n.sub)}</div>` : ''}
      </div>
      <div class="isl-trail">${n.trail || '›'}</div>
    </div>`;
  syncShape();
}

function renderExpanded(n) {
  if (!n) { renderDormant(); return; }
  const s = get();
  const avatar = n.avatar === 'me' ? renderHead(s.me.pet.look, 40)
    : n.avatar === 'them' && s.partner ? renderHead(s.partner.pet.look, 40)
    : '';

  const actions = (n.actions || []).slice(0, 3);
  elInner.innerHTML = `
    <div class="isl-expanded">
      <div class="isl-x-head">
        <div class="isl-x-avatar">${avatar || `<span style="font-size:22px">${n.emoji || '💛'}</span>`}</div>
        <div class="grow">
          <div class="isl-x-title">${esc(n.title || '')}</div>
          ${n.sub ? `<div class="isl-x-sub">${esc(n.sub)}</div>` : ''}
        </div>
        ${n.badge ? `<div class="isl-trail">${n.badge}</div>` : ''}
      </div>
      ${n.body ? `<div class="isl-x-body">${esc(n.body)}</div>` : ''}
      ${n.bar != null ? `<div class="isl-bar"><i style="width:${Math.round(n.bar * 100)}%"></i></div>` : ''}
      ${actions.length ? `<div class="isl-x-actions">
        ${actions.map((a) => `<button class="isl-act ${a.primary ? 'isl-act-primary' : a.warm ? 'isl-act-warm' : ''}" data-isl-act="${esc(a.act)}">${esc(a.label)}</button>`).join('')}
      </div>` : ''}
    </div>`;
  syncShape();
}

/* ── Schnellzugriff, wenn nichts anliegt ────────────────── */

function quickPanel() {
  const s = get();
  const pet = s.me.pet;
  const need = urgentNeed(pet);
  const online = partnerOnline();
  const p = s.partner;

  const actions = [
    { label: 'Füttern', act: 'open:feed', warm: true },
    { label: 'Knuddeln', act: 'nudge:knuddel', primary: true },
    { label: 'Spielen', act: 'open:games' }
  ];

  return {
    kind: 'quick',
    emoji: pet.asleep ? '💤' : need ? need.emoji : '🐥',
    avatar: 'me',
    title: pet.name,
    sub: pet.asleep ? 'schläft gerade'
      : need ? `${need.text}` : `Level ${pet.level} · alles gut`,
    body: p
      ? `${p.name} ist ${online ? 'gerade online' : 'gerade nicht da'}. ${statLine(pet)}`
      : `Noch niemand verbunden. ${statLine(pet)}`,
    actions
  };
}

const statLine = (pet) =>
  `Satt ${Math.round(pet.stats.full)} · Energie ${Math.round(pet.stats.energy)} · Laune ${Math.round(pet.stats.joy)}`;

/* ── Präsenz ────────────────────────────────────────────── */

function presenceState(s) {
  if (!s.partner) return 'offline';
  if (s.partner.pet?.asleep) return 'asleep';
  const h = hourIn(s.partner.tz);
  if (h >= 1 && h < 7) return 'asleep';
  if (partnerOnline()) return 'online';
  const seen = s.partner.lastSeen || 0;
  if (Date.now() - seen < 2 * 3600_000) return 'away';
  return 'offline';
}

function presenceLabel(state, s) {
  const name = s.partner?.name || 'Partner';
  return {
    online: `${name} ist online`,
    away: `${name} war eben noch da`,
    asleep: `${name} schläft wahrscheinlich`,
    offline: s.partner ? `${name} ist offline` : 'Noch nicht verbunden'
  }[state];
}

/* ── Systembenachrichtigung, wenn die App im Hintergrund ist ── */

function maybeSystemNotification(n) {
  const s = get();
  if (!s.settings.notify) return;
  if (document.visibilityState === 'visible') return;
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  try {
    new Notification(`${n.emoji || '🐥'} ${n.title}`, {
      body: n.body || n.sub || '',
      tag: n.kind || 'knuddl',
      icon: './icons/icon-192.png',
      badge: './icons/icon-192.png'
    });
  } catch { /* manche Browser erlauben das nur über den Service Worker */ }
}

/** Von außen: eine Meldung erzeugen, ohne den Bus zu bemühen. */
export const pushNotify = (n) => emit('notify', n);
