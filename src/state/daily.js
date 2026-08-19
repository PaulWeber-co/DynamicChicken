/**
 * Die Fragen des Tages.
 *
 * Pro Tag gibt es zwei: erst die normale, danach die spicy. Beide wollen
 * beantwortet werden, und jede öffnet sich für sich, sobald *beide* Seiten
 * geantwortet haben. Die zweite ist gesperrt, bis die erste steht — sonst
 * überspringt man die ruhige Frage jeden Abend und das Ganze verkommt zu
 * einer Rubrik.
 *
 * Die spicy Frage gibt es nur, wenn der Schalter unter *Mehr* an ist. Ist er
 * aus, existiert der zweite Platz gar nicht — auch dann nicht, wenn drüben
 * jemand mit eingeschaltetem Schalter antwortet.
 *
 * Der Zustand liegt unter `state.daily`:
 *
 *   { day: 'YYYY-MM-DD', slots: [ { id, spicy, q, mine, theirs, revealedAt } ] }
 *
 * Beide Geräte errechnen dieselben Fragen aus Datum und Paarcode; über die
 * Leitung geht nur die Antwort plus die Kennung des Platzes.
 */

import { questionForDay, dayIndex } from '../pet/moods.js';
import { dayKey } from '../util/time.js';

/** Reihenfolge und Aussehen der beiden Plätze. */
export const SLOTS = [
  { id: 'normal', spicy: false, label: 'Frage des Tages', icon: 'mailHeart' },
  { id: 'spicy',  spicy: true,  label: 'Spicy Frage',     icon: 'flame' }
];

export const slotById = (id) => SLOTS.find((s) => s.id === id) || SLOTS[0];

/** Kennung eines Platzes aus einem alten Ereignis ohne `slot`-Feld. */
export const slotIdFor = (d) => (d?.slot === 'spicy' || (!d?.slot && d?.spicy) ? 'spicy' : 'normal');

/** Aus dem Paarcode ein Startwert, damit nicht alle Paare dieselbe Reihenfolge haben. */
function saltOf(state) {
  const a = state?.me?.code || 'SOLO';
  const b = state?.partner?.code || 'SOLO';
  const k = [a, b].sort().join('~');
  let h = 0;
  for (let i = 0; i < k.length; i++) h = (h * 31 + k.charCodeAt(i)) >>> 0;
  return h;
}

const leererPlatz = (def, day, salt) => ({
  id: def.id,
  spicy: def.spicy,
  q: questionForDay(day, salt, def.spicy),
  mine: null,
  theirs: null,
  revealedAt: null
});

const benutzt = (s) => !!(s && (s.mine || s.theirs));

/**
 * Legt `state.daily` für heute an, räumt Altlasten auf und gibt es zurück.
 *
 * Wird von der Oberfläche *und* vom Ereignis-Eingang aufgerufen, damit beide
 * Seiten dieselbe Form vorfinden — egal, wer zuerst dran ist.
 */
export function ensureDaily(state, day = dayKey()) {
  const salt = saltOf(state);
  let d = state.daily;

  // Aus der Zeit vor den zwei Plätzen: eine einzelne Frage übernehmen.
  if (d && !Array.isArray(d.slots) && d.q) {
    d = state.daily = {
      day: d.day,
      slots: [{
        id: d.spicy ? 'spicy' : 'normal',
        spicy: !!d.spicy,
        q: d.q,
        mine: d.mine || null,
        theirs: d.theirs || null,
        revealedAt: d.revealedAt || null
      }]
    };
  }

  if (!d || d.day !== day || !Array.isArray(d.slots)) {
    d = state.daily = { day, slots: [] };
  }

  const willSpicy = !!state.settings?.spicy;
  const vorhanden = new Map(d.slots.filter((s) => s && s.id).map((s) => [s.id, s]));

  d.slots = SLOTS
    .filter((def) => !def.spicy || willSpicy || benutzt(vorhanden.get(def.id)))
    .map((def) => {
      const alt = vorhanden.get(def.id);
      if (!alt) return leererPlatz(def, day, salt);
      alt.spicy = def.spicy;
      if (!alt.q) alt.q = questionForDay(day, salt, def.spicy);
      return alt;
    });

  return d;
}

/** Alle Plätze von heute, in der Reihenfolge, in der sie beantwortet werden. */
export const dailySlots = (state, day = dayKey()) => ensureDaily(state, day).slots;

/**
 * Ist dieser Platz schon dran?
 *
 * Der erste immer. Jeder weitere erst, wenn alle davor meine Antwort haben.
 */
export function slotLocked(slots, i) {
  for (let k = 0; k < i; k++) if (!slots[k].mine) return true;
  return false;
}

/** Der Platz, der als Nächstes von mir eine Antwort will — oder `null`. */
export function nextSlot(state, day = dayKey()) {
  const slots = dailySlots(state, day);
  const i = slots.findIndex((s) => !s.mine);
  return i < 0 || slotLocked(slots, i) ? null : slots[i];
}

/** Einen Platz suchen, auch wenn es ihn (noch) nicht gibt. */
export function slotOf(state, id, day = dayKey()) {
  return dailySlots(state, day).find((s) => s.id === id) || null;
}

/** Wie viele Fragen warten noch auf mich? Für den Punkt am Reiter. */
export function dailyPending(state) {
  if (!state?.daily || !Array.isArray(state.daily.slots)) {
    return state?.daily?.theirs && !state?.daily?.mine ? 1 : 0;
  }
  if (state.daily.day !== dayKey()) return 0;
  return state.daily.slots.filter((s) => s.theirs && !s.mine).length;
}

/** Beide Fragen des Tages von meiner Seite erledigt? */
export function dailyDone(state, day = dayKey()) {
  const slots = dailySlots(state, day);
  return slots.length > 0 && slots.every((s) => s.mine);
}

/**
 * Belohnung fürs gemeinsame Öffnen eines Platzes.
 *
 * Die erste Frage bringt den vollen Satz, jede weitere die Hälfte — sonst
 * verdoppelt sich das Tageseinkommen einfach nur, weil es jetzt zwei Karten
 * gibt.
 */
export const slotReward = (voll, id) => (id === 'normal' ? voll : Math.round(voll / 2));

/** Wie viele Tage laufen die Kataloge schon? Nur fürs Anzeigen gedacht. */
export const dailyRunLength = (day = dayKey()) => dayIndex(day);
