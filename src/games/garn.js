/**
 * Federgarn — ihr spinnt die Geschichte selbst, abwechselnd.
 *
 * Kein fertiger Text zum Durchklicken, sondern ein Rahmen: Ein Szenario gibt
 * Ort und zwei Rollen vor, den Rest schreibt ihr. Jeder Zug hat drei Schritte,
 * immer dieselben:
 *
 *   1. Lesen und bewerten, was der andere geschrieben hat (1–5 Funken)
 *   2. Eine Wendung ziehen — sie muss vorkommen
 *   3. Selbst weiterschreiben
 *
 * Die Bewertung ist der Kniff. Sie gibt dem anderen Punkte, aber vor allem
 * sagt sie ihm, was ankam — und weil man ab fünf Funken die Wendung
 * ausschlagen darf, lohnt es sich, gut zu sein, statt nur viel zu schreiben.
 * Die Wendung wiederum sorgt dafür, dass niemand seinen Plan durchzieht: Man
 * schreibt gegen einen Zufall an, und das ist der Unterschied zwischen einem
 * Aufsatz und einem Spiel.
 *
 * Kostüme zählen mit. Jede Rolle nennt Kleidungsstücke, die zu ihr passen;
 * wer sein Huhn passend anzieht, bekommt Funken dazu. Eine Handvoll Rollen
 * geht ohne das richtige Stück gar nicht erst los — das ist der einzige
 * Grund, warum ein Laden in einem Spiel überhaupt Sinn ergibt.
 *
 * Gewinnen kann man nicht. Der Epilog richtet sich danach, wie gut ihr euch
 * gegenseitig fandet, nicht danach, wer vorn liegt.
 */

import { esc } from '../util/dom.js';
import { fx, burst, confetti } from '../util/feedback.js';
import { get, commit } from '../state/store.js';
import { icon } from '../ui/icons.js';
import { pushFeed, addBondXp } from '../state/model.js';
import { REWARDS } from '../state/catalog.js';
import { sendEvent } from '../sync/index.js';
import { relTime } from '../util/time.js';
import { toast } from '../ui/toast.js';
import { HATS, ACCESSORIES } from '../pet/chicken.js';
import {
  SZENARIEN, szenarioById, WENDUNGEN, WENDUNGEN_SPICY, FUNKEN,
  FREIE_HAND, KOSTUEM_BONUS, ZUEGE_BIS_SCHLUSS, epilog, SOLO_ZUEGE
} from './garnStoff.js';

export const meta = {
  id: 'garn',
  icon: 'gameStory',
  title: 'Federgarn',
  tagline: 'Ihr spinnt die Geschichte selbst',
  modes: ['async'],
  tone: 'love',
  howto: 'Rollen verteilen, Anfang lesen, abwechselnd weiterschreiben. Jeder Zug: den letzten bewerten, eine Wendung ziehen, selbst weiterschreiben. Das passende Kostüm bringt Funken extra.'
};

export const MAX_TEXT = 500;

/* ── Zustand ────────────────────────────────────────────── */

export function gn(state) {
  if (!state.games.garn) state.games.garn = { aktiv: null, archiv: [] };
  const g = state.games.garn;
  g.archiv ||= [];
  return g;
}

export function summary(state) {
  const g = gn(state);
  const a = g.aktiv;
  if (a && !a.beendet) {
    if (a.dran === 'me') return { badge: 'wait', text: 'Du bist dran' };
    return { badge: 'off', text: `Zug ${a.zuege.length}` };
  }
  if (g.archiv.length) return { badge: null, text: `${g.archiv.length} Garne` };
  return { badge: null, text: 'Neu' };
}

/* ── Kostüm ─────────────────────────────────────────────── */

const kleidungsName = (art, id) =>
  ((art === 'hat' ? HATS : ACCESSORIES).find((x) => x.id === id) || {}).label || id;
const kleidungsPreis = (art, id) =>
  ((art === 'hat' ? HATS : ACCESSORIES).find((x) => x.id === id) || {}).price || 0;

/** Trägt mein Huhn gerade etwas, das zu dieser Rolle passt? */
export function kostuemTreffer(look, rolle) {
  const k = rolle?.kostuem || {};
  const treffer = [];
  if (look?.hat && look.hat !== 'none' && (k.hat || []).includes(look.hat)) {
    treffer.push(kleidungsName('hat', look.hat));
  }
  if (look?.acc && look.acc !== 'none' && (k.acc || []).includes(look.acc)) {
    treffer.push(kleidungsName('acc', look.acc));
  }
  return treffer;
}

/**
 * Fehlt für dieses Szenario ein Pflichtstück?
 * @returns {null|{art:'hat'|'acc', id:string, label:string, preis:number, hat:boolean}}
 */
export function pflichtStueck(state, sz, rolleIdx) {
  const b = sz?.braucht;
  if (!b) return null;
  if (b.wer != null && b.wer !== rolleIdx) return null;
  const art = b.hat ? 'hat' : 'acc';
  const id = b.hat || b.acc;
  const besitzt = (state.me.owned?.[art] || []).includes(id);
  const traegt = state.me.pet.look?.[art] === id;
  if (traegt) return null;
  return { art, id, label: kleidungsName(art, id), preis: kleidungsPreis(art, id), hat: besitzt };
}

/* ── Wendungen ──────────────────────────────────────────── */

export function zieheWendung(spicy, gezogen = []) {
  const topf = spicy ? [...WENDUNGEN, ...WENDUNGEN_SPICY] : WENDUNGEN.slice();
  const rest = topf.filter((w) => !gezogen.includes(w));
  const aus = rest.length ? rest : topf;
  return aus[Math.floor(Math.random() * aus.length)];
}

/* ── Was von drüben kommt ───────────────────────────────── */

export function handleRemote(state, msg, { partnerName }) {
  if (!String(msg.kind || '').startsWith('garn')) return null;
  const g = gn(state);

  if (msg.kind === 'garnStart') {
    // Ein neues Garn räumt ein altes, unbeendetes ab — zwei gleichzeitig
    // wären zwei Fäden, und dafür ist hier kein Platz.
    if (g.aktiv && !g.aktiv.beendet) ablegen(state, g, 'abgebrochen');
    g.aktiv = {
      id: msg.id,
      szenario: msg.szenario,
      eigen: msg.eigen || null,
      // Drüben hat Rolle `msg.rolle` gewählt, also bleibt mir die andere
      meineRolle: msg.rolle === 0 ? 1 : 0,
      starter: 'them',
      dran: 'me',
      zuege: [{ von: 'them', rolle: msg.rolle, text: String(msg.text || '').slice(0, MAX_TEXT), wendung: null, funken: null, kostuem: !!msg.kostuem, at: Date.now() }],
      funken: { me: 0, them: 0 },
      beendet: false,
      gezogen: []
    };
    commit('garn');
    pushFeed(state, { from: 'them', type: 'game', icon: meta.icon, text: `${partnerName} hat ein Garn angefangen`, note: titelVon(g.aktiv) });
    return {
      kind: 'gameTurn', icon: meta.icon, avatar: 'them',
      title: `${partnerName} spinnt ein Garn`,
      sub: titelVon(g.aktiv),
      body: `${partnerName} hat „${titelVon(g.aktiv)}" angefangen und den ersten Zug geschrieben. Du bist dran.`,
      actions: [{ label: 'Lesen', act: 'game:garn', primary: true }, { label: 'Später', act: 'dismiss' }],
      tone: 'love'
    };
  }

  const a = g.aktiv;
  if (!a || a.id !== msg.id) return null;

  if (msg.kind === 'garnZug') {
    // Die mitgeschickte Bewertung gilt meinem letzten Zug
    const meiner = [...a.zuege].reverse().find((z) => z.von === 'me' && z.funken == null);
    if (meiner && msg.funken) {
      meiner.funken = Math.max(1, Math.min(5, Number(msg.funken) || 3));
      a.funken.me += meiner.funken + (meiner.kostuem ? KOSTUEM_BONUS : 0);
    }
    a.zuege.push({
      von: 'them', rolle: msg.rolle,
      text: String(msg.text || '').slice(0, MAX_TEXT),
      wendung: msg.wendung ? String(msg.wendung).slice(0, 120) : null,
      funken: null, kostuem: !!msg.kostuem, at: Date.now()
    });
    a.dran = 'me';
    commit('garn');
    const note = meiner ? `${meiner.funken} Funken für deinen Zug` : '';
    pushFeed(state, { from: 'them', type: 'game', icon: meta.icon, text: `${partnerName} hat weitergeschrieben`, note });
    return {
      kind: 'gameTurn', icon: meta.icon, avatar: 'them',
      title: `${partnerName} hat weitergeschrieben`,
      sub: note || titelVon(a),
      body: `Zug ${a.zuege.length} in „${titelVon(a)}" liegt für dich bereit.${note ? ` ${partnerName} gibt deinem letzten Zug ${meiner.funken} von 5.` : ''}`,
      actions: [{ label: 'Weiterspinnen', act: 'game:garn', primary: true }, { label: 'Später', act: 'dismiss' }],
      tone: 'love'
    };
  }

  if (msg.kind === 'garnEnde') {
    const meiner = [...a.zuege].reverse().find((z) => z.von === 'me' && z.funken == null);
    if (meiner && msg.funken) {
      meiner.funken = Math.max(1, Math.min(5, Number(msg.funken) || 3));
      a.funken.me += meiner.funken + (meiner.kostuem ? KOSTUEM_BONUS : 0);
    }
    a.beendet = true;
    a.dran = null;
    const e = ablegen(state, g, 'beendet');
    commit('garn');
    return {
      kind: 'gameResult', icon: meta.icon, avatar: 'them',
      title: `„${esc(e.titel)}" ist zu Ende`,
      sub: e.epilogTitel,
      body: `${partnerName} hat das Garn beendet. ${e.epilogTitel} — ${e.funkenMe} zu ${e.funkenThem} Funken.`,
      actions: [{ label: 'Ansehen', act: 'game:garn', primary: true }, { label: 'Schön', act: 'dismiss' }],
      tone: 'love'
    };
  }
  return null;
}

const titelVon = (a) => a?.eigen?.titel || szenarioById(a?.szenario)?.titel || 'Federgarn';

/** Ein Garn ins Archiv schieben und den Platz frei machen. */
function ablegen(state, g, grund) {
  const a = g.aktiv;
  if (!a) return null;
  const n = a.zuege.length;
  const bewertet = a.zuege.filter((z) => z.funken != null);
  const schnitt = bewertet.length ? bewertet.reduce((s, z) => s + z.funken, 0) / bewertet.length : 0;
  const ep = epilog(schnitt, n, !!state.settings?.spicy);
  const eintrag = {
    titel: titelVon(a),
    epilogTitel: grund === 'beendet' ? ep.titel : 'Liegen geblieben',
    epilogText: grund === 'beendet' ? ep.text : 'Angefangen und nicht zu Ende gebracht. Kommt vor.',
    zuege: a.zuege.slice(-14),
    funkenMe: a.funken.me, funkenThem: a.funken.them,
    schnitt: Math.round(schnitt * 10) / 10,
    at: Date.now()
  };
  g.archiv.unshift(eintrag);
  if (g.archiv.length > 12) g.archiv.length = 12;
  g.aktiv = null;
  return eintrag;
}

/* ── Bühne ──────────────────────────────────────────────── */

export function mount(root, ctx) {
  const staat = get();
  const spicy = !!staat.settings?.spicy;
  const partner = staat.partner?.name || 'Dein Mensch';
  const ich = staat.me.name || 'Du';

  const header = (right = '') => `<div class="game-top">
    <button class="game-x" data-close aria-label="Schließen">${icon('close', { size: 15 })}</button>
    <div class="game-title">${esc(meta.title)}</div>
    <div class="game-right">${right}</div>
  </div>`;
  const bindClose = () => root.querySelectorAll('[data-close]').forEach((b) => { b.onclick = () => ctx.close(); });

  const namen = () => ({ a: ich, b: partner });
  const rollenVon = (a) => a.eigen ? a.eigen.rollen : szenarioById(a.szenario).rollen;
  const anfangVon = (a) => a.eigen
    ? a.eigen.anfang
    : szenarioById(a.szenario).anfang({ a: rollenVon(a)[0].name, b: rollenVon(a)[1].name });

  /* ── Startbildschirm ── */

  function intro() {
    const s = gn(get());
    if (s.aktiv && !s.aktiv.beendet) return tisch();

    const liste = SZENARIEN.filter((z) => !z.spicy || spicy);
    root.innerHTML = `
      <div class="game-wrap">
        ${header()}
        <div class="game-scroll">
          <div class="garn-lead">
            <div class="game-hero">${icon('gameStory', { size: 60 })}</div>
            <h2 class="game-h">Federgarn</h2>
            <p class="game-p">Ihr bekommt einen Ort und zwei Rollen — den Rest schreibt ihr
              abwechselnd selbst. Jeder Zug: den letzten bewerten, eine Wendung ziehen,
              weiterschreiben. Passendes Kostüm bringt Funken extra.</p>
          </div>

          <div class="section-label" style="margin:6px 4px 8px">Wovon soll es handeln?</div>
          <div class="garn-liste">
            ${liste.map((z) => karte(z)).join('')}
            <button class="garn-karte eigen" data-eigen>
              <span class="garn-karte-kopf">
                <b>${icon('edit', { size: 16 })} Eigenes Garn</b>
                <small>Titel, Ort und beide Rollen selbst schreiben</small>
              </span>
            </button>
          </div>

          ${archiv(s)}
          ${spicy ? '' : `<p class="tiny muted" style="margin:18px 4px 0">
            Unter <b>Mehr</b> gibt es freizügigere Szenarien und Wendungen dazu.</p>`}
        </div>
      </div>`;

    root.querySelectorAll('[data-sz]').forEach((b) => {
      b.onclick = () => { fx('tap'); rollenwahl(b.dataset.sz); };
    });
    root.querySelector('[data-eigen]').onclick = () => { fx('tap'); eigenesSheet(); };
    bindClose();
  }

  function karte(z) {
    const g = get();
    const gesperrt = z.braucht ? pflichtStueck(g, z, z.braucht.wer ?? 0) : null;
    return `<button class="garn-karte tone-${z.ton}" data-sz="${z.id}">
      <span class="garn-karte-kopf">
        <b>${esc(z.titel)}</b>
        <small>${esc(z.kicker)}</small>
      </span>
      <span class="garn-rollen">
        ${z.rollen.map((r) => `<span class="chip">${esc(r.name)}</span>`).join('')}
        ${z.spicy ? `<span class="chip chip-spicy">${icon('flame', { size: 12 })} spicy</span>` : ''}
        ${gesperrt ? `<span class="chip chip-lock">${icon('lock', { size: 12 })} ${esc(gesperrt.label)}</span>` : ''}
      </span>
    </button>`;
  }

  function archiv(s) {
    if (!s.archiv.length) return '';
    return `
      <div class="section-label" style="margin:24px 4px 8px">Was ihr schon gesponnen habt</div>
      <div class="list">
        ${s.archiv.slice(0, 8).map((e) => `<div class="li">
          <div class="li-ico">${icon('gameStory', { size: 18 })}</div>
          <div class="grow">
            <div class="li-title">${esc(e.titel)} · ${esc(e.epilogTitel)}</div>
            <div class="li-sub">${e.zuege.length} Züge · ${e.funkenMe}:${e.funkenThem} Funken · ${relTime(e.at)}</div>
          </div>
        </div>`).join('')}
      </div>`;
  }

  /* ── Rolle wählen ── */

  function rollenwahl(szId) {
    const z = szenarioById(szId);
    const st = get();
    root.innerHTML = `
      <div class="game-wrap">
        ${header()}
        <div class="game-scroll">
          <div class="garn-lead">
            <div class="game-kicker">${esc(z.kicker)}</div>
            <h2 class="game-h">${esc(z.titel)}</h2>
          </div>
          <div class="garn-anfang">${absatz(z.anfang({ a: z.rollen[0].name, b: z.rollen[1].name }))}</div>
          <div class="section-label" style="margin:20px 4px 8px">Welche Rolle nimmst du?</div>
          <div class="garn-liste">
            ${z.rollen.map((r, i) => rollenKarte(st, z, r, i)).join('')}
          </div>
          <p class="tiny muted" style="margin:14px 4px 0">
            ${esc(partner)} bekommt automatisch die andere Rolle.</p>
          <button class="btn btn-ghost btn-block" data-zurueck style="margin-top:18px">Zurück</button>
        </div>
      </div>`;

    root.querySelectorAll('[data-rolle]').forEach((b) => {
      b.onclick = () => {
        const i = Number(b.dataset.rolle);
        const fehlt = pflichtStueck(get(), z, i);
        if (fehlt) {
          toast(fehlt.hat ? `Zieh erst den ${fehlt.label} an` : `Dafür brauchst du den ${fehlt.label}`);
          fx('fail');
          return;
        }
        fx('pop');
        schreiben({ neu: { szenario: z.id, rolle: i } });
      };
    });
    root.querySelector('[data-zurueck]').onclick = () => intro();
    bindClose();
  }

  function rollenKarte(st, z, r, i) {
    const fehlt = pflichtStueck(st, z, i);
    const passt = kostuemTreffer(st.me.pet.look, r);
    const teile = [...(r.kostuem?.hat || []).map((x) => kleidungsName('hat', x)),
      ...(r.kostuem?.acc || []).map((x) => kleidungsName('acc', x))];
    return `<button class="garn-karte rolle${fehlt ? ' gesperrt' : ''}" data-rolle="${i}">
      <span class="garn-karte-kopf">
        <b>${esc(r.name)}</b>
        <small>${esc(r.satz)}</small>
      </span>
      ${fehlt
        ? `<span class="garn-hinweis warn">${icon('lock', { size: 13 })}
             ${fehlt.hat ? `Zieh den ${esc(fehlt.label)} an` : `Braucht den ${esc(fehlt.label)} — ${fehlt.preis} Körner im Laden`}</span>`
        : passt.length
          ? `<span class="garn-hinweis gut">${icon('sparkle', { size: 13 })} ${esc(passt.join(' und '))} passt — +${KOSTUEM_BONUS} Funken pro Zug</span>`
          : `<span class="garn-hinweis">${icon('tabShop', { size: 13 })} Passt dazu: ${esc(teile.slice(0, 3).join(', '))}</span>`}
    </button>`;
  }

  /* ── Eigenes Szenario ── */

  function eigenesSheet() {
    root.innerHTML = `
      <div class="game-wrap">
        ${header()}
        <div class="game-scroll">
          <div class="garn-lead">
            <div class="game-hero">${icon('edit', { size: 52 })}</div>
            <h2 class="game-h">Eigenes Garn</h2>
            <p class="game-p">Denkt euch alles selbst aus. ${esc(partner)} sieht den Anfang
              genauso, wie du ihn hier hinschreibst.</p>
          </div>
          <label class="field-label">Titel</label>
          <input class="input" data-titel maxlength="40" placeholder="Der letzte Zug nach Norden">
          <label class="field-label" style="margin-top:14px">Wie fängt es an?</label>
          <textarea class="input" data-anfang rows="4" maxlength="420"
            placeholder="Wo seid ihr, was ist gerade passiert, warum ist es dringend?"></textarea>
          <div class="garn-zwei">
            <div>
              <label class="field-label">Deine Rolle</label>
              <input class="input" data-r0 maxlength="24" placeholder="z.B. Kapitänin">
            </div>
            <div>
              <label class="field-label">Rolle für ${esc(partner)}</label>
              <input class="input" data-r1 maxlength="24" placeholder="z.B. blinder Passagier">
            </div>
          </div>
          <button class="btn btn-love btn-block" data-los style="margin-top:18px">Anfangen</button>
          <button class="btn btn-ghost btn-block" data-zurueck style="margin-top:8px">Zurück</button>
        </div>
      </div>`;

    root.querySelector('[data-los]').onclick = () => {
      const titel = root.querySelector('[data-titel]').value.trim().slice(0, 40);
      const anfang = root.querySelector('[data-anfang]').value.trim().slice(0, 420);
      const r0 = root.querySelector('[data-r0]').value.trim().slice(0, 24);
      const r1 = root.querySelector('[data-r1]').value.trim().slice(0, 24);
      if (titel.length < 3 || anfang.length < 20 || !r0 || !r1) {
        toast('Titel, Anfang und beide Rollen brauchen wir');
        return;
      }
      fx('pop');
      schreiben({ neu: { eigen: { titel, anfang, rollen: [{ name: r0, satz: '', kostuem: {} }, { name: r1, satz: '', kostuem: {} }] }, rolle: 0 } });
    };
    root.querySelector('[data-zurueck]').onclick = () => intro();
    bindClose();
  }

  /* ── Der Tisch: alles, was bisher geschrieben wurde ── */

  function tisch() {
    const st = get();
    const a = gn(st).aktiv;
    if (!a) return intro();
    if (a.beendet) return intro();

    const rollen = rollenVon(a);
    const meine = rollen[a.meineRolle];
    const ihre = rollen[a.meineRolle === 0 ? 1 : 0];
    const offen = a.dran === 'me';
    const letzterFremd = [...a.zuege].reverse().find((z) => z.von === 'them' && z.funken == null);

    root.innerHTML = `
      <div class="game-wrap">
        ${header(`<span class="garn-punkte">${a.funken.me}<small>:</small>${a.funken.them}</span>`)}
        <div class="game-scroll" data-scroll>
          <div class="garn-kopf">
            <div class="game-kicker">${esc(titelVon(a))} · Zug ${a.zuege.length}</div>
            <div class="garn-besetzung">
              <span class="chip chip-mine">${esc(meine.name)} · ${esc(ich)}</span>
              <span class="chip">${esc(ihre.name)} · ${esc(partner)}</span>
            </div>
          </div>

          <div class="garn-anfang">${absatz(anfangVon(a))}</div>

          ${a.zuege.map((z) => zugBlock(z, rollen)).join('')}

          ${offen
            ? formular(a, letzterFremd)
            : `<div class="garn-warten">
                 ${icon('clock', { size: 18 })}
                 <div>
                   <b>${esc(partner)} ist dran</b>
                   <span>Dein Zug ist unterwegs. Kommt eine Antwort, wirst du benachrichtigt.</span>
                 </div>
               </div>`}

          <button class="btn btn-ghost btn-block" data-aufgeben style="margin-top:18px">
            ${a.zuege.length >= 4 ? 'Garn hier beenden' : 'Garn abbrechen'}
          </button>
        </div>
      </div>`;

    if (offen) bindFormular(a, letzterFremd);
    root.querySelector('[data-aufgeben]').onclick = () => {
      const st2 = get();
      const g = gn(st2);
      if (!g.aktiv) return intro();
      if (g.aktiv.zuege.length >= 4 && g.aktiv.dran === 'me') { beenden(null); return; }
      ablegen(st2, g, 'abgebrochen');
      commit('garn');
      fx('tap');
      intro();
    };
    bindClose();
    // Ans Ende springen — man will lesen, was neu ist
    const sc = root.querySelector('[data-scroll]');
    requestAnimationFrame(() => { sc.scrollTop = sc.scrollHeight; });
  }

  function zugBlock(z, rollen) {
    const r = rollen[z.rolle] || { name: '?' };
    const wer = z.von === 'me' ? ich : partner;
    return `<div class="garn-zug ${z.von}">
      <div class="garn-zug-kopf">
        <b>${esc(r.name)}</b><span>${esc(wer)}</span>
        ${z.kostuem ? `<i class="garn-kostuem" title="im Kostüm">${icon('sparkle', { size: 12 })}</i>` : ''}
        ${z.funken != null ? `<span class="garn-funken">${'✦'.repeat(z.funken)}</span>` : ''}
      </div>
      ${z.wendung ? `<div class="garn-wendung-zeile">${icon('shuffle', { size: 12 })} ${esc(z.wendung)}</div>` : ''}
      <div class="garn-text">${esc(z.text)}</div>
    </div>`;
  }

  /* ── Das Formular: bewerten, Wendung, schreiben ── */

  /** Die Wendung des laufenden Zugs — steht, bis abgeschickt wird. */
  let wendung = null;
  let wendungFrei = false;
  let bewertung = null;

  function formular(a, letzterFremd) {
    const rollen = rollenVon(a);
    const meine = rollen[a.meineRolle];
    const st = get();
    const passt = kostuemTreffer(st.me.pet.look, meine);
    const ersterZug = !letzterFremd;

    if (wendung === null && !wendungFrei) wendung = zieheWendung(spicy, a.gezogen || []);

    return `
      <div class="garn-form">
        ${letzterFremd ? `
          <div class="garn-schritt">
            <span class="garn-nr">1</span>
            <b>Wie fandest du den Zug?</b>
          </div>
          <div class="garn-funkenwahl">
            ${FUNKEN.map((f) => `<button class="garn-fk${bewertung === f.v ? ' an' : ''}" data-fk="${f.v}"
              title="${esc(f.sub)}">
              ${icon(f.icon, { size: 18 })}<span>${esc(f.label)}</span>
            </button>`).join('')}
          </div>
          <p class="tiny muted garn-fk-sub" data-fksub>&nbsp;</p>` : ''}

        <div class="garn-schritt">
          <span class="garn-nr">${letzterFremd ? 2 : 1}</span>
          <b>Deine Wendung</b>
          <button class="link-btn" data-neueWendung>${icon('shuffle', { size: 13 })} andere</button>
        </div>
        <div class="garn-wendung${wendungFrei ? ' aus' : ''}" data-wendung>
          ${wendungFrei ? 'Freie Hand — du schreibst ohne Wendung.' : esc(wendung)}
        </div>

        <div class="garn-schritt">
          <span class="garn-nr">${letzterFremd ? 3 : 2}</span>
          <b>Als ${esc(meine.name)} weiterschreiben</b>
        </div>
        <textarea class="input garn-eingabe" data-text rows="5" maxlength="${MAX_TEXT}"
          placeholder="${ersterZug ? 'Wie geht es los? Zwei, drei Sätze reichen.' : 'Reagier darauf — und bau die Wendung ein.'}"></textarea>
        <div class="garn-zaehler"><span data-zaehler>0</span>/${MAX_TEXT}</div>

        ${passt.length
          ? `<div class="garn-hinweis gut" style="margin-bottom:10px">${icon('sparkle', { size: 13 })}
               ${esc(passt.join(' und '))} passt zur Rolle — +${KOSTUEM_BONUS} Funken auf diesen Zug</div>`
          : `<div class="garn-hinweis" style="margin-bottom:10px">${icon('tabShop', { size: 13 })}
               Ohne passendes Kostüm. Im Laden gibt es etwas für ${esc(meine.name)}.</div>`}

        <button class="btn btn-love btn-block" data-senden>Abschicken</button>
        ${a.zuege.length >= ZUEGE_BIS_SCHLUSS - 1
          ? '<button class="btn btn-ghost btn-block" data-schluss style="margin-top:8px">Das war mein letzter Zug</button>'
          : ''}
      </div>`;
  }

  function bindFormular(a, letzterFremd) {
    const feld = root.querySelector('[data-text]');
    const zaehler = root.querySelector('[data-zaehler]');
    feld.oninput = () => { zaehler.textContent = feld.value.length; };

    root.querySelectorAll('[data-fk]').forEach((b) => {
      b.onclick = () => {
        bewertung = Number(b.dataset.fk);
        root.querySelectorAll('[data-fk]').forEach((x) => x.classList.toggle('an', Number(x.dataset.fk) === bewertung));
        const f = FUNKEN.find((x) => x.v === bewertung);
        root.querySelector('[data-fksub]').textContent = f.sub
          + (bewertung >= FREIE_HAND ? ' — du darfst deine Wendung ausschlagen.' : '');
        fx('tap');
        // Volltreffer schaltet die freie Hand frei
        const w = root.querySelector('[data-wendung]');
        if (bewertung >= FREIE_HAND) w.classList.add('waehlbar');
        else { w.classList.remove('waehlbar'); if (wendungFrei) { wendungFrei = false; wendungZeigen(); } }
      };
    });

    root.querySelector('[data-neueWendung]').onclick = () => {
      const st = get();
      const g = gn(st).aktiv;
      if (bewertung >= FREIE_HAND && !wendungFrei) {
        // Bei einem Volltreffer ist „andere" der Verzicht
        wendungFrei = true;
      } else {
        wendungFrei = false;
        wendung = zieheWendung(spicy, [...(g?.gezogen || []), wendung]);
      }
      fx('tap');
      wendungZeigen();
    };

    const wendungZeigen = () => {
      const w = root.querySelector('[data-wendung]');
      w.classList.toggle('aus', wendungFrei);
      w.textContent = wendungFrei ? 'Freie Hand — du schreibst ohne Wendung.' : wendung;
    };

    root.querySelector('[data-senden]').onclick = () => senden(false);
    const sch = root.querySelector('[data-schluss]');
    if (sch) sch.onclick = () => senden(true);

    function senden(schluss) {
      const text = feld.value.trim();
      if (text.length < 10) { toast('Ein bisschen mehr, bitte'); return; }
      if (letzterFremd && !bewertung) { toast('Wie fandest du den letzten Zug?'); return; }
      abschicken(text, schluss);
    }
  }

  /* ── Absenden ── */

  function schreiben({ neu }) {
    // Ein neues Garn anlegen und direkt den ersten Zug schreiben lassen
    const st = get();
    const g = gn(st);
    if (g.aktiv && !g.aktiv.beendet) ablegen(st, g, 'abgebrochen');
    g.aktiv = {
      id: `${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`,
      szenario: neu.szenario || null,
      eigen: neu.eigen || null,
      meineRolle: neu.rolle,
      starter: 'me',
      dran: 'me',
      zuege: [],
      funken: { me: 0, them: 0 },
      beendet: false,
      gezogen: []
    };
    commit('garn');
    wendung = null; wendungFrei = false; bewertung = null;
    tisch();
  }

  function abschicken(text, schluss) {
    const st = get();
    const g = gn(st);
    const a = g.aktiv;
    if (!a) return;

    const rollen = rollenVon(a);
    const meine = rollen[a.meineRolle];
    const imKostuem = kostuemTreffer(st.me.pet.look, meine).length > 0;

    // Bewertung des letzten fremden Zugs eintragen
    const fremd = [...a.zuege].reverse().find((z) => z.von === 'them' && z.funken == null);
    if (fremd && bewertung) {
      fremd.funken = bewertung;
      a.funken.them += bewertung + (fremd.kostuem ? KOSTUEM_BONUS : 0);
    }

    const zug = {
      von: 'me', rolle: a.meineRolle, text,
      wendung: wendungFrei ? null : wendung,
      funken: null, kostuem: imKostuem, at: Date.now()
    };
    a.zuege.push(zug);
    if (zug.wendung) {
      a.gezogen = [...(a.gezogen || []), zug.wendung].slice(-24);
    }
    a.dran = 'them';

    st.me.coins += REWARDS.gamePlayed;
    addBondXp(st, 3);

    const erster = a.zuege.length === 1;
    const nutz = {
      g: meta.id,
      kind: schluss ? 'garnEnde' : erster ? 'garnStart' : 'garnZug',
      id: a.id,
      rolle: a.meineRolle,
      text,
      wendung: zug.wendung || '',
      kostuem: imKostuem,
      funken: bewertung || 0
    };
    if (erster) { nutz.szenario = a.szenario; nutz.eigen = a.eigen; }
    sendEvent('game', nutz);

    pushFeed(st, {
      from: 'me', type: 'game', icon: meta.icon,
      text: erster ? `Du hast „${titelVon(a)}" angefangen` : 'Du hast am Garn weitergesponnen',
      note: imKostuem ? `Im Kostüm · +${KOSTUEM_BONUS} Funken` : ''
    });

    if (imKostuem) {
      a.funken.me += 0;   // der Bonus wird beim Bewerten gutgeschrieben
      burst(['sparkle'], { count: 5 });
    }
    fx('love');
    commit('garn');
    wendung = null; wendungFrei = false; bewertung = null;

    if (schluss) { beenden(zug); return; }
    tisch();
  }

  function beenden() {
    const st = get();
    const g = gn(st);
    const a = g.aktiv;
    if (!a) return intro();
    a.beendet = true;
    a.dran = null;
    sendEvent('game', { g: meta.id, kind: 'garnEnde', id: a.id, rolle: a.meineRolle, text: '', funken: bewertung || 0 });
    const e = ablegen(st, g, 'beendet');
    st.me.coins += REWARDS.gameWon;
    addBondXp(st, 8);
    commit('garn');
    confetti(['sparkle', 'mailHeart', 'feather']);
    fx('yay');
    schluss(e);
  }

  function schluss(e) {
    root.innerHTML = `
      <div class="game-wrap">
        ${header()}
        <div class="game-scroll">
          <div class="garn-lead">
            <div class="game-hero">${icon('gameStory', { size: 56 })}</div>
            <div class="game-kicker">${esc(e.titel)}</div>
            <h2 class="game-h">${esc(e.epilogTitel)}</h2>
          </div>
          <div class="garn-anfang">${absatz(e.epilogText)}</div>
          <div class="game-stats" style="margin-top:18px">
            <div><b>${e.zuege.length}</b><small>Züge</small></div>
            <div><b>${e.funkenMe}</b><small>${esc(ich)}</small></div>
            <div><b>${e.funkenThem}</b><small>${esc(partner)}</small></div>
            <div><b>${e.schnitt}</b><small>Schnitt</small></div>
          </div>
          <button class="btn btn-love btn-block" data-nochmal>Neues Garn</button>
          <button class="btn btn-ghost btn-block" data-close style="margin-top:8px">Fertig</button>
        </div>
      </div>`;
    root.querySelector('[data-nochmal]').onclick = () => intro();
    bindClose();
  }

  const absatz = (t) => String(t || '').trim().split(/\n\s*\n/)
    .map((p) => `<p>${esc(p.replace(/\s+/g, ' '))}</p>`).join('');

  intro();
  return () => {};
}

/** Für den Solo-Modus: ein Zug, der fast überall passt. */
export const soloZug = () => SOLO_ZUEGE[Math.floor(Math.random() * SOLO_ZUEGE.length)];
