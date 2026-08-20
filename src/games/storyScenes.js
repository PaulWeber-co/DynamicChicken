/**
 * „Maskenball" — die Geschichte.
 *
 * Getrennt vom Spiel selbst, weil hier nur Text steht: Rollen, Szenen,
 * Antwortmöglichkeiten und die Stichwörter für die freie Eingabe. Wer eine
 * neue Szene schreiben will, muss die Mechanik nicht anfassen — und wer an
 * der Mechanik schraubt, scrollt nicht durch tausend Zeilen Prosa.
 *
 * Aufbau einer Szene:
 *
 *   ort       Überschrift
 *   text(c)   die Erzählung; `c` ist der Spielstand (Rolle, Flaggen, Namen)
 *   spicy(c)  optionaler Absatz, nur wenn freizügige Inhalte an sind
 *   optionen  was man anklicken kann
 *   frei      Stichwörter für getippte Eingaben → Nummer der Option
 *
 * Eine Option ist entweder ein direkter Übergang (`ziel`) oder eine Probe:
 * zwei Würfel plus ein Wert, 10+ gelingt, 7–9 gelingt mit Haken, 6 und
 * darunter geht schief. Jeder Ausgang hat eigenen Text und eigenes Ziel.
 * Das ist bewusst die einfachste Regel, die es gibt — man versteht sie beim
 * ersten Wurf, und sie erzeugt trotzdem Geschichten mit Kanten.
 */

/** Die vier Rollen. Titel, keine Personen — dann passt jede auf jede. */
export const ROLLEN = [
  {
    id: 'schatten',
    name: 'Schatten',
    kicker: 'Findet jede Tür',
    werte: { list: 3, mut: 1, charme: 1, glueck: 1 },
    ding: 'ein Dietrich, dünn wie eine Feder',
    start: 'Du bist wegen des Schlüssels hier. Sagst du. Sagt man.'
  },
  {
    id: 'zunge',
    name: 'Silberzunge',
    kicker: 'Redet sich überall hinein',
    werte: { charme: 3, list: 1, mut: 1, glueck: 1 },
    ding: 'eine Einladung, auf die ein falscher Name gehört',
    start: 'Eingeladen warst du nie. Gemerkt hat es bis jetzt niemand.'
  },
  {
    id: 'eisen',
    name: 'Eisenhand',
    kicker: 'Steht, wo andere weichen',
    werte: { mut: 3, list: 1, charme: 1, glueck: 1 },
    ding: 'ein Handschuh mit einer Naht, die keine Naht ist',
    start: 'Du hast heute Abend Dienst. Bei wem, sagst du nicht.'
  },
  {
    id: 'feder',
    name: 'Glücksfeder',
    kicker: 'Stolpert in die richtige Tür',
    werte: { glueck: 3, charme: 1, list: 1, mut: 1 },
    ding: 'eine Feder, die schon zweimal dein Leben gerettet hat',
    start: 'Warum du hier bist, weißt du nicht. Das war schon immer dein Vorteil.'
  }
];

export const rolleById = (id) => ROLLEN.find((r) => r.id === id) || ROLLEN[0];

export const WERTE = [
  { id: 'mut', label: 'Mut' },
  { id: 'charme', label: 'Charme' },
  { id: 'list', label: 'List' },
  { id: 'glueck', label: 'Glück' }
];

/** Name der maskierten Gestalt — im Zweifel neutral. */
const wer = (c) => c.fremd || 'die maskierte Gestalt';

export const START = 'tor';

export const SZENEN = {

  /* ── Kapitel 1: hinein ─────────────────────────────── */

  tor: {
    ort: 'Vor dem Federhof',
    kapitel: 1,
    text: (c) => `Der Federhof liegt in Licht wie ein Kuchen in Zuckerguss. Aus dem Saal
      im ersten Stock fällt Musik in den Kies, jemand lacht zu laut, und irgendwo klirrt
      ein Glas, das den Abend nicht überleben wird.

      Am Tor steht eine Frau mit einer Liste. Sie hat den Blick von jemandem, der heute
      schon dreimal Nein gesagt hat und Gefallen daran findet.

      In deiner Tasche: ${c.ding}. Auf deinem Gesicht: eine Maske aus schwarzen Federn.`,
    optionen: [
      {
        t: 'Ihr erzählen, du gehörst zur Kapelle',
        probe: { attr: 'charme' },
        gut: { txt: 'Du summst zwei Takte von dem, was drinnen gerade läuft, und beschwerst dich über den Cellisten. Sie hebt die Absperrung, bevor du fertig bist. „Zweiter Stock, und nehmt dem Mann den Wein weg."', ziel: 'saal', flag: 'ungesehen' },
        teils: { txt: 'Sie glaubt dir halb. „Dann geh hinten herum, durch die Küche. Und wenn dich jemand fragt: nicht von mir."', ziel: 'kueche' },
        schlecht: { txt: 'Sie sieht dich an, als hättest du ihr die Uhrzeit falsch gesagt. „Die Kapelle ist seit sechs da. Alle sieben." Hinter dir räuspert sich jemand.', ziel: 'gedraengel' }
      },
      {
        t: 'Über die Mauer, hinten beim Efeu',
        probe: { attr: 'list' },
        gut: { txt: 'Das Efeu hält. Du landest im weichen Beet, klopfst dir die Erde ab und bist drin, bevor die Frau am Tor ihren nächsten Satz beendet hat.', ziel: 'garten', flag: 'ungesehen' },
        teils: { txt: 'Das Efeu hält — bis auf die letzten zwei Meter. Du landest, aber nicht leise. Im Fenster über dir bewegt sich ein Vorhang.', ziel: 'garten', flag: 'gehoert' },
        schlecht: { txt: 'Efeu ist eine Pflanze, kein Seil. Das lernst du auf halber Höhe. Du landest im Beet, ein Hund bellt, und eine Hand packt deinen Ärmel.', ziel: 'gedraengel' }
      },
      {
        t: 'Einfach hineingehen, als gehörte dir das Haus',
        probe: { attr: 'mut' },
        gut: { txt: 'Du gehst an ihr vorbei, ohne stehen zu bleiben, und nickst ihr zu, als hättest du sie eingestellt. Sie nickt zurück. Menschen tun das.', ziel: 'saal', flag: 'frech' },
        teils: { txt: 'Du kommst durch. Aber sie merkt sich dein Gesicht — beziehungsweise die Federn davor. „Wir sprechen uns noch."', ziel: 'saal', flag: 'gemerkt' },
        schlecht: { txt: 'Ihre Hand liegt auf deiner Brust, bevor dein zweiter Schritt Boden findet. „Name."', ziel: 'gedraengel' }
      }
    ],
    frei: [
      { w: ['kapelle', 'musik', 'musiker', 'cello', 'geige'], i: 0 },
      { w: ['mauer', 'efeu', 'klettern', 'hinten', 'schleich', 'heimlich'], i: 1 },
      { w: ['reingehen', 'hineingehen', 'vorbei', 'durchgehen', 'frech', 'ignorieren'], i: 2 }
    ]
  },

  gedraengel: {
    ort: 'Am Tor, unfreiwillig',
    kapitel: 1,
    text: () => `Sie hält dich am Ärmel, nicht fest, aber deutlich. Hinter ihr drängt eine
      Gruppe in Seide nach vorn, alle maskiert, alle laut, alle in Eile. Für einen Moment
      ist sie mit drei Menschen gleichzeitig beschäftigt.

      Der Moment ist kurz. Er ist trotzdem da.`,
    optionen: [
      {
        t: 'Mit der Gruppe hineinrutschen',
        probe: { attr: 'glueck' },
        gut: { txt: 'Du gehst einfach mit. Jemand hakt sich bei dir unter und erzählt dir von seinem Pferd. Drinnen lässt du ihn stehen, mitten im Satz.', ziel: 'saal' },
        teils: { txt: 'Du kommst mit hinein — aber jemand aus der Gruppe sieht dich an und weiß, dass du nicht dazugehörst. Vorerst sagt er nichts.', ziel: 'saal', flag: 'gemerkt' },
        schlecht: { txt: 'Du trittst jemandem auf die Schleppe. Es reißt. Es wird laut. Am Ende stehst du hinten in der Küche und schälst zur Strafe nichts, aber du stehst da.', ziel: 'kueche' }
      },
      {
        t: 'Ihr die Wahrheit sagen — irgendeine',
        probe: { attr: 'charme', bonus: 1 },
        gut: { txt: '„Ich suche jemanden." Sie schaut dich zum ersten Mal richtig an. „Das tun hier alle." Dann tritt sie zur Seite.', ziel: 'saal', flag: 'gesehen' },
        teils: { txt: '„Ich suche jemanden." — „Dann such schnell." Sie lässt dich durch und behält dich im Auge.', ziel: 'saal', flag: 'gemerkt' },
        schlecht: { txt: 'Was du sagst, klingt selbst für dich nach einer Ausrede. Sie zeigt zum Hintereingang. „Küche. Und wenn ich dich oben sehe, sehe ich dich zweimal."', ziel: 'kueche' }
      }
    ],
    frei: [
      { w: ['gruppe', 'mitgehen', 'seide', 'gedränge', 'drängeln', 'mischen'], i: 0 },
      { w: ['wahrheit', 'ehrlich', 'sagen', 'suchen', 'reden'], i: 1 }
    ]
  },

  kueche: {
    ort: 'In der Küche',
    kapitel: 1,
    text: () => `Dampf, Butter, ein Koch, der niemanden ansieht, und zwölf Menschen, die
      alle gleichzeitig etwas tragen. Auf einem Blech kühlen kleine Törtchen aus, die
      aussehen, als wären sie zu schade zum Essen. Neben der Tür hängen Schürzen und ein
      Tablett wartet auf jemanden, der es hochträgt.

      Niemand fragt, wer du bist. Alle fragen sich nur, ob du im Weg stehst.`,
    optionen: [
      {
        t: 'Tablett nehmen und hochgehen',
        ziel: 'saal',
        txt: 'Ein Tablett ist der beste Ausweis der Welt. Du gehst durch drei Türen und zwei Blicke, und keiner davon hält dich auf.',
        flag: 'tablett'
      },
      {
        t: 'Dem Koch zuhören, während er flucht',
        probe: { attr: 'list' },
        gut: { txt: 'Er flucht über den Hausherrn, über das Turmzimmer, das seit Wochen abgeschlossen ist, und über den Schlüssel, den angeblich niemand hat. Du merkst dir jedes Wort.', ziel: 'saal', flag: 'geruecht' },
        teils: { txt: 'Du schnappst nur Fetzen auf: Turmzimmer, Schlüssel, „und der Gast, den keiner kennt". Immerhin.', ziel: 'saal', flag: 'geruecht' },
        schlecht: { txt: 'Er merkt, dass du zuhörst, statt zu arbeiten, und drückt dir eine Suppenschüssel in die Hand. Du trägst sie nach oben. Immerhin bist du oben.', ziel: 'saal' }
      },
      {
        t: 'Ein Törtchen stehlen',
        probe: { attr: 'glueck', bonus: 1 },
        gut: { txt: 'Es ist Pistazie, es ist zu süß, und es ist das Beste, was dir heute passiert. Du nimmst noch eins für später.', ziel: 'saal', flag: 'toertchen' },
        teils: { txt: 'Du erwischst eins. Der Koch dreht sich um. Ihr seht euch an. Er sagt nichts, aber er zählt jetzt mit.', ziel: 'saal', flag: 'toertchen' },
        schlecht: { txt: 'Das Blech kippt. Zwölf Törtchen sterben. Der Koch sieht dich an mit einem Blick, den du nie wieder loswirst, und schiebt dich zur Treppe. „Raus."', ziel: 'saal' }
      }
    ],
    frei: [
      { w: ['tablett', 'tragen', 'servieren', 'kellner', 'schürze'], i: 0 },
      { w: ['koch', 'zuhören', 'lauschen', 'horchen', 'gespräch'], i: 1 },
      { w: ['törtchen', 'essen', 'stehlen', 'kuchen', 'naschen', 'hunger'], i: 2 }
    ]
  },

  /* ── Kapitel 2: der Saal ───────────────────────────── */

  saal: {
    ort: 'Der große Saal',
    kapitel: 2,
    text: (c) => `Hundert Masken, und hinter jeder jemand, der so tut, als wüsste er, was
      hier eigentlich gefeiert wird. Kerzen in drei Etagen, ein Boden, der glänzt wie ein
      Versprechen, und Musik, die zu schnell ist für die Leute, die dazu tanzen.

      Und dann, am anderen Ende, unter dem großen Fenster: eine Gestalt in einer Maske
      aus weißen Federn. Vollkommen still, während alles andere sich dreht. Der Blick liegt
      auf dir. Und liegt da schon eine Weile.

      ${c.flags.includes('geruecht') ? 'In deinem Kopf: Turmzimmer. Schlüssel. Der Gast, den keiner kennt.' : ''}`,
    optionen: [
      {
        t: 'Quer durch den Saal, direkt darauf zu',
        probe: { attr: 'mut' },
        gut: { txt: 'Du gehst los, und der Saal macht Platz, als hättest du das abgesprochen. Zwei Schritte vor der weißen Maske bleibst du stehen. Eine Hand hebt sich, bevor du etwas sagen kannst.', ziel: 'tanz', flag: 'direkt' },
        teils: { txt: 'Du kommst durch, aber nicht elegant: ein Ellbogen, ein verschütteter Wein, ein böser Blick. Als du ankommst, kommt hinter der weißen Maske ein leises Lachen. „Beeindruckend."', ziel: 'tanz' },
        schlecht: { txt: 'Auf halbem Weg tritt jemand in deinen Weg und will unbedingt über Pferde reden. Als du dich losgemacht hast, ist das Fenster leer.', ziel: 'buffet', flag: 'verloren' }
      },
      { t: 'Erst umhören — wer feiert hier eigentlich?', ziel: 'buffet' },
      {
        t: 'Die Tür neben dem Fenster, die niemand benutzt',
        probe: { attr: 'list', bonus: 1 },
        gut: { txt: 'Du bist durch, bevor jemand hinsieht. Dahinter: eine Bibliothek, still wie ein angehaltener Atem.', ziel: 'bibliothek', flag: 'ungesehen' },
        teils: { txt: 'Die Tür quietscht. Drinnen ist niemand — draußen dreht sich jemand um. Du hast vielleicht eine Minute.', ziel: 'bibliothek' },
        schlecht: { txt: 'Abgeschlossen. Und jemand hat gesehen, dass du es versucht hast. Du gehst betont langsam zum Buffet.', ziel: 'buffet', flag: 'gemerkt' }
      }
    ],
    frei: [
      { w: ['gestalt', 'maske', 'weiß', 'hingehen', 'zugehen', 'ansprechen', 'fenster'], i: 0 },
      { w: ['umhören', 'buffet', 'trinken', 'essen', 'leute', 'reden', 'warten'], i: 1 },
      { w: ['tür', 'bibliothek', 'raus', 'schleich', 'heimlich', 'erkunden'], i: 2 }
    ]
  },

  buffet: {
    ort: 'Am Buffet',
    kapitel: 2,
    text: (c) => `Austern, die niemand anfasst, und Käse, der schneller weg ist, als er
      nachkommt. Zwei Masken neben dir reden, ohne dich zu bemerken.

      „…seit dem Frühjahr ist der Turm zu."
      „Und der Schlüssel?"
      „Es gibt keinen Schlüssel. Es gibt nur jemanden, der behauptet, einen zu haben."

      Am Fenster: ${wer(c)} hat sich nicht bewegt. Nur der Kopf ist jetzt ein wenig geneigt.`,
    optionen: [
      {
        t: 'Nachfragen, ganz beiläufig',
        probe: { attr: 'charme' },
        gut: { txt: 'Du sagst etwas Belangloses über Austern, und zehn Sekunden später erzählen sie dir alles: der Turm, der Streit, die Tür, die von innen verriegelt ist. Und dass heute Abend jemand hier ist, der nicht auf der Liste steht.', ziel: 'saal2', flag: 'geheimnis' },
        teils: { txt: 'Sie erzählen dir die Hälfte und werden dann misstrauisch. Die Hälfte reicht: Der Turm ist von innen zu.', ziel: 'saal2', flag: 'geruecht' },
        schlecht: { txt: '„Und wer sind Sie?" Sie mustern dich, bis du keine Lust mehr hast. Du nimmst ein Glas und gehst.', ziel: 'saal2', flag: 'gemerkt' }
      },
      { t: 'Nichts sagen, nur zuhören und weitergehen', ziel: 'saal2', txt: 'Du bleibst genau so lange, wie es unauffällig ist, und gehst dann. Man erfährt mehr, wenn man nicht fragt.', flag: 'geruecht' },
      {
        t: 'Zwei Gläser nehmen und zum Fenster gehen',
        ziel: 'tanz',
        txt: 'Du nimmst zwei Gläser vom Tablett. Eines davon ist eine Frage, und du trägst sie quer durch den Saal.',
        flag: 'glaeser'
      }
    ],
    frei: [
      { w: ['fragen', 'nachfragen', 'reden', 'ansprechen', 'gespräch'], i: 0 },
      { w: ['zuhören', 'lauschen', 'warten', 'nichts', 'weitergehen'], i: 1 },
      { w: ['glas', 'gläser', 'wein', 'sekt', 'fenster', 'gestalt', 'hingehen'], i: 2 }
    ]
  },

  saal2: {
    ort: 'Zurück im Saal',
    kapitel: 2,
    text: (c) => `Die Musik ist langsamer geworden. Paare finden sich, andere lösen sich
      auf. Am Fenster steht ${wer(c)} immer noch — und hebt jetzt eine Hand. Nicht
      winkend. Eher so, wie man jemandem eine Tür aufhält.`,
    optionen: [
      { t: 'Die Hand nehmen', ziel: 'tanz', txt: 'Du gehst hin. Die Hand ist warm und ein bisschen unsicher, was dir gefällt.' },
      { t: 'Erst in die Bibliothek, dann zurück', ziel: 'bibliothek', txt: 'Du hebst einen Finger — gleich — und verschwindest durch die schmale Tür.' },
      {
        t: 'Stehen bleiben und abwarten, wer zuerst geht',
        probe: { attr: 'mut' },
        gut: { txt: 'Ihr seht euch quer durch den Saal an, viel zu lange, bis es fast unhöflich wird. Dann ein Lachen hinter der weißen Maske — man sieht es an den Augen — und der Weg zu dir.', ziel: 'tanz', flag: 'direkt' },
        teils: { txt: 'Du hältst länger durch, als angenehm ist. Am Ende geht ihr gleichzeitig los und stoßt in der Mitte fast zusammen.', ziel: 'tanz' },
        schlecht: { txt: 'Du zögerst eine Sekunde zu lang. Jemand anderes ist schneller und führt die weiße Maske auf die Tanzfläche. Von hinten sieht das furchtbar aus.', ziel: 'garten', flag: 'eifersucht' }
      }
    ],
    frei: [
      { w: ['hand', 'nehmen', 'hingehen', 'tanz', 'tanzen'], i: 0 },
      { w: ['bibliothek', 'tür', 'bücher', 'erkunden'], i: 1 },
      { w: ['warten', 'stehen', 'abwarten', 'anschauen', 'ansehen'], i: 2 }
    ]
  },

  bibliothek: {
    ort: 'Die Bibliothek',
    kapitel: 2,
    text: (c) => `Zweitausend Bücher und ein einziger Sessel — jemand hier mag Menschen
      nicht besonders. Auf dem Schreibtisch liegt ein Brief, halb geschrieben, die Tinte
      noch nicht ganz trocken. Daneben ein Schlüssel an einem roten Band.

      Von draußen: Musik, gedämpft, wie durch Watte.
      ${c.rolle === 'schatten' ? 'Die Schublade darunter hat ein Schloss, das dich beleidigt.' : ''}`,
    optionen: [
      {
        t: 'Den Brief lesen',
        probe: { attr: 'list' },
        gut: { txt: '„…und wenn Du heute Abend kommst, komm nicht als Du. Die weiße Maske. Ich warte oben, sobald die Uhr zwölf schlägt. Wenn Du nicht kommst, verstehe ich das." Kein Name. Beide Male nicht.', ziel: 'saal2', flag: 'brief' },
        teils: { txt: 'Du liest die erste Hälfte, dann knarrt der Boden hinter dir. Genug für ein Wort: „…die weiße Maske…"', ziel: 'saal2', flag: 'brief' },
        schlecht: { txt: 'Du wirfst die Tinte um. Der halbe Brief ist jetzt eine blaue Wolke. Du legst ihn hin und gehst, als wäre nichts.', ziel: 'saal2' }
      },
      {
        t: 'Den Schlüssel einstecken',
        probe: { attr: 'glueck' },
        gut: { txt: 'Er ist schwerer, als er aussieht, und warm, als hätte ihn eben noch jemand in der Hand gehabt. Du steckst ihn ein.', ziel: 'saal2', flag: 'schluessel' },
        teils: { txt: 'Du hast ihn — und das rote Band hat sich in der Tischkante verhakt und einen Kratzer hinterlassen, den man sieht.', ziel: 'saal2', flag: 'schluessel' },
        schlecht: { txt: 'Beim Zugreifen fällt die Lampe. Du bist schneller draußen als das Geräusch, aber der Schlüssel bleibt liegen.', ziel: 'saal2', flag: 'gemerkt' }
      },
      { t: 'Nichts anfassen und zurückgehen', ziel: 'saal2', txt: 'Manche Zimmer erzählen mehr, wenn man sie so lässt, wie man sie gefunden hat. Du gehst zurück in die Musik.' }
    ],
    frei: [
      { w: ['brief', 'lesen', 'schreiben', 'tinte', 'zettel'], i: 0 },
      { w: ['schlüssel', 'band', 'nehmen', 'einstecken', 'mitnehmen'], i: 1 },
      { w: ['zurück', 'gehen', 'nichts', 'lassen', 'raus'], i: 2 }
    ]
  },

  /* ── Kapitel 3: näher ──────────────────────────────── */

  tanz: {
    ort: 'Auf der Tanzfläche',
    kapitel: 3,
    text: (c) => `Aus der Nähe ist die weiße Maske nicht weiß, sondern perlmutt, und die
      Augen dahinter sind unverschämt wach. ${wer(c)} legt eine Hand auf deine Schulter,
      und der Rest des Saals wird eine Tapete.

      „Du bist nicht auf der Liste", kommt es leise. Es klingt nicht wie ein Vorwurf.
      Es klingt wie etwas, das da jemand über sich selbst weiß.`,
    spicy: () => `Zwischen zwei Drehungen ist ein Mund kurz an deinem Ohr, und was dort
      gesagt wird, ist nicht für den Saal bestimmt.`,
    optionen: [
      {
        t: '„Du auch nicht."',
        probe: { attr: 'charme', bonus: 1 },
        gut: { txt: 'Ein Lachen — richtig, nicht höflich — und eine Drehung näher heran, als der Tanz verlangt. „Nein. Ich auch nicht."', ziel: 'garten', flag: 'funke' },
        teils: { txt: 'Der Tanz stockt kurz. „Woher weißt du das?" Die Frage ist echt, und sie ist nicht ganz freundlich.', ziel: 'garten' },
        schlecht: { txt: 'Der Satz kommt schärfer heraus als gedacht. Ein halber Schritt zurück, und der halbe Schritt ist eine ganze Wand.', ziel: 'garten', flag: 'kuehl' }
      },
      {
        t: 'Nichts sagen und weitertanzen',
        probe: { attr: 'mut' },
        gut: { txt: 'Du sagst nichts, und das ist die beste Antwort, die du heute Abend gibst. Nach drei Takten liegt eine Stirn kurz an deiner Schläfe.', ziel: 'garten', flag: 'funke' },
        teils: { txt: 'Ihr tanzt schweigend. Es ist schön und ein bisschen zäh, wie ein Gespräch, das keiner anfangen will.', ziel: 'garten' },
        schlecht: { txt: 'Dein Schweigen kommt als Desinteresse an. Der Tanz geht weiter, aber die Hand liegt jetzt nur noch auf deiner Schulter, nicht mehr darauf.', ziel: 'garten', flag: 'kuehl' }
      },
      { t: '„Zeigst du mir den Garten?"', ziel: 'garten', txt: 'Ein Blick zur Terrassentür, dann wieder zu dir. „Geh vor. Ich komme nach, wenn keiner hinsieht."', flag: 'funke' }
    ],
    frei: [
      { w: ['auch nicht', 'du auch', 'antworten', 'kontern', 'frech'], i: 0 },
      { w: ['schweigen', 'nichts', 'tanzen', 'weiter'], i: 1 },
      { w: ['garten', 'raus', 'draußen', 'terrasse', 'luft', 'frage'], i: 2 }
    ]
  },

  garten: {
    ort: 'Im Garten',
    kapitel: 3,
    text: (c) => `Kies, Buchsbaum, ein Brunnen, der seit Jahren dasselbe Geräusch macht.
      Die Musik hängt jetzt in den Bäumen statt in den Ohren. Es ist kühler, als du
      gedacht hast, und der Himmel ist unverschämt klar.

      ${c.flags.includes('kuehl')
        ? `${wer(c)} kommt trotzdem nach. Mit Abstand, aber es kommt jemand.`
        : c.flags.includes('eifersucht')
          ? 'Du bist allein hier draußen. Drinnen dreht sich jemand mit jemand anderem, und du hast dich selbst dazu entschieden, das nicht anzusehen.'
          : `${wer(c)} steht am Brunnen, die Maske ein Stück hochgeschoben. Nicht ganz. Genug, dass man den Mund sieht.`}`,
    spicy: (c) => c.flags.includes('kuehl') ? '' : `Auf dem Brunnenrand sitzt es sich anders
      als im Saal: ein Bein angezogen, der Stoff verrutscht, und niemand richtet ihn.`,
    optionen: [
      {
        t: 'Die eigene Maske abnehmen',
        probe: { attr: 'mut' },
        gut: { txt: 'Du nimmst die Federn ab und hältst sie in der Hand wie etwas, das dir nicht mehr gehört. Ein langer Blick. Dann wandert auch die weiße Maske ganz nach oben.', ziel: 'brunnen', flag: 'maske_ab' },
        teils: { txt: 'Du nimmst deine ab. Die weiße bleibt. „Noch nicht. Bitte." Und weil das Wort „bitte" darin vorkommt, ist es in Ordnung.', ziel: 'brunnen', flag: 'maske_ab' },
        schlecht: { txt: 'Du fasst an die Schnur und lässt sie wieder los. Vielleicht später. Der Moment weiß, dass du gekniffen hast.', ziel: 'brunnen' }
      },
      {
        t: 'Fragen, wen der Abend eigentlich meint',
        probe: { attr: 'list' },
        gut: { txt: '„Jemanden, der mir einmal etwas versprochen hat und dann fünf Jahre lang nichts." Der Blick geht auf zwei Hände im Schoß. „Und heute steht auf einer Karte: Federhof, Mitternacht, weiße Maske."', ziel: 'brunnen', flag: 'geheimnis' },
        teils: { txt: '„Jemanden." Mehr kommt nicht, aber es kommt so, dass du weißt: Es ist wichtig.', ziel: 'brunnen' },
        schlecht: { txt: 'Die Frage ist zu direkt. Ein paar Schritte in Richtung Haus. Nicht weit. Aber weg.', ziel: 'brunnen', flag: 'kuehl' }
      },
      { t: 'Einfach nebeneinander sitzen und nichts sagen', ziel: 'brunnen', txt: 'Ihr sitzt auf dem Brunnenrand. Der Kies knirscht, wenn einer von euch das Bein bewegt. Es passiert nichts, und es ist trotzdem etwas.', flag: 'ruhig' }
    ],
    frei: [
      { w: ['maske', 'abnehmen', 'gesicht', 'zeigen', 'ehrlich'], i: 0 },
      { w: ['fragen', 'wer', 'suchen', 'wen', 'name', 'reden'], i: 1 },
      { w: ['sitzen', 'schweigen', 'nichts', 'warten', 'ruhe', 'brunnen'], i: 2 }
    ]
  },

  brunnen: {
    ort: 'Am Brunnen',
    kapitel: 3,
    text: (c) => `Irgendwo im Haus schlägt eine Uhr. Nicht zwölf. Noch nicht.

      ${c.flags.includes('brief') || c.flags.includes('geheimnis')
        ? 'Du weißt jetzt, worauf hier gewartet wird, und dass es um Mitternacht oben stattfindet.'
        : 'Immer wieder geht ein Blick zum Turm hinauf, und jedes Mal in der Annahme, du merkst es nicht.'}

      Aus der Terrassentür fällt Licht. Jemand steht darin und sieht in den Garten.`,
    spicy: (c) => c.flags.includes('kuehl') ? '' : `Eine Hand liegt neben deiner auf dem
      kalten Stein, und der Abstand dazwischen ist inzwischen eine Entscheidung, keine
      Entfernung.`,
    optionen: [
      {
        t: 'Küssen',
        wennNicht: 'kuehl',
        probe: { attr: 'mut' },
        gut: { txt: 'Du beugst dich vor, und dir kommt jemand entgegen, bevor du auf halbem Weg bist. Der Kuss schmeckt nach kaltem Stein und warmem Wein und dauert länger, als eine Person in der Terrassentür für angemessen hält.', ziel: 'treppe', flag: 'kuss' },
        teils: { txt: 'Du beugst dich vor. Zwei Finger legen sich auf deinen Mund. „Oben. Nicht hier, wo alle gucken." Das ist kein Nein.', ziel: 'treppe', flag: 'versprechen' },
        schlecht: { txt: 'Du triffst die Maske. Es macht ein Geräusch, das kein Kuss machen sollte. Ihr lacht beide, aber der Moment ist vorbei.', ziel: 'treppe' }
      },
      {
        t: 'Vom Turm anfangen',
        probe: { attr: 'charme' },
        gut: { txt: '„Du weißt davon?" Eine Hand greift nach deinem Handgelenk. „Dann komm mit. Ich schaffe die Tür nicht allein."', ziel: 'treppe', flag: 'verbuendet' },
        teils: { txt: 'Stille. „Woher weißt du das?" Dann, nach einer Pause: „Egal. Komm mit."', ziel: 'treppe', flag: 'verbuendet' },
        schlecht: { txt: 'Du sagst es zu laut. Die Person in der Terrassentür kommt zwei Schritte näher.', ziel: 'treppe', flag: 'gemerkt' }
      },
      { t: 'Aufstehen und hineingehen — die Uhr läuft', ziel: 'treppe', txt: 'Du stehst auf und hältst deine Hand hin. Sie wird angesehen, als wäre eine ausgestreckte Hand etwas Seltenes. Dann wird sie genommen.' }
    ],
    frei: [
      { w: ['kuss', 'küssen', 'küss', 'mund', 'lippen'], i: 0 },
      { w: ['turm', 'oben', 'zimmer', 'schlüssel', 'mitternacht'], i: 1 },
      { w: ['aufstehen', 'gehen', 'rein', 'hinein', 'hand', 'treppe'], i: 2 }
    ]
  },

  /* ── Kapitel 4: hinauf ─────────────────────────────── */

  treppe: {
    ort: 'Am Fuß der Turmtreppe',
    kapitel: 4,
    text: (c) => `Die Treppe windet sich nach oben und wird mit jeder Stufe schmaler. Unten
      steht die Frau vom Tor. Sie hat die Liste nicht mehr dabei, dafür einen Blick, der
      alles ersetzt.

      „Da oben ist nichts", sagt sie. „Und das soll auch so bleiben."

      ${c.flags.includes('schluessel') ? 'In deiner Tasche liegt der Schlüssel mit dem roten Band und wird warm.' : ''}
      ${c.flags.includes('gemerkt') ? 'Sie sieht dich an, als hätte sie auf genau diesen Moment gewartet. Hat sie vermutlich.' : ''}`,
    optionen: [
      {
        t: 'Sie überreden',
        probe: { attr: 'charme', mit: { gemerkt: -1 } },
        gut: { txt: '„Es ist Mitternacht, es ist ein Maskenball, und Sie stehen hier unten und passen auf eine leere Treppe auf." Sie hält deinen Blick fünf Sekunden. Dann tritt sie zur Seite. „Wenn was kaputtgeht, wart ihr nicht hier."', ziel: 'turm' },
        teils: { txt: 'Sie lässt euch durch — aber nur eine Person. Ihr seht euch an. Ein Nicken zu dir: geh.', ziel: 'turm', flag: 'allein' },
        schlecht: { txt: '„Nein." Ein Wort, kein Spielraum. Hinter ihr geht die Uhr weiter.', ziel: 'treppe2' }
      },
      {
        t: 'An ihr vorbei, einfach so',
        probe: { attr: 'mut', mit: { gemerkt: -1 } },
        gut: { txt: 'Du gehst. Sie greift zu, du bist schneller, und ab der vierten Stufe folgt sie nicht mehr. Manche Leute geben auf, wenn man nicht stehen bleibt.', ziel: 'turm', flag: 'frech' },
        teils: { txt: 'Du kommst durch, aber sie hat deinen Ärmel und ein Stück Stoff. Oben wird jemand von einem zerrissenen Ärmel erfahren.', ziel: 'turm', flag: 'gemerkt' },
        schlecht: { txt: 'Sie ist schneller, als sie aussieht. Du landest unsanft auf der untersten Stufe.', ziel: 'treppe2' }
      },
      {
        t: 'Ablenken lassen — irgendwas muss doch runterfallen',
        probe: { attr: 'list' },
        gut: { txt: 'Zwei Räume weiter fällt etwas Schweres um. Es war nicht deine Schuld, aber es war deine Idee. Sie ist weg, ehe der Nachhall verklungen ist.', ziel: 'turm', flag: 'ungesehen' },
        teils: { txt: 'Es klappt, aber nur halb: Sie geht drei Schritte, dreht sich noch einmal um — und ihr seid schon zwei Stufen zu weit oben, um zurückzugehen.', ziel: 'turm' },
        schlecht: { txt: 'Dein Ablenkungsmanöver lenkt vor allem sie auf dich. „Netter Versuch."', ziel: 'treppe2' }
      }
    ],
    frei: [
      { w: ['überreden', 'reden', 'bitten', 'erklären', 'charme'], i: 0 },
      { w: ['vorbei', 'durch', 'rennen', 'schieben', 'drängeln', 'hoch'], i: 1 },
      { w: ['ablenken', 'lärm', 'werfen', 'trick', 'list'], i: 2 }
    ]
  },

  treppe2: {
    ort: 'Unten, mit weniger Zeit',
    kapitel: 4,
    text: (c) => `Die Uhr schlägt. Einmal. Zweimal. ${wer(c)} sieht dich an, und in diesem
      Blick liegt zum ersten Mal Angst, dass es nicht klappt.

      Neben der Treppe: ein Fenster, dahinter das Vordach über der Terrasse. Es sieht
      begehbar aus. Es sieht auch nach einem gebrochenen Knöchel aus.`,
    optionen: [
      {
        t: 'Über das Vordach',
        probe: { attr: 'glueck' },
        gut: { txt: 'Das Blech hält, der Wind ist freundlich, und das Turmfenster ist nur angelehnt. Ihr steigt hinein wie zwei Leute, die genau das geübt haben.', ziel: 'turm', flag: 'dach' },
        teils: { txt: 'Ihr kommt an — mit Dreck, einem verdrehten Fuß und einer Dachrinne, die jetzt anders aussieht als vorher.', ziel: 'turm', flag: 'dach' },
        schlecht: { txt: 'Das Blech gibt nach. Ihr landet im Buchsbaum, unverletzt, laut und gesehen.', ziel: 'ende_erwischt' }
      },
      {
        t: 'Warten, bis sie geht — sie muss irgendwann',
        probe: { attr: 'list' },
        gut: { txt: 'Ihr wartet in einer Nische, dicht nebeneinander, und irgendwann ruft jemand nach ihr. Ihr seid oben, bevor der zwölfte Schlag verklungen ist.', ziel: 'turm' },
        teils: { txt: 'Sie geht. Ihr geht auch. Aber die Uhr hat schon zwölf geschlagen, und oben ist es still.', ziel: 'turm', flag: 'spaet' },
        schlecht: { txt: 'Sie geht nicht. Sie setzt sich auf die unterste Stufe und sieht euch beim Warten zu.', ziel: 'ende_erwischt' }
      }
    ],
    frei: [
      { w: ['dach', 'fenster', 'vordach', 'klettern', 'außen'], i: 0 },
      { w: ['warten', 'verstecken', 'nische', 'abwarten', 'geduld'], i: 1 }
    ]
  },

  /* ── Kapitel 5: oben ───────────────────────────────── */

  turm: {
    ort: 'Das Turmzimmer',
    kapitel: 5,
    text: (c) => `Ein rundes Zimmer, drei Kerzen, ein Fenster ohne Vorhang und die halbe
      Stadt darunter wie verschüttetes Licht. Auf dem Tisch: zwei Gläser, schon
      eingeschenkt. Jemand hat gewusst, dass zwei Leute kommen.

      ${c.flags.includes('spaet')
        ? 'Es ist nach zwölf. Auf dem Tisch liegt außerdem ein Zettel, und die Schrift darauf kennst du inzwischen.'
        : 'Die Uhr schlägt gerade den letzten Schlag.'}

      ${wer(c)} schließt die Tür hinter euch und lehnt sich dagegen.
      „So. Jetzt du zuerst."`,
    spicy: () => `Der Riegel geht ein, ohne dass jemand hinsieht, und das Geräusch ist
      lauter, als ein Riegel sein müsste.`,
    optionen: [
      {
        t: 'Die Maske abnehmen und den eigenen Namen sagen',
        probe: { attr: 'mut', bonus: 1 },
        gut: { txt: 'Du nimmst die Federn ab und sagst deinen Namen, und es ist erstaunlich, wie schwer drei Silben sein können. Es wird zugehört, bis du fertig bist. Dann fällt auch die weiße Maske.', ziel: 'ende_beide', flag: 'maske_ab' },
        teils: { txt: 'Du nimmst die Maske ab. Der Name bleibt dir im Hals stecken. Trotzdem kommt ein Nicken, als wäre er angekommen.', ziel: 'ende_kuss', flag: 'maske_ab' },
        schlecht: { txt: 'Deine Hand bleibt auf halbem Weg zur Schnur stehen. Das bleibt nicht unbemerkt. „Schon gut", leise. „Ein andermal."', ziel: 'ende_geheimnis' }
      },
      {
        t: 'Zuerst wissen wollen, wer da unter der Maske steckt',
        probe: { attr: 'list' },
        gut: { txt: 'Und du bekommst sie: die ganze Geschichte, das Versprechen, die fünf Jahre, die Karte mit dem Federhof. Und am Ende, fast nebenbei, einen Namen.', ziel: 'ende_geheimnis', flag: 'geheimnis' },
        teils: { txt: 'Du bekommst die halbe Geschichte und den halben Namen. Den Rest gibt es beim nächsten Mal, heißt es. Es klingt wie ein Termin.', ziel: 'ende_geheimnis' },
        schlecht: { txt: '„Immer die gleiche Frage." Es wird nachgeschenkt. „Trink erst mal."', ziel: 'ende_kuss' }
      },
      {
        t: 'Nichts sagen und die zwei Schritte gehen',
        wennNicht: 'kuehl',
        probe: { attr: 'charme', bonus: 1 },
        gut: { txt: 'Zwei Schritte sind nicht weit. Du gehst sie trotzdem langsam, weil es sich lohnt. Bis du da bist, wird gewartet — und dann nicht mehr.', ziel: 'ende_kuss', flag: 'kuss' },
        teils: { txt: 'Du gehst hin. Eine Hand auf deiner Brust — halb Halt, halb Aufhalten — und ein tiefer Atemzug. „Langsam."', ziel: 'ende_kuss', flag: 'kuss' },
        schlecht: { txt: 'Du bleibst nach dem ersten Schritt stehen. Der zweite kommt nicht. Ihr steht euch gegenüber wie zwei Leute vor einer Tür, die keiner aufmacht.', ziel: 'ende_geheimnis' }
      }
    ],
    frei: [
      { w: ['maske', 'abnehmen', 'name', 'sagen', 'gesicht', 'ehrlich'], i: 0 },
      { w: ['wer', 'fragen', 'wissen', 'geschichte', 'erzähl'], i: 1 },
      { w: ['kuss', 'küssen', 'hingehen', 'schritte', 'nähe', 'anfassen', 'berühren'], i: 2 }
    ]
  },

  /* ── Enden ─────────────────────────────────────────── */

  ende_beide: {
    ort: 'Ende: Zwei Gesichter',
    ende: true,
    titel: 'Zwei Gesichter',
    text: (c) => `Zwei Masken liegen auf dem Tisch neben zwei vollen Gläsern, und keiner
      von euch trinkt.

      Es stellt sich heraus: Ihr habt euch beide unter falschem Namen angemeldet, beide
      aus demselben Grund, und beide viel zu lange gebraucht. Unten geht das Fest weiter
      und wird euch nicht vermissen.

      Irgendwann, viel später, kommt von ${wer(c)}: „Nächstes Jahr wieder?"
      Und du sagst etwas, das du dir gemerkt hast, seit du fünfzehn bist und es nie
      brauchen konntest.`,
    spicy: () => `Die Kerzen halten länger durch als eure guten Absichten. Das Fenster
      bleibt offen, weil es irgendwann zu warm wird im Zimmer, und die halbe Stadt unter
      euch merkt nichts davon.`
  },

  ende_kuss: {
    ort: 'Ende: Mitternacht',
    ende: true,
    titel: 'Mitternacht',
    text: (c) => `Die Uhr hat ausgeschlagen, und niemand hat mitgezählt.

      Du weißt immer noch nicht, wer ${wer(c)} ist. Du weißt, wie sich eine Hand anfühlt,
      die sich entschieden hat, und dass da jemand beim Lachen die Augen zumacht. Für einen
      Abend ist das viel.

      Am Morgen liegt auf deinem Kissen eine weiße Feder und darunter ein Zettel mit einem
      Datum. Kein Name. Wieder nicht.`,
    spicy: () => `Was zwischen dem letzten Schlag und dem ersten Licht passiert, steht in
      keiner Gästeliste. Die Feder auf dem Kissen ist ein Andenken an eine Nacht, die
      niemand protokolliert hat, und der Zettel darunter ist eine Ankündigung.`
  },

  ende_geheimnis: {
    ort: 'Ende: Der Brief',
    ende: true,
    titel: 'Der Brief',
    text: (c) => `Ihr redet, bis die Kerzen zu Pfützen geworden sind.

      Du erfährst, wem der Federhof gehört, warum der Turm zu war und wen ${wer(c)} hier
      wirklich gesucht hat. Es ist eine bessere Geschichte, als du erwartet hast, und sie
      endet nicht heute Nacht.

      Als du gehst, bekommst du den halb geschriebenen Brief aus der Bibliothek zugesteckt.
      Der zweite Teil, heißt es, sei jetzt deine Aufgabe.`
  },

  ende_erwischt: {
    ort: 'Ende: Vor die Tür',
    ende: true,
    titel: 'Vor die Tür',
    text: (c) => `Der Kies vor dem Federhof ist unangenehm bekannt, wenn man von der
      falschen Seite darauf steht.

      Man hat euch zusammen hinausgesetzt, was insofern ein Erfolg ist, als das
      „zusammen" darin vorkommt. Hinter euch geht das Fest weiter, über euch ist der
      Turm dunkel, und ${wer(c)} zieht die Maske vom Gesicht und lacht so laut, dass es
      im Hof widerhallt.

      „Nächstes Jahr gehen wir gleich über das Dach."`
  }
};

/**
 * Was zurückkommt, wenn getippter Text zu nichts passt.
 *
 * Nicht „Das verstehe ich nicht" — das würde die Geschichte sofort zu einem
 * Formular machen. Stattdessen bleibt der Ton erhalten, und die Szene steht
 * danach immer noch bereit.
 */
export const UNKLAR = [
  'Du versuchst es. Es passiert nichts, was der Rede wert wäre — außer, dass eine Kerze weiterbrennt.',
  'Der Gedanke ist gut. Der Abend hat gerade andere Pläne.',
  'Du setzt an und lässt es dann. Manche Sätze sind besser ungesagt, und dieser hier wusste das.',
  'Nichts. Ein Windzug, ein Geräusch aus einem anderen Zimmer, sonst nichts.',
  'Du tust es, und niemand bemerkt es. Es fühlt sich trotzdem an, als hättest du etwas entschieden.',
  'Für einen Moment sieht es so aus, als würde daraus etwas. Dann doch nicht.'
];

/** Kurzfassung fürs Verschicken und für die Chronik. */
export function endeSatz(endeId, rolleId) {
  const r = rolleById(rolleId).name;
  switch (endeId) {
    case 'ende_beide': return `${r}: beide Masken sind gefallen.`;
    case 'ende_kuss': return `${r}: eine Nacht, kein Name.`;
    case 'ende_geheimnis': return `${r}: die ganze Geschichte, aber kein Kuss.`;
    case 'ende_erwischt': return `${r}: gemeinsam vor die Tür gesetzt.`;
    default: return `${r}: der Abend ist vorbei.`;
  }
}
