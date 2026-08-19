/**
 * Gefühle, Aktivitäten und kleine Zärtlichkeiten.
 * Alles, was ihr euch schicken könnt, ohne tippen zu müssen.
 */

import { cycled } from '../util/rng.js';

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
  { key: 'hungrig',    icon: 'moodHungry',   label: 'Hungrig',       pet: 'hungry',  tone: 'warm',   line: 'hat auf irgendwas Hunger' },
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
  { key: 'denkan',    icon: 'nudgeThink',   label: 'Denk an dich',   text: 'denkt gerade an dich',           self: '„Denk an dich“ geschickt', bond: 2, act: 'think' },
  { key: 'stolz',     icon: 'nudgeProud',   label: 'Bin stolz',      text: 'ist stolz auf dich',             self: '„Bin stolz auf dich“',     bond: 4, act: 'celebrate' },
  { key: 'kaffee',    icon: 'nudgeCoffee',  label: 'Kaffee',         text: 'spendiert dir einen Kaffee',     self: 'Kaffee spendiert',         bond: 2, act: 'peck' },
  { key: 'gutenacht', icon: 'nudgeNight',   label: 'Gute Nacht',     text: 'wünscht dir eine gute Nacht',    self: 'Gute Nacht gewünscht',     bond: 3, act: 'nod' },
  { key: 'guten',     icon: 'nudgeMorning', label: 'Guten Morgen',   text: 'wünscht dir einen guten Morgen', self: 'Guten Morgen gewünscht',   bond: 3, act: 'stretch' },
  { key: 'daumen',    icon: 'nudgeLuck',    label: 'Daumen drücken', text: 'drückt dir die Daumen',          self: 'Daumen gedrückt',          bond: 2, act: 'wave' }
];

/**
 * Fragen des Tages — beide antworten, dann öffnet sich beides gleichzeitig.
 *
 * Der Vorrat ist absichtlich groß: Bei einer Frage pro Tag und Ziehen ohne
 * Zurücklegen (siehe `questionForDay`) dauert eine volle Runde weit über ein
 * Jahr. Vorher wiederholt sich nichts.
 */
export const DAILY_QUESTIONS = [
  /* Der Tag */
  'Was war heute der schönste Moment?',
  'Woran hast du heute zuerst gedacht, als du aufgewacht bist?',
  'Was war heute anstrengend?',
  'Was hat dich heute zum Lachen gebracht?',
  'Was hat dich heute geärgert, obwohl es eigentlich egal war?',
  'Welcher Mensch ist dir heute begegnet, der dir im Kopf geblieben ist?',
  'Was hast du heute gegessen — ehrlich?',
  'Welches Lied beschreibt deinen Tag?',
  'Was hättest du heute gern anders gemacht?',
  'Welcher Satz ist dir heute hängen geblieben?',
  'Was hast du heute zum ersten Mal gemacht?',
  'Wie viel von heute war deine Entscheidung?',
  'Was war heute laut, was war heute still?',
  'Welche Farbe hatte dein Tag?',
  'Wann hast du heute richtig durchgeatmet?',
  'Was hast du heute aufgeschoben?',
  'Wofür warst du heute dankbar, ohne es zu sagen?',
  'Was ist heute besser gelaufen, als du gedacht hättest?',

  /* Du */
  'Wie geht es dir wirklich — nicht die Kurzversion?',
  'Was magst du gerade an dir selbst?',
  'Wovor hast du gerade ein bisschen Angst?',
  'Was brauchst du diese Woche am meisten?',
  'Worauf bist du gerade heimlich stolz?',
  'Was machst du gerade nur, weil man es angeblich so macht?',
  'Was würdest du deinem Ich von vor fünf Jahren sagen?',
  'Welche Gewohnheit hättest du gern?',
  'Welche Gewohnheit wärst du gern los?',
  'Wann fühlst du dich am meisten wie du selbst?',
  'Was macht dich gerade unruhig?',
  'Was hast du zuletzt gelernt, das dich überrascht hat?',
  'Woran erkennst du, dass es dir gut geht?',
  'Was tust du, wenn niemand zuschaut?',
  'Welche Entscheidung schiebst du gerade vor dir her?',
  'Was ist gerade dein kleiner Trost?',
  'Wovon hättest du gern mehr in deinem Leben?',
  'Was würdest du tun, wenn Scheitern egal wäre?',
  'Welchen Teil von dir zeigst du selten?',
  'Was macht dir gerade am meisten Freude, ganz ohne Grund?',

  /* Wir */
  'Was möchtest du machen, wenn wir uns das nächste Mal sehen?',
  'Welche Erinnerung an uns kam dir zuletzt in den Sinn?',
  'Welche Kleinigkeit von mir vermisst du am meisten?',
  'Was würdest du mir sagen, wenn ich jetzt neben dir säße?',
  'Wann hast du dich zuletzt von mir richtig verstanden gefühlt?',
  'Was mache ich, ohne es zu merken, das du magst?',
  'Was war der Moment, in dem du wusstest, dass das hier etwas wird?',
  'Welchen Streit von uns findest du heute lustig?',
  'Was tue ich, das dir das Leben leichter macht?',
  'Woran merkst du, dass ich an dich denke?',
  'Was war unser bisher bester ganz normaler Tag?',
  'Welchen Spitznamen hättest du gern von mir?',
  'Was möchtest du unbedingt einmal gemeinsam gelernt haben?',
  'Was fehlt dir an uns gerade am meisten?',
  'Wofür würdest du mir gern öfter danke sagen?',
  'Welche Angewohnheit von mir nervt dich ein bisschen?',
  'Wann hast du zuletzt gedacht: das erzähl ich ihm oder ihr sofort?',
  'Was hat sich zwischen uns im letzten halben Jahr verändert?',
  'Welches Foto von uns hast du am liebsten?',
  'Worüber lachen wir immer wieder, obwohl es niemand versteht?',
  'Was würdest du an unserem Alltag ändern, wenn wir zusammen wohnen würden?',
  'Was war das Netteste, das ich je zu dir gesagt habe?',
  'Wann hast du dich zuletzt einsam gefühlt trotz uns?',
  'Wie sieht ein perfekter Sonntag mit mir aus?',

  /* Entfernung */
  'Was ist das Schwerste an der Entfernung — heute?',
  'Was ist überraschend gut daran, weit weg zu sein?',
  'Welche Tageszeit ist ohne mich am schwersten?',
  'Woran denkst du, wenn du abends das Licht ausmachst?',
  'Was würdest du gerade tun, wenn ich in zehn Minuten vor der Tür stünde?',
  'Was möchtest du mir zeigen, das man nicht fotografieren kann?',
  'Welchen Ort bei dir soll ich unbedingt kennenlernen?',
  'Was riecht bei dir nach Zuhause?',
  'Welcher Weg bei dir ist dein liebster?',
  'Was hast du diese Woche gesehen, das dich an mich erinnert hat?',
  'Wie erklärst du anderen, was wir haben?',
  'Was soll ich mitbringen, wenn ich das nächste Mal komme?',

  /* Zukunft */
  'Wenn du morgen einen Tag freihättest: was machen wir?',
  'Welcher Ort soll uns irgendwann gehören?',
  'Worauf freust du dich als Nächstes?',
  'Wo sehen wir uns in drei Jahren an einem Dienstagabend?',
  'Welches Land wollen wir zuerst zusammen sehen?',
  'Was soll in unserer ersten gemeinsamen Wohnung auf keinen Fall fehlen?',
  'Welche Tradition sollen wir uns ausdenken?',
  'Was möchtest du erreicht haben, bevor wir zusammenziehen?',
  'Welches Haustier hätten wir und wie hieße es?',
  'Was soll für immer so bleiben, wie es ist?',
  'Wovon träumst du, ohne es je laut gesagt zu haben?',
  'Welche Reise machen wir, wenn Geld egal wäre?',
  'Was möchtest du, dass wir in zehn Jahren immer noch tun?',
  'Was ist dein nächstes kleines Ziel — und wie helfe ich?',

  /* Leicht und albern */
  'Was ist etwas Kleines, das ich für dich tun könnte?',
  'Welche Serie sollen wir gleichzeitig anfangen?',
  'Was ist deine ungewöhnlichste Meinung zum Thema Essen?',
  'Welche Superkraft hättest du im Alltag am liebsten?',
  'Was ist die peinlichste Sache, die dir diese Woche passiert ist?',
  'Welches Kompliment würdest du dir selbst machen?',
  'Welche drei Dinge stehen gerade auf deinem Nachttisch?',
  'Was war das Letzte, das du gegoogelt hast?',
  'Wenn du unser Leben verfilmen müsstest: welcher Titel?',
  'Welches Wort benutzt du viel zu oft?',
  'Was würdest du mit einem Tag ohne Verpflichtungen machen?',
  'Welche Kleinigkeit hebt dir sofort die Laune?',
  'Wenn du ein Café aufmachen müsstest: wie hieße es?',
  'Welchen Rat gibst du gern, hältst dich aber selbst nie dran?',
  'Was ist dein liebstes unnötiges Wissen?',
  'Welchen Gegenstand in deiner Wohnung würdest du zuerst retten?',
  'Was ist die beste Entscheidung, die du dieses Jahr getroffen hast?',
  'Wenn wir tauschen könnten: welchen Tag von mir nimmst du?',
  'Was war das schönste Geschenk, das du je bekommen hast?',
  'Welchen Menschen aus deiner Vergangenheit würdest du gern wieder treffen?',
  'Was sagst du immer, wenn du nicht weißt, was du sagen sollst?',
  'Welche Jahreszeit passt am besten zu dir?'
];

export const moodByKey = (k) => MOODS.find((m) => m.key === k) || null;
export const activityByKey = (k) => ACTIVITIES.find((a) => a.key === k) || null;
export const nudgeByKey = (k) => NUDGES.find((n) => n.key === k) || null;

/**
 * Welche Miene macht das eigene Huhn gerade?
 * Bedürfnisse schlagen die selbst gewählte Stimmung — ein müdes Huhn
 * grinst nicht.
 */
export function petMood(pet, { asleep = false, moodKey = null } = {}) {
  if (asleep) return 'asleep';
  const s = pet.stats;
  if (s.energy < 18) return 'sleepy';
  if (s.clean < 22) return 'dirty';
  if (s.joy < 22) return 'sad';
  const m = moodByKey(moodKey);
  if (m) return m.pet;
  return 'happy';
}

/**
 * Der zweite Katalog — nur wenn beide ihn eingeschaltet haben.
 *
 * Absichtlich getrennt und nicht untergemischt: Diese Fragen sollen nicht
 * unerwartet auftauchen, wenn jemand nebenan mitliest oder gerade nicht in
 * der Stimmung ist. Ein Schalter unter *Mehr* entscheidet, und die App
 * kennzeichnet die Karte deutlich.
 */
export const SPICY_QUESTIONS = [
  /* Kopfkino */
  'Woran denkst du, wenn du an mich denkst und keiner zuschaut?',
  'Was hast du das letzte Mal gedacht, als du ein Foto von mir gesehen hast?',
  'Wo hast du dir uns schon mal vorgestellt?',
  'Welche Szene mit uns läuft bei dir am häufigsten im Kopf?',
  'Woran hast du zuletzt gedacht, das du mir nie erzählt hast?',
  'Was stellst du dir vor, wenn du meine Stimme hörst?',
  'Welchen Gedanken über mich hast du schon mal weggeschoben, weil du gearbeitet hast?',
  'Was passiert in deinem Kopf, wenn ich „ich bin allein zu Hause“ schreibe?',
  'Welche Fantasie hast du, die dich selbst überrascht hat?',
  'Was würdest du mir gern vorlesen, wenn wir uns nicht sehen können?',
  'An welchem völlig unpassenden Ort hast du zuletzt an mich gedacht?',
  'Welchen Traum von mir würdest du gern nochmal träumen?',

  /* Anziehung */
  'Was macht dich sofort schwach an mir?',
  'Was findest du an mir attraktiv, das ich selbst nicht sehe?',
  'Was ist dein liebster Ort an meinem Körper?',
  'Was findest du sexy, das gar nichts mit Aussehen zu tun hat?',
  'Welche Bewegung von mir bringt dich aus dem Konzept?',
  'Welchen Gesichtsausdruck von mir magst du am meisten?',
  'Was war der Moment, in dem du mich am meisten wolltest?',
  'Welches Kleidungsstück von mir hättest du gern hier?',
  'Was soll ich anhaben, wenn wir uns das nächste Mal sehen?',
  'Welches Detail an mir fällt dir immer wieder auf?',
  'Wann findest du mich am attraktivsten, ohne dass ich es merke?',
  'Welche Stimmlage von mir wirkt bei dir am stärksten?',
  'Was macht dich mehr an: langsam oder ungeduldig?',
  'Welche Berührung wirkt bei dir sofort?',

  /* Erinnerung */
  'Was war unser bisher bester gemeinsamer Moment im Bett?',
  'Welche Nachricht von mir hat dich am meisten angemacht?',
  'Woran denkst du zurück, wenn du dich nach mir sehnst?',
  'Welcher Moment mit mir war fast zu viel — im besten Sinn?',
  'Wann hast du dich zuletzt gewünscht, ich wäre da gewesen?',
  'Was war das erste Mal, dass du mich wirklich wolltest?',
  'Welcher Kuss von uns ist dir am deutlichsten im Kopf?',
  'Was war das Riskanteste, das wir gemacht haben?',
  'Welchen Abend mit mir würdest du sofort nochmal erleben?',
  'Was hast du damals gedacht und nicht gesagt?',
  'Wann hast du zuletzt gelächelt, weil du an eine Nacht mit mir gedacht hast?',
  'Welcher gemeinsame Morgen war der schönste?',

  /* Wünsche */
  'Was möchtest du beim nächsten Mal ausprobieren?',
  'Wenn wir eine Nacht ohne Regeln hätten: was passiert?',
  'Was würdest du als Erstes tun, wenn ich jetzt zur Tür reinkäme?',
  'Was würdest du gerne öfter hören von mir?',
  'Was traust du dich nicht zu fragen?',
  'Was möchtest du, dass ich mit dir mache, ohne dass du fragen musst?',
  'Wovon hättest du gern mehr, wenn wir zusammen sind?',
  'Wovon hättest du gern weniger?',
  'Welche Grenze würdest du gern mit mir ausloten?',
  'Was ist dein größter Wunsch, den du noch nie ausgesprochen hast?',
  'Was sollen wir uns für den ersten Abend beim Wiedersehen aufheben?',
  'Welche drei Wörter soll ich dir ins Ohr sagen?',
  'Was wäre das perfekte Geschenk, das niemand sonst verstehen würde?',
  'Wovon hast du dich bisher abhalten lassen, obwohl du es wolltest?',

  /* Nähe auf Distanz */
  'Was vermisst du körperlich am meisten?',
  'Beschreib unseren perfekten Morgen danach.',
  'Welche Uhrzeit fehlt dir am meisten, wenn ich nicht da bin?',
  'Was hilft dir, wenn du mich vermisst und es nicht geht?',
  'Was würdest du mir jetzt schicken, wenn du mutig wärst?',
  'Wie sähe unser perfekter Abend aus, wenn er nur aus Nähe bestünde?',
  'Was tust du, wenn du dich nach mir sehnst und niemand da ist?',
  'Welchen Satz von mir liest du nochmal, wenn du mich vermisst?',
  'Was möchtest du, dass ich denke, wenn ich abends im Bett liege?',
  'Wie soll ich dich wecken, wenn ich das nächste Mal neben dir liege?',
  'Welchen Ort in deiner Wohnung verbindest du mit mir?',
  'Was würdest du tun, wenn wir 24 Stunden hätten und niemand stört?',

  /* Ehrlichkeit */
  'Was hast du mir noch nie über mich gesagt, weil es zu direkt wäre?',
  'Worauf bist du bei mir manchmal ein bisschen eifersüchtig?',
  'Was macht dich unsicher, wenn es um uns beide geht?',
  'Was würdest du gern hören, wenn wir streiten?',
  'Was ist der Unterschied zwischen „ich will dich“ und „ich brauche dich“ für dich?',
  'Was macht dich verletzlich — und magst du das?',
  'Was war das Ehrlichste, das du mir je gesagt hast?',
  'Was hast du über dich gelernt, seit es uns gibt?',
  'Wovor hast du mehr Angst: zu viel oder zu wenig zu sagen?',
  'Was würdest du mir sagen, wenn du wüsstest, ich nehme es dir nicht übel?',
  'Wann fühlst du dich mir am nächsten?',
  'Was bedeutet Vertrauen für dich, ganz konkret?',

  /* Spielerisch */
  'Wahrheit oder Pflicht — was wählst du und warum?',
  'Welche Regel würdest du für einen Abend aufstellen?',
  'Wenn du mir eine Aufgabe für morgen geben dürftest: welche?',
  'Was soll ich dir heute Abend um zehn schreiben?',
  'Welches Wort von mir wirkt bei dir wie ein Schalter?',
  'Was würdest du tun, wenn du für einen Tag alles entscheiden dürftest?',
  'Wer von uns fängt normalerweise an — und wer gibt es nicht zu?',
  'Welche Wette würdest du mit mir eingehen und was ist der Einsatz?',
  'Wenn du mir ein Foto schicken müsstest, aber nur einen Ausschnitt: welchen?',
  'Was würdest du sagen, wenn ich dich jetzt anrufe und nichts sage?',
  'Welche Nachricht würdest du mir schreiben, wenn sie sich nach zehn Sekunden löscht?',
  'Was ist das Frechste, das du dir für uns ausgedacht hast?',

  /* Kleinigkeiten mit Wirkung */
  'Welche Berührung fehlt dir mehr als jede andere?',
  'Was soll ich als Erstes tun, wenn wir wieder allein sind?',
  'Welcher Blick von mir bleibt bei dir hängen?',
  'Was findest du an Nähe schöner als an allem anderen?',
  'Woran erkennst du, dass ich dich will?',
  'Was möchtest du hören, kurz bevor du einschläfst?',
  'Welche Kleinigkeit von mir bringt dich völlig aus dem Takt?',
  'Was würdest du gerne einmal ganz langsam machen?',
  'Welches Geräusch verbindest du mit uns?',
  'Was ist besser: erwartet oder überrascht?',
  'Welche Uhrzeit ist deine Lieblingsuhrzeit für uns?',
  'Was findest du am Danach am schönsten?',
  'Welchen Satz von mir würdest du dir aufnehmen und wieder abspielen?',
  'Was möchtest du, dass ich dir zuflüstere?',
  'Welche Grenze zwischen zärtlich und fordernd magst du am liebsten?',
  'Was war das Letzte, das dich unerwartet erregt hat?',
  'Wie fühlt es sich an, wenn ich dich einfach nur ansehe?',
  'Was würdest du gern von mir gefragt werden, ohne selbst darauf zu kommen?',
  'Welche Erinnerung holst du hervor, wenn du allein bist?',
  'Was macht für dich den Unterschied zwischen schön und unvergesslich?',
  'Welchen Ort außerhalb eines Bettes findest du reizvoll?',
  'Was hast du dir für unser nächstes Wiedersehen bereits ausgemalt?',
  'Wie soll unser erster Abend zusammen enden?',
  'Was würdest du tun, wenn ich einmal gar nichts sagen dürfte?'
];

/**
 * Frage des Tages, stabil pro Datum und Paar.
 *
 * Nicht gehasht, sondern durchgezählt: Der ganze Katalog wird einmal gemischt
 * und Tag für Tag abgearbeitet. Erst wenn er durch ist, wird neu gemischt.
 * Bei über hundert Fragen heißt das: mehr als ein Jahr ohne Wiederholung —
 * und nie zweimal dieselbe Frage in derselben Woche.
 *
 * @param {string} dateKey  YYYY-MM-DD
 * @param {number} salt     aus dem Paar-Code, damit ihr eigene Reihenfolge habt
 * @param {boolean} spicy   den zweiten Katalog nehmen
 */
export function questionForDay(dateKey, salt = 0, spicy = false) {
  const pool = spicy ? SPICY_QUESTIONS : DAILY_QUESTIONS;
  // Ein anderer Startwert, damit beide Kataloge nicht im Gleichtakt laufen
  const s = spicy ? ((salt >>> 0) ^ 0x9e3779b9) >>> 0 : salt >>> 0;
  return cycled(pool, dayIndex(dateKey), s);
}

/** Tage seit dem 1.1.2020 — fortlaufend, zeitzonenfrei, aus dem Datumstext. */
export function dayIndex(dateKey) {
  const t = Date.parse(`${String(dateKey).slice(0, 10)}T12:00:00Z`);
  if (Number.isNaN(t)) return 0;
  return Math.max(0, Math.round((t - Date.UTC(2020, 0, 1, 12)) / 86_400_000));
}
