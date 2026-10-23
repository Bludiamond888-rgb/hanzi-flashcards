import raw from './data/hsk1.json';
// Copied from Hanzi Path (HSK 1, 178 characters, ordered by its lesson path).
export type Char = { c: string; p: string; m: string; ex: string; exp: string; exm: string; n: number };
export const CHARS: Char[] = raw.chars as Char[];
export const ORDER = CHARS.map(c => c.c);
export const BY_CHAR: Record<string, Char> = Object.fromEntries(CHARS.map(c => [c.c, c]));
/** strip tone marks so "ni" finds "nǐ" */
export const plain = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export function matches(ch: Char, q: string) {
  const t = plain(q.trim()); if (!t) return true;
  return ch.c.includes(q.trim()) || plain(ch.p).replace(/\s/g, '').includes(t.replace(/\s/g, '')) || ch.m.toLowerCase().includes(t);
}
export const short = (m: string) => m.split(/;\s*/).slice(0, 2).join('; ').replace(/\s*\(CL:[^)]*\)/g, '');
