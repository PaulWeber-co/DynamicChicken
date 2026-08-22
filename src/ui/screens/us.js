/**
 * Wir — der Ort für die Fernbeziehung.
 *
 * Vier Abschnitte, weil vier verschiedene Zeitgefühle dahinterstecken:
 *   Heute   was gerade ist — Stimmung, Wetter, kleine Gesten
 *   Nest    was mal sein soll — die gemeinsame Wohnung im Kopf
 *   Wählen  was als Nächstes ansteht — eine Frage, zwei Stimmen
 *   Raten   wie gut ihr euch kennt — bewerten und tippen
 *
 * Alle drei neuen Abschnitte teilen dieselbe Regel: sichtbar wird es erst,
 * wenn beide abgegeben haben.
 */

import { esc } from '../../util/dom.js';
import { fx, burst, confetti, haptic } from '../../util/feedback.js';
import { get, commit, subscribe } from '../../state/store.js';
import { renderChicken } from '../../pet/chicken.js';
import { icon } from '../icons.js';
import { MOODS, ACTIVITIES, NUDGES, moodByKey, activityByKey, petMood, dayIndex } from '../../pet/moods.js';
import { cycledMany } from '../../util/rng.js';
import { tickPet, pushFeed, addBondXp, bondXpForLevel } from '../../state/model.js';
import { REWARDS } from '../../state/catalog.js';
import { ensureDaily, slotById, slotLocked, slotReward } from '../../state/daily.js';
import {
  ensureShared, NEST_CATALOG, NEST_CATS, weightLabel, nestSummary,
  POLL_TEMPLATES, rateScore, rateStats, KIND_ICON, KIND_LABEL, kindOf, safeUrl
} from '../../state/shared.js';
import {
  sendNudge, setMood, setActivity,
  setNestWeight, dropNestWish, createPoll, votePoll, createRate, submitRate, setReunion
} from '../actions.js';
import { sendEvent, partnerOnline } from '../../sync/index.js';
import { dayKey, localTimeIn, tzOffsetHours, hourIn, relTime, daysBetween } from '../../util/time.js';
import { forecast, describe, advice, clockOf, distanceKm, formatKm, distanceLine } from '../../util/weather.js';
import { reiseZeilen, dauer } from '../../util/reise.js';
import { toast } from '../toast.js';
import { sheet, closeSheet } from '../sheet.js';
import { openPlaceSheet } from '../placeSheet.js';
import { go } from '../shell.js';

const SEGMENTS = [
  { id: 'today', label: 'Heute', icon: 'tabUs' },
  { id: 'nest', label: 'Nest', icon: 'tabNest' },
  { id: 'vote', label: 'Wählen', icon: 'tabVote' },
  { id: 'rate', label: 'Raten', icon: 'dial' }
];

/** Überlebt einen Tab-Wechsel, damit man nicht ständig neu sucht. */
let activeSeg = 'today';
export function setUsTab(id) {
  if (SEGMENTS.some((s) => s.id === id)) activeSeg = id;
}

/** Wetter wird pro Screen einmal geholt und dann nur noch nachgezeichnet. */
let wx = { mine: null, theirs: null, at: 0, failed: false, stelle: '' };

export function render(root, ctx) {
  const s = get();
  tickPet(s.me.pet);
  ensureShared(s);
  markSeen(s);

  root.innerHTML = `<div class="us" data-us></div>`;
  const host = root.querySelector('[data-us]');
  let holdTimer = 0, holding = false, syncFired = false;

  function paint() {
    // Während des Kuschel-Haltens nicht neu zeichnen — sonst verliert der
    // Finger den Knopf unter sich.
    if (holding) return;
    const st = get();
    ensureShared(st);
    const p = st.partner;

    if (!p) { host.innerHTML = unlinked(st); bind(); return; }

    host.innerHTML = `
      ${headerRow(st, p)}
      ${segmentBar(st)}
      <div class="seg-page" data-page>${page(st, p)}</div>`;
    bind();
  }

  function page(st, p) {
    switch (activeSeg) {
      case 'nest': return nestPanel(st, p);
      case 'vote': return votePanel(st, p);
      case 'rate': return ratePanel(st, p);
      default: return todayPanel(st, p);
    }
  }

  /* ── Kopf ── */
  function headerRow(st, p) {
    return `
      <div class="row-between">
        <div>
          <div class="title-lg">Wir</div>
          <div class="subtitle">${esc(st.me.name || 'Du')} &amp; ${esc(p.name)}${st.bond.since ? ` · ${seitWann(st.bond.since)}` : ''}</div>
        </div>
        <div class="streak-pill" title="Tage in Folge">${icon('flame', { size: 20 })}<b>${st.bond.streak}</b></div>
      </div>`;
  }

  function segmentBar(st) {
    const dots = {
      nest: st.nest.filter((x) => x.theirs != null && x.mine === 0).length,
      vote: st.polls.filter((x) => x.mine == null && x.theirs != null).length,
      rate: st.rates.filter((x) => !x.mine && x.theirs).length
    };
    return `<div class="segbar" role="tablist">
      ${SEGMENTS.map((sg) => `<button class="segbtn" role="tab" data-seg="${sg.id}"
        aria-selected="${activeSeg === sg.id}">
        ${icon(sg.icon, { size: 17 })}<span>${esc(sg.label)}</span>
        ${dots[sg.id] ? `<i class="seg-dot">${dots[sg.id]}</i>` : ''}
      </button>`).join('')}
    </div>`;
  }

  /* ══ Heute ══════════════════════════════════════════════ */
  function todayPanel(st, p) {
    const myMood = moodByKey(st.me.mood?.key);
    const theirMood = moodByKey(p.mood?.key);
    const theirAct = activityByKey(p.activity?.key);
    const myAct = activityByKey(st.me.activity?.key);
    const online = partnerOnline();
    const theirHour = hourIn(p.tz);
    const theirSleeping = theirHour >= 1 && theirHour < 7;
    const diff = tzOffsetHours(st.me.tz, p.tz);
    const bondNext = bondXpForLevel(st.bond.level + 1);
    const bondPrev = bondXpForLevel(st.bond.level);
    const bondFrac = Math.max(0, Math.min(1, (st.bond.xp - bondPrev) / Math.max(1, bondNext - bondPrev)));

    return `
      <div class="card duo-card">
        <div class="duo">
          <div class="duo-side">
            <div class="duo-bubble">${icon(myMood ? myMood.icon : 'nudgeThink', { size: 24 })}</div>
            <div class="duo-chick">${renderChicken(st.me.pet.look, { mood: petMood(st.me.pet, { asleep: st.me.pet.asleep, moodKey: st.me.mood?.key }), size: 118, shadow: false })}</div>
            <div class="duo-name">${esc(st.me.pet.name)}</div>
            <div class="duo-sub">${localTimeIn(st.me.tz)}${myAct ? ` · ${esc(myAct.label)}` : ''}</div>
          </div>

          <button class="cuddle-btn" data-cuddle aria-label="Halten zum Kuscheln">
            <span class="cuddle-ring"></span>
            <span class="cuddle-core">${icon('careCuddle', { size: 32 })}</span>
          </button>

          <div class="duo-side">
            <div class="duo-bubble">${icon(theirMood ? theirMood.icon : 'nudgeThink', { size: 24 })}</div>
            <div class="duo-chick">${renderChicken(p.pet.look, { mood: theirSleeping || p.pet.asleep ? 'asleep' : petMood(p.pet, { moodKey: p.mood?.key }), size: 118, shadow: false })}</div>
            <div class="duo-name">${esc(p.pet.name)}</div>
            <div class="duo-sub">${localTimeIn(p.tz)}${theirAct ? ` · ${esc(theirAct.label)}` : ''}</div>
          </div>
        </div>

        <div class="duo-status">
          <span class="badge ${theirSleeping ? 'badge-off' : online ? 'badge-live' : 'badge-wait'}">
            ${online && !theirSleeping ? '<span class="dot-live"></span>' : ''}
            ${theirSleeping ? `${esc(p.name)} schläft` : online ? `${esc(p.name)} ist da` : `zuletzt ${relTime(p.lastSeen)}`}
          </span>
          ${diff ? `<span class="badge">${diff > 0 ? `+${diff}` : diff} Std. Unterschied</span>` : ''}
          <span class="badge badge-love">${icon('careCuddle', { size: 14 })} ${st.bond.hugs}</span>
        </div>

        <div class="bond">
          <div class="bond-row">
            <span>Bond-Level <b>${st.bond.level}</b></span>
            <span class="tiny muted">${Math.round(bondFrac * (bondNext - bondPrev))} / ${Math.round(bondNext - bondPrev)}</span>
          </div>
          <div class="stat-track"><span class="stat-fill" style="width:${bondFrac * 100}%;background:var(--love)"></span></div>
        </div>
      </div>

      ${weatherCard(st, p)}
      ${distanceCard(st, p)}
      ${dailyCard(st, p)}

      <div class="section-label">Wie geht es dir gerade?</div>
      <div class="card">
        <div class="wrap">
          ${MOODS.map((m) => `<button class="chip chip-love" data-mood="${m.key}" aria-pressed="${st.me.mood?.key === m.key}">
            ${icon(m.icon, { size: 20 })}${esc(m.label)}
          </button>`).join('')}
        </div>
        ${st.me.mood ? `<button class="note-line" data-note>
          ${st.me.mood.note ? `„${esc(st.me.mood.note)}“` : 'Ein Satz dazu …'}
        </button>` : ''}
      </div>

      <div class="section-label">Was machst du gerade?</div>
      <div class="card">
        <div class="wrap">
          ${ACTIVITIES.map((a) => `<button class="chip" data-act="${a.key}" aria-pressed="${st.me.activity?.key === a.key}">
            ${icon(a.icon, { size: 20 })}${esc(a.label)}
          </button>`).join('')}
        </div>
      </div>

      <div class="section-label">Kleine Gesten</div>
      <div class="nudge-grid">
        ${NUDGES.map((n, i) => `<button class="nudge" data-nudge="${n.key}" style="--i:${i}">
          <span class="nudge-e">${icon(n.icon, { size: 26 })}</span>
          <span class="nudge-l">${esc(n.label)}</span>
        </button>`).join('')}
      </div>

      <div class="section-label">Unser Verlauf</div>
      ${timeline(st)}
    `;
  }

  /* ── Wetter ── */
  function weatherCard(st, p) {
    const theirs = p.place;
    const mine = st.me.place;

    if (!theirs && !mine) {
      return `<div class="card wx-card wx-empty">
        <div class="wx-head">${icon('globe', { size: 20 })}<span>Wetter</span></div>
        <p class="muted tiny" style="margin:0 0 12px">
          Trag deinen Ort ein, dann seht ihr gegenseitig, wie das Wetter beim anderen ist.
          Gespeichert wird nur die grobe Umgebung.
        </p>
        <button class="btn btn-soft btn-block" data-place>Meinen Ort setzen</button>
      </div>`;
    }

    const w = wx.theirs;
    const d = w ? describe(w.code, w.isDay) : null;

    if (!theirs) {
      return `<div class="card wx-card wx-empty">
        <div class="wx-head">${icon('pin', { size: 18 })}<span>${esc(mine.name)}</span></div>
        ${wx.mine ? wxRow(wx.mine, 'Bei dir')
          : `<p class="muted tiny" style="margin:0">${wx.failed ? 'Wetterdienst nicht erreichbar' : 'Wetter wird geholt …'}</p>`}
        <p class="muted tiny" style="margin:12px 0 0">
          ${esc(p.name)} hat noch keinen Ort gesetzt.
        </p>
      </div>`;
    }

    return `<div class="card wx-card ${w ? `wx-${d.icon}` : ''}">
      <div class="wx-main">
        <div class="wx-ico">${icon(w ? d.icon : 'wCloud', { size: 62 })}</div>
        <div class="wx-body">
          <div class="wx-place">${icon('pin', { size: 13 })} ${esc(theirs.name || p.name)}${theirs.name && theirs.country ? `, ${esc(theirs.country)}` : ''}${
            theirs.auto && theirs.at ? `<span class="wx-frisch">${icon('rotate', { size: 11, cls: 'ic-inline' })} ${esc(relTime(theirs.at))}</span>` : ''}</div>
          ${w ? `
            <div class="wx-temp">${Math.round(w.temp)}<span>°</span></div>
            <div class="wx-desc">${esc(d.label)}${
              w.feels != null && Math.round(w.feels) !== Math.round(w.temp)
                ? ` · gefühlt ${Math.round(w.feels)}°` : ''}</div>
          ` : `<div class="wx-desc">${wx.failed ? 'Wetterdienst nicht erreichbar' : 'Wetter lädt …'}</div>`}
        </div>
      </div>
      ${w ? `
        <div class="wx-strip">
          ${w.min != null && w.max != null
            ? `<span>${icon('thermo', { size: 15 })} ${Math.round(w.min)}° / ${Math.round(w.max)}°</span>` : ''}
          ${w.wind != null ? `<span>${icon('wWind', { size: 15 })} ${Math.round(w.wind)} km/h</span>` : ''}
          ${w.sunset ? `<span>${icon('sunrise', { size: 15 })} ${clockOf(w.sunset)}</span>` : ''}
        </div>
        <div class="wx-tip">${esc(advice(w))}</div>
      ` : ''}
      ${mine && wx.mine ? `<div class="wx-mine">
        ${icon(describe(wx.mine.code, wx.mine.isDay).icon, { size: 20 })}
        <span>${mine.name ? `Bei dir in ${esc(mine.name)}` : 'Bei dir'}: ${Math.round(wx.mine.temp)}°</span>
        ${w ? `<b>${diffWord(wx.mine.temp, w.temp)}</b>` : ''}
      </div>` : `<button class="btn btn-ghost btn-block" data-place style="margin-top:10px">Eigenen Ort setzen</button>`}
    </div>`;
  }

  const wxRow = (w, who) => {
    const d = describe(w.code, w.isDay);
    return `<div class="wx-line">${icon(d.icon, { size: 26 })}
      <span>${esc(who)}: ${esc(d.label)}, ${Math.round(w.temp)}°</span></div>`;
  };

  /**
   * „seit 0 Tagen“ ist keine Zeitangabe, sondern ein Rechenergebnis.
   *
   * Am ersten Tag steht da sonst eine Null, und ab dem 366. Tag eine
   * vierstellige Zahl, die niemand mehr im Kopf umrechnet.
   */
  function seitWann(since) {
    const tage = daysBetween(new Date(since).toISOString().slice(0, 10), dayKey());
    if (!(tage > 0)) return 'seit heute';
    if (tage === 1) return 'seit gestern';
    if (tage < 365) return `seit ${tage} Tagen`;
    const jahre = Math.floor(tage / 365);
    const rest = tage - jahre * 365;
    return rest < 30
      ? `seit ${jahre} ${jahre === 1 ? 'Jahr' : 'Jahren'}`
      : `seit ${jahre} ${jahre === 1 ? 'Jahr' : 'Jahren'} und ${Math.floor(rest / 30)} Monaten`;
  }

  const diffWord = (a, b) => {
    const d = Math.round(a - b);
    if (Math.abs(d) <= 1) return 'fast gleich';
    return d > 0 ? `${d}° wärmer` : `${Math.abs(d)}° kälter`;
  };

  /* ── Entfernung und Wiedersehen ── */
  function distanceCard(st, p) {
    const km = distanceKm(st.me.place, p.place);
    const r = st.reunion;
    const tage = r ? daysUntil(r.date) : null;

    // Ohne beides gäbe es nur eine leere Karte
    if (km == null && !r) {
      return `<div class="card dist-card">
        <div class="dist-head">${icon('sunrise', { size: 18 })}<span>Wiedersehen</span></div>
        <p class="muted tiny" style="margin:0 0 12px">
          Trag ein, wann ihr euch das nächste Mal seht — dann zählt die App mit.
        </p>
        <button class="btn btn-soft btn-block" data-reunion>Datum setzen</button>
      </div>`;
    }

    const wege = km != null ? reiseZeilen(km) : [];

    return `<div class="card dist-card">
      ${km != null ? `
        <div class="dist-row">
          <div class="dist-num">${esc(formatKm(km))}</div>
          <div class="grow">
            <div class="li-title">Luftlinie zwischen euch</div>
            <div class="li-sub">${esc(distanceLine(km))}</div>
          </div>
        </div>
        <div class="dist-track" aria-hidden="true">
          <span class="dist-end">${renderChicken(st.me.pet.look, { mood: 'happy', size: 34, shadow: false })}</span>
          <span class="dist-line"><i></i></span>
          <span class="dist-end">${renderChicken(p.pet.look, { mood: 'love', size: 34, shadow: false })}</span>
        </div>
        ${wege.length ? `
          <div class="wege">
            ${wege.map((w, i) => `<div class="weg ${i === 0 ? 'schnell' : ''}">
              <span class="weg-ico">${icon(w.icon, { size: 20 })}</span>
              <span class="grow">${esc(w.label)}</span>
              <span class="weg-zeit">${esc(dauer(w.min))}</span>
            </div>`).join('')}
          </div>
          <p class="tiny muted center" style="margin:8px 4px 0">
            Geschätzt aus der Luftlinie — keine echte Route, also ohne Fähre,
            Stau und Umleitung.
          </p>` : ''}` : ''}

      ${r ? `
        <button class="reunion ${tage <= 0 ? 'now' : ''}" data-reunion>
          <span class="reunion-ico">${icon(tage <= 0 ? 'statJoy' : 'sunrise', { size: 22 })}</span>
          <span class="grow">
            <span class="li-title">${esc(r.label || 'Wiedersehen')}</span>
            <span class="li-sub">${esc(dateLong(r.date))}</span>
          </span>
          <span class="reunion-num">${tage > 0 ? tage : tage === 0 ? 'heute' : `${Math.abs(tage)}`}
            <small>${tage > 1 ? 'Tage' : tage === 1 ? 'Tag' : tage === 0 ? '' : 'her'}</small></span>
        </button>
      ` : `<button class="btn btn-soft btn-block" data-reunion style="margin-top:12px">
          ${icon('sunrise', { size: 15 })} Wiedersehen eintragen
        </button>`}
    </div>`;
  }

  /** Ganze Tage bis zum Datum, in lokaler Zeit gerechnet. */
  function daysUntil(date) {
    const then = new Date(`${date}T00:00:00`);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return Math.round((then - now) / 86_400_000);
  }

  const dateLong = (d) => {
    try {
      return new Date(`${d}T12:00:00`).toLocaleDateString('de-DE',
        { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    } catch { return d; }
  };

  /* ══ Nest ═══════════════════════════════════════════════ */
  function nestPanel(st, p) {
    const sum = nestSummary(st);
    const byKey = new Map(st.nest.map((x) => [x.key || x.id, x]));
    const custom = st.nest.filter((x) => !x.key);

    return `
      <div class="card nest-hero">
        <div class="nest-hero-art">
          ${icon('tabNest', { size: 52 })}
          <div class="nest-hero-chicks">
            ${renderChicken(st.me.pet.look, { mood: 'happy', size: 54, shadow: false })}
            ${renderChicken(p.pet.look, { mood: 'love', size: 54, shadow: false })}
          </div>
        </div>
        <h2 class="nest-h">Unser Nest</h2>
        <p class="muted tiny" style="margin:0 0 4px">
          Was euch an einer gemeinsamen Wohnung wichtig wäre. Jeder gewichtet für sich,
          danach seht ihr, wo ihr euch einig seid.
        </p>
        ${sum.match != null ? `
          <div class="nest-match">
            <div class="nest-match-num">${sum.match}<span>%</span></div>
            <div class="grow">
              <div class="li-title">Übereinstimmung</div>
              <div class="stat-track"><span class="stat-fill" style="width:${sum.match}%;background:var(--love)"></span></div>
              <div class="li-sub">${sum.rated} von ${sum.total} Wünschen habt ihr beide bewertet</div>
            </div>
          </div>` : `<div class="li-sub" style="margin-top:8px">Noch nichts von ${esc(p.name)} — bewerte du zuerst.</div>`}
      </div>

      ${sum.agreed.length ? `
        <div class="section-label">Darin seid ihr euch einig</div>
        <div class="card nest-agreed">
          ${sum.agreed.slice(0, 12).map((x) => `<div class="nest-hit">
            <span class="nest-hit-ico">${icon(x.icon, { size: 22 })}</span>
            <span class="grow">${esc(x.text)}</span>
            <span class="nest-hit-w">${'●'.repeat(Math.min(x.mine, x.theirs))}</span>
          </div>`).join('')}
        </div>` : ''}

      ${sum.talk.length ? `
        <div class="section-label">Darüber solltet ihr reden</div>
        <div class="card nest-talk">
          ${sum.talk.slice(0, 8).map((x) => `<div class="nest-gap">
            <span class="nest-hit-ico">${icon(x.icon, { size: 22 })}</span>
            <div class="grow">
              <div class="li-title">${esc(x.text)}</div>
              <div class="li-sub">Du: ${weightLabel(x.mine)} · ${esc(p.name)}: ${weightLabel(x.theirs)}</div>
            </div>
            <span class="gap-bar"><i style="height:${(x.mine / 3) * 100}%;background:var(--accent)"></i><i style="height:${(x.theirs / 3) * 100}%;background:var(--love)"></i></span>
          </div>`).join('')}
        </div>` : ''}

      <div class="section-label">Was ist dir wichtig?</div>
      <p class="muted tiny" style="margin:-4px 4px 10px">Tippen wechselt die Stufe: egal → schön → wichtig → unverzichtbar.</p>

      ${NEST_CATS.filter((c) => c !== 'Eigenes').map((cat) => `
        <div class="nest-cat">${esc(cat)}</div>
        <div class="card nest-list">
          ${NEST_CATALOG.filter((w) => w.cat === cat).map((w) => wishRow(w, byKey.get(w.key), p)).join('')}
        </div>`).join('')}

      ${custom.length ? `
        <div class="nest-cat">Eigenes</div>
        <div class="card nest-list">
          ${custom.map((x) => wishRow({ key: null, icon: x.icon, text: x.text }, x, p, true)).join('')}
        </div>` : ''}

      <button class="btn btn-soft btn-block" data-wish style="margin-top:12px">
        ${icon('plus', { size: 16 })} Eigenen Wunsch hinzufügen
      </button>`;
  }

  function wishRow(cat, item, p, removable = false) {
    const mine = item?.mine ?? 0;
    const theirs = item?.theirs;
    const id = item?.id || '';
    return `<div class="wish ${mine > 0 ? 'on' : ''}" data-wish-key="${esc(cat.key || '')}" data-wish-id="${esc(id)}">
      <button class="wish-main" data-cycle
        data-key="${esc(cat.key || '')}" data-id="${esc(id)}"
        data-text="${esc(cat.text)}" data-icon="${esc(cat.icon)}" data-cat="${esc(cat.cat || 'Eigenes')}" data-w="${mine}">
        <span class="wish-ico">${icon(cat.icon, { size: 22 })}</span>
        <span class="grow">
          <span class="wish-text">${esc(cat.text)}</span>
          ${theirs != null ? `<span class="wish-them">${esc(p.name)}: ${weightLabel(theirs).toLowerCase()}</span>` : ''}
        </span>
        <span class="wish-dots" aria-label="${weightLabel(mine)}">
          ${[1, 2, 3].map((n) => `<i class="${mine >= n ? 'on' : ''}"></i>`).join('')}
        </span>
      </button>
      ${removable ? `<button class="wish-x" data-drop="${esc(id)}" aria-label="Entfernen">${icon('close', { size: 13 })}</button>` : ''}
    </div>`;
  }

  /* ══ Wählen ═════════════════════════════════════════════ */
  function votePanel(st, p) {
    const open = st.polls.filter((x) => !x.doneAt);
    const done = st.polls.filter((x) => x.doneAt);

    return `
      <div class="card vote-hero">
        <div class="vote-hero-ico">${icon('tabVote', { size: 44 })}</div>
        <h2 class="nest-h">Abstimmen</h2>
        <p class="muted tiny" style="margin:0 0 12px">
          Eine Frage, zwei Stimmen. Was ${esc(p.name)} gewählt hat, siehst du erst,
          wenn du selbst gewählt hast.
        </p>
        <button class="btn btn-primary btn-block" data-newpoll>${icon('plus', { size: 16 })} Neue Abstimmung</button>
      </div>

      <div class="section-label">Schnell gefragt</div>
      <div class="wrap" style="margin-bottom:4px">
        ${tagesVorlagen().map((t) => `<button class="chip" data-tpl="${t.key}">${icon('ballot', { size: 18 })}${esc(t.q)}</button>`).join('')}
      </div>

      ${open.length ? `
        <div class="section-label">Offen</div>
        ${open.map((poll) => pollCard(poll, st, p)).join('')}` : ''}

      ${done.length ? `
        <div class="section-label">Entschieden</div>
        ${done.slice(0, 10).map((poll) => pollCard(poll, st, p)).join('')}` : ''}

      ${!open.length && !done.length ? `<div class="card"><div class="empty">
        <span class="empty-emoji">${icon('ballot', { size: 42 })}</span>
        Noch keine Frage. „Was machen wir heute Abend?“ wäre ein Anfang.
      </div></div>` : ''}`;
  }

  function pollCard(poll, st, p) {
    const revealed = !!poll.doneAt;
    const agree = revealed && poll.mine === poll.theirs;
    const label = (k) => poll.opts.find((o) => o.k === k)?.label || '—';

    return `<div class="card poll ${revealed ? (agree ? 'poll-agree' : 'poll-split') : ''}">
      <div class="poll-top">
        <span class="poll-kick">${icon(revealed ? (agree ? 'handshake' : 'scale') : 'tabVote', { size: 15 })}
          ${poll.by === st.me.code ? 'Du fragst' : `${esc(p.name)} fragt`}</span>
        <span class="tiny muted">${relTime(poll.at)}</span>
      </div>
      <div class="poll-q">${esc(poll.q)}</div>

      ${revealed ? `
        <div class="poll-result">
          ${poll.opts.map((o) => {
            const me = poll.mine === o.k, them = poll.theirs === o.k;
            return `<div class="poll-opt done ${me || them ? 'picked' : ''}">
              <span class="poll-ico">${icon(o.icon || 'ballot', { size: 20 })}</span>
              <span class="grow">${esc(o.label)}</span>
              <span class="poll-who">
                ${me ? '<i class="pw me">Du</i>' : ''}
                ${them ? `<i class="pw them">${esc(p.name.slice(0, 8))}</i>` : ''}
              </span>
            </div>`;
          }).join('')}
        </div>
        <div class="poll-verdict">${agree
          ? `${icon('handshake', { size: 16 })}<span>Einig: <b>${esc(label(poll.mine))}</b></span>`
          : `${icon('scale', { size: 16 })}<span>Du: <b>${esc(label(poll.mine))}</b> · ${esc(p.name)}: <b>${esc(label(poll.theirs))}</b></span>`}</div>
      ` : poll.mine != null ? `
        <div class="poll-sealed">${icon('lock', { size: 14 })}
          <span>Du hast <b>${esc(label(poll.mine))}</b> gewählt. Warten auf ${esc(p.name)}.</span></div>
      ` : `
        <div class="poll-opts">
          ${poll.opts.map((o) => `<button class="poll-opt" data-vote="${esc(poll.id)}" data-k="${esc(o.k)}">
            <span class="poll-ico">${icon(o.icon || 'ballot', { size: 20 })}</span>
            <span class="grow">${esc(o.label)}</span>
            ${icon('chevron', { size: 14 })}
          </button>`).join('')}
        </div>
        ${poll.theirs != null ? `<div class="poll-hint">${esc(p.name)} hat schon gewählt.</div>` : ''}
      `}
    </div>`;
  }

  /* ══ Raten ══════════════════════════════════════════════ */
  function ratePanel(st, p) {
    const stats = rateStats(st);
    const open = st.rates.filter((x) => !x.doneAt);
    const done = st.rates.filter((x) => x.doneAt);

    return `
      <div class="card rate-hero">
        <div class="rate-hero-ico">${icon('dial', { size: 44 })}</div>
        <h2 class="nest-h">Bewerten &amp; Raten</h2>
        <p class="muted tiny" style="margin:0 0 12px">
          Ein Song, ein Link, irgendeine Sache. Beide geben eine Note von 1 bis 10 —
          und tippen, was der andere sagt. Punkte gibt es fürs Kennen, nicht fürs Mögen.
        </p>
        ${stats.rounds ? `
          <div class="rate-score">
            <div><b>${stats.me}</b><small>Du</small></div>
            <div class="rate-score-mid">${stats.rounds} ${stats.rounds === 1 ? 'Runde' : 'Runden'}</div>
            <div><b>${stats.them}</b><small>${esc(p.name)}</small></div>
          </div>
          <div class="li-sub center">Geschmacks-Nähe ${stats.taste}%</div>
        ` : ''}
        <button class="btn btn-primary btn-block" data-newrate style="margin-top:12px">
          ${icon('plus', { size: 16 })} Etwas zum Bewerten
        </button>
      </div>

      ${open.length ? `<div class="section-label">Offen</div>
        ${open.map((e) => rateCard(e, st, p)).join('')}` : ''}

      ${done.length ? `<div class="section-label">Aufgedeckt</div>
        ${done.slice(0, 10).map((e) => rateCard(e, st, p)).join('')}` : ''}

      ${!open.length && !done.length ? `<div class="card"><div class="empty">
        <span class="empty-emoji">${icon('disc', { size: 42 })}</span>
        Noch nichts bewertet. Schick den Song, der dir heute nicht aus dem Kopf geht.
      </div></div>` : ''}`;
  }

  function rateCard(e, st, p) {
    const ico = KIND_ICON[e.kind] || 'sparkle';
    const revealed = !!e.doneAt;
    const sc = revealed ? rateScore(e) : null;

    return `<div class="card rate ${revealed ? 'rate-open' : ''}">
      <div class="rate-top">
        <span class="rate-ico">${icon(ico, { size: 26 })}</span>
        <div class="grow">
          <div class="rate-title">${esc(e.title)}</div>
          <div class="li-sub">${esc(KIND_LABEL[e.kind] || 'Sache')} · ${e.by === st.me.code ? 'von dir' : `von ${esc(p.name)}`} · ${relTime(e.at)}</div>
        </div>
      </div>
      ${e.note ? `<div class="rate-note">„${esc(e.note)}“</div>` : ''}
      ${linkRow(e.url)}

      ${revealed ? `
        <div class="rate-grid">
          <div class="rate-col">
            <div class="rate-col-h">Du</div>
            <div class="rate-num">${e.mine.score}</div>
            <div class="li-sub">getippt: ${e.mine.guess}</div>
          </div>
          <div class="rate-col mid">
            <div class="rate-pts">+${sc.myPts}</div>
            <div class="li-sub">deine Punkte</div>
          </div>
          <div class="rate-col">
            <div class="rate-col-h">${esc(p.name)}</div>
            <div class="rate-num them">${e.theirs.score}</div>
            <div class="li-sub">getippt: ${e.theirs.guess}</div>
          </div>
        </div>
        <div class="rate-bars">
          ${bar('Du', e.mine.score, 'var(--accent)')}
          ${bar(esc(p.name), e.theirs.score, 'var(--love)')}
        </div>
        <div class="rate-verdict">${esc(sc.verdict)}</div>
      ` : e.mine ? `
        <div class="poll-sealed">${icon('lock', { size: 14 })}
          <span>Du: <b>${e.mine.score}/10</b>, getippt <b>${e.mine.guess}</b>. Warten auf ${esc(p.name)}.</span></div>
      ` : `
        <button class="btn btn-love btn-block" data-dorate="${esc(e.id)}" style="margin-top:12px">Bewerten</button>
        ${e.theirs ? `<div class="poll-hint">${esc(p.name)} hat schon abgegeben.</div>` : ''}
      `}
    </div>`;
  }

  const bar = (who, v, color) => `<div class="rbar">
    <span class="rbar-l">${who}</span>
    <span class="rbar-t"><i style="width:${v * 10}%;background:${color}"></i></span>
    <b>${v}</b></div>`;

  /* Nur echte Web-Adressen werden zum Link — sonst bliebe ein
     javascript:-Schema aus fremder Hand anklickbar. */
  const linkRow = (raw) => {
    const url = safeUrl(raw);
    if (!url) return '';
    return `<a class="rate-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer">
      ${icon('link', { size: 14 })} ${esc(prettyUrl(url))}</a>`;
  };

  const prettyUrl = (u) => {
    try { return new URL(u).hostname.replace(/^www\./, ''); }
    catch { return u.slice(0, 40); }
  };

  /* ── Noch nicht verbunden ── */
  function unlinked(st) {
    return `
      <div class="title-lg">Wir</div>
      <div class="subtitle">Hier wohnt eure Fernbeziehung.</div>
      <div class="card center" style="padding:28px 20px">
        <div class="pair-duo">
          <div>${renderChicken(st.me.pet.look, { mood: 'happy', size: 110, shadow: false })}</div>
          <div class="pair-plus">＋</div>
          <div class="pair-ghost">${icon('egg', { size: 44 })}</div>
        </div>
        <h2 style="margin:12px 0 6px;font-size:19px;font-weight:800">Zweites Huhn gesucht</h2>
        <p class="muted" style="font-size:14.5px;margin:0 0 16px">
          Verbindet euch mit einer Einladung — dann könnt ihr Stimmungen schicken,
          das gemeinsame Nest bauen, abstimmen und euch gegenseitig raten.
        </p>
        <button class="btn btn-primary btn-block" data-goto-more>Verbinden</button>
      </div>
      <div class="card">
        <div class="li-title" style="margin-bottom:6px">Solange du allein bist</div>
        <p class="muted tiny" style="margin:0">
          Im Solo-Modus übernimmt ein simulierter Mensch die andere Seite: Stimmungen,
          Anstupser, Abstimmungen und Spielzüge kommen trotzdem herein.
        </p>
      </div>`;
  }

  /* ── Fragen des Tages ── */

  /**
   * Zwei Karten untereinander: erst die normale, dann die spicy. Die zweite
   * bleibt zu, bis die erste beantwortet ist — beide gehören zum Tag, aber
   * der Reihe nach.
   */
  function dailyCard(st, p) {
    const d = ensureDaily(st);
    const offen = d.slots.filter((s) => s.mine).length;
    const zaehler = d.slots.length > 1
      ? `<div class="section-label daily-count">
           Fragen des Tages <span class="daily-progress">${offen}/${d.slots.length}</span>
         </div>`
      : '';
    return zaehler + d.slots.map((s, i) => slotCard(st, p, s, slotLocked(d.slots, i))).join('');
  }

  function slotCard(st, p, s, gesperrt) {
    const def = slotById(s.id);
    const kopf = `<div class="daily-kicker">${icon(def.icon, { size: 15 })} ${def.label}</div>`;
    const klasse = `card daily-card${s.spicy ? ' daily-spicy' : ''}`;

    if (s.revealedAt) {
      return `<div class="${klasse} open">
        ${kopf}
        <div class="daily-q">${esc(s.q)}</div>
        <div class="daily-answer">
          <div class="daily-who">${esc(st.me.name || 'Du')}</div>
          <div class="daily-text">${esc(s.mine.text)}</div>
        </div>
        <div class="daily-answer them">
          <div class="daily-who">${esc(p.name)}</div>
          <div class="daily-text">${esc(s.theirs.text)}</div>
        </div>
      </div>`;
    }
    if (s.mine) {
      return `<div class="${klasse}">
        ${kopf}
        <div class="daily-q">${esc(s.q)}</div>
        <div class="daily-sealed">Deine Antwort liegt bereit. Sie öffnet sich, sobald ${esc(p.name)} geantwortet hat.</div>
      </div>`;
    }
    if (gesperrt) {
      // Die Frage selbst bleibt verdeckt: Sie soll nicht schon im Kopf
      // herumgehen, während man die erste beantwortet.
      return `<div class="${klasse} daily-locked">
        ${kopf}
        <div class="daily-q daily-hidden">${icon('lock', { size: 16 })} Erst die Frage des Tages</div>
        ${s.theirs ? `<div class="daily-sealed">${esc(p.name)} hat hier schon geantwortet.</div>` : ''}
      </div>`;
    }
    return `<div class="${klasse}">
      ${kopf}
      <div class="daily-q">${esc(s.q)}</div>
      ${s.theirs ? `<div class="daily-sealed">${esc(p.name)} hat schon geantwortet.</div>` : ''}
      <button class="btn btn-love btn-block" data-daily="${esc(s.id)}">Antworten</button>
    </div>`;
  }

  /* ── Verlauf ── */
  function timeline(st) {
    if (!st.feed.length) {
      return `<div class="card"><div class="empty">
        <span class="empty-emoji">${icon('nest', { size: 42 })}</span>
        Noch nichts passiert. Schick die erste Umarmung.
      </div></div>`;
    }
    return `<div class="list">
      ${st.feed.slice(0, 26).map((f, i) => `<div class="li feed-li ${f.from}" style="--i:${Math.min(i, 12)}">
        <div class="li-ico">${icon(f.icon || 'info', { size: 20 })}</div>
        <div class="grow">
          <div class="li-title">${esc(f.text)}</div>
          ${f.note ? `<div class="li-sub">„${esc(f.note)}“</div>` : ''}
          <div class="li-sub">${relTime(f.at)}</div>
        </div>
      </div>`).join('')}
    </div>`;
  }

  /* ── Interaktion ── */
  function bind() {
    host.querySelectorAll('[data-seg]').forEach((b) => {
      b.onclick = () => {
        if (activeSeg === b.dataset.seg) return;
        activeSeg = b.dataset.seg;
        fx('tap');
        paint();
        host.querySelector('[data-page]')?.classList.add('seg-in');
      };
    });

    host.querySelectorAll('[data-mood]').forEach((b) => {
      b.onclick = () => {
        const m = moodByKey(b.dataset.mood);
        setMood(b.dataset.mood, get().me.mood?.note || '');
        burst([m?.icon || 'statJoy'], { from: b, count: 5 });
        paint();
      };
    });
    host.querySelectorAll('[data-act]').forEach((b) => {
      b.onclick = () => { setActivity(b.dataset.act); paint(); };
    });
    host.querySelectorAll('[data-nudge]').forEach((b) => {
      b.onclick = () => { if (sendNudge(b.dataset.nudge, b)) paint(); };
    });

    const note = host.querySelector('[data-note]');
    if (note) note.onclick = openNoteSheet;

    host.querySelectorAll('[data-daily]').forEach((b) => {
      b.onclick = () => openDailySheet(b.dataset.daily);
    });

    const more = host.querySelector('[data-goto-more]');
    if (more) more.onclick = () => go('more');

    const cud = host.querySelector('[data-cuddle]');
    if (cud) bindCuddle(cud);

    host.querySelectorAll('[data-reunion]').forEach((b) => {
      b.onclick = openReunionSheet;
    });

    host.querySelectorAll('[data-place]').forEach((b) => {
      b.onclick = () => openPlaceSheet((place) => {
        wx = { mine: null, theirs: wx.theirs, at: 0, failed: false, stelle: '' };
        if (place) loadWeather(true); else paint();
      });
    });

    /* Nest */
    host.querySelectorAll('[data-cycle]').forEach((b) => {
      b.onclick = () => {
        const next = ((Number(b.dataset.w) || 0) + 1) % 4;
        const item = setNestWeight({
          id: b.dataset.id || null,
          key: b.dataset.key || null,
          text: b.dataset.text,
          icon: b.dataset.icon,
          cat: b.dataset.cat
        }, next);
        if (next === 3) burst([b.dataset.icon], { from: b, count: 5, rise: 90 });
        haptic(next ? 8 : 4);
        paint();
        return item;
      };
    });
    host.querySelectorAll('[data-drop]').forEach((b) => {
      b.onclick = () => { if (dropNestWish(b.dataset.drop)) { fx('tap'); paint(); } };
    });
    const wish = host.querySelector('[data-wish]');
    if (wish) wish.onclick = openWishSheet;

    /* Abstimmen */
    const np = host.querySelector('[data-newpoll]');
    if (np) np.onclick = () => openPollSheet();
    host.querySelectorAll('[data-tpl]').forEach((b) => {
      b.onclick = () => openPollSheet(POLL_TEMPLATES.find((t) => t.key === b.dataset.tpl));
    });
    host.querySelectorAll('[data-vote]').forEach((b) => {
      b.onclick = () => {
        const res = votePoll(b.dataset.vote, b.dataset.k);
        if (res?.fresh) {
          toast(res.agree ? 'Ihr seid euch einig!' : 'Zwei Meinungen — aufgedeckt', res.agree ? 'handshake' : 'scale');
        }
        paint();
      };
    });

    /* Raten */
    const nr = host.querySelector('[data-newrate]');
    if (nr) nr.onclick = () => openRateSheet();
    host.querySelectorAll('[data-dorate]').forEach((b) => {
      b.onclick = () => openScoreSheet(b.dataset.dorate);
    });
  }

  /* Halten zum Kuscheln — wenn beide gleichzeitig halten, spürt man es. */
  function bindCuddle(btn) {
    const start = (e) => {
      e.preventDefault();
      if (holding) return;
      holding = true;
      syncFired = false;
      btn.classList.add('holding');
      haptic(14);
      sendEvent('cuddle', { on: true }, { volatile: true });

      holdTimer = setInterval(() => {
        const st = get();
        haptic(8);
        if (!syncFired && st.cuddleUntil && st.cuddleUntil > Date.now()) {
          syncFired = true;
          btn.classList.add('synced');
          fx('love');
          haptic([30, 60, 30, 60, 90]);
          confetti(['statJoy', 'careCuddle', 'sparkle']);
          toast('Ihr haltet gleichzeitig', 'careCuddle');
          const st2 = get();
          addBondXp(st2, 6);
          st2.bond.hugs++;
          st2.me.coins += REWARDS.nudgeSent;
          pushFeed(st2, { from: 'system', type: 'cuddle', icon: 'careCuddle', text: 'Ihr habt gleichzeitig gedrückt' });
          commit('cuddle');
        }
      }, 700);
    };

    const end = () => {
      if (!holding) return;
      holding = false;
      clearInterval(holdTimer);
      btn.classList.remove('holding', 'synced');
      sendEvent('cuddle', { on: false }, { volatile: true });
    };

    btn.addEventListener('pointerdown', start);
    btn.addEventListener('pointerup', end);
    btn.addEventListener('pointercancel', end);
    btn.addEventListener('pointerleave', end);
  }

  /* ── Eingabefenster ── */

  function openNoteSheet() {
    const st = get();
    sheet({
      title: 'Ein Satz dazu',
      body: `<textarea class="input" data-txt rows="3" maxlength="140"
               placeholder="Was du dazu sagen willst …">${esc(st.me.mood?.note || '')}</textarea>
             <button class="btn btn-primary btn-block" data-save style="margin-top:12px">Schicken</button>`,
      onMount(body) {
        const t = body.querySelector('[data-txt]');
        t.focus();
        body.querySelector('[data-save]').onclick = () => {
          setMood(st.me.mood?.key || 'ruhig', t.value.trim());
          closeSheet();
          paint();
        };
      }
    });
  }

  function openDailySheet(slotId = 'normal') {
    const st = get();
    const d = ensureDaily(st);
    const i = d.slots.findIndex((s) => s.id === slotId);
    if (i < 0 || slotLocked(d.slots, i)) { toast('Erst die Frage des Tages'); return; }
    const s = d.slots[i];
    const def = slotById(s.id);
    // Steht die zweite noch aus, soll man das schon beim Antworten wissen.
    const rest = d.slots.length - 1 - i;

    sheet({
      title: def.label,
      body: `<p style="font-size:17px;font-weight:700;line-height:1.35;margin:0 0 14px">${esc(s.q)}</p>
             <textarea class="input" data-txt rows="4" maxlength="400" placeholder="Ehrlich, nicht perfekt."></textarea>
             <p class="tiny muted" style="margin:10px 4px">
               Sichtbar wird beides erst, wenn ihr beide geantwortet habt.${rest > 0 ? ' Danach wartet noch die Spicy Frage.' : ''}
             </p>
             <button class="btn btn-love btn-block" data-save>Antwort ablegen</button>`,
      onMount(body) {
        const t = body.querySelector('[data-txt]');
        t.focus();
        body.querySelector('[data-save]').onclick = () => {
          const text = t.value.trim();
          if (!text) { toast('Ein Wort mindestens'); return; }
          const st2 = get();
          const dd = ensureDaily(st2);
          const ss = dd.slots.find((x) => x.id === slotId);
          if (!ss || ss.mine) { closeSheet(); return; }
          ss.mine = { text, at: Date.now() };
          if (ss.theirs && !ss.revealedAt) {
            ss.revealedAt = Date.now();
            st2.me.coins += slotReward(REWARDS.dailyBoth, ss.id);
            addBondXp(st2, 8);
            confetti([def.icon, 'statJoy', 'sparkle']);
          }
          addBondXp(st2, 4);
          pushFeed(st2, {
            from: 'me', type: 'daily', icon: def.icon,
            text: `Du hast die ${def.label} beantwortet`
          });
          commit('daily');
          sendEvent('daily', { day: dd.day, slot: ss.id, q: ss.q, spicy: !!ss.spicy, answer: text });
          fx('love');
          closeSheet();
          paint();
          if (rest > 0) toast('Noch eine Frage wartet');
        };
      }
    });
  }

  /* Wiedersehen eintragen */
  function openReunionSheet() {
    const st = get();
    const r = st.reunion;
    const heute = new Date();
    const minDate = new Date(heute.getFullYear() - 1, heute.getMonth(), heute.getDate())
      .toISOString().slice(0, 10);

    sheet({
      title: 'Nächstes Wiedersehen',
      body: `
        <label class="field-label">Wann?</label>
        <input class="input" type="date" data-date min="${minDate}" value="${esc(r?.date || '')}">
        <label class="field-label" style="margin-top:14px">Was ist es? (optional)</label>
        <input class="input" data-label maxlength="50" placeholder="z.B. Ostern bei dir"
          value="${esc(r?.label || '')}">
        <p class="tiny muted" style="margin:12px 4px">
          Beide sehen denselben Countdown — wer es ändert, ändert es für euch beide.
        </p>
        <button class="btn btn-love btn-block" data-save>Speichern</button>
        ${r ? `<button class="btn btn-ghost btn-block" data-clear style="margin-top:8px">Termin entfernen</button>` : ''}`,
      onMount(body) {
        const date = body.querySelector('[data-date]');
        const label = body.querySelector('[data-label]');
        body.querySelector('[data-save]').onclick = () => {
          const d = date.value;
          if (!d) { toast('Ein Datum fehlt noch'); return; }
          const saved = setReunion({ date: d, label: label.value.trim() });
          if (!saved) return;
          closeSheet();
          const tage = daysUntil(saved.date);
          toast(tage > 0 ? `Noch ${tage} ${tage === 1 ? 'Tag' : 'Tage'}` : 'Heute ist es so weit', 'sunrise');
          if (tage > 0 && tage <= 7) confetti(['statJoy', 'sparkle', 'sunrise']);
          paint();
        };
        const clear = body.querySelector('[data-clear]');
        if (clear) clear.onclick = () => { setReunion(null); closeSheet(); paint(); };
      }
    });
  }

  /* Eigener Nest-Wunsch */
  function openWishSheet() {
    sheet({
      title: 'Eigener Wunsch',
      body: `
        <input class="input" data-txt maxlength="70" placeholder="z.B. Ein Fenster mit Blick auf Bäume">
        <div class="section-label" style="margin:14px 4px 8px">Bild dazu</div>
        <div class="wish-icons" data-icons>
          ${['nest', 'roomLight', 'roomPlant', 'roomBooks', 'roomMusic', 'roomPet', 'roomWater',
            'roomCity', 'roomNature', 'coffee', 'roomSport', 'sparkle']
            .map((n, i) => `<button class="wish-ic ${i === 0 ? 'on' : ''}" data-ic="${n}">${icon(n, { size: 24 })}</button>`).join('')}
        </div>
        <button class="btn btn-primary btn-block" data-save style="margin-top:14px">Hinzufügen</button>`,
      onMount(body) {
        const t = body.querySelector('[data-txt]');
        let pick = 'nest';
        t.focus();
        body.querySelectorAll('[data-ic]').forEach((b) => {
          b.onclick = () => {
            pick = b.dataset.ic;
            body.querySelectorAll('[data-ic]').forEach((x) => x.classList.toggle('on', x === b));
          };
        });
        body.querySelector('[data-save]').onclick = () => {
          const text = t.value.trim();
          if (!text) { toast('Ein paar Worte brauchen wir'); return; }
          setNestWeight({ text, icon: pick, cat: 'Eigenes' }, 2);
          fx('pop');
          closeSheet();
          paint();
        };
      }
    });
  }

  /* Neue Abstimmung */
  /**
   * Fünf Vorlagen statt aller zwölf — sonst wird aus „Schnell gefragt“ eine
   * Wand. Welche fünf, wechselt täglich, damit man auch die hinteren zu
   * sehen bekommt.
   */
  const tagesVorlagen = () => cycledMany(POLL_TEMPLATES, 5, dayIndex(dayKey()), 'polls');

  function openPollSheet(tpl = null) {
    const rows = tpl ? tpl.opts.map((o) => o.label) : ['', ''];
    sheet({
      title: tpl ? 'Abstimmung' : 'Neue Abstimmung',
      body: `
        <input class="input" data-q maxlength="110" placeholder="Was machen wir heute Abend?"
          value="${esc(tpl?.q || '')}">
        <div class="section-label" style="margin:14px 4px 8px">Zur Auswahl</div>
        <div data-opts>
          ${rows.map((v, i) => optInput(v, i)).join('')}
        </div>
        <button class="btn btn-ghost btn-block" data-add style="margin-top:6px">${icon('plus', { size: 15 })} Option</button>
        <p class="tiny muted" style="margin:12px 4px">Du stimmst gleich mit ab. Das Ergebnis öffnet sich, wenn beide gewählt haben.</p>
        <button class="btn btn-primary btn-block" data-save>Abstimmung schicken</button>`,
      onMount(body) {
        const q = body.querySelector('[data-q]');
        const opts = body.querySelector('[data-opts]');
        if (!tpl) q.focus();

        body.querySelector('[data-add]').onclick = () => {
          const n = opts.children.length;
          if (n >= 6) { toast('Sechs reichen'); return; }
          opts.insertAdjacentHTML('beforeend', optInput('', n));
          opts.lastElementChild.querySelector('input').focus();
        };

        body.querySelector('[data-save]').onclick = () => {
          const question = q.value.trim();
          const list = [...opts.querySelectorAll('input')]
            .map((i, n) => ({ k: tpl?.opts[n]?.k || `o${n}`, label: i.value.trim(), icon: tpl?.opts[n]?.icon || 'ballot' }))
            .filter((o) => o.label);
          if (!question) { toast('Eine Frage fehlt noch'); return; }
          if (list.length < 2) { toast('Mindestens zwei Optionen'); return; }
          const poll = createPoll(question, list);
          closeSheet();
          if (poll) { activeSeg = 'vote'; paint(); }
        };
      }
    });
  }

  const optInput = (v, i) => `<div class="opt-row">
    <span class="opt-n">${i + 1}</span>
    <input class="input" maxlength="56" value="${esc(v)}" placeholder="Option ${i + 1}">
  </div>`;

  /* Etwas zum Bewerten */
  function openRateSheet() {
    sheet({
      title: 'Zum Bewerten',
      body: `
        <input class="input" data-title maxlength="90" placeholder="Was ist es? z.B. „Song von gestern Abend“">
        <input class="input" data-url maxlength="400" style="margin-top:10px"
          placeholder="Link einfügen (Spotify, YouTube, egal) — optional" inputmode="url">
        <input class="input" data-note maxlength="140" style="margin-top:10px" placeholder="Ein Satz dazu — optional">
        <p class="tiny muted" style="margin:12px 4px">Gleich gibst du deine Note und tippst, was dein Mensch sagt.</p>
        <button class="btn btn-primary btn-block" data-save>Weiter</button>`,
      onMount(body) {
        const title = body.querySelector('[data-title]');
        const url = body.querySelector('[data-url]');
        const note = body.querySelector('[data-note]');
        title.focus();
        // Aus dem Link lässt sich oft schon der Titel erahnen
        url.onblur = () => {
          if (title.value.trim() || !url.value.trim()) return;
          const k = kindOf(url.value);
          title.value = k === 'song' ? 'Ein Song' : k === 'film' ? 'Ein Video' : 'Ein Link';
        };
        body.querySelector('[data-save]').onclick = () => {
          const t = title.value.trim() || 'Ohne Titel';
          const entry = createRate({ title: t, url: url.value.trim(), note: note.value.trim() });
          closeSheet();
          if (entry) setTimeout(() => openScoreSheet(entry.id), 260);
        };
      }
    });
  }

  /* Note geben und tippen */
  function openScoreSheet(id) {
    const st = get();
    const e = st.rates.find((x) => x.id === id);
    if (!e) return;
    const p = st.partner;
    let score = 7, guess = 7;

    sheet({
      title: e.title,
      body: `
        ${linkRow(e.url)}
        ${e.note ? `<div class="rate-note" style="margin-bottom:14px">„${esc(e.note)}“</div>` : ''}

        <div class="score-block">
          <div class="score-h">${icon('dial', { size: 17 })} Deine Note</div>
          <div class="score-val" data-out-a>7</div>
          <div class="score-dots" data-pick="a">
            ${[...Array(10)].map((_, i) => `<button class="sd ${i === 6 ? 'on' : ''}" data-v="${i + 1}">${i + 1}</button>`).join('')}
          </div>
        </div>

        <div class="score-block them">
          <div class="score-h">${icon('guess', { size: 17 })} Was sagt ${esc(p?.name || 'dein Mensch')}?</div>
          <div class="score-val" data-out-b>7</div>
          <div class="score-dots" data-pick="b">
            ${[...Array(10)].map((_, i) => `<button class="sd ${i === 6 ? 'on' : ''}" data-v="${i + 1}">${i + 1}</button>`).join('')}
          </div>
        </div>

        <p class="tiny muted" style="margin:14px 4px">Beides zusammen — danach lässt sich nichts mehr anpassen.</p>
        <button class="btn btn-love btn-block" data-save>Abgeben</button>`,
      onMount(body) {
        const wire = (which) => {
          const row = body.querySelector(`[data-pick="${which}"]`);
          const out = body.querySelector(which === 'a' ? '[data-out-a]' : '[data-out-b]');
          row.querySelectorAll('.sd').forEach((b) => {
            b.onclick = () => {
              const v = Number(b.dataset.v);
              if (which === 'a') score = v; else guess = v;
              out.textContent = v;
              row.querySelectorAll('.sd').forEach((x) => x.classList.toggle('on', Number(x.dataset.v) <= v));
              haptic(6);
              fx('tap');
            };
          });
          // Startzustand: alles bis 7 gefüllt
          row.querySelectorAll('.sd').forEach((x) => x.classList.toggle('on', Number(x.dataset.v) <= 7));
        };
        wire('a');
        wire('b');

        body.querySelector('[data-save]').onclick = () => {
          const res = submitRate(id, score, guess);
          closeSheet();
          if (res?.fresh) {
            toast(`${res.myPts} von 10 Punkten`, res.myPts >= 8 ? 'trophy' : 'dial');
          } else if (res) {
            toast(`Abgelegt. Warten auf ${esc(p?.name || 'den anderen')}.`, 'lock');
          }
          activeSeg = 'rate';
          paint();
        };
      }
    });
  }

  /* ── Wetter holen ── */
  /** Welche zwei Punkte gerade gefragt sind — ändert sich der, wird nachgeladen. */
  function stelleJetzt() {
    const st = get();
    const m = st.me.place, t = st.partner?.place;
    return `${m?.lat},${m?.lon}|${t?.lat},${t?.lon}`;
  }

  async function loadWeather(force = false) {
    const st = get();
    const mine = st.me.place, theirs = st.partner?.place;
    if (!mine && !theirs) return;
    /**
     * Ein neuer Ort schlägt die Wartezeit.
     *
     * Ohne diese Zeile stünde nach einem Umzug — oder nach einer Zugfahrt,
     * wenn der Standort automatisch mitläuft — bis zu zehn Minuten lang das
     * Wetter der alten Stadt da. Die Zehn-Minuten-Sperre ist gegen zu viele
     * Abfragen gedacht, nicht gegen richtige Antworten.
     */
    if (stelleJetzt() !== wx.stelle) force = true;
    wx.stelle = stelleJetzt();
    if (!force && Date.now() - wx.at < 10 * 60 * 1000) return;
    wx.at = Date.now();
    const [a, b] = await Promise.all([
      mine ? forecast(mine.lat, mine.lon, { fresh: force }) : null,
      theirs ? forecast(theirs.lat, theirs.lon, { fresh: force }) : null
    ]);
    wx.mine = a; wx.theirs = b;
    // Ohne Netz soll die Karte nicht ewig „lädt …“ sagen
    wx.failed = (!!mine && !a) || (!!theirs && !b);
    paint();
  }

  paint();
  loadWeather();
  const unsub = subscribe(() => {
    paint();
    // Ein Ortswechsel ist der einzige Grund, sofort nachzuladen — sonst
    // stünde nach einer Zugfahrt bis zu einer halben Minute lang das Wetter
    // der Stadt da, aus der der andere längst abgefahren ist.
    if (stelleJetzt() !== wx.stelle) loadWeather();
  });
  const timer = setInterval(() => { paint(); loadWeather(); }, 30_000);
  return () => {
    unsub();
    clearInterval(timer);
    clearInterval(holdTimer);
  };
}

/* ── Hilfen ─────────────────────────────────────────────── */

function markSeen(state) {
  let changed = false;
  state.feed.forEach((f) => { if (f.from === 'them' && !f.seen) { f.seen = true; changed = true; } });
  if (changed) commit('seen');
}
