/**
 * Federwissen — drei Fragen, dann ist der andere dran.
 *
 * Der Ablauf ist bewusst kurz: drei Fragen, keine Verlängerung, kein
 * „noch eine Runde". Wer zwischen Bushaltestelle und Bus spielt, soll
 * fertig werden, und wer weiterspielen will, hat die nächste Runde ohnehin
 * gleich vor sich.
 *
 * Beide bekommen dieselben drei Fragen — in derselben Reihenfolge und mit
 * denselben Antwortmöglichkeiten an denselben Positionen. Das ist der
 * einzige Weg, aus zwei zeitversetzten Alleingängen ein Duell zu machen,
 * und es funktioniert ohne Server: Aus Runde plus Paarcode entsteht auf
 * beiden Geräten derselbe Seed, und daraus wird alles Weitere abgeleitet.
 *
 * Zwei Sorten Fragen. Wissensfragen belohnen Tempo, Schätzfragen belohnen
 * Nähe. Genau deshalb kann eine Runde noch kippen, wenn jemand die erste
 * Wissensfrage nicht wusste — bei der Schätzfrage liegen 150 Punkte, und
 * die verteilen sich nicht in Ja/Nein, sondern in Prozent.
 */

import { esc } from '../util/dom.js';
import { fx, confetti } from '../util/feedback.js';
import { get } from '../state/store.js';
import { icon } from '../ui/icons.js';
import { rng } from '../util/rng.js';
import { duel, seedFor, submitScore, inviteToPlay, pairKey } from './index.js';
import {
  WISSEN, SCHAETZEN, FRAGEN_PRO_RUNDE, ZEIT_WISSEN, ZEIT_SCHAETZEN,
  MAX_PRO_FRAGE, punkteWissen, punkteSchaetzen, abweichung
} from './quizFragen.js';

export const meta = {
  id: 'quiz',
  icon: 'gameQuiz',
  title: 'Federwissen',
  tagline: 'Drei Fragen, dann bist du dran',
  modes: ['async'],
  tone: 'calm',
  howto: 'Drei Fragen pro Runde, mal Wissen, mal Schätzen. Ihr bekommt genau dieselben — wer mehr Punkte holt, gewinnt die Runde. Bei Wissensfragen zählt auch das Tempo, beim Schätzen zählt, wie nah du drankommst.'
};

export { WISSEN, SCHAETZEN };

export function summary(state) {
  const d = duel(state, meta.id);
  if (d.theirs && !d.mine) return { badge: 'wait', text: `Schlag ${d.theirs.score}` };
  if (d.mine && !d.theirs) return { badge: 'off', text: `Du: ${d.mine.score}` };
  const n = d.wins.me + d.wins.them + d.wins.draw;
  return n ? { badge: null, text: `${d.wins.me}–${d.wins.them}` } : { badge: null, text: 'Neu' };
}

/**
 * Die drei Fragen einer Runde.
 *
 * Zwei Wissensfragen und eine Schätzfrage, die Schätzfrage an wechselnder
 * Stelle — immer zuletzt wäre eine Ansage, wann man sich anstrengen muss.
 *
 * Gezogen wird über die Runden-Nummer und nicht über den Zufall des Seeds:
 * So läuft der Vorrat der Reihe nach durch, statt sich zufällig zu
 * wiederholen. Bei 175 Wissensfragen dauert es damit gut zwei Monate
 * tägliches Spielen, bis eine zum zweiten Mal drankommt.
 */
export function rundenFragen(runde, seed, salz = '') {
  const z = rng(seed);
  const r = Math.max(1, Math.floor(runde));
  const wissen = [
    WISSEN[misch(r * 2 - 2, WISSEN.length, salz)],
    WISSEN[misch(r * 2 - 1, WISSEN.length, salz)]
  ];
  const schaetz = SCHAETZEN[misch(r - 1, SCHAETZEN.length, salz)];
  const platz = Math.floor(z() * FRAGEN_PRO_RUNDE);

  const liste = [];
  let w = 0;
  for (let i = 0; i < FRAGEN_PRO_RUNDE; i++) {
    if (i === platz) { liste.push({ art: 'schaetzen', ...schaetz }); continue; }
    const q = wissen[w++];
    liste.push({ art: 'wissen', ...q, reihe: mischAntworten(q.a, z) });
  }
  return liste;
}

/**
 * Aus einem laufenden Index wird eine Position im Vorrat.
 *
 * Ein simples `index % länge` wäre für alle Paare dieselbe Reihenfolge —
 * ihr würdet in Runde 1 dieselbe Frage sehen wie alle anderen auch. Der
 * Paarcode verschiebt den Startpunkt und die Schrittweite; teilerfremd zur
 * Länge gewählt, damit trotzdem jede Frage drankommt, bevor sich etwas
 * wiederholt.
 */
function misch(index, laenge, salz) {
  if (laenge <= 1) return 0;
  let h = 2166136261 >>> 0;
  // Das `>>> 0` nach jeder Runde ist nicht kosmetisch: `Math.imul` liefert
  // vorzeichenbehaftet, und ein negatives `h` ergibt einen negativen Index —
  // also eine Frage, die es nicht gibt.
  for (let i = 0; i < salz.length; i++) { h = Math.imul(h ^ salz.charCodeAt(i), 16777619) >>> 0; }
  const start = h % laenge;
  let schritt = 1 + ((h >>> 8) % (laenge - 1));
  // Teilerfremd zur Länge heißt: Der Schritt läuft den ganzen Vorrat ab,
  // bevor er zum Ausgangspunkt zurückkommt.
  for (let i = 0; i < laenge && ggt(schritt, laenge) !== 1; i++) {
    schritt = (schritt % (laenge - 1)) + 1;
  }
  return (start + Math.max(0, index) * schritt) % laenge;
}

const ggt = (a, b) => (b ? ggt(b, a % b) : a);

/** Antwortreihenfolge — auf beiden Geräten dieselbe, weil aus demselben Seed. */
function mischAntworten(a, z) {
  const idx = a.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(z() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx;
}

export function mount(root, ctx) {
  const partner = get().partner?.name || 'Dein Mensch';
  let timer = 0;
  const cleanups = [];

  const header = (right = '') => `<div class="game-top">
    <button class="game-x" data-close aria-label="Schließen">${icon('close', { size: 15 })}</button>
    <div class="game-title">${esc(meta.title)}</div>
    <div class="game-right">${right}</div>
  </div>`;
  const bindClose = () => root.querySelectorAll('[data-close]').forEach((b) => { b.onclick = () => ctx.close(); });
  const stopUhr = () => { clearInterval(timer); timer = 0; };
  cleanups.push(stopUhr);

  function intro() {
    const st = get();
    const d = duel(st, meta.id);
    const fragen = rundenFragen(d.r, seedFor(meta.id, d.r, st), pairKey(st));
    const themen = [...new Set(fragen.map((f) => f.t))];
    const target = d.theirs?.score ?? null;
    const wartet = d.mine && !d.theirs;
    // Die letzte abgerechnete Runde lässt sich nachträglich ansehen — dafür
    // liegen ihre Einzelheiten im Verlauf.
    const letzte = d.history?.[0]?.detail?.mine?.z ? d.history[0] : null;

    root.innerHTML = `
      <div class="game-wrap">
        ${header()}
        <div class="game-center">
          <div class="game-hero">${icon('gameQuiz', { size: 68 })}</div>
          <div class="game-kicker">Runde ${d.r} · ${FRAGEN_PRO_RUNDE} Fragen</div>
          <h2 class="game-h">${themen.slice(0, 3).map(esc).join(' · ')}</h2>
          <p class="game-p">${wartet
            ? `Deine Antworten sind eingeloggt: <b>${d.mine.score}</b> Punkte. Jetzt ist <b>${esc(partner)}</b> mit denselben Fragen dran.`
            : target != null
              ? `<b>${esc(partner)}</b> hat vorgelegt: <b>${target}</b> von ${FRAGEN_PRO_RUNDE * MAX_PRO_FRAGE} Punkten. Du bekommst genau dieselben Fragen — welche davon gesessen haben, siehst du erst hinterher.`
              : `Zwei Wissensfragen, eine Schätzfrage. Einmal getippt gilt: Die Antwort wird eingeloggt und lässt sich nicht mehr ändern. Danach ist <b>${esc(partner)}</b> mit denselben Fragen dran.`}</p>
          <div class="game-legend">
            <span class="legend">${icon('clock', { size: 15 })} ${ZEIT_WISSEN} s pro Wissensfrage</span>
            <span class="legend">${FRAGEN_PRO_RUNDE * MAX_PRO_FRAGE} möglich</span>
          </div>
          ${wartet
            ? `<button class="btn btn-ghost btn-block" data-close>Fertig</button>`
            : `<button class="btn btn-primary btn-block" data-go>${target != null ? 'Dagegenhalten' : 'Los'}</button>`}
          ${letzte ? `<button class="btn btn-ghost btn-block" data-letzte>Runde ${letzte.r} ansehen</button>` : ''}
          ${!wartet && target == null && st.partner ? `<button class="btn btn-ghost btn-block" data-invite>${esc(partner)} anstupsen</button>` : ''}
        </div>
      </div>`;
    const go = root.querySelector('[data-go]');
    if (go) go.onclick = () => { fx('pop'); spielen(fragen, d.r); };
    const alt = root.querySelector('[data-letzte]');
    if (alt) alt.onclick = () => {
      fx('tap');
      const st2 = get();
      vergleich(
        rundenFragen(letzte.r, seedFor(meta.id, letzte.r, st2), pairKey(st2)),
        letzte.detail.mine.z, letzte.detail.theirs?.z || [],
        { result: letzte.result, mine: letzte.mine, theirs: letzte.theirs },
        letzte.r
      );
    };
    const inv = root.querySelector('[data-invite]');
    if (inv) inv.onclick = () => { inviteToPlay(meta.id); fx('tap'); inv.textContent = 'Angestupst'; inv.disabled = true; };
    bindClose();
  }

  function spielen(fragen, runde) {
    let nr = 0;
    const ergebnisse = [];

    function frageZeigen() {
      const q = fragen[nr];
      const grenze = q.art === 'wissen' ? ZEIT_WISSEN : ZEIT_SCHAETZEN;
      let rest = grenze;
      let beantwortet = false;

      root.innerHTML = `
        <div class="game-wrap game-playing">
          ${header(`<span class="tiny muted">${esc(q.t)}</span>`)}
          <div class="quiz-kopf">
            <div class="quiz-punkte"><span data-score>${ergebnisse.reduce((s, e) => s + e.punkte, 0)}</span><small>Punkte</small></div>
            <div class="quiz-schritte">
              ${fragen.map((_, i) => `<span class="quiz-punkt${i < nr ? ' fertig' : i === nr ? ' jetzt' : ''}"></span>`).join('')}
            </div>
          </div>
          <div class="quiz-uhr"><i data-uhr style="width:100%"></i></div>
          <div class="quiz-blatt">
            <p class="quiz-frage">${esc(q.f)}</p>
            ${q.art === 'wissen' ? `
              <div class="quiz-antworten">
                ${q.reihe.map((i) => `<button class="quiz-antwort" data-a="${i}">${esc(q.a[i])}</button>`).join('')}
              </div>`
            : `
              <div class="quiz-schaetzen">
                <div class="quiz-eingabe">
                  <input type="text" inputmode="decimal" data-tipp placeholder="Deine Schätzung" autocomplete="off">
                  <span class="quiz-einheit">${esc(q.e)}</span>
                </div>
                <p class="quiz-vorschau" data-vorschau>&nbsp;</p>
                <button class="btn btn-primary btn-block" data-ab disabled>Abgeben</button>
              </div>`}
          </div>
          <div class="quiz-echo" data-echo></div>
        </div>`;
      bindClose();

      const elUhr = root.querySelector('[data-uhr]');
      const elEcho = root.querySelector('[data-echo]');

      stopUhr();
      timer = setInterval(() => {
        rest -= 0.1;
        elUhr.style.width = `${Math.max(0, (rest / grenze) * 100)}%`;
        elUhr.classList.toggle('knapp', rest < grenze * 0.3);
        if (rest <= 0) { stopUhr(); abschliessen(null, 0); }
      }, 100);

      /* ── Wissensfrage ── */
      if (q.art === 'wissen') {
        root.querySelectorAll('[data-a]').forEach((b) => {
          b.onclick = () => {
            if (beantwortet) return;
            abschliessen(Number(b.dataset.a), rest, b);
          };
        });
      } else {
        /* ── Schätzfrage ── */
        const feld = root.querySelector('[data-tipp]');
        const ab = root.querySelector('[data-ab]');
        const vorschau = root.querySelector('[data-vorschau]');
        // Zahlen mit Tausenderpunkten mitlesen: „12000" ist auf dem Handy
        // sonst nicht von „120000" zu unterscheiden, ohne mitzuzählen.
        const lesen = () => {
          const roh = feld.value.replace(/\s|\./g, '').replace(',', '.');
          const n = roh === '' || roh === '-' ? NaN : Number(roh);
          return Number.isFinite(n) ? n : NaN;
        };
        feld.oninput = () => {
          const n = lesen();
          vorschau.textContent = Number.isFinite(n) ? `${zahl(n)} ${q.e}` : ' ';
          ab.disabled = !Number.isFinite(n);
        };
        feld.onkeydown = (e) => { if (e.key === 'Enter' && !ab.disabled) ab.click(); };
        ab.onclick = () => { if (!beantwortet) abschliessen(lesen(), rest); };
        setTimeout(() => feld.focus(), 60);
      }

      function abschliessen(antwort, restZeit, knopf) {
        if (beantwortet) return;
        beantwortet = true;
        stopUhr();

        let punkte = 0, richtig = false, zeile = '';
        if (q.art === 'wissen') {
          richtig = antwort === 0;
          punkte = punkteWissen(richtig, restZeit);
          root.querySelectorAll('[data-a]').forEach((b) => {
            b.disabled = true;
            if (Number(b.dataset.a) === 0) b.classList.add('richtig');
            else if (b === knopf) b.classList.add('falsch');
          });
          zeile = richtig
            ? `Richtig${restZeit > ZEIT_WISSEN * 0.6 ? ' — und schnell' : ''}. +${punkte}`
            : antwort == null ? 'Zeit vorbei. Richtig wäre gewesen: ' + q.a[0]
            : `Leider nein. Richtig: ${q.a[0]}`;
        } else {
          punkte = punkteSchaetzen(antwort, q.w);
          richtig = punkte >= MAX_PRO_FRAGE * 0.66;
          const feld = root.querySelector('[data-tipp]');
          const ab = root.querySelector('[data-ab]');
          if (feld) feld.disabled = true;
          if (ab) ab.disabled = true;
          zeile = Number.isFinite(antwort)
            ? `Es sind ${zahl(q.w)} ${q.e} — du lagst ${abweichung(antwort, q.w)} % daneben. +${punkte}`
            : `Zeit vorbei. Es sind ${zahl(q.w)} ${q.e}.`;
        }

        ergebnisse.push({ art: q.art, f: q.f, richtig, punkte, tipp: antwort, q });
        root.querySelector('[data-score]').textContent = ergebnisse.reduce((s, e) => s + e.punkte, 0);
        fx(punkte > 0 ? 'coin' : 'fail');

        elEcho.className = `quiz-echo an ${punkte > 0 ? 'gut' : 'daneben'}`;
        elEcho.innerHTML = `<b>${esc(zeile)}</b>${q.z ? `<small>${esc(q.z)}</small>` : ''}`;

        setTimeout(() => {
          nr++;
          if (nr < fragen.length) frageZeigen();
          else fertig(ergebnisse, runde, fragen);
        }, q.z ? 2600 : 1700);
      }
    }

    frageZeigen();
  }

  /**
   * Was von einer gespielten Runde übrig bleibt und mitgeschickt wird.
   *
   * Absichtlich mager: pro Frage nur die Punkte, ob es gestimmt hat und was
   * getippt wurde. Die Fragen selbst stehen auf beiden Geräten ohnehin in
   * derselben Datei und lassen sich aus der Rundennummer wieder herstellen —
   * sie mitzuschicken würde eine Brieftauben-Nachricht unnötig aufblähen.
   */
  const alsBericht = (ergebnisse) => ergebnisse.map((e) => ({
    p: e.punkte, r: e.richtig ? 1 : 0,
    t: e.art === 'schaetzen' && Number.isFinite(e.tipp) ? e.tipp
      : e.art === 'wissen' && e.tipp != null ? e.tipp : null
  }));

  function fertig(ergebnisse, runde, fragen) {
    stopUhr();
    const punkte = ergebnisse.reduce((s, e) => s + e.punkte, 0);
    const treffer = ergebnisse.filter((e) => e.richtig).length;

    // Vor dem Abschicken nachsehen: `submitScore` rechnet sofort ab und
    // räumt dabei den fremden Bericht aus dem laufenden Duell.
    const vorher = duel(get(), meta.id).theirs?.detail?.z || null;

    const { settled } = submitScore(meta.id, punkte, { treffer, runde, z: alsBericht(ergebnisse) });
    fx(settled?.result === 'me' ? 'yay' : 'pop');
    if (settled?.result === 'me') confetti(['sparkle', 'trophy']);
    else if (treffer === ergebnisse.length) confetti(['sparkle']);

    if (settled && vorher) { vergleich(fragen, alsBericht(ergebnisse), vorher, settled, runde); return; }

    /* Ich habe vorgelegt — es gibt noch nichts zu vergleichen. */
    root.innerHTML = `
      <div class="game-wrap">
        ${header()}
        <div class="game-center">
          <div class="game-hero">${icon('gameQuiz', { size: 68 })}</div>
          <div class="game-kicker">Eingeloggt · Runde ${runde}</div>
          <h2 class="game-h">${punkte} Punkte</h2>
          <div class="quiz-bilanz">
            ${ergebnisse.map((e) => `
              <div class="quiz-zeile ${e.punkte > 0 ? 'gut' : 'daneben'}">
                <span class="quiz-haken">${icon(e.punkte > 0 ? 'check' : 'close', { size: 13 })}</span>
                <span class="quiz-text">${esc(kurz(e.f))}</span>
                <b>${e.punkte}</b>
              </div>`).join('')}
          </div>
          <p class="game-p">Deine Antworten sind eingeloggt und lassen sich nicht mehr ändern.
            ${esc(partner)} bekommt jetzt genau dieselben ${FRAGEN_PRO_RUNDE} Fragen — danach seht ihr,
            wer wo richtig lag.</p>
          <button class="btn btn-primary btn-block" data-close>Fertig</button>
        </div>
      </div>`;
    bindClose();
  }

  /**
   * Der Vergleich — der eigentliche Punkt des Spiels.
   *
   * Nebeneinander, Frage für Frage: was du hattest, was der andere hatte.
   * Die Punktzahl allein sagt nur, wer gewonnen hat; interessant ist die
   * Zeile, in der einer von beiden als Einziger richtig lag.
   */
  function vergleich(fragen, meins, seins, settled, runde) {
    const ich = get().me?.name || 'Du';
    const summe = (b) => b.reduce((s, x) => s + (x?.p || 0), 0);
    const meinP = settled ? settled.mine : summe(meins);
    const seinP = settled ? settled.theirs : summe(seins);
    const ergebnis = settled?.result || (meinP > seinP ? 'me' : seinP > meinP ? 'them' : 'draw');

    root.innerHTML = `
      <div class="game-wrap">
        ${header(`<span class="tiny muted">Runde ${runde}</span>`)}
        <div class="game-scroll">
          <div class="quiz-duell">
            <div class="quiz-seite ${ergebnis === 'me' ? 'sieger' : ''}">
              <b>${meinP}</b><small>${esc(ich)}</small>
            </div>
            <span class="quiz-vs">${ergebnis === 'draw' ? 'gleich' : 'vs'}</span>
            <div class="quiz-seite ${ergebnis === 'them' ? 'sieger' : ''}">
              <b>${seinP}</b><small>${esc(partner)}</small>
            </div>
          </div>
          <p class="quiz-urteil">${(ergebnis === 'me'
            ? 'Du gewinnst die Runde.'
            : ergebnis === 'draw' ? 'Unentschieden.'
            : `${esc(partner)} gewinnt die Runde.`)
            + (settled?.reward ? ` +${settled.reward} Körner.` : '')}</p>

          ${fragen.map((q, i) => zeileVergleich(q, meins[i], seins[i])).join('')}

          <button class="btn btn-primary btn-block" data-again>Nächste Runde</button>
          <button class="btn btn-ghost btn-block" data-close>Fertig</button>
        </div>
      </div>`;
    root.querySelector('[data-again]').onclick = () => intro();
    bindClose();
  }

  /** Eine Frage im Vergleich: Text, richtige Antwort, beide Spalten. */
  function zeileVergleich(q, a = {}, b = {}) {
    const ich = get().me?.name || 'Du';
    const loesung = q.art === 'wissen' ? q.a[0] : `${zahl(q.w)} ${q.e}`;
    const gabe = (x) => {
      if (!x) return '<i>keine Antwort</i>';
      if (q.art === 'wissen') return x.t == null ? '<i>Zeit vorbei</i>' : esc(q.a[x.t]);
      return x.t == null ? '<i>Zeit vorbei</i>' : `${zahl(x.t)} ${esc(q.e)}`;
    };
    const spalte = (name, x, gewinnt) => `
      <div class="quiz-spalte ${x?.p > 0 ? 'gut' : 'daneben'}${gewinnt ? ' vorn' : ''}">
        <span class="quiz-wer">${esc(name)}</span>
        <span class="quiz-gabe">${gabe(x)}</span>
        <b>${x?.p || 0}</b>
      </div>`;
    return `
      <div class="quiz-karte">
        <p class="quiz-kfrage">${esc(q.f)}</p>
        <p class="quiz-loesung">${icon('check', { size: 12 })} ${esc(loesung)}${q.z ? `<small>${esc(q.z)}</small>` : ''}</p>
        <div class="quiz-spalten">
          ${spalte(ich, a, (a?.p || 0) > (b?.p || 0))}
          ${spalte(partner, b, (b?.p || 0) > (a?.p || 0))}
        </div>
      </div>`;
  }

  intro();
  return () => { cleanups.forEach((f) => f()); };
}

/** 1234567 → „1.234.567", 4.2 → „4,2". Deutsch, wie überall sonst hier. */
function zahl(n) {
  if (!Number.isFinite(n)) return '–';
  const nachkomma = Math.abs(n) < 100 && !Number.isInteger(n) ? 1 : 0;
  return n.toLocaleString('de-DE', { minimumFractionDigits: nachkomma, maximumFractionDigits: nachkomma });
}

/** Für die Bilanzliste: eine Zeile, kein Absatz. */
const kurz = (s) => (s.length > 46 ? `${s.slice(0, 44).trimEnd()}…` : s);
