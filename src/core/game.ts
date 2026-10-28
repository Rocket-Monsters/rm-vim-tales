// vim-tales game logic: the overworld (World), generated battle rounds, and the par solver.
import { Vim, Run, LEVELS, tokens, needs } from './engine.ts';
import type { Level, Lesson, Pos, SpellId } from './engine.ts';
type Learned = ReadonlySet<string>;
const LV = Object.fromEntries(LEVELS.map(l => [l.id, l])) as Record<SpellId, Lesson>;
const MOVE_SPELLS: SpellId[] = ['hjkl', 'words', 'edges', 'counts', 'find'];
const ROUNDS = 5, BOSS_ROUNDS = 8;
// fights against roaming monsters: how many rounds (each a random learned spell) and how much of the usual clock
const FIGHTS = { ambush: { rounds: 1, time: 1 }, swarm: { rounds: 3, time: 1 }, blitz: { rounds: 1, time: 0.5 } } as const;
// seconds on the clock for a round: a base plus a few seconds per keystroke of par
const roundSecs = (par: number, perKey: number, time = 1) => Math.round((10 + par * perKey) * time);
// every spell learned once you've mastered `id` (hjkl is innate)
const upTo = (id: SpellId) => new Set(['hjkl', ...LEVELS.slice(0, LEVELS.findIndex(l => l.id === id) + 1).map(l => l.id)]);

// ---------- overworld ----------
// The map is a read-only vim buffer. Grass, path and water are "blank" so w/b/e leap over them;
// stepping-stones (=) are words. Walking (hjkl) goes tile by tile, every other motion is a leap.
const WALK = ' .o=$%+>';
const mapCls = (ch: string | undefined) => (ch !== undefined && ' .o~'.includes(ch) ? 0 : ch === '=' ? 1 : 2);
const DIRS: Record<string, [number, number]> = { h: [0, -1], j: [1, 0], k: [-1, 0], l: [0, 1] };

// one key on the map → what happened
export interface MapEvent {
  picked: string[]; wait?: boolean; locked?: SpellId | 'unknown' | 'battle';
  bump?: Pos & { t: string | undefined }; blocked?: boolean; foe?: Roamer; exit?: boolean; face?: number;
}
export interface Roamer extends Pos { dr: number; dc: number }

class World {
  roamers: Roamer[] = [];
  start!: Pos;
  nav: Vim;
  npcAt: Record<string, number> = {};
  constructor(chapter: { map: string[] }, saved?: string[] | null) {
    chapter.map.forEach((row, r) => [...row].forEach((t, c) => {
      if (t === 'M' || t === 'W') this.roamers.push({ r, c, dr: t === 'W' ? 1 : 0, dc: t === 'M' ? 1 : 0 });
      if (t === '@') this.start = { r, c };
    }));
    const lines = saved || chapter.map.map(row => row.replace(/[MW@]/g, ' '));
    this.nav = new Vim(lines.join('\n'), true, mapCls);
    let n = 0;
    chapter.map.forEach((row, r) => [...row].forEach((t, c) => { if (t === '&') this.npcAt[r + ',' + c] = n++; }));
    this.place(this.start.r, this.start.c);
  }
  get lines() { return this.nav.lines; }
  get r() { return this.nav.r; }
  get c() { return this.nav.c; }
  at(r: number, c: number): string | undefined { return this.lines[r]?.[c]; }
  set(r: number, c: number, t: string) { const l = this.lines[r]; this.lines[r] = l.slice(0, c) + t + l.slice(c + 1); }
  walkable(r: number, c: number) { const t = this.at(r, c); return t !== undefined && WALK.includes(t); }
  place(r: number, c: number) { Object.assign(this.nav, { r, c, want: c, pending: '' }); }
  find(t: string): Pos | undefined { for (let r = 0; r < this.lines.length; r++) { const c = this.lines[r].indexOf(t); if (c >= 0) return { r, c }; } }

  key(k: string, learned: Learned): MapEvent {
    const v = this.nav, cmd = v.pending + k, ev: MapEvent = { picked: [] };
    if (k === '<Esc>') { v.pending = ''; return ev; }
    const need = needs(cmd);
    const lock = !need.length && !/^[1-9]\d*$/.test(cmd) ? 'unknown'
      : need.find(s => !MOVE_SPELLS.includes(s)) || cmd === 'i' ? 'battle' : need.find(s => !learned.has(s));
    if (lock) { v.pending = ''; ev.locked = lock; return ev; }
    const walk = cmd.match(/^([1-9]\d*)?([hjkl])$/);
    if (walk) {
      v.pending = '';
      const [dr, dc] = DIRS[walk[2]];
      if (dc) ev.face = dc;
      for (let i = 0; i < (+walk[1] || 1); i++) {
        const r = v.r + dr, c = v.c + dc;
        if (!this.walkable(r, c)) { ev.bump = { r, c, t: this.at(r, c) }; break; }
        this.place(r, c);
        this.step(ev);
        if (ev.exit || ev.foe) break;
      }
    } else {
      const from = { r: v.r, c: v.c, want: v.want };
      v.key(k);
      if (v.pending) return { ...ev, wait: true };
      if (v.r !== from.r || v.c !== from.c) {
        if (this.walkable(v.r, v.c)) this.step(ev);
        else { Object.assign(v, from); ev.blocked = true; }
      }
    }
    if (!ev.exit && !ev.foe) this.turn(ev);
    return ev;
  }
  step(ev: MapEvent) {
    const t = this.at(this.r, this.c)!;
    if ('$%+'.includes(t)) { this.set(this.r, this.c, ' '); ev.picked.push(t); }
    if (t === '>') ev.exit = true;
    ev.foe ||= this.roamers.find(m => m.r === this.r && m.c === this.c);
  }
  // monsters take one step per command: a 9j dash or a $ leap outruns them
  turn(ev: MapEvent) {
    for (const m of this.roamers) {
      for (let tries = 0; tries < 2; tries++) {
        const r = m.r + m.dr, c = m.c + m.dc;
        if (' .='.includes(this.at(r, c) || '#') && !this.roamers.some(o => o !== m && o.r === r && o.c === c)) { m.r = r; m.c = c; break; }
        m.dr = -m.dr; m.dc = -m.dc;
      }
      if (m.r === this.r && m.c === this.c) ev.foe ||= m;
    }
  }
}

// ---------- generated battle rounds ----------
type Rand = () => number;
const rng = (seed: number): Rand => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const pick = <T>(R: Rand, a: readonly T[]): T => a[Math.floor(R() * a.length)];
const other = <T>(R: Rand, a: readonly T[], not: T): T => { let x: T; do x = pick(R, a); while (x === not); return x; };
const sample = <T>(R: Rand, a: readonly T[], n: number): T[] => {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
  return b.slice(0, n);
};
const letters = (line: string) => [...line].flatMap((ch, i) => (/[a-z]/.test(ch) ? [i] : []));
const wordStarts = (line: string) => [...line.matchAll(/\S+/g)].map(m => m.index);

const PROSE = [
  'the quick brown fox jumps over the lazy dog', 'a true hero never leaves the home row',
  'every word in textoria was written by hand', 'lord clicker hides behind a wall of menus',
  'count your steps and the road gets shorter', 'the river of words flows from left to right',
  'small steps make long journeys feel short', 'press escape and the world returns to normal',
  'the old sage taught us to delete with grace', 'typos crawl out of the swamp after midnight',
  'operators and motions are the grammar of vim', 'yank the line and put it where it belongs',
  'the tower of objects touches the clouds', 'a fox with nimble paws types without looking',
  'gold and gems are hidden at the end of lines', 'the mouse king fears the power of the dot',
];
const CODE = ['let score = 0', 'const name = "tails"', 'if (hp < 10) heal()', 'return a + b', 'print(total)', 'items.push(gem)',
  'let speed = fast * 2', 'save(game, slot)', 'move(hero, 3, 4)', 'open(chest)', 'attack(goblin, sword)', 'log(level)'];
const WRONG = ['cats', 'mouse', 'click', 'banana', 'potato', 'sock', 'spoon', 'pickle'];
const FILLER = ['very', 'really', 'super', 'totally', 'basically'];
const JUNK = ['delete me please', 'this line is junk', 'spam spam spam', 'nobody reads this line', 'lorem ipsum dolor'];
const NOTES = ['save often', 'boss fight', 'magic here', 'level up', 'do not touch'];
const TODOS = ['TODO remove', 'FIXME later', 'hack', 'debug only'];
const QUOTES = ['hello hero', 'chest', 'the old key', 'level up', 'game over', 'potion'];
const ARGS = ['potion, 5', 'goblin, sword', 'hp < 10', 'mana', 'dragon, 3, fire', 'gold > 99'];
const TPL: [string, string][] = [['open("X")', '"'], ['say("X", hero)', '"'], ['let msg = "X"', '"'], ['heal(X)', '('], ['attack(X)', '('], ['if (X) run()', '(']];
// the text rounds are cut from: built in, or downloaded at new game (see text.ts)
let TEXT = PROSE, CODE_TEXT = CODE;
function useText(custom?: string[] | null, code = false) {
  TEXT = custom?.length ? custom : PROSE;
  CODE_TEXT = custom?.length && code ? custom : CODE;
}
const lines = (R: Rand, d: number) => sample(R, TEXT, 1 + Math.ceil(d / 2));

// each generator returns {start, goal, steps}; steps run bottom-up/right-to-left so earlier positions never shift
// a step: go to (r, c) (c = null: anywhere on line r), then press keys
export interface Step { r: number; c: number | null; keys: string }
type Generated = { start: string[]; goal: string[]; steps: Step[] };
const GEN: Record<string, (R: Rand, d: number) => Generated> = {
  x(R, d) {
    const goal = lines(R, d), steps: Step[] = [];
    const start = goal.map((line, r) => {
      const idx = sample(R, letters(line), 1 + Math.ceil(d / 2)).sort((a, b) => a - b);
      idx.forEach((i, j) => steps.push({ r, c: i + j, keys: 'x' }));
      return [...idx].reverse().reduce((s, i) => s.slice(0, i) + s[i] + s.slice(i), line);
    });
    return { start, goal, steps: steps.reverse() };
  },
  insert(R, d) {
    const goal = lines(R, d), steps: Step[] = [];
    const start = goal.map((line, r) => {
      const idx = sample(R, letters(line).filter(i => i < line.length - 1), 1 + Math.ceil(d / 2)).sort((a, b) => a - b);
      idx.forEach((i, j) => steps.push({ r, c: i - j, keys: `i${line[i]}<Esc>` }));
      return [...idx].reverse().reduce((s, i) => s.slice(0, i) + s.slice(i + 1), line);
    });
    return { start, goal, steps: steps.reverse() };
  },
  lines(R, d) {
    const start = sample(R, CODE_TEXT, 2 + Math.ceil(d / 2)), goal: string[] = [], steps: Step[] = [];
    start.forEach((line, r) => {
      const semi = R() < 0.7 || r === start.length - 1, pre = R() < 0.3, note = R() < 0.3 ? pick(R, NOTES) : null;
      if (note) goal.push('// ' + note);
      goal.push((pre ? 'await ' : '') + line + (semi ? ';' : ''));
      const keys = (semi ? 'A;<Esc>' : '') + (pre ? 'Iawait <Esc>' : '') + (note ? `O// ${note}<Esc>` : '');
      if (keys) steps.push({ r, c: null, keys });
    });
    return { start, goal, steps: steps.reverse() };
  },
  delete(R, d) {
    const goal = lines(R, d + 1), start: string[] = [], steps: Step[] = [];
    goal.forEach((line, i) => {
      if (R() < 0.5) { steps.push({ r: start.length, c: null, keys: 'dd' }); start.push(pick(R, JUNK)); }
      if (R() < 0.7 || (i === goal.length - 1 && !steps.length)) {
        const w = pick(R, wordStarts(line));
        steps.push({ r: start.length, c: w, keys: 'dw' });
        start.push(line.slice(0, w) + pick(R, FILLER) + ' ' + line.slice(w));
      } else start.push(line);
    });
    return { start, goal, steps: steps.reverse() };
  },
  motions(R, d) {
    const goal = sample(R, CODE_TEXT, 2 + Math.ceil(d / 2)), steps: Step[] = [];
    const start = goal.map((line, r) => {
      const t = r === goal.length - 1 && !steps.length ? 0 : R();
      if (t < 0.45) { steps.push({ r, c: line.length, keys: 'D' }); return line + ' // ' + pick(R, TODOS); }
      if (t < 0.85) { const w = pick(R, wordStarts(line)); steps.push({ r, c: w, keys: 'df/x' }); return line.slice(0, w) + '/* old */ ' + line.slice(w); }
      return line;
    });
    return { start, goal, steps: steps.reverse() };
  },
  change(R, d) {
    const goal = lines(R, d), steps: Step[] = [];
    const start = goal.map((line, r) => {
      const words = line.split(' '), S = new Set(sample(R, words.map((_, i) => i), 1 + Math.floor(R() * 2)));
      let pos = 0;
      return words.map((w, i) => {
        const o = S.has(i) ? other(R, WRONG, w) : w;
        if (S.has(i)) steps.push({ r, c: pos, keys: `cw${w}<Esc>` });
        pos += o.length + 1;
        return o;
      }).join(' ');
    });
    return { start, goal, steps: steps.reverse() };
  },
  inside(R, d) {
    const start: string[] = [], goal: string[] = [], steps: Step[] = [];
    for (let r = 0; r < 2 + Math.ceil(d / 2); r++) {
      const [tpl, obj] = pick(R, TPL), pool = obj === '"' ? QUOTES : ARGS, g = pick(R, pool);
      const s = tpl.replace('X', other(R, pool, g));
      start.push(s); goal.push(tpl.replace('X', g));
      steps.push({ r, c: s.indexOf(obj), keys: `ci${obj}${g}<Esc>` });
    }
    return { start, goal, steps: steps.reverse() };
  },
  replace(R, d) {
    const goal = lines(R, d), steps: Step[] = [];
    const start = goal.map((line, r) => {
      const s = [...line];
      sample(R, letters(line), 2 + Math.floor(d / 2)).sort((a, b) => a - b).forEach(i => {
        if (R() < 0.5) { s[i] = s[i].toUpperCase(); steps.push({ r, c: i, keys: '~' }); }
        else { s[i] = other(R, [...'abcdefghijklmnopqrstuvwxyz'], line[i]); steps.push({ r, c: i, keys: 'r' + line[i] }); }
      });
      return s.join('');
    });
    return { start, goal, steps: steps.reverse() };
  },
  yank(R, d) {
    const start = lines(R, d + 1), goal: string[] = [], steps: Step[] = [];
    start.forEach((line, r) => {
      const t = r === start.length - 1 && !steps.length ? 0 : R();
      if (t < 0.4) { goal.push(line, line); steps.push({ r, c: null, keys: 'yyp' }); }
      else if (t < 0.8) {
        const w = pick(R, wordStarts(line).slice(0, -1)), word = line.slice(w, line.indexOf(' ', w) + 1);
        goal.push(line.slice(0, w) + word + line.slice(w)); steps.push({ r, c: w, keys: 'ywP' });
      } else goal.push(line);
    });
    return { start, goal, steps: steps.reverse() };
  },
  dot(R, d) {
    const T = pick(R, ['foo', 'tmp', 'mob', 'bug']), N = pick(R, ['bar', 'gem', 'hero', 'fix']);
    const base = lines(R, d), start: string[] = [], goal: string[] = [], steps: Step[] = [];
    base.forEach((line, r) => {
      const words = line.split(' '), S = new Set(sample(R, words.map((_, i) => i), 2 + Math.floor(R() * 2)));
      let pos = 0;
      start.push(words.map((w, i) => { const o = S.has(i) ? T : w; if (S.has(i)) steps.push({ r, c: pos, keys: '.' }); pos += o.length + 1; return o; }).join(' '));
      goal.push(words.map((w, i) => (S.has(i) ? N : w)).join(' '));
    });
    steps.reverse()[0].keys = `cw${N}<Esc>`;
    return { start, goal, steps };
  },
};

// shortest-ish keys to put the cursor at (r, c); c = null means "anywhere on line r"
function navKeys(v: Vim, r: number, c: number | null) {
  let k = '', cc = v.c;
  if (v.r !== r) { k = `${r + 1}G`; cc = v.firstNB(r); }
  if (c == null || c === cc) return k;
  if (c === 0) return k + '0';
  const d = c - cc, n = Math.abs(d);
  return k + (n > 1 ? n : '') + (d > 0 ? 'l' : 'h');
}
function solveSteps(start: string, steps: Step[]) {
  const v = new Vim(start);
  let sol = '';
  for (const s of steps) { const k = navKeys(v, s.r, s.c) + s.keys; tokens(k).forEach(x => v.key(x)); sol += k; }
  return { sol, text: v.text };
}

// movement rounds: letters go missing where the spell shines; par comes from a cheapest-path search
function moveset(learned: Learned, v: Vim, targets: string) {
  const m: string[] = [];
  const has = (s: SpellId) => learned.has(s);
  if (has('hjkl')) m.push('h', 'j', 'k', 'l');
  if (has('words')) m.push('w', 'b', 'e');
  if (has('edges')) m.push('0', '^', '$');
  if (has('counts')) {
    for (let n = 2; n <= 9; n++) m.push(n + 'j', n + 'k', n + 'l', n + 'h', ...(has('words') ? [n + 'w'] : []));
    m.push('gg', 'G');
    for (let n = 2; n < v.lines.length; n++) m.push(n + 'G');
  }
  if (has('find')) for (const ch of new Set(targets)) m.push('f' + ch, 'F' + ch, 't' + ch, 'T' + ch);
  return m;
}
// Dijkstra over cursor states (cost = keystrokes) → Map "r,c" → cheapest key string
type Cursor = Pos & { want: number };
function paths(v: Vim, moves: string[]) {
  const key = (s: Cursor) => `${s.r},${s.c},${s.want}`, cost = new Map<string, number>(), out = new Map<string, string>(), path = new Map<string, string>(), buckets: Cursor[][] = [];
  const s0 = { r: v.r, c: v.c, want: v.want };
  cost.set(key(s0), 0); path.set(key(s0), ''); buckets[0] = [s0];
  for (let d = 0; d < buckets.length; d++) for (const s of buckets[d] || []) {
    const sk = key(s);
    if (cost.get(sk) !== d) continue;
    if (!out.has(s.r + ',' + s.c)) out.set(s.r + ',' + s.c, path.get(sk)!);
    for (const mv of moves) {
      Object.assign(v, { r: s.r, c: s.c, want: s.want, pending: '', lastFind: null });
      const ks = tokens(mv);
      ks.forEach(k => v.key(k));
      const n = { r: v.r, c: v.c, want: v.want }, nk = key(n), nd = d + ks.length;
      if (cost.has(nk) && cost.get(nk)! <= nd) continue;
      cost.set(nk, nd); path.set(nk, path.get(sk) + mv); (buckets[nd] ||= []).push(n);
    }
  }
  Object.assign(v, s0, { pending: '' });
  return out;
}
function genFix(R: Rand, d: number, id: SpellId, learned: Learned): Level {
  const n = id === 'counts' ? 8 + 2 * d : id === 'hjkl' ? 3 + Math.floor(d / 2) : 4 + Math.floor(d / 2);
  let rows = Array.from({ length: n }, () => pick(R, TEXT));
  if (id === 'hjkl') rows = rows.map(l => l.slice(0, 10 + 2 * d).trimEnd());
  if (id === 'edges' || id === 'counts') rows = rows.map(l => ' '.repeat(Math.floor(R() * 4)) + l);
  // [row, col of the letter to remove, word index]; the letter after it is where i lands, so it must stay in the word
  const cand: [number, number, number][] = [];
  rows.forEach((l, r) => {
    const ws = [...l.matchAll(/\S+/g)];
    ws.forEach((m, i) => {
      const s = m.index, e = s + m[0].length - 1, add = (c: number) => cand.push([r, c, i]);
      if (e === s) return;
      if (id === 'hjkl' || id === 'find') for (let c = s; c < e; c++) add(c);
      else if (id === 'words') add(pick(R, [s, e - 1]));
      else if (id === 'edges' && (i === 0 || i === ws.length - 1)) add(i ? e - 1 : s);
      else if (id === 'counts' && i === 0) add(s);
    });
  });
  const used = new Set<string>();
  const fixes = sample(R, cand, cand.length).filter(([r, , i]) => !used.has(r + ',' + i) && used.add(r + ',' + i))
    .slice(0, 2 + d).map(([r, c]) => ({ r, c, ch: rows[r][c] }));
  const start = rows.map((l, r) => [...l].filter((_, c) => !fixes.some(f => f.r === r && f.c === c)).join(''));
  const lv = { start: start.join('\n'), goal: rows.join('\n') }, run = new Run(lv);
  const moves = moveset(learned, run.vim, fixes.map(f => rows[f.r][f.c + 1]).join(''));
  let solution = '', left = fixes;
  while (left.length) {
    const ps = paths(run.vim, moves);
    // the letter after each gap, shifted left by the gaps still open before it on its line
    const [f, p] = left.map(f => [f, ps.get(f.r + ',' + (f.c - left.filter(g => g.r === f.r && g.c < f.c).length))!] as const)
      .sort((a, b) => tokens(a[1]).length - tokens(b[1]).length)[0];
    const k = `${p}i${f.ch}<Esc>`;
    tokens(k).forEach(x => run.press(x));
    solution += k; left = left.filter(g => g !== f);
  }
  return { ...lv, solution, par: run.keys };
}

// round 0 is the handcrafted lesson; later rounds are generated and get harder
function makeRound(id: SpellId, R: Rand, d: number, learned: Learned): Level {
  if (d === 0) return LV[id];
  if (MOVE_SPELLS.includes(id)) return genFix(R, d, id, learned);
  const gen = id === 'boss' ? GEN[pick(R, Object.keys(GEN))] : GEN[id];
  const { start, goal, steps } = gen(R, id === 'boss' ? d + 1 : d);
  const { sol, text } = solveSteps(start.join('\n'), steps);
  // downloaded text can trip a generator (yw stops at punctuation): fall back to the built-in text
  if (text !== goal.join('\n') && TEXT !== PROSE) {
    const keep = [TEXT, CODE_TEXT];
    TEXT = PROSE; CODE_TEXT = CODE;
    try { return makeRound(id, R, d, learned); } finally { [TEXT, CODE_TEXT] = keep; }
  }
  return { start: start.join('\n'), goal: goal.join('\n'), solution: sol, par: tokens(sol).length };
}

export { World, makeRound, useText, sample, rng, pick, roundSecs, upTo, LV, ROUNDS, BOSS_ROUNDS, FIGHTS, MOVE_SPELLS, GEN, solveSteps };
