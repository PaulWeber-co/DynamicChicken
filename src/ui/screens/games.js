/** Spiele — die Übersicht. */

import { esc } from '../../util/dom.js';
import { fx } from '../../util/feedback.js';
import { get, subscribe } from '../../state/store.js';
import { GAMES, gameSummary } from '../../games/index.js';
import { partnerOnline } from '../../sync/index.js';
import { openGame } from '../gameHost.js';
import { renderHead } from '../../pet/chicken.js';
import { petPower } from '../../state/model.js';
import { go } from '../shell.js';

const BADGES = {
  wait: '<span class="badge badge-wait">Du bist dran</span>',
  off: '<span class="badge badge-off">Wartet</span>'
};

export function render(root, ctx) {
  function paint() {
    const s = get();
    const online = partnerOnline();

    root.innerHTML = `
      <div class="row-between">
        <div>
          <div class="title-lg">Spiele</div>
          <div class="subtitle">${s.partner
            ? online ? `${esc(s.partner.name)} ist gerade da — live spielen geht.` : 'Spiel wann du willst, der Rest wartet.'
            : 'Im Solo-Modus spielt ein simulierter Mensch mit.'}</div>
        </div>
        <div class="coin-pill"><span>🌾</span><b>${s.me.coins}</b></div>
      </div>

      ${s.partner ? arena(s) : ''}

      <div class="section-label">Duelle</div>
      <div class="game-list">
        ${GAMES.map((g) => card(s, g, online)).join('')}
      </div>

      <div class="section-label">Wie funktioniert zeitversetzt?</div>
      <div class="card">
        <p class="muted tiny" style="margin:0">
          Jede Runde hat eine Nummer, aus der beide Geräte dieselbe Spielwelt errechnen —
          denselben Körnerregen, dieselben Karten. Du spielst, wann du kannst; wer zuletzt
          fertig wird, löst die Abrechnung aus. Beide Seiten kommen dabei völlig ohne
          Schiedsrichter zum selben Ergebnis.
        </p>
      </div>`;

    root.querySelectorAll('[data-game]').forEach((b) => {
      b.onclick = () => { fx('pop'); openGame(b.dataset.game); };
    });
    const link = root.querySelector('[data-goto-us]');
    if (link) link.onclick = () => go('us');
  }

  function arena(s) {
    const mine = petPower(s.me.pet);
    const theirs = petPower(s.partner.pet);
    const total = Math.max(1, mine + theirs);
    return `<div class="card arena">
      <div class="arena-row">
        <div class="arena-side">
          ${renderHead(s.me.pet.look, 44)}
          <div class="arena-name">${esc(s.me.pet.name)}</div>
          <div class="arena-pow">${mine}</div>
        </div>
        <div class="arena-vs">VS</div>
        <div class="arena-side">
          ${renderHead(s.partner.pet.look, 44)}
          <div class="arena-name">${esc(s.partner.pet.name)}</div>
          <div class="arena-pow">${theirs}</div>
        </div>
      </div>
      <div class="arena-bar">
        <span style="width:${(mine / total) * 100}%"></span>
      </div>
      <p class="tiny muted center" style="margin:10px 0 0">
        Form zählt: gut gepflegte Hühner starten mit mehr Selbstbewusstsein.
        ${mine >= theirs ? `${esc(s.me.pet.name)} hat gerade die Nase vorn.` : `${esc(s.partner.pet.name)} ist besser drauf — Zeit für Körner.`}
      </p>
    </div>`;
  }

  function card(s, g, online) {
    const sum = gameSummary(s, g);
    const live = g.meta.modes.includes('live') && online;
    return `<button class="card game-item tone-${g.meta.tone}" data-game="${g.meta.id}">
      <div class="game-item-e">${g.meta.emoji}</div>
      <div class="grow">
        <div class="game-item-t">${esc(g.meta.title)}</div>
        <div class="game-item-s">${esc(g.meta.tagline)}</div>
        <div class="game-item-m">
          ${sum.badge ? BADGES[sum.badge] : ''}
          ${live ? '<span class="badge badge-live"><span class="dot-live"></span>live möglich</span>' : ''}
          <span class="tiny muted">${esc(sum.text)}</span>
        </div>
      </div>
      <span class="li-chev">›</span>
    </button>`;
  }

  paint();
  const unsub = subscribe(paint);
  return () => unsub();
}
