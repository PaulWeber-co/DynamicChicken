/**
 * Kribbeln — sechs Karten, zwei heimliche Meinungen, nur die Treffer zählen.
 *
 * Jede Runde legt die App sechs Wünsche auf den Tisch. Beide kreuzen für
 * sich an: Ja, Vielleicht oder Nein. Aufgedeckt wird ausschließlich, wo ihr
 * euch trefft — was einer weglässt, taucht nirgends auf. Kein „X wollte
 * nicht“, keine Liste der Absagen, keine Rechtfertigung.
 *
 * Genau darin liegt der Reiz. Man kann etwas ankreuzen, das man sich nie
 * getraut hätte auszusprechen, ohne etwas zu riskieren: Sagt der andere
 * Nein, hat man es nie gesagt. Sagt der andere Ja, steht es plötzlich auf
 * eurer gemeinsamen Liste.
 *
 * Drei Hitzegrade, und jeder mischt die milderen mit — auch die heißeste
 * Runde fängt harmlos an. Die oberste Stufe gibt es nur, wenn die freizügigen
 * Inhalte unter „Mehr“ eingeschaltet sind; sonst taucht sie gar nicht auf.
 *
 * Ehrlich bleibt zu sagen: Die Kreuze reisen zum anderen Gerät, damit dort
 * dieselbe Auswertung herauskommt. Die App zeigt sie nicht — wer in den
 * Browser-Speicher schaut, sieht sie trotzdem. Ohne Server ginge es nicht
 * anders, und es gilt für jedes Spiel hier.
 */

import { rng } from '../util/rng.js';
import { esc } from '../util/dom.js';
import { fx, burst, confetti } from '../util/feedback.js';
import { get, commit, subscribe } from '../state/store.js';
import { icon } from '../ui/icons.js';
import { pushFeed, addBondXp } from '../state/model.js';
import { REWARDS } from '../state/catalog.js';
import { sendEvent } from '../sync/index.js';
import { toast } from '../ui/toast.js';
import { seedFor } from './index.js';

export const meta = {
  id: 'krib',
  icon: 'gameSpark',
  title: 'Kribbeln',
  tagline: 'Beide kreuzen heimlich an — aufgedeckt wird nur, was passt',
  modes: ['async'],
  tone: 'love',
  howto: 'Sechs Wünsche, beide sagen heimlich Ja, Vielleicht oder Nein. Sichtbar wird nur, wo ihr euch trefft.'
};

/* ── Die Karten ─────────────────────────────────────────── */

export const CARDS = {
  sanft: [
    'Den ganzen Sonntag im Bett bleiben',
    'Zusammen duschen, ohne Eile',
    'Rücken massieren, bis einer wegdöst',
    'Einschlafen, ohne dass ein Handy leuchtet',
    'Frühstück im Bett, Krümel inklusive',
    'Stundenlang Löffelchen',
    'Vorlesen, bis der andere einschläft',
    'Zusammen in die Wanne',
    'Ganz langsam küssen und sonst nichts',
    'In der Küche tanzen, ohne Musik',
    'Unter einer Decke, während es draußen regnet',
    'Sich gegenseitig die Haare waschen',
    'Einen ganzen Film lang Händchen halten',
    'Ein Nickerchen zu zweit',
    'Barfuß spazieren und über nichts reden',
    'Nebeneinander liegen und an die Decke starren',
    'Sich gegenseitig eincremen',
    'Zusammen aufwachen und liegen bleiben',
    'Kopf im Schoß, während der andere liest',
    'Die Hand nicht loslassen, den ganzen Weg',
    'Sich gegenseitig die Füße wärmen',
    'Eine Stunde lang nichts sagen müssen',
    'Zusammen kochen und dabei ständig im Weg stehen',
    'Auf dem Balkon sitzen, bis es kalt wird',
    'Einander drei ehrliche Komplimente machen',
    'Fotos von früher durchgehen',
    'Zusammen ein Bad einlassen und Kerzen anmachen',
    'Sich umarmen, bis einer loslässt — und das dauert',
    'Im Dunkeln zusammen Musik hören',
    'Zusammen einen Sternenhimmel suchen',
    'Sich gegenseitig die Hände massieren',
    'Eine Nacht durchreden',
    'Zusammen etwas Neues ausprobieren, das keiner kann',
    'Nebeneinander duschen und einfach quatschen',
    'Einen Tag lang das Handy weglegen',
    'Sich gegenseitig frisieren, egal wie es aussieht',
    'Zusammen den Sonnenaufgang verpennen und lachen',
    'Kuscheln, obwohl es viel zu warm dafür ist',
    'Sich gegenseitig etwas vorsingen, schief',
    'Einfach nebeneinander sitzen und arbeiten',
    'Zusammen aufräumen und dabei Musik zu laut drehen',
    'Sich gegenseitig die Schultern kneten, ohne Anlass',
    'Zu zweit ein Buch lesen, jeder eine Seite',
    'Eine Decke, ein Sofa, zwei Kaffee, kein Plan',
    'Sich gegenseitig erzählen, wie der Tag wirklich war',
    'Auf dem Boden sitzen und ein Puzzle anfangen',
    'Zusammen zum Bäcker, viel zu früh',
    'Die Stirn aneinander legen und nichts sagen',
    'Sich gegenseitig die Hände zeichnen',
    'Eine Playlist bauen, nur füreinander',
    'Zusammen eine Pflanze kaufen und benennen',
    'Nebeneinander einschlafen mit laufendem Videocall',
    'Sich gegenseitig fragen, was gerade fehlt',
    'Zusammen etwas Altes reparieren',
    'Eine Runde um den Block, Arm in Arm',
    'Sich gegenseitig die Lieblingsszene aus einem Film zeigen',
    'Zu zweit unter eine viel zu kleine Decke',
    'Einen Brief schreiben, auf Papier',
    'Zusammen im Regen stehen bleiben',
    'Sich gegenseitig eine Geschichte ausdenken',
    'Auf dem Sofa liegen, Beine übereinander, ganz normal',
    'Zusammen Fotos machen, absichtlich unscharf',
    'Sich gegenseitig ein Rezept diktieren',
    'Zusammen frühstücken, jeder auf seinem Bildschirm',
    'Die Wohnung umstellen, nur zum Spaß',
    'Sich gegenseitig vorlesen, was man gerade liest',
    'Zusammen einen Plan für den Sommer machen',
    'Nebeneinander joggen und nach drei Minuten aufhören',
    'Sich gegenseitig die Augenbrauen richten',
    'Zu zweit auf einem Stuhl sitzen',
    'Sich gegenseitig etwas beibringen, das keiner braucht',
    'Zusammen eine Karte aufhängen und Nadeln reinstecken',
    'Sich in eine Umarmung fallen lassen, ohne Grund',
    'Zusammen einkaufen und nichts von der Liste kaufen',
    'Die Nacht durchmachen und den Sonnenaufgang mitnehmen',
    'Sich gegenseitig einen Tag lang jeden Wunsch erfüllen',
    'Zusammen etwas backen, das schiefgeht',
    'Sich gegenseitig die Hand halten, während einer telefoniert',
    'Zu zweit ins Kino, letzte Reihe, harmlos',
    'Sich gegenseitig vorlesen, bis die Stimme weg ist'
  ],
  frech: [
    'Knutschen, bis die Lippen kribbeln',
    'Nackt kochen — Schürze erlaubt',
    'Strip-Poker mit echten Einsätzen',
    'Ein Foto, das sonst niemand sehen darf',
    'Im Auto rumknutschen wie mit siebzehn',
    'Sich gegenseitig ausziehen, ganz langsam',
    'Kitzeln, bis einer kapituliert',
    'Wäsche, die für niemanden sonst gedacht ist',
    'Eine Massage, die nicht bei den Schultern aufhört',
    'Duschen zu zweit — diesmal mit Absicht',
    'Augen verbinden und raten lassen',
    'Eine Nachricht, die man besser wieder löscht',
    'Kuss in den Nacken, ohne Vorwarnung',
    'Auf dem Sofa übereinander herfallen',
    'Beim Umziehen zusehen dürfen',
    'Ein Kompliment, das rot macht',
    'Einen ganzen Abend lang flirten wie beim ersten Mal',
    'Unterm Tisch Hand auf dem Knie, während andere reden',
    'Sich gegenseitig anziehen — und dabei scheitern',
    'Ein Kleidungsstück aussuchen, das der andere trägt',
    'Zu zweit in eine Umkleidekabine',
    'Küssen, bis jemand „genug“ sagt — und keiner sagt es',
    'Einen Abend lang nur Blickkontakt, kein Wort',
    'Sich beim Duschen von draußen zusehen lassen',
    'Massageöl kaufen und sofort ausprobieren',
    'Eine Runde tanzen, viel zu nah',
    'Sich zehn Minuten lang nur küssen — Wecker stellen',
    'Erzählen, was einem heute durch den Kopf ging',
    'Wetten, wer länger stillhalten kann',
    'Im Bett frühstücken und dabei nichts anhaben',
    'Sich gegenseitig ins Ohr flüstern, was man vorhat',
    'Eine Liste schreiben: was wir noch nie gemacht haben',
    'Sich einen Abend lang siezen und dabei ernst bleiben',
    'Küssen, wo es keiner sieht — aber fast',
    'Die Hand wandern lassen, während ein Film läuft',
    'Sich gegenseitig ein Outfit für den Abend aussuchen',
    'Nachts heimlich in den Garten oder aufs Dach',
    'Der eine liest vor, der andere lenkt ab',
    'Ein Kleidungsstück verstecken und suchen lassen',
    'Sich vom anderen die Fingernägel lackieren lassen',
    'Ein Sprachnachricht schicken, die man nicht laut hören sollte',
    'Sich gegenseitig eine Grenze verraten und stehen lassen',
    'Beim Essen unterm Tisch nach dem Knie suchen',
    'Ein Kuss an einer Stelle, die keiner erwartet',
    'Sich gegenseitig die Hände festhalten und nicht loslassen',
    'Auf dem Rücksitz sitzen bleiben, obwohl man aussteigen könnte',
    'Zusammen shoppen und nur Sachen anprobieren, die zu eng sind',
    'Sich gegenseitig ins Ohr beißen',
    'Eine Wette, deren Einsatz keiner laut sagt',
    'Ein Abend, an dem Reden verboten ist',
    'Sich gegenseitig füttern, ohne Hände',
    'Ein Foto vom Nacken, mehr nicht',
    'Zu zweit auf ein Sofa, das für einen gemacht ist',
    'Sich gegenseitig zehn Minuten lang nicht ansehen dürfen',
    'Beim Kochen von hinten anschleichen',
    'Sich gegenseitig aussuchen, was unter dem Mantel ist',
    'Eine Nachricht schicken, die drei Punkte enthält und sonst nichts',
    'Zusammen ein Bad nehmen, in dem einer zu viel Platz braucht',
    'Sich gegenseitig sagen, was man am anderen ansieht',
    'Ein Abend nur mit Kerzenlicht, sonst nichts geändert',
    'Die Hände beschäftigen, während der andere redet',
    'Sich einen Abend lang absichtlich nicht berühren',
    'Nur noch flüstern, ab jetzt',
    'Sich gegenseitig ausmalen, wie das Wiedersehen anfängt',
    'Ein Kleidungsstück tauschen und tragen',
    'Sich gegenseitig einen Ort im Haus zuweisen und dort warten',
    'Beim Zähneputzen anlehnen und nicht weggehen',
    'Eine Nachricht schreiben und zwei Stunden nicht abschicken',
    'Zusammen auf den Boden, weil das Sofa zu weit weg ist',
    'Sich gegenseitig die Hand auf den Bauch legen und atmen',
    'Ein Kuss, der zu lange dauert, mitten am Tag',
    'Sich gegenseitig ansehen, bis einer wegschaut',
    'Zu zweit unter die Dusche, ohne Absprache',
    'Auf dem Weg nach Hause schon anfangen',
    'Sich gegenseitig sagen, woran man gerade denkt — ehrlich',
    'Eine Regel für den Abend aufstellen und brechen',
    'Sich gegenseitig aufwecken auf eine bestimmte Art',
    'Nachts anrufen und nur atmen hören',
    'Ein Kleidungsstück ausziehen, jede halbe Stunde eins',
    'Sich gegenseitig eine Nachricht diktieren, die keiner abschickt'
  ],
  heiss: [
    'Ein Abend, an dem nur einer bestimmt',
    'Einmal die Rollen tauschen',
    'Augenbinde ausprobieren',
    'Handschellen ausprobieren',
    'Etwas, das wir beide noch nie gemacht haben',
    'Spät nachts am Telefon, weit voneinander weg',
    'Videocall, wenn längst alle schlafen',
    'Ein Spielzeug mitbringen',
    'Im Dunkeln, ohne ein einziges Wort',
    'Morgens, bevor der Wecker klingelt',
    'Irgendwo, wo wir eigentlich nicht sollten',
    'Sehr lange Vorfreude, sehr wenig Geduld',
    'Eine Fantasie erzählen, die noch nie jemand gehört hat',
    'Ganz laut sein dürfen',
    'Eiswürfel, Federn, was auch immer da ist',
    'Erst aufhören, wenn beide nicht mehr können',
    'Eine Stunde lang nur Vorspiel, nichts weiter',
    'Der eine darf sich nicht bewegen',
    'Der eine darf keinen Ton machen',
    'Ein Wort ausmachen, das alles sofort beendet',
    'Vor dem Spiegel',
    'Auf dem Boden, weil es bis ins Bett nicht reicht',
    'Nur mit den Händen, sonst nichts',
    'Nur mit dem Mund, sonst nichts',
    'Sich gegenseitig zeigen, wie man es allein macht',
    'Den ganzen Tag Andeutungen, abends die Auflösung',
    'Duschen, dann sofort weiter',
    'Zwei Runden hintereinander',
    'Einer bleibt angezogen, der andere nicht',
    'Kleidung, die absichtlich im Weg ist',
    'Ein Nein, das man vorher vereinbart und dann testet',
    'Sich fesseln lassen — nur die Hände',
    'Einer zählt bis zwanzig, der andere hat bis dahin Zeit',
    'Etwas vorlesen, während der andere ablenkt',
    'Auf dem Küchentisch, weil er gerade da ist',
    'Zwei Stunden ohne Handy, Tür zu',
    'Ein Wochenende, an dem wir kaum rauskommen',
    'Nachricht am Vormittag, die den ganzen Tag versaut',
    'Aussuchen lassen, was der andere trägt — oder nicht',
    'Beim nächsten Wiedersehen als Allererstes',
    'Ein Abend, an dem gefragt werden muss, bevor etwas passiert',
    'Der eine hat die Augen zu, von Anfang bis Ende',
    'Eine Liste abarbeiten, die wir vorher schreiben',
    'Erst duschen, dann Massage, dann sehen wir weiter',
    'Sich Zeit lassen, bis es fast wehtut',
    'Der eine bestimmt das Tempo, der andere hält sich dran',
    'Etwas ausprobieren, das einer schon lange im Kopf hat',
    'In einem Raum, in dem wir noch nie waren',
    'Mit Musik, die viel zu laut ist',
    'Ganz früh am Morgen, ohne ein Wort vorher',
    'Ein Abend mit Handschellen und einem Schlüssel in Reichweite',
    'Sich gegenseitig genau sagen, was gerade passieren soll',
    'Eine Stunde nur mit den Händen des anderen',
    'Der eine liest laut vor, was er sich wünscht',
    'Etwas, das man vorher üben müsste',
    'Erst nach Mitternacht anfangen',
    'Einen Abend lang gar keine Kleidung im Raum',
    'Sich gegenseitig aufschreiben, was ein Ja braucht',
    'Am Fenster, mit Vorhang',
    'Ein Wochenende ohne Wecker und ohne Pläne',
    'Etwas Neues kaufen und zusammen auspacken',
    'Der eine sitzt, der andere entscheidet',
    'Nur eine Kerze im Raum',
    'Sich gegenseitig eine Aufgabe für den Tag geben',
    'Ein Videocall, bei dem niemand etwas sagen darf',
    'Etwas, bei dem man hinterher lachen muss',
    'Zwei Stunden, in denen nur einer redet',
    'Sich gegenseitig zeigen, wo man am liebsten berührt wird',
    'Erst nach dem dritten Nein weitermachen dürfen',
    'Ein Abend, an dem alles vorher besprochen ist',
    'In der Küche, weil wir es bis nirgendwohin schaffen',
    'Sich gegenseitig eine Nachricht auf die Haut schreiben',
    'Etwas mit Temperatur — warm, kalt, beides',
    'Ein Spiel, bei dem der Verlierer bestimmt',
    'Nach dem Aufwachen sofort weitermachen',
    'Ein Abend, an dem niemand aufhört, bevor der andere es sagt',
    'Sich vorher schreiben, was abends passieren wird',
    'Ein ganzer Tag mit Regeln, die wir morgens festlegen',
    'Etwas, das wir danach nie wieder erwähnen',
    'Einen Abend lang alles zweimal machen'
  ],

  /**
   * Extrem — die Stufe, auf der nichts umschrieben wird.
   *
   * Alle anderen Stapel arbeiten mit Andeutung; hier steht, was gemeint
   * ist, samt Namen und kurzer Erklärung. Genau das ist der Sinn: Man kann
   * nur ehrlich Ja oder Nein sagen zu etwas, das man auch wirklich
   * verstanden hat. Wer bei „irgendwas Wildes" ankreuzt, kreuzt eine
   * Vermutung an.
   *
   * Diese Karten kommen nur mit eingeschaltetem Schalter für freizügige
   * Inhalte, und auch dann bleibt jedes Nein für immer unsichtbar.
   */
  extrem: [
    /* ── Stellungen ── */
    'Missionarsstellung, aber mit angezogenen Beinen über den Schultern',
    'Reiten — du oben, du bestimmst Tempo und Tiefe',
    'Reiten mit dem Rücken zu mir, damit ich alles sehe',
    'Von hinten im Stehen, vor dem Spiegel',
    'Von hinten, während du dich auf den Ellenbogen abstützt',
    'Löffelchen von hinten, ganz langsam und ohne Eile',
    'Auf der Bettkante — einer sitzt, einer steht',
    'Auf dem Stuhl, ich sitze, du auf mir, Gesicht zu Gesicht',
    'Du auf dem Bauch, ich flach auf dir',
    'Beide auf der Seite, ein Bein über meinem',
    'Auf allen Vieren, mit einer Hand in meinen Haaren',
    'Gegen die Wand, du hebst mich hoch',
    'Auf dem Küchentisch, du liegst, ich stehe',
    'Über die Sofalehne gebeugt',
    'Auf dem Boden, ohne Kissen, ohne Rücksicht auf Möbel',
    'Beide auf den Knien, ich hinter dir, Arme um dich',
    'Sechsundsechzig — gleichzeitig, beide gleichzeitig',
    'Ich zwischen deinen Beinen, du auf dem Rücken, Beine über meinen Schultern',
    'Du sitzt auf meinem Gesicht',
    'Ich liege, du kniest über mir und beugst dich nach vorn',
    'Im Sitzen ineinander verschränkt, kaum Bewegung, viel Nähe',
    'Du am Bettrand, Kopf nach hinten hängend',
    'Stehend, ein Bein von dir auf meiner Hüfte',
    'Von hinten, während du dich am Kopfteil festhältst',
    'Du auf dem Rücken quer über dem Bett, ich stehe davor',
    'Rücken an Rücken, nur Hände',
    'In der Dusche, du mit dem Gesicht zur Wand',
    'Auf der Waschmaschine, während sie läuft',
    'Wir wechseln alle paar Minuten die Stellung, bis eine bleibt',
    'Erst probieren wir drei neue, dann nehmen wir die beste nochmal',

    /* ── Mund und Hände ── */
    'Nur mit dem Mund, bis zum Schluss',
    'Ich bringe dich mit der Hand dahin, ganz langsam',
    'Du zeigst mir mit meiner Hand, wie du es machst',
    'Du machst es dir selbst und ich sehe zu, ohne mitzumachen',
    'Ich mache es mir selbst und du gibst die Anweisungen',
    'Mit den Fingern, während wir uns küssen',
    'Erst eine halbe Stunde nur Hände und Mund, kein Eindringen',
    'Bis kurz davor und dann aufhören — dreimal hintereinander',
    'Du sagst mir währenddessen, was du gerade fühlst',
    'Ich verbinde dir die Augen und du weißt nicht, was kommt',

    /* ── Führung und Tempo ── */
    'Einer bestimmt vollständig, der andere sagt nur Ja oder Stopp',
    'Ganz langsam, eine Stunde lang, ohne Ziel',
    'Schnell und ohne Vorspiel, weil keine Zeit ist',
    'Du hältst meine Handgelenke fest',
    'Ich fessle dir die Hände mit dem, was gerade da ist',
    'Ein Abend mit Handschellen',
    'Du darfst dich nicht bewegen, egal was passiert',
    'Ich darf nicht kommen, bevor du es erlaubst',
    'Wir zählen mit, wie oft du kommst',
    'Es hört erst auf, wenn einer aufgibt',
    'Etwas fester zupacken, als wir es sonst tun',
    'Ein Klaps auf den Hintern — und dann mehr',
    'Am Hals gehalten werden, sanft, aber deutlich',
    'Beißen, kratzen, Spuren hinterlassen',
    'Erst betteln, dann bekommen',
    'Ich sage dir stundenlang vorher, was abends passiert',

    /* ── Spielzeug und Zusätze ── */
    'Ein Vibrator, den der andere steuert',
    'Ein Vibrator, während wir zusammen sind',
    'Gleitgel und viel davon',
    'Massageöl über den ganzen Körper, bevor irgendwas passiert',
    'Etwas Kaltes und etwas Warmes im Wechsel',
    'Ein Spielzeug zusammen aussuchen und bestellen',
    'Federn, Seide, Eiswürfel — der Reihe nach',
    'Augenbinde und Kopfhörer, damit nur das Fühlen bleibt',

    /* ── Orte und Umstände ── */
    'Nicht im Schlafzimmer — such du den Ort aus',
    'Im Auto, irgendwo, wo niemand hinschaut',
    'Im Hotelzimmer, mit offenem Fenster',
    'Draußen, nachts, mit dem Risiko',
    'Auf dem Balkon, im Dunkeln',
    'Morgens, bevor einer von uns wach genug ist, um nachzudenken',
    'Mittags, mitten am Tag, ohne Anlass',
    'Nach einem Streit, weil es dann anders ist',

    /* ── Reden und Zusehen ── */
    'Uns dabei filmen und es danach zusammen ansehen',
    'Ein Foto machen, das nur wir beide je sehen',
    'Beim Videoanruf, jeder für sich',
    'Mir am Telefon genau erzählen, was du gerade machst',
    'Vorher aufschreiben, was ich mit dir vorhabe',
    'Danach ehrlich sagen, was am besten war',
    'Eine Fantasie erzählen, die ich noch nie ausgesprochen habe',
    'Ein Rollenspiel mit Namen, Kleidung und allem'
  ]
};

export const TIERS = [
  { id: 'sanft', label: 'Sanft',  sub: 'Nähe, Wärme, nichts weiter', icon: 'nudgeHug', spicy: false },
  { id: 'frech', label: 'Frech',  sub: 'Da wird jemand rot',         icon: 'statJoy',  spicy: false },
  { id: 'heiss', label: 'Heiß',   sub: 'Nur mit freizügigen Inhalten', icon: 'gameSpark', spicy: true },
  { id: 'extrem', label: 'Extrem', sub: 'Beim Namen genannt — Stellungen und alles andere',
    icon: 'flame', spicy: true, warnung: true }
];

/** Auch die heißeste Runde beginnt harmlos — jede Stufe mischt die milderen mit. */
const MIX = {
  sanft: [['sanft', 6]],
  frech: [['sanft', 3], ['frech', 3]],
  heiss: [['sanft', 2], ['frech', 2], ['heiss', 2]],
  // Auf „Extrem" bleibt eine milde Karte dabei: Sechs von der Sorte am Stück
  // liest sich wie eine Liste, nicht wie ein Abend.
  extrem: [['frech', 1], ['heiss', 2], ['extrem', 3]]
};

export const CARDS_PER_ROUND = 6;

/**
 * Die sechs Karten einer Runde.
 *
 * `seen` sind die Karten, die ihr schon hattet — sie fallen raus. Genau
 * daran hing der Frust: Ohne Gedächtnis zieht der Zufall nach zehn Runden
 * zwangsläufig Bekanntes, und das Spiel fühlt sich abgenutzt an. Ist ein
 * Stapel wirklich durch, fängt er von vorn an, statt leer auszugehen.
 *
 * Die fertigen Karten reisen mit dem Zug zum anderen Gerät. Früher wurden
 * sie dort aus demselben Schlüssel nachgerechnet — das ging nur gut,
 * solange beide Seiten exakt dieselben Runden gesehen hatten. Mit dem
 * Gedächtnis stimmt das nicht mehr zwangsläufig, also wird nicht mehr
 * geraten, sondern geschickt.
 */
export function deal(seed, tier, seen = []) {
  const r = rng(seed);
  const gesehen = new Set(seen);
  const out = [];
  for (const [pool, n] of (MIX[tier] || MIX.sanft)) {
    let rest = CARDS[pool].filter((c) => !gesehen.has(c));
    if (rest.length < n) rest = CARDS[pool].slice();
    for (let i = 0; i < n && rest.length; i++) {
      out.push(rest.splice(Math.floor(r() * rest.length), 1)[0]);
    }
  }
  return out;
}

/** Sechs brauchbare Kartentexte aus dem, was hereinkommt. */
function cleanCards(raw) {
  if (!Array.isArray(raw) || raw.length !== CARDS_PER_ROUND) return null;
  const c = raw.map((t) => String(t ?? '').trim().slice(0, 90));
  return c.every(Boolean) ? c : null;
}

/* ── Auswertung ─────────────────────────────────────────── */

/** 0 = Nein, 1 = Vielleicht, 2 = Ja */
export const NEIN = 0, VIELLEICHT = 1, JA = 2;

export const MARKS = [
  { v: JA,         label: 'Ja',         short: 'Ja',   icon: 'statJoy',   cls: 'ja' },
  { v: VIELLEICHT, label: 'Vielleicht', short: 'Naja', icon: 'nudgeThink', cls: 'vielleicht' },
  { v: NEIN,       label: 'Nein',       short: 'Nein', icon: 'close',     cls: 'nein' }
];

/**
 * Ein Treffer entsteht nur, wenn niemand Nein gesagt hat.
 *
 * @returns {{level: 'beide'|'fast'|null, pts: number}}
 */
export function matchOf(a, b) {
  if (a === NEIN || b === NEIN) return { level: null, pts: 0 };
  if (a === JA && b === JA) return { level: 'beide', pts: 3 };
  return { level: 'fast', pts: 1 };
}

export function scoreRound(mine, theirs) {
  let pts = 0, beide = 0, fast = 0;
  for (let i = 0; i < mine.length; i++) {
    const m = matchOf(mine[i], theirs[i]);
    pts += m.pts;
    if (m.level === 'beide') beide++;
    else if (m.level === 'fast') fast++;
  }
  return { pts, beide, fast };
}

function verdictFor({ beide, fast }) {
  if (beide >= 4) return 'Ihr wollt praktisch dasselbe. Das wird ein Wiedersehen.';
  if (beide >= 2) return 'Mehrere Volltreffer — die stehen jetzt auf eurer Liste.';
  if (beide === 1) return 'Einer sitzt. Fängt gut an.';
  if (fast) return 'Noch kein klares Ja, aber ein paar Vielleichts.';
  return 'Diesmal nichts. Nächste Runde, andere Karten.';
}

/* ── Zustand ────────────────────────────────────────────── */

function kb(state) {
  if (!state.games.krib) {
    state.games.krib = {
      r: 1, turn: null, cur: null, score: { me: 0, them: 0 },
      hist: [], list: [], seen: []
    };
  }
  const g = state.games.krib;
  g.score ||= { me: 0, them: 0 };
  g.hist ||= [];
  g.list ||= [];
  g.seen ||= [];
  if (!g.turn) g.turn = iAmFirst(state) ? 'me' : 'them';
  return g;
}

/** Karten als gesehen vormerken, damit sie so bald nicht wiederkommen. */
function merken(g, cards) {
  for (const c of cards || []) if (!g.seen.includes(c)) g.seen.unshift(c);
  // Rund dreißig Runden Vorlauf. Mehr wäre unnötig — bei 240 Karten wäre
  // der Vorrat dann ohnehin fast durch, und der Speicherstand soll nicht
  // unbegrenzt mitwachsen.
  if (g.seen.length > 180) g.seen.length = 180;
}

const iAmFirst = (state) => (state.me.code || '') < (state.partner?.code || '~');

/** Sechs saubere Kreuze — oder nichts. */
function cleanMarks(raw) {
  if (!Array.isArray(raw) || raw.length !== CARDS_PER_ROUND) return null;
  const m = raw.map((n) => Math.round(Number(n)));
  return m.every((n) => n === NEIN || n === VIELLEICHT || n === JA) ? m : null;
}

const validTier = (t) => (TIERS.some((x) => x.id === t) ? t : 'sanft');

/** Treffer landen dauerhaft auf eurer Liste — doppelt aber nur einmal. */
function addToList(g, text, level) {
  const found = g.list.find((e) => e.text === text);
  if (found) {
    // Aus einem Vielleicht kann später ein Ja werden, andersherum nicht
    if (level === 'beide') { found.level = 'beide'; found.at = Date.now(); }
    return;
  }
  g.list.unshift({ text, level, at: Date.now() });
  if (g.list.length > 40) g.list.length = 40;
}

/** Beide Kreuze da? Dann abrechnen. */
function settle(state, g) {
  if (!g.cur?.mine || !g.cur?.theirs) return null;
  const res = scoreRound(g.cur.mine, g.cur.theirs);
  const treffer = [];

  g.cur.cards.forEach((text, i) => {
    const m = matchOf(g.cur.mine[i], g.cur.theirs[i]);
    if (!m.level) return;
    treffer.push({ text, level: m.level });
    addToList(g, text, m.level);
  });

  g.score.me += res.pts;
  g.score.them += res.pts;
  g.hist.unshift({ r: g.r, tier: g.cur.tier, ...res, at: Date.now() });
  if (g.hist.length > 20) g.hist.length = 20;

  state.me.coins += res.beide >= 3 ? REWARDS.gameWon : REWARDS.gamePlayed;
  addBondXp(state, 4 + res.beide * 2);
  state.me.pet.stats.joy = Math.min(100, state.me.pet.stats.joy + 5);
  pushFeed(state, {
    from: 'system', type: 'game', icon: 'gameSpark',
    text: `Kribbeln: ${res.beide} Volltreffer, ${res.fast} Vielleicht`
  });

  merken(g, g.cur.cards);
  const view = { r: g.r, cards: g.cur.cards.slice(), mine: g.cur.mine.slice(), theirs: g.cur.theirs.slice(), treffer, ...res };
  /**
   * Die Auflösung überlebt die Runde.
   *
   * Wer zuerst angekreuzt hat, ist beim Abrechnen gar nicht in der App —
   * für ihn wäre das Ergebnis sonst nur eine Bannerzeile. Also bleibt es
   * liegen, bis er es einmal gesehen hat. Danach fliegt es raus.
   */
  g.last = { ...view, seen: false };
  g.r++;
  g.turn = g.turn === 'me' ? 'them' : 'me';
  g.cur = null;
  return view;
}

function abortRound(g) {
  // Auch eine verworfene Runde hat man gesehen — sonst käme sie sofort wieder
  if (g.cur) merken(g, g.cur.cards);
  g.cur = null;
  g.last = null;
  g.r++;
  g.turn = g.turn === 'me' ? 'them' : 'me';
}

/* ── Netzwerk ───────────────────────────────────────────── */

const KINDS = ['kribDeal', 'kribMarks', 'kribSkip', 'kribTick'];

export function handleRemote(state, msg, { partnerName }) {
  if (!KINDS.includes(msg.kind)) return undefined;
  const g = kb(state);

  if (msg.kind === 'kribTick') {
    const eintrag = g.list.find((e) => e.text === msg.text);
    if (!eintrag) return null;
    eintrag.done = !!msg.on;
    eintrag.doneAt = msg.on ? Date.now() : 0;
    commit('krib');
    if (!msg.on) return null;
    return {
      kind: 'gameResult', icon: 'check', avatar: 'them',
      title: 'Abgehakt',
      sub: String(msg.text || '').slice(0, 60),
      body: `${partnerName} hat es von eurer Liste gestrichen. Also habt ihr es gemacht.`,
      actions: [{ label: 'Liste ansehen', act: 'game:krib', primary: true }, { label: 'Schön', act: 'dismiss' }],
      tone: 'love'
    };
  }

  if (msg.kind === 'kribSkip') {
    if (msg.r < g.r || !g.cur) return null;
    abortRound(g);
    commit('krib');
    return {
      kind: 'gameTurn', icon: 'gameSpark', avatar: 'them',
      title: `${partnerName} hat die Runde verworfen`,
      sub: 'Kribbeln',
      body: 'Neue Karten beim nächsten Mal.',
      actions: [{ label: 'Weiter', act: 'game:krib', primary: true }, { label: 'Ok', act: 'dismiss' }],
      tone: 'calm'
    };
  }

  if (msg.kind === 'kribDeal') {
    if (msg.r < g.r) return null;
    // Gleichzeitig ausgeteilt: auf beiden Geräten gewinnt derselbe Code
    if (g.cur && msg.r === g.r && iAmFirst(state)) return null;

    const tier = validTier(msg.tier);
    // Bevorzugt die mitgeschickten Karten; die Nachrechnung ist nur der
    // Rückfall für ein Gerät mit älterer Fassung.
    const cards = cleanCards(msg.cards)
      || deal(seedFor('krib', `${msg.r}-${tier}`, state), tier, g.seen);
    g.r = msg.r;
    g.turn = 'them';
    g.cur = { tier, cards, mine: null, theirs: null };
    commit('krib');
    return {
      kind: 'gameTurn', icon: 'gameSpark', avatar: 'them',
      title: `${partnerName} hat ausgeteilt`,
      sub: `Kribbeln · ${TIERS.find((t) => t.id === tier)?.label}`,
      body: 'Sechs Karten liegen bereit. Kreuz an, was du willst — gezeigt wird nur, wo ihr euch trefft.',
      actions: [{ label: 'Ansehen', act: 'game:krib', primary: true }, { label: 'Später', act: 'dismiss' }],
      tone: 'love'
    };
  }

  // Kreuze des anderen
  if (!g.cur || g.cur.theirs) return null;
  const marks = cleanMarks(msg.marks);
  if (!marks) return null;
  g.cur.theirs = marks;

  const view = settle(state, g);
  commit('krib');

  if (!view) {
    return {
      kind: 'gameWaiting', icon: 'gameSpark', avatar: 'them',
      title: `${partnerName} hat angekreuzt`,
      sub: 'Kribbeln',
      body: 'Sobald du auch durch bist, seht ihr die Treffer.',
      actions: [{ label: 'Jetzt ankreuzen', act: 'game:krib', primary: true }, { label: 'Später', act: 'dismiss' }],
      tone: 'love'
    };
  }

  return {
    kind: 'gameResult', icon: view.beide ? 'trophy' : 'gameSpark', avatar: 'them',
    title: view.beide ? `${view.beide}× seid ihr euch einig` : 'Diesmal kein Treffer',
    sub: `Kribbeln · ${view.pts} Punkte`,
    body: verdictFor(view),
    actions: [{ label: 'Ansehen', act: 'game:krib', primary: true }, { label: 'Ok', act: 'dismiss' }],
    tone: view.beide ? 'love' : 'calm'
  };
}

export function summary(state) {
  const g = kb(state);
  if (g.cur && !g.cur.mine) return { badge: 'wait', text: 'Sechs Karten' };
  if (g.cur) return { badge: 'off', text: 'Wartet auf Antwort' };
  if (g.turn === 'me') {
    return g.hist.length
      ? { badge: 'wait', text: 'Du teilst aus' }
      : { badge: null, text: 'Du fängst an' };
  }
  return g.list.length
    ? { badge: null, text: `${g.list.length} auf der Liste` }
    : { badge: null, text: 'Neu' };
}

/* ── Oberfläche ─────────────────────────────────────────── */

export function mount(root, ctx) {
  const partner = get().partner?.name || 'Dein Mensch';
  /** Welcher Bildschirm gerade steht — nur passive dürfen sich selbst ablösen. */
  let screen = '';

  const shell = (inner) => `
    <div class="game-wrap">
      <div class="game-top">
        <button class="game-x" data-close aria-label="Schließen">${icon('close', { size: 15 })}</button>
        <div class="game-title">Kribbeln</div>
        <div class="game-right"><span class="badge">${kb(get()).list.length}</span></div>
      </div>
      <div class="game-scroll">${inner}</div>
    </div>`;

  const bindClose = () => {
    root.querySelectorAll('[data-close]').forEach((b) => { b.onclick = () => ctx.close(); });
    const skip = root.querySelector('[data-skip]');
    if (skip) skip.onclick = () => {
      const g = kb(get());
      if (!g.cur) { route(); return; }
      sendEvent('game', { g: 'krib', kind: 'kribSkip', r: g.r });
      abortRound(g);
      commit('krib');
      toast('Runde verworfen');
      fx('tap');
      route();
    };
    const list = root.querySelector('[data-list]');
    if (list) list.onclick = () => screenList();
  };

  const skipLink = (label = 'Runde verwerfen') =>
    `<button class="btn btn-ghost btn-sm btn-block" data-skip style="margin-top:2px">${label}</button>`;

  /* — Austeilen: Hitzegrad wählen — */
  function screenDeal() {
    screen = 'deal';
    const st = get();
    const g = kb(st);
    const spicyOn = !!st.settings.spicy;

    root.innerHTML = shell(`
      <div class="hue-lead">
        <span class="doodle-kicker">Runde ${g.r} · du teilst aus</span>
        <b>Wie heiß darf es werden?</b>
      </div>
      <p class="tiny muted center" style="margin:0 0 14px">
        Sechs Karten für euch beide. Jede Stufe mischt die milderen mit.
      </p>
      <div class="krib-tiers">
        ${TIERS.map((t) => {
          const off = t.spicy && !spicyOn;
          return `<button class="krib-tier ${off ? 'off' : ''}${t.warnung ? ' extrem' : ''}" data-tier="${t.id}" ${off ? 'disabled' : ''}>
            <span class="krib-tier-e">${icon(t.icon, { size: 24 })}</span>
            <span class="grow">
              <span class="krib-tier-t">${esc(t.label)}</span>
              <span class="krib-tier-s">${off ? 'Erst unter Mehr → freizügige Inhalte' : esc(t.sub)}</span>
              ${!off && t.warnung ? '<span class="krib-tier-w">Nichts wird umschrieben</span>' : ''}
            </span>
            ${off ? icon('lock', { size: 14 }) : icon('chevron', { size: 14 })}
          </button>`;
        }).join('')}
      </div>
      <p class="tiny muted center" style="margin:14px 4px 0">
        ${icon('lock', { size: 12, cls: 'ic-inline' })}
        Sichtbar wird nur, wo ihr euch trefft. Was du weglässt, erfährt niemand.
      </p>
      ${listTeaser()}`);

    root.querySelectorAll('[data-tier]').forEach((b) => {
      b.onclick = () => { fx('pop'); screenOwn(b.dataset.tier); };
    });
    bindClose();
  }

  /**
   * Eine eigene Karte dazulegen — freiwillig.
   *
   * Das ist der schärfste Teil des Spiels: Was man selbst schreibt, steht
   * nachher zwischen fünf gezogenen Karten, und drüben sieht niemand, welche
   * davon von dir kam. Man kann also etwas hineinlegen, das man nie
   * ausgesprochen hätte — und erfährt trotzdem, ob es auf Gegenliebe stößt.
   */
  function screenOwn(tier) {
    screen = 'own';
    const t = TIERS.find((x) => x.id === tier);
    root.innerHTML = shell(`
      <div class="hue-lead">
        <span class="doodle-kicker">${esc(t?.label || '')}</span>
        <b>Eine eigene Karte dazu?</b>
      </div>
      <p class="tiny muted center" style="margin:0 0 14px">
        Sie landet unerkannt zwischen den anderen fünf. ${esc(partner)} sieht
        nicht, welche von dir ist — und du erfährst trotzdem, ob es ein Ja gibt.
      </p>
      <input class="input" data-own maxlength="88" autocomplete="off"
        placeholder="Etwas, das du dich sonst nicht traust">
      <button class="btn btn-love btn-block" data-go style="margin-top:14px">Austeilen</button>
      <button class="btn btn-ghost btn-sm btn-block" data-skipown>Ohne eigene Karte</button>`);

    const inp = root.querySelector('[data-own]');
    inp.focus();
    const los = (eigen) => {
      const st2 = get();
      const g2 = kb(st2);
      const cards = deal(seedFor('krib', `${g2.r}-${tier}`, st2), tier, g2.seen);
      if (eigen) {
        // Zufälliger Platz, damit die eigene Karte nicht immer unten steht
        cards[Math.floor(Math.random() * cards.length)] = eigen;
      }
      g2.cur = { tier, cards, mine: null, theirs: null };
      g2.turn = 'me';
      commit('krib');
      sendEvent('game', { g: 'krib', kind: 'kribDeal', r: g2.r, tier, cards });
      fx('pop');
      screenMark();
    };
    root.querySelector('[data-go]').onclick = () => los(inp.value.trim().slice(0, 88));
    root.querySelector('[data-skipown]').onclick = () => los('');
    bindClose();
  }

  /* — Ankreuzen — */
  function screenMark() {
    screen = 'mark';
    const g = kb(get());
    const marks = new Array(CARDS_PER_ROUND).fill(null);
    const tier = TIERS.find((t) => t.id === g.cur.tier);

    const draw = () => {
      const offen = marks.filter((m) => m === null).length;
      root.innerHTML = shell(`
        <div class="hue-lead">
          <span class="doodle-kicker">Runde ${g.r} · ${esc(tier?.label || '')}</span>
          <b>Was davon willst du?</b>
        </div>
        <p class="tiny muted center" style="margin:0 0 14px">
          Ehrlich sein kostet nichts — ${esc(partner)} sieht nur, wo ihr euch trefft.
        </p>
        <div class="krib-cards">
          ${g.cur.cards.map((text, i) => `<div class="krib-card ${marks[i] !== null ? 'done' : ''}">
            <div class="krib-text">${esc(text)}</div>
            <div class="krib-marks">
              ${MARKS.map((m) => `<button class="krib-mark ${m.cls} ${marks[i] === m.v ? 'on' : ''}"
                data-mark="${i}:${m.v}" aria-label="${esc(text)}: ${m.label}"
                aria-pressed="${marks[i] === m.v}">${esc(m.short)}</button>`).join('')}
            </div>
          </div>`).join('')}
        </div>
        <button class="btn btn-love btn-block" data-send style="margin-top:14px" ${offen ? 'disabled' : ''}>
          ${offen ? `Noch ${offen}` : 'Verdeckt abschicken'}
        </button>
        ${skipLink()}`);

      root.querySelectorAll('[data-mark]').forEach((b) => {
        b.onclick = () => {
          const [i, v] = b.dataset.mark.split(':').map(Number);
          marks[i] = v;
          fx('tap');
          draw();
        };
      });
      const send = root.querySelector('[data-send]');
      if (send) send.onclick = () => submit(marks.slice());
      bindClose();
    };
    draw();
  }

  function submit(marks) {
    const st = get();
    const g = kb(st);
    if (!g.cur || g.cur.mine) { route(); return; }
    g.cur.mine = marks;
    sendEvent('game', { g: 'krib', kind: 'kribMarks', r: g.r, marks });
    const view = settle(st, g);
    commit('krib');
    fx('pop');
    if (view) {
      if (view.beide >= 3) confetti(['gameSpark', 'statJoy', 'sparkle']);
      screenResult(view);
    } else {
      screenWait();
    }
  }

  function screenWait() {
    screen = 'wait';
    root.innerHTML = shell(`
      <div class="game-center">
        <div class="game-hero">${icon('lock', { size: 56 })}</div>
        <h2 class="game-h">Verdeckt abgeschickt</h2>
        <p class="game-p">Sobald ${esc(partner)} auch angekreuzt hat, seht ihr gleichzeitig, wo ihr euch trefft.</p>
        <button class="btn btn-ghost btn-block" data-close>Fertig</button>
        ${skipLink()}
      </div>
      ${listTeaser()}`);
    bindClose();
  }

  /* — Auflösung — */
  function screenResult(v) {
    screen = 'result';
    const st = get();
    const bis = st.reunion?.date ? ` bis zum ${dateShort(st.reunion.date)}` : '';
    root.innerHTML = shell(`
      <div class="game-center">
        <div class="game-hero">${icon(v.beide ? 'trophy' : 'gameSpark', { size: 58 })}</div>
        <h2 class="game-h">${v.beide ? `${v.beide}× einig` : 'Diesmal nichts'}</h2>
        <p class="game-p">${esc(verdictFor(v))}<br>
          <span class="tiny muted">+${v.pts} Punkte für euch beide</span></p>
      </div>
      <div class="krib-kopf">
        <span class="grow">Karte</span>
        <span>Du</span><span>${esc(partner).slice(0, 8)}</span>
      </div>
      <div class="krib-reveal">
        ${v.cards.map((text, i) => {
          const m = matchOf(v.mine[i], v.theirs[i]);
          return `<div class="krib-line ${m.level || 'aus'}">
            ${icon(m.level === 'beide' ? 'check' : m.level ? 'nudgeThink' : 'close', { size: 15 })}
            <span class="grow">${esc(text)}</span>
            ${kreuz(v.mine[i])}${kreuz(v.theirs[i])}
          </div>`;
        }).join('')}
      </div>
      <p class="tiny muted center" style="margin:12px 4px 0">
        Ihr seht beide dieselbe Tafel — auch, wo einer Nein gesagt hat.
        Auf die Liste kommt nur, wo keiner Nein gesagt hat.
      </p>
      ${v.treffer.length ? `<p class="tiny muted center" style="margin:6px 4px 0">
        Die Treffer stehen jetzt auf eurer Liste${esc(bis)}.</p>` : ''}
      <button class="btn btn-primary btn-block" data-next style="margin-top:14px">Weiter</button>
      <button class="btn btn-ghost btn-block" data-list>Eure Liste ansehen</button>`);
    root.querySelector('[data-next]').onclick = () => { ack(); route(); };
    const first = root.querySelector('.krib-line.beide');
    if (first) burst(['statJoy'], { from: first, count: 5, rise: 100 });
    bindClose();
  }

  /**
   * Eine Spalte der Auflösung: Ja, Vielleicht oder Nein.
   *
   * Bisher stand da nur, wo ihr euch einig wart — das Interessante fehlte:
   * wo einer Ja und der andere Nein gesagt hat. Genau daraus entsteht das
   * Gespräch danach. Was auf die Liste kommt, ändert sich dadurch nicht.
   */
  function kreuz(v) {
    const m = MARKS.find((x) => x.v === v) || MARKS[2];
    return `<span class="krib-kreuz ${m.cls}" title="${esc(m.label)}">${icon(m.icon, { size: 13 })}</span>`;
  }

  /* — Die gemeinsame Liste — */
  function screenList() {
    screen = 'list';
    const st = get();
    const g = kb(st);
    const bis = st.reunion?.date ? `Bis zum ${dateShort(st.reunion.date)}` : 'Fürs nächste Wiedersehen';
    root.innerHTML = shell(`
      <div class="hue-lead">
        <span class="doodle-kicker">${esc(bis)}</span>
        <b>Eure Liste</b>
      </div>
      ${g.list.length ? `
        <p class="tiny muted center" style="margin:0 0 14px">
          Alles hier haben beide angekreuzt. Antippen, wenn ihr es gemacht habt —
          ${esc(partner)} sieht den Haken auch.
        </p>
        <div class="krib-reveal">
          ${g.list.map((e) => `<button class="krib-line ${e.level} ${e.done ? 'erledigt' : ''}"
            data-tick="${esc(e.text)}">
            ${icon(e.done ? 'check' : e.level === 'beide' ? 'sparkle' : 'nudgeThink', { size: 15 })}
            <span class="grow">${esc(e.text)}</span>
            <span class="krib-tag">${e.done ? 'gemacht' : e.level === 'beide' ? 'beide' : 'vielleicht'}</span>
          </button>`).join('')}
        </div>` : `
        <div class="empty">
          <span class="empty-emoji">${icon('gameSpark', { size: 40 })}</span>
          Noch nichts drauf.<br>Spielt eine Runde, dann füllt sie sich von allein.
        </div>`}
      <button class="btn btn-primary btn-block" data-next style="margin-top:14px">Zurück</button>`);
    root.querySelector('[data-next]').onclick = () => route();
    root.querySelectorAll('[data-tick]').forEach((b) => {
      b.onclick = () => {
        const st2 = get();
        const g2 = kb(st2);
        const e = g2.list.find((x) => x.text === b.dataset.tick);
        if (!e) return;
        e.done = !e.done;
        e.doneAt = e.done ? Date.now() : 0;
        commit('krib');
        sendEvent('game', { g: 'krib', kind: 'kribTick', text: e.text, on: e.done });
        fx(e.done ? 'yay' : 'tap');
        if (e.done) burst(['statJoy'], { from: b, count: 5, rise: 90 });
        screenList();
      };
    });
    bindClose();
  }

  function listTeaser() {
    const g = kb(get());
    if (!g.list.length) return '';
    const beide = g.list.filter((e) => e.level === 'beide').length;
    const fertig = g.list.filter((e) => e.done).length;
    return `<div class="section-label">Eure Liste</div>
      <div class="list">
        <button class="li" data-list>
          <div class="li-ico">${icon('gameSpark', { size: 19 })}</div>
          <div class="grow">
            <div class="li-title">${g.list.length} ${g.list.length === 1 ? 'Wunsch' : 'Wünsche'}</div>
            <div class="li-sub">${beide} davon wollt ihr beide${fertig ? ` · ${fertig} schon gemacht` : ''}</div>
          </div>
          <span class="li-chev">${icon('chevron', { size: 16 })}</span>
        </button>
      </div>`;
  }

  function screenIdle() {
    screen = 'idle';
    root.innerHTML = shell(`
      <div class="game-center">
        <div class="game-hero">${icon('gameSpark', { size: 60 })}</div>
        <h2 class="game-h">${esc(partner)} teilt aus</h2>
        <p class="game-p">Die nächsten sechs Karten kommen von drüben.</p>
        <button class="btn btn-ghost btn-block" data-close>Fertig</button>
      </div>
      ${listTeaser()}`);
    bindClose();
  }

  /** Die Auflösung ist gesehen — beim nächsten Öffnen wieder normal weiter. */
  function ack() {
    const g = kb(get());
    if (g.last && !g.last.seen) { g.last.seen = true; commit('krib'); }
  }

  function route() {
    const g = kb(get());
    if (g.cur && !g.cur.mine) screenMark();
    else if (g.cur) screenWait();
    else if (g.last && !g.last.seen) screenResult(g.last);
    else if (g.turn === 'me') screenDeal();
    else screenIdle();
  }

  route();

  // Kommt der Zug des anderen herein, während man zuschaut, soll der
  // Bildschirm nicht auf „warten“ stehen bleiben. Nur passive Ansichten
  // lösen sich selbst ab — mitten im Ankreuzen wäre das eine Frechheit.
  // subscribe ruft mit (state, reason) auf — der Grund ist das zweite Argument.
  const unsub = subscribe((_, reason) => {
    if (reason !== 'krib' && reason !== 'remote') return;
    if (screen === 'wait' || screen === 'idle') route();
  });
  return () => unsub();
}

/** „2026-09-12“ → „12.9.“ */
function dateShort(iso) {
  const d = new Date(`${iso}T12:00:00`);
  return Number.isNaN(d.getTime()) ? iso : `${d.getDate()}.${d.getMonth() + 1}.`;
}
