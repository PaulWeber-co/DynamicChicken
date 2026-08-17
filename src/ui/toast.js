/**
 * Kurze Rückmeldungen am unteren Rand.
 *
 * Der Text kommt oft aus fremder Hand — „unterwegs zu <Name des Partners>“ —
 * und wird deshalb als Text gesetzt, nicht als Markup. Nur das Icon davor
 * ist eigenes SVG.
 */

import { $ } from '../util/dom.js';
import { icon } from './icons.js';

let root = null;

export function toast(text, iconName = '') {
  root ||= $('#toast-root');
  if (!root) return;

  const t = document.createElement('div');
  t.className = 'toast';
  if (iconName) t.innerHTML = icon(iconName, { size: 20 });
  const span = document.createElement('span');
  span.textContent = String(text ?? '');
  t.appendChild(span);
  root.appendChild(t);

  // Höchstens drei gleichzeitig — sonst wird es eine Wand.
  while (root.children.length > 3) root.firstChild.remove();

  setTimeout(() => {
    t.classList.add('closing');
    setTimeout(() => t.remove(), 240);
  }, 2400);
}
