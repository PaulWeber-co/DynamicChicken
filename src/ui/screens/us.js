/** Wir — der Ort für die Fernbeziehung. */

import { esc } from '../../util/dom.js';
import { fx, burst, confetti, haptic } from '../../util/feedback.js';
import { get, commit, subscribe } from '../../state/store.js';
import { renderChicken } from '../../pet/chicken.js';
import { MOODS, ACTIVITIES, NUDGES, moodByKey, activityByKey, petMood, questionForDay } from '../../pet/moods.js';
import { tickPet, pushFeed, addBondXp, bondXpForLevel } from '../../state/model.js';
import { REWARDS } from '../../state/catalog.js';
import { sendNudge, setMood, setActivity } from '../actions.js';
import { sendEvent, partnerOnline } from '../../sync/index.js';
import { pairKey } from '../../games/index.js';
import { dayKey, localTimeIn, tzOffsetHours, hourIn, relTime, daysBetween } from '../../util/time.js';
import { toast } from '../toast.js';
import { sheet, closeSheet } from '../sheet.js';
import { go } from '../shell.js';

export function render(root, ctx) {
  const s = get();
  tickPet(s.me.pet);
  markSeen(s);

  root.innerHTML = `<div class="us" data-us></div>`;
  const host = root.querySelector('[data-us]');
  let holdTimer = 0, holding = false, syncFired = false;

  function paint() {
    // Während des Kuschel-Haltens nicht neu zeichnen — sonst verliert der
    // Finger den Knopf unter sich.
    if (holding) return;
    const st = get();
    const p = st.partner;

    host.innerHTML = p ? linked(st, p) : unlinked(st);
    bind();
  }

  /* ── Verbunden ── */
  function linked(st, p) {
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
      <div class="row-between">
        <div>
          <div class="title-lg">Wir</div>
          <div class="subtitle">${esc(st.me.name || 'Du')} &amp; ${esc(p.name)}${st.bond.since ? ` · seit ${daysBetween(new Date(st.bond.since).toISOString().slice(0, 10), dayKey())} Tagen` : ''}</div>
        </div>
        <div class="streak-pill" title="Tage in Folge">🔥 <b>${st.bond.streak}</b></div>
      </div>

      <div class="card duo-card">
        <div class="duo">
          <div class="duo-side">
            <div class="duo-bubble">${myMood ? `${myMood.emoji}` : '💭'}</div>
            <div class="duo-chick">${renderChicken(st.me.pet.look, { mood: petMood(st.me.pet, { asleep: st.me.pet.asleep, moodKey: st.me.mood?.key }), size: 118, shadow: false })}</div>
            <div class="duo-name">${esc(st.me.pet.name)}</div>
            <div class="duo-sub">${localTimeIn(st.me.tz)}${myAct ? ` · ${myAct.emoji}` : ''}</div>
          </div>

          <button class="cuddle-btn" data-cuddle aria-label="Halten zum Kuscheln">
            <span class="cuddle-ring"></span>
            <span class="cuddle-core">🫂</span>
          </button>

          <div class="duo-side">
            <div class="duo-bubble">${theirMood ? `${theirMood.emoji}` : '💭'}</div>
            <div class="duo-chick">${renderChicken(p.pet.look, { mood: theirSleeping || p.pet.asleep ? 'asleep' : petMood(p.pet, { moodKey: p.mood?.key }), size: 118, shadow: false })}</div>
            <div class="duo-name">${esc(p.pet.name)}</div>
            <div class="duo-sub">${localTimeIn(p.tz)}${theirAct ? ` · ${theirAct.emoji}` : ''}</div>
          </div>
        </div>

        <div class="duo-status">
          <span class="badge ${theirSleeping ? 'badge-off' : online ? 'badge-live' : 'badge-wait'}">
            ${online && !theirSleeping ? '<span class="dot-live"></span>' : ''}
            ${theirSleeping ? `${esc(p.name)} schläft` : online ? `${esc(p.name)} ist da` : `zuletzt ${relTime(p.lastSeen)}`}
          </span>
          ${diff ? `<span class="badge">${diff > 0 ? `+${diff}` : diff} Std. Unterschied</span>` : ''}
          <span class="badge badge-love">🫂 ${st.bond.hugs}</span>
        </div>

        <div class="bond">
          <div class="bond-row">
            <span>Bond-Level <b>${st.bond.level}</b></span>
            <span class="tiny muted">${Math.round(st.bond.xp - bondPrev)} / ${Math.round(bondNext - bondPrev)}</span>
          </div>
          <div class="stat-track"><span class="stat-fill" style="width:${bondFrac * 100}%;background:var(--love)"></span></div>
        </div>
      </div>

      ${dailyCard(st, p)}

      <div class="section-label">Wie geht es dir gerade?</div>
      <div class="card">
        <div class="wrap">
          ${MOODS.map((m) => `<button class="chip chip-love" data-mood="${m.key}" aria-pressed="${st.me.mood?.key === m.key}">
            <span>${m.emoji}</span>${esc(m.label)}
          </button>`).join('')}
        </div>
        ${st.me.mood ? `<button class="note-line" data-note>
          ${st.me.mood.note ? `„${esc(st.me.mood.note)}"` : '＋ Ein Satz dazu …'}
        </button>` : ''}
      </div>

      <div class="section-label">Was machst du gerade?</div>
      <div class="card">
        <div class="wrap">
          ${ACTIVITIES.map((a) => `<button class="chip" data-act="${a.key}" aria-pressed="${st.me.activity?.key === a.key}">
            <span>${a.emoji}</span>${esc(a.label)}
          </button>`).join('')}
        </div>
      </div>

      <div class="section-label">Kleine Gesten</div>
      <div class="nudge-grid">
        ${NUDGES.map((n) => `<button class="nudge" data-nudge="${n.key}">
          <span class="nudge-e">${n.emoji}</span>
          <span class="nudge-l">${esc(n.label)}</span>
        </button>`).join('')}
      </div>

      <div class="section-label">Unser Verlauf</div>
      ${timeline(st)}
    `;
  }

  /* ── Noch nicht verbunden ── */
  function unlinked(st) {
    return `
      <div class="title-lg">Wir</div>
      <div class="subtitle">Hier wohnt eure Fernbeziehung.</div>
      <div class="card center" style="padding:28px 20px">
        <div class="pair-duo">
          <div>${renderChicken(st.me.pet.look, { mood: 'happy', size: 110, shadow: false })}</div>
          <div class="pair-plus">＋</div>
          <div class="pair-ghost">🥚</div>
        </div>
        <h2 style="margin:12px 0 6px;font-size:19px;font-weight:800">Zweites Huhn gesucht</h2>
        <p class="muted" style="font-size:14.5px;margin:0 0 16px">
          Verbindet euch mit einem sechsstelligen Code — dann könnt ihr Stimmungen schicken,
          gemeinsam spielen und sehen, wie es dem anderen geht.
        </p>
        <button class="btn btn-primary btn-block" data-goto-more>Verbinden</button>
      </div>
      <div class="card">
        <div class="li-title" style="margin-bottom:6px">Solange du allein bist</div>
        <p class="muted tiny" style="margin:0">
          Im Solo-Modus übernimmt ein simulierter Mensch die andere Seite: Stimmungen,
          Anstupser und Spielzüge kommen trotzdem herein. So siehst du, wie sich alles anfühlt.
        </p>
      </div>`;
  }

  /* ── Frage des Tages ── */
  function dailyCard(st, p) {
    const d = ensureDaily(st);
    const revealed = !!d.revealedAt;
    if (revealed) {
      return `<div class="card daily-card open">
        <div class="daily-kicker">💌 Frage des Tages</div>
        <div class="daily-q">${esc(d.q)}</div>
        <div class="daily-answer">
          <div class="daily-who">${esc(st.me.name || 'Du')}</div>
          <div class="daily-text">${esc(d.mine.text)}</div>
        </div>
        <div class="daily-answer them">
          <div class="daily-who">${esc(p.name)}</div>
          <div class="daily-text">${esc(d.theirs.text)}</div>
        </div>
      </div>`;
    }
    if (d.mine) {
      return `<div class="card daily-card">
        <div class="daily-kicker">💌 Frage des Tages</div>
        <div class="daily-q">${esc(d.q)}</div>
        <div class="daily-sealed">Deine Antwort liegt bereit. Sie öffnet sich, sobald ${esc(p.name)} geantwortet hat.</div>
      </div>`;
    }
    return `<div class="card daily-card">
      <div class="daily-kicker">💌 Frage des Tages</div>
      <div class="daily-q">${esc(d.q)}</div>
      ${d.theirs ? `<div class="daily-sealed">${esc(p.name)} hat schon geantwortet. 👀</div>` : ''}
      <button class="btn btn-love btn-block" data-daily>Antworten</button>
    </div>`;
  }

  /* ── Verlauf ── */
  function timeline(st) {
    if (!st.feed.length) {
      return `<div class="card"><div class="empty">
        <span class="empty-emoji">🪺</span>
        Noch nichts passiert. Schick die erste Umarmung.
      </div></div>`;
    }
    return `<div class="list">
      ${st.feed.slice(0, 26).map((f) => `<div class="li feed-li ${f.from}">
        <div class="li-ico">${f.emoji || '•'}</div>
        <div class="grow">
          <div class="li-title">${esc(f.text)}</div>
          ${f.note ? `<div class="li-sub">„${esc(f.note)}"</div>` : ''}
          <div class="li-sub">${relTime(f.at)}</div>
        </div>
      </div>`).join('')}
    </div>`;
  }

  /* ── Interaktion ── */
  function bind() {
    host.querySelectorAll('[data-mood]').forEach((b) => {
      b.onclick = () => { setMood(b.dataset.mood, get().me.mood?.note || ''); burst([moodByKey(b.dataset.mood)?.emoji || '💛'], { from: b, count: 5 }); paint(); };
    });
    host.querySelectorAll('[data-act]').forEach((b) => {
      b.onclick = () => { setActivity(b.dataset.act); paint(); };
    });
    host.querySelectorAll('[data-nudge]').forEach((b) => {
      b.onclick = () => { if (sendNudge(b.dataset.nudge, b)) paint(); };
    });

    const note = host.querySelector('[data-note]');
    if (note) note.onclick = openNoteSheet;

    const daily = host.querySelector('[data-daily]');
    if (daily) daily.onclick = openDailySheet;

    const more = host.querySelector('[data-goto-more]');
    if (more) more.onclick = () => go('more');

    const cud = host.querySelector('[data-cuddle]');
    if (cud) bindCuddle(cud);
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
          confetti(['💗', '🫂', '💛', '✨']);
          toast('Ihr haltet gleichzeitig 💗', '🫂');
          const st2 = get();
          addBondXp(st2, 6);
          st2.bond.hugs++;
          st2.me.coins += REWARDS.nudgeSent;
          pushFeed(st2, { from: 'system', type: 'cuddle', emoji: '🫂', text: 'Ihr habt gleichzeitig gedrückt' });
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

  function openDailySheet() {
    const st = get();
    const d = ensureDaily(st);
    sheet({
      title: 'Frage des Tages',
      body: `<p style="font-size:17px;font-weight:700;line-height:1.35;margin:0 0 14px">${esc(d.q)}</p>
             <textarea class="input" data-txt rows="4" maxlength="400" placeholder="Ehrlich, nicht perfekt."></textarea>
             <p class="tiny muted" style="margin:10px 4px">Sichtbar wird beides erst, wenn ihr beide geantwortet habt.</p>
             <button class="btn btn-love btn-block" data-save>Antwort ablegen</button>`,
      onMount(body) {
        const t = body.querySelector('[data-txt]');
        t.focus();
        body.querySelector('[data-save]').onclick = () => {
          const text = t.value.trim();
          if (!text) { toast('Ein Wort mindestens 🙂'); return; }
          const st2 = get();
          const dd = ensureDaily(st2);
          dd.mine = { text, at: Date.now() };
          if (dd.theirs && !dd.revealedAt) {
            dd.revealedAt = Date.now();
            st2.me.coins += REWARDS.dailyBoth;
            addBondXp(st2, 8);
            confetti(['💌', '💗', '✨']);
          }
          addBondXp(st2, 4);
          pushFeed(st2, { from: 'me', type: 'daily', emoji: '💌', text: 'Du hast die Frage des Tages beantwortet' });
          commit('daily');
          sendEvent('daily', { day: dd.day, q: dd.q, answer: text });
          fx('love');
          closeSheet();
          paint();
        };
      }
    });
  }

  paint();
  const unsub = subscribe(paint);
  const timer = setInterval(paint, 30_000);
  return () => {
    unsub();
    clearInterval(timer);
    clearInterval(holdTimer);
  };
}

/* ── Hilfen ─────────────────────────────────────────────── */

function ensureDaily(state) {
  const today = dayKey();
  if (!state.daily || state.daily.day !== today) {
    let salt = 0;
    const k = pairKey(state);
    for (let i = 0; i < k.length; i++) salt = (salt * 31 + k.charCodeAt(i)) >>> 0;
    state.daily = { day: today, q: questionForDay(today, salt), mine: null, theirs: null, revealedAt: null };
  }
  if (!state.daily.q) state.daily.q = questionForDay(today, 0);
  return state.daily;
}

function markSeen(state) {
  let changed = false;
  state.feed.forEach((f) => { if (f.from === 'them' && !f.seen) { f.seen = true; changed = true; } });
  if (changed) commit('seen');
}
