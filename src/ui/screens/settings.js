/** Mehr — Verbinden, Einstellungen, Daten. */

import { esc } from '../../util/dom.js';
import { fx, confetti, setFeedbackPrefs } from '../../util/feedback.js';
import { get, commit, subscribe, exportJson, importJson, reset } from '../../state/store.js';
import { setMode, pairWith, unpair, syncStatus, buildCarrierCode, consumeCarrierCode, publishProfile } from '../../sync/index.js';
import { guessTz, relTime } from '../../util/time.js';
import CONFIG from '../../../config.js';
import { toast } from '../toast.js';
import { sheet, closeSheet } from '../sheet.js';

const MODES = [
  {
    id: 'solo', emoji: '🐣', title: 'Solo',
    sub: 'Ein simulierter Mensch antwortet dir. Kein Server, sofort spielbar.'
  },
  {
    id: 'cloud', emoji: '☁️', title: 'Cloud (live)',
    sub: 'Echtzeit über eure eigene Firebase-Datenbank. Braucht einmal fünf Minuten Einrichtung.'
  },
  {
    id: 'post', emoji: '🕊️', title: 'Brieftaube',
    sub: 'Codes per WhatsApp hin und her. Völlig serverlos, dafür zeitversetzt.'
  }
];

export function render(root, ctx) {
  function paint() {
    const s = get();
    const st = syncStatus();

    root.innerHTML = `
      <div class="title-lg">Mehr</div>
      <div class="subtitle">Verbinden, einstellen, sichern.</div>

      <div class="section-label">Du</div>
      <div class="list">
        <button class="li" data-edit-name>
          <div class="li-ico">🙋</div>
          <div class="grow"><div class="li-title">Dein Name</div>
            <div class="li-sub">Sieht nur dein Mensch</div></div>
          <span class="li-val">${esc(s.me.name || 'nicht gesetzt')}</span>
          <span class="li-chev">›</span>
        </button>
        <button class="li" data-edit-tz>
          <div class="li-ico">🕑</div>
          <div class="grow"><div class="li-title">Zeitzone</div>
            <div class="li-sub">Damit ihr die Uhrzeit des anderen seht</div></div>
          <span class="li-val">${esc(s.me.tz)}</span>
          <span class="li-chev">›</span>
        </button>
      </div>

      <div class="section-label">Verbindung</div>
      <div class="card code-card">
        <div class="code-label">Dein Knuddl-Code</div>
        <div class="code-big" data-mycode>${esc(s.me.code)}</div>
        <div class="row" style="gap:8px">
          <button class="btn btn-line btn-sm grow" data-copy-code>Kopieren</button>
          <button class="btn btn-primary btn-sm grow" data-share-code>Teilen</button>
        </div>
        <p class="tiny muted center" style="margin:12px 0 0">
          ${s.partner
            ? `Verbunden mit <b>${esc(s.partner.name)}</b> (${esc(s.partner.code)})${s.partner.lastSeen ? ` · zuletzt ${relTime(s.partner.lastSeen)}` : ''}`
            : 'Schick ihn deinem Menschen — oder gib seinen/ihren Code unten ein.'}
        </p>
      </div>

      ${s.partner ? `
        <button class="btn btn-line btn-block" data-unpair style="margin-top:12px">Verbindung lösen</button>
      ` : `
        <div class="card" style="margin-top:12px">
          <label class="field-label">Code deines Menschen</label>
          <input class="input input-code" data-pair-input maxlength="6" placeholder="ABC123"
                 autocapitalize="characters" autocomplete="off" spellcheck="false">
          <button class="btn btn-primary btn-block" data-pair style="margin-top:12px">Verbinden</button>
        </div>
      `}

      <div class="section-label">Wie synchronisiert ihr?</div>
      <div class="mode-list">
        ${MODES.map((m) => `<button class="card mode ${s.settings.syncMode === m.id ? 'on' : ''}" data-mode="${m.id}">
          <div class="mode-e">${m.emoji}</div>
          <div class="grow">
            <div class="li-title">${esc(m.title)}</div>
            <div class="li-sub">${esc(m.sub)}</div>
          </div>
          <div class="mode-radio"></div>
        </button>`).join('')}
      </div>

      <div class="card" style="margin-top:12px">
        <div class="row-between">
          <span class="tiny muted">Status</span>
          <span class="badge ${st.status === 'live' && st.mode === 'cloud' ? 'badge-live' : 'badge-off'}">
            ${st.status === 'live' && st.mode === 'cloud' ? '<span class="dot-live"></span>' : ''}${esc(st.label)}
          </span>
        </div>
      </div>

      ${s.settings.syncMode === 'solo' ? soloPanel(s) : ''}
      ${s.settings.syncMode === 'cloud' ? cloudPanel(s) : ''}
      ${s.settings.syncMode === 'post' ? carrierPanel(s) : ''}

      <div class="section-label">App</div>
      <div class="list">
        <button class="li" data-toggle="haptics">
          <div class="li-ico">📳</div>
          <div class="grow"><div class="li-title">Vibration</div></div>
          <span class="switch" role="switch" aria-checked="${!!s.settings.haptics}"></span>
        </button>
        <button class="li" data-toggle="sound">
          <div class="li-ico">🔈</div>
          <div class="grow"><div class="li-title">Töne</div></div>
          <span class="switch" role="switch" aria-checked="${!!s.settings.sound}"></span>
        </button>
        <button class="li" data-notify>
          <div class="li-ico">🔔</div>
          <div class="grow"><div class="li-title">Mitteilungen</div>
            <div class="li-sub">Wenn die App im Hintergrund läuft</div></div>
          <span class="switch" role="switch" aria-checked="${!!s.settings.notify}"></span>
        </button>
        <button class="li" data-theme>
          <div class="li-ico">🌗</div>
          <div class="grow"><div class="li-title">Erscheinungsbild</div></div>
          <span class="li-val">${({ auto: 'Automatisch', light: 'Hell', dark: 'Dunkel' })[s.settings.theme]}</span>
          <span class="li-chev">›</span>
        </button>
      </div>

      <div class="section-label">Daten</div>
      <div class="list">
        <button class="li" data-export>
          <div class="li-ico">📤</div>
          <div class="grow"><div class="li-title">Sicherung exportieren</div>
            <div class="li-sub">Alles liegt nur auf diesem Gerät</div></div>
          <span class="li-chev">›</span>
        </button>
        <button class="li" data-import>
          <div class="li-ico">📥</div>
          <div class="grow"><div class="li-title">Sicherung einlesen</div></div>
          <span class="li-chev">›</span>
        </button>
        <button class="li" data-reset>
          <div class="li-ico">🧹</div>
          <div class="grow"><div class="li-title" style="color:var(--warn)">Alles zurücksetzen</div></div>
          <span class="li-chev">›</span>
        </button>
      </div>

      <div class="card about">
        <div class="about-title">🐔 Knuddl</div>
        <p class="tiny muted" style="margin:6px 0 0">
          Eine statische Seite ohne Backend. Der Spielstand liegt in deinem Browser,
          nicht bei uns. Zum Startbildschirm hinzufügen macht daraus eine App —
          samt Insel direkt unter der Notch.
        </p>
      </div>
      <div style="height:20px"></div>`;

    bind();
  }

  /* ── Solo ── */
  function soloPanel(s) {
    return `<button class="li card" data-solo-name style="margin-top:12px">
      <div class="li-ico">🐣</div>
      <div class="grow">
        <div class="li-title">Name des simulierten Menschen</div>
        <div class="li-sub">Nur fürs Ausprobieren — ersetzt niemanden</div>
      </div>
      <span class="li-val">${esc(s.settings.soloName || 'Mila')}</span>
      <span class="li-chev">›</span>
    </button>`;
  }

  /* ── Cloud ── */
  function cloudPanel(s) {
    const configured = !!(s.settings.cloudUrl || CONFIG.cloudUrl);
    return `<div class="card" style="margin-top:12px">
      <label class="field-label">Firebase Realtime Database URL</label>
      <input class="input" data-cloud-url spellcheck="false" autocapitalize="off" autocomplete="off"
             placeholder="https://…-default-rtdb.europe-west1.firebasedatabase.app"
             value="${esc(s.settings.cloudUrl || '')}">
      <button class="btn btn-primary btn-block" data-cloud-save style="margin-top:12px">Speichern &amp; verbinden</button>
      <p class="tiny muted" style="margin:12px 4px 0">
        ${configured
          ? 'Beide Geräte brauchen dieselbe URL. Danach läuft alles live — Stimmungen, Spielzüge, Anwesenheit.'
          : 'Im README steht Schritt für Schritt, wie ihr in fünf Minuten eine kostenlose Datenbank anlegt.'}
      </p>
    </div>`;
  }

  /* ── Brieftaube ── */
  function carrierPanel(s) {
    return `<div class="card" style="margin-top:12px">
      <div class="li-title" style="margin-bottom:4px">🕊️ Brieftaube</div>
      <p class="tiny muted" style="margin:0 0 14px">
        Erzeuge einen Code, schick ihn per Messenger, dein Mensch fügt ihn ein — und umgekehrt.
        Doppelte oder verlorene Codes machen nichts aus, der nächste holt alles nach.
        ${s.outbox.length ? `<br><b>${s.outbox.length}</b> Ereignisse warten darauf, mitzureisen.` : ''}
      </p>
      <button class="btn btn-primary btn-block" data-make-code>Code erzeugen</button>
      <button class="btn btn-line btn-block" data-read-code style="margin-top:8px">Code einfügen</button>
    </div>`;
  }

  /* ── Interaktion ── */
  function bind() {
    const q = (sel) => root.querySelector(sel);

    q('[data-edit-name]').onclick = () => textSheet({
      title: 'Dein Name', value: get().me.name, placeholder: 'Wie nennt dich dein Mensch?',
      save: (v) => { const s = get(); s.me.name = v.slice(0, 20); commit('name'); publishProfile(); }
    });

    q('[data-edit-tz]').onclick = () => textSheet({
      title: 'Zeitzone', value: get().me.tz, placeholder: 'Europe/Berlin',
      hint: `Erkannt: ${guessTz()}. Gültige Namen sind z. B. Europe/Berlin, America/New_York, Asia/Tokyo.`,
      save: (v) => {
        const s = get();
        try { new Intl.DateTimeFormat('de', { timeZone: v }); } catch { toast('Diese Zeitzone kennt der Browser nicht'); return; }
        s.me.tz = v; commit('tz'); publishProfile();
      }
    });

    q('[data-copy-code]').onclick = () => copy(get().me.code, 'Code kopiert');
    q('[data-share-code]').onclick = () => shareText(
      `Hol dir Knuddl 🐔 und verbinde dich mit mir: ${get().me.code}\n${location.href.split('#')[0]}`,
      'Knuddl-Code'
    );

    const pairBtn = q('[data-pair]');
    if (pairBtn) pairBtn.onclick = async () => {
      const inp = q('[data-pair-input]');
      try {
        const p = await pairWith(inp.value);
        fx('yay');
        confetti(['💛', '🐥', '💗']);
        toast(`Verbunden mit ${p.code}`, '🤝');
        paint();
      } catch (err) {
        fx('fail');
        toast(err.message, '⚠️');
      }
    };

    const un = q('[data-unpair]');
    if (un) un.onclick = () => {
      if (!confirm('Verbindung wirklich lösen? Euer gemeinsamer Verlauf bleibt erhalten.')) return;
      unpair(); fx('tap'); toast('Verbindung gelöst'); paint();
    };

    root.querySelectorAll('[data-mode]').forEach((b) => {
      b.onclick = async () => {
        fx('tap');
        await setMode(b.dataset.mode);
        paint();
      };
    });

    const sn = q('[data-solo-name]');
    if (sn) sn.onclick = () => textSheet({
      title: 'Wie soll er/sie heißen?', value: get().settings.soloName || 'Mila',
      placeholder: 'Mila',
      save: async (v) => {
        const st = get();
        st.settings.soloName = v.slice(0, 20) || 'Mila';
        if (st.partner?.demo) st.partner.name = st.settings.soloName;
        commit('solo-name');
        paint();
      }
    });

    const cs = q('[data-cloud-save]');
    if (cs) cs.onclick = async () => {
      const s = get();
      s.settings.cloudUrl = q('[data-cloud-url]').value.trim().replace(/\/+$/, '');
      commit('cloud-url');
      await setMode('cloud');
      const st = syncStatus();
      fx(st.status === 'error' ? 'fail' : 'yay');
      toast(st.status === 'error' ? 'Datenbank nicht erreichbar' : 'Cloud verbunden', st.status === 'error' ? '⚠️' : '☁️');
      paint();
    };

    const mk = q('[data-make-code]');
    if (mk) mk.onclick = async () => {
      const { code, events, chars } = await buildCarrierCode();
      sheet({
        title: 'Dein Brieftauben-Code',
        body: `<p class="tiny muted" style="margin:0 0 10px">
                 Enthält dein Profil und ${events} Ereignis${events === 1 ? '' : 'se'} · ${chars} Zeichen.
               </p>
               <textarea class="input code-out" rows="5" readonly data-out>${esc(code)}</textarea>
               <div class="row" style="gap:8px;margin-top:12px">
                 <button class="btn btn-line grow" data-c>Kopieren</button>
                 <button class="btn btn-primary grow" data-sh>Teilen</button>
               </div>`,
        onMount(body) {
          body.querySelector('[data-out]').onclick = (e) => e.target.select();
          body.querySelector('[data-c]').onclick = () => copy(code, 'Code kopiert — ab damit in den Chat');
          body.querySelector('[data-sh]').onclick = () => shareText(code, 'Knuddl-Brieftaube');
        }
      });
    };

    const rd = q('[data-read-code]');
    if (rd) rd.onclick = () => {
      sheet({
        title: 'Code einfügen',
        body: `<textarea class="input" rows="5" data-in placeholder="KNUDDL1.…"></textarea>
               <button class="btn btn-primary btn-block" data-apply style="margin-top:12px">Einlesen</button>
               <p class="tiny muted" style="margin:12px 4px 0">
                 Du kannst die ganze Nachricht einfügen — der Code wird darin gefunden.
               </p>`,
        onMount(body) {
          const ta = body.querySelector('[data-in]');
          ta.focus();
          body.querySelector('[data-apply]').onclick = async () => {
            try {
              const res = await consumeCarrierCode(ta.value);
              fx('yay');
              if (res.firstContact) confetti(['💛', '🐥', '💗']);
              toast(res.firstContact
                ? `Verbunden mit ${res.name}!`
                : `${res.applied} Neuigkeit${res.applied === 1 ? '' : 'en'} von ${res.name}`, '🕊️');
              closeSheet();
              paint();
            } catch (err) {
              fx('fail');
              toast(err.message || 'Der Code ließ sich nicht lesen', '⚠️');
            }
          };
        }
      });
    };

    root.querySelectorAll('[data-toggle]').forEach((b) => {
      b.onclick = () => {
        const s = get();
        const k = b.dataset.toggle;
        s.settings[k] = !s.settings[k];
        commit('settings');
        setFeedbackPrefs({ haptics: s.settings.haptics, sound: s.settings.sound });
        fx('tap');
        paint();
      };
    });

    q('[data-notify]').onclick = async () => {
      const s = get();
      if (s.settings.notify) { s.settings.notify = false; commit('settings'); paint(); return; }
      if (typeof Notification === 'undefined') { toast('Dieser Browser kann das nicht', '🔕'); return; }
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') { toast('Ohne Erlaubnis geht es leider nicht', '🔕'); return; }
      s.settings.notify = true;
      commit('settings');
      fx('pop');
      paint();
    };

    q('[data-theme]').onclick = () => {
      const s = get();
      const order = ['auto', 'light', 'dark'];
      s.settings.theme = order[(order.indexOf(s.settings.theme) + 1) % 3];
      commit('theme');
      applyTheme(s.settings.theme);
      fx('tap');
      paint();
    };

    q('[data-export]').onclick = () => {
      const blob = new Blob([exportJson()], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `knuddl-sicherung-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      fx('pop');
      toast('Sicherung heruntergeladen', '📤');
    };

    q('[data-import]').onclick = () => {
      const inp = document.createElement('input');
      inp.type = 'file';
      inp.accept = 'application/json,.json';
      inp.onchange = async () => {
        const f = inp.files?.[0];
        if (!f) return;
        try {
          importJson(await f.text());
          fx('yay');
          toast('Sicherung eingelesen', '📥');
          paint();
        } catch {
          fx('fail');
          toast('Diese Datei konnte ich nicht lesen', '⚠️');
        }
      };
      inp.click();
    };

    q('[data-reset]').onclick = () => {
      if (!confirm('Wirklich alles löschen? Knuddl, Körner, euer Verlauf — weg.')) return;
      reset();
      location.reload();
    };
  }

  paint();
  const unsub = subscribe((_, reason) => { if (reason === 'remote' || reason === 'sync-mode') paint(); });
  return () => unsub();
}

/* ── Hilfen ─────────────────────────────────────────────── */

function textSheet({ title, value = '', placeholder = '', hint = '', save }) {
  sheet({
    title,
    body: `<input class="input" data-v value="${esc(value)}" placeholder="${esc(placeholder)}">
           ${hint ? `<p class="tiny muted" style="margin:10px 4px 0">${esc(hint)}</p>` : ''}
           <button class="btn btn-primary btn-block" data-save style="margin-top:12px">Speichern</button>`,
    onMount(body) {
      const inp = body.querySelector('[data-v]');
      inp.focus();
      inp.select();
      const go = () => { save(inp.value.trim()); closeSheet(); };
      body.querySelector('[data-save]').onclick = go;
      inp.onkeydown = (e) => { if (e.key === 'Enter') go(); };
    }
  });
}

async function copy(text, msg) {
  try {
    await navigator.clipboard.writeText(text);
    fx('pop');
    toast(msg, '📋');
  } catch {
    // Ältere Browser (und iOS ohne Nutzergeste) brauchen den Umweg
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); toast(msg, '📋'); }
    catch { toast('Kopieren ging nicht — bitte von Hand markieren'); }
    ta.remove();
  }
}

async function shareText(text, title) {
  if (navigator.share) {
    try { await navigator.share({ title, text }); return; } catch { /* abgebrochen */ }
  }
  copy(text, 'Kopiert — ab in den Chat');
}

export function applyTheme(mode) {
  const el = document.documentElement;
  if (mode === 'auto') el.removeAttribute('data-theme');
  else el.setAttribute('data-theme', mode);
}
