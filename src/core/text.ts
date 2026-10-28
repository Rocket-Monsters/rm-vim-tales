// text for battle rounds, picked at new game: quotes from dummyjson, or code from TheAlgorithms repos via jsDelivr
import { sample } from './game.ts';

// id → [label, TheAlgorithms repo, file extension]
export const CODE_LANGS: Record<string, [string, string, string]> = {
  cs: ['C#', 'C-Sharp', 'cs'], cpp: ['C++', 'C-Plus-Plus', 'cpp'], php: ['PHP', 'PHP', 'php'], ts: ['TypeScript', 'TypeScript', 'ts'],
  js: ['JavaScript', 'JavaScript', 'js'], py: ['Python', 'Python', 'py'], rs: ['Rust', 'Rust', 'rs'],
};
const MAX = 44, KEEP = 300, FILES = 4;

// a line fits the battle pane and every round generator: short, printable ASCII, a few words
export const usable = (l: string) => l.length >= 12 && l.length <= MAX && /^[ -~]+$/.test(l) && l.split(' ').length >= 3;
// long sentences break at spaces into lines of at most MAX chars
export const wrap = (s: string) => (s.replace(/\s+/g, ' ').match(new RegExp(`\\S.{0,${MAX - 1}}(?=\\s|$)`, 'g')) || []).map(l => l.trim());
export const clean = (raw: string[]) => sample(Math.random, [...new Set(raw.map(l => l.trim()).filter(usable))], KEEP);

const get = (url: string) => fetch(url, { signal: AbortSignal.timeout(10000) }).then(r => { if (!r.ok) throw new Error(`${r.status} ${url}`); return r; });

async function snippets(id: string) {
  const [, repo, ext] = CODE_LANGS[id], base = `TheAlgorithms/${repo}@master`;
  const { files } = await (await get(`https://data.jsdelivr.com/v1/packages/gh/${base}?structure=flat`)).json();
  const src = (files as { name: string }[]).map(f => f.name).filter(n => n.endsWith('.' + ext) && !/test/i.test(n));
  const texts = await Promise.all(sample(Math.random, src, FILES).map(n => get(`https://cdn.jsdelivr.net/gh/${base}${n}`).then(r => r.text())));
  return texts.flatMap(t => t.split('\n'));
}

// [] when nothing came through: the game then keeps its built-in text
export async function download(kind: 'plain' | 'code', langs: string[]): Promise<string[]> {
  if (kind === 'plain') {
    const { quotes } = await (await get('https://dummyjson.com/quotes?limit=0')).json();
    return clean((quotes as { quote: string }[]).flatMap(q => wrap(q.quote)));
  }
  const got = await Promise.allSettled(langs.map(snippets));
  return clean(got.flatMap(r => (r.status === 'fulfilled' ? r.value : [])));
}
