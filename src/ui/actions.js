/**
 * Die Handlungen, die man an mehreren Stellen auslösen kann:
 * aus dem Knuddl-Screen, aus der Dynamic Island, aus dem Wir-Tab.
 */

import { get, commit } from '../state/store.js';
import { pushFeed, addBondXp, addXp, clamp100, tickPet } from '../state/model.js';
import { FOODS, foodById, CARE_ACTIONS, REWARDS } from '../state/catalog.js';
import { NUDGES, nudgeByKey, moodByKey, activityByKey } from '../pet/moods.js';
import { sendEvent } from '../sync/index.js';
import { fx, burst, confetti } from '../util/feedback.js';
import { toast } from './toast.js';
import { sheet, closeSheet } from './sheet.js';
import { esc, $$ } from '../util/dom.js';
import { icon } from './icons.js';
import { playAction } from '../pet/chicken.js';

/** Lässt jedes sichtbare Huhn die passende Bewegung machen. */
function animatePet(action) {
  if (!action) return;
  $$('[data-chicken]').forEach((svg) => playAction(svg, action));
}

const cools = () => { const s = get(); s.me.lastCare ||= {}; return s.me.lastCare; };

export function cooldownLeft(kind) {
  const c = CARE_ACTIONS[kind];
  if (!c?.cooldown) return 0;
  return Math.max(0, (cools()[kind] || 0) + c.cooldown - Date.now());
}

/* ── Pflege ─────────────────────────────────────────────── */

export function careAction(kind, sourceEl) {
  const s = get();
  const pet = s.me.pet;
  tickPet(pet);

  if (kind === 'sleep') return toggleSleep(sourceEl);

  if (pet.asleep) { toast(`${pet.name} schläft gerade`, 'careSleep'); return false; }
  if (cooldownLeft(kind) > 0) {
    toast(`${pet.name} braucht kurz Pause`, 'clock');
    return false;
  }

  const c = CARE_ACTIONS[kind];
  if (!c) return false;

  if (kind === 'play' && pet.stats.energy < 12) {
    toast(`${pet.name} ist zu müde zum Toben`, 'moodTired');
    return false;
  }

  ['full', 'energy', 'clean', 'joy'].forEach((k) => {
    if (c[k] != null) pet.stats[k] = clamp100(pet.stats[k] + c[k]);
  });
  // Waschen setzt die Sauberkeit hoch, statt sie nur zu addieren
  if (kind === 'wash') pet.stats.clean = clamp100(Math.max(pet.stats.clean, c.clean));

  cools()[kind] = Date.now();
  const lvl = addXp(pet, c.xp || 0);
  if (kind === 'cuddle') {
    addBondXp(s, 3);
    s.bond.hugs++;
  }

  pushFeed(s, { from: 'me', type: 'care', icon: c.icon, text: `${pet.name} ${c.line}` });
  commit('care');

  fx(c.fx || 'pop');
  animatePet(c.act);
  if (sourceEl) burst(kind === 'cuddle' ? ['statJoy', 'careCuddle'] : [c.icon], { from: sourceEl, count: 6, rise: 110 });
  if (lvl) celebrateLevel(pet);

  sendEvent('profile', { pet: { name: pet.name, look: pet.look, stats: pet.stats, level: pet.level, asleep: pet.asleep } });
  return true;
}

export function toggleSleep(sourceEl) {
  const s = get();
  const pet = s.me.pet;
  tickPet(pet);

  pet.asleep = !pet.asleep;
  pet.asleepSince = pet.asleep ? Date.now() : null;
  if (pet.asleep) addXp(pet, 2);

  pushFeed(s, {
    from: 'me', type: 'care', icon: pet.asleep ? 'careSleep' : 'nudgeMorning',
    text: `${pet.name} ${pet.asleep ? 'schlummert ein' : 'ist wieder wach'}`
  });
  commit('sleep');
  fx('cluck');
  animatePet(pet.asleep ? 'nod' : 'stretch');
  if (sourceEl) burst([pet.asleep ? 'careSleep' : 'nudgeMorning'], { from: sourceEl, count: 4, rise: 90 });
  sendEvent('profile', { pet: { name: pet.name, look: pet.look, stats: pet.stats, level: pet.level, asleep: pet.asleep } });
  return true;
}

function celebrateLevel(pet) {
  const s = get();
  s.me.coins += REWARDS.levelUp;
  commit('levelup');
  confetti(['sparkle', 'trophy', 'statJoy', 'grain']);
  animatePet('celebrate');
  toast(`${pet.name} ist jetzt Level ${pet.level}! +${REWARDS.levelUp} Körner`, '⭐️');
}

/* ── Füttern ────────────────────────────────────────────── */

export function openFeedSheet() {
  const s = get();
  const inv = s.me.inv || {};
  const owned = FOODS.filter((f) => (inv[f.id] || 0) > 0);

  sheet({
    title: 'Kühlschrank',
    body: owned.length
      ? `<div class="food-grid">
          ${owned.map((f) => `<button class="food" data-food="${f.id}">
            <span class="food-e">${icon(f.icon, { size: 34 })}</span>
            <span class="food-l">${esc(f.label)}</span>
            <span class="food-n">×${inv[f.id]}</span>
          </button>`).join('')}
        </div>
        <p class="tiny muted center" style="margin-top:14px">Nachschub gibt es im Laden.</p>`
      : `<div class="empty">
          <span class="empty-emoji">${icon('tabShop', { size: 40 })}</span>
          Der Kühlschrank ist leer.<br>Im Laden gibt es Körner, Beeren und Kuchen.
        </div>`,
    onMount(body) {
      body.querySelectorAll('[data-food]').forEach((b) => {
        b.onclick = () => { feedPet(b.dataset.food, b); closeSheet(); };
      });
    }
  });
}

export function feedPet(foodId, sourceEl) {
  const s = get();
  const pet = s.me.pet;
  const food = foodById(foodId);
  if (!food) return false;
  if ((s.me.inv[foodId] || 0) <= 0) { toast('Davon hast du nichts mehr', 'tabShop'); return false; }
  if (pet.asleep) { toast(`${pet.name} schläft — erst wecken`, 'careSleep'); return false; }
  if (pet.stats.full > 97) { toast(`${pet.name} ist pappsatt`, 'moodProud'); return false; }

  tickPet(pet);
  s.me.inv[foodId]--;
  if (s.me.inv[foodId] <= 0) delete s.me.inv[foodId];

  ['full', 'joy', 'energy', 'clean'].forEach((k) => {
    if (food[k]) pet.stats[k] = clamp100(pet.stats[k] + food[k]);
  });
  const lvl = addXp(pet, 5);

  pushFeed(s, { from: 'me', type: 'feed', icon: food.icon, text: `${pet.name} hat ${food.label} bekommen` });
  commit('feed');

  fx('eat');
  animatePet('eat');
  if (sourceEl) burst([food.icon, 'statJoy'], { from: sourceEl, count: 6, rise: 110 });
  if (lvl) celebrateLevel(pet);
  sendEvent('profile', { pet: { name: pet.name, look: pet.look, stats: pet.stats, level: pet.level, asleep: pet.asleep } });
  return true;
}

/* ── Partner-Gesten ─────────────────────────────────────── */

export function sendNudge(key, sourceEl) {
  const s = get();
  const n = nudgeByKey(key) || NUDGES[0];
  if (!s.partner) { toast('Noch niemand verbunden', 'info'); return false; }

  addBondXp(s, n.bond);
  s.bond.hugs++;
  s.me.coins += REWARDS.nudgeSent;
  s.me.pet.stats.joy = clamp100(s.me.pet.stats.joy + 3);
  pushFeed(s, { from: 'me', type: 'nudge', icon: n.icon, text: `${n.self} an ${s.partner.name}` });
  commit('nudge');

  sendEvent('nudge', { key });
  fx('love');
  animatePet(n.act || 'hop');
  if (sourceEl) burst([n.icon, 'statJoy'], { from: sourceEl, count: 8, rise: 140 });
  toast(`${n.label} unterwegs zu ${s.partner.name}`, n.icon);
  return true;
}

export function setMood(key, note = '') {
  const s = get();
  const m = moodByKey(key);
  s.me.mood = { key, note, at: Date.now() };
  pushFeed(s, { from: 'me', type: 'mood', icon: m?.icon || 'nudgeThink', text: `Du fühlst dich ${m?.label.toLowerCase() || '…'}`, note });
  addBondXp(s, 2);
  commit('mood');
  sendEvent('mood', { key, note });
  fx('pop');
  return true;
}

export function setActivity(key) {
  const s = get();
  const a = activityByKey(key);
  s.me.activity = { key, at: Date.now() };
  commit('activity');
  sendEvent('act', { key });
  fx('tap');
  toast(`Status: ${a?.label || '…'}`, a?.icon || 'info');
  return true;
}
