/**
 * Gefühle, Aktivitäten und kleine Zärtlichkeiten.
 * Alles, was ihr euch schicken könnt, ohne tippen zu müssen.
 */

export const MOODS = [
  { key: 'gluecklich', emoji: '🥰', label: 'Glücklich',   pet: 'love',    color: 'var(--love-soft)',   line: 'strahlt bis in die Federspitzen' },
  { key: 'verliebt',   emoji: '💗', label: 'Verliebt',    pet: 'love',    color: 'var(--love-soft)',   line: 'hat Herzchen in den Augen' },
  { key: 'ruhig',      emoji: '🍵', label: 'Ruhig',       pet: 'happy',   color: 'var(--calm-soft)',   line: 'sitzt gemütlich im Nest' },
  { key: 'muede',      emoji: '🥱', label: 'Müde',        pet: 'sleepy',  color: 'var(--calm-soft)',   line: 'gähnt herzhaft' },
  { key: 'gestresst',  emoji: '🌪️', label: 'Gestresst',   pet: 'dizzy',   color: 'var(--accent-soft)', line: 'flattert etwas hektisch' },
  { key: 'traurig',    emoji: '🥺', label: 'Traurig',     pet: 'sad',     color: 'var(--calm-soft)',   line: 'lässt die Flügel hängen' },
  { key: 'vermisse',   emoji: '🫂', label: 'Vermisse dich',pet: 'sad',    color: 'var(--love-soft)',   line: 'schaut aus dem Fenster' },
  { key: 'aufgeregt',  emoji: '🎉', label: 'Aufgeregt',   pet: 'excited', color: 'var(--grow-soft)',   line: 'hüpft im Kreis' },
  { key: 'stolz',      emoji: '😌', label: 'Stolz',       pet: 'proud',   color: 'var(--grow-soft)',   line: 'plustert sich auf' },
  { key: 'hungrig',    emoji: '🍜', label: 'Hungrig',     pet: 'hungry',  color: 'var(--accent-soft)', line: 'späht nach Körnern' },
  { key: 'krank',      emoji: '🤒', label: 'Kränklich',   pet: 'sad',     color: 'var(--calm-soft)',   line: 'braucht Hühnersuppe' },
  { key: 'albern',     emoji: '🤪', label: 'Albern',      pet: 'excited', color: 'var(--grow-soft)',   line: 'macht Quatsch' }
];

export const ACTIVITIES = [
  { key: 'arbeit',   emoji: '💻', label: 'Arbeiten' },
  { key: 'uni',      emoji: '📚', label: 'Lernen' },
  { key: 'essen',    emoji: '🍝', label: 'Essen' },
  { key: 'sport',    emoji: '🏃', label: 'Sport' },
  { key: 'unterwegs',emoji: '🚃', label: 'Unterwegs' },
  { key: 'serie',    emoji: '📺', label: 'Serie' },
  { key: 'draussen', emoji: '🌤️', label: 'Draußen' },
  { key: 'chillen',  emoji: '🛋️', label: 'Chillen' },
  { key: 'schlafen', emoji: '😴', label: 'Schlafen' },
  { key: 'freunde',  emoji: '🍻', label: 'Freunde' },
  { key: 'kochen',   emoji: '🍳', label: 'Kochen' },
  { key: 'duschen',  emoji: '🚿', label: 'Duschen' }
];

/** Kleine Gesten — das Herzstück der Fernbeziehung. */
export const NUDGES = [
  { key: 'knuddel',   emoji: '🫂', label: 'Knuddeln',       text: 'schickt eine feste Umarmung',  self: 'Umarmung geschickt',        bond: 3 },
  { key: 'kuss',      emoji: '😘', label: 'Kuss',           text: 'schickt einen Kuss',           self: 'Kuss geschickt',            bond: 3 },
  { key: 'denkan',    emoji: '💭', label: 'Denk an dich',   text: 'denkt gerade an dich',         self: '„Denk an dich" geschickt',  bond: 2 },
  { key: 'stolz',     emoji: '🏅', label: 'Bin stolz',      text: 'ist stolz auf dich',           self: '„Bin stolz auf dich"',      bond: 4 },
  { key: 'kaffee',    emoji: '☕️', label: 'Kaffee',         text: 'spendiert dir einen Kaffee',   self: 'Kaffee spendiert',          bond: 2 },
  { key: 'gutenacht', emoji: '🌙', label: 'Gute Nacht',     text: 'wünscht dir eine gute Nacht',  self: 'Gute Nacht gewünscht',      bond: 3 },
  { key: 'guten',     emoji: '🌞', label: 'Guten Morgen',   text: 'wünscht dir einen guten Morgen', self: 'Guten Morgen gewünscht',  bond: 3 },
  { key: 'daumen',    emoji: '🍀', label: 'Daumen drücken', text: 'drückt dir die Daumen',        self: 'Daumen gedrückt',           bond: 2 }
];

/** Fragen des Tages — beide antworten, dann öffnet sich beides gleichzeitig. */
export const DAILY_QUESTIONS = [
  'Was war heute der schönste Moment?',
  'Woran hast du heute zuerst gedacht, als du aufgewacht bist?',
  'Was möchtest du machen, wenn wir uns das nächste Mal sehen?',
  'Welches Lied beschreibt deinen Tag?',
  'Was hat dich heute zum Lachen gebracht?',
  'Wovor hast du gerade ein bisschen Angst?',
  'Was ist etwas Kleines, das ich für dich tun könnte?',
  'Was hast du heute gegessen — ehrlich?',
  'Welche Erinnerung an uns kam dir zuletzt in den Sinn?',
  'Was brauchst du diese Woche am meisten?',
  'Wenn du morgen einen Tag freihättest: was machen wir?',
  'Was magst du gerade an dir selbst?',
  'Welcher Ort soll uns irgendwann gehören?',
  'Was war heute anstrengend?',
  'Worauf freust du dich als Nächstes?',
  'Was würdest du mir sagen, wenn ich jetzt neben dir säße?',
  'Welche Kleinigkeit von mir vermisst du am meisten?',
  'Wie geht es dir wirklich — nicht die Kurzversion?'
];

export const moodByKey = (k) => MOODS.find((m) => m.key === k) || null;
export const activityByKey = (k) => ACTIVITIES.find((a) => a.key === k) || null;
export const nudgeByKey = (k) => NUDGES.find((n) => n.key === k) || null;

/**
 * Welche Miene macht das eigene Huhn gerade?
 * Bedürfnisse schlagen die selbst gewählte Stimmung — ein hungriges Huhn
 * grinst nicht.
 */
export function petMood(pet, { asleep = false, moodKey = null } = {}) {
  if (asleep) return 'asleep';
  const s = pet.stats;
  if (s.full < 22) return 'hungry';
  if (s.energy < 18) return 'sleepy';
  if (s.clean < 22) return 'dirty';
  if (s.joy < 22) return 'sad';
  const m = moodByKey(moodKey);
  if (m) return m.pet;
  if (s.joy > 78 && s.full > 60) return 'happy';
  return 'happy';
}

/** Frage des Tages, stabil pro Datum und Paar. */
export function questionForDay(dateKey, salt = 0) {
  let h = salt >>> 0;
  for (let i = 0; i < dateKey.length; i++) h = (h * 31 + dateKey.charCodeAt(i)) >>> 0;
  return DAILY_QUESTIONS[h % DAILY_QUESTIONS.length];
}
