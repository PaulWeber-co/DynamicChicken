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
import { roundSeed, cycledMany } from '../util/rng.js';
import { dayKey } from '../util/time.js';
import { dayIndex } from '../pet/moods.js';
import { sendEvent } from '../sync/index.js';

import * as grainRush from './grainRush.js';
import * as featherFlight from './featherFlight.js';
import * as nestTower from './nestTower.js';
import * as doodle from './doodle.js';
import * as blocks from './blocks.js';
import * as runner from './runner.js';
import * as sling from './sling.js';
import * as story from './story.js';
import * as hueCue from './hueCue.js';
import * as meme from './meme.js';
import * as topFive from './topFive.js';
import * as kribbeln from './kribbeln.js';

/**
 * Alle Spiele, die es gibt. Die Reihenfolge ist die Reihenfolge auf dem
 * Bildschirm: erst die flinken Einzelspiele, dann die vier, bei denen man
 * etwas voneinander erfährt.
 */
export const GAMES = [
  grainRush, featherFlight, nestTower, doodle, blocks, runner, sling, story,
  topFive, meme, kribbeln, hueCue
];
export const gameById = (id) => GAMES.find((g) => g.meta.id === id);

/**
 * Acht Spiele für sich allein, vier davon pro Tag.
 *
 * Zwölf Kacheln gleichzeitig wären eine Wand, durch die man scrollen müsste,
 * und nach zwei Wochen spielt man ohnehin nur noch dieselben zwei. Also
 * rotiert die Hälfte: Jeden Tag stehen vier andere im Raster. Welche, hängt
 * am Datum und am Paarcode — beide Geräte kommen also auf dieselben vier,
 * ohne sich abzusprechen, und zwei Paare sehen an einem Tag Verschiedenes.
 *
 * Die vier Spiele, bei denen ihr euch abwechselt (Top Fünf, Meme-Duell,
 * Kribbeln, Farbfunk), bleiben immer da. Eine angefangene Runde soll nicht
 * bis übermorgen warten müssen, nur weil der Kalender es so will.
 */
export const ROTIEREND = ['grain', 'flight', 'tower', 'doodle', 'blocks', 'runner', 'sling', 'story'];
export const FEST = ['top5', 'meme', 'krib', 'hue'];
export const PRO_TAG = 4;

/**
 * Die vier neuen Spiele — und bis wann sie garantiert dastehen.
 *
 * Vier Tage lang belegen sie alle Plätze, danach mischen sie sich unter die
 * anderen. Sonst hätte man am ersten Tag ein Drittel davon gesehen und
 * müsste bis nächste Woche warten, um den Rest überhaupt kennenzulernen.
 *
 * Das Datum steht fest im Code, nicht im Speicherstand: Beide Geräte müssen
 * am selben Tag dasselbe zeigen, auch wenn eines die App später zum ersten
 * Mal öffnet.
 */
export const NEU = ['blocks', 'runner', 'sling', 'story'];
export const NEU_BIS = '2026-08-24';   // ab diesem Tag wird gewürfelt

export const zeigtNeue = (tag = dayKey()) => dayIndex(tag) < dayIndex(NEU_BIS);

/**
 * Welche Spiele stehen heute im Raster?
 *
 * Wartet in einem rotierenden Spiel ein Zug auf dich, kommt es dazu — auch
 * wenn es heute eigentlich nicht dran wäre. Sonst würde eine Partie
 * unsichtbar, die jemand angefangen hat.
 */
export function todaysGames(state = get(), tag = dayKey()) {
  const a = state.me?.code || 'SOLO';
  const b = state.partner?.code || 'SOLO';
  const salz = `spiele|${[a, b].sort().join('~')}`;
  const heute = zeigtNeue(tag)
    ? NEU.slice()
    : cycledMany(ROTIEREND, PRO_TAG, dayIndex(tag), salz);

  const wartend = ROTIEREND.filter((id) => {
    if (heute.includes(id)) return false;
    const g = gameById(id);
    return g && gameSummary(state, g).badge === 'wait';
  });

  const ids = [...heute, ...wartend];
  // In der Reihenfolge von GAMES ausgeben, damit das Raster nicht springt
  return [
    ...GAMES.filter((g) => ids.includes(g.meta.id)),
    ...GAMES.filter((g) => FEST.includes(g.meta.id))
  ];
}

/** Steht dieses Spiel nur heute im Raster? Für den kleinen Hinweis darauf. */
export const istRotierend = (id) => ROTIEREND.includes(id);

/** Gemeinsamer Schlüssel beider Geräte — Reihenfolge-unabhängig. */
export function pairKey(state = get()) {
  const a = state.me.code || 'SOLO';
  const b = state.partner?.code || 'SOLO';
  return [a, b].sort().join('~');
}

export function seedFor(gameId, round, state = get()) {
  return roundSeed(gameId, String(round), pairKey(state));
}

/* ── Generisches Punkte-Duell (Körner-Jagd, Federflug, Nest-Turm) ─── */

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
    icon: g?.meta.icon || 'tabPlay',
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

  // Spiele mit eigenem Zustand (Top Fünf, Meme-Duell, Kribbeln, Farbfunk)
  if (typeof g.handleRemote === 'function') {
    const own = g.handleRemote(state, msg, { partnerName });
    if (own !== undefined) return own;
  }

  // Eine Einladung braucht keinen Duell-Zustand. Würde sie ihn anlegen,
  // bekämen Spiele mit eigenem Zustand (Farbfunk, Top Fünf, …) die fremden
  // Felder untergeschoben, bevor sie je geöffnet wurden.
  if (msg.kind === 'invite') {
    return {
      kind: 'gameInvite',
      icon: g.meta.icon,
      avatar: 'them',
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

  const d = duel(state, msg.g);

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
        icon: won ? 'trophy' : done.result === 'draw' ? 'nudgeHug' : g.meta.icon,
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
      icon: g.meta.icon,
      avatar: 'them',
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
  if (!total) return { badge: null, text: 'Neu' };
  return { badge: null, text: `${d.wins.me}–${d.wins.them}` };
}

/** Wie viele Spiele warten auf mich? Steuert den Punkt in der Tab-Bar. */
export function pendingCount(state) {
  return GAMES.reduce((n, g) => {
    const s = gameSummary(state, g);
    return n + (s.badge === 'wait' ? 1 : 0);
  }, 0);
}
