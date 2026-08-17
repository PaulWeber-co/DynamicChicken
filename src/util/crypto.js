/**
 * Ende-zu-Ende-Verschlüsselung.
 *
 * Die ehrliche Ausgangslage: Eine statische Seite hat keinen Server, dem sie
 * vertrauen könnte. Die Firebase-Datenbank steht offen im Netz und ihre URL
 * steht in `config.js` — jeder, der sie kennt, kann hineinschauen.
 *
 * Deshalb sieht die Datenbank nichts Lesbares. Beim Verbinden entsteht ein
 * gemeinsames Geheimnis, das nur über euren Messenger läuft und niemals
 * hochgeladen wird. Daraus leiten beide Geräte ab:
 *
 *   Raum-ID   wohin geschrieben wird — 20 Zeichen, praktisch unauffindbar
 *   Schlüssel AES-GCM-256 für den Inhalt
 *
 * Was in der Datenbank landet, ist also ein Datensatz an einer zufälligen
 * Stelle, der aus IV und Chiffrat besteht. Wer euren Code nicht hat, findet
 * nichts und könnte damit auch nichts anfangen.
 *
 * Alles davon steckt schon im Browser: WebCrypto braucht keine Bibliothek.
 */

const enc = new TextEncoder();
const dec = new TextDecoder();

/** Ohne verwechselbare Zeichen — man muss den Code notfalls vorlesen können. */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const subtle = () => globalThis.crypto?.subtle || null;
export const isSupported = () => !!subtle();

/* ── Base32 ─────────────────────────────────────────────── */

export function toBase32(bytes) {
  let bits = 0, value = 0, out = '';
  for (const b of bytes) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      out += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

export function fromBase32(str) {
  // I, L und O kommen im Alphabet nicht vor — sie werden verworfen, was zu
  // einem falschen Schlüssel und damit zu einem klaren Fehler führt statt zu
  // stillem Unsinn.
  const clean = String(str || '').toUpperCase().replace(/[^A-Z2-9]/g, '');
  let bits = 0, value = 0;
  const out = [];
  for (const ch of clean) {
    const idx = ALPHABET.indexOf(ch);
    if (idx < 0) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return new Uint8Array(out);
}

/** 12 Byte = 96 Bit Zufall → 20 Zeichen. Kurz genug zum Weiterschicken. */
export function newSecret() {
  const b = new Uint8Array(12);
  crypto.getRandomValues(b);
  return toBase32(b);
}

/* ── Ableitung ──────────────────────────────────────────── */

const SALT = enc.encode('knuddl/2024');
const cache = new Map();

async function baseKey(secret) {
  const raw = fromBase32(secret);
  if (!raw.length) throw new Error('Leeres Geheimnis');
  return subtle().importKey('raw', raw, 'HKDF', false, ['deriveBits', 'deriveKey']);
}

/**
 * @returns {Promise<{room:string, key:CryptoKey}>}
 */
export async function derive(secret) {
  if (!isSupported()) throw new Error('Dieser Browser kann nicht verschlüsseln.');
  if (cache.has(secret)) return cache.get(secret);

  const base = await baseKey(secret);
  const params = (info) => ({ name: 'HKDF', hash: 'SHA-256', salt: SALT, info: enc.encode(info) });

  const roomBits = await subtle().deriveBits(params('room'), base, 96);
  const key = await subtle().deriveKey(
    params('content'), base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']
  );

  const out = { room: toBase32(new Uint8Array(roomBits)), key };
  cache.set(secret, out);
  return out;
}

/* ── Verschlüsseln / Entschlüsseln ──────────────────────── */

const b64 = (bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64 = (s) => {
  const t = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(t + '='.repeat((4 - (t.length % 4)) % 4));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};

/**
 * Objekt → { v, iv, ct }. Genau das landet in der Datenbank.
 * Jede Nachricht bekommt einen eigenen Zufalls-IV; AES-GCM erkennt dadurch
 * auch nachträgliche Veränderungen.
 */
export async function seal(key, obj) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await subtle().encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(obj)));
  return { v: 1, iv: b64(iv), ct: b64(new Uint8Array(ct)) };
}

/** Gibt null zurück, wenn der Datensatz nicht zu diesem Schlüssel gehört. */
export async function open(key, box) {
  if (!box || box.v !== 1 || !box.iv || !box.ct) return null;
  try {
    const plain = await subtle().decrypt(
      { name: 'AES-GCM', iv: unb64(box.iv) }, key, unb64(box.ct)
    );
    return JSON.parse(dec.decode(plain));
  } catch {
    return null;
  }
}

/* ── Einladungen ────────────────────────────────────────── */

/** `ABC123-K7F2M9QX4R8TWE7HJ2NP` — Code, Bindestrich, Geheimnis. */
export function formatInvite(code, secret) {
  return `${code}-${secret}`;
}

/**
 * Nimmt alles entgegen: den nackten Code, eine ganze WhatsApp-Nachricht
 * oder einen Einladungslink.
 * @returns {{code:string, secret:string}|null}
 */
export function parseInvite(text) {
  const raw = String(text || '').trim();

  // Link mit ?join=…
  const url = raw.match(/[?&]join=([A-Za-z0-9-]+)/);
  const candidate = url ? url[1] : raw;

  // Code + Geheimnis
  const full = candidate.toUpperCase().match(/\b([A-Z0-9]{6})-([A-Z2-9]{16,32})\b/);
  if (full) return { code: full[1], secret: full[2] };

  // Nur ein Code (alte Verbindungen, unverschlüsselt)
  const bare = candidate.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (bare.length === 6) return { code: bare, secret: null };

  return null;
}
