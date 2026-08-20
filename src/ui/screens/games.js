/**
 * Spiele — die Übersicht.
 *
 * Zwei harte Vorgaben bestimmen den ganzen Aufbau:
 *
 *   1. Der Bildschirm scrollt nicht. Weder hoch noch zur Seite.
 *   2. Die Kacheln behalten ihre Größe. Immer.
 *
 * Die zweite Vorgabe ist die schwierigere. Ein Raster, das sich einfach den
 * übrigen Platz nimmt, schrumpft zu Briefmarken, sobald oben etwas dazukommt
 * — ein Benachrichtigungsbanner, eine zweite wartende Partie. Genau das ist
 * passiert.
 *
 * Die Lösung ist eine feste Zeilenzahl: Das Raster zeigt *immer* alle Spiele,
 * also immer gleich viele Zeilen. Was auf dich wartet, steht darüber in
 * genau einer Zeile — nicht in einer Liste, die mitwächst. Sind mehrere
 * offen, hängen die weiteren als kleine Knöpfe rechts daran. Damit gibt es
 * nur noch zwei Layout-Zustände, die sich um die Höhe dieser einen Zeile
 * unterscheiden, und die Kachelhöhe bleibt in beiden ruhig.
 */

import { esc } from '../../util/dom.js';
import { icon } from '../icons.js';
import { fx } from '../../util/feedback.js';
import { get, subscribe } from '../../state/store.js';
import { GAMES, gameSummary, todaysGames, istRotierend } from '../../games/index.js';
import { partnerOnline } from '../../sync/index.js';
import { openGame } from '../gameHost.js';
import { renderHead } from '../../pet/chicken.js';
import { petPower } from '../../state/model.js';

/** So viele Zusatzknöpfe passen neben die Wartezeile, ohne sie zu sprengen. */
const MAX_MORE = 3;

export function render(root, ctx) {
  /**
   * Woran hängt das Bild? Nur daran.
   *
   * `subscribe` feuert bei jeder Zustandsänderung — auch bei Dingen, die
   * hier gar nicht vorkommen: Stimmungen, Pflege, und alle zwei Sekunden
   * ein Live-Zwischenstand, während drüben gespielt wird. Ohne diesen
   * Vergleich würde die Seite dabei jedes Mal komplett neu gebaut, mitsamt
   * abreißender Antipp-Animation.
   */
  let letztes = '';

  function paint() {
    const s = get();
    const online = partnerOnline();

    // Im Raster steht die heutige Auswahl; gewartet wird über alle Spiele,
    // sonst verschwände eine offene Partie mitsamt ihrer Wartezeile.
    const heute = todaysGames(s).map((g) => ({ g, sum: gameSummary(s, g) }));
    const waiting = GAMES.map((g) => ({ g, sum: gameSummary(s, g) }))
      .filter((x) => x.sum.badge === 'wait');

    const jetzt = JSON.stringify([
      s.me.coins, online, s.partner?.name || null,
      s.me.pet.name, s.partner?.pet?.name || null,
      s.partner ? [petPower(s.me.pet), petPower(s.partner.pet)] : null,
      heute.map(({ g, sum }) => [g.meta.id, sum.badge, sum.text])
    ]);
    if (jetzt === letztes) return;
    letztes = jetzt;

    root.innerHTML = `
      <div class="row-between games-head">
        <div class="grow">
          <div class="title-lg">Spiele</div>
          <div class="subtitle">${s.partner
            ? online ? `${esc(s.partner.name)} ist gerade da — live spielen geht.` : 'Spiel wann du willst, der Rest wartet.'
            : 'Im Solo-Modus spielt ein simulierter Mensch mit.'}</div>
        </div>
        <div class="coin-pill">${icon('grain', { size: 20 })}<b>${s.me.coins}</b></div>
      </div>

      ${nowRow(waiting, online)}

      <div class="section-label row-between">
        <span>Heute im Nest</span>
        <span class="label-hint">${icon('shuffle', { size: 13 })} wechselt täglich</span>
      </div>
      <div class="game-grid">
        ${heute.map(({ g, sum }) => tile(g, sum, online)).join('')}
      </div>

      ${s.partner ? arena(s) : ''}`;

    root.querySelectorAll('[data-game]').forEach((b) => {
      b.onclick = () => { fx('pop'); openGame(b.dataset.game); };
    });
  }

  /**
   * Eine Zeile, feste Höhe: das dringendste Spiel groß, alle weiteren als
   * Knöpfe daneben. Die Aufgabe steht vor dem Spielnamen — „Du gibst den
   * Hinweis“ sagt mehr darüber, was zu tun ist, als „Farbfunk“.
   *
   * Die Zeile steht auch da, wenn nichts offen ist. Sonst spränge das
   * Raster jedes Mal um ihre Höhe, sobald eine Partie hereinkommt — und
   * genau diese Sprünge sollen weg.
   */
  function nowRow(waiting, online) {
    if (!waiting.length) {
      return `
        <div class="section-label">Du bist dran</div>
        <div class="now-row">
          <div class="now-main now-idle">
            <span class="now-e">${icon('check', { size: 22 })}</span>
            <span class="grow">
              <span class="now-t">Nichts offen</span>
              <span class="now-s">Fang unten eine Partie an</span>
            </span>
          </div>
        </div>`;
    }

    const [first, ...rest] = waiting;
    const live = first.g.meta.modes.includes('live') && online;
    // Wie viele davon wirklich zu sehen sind, entscheidet die Breite im
    // Stylesheet. Die Gesamtzahl steht ohnehin in der Überschrift.
    const more = rest.slice(0, MAX_MORE);

    return `
      <div class="section-label">
        Du bist dran${waiting.length > 1 ? ` <span class="label-count">${waiting.length}</span>` : ''}
      </div>
      <div class="now-row">
        <button class="now-main tone-${first.g.meta.tone}" data-game="${first.g.meta.id}">
          <span class="now-e">${icon(first.g.meta.icon, { size: 26 })}</span>
          <span class="grow">
            <span class="now-t">${esc(first.sum.text)}</span>
            <span class="now-s">${esc(first.g.meta.title)}</span>
          </span>
          ${live ? '<span class="dot-live"></span>' : ''}
          <span class="li-chev">${icon('chevron', { size: 15 })}</span>
        </button>
        ${more.map(({ g }) => `<button class="now-more tone-${g.meta.tone}" data-game="${g.meta.id}"
          title="${esc(g.meta.title)}" aria-label="${esc(g.meta.title)} — du bist dran">
          ${icon(g.meta.icon, { size: 21 })}
        </button>`).join('')}
      </div>`;
  }

  /** Kachel — zwei nebeneinander, alle gleichzeitig sichtbar. */
  function tile(g, sum, online) {
    const live = g.meta.modes.includes('live') && online;
    return `<button class="game-tile tone-${g.meta.tone} ${sum.badge === 'wait' ? 'is-wait' : ''}${istRotierend(g.meta.id) ? ' is-heute' : ''}"
      data-game="${g.meta.id}">
      <span class="game-tile-e">${icon(g.meta.icon, { size: 24 })}</span>
      <span class="grow">
        <span class="game-tile-t">${esc(g.meta.title)}</span>
        <span class="game-tile-s">${esc(sum.text)}</span>
      </span>
      ${sum.badge === 'off' ? '<i class="game-dot off" title="wartet auf Antwort"></i>' : ''}
      ${sum.badge !== 'wait' && live ? '<i class="game-dot live" title="live möglich"></i>' : ''}
    </button>`;
  }

  /* Kräftevergleich als schmaler Streifen. Er ist Beiwerk, kein Weg zu
     einem Spiel — deshalb steht er unter dem Raster und verschwindet als
     Erstes, wenn es eng wird. */
  function arena(s) {
    const mine = petPower(s.me.pet);
    const theirs = petPower(s.partner.pet);
    const total = Math.max(1, mine + theirs);
    return `<div class="card arena">
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
