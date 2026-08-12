/** Winzige DOM-Helfer — kein Framework, kein Build-Schritt. */

export const $  = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/** Setzt HTML und gibt das Element zurück. */
export function html(el, markup) {
  el.innerHTML = markup;
  return el;
}

/** Escaped Nutzertext, bevor er in ein Template geht. */
export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

/**
 * Delegierter Klick-Handler: `on(root, '[data-act]', 'click', fn)`.
 * Der Handler bekommt (event, matchedElement).
 */
export function on(root, selector, type, fn) {
  root.addEventListener(type, (e) => {
    const t = e.target.closest(selector);
    if (t && root.contains(t)) fn(e, t);
  });
}

/** Bindet alle `[data-act]`-Elemente an eine Handler-Map. */
export function acts(root, map) {
  on(root, '[data-act]', 'click', (e, el) => {
    const fn = map[el.dataset.act];
    if (fn) fn(el, e);
  });
}

export function el(tag, className, markup) {
  const n = document.createElement(tag);
  if (className) n.className = className;
  if (markup != null) n.innerHTML = markup;
  return n;
}

export const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
export const nextFrame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
export const wait = (ms) => new Promise((r) => setTimeout(r, ms));
