/**
 * Maskenball — eine Geschichte zum Mitspielen.
 *
 * Das einzige Spiel hier, das keine Punkte kennt. Es zählt nicht zum
 * Kräftevergleich, es gibt nichts zu gewinnen, und genau deshalb traut man
 * sich Sachen. Wer eine Geschichte mit einer Bestenliste versieht, spielt
 * am Ende die Bestenliste.
 *
 * Drei Bausteine:
 *
 *   Rolle    Vier Titel mit verschiedenen Werten. Dieselbe Szene fühlt sich
 *            als Eisenhand anders an als als Silberzunge.
 *   Probe    Zwei Würfel plus ein Wert. 10+ gelingt, 7–9 gelingt mit Haken,
 *            6 und darunter geht schief. Ein Fehlschlag beendet nie den
 *            Abend — er biegt ihn ab. Das ist der ganze Trick daran.
 *   Freitext Man kann tippen, was man tun will. Ohne Sprachmodell im
 *            Hintergrund geht das über Stichwörter je Szene; passt nichts,
 *            kommt eine Antwort, die im Ton bleibt, statt einer Fehlermeldung.
 *
 * Die freizügigeren Absätze hängen am selben Schalter wie der Rest der App.
 * Ist er aus, fehlen sie einfach — die Geschichte funktioniert auch so.
 */

import { esc } from '../util/dom.js';
import { fx, burst, confetti } from '../util/feedback.js';
import { get, commit } from '../state/store.js';
import { icon } from '../ui/icons.js';
import { pushFeed, addBondXp } from '../state/model.js';
import { REWARDS } from '../state/catalog.js';
import { sendEvent } from '../sync/index.js';
import { relTime } from '../util/time.js';
import { ROLLEN, WERTE, SZENEN, START, UNKLAR, rolleById, endeSatz } from './storyScenes.js';

export const meta = {
  id: 'story',
  icon: 'gameStory',
  title: 'Maskenball',
  tagline: 'Eine Nacht, vier Rollen, zwei Würfel',
  modes: ['async'],
  tone: 'love',
  howto: 'Wähl eine Rolle und spiel dich durch die Nacht. Antworten anklicken oder selbst tippen — gewürfelt wird mit zwei Würfeln plus deinem Wert. Punkte gibt es hier keine.'
};

/* ── Zustand ────────────────────────────────────────────── */

export function sy(state) {
  if (!state.games.story) {
    state.games.story = { lauf: null, chronik: [], ihre: [] };
  }
  const s = state.games.story;
  s.chronik ||= [];
  s.ihre ||= [];
  return s;
}

/** Zählt nie als „du bist dran“ — dieses Spiel wartet auf niemanden. */
export function summary(state) {
  const s = sy(state);
  if (s.lauf && !s.lauf.fertig) {
    const sz = SZENEN[s.lauf.szene];
    return { badge: null, text: `Kapitel ${sz?.kapitel || 1}` };
  }
  if (s.chronik.length) return { badge: null, text: `${s.chronik.length}× gespielt` };
  return { badge: null, text: 'Neu' };
}

/**
 * Was von drüben hereinkommt: die Kurzfassung eines beendeten Abends.
 *
 * Alles andere wird abgefangen statt durchgereicht. Ein `undefined` ließe
 * die allgemeine Duell-Behandlung übernehmen — und die legte dem Maskenball
 * einen Punktestand an, den es hier bewusst nicht gibt.
 */
export function handleRemote(state, msg, { partnerName }) {
  if (msg.kind !== 'storyEnd') return null;
  const s = sy(state);
  s.ihre.unshift({ satz: String(msg.satz || '').slice(0, 120), titel: String(msg.titel || '').slice(0, 40), at: Date.now() });
  if (s.ihre.length > 12) s.ihre.length = 12;
  commit('story');
  pushFeed(state, {
    from: 'them', type: 'game', icon: meta.icon,
    text: `${partnerName} hat den Maskenball gespielt`,
    note: msg.satz || ''
  });
  return {
    kind: 'gameResult',
    icon: meta.icon,
    avatar: 'them',
    title: `${partnerName} war auf dem Ball`,
    sub: String(msg.titel || 'Maskenball').slice(0, 40),
    body: `${partnerName} hat den Maskenball zu Ende gespielt: ${msg.satz}`,
    actions: [{ label: 'Selbst spielen', act: 'game:story', primary: true }, { label: 'Schön', act: 'dismiss' }],
    tone: 'love'
  };
}

/* ── Würfel ─────────────────────────────────────────────── */

/** Zwei Würfel plus Wert. Der Zufall darf hier echt sein — kein Duell. */
export function wuerfeln(wert = 0, bonus = 0) {
  const a = 1 + Math.floor(Math.random() * 6);
  const b = 1 + Math.floor(Math.random() * 6);
  const summe = a + b + wert + bonus;
  return { a, b, wert: wert + bonus, summe, stufe: summe >= 10 ? 'gut' : summe >= 7 ? 'teils' : 'schlecht' };
}

const STUFEN = {
  gut: { label: 'Gelungen', cls: 'gut' },
  teils: { label: 'Mit Haken', cls: 'teils' },
  schlecht: { label: 'Schiefgegangen', cls: 'schlecht' }
};

/* ── Bühne ──────────────────────────────────────────────── */

export function mount(root, ctx) {
  const staat = get();
  const partner = staat.partner?.name || null;
  const spicy = !!staat.settings?.spicy;

  const header = (right = '') => `<div class="game-top">
    <button class="game-x" data-close aria-label="Schließen">${icon('close', { size: 15 })}</button>
    <div class="game-title">${esc(meta.title)}</div>
    <div class="game-right">${right}</div>
  </div>`;
  const bindClose = () => root.querySelectorAll('[data-close]').forEach((b) => { b.onclick = () => ctx.close(); });

  /** Der Spielstand als bequemes Bündel für die Textbausteine. */
  function kontext() {
    const l = sy(get()).lauf;
    const r = rolleById(l.rolle);
    return {
      rolle: l.rolle,
      rollenName: r.name,
      ding: r.ding,
      werte: l.werte,
      flags: l.flags,
      // Die maskierte Gestalt trägt den Namen des Menschen am anderen Ende —
      // das ist der ganze Grund, warum diese Geschichte in dieser App steht.
      fremd: partner || null,
      spicy
    };
  }

  /* ── Rollenwahl ── */

  function intro() {
    const s = sy(get());
    // Ein durchgespielter Abend ist kein offener Abend — sonst stünde hier
    // „Weiterspielen · Kapitel 5" und führte direkt wieder aufs Ende.
    const offen = s.lauf && !s.lauf.fertig ? s.lauf : null;
    root.innerHTML = `
      <div class="game-wrap">
        ${header()}
        <div class="game-scroll">
          <div class="story-lead">
            <div class="game-hero">${icon('gameStory', { size: 64 })}</div>
            <h2 class="game-h">Maskenball</h2>
            <p class="game-p">Eine Nacht im Federhof. Hundert Masken, ein verschlossener
              Turm und jemand, der auf dich wartet — vielleicht.
              ${partner ? `Die weiße Maske trägt heute Abend den Namen <b>${esc(partner)}</b>.` : ''}
              Keine Punkte, keine Bestenliste. Nur der Abend.</p>
          </div>

          ${offen ? `<button class="btn btn-love btn-block" data-weiter>
              Weiterspielen · Kapitel ${SZENEN[offen.szene]?.kapitel || 1} als ${esc(rolleById(offen.rolle).name)}
            </button>
            <button class="btn btn-ghost btn-block" data-neu style="margin-top:8px">Von vorn anfangen</button>`
          : ''}

          ${offen ? '<div class="section-label" style="margin:22px 4px 8px">Oder eine andere Rolle</div>'
                  : '<div class="section-label" style="margin:8px 4px 8px">Wer bist du heute Abend?</div>'}
          <div class="story-rollen">
            ${ROLLEN.map((r) => `
              <button class="story-rolle" data-rolle="${r.id}">
                <span class="story-rolle-kopf">
                  <b>${esc(r.name)}</b>
                  <small>${esc(r.kicker)}</small>
                </span>
                <span class="story-werte">
                  ${WERTE.map((w) => `<span class="story-wert${r.werte[w.id] >= 3 ? ' stark' : ''}">
                    ${esc(w.label)} <b>+${r.werte[w.id]}</b></span>`).join('')}
                </span>
                <span class="story-rolle-satz">${esc(r.start)}</span>
              </button>`).join('')}
          </div>

          ${chronik(s)}
          ${spicy ? '' : `<p class="tiny muted" style="margin:18px 4px 0">
            Unter <b>Mehr</b> lässt sich der Schalter für freizügige Inhalte umlegen —
            dann bekommt diese Geschichte ein paar Absätze mehr.</p>`}
        </div>
      </div>`;

    root.querySelectorAll('[data-rolle]').forEach((b) => {
      b.onclick = () => { fx('pop'); starten(b.dataset.rolle); };
    });
    const w = root.querySelector('[data-weiter]');
    if (w) w.onclick = () => { fx('tap'); szene(); };
    const n = root.querySelector('[data-neu]');
    if (n) n.onclick = () => { const st = get(); sy(st).lauf = null; commit('story'); intro(); };
    bindClose();
  }

  function chronik(s) {
    if (!s.chronik.length && !s.ihre.length) return '';
    return `
      <div class="section-label" style="margin:24px 4px 8px">Wie es ausging</div>
      <div class="list">
        ${s.chronik.slice(0, 6).map((c) => `<div class="li">
          <div class="li-ico">${icon('gameStory', { size: 18 })}</div>
          <div class="grow">
            <div class="li-title">${esc(c.titel)}</div>
            <div class="li-sub">${esc(c.satz)} · ${relTime(c.at)}</div>
          </div>
        </div>`).join('')}
        ${s.ihre.slice(0, 4).map((c) => `<div class="li">
          <div class="li-ico">${icon('mailHeart', { size: 18 })}</div>
          <div class="grow">
            <div class="li-title">${esc(partner || 'Drüben')}: ${esc(c.titel)}</div>
            <div class="li-sub">${esc(c.satz)} · ${relTime(c.at)}</div>
          </div>
        </div>`).join('')}
      </div>`;
  }

  function starten(rolleId) {
    const st = get();
    const s = sy(st);
    const r = rolleById(rolleId);
    s.lauf = { rolle: r.id, szene: START, werte: { ...r.werte }, flags: [], zug: 0, begonnen: Date.now() };
    commit('story');
    szene();
  }

  /* ── Eine Szene zeigen ── */

  function szene(nachricht = '') {
    const st = get();
    const l = sy(st).lauf;
    if (!l) return intro();
    const sz = SZENEN[l.szene];
    if (!sz) { l.szene = START; commit('story'); return szene(); }
    if (sz.ende) return ende(sz);

    const c = kontext();
    const absatz = (t) => String(t || '').trim().split(/\n\s*\n/)
      .map((p) => `<p>${esc(p.replace(/\s+/g, ' '))}</p>`).join('');

    const zusatz = spicy && sz.spicy ? sz.spicy(c) : '';
    const moeglich = (sz.optionen || []).filter((o) =>
      (!o.rolle || o.rolle === l.rolle)
      && (!o.wenn || l.flags.includes(o.wenn))
      && (!o.wennNicht || !l.flags.includes(o.wennNicht))
      && (!o.nurSpicy || spicy));

    root.innerHTML = `
      <div class="game-wrap">
        ${header(`<span class="story-kap">Kap. ${sz.kapitel || 1}</span>`)}
        <div class="game-scroll" data-scroll>
          <div class="story-ort">${esc(sz.ort)}</div>
          ${nachricht ? `<div class="story-echo">${esc(nachricht)}</div>` : ''}
          <div class="story-text">
            ${absatz(sz.text(c))}
            ${zusatz ? `<div class="story-spicy">${absatz(zusatz)}</div>` : ''}
          </div>

          <div class="story-optionen">
            ${moeglich.map((o, i) => `<button class="story-option" data-opt="${i}">
              <span class="grow">${esc(o.t)}</span>
              ${o.probe ? `<span class="story-probe-tag">${esc(WERTE.find((w) => w.id === o.probe.attr).label)} +${l.werte[o.probe.attr] + (o.probe.bonus || 0)}</span>` : ''}
            </button>`).join('')}
          </div>

          <form class="story-frei" data-form>
            <input class="input" data-frei maxlength="80" autocomplete="off"
              placeholder="… oder schreib, was du tust">
            <button class="btn btn-primary" data-tun type="submit">Tun</button>
          </form>
          <p class="tiny muted story-hilfe">Zwei Würfel plus dein Wert. 10 und mehr gelingt,
            7 bis 9 mit Haken, darunter geht es schief — weiter geht es immer.</p>
        </div>
      </div>`;

    root.querySelector('[data-scroll]').scrollTop = 0;
    root.querySelectorAll('[data-opt]').forEach((b) => {
      b.onclick = () => waehlen(moeglich[Number(b.dataset.opt)]);
    });
    const form = root.querySelector('[data-form]');
    const feld = root.querySelector('[data-frei]');
    form.onsubmit = (e) => {
      e.preventDefault();
      const text = feld.value.trim();
      if (!text) return;
      feld.value = '';
      freitext(text, sz, moeglich);
    };
    bindClose();
  }

  /**
   * Getippten Text auf eine Möglichkeit abbilden.
   *
   * Zuerst die Stichwörter der Szene, dann ein paar Wörter, die überall
   * gelten. Passt nichts, gibt es eine Zeile aus `UNKLAR` und die Szene
   * steht unverändert wieder da — man verliert nichts als einen Versuch.
   */
  function freitext(text, sz, moeglich) {
    const t = text.toLowerCase();
    for (const f of (sz.frei || [])) {
      if (!f.w.some((w) => t.includes(w))) continue;
      const o = (sz.optionen || [])[f.i];
      if (o && moeglich.includes(o)) { waehlen(o, text); return; }
    }
    // Umsehen kostet nichts und hilft beim Wiedereinsteigen
    if (/(umsehen|umschauen|schauen|gucken|beschreib|wo bin)/.test(t)) {
      szene('Du siehst dich um.');
      return;
    }
    fx('tap');
    szene(UNKLAR[Math.floor(Math.random() * UNKLAR.length)]);
  }

  /* ── Auswählen, würfeln, weiter ── */

  function waehlen(o, getippt = '') {
    if (!o) return;
    fx('tap');
    const st = get();
    const l = sy(st).lauf;
    l.zug++;

    if (!o.probe) {
      weiter(o.ziel, o.txt || '', o.flag, getippt);
      return;
    }

    const mit = o.probe.mit ? Object.entries(o.probe.mit)
      .reduce((n, [flag, v]) => n + (l.flags.includes(flag) ? v : 0), 0) : 0;
    const wurf = wuerfeln(l.werte[o.probe.attr] || 0, (o.probe.bonus || 0) + mit);
    const aus = o[wurf.stufe];
    wuerfelZeigen(o, wurf, () => weiter(aus.ziel, aus.txt, aus.flag, getippt));
  }

  /** Kurzer Zwischenschritt: Man will die Würfel sehen, nicht nur das Ergebnis. */
  function wuerfelZeigen(o, wurf, dann) {
    const label = WERTE.find((w) => w.id === o.probe.attr).label;
    const s = STUFEN[wurf.stufe];
    root.innerHTML = `
      <div class="game-wrap">
        ${header()}
        <div class="game-center">
          <div class="story-wurf">
            <span class="story-w" data-w1>?</span>
            <span class="story-w" data-w2>?</span>
            <span class="story-plus">+${wurf.wert}</span>
          </div>
          <div class="story-summe" data-summe>&nbsp;</div>
          <div class="story-stufe ${s.cls}" data-stufe style="opacity:0">${s.label}</div>
          <p class="game-p" style="margin-top:14px">${esc(label)}-Probe</p>
          <button class="btn btn-primary btn-block" data-weiter style="opacity:0;pointer-events:none">Weiter</button>
        </div>
      </div>`;
    bindClose();

    const w1 = root.querySelector('[data-w1]'), w2 = root.querySelector('[data-w2]');
    const summe = root.querySelector('[data-summe]'), stufe = root.querySelector('[data-stufe]');
    const knopf = root.querySelector('[data-weiter]');

    // Kurzes Rollen, dann stehen bleiben
    let n = 0;
    const roll = setInterval(() => {
      w1.textContent = 1 + Math.floor(Math.random() * 6);
      w2.textContent = 1 + Math.floor(Math.random() * 6);
      if (++n > 9) {
        clearInterval(roll);
        w1.textContent = wurf.a; w2.textContent = wurf.b;
        w1.classList.add('fest'); w2.classList.add('fest');
        summe.textContent = `= ${wurf.summe}`;
        stufe.style.opacity = '1';
        knopf.style.opacity = '1';
        knopf.style.pointerEvents = '';
        fx(wurf.stufe === 'gut' ? 'coin' : wurf.stufe === 'schlecht' ? 'fail' : 'pop');
        if (wurf.stufe === 'gut') {
          const b = summe.getBoundingClientRect();
          burst(['sparkle'], { x: b.left + b.width / 2, y: b.top, count: 5 });
        }
      }
    }, 70);
    knopf.onclick = dann;
    // Auch ohne Klick weiter, falls jemand nur zusieht
    const auto = setTimeout(() => { if (knopf.style.pointerEvents !== 'none') dann(); }, 4200);
    root.querySelector('[data-close]').addEventListener('click', () => { clearInterval(roll); clearTimeout(auto); });
    knopf.addEventListener('click', () => { clearInterval(roll); clearTimeout(auto); }, { once: true });
  }

  function weiter(ziel, txt, flag, getippt) {
    const st = get();
    const l = sy(st).lauf;
    if (flag && !l.flags.includes(flag)) l.flags.push(flag);
    l.szene = ziel || l.szene;
    commit('story');
    szene(getippt ? `„${getippt}“ — ${txt || ''}`.trim() : (txt || ''));
  }

  /* ── Schluss ── */

  function ende(sz) {
    const st = get();
    const s = sy(st);
    const l = s.lauf;
    const c = kontext();
    const satz = endeSatz(l.szene, l.rolle);
    const titel = sz.titel || 'Der Abend';

    // Einmal pro Durchlauf eintragen, auch wenn man die Seite neu aufbaut
    if (!l.abgelegt) {
      l.abgelegt = true;
      l.fertig = true;
      s.chronik.unshift({ titel, satz, rolle: l.rolle, at: Date.now() });
      if (s.chronik.length > 20) s.chronik.length = 20;
      st.me.coins += REWARDS.gamePlayed;
      addBondXp(st, 4);
      pushFeed(st, { from: 'me', type: 'game', icon: meta.icon, text: `Maskenball: ${titel}`, note: satz });
      sendEvent('game', { g: meta.id, kind: 'storyEnd', titel, satz });
      commit('story');
      confetti(['sparkle', 'mailHeart', 'feather']);
      fx('yay');
    }

    const absatz = (t) => String(t || '').trim().split(/\n\s*\n/)
      .map((p) => `<p>${esc(p.replace(/\s+/g, ' '))}</p>`).join('');
    const zusatz = spicy && sz.spicy ? sz.spicy(c) : '';

    root.innerHTML = `
      <div class="game-wrap">
        ${header()}
        <div class="game-scroll">
          <div class="story-ende-kopf">
            <div class="game-hero">${icon('gameStory', { size: 56 })}</div>
            <div class="game-kicker">Ende · ${esc(rolleById(l.rolle).name)}</div>
            <h2 class="game-h">${esc(titel)}</h2>
          </div>
          <div class="story-text">
            ${absatz(sz.text(c))}
            ${zusatz ? `<div class="story-spicy">${absatz(zusatz)}</div>` : ''}
          </div>
          <div class="story-bilanz">
            ${l.flags.length
              ? l.flags.slice(0, 8).map((f) => `<span class="chip">${esc(fahneText(f))}</span>`).join('')
              : '<span class="chip">Unauffällig geblieben</span>'}
          </div>
          ${partner ? `<p class="tiny muted" style="margin:14px 4px 0">
            ${esc(partner)} bekommt eine kurze Nachricht, wie dein Abend ausgegangen ist —
            aber nicht, wie du dahin gekommen bist.</p>` : ''}
          <button class="btn btn-love btn-block" data-again style="margin-top:18px">Andere Rolle spielen</button>
          <button class="btn btn-ghost btn-block" data-close style="margin-top:8px">Fertig</button>
        </div>
      </div>`;

    root.querySelector('[data-again]').onclick = () => {
      const st2 = get();
      sy(st2).lauf = null;
      commit('story');
      intro();
    };
    bindClose();
  }

  intro();
  return () => {};
}

/** Flaggen lesbar machen — die Bilanz am Ende soll man verstehen. */
const FAHNEN = {
  ungesehen: 'Niemand hat dich gesehen',
  gesehen: 'Ehrlich am Tor',
  gemerkt: 'Man hat sich dich gemerkt',
  frech: 'Frech hineinspaziert',
  gehoert: 'Jemand hat dich gehört',
  tablett: 'Mit einem Tablett getarnt',
  toertchen: 'Ein Törtchen gestohlen',
  geruecht: 'Von der Turmtür gehört',
  geheimnis: 'Die ganze Geschichte erfahren',
  brief: 'Den Brief gelesen',
  schluessel: 'Den Schlüssel eingesteckt',
  glaeser: 'Zwei Gläser besorgt',
  direkt: 'Direkt auf sie zugegangen',
  verloren: 'Sie kurz aus den Augen verloren',
  eifersucht: 'Jemand anderes war schneller',
  funke: 'Es hat gefunkt',
  kuehl: 'Es blieb kühl',
  ruhig: 'Schweigend nebeneinander',
  maske_ab: 'Die Maske abgenommen',
  kuss: 'Geküsst',
  versprechen: 'Auf später vertröstet',
  verbuendet: 'Gemeinsame Sache gemacht',
  allein: 'Allein hinaufgegangen',
  dach: 'Über das Dach gestiegen',
  spaet: 'Zu spät gekommen'
};
const fahneText = (f) => FAHNEN[f] || f;
