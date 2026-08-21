/**
 * Tabu — erklären, ohne die fünf Wörter zu sagen.
 *
 * Am Tisch braucht Tabu einen Dritten, der mitliest und summt, wenn ein
 * verbotenes Wort fällt. Genau den ersetzt hier die App: Sie prüft die
 * Umschreibung, während man sie tippt, und lässt sie gar nicht erst
 * abschicken, solange etwas Verbotenes drinsteht. Dadurch geht Tabu zu
 * zweit — und sogar zeitversetzt, weil niemand danebensitzen muss.
 *
 * Der zweite Umbau betrifft die Spannung. Ein einzelner Rateversuch wäre
 * hart, drei hintereinander wären beliebig. Also wird nach jedem Fehlgriff
 * eines der verbotenen Wörter aufgedeckt: Die stärksten Hinweise der Karte
 * kommen nach und nach ins Spiel, und die Punkte sinken mit jedem davon.
 * Wer sofort trifft, hat es ohne Hilfe geschafft.
 *
 * Gepunktet wird gemeinsam. Eine gute Umschreibung und ein guter Tipp sind
 * dieselbe Leistung, und wer gegeneinander spielt, schreibt absichtlich
 * schlecht — das wäre ein Spiel, das sich selbst kaputtmacht.
 */

import { esc } from '../util/dom.js';
import { fx, burst, confetti } from '../util/feedback.js';
import { get, commit } from '../state/store.js';
import { icon } from '../ui/icons.js';
import { toast } from '../ui/toast.js';
import { rng } from '../util/rng.js';
import { REWARDS } from '../state/catalog.js';
import { pushFeed, addBondXp } from '../state/model.js';
import { sendEvent } from '../sync/index.js';
import { seedFor, pairKey } from './index.js';
import {
  WORTE, STUFEN, TABUS, VERSUCHE, MAX_TEXT, PUNKTE,
  verstoesse, trifft, stufeById, stapelGroesse
} from './tabuWorte.js';

export const meta = {
  id: 'tabu',
  icon: 'gameTabu',
  title: 'Tabu',
  tagline: 'Erklären, ohne die fünf Wörter',
  modes: ['async'],
  tone: 'warm',
  howto: 'Einer bekommt einen Begriff und fünf verbotene Wörter und schreibt eine Umschreibung — die App passt auf, dass keins davon vorkommt. Der andere hat drei Versuche; nach jedem Fehlgriff wird ein verbotenes Wort aufgedeckt.'
};

export { WORTE, STUFEN };

/* ── Zustand ────────────────────────────────────────────── */

function tb(state) {
  if (!state.games.tabu) {
    state.games.tabu = {
      r: 1, turn: null, cur: null, offen: null,
      score: { me: 0, them: 0 }, hist: [], gesehen: []
    };
  }
  const g = state.games.tabu;
  g.score ||= { me: 0, them: 0 };
  g.hist ||= [];
  g.gesehen ||= [];
  if (!g.turn) g.turn = ersterZug(state) ? 'me' : 'them';
  return g;
}

const ersterZug = (state) => (state.me.code || '') < (state.partner?.code || '~');

/**
 * Eine Karte ziehen, die ihr noch nicht hattet.
 *
 * `gesehen` merkt sich die Begriffe. Ohne das Gedächtnis kommt bei 140
 * Karten schon nach zwanzig Runden Bekanntes — und ein Begriff, den man
 * schon einmal erklärt hat, ist beim zweiten Mal keine Aufgabe mehr.
 */
export function zieheKarte(stufe, gesehen = [], seed = Date.now()) {
  const stapel = WORTE[stufe] || WORTE.alltag;
  const kenne = new Set(gesehen);
  let rest = stapel.filter((k) => !kenne.has(k.w));
  if (!rest.length) rest = stapel.slice();
  const r = rng(`${seed}|${stufe}|${gesehen.length}`);
  return rest[Math.floor(r() * rest.length)];
}

function merken(g, wort) {
  g.gesehen = [wort, ...g.gesehen.filter((w) => w !== wort)].slice(0, 200);
}

/** Aus dem, was hereinkommt, eine brauchbare Karte machen. */
function saubereKarte(msg) {
  const w = String(msg.w ?? '').trim().slice(0, 40);
  const t = Array.isArray(msg.t)
    ? msg.t.map((x) => String(x ?? '').trim().slice(0, 28)).filter(Boolean).slice(0, TABUS)
    : [];
  const text = String(msg.text ?? '').trim().slice(0, MAX_TEXT);
  if (!w || !text) return null;
  return { w, t, text };
}

/** Runde abschließen und die Auflösung für beide liegen lassen. */
function abrechnen(state, g, { tipps, punkte, versuch, geloest }) {
  const c = g.cur;
  g.offen = {
    r: g.r, stufe: c.stufe, w: c.karte.w, t: c.karte.t.slice(), text: c.text,
    tipps: tipps.slice(), punkte, versuch, geloest,
    // Wer geraten hat — die Auflösung liest sich für beide gleich, nur die
    // Beschriftung dreht sich
    riet: c.by === 'them' ? 'me' : 'them'
  };
  g.score.me += punkte;
  g.score.them += punkte;
  g.hist.unshift({ r: g.r, w: c.karte.w, stufe: c.stufe, punkte, versuch, geloest, at: Date.now() });
  if (g.hist.length > 20) g.hist.length = 20;

  state.me.coins += geloest ? REWARDS.gameWon : REWARDS.gamePlayed;
  addBondXp(state, 3 + Math.round(punkte / 25));
  state.me.pet.stats.joy = Math.min(100, state.me.pet.stats.joy + 4);
  pushFeed(state, {
    from: 'system', type: 'game', icon: 'gameTabu',
    text: geloest
      ? `Tabu: „${c.karte.w}" im ${versuch}. Versuch · ${punkte} Punkte`
      : `Tabu: „${c.karte.w}" nicht erraten`
  });

  merken(g, c.karte.w);
  g.r++;
  g.turn = g.turn === 'me' ? 'them' : 'me';
  g.cur = null;
}

function abbrechen(g) {
  if (g.cur?.karte) merken(g, g.cur.karte.w);
  g.cur = null;
  g.offen = null;
  g.r++;
  g.turn = g.turn === 'me' ? 'them' : 'me';
}

/* ── Netzwerk ───────────────────────────────────────────── */

const KINDS = ['tabuKarte', 'tabuTipp', 'tabuSkip'];

export function handleRemote(state, msg, { partnerName }) {
  if (!KINDS.includes(msg.kind)) return undefined;
  const g = tb(state);

  if (msg.kind === 'tabuSkip') {
    if (msg.r < g.r || !g.cur) return null;
    abbrechen(g);
    commit('tabu');
    return {
      kind: 'gameTurn', icon: 'gameTabu', avatar: 'them',
      title: `${partnerName} hat die Karte weggelegt`,
      sub: 'Tabu',
      body: `Der Begriff war wohl nicht zu erklären. ${g.turn === 'me' ? 'Du bist dran.' : `${partnerName} macht weiter.`}`,
      actions: [{ label: 'Weiter', act: 'game:tabu', primary: true }, { label: 'Ok', act: 'dismiss' }],
      tone: 'calm'
    };
  }

  if (msg.kind === 'tabuKarte') {
    if (msg.r < g.r) return null;
    // Beide gleichzeitig losgeschrieben? Dieselbe Seite gewinnt auf beiden
    // Geräten, sonst wartet jeder auf den Tipp zur eigenen Karte.
    if (g.cur?.by === 'me' && msg.r === g.r && ersterZug(state)) return null;
    const k = saubereKarte(msg);
    if (!k) return null;
    g.r = msg.r;
    g.turn = 'them';
    g.cur = {
      stufe: stufeById(msg.stufe).id, by: 'them',
      karte: { w: k.w, t: k.t }, text: k.text, tipps: []
    };
    commit('tabu');
    return {
      kind: 'gameTurn', icon: 'gameTabu', avatar: 'them',
      title: `${partnerName} hat umschrieben`,
      sub: `Tabu · ${stufeById(msg.stufe).label}`,
      body: `Eine Umschreibung wartet auf dich. Drei Versuche — und nach jedem Fehlgriff wird ein verbotenes Wort aufgedeckt.`,
      actions: [{ label: 'Raten', act: 'game:tabu', primary: true }, { label: 'Später', act: 'dismiss' }],
      tone: 'warm'
    };
  }

  /* Der andere hat meine Karte geraten */
  if (!g.cur || g.cur.by !== 'me') return null;
  const tipps = Array.isArray(msg.tipps)
    ? msg.tipps.map((x) => String(x ?? '').trim().slice(0, 40)).slice(0, VERSUCHE) : [];
  const geloest = !!msg.geloest;
  const versuch = Math.max(1, Math.min(VERSUCHE, Math.round(Number(msg.versuch) || VERSUCHE)));
  const punkte = geloest ? (PUNKTE[versuch - 1] ?? 0) : 0;
  const wort = g.cur.karte.w;
  abrechnen(state, g, { tipps, punkte, versuch, geloest });
  commit('tabu');

  return {
    kind: 'gameResult',
    icon: geloest ? 'trophy' : 'gameTabu',
    avatar: 'them',
    title: geloest ? `Erraten im ${versuch}. Versuch` : 'Nicht erraten',
    sub: `Tabu · „${wort}"`,
    body: geloest
      ? `${partnerName} hat „${wort}" erkannt. ${punkte} Punkte für euch beide.`
      : `${partnerName} ist nicht auf „${wort}" gekommen. Sieh nach, was getippt wurde.`,
    actions: [{ label: 'Ansehen', act: 'game:tabu', primary: true }, { label: 'Später', act: 'dismiss' }],
    tone: geloest ? 'warm' : 'calm'
  };
}

export function summary(state) {
  const g = state.games?.tabu;
  if (!g) return { badge: null, text: 'Neu' };
  if (g.offen) return { badge: 'wait', text: 'Auflösung da' };
  if (g.cur?.by === 'them') return { badge: 'wait', text: 'Du bist dran' };
  if (g.cur?.by === 'me') return { badge: 'off', text: 'Wartet auf Antwort' };
  if (g.turn === 'me') return { badge: 'wait', text: 'Du erklärst' };
  const n = (g.hist || []).length;
  return n ? { badge: null, text: `${g.score.me} Punkte` } : { badge: null, text: 'Neu' };
}

/* ── Oberfläche ─────────────────────────────────────────── */

export function mount(root, ctx) {
  const partner = get().partner?.name || 'Dein Mensch';

  const shell = (inner, right = '') => `
    <div class="game-wrap">
      <div class="game-top">
        <button class="game-x" data-close aria-label="Schließen">${icon('close', { size: 15 })}</button>
        <div class="game-title">${esc(meta.title)}</div>
        <div class="game-right">${right}</div>
      </div>
      <div class="game-scroll">${inner}</div>
    </div>`;
  const bindClose = () => root.querySelectorAll('[data-close]').forEach((b) => { b.onclick = () => ctx.close(); });

  /* — Stufe wählen — */
  function screenStufe() {
    const st = get();
    const g = tb(st);
    const spicyOn = !!st.settings.spicy;
    root.innerHTML = shell(`
      <div class="hue-lead">
        <span class="doodle-kicker">Runde ${g.r} · du erklärst</span>
        <b>Aus welchem Stapel?</b>
      </div>
      <p class="tiny muted center" style="margin:0 0 14px">
        Du bekommst einen Begriff und fünf Wörter, die du nicht benutzen darfst.
      </p>
      <div class="krib-tiers">
        ${STUFEN.map((s) => {
          const off = s.spicy && !spicyOn;
          return `<button class="krib-tier ${off ? 'off' : ''}" data-stufe="${s.id}" ${off ? 'disabled' : ''}>
            <span class="krib-tier-e">${icon(s.icon, { size: 24 })}</span>
            <span class="grow">
              <span class="krib-tier-t">${esc(s.label)}</span>
              <span class="krib-tier-s">${off ? 'Erst unter Mehr → freizügige Inhalte' : `${esc(s.sub)} · ${stapelGroesse(s.id)} Karten`}</span>
            </span>
            ${off ? icon('lock', { size: 14 }) : icon('chevron', { size: 14 })}
          </button>`;
        }).join('')}
        <button class="krib-tier" data-eigen>
          <span class="krib-tier-e">${icon('edit', { size: 22 })}</span>
          <span class="grow">
            <span class="krib-tier-t">Eigenes Wort</span>
            <span class="krib-tier-s">Begriff und Verbote selbst festlegen</span>
          </span>
          ${icon('chevron', { size: 14 })}
        </button>
      </div>
      ${punktestand(g)}`);
    root.querySelectorAll('[data-stufe]').forEach((b) => {
      b.onclick = () => { fx('pop'); screenErklaeren(b.dataset.stufe); };
    });
    root.querySelector('[data-eigen]').onclick = () => { fx('tap'); screenEigen(); };
    bindClose();
  }

  /* — Eigene Karte bauen — */
  function screenEigen() {
    root.innerHTML = shell(`
      <div class="hue-lead">
        <span class="doodle-kicker">Eigenes Wort</span>
        <b>Was soll erraten werden?</b>
      </div>
      <p class="tiny muted center" style="margin:0 0 14px">
        Der Begriff und bis zu fünf Wörter, die du beim Erklären nicht
        benutzen darfst. Such die, die dir zuerst einfallen — die sind die
        gemeinsten.
      </p>
      <input class="input tabu-eingabe" data-w placeholder="Der Begriff" maxlength="40" autocomplete="off">
      <div class="tabu-verbote">
        ${Array.from({ length: TABUS }, (_, i) =>
          `<input class="input" data-t="${i}" placeholder="Verbotenes Wort ${i + 1}" maxlength="28" autocomplete="off">`).join('')}
      </div>
      <button class="btn btn-primary btn-block" data-los disabled style="margin-top:14px">Weiter</button>
      <button class="btn btn-ghost btn-block" data-zurueck>Zurück</button>`);

    const elW = root.querySelector('[data-w]');
    const elT = [...root.querySelectorAll('[data-t]')];
    const bLos = root.querySelector('[data-los]');
    const pruefe = () => { bLos.disabled = elW.value.trim().length < 2; };
    elW.oninput = pruefe;
    bLos.onclick = () => {
      const karte = { w: elW.value.trim().slice(0, 40), t: elT.map((i) => i.value.trim()).filter(Boolean) };
      fx('pop');
      screenErklaeren('alltag', karte);
    };
    root.querySelector('[data-zurueck]').onclick = () => screenStufe();
    setTimeout(() => elW.focus(), 80);
    bindClose();
  }

  /* — Umschreiben — */
  function screenErklaeren(stufe, vorgabe = null) {
    const st = get();
    const g = tb(st);
    const karte = vorgabe || zieheKarte(stufe, g.gesehen, seedFor('tabu', g.r, st) + g.gesehen.length);
    const s = stufeById(stufe);

    root.innerHTML = shell(`
      <div class="tabu-karte">
        <span class="tabu-kicker">${esc(s.label)}${vorgabe ? ' · eigenes Wort' : ''}</span>
        <b class="tabu-wort">${esc(karte.w)}</b>
        <div class="tabu-liste">
          ${karte.t.map((v) => `<span class="tabu-verboten" data-v="${esc(v)}">${esc(v)}</span>`).join('')}
          ${karte.t.length ? '' : '<span class="tabu-leer">keine verbotenen Wörter</span>'}
        </div>
      </div>
      <p class="tiny muted center" style="margin:12px 4px 8px">
        Schreib eine Umschreibung für <b>${esc(partner)}</b> — ohne den Begriff
        und ohne die Wörter darüber. Auch Teile davon zählen.
      </p>
      <textarea class="input tabu-text" data-text rows="4" maxlength="${MAX_TEXT}"
        placeholder="Das ist etwas, das …"></textarea>
      <div class="tabu-fuss">
        <span data-warnung class="tabu-warnung"></span>
        <span class="tiny muted" data-zaehler>0/${MAX_TEXT}</span>
      </div>
      <button class="btn btn-primary btn-block" data-senden disabled style="margin-top:10px">
        Abschicken</button>
      ${vorgabe ? '' : '<button class="btn btn-ghost btn-block" data-andere>Anderes Wort</button>'}
      <button class="btn btn-ghost btn-block" data-zurueck>Zurück</button>`, esc(s.label));

    const elText = root.querySelector('[data-text]');
    const elWarn = root.querySelector('[data-warnung]');
    const elZahl = root.querySelector('[data-zaehler]');
    const bSend = root.querySelector('[data-senden]');

    /**
     * Die Prüfung läuft beim Tippen, nicht beim Abschicken.
     *
     * Erst nach dem Absenden zu erfahren, dass ein Wort verboten war, wäre
     * ärgerlich — man hätte den Satz ja umbauen können. Also leuchtet das
     * betroffene Wort oben sofort auf, und der Knopf bleibt zu, solange es
     * leuchtet.
     */
    const pruefen = () => {
      const text = elText.value;
      elZahl.textContent = `${text.length}/${MAX_TEXT}`;
      const treffer = verstoesse(text, karte);
      root.querySelectorAll('[data-v]').forEach((el) => {
        el.classList.toggle('gebrochen', treffer.includes(el.dataset.v));
      });
      const wortDrin = treffer.includes(karte.w);
      elWarn.textContent = treffer.length
        ? (wortDrin ? 'Der Begriff selbst steht drin' : `Verboten: ${treffer.join(', ')}`)
        : '';
      elWarn.classList.toggle('an', treffer.length > 0);
      bSend.disabled = treffer.length > 0 || text.trim().length < 8;
    };
    elText.oninput = pruefen;
    pruefen();
    setTimeout(() => elText.focus(), 80);

    bSend.onclick = () => {
      const text = elText.value.trim().slice(0, MAX_TEXT);
      if (verstoesse(text, karte).length || text.length < 8) return;
      const st2 = get();
      const g2 = tb(st2);
      g2.cur = { stufe, by: 'me', karte: { w: karte.w, t: karte.t.slice() }, text, tipps: [] };
      commit('tabu');
      sendEvent('game', { g: 'tabu', kind: 'tabuKarte', r: g2.r, stufe, w: karte.w, t: karte.t, text });
      fx('pop');
      screenWarten();
    };
    const bAnd = root.querySelector('[data-andere]');
    if (bAnd) bAnd.onclick = () => {
      // Weggelegt heißt gesehen — sonst kommt dieselbe Karte sofort wieder
      const st2 = get();
      const g2 = tb(st2);
      merken(g2, karte.w);
      commit('tabu');
      fx('tap');
      screenErklaeren(stufe);
    };
    root.querySelector('[data-zurueck]').onclick = () => screenStufe();
    bindClose();
  }

  /* — Warten, bis geraten wurde — */
  function screenWarten() {
    const g = tb(get());
    root.innerHTML = shell(`
      <div class="game-center">
        <div class="game-hero">${icon('gameTabu', { size: 60 })}</div>
        <div class="game-kicker">Runde ${g.r}</div>
        <h2 class="game-h">Abgeschickt</h2>
        <p class="game-p">${esc(partner)} hat drei Versuche. Nach jedem Fehlgriff
          deckt die App eins deiner verbotenen Wörter auf — je schneller es
          sitzt, desto mehr Punkte für euch beide.</p>
      </div>
      <div class="tabu-eigen">
        <span class="tabu-kicker">Deine Umschreibung</span>
        <p>${esc(g.cur?.text || '')}</p>
      </div>
      <button class="btn btn-ghost btn-block" data-skip style="margin-top:14px">Runde verwerfen</button>
      <button class="btn btn-ghost btn-block" data-close>Fertig</button>
      ${punktestand(g)}`);
    root.querySelector('[data-skip]').onclick = () => {
      const st = get();
      const g2 = tb(st);
      sendEvent('game', { g: 'tabu', kind: 'tabuSkip', r: g2.r });
      abbrechen(g2);
      commit('tabu');
      toast('Runde verworfen');
      route();
    };
    bindClose();
  }

  /* — Raten — */
  function screenRaten() {
    const st = get();
    const g = tb(st);
    const c = g.cur;
    const versuch = c.tipps.length + 1;
    // Nach jedem Fehlgriff kommt ein verbotenes Wort dazu
    const offen = c.karte.t.slice(0, c.tipps.length);

    root.innerHTML = shell(`
      <div class="hue-lead">
        <span class="doodle-kicker">${esc(stufeById(c.stufe).label)} · Versuch ${versuch} von ${VERSUCHE}</span>
        <b>Was meint ${esc(partner)}?</b>
      </div>
      <div class="tabu-eigen">
        <p>${esc(c.text)}</p>
      </div>
      ${offen.length ? `
        <div class="tabu-hilfe">
          <span class="tabu-kicker">Durfte nicht gesagt werden</span>
          <div class="tabu-liste">
            ${offen.map((v) => `<span class="tabu-verboten offen">${esc(v)}</span>`).join('')}
          </div>
        </div>` : ''}
      ${c.tipps.length ? `<div class="tabu-versuche">
        ${c.tipps.map((t) => `<span class="tabu-daneben">${icon('close', { size: 12 })} ${esc(t)}</span>`).join('')}
      </div>` : ''}
      <input class="input tabu-eingabe" data-tipp placeholder="Dein Tipp" maxlength="40" autocomplete="off">
      <button class="btn btn-primary btn-block" data-raten disabled style="margin-top:10px">
        ${versuch === VERSUCHE ? 'Letzter Versuch' : `Raten · ${PUNKTE[versuch - 1]} Punkte`}</button>
      <button class="btn btn-ghost btn-block" data-close>Später</button>`,
      `${PUNKTE[versuch - 1] ?? 0} P`);

    const elTipp = root.querySelector('[data-tipp]');
    const bRaten = root.querySelector('[data-raten]');
    elTipp.oninput = () => { bRaten.disabled = elTipp.value.trim().length < 2; };
    elTipp.onkeydown = (e) => { if (e.key === 'Enter' && !bRaten.disabled) bRaten.click(); };
    bRaten.onclick = () => raten(elTipp.value.trim().slice(0, 40));
    setTimeout(() => elTipp.focus(), 80);
    bindClose();
  }

  function raten(tipp) {
    const st = get();
    const g = tb(st);
    const c = g.cur;
    if (!c || c.by !== 'them') { route(); return; }

    c.tipps.push(tipp);
    const richtig = trifft(tipp, c.karte);
    const versuch = c.tipps.length;
    const fertig = richtig || versuch >= VERSUCHE;

    if (!fertig) {
      commit('tabu');
      fx('fail');
      toast(`Daneben — noch ${VERSUCHE - versuch} ${VERSUCHE - versuch === 1 ? 'Versuch' : 'Versuche'}`);
      screenRaten();
      return;
    }

    const punkte = richtig ? (PUNKTE[versuch - 1] ?? 0) : 0;
    sendEvent('game', { g: 'tabu', kind: 'tabuTipp', r: g.r, tipps: c.tipps, geloest: richtig, versuch });
    abrechnen(st, g, { tipps: c.tipps, punkte, versuch, geloest: richtig });
    commit('tabu');
    fx(richtig ? 'yay' : 'fail');
    if (richtig && versuch === 1) confetti(['sparkle', 'trophy']);
    screenAufloesung(g.offen);
  }

  /* — Auflösung, für beide dieselbe — */
  function screenAufloesung(v) {
    if (!v) { route(); return; }
    const selbst = v.riet === 'me';
    root.innerHTML = shell(`
      <div class="game-center">
        <div class="game-hero">${icon(v.geloest ? 'trophy' : 'gameTabu', { size: 58 })}</div>
        <div class="game-kicker">${selbst ? 'Dein Tipp' : `${esc(partner)} hat geraten`}</div>
        <h2 class="game-h">${v.geloest ? `Im ${v.versuch}. Versuch` : 'Nicht erraten'}</h2>
        <p class="game-p">${v.geloest
          ? `<b>${v.punkte}</b> Punkte für euch beide.`
          : 'Diesmal nichts. Die Karte kommt nicht wieder.'}</p>
      </div>
      <div class="tabu-karte ${v.geloest ? 'gut' : 'daneben'}">
        <span class="tabu-kicker">Gesucht war</span>
        <b class="tabu-wort">${esc(v.w)}</b>
        <div class="tabu-liste">
          ${v.t.map((x) => `<span class="tabu-verboten offen">${esc(x)}</span>`).join('')}
        </div>
      </div>
      <div class="tabu-eigen" style="margin-top:10px">
        <span class="tabu-kicker">${selbst ? `${esc(partner)} schrieb` : 'Du schriebst'}</span>
        <p>${esc(v.text)}</p>
      </div>
      <div class="tabu-eigen" style="margin-top:10px">
        <span class="tabu-kicker">${selbst ? 'Deine Tipps' : `Tipps von ${esc(partner)}`}</span>
        <div class="tabu-versuche">
          ${v.tipps.map((t, i) => {
            const zuletzt = i === v.tipps.length - 1;
            const ok = v.geloest && zuletzt;
            return `<span class="tabu-daneben ${ok ? 'treffer' : ''}">
              ${icon(ok ? 'check' : 'close', { size: 12 })} ${esc(t)}</span>`;
          }).join('') || '<span class="tiny muted">keine</span>'}
        </div>
      </div>
      <button class="btn btn-primary btn-block" data-next style="margin-top:14px">Weiter</button>
      <button class="btn btn-ghost btn-block" data-close>Fertig</button>
      ${punktestand(tb(get()))}`);
    root.querySelector('[data-next]').onclick = () => {
      const st = get();
      const g = tb(st);
      if (g.offen) { g.offen = null; commit('tabu'); }
      route();
    };
    if (v.geloest) {
      const el = root.querySelector('.tabu-karte');
      if (el) burst(['sparkle'], { from: el, count: 5, rise: 90 });
    }
    bindClose();
  }

  /* — Der andere ist dran — */
  function screenIdle() {
    const g = tb(get());
    root.innerHTML = shell(`
      <div class="game-center">
        <div class="game-hero">${icon('gameTabu', { size: 60 })}</div>
        <div class="game-kicker">Runde ${g.r}</div>
        <h2 class="game-h">${esc(partner)} ist dran</h2>
        <p class="game-p">${esc(partner)} sucht sich einen Begriff und schreibt eine
          Umschreibung. Sobald sie da ist, bekommst du sie.</p>
        <button class="btn btn-ghost btn-block" data-close>Fertig</button>
      </div>
      ${punktestand(g)}`);
    bindClose();
  }

  /** Punktestand und die letzten Karten — steht unter fast jedem Bildschirm. */
  function punktestand(g) {
    if (!g.hist.length) return '';
    return `
      <div class="tabu-bilanz">
        <div class="tabu-summe"><b>${g.score.me}</b><small>Punkte zusammen</small></div>
        <div class="tabu-verlauf">
          ${g.hist.slice(0, 6).map((h) => `<span class="tabu-alt ${h.geloest ? 'gut' : ''}">
            ${esc(h.w)}<i>${h.geloest ? `${h.versuch}.` : '—'}</i></span>`).join('')}
        </div>
      </div>`;
  }

  function route() {
    const g = tb(get());
    if (g.offen) { screenAufloesung(g.offen); return; }
    if (g.cur?.by === 'them') screenRaten();
    else if (g.cur?.by === 'me') screenWarten();
    else if (g.turn === 'me') screenStufe();
    else screenIdle();
  }

  route();
  return () => {};
}
