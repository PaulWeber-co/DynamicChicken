# 🐔 Knuddl — Dynamic Chicken

Ein dickes gelbes Huhn, das oben in einer Dynamic Island wohnt, gefüttert werden
will und einen Zwilling bei dem Menschen hat, den du vermisst.

Pou trifft Fernbeziehung: pflegen, personalisieren, Stimmungen schicken und
gegeneinander antreten — live oder zeitversetzt, je nachdem, ob ihr gerade
beide wach seid.

**Komplett statisch.** Kein Build-Schritt, keine Abhängigkeiten, kein Server.
Läuft so, wie es hier liegt, auf GitHub Pages.

---

## Auf GitHub Pages bringen

**Settings → Pages → Source: „Deploy from a branch" → `main` / `/ (root)` → Save.**

Das war's. Nach ein bis zwei Minuten läuft die App unter
`https://<dein-name>.github.io/DynamicChicken/`.

Es liegt zusätzlich ein Workflow (`.github/workflows/pages.yml`) bereit, falls du
lieber über GitHub Actions deployst — dann in den Pages-Einstellungen
„GitHub Actions" als Source wählen. Beides funktioniert; der Branch-Weg ist
weniger Bewegung, weil ohnehin nichts gebaut werden muss.

Lokal ausprobieren:

```bash
python3 -m http.server 8099   # dann http://localhost:8099
```

Auf dem Handy: Seite öffnen → Teilen → **Zum Home-Bildschirm**. Dann läuft
Knuddl im Vollbild, offline, mit eigenem Icon — und die Insel sitzt genau dort,
wo beim iPhone die echte wäre.

---

## „Gehen die ganzen Funktionen auf GitHub Pages überhaupt?"

Kurz: **ja** — mit einer bewussten Entscheidung an genau einer Stelle.

GitHub Pages liefert nur Dateien aus. Es kann nichts speichern und nichts
weiterleiten. Alles, was rein im Browser passiert, funktioniert deshalb
uneingeschränkt: Pflege-Simulation, Personalisierung, Spiel-Logik,
Dynamic Island, Offline-Betrieb, Installation als App.

Für „mein Gefühl kommt bei dir an" braucht es dagegen irgendetwas dazwischen.
Knuddl bietet dafür **drei Wege**, umschaltbar unter *Mehr → Wie synchronisiert
ihr?*:

| Modus | Was du brauchst | Was geht | Was nicht |
|---|---|---|---|
| 🐣 **Solo** | nichts | Alles, ein simulierter Mensch antwortet dir | Es ist eben nicht dein Mensch |
| 🕊️ **Brieftaube** | nichts | Wirklich alles zu zweit — Stimmungen, Gesten, alle fünf Spiele | Zeitversetzt: ihr schickt euch Codes |
| ☁️ **Cloud** | 5 Minuten Firebase-Einrichtung, kostenlos | Alles live: Anwesenheit, Live-Punktestand, sofortige Zustellung | — |

Alle drei laufen auf derselben statischen Seite. Du kannst jederzeit wechseln;
was im Brieftauben-Stapel liegt, geht nicht verloren.

### 🕊️ Brieftaube — der Weg ganz ohne Server

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

### ☁️ Cloud — live spielen, in fünf Minuten eingerichtet

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

**Zur Ehrlichkeit:** Diese Regeln erlauben jedem, der die URL kennt, unter
`/knuddl` zu lesen und zu schreiben. Für zwei Menschen und ein paar Hühner ist
das vertretbar — es liegen dort Kosenamen und Spielstände, keine Geheimnisse.
Wer mag, setzt `cloudNamespace` in `config.js` auf eine zufällige Zeichenfolge
und ersetzt oben `"knuddl"` durch denselben Wert; dann ist der Namensraum
praktisch unauffindbar. Wer es richtig dicht will, schaltet Firebase Anonymous
Auth ein und setzt `".read": "auth != null"`.

### Und die echte Dynamic Island?

Die gehört iOS, und keine Webseite darf sie anfassen. Was Knuddl macht, ist die
konsequente Nachbildung: eine schwarze Pille direkt unter der Notch, die sich
mit derselben Federkurve zwischen drei Zuständen morpht, laufende Aktivitäten
anzeigt und bei der Benachrichtigungen als Tropfen heranfliegen und mit ihr
verschmelzen (SVG-`goo`-Filter).

Als Home-Screen-App unter `apple-mobile-web-app-status-bar-style:
black-translucent` sitzt sie exakt dort, wo das Hardware-Pendant wäre — und auf
jedem anderen Gerät bekommt man das Gefühl geschenkt. Echte Mitteilungen bei
geschlossener App bräuchten einen Push-Server; solange die App im Hintergrund
offen ist, funktioniert die Notification-API (unter *Mehr* aktivierbar).

---

## Was drin ist

### 🐥 Pflegen
Sattheit, Energie, Sauberkeit und Laune verfallen **in Echtzeit** — beim Öffnen
wird nachgerechnet, was in der Zwischenzeit passiert wäre. Füttern (zehn
Sorten, jede mit eigenen Werten), waschen, schlafen legen, spielen, knuddeln.
XP, Level, Körner als Währung.

### 🎨 Personalisieren
Das Huhn ist kein Bild, sondern wird gezeichnet: 10 Gefiederfarben, 6 Bauch-
töne, 6 Kammformen in 5 Farben, 5 Augenpaare, 8 Hüte, 8 Accessoires und ein
Regler für die Leibesfülle. Alles skaliert verlustfrei und wiegt null Kilobyte.
Manches kauft man, manches schaltet euer gemeinsames Bond-Level frei.

### 💞 Kommunizieren
- **Stimmungen** aus 12 Gefühlen, optional mit einem Satz dazu
- **Status** — was du gerade machst, aus 12 Aktivitäten
- **Kleine Gesten** — Knuddeln, Kuss, „Denk an dich", Kaffee spendieren …
- **Kuschel-Knopf** — beide gleichzeitig halten, dann vibrieren beide Geräte
- **Frage des Tages** — beide antworten, aufgedeckt wird gemeinsam
- **Zeitzonen** — seine/ihre Uhrzeit, Stundenversatz, „schläft wahrscheinlich"
- **Streak, Bond-Level, gemeinsamer Verlauf**

### 🎮 Fünf Minispiele

| Spiel | Was | Live | Zeitversetzt |
|---|---|:--:|:--:|
| 🌽 **Körner-Jagd** | 30 s Reaktion, Körner fangen, Bomben meiden | ✅ mit Live-Punktestand | ✅ |
| 🥚 **Ei-Duell** | Schnick-Schnack-Schnuck mit 5 Symbolen, 5 Runden, verdeckt | ✅ | ✅ |
| 💓 **Herzschlag** | Du tippst einen Rhythmus, er/sie fühlt ihn nach | — | ✅ |
| 🎭 **Gefühls-Duett** | Beide raten, wie es dem anderen geht | — | ✅ |
| 🃏 **Feder-Memory** | Acht Paare, identisches Blatt für beide | — | ✅ |

**Wie kann das ohne Schiedsrichter fair sein?** Jede Runde hat eine Nummer.
Aus Rundennummer + eurem Paar-Code berechnet jedes Gerät denselben Seed und
daraus dieselbe Spielwelt — denselben Körnerregen zur selben Millisekunde,
dieselbe Kartenanordnung. Ihr spielt, wann ihr könnt; wer zuletzt fertig wird,
löst die Abrechnung aus, und beide Seiten kommen unabhängig zum selben
Ergebnis.

Auf der Spiele-Seite gibt es außerdem eine **Arena**: Die Form eures Huhns
(Pflegezustand + Level) wird gegeneinander gestellt. Gut gefüttert ist eben
selbstbewusster.

---

## Ideen für später

Ein paar, die gut hineinpassen würden:

- **Federflug** — Einfingerspiel, bei dem der Geist des letzten Laufs deines
  Menschen neben dir fliegt
- **Zeichen-Telefon** — kleine Kritzelei auf 16×16, der andere rät
- **Gemeinsames Nest** — ein Ort, den ihr zusammen einrichtet; jede Woche
  Pflege schaltet ein Möbelstück frei
- **Wunschzettel** — Dinge, die ihr beim nächsten Treffen machen wollt,
  auslosbar
- **Eier legen** — Knuddl legt bei gutem Pflegezustand Eier, aus denen bei
  gemeinsamem Ausbrüten ein Küken schlüpft
- **Countdown** bis zum nächsten Wiedersehen, direkt in der Insel als
  Live-Aktivität

---

## Aufbau

Kein Framework, kein Bundler, keine `node_modules`. Alles native ES-Module,
die der Browser direkt lädt. Das ist der Grund, warum GitHub Pages ohne
Build-Schritt reicht — und warum man jede Datei einzeln lesen und ändern kann.

```
index.html            Gerüst, Insel-Container, goo-Filter
config.js             Cloud-URL & Co. — direkt auf GitHub editierbar
sw.js                 Service Worker, offline-first
manifest.webmanifest  PWA-Manifest

styles/
  tokens.css          Pastell-Palette, Materialien, Federkurven, Dark Mode
  base.css            Layout, Karten, Buttons, Tab-Bar, Sheets, Toasts
  island.css          Dynamic Island
  screens.css         Chicken-Animationen, Wir-Tab, Laden, Onboarding
  games.css           Minispiele

src/
  main.js             Start, Herzschlag, Insel-Aktionen, Onboarding
  pet/
    chicken.js        Prozeduraler SVG-Chicken + alle Anpassungsoptionen
    moods.js          Gefühle, Aktivitäten, Gesten, Tagesfragen
  state/
    store.js          Winziger reaktiver Store mit Persistenz
    model.js          Datenmodell, Echtzeit-Simulation, Level, Migration
    catalog.js        Futter, Preise, Belohnungen, Bond-Freischaltungen
    events.js         Eingehende Partner-Ereignisse
  sync/
    index.js          Adapter-Umschaltung, Senden, Pairing
    solo.js           Simulierter Mensch
    cloud.js          Firebase RTDB über fetch + EventSource
    carrier.js        Brieftauben-Codes
  games/              Registry + fünf Spiele
  ui/                 Insel, Tabs, Sheets, Toasts, Aktionen, fünf Screens
  util/               DOM, Zufall, Zeit, Haptik/Ton/Konfetti, Codec

tools/make-icons.mjs  Erzeugt die PNG-Icons (nur bei Änderungen nötig)
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

---

Mit viel 💛 für zwei Menschen und zwei Hühner gebaut.
