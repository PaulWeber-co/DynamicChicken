/** Knuddl — der Pflege-Screen mit Tageszeit-Szene. */

import { esc, $$ } from '../../util/dom.js';
import { fx, burst } from '../../util/feedback.js';
import { get, subscribe } from '../../state/store.js';
import { renderChicken, playAction } from '../../pet/chicken.js';
import { petMood } from '../../pet/moods.js';
import { tickPet, urgentNeed, xpForLevel, wellbeing } from '../../state/model.js';
import { CARE_ACTIONS } from '../../state/catalog.js';
import { careAction, openFeedSheet, cooldownLeft } from '../actions.js';
import { icon } from '../icons.js';
import { relTime, hourIn } from '../../util/time.js';
import { partnerOnline } from '../../sync/index.js';
import { go } from '../shell.js';

const STAT_META = [
  { key: 'full',   icon: 'statFull',   label: 'Satt',    color: 'var(--yolk)' },
  { key: 'energy', icon: 'statEnergy', label: 'Energie', color: 'var(--calm)' },
  { key: 'clean',  icon: 'statClean',  label: 'Sauber',  color: 'var(--lilac)' },
  { key: 'joy',    icon: 'statJoy',    label: 'Laune',   color: 'var(--love)' }
];

const CARE_ORDER = ['feed', 'wash', 'sleep', 'play', 'cuddle'];

/** Fünf Tagesabschnitte — die Szene färbt sich mit. */
function daypart(h) {
  if (h < 5) return 'night';
  if (h < 8) return 'dawn';
  if (h < 17) return 'day';
  if (h < 20) return 'dusk';
  return 'night';
}

export function render(root, ctx) {
  const s = get();
  tickPet(s.me.pet);

  let lastSig = '';

  root.innerHTML = `
    <div class="home">
      <div class="row-between home-head">
        <div class="grow">
          <div class="title-lg" data-greet></div>
          <div class="subtitle" data-sub></div>
        </div>
        <button class="coin-pill" data-coins-btn aria-label="Zum Laden">
          ${icon('grain', { size: 20 })}<b data-coins>0</b>
        </button>
      </div>

      <div class="card scene-card" data-scene>
        <div class="scene-sky"></div>
        <div class="scene-celestial" data-celestial></div>
        <div class="scene-clouds" aria-hidden="true">
          <span class="cloud c1"></span><span class="cloud c2"></span><span class="cloud c3"></span>
        </div>
        <div class="scene-hill"></div>
        <div class="scene-grass" aria-hidden="true"></div>
        <div class="scene-need" data-need hidden></div>
        <button class="scene-stage" data-pet aria-label="Knuddl streicheln">
          <div class="scene-chicken" data-chicken-host></div>
        </button>
        <div class="scene-foot">
          <div class="col grow">
            <div class="pet-name" data-name></div>
            <div class="pet-meta" data-meta></div>
          </div>
          <div class="xp-ring" data-xp-ring title="Level">
            <svg viewBox="0 0 44 44" aria-hidden="true">
              <circle cx="22" cy="22" r="19" class="xp-bg"/>
              <circle cx="22" cy="22" r="19" class="xp-fg" data-xp-arc/>
            </svg>
            <span data-level>1</span>
          </div>
        </div>
      </div>

      <div class="card care-card">
        <div class="care-grid" data-care-grid>
          ${CARE_ORDER.map((k) => {
            const c = k === 'feed'
              ? { icon: 'careFeed', label: 'Füttern' }
              : CARE_ACTIONS[k];
            return `<button class="care" data-care="${k}">
              <span class="care-emoji">${icon(c.icon, { size: 30 })}</span>
              <span class="care-label" ${k === 'sleep' ? 'data-sleep-label' : ''}>${esc(c.label)}</span>
            </button>`;
          }).join('')}
        </div>
      </div>

      <div class="card">
        <div class="row-between" style="margin-bottom:12px">
          <b style="font-size:15px">Wie geht’s <span data-name2></span>?</b>
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
    scene: root.querySelector('[data-scene]'),
    celestial: root.querySelector('[data-celestial]'),
    chicken: root.querySelector('[data-chicken-host]'),
    need: root.querySelector('[data-need]'),
    name: root.querySelector('[data-name]'),
    name2: root.querySelector('[data-name2]'),
    meta: root.querySelector('[data-meta]'),
    level: root.querySelector('[data-level]'),
    arc: root.querySelector('[data-xp-arc]'),
    stats: root.querySelector('[data-stats]'),
    well: root.querySelector('[data-wellbeing]'),
    sleepLabel: root.querySelector('[data-sleep-label]'),
    strip: root.querySelector('[data-partner-strip]')
  };

  function paint() {
    const st = get();
    const pet = st.me.pet;
    tickPet(pet);

    const part = daypart(new Date().getHours());
    el.scene.dataset.part = part;
    el.celestial.innerHTML = part === 'night'
      ? `<span class="moon"></span><span class="star s1"></span><span class="star s2"></span><span class="star s3"></span>`
      : `<span class="sun"></span>`;

    const mood = petMood(pet, { asleep: pet.asleep, moodKey: st.me.mood?.key });
    const sig = JSON.stringify(pet.look) + mood;
    if (sig !== lastSig) {
      lastSig = sig;
      el.chicken.innerHTML = renderChicken(pet.look, { mood, size: 218 });
    }

    el.greet.textContent = greeting(st);
    el.sub.textContent = subline(st, pet);
    el.coins.textContent = st.me.coins;
    el.name.textContent = pet.name;
    el.name2.textContent = pet.name;
    el.meta.textContent = `${wellbeing(pet)}% Wohlbefinden · ${ageLine(pet)}`;
    el.level.textContent = pet.level;

    const need = urgentNeed(pet);
    el.need.hidden = !need;
    if (need) {
      el.need.innerHTML = `${icon(needIcon(need.key), { size: 18 })}<span>${esc(pet.name)} ${esc(need.text)}</span>`;
    }

    const frac = Math.min(1, pet.xp / xpForLevel(pet.level));
    const C = 2 * Math.PI * 19;
    el.arc.style.strokeDasharray = `${C}`;
    el.arc.style.strokeDashoffset = `${C * (1 - frac)}`;

    const w = wellbeing(pet);
    el.well.textContent = w >= 80 ? 'Bestens' : w >= 55 ? 'Ganz okay' : w >= 30 ? 'Braucht dich' : 'Dringend!';
    el.well.className = `badge ${w >= 80 ? 'badge-live' : w >= 40 ? 'badge-wait' : 'badge-love'}`;

    el.stats.innerHTML = STAT_META.map((m, i) => {
      const v = Math.round(pet.stats[m.key]);
      return `<div class="stat" style="--i:${i}">
        <span class="stat-emoji">${icon(m.icon, { size: 19 })}</span>
        <span class="stat-track"><span class="stat-fill" style="width:${v}%;background:${v < 25 ? 'var(--warn)' : m.color}"></span></span>
        <span class="stat-num">${v}</span>
      </div>`;
    }).join('');

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

  /* Knuddl streicheln — jede Berührung hat eine Reaktion */
  let petCount = 0;
  root.querySelector('[data-pet]').onclick = (e) => {
    const st = get();
    const pet = st.me.pet;
    const svg = el.chicken.querySelector('[data-chicken]');

    if (pet.asleep) {
      fx('cluck');
      playAction(svg, 'nod');
      burst(['careSleep'], { x: e.clientX, y: e.clientY, count: 3, rise: 80 });
      return;
    }

    petCount++;
    // Jedes dritte Streicheln fällt größer aus — kleine Überraschung
    const special = petCount % 3 === 0;
    if (!careAction('cuddle', e.currentTarget)) {
      fx('cluck');
      playAction(svg, special ? 'dance' : 'shake');
    }
    if (svg) {
      svg.classList.remove('squish');
      void svg.getBoundingClientRect();
      svg.classList.add('squish');
      setTimeout(() => svg.classList.remove('squish'), 600);
    }
    burst(special ? ['statJoy', 'sparkle', 'careCuddle'] : ['statJoy'],
      { x: e.clientX, y: e.clientY, count: special ? 9 : 5, rise: 120 });
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

  // Ab und zu tut Knuddl von allein etwas — das Nest lebt.
  const idle = setInterval(() => {
    const st = get();
    if (st.me.pet.asleep || document.visibilityState !== 'visible') return;
    const svg = el.chicken.querySelector('[data-chicken]');
    if (!svg) return;
    const moves = ['peck', 'shake', 'flap', 'walk', 'think', 'nod'];
    playAction(svg, moves[Math.floor(Math.random() * moves.length)]);
  }, 14_000);

  return () => { unsub(); clearInterval(timer); clearInterval(idle); };
}

/* ── Textbausteine ──────────────────────────────────────── */

const needIcon = (k) => ({ full: 'statFull', energy: 'careSleep', clean: 'careWash', joy: 'carePlay' })[k] || 'info';

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
  if (!s.partner) return 'Verbinde dich unter „Mehr“ mit deinem Menschen.';
  const w = wellbeing(pet);
  if (w > 85) return `${pet.name} könnte nicht zufriedener sein.`;
  return `${pet.name} ist zufrieden.`;
}

function ageLine(pet) {
  const days = Math.floor((Date.now() - pet.born) / 86_400_000);
  if (days < 1) return 'heute geschlüpft';
  if (days === 1) return 'seit gestern bei dir';
  return `seit ${days} Tagen bei dir`;
}

function partnerStrip(s) {
  if (!s.partner) {
    return `<button class="card link-card" data-goto-us>
      <div class="li-ico">${icon('tabUs', { size: 22 })}</div>
      <div class="grow">
        <div class="li-title">Noch niemand verbunden</div>
        <div class="li-sub">Knuddl hätte gern ein zweites Huhn zum Vergleichen.</div>
      </div>
      <span class="li-chev">${icon('chevron', { size: 16 })}</span>
    </button>`;
  }
  const p = s.partner;
  const online = partnerOnline();
  const h = hourIn(p.tz);
  const sleeping = h >= 1 && h < 7;
  return `<button class="card link-card" data-goto-us>
    <div class="li-ico">${icon(sleeping ? 'careSleep' : online ? 'tabUs' : 'clock', { size: 22 })}</div>
    <div class="grow">
      <div class="li-title">${esc(p.name)} · ${esc(p.pet.name)}</div>
      <div class="li-sub">${sleeping ? 'schläft wahrscheinlich' : online ? 'ist gerade online' : `zuletzt ${relTime(p.lastSeen)}`}
        · Bond-Level ${s.bond.level}</div>
    </div>
    <span class="li-chev">${icon('chevron', { size: 16 })}</span>
  </button>`;
}
