/**
 * Eingehende Partner-Ereignisse.
 *
 * Alle Sync-Wege (Solo-Simulation, Cloud, Brieftauben-Code) enden hier.
 * Ein Ereignis kommt rein, der Zustand ändert sich, und wenn es etwas zu
 * zeigen gibt, kommt eine Beschreibung für die Dynamic Island zurück.
 */

import { get, commit } from './store.js';
import { pushFeed, addBondXp, newPet, touchStreak, validPlace } from './model.js';
import { moodByKey, activityByKey, nudgeByKey } from '../pet/moods.js';
import { REWARDS } from './catalog.js';
import { handleRemoteGameEvent } from '../games/index.js';
import { adoptSecret } from '../sync/index.js';
import {
  nestApplyRemote, nestSummary, pollApplyRemote, rateApplyRemote,
  rateScore, weightLabel, KIND_ICON, rewardShared
} from './shared.js';

/** Fremder Text im Verlauf darf die Zeile nicht sprengen. */
const short = (s, n = 48) => {
  const t = String(s || '').trim();
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
};

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
  if (profile.place !== undefined) p.place = validPlace(profile.place);
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
      // Ein hello bringt das gemeinsame Geheimnis mit — beide einigen sich
      // nach derselben Regel, also landen sie im selben verschlüsselten Raum.
      if (ev.t === 'hello' && ev.d?.k) adoptSecret(ev.d.k);
      const p = mergeProfile(state, ev.d || {});
      if (ev.t === 'hello') {
        if (!state.bond.since) state.bond.since = at;
        notify = {
          kind: 'pair',
          avatar: 'them',
          icon: 'dove',
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
        icon: m?.icon || 'nudgeThink',
        text: `${p.name} fühlt sich ${m ? m.label.toLowerCase() : 'irgendwie'}`,
        note: ev.d?.note || ''
      });
      addBondXp(state, 2);
      if (!silent) {
        notify = {
          kind: 'mood',
          avatar: 'them',
          icon: m?.icon || 'nudgeThink',
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
        icon: a?.icon || 'info',
        text: `${p.name}: ${a?.label || 'macht was'}`
      });
      if (!silent) {
        notify = {
          kind: 'act',
          avatar: 'them',
          icon: a?.icon || 'info',
          title: p.name,
          sub: a?.label || 'macht gerade etwas',
          body: `${p.name} ist gerade beim Thema „${a?.label || '…'}“.`,
          actions: [{ label: 'Viel Spaß', act: 'nudge:denkan' }],
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
        icon: n?.icon || 'statJoy',
        text: `${p.name} ${n?.text || 'denkt an dich'}`
      });
      if (!silent) {
        notify = {
          kind: 'nudge',
          avatar: 'them',
          icon: n?.icon || 'statJoy',
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
          icon: 'careCuddle',
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
        icon: 'mailHeart',
        text: `${p.name} hat die Frage des Tages beantwortet`
      });
      if (!silent) {
        const ready = !!state.daily.revealedAt;
        notify = {
          kind: 'daily',
          avatar: 'them',
          icon: 'mailHeart',
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

    /* ── Gemeinsames Nest ── */
    case 'nest': {
      const p = ensurePartner(state);
      p.lastSeen = at;
      const item = nestApplyRemote(state, ev.d || {});
      if (!item) break;
      const sum = nestSummary(state);
      pushFeed(state, {
        from: 'them', type: 'nest', at,
        icon: item.icon || 'tabNest',
        text: `${p.name} zum Nest: „${item.text}“ ist ${weightLabel(item.theirs).toLowerCase()}`
      });
      addBondXp(state, 2);
      if (!silent) {
        const agreedNow = item.mine >= 2 && item.theirs >= 2;
        notify = {
          kind: 'nest',
          avatar: 'them',
          icon: item.icon || 'tabNest',
          title: agreedNow ? 'Da seid ihr euch einig' : `${p.name} hat am Nest gebaut`,
          sub: item.text,
          body: agreedNow
            ? `Ihr wollt beide „${item.text}“. Das kommt ins gemeinsame Nest.`
            : `${p.name} findet „${item.text}“ ${weightLabel(item.theirs).toLowerCase()}.${
              sum.match != null ? ` Ihr passt zu ${sum.match}% zusammen.` : ''}`,
          actions: [{ label: 'Ansehen', act: 'open:us:nest', primary: true }],
          tone: agreedNow ? 'love' : 'calm',
          quiet: !agreedNow
        };
      }
      break;
    }

    /* ── Abstimmung ── */
    case 'poll': {
      const p = ensurePartner(state);
      p.lastSeen = at;
      const res = pollApplyRemote(state, ev.d || {});
      if (!res) break;
      const { poll, revealed, fresh, agree } = res;
      const label = (k) => poll.opts.find((o) => o.k === k)?.label || '—';

      if (fresh) {
        rewardShared(state, 'poll',
          agree ? `Ihr wollt beide: ${label(poll.mine)}` : 'Abstimmung ausgewertet', 'tabVote');
        if (agree) state.me.coins += REWARDS.dailyBoth;
      } else if (ev.d?.v != null) {
        pushFeed(state, {
          from: 'them', type: 'poll', at, icon: 'ballot',
          text: `${p.name} hat abgestimmt: ${short(poll.q)}`
        });
      } else {
        pushFeed(state, {
          from: 'them', type: 'poll', at, icon: 'tabVote',
          text: `${p.name} fragt: ${short(poll.q)}`
        });
      }

      if (!silent) {
        notify = revealed
          ? {
            kind: 'poll',
            avatar: 'them',
            icon: agree ? 'handshake' : 'scale',
            title: agree ? 'Ihr seid euch einig!' : 'Zwei Meinungen',
            sub: agree ? label(poll.mine) : `${label(poll.mine)} vs. ${label(poll.theirs)}`,
            body: agree
              ? `Ihr habt beide „${label(poll.mine)}“ gewählt. Abgemacht.`
              : `Du wolltest „${label(poll.mine)}“, ${p.name} „${label(poll.theirs)}“. Jetzt müsst ihr reden.`,
            actions: [{ label: 'Ergebnis', act: 'open:us:vote', primary: true }],
            tone: agree ? 'love' : 'calm'
          }
          : {
            kind: 'poll',
            avatar: 'them',
            icon: 'tabVote',
            title: poll.mine == null ? 'Du bist gefragt' : `${p.name} wartet`,
            sub: poll.q,
            body: `${p.name} hat abgestimmt. Sichtbar wird es, sobald du auch gewählt hast.`,
            actions: [{ label: 'Abstimmen', act: 'open:us:vote', primary: true }],
            tone: 'calm'
          };
      }
      break;
    }

    /* ── Bewerten und Raten ── */
    case 'rate': {
      const p = ensurePartner(state);
      p.lastSeen = at;
      const res = rateApplyRemote(state, ev.d || {});
      if (!res) break;
      const { entry, revealed, fresh } = res;
      const ico = KIND_ICON[entry.kind] || 'sparkle';

      if (fresh) {
        const sc = rateScore(entry);
        rewardShared(state, 'rate', `„${entry.title}“ ist ausgewertet`, ico);
        state.me.coins += Math.max(2, Math.round(sc.myPts / 2));
        if (!silent) {
          notify = {
            kind: 'rate',
            avatar: 'them',
            icon: sc.total >= 16 ? 'trophy' : 'dial',
            title: `${entry.title}: aufgedeckt`,
            sub: `Du ${entry.mine.score}/10 · ${p.name} ${entry.theirs.score}/10`,
            body: `${sc.verdict} Du hast ${sc.myPts} von 10 Punkten geholt.`,
            actions: [{ label: 'Ansehen', act: 'open:us:rate', primary: true }],
            tone: 'love'
          };
        }
      } else {
        const mineMissing = !entry.mine;
        pushFeed(state, {
          from: 'them', type: 'rate', at, icon: ico,
          text: ev.d?.s != null
            ? `${p.name} hat „${short(entry.title)}“ bewertet`
            : `${p.name} fragt nach: „${short(entry.title)}“`
        });
        if (!silent) {
          notify = {
            kind: 'rate',
            avatar: 'them',
            icon: ico,
            title: mineMissing ? 'Wie findest du das?' : `${p.name} hat bewertet`,
            sub: entry.title,
            body: mineMissing
              ? `${p.name} will wissen, wie du „${entry.title}“ findest — und tippt, was du sagst.`
              : `${p.name} hat abgegeben. Sichtbar wird es, sobald du auch dran warst.`,
            actions: [{ label: 'Bewerten', act: 'open:us:rate', primary: true }],
            tone: 'calm'
          };
        }
      }
      break;
    }

    default:
      return null;
  }

  touchStreak(state);
  commit('remote');
  return notify;
}
