/**
 * Knuddl — Einstiegspunkt.
 *
 * Reihenfolge: Zustand laden → Erscheinungsbild → Insel → Tabs → Sync.
 * Danach läuft nur noch ein sehr ruhiger Herzschlag im Hintergrund, der
 * nachrechnet, wie es Knuddl inzwischen geht.
 */

import { load, get, commit, subscribe, emit } from './state/store.js';
import { tickPet, urgentNeed, touchStreak } from './state/model.js';
import { setFeedbackPrefs, fx, confetti } from './util/feedback.js';
import { initIsland, setLive, clearLive } from './ui/island.js';
import { initShell, go, refresh } from './ui/shell.js';
import { applyTheme } from './ui/screens/settings.js';
import { applyBondUnlocks } from './ui/screens/shop.js';
import { openFeedSheet, sendNudge, careAction } from './ui/actions.js';
import { openGame } from './ui/gameHost.js';
import { initSync, publishProfile, sendEvent } from './sync/index.js';
import { sheet, closeSheet } from './ui/sheet.js';
import { toast } from './ui/toast.js';
import { renderChicken, BODY_COLORS, defaultLook } from './pet/chicken.js';
import { esc } from './util/dom.js';
import CONFIG from '../config.js';

boot();

async function boot() {
  const s = load();

  // Erscheinungsbild und Rückmeldungen, bevor irgendetwas sichtbar wird
  applyTheme(s.settings.theme);
  setFeedbackPrefs({ haptics: s.settings.haptics, sound: s.settings.sound });

  // Die Zeit, die seit dem letzten Besuch vergangen ist, nachholen
  const { wokeUp } = tickPet(s.me.pet);
  touchStreak(s);
  if (applyBondUnlocks(s)) { /* neue Freischaltungen */ }
  commit('boot');

  initIsland({ onAct: handleIslandAction });
  initShell({});
  await initSync();

  if (!s.onboarded) openOnboarding();
  else welcomeBack(wokeUp);

  startHeartbeat();
  registerServiceWorker();
  wireLifecycle();
}

/* ── Aktionen aus der Dynamic Island ────────────────────── */

function handleIslandAction(act) {
  if (!act) return;
  const [kind, arg] = act.split(':');
  switch (kind) {
    case 'nudge': sendNudge(arg); break;
    case 'open':
      if (arg === 'feed') openFeedSheet();
      else if (arg === 'us') go('us');
      else if (arg === 'games') go('games');
      else go(arg);
      break;
    case 'game': openGame(arg); break;
    case 'care': careAction(arg); break;
    default: break;
  }
}

/* ── Herzschlag: Bedürfnisse, Live-Aktivitäten, Präsenz ── */

let lastNeedKey = null;
let lastNeedAt = 0;

function startHeartbeat() {
  updateLiveActivities();
  setInterval(() => {
    const s = get();
    tickPet(s.me.pet);
    commit('tick');
    updateLiveActivities();
    checkNeeds();
  }, 60_000);

  subscribe(() => updateLiveActivities());
}

function updateLiveActivities() {
  const s = get();
  const pet = s.me.pet;

  if (pet.asleep) {
    setLive('sleep', {
      emoji: '💤',
      title: `${pet.name} schläft`,
      sub: `Energie ${Math.round(pet.stats.energy)}%`,
      trail: '🌙',
      priority: 2
    });
  } else {
    clearLive('sleep');
  }

  if (s.cuddleUntil && s.cuddleUntil > Date.now()) {
    setLive('cuddle', {
      emoji: '🫂',
      title: `${s.partner?.name || 'Dein Mensch'} hält gerade`,
      sub: 'Halt auch — im Wir-Tab',
      trail: '💗',
      priority: 9
    });
    setTimeout(() => { if (!(get().cuddleUntil > Date.now())) clearLive('cuddle'); }, 2000);
  } else {
    clearLive('cuddle');
  }
}

/** Knuddl meldet sich, wenn etwas fehlt — höchstens alle zwei Stunden. */
function checkNeeds() {
  const s = get();
  const need = urgentNeed(s.me.pet);
  if (!need) { lastNeedKey = null; clearLive('need'); return; }

  setLive('need', {
    emoji: need.emoji,
    title: `${s.me.pet.name} ${need.text}`,
    sub: `${Math.round(need.v)}%`,
    trail: '›',
    priority: 4
  });

  const now = Date.now();
  if (need.key === lastNeedKey && now - lastNeedAt < 2 * 3600_000) return;
  lastNeedKey = need.key;
  lastNeedAt = now;

  emit('notify', {
    kind: 'need',
    emoji: need.emoji,
    avatar: 'me',
    title: `${s.me.pet.name} ${need.text}`,
    sub: 'Kurz kümmern?',
    body: `${s.me.pet.name} ${need.text}. Das dauert zehn Sekunden.`,
    actions: need.key === 'full'
      ? [{ label: 'Füttern', act: 'open:feed', primary: true }, { label: 'Später', act: 'dismiss' }]
      : need.key === 'clean'
        ? [{ label: 'Waschen', act: 'care:wash', primary: true }, { label: 'Später', act: 'dismiss' }]
        : need.key === 'energy'
          ? [{ label: 'Hinlegen', act: 'care:sleep', primary: true }, { label: 'Später', act: 'dismiss' }]
          : [{ label: 'Spielen', act: 'care:play', primary: true }, { label: 'Später', act: 'dismiss' }],
    tone: 'warm'
  });
}

/* ── Willkommen zurück ──────────────────────────────────── */

function welcomeBack(wokeUp) {
  const s = get();
  if (wokeUp) {
    emit('notify', {
      kind: 'woke', emoji: '🌞', avatar: 'me',
      title: `${s.me.pet.name} ist ausgeschlafen`,
      sub: 'Energie voll',
      body: `${s.me.pet.name} hat gut geschlafen und ist wieder bei 100%.`,
      actions: [{ label: 'Guten Morgen', act: 'care:cuddle', primary: true }]
    });
    return;
  }
  const unread = s.feed.filter((f) => f.from === 'them' && !f.seen).length;
  if (unread) {
    emit('notify', {
      kind: 'catchup', emoji: '💌',
      title: `${unread} Neuigkeit${unread === 1 ? '' : 'en'}`,
      sub: s.partner ? `von ${s.partner.name}` : '',
      body: `Während du weg warst, ist etwas passiert.`,
      actions: [{ label: 'Ansehen', act: 'open:us', primary: true }]
    });
  }
}

/* ── Erster Start ───────────────────────────────────────── */

function openOnboarding() {
  let step = 0;
  let name = '';
  let petName = CONFIG.defaultPetName || 'Knuddl';
  let color = BODY_COLORS[0].id;

  function view() {
    const look = { ...defaultLook(0), body: color };
    if (step === 0) {
      return `<div class="onb">
        <div class="onb-chick">${renderChicken(look, { mood: 'happy', size: 160 })}</div>
        <h2 class="onb-h">Hallo!</h2>
        <p class="onb-p">Das hier ist ein dickes gelbes Huhn. Es wohnt oben in der Pille,
          es will gefüttert werden — und es hat einen Zwilling bei dem Menschen,
          den du vermisst.</p>
        <button class="btn btn-primary btn-block" data-next>Los</button>
      </div>`;
    }
    if (step === 1) {
      return `<div class="onb">
        <h2 class="onb-h">Wie heißt du?</h2>
        <p class="onb-p">Damit dein Mensch weiß, wer da knuddelt.</p>
        <input class="input" data-onb-name value="${esc(name)}" placeholder="Dein Name" maxlength="20">
        <button class="btn btn-primary btn-block" data-next style="margin-top:12px">Weiter</button>
      </div>`;
    }
    return `<div class="onb">
      <div class="onb-chick">${renderChicken(look, { mood: 'happy', size: 150 })}</div>
      <h2 class="onb-h">Und dein Huhn?</h2>
      <input class="input" data-onb-pet value="${esc(petName)}" placeholder="Knuddl" maxlength="16">
      <div class="sw-row" style="margin-top:14px;justify-content:center">
        ${BODY_COLORS.map((c) => `<button class="sw ${color === c.id ? 'on' : ''}" style="--sw:${c.base}" data-color="${c.id}" aria-label="${esc(c.label)}"></button>`).join('')}
      </div>
      <button class="btn btn-primary btn-block" data-next style="margin-top:16px">Fertig</button>
      <p class="tiny muted center" style="margin:10px 0 0">Alles lässt sich später im Atelier ändern.</p>
    </div>`;
  }

  /** Werte aus den Feldern retten, bevor die Ansicht neu gebaut wird. */
  function capture(body) {
    const n = body.querySelector('[data-onb-name]');
    const p = body.querySelector('[data-onb-pet]');
    if (n) name = n.value.trim();
    if (p) petName = p.value.trim() || 'Knuddl';
  }

  function bind(api) {
    const body = api.body;
    body.querySelectorAll('[data-color]').forEach((b) => {
      b.onclick = () => {
        capture(body);
        color = b.dataset.color;
        fx('tap');
        api.setBody(view());
        bind(api);
      };
    });
    const nx = body.querySelector('[data-next]');
    if (nx) nx.onclick = () => {
      capture(body);
      fx('pop');
      if (step < 2) { step++; api.setBody(view()); bind(api); return; }
      finish();
      closeSheet();
    };
  }

  function finish() {
    const s = get();
    if (s.onboarded) return;
    s.me.name = name;
    s.me.pet.name = petName;
    s.me.pet.look.body = color;
    s.onboarded = true;
    commit('onboarded');
    publishProfile();
    confetti(['🐥', '💛', '✨']);
    toast(`${petName} zieht bei dir ein`, '🐣');
    refresh();
    setTimeout(() => {
      emit('notify', {
        kind: 'hint', emoji: '👆',
        title: 'Tipp die Insel oben an',
        sub: 'Da wohnt Knuddl',
        body: 'Die schwarze Pille ist dein Schnellzugriff: füttern, knuddeln, spielen. Und dort landet alles, was dein Mensch dir schickt.',
        actions: [{ label: 'Verstanden', act: 'dismiss', primary: true }]
      });
    }, 1400);
  }

  sheet({
    title: null,
    body: view(),
    // Wer das Sheet wegwischt, bekommt es nicht endlos wieder vorgesetzt.
    onClose: finish,
    onMount: (_body, api) => bind(api)
  });
}

/* ── Lebenszyklus ───────────────────────────────────────── */

function wireLifecycle() {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    const s = get();
    tickPet(s.me.pet);
    touchStreak(s);
    commit('resume');
    publishProfile();
    updateLiveActivities();
  });

  window.addEventListener('beforeunload', () => {
    // Ein letztes Mal „ich war da" — sonst wirkt man sofort offline
    try { sendEvent('profile', { at: Date.now() }, { volatile: true }); } catch { /* egal */ }
  });
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  if (location.protocol === 'file:') return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((err) => {
      console.warn('[knuddl] Service Worker nicht registriert:', err);
    });
  });
}
