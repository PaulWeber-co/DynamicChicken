/** Laden — Futter kaufen, Mode kaufen, Knuddl umstylen. */

import { esc } from '../../util/dom.js';
import { icon } from '../icons.js';
import { fx, burst, confetti } from '../../util/feedback.js';
import { get, commit, subscribe } from '../../state/store.js';
import { FOODS, BOND_UNLOCKS } from '../../state/catalog.js';
import {
  renderChicken, BODY_COLORS, BELLY_COLORS, COMB_COLORS, COMBS, EYE_STYLES, HATS, ACCESSORIES
} from '../../pet/chicken.js';
import { petMood } from '../../pet/moods.js';
import { sendEvent } from '../../sync/index.js';
import { toast } from '../toast.js';
import { sheet, closeSheet } from '../sheet.js';

let tab = 'futter';

/** Was das Bond-Level freischaltet, gehört euch dauerhaft. */
export function applyBondUnlocks(state) {
  let changed = false;
  BOND_UNLOCKS.filter((u) => state.bond.level >= u.level).forEach((u) => {
    Object.entries(u.grants).forEach(([slot, id]) => {
      const list = state.me.owned[slot] ||= [];
      if (!list.includes(id)) { list.push(id); changed = true; }
    });
  });
  return changed;
}

export function render(root, ctx) {
  if (applyBondUnlocks(get())) commit('unlocks');

  function paint() {
    const s = get();
    root.innerHTML = `
      <div class="row-between">
        <div>
          <div class="title-lg">Laden</div>
          <div class="subtitle">Körner verdienst du mit Spielen und Pflege.</div>
        </div>
        <div class="coin-pill">${icon('grain', { size: 20 })}<b>${s.me.coins}</b></div>
      </div>

      <div class="seg" role="tablist">
        ${[['futter', 'tabShop', 'Futter'], ['mode', 'hatCrown', 'Mode'], ['atelier', 'palette', 'Atelier']].map(([id, ic, label]) =>
          `<button class="seg-btn" role="tab" data-tab="${id}" aria-selected="${tab === id}">
             ${icon(ic, { size: 18 })}<span>${label}</span>
           </button>`).join('')}
      </div>

      <div data-panel>${tab === 'futter' ? panelFood(s) : tab === 'mode' ? panelMode(s) : panelAtelier(s)}</div>`;

    root.querySelectorAll('[data-tab]').forEach((b) => {
      b.onclick = () => { tab = b.dataset.tab; fx('tap'); paint(); };
    });
    bindPanel();
  }

  /* ── Futter ── */
  function panelFood(s) {
    return `<div class="shop-grid">
      ${FOODS.map((f) => {
        const have = s.me.inv[f.id] || 0;
        const can = s.me.coins >= f.price;
        return `<div class="card shop-item ${can ? '' : 'poor'}">
          <div class="shop-e">${icon(f.icon, { size: 38 })}</div>
          <div class="shop-t">${esc(f.label)}</div>
          <div class="shop-s">${esc(f.line)}</div>
          <div class="shop-eff">
            ${f.full ? `<span>${icon('statFull', { size: 13 })}+${f.full}</span>` : ''}
            ${f.joy ? `<span>${icon('statJoy', { size: 13 })}+${f.joy}</span>` : ''}
            ${f.energy > 4 ? `<span>${icon('statEnergy', { size: 13 })}+${f.energy}</span>` : ''}
            ${f.clean < 0 ? `<span class="neg">${icon('statClean', { size: 13 })}${f.clean}</span>` : ''}
          </div>
          <div class="shop-buy">
            <button class="btn btn-primary btn-sm" data-buy-food="${f.id}" ${can ? '' : 'disabled'}>${icon('grain', { size: 15 })} ${f.price}</button>
            ${have ? `<span class="shop-have">×${have}</span>` : ''}
          </div>
        </div>`;
      }).join('')}
    </div>`;
  }

  /* ── Mode ── */
  function panelMode(s) {
    const slot = (list, key, label) => `
      <div class="section-label">${label}</div>
      <div class="wear-grid">
        ${list.map((it) => {
          const owned = (s.me.owned[key] || []).includes(it.id) || it.price === 0;
          const worn = s.me.pet.look[key] === it.id;
          const can = s.me.coins >= it.price;
          const unlock = BOND_UNLOCKS.find((u) => u.grants[key] === it.id);
          return `<button class="wear ${worn ? 'worn' : ''} ${owned ? '' : 'locked'}"
            data-wear="${key}:${it.id}" data-price="${it.price}">
            <span class="wear-e">${icon(it.icon, { size: 28 })}</span>
            <span class="wear-l">${esc(it.label)}</span>
            <span class="wear-p">${owned ? (worn ? 'getragen' : 'im Schrank') : `${it.price} Körner`}</span>
            ${!owned && unlock ? `<span class="wear-unlock">oder Bond ${unlock.level}</span>` : ''}
            ${!owned && !can ? `<span class="wear-lock">${icon('lock', { size: 12 })}</span>` : ''}
          </button>`;
        }).join('')}
      </div>`;

    return `
      <div class="card preview-card">
        <div class="preview-chick">${renderChicken(s.me.pet.look, { mood: 'happy', size: 150 })}</div>
        <div class="tiny muted center">So sieht ${esc(s.me.pet.name)} gerade aus.</div>
      </div>
      ${slot(HATS, 'hat', 'Kopf')}
      ${slot(ACCESSORIES, 'acc', 'Drumherum')}
      <div class="card">
        <div class="li-title" style="margin-bottom:6px">Bond-Belohnungen</div>
        <div class="wrap">
          ${BOND_UNLOCKS.map((u) => `<span class="chip ${s.bond.level >= u.level ? 'is-on' : ''}">
            ${icon(u.icon, { size: 18 })}${esc(u.label)} · Lv ${u.level}
          </span>`).join('')}
        </div>
      </div>`;
  }

  /* ── Atelier ── */
  function panelAtelier(s) {
    const look = s.me.pet.look;
    const swatches = (list, key) => `<div class="sw-row">
      ${list.map((c) => `<button class="sw ${look[key] === c.id ? 'on' : ''}"
        style="--sw:${c.base}" data-look="${key}:${c.id}" aria-label="${esc(c.label)}"></button>`).join('')}
    </div>`;

    const options = (list, key) => `<div class="wrap">
      ${list.map((o) => `<button class="chip ${look[key] === o.id ? 'is-on' : ''}" data-look="${key}:${o.id}">
        ${icon(o.icon, { size: 18 })}${esc(o.label)}
      </button>`).join('')}
    </div>`;

    return `
      <div class="card preview-card">
        <div class="preview-chick">${renderChicken(look, { mood: petMood(s.me.pet, { moodKey: s.me.mood?.key }), size: 170 })}</div>
        <button class="btn btn-line btn-sm" data-rename>${icon('edit', { size: 16 })} ${esc(s.me.pet.name)} umbenennen</button>
      </div>

      <div class="section-label">Gefieder</div>
      <div class="card">${swatches(BODY_COLORS, 'body')}</div>

      <div class="section-label">Bauch</div>
      <div class="card">${swatches(BELLY_COLORS, 'belly')}</div>

      <div class="section-label">Kamm</div>
      <div class="card">
        ${options(COMBS, 'comb')}
        <div style="height:10px"></div>
        ${swatches(COMB_COLORS, 'combColor')}
      </div>

      <div class="section-label">Augen</div>
      <div class="card">${options(EYE_STYLES, 'eyes')}</div>

      <div class="section-label">Statur</div>
      <div class="card">
        <div class="row">
          <span class="tiny muted">schlank</span>
          <input class="slider grow" type="range" min="90" max="112" value="${Math.round((look.chub ?? 1) * 100)}" data-chub>
          <span class="tiny muted">dick</span>
        </div>
        <p class="tiny muted center" style="margin:8px 0 0">Ein dickes Huhn ist ein glückliches Huhn.</p>
      </div>`;
  }

  /* ── Interaktion ── */
  function bindPanel() {
    root.querySelectorAll('[data-buy-food]').forEach((b) => {
      b.onclick = () => buyFood(b.dataset.buyFood, b);
    });
    root.querySelectorAll('[data-wear]').forEach((b) => {
      b.onclick = () => wear(b.dataset.wear, Number(b.dataset.price || 0), b);
    });
    root.querySelectorAll('[data-look]').forEach((b) => {
      b.onclick = () => setLook(b.dataset.look);
    });
    const chub = root.querySelector('[data-chub]');
    if (chub) chub.oninput = () => {
      const s = get();
      s.me.pet.look.chub = Number(chub.value) / 100;
      const prev = root.querySelector('.preview-chick');
      if (prev) prev.innerHTML = renderChicken(s.me.pet.look, { mood: 'happy', size: 170 });
    };
    if (chub) chub.onchange = () => { commit('look'); publishLook(); fx('tap'); };
    const rn = root.querySelector('[data-rename]');
    if (rn) rn.onclick = openRename;
  }

  function buyFood(id, btn) {
    const s = get();
    const f = FOODS.find((x) => x.id === id);
    if (!f) return;
    if (s.me.coins < f.price) { toast('Zu wenig Körner', 'grain'); return; }
    s.me.coins -= f.price;
    s.me.inv[id] = (s.me.inv[id] || 0) + 1;
    commit('buy');
    fx('coin');
    burst([f.icon], { from: btn, count: 4, rise: 80 });
    paint();
  }

  function wear(spec, price, btn) {
    const [key, id] = spec.split(':');
    const s = get();
    const list = s.me.owned[key] ||= [];
    const owned = list.includes(id) || price === 0;

    if (!owned) {
      if (s.me.coins < price) { toast('Zu wenig Körner — spiel eine Runde!', 'grain'); fx('fail'); return; }
      s.me.coins -= price;
      list.push(id);
      fx('coin');
      confetti(['sparkle', 'grain']);
    } else {
      fx('pop');
    }

    s.me.pet.look[key] = s.me.pet.look[key] === id && id !== 'none' ? 'none' : id;
    commit('wear');
    burst(['sparkle'], { from: btn, count: 4, rise: 70 });
    publishLook();
    paint();
  }

  function setLook(spec) {
    const i = spec.indexOf(':');
    const key = spec.slice(0, i), val = spec.slice(i + 1);
    const s = get();
    s.me.pet.look[key] = val;
    commit('look');
    fx('tap');
    publishLook();
    paint();
  }

  function openRename() {
    const s = get();
    sheet({
      title: 'Wie heißt dein Huhn?',
      body: `<input class="input" data-name maxlength="16" value="${esc(s.me.pet.name)}" placeholder="Knuddl">
             <button class="btn btn-primary btn-block" data-save style="margin-top:12px">Speichern</button>`,
      onMount(body) {
        const inp = body.querySelector('[data-name]');
        inp.focus();
        inp.select();
        body.querySelector('[data-save]').onclick = () => {
          const v = inp.value.trim().slice(0, 16) || 'Knuddl';
          const st = get();
          st.me.pet.name = v;
          commit('rename');
          publishLook();
          fx('pop');
          closeSheet();
          paint();
        };
      }
    });
  }

  function publishLook() {
    const s = get();
    sendEvent('profile', {
      pet: { name: s.me.pet.name, look: s.me.pet.look, stats: s.me.pet.stats, level: s.me.pet.level, asleep: s.me.pet.asleep }
    });
  }

  paint();
  const unsub = subscribe((_, reason) => { if (reason === 'remote') paint(); });
  return () => unsub();
}
