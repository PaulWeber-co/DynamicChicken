/**
 * Stellungsprobe — beide benoten dieselbe Stellung, dann wird aufgedeckt.
 *
 * Eine Runde ist eine Stellung. Beide sehen dasselbe Bild, geben heimlich
 * eine Schulnote von 1 bis 6 und schreiben zwei Sätze dazu. Erst wenn beide
 * Noten da sind, deckt die App auf — und dann darf jeder auf das antworten,
 * was der andere geschrieben hat.
 *
 * Warum Schulnoten und nicht Sterne: Jeder in Deutschland weiß sofort, was
 * eine Vier bedeutet, und niemand muss überlegen, ob fünf Sterne viel oder
 * wenig sind. Und weil 1 das Beste ist, sortiert sich die Merkliste von
 * selbst richtig.
 *
 * Kein Zug-Zeiger, keine Reihenfolge: Beide können jederzeit benoten, in
 * beliebiger Reihenfolge, auch gleichzeitig. Die Stellung einer Runde folgt
 * allein aus Rundennummer und Paarcode, also kommen beide Geräte ohne
 * Absprache auf dieselbe.
 *
 * Was übrig bleibt, ist die Liste: Alles, was ihr beide benotet habt, steht
 * darin — oben das, wo ihr euch einig wart und beide gut fandet. Genau dafür
 * ist das Spiel da. Man vergisst sonst, was man neulich gut fand.
 */

import { esc } from '../util/dom.js';
import { cycled } from '../util/rng.js';
import { fx, burst, confetti } from '../util/feedback.js';
import { get, commit, subscribe } from '../state/store.js';
import { icon } from '../ui/icons.js';
import { pushFeed, addBondXp } from '../state/model.js';
import { REWARDS } from '../state/catalog.js';
import { sendEvent } from '../sync/index.js';
import { toast } from '../ui/toast.js';
import { pairKey } from './index.js';
import { STELLUNGEN, stellungById, GANGART } from './stellungen.js';
import { bild } from './stellungBild.js';

export const meta = {
  id: 'pose',
  icon: 'gamePose',
  title: 'Stellungsprobe',
  tagline: 'Beide benoten dieselbe Stellung — 1 bis 6, wie in der Schule',
  modes: ['async'],
  tone: 'love',
  spicy: true,
  howto: 'Eine Stellung, zwei heimliche Noten und zwei Sätze dazu. Danach wird aufgedeckt, und ihr könnt euch dazu austauschen. Was ihr beide gut findet, landet auf eurer Liste.'
};

/* ── Noten ──────────────────────────────────────────────── */

export const NOTEN = [
  { n: 1, kurz: 'Unbedingt',   lang: 'Sofort, gern öfter' },
  { n: 2, kurz: 'Sehr gern',   lang: 'Steht weit oben' },
  { n: 3, kurz: 'Gern',        lang: 'Machen wir doch' },
  { n: 4, kurz: 'Naja',        lang: 'Geht so, kein Highlight' },
  { n: 5, kurz: 'Eher nicht',  lang: 'Lieber etwas anderes' },
  { n: 6, kurz: 'Nie',         lang: 'Bitte nicht' }
];

export const MAX_TEXT = 160;
/** Ab hier gilt eine Note als gut — nur dann kann es ein Volltreffer werden. */
export const GUT = 2;

const noteInfo = (n) => NOTEN.find((x) => x.n === n) || NOTEN[3];

/** Ein Volltreffer: dieselbe Note, und die war gut. */
export const treffer = (a, b) => a === b && a <= GUT;

/**
 * Die Stellung einer Runde.
 *
 * `cycled` arbeitet den ganzen Vorrat einmal ab, bevor er neu mischt — so
 * kommt vor Runde 70 keine Stellung ein zweites Mal. Und weil nur
 * Rundennummer und Paarcode eingehen, rechnen beide Geräte dasselbe aus,
 * ohne sich abzusprechen.
 */
export function stellungFuer(runde, key) {
  const id = cycled(STELLUNGEN.map((s) => s.id), Math.max(0, runde - 1), `stellung|${key}`);
  return stellungById(id) || STELLUNGEN[0];
}

/* ── Zustand ────────────────────────────────────────────── */

function sp(state) {
  if (!state.games.pose) {
    state.games.pose = { r: 1, cur: null, offen: null, liste: [], hist: [] };
  }
  const g = state.games.pose;
  g.liste ||= [];
  g.hist ||= [];
  if (!Number.isFinite(g.r) || g.r < 1) g.r = 1;
  return g;
}

/** Der Eintrag, den beide Geräte gleich berechnen. */
function eintrag(g, id, mine, theirs) {
  return {
    id, r: g.r, at: Date.now(),
    note: mine.note, ihreNote: theirs.note,
    text: mine.text || '', ihrText: theirs.text || '',
    antwort: '', ihreAntwort: '',
    merk: treffer(mine.note, theirs.note)
  };
}

/**
 * Beide Noten da? Dann eintragen.
 *
 * Eine Stellung kann in einer späteren Mischung wiederkommen; dann ersetzt
 * die neue Benotung die alte, statt zweimal in der Liste zu stehen. Meinungen
 * ändern sich, die Liste soll den aktuellen Stand zeigen.
 */
function settle(state, g) {
  if (!g.cur?.mine || !g.cur?.theirs) return null;
  const e = eintrag(g, g.cur.id, g.cur.mine, g.cur.theirs);

  const alt = g.liste.findIndex((x) => x.id === e.id);
  if (alt >= 0) g.liste.splice(alt, 1);
  g.liste.unshift(e);
  if (g.liste.length > 80) g.liste.length = 80;

  g.hist.unshift({ r: g.r, id: e.id, note: e.note, ihreNote: e.ihreNote, at: e.at });
  if (g.hist.length > 30) g.hist.length = 30;

  state.me.coins += e.merk ? REWARDS.gameWon : REWARDS.gamePlayed;
  addBondXp(state, e.merk ? 8 : 4);
  state.me.pet.stats.joy = Math.min(100, state.me.pet.stats.joy + 4);
  pushFeed(state, {
    from: 'system', type: 'game', icon: 'gamePose',
    text: e.merk
      ? `Stellungsprobe: ${stellungById(e.id)?.n} — beide ${e.note}`
      : `Stellungsprobe: ${stellungById(e.id)?.n} — ${e.note} und ${e.ihreNote}`
  });

  g.offen = { ...e, seen: false };
  g.r++;
  g.cur = null;
  return g.offen;
}

/** Runde überspringen — die Stellung kommt in einer späteren Mischung wieder. */
function weiter(g) {
  g.cur = null;
  g.offen = null;
  g.r++;
}

/** Der Text, der reisen darf: gekürzt, ohne Steuerzeichen. */
function sauber(t) {
  return String(t ?? '').replace(/\s+/g, ' ').trim().slice(0, MAX_TEXT);
}

const gueltigeNote = (n) => {
  const v = Math.round(Number(n));
  return v >= 1 && v <= 6 ? v : null;
};

/* ── Auswertung für die Liste ───────────────────────────── */

/**
 * Die Liste, sortiert.
 *
 * Oben steht, was ihr beide gut fandet — erst die Volltreffer, dann alles
 * andere nach der Summe beider Noten. Zwei Zweien schlagen eine Eins und
 * eine Vier, und das ist auch richtig so: Es geht um das, was ihr *gemeinsam*
 * gut findet, nicht um das, was einer allein liebt.
 */
export function sortiert(liste) {
  return liste.slice().sort((a, b) => {
    if (a.merk !== b.merk) return a.merk ? -1 : 1;
    const sa = a.note + a.ihreNote, sb = b.note + b.ihreNote;
    if (sa !== sb) return sa - sb;
    return Math.abs(a.note - a.ihreNote) - Math.abs(b.note - b.ihreNote);
  });
}

function urteil(e, partner) {
  if (e.merk) return `Beide ${e.note} — das kommt ganz nach oben.`;
  if (e.note === e.ihreNote) return `Beide ${e.note}. Immerhin einig.`;
  const spanne = Math.abs(e.note - e.ihreNote);
  if (spanne >= 3) {
    return e.note < e.ihreNote
      ? `Du ${e.note}, ${partner} ${e.ihreNote}. Darüber solltet ihr reden.`
      : `${partner} ${e.ihreNote}, du ${e.note}. Darüber solltet ihr reden.`;
  }
  if (Math.min(e.note, e.ihreNote) <= GUT) return 'Einer ist überzeugt, der andere fast. Ausbaufähig.';
  return 'Findet ihr beide eher nichts. Nächste.';
}

/* ── Netzwerk ───────────────────────────────────────────── */

const KINDS = ['poseNote', 'poseAntwort', 'poseSkip'];

export function handleRemote(state, msg, { partnerName }) {
  if (!KINDS.includes(msg.kind)) return undefined;
  const g = sp(state);

  if (msg.kind === 'poseSkip') {
    // Nur solange hier noch niemand benotet hat — sonst würde die eigene
    // Note stillschweigend verfallen.
    if (msg.r < g.r || g.cur?.mine) return null;
    weiter(g);
    commit('pose');
    return {
      kind: 'gameTurn', icon: 'gamePose', avatar: 'them',
      title: `${partnerName} hat weitergeblättert`,
      sub: 'Stellungsprobe',
      body: 'Die Stellung war wohl nichts. Es liegt schon die nächste bereit.',
      actions: [{ label: 'Ansehen', act: 'game:pose', primary: true }, { label: 'Später', act: 'dismiss' }],
      tone: 'calm'
    };
  }

  if (msg.kind === 'poseAntwort') {
    const text = sauber(msg.text);
    if (!text) return null;
    // Die Antwort gehört zu genau der Runde, in der benotet wurde
    const e = g.liste.find((x) => x.r === msg.r) || g.liste[0];
    if (!e) return null;
    e.ihreAntwort = text;
    if (g.offen && g.offen.r === e.r) g.offen.ihreAntwort = text;
    commit('pose');
    return {
      kind: 'gameResult', icon: 'gamePose', avatar: 'them',
      title: `${partnerName} hat geantwortet`,
      sub: stellungById(e.id)?.n || 'Stellungsprobe',
      body: text,
      actions: [{ label: 'Ansehen', act: 'game:pose', primary: true }, { label: 'Ok', act: 'dismiss' }],
      tone: 'love'
    };
  }

  /* Note des anderen */
  const note = gueltigeNote(msg.note);
  if (!note) return null;
  if (msg.r < g.r) return null;
  if (msg.r > g.r) { g.r = msg.r; g.cur = null; g.offen = null; }

  const id = stellungById(msg.id) ? msg.id : stellungFuer(g.r, pairKey(state)).id;
  g.cur ||= { id, mine: null, theirs: null };
  g.cur.id = g.cur.mine ? g.cur.id : id;
  if (g.cur.theirs) return null;
  g.cur.theirs = { note, text: sauber(msg.text) };

  const v = settle(state, g);
  commit('pose');
  const st = stellungById(g.cur?.id || id);

  if (!v) {
    return {
      kind: 'gameWaiting', icon: 'gamePose', avatar: 'them',
      title: `${partnerName} hat benotet`,
      sub: `Stellungsprobe · ${st?.n || ''}`,
      body: `${partnerName} hat eine Note vergeben. Welche, siehst du erst, wenn du auch eine gegeben hast.`,
      actions: [{ label: 'Jetzt benoten', act: 'game:pose', primary: true }, { label: 'Später', act: 'dismiss' }],
      tone: 'love'
    };
  }

  return {
    kind: 'gameResult', icon: v.merk ? 'trophy' : 'gamePose', avatar: 'them',
    title: v.merk ? `Beide ${v.note}!` : 'Aufgedeckt',
    sub: `${stellungById(v.id)?.n} · du ${v.note}, ${partnerName} ${v.ihreNote}`,
    body: urteil(v, partnerName),
    actions: [{ label: 'Ansehen', act: 'game:pose', primary: true }, { label: 'Ok', act: 'dismiss' }],
    tone: v.merk ? 'love' : 'calm'
  };
}

export function summary(state) {
  const g = sp(state);
  if (g.offen && !g.offen.seen) return { badge: 'wait', text: 'Aufgedeckt' };
  if (g.cur?.theirs && !g.cur?.mine) return { badge: 'wait', text: 'Du bist dran' };
  if (g.cur?.mine) return { badge: 'off', text: 'Unterwegs' };
  const t = g.liste.filter((e) => e.merk).length;
  if (t) return { badge: null, text: `${t}× einig` };
  return g.liste.length ? { badge: null, text: `${g.liste.length} benotet` } : { badge: null, text: 'Neu' };
}

/* ── Oberfläche ─────────────────────────────────────────── */

export function mount(root, ctx) {
  const partner = get().partner?.name || 'Dein Mensch';
  /** Welcher Bildschirm gerade steht — nur passive dürfen sich selbst ablösen. */
  let screen = '';

  const shell = (inner) => {
    const g = sp(get());
    return `
      <div class="game-wrap">
        <div class="game-top">
          <button class="game-x" data-close aria-label="Schließen">${icon('close', { size: 15 })}</button>
          <div class="game-title">Stellungsprobe</div>
          <div class="game-right"><span class="badge">${g.liste.length}</span></div>
        </div>
        <div class="game-scroll">${inner}</div>
      </div>`;
  };

  const bindClose = () => {
    root.querySelectorAll('[data-close]').forEach((b) => { b.onclick = () => ctx.close(); });
    const l = root.querySelector('[data-liste]');
    if (l) l.onclick = () => screenListe();
  };

  /**
   * Ohne freizügige Inhalte gibt es hier nichts zu sehen.
   *
   * Das Spiel zeigt gezeichnete Stellungen und nennt sie beim Namen — das
   * gehört hinter denselben Schalter wie die heißen Kribbeln-Karten. Statt
   * die Kachel wortlos zu sperren, steht hier, wo man ihn findet.
   */
  function screenGesperrt() {
    screen = 'lock';
    root.innerHTML = shell(`
      <div class="game-center">
        <div class="game-hero">${icon('lock', { size: 56 })}</div>
        <h2 class="game-h">Erst freischalten</h2>
        <p class="game-p">
          Hier werden Stellungen gezeigt und beim Namen genannt. Das gibt es nur
          mit eingeschalteten freizügigen Inhalten — unter <b>Mehr → Freizügige
          Inhalte</b>.
        </p>
        <button class="btn btn-ghost btn-block" data-close>Verstanden</button>
      </div>`);
    bindClose();
  }

  /* — Benoten — */
  function screenNoten() {
    screen = 'noten';
    const st = get();
    const g = sp(st);
    const stellung = stellungById(g.cur?.id) || stellungFuer(g.r, pairKey(st));
    let note = null;

    const zeichnen = () => {
      root.innerHTML = shell(`
        <div class="pose-kopf">
          <span class="doodle-kicker" data-kicker>Runde ${g.r}${sp(get()).cur?.theirs ? ` · ${esc(partner)} hat schon` : ''}</span>
          <b>${esc(stellung.n)}</b>
          <div class="pose-chips">
            <span class="pose-chip">${esc(stellung.g)}</span>
            <span class="pose-chip s${stellung.s}">${esc(GANGART[stellung.s])}</span>
          </div>
        </div>
        <div class="pose-buehne">${bild(stellung)}</div>
        <p class="pose-text">${esc(stellung.d)}</p>

        <div class="section-label">Deine Note</div>
        <div class="pose-noten">
          ${NOTEN.map((x) => `<button class="pose-note ${note === x.n ? 'on' : ''}" data-note="${x.n}"
            aria-pressed="${note === x.n}" aria-label="Note ${x.n}: ${esc(x.kurz)}">
            <span class="pose-ziffer">${x.n}</span>
            <span class="pose-label">${esc(x.kurz)}</span>
          </button>`).join('')}
        </div>

        <div class="section-label">Und warum?</div>
        <textarea class="input pose-eingabe" data-text rows="2" maxlength="${MAX_TEXT}"
          placeholder="Ein Satz reicht — ${esc(partner)} sieht ihn erst, wenn er selbst benotet hat"></textarea>
        <div class="pose-zahl tiny muted" data-zahl>0/${MAX_TEXT}</div>

        <button class="btn btn-love btn-block" data-send ${note ? '' : 'disabled'}>
          ${note ? 'Verdeckt abschicken' : 'Erst eine Note wählen'}
        </button>
        <button class="btn btn-ghost btn-sm btn-block" data-skip>Andere Stellung</button>
        ${listeTeaser()}`);

      const feld = root.querySelector('[data-text]');
      const zahl = root.querySelector('[data-zahl]');
      feld.value = merkText;
      zahl.textContent = `${feld.value.length}/${MAX_TEXT}`;
      feld.oninput = () => {
        merkText = feld.value;
        zahl.textContent = `${feld.value.length}/${MAX_TEXT}`;
      };

      root.querySelectorAll('[data-note]').forEach((b) => {
        b.onclick = () => { note = Number(b.dataset.note); fx('tap'); zeichnen(); };
      });
      const send = root.querySelector('[data-send]');
      if (send) send.onclick = () => abschicken(stellung, note, feld.value);
      root.querySelector('[data-skip]').onclick = () => ueberspringen();
      bindClose();
    };

    // Der Text überlebt das Neuzeichnen nach jedem Notenklick
    let merkText = '';
    zeichnen();
  }

  function abschicken(stellung, note, text) {
    const st = get();
    const g = sp(st);
    if (!note) return;
    g.cur ||= { id: stellung.id, mine: null, theirs: null };
    if (g.cur.mine) { route(); return; }
    g.cur.mine = { note, text: sauber(text) };
    sendEvent('game', { g: 'pose', kind: 'poseNote', r: g.r, id: g.cur.id, note, text: g.cur.mine.text });
    const v = settle(st, g);
    commit('pose');
    fx('pop');
    if (v) {
      if (v.merk) confetti(['gamePose', 'statJoy', 'sparkle']);
      screenAuf(v);
    } else {
      screenWarten(stellung);
    }
  }

  function ueberspringen() {
    const st = get();
    const g = sp(st);
    sendEvent('game', { g: 'pose', kind: 'poseSkip', r: g.r });
    weiter(g);
    commit('pose');
    fx('tap');
    toast('Nächste Stellung');
    route();
  }

  function screenWarten(stellung) {
    screen = 'warten';
    root.innerHTML = shell(`
      <div class="game-center">
        <div class="game-hero">${icon('lock', { size: 52 })}</div>
        <h2 class="game-h">Verdeckt abgeschickt</h2>
        <p class="game-p">
          Sobald ${esc(partner)} <b>${esc(stellung.n)}</b> auch benotet hat,
          seht ihr gleichzeitig, was der andere geschrieben hat.
        </p>
      </div>
      <div class="pose-buehne klein">${bild(stellung)}</div>
      <button class="btn btn-ghost btn-block" data-close style="margin-top:14px">Fertig</button>
      ${listeTeaser()}`);
    bindClose();
  }

  /* — Aufgedeckt — */
  function screenAuf(v) {
    screen = 'auf';
    const stellung = stellungById(v.id) || STELLUNGEN[0];
    const spalte = (titel, note, text, antwort, wer) => {
      const i = noteInfo(note);
      return `<div class="pose-karte ${wer}">
        <div class="pose-karte-kopf">
          <span class="pose-wer">${esc(titel)}</span>
          <span class="pose-gross">${note}</span>
        </div>
        <div class="pose-note-lang">${esc(i.kurz)}</div>
        ${text ? `<p class="pose-zitat">„${esc(text)}“</p>` : '<p class="pose-zitat leer">Kein Kommentar</p>'}
        ${antwort ? `<p class="pose-antwort">${icon('nudgeThink', { size: 12, cls: 'ic-inline' })} ${esc(antwort)}</p>` : ''}
      </div>`;
    };

    root.innerHTML = shell(`
      <div class="pose-kopf">
        <span class="doodle-kicker">Aufgedeckt</span>
        <b>${esc(stellung.n)}</b>
      </div>
      <div class="pose-buehne klein">${bild(stellung)}</div>
      ${v.merk ? `<div class="pose-treffer">${icon('trophy', { size: 18 })}
        <span>Beide ${v.note} — steht jetzt ganz oben auf eurer Liste</span></div>` : ''}
      <div class="pose-vergleich">
        ${spalte('Du', v.note, v.text, v.antwort, 'ich')}
        ${spalte(partner, v.ihreNote, v.ihrText, v.ihreAntwort, 'du')}
      </div>
      <p class="tiny muted center" style="margin:10px 4px 0">${esc(urteil(v, partner))}</p>

      ${v.antwort ? '' : `
        <div class="section-label">Antworten</div>
        <textarea class="input pose-eingabe" data-antwort rows="2" maxlength="${MAX_TEXT}"
          placeholder="Was sagst du dazu?"></textarea>
        <button class="btn btn-ghost btn-sm btn-block" data-send-antwort>Antwort schicken</button>`}

      <button class="btn btn-primary btn-block" data-next style="margin-top:12px">Nächste Stellung</button>
      <button class="btn btn-ghost btn-block" data-liste>Eure Liste ansehen</button>`);

    const feld = root.querySelector('[data-antwort]');
    const knopf = root.querySelector('[data-send-antwort]');
    if (knopf) knopf.onclick = () => {
      const text = sauber(feld.value);
      if (!text) { feld.focus(); return; }
      const st = get();
      const g = sp(st);
      const e = g.liste.find((x) => x.r === v.r);
      if (e) e.antwort = text;
      if (g.offen && g.offen.r === v.r) g.offen.antwort = text;
      sendEvent('game', { g: 'pose', kind: 'poseAntwort', r: v.r, text });
      commit('pose');
      fx('pop');
      toast('Antwort unterwegs');
      screenAuf({ ...v, antwort: text });
    };

    root.querySelector('[data-next]').onclick = () => { quittieren(); route(); };
    if (v.merk) {
      const el = root.querySelector('.pose-treffer');
      if (el) burst(['statJoy'], { from: el, count: 6, rise: 100 });
    }
    bindClose();
  }

  /* — Die Liste — */
  function screenListe() {
    screen = 'liste';
    const g = sp(get());
    const eintraege = sortiert(g.liste);
    const treff = eintraege.filter((e) => e.merk).length;
    let offenId = '';

    const zeichnen = () => {
      root.innerHTML = shell(`
        <div class="pose-kopf">
          <span class="doodle-kicker">${eintraege.length} von ${STELLUNGEN.length} benotet</span>
          <b>Eure Liste</b>
        </div>
        ${eintraege.length ? `
          <p class="tiny muted center" style="margin:0 0 12px">
            Oben steht, worauf ihr euch einig wart. Antippen zeigt, was ihr
            geschrieben habt.
          </p>
          <div class="pose-liste">
            ${eintraege.map((e) => {
              const s = stellungById(e.id);
              if (!s) return '';
              const auf = offenId === e.id;
              return `<div class="pose-zeile ${e.merk ? 'merk' : ''} ${auf ? 'auf' : ''}">
                <button class="pose-zeile-kopf" data-auf="${esc(e.id)}" aria-expanded="${auf}">
                  <span class="pose-thumb">${bild(s, { cls: 'pose-mini' })}</span>
                  <span class="grow">
                    <span class="pose-zeile-t">${esc(s.n)}${e.merk ? ` ${icon('sparkle', { size: 12, cls: 'ic-inline' })}` : ''}</span>
                    <span class="pose-zeile-s">${esc(s.g)} · ${esc(noteInfo(Math.round((e.note + e.ihreNote) / 2)).kurz)}</span>
                  </span>
                  <span class="pose-paar">
                    <span class="pose-pill ich">${e.note}</span>
                    <span class="pose-pill du">${e.ihreNote}</span>
                  </span>
                </button>
                ${auf ? `<div class="pose-detail">
                  <p class="pose-text">${esc(s.d)}</p>
                  ${e.text ? `<p class="pose-zitat"><b>Du:</b> „${esc(e.text)}“</p>` : ''}
                  ${e.antwort ? `<p class="pose-antwort"><b>Du:</b> ${esc(e.antwort)}</p>` : ''}
                  ${e.ihrText ? `<p class="pose-zitat"><b>${esc(partner)}:</b> „${esc(e.ihrText)}“</p>` : ''}
                  ${e.ihreAntwort ? `<p class="pose-antwort"><b>${esc(partner)}:</b> ${esc(e.ihreAntwort)}</p>` : ''}
                </div>` : ''}
              </div>`;
            }).join('')}
          </div>
          <p class="tiny muted center" style="margin:12px 4px 0">
            ${treff ? `${treff}× habt ihr dieselbe gute Note gegeben.` : 'Noch kein Volltreffer — kommt schon noch.'}
          </p>` : `
          <div class="empty">
            <span class="empty-emoji">${icon('gamePose', { size: 40 })}</span>
            Noch nichts benotet.<br>Eine Runde reicht, dann steht hier die erste.
          </div>`}
        <button class="btn btn-primary btn-block" data-next style="margin-top:14px">Zurück</button>`);

      root.querySelectorAll('[data-auf]').forEach((b) => {
        b.onclick = () => { offenId = offenId === b.dataset.auf ? '' : b.dataset.auf; fx('tap'); zeichnen(); };
      });
      root.querySelector('[data-next]').onclick = () => route();
      bindClose();
    };
    zeichnen();
  }

  function listeTeaser() {
    const g = sp(get());
    if (!g.liste.length) return '';
    const treff = g.liste.filter((e) => e.merk).length;
    const oben = sortiert(g.liste)[0];
    return `<div class="section-label">Eure Liste</div>
      <div class="list">
        <button class="li" data-liste>
          <div class="li-ico">${icon('gamePose', { size: 19 })}</div>
          <div class="grow">
            <div class="li-title">${g.liste.length} benotet${treff ? ` · ${treff}× einig` : ''}</div>
            <div class="li-sub">Ganz oben: ${esc(stellungById(oben.id)?.n || '')}</div>
          </div>
          <span class="li-chev">${icon('chevron', { size: 16 })}</span>
        </button>
      </div>`;
  }

  /** Die Auflösung ist gesehen — beim nächsten Öffnen geht es weiter. */
  function quittieren() {
    const g = sp(get());
    if (g.offen) { g.offen = null; commit('pose'); }
  }

  function route() {
    const st = get();
    if (!st.settings?.spicy) { screenGesperrt(); return; }
    const g = sp(st);
    if (g.offen && !g.offen.seen) screenAuf(g.offen);
    else if (g.cur?.mine) screenWarten(stellungById(g.cur.id) || STELLUNGEN[0]);
    else screenNoten();
  }

  route();

  // Kommt die Note des anderen herein, während man auf dem Wartebildschirm
  // sitzt, soll die Auflösung von selbst erscheinen. Mitten im Benoten wäre
  // ein Wechsel eine Frechheit — deshalb nur die passiven Ansichten.
  // subscribe ruft mit (state, reason) auf — der Grund ist das zweite Argument.
  const unsub = subscribe((_, reason) => {
    if (reason !== 'pose' && reason !== 'remote') return;
    if (screen === 'warten' || screen === 'auf') { route(); return; }
    // Beim Benoten wird nicht neu gezeichnet — das würde die angefangene
    // Notiz und die gewählte Note wegwerfen. Nur die Zeile oben erfährt,
    // dass drüben schon jemand fertig ist.
    if (screen === 'noten' && sp(get()).cur?.theirs) {
      const k = root.querySelector('[data-kicker]');
      if (k && !k.textContent.includes(partner)) k.textContent += ` · ${partner} hat schon`;
    }
  });
  return () => unsub();
}
