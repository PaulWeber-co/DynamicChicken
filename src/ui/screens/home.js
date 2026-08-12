/** Knuddl — der Pflege-Screen. */

import { esc } from '../../util/dom.js';
import { fx, burst } from '../../util/feedback.js';
import { get, subscribe } from '../../state/store.js';
import { renderChicken } from '../../pet/chicken.js';
import { petMood } from '../../pet/moods.js';
import { tickPet, urgentNeed, xpForLevel, wellbeing } from '../../state/model.js';
import { CARE_ACTIONS } from '../../state/catalog.js';
import { careAction, openFeedSheet, cooldownLeft } from '../actions.js';
import { relTime, hourIn } from '../../util/time.js';
import { partnerOnline } from '../../sync/index.js';
import { go } from '../shell.js';

const STAT_META = [
  { key: 'full',   emoji: '🌽', label: 'Satt',      color: 'var(--yolk)' },
  { key: 'energy', emoji: '⚡️', label: 'Energie',   color: 'var(--calm)' },
  { key: 'clean',  emoji: '🫧', label: 'Sauber',    color: 'var(--lilac)' },
  { key: 'joy',    emoji: '💛', label: 'Laune',     color: 'var(--love)' }
];

export function render(root, ctx) {
  const s = get();
  tickPet(s.me.pet);

  let lastSig = '';

  root.innerHTML = `
    <div class="home">
      <div class="row-between">
        <div>
          <div class="title-lg" data-greet></div>
          <div class="subtitle" data-sub></div>
        </div>
        <button class="coin-pill" data-coins-btn>
          <span>🌾</span><b data-coins>0</b>
        </button>
      </div>

      <div class="card scene-card">
        <div class="scene-sky"></div>
        <div class="scene-need" data-need hidden></div>
        <button class="scene-stage" data-pet aria-label="Knuddl streicheln">
          <div class="scene-chicken" data-chicken></div>
        </button>
        <div class="scene-ground"></div>
        <div class="scene-foot">
          <div class="col grow">
            <div class="pet-name" data-name></div>
            <div class="pet-meta" data-meta></div>
          </div>
          <div class="xp-ring" data-xp-ring>
            <svg viewBox="0 0 44 44" aria-hidden="true">
              <circle cx="22" cy="22" r="19" class="xp-bg"/>
              <circle cx="22" cy="22" r="19" class="xp-fg" data-xp-arc/>
            </svg>
            <span data-level>1</span>
          </div>
        </div>
      </div>

      <div class="card care-card">
        <div class="care-grid">
          <button class="care" data-care="feed">
            <span class="care-emoji">🌽</span><span class="care-label">Füttern</span>
          </button>
          <button class="care" data-care="wash">
            <span class="care-emoji">🫧</span><span class="care-label">Waschen</span>
          </button>
          <button class="care" data-care="sleep">
            <span class="care-emoji" data-sleep-emoji>💤</span><span class="care-label" data-sleep-label>Schlafen</span>
          </button>
          <button class="care" data-care="play">
            <span class="care-emoji">🎈</span><span class="care-label">Spielen</span>
          </button>
          <button class="care" data-care="cuddle">
            <span class="care-emoji">🫂</span><span class="care-label">Knuddeln</span>
          </button>
        </div>
      </div>

      <div class="card">
        <div class="row-between" style="margin-bottom:12px">
          <b style="font-size:15px">Wie geht's Knuddl?</b>
          <span class="badge" data-wellbeing></span>
        </div>
        <div data-stats></div>
      </div>

      <div data-partner-strip></div>
    </div>`;

  const el = {
    greet: root.querySelector('[data-greet]'),
    sub: root.querySelector('[data-sub]'),
    coins: root.querySelector('[data-coins]'),
    chicken: root.querySelector('[data-chicken]'),
    need: root.querySelector('[data-need]'),
    name: root.querySelector('[data-name]'),
    meta: root.querySelector('[data-meta]'),
    level: root.querySelector('[data-level]'),
    arc: root.querySelector('[data-xp-arc]'),
    stats: root.querySelector('[data-stats]'),
    well: root.querySelector('[data-wellbeing]'),
    sleepEmoji: root.querySelector('[data-sleep-emoji]'),
    sleepLabel: root.querySelector('[data-sleep-label]'),
    strip: root.querySelector('[data-partner-strip]')
  };

  function paint() {
    const st = get();
    const pet = st.me.pet;
    tickPet(pet);

    const mood = petMood(pet, { asleep: pet.asleep, moodKey: st.me.mood?.key });
    const sig = JSON.stringify(pet.look) + mood;
    if (sig !== lastSig) {
      lastSig = sig;
      el.chicken.innerHTML = renderChicken(pet.look, { mood, size: 210 });
    }

    el.greet.textContent = greeting(st);
    el.sub.textContent = subline(st, pet);
    el.coins.textContent = st.me.coins;
    el.name.textContent = pet.name;
    el.meta.textContent = `${wellbeing(pet)}% Wohlbefinden · geboren ${relTime(pet.born)}`;
    el.level.textContent = pet.level;

    const need = urgentNeed(pet);
    el.need.hidden = !need;
    if (need) el.need.innerHTML = `<span>${need.emoji}</span> ${esc(pet.name)} ${esc(need.text)}`;

    // XP-Ring
    const frac = Math.min(1, pet.xp / xpForLevel(pet.level));
    const C = 2 * Math.PI * 19;
    el.arc.style.strokeDasharray = `${C}`;
    el.arc.style.strokeDashoffset = `${C * (1 - frac)}`;

    const w = wellbeing(pet);
    el.well.textContent = w >= 80 ? 'Bestens' : w >= 55 ? 'Ganz okay' : w >= 30 ? 'Braucht dich' : 'Dringend!';
    el.well.className = `badge ${w >= 80 ? 'badge-live' : w >= 40 ? 'badge-wait' : 'badge-love'}`;

    el.stats.innerHTML = STAT_META.map((m) => {
      const v = Math.round(pet.stats[m.key]);
      return `<div class="stat">
        <span class="stat-emoji">${m.emoji}</span>
        <span class="stat-track"><span class="stat-fill" style="width:${v}%;background:${v < 25 ? 'var(--warn)' : m.color}"></span></span>
        <span class="stat-num">${v}</span>
      </div>`;
    }).join('');

    el.sleepEmoji.textContent = pet.asleep ? '🌞' : '💤';
    el.sleepLabel.textContent = pet.asleep ? 'Wecken' : 'Schlafen';

    root.querySelectorAll('[data-care]').forEach((b) => {
      const kind = b.dataset.care;
      if (kind === 'feed' || kind === 'sleep') { b.disabled = false; return; }
      b.disabled = pet.asleep || cooldownLeft(kind) > 0;
    });

    el.strip.innerHTML = partnerStrip(st);
    const sb = el.strip.querySelector('[data-goto-us]');
    if (sb) sb.onclick = () => go('us');
  }

  /* Knuddl streicheln */
  root.querySelector('[data-pet]').onclick = (e) => {
    const st = get();
    const pet = st.me.pet;
    if (pet.asleep) {
      fx('cluck');
      burst(['💤'], { x: e.clientX, y: e.clientY, count: 3, rise: 80 });
      return;
    }
    careAction('cuddle', e.currentTarget) || fx('cluck');
    const svg = el.chicken.querySelector('.chicken');
    if (svg) { svg.classList.remove('squish'); void svg.offsetWidth; svg.classList.add('squish'); }
    burst(['💛', '💗', '✨'], { x: e.clientX, y: e.clientY, count: 5, rise: 120 });
  };

  root.querySelectorAll('[data-care]').forEach((b) => {
    b.onclick = () => {
      const kind = b.dataset.care;
      if (kind === 'feed') { fx('tap'); openFeedSheet(); return; }
      careAction(kind, b);
    };
  });

  root.querySelector('[data-coins-btn]').onclick = () => { fx('coin'); go('shop'); };

  paint();
  const unsub = subscribe(paint);
  const timer = setInterval(paint, 20_000);
  return () => { unsub(); clearInterval(timer); };
}

/* ── Textbausteine ──────────────────────────────────────── */

function greeting(s) {
  const h = new Date().getHours();
  const name = s.me.name ? `, ${s.me.name}` : '';
  if (h < 5) return `Noch wach${name}?`;
  if (h < 11) return `Guten Morgen${name}`;
  if (h < 14) return `Mahlzeit${name}`;
  if (h < 18) return `Hallo${name}`;
  if (h < 22) return `Guten Abend${name}`;
  return `Gute Nacht${name}`;
}

function subline(s, pet) {
  if (pet.asleep) return `${pet.name} schläft — Energie füllt sich auf.`;
  const need = urgentNeed(pet);
  if (need) return `${pet.name} ${need.text}.`;
  if (!s.partner) return 'Verbinde dich unter „Mehr" mit deinem Menschen.';
  return `${pet.name} ist zufrieden.`;
}

function partnerStrip(s) {
  if (!s.partner) {
    return `<button class="card link-card" data-goto-us>
      <div class="li-ico">💞</div>
      <div class="grow">
        <div class="li-title">Noch niemand verbunden</div>
        <div class="li-sub">Knuddl hätte gern ein zweites Huhn zum Vergleichen.</div>
      </div>
      <span class="li-chev">›</span>
    </button>`;
  }
  const p = s.partner;
  const online = partnerOnline();
  const h = hourIn(p.tz);
  const sleeping = h >= 1 && h < 7;
  return `<button class="card link-card" data-goto-us>
    <div class="li-ico">${sleeping ? '🌙' : online ? '🟢' : '🕒'}</div>
    <div class="grow">
      <div class="li-title">${esc(p.name)} · ${esc(p.pet.name)}</div>
      <div class="li-sub">${sleeping ? 'schläft wahrscheinlich' : online ? 'ist gerade online' : `zuletzt ${relTime(p.lastSeen)}`}
        · Bond-Level ${s.bond.level}</div>
    </div>
    <span class="li-chev">›</span>
  </button>`;
}
