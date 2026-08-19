/** Tab-Bar, Routing und das Einhängen der Screens. */

import { $, esc } from '../util/dom.js';
import { icon } from './icons.js';
import { fx } from '../util/feedback.js';
import { get, subscribe, on as onBus } from '../state/store.js';
import { pendingCount } from '../games/index.js';
import { dailyPending } from '../state/daily.js';

import * as home from './screens/home.js';
import * as us from './screens/us.js';
import * as games from './screens/games.js';
import * as shop from './screens/shop.js';
import * as settings from './screens/settings.js';

export const TABS = [
  { id: 'home',  ico: 'tabPet',  label: 'Knuddl', mod: home },
  { id: 'us',    ico: 'tabUs',   label: 'Wir',    mod: us },
  { id: 'games', ico: 'tabPlay', label: 'Spiele', mod: games },
  { id: 'shop',  ico: 'tabShop', label: 'Laden',  mod: shop },
  { id: 'more',  ico: 'tabMore', label: 'Mehr',   mod: settings }
];

let currentTab = null;
let cleanup = null;
let screenEl, tabbarEl;
let ctx = {};

export function initShell(appCtx) {
  ctx = appCtx;
  screenEl = $('#screen');
  tabbarEl = $('#tabbar');
  renderTabs();

  window.addEventListener('hashchange', () => go(tabFromHash(), { fromHash: true }));
  subscribe(() => renderTabs());
  onBus('partner', () => renderTabs());

  go(tabFromHash() || initialTab(), { replace: true });
}

function initialTab() {
  const q = new URLSearchParams(location.search).get('go');
  return TABS.some((t) => t.id === q) ? q : 'home';
}

function tabFromHash() {
  const h = location.hash.replace(/^#\/?/, '');
  return TABS.some((t) => t.id === h) ? h : null;
}

export function go(tabId, { replace = false, fromHash = false } = {}) {
  const tab = TABS.find((t) => t.id === tabId) || TABS[0];
  if (currentTab === tab.id && !replace) return;

  if (!fromHash) {
    const url = `#/${tab.id}`;
    if (replace) history.replaceState(null, '', url);
    else if (location.hash !== url) location.hash = url;
  }

  cleanup?.();
  cleanup = null;
  currentTab = tab.id;

  /*
   * Erst leeren, dann umschalten.
   *
   * Der alte Inhalt im neuen Rahmen ist ein Zwischenzustand, den niemand
   * sehen soll: Ein langer Screen in einem auf Fensterhöhe begrenzten
   * Kasten lässt die Seite für einen Bildaufbau springen. Das erzwungene
   * Reflow unten braucht es für die Einblend-Animation — es darf nur nicht
   * auf die alten Kinder treffen.
   */
  screenEl.innerHTML = '';
  screenEl.dataset.screen = tab.id;
  screenEl.classList.remove('screen-enter');
  void screenEl.offsetWidth;
  screenEl.classList.add('screen-enter');
  screenEl.scrollTop = 0;
  window.scrollTo({ top: 0 });

  cleanup = tab.mod.render(screenEl, ctx) || null;
  renderTabs();
}

export const currentTabId = () => currentTab;

/** Screen neu zeichnen, ohne die Historie anzufassen. */
export function refresh() {
  if (!currentTab) return;
  const tab = TABS.find((t) => t.id === currentTab);
  cleanup?.();
  cleanup = tab.mod.render(screenEl, ctx) || null;
}

function renderTabs() {
  if (!tabbarEl) return;
  const s = get();
  const dots = { us: unreadCount(s), games: pendingCount(s) };

  // Einmal aufbauen, danach nur noch anpassen: Sonst würden die Knöpfe bei
  // jedem Zustandswechsel neu entstehen und die Antippen-Animation abreißen.
  if (!tabbarEl.childElementCount) {
    tabbarEl.innerHTML = TABS.map((t) => `
      <button class="tab" role="tab" data-tab="${t.id}" aria-selected="false">
        <span class="tab-ico">${icon(t.ico, { size: 25 })}</span>
        <span class="tab-txt">${esc(t.label)}</span>
      </button>`).join('');
    tabbarEl.querySelectorAll('[data-tab]').forEach((b) => {
      b.onclick = () => { fx('tap'); go(b.dataset.tab); };
    });
  }

  tabbarEl.querySelectorAll('[data-tab]').forEach((b) => {
    const id = b.dataset.tab;
    b.setAttribute('aria-selected', String(currentTab === id));
    const has = !!b.querySelector('.tab-dot');
    if (dots[id] && !has) {
      const dot = document.createElement('span');
      dot.className = 'tab-dot';
      b.appendChild(dot);
    } else if (!dots[id] && has) {
      b.querySelector('.tab-dot').remove();
    }
  });
}

function unreadCount(s) {
  return s.feed.filter((f) => f.from === 'them' && !f.seen).length + dailyPending(s);
}
