/**
 * Gefühle, Aktivitäten und kleine Zärtlichkeiten.
 * Alles, was ihr euch schicken könnt, ohne tippen zu müssen.
 */

export const MOODS = [
  { key: 'gluecklich', icon: 'moodHappy',    label: 'Glücklich',     pet: 'love',    tone: 'love',   line: 'strahlt bis in die Federspitzen' },
  { key: 'verliebt',   icon: 'moodLove',     label: 'Verliebt',      pet: 'love',    tone: 'love',   line: 'hat Herzchen in den Augen' },
  { key: 'ruhig',      icon: 'moodCalm',     label: 'Ruhig',         pet: 'happy',   tone: 'calm',   line: 'sitzt gemütlich im Nest' },
  { key: 'muede',      icon: 'moodTired',    label: 'Müde',          pet: 'sleepy',  tone: 'calm',   line: 'gähnt herzhaft' },
  { key: 'gestresst',  icon: 'moodStressed', label: 'Gestresst',     pet: 'dizzy',   tone: 'warm',   line: 'flattert etwas hektisch' },
  { key: 'traurig',    icon: 'moodSad',      label: 'Traurig',       pet: 'sad',     tone: 'calm',   line: 'lässt die Flügel hängen' },
  { key: 'vermisse',   icon: 'moodMissing',  label: 'Vermisse dich', pet: 'sad',     tone: 'love',   line: 'schaut aus dem Fenster' },
  { key: 'aufgeregt',  icon: 'moodExcited',  label: 'Aufgeregt',     pet: 'excited', tone: 'warm',   line: 'hüpft im Kreis' },
  { key: 'stolz',      icon: 'moodProud',    label: 'Stolz',         pet: 'proud',   tone: 'warm',   line: 'plustert sich auf' },
  { key: 'hungrig',    icon: 'moodHungry',   label: 'Hungrig',       pet: 'hungry',  tone: 'warm',   line: 'späht nach Körnern' },
  { key: 'krank',      icon: 'moodSick',     label: 'Kränklich',     pet: 'sad',     tone: 'calm',   line: 'braucht Hühnersuppe' },
  { key: 'albern',     icon: 'moodSilly',    label: 'Albern',        pet: 'excited', tone: 'warm',   line: 'macht Quatsch' }
];

export const ACTIVITIES = [
  { key: 'arbeit',    icon: 'actWork',    label: 'Arbeiten' },
  { key: 'uni',       icon: 'actStudy',   label: 'Lernen' },
  { key: 'essen',     icon: 'actEat',     label: 'Essen' },
  { key: 'sport',     icon: 'actSport',   label: 'Sport' },
  { key: 'unterwegs', icon: 'actTravel',  label: 'Unterwegs' },
  { key: 'serie',     icon: 'actShow',    label: 'Serie' },
  { key: 'draussen',  icon: 'actOutside', label: 'Draußen' },
  { key: 'chillen',   icon: 'actChill',   label: 'Chillen' },
  { key: 'schlafen',  icon: 'actSleep',   label: 'Schlafen' },
  { key: 'freunde',   icon: 'actFriends', label: 'Freunde' },
  { key: 'kochen',    icon: 'actCook',    label: 'Kochen' },
  { key: 'duschen',   icon: 'actShower',  label: 'Duschen' }
];

/** Kleine Gesten — das Herzstück der Fernbeziehung. */
export const NUDGES = [
  { key: 'knuddel',   icon: 'nudgeHug',     label: 'Knuddeln',       text: 'schickt eine feste Umarmung',    self: 'Umarmung geschickt',       bond: 3, act: 'hop' },
  { key: 'kuss',      icon: 'nudgeKiss',    label: 'Kuss',           text: 'schickt einen Kuss',             self: 'Kuss geschickt',           bond: 3, act: 'nod' },
  { key: 'denkan',    icon: 'nudgeThink',   label: 'Denk an dich',   text: 'denkt gerade an dich',           self: '„Denk an dich" geschickt', bond: 2, act: 'think' },
  { key: 'stolz',     icon: 'nudgeProud',   label: 'Bin stolz',      text: 'ist stolz auf dich',             self: '„Bin stolz auf dich"',     bond: 4, act: 'celebrate' },
  { key: 'kaffee',    icon: 'nudgeCoffee',  label: 'Kaffee',         text: 'spendiert dir einen Kaffee',     self: 'Kaffee spendiert',         bond: 2, act: 'peck' },
  { key: 'gutenacht', icon: 'nudgeNight',   label: 'Gute Nacht',     text: 'wünscht dir eine gute Nacht',    self: 'Gute Nacht gewünscht',     bond: 3, act: 'nod' },
  { key: 'guten',     icon: 'nudgeMorning', label: 'Guten Morgen',   text: 'wünscht dir einen guten Morgen', self: 'Guten Morgen gewünscht',   bond: 3, act: 'stretch' },
  { key: 'daumen',    icon: 'nudgeLuck',    label: 'Daumen drücken', text: 'drückt dir die Daumen',          self: 'Daumen gedrückt',          bond: 2, act: 'wave' }
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
