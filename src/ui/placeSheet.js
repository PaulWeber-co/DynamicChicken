/**
 * Ortssuche — gebraucht in „Wir“ und in den Einstellungen, deshalb hier.
 *
 * Gesucht wird bei Open-Meteo, gespeichert wird nur die gefundene Stadt mit
 * einer auf zwei Nachkommastellen gerundeten Position. Wer das Suchfeld
 * leer lässt oder den Ort entfernt, teilt gar nichts.
 */

import { esc } from '../util/dom.js';
import { fx } from '../util/feedback.js';
import { get } from '../state/store.js';
import { icon } from './icons.js';
import { sheet, closeSheet } from './sheet.js';
import { toast } from './toast.js';
import { setPlace } from './actions.js';
import { geocode } from '../util/weather.js';

/**
 * @param {(place:object|null)=>void} [onDone] wird nach dem Speichern gerufen
 */
export function openPlaceSheet(onDone) {
  const st = get();

  sheet({
    title: 'Dein Ort',
    body: `
      <p class="tiny muted" style="margin:0 0 12px">
        Nur für das Wetter, das dein Mensch sieht. Gespeichert wird die Stadt und eine
        auf etwa einen Kilometer gerundete Position — keine Adresse, kein Verlauf.
      </p>
      <input class="input" data-q placeholder="Stadt suchen …" autocomplete="off"
        value="${esc(st.me.place?.name || '')}">
      <div class="place-results" data-res></div>
      ${st.me.place ? `<button class="btn btn-ghost btn-block" data-clear style="margin-top:10px">Ort entfernen</button>` : ''}`,

    onMount(body) {
      const q = body.querySelector('[data-q]');
      const res = body.querySelector('[data-res]');
      let timer = 0, token = 0;
      q.focus();
      q.select();

      const search = async () => {
        const term = q.value.trim();
        if (term.length < 2) { res.innerHTML = ''; return; }
        // Späte Antworten einer alten Suche dürfen die neue nicht überschreiben
        const mine = ++token;
        res.innerHTML = `<div class="place-hint">Suche …</div>`;
        try {
          const hits = await geocode(term);
          if (mine !== token) return;
          res.innerHTML = hits.length
            ? hits.map((h) => `<button class="place-hit" data-pick='${esc(JSON.stringify(h))}'>
                ${icon('pin', { size: 16 })}
                <span class="grow"><b>${esc(h.name)}</b>
                <small>${esc([h.region, h.country].filter(Boolean).join(', '))}</small></span>
              </button>`).join('')
            : `<div class="place-hint">Nichts gefunden. Vielleicht anders geschrieben?</div>`;

          res.querySelectorAll('[data-pick]').forEach((b) => {
            b.onclick = () => {
              const place = JSON.parse(b.dataset.pick);
              setPlace(place);
              fx('pop');
              toast(`Ort gesetzt: ${place.name}`, 'pin');
              closeSheet();
              onDone?.(place);
            };
          });
        } catch {
          if (mine !== token) return;
          res.innerHTML = `<div class="place-hint">Die Ortssuche ist gerade nicht erreichbar.</div>`;
        }
      };

      q.oninput = () => { clearTimeout(timer); timer = setTimeout(search, 320); };
      q.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); clearTimeout(timer); search(); } };
      if (q.value.trim().length >= 2) search();

      const clear = body.querySelector('[data-clear]');
      if (clear) clear.onclick = () => {
        setPlace(null);
        closeSheet();
        onDone?.(null);
      };
    }
  });
}
