/**
 * Meme-Duell — einer liefert die Vorlage, der andere das Bild.
 *
 * Ablauf: Du schreibst einen Satz. Dein Mensch sucht irgendwo ein Bild, das
 * dazu passt, und schickt es. Du siehst beides zusammen und sagst, wie
 * lustig es war. Danach ist das Bild weg — auf beiden Geräten.
 *
 * Warum das Bild verschwindet: Ein Meme ist ein Moment, kein Archiv. Und
 * ganz praktisch — der Speicher im Browser ist bei etwa fünf Megabyte zu
 * Ende, ein paar aufgehobene Fotos würden ihn füllen. Der Verlauf behält
 * nur den Spruch und die Note.
 *
 * Bilder brauchen die Cloud. Ein verkleinertes Meme sind immer noch rund
 * hundert Kilobyte; als Brieftauben-Code wäre das eine Textwand, die durch
 * keinen Messenger passt. In den anderen Modi sagt das Spiel das offen.
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
import { shrink, prettyBytes } from '../util/image.js';
import { renderChicken } from '../pet/chicken.js';
import { cycledMany } from '../util/rng.js';
import { pairKey } from './index.js';

export const meta = {
  id: 'meme',
  icon: 'gameMeme',
  title: 'Meme-Duell',
  tagline: 'Du sagst den Satz, der andere findet das Bild',
  modes: ['async'],
  tone: 'love',
  howto: 'Einer schreibt die Vorlage, der andere lädt ein passendes Bild hoch. Danach wird bewertet und das Bild gelöscht.'
};

/**
 * Startpunkte für die, denen gerade nichts einfällt.
 *
 * Unter dem Eingabefeld stehen immer nur acht davon; „Andere“ blättert
 * weiter. Sonst wäre der halbe Bildschirm eine Knopfwand, und mit zehn
 * Vorlagen kannte man nach einer Woche alle.
 */
export const PROMPTS = [
  /* Alltag */
  'Mein Gesicht um 6 Uhr morgens',
  'Wenn der Zug schon wieder Verspätung hat',
  'Der Moment, wenn der Akku bei 1% ist',
  'Ich, nachdem ich gesagt habe „nur noch eine Folge“',
  'Wenn jemand meine Pommes anfasst',
  'Mein innerer Zustand vor dem ersten Kaffee',
  'Ich beim Versuch, erwachsen zu wirken',
  'Wenn der Wecker klingelt und ich schon wach bin',
  'Ich am Sonntagabend, wenn mir der Montag einfällt',
  'Wenn ich im Supermarkt die Preise sehe',
  'Mein Blick, wenn jemand „kurze Frage“ sagt',
  'Ich, wenn der Kühlschrank leer ist und ich Hunger habe',
  'Wenn ich zwei Stunden zu spät ins Bett gehe',
  'Ich beim Versuch, gesund zu leben — Tag drei',
  'Wenn die Wäsche seit drei Tagen im Trockner liegt',
  'Mein Gesicht bei einem Videocall ohne Kamera-Vorschau',
  'Wenn ich sage „ich mach das gleich“',
  'Ich, wenn jemand meinen Namen falsch ausspricht',

  /* Wir */
  'Ich, wenn du „wir müssen reden“ schreibst',
  'Wie ich aussehe, wenn du anrufst',
  'Wenn du sagst, du bist „in fünf Minuten“ fertig',
  'Ich, wenn dein Name auf dem Display steht',
  'Mein Gesicht, wenn du sagst „ich hab was für dich“',
  'Ich, kurz bevor der Zug zu dir losfährt',
  'Wenn du sagst „mach dir keine Sorgen“',
  'Ich am Bahnsteig, wenn du zurückfährst',
  'Mein Blick, wenn du das letzte Stück Kuchen nimmst',
  'Wie ich schaue, wenn du ein Foto von dir schickst',
  'Ich, wenn wir uns nach Wochen wiedersehen',
  'Wenn du sagst „schlaf gut“ und ich noch drei Stunden wach bin',
  'Mein Gesicht bei deiner dritten Sprachnachricht am Stück',
  'Ich, wenn du recht hattest und ich es zugeben muss',
  'Wenn wir beide gleichzeitig „du zuerst“ sagen',
  'Ich, wenn du meine Serie ohne mich weiterschaust',

  /* Arbeit und Uni */
  'Ich in einer Besprechung, die eine Mail hätte sein können',
  'Mein Gesicht, wenn jemand „schnell noch“ sagt',
  'Ich am letzten Tag vor der Abgabe',
  'Wenn der Chef fragt, wie weit ich bin',
  'Ich, nachdem ich „das mach ich morgen“ gesagt habe — im Juni',
  'Mein Blick beim Wort „Teambuilding“',
  'Wenn die Datei nicht gespeichert war',
  'Ich beim Versuch, motiviert zu klingen',

  /* Innerlich */
  'Mein Gehirn um drei Uhr nachts',
  'Ich, wenn ich an etwas Peinliches von vor zehn Jahren denke',
  'Mein innerer Monolog beim Smalltalk',
  'Ich, wenn ich merke, dass ich der Erwachsene im Raum bin',
  'Wenn ich zum vierten Mal denselben Song höre',
  'Mein Gesicht, wenn ich eine gute Idee habe und sie sofort vergesse',
  'Ich beim Versuch, früher aufzustehen',
  'Wenn mich jemand fragt, wie es mir geht',
  'Mein Blick, wenn der Plan aufgeht',
  'Ich, wenn ich das Haus verlasse und alles dabei habe'
];

/** Wie viele Vorschläge unter dem Eingabefeld stehen. */
export const PROMPT_CHIPS = 8;

/** Acht Vorlagen, passend zur Runde. */
export const promptChips = (runde, paar = '') => cycledMany(PROMPTS, PROMPT_CHIPS, Math.max(0, runde - 1), `meme|${paar}`);

export const SCORES = [
  { v: 1, label: 'Nicht mein Humor', icon: 'moodSad' },
  { v: 2, label: 'Ein Schmunzeln', icon: 'moodCalm' },
  { v: 3, label: 'Ganz gut', icon: 'moodHappy' },
  { v: 4, label: 'Sehr gut', icon: 'moodExcited' },
  { v: 5, label: 'Tränen gelacht', icon: 'moodSilly' }
];

const scoreAt = (v) => SCORES[Math.max(1, Math.min(5, v)) - 1];

/* ── Zustand ────────────────────────────────────────────── */

function mm(state) {
  if (!state.games.meme) {
    state.games.meme = { r: 1, turn: null, cur: null, score: { me: 0, them: 0 }, hist: [] };
  }
  const g = state.games.meme;
  g.score ||= { me: 0, them: 0 };
  g.hist ||= [];
  // Wer anfängt, hängt am Code — sonst schrieben beide gleichzeitig
  if (!g.turn) g.turn = iAmFirst(state) ? 'me' : 'them';
  return g;
}

const iAmFirst = (state) => (state.me.code || '') < (state.partner?.code || '~');

/** Bild wegwerfen — nach der Bewertung hat es seinen Zweck erfüllt. */
function dropImage(g) {
  if (!g.cur) return;
  g.cur.img = null;
  g.cur.drawn = false;
}

function closeRound(state, g, score) {
  const asked = g.cur.by === 'me';
  // Punkte bekommt, wer das Bild gefunden hat
  if (asked) g.score.them += score;
  else g.score.me += score;

  g.hist.unshift({
    r: g.r, prompt: g.cur.prompt, score,
    found: asked ? 'them' : 'me', at: Date.now()
  });
  if (g.hist.length > 20) g.hist.length = 20;

  state.me.coins += score >= 4 ? REWARDS.gameWon : REWARDS.gamePlayed;
  addBondXp(state, 3 + score);
  state.me.pet.stats.joy = Math.min(100, state.me.pet.stats.joy + 4);
  pushFeed(state, {
    from: 'system', type: 'game', icon: 'gameMeme',
    text: `Meme-Duell „${g.cur.prompt}“: ${score}/5`
  });

  dropImage(g);
  g.r++;
  g.turn = g.turn === 'me' ? 'them' : 'me';
  g.cur = null;
}

/**
 * Notausgang: Runde wegwerfen und weiterziehen.
 *
 * Es gibt zu viele Gründe, warum eine Runde liegen bleibt — kein passendes
 * Bild gefunden, falscher Sync-Modus, das Handy gewechselt. Ohne diesen Weg
 * hinge das Spiel für immer, und genau das ist das Ärgerlichste, was einem
 * zeitversetzten Duell passieren kann.
 */
function abortRound(g) {
  dropImage(g);
  g.cur = null;
  g.r++;
  g.turn = g.turn === 'me' ? 'them' : 'me';
}

/* ── Netzwerk ───────────────────────────────────────────── */

const KINDS = ['memePrompt', 'memeShot', 'memeScore', 'memeSkip'];

export function handleRemote(state, msg, { partnerName }) {
  if (!KINDS.includes(msg.kind)) return undefined;
  const g = mm(state);

  if (msg.kind === 'memeSkip') {
    // Ein Abbruch aus einer schon beendeten Runde ist nichts mehr wert
    if (msg.r < g.r || !g.cur) return null;
    abortRound(g);
    commit('meme');
    return {
      kind: 'gameTurn',
      icon: 'gameMeme',
      avatar: 'them',
      title: `${partnerName} hat die Runde verworfen`,
      sub: 'Meme-Duell',
      body: `Kein passendes Bild gefunden. ${g.turn === 'me' ? 'Du gibst die nächste Vorlage.' : `${partnerName} gibt die nächste Vorlage.`}`,
      actions: [{ label: 'Weiter', act: 'game:meme', primary: true }, { label: 'Ok', act: 'dismiss' }],
      tone: 'calm'
    };
  }

  if (msg.kind === 'memePrompt') {
    if (msg.r < g.r) return null;
    // Beide haben gleichzeitig eine Vorlage geschickt? Dann gewinnt auf
    // beiden Geräten dieselbe Seite — der kleinere Code. Sonst hinge jeder
    // auf seiner eigenen Vorlage fest und keine würde je bewertet.
    if (g.cur?.by === 'me' && msg.r === g.r && iAmFirst(state)) return null;

    g.r = msg.r;
    g.turn = 'them';
    g.cur = { prompt: String(msg.prompt || '').slice(0, 120), by: 'them', img: null, drawn: false };
    commit('meme');
    return {
      kind: 'gameTurn',
      icon: 'gameMeme',
      avatar: 'them',
      title: `${partnerName} braucht ein Bild`,
      sub: g.cur.prompt,
      body: `„${g.cur.prompt}“ — such etwas Passendes und schick es rüber.`,
      actions: [{ label: 'Bild suchen', act: 'game:meme', primary: true }, { label: 'Später', act: 'dismiss' }],
      tone: 'love'
    };
  }

  if (msg.kind === 'memeShot') {
    if (!g.cur || g.cur.by !== 'me') return null;
    g.cur.img = typeof msg.img === 'string' && msg.img.startsWith('data:image/') ? msg.img : null;
    g.cur.drawn = !!msg.drawn;
    if (!g.cur.img && !g.cur.drawn) return null;
    commit('meme');
    return {
      kind: 'gameTurn',
      icon: 'gameMeme',
      avatar: 'them',
      title: `${partnerName} hat geliefert`,
      sub: g.cur.prompt,
      body: `Das Bild zu „${g.cur.prompt}“ ist da. Wie lustig ist es?`,
      actions: [{ label: 'Ansehen', act: 'game:meme', primary: true }, { label: 'Später', act: 'dismiss' }],
      tone: 'love'
    };
  }

  // Bewertung meines Bildes
  if (!g.cur || g.cur.by !== 'them') return null;
  const score = Math.max(1, Math.min(5, Math.round(Number(msg.score)) || 1));
  const prompt = g.cur.prompt;
  closeRound(state, g, score);
  commit('meme');

  return {
    kind: 'gameResult',
    icon: score >= 4 ? 'trophy' : 'gameMeme',
    avatar: 'them',
    title: `${score}/5 für dein Meme`,
    sub: scoreAt(score).label,
    body: `${partnerName} zu „${prompt}“: ${scoreAt(score).label}.`,
    actions: [{ label: 'Revanche', act: 'game:meme', primary: true }, { label: 'Ok', act: 'dismiss' }],
    tone: score >= 4 ? 'love' : 'calm'
  };
}

export function summary(state) {
  const g = mm(state);
  if (g.cur?.by === 'them' && !g.cur.img && !g.cur.drawn) return { badge: 'wait', text: 'Bild gesucht' };
  if (g.cur?.by === 'me' && (g.cur.img || g.cur.drawn)) return { badge: 'wait', text: 'Bewerten' };
  if (g.cur) return { badge: 'off', text: 'Unterwegs' };
  // „Du bist dran“ heißt: drüben wartet jemand. Ein Spiel, das noch nie
  // gelaufen ist, wartet auf niemanden — es steht einfach bereit.
  if (g.turn === 'me') {
    return g.hist.length
      ? { badge: 'wait', text: 'Du gibst vor' }
      : { badge: null, text: 'Du fängst an' };
  }
  return g.hist.length ? { badge: null, text: `${g.score.me} : ${g.score.them}` } : { badge: null, text: 'Neu' };
}

/* ── Oberfläche ─────────────────────────────────────────── */

export function mount(root, ctx) {
  const partner = get().partner?.name || 'Dein Mensch';
  /** Bild der laufenden Runde, solange es nur hier liegt und noch nicht raus ist. */
  let staged = null;

  const shell = (inner) => {
    const g = mm(get());
    return `<div class="game-wrap">
      <div class="game-top">
        <button class="game-x" data-close aria-label="Schließen">${icon('close', { size: 15 })}</button>
        <div class="game-title">Meme-Duell</div>
        <div class="game-right"><span class="badge">${g.score.me} : ${g.score.them}</span></div>
      </div>
      <div class="game-scroll">${inner}</div>
    </div>`;
  };
  const bindClose = () => {
    root.querySelectorAll('[data-close]').forEach((b) => { b.onclick = () => ctx.close(); });
    const skip = root.querySelector('[data-skip]');
    if (skip) skip.onclick = () => {
      const st = get();
      const g = mm(st);
      if (!g.cur) { route(); return; }
      sendEvent('game', { g: 'meme', kind: 'memeSkip', r: g.r });
      abortRound(g);
      commit('meme');
      staged = null;
      toast('Runde verworfen');
      fx('tap');
      route();
    };
  };

  /** Immer erreichbar, solange eine Runde offen ist. */
  const skipLink = (label = 'Runde verwerfen') =>
    `<button class="btn btn-ghost btn-sm btn-block" data-skip style="margin-top:2px">${label}</button>`;

  /* Wie oft schon „Andere“ gedrückt wurde — nur für diese Sitzung. */
  let ideaOffset = 0;
  const chipHtml = (runde) => promptChips(runde + ideaOffset, pairKey(get()))
    .map((p) => `<button class="chip" data-idea="${esc(p)}">${esc(p)}</button>`).join('');

  /* — Vorlage schreiben — */
  function screenPrompt() {
    const g = mm(get());
    root.innerHTML = shell(`
      <div class="hue-lead">
        <span class="doodle-kicker">Runde ${g.r} · du gibst vor</span>
        <b>Schreib die Vorlage</b>
      </div>
      <p class="tiny muted center" style="margin:0 0 14px">
        ${esc(partner)} sucht dann ein Bild dazu. Je konkreter, desto lustiger.
      </p>
      <textarea class="input" data-prompt rows="2" maxlength="110"
        placeholder="Ich, wenn du „wir müssen reden“ schreibst"></textarea>
      <div class="section-label idea-head" style="margin:14px 4px 8px">
        <span>Oder nimm eine davon</span>
        <button class="link-btn" data-more>${icon('shuffle', { size: 14 })} Andere</button>
      </div>
      <div class="meme-ideas" data-chips>${chipHtml(g.r)}</div>
      <button class="btn btn-love btn-block" data-send style="margin-top:14px">Abschicken</button>
      ${history()}`);

    const ta = root.querySelector('[data-prompt]');
    ta.focus();
    const bindIdeas = () => root.querySelectorAll('[data-idea]').forEach((b) => {
      b.onclick = () => { ta.value = b.dataset.idea; fx('tap'); ta.focus(); };
    });
    bindIdeas();
    root.querySelector('[data-more]').onclick = () => {
      ideaOffset++;
      root.querySelector('[data-chips]').innerHTML = chipHtml(g.r);
      bindIdeas();
      fx('tap');
    };
    root.querySelector('[data-send]').onclick = () => {
      const prompt = ta.value.trim().slice(0, 110);
      if (prompt.length < 4) { toast('Ein bisschen mehr Vorlage'); return; }
      const st = get();
      const g2 = mm(st);
      g2.cur = { prompt, by: 'me', img: null, drawn: false };
      g2.turn = 'me';
      commit('meme');
      sendEvent('game', { g: 'meme', kind: 'memePrompt', r: g2.r, prompt });
      fx('pop');
      screenWait();
    };
    bindClose();
  }

  function screenWait() {
    const g = mm(get());
    root.innerHTML = shell(`
      <div class="game-center">
        <div class="game-hero">${icon('dove', { size: 62 })}</div>
        <h2 class="game-h">Vorlage unterwegs</h2>
        <p class="game-p">„${esc(g.cur?.prompt || '')}“ liegt bei ${esc(partner)}. Sobald das Bild da ist, darfst du werten.</p>
        <button class="btn btn-ghost btn-block" data-close>Fertig</button>
        ${skipLink('Vorlage zurücknehmen')}
      </div>
      ${history()}`);
    bindClose();
  }

  /* — Bild suchen — */
  function screenUpload() {
    const st = get();
    const g = mm(st);
    const canSend = st.settings.syncMode !== 'post';

    root.innerHTML = shell(`
      <div class="hue-lead">
        <span class="doodle-kicker">Von ${esc(partner)}</span>
        <b>„${esc(g.cur.prompt)}“</b>
      </div>
      <p class="tiny muted center" style="margin:0 0 14px">Such ein Bild, das dazu passt.</p>

      ${canSend ? `
        <label class="meme-drop" for="meme-file">
          ${icon('gameMeme', { size: 44 })}
          <b>Bild auswählen</b>
          <small>Wird verkleinert und nach dem Bewerten gelöscht</small>
        </label>
        <input id="meme-file" type="file" accept="image/*" hidden data-file>
        <div data-preview></div>
      ` : `
        <div class="card">
          <div class="poll-sealed">${icon('warn', { size: 15 })}
            <span>Bilder brauchen den Cloud-Modus. Als Brieftauben-Code wäre ein Meme
            eine Textwand, die durch keinen Messenger passt.</span></div>
          <button class="btn btn-soft btn-block" data-tomore style="margin-top:12px">Zu den Einstellungen</button>
        </div>
      `}
      ${skipLink('Ich finde nichts — überspringen')}
      ${history()}`);

    const more = root.querySelector('[data-tomore]');
    // Dynamisch geladen: die Shell kennt die Spiele, die Spiele kennen sonst
    // nicht die Shell — ein statischer Import wäre ein Ring.
    if (more) more.onclick = () => {
      ctx.close();
      import('../ui/shell.js').then((m) => m.go('more')).catch(() => {});
    };

    const file = root.querySelector('[data-file]');
    if (file) file.onchange = () => handleFile(file.files?.[0]);
    bindClose();
  }

  async function handleFile(f) {
    if (!f) return;
    const box = root.querySelector('[data-preview]');
    if (!box) return;
    box.innerHTML = '<p class="tiny muted center" style="margin:14px 0">Wird verkleinert …</p>';
    try {
      staged = await shrink(f);
    } catch (err) {
      staged = null;
      box.innerHTML = `<p class="tiny muted center" style="margin:14px 0">${esc(err.message)}</p>`;
      return;
    }

    box.innerHTML = `
      <div class="meme-frame" style="margin-top:14px">
        <img src="${esc(staged.url)}" alt="Dein Meme">
        <span class="meme-cap">${esc(mm(get()).cur.prompt)}</span>
      </div>
      <p class="tiny muted center" style="margin:8px 0 0">${staged.w}×${staged.h} · ${prettyBytes(staged.bytes)}</p>
      <button class="btn btn-love btn-block" data-ok style="margin-top:12px">Das ist es — abschicken</button>
      <button class="btn btn-ghost btn-block" data-other style="margin-top:6px">Anderes Bild</button>`;

    box.querySelector('[data-ok]').onclick = () => sendShot();
    box.querySelector('[data-other]').onclick = () => { staged = null; screenUpload(); };
  }

  function sendShot() {
    if (!staged) return;
    const st = get();
    const g = mm(st);
    if (!g.cur || g.cur.by !== 'them') return;
    g.cur.img = staged.url;
    commit('meme');
    // Flüchtig: das Bild soll durch die Leitung, aber nicht im Briefkasten
    // liegen bleiben — dort würden 140 kB den Speicher aufessen.
    sendEvent('game', { g: 'meme', kind: 'memeShot', r: g.r, img: staged.url }, { volatile: true });
    fx('pop');
    screenSent();
  }

  function screenSent() {
    const g = mm(get());
    root.innerHTML = shell(`
      <div class="game-center">
        <div class="game-hero">${icon('dove', { size: 62 })}</div>
        <h2 class="game-h">Abgeschickt</h2>
        <p class="game-p">${esc(partner)} sieht jetzt dein Bild zu „${esc(g.cur?.prompt || '')}“ und vergibt eine Note.</p>
        ${staged ? '<button class="btn btn-soft btn-block" data-again>Noch mal schicken</button>' : ''}
        <button class="btn btn-ghost btn-block" data-close>Fertig</button>
        ${skipLink()}
      </div>
      ${history()}`);
    const again = root.querySelector('[data-again]');
    if (again) again.onclick = () => {
      const g2 = mm(get());
      // Nach einem Abbruch drüben ist die Runde weg — dann nichts mehr senden
      if (!g2.cur || g2.cur.by !== 'them') { route(); return; }
      sendEvent('game', { g: 'meme', kind: 'memeShot', r: g2.r, img: staged.url }, { volatile: true });
      toast('Noch mal unterwegs');
      fx('tap');
    };
    bindClose();
  }

  /* — Bewerten — */
  function screenRate() {
    const st = get();
    const g = mm(st);
    root.innerHTML = shell(`
      <div class="hue-lead">
        <span class="doodle-kicker">Von ${esc(partner)}</span>
        <b>„${esc(g.cur.prompt)}“</b>
      </div>
      ${memeView(g, st)}
      <div class="section-label" style="margin:16px 4px 8px">Wie lustig?</div>
      <div class="meme-scores">
        ${SCORES.map((s) => `<button class="meme-score" data-score="${s.v}" aria-label="${esc(s.label)}">
          <span>${icon(s.icon, { size: 28 })}</span>
          <b>${s.v}</b>
          <small>${esc(s.label)}</small>
        </button>`).join('')}
      </div>
      <p class="tiny muted center" style="margin:12px 4px 0">
        ${icon('lock', { size: 12, cls: 'ic-inline' })} Danach wird das Bild bei euch beiden gelöscht.
      </p>
      ${history()}`);

    root.querySelectorAll('[data-score]').forEach((b) => {
      b.onclick = () => {
        const score = Number(b.dataset.score);
        const st2 = get();
        const g2 = mm(st2);
        if (!g2.cur) { route(); return; }
        const prompt = g2.cur.prompt;
        sendEvent('game', { g: 'meme', kind: 'memeScore', r: g2.r, score });
        closeRound(st2, g2, score);
        commit('meme');
        fx(score >= 4 ? 'yay' : 'pop');
        if (score === 5) confetti(['gameMeme', 'statJoy', 'sparkle']);
        burst([scoreAt(score).icon], { from: b, count: 6, rise: 110 });
        screenDone(score, prompt);
      };
    });
    bindClose();
  }

  /** Bild oder — wenn keins ankam — ein selbst gezeichnetes Hühner-Meme. */
  function memeView(g, st) {
    if (g.cur.img) {
      return `<div class="meme-frame">
        <img src="${esc(g.cur.img)}" alt="Meme von ${esc(partner)}">
        <span class="meme-cap">${esc(g.cur.prompt)}</span>
      </div>`;
    }
    return `<div class="meme-frame drawn">
      <span class="meme-top">${esc(g.cur.prompt)}</span>
      ${renderChicken(st.partner?.pet?.look || st.me.pet.look, { mood: 'silly', size: 170, shadow: false })}
      <span class="meme-bottom">…kein Bild, nur ein Huhn</span>
    </div>`;
  }

  function screenDone(score, prompt) {
    staged = null;
    root.innerHTML = shell(`
      <div class="game-center">
        <div class="game-hero">${icon(scoreAt(score).icon, { size: 62 })}</div>
        <h2 class="game-h">${esc(scoreAt(score).label)}</h2>
        <p class="game-p">„${esc(prompt)}“ — ${score}/5 für ${esc(partner)}.<br>
          Das Bild ist weg, der Spruch bleibt im Verlauf.</p>
        <button class="btn btn-primary btn-block" data-next>Weiter</button>
        <button class="btn btn-ghost btn-block" data-close>Fertig</button>
      </div>
      ${history()}`);
    root.querySelector('[data-next]').onclick = () => route();
    bindClose();
  }

  function screenIdle() {
    root.innerHTML = shell(`
      <div class="game-center">
        <div class="game-hero">${icon('gameMeme', { size: 62 })}</div>
        <h2 class="game-h">${esc(partner)} ist dran</h2>
        <p class="game-p">Die nächste Vorlage kommt von drüben.</p>
        <button class="btn btn-ghost btn-block" data-close>Fertig</button>
      </div>
      ${history()}`);
    bindClose();
  }

  function history() {
    const g = mm(get());
    if (!g.hist.length) return '';
    return `<div class="section-label">Bisher</div>
      <div class="list">
        ${g.hist.slice(0, 8).map((h) => `<div class="li">
          <div class="li-ico">${icon(scoreAt(h.score).icon, { size: 19 })}</div>
          <div class="grow">
            <div class="li-title">„${esc(h.prompt)}“</div>
            <div class="li-sub">${h.found === 'me' ? 'dein Bild' : `Bild von ${esc(partner)}`}
              · ${h.score}/5 · ${relTime(h.at)}</div>
          </div>
        </div>`).join('')}
      </div>`;
  }

  function route() {
    const g = mm(get());
    if (g.cur?.by === 'them' && !g.cur.img && !g.cur.drawn) screenUpload();
    else if (g.cur?.by === 'me' && (g.cur.img || g.cur.drawn)) screenRate();
    else if (g.cur?.by === 'me') screenWait();
    else if (g.cur?.by === 'them') screenSent();
    else if (g.turn === 'me') screenPrompt();
    else screenIdle();
  }

  route();
  return () => { staged = null; };
}
