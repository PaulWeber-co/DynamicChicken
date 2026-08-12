/** Kurze Rückmeldungen am unteren Rand. */

import { $ } from '../util/dom.js';

let root = null;

export function toast(text, emoji = '') {
  root ||= $('#toast-root');
  if (!root) return;

  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = `${emoji ? `<span>${emoji}</span>` : ''}<span>${text}</span>`;
  root.appendChild(t);

  // Höchstens drei gleichzeitig — sonst wird es eine Wand.
  while (root.children.length > 3) root.firstChild.remove();

  setTimeout(() => {
    t.classList.add('closing');
    setTimeout(() => t.remove(), 240);
  }, 2400);
}
