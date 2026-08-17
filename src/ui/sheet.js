/**
 * Sheets — die von unten hereinfahrenden Karten.
 * Mit Griff, Scrim, Wischen zum Schließen und Escape-Taste.
 */

import { $, esc } from '../util/dom.js';
import { icon } from './icons.js';
import { haptic } from '../util/feedback.js';

let openSheet = null;

/** Was man mit der Tabulatortaste erreichen können soll. */
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]),'
  + ' textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * @param {object} o { title, body (HTML), full, onMount(el, api), onClose }
 * @returns {{close:Function, el:HTMLElement}}
 */
export function sheet(o = {}) {
  closeSheet(true);

  const root = $('#sheet-root');
  const scrim = document.createElement('div');
  scrim.className = 'sheet-scrim';
  scrim.setAttribute('aria-hidden', 'true');

  const el = document.createElement('div');
  el.className = 'sheet' + (o.full ? ' sheet-full' : '');
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  // Damit der Fokus notfalls auf dem Sheet selbst landen kann
  el.setAttribute('tabindex', '-1');
  if (o.title) el.setAttribute('aria-label', o.title);

  // Der Titel kommt teils aus fremder Hand — etwa der Name, den dein Mensch
  // einer Bewertung gegeben hat. Also als Text, nicht als Markup.
  el.innerHTML = `
    <div class="sheet-grab" data-grab></div>
    ${o.title === null ? '' : `<div class="sheet-head">
      <div class="sheet-title">${esc(o.title || '')}</div>
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

  // Fokus einfangen: Ohne das wandert die Tabulatortaste hinter das Sheet
  // und man bedient blind die Seite darunter.
  const onKey = (e) => {
    if (e.key === 'Escape') { closeSheet(); return; }
    if (e.key !== 'Tab') return;
    const items = [...el.querySelectorAll(FOCUSABLE)].filter((n) => n.offsetParent !== null);
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    else if (!el.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
  };
  document.addEventListener('keydown', onKey);

  // Wohin der Fokus nach dem Schließen zurückkehrt
  const restoreTo = document.activeElement instanceof HTMLElement ? document.activeElement : null;

  openSheet = { el, scrim, onClose: o.onClose, onKey, restoreTo };

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

  // Das Sheet klebt unten — genau dort, wo auf dem Handy die Tastatur
  // aufgeht. iOS verkleinert dafür nicht das Layout, also würde das Feld
  // einfach darunter verschwinden. Beim Fokussieren holen wir es hoch.
  const intoView = (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;
    if (!target.matches('input, textarea, select')) return;
    setTimeout(() => target.scrollIntoView({ block: 'center', behavior: 'smooth' }), 320);
  };
  el.addEventListener('focusin', intoView);
  const prevCleanup = openSheet.cleanup;
  openSheet.cleanup = () => { prevCleanup?.(); el.removeEventListener('focusin', intoView); };

  o.onMount?.(api.body, api);

  // Wenn onMount nichts fokussiert hat, übernimmt das Sheet selbst — sonst
  // hinge der Fokus weiter an dem Knopf hinter dem Scrim.
  if (!el.contains(document.activeElement)) {
    const first = el.querySelector(FOCUSABLE);
    (first || el).focus?.({ preventScroll: true });
  }
  return api;
}

export function closeSheet(immediate = false) {
  if (!openSheet) return;
  const { el, scrim, onClose, onKey, cleanup, restoreTo } = openSheet;
  openSheet = null;
  document.removeEventListener('keydown', onKey);
  cleanup?.();
  document.body.style.overflow = '';
  if (restoreTo?.isConnected) restoreTo.focus({ preventScroll: true });

  if (immediate) { el.remove(); scrim.remove(); onClose?.(); return; }
  el.classList.add('closing');
  scrim.classList.add('closing');
  setTimeout(() => { el.remove(); scrim.remove(); onClose?.(); }, 210);
}

export const isSheetOpen = () => !!openSheet;
