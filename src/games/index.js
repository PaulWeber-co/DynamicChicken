/**
 * Spiel-Registry und die gemeinsame Duell-Mechanik.
 *
 * Zentrale Idee: Jedes Duell hat eine Runden-Nummer und einen Seed, den
 * beide Geräte allein aus dem Paar-Code berechnen. Dadurch spielt ihr exakt
 * dieselbe Runde — egal ob gleichzeitig oder mit acht Stunden Abstand.
 * Wer zuerst fertig ist, schickt sein Ergebnis; sobald beide da sind, wird
 * auf beiden Seiten identisch abgerechnet. Kein Server, kein Schiedsrichter.
 */

import { get, commit } from '../state/store.js';
import { pushFeed, addBondXp } from '../state/model.js';
import { REWARDS } from '../state/catalog.js';
import { roundSeed } from '../util/rng.js';
import { sendEvent } from '../sync/index.js';

import * as grainRush from './grainRush.js';
import * as eggDuel from './eggDuel.js';
import * as heartbeat from './heartbeat.js';
import * as moodMatch from './moodMatch.js';
import * as memory from './memory.js';

export const GAMES = [grainRush, eggDuel, heartbeat, moodMatch, memory];
export const gameById = (id) => GAMES.find((g) => g.meta.id === id);

/** Gemeinsamer Schlüssel beider Geräte — Reihenfolge-unabhängig. */
export function pairKey(state = get()) {
  const a = state.me.code || 'SOLO';
  const b = state.partner?.code || 'SOLO';
  return [a, b].sort().join('~');
}

export function seedFor(gameId, round, state = get()) {
  return roundSeed(gameId, String(round), pairKey(state));
}

/* ── Generisches Punkte-Duell (Körner-Jagd, Memory) ─────── */

export function duel(state, id) {
  if (!state.games[id]) {
    state.games[id] = { r: 1, mine: null, theirs: null, wins: { me: 0, them: 0, draw: 0 }, history: [], plays: 0 };
  }
  const d = state.games[id];
  d.wins ||= { me: 0, them: 0, draw: 0 };
  d.history ||= [];
  return d;
}

/** Runde abrechnen, sobald beide Ergebnisse vorliegen. */
function settle(state, id, partnerName = 'Dein Mensch') {
  const d = duel(state, id);
  if (!d.mine || !d.theirs) return null;

  const g = gameById(id);
  const mine = d.mine.score, theirs = d.theirs.score;
  const result = mine > theirs ? 'me' : theirs > mine ? 'them' : 'draw';

  d.wins[result]++;
  d.history.unshift({ r: d.r, mine, theirs, result, at: Date.now() });
  if (d.history.length > 24) d.history.length = 24;

  const reward = result === 'me' ? REWARDS.gameWon : result === 'draw' ? REWARDS.gameDraw : REWARDS.gamePlayed;
  state.me.coins += reward;
  addBondXp(state, 5);
  state.me.pet.stats.joy = Math.min(100, state.me.pet.stats.joy + 5);

  pushFeed(state, {
    from: 'system', type: 'game',
    emoji: g?.meta.emoji || '🎮',
    text: result === 'me'
      ? `${g?.meta.title}: du gewinnst ${mine}:${theirs}`
      : result === 'them'
        ? `${g?.meta.title}: ${partnerName} gewinnt ${theirs}:${mine}`
        : `${g?.meta.title}: unentschieden ${mine}:${theirs}`
  });

  // nächste Runde
  d.r++;
  d.mine = null;
  d.theirs = null;

  return { result, mine, theirs, reward, game: g?.meta };
}

/** Eigenes Ergebnis eintragen und verschicken. */
export function submitScore(id, score, detail = {}) {
  const state = get();
  const d = duel(state, id);
  d.mine = { score, at: Date.now(), detail };
  d.plays = (d.plays || 0) + 1;
  state.me.coins += REWARDS.gamePlayed;

  sendEvent('game', { g: id, kind: 'score', r: d.r, score, detail });

  const settled = settle(state, id, state.partner?.name);
  commit('game');
  return { settled, round: d.r };
}

/** Live-Zwischenstand, während beide gleichzeitig spielen. */
export function sendLiveTick(id, score) {
  const state = get();
  sendEvent('game', { g: id, kind: 'tick', r: duel(state, id).r, score }, { volatile: true });
}

export function inviteToPlay(id) {
  const state = get();
  sendEvent('game', { g: id, kind: 'invite', r: duel(state, id).r });
}

/* ── Eingehende Spiel-Ereignisse ────────────────────────── */

export function handleRemoteGameEvent(state, msg, ctx = {}) {
  const g = gameById(msg.g);
  if (!g) return null;
  const partnerName = ctx.partnerName || state.partner?.name || 'Dein Mensch';

  // Spiele mit eigener Logik (Ei-Duell, Herzschlag, Gefühls-Duett)
  if (typeof g.handleRemote === 'function') {
    const own = g.handleRemote(state, msg, { partnerName });
    if (own !== undefined) return own;
  }

  const d = duel(state, msg.g);

  if (msg.kind === 'invite') {
    return {
      kind: 'gameInvite',
      emoji: g.meta.emoji,
      title: `${partnerName} fordert dich heraus`,
      sub: g.meta.title,
      body: `${partnerName} spielt gerade ${g.meta.title}. Runde ${msg.r} liegt für dich bereit.`,
      actions: [
        { label: 'Annehmen', act: `game:${g.meta.id}`, primary: true },
        { label: 'Später', act: 'dismiss' }
      ],
      tone: 'warm'
    };
  }

  if (msg.kind === 'tick') {
    if (msg.r === d.r) {
      d.liveScore = { score: msg.score, at: Date.now() };
      commit('game-tick');
    }
    return null;
  }

  if (msg.kind === 'score') {
    // Ergebnis aus einer bereits abgerechneten Runde ignorieren
    if (msg.r < d.r) return null;
    if (msg.r > d.r) { d.r = msg.r; d.mine = null; }
    d.theirs = { score: msg.score, at: Date.now(), detail: msg.detail || {} };

    const done = settle(state, msg.g, partnerName);
    if (done) {
      const won = done.result === 'me';
      return {
        kind: 'gameResult',
        emoji: won ? '🏆' : done.result === 'draw' ? '🤝' : g.meta.emoji,
        title: won ? 'Du gewinnst!' : done.result === 'draw' ? 'Unentschieden!' : `${partnerName} gewinnt`,
        sub: `${g.meta.title} · ${done.mine}:${done.theirs}`,
        body: `${g.meta.title}, Runde abgeschlossen: ${done.mine}:${done.theirs}. Du bekommst ${done.reward} Körner.`,
        actions: [
          { label: 'Revanche', act: `game:${g.meta.id}`, primary: true },
          { label: 'Danke', act: 'dismiss' }
        ],
        tone: won ? 'warm' : 'calm'
      };
    }

    return {
      kind: 'gameWaiting',
      emoji: g.meta.emoji,
      title: `${partnerName} hat vorgelegt`,
      sub: `${g.meta.title} · ${msg.score} Punkte`,
      body: `${partnerName} hat in ${g.meta.title} ${msg.score} Punkte gemacht. Du bist dran — gleiche Runde, gleiche Bedingungen.`,
      actions: [
        { label: 'Jetzt spielen', act: `game:${g.meta.id}`, primary: true },
        { label: 'Später', act: 'dismiss' }
      ],
      tone: 'warm'
    };
  }

  return null;
}

/* ── Übersicht für die Spiele-Liste ─────────────────────── */

export function gameSummary(state, g) {
  if (typeof g.summary === 'function') return g.summary(state);
  const d = duel(state, g.meta.id);
  if (d.theirs && !d.mine) return { badge: 'wait', text: 'Du bist dran' };
  if (d.mine && !d.theirs) return { badge: 'off', text: 'Wartet auf Antwort' };
  const total = d.wins.me + d.wins.them + d.wins.draw;
  if (!total) return { badge: null, text: 'Noch nie gespielt' };
  return { badge: null, text: `${d.wins.me}–${d.wins.them} für ${d.wins.me >= d.wins.them ? 'dich' : 'sie/ihn'}` };
}

/** Wie viele Spiele warten auf mich? Steuert den Punkt in der Tab-Bar. */
export function pendingCount(state) {
  return GAMES.reduce((n, g) => {
    const s = gameSummary(state, g);
    return n + (s.badge === 'wait' ? 1 : 0);
  }, 0);
}
