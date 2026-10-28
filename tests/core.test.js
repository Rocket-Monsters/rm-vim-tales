// bun run test — every level must be solvable by its solution within par, plus engine spot checks
import assert from 'node:assert';
import { Vim, Run, LEVELS, tokens, needs, locked } from '../src/core/engine.ts';
import { World, makeRound, rng, upTo, GEN, solveSteps, ROUNDS, MOVE_SPELLS } from '../src/core/game.ts';
import { CHAPTERS, MONSTERS } from '../src/core/story.ts';

for (const lv of LEVELS) {
  const run = new Run(lv);
  tokens(lv.solution).forEach(k => run.press(k));
  assert(run.done, `${lv.id}: not solved, buffer:\n${run.vim.text}`);
  assert(run.keys <= lv.par, `${lv.id}: ${run.keys} keys > par ${lv.par}`);
}

const t = (start, keys) => { const v = new Vim(start); tokens(keys).forEach(k => v.key(k)); return v.text; };
assert.equal(t('one two\nthree', 'wdw'), 'one \nthree');
assert.equal(t('foo bar', 'dwu'), 'foo bar');
assert.equal(t('a b c', 'xu.'), ' b c');
assert.equal(t('hello', 'A!<Esc>0.'), 'hello!!');
assert.equal(t('say (a, b) ok', 'fbdi('), 'say () ok');
assert.equal(t('x "abc" y', 'ci"Z<Esc>'), 'x "Z" y');
assert.equal(t('a\nb\nc', 'jddp'), 'a\nc\nb');
assert.equal(t('a-b-c-d', 't-;;D'), 'a-b-');
assert.equal(t('one two three', 'wdaw'), 'one three');
assert.equal(t('l1\nl2\nl3', 'jdG'), 'l1');
console.log(`ok: ${LEVELS.length} levels`);

// gating: every handcrafted solution uses only spells learned so far
const playGated = (lv, learned) => {
  const run = new Run(lv);
  for (const k of tokens(lv.solution)) {
    const miss = locked(run.vim, k, learned);
    assert(!miss, `${lv.id || 'round'}: solution uses unlearned ${miss}`);
    run.press(k);
  }
  return run;
};
for (const lv of LEVELS) playGated(lv, upTo(lv.id));

// generated rounds: solvable, par = solution length, only learned spells
for (const lv of LEVELS) for (let seed = 1; seed <= 6; seed++) {
  const R = rng(seed);
  for (let d = 1; d < (lv.id === 'boss' ? 8 : ROUNDS); d++) {
    const round = makeRound(lv.id, R, d, upTo(lv.id));
    const run = playGated(round, upTo(lv.id));
    assert(run.done, `${lv.id} seed ${seed} round ${d} unsolved:\n${run.vim.text}\n--- goal\n${round.goal}`);
    assert.equal(run.keys, round.par, `${lv.id} par`);
  }
}
console.log('ok: generated rounds');

// story maps: equal widths, every level has sage+monster, monsters gate the path in order
const seen = [];
CHAPTERS.forEach((ch, ci) => {
  const m = ch.map, W = m[0].length;
  m.forEach((row, r) => assert.equal(row.length, W, `${ch.name} row ${r} width`));
  assert.equal(m.join('').split('&').length - 1, ch.npcs.length, `${ch.name} npc count`);
  assert.equal(ch.sages.length, ch.levels.length, `${ch.name} sage count`);
  assert(m.join('').split('+').length >= m.join('').split('|').length, `${ch.name}: more doors than keys`);
  ch.levels.forEach(id => { assert(MONSTERS[id], `${id} monster missing`); seen.push(id); });
  const prior = CHAPTERS.slice(0, ci).flatMap(c => c.levels);
  // all cells the hero can stand on, using the real movement rules (roamers off, doors open)
  // explore with the real movement rules (roamers off, doors open); gone = every item already collected
  const explore = (learnedN, beaten, gone, sources, danger) => {
    const w = new World(ch);
    w.roamers = [];
    const learned = new Set(['hjkl', ...prior, ...ch.levels.slice(0, learnedN)]);
    w.lines.forEach((row, r) => w.lines[r] = row.replace(/[A-E|$%+]/g, t => ('$%+'.includes(t) ? (gone ? ' ' : t) : t === '|' || t.charCodeAt(0) - 65 < beaten ? ' ' : t)));
    const base = [...w.lines];
    const moves = ['h', 'j', 'k', 'l'];
    if (learned.has('words')) moves.push('w', 'b', 'e');
    if (learned.has('edges')) moves.push('0', '^', '$');
    if (learned.has('counts')) { moves.push('gg', 'G'); for (let n = 2; n <= m.length; n++) moves.push(n + 'G'); }
    if (learned.has('find')) for (const t of new Set(base.join('').replace(/ /g, ''))) for (const f of 'fFtT') moves.push(f + t);
    const cells = new Set(sources.map(p => p + '')), q = [...sources], back = new Map();
    while (q.length) {
      const [r, c] = q.pop();
      for (const mv of moves) {
        w.nav.lines = [...base]; w.place(r, c);
        for (const k of tokens(mv)) w.key(k, learned);
        const to = [w.r, w.c] + '';
        if (danger && 'hjkl'.includes(mv) && danger.has([r, c] + '') && danger.get([r, c] + '') === danger.get(to)) continue;
        if (!back.has(to)) back.set(to, new Set());
        back.get(to).add([r, c] + '');
        if (!cells.has(to)) { cells.add(to); q.push([w.r, w.c]); }
      }
    }
    return { cells, back };
  };
  const s0 = [m.findIndex(r => r.includes('@')), m.find(r => r.includes('@')).indexOf('@')];
  const reach = (learnedN, beaten) => {
    const { cells } = explore(learnedN, beaten, false, [s0]);
    // no traps: even after collecting all treasure, every cell you reached must lead back to the start
    const { back } = explore(learnedN, beaten, true, [...cells].map(p => p.split(',').map(Number)));
    const home = new Set([s0 + '']), bq = [s0 + ''];
    while (bq.length) for (const p of back.get(bq.pop()) || []) if (!home.has(p)) { home.add(p); bq.push(p); }
    const traps = [...cells].filter(p => !home.has(p));
    assert(!traps.length, `${ch.name}: stuck after reaching ${traps.slice(0, 6).join(' | ')} (learned ${learnedN}, beaten ${beaten})`);
    return cells;
  };
  const at = t => { for (let r = 0; r < m.length; r++) { const c = m[r].indexOf(t); if (c >= 0) return [r, c]; } };
  const touches = (cells, t) => { const [r, c] = at(t); return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dr, dc]) => cells.has([r + dr, c + dc] + '')); };
  ch.levels.forEach((_, i) => {
    const s = String.fromCharCode(97 + i), M = s.toUpperCase();
    assert(touches(reach(i, i), s), `${ch.name}: sage ${s} unreachable`);
    const cells = reach(i + 1, i);
    assert(touches(cells, M), `${ch.name}: monster ${M} unreachable`);
    if (i + 1 < ch.levels.length) assert(!touches(cells, String.fromCharCode(98 + i)), `${ch.name}: sage after ${s} not gated`);
    if (at('>')) assert(!cells.has(at('>') + ''), `${ch.name}: exit reachable before ${M}`);
  });
  // roamers: patrol-track cells squeezed between walls (tunnel cells) → track id
  const danger = new Map(), w0 = new World(ch);
  w0.roamers.forEach((mo, id) => {
    const [dr, dc] = mo.dr ? [1, 0] : [0, 1], track = [];
    for (const sgn of [1, -1]) for (let r = mo.r, c = mo.c; ' .='.includes(w0.at(r, c) ?? '#'); r += dr * sgn, c += dc * sgn) track.push([r, c]);
    const side = ([r, c]) => w0.walkable(r + dc, c + dr) || w0.walkable(r - dc, c - dr);
    track.filter(p => !side(p)).forEach(p => danger.set(p + '', id));
  });
  ch.levels.forEach((_, i) => assert(touches(explore(i + 1, i, false, [s0], danger).cells, String.fromCharCode(65 + i)), `${ch.name}: monster ${String.fromCharCode(65 + i)} only reachable by walking through a patrolled tunnel`));
  if (at('>')) assert(explore(ch.levels.length, ch.levels.length, false, [s0], danger).cells.has(at('>') + ''), `${ch.name}: exit only reachable through a patrolled tunnel`);
  const all = reach(ch.levels.length, ch.levels.length);
  if (at('>')) assert(all.has(at('>') + ''), `${ch.name}: exit unreachable`);
  m.forEach((row, r) => [...row].forEach((t, c) => {
    if ('$%+'.includes(t)) assert(all.has([r, c] + ''), `${ch.name}: item ${t} at ${r},${c} unreachable`);
  }));
});
assert.deepEqual(seen, LEVELS.map(l => l.id), 'chapters must cover every level in order');
console.log(`ok: ${CHAPTERS.length} chapters`);

// sprites: every sprite the story uses exists and fits 16x16
import { grid, NAMES } from '../src/core/sprites.ts';
import { UI, LESSONS_ES, fingers } from '../src/ui/i18n.js';
const used = [...CHAPTERS.flatMap(ch => [ch.wall, ch.roamer, ...ch.sages.map(p => p.spr), ...ch.npcs.map(p => p.spr)]), ...Object.values(MONSTERS).map(m => m.spr), 'hero', 'chest', 'heart', 'key', 'door', 'portal', 'house', 'boulder', 'tuft', 'water', 'stone', 'path', 'sand'];
for (const n of used) assert(NAMES.includes(n), `sprite ${n} missing`);
for (const n of NAMES) { const g = grid(n); assert(g.length <= 16 && g.every(r => r.length <= 16), `sprite ${n} bigger than 16x16`); }
// i18n: Spanish covers every UI string and every lesson key
const keysOf = o => Object.keys(o).sort().join();
assert.equal(keysOf(UI.es), keysOf(UI.en), 'UI.es keys differ from UI.en');
assert.equal(UI.es.onboard.length, UI.en.onboard.length);
for (const lv of LEVELS) assert.equal(LESSONS_ES[lv.id]?.[2].length, lv.keys.length, `LESSONS_ES.${lv.id} key count`);
// fingers: every typed char in a lesson key has a finger; spot-check the layout
for (const lv of LEVELS) for (const [k] of lv.keys) assert.equal(fingers(k).length, new Set(k === 'Esc' ? [k] : k.replace(/\{\w+\}|\s/g, '')).size, `finger missing for ${k}`);
assert.deepEqual(fingers('dw'), [['d', ['lm', null]], ['w', ['lr', null]]]);
assert.deepEqual(fingers('$'), [['$', ['li', 'rp']]]);
assert.deepEqual(fingers('O'), [['O', ['rr', 'lp']]]);
assert.deepEqual(fingers('f{c}'), [['f', ['li', null]]]);
console.log(`ok: ${NAMES.length} sprites, en/es text, fingers`);
