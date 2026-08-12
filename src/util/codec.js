/**
 * Brieftauben-Codes.
 *
 * Der ehrlichste Weg, ohne jeden Server zu spielen: Der Spielstand wird zu
 * einem kurzen Text zusammengefaltet, den ihr euch per WhatsApp, iMessage
 * oder Zettel schickt. Wer ihn einfügt, bekommt alles, was seit dem letzten
 * Austausch passiert ist.
 *
 * Format:  KNUDDL1.<base64url(deflate-raw(json))>
 * Fallback (ohne CompressionStream): KNUDDL0.<base64url(json)>
 */

const MAGIC_Z = 'KNUDDL1.';
const MAGIC_P = 'KNUDDL0.';

const enc = new TextEncoder();
const dec = new TextDecoder();

function toB64Url(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  }
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64Url(str) {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4 ? '='.repeat(4 - (b64.length % 4)) : '';
  const bin = atob(b64 + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function squeeze(bytes) {
  if (typeof CompressionStream === 'undefined') return null;
  const cs = new CompressionStream('deflate-raw');
  const stream = new Blob([bytes]).stream().pipeThrough(cs);
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function unsqueeze(bytes) {
  const ds = new DecompressionStream('deflate-raw');
  const stream = new Blob([bytes]).stream().pipeThrough(ds);
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** Objekt → Code-String. */
export async function pack(payload) {
  const raw = enc.encode(JSON.stringify(payload));
  const zipped = await squeeze(raw).catch(() => null);
  if (zipped && zipped.length < raw.length) return MAGIC_Z + toB64Url(zipped);
  return MAGIC_P + toB64Url(raw);
}

/** Code-String → Objekt. Wirft bei Unsinn. */
export async function unpack(code) {
  const clean = String(code || '').trim().replace(/\s+/g, '');
  const body = clean.startsWith(MAGIC_Z) ? clean.slice(MAGIC_Z.length)
             : clean.startsWith(MAGIC_P) ? clean.slice(MAGIC_P.length)
             : null;
  if (body == null) throw new Error('Das sieht nicht nach einem Knuddl-Code aus.');

  const bytes = fromB64Url(body);
  const json = clean.startsWith(MAGIC_Z) ? dec.decode(await unsqueeze(bytes)) : dec.decode(bytes);
  const obj = JSON.parse(json);
  if (!obj || typeof obj !== 'object') throw new Error('Der Code ist leer.');
  return obj;
}

export function looksLikeCode(s) {
  const t = String(s || '').trim();
  return t.startsWith(MAGIC_Z) || t.startsWith(MAGIC_P);
}

/** Findet einen Code irgendwo in kopiertem Text (z. B. mitsamt Nachricht). */
export function extractCode(text) {
  const m = String(text || '').match(/KNUDDL[01]\.[A-Za-z0-9_-]+/);
  return m ? m[0] : null;
}
