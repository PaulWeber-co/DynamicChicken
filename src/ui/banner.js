/**
 * Banner — die Stelle, an der ankommt, was dein Mensch schickt.
 *
 * Fährt oben herein, bleibt ein paar Sekunden, verschwindet wieder. Antippen
 * öffnet die dazugehörige Stelle, nach oben wischen schickt es weg. Kommt
 * etwas herein, während schon etwas liegt, stellt es sich an.
 */

import { $, esc } from '../util/dom.js';
import { fx, haptic } from '../util/feedback.js';
import { get, on as onBus, emit } from '../state/store.js';
import { renderHead } from '../pet/chicken.js';
import { icon } from './icons.js';

let root = null;
let queue = [];
let showing = null;
let hideTimer = 0;
let onAction = () => {};

export function initBanners({ onAct } = {}) {
  root = $('#banner-root');
  onAction = onAct || (() => {});
  onBus('notify', (n) => push(n));
  return { push, dismiss };
}

export function push(n) {
  if (!n) return;
  queue.push(n);
  if (!showing) next();
}

function next() {
  clearTimeout(hideTimer);
  const n = queue.shift();
  if (!n) { showing = null; return; }
  showing = n;
  render(n);
}

export function dismiss(immediate = false) {
  const el = root?.firstElementChild;
  clearTimeout(hideTimer);
  if (!el) { showing = null; releaseSpace(); next(); return; }
  if (immediate) { el.remove(); releaseSpace(); showing = null; next(); return; }
  el.classList.add('closing');
  setTimeout(() => {
    el.remove();
    showing = null;
    if (!queue.length) releaseSpace();
    next();
  }, 220);
}

/**
 * Der Banner liegt über dem Inhalt — damit er nichts verdeckt, rückt der
 * Screen um genau seine Höhe nach unten und danach wieder zurück.
 */
function reserveSpace() {
  requestAnimationFrame(() => {
    const h = root?.firstElementChild?.offsetHeight || 0;
    document.documentElement.style.setProperty('--banner-h', `${h + 10}px`);
  });
}
function releaseSpace() {
  document.documentElement.style.setProperty('--banner-h', '0px');
}

function render(n) {
  root.innerHTML = '';
  const s = get();

  const avatar = n.avatar === 'me' ? renderHead(s.me.pet.look, 40, n.petMood)
    : n.avatar === 'them' && s.partner ? renderHead(s.partner.pet.look, 40, n.petMood)
    : n.icon ? icon(n.icon, { size: 30 })
    : icon('mailHeart', { size: 30 });

  const actions = (n.actions || []).filter((a) => a.act !== 'dismiss').slice(0, 2);

  const el = document.createElement('div');
  el.className = `banner tone-${n.tone || 'warm'}`;
  el.setAttribute('role', 'status');
  el.innerHTML = `
    <div class="banner-grab"></div>
    <div class="banner-main">
      <div class="banner-avatar">${avatar}</div>
      <div class="banner-text">
        <div class="banner-title">${esc(n.title || '')}</div>
        ${n.sub ? `<div class="banner-sub">${esc(n.sub)}</div>` : ''}
      </div>
      <button class="banner-x" data-x aria-label="Schließen">${icon('close', { size: 15 })}</button>
    </div>
    ${actions.length ? `<div class="banner-actions">
      ${actions.map((a) => `<button class="banner-act ${a.primary ? 'is-primary' : ''}" data-act="${esc(a.act)}">${esc(a.label)}</button>`).join('')}
    </div>` : ''}`;

  root.appendChild(el);
  reserveSpace();
  fx(n.tone === 'love' ? 'love' : 'arrive');
  haptic(n.tone === 'love' ? [12, 24, 12] : 14);
  maybeSystemNotification(n);

  el.querySelector('[data-x]').onclick = (e) => { e.stopPropagation(); fx('tap'); dismiss(); };
  el.querySelectorAll('[data-act]').forEach((b) => {
    b.onclick = (e) => {
      e.stopPropagation();
      fx('tap');
      onAction(b.dataset.act, n);
      dismiss();
    };
  });

  // Auf den Banner tippen löst die Hauptaktion aus
  el.querySelector('.banner-main').onclick = () => {
    const primary = (n.actions || []).find((a) => a.primary) || (n.actions || [])[0];
    if (primary && primary.act !== 'dismiss') { fx('tap'); onAction(primary.act, n); }
    dismiss();
  };

  bindSwipe(el);

  hideTimer = setTimeout(dismiss, n.quiet ? 3400 : actions.length ? 6400 : 4800);
}

/** Nach oben wischen schickt den Banner weg. */
function bindSwipe(el) {
  let y0 = 0, dy = 0, dragging = false;
  const down = (e) => {
    dragging = true;
    y0 = e.clientY;
    el.style.transition = 'none';
    clearTimeout(hideTimer);
  };
  const move = (e) => {
    if (!dragging) return;
    dy = Math.min(0, e.clientY - y0);
    el.style.transform = `translateY(${dy}px)`;
    el.style.opacity = String(Math.max(0, 1 + dy / 90));
  };
  const up = () => {
    if (!dragging) return;
    dragging = false;
    el.style.transition = '';
    el.style.transform = '';
    el.style.opacity = '';
    if (dy < -40) { haptic(10); dismiss(); }
    else hideTimer = setTimeout(dismiss, 3000);
    dy = 0;
  };
  el.addEventListener('pointerdown', down);
  el.addEventListener('pointermove', move);
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
}

/** Wenn die App im Hintergrund liegt, geht es an das System weiter. */
function maybeSystemNotification(n) {
  const s = get();
  if (!s.settings.notify) return;
  if (document.visibilityState === 'visible') return;
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  try {
    new Notification(n.title || 'Knuddl', {
      body: n.body || n.sub || '',
      tag: n.kind || 'knuddl',
      icon: './icons/icon-192.png',
      badge: './icons/icon-192.png'
    });
  } catch { /* manche Browser erlauben das nur über den Service Worker */ }
}

export const notify = (n) => emit('notify', n);
