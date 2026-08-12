/** Vollbild-Bühne für die Minispiele. */

import { gameById } from '../games/index.js';
import { partnerOnline } from '../sync/index.js';
import { fx } from '../util/feedback.js';

let host = null;
let cleanup = null;

export function openGame(id) {
  const g = gameById(id);
  if (!g) return;
  closeGame(true);

  host = document.createElement('div');
  host.className = 'game-host';
  host.setAttribute('role', 'dialog');
  host.setAttribute('aria-modal', 'true');
  host.setAttribute('aria-label', g.meta.title);
  document.body.appendChild(host);
  document.body.style.overflow = 'hidden';

  const onKey = (e) => { if (e.key === 'Escape') closeGame(); };
  document.addEventListener('keydown', onKey);

  const ctx = {
    close: () => closeGame(),
    partnerOnline: partnerOnline()
  };

  cleanup = () => {
    document.removeEventListener('keydown', onKey);
  };

  const inner = g.mount(host, ctx);
  const prev = cleanup;
  cleanup = () => { prev(); inner?.(); };
}

export function closeGame(immediate = false) {
  if (!host) return;
  cleanup?.();
  cleanup = null;
  document.body.style.overflow = '';
  const el = host;
  host = null;
  if (immediate) { el.remove(); return; }
  el.classList.add('closing');
  fx('tap');
  setTimeout(() => el.remove(), 200);
}

export const isGameOpen = () => !!host;
