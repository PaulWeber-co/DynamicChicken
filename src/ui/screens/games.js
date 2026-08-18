/**
 * Spiele — die Übersicht.
 *
 * Der Bildschirm scrollt nicht. Weder hoch noch zur Seite: Wer spielen
 * will, soll alles gleichzeitig sehen und sich entscheiden, statt zu
 * suchen. Das ist die härteste Vorgabe an diesem Screen und bestimmt
 * seinen ganzen Aufbau.
 *
 * Also zweistufig und höhenbewusst: Was auf dich wartet, steht oben als
 * Zeile (höchstens drei, sonst frisst es das Raster). Darunter alle Spiele
 * als Kacheln in einem Raster, das sich den verbleibenden Platz nimmt und
 * seine Zeilen gleichmäßig darauf verteilt. Der Kräftevergleich unten ist
 * Beiwerk und verschwindet auf kurzen Bildschirmen als Erstes.
 */

import { esc } from '../../util/dom.js';
import { icon } from '../icons.js';
import { fx } from '../../util/feedback.js';
import { get, subscribe } from '../../state/store.js';
import { GAMES, gameSummary } from '../../games/index.js';
import { partnerOnline } from '../../sync/index.js';
import { openGame } from '../gameHost.js';
import { renderHead } from '../../pet/chicken.js';
import { petPower } from '../../state/model.js';
import { go } from '../shell.js';

const MAX_WAITING = 3;

export function render(root, ctx) {
  function paint() {
    const s = get();
    const online = partnerOnline();

    const rated = GAMES.map((g) => ({ g, sum: gameSummary(s, g) }));
    const allWaiting = rated.filter((x) => x.sum.badge === 'wait');
    // Höchstens drei Zeilen oben. Alles darüber bliebe zwar dringend, würde
    // aber das Raster aus dem Bild schieben — und dann scrollt es doch.
    const waiting = allWaiting.slice(0, MAX_WAITING);
    const shown = new Set(waiting.map((x) => x.g.meta.id));
    const rest = rated.filter((x) => !shown.has(x.g.meta.id));

    root.innerHTML = `
      <div class="row-between games-head">
        <div>
          <div class="title-lg">Spiele</div>
          <div class="subtitle">${s.partner
            ? online ? `${esc(s.partner.name)} ist gerade da — live spielen geht.` : 'Spiel wann du willst, der Rest wartet.'
            : 'Im Solo-Modus spielt ein simulierter Mensch mit.'}</div>
        </div>
        <div class="coin-pill">${icon('grain', { size: 20 })}<b>${s.me.coins}</b></div>
      </div>

      ${waiting.length ? `
        <div class="section-label">Du bist dran <span class="label-count">${allWaiting.length}</span></div>
        <div class="game-list tight">
          ${waiting.map(({ g, sum }) => bigCard(g, sum, online)).join('')}
        </div>` : ''}

      <div class="section-label">${waiting.length ? 'Alle Spiele' : 'Duelle'}</div>
      <div class="game-grid">
        ${rest.map(({ g, sum }) => tile(g, sum, online)).join('')}
      </div>

      ${s.partner ? arena(s) : ''}`;

    root.querySelectorAll('[data-game]').forEach((b) => {
      b.onclick = () => { fx('pop'); openGame(b.dataset.game); };
    });
    const link = root.querySelector('[data-goto-us]');
    if (link) link.onclick = () => go('us');
  }

  /* Volle Karte — nur für das, was gerade auf dich wartet.
     Der Titel der Aufgabe steht hier vor dem Namen des Spiels: „Du gibst den
     Hinweis“ sagt mehr darüber, was zu tun ist, als „Farbfunk“. */
  function bigCard(g, sum, online) {
    const live = g.meta.modes.includes('live') && online;
    return `<button class="card game-item tone-${g.meta.tone}" data-game="${g.meta.id}">
      <div class="game-item-e">${icon(g.meta.icon, { size: 27 })}</div>
      <div class="grow">
        <div class="game-item-t">${esc(sum.text)}</div>
        <div class="game-item-s">${esc(g.meta.title)}${live ? ' · live möglich' : ''}</div>
      </div>
      ${live ? '<span class="dot-live"></span>' : ''}
      <span class="li-chev">${icon('chevron', { size: 16 })}</span>
    </button>`;
  }

  /* Kachel — zwei nebeneinander, alle auf einen Blick. */
  function tile(g, sum, online) {
    const live = g.meta.modes.includes('live') && online;
    return `<button class="game-tile tone-${g.meta.tone}" data-game="${g.meta.id}">
      <span class="game-tile-e">${icon(g.meta.icon, { size: 24 })}</span>
      <span class="grow">
        <span class="game-tile-t">${esc(g.meta.title)}</span>
        <span class="game-tile-s">${esc(sum.text)}</span>
      </span>
      ${sum.badge === 'off' ? '<i class="game-dot off" title="wartet auf Antwort"></i>' : ''}
      ${live ? '<i class="game-dot live" title="live möglich"></i>' : ''}
    </button>`;
  }

  /* Kräftevergleich als schmaler Streifen. Er ist Beiwerk, kein Weg zu
     einem Spiel — deshalb steht er unter dem Raster und nicht davor. */
  function arena(s) {
    const mine = petPower(s.me.pet);
    const theirs = petPower(s.partner.pet);
    const total = Math.max(1, mine + theirs);
    return `<div class="card arena" style="margin-top:14px">
      <div class="arena-row">
        <div class="arena-side">
          ${renderHead(s.me.pet.look, 30)}
          <div class="arena-name">${esc(s.me.pet.name)}</div>
        </div>
        <div class="arena-pow">${mine}</div>
        <div class="arena-vs">VS</div>
        <div class="arena-pow">${theirs}</div>
        <div class="arena-side end">
          <div class="arena-name">${esc(s.partner.pet.name)}</div>
          ${renderHead(s.partner.pet.look, 30)}
        </div>
      </div>
      <div class="arena-bar">
        <span style="width:${(mine / total) * 100}%"></span>
      </div>
    </div>`;
  }

  paint();
  const unsub = subscribe(paint);
  return () => unsub();
}
