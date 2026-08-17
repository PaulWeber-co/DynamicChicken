# Knuddl — Dynamic Chicken

Ein dickes gelbes Huhn, das gefüttert werden will und einen Zwilling bei dem
Menschen hat, den du vermisst.

Pou trifft Fernbeziehung: pflegen, personalisieren, Stimmungen schicken und
gegeneinander antreten — live oder zeitversetzt, je nachdem, ob ihr gerade
beide wach seid.

**Komplett statisch.** Kein Build-Schritt, keine Abhängigkeiten, kein Server.
Läuft so, wie es hier liegt, auf GitHub Pages.

---

## Auf GitHub Pages bringen

**Settings → Pages → Source: „Deploy from a branch“ → `main` / `/ (root)` → Save.**

Das war's. Nach ein bis zwei Minuten läuft die App unter
`https://<dein-name>.github.io/DynamicChicken/`.

Es liegt zusätzlich ein Workflow (`.github/workflows/pages.yml`) bereit, falls du
lieber über GitHub Actions deployst — dann in den Pages-Einstellungen
„GitHub Actions“ als Source wählen. Beides funktioniert; der Branch-Weg ist
weniger Bewegung, weil ohnehin nichts gebaut werden muss.

Lokal ausprobieren:

```bash
python3 -m http.server 8099   # dann http://localhost:8099
```

Auf dem Handy: Seite öffnen → Teilen → **Zum Home-Bildschirm**. Dann läuft
Knuddl im Vollbild, offline und mit eigenem Icon.

---

## „Gehen die ganzen Funktionen auf GitHub Pages überhaupt?“

Kurz: **ja** — mit einer bewussten Entscheidung an genau einer Stelle.

GitHub Pages liefert nur Dateien aus. Es kann nichts speichern und nichts
weiterleiten. Alles, was rein im Browser passiert, funktioniert deshalb
uneingeschränkt: Pflege-Simulation, Personalisierung, alle acht Spiele,
Offline-Betrieb, Installation als App.

Für „mein Gefühl kommt bei dir an“ braucht es dagegen irgendetwas dazwischen.
Knuddl bietet dafür **drei Wege**, umschaltbar unter *Mehr → Wie synchronisiert
ihr?*:

| Modus | Was du brauchst | Was geht | Was nicht |
|---|---|---|---|
| **Solo** | nichts | Alles, ein simulierter Mensch antwortet dir | Es ist eben nicht dein Mensch |
| **Brieftaube** | nichts | Wirklich alles zu zweit — Stimmungen, Gesten, alle acht Spiele | Zeitversetzt: ihr schickt euch Codes |
| **Cloud** | 5 Minuten Firebase-Einrichtung, kostenlos | Alles live: Anwesenheit, Live-Punktestand, sofortige Zustellung | — |

Alle drei laufen auf derselben statischen Seite. Du kannst jederzeit wechseln;
was im Brieftauben-Stapel liegt, geht nicht verloren.

### Brieftaube — der Weg ganz ohne Server

Der ehrlichste Weg und mein Liebling: Deine Ereignisse werden zu einem kurzen
Text zusammengefaltet (deflate + base64url), den du per WhatsApp, iMessage oder
Zettel schickst. Dein Mensch fügt ihn ein und bekommt alles, was seit dem
letzten Austausch passiert ist — inklusive Spielzüge.

```
KNUDDL1.rVPLbtswEPwVgudGD8uS7dyKHnrooUB7KHooiiJdkyuJCEUKJGXHDfLvXcqy…
```

Jedes Ereignis trägt eine ID. Ein Code doppelt eingefügt macht nichts, ein
verlorener Code auch nicht — der nächste holt alles nach. Der erste Code ist
gleichzeitig die Verbindung: Wer ihn einliest, ist gepaart.

### Cloud — live spielen, in fünf Minuten eingerichtet

Warum Firebase Realtime Database und nicht irgendein SDK? Weil sie sich als
reine REST-Schnittstelle ansprechen lässt **und** Änderungen als Server-Sent
Events ausliefert. Beides kann ein Browser von Haus aus — kein Bundle, kein
Build, kein npm. Die Seite bleibt statisch und synchronisiert trotzdem in
Echtzeit.

1. [console.firebase.google.com](https://console.firebase.google.com) → Projekt
   anlegen (Analytics kannst du abwählen).
2. **Build → Realtime Database → Datenbank erstellen.** Region: `europe-west1`.
   Starte im **Testmodus**.
3. Regeln unter **Rules** ersetzen:

   ```json
   {
     "rules": {
       "knuddl": {
         ".read": true,
         ".write": true,
         "$section": {
           "$code": {
             ".validate": "$code.length <= 12"
           }
         }
       }
     }
   }
   ```

4. Die Datenbank-URL kopieren
   (`https://…-default-rtdb.europe-west1.firebasedatabase.app`).
5. In der App unter **Mehr → Cloud** einfügen — oder fest in
   [`config.js`](config.js) eintragen, dann müsst ihr es nie wieder tun.
6. Beide Geräte: derselbe Eintrag, dann Codes tauschen. Fertig.

## „Kann da jemand anders mitlesen?“

Kurze Antwort: **nein, nicht bei den Inhalten.** Die Datenbank bekommt nichts
Lesbares zu sehen.

Die längere: Eine statische Seite hat keinen Server, dem sie vertrauen könnte.
Die Datenbank-URL steht in `config.js`, also im Quelltext der Seite — jeder,
der sie kennt, kann hineinschauen. Deshalb steht dort nichts, womit sich etwas
anfangen ließe.

Beim Verbinden erzeugt dein Gerät ein **Geheimnis** — 96 Bit Zufall, als
20 Zeichen lesbar. Es hängt hinten an deiner Einladung:

```
ABC123-K7F2M9QX4R8TWE7HJ2NP
└code┘ └───── Geheimnis ─────┘
```

Diese Einladung läuft über euren eigenen Messenger und wird **niemals
hochgeladen**. Beide Geräte leiten daraus mit HKDF-SHA256 zwei Dinge ab:

| | wozu |
|---|---|
| **Raum-ID** (20 Zeichen) | wohin geschrieben wird — praktisch unauffindbar |
| **AES-GCM-256-Schlüssel** | verschlüsselt jeden Inhalt |

In der Datenbank landet dann das hier — an einer Stelle, die niemand errät:

```json
{ "r": { "YT45VWWVEJDP9SWN4YKA": { "u": { "T9YZ4P": {
  "v": 1, "iv": "oYSmCPghOEkU1Pv5", "ct": "s6PbSdN2ufSOGZ9aO1VLC7koh…" } } } } }
```

Namen, Stimmungen, Notizen, Nest-Wünsche, Abstimmungen, Bewertungen, dein
Ort — alles steckt im `ct`. Nachgeprüft: nach einer kompletten Sitzung zu
zweit taucht im Datenbank-Abzug kein einziges Klartextwort auf. Vor dem
Verbinden wird gar nichts hochgeladen, weil es dann noch niemanden gibt, der
es lesen könnte.

Was ein Neugieriger mit Datenbankzugriff trotzdem sieht: dass es diesen Raum
gibt, wie viele Datensätze darin liegen und wann sie geschrieben wurden.
Metadaten also, keine Inhalte. AES-GCM merkt außerdem, wenn jemand an einem
Datensatz herumgepfuscht hat — dann wird er verworfen statt angezeigt.

**Was ihr dafür tun müsst:** die *vollständige* Einladung austauschen, nicht
nur den sechsstelligen Code. Ein nackter Code verbindet zwar auch, aber
unverschlüsselt — die App sagt das dann deutlich, in den Einstellungen und
als Hinweis nach dem Verbinden.

Wer zusätzlich verhindern will, dass Fremde überhaupt schreiben dürfen:
Firebase Anonymous Auth einschalten und `".read"`/`".write"` auf
`"auth != null"` setzen. Nötig ist es für die Vertraulichkeit nicht mehr.

**Zum Ort:** gespeichert wird nur eine Stadt, die du selbst ausgesucht hast,
mit auf zwei Nachkommastellen gerundeten Koordinaten — etwa ein Kilometer
genau. Kein GPS, kein Verlauf, und im Zweifel gar nichts. Die Wetterabfrage
selbst geht direkt an Open-Meteo, ohne Konto und ohne Schlüssel.

### Benachrichtigungen

Was dein Mensch schickt, fährt oben als Banner herein: antippen öffnet die
Stelle, nach oben wischen schickt es weg, und der Inhalt darunter rückt so
lange sanft nach. Liegt die App im Hintergrund und hast du es unter *Mehr*
erlaubt, geht dieselbe Meldung zusätzlich als Systembenachrichtigung raus.

Echte Push-Nachrichten bei komplett geschlossener App bräuchten einen
Push-Server mit VAPID-Schlüsseln — das sprengt „statische Seite“. Solange die
App im Hintergrund offen ist, funktioniert es.

---

## Was drin ist

### Knuddl selbst
Kein Bild-Asset, sondern eine kleine Anatomie aus SVG-Pfaden: Schwanzfedern,
zwei Flügel mit Federkanten, Bauchflaum, Beine mit Zehen, Lider, Brauen, ein
Schnabel, der sich öffnet. Kopf und Rumpf sind getrennte Formen, teilen sich
aber denselben Verlauf — dadurch ist die Naht unsichtbar, obwohl der Kopf
picken und den Kopf schütteln kann.

**Über zwanzig Bewegungen**: atmen, blinzeln, picken, fressen, sich waschen,
hüpfen, tanzen, flattern, laufen, frieren, jubeln, winken, nachdenken, singen,
sich strecken, nicken, den Kopf schütteln, anrempeln, schlafen. Dazu
Stimmungen, die den ganzen Körper verändern — ein trauriges Huhn lässt die
Flügel hängen, ein aufgeregtes hüpft ununterbrochen.

Angetippt reagiert es jedes Mal, und jedes dritte Mal fällt die Reaktion
größer aus. Alle vierzehn Sekunden tut es im Hintergrund etwas von allein.

### Keine Emojis
Alle rund **hundert Symbole sind selbst gezeichnet** (`src/ui/icons.js`):
Futter, Tab-Leiste, Bedienelemente, Spielsymbole — und die zwölf Stimmungen
sind winzige Hühnergesichter, jedes mit eigenem Ausdruck. Emojis sehen auf
jedem Gerät anders aus und hätten die Pastell-Palette gebrochen.

### Die Szene
Der Hintergrund kennt die Uhrzeit: Morgenrot, Tag, Abendlicht oder Nacht mit
Mond und Sternen. Wolken ziehen vorbei, Gras wächst am Hügel.

### Pflegen
Sattheit, Energie, Sauberkeit und Laune verfallen **in Echtzeit** — beim
Öffnen wird nachgerechnet, was in der Zwischenzeit passiert wäre. Füttern
(zehn Sorten mit eigenen Werten), waschen, schlafen legen, spielen, knuddeln.
XP, Level, Körner als Währung.

### Personalisieren
10 Gefiederfarben, 6 Bauchtöne, 6 Kammformen in 5 Farben, 5 Augenpaare,
8 Hüte, 8 Accessoires und ein Regler für die Leibesfülle. Manches kauft man,
manches schaltet euer gemeinsames Bond-Level frei.

### Kommunizieren
Der Wir-Tab hat vier Abschnitte, weil vier verschiedene Zeitgefühle
dahinterstecken: **Heute** (was gerade ist), **Nest** (was mal sein soll),
**Wählen** (was als Nächstes ansteht) und **Raten** (wie gut ihr euch kennt).

**Heute**
- **Stimmungen** aus 12 Gefühlen, optional mit einem Satz dazu
- **Status** — was du gerade machst, aus 12 Aktivitäten
- **Kleine Gesten** — Knuddeln, Kuss, „Denk an dich“, Kaffee spendieren …
  Jede löst beim Empfänger eine eigene Bewegung aus
- **Kuschel-Knopf** — beide gleichzeitig halten, dann vibrieren beide Geräte
- **Frage des Tages** — beide antworten, aufgedeckt wird gemeinsam
- **Wetter am Ort des anderen** — Temperatur, Lage, Höchst- und Tiefstwert,
  Sonnenuntergang, dazu ein Satz („Regenjacke wäre klug.“) und der Vergleich
  zu deinem Wetter. Dreizehn selbst gezeichnete Wetterbilder, Tag und Nacht
  getrennt. Quelle ist Open-Meteo: kein Konto, kein Schlüssel, CORS erlaubt
- **Zeitzonen** — seine/ihre Uhrzeit, Stundenversatz, „schläft wahrscheinlich“
- **Streak, Bond-Level, gemeinsamer Verlauf**

**Gemeinsames Nest** — die Wohnung, die ihr euch vorstellt. 26 konkrete
Wünsche in fünf Kategorien (plus eigene), jeder gewichtet für sich in vier
Stufen von *egal* bis *unverzichtbar*. Daraus rechnet die App eine
Übereinstimmung in Prozent und sortiert in zwei Listen: **worin ihr euch
einig seid** und **worüber ihr reden solltet** — Letzteres nach Abstand
sortiert, das Streitträchtigste zuerst.

**Abstimmen** — „Was machen wir heute Abend?“ mit zwei bis sechs Optionen,
vier Vorlagen für die üblichen Fragen. Was der andere gewählt hat, siehst du
erst, wenn du selbst gewählt hast. Gleiche Wahl gibt Konfetti und Körner,
unterschiedliche zeigt beide Antworten nebeneinander.

**Bewerten & Raten** — ein Song, ein Link, irgendeine Sache. Beide geben eine
Note von 1 bis 10 **und** tippen, was der andere sagen wird. Beides zusammen,
sonst könnte man die Vermutung nachträglich anpassen. Aufgedeckt wird, wenn
beide dran waren: Punkte gibt es fürs Kennen (10 minus doppelter Abstand),
nicht fürs Mögen. Dazu ein laufender Punktestand und eine Geschmacks-Nähe.

### Acht Minispiele

| Spiel | Was | Live | Zeitversetzt |
|---|---|:--:|:--:|
| **Körner-Jagd** | Du steuerst Knuddl und fängst, was vom Himmel fällt | ✅ mit Live-Punktestand | ✅ |
| **Federflug** | Ein Finger, viele Zaunlücken — mit dem Fähnchen deines Menschen als Ziel | — | ✅ |
| **Ei-Duell** | Fünf Symbole, fünf Runden, verdeckt gelegt | ✅ | ✅ |
| **Nest-Turm** | Zweig auf Zweig, perfekte Treffer machen die Fläche wieder breiter | — | ✅ |
| **Herzschlag** | Du tippst einen Rhythmus, er/sie fühlt ihn nach | — | ✅ |
| **Kritzel-Telefon** | Du malst ein Wort, drüben wird der Strich für Strich nachgezeichnet und geraten | — | ✅ |
| **Gefühls-Duett** | Beide raten, wie es dem anderen geht | — | ✅ |
| **Feder-Memory** | Acht Paare, identisches Blatt für beide | — | ✅ |

**Wie kann das ohne Schiedsrichter fair sein?** Jede Runde hat eine Nummer.
Aus Rundennummer + eurem Paar-Code berechnet jedes Gerät denselben Seed und
daraus dieselbe Spielwelt — denselben Körnerregen zur selben Millisekunde,
denselben Zaun, dieselbe Kartenanordnung. Ihr spielt, wann ihr könnt; wer
zuletzt fertig wird, löst die Abrechnung aus, und beide Seiten kommen
unabhängig zum selben Ergebnis.

Auf der Spiele-Seite gibt es außerdem eine **Arena**: Die Form eures Huhns
(Pflegezustand + Level) wird gegeneinander gestellt.

## Ideen für später

- **Eier legen** — bei gutem Pflegezustand legt Knuddl Eier, aus denen bei
  gemeinsamem Ausbrüten ein Küken schlüpft
- **Countdown** bis zum nächsten Wiedersehen, mit eigener Karte im Wir-Tab
- **Nest zum Anschauen** — aus den Wünschen, bei denen ihr euch einig seid,
  wächst ein gezeichneter Grundriss statt einer Liste
- **Wetter in der Szene** — regnet es bei deinem Menschen, regnet es auch
  hinter seinem/ihrem Huhn
- **Wunschzettel** — Dinge fürs nächste Treffen, auslosbar
- **Foto-Kritzel** — dasselbe Spiel, aber mit einem echten Foto als Vorlage
- **Duett-Modus für Herzschlag** — beide tippen gleichzeitig, die App misst,
  wie synchron ihr seid
- **Abstimmung mit Frist** — wer bis 18 Uhr nicht gewählt hat, überlässt die
  Entscheidung dem anderen

## Aufbau

Kein Framework, kein Bundler, keine `node_modules`. Alles native ES-Module,
die der Browser direkt lädt. Das ist der Grund, warum GitHub Pages ohne
Build-Schritt reicht — und warum man jede Datei einzeln lesen und ändern kann.

```
index.html            Gerüst
config.js             Cloud-URL & Co. — direkt auf GitHub editierbar
sw.js                 Service Worker, offline-first
manifest.webmanifest  PWA-Manifest

styles/
  tokens.css          Pastell-Palette, Materialien, Federkurven, Dark Mode
  base.css            Layout, Karten, Buttons, Tab-Bar, Sheets, Banner, Toasts
  chicken.css         Der Bewegungsapparat: Drehpunkte und alle Animationen
  screens.css         Tageszeit-Szene, Wir-Tab, Laden, Onboarding
  games.css           Die acht Minispiele

src/
  main.js             Start, Herzschlag, Banner-Aktionen, Onboarding
  pet/
    chicken.js        Anatomie, Aussehen, playAction()
    moods.js          Gefühle, Aktivitäten, Gesten, Tagesfragen
  state/
    store.js          Winziger reaktiver Store mit Persistenz
    model.js          Datenmodell, Echtzeit-Simulation, Level, Migration
    catalog.js        Futter, Preise, Belohnungen, Bond-Freischaltungen
    shared.js         Nest, Abstimmungen, Bewerten — Katalog und Auswertung
    events.js         Eingehende Partner-Ereignisse
  sync/
    index.js          Adapter-Umschaltung, Senden, Pairing
    solo.js           Simulierter Mensch
    cloud.js          Firebase RTDB über fetch + EventSource, verschlüsselt
    carrier.js        Brieftauben-Codes
  games/              Registry + acht Spiele
  ui/
    icons.js          ~145 selbst gezeichnete SVG-Icons
    banner.js         Benachrichtigungen von oben
    shell.js          Tabs und Routing
    placeSheet.js     Ortssuche fürs Wetter
    …                 Sheets, Toasts, Aktionen, fünf Screens
  util/
    crypto.js         HKDF-Ableitung, AES-GCM, Einladungen
    weather.js        Open-Meteo, WMO-Codes, Ortssuche
    …                 DOM, Zufall, Zeit, Haptik/Ton/Konfetti, Codec

tools/make-icons.mjs  Erzeugt die PNG-App-Icons (nur bei Änderungen nötig)
```

Der Spielstand liegt ausschließlich im `localStorage` deines Geräts. Unter
*Mehr → Daten* lässt er sich exportieren und wieder einlesen.

---

## Vorher

Dieses Repository war zwischendurch eine SwiftUI-App mit echter Live Activity
und danach ein Android-Port mit Overlay-Service. Beides steckt noch in der
Git-Historie (bis Commit `98dceb8`). Die Web-Fassung ersetzt sie, weil sie das
Einzige ist, was ihr beide sofort installieren könnt — ohne Xcode, ohne
Developer-Account, ohne App-Store-Review, auf iPhone und Android gleichzeitig.

Eine erste Web-Fassung hatte eine nachgebaute Dynamic Island oben im Bild.
Die ist wieder raus: Sie passte höhenmäßig nie zu jedem Gerät und nahm Platz
weg, den der Inhalt besser gebrauchen kann. Benachrichtigungen kommen jetzt
als Banner.

---

Für zwei Menschen und zwei Hühner gebaut.
