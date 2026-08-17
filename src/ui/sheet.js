/**
 * Sheets — die von unten hereinfahrenden Karten.
 * Mit Griff, Scrim, Wischen zum Schließen und Escape-Taste.
 */

import { $ } from '../util/dom.js';
import { icon } from './icons.js';
import { haptic } from '../util/feedback.js';

let openSheet = null;

/**
 * @param {object} o { title, body (HTML), full, onMount(el, api), onClose }
 * @returns {{close:Function, el:HTMLElement}}
 */
export function sheet(o = {}) {
  closeSheet(true);

  const root = $('#sheet-root');
  const scrim = document.createElement('div');
  scrim.className = 'sheet-scrim';

  const el = document.createElement('div');
  el.className = 'sheet' + (o.full ? ' sheet-full' : '');
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  if (o.title) el.setAttribute('aria-label', o.title);

  el.innerHTML = `
    <div class="sheet-grab" data-grab></div>
    ${o.title === null ? '' : `<div class="sheet-head">
      <div class="sheet-title">${o.title || ''}</div>
      <button class="sheet-x" data-x aria-label="Schließen">${icon('close', { size: 14 })}</button>
    </div>`}
    <div class="sheet-body" data-body>${o.body || ''}</div>`;

  root.appendChild(scrim);
  root.appendChild(el);
  document.body.style.overflow = 'hidden';

  const api = {
    el,
    body: el.querySelector('[data-body]'),
    close: () => closeSheet(),
    setBody: (html) => { api.body.innerHTML = html; }
  };

  const onKey = (e) => { if (e.key === 'Escape') closeSheet(); };
  document.addEventListener('keydown', onKey);

  openSheet = { el, scrim, onClose: o.onClose, onKey };

  scrim.addEventListener('click', () => closeSheet());
  el.querySelector('[data-x]')?.addEventListener('click', () => closeSheet());

  // Griff nach unten ziehen
  const grab = el.querySelector('[data-grab]');
  let startY = 0, dy = 0, dragging = false;
  const down = (e) => { dragging = true; startY = e.clientY; el.style.transition = 'none'; };
  const move = (e) => {
    if (!dragging) return;
    dy = Math.max(0, e.clientY - startY);
    el.style.transform = `translate(-50%, ${dy}px)`;
  };
  const up = () => {
    if (!dragging) return;
    dragging = false;
    el.style.transition = '';
    el.style.transform = '';
    if (dy > 110) { haptic(12); closeSheet(); }
    dy = 0;
  };
  grab.addEventListener('pointerdown', down);
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
  openSheet.cleanup = () => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
  };

  o.onMount?.(api.body, api);
  return api;
}

export function closeSheet(immediate = false) {
  if (!openSheet) return;
  const { el, scrim, onClose, onKey, cleanup } = openSheet;
  openSheet = null;
  document.removeEventListener('keydown', onKey);
  cleanup?.();
  document.body.style.overflow = '';

  if (immediate) { el.remove(); scrim.remove(); onClose?.(); return; }
  el.classList.add('closing');
  scrim.classList.add('closing');
  setTimeout(() => { el.remove(); scrim.remove(); onClose?.(); }, 210);
}

export const isSheetOpen = () => !!openSheet;
