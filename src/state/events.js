/**
 * Eingehende Partner-Ereignisse.
 *
 * Alle Sync-Wege (Solo-Simulation, Cloud, Brieftauben-Code) enden hier.
 * Ein Ereignis kommt rein, der Zustand ändert sich, und wenn es etwas zu
 * zeigen gibt, kommt eine Beschreibung für die Dynamic Island zurück.
 */

import { get, commit } from './store.js';
import { pushFeed, addBondXp, newPet, touchStreak } from './model.js';
import { moodByKey, activityByKey, nudgeByKey } from '../pet/moods.js';
import { REWARDS } from './catalog.js';
import { handleRemoteGameEvent } from '../games/index.js';

/** Doppelt zugestellte Ereignisse (Cloud + Code) einmal zählen. */
function isDuplicate(state, id) {
  if (!id) return false;
  if (state.seen.includes(id)) return true;
  state.seen.push(id);
  if (state.seen.length > 240) state.seen.splice(0, state.seen.length - 240);
  return false;
}

function ensurePartner(state, profile = {}) {
  if (!state.partner) {
    state.partner = {
      linked: true,
      code: profile.code || '??????',
      name: profile.name || 'Dein Mensch',
      tz: profile.tz || state.me.tz,
      pet: newPet(profile.pet?.name || 'Pieps', 3),
      mood: null,
      activity: null,
      lastSeen: 0,
      updatedAt: 0
    };
  }
  return state.partner;
}

function mergeProfile(state, profile) {
  const p = ensurePartner(state, profile);
  if (profile.name) p.name = profile.name;
  if (profile.tz) p.tz = profile.tz;
  if (profile.code) p.code = profile.code;
  if (profile.pet) {
    p.pet.name = profile.pet.name || p.pet.name;
    if (profile.pet.look) p.pet.look = { ...p.pet.look, ...profile.pet.look };
    if (profile.pet.stats) p.pet.stats = { ...p.pet.stats, ...profile.pet.stats };
    if (typeof profile.pet.level === 'number') p.pet.level = profile.pet.level;
    p.pet.asleep = !!profile.pet.asleep;
  }
  if (profile.mood !== undefined) p.mood = profile.mood;
  if (profile.activity !== undefined) p.activity = profile.activity;
  p.lastSeen = Math.max(p.lastSeen || 0, profile.at || Date.now());
  p.updatedAt = Date.now();
  return p;
}

/**
 * Wendet ein Partner-Ereignis an.
 * @returns {object|null} Beschreibung für die Dynamic Island
 */
export function applyEvent(ev, { silent = false } = {}) {
  if (!ev || !ev.t) return null;
  const state = get();
  if (isDuplicate(state, ev.id)) return null;

  const at = ev.at || Date.now();
  let notify = null;

  switch (ev.t) {
    case 'hello':
    case 'profile': {
      const p = mergeProfile(state, ev.d || {});
      if (ev.t === 'hello') {
        if (!state.bond.since) state.bond.since = at;
        notify = {
          kind: 'pair',
          avatar: 'them',
          emoji: '🤝',
          title: `${p.name} ist da!`,
          sub: 'Ihr seid verbunden',
          body: `${p.pet.name} und ${state.me.pet.name} kennen sich jetzt.`,
          actions: [{ label: 'Hallo winken', act: 'nudge:knuddel' }],
          tone: 'love'
        };
      }
      break;
    }

    case 'mood': {
      const p = ensurePartner(state);
      const m = moodByKey(ev.d?.key);
      p.mood = { key: ev.d?.key, note: ev.d?.note || '', at };
      p.lastSeen = at;
      pushFeed(state, {
        from: 'them', type: 'mood', at,
        emoji: m?.emoji || '💬',
        text: `${p.name} fühlt sich ${m ? m.label.toLowerCase() : 'irgendwie'}`,
        note: ev.d?.note || ''
      });
      addBondXp(state, 2);
      if (!silent) {
        notify = {
          kind: 'mood',
          avatar: 'them',
          emoji: m?.emoji || '💬',
          title: `${p.name}: ${m?.label || 'Stimmung'}`,
          sub: ev.d?.note ? ev.d.note : `${p.pet.name} ${m?.line || 'sagt hallo'}`,
          body: ev.d?.note || `${p.pet.name} ${m?.line || 'sagt hallo'}.`,
          actions: [
            { label: 'Knuddeln', act: 'nudge:knuddel' },
            { label: 'Antworten', act: 'open:us' }
          ],
          tone: 'love'
        };
      }
      break;
    }

    case 'act': {
      const p = ensurePartner(state);
      const a = activityByKey(ev.d?.key);
      p.activity = { key: ev.d?.key, at };
      p.lastSeen = at;
      pushFeed(state, {
        from: 'them', type: 'act', at,
        emoji: a?.emoji || '📍',
        text: `${p.name}: ${a?.label || 'macht was'}`
      });
      if (!silent) {
        notify = {
          kind: 'act',
          avatar: 'them',
          emoji: a?.emoji || '📍',
          title: p.name,
          sub: a?.label || 'macht gerade etwas',
          body: `${p.name} ist gerade beim Thema „${a?.label || '…'}".`,
          actions: [{ label: 'Viel Spaß 💛', act: 'nudge:denkan' }],
          tone: 'calm',
          quiet: true
        };
      }
      break;
    }

    case 'nudge': {
      const p = ensurePartner(state);
      const n = nudgeByKey(ev.d?.key);
      p.lastSeen = at;
      state.bond.hugs++;
      addBondXp(state, n?.bond ?? 2);
      state.me.coins += REWARDS.nudgeGot;
      state.me.pet.stats.joy = Math.min(100, state.me.pet.stats.joy + 7);
      pushFeed(state, {
        from: 'them', type: 'nudge', at,
        emoji: n?.emoji || '💛',
        text: `${p.name} ${n?.text || 'denkt an dich'}`
      });
      if (!silent) {
        notify = {
          kind: 'nudge',
          avatar: 'them',
          emoji: n?.emoji || '💛',
          title: `${p.name} ${n?.text || 'denkt an dich'}`,
          sub: `${state.me.pet.name} freut sich`,
          body: `${p.name} ${n?.text || 'denkt an dich'}. ${state.me.pet.name} plustert sich vor Freude auf.`,
          actions: [
            { label: 'Zurück knuddeln', act: 'nudge:knuddel', primary: true },
            { label: 'Kuss', act: 'nudge:kuss' }
          ],
          tone: 'love'
        };
      }
      break;
    }

    case 'cuddle': {
      const p = ensurePartner(state);
      p.lastSeen = at;
      state.cuddleUntil = ev.d?.on ? at + 12_000 : 0;
      if (ev.d?.on && !silent) {
        notify = {
          kind: 'cuddle',
          avatar: 'them',
          emoji: '🫂',
          title: `${p.name} hält gerade`,
          sub: 'Halt auch — dann kuschelt ihr',
          body: `${p.name} drückt den Kuschel-Knopf. Halte deinen gedrückt, dann spürt ihr euch gleichzeitig.`,
          actions: [{ label: 'Zum Kuscheln', act: 'open:us', primary: true }],
          tone: 'love',
          live: true
        };
      }
      break;
    }

    case 'daily': {
      const p = ensurePartner(state);
      p.lastSeen = at;
      if (!state.daily || state.daily.day !== ev.d?.day) {
        state.daily = { day: ev.d?.day, q: ev.d?.q || '', mine: null, theirs: null, revealedAt: null };
      }
      state.daily.theirs = { text: ev.d?.answer || '', at };
      if (state.daily.mine && !state.daily.revealedAt) {
        state.daily.revealedAt = at;
        state.me.coins += REWARDS.dailyBoth;
        addBondXp(state, 8);
      }
      pushFeed(state, {
        from: 'them', type: 'daily', at,
        emoji: '💌',
        text: `${p.name} hat die Frage des Tages beantwortet`
      });
      if (!silent) {
        const ready = !!state.daily.revealedAt;
        notify = {
          kind: 'daily',
          avatar: 'them',
          emoji: '💌',
          title: ready ? 'Beide haben geantwortet!' : `${p.name} hat geantwortet`,
          sub: ready ? 'Jetzt darfst du lesen' : 'Du bist dran',
          body: ready
            ? `Ihr habt beide geantwortet. Die Frage des Tages ist jetzt offen.`
            : `${p.name} hat die Frage des Tages beantwortet — sichtbar wird sie, sobald du auch antwortest.`,
          actions: [{ label: ready ? 'Lesen' : 'Antworten', act: 'open:us', primary: true }],
          tone: 'love'
        };
      }
      break;
    }

    case 'game': {
      const p = ensurePartner(state);
      p.lastSeen = at;
      notify = handleRemoteGameEvent(state, ev.d || {}, { silent, partnerName: p.name });
      break;
    }

    default:
      return null;
  }

  touchStreak(state);
  commit('remote');
  return notify;
}
