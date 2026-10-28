// vim-tales engine: a small vim subset + the levels. Shared by the UI and the tests.
export type SpellId = 'hjkl' | 'words' | 'edges' | 'counts' | 'find' | 'x' | 'insert' | 'lines' | 'delete' | 'motions'
  | 'change' | 'inside' | 'replace' | 'yank' | 'dot' | 'boss';
export type Mode = 'normal' | 'insert';
export interface Pos { r: number; c: number }
// where a motion lands; operators use inclusive/linewise/start to pick the range
export interface Target extends Pos { inclusive?: boolean; linewise?: boolean; want?: number; start?: Pos }
type Res = 'ok' | 'wait' | 'bad';
type FindCmd = 'f' | 'F' | 't' | 'T';
type WordClass = (ch: string | undefined) => number;
// a playable round: it's won once the buffer equals goal, back in normal mode
export interface Level { start: string; goal: string; par: number; solution: string }
export interface Lesson extends Level { id: SpellId; world: string; title: string; learn: string; keys: [string, string][] }

const charClass: WordClass = ch => (ch === undefined || /\s/.test(ch) ? 0 : /\w/.test(ch) ? 1 : 2);
const tokens = (s: string): string[] => s.match(/<\w+>|./g) || [];

class Vim {
  lines: string[];
  r = 0; c = 0; want = 0;
  mode: Mode = 'normal'; pending = ''; msg = '';
  undo: { lines: string[]; r: number; c: number }[] = [];
  reg = { text: '', linewise: false };
  lastFind: { cmd: FindCmd; ch: string } | null = null;
  lastChange: string[] = [];
  rec: string[] | null = null;
  hasCount = false;
  readonly: boolean;
  cls: WordClass;

  constructor(text: string, readonly = false, wordClass = charClass) {
    this.lines = text.split('\n');
    this.readonly = readonly; this.cls = wordClass;
  }
  get text() { return this.lines.join('\n'); }
  firstNB(r: number) { const i = this.lines[r].search(/\S/); return i < 0 ? 0 : i; }
  clamp() {
    this.r = Math.max(0, Math.min(this.r, this.lines.length - 1));
    const max = this.lines[this.r].length - (this.mode === 'insert' ? 0 : 1);
    this.c = Math.max(0, Math.min(this.c, max));
  }

  // k: a single char or '<Esc>' / '<CR>' / '<BS>'
  key(k: string): void {
    this.msg = '';
    if (this.mode === 'insert') return this.insertKey(k);
    if (k === '<Esc>') { this.pending = ''; return; }
    if (k.length > 1) return;
    const p = (this.pending += k);
    const res = this.exec(p);
    if (res === 'wait') return;
    this.pending = '';
    if (res === 'bad') this.msg = `unknown command: ${p}`;
  }

  exec(p: string): Res {
    const [, n1, op, n2, rest] = p.match(/^([1-9]\d*)?(?:([dcy])([1-9]\d*)?)?(.*)$/)!;
    if (rest === '') return 'wait';
    const n = (+n1 || 1) * (+n2 || 1);
    this.hasCount = !!(n1 || n2);
    if (op && rest === op) return this.change(p, () => this.opLines(op, n), op === 'y');
    const t = this.target(rest, n, op);
    if (t === 'wait') return t;
    if (t === 'fail') return 'ok';
    if (op) return t === 'bad' ? 'bad' : this.change(p, () => this.opRange(op, t), op === 'y');
    if (t !== 'bad') { this.r = t.r; this.c = t.c; this.clamp(); this.want = t.want ?? this.c; return 'ok'; }
    return this.command(p, rest, n);
  }

  // wraps every buffer-changing command: undo snapshot + dot-repeat recording
  change(p: string, fn: () => void, isYank = false): 'ok' {
    if (isYank) { fn(); this.clamp(); return 'ok'; }
    if (this.readonly) { this.msg = 'no editing here, just move!'; return 'ok'; }
    this.undo.push({ lines: [...this.lines], r: this.r, c: this.c });
    this.rec = [...p];
    fn();
    if (this.mode === 'normal') { this.finishRec(); this.clamp(); this.want = this.c; }
    return 'ok';
  }
  finishRec() { if (this.rec) { this.lastChange = this.rec; this.rec = null; } }

  // motions → a Target, or 'wait' for more keys, 'bad' if unknown, 'fail' if it can't move
  target(k: string, n: number, op?: string): Target | 'wait' | 'bad' | 'fail' {
    const L = this.lines, r = this.r, c = this.c;
    const rep = (f: (this: Vim, r: number, c: number) => Pos) => { let p = { r, c }; for (let i = 0; i < n; i++) p = f.call(this, p.r, p.c); return p; };
    const line = (nr: number) => Math.max(0, Math.min(L.length - 1, nr));
    switch (k) {
      case 'h': return { r, c: Math.max(0, c - n) };
      case 'l': return { r, c: Math.min(c + n, L[r].length) };
      case 'j': case 'k': return { r: line(r + (k === 'j' ? n : -n)), c: this.want, want: this.want, linewise: true };
      case '0': return { r, c: 0 };
      case '^': return { r, c: this.firstNB(r) };
      case '$': { const nr = line(r + n - 1); return { r: nr, c: Math.max(0, L[nr].length - 1), inclusive: true, want: Infinity }; }
      case 'G': case 'gg': {
        const nr = line(this.hasCount ? n - 1 : k === 'G' ? L.length - 1 : 0);
        return { r: nr, c: this.firstNB(nr), linewise: true };
      }
      case 'w': {
        if (op === 'c' && this.cls(L[r][c])) { // cw acts like ce
          let p = { r, c: c - 1 };
          for (let i = 0; i < n; i++) p = this.wordEnd(p.r, p.c);
          return { ...p, inclusive: true };
        }
        let p = { r, c }, prev = p;
        for (let i = 0; i < n; i++) { prev = p; p = this.wordFwd(p.r, p.c); }
        if (op && p.r > prev.r) p = { r: prev.r, c: L[prev.r].length }; // dw stops at end of line
        return p;
      }
      case 'e': return { ...rep(this.wordEnd), inclusive: true };
      case 'b': return rep(this.wordBack);
      case ';': case ',': {
        if (!this.lastFind) return 'fail';
        const { cmd, ch } = this.lastFind;
        const flip = { f: 'F', F: 'f', t: 'T', T: 't' } as const;
        return this.find(k === ';' ? cmd : flip[cmd], ch, n, true);
      }
    }
    if (k === 'g') return 'wait';
    if ('fFtT'.includes(k[0])) return k.length === 1 ? 'wait' : this.find(k[0] as FindCmd, k[1], n, false);
    if (op && 'ia'.includes(k[0])) return k.length === 1 ? 'wait' : this.textObj(k) || 'bad';
    return 'bad';
  }

  wordFwd(r: number, c: number): Pos {
    const L = this.lines; let line = L[r];
    const k = this.cls(line[c]);
    if (k) while (c < line.length && this.cls(line[c]) === k) c++;
    for (;;) {
      if (c >= line.length) {
        if (r >= L.length - 1) return { r, c: line.length };
        line = L[++r]; c = 0;
        if (!line.length) return { r, c: 0 };
      } else if (!this.cls(line[c])) c++;
      else return { r, c };
    }
  }
  wordEnd(r: number, c: number): Pos {
    const L = this.lines; c++;
    for (;;) {
      if (c >= L[r].length) {
        if (r >= L.length - 1) return { r, c: Math.max(0, L[r].length - 1) };
        r++; c = 0;
      } else if (!this.cls(L[r][c])) c++;
      else break;
    }
    const k = this.cls(L[r][c]);
    while (c + 1 < L[r].length && this.cls(L[r][c + 1]) === k) c++;
    return { r, c };
  }
  wordBack(r: number, c: number): Pos {
    const L = this.lines; c--;
    for (;;) {
      if (c < 0) {
        if (r === 0) return { r: 0, c: 0 };
        c = L[--r].length - 1;
        if (c < 0) return { r, c: 0 };
      } else if (!this.cls(L[r][c])) c--;
      else break;
    }
    const k = this.cls(L[r][c]);
    while (c > 0 && this.cls(L[r][c - 1]) === k) c--;
    return { r, c };
  }

  find(cmd: FindCmd, ch: string, n: number, again: boolean): Target | 'fail' {
    if (!again) this.lastFind = { cmd, ch };
    const line = this.lines[this.r]; let c = this.c;
    for (let i = 0; i < n; i++) {
      const skip = again || i > 0 ? 1 : 0; // so ;/count after t doesn't get stuck on the same char
      let pos: number;
      if (cmd === 'f') pos = line.indexOf(ch, c + 1);
      else if (cmd === 't') pos = line.indexOf(ch, c + 1 + skip);
      else if (cmd === 'F') pos = c - 1 < 0 ? -1 : line.lastIndexOf(ch, c - 1);
      else pos = c - 1 - skip < 0 ? -1 : line.lastIndexOf(ch, c - 1 - skip);
      if (pos < 0) return 'fail';
      c = cmd === 't' ? pos - 1 : cmd === 'T' ? pos + 1 : pos;
    }
    return { r: this.r, c, inclusive: cmd === 'f' || cmd === 't' };
  }

  // ponytail: text objects only look at the current line
  textObj(k: string): Target | null {
    const [ia, ch] = k;
    const line = this.lines[this.r], r = this.r, c = this.c;
    const span = (s: number, e: number) => (ia === 'i' ? { start: { r, c: s + 1 }, r, c: e } : { start: { r, c: s }, r, c: e + 1 });
    if (ch === 'w') {
      const k = this.cls(line[c]); let s = c, e = c;
      while (s > 0 && this.cls(line[s - 1]) === k) s--;
      while (e < line.length && this.cls(line[e]) === k) e++;
      if (ia === 'a' && k) {
        const e0 = e;
        while (e < line.length && !this.cls(line[e])) e++;
        if (e === e0) while (s > 0 && !this.cls(line[s - 1])) s--;
      }
      return { start: { r, c: s }, r, c: e };
    }
    if (`"'\``.includes(ch)) {
      const q: number[] = [];
      for (let i = 0; i < line.length; i++) if (line[i] === ch) q.push(i);
      for (let i = 0; i + 1 < q.length; i += 2) if (c <= q[i + 1]) return span(q[i], q[i + 1]);
      return null;
    }
    const pr = ({ '(': '()', ')': '()', b: '()', '{': '{}', '}': '{}', B: '{}', '[': '[]', ']': '[]', '<': '<>', '>': '<>' } as Record<string, string>)[ch];
    if (!pr) return null;
    const [o, cl] = pr;
    let s = -1, e = -1, d = 0;
    for (let i = c; i >= 0; i--) {
      if (line[i] === cl && i !== c) d++;
      else if (line[i] === o) { if (!d) { s = i; break; } d--; }
    }
    if (s < 0) return null;
    d = 0;
    for (let i = s + 1; i < line.length; i++) {
      if (line[i] === o) d++;
      else if (line[i] === cl) { if (!d) { e = i; break; } d--; }
    }
    return e < 0 ? null : span(s, e);
  }

  opLines(op: string, n: number) {
    const a = this.r, b = Math.min(a + n - 1, this.lines.length - 1);
    this.reg = { text: this.lines.slice(a, b + 1).join('\n'), linewise: true };
    if (op === 'y') return;
    if (op === 'c') { this.lines.splice(a, b - a + 1, ''); this.c = 0; this.mode = 'insert'; return; }
    this.lines.splice(a, b - a + 1);
    if (!this.lines.length) this.lines = [''];
    this.r = Math.min(a, this.lines.length - 1); this.c = this.firstNB(this.r);
  }

  opRange(op: string, t: Target) {
    if (t.linewise) {
      const a = Math.min(this.r, t.r);
      const n = Math.abs(this.r - t.r) + 1;
      this.r = a;
      return this.opLines(op, n);
    }
    let s = { r: this.r, c: this.c }, e = { r: t.r, c: t.c };
    if (t.start) s = t.start;
    else if (e.r < s.r || (e.r === s.r && e.c < s.c)) [s, e] = [e, s];
    const L = this.lines;
    const ec = Math.min(t.inclusive ? e.c + 1 : e.c, L[e.r].length);
    this.reg = {
      text: s.r === e.r ? L[s.r].slice(s.c, ec) : [L[s.r].slice(s.c), ...L.slice(s.r + 1, e.r), L[e.r].slice(0, ec)].join('\n'),
      linewise: false,
    };
    this.r = s.r; this.c = s.c;
    if (op === 'y') return;
    L.splice(s.r, e.r - s.r + 1, L[s.r].slice(0, s.c) + L[e.r].slice(ec));
    if (op === 'c') this.mode = 'insert';
  }

  paste(after: boolean, n: number) {
    const { text, linewise } = this.reg;
    const t = Array(n).fill(text).join(linewise ? '\n' : '');
    if (linewise) {
      const at = this.r + (after ? 1 : 0);
      this.lines.splice(at, 0, ...t.split('\n'));
      this.r = at; this.c = this.firstNB(at);
      return;
    }
    if (!t) return;
    const l = this.lines[this.r], c = after && l.length ? this.c + 1 : this.c;
    const parts = t.split('\n'), last = parts.length - 1;
    parts[0] = l.slice(0, c) + parts[0];
    const endC = parts[last].length - 1;
    parts[last] += l.slice(c);
    this.lines.splice(this.r, 1, ...parts);
    this.r += last; this.c = endC;
  }

  command(p: string, k: string, n: number): Res {
    const L = this.lines;
    const ins = (fn: () => void) => this.change(p, () => { fn(); this.mode = 'insert'; });
    const alias = ({ x: 'dl', X: 'dh', D: 'd$', C: 'c$', s: 'cl', S: 'cc' } as Record<string, string>)[k];
    if (alias) return this.exec(n + alias);
    switch (k) {
      case 'i': return ins(() => {});
      case 'a': return ins(() => { if (L[this.r].length) this.c++; });
      case 'I': return ins(() => { this.c = this.firstNB(this.r); });
      case 'A': return ins(() => { this.c = L[this.r].length; });
      case 'o': return ins(() => { L.splice(this.r + 1, 0, ''); this.r++; this.c = 0; });
      case 'O': return ins(() => { L.splice(this.r, 0, ''); this.c = 0; });
      case 'p': case 'P': return this.change(p, () => this.paste(k === 'p', n));
      case 'J': return this.change(p, () => {
        if (this.r + 1 >= L.length) return;
        const a = L[this.r].replace(/\s+$/, ''), b = L[this.r + 1].replace(/^\s+/, '');
        L.splice(this.r, 2, b ? a + ' ' + b : a); this.c = a.length;
      });
      case '~': return this.change(p, () => {
        const l = L[this.r], end = Math.min(this.c + n, l.length);
        const sw = [...l.slice(this.c, end)].map(ch => (ch === ch.toUpperCase() ? ch.toLowerCase() : ch.toUpperCase())).join('');
        L[this.r] = l.slice(0, this.c) + sw + l.slice(end); this.c = end;
      });
      case 'u': {
        const s = this.undo.pop();
        if (!s) this.msg = 'already at oldest change';
        else { this.lines = s.lines; this.r = s.r; this.c = s.c; this.clamp(); this.want = this.c; }
        return 'ok';
      }
      case '.': {
        this.pending = '';
        const keys = this.lastChange;
        for (let i = 0; i < n; i++) keys.forEach(key => this.key(key));
        return 'ok';
      }
      case 'r': return 'wait';
    }
    if (k[0] === 'r' && k.length === 2) {
      if (this.c + n > L[this.r].length) return 'ok';
      return this.change(p, () => {
        const l = L[this.r];
        L[this.r] = l.slice(0, this.c) + k[1].repeat(n) + l.slice(this.c + n); this.c += n - 1;
      });
    }
    return 'bad';
  }

  insertKey(k: string) {
    if (this.rec) this.rec.push(k);
    const L = this.lines, l = L[this.r];
    if (k === '<Esc>') { this.mode = 'normal'; this.c--; this.clamp(); this.want = this.c; this.finishRec(); return; }
    if (k === '<CR>') { L.splice(this.r, 1, l.slice(0, this.c), l.slice(this.c)); this.r++; this.c = 0; return; }
    if (k === '<BS>') {
      if (this.c > 0) { L[this.r] = l.slice(0, this.c - 1) + l.slice(this.c); this.c--; }
      else if (this.r > 0) { const prev = L[this.r - 1]; L.splice(this.r - 1, 2, prev + l); this.r--; this.c = prev.length; }
      return;
    }
    if (k.length !== 1) return;
    L[this.r] = l.slice(0, this.c) + k + l.slice(this.c); this.c++;
  }
}

// one attempt at a level: make the buffer equal goal
class Run {
  vim: Vim; keys = 0; done = false;
  constructor(public level: Pick<Level, 'start' | 'goal'>) {
    this.vim = new Vim(level.start);
    this.check();
  }
  press(k: string) {
    if (this.done) return true;
    this.keys++; this.vim.key(k); this.check();
    return this.done;
  }
  check() {
    this.done = this.vim.mode === 'normal' && this.vim.text === this.level.goal;
  }
}

// which spells (level ids) a (partial) normal-mode command needs
const HEAD: Record<string, SpellId> = { h: 'hjkl', j: 'hjkl', k: 'hjkl', l: 'hjkl', w: 'words', b: 'words', e: 'words', 0: 'edges', '^': 'edges', $: 'edges',
  G: 'counts', g: 'counts', f: 'find', F: 'find', t: 'find', T: 'find', ';': 'find', ',': 'find', x: 'x', X: 'x', i: 'hjkl', a: 'insert',
  I: 'lines', A: 'lines', o: 'lines', O: 'lines', J: 'lines', D: 'motions', C: 'change', s: 'change', S: 'change',
  r: 'replace', '~': 'replace', p: 'yank', P: 'yank', u: 'dot', '.': 'dot' };
const OPS: Record<string, SpellId> = { d: 'delete', c: 'change', y: 'yank' };
function needs(cmd: string): SpellId[] {
  const [, n1, op, n2, h] = cmd.match(/^([1-9]\d*)?([dcy])?([1-9]\d*)?(.?)/)!;
  const out: (SpellId | undefined)[] = [];
  if (n1 || n2) out.push('counts');
  if (op) out.push(OPS[op]);
  if (h && h !== op) out.push(op && 'ia'.includes(h) ? 'inside' : HEAD[h]);
  return out.filter((s): s is SpellId => !!s);
}
// returns the first unlearned spell this key would use, or null
const locked = (v: Vim, k: string, learned: ReadonlySet<string>): SpellId | null => (v.mode === 'insert' || k.length > 1 ? null : needs(v.pending + k).find(s => !learned.has(s)) || null);

const stars = (lv: { par: number }, keys: number) => (keys <= lv.par ? 3 : keys <= lv.par * 1.5 ? 2 : 1);

const M = 'I. The Meadow — movement', W = 'II. The Workshop — editing', B = 'III. The Tower — mastery';
const LEVELS: Lesson[] = [
  {
    id: 'hjkl', world: M, title: 'Modes and first steps',
    learn: 'vim has two modes. In NORMAL mode every key is a command: h j k l move the cursor. i switches to INSERT mode, where keys type text, and Esc brings you back to NORMAL. Walk to each gap, press i, type the missing letter, then Esc.',
    keys: [['h', 'left'], ['j', 'down'], ['k', 'up'], ['l', 'right'], ['i', 'insert mode'], ['Esc', 'normal mode']],
    start: 'hlp the\nhro\nfx it',
    goal: 'help the\nhero\nfix it',
    par: 12, solution: 'lie<Esc>jie<Esc>jii<Esc>',
  },
  {
    id: 'words', world: M, title: 'Word hopping',
    learn: 'w jumps to the start of the next word, b back to the start of the previous one, e to the end of a word. Letters are missing near the edges of words: hop there, then i.',
    keys: [['w', 'next word'], ['b', 'back a word'], ['e', 'end of word']],
    start: 'jump ver the wors',
    goal: 'jump over the words',
    par: 10, solution: 'wio<Esc>eeeid<Esc>',
  },
  {
    id: 'edges', world: M, title: 'Edges of the world',
    learn: '0 goes to the very start of the line, ^ to the first non-blank character, $ to the end. The gaps sit at the edges.',
    keys: [['0', 'line start'], ['^', 'first non-blank'], ['$', 'line end']],
    start: '    egins after spaces\nend of the line is a gm\nnd the start of this one',
    goal: '    begins after spaces\nend of the line is a gem\nand the start of this one',
    par: 14, solution: '^ib<Esc>j$ie<Esc>j0ia<Esc>',
  },
  {
    id: 'counts', world: M, title: 'Leaps and counts',
    learn: 'Put a number before a motion to repeat it: 5k goes up 5 lines. G jumps to the last line, gg to the first, and 7G / 7gg to line 7.',
    keys: [['G', 'last line'], ['gg', 'first line'], ['5k', 'count + motion'], ['3gg', 'go to line 3']],
    start: 'start here, the gaps are far away\no here with 2gg\nline 3\nline 4\nline 5\nline 6\nry 5k from the bottom (line 7)\nline 8\nline 9\nline 10\nline 11\nhe bottom: press G',
    goal: 'start here, the gaps are far away\ngo here with 2gg\nline 3\nline 4\nline 5\nline 6\ntry 5k from the bottom (line 7)\nline 8\nline 9\nline 10\nline 11\nthe bottom: press G',
    par: 15, solution: 'Git<Esc>5kit<Esc>2ggig<Esc>',
  },
  {
    id: 'find', world: M, title: 'The seeker',
    learn: 'f{char} jumps to the next {char} on the line, t{char} stops just before it. F and T search backwards. ; repeats the last find, , repeats it in reverse.',
    keys: [['fx', 'find x'], ['tx', 'till x'], ['F T', 'backwards'], [';', 'repeat'], [',', 'repeat reversed']],
    start: 'find the x, then the fx, then the bx',
    goal: 'find the ox, then the fox, then the box',
    par: 15, solution: 'fxio<Esc>;;io<Esc>;;io<Esc>',
  },
  {
    id: 'x', world: W, title: 'x marks the typo',
    learn: 'Now you take letters away. x deletes the character under the cursor. Lines that still differ are marked red.',
    keys: [['x', 'delete char'], ['X', 'delete char before']],
    start: 'Thhe catt saat onn the mat.',
    goal: 'The cat sat on the mat.',
    par: 11, solution: 'lxftxfaxfnx',
  },
  {
    id: 'insert', world: W, title: 'Insert mode',
    learn: 'i inserts before the cursor, a appends after it. Type your text, then press Esc (or Ctrl-[) to return to normal mode. The level only completes in normal mode.',
    keys: [['i', 'insert before'], ['a', 'append after'], ['Esc', 'back to normal']],
    start: 'Th quick brwn fox',
    goal: 'The quick brown fox',
    par: 9, solution: 'lae<Esc>fwio<Esc>',
  },
  {
    id: 'lines', world: W, title: 'Line magic',
    learn: 'A appends at the end of the line, I inserts at the first non-blank. o opens a new line below, O opens one above.',
    keys: [['A', 'append at end'], ['I', 'insert at start'], ['o', 'open below'], ['O', 'open above']],
    start: 'const a = 1\nconst b = 2',
    goal: '// numbers\nconst a = 1;\nconst b = 2;\n// done',
    par: 30, solution: 'A;<Esc>jA;<Esc>o// done<Esc>ggO// numbers<Esc>',
  },
  {
    id: 'delete', world: W, title: 'The cutter',
    learn: 'd is an operator: combine it with a motion. dw deletes a word, dd deletes a whole line, 3dd deletes three.',
    keys: [['dw', 'delete word'], ['dd', 'delete line'], ['3dd', 'delete 3 lines']],
    start: 'keep this line\ndelete this line\nkeep the very very good words\ndelete me too',
    goal: 'keep this line\nkeep the very good words',
    par: 10, solution: 'jddwwdwjdd',
  },
  {
    id: 'motions', world: W, title: 'Operator + motion',
    learn: 'Any motion works after d: d$ (or D) deletes to the end of the line, dt) deletes until a ")", df; deletes through the ";", d0 to the start.',
    keys: [['D', 'delete to end'], ['dt{c}', 'delete till'], ['df{c}', 'delete through'], ['d0', 'delete to start']],
    start: 'console.log("debug"); // TODO remove this\nlet total = (price + tax) * 2 + bonus;',
    goal: 'console.log("debug");\nlet total = bonus;',
    par: 10, solution: 'f;lDjF(dtb',
  },
  {
    id: 'change', world: W, title: 'Change word',
    learn: 'c is delete + insert. cw changes from the cursor to the end of the word, cc changes the whole line, C changes to the end of the line.',
    keys: [['cw', 'change word'], ['cc', 'change line'], ['C', 'change to end']],
    start: 'I love cats and dogs',
    goal: 'I love vim and tmux',
    par: 17, solution: 'wwcwvim<Esc>wwcwtmux<Esc>',
  },
  {
    id: 'inside', world: B, title: 'Inside things',
    learn: 'Text objects: after an operator, i{obj} means "inside", a{obj} means "around". ciw changes the word under the cursor wherever you are in it, ci" changes inside quotes, ci( inside parentheses.',
    keys: [['ciw', 'change inner word'], ['ci"', 'change in quotes'], ['ci(', 'change in parens'], ['da(', 'delete around parens']],
    start: 'greet("hello world", count(42))',
    goal: 'greet("hi", count(7))',
    par: 13, solution: 'ci"hi<Esc>f4ci(7<Esc>',
  },
  {
    id: 'replace', world: B, title: 'Shape shifter',
    learn: 'r{char} replaces one character without entering insert mode. ~ toggles the case and moves right.',
    keys: [['r{c}', 'replace char'], ['~', 'toggle case']],
    start: 'hello Vim world, i lovE it',
    goal: 'Hello Vim World, I love it',
    par: 11, solution: '~fw~fi~fEre',
  },
  {
    id: 'yank', world: B, title: 'Copy cat',
    learn: 'y yanks (copies) with any motion: yw a word, yy a line. p puts after the cursor (or below for lines), P puts before. Anything you delete can be put too.',
    keys: [['yw', 'yank word'], ['yy', 'yank line'], ['p', 'put after'], ['P', 'put before']],
    start: 'hip hooray\n- item',
    goal: 'hip hip hooray\n- item\n- item',
    par: 7, solution: 'ywPjyyp',
  },
  {
    id: 'dot', world: B, title: 'Echoes',
    learn: '. repeats your last change, the most powerful key in vim. Change one foo, then jump to the next and press . — made a mistake? u undoes.',
    keys: [['.', 'repeat change'], ['u', 'undo']],
    start: 'foo = foo + foo * foo',
    goal: 'bar = bar + bar * bar',
    par: 15, solution: 'cwbar<Esc>ff.ff.ff.',
  },
  {
    id: 'boss', world: B, title: 'Boss: the refactor',
    learn: 'Everything you know. Rename the function, add a parameter, fix the math, remove dead code.',
    keys: [['cw', ''], ['f F', ''], ['r', ''], ['i', ''], ['dd', '']],
    start: 'function add(a, b) {\n  return a - b;\n  console.log("unreachable");\n}',
    goal: 'function sum(a, b, c) {\n  return a + b + c;\n}',
    par: 30, solution: 'wcwsum<Esc>f)i, c<Esc>jF-r+f;i + c<Esc>jdd',
  },
];

export { Vim, Run, LEVELS, tokens, stars, needs, locked };
