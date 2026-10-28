// vim-tales game controller: drives the DOM rendered by the Solid components (menu, overworld, dialog, battle, : command line).
// ponytail: imperative DOM updates by id; move state into Solid signals component by component.
import { Run, LEVELS, stars, locked } from '../core/engine.ts';
import { World, replayBonus, makeRound, useText, rng, pick as pickR, roundSecs, LV as LV_EN, ROUNDS, BOSS_ROUNDS, FIGHTS } from '../core/game.ts';
import { CHAPTERS, VILLAGES, ITEMS, MONSTERS, ROAMERS, ENDING } from '../core/story.ts';
import { sprite, outfit, groundTiles, NAMES } from '../core/sprites.ts';
import { CODE_LANGS, download } from '../core/text.ts';
import { UI, LESSONS_ES, fingers } from './i18n.js';

// starts the game on the mounted markup, returns a cleanup
export function startGame() {
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);
  const MAX_HEARTS = 5, SAVE = 'rmvt-rpg';
  // pace: seconds on the battle clock per keystroke of par
  const DIFF = { easy: { hearts: 5, hp: 50, pace: 4 }, normal: { hearts: 3, hp: 30, pace: 2.5 }, hard: { hearts: 1, hp: 15, pace: 1.5 } };

  // every sprite becomes a CSS class once (.s-rat), so map tiles stay tiny <i> tags
  const css = document.createElement('style');
  css.textContent = NAMES.map(n => `.s-${n}{background-image:url("${sprite(n)}")}`).join('\n');
  // ground textures are generated per chapter (.g-f0 … .g-isle), swapped in when the chapter changes
  const groundCss = document.createElement('style');
  // .s-hero is redrawn with the costumes the hero wears, so every hero picture shows them
  const heroCss = document.createElement('style');
  document.head.append(css, groundCss, heroCss);
  let dressedAs = null;
  let groundOf = null;
  const img = (n, cls = '') => `<i class="spr s-${n} ${cls}"></i>`;

  // ---------- state ----------
  const browserLang = () => (navigator.language || '').startsWith('es') ? 'es' : 'en';
  // saves from before chapters V–VI (no v): the tower and its Victory Parade were stage 4, now 6.
  // A player who was in the tower goes to the chapter holding their first unbeaten lesson
  function migrate(s) {
    if (!s || s.v) return s;
    const re = id => id.replace(/^(v?)5\./, '$17.'), key = k => (k == 4 ? 6 : k === 'v4' ? 'v6' : k), best = s.best || {};
    s.opened = (s.opened || []).map(re); s.lore = (s.lore || []).map(re); s.seen = (s.seen || []).map(key);
    s.maps = Object.fromEntries(Object.entries(s.maps || {}).map(([k, v]) => [key(k), v]));
    if (s.ch === 4 && s.village) s.ch = 6;
    else if (s.ch === 4) { s.ch = Math.max(4, CHAPTERS.findIndex(ch => ch.levels.some(id => best[id] == null))); s.lines = s.pos = s.spawn = null; }
    return { ...s, v: 2 };
  }
  const fresh = () => ({ v: 2, ch: 0, lines: null, pos: null, spawn: null, learned: [], best: {}, seen: [], hearts: 3, gold: 0, keys: 0, done: false, opened: [], replays: {}, lore: [],
    name: 'Prompt', diff: 'normal', dojo: 0, lang: browserLang(), text: null,
    village: false, owned: [], wear: {}, maps: {} });
  let S = fresh();
  try { S = { ...S, ...migrate(JSON.parse(localStorage.getItem(SAVE))) }; } catch {}
  useText(S.text?.lines, S.text?.kind === 'code');
  let world, face = 1, B = null;
  // after each chapter's exit comes its festival village (same index), then the next chapter
  const CH = () => (S.village ? VILLAGES : CHAPTERS)[S.ch];
  const D_ = () => DIFF[S.diff] || DIFF.normal;
  const T = () => UI[S.lang] || UI.en;
  const tx = p => (p ? p[S.lang === 'es' ? 1 : 0] : '');
  // the story calls the hero Prompt; show the player's chosen name instead
  const nm = s => String(s).replace(/\bPROMPT\b/g, S.name.toUpperCase()).replace(/\bPrompt\b/g, S.name);
  // engine lessons are English; Spanish overrides title, learn and key descriptions
  const LV = new Proxy({}, { get: (_, id) => {
    const l = LV_EN[id], es = S.lang === 'es' && LESSONS_ES[id];
    return es ? { ...l, title: es[0], learn: es[1], keys: l.keys.map(([k, d], i) => [k, es[2][i] ?? d]) } : l;
  } });
  const learnedSet = () => new Set(['hjkl', ...S.learned]);
  const level = () => 1 + Object.keys(S.best).length;
  const spellKeys = id => LV[id].keys.map(k => k[0]).join(' ');
  function save() {
    S.lines = [...world.lines]; S.pos = { r: world.r, c: world.c };
    try { localStorage.setItem(SAVE, JSON.stringify(S)); } catch {}
  }
  // a save made before a map update keeps the old layout: reload the map, keep beaten gates open
  const shape = rows => rows.map(r => r.replace(/[$_♥%+|A-E@MW]/g, ' ')).join('\n');
  // the treasure ledger: S.opened holds the id of every chest taken this save, so no chest ever refills
  const chestId = i => `${S.village ? 'v' : ''}${S.ch + 1}.$${i + 1}`;
  function syncChests() {
    world.chests.forEach(({ r, c }, i) => {
      const id = chestId(i);
      if (world.at(r, c) !== '$' && !S.opened.includes(id)) S.opened.push(id);
      if (S.opened.includes(id)) world.set(r, c, '_');
    });
  }
  // lore pages heard this save: "<chapter>.L<n>", read back with :lore
  const loreId = (ch, i) => `${ch + 1}.L${i + 1}`;
  const chestsOpened = () => world.chests.filter((_, i) => S.opened.includes(chestId(i))).length;
  function loadWorld() {
    if (S.lines && shape(S.lines) !== shape(CH().map)) { S.lines = null; S.pos = null; S.spawn = null; }
    world = new World(CH(), S.lines);
    CH().levels.forEach((id, i) => { const p = S.best[id] != null && world.find(String.fromCharCode(65 + i)); if (p) world.set(p.r, p.c, ' '); });
    syncChests();
    if (S.pos) world.place(S.pos.r, S.pos.c);
    S.spawn ||= { ...world.start };
  }
  // static labels in the markup
  function applyLang() {
    document.documentElement.lang = S.lang;
    $('helpBtn').ariaLabel = T().helpTitle;
    if (drawerOpen()) toggleDrawer(true);
    const set = { mTag1: T().tag1, mTag2: T().tag2, mHelp: T().menuHelp, wHelp: T().wizHelp, dHelp: T().dojoHelp, bYour: T().yourText, bGoalH: T().goal, bHelp: T().battleHelp };
    for (const id in set) $(id).textContent = set[id];
  }

  // ---------- dialog: lines are [speaker, text, sprite?] ----------
  let Q = [], qDone = null, typing = null, full = '';
  const story = ls => ls.map(([spr, who, text]) => [spr === 'hero' ? S.name : tx(who), tx(text), spr]);
  const person = (p, text) => [tx(p.name), text, p.spr];
  const hero = text => [S.name, text, 'hero'];
  function say(lines, done) { Q = lines.slice(); qDone = done || null; nextLine(); }
  function nextLine() {
    const ln = Q.shift();
    if (!ln) { $('dialog').hidden = true; const f = qDone; qDone = null; if (f) f(); return; }
    $('dialog').hidden = false;
    $('who').innerHTML = (ln[2] ? img(ln[2], 'face') : '') + esc(nm(ln[0]));
    full = nm(ln[1]);
    let i = 0;
    clearInterval(typing);
    typing = setInterval(() => { $('say').textContent = full.slice(0, ++i); if (i >= full.length) { clearInterval(typing); typing = null; } }, 16);
  }
  function dialogKey(k) {
    if (k !== '<CR>' && k !== ' ') return;
    if (typing) { clearInterval(typing); typing = null; $('say').textContent = full; } else nextLine();
  }
  const note = t => { $('note').textContent = nm(t); };

  // ---------- overworld ----------
  const OBJ = { $: 'chest', _: 'chestOpen', '♥': 'heart', '+': 'key', '|': 'door', '>': 'portal', H: 'house' };
  function tile(t, r, c) {
    // anything standing in the water sits on a little sand island
    const ch = CH(), v = ((r * 7 + c * 13) ^ (r * c)) & 3, floor = t !== '#' && rowsAround(r, c).includes('~') && !/[ ]/.test(rowsAround(r, c)) ? 'g-isle' : 'g-f' + v;
    if (t === '#') return [floor, img(ch.wall)];
    if (t === '^') return [floor, img('boulder')];
    if (t === '~') return ['water g-water', ''];
    if (t === '=') return ['g-stone', ''];
    if (t === 'o') return ['g-isle', '<b class="isle">o</b>'];
    // bracket pillars: walkable, and % leaps to the partner
    if ('()[]{}'.includes(t)) return [floor, `<b class="pillar">${t}</b>`];
    if (t === '.') return [rowsAround(r, c).includes('~') ? 'g-isle' : 'g-path' + (v & 1), ''];
    if (OBJ[t]) return [floor + (t === '>' ? ' portal' : ''), img(OBJ[t])];
    if (t === '&') return [floor, img(ch.npcs[world.npcAt[r + ',' + c]].spr)];
    // a lore keeper you haven't heard yet shows a bouncing "?"
    if (t === 'L') { const i = world.loreAt[r + ',' + c]; return [floor, img(ch.lore[i].spr) + (S.lore.includes(loreId(S.ch, i)) ? '' : '<b class="talk">?</b>')]; }
    if (t === 'F') return [floor + ' fountain', img('fountain')];
    if (t === 'Y') return [floor + ' balloon', img('balloons')];
    // a sage you haven't talked to yet shows a bouncing "!" over their head
    if (t >= 'a' && t <= 'e') { const i = t.charCodeAt(0) - 97; return [floor, img(ch.sages[i].spr) + (S.learned.includes(ch.levels[i]) ? '' : '<b class="talk">!</b>')]; }
    if (t >= 'A' && t <= 'E') return [floor + ' foe-tile', img(MONSTERS[ch.levels[t.charCodeAt(0) - 65]].spr)];
    return [floor, ''];
  }
  // water meets land: the bank casts a shadow from above, foam laps the other sides
  const WET = '~=o';
  function shore(r, c) {
    const land = (dr, dc) => { const t = world.at(r + dr, c + dc); return t !== undefined && !WET.includes(t) && !(t === '.' && rowsAround(r + dr, c + dc).includes('~')); };
    const s = [];
    if (land(-1, 0)) s.push('inset 0 var(--p) #d8f3ff99', 'inset 0 calc(var(--p) * 4) #0005');
    if (land(1, 0)) s.push('inset 0 calc(var(--p) * -1) #d8f3ff99');
    if (land(0, -1)) s.push('inset var(--p) 0 #d8f3ff99');
    if (land(0, 1)) s.push('inset calc(var(--p) * -1) 0 #d8f3ff99');
    return s.length ? ` style="box-shadow:${s.join(',')}"` : '';
  }
  // a path tile surrounded by water is drawn as an island
  const rowsAround = (r, c) => [world.at(r, c - 1), world.at(r, c + 1), world.at(r - 1, c), world.at(r + 1, c)].join('');

  function draw() {
    const ch = CH(), rows = world.lines, ro = new Set(world.roamers.map(m => m.r + ',' + m.c));
    if (groundOf !== ch) {
      groundOf = ch;
      groundCss.textContent = Object.entries(groundTiles(ch.ground)).map(([k, url]) => `.${k}{background-image:url("${url}")}`).join('\n');
    }
    let h = '';
    rows.forEach((row, r) => {
      h += `<div class="g">${r + 1}</div>`;
      [...row].forEach((t, c) => {
        let [cls, e] = tile(t, r, c);
        if (r === world.r && c === world.c) e = `<span class="hero">${img('hero', face < 0 ? 'flip' : '')}</span>`;
        else if (ro.has(r + ',' + c)) e = `<span class="roam">${img(ch.roamer)}</span>`;
        h += `<div class="t ${cls}"${t === '~' ? shore(r, c) : ''}>${e}</div>`;
      });
    });
    const wear = Object.values(S.wear).join('+');
    if (wear !== dressedAs) { dressedAs = wear; heroCss.textContent = `.s-hero{background-image:url("${outfit(Object.values(S.wear))}")}`; }
    $('view').parentElement.classList.toggle('fest', !!S.village);
    const map = $('map');
    map.style.setProperty('--floor', ch.ground.ramp[1]);
    map.style.gridTemplateColumns = `auto repeat(${rows[0].length}, var(--t))`;
    map.innerHTML = h;
    map.querySelector('.hero').scrollIntoView({ block: 'center', inline: 'center' });
    $('mPending').textContent = world.nav.pending;
    hud();
  }
  function hud() {
    $('chap').textContent = tx(CH().name);
    $('hearts').innerHTML = img('heart').repeat(S.hearts) + img('heart', 'empty').repeat(Math.max(0, D_().hearts - S.hearts));
    $('gold').innerHTML = `${img('chest')} ${S.gold}`;
    $('chestsHud').innerHTML = `${img('chestOpen')} ${chestsOpened()}/${world.chests.length}`;
    $('keysHud').innerHTML = `${img('key')} ${S.keys}`;
    $('lv').textContent = `${S.name} · ${S.lang === 'es' ? 'NV' : 'LV'} ${level()}`;
    $('stars').textContent = `★ ${Object.values(S.best).reduce((a, b) => a + b, 0)}/${LEVELS.length * 3}`;
  }

  // standing on the exit with chests left: y leaves, any other key steps back to where you came from
  let exitAsk = null;
  function mapKey(k) {
    if (exitAsk) {
      const back = exitAsk; exitAsk = null;
      if (k === 'y') return nextChapter();
      world.place(back.r, back.c); note(T().stayed); save(); return draw();
    }
    if (k === '<CR>' || k === '<BS>') return;
    if (k.startsWith('Arrow')) return note(T().arrowCurse);
    const from = { r: world.r, c: world.c };
    const ev = world.key(k, learnedSet());
    if (ev.wait) return draw();
    note('');
    if (ev.locked === 'unknown') note(S.ch ? T().nothing : T().nothingWalk);
    else if (ev.locked === 'battle') note(T().battleOnly);
    else if (ev.locked) note(T().notLearned(LV[ev.locked].title));
    if (ev.face) face = ev.face;
    if (ev.blocked) note(T().cantLand);
    for (const t of ev.picked) {
      if (t === '$') { S.gold += 10; note(T().gold); syncChests(); }
      if (t === '♥') { S.hearts = Math.min(MAX_HEARTS, S.hearts + 1); note(T().heal); }
      if (t === '+') { S.keys++; note(T().keyFound); }
    }
    if (ev.looted) note(T().looted);
    if (ev.foe) { save(); draw(); return encounter(ev.foe); }
    if (ev.exit) {
      const left = world.chests.length - chestsOpened();
      if (!left) return nextChapter();
      exitAsk = from; note(T().leaveAsk(left)); save(); return draw();
    }
    if (ev.bump) bump(ev.bump);
    if ((ev.bump || ev.blocked) && ![[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dr, dc]) => world.walkable(world.r + dr, world.c + dc))) note(T().stuck);
    save(); draw();
  }

  function hurt() {
    S.hearts--;
    $('flash').style.opacity = .5; setTimeout(() => { $('flash').style.opacity = 0; }, 150);
    if (S.hearts <= 0) {
      S.hearts = D_().hearts; world.place(world.start.r, world.start.c);
      say([[CH().roamer === 'pointer' ? 'DR. CLICKER' : '', T().fainted, CH().roamer]], draw);
    } else {
      world.place(S.spawn.r, S.spawn.c);
      note(T().hurt);
    }
    save(); draw();
  }

  function bump({ r, c, t }) {
    const ch = CH();
    if (t >= 'a' && t <= 'e') {
      const sage = ch.sages[t.charCodeAt(0) - 97], id = ch.levels[t.charCodeAt(0) - 97];
      if (S.learned.includes(id)) return say([person(sage, LV[id].learn)]);
      return say([...sage.say.map(s => person(sage, tx(s))), person(sage, LV[id].learn), [T().newSpell, `${LV[id].title}: ${spellKeys(id)}`, 'chest']], () => {
        S.learned.push(id); S.spawn = { r: world.r, c: world.c }; save(); draw();
        if (id !== 'boss') teach(id);
      });
    }
    if (t >= 'A' && t <= 'E') {
      const id = ch.levels[t.charCodeAt(0) - 65], m = MONSTERS[id], taunt = person(m, tx(m.taunt));
      if (!S.learned.includes(id)) return say([taunt, hero(T().cantBeat)]);
      return say([taunt], () => startBattle(id, false));
    }
    if (t === '&') { const n = ch.npcs[world.npcAt[r + ',' + c]]; return say(n.say.map(s => person(n, tx(s))), n.act && (() => ACTS[n.act]())); }
    if (t === 'L') {
      const i = world.loreAt[r + ',' + c], p = ch.lore[i], id = loreId(S.ch, i), fresh = !S.lore.includes(id);
      if (fresh) S.lore.push(id);
      save(); draw();
      return say([person(p, `${tx(p.title)}: ${tx(p.fact)}`), ...(fresh ? [[T().lorePage, T().loreGot(tx(p.title), S.lore.length, LORE_N), 'keeper']] : [])]);
    }
    if (t === '|') {
      if (!S.keys) return note(T().locked);
      S.keys--; world.set(r, c, ' '); note(T().doorOpen);
    }
    if (t === 'H') note(T().home);
  }

  // every map in story order: chapter 0, its village, chapter 1, ... A map keeps its state (chests taken, doors open) when you leave it
  const STAGES = CHAPTERS.flatMap((_, ch) => [{ ch, village: false }, { ch, village: true }]);
  const stageKey = (ch, village) => (village ? 'v' + ch : ch);
  function goTo(ch, village) {
    S.maps[stageKey(S.ch, S.village)] = [...world.lines];
    S.ch = ch; S.village = village;
    S.lines = S.maps[stageKey(ch, village)] || null; S.pos = null; S.spawn = null;
    loadWorld(); save(); draw(); intro();
  }
  function nextChapter() {
    if (!S.village) goTo(S.ch, true);
    else if (S.ch + 1 < CHAPTERS.length) goTo(S.ch + 1, false);
  }
  function intro() {
    const key = stageKey(S.ch, S.village);
    if (S.seen.includes(key)) return;
    S.seen.push(key); save();
    say(story(CH().intro));
  }

  // ---------- battle ----------
  function lev(a, b) {
    let p = Array.from({ length: b.length + 1 }, (_, j) => j);
    for (let i = 1; i <= a.length; i++) {
      const q = [i];
      for (let j = 1; j <= b.length; j++) q[j] = Math.min(p[j] + 1, q[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      p = q;
    }
    return p[b.length];
  }
  // touching a roaming monster starts a quick timed fight of a random kind
  function encounter(roamer) {
    const kind = pickR(Math.random, Object.keys(FIGHTS)), name = tx(ROAMERS[CH().roamer]);
    say([[name, T().encounter(name, ...T().fights[kind]), CH().roamer]], () => startBattle(null, false, { roamer, kind }));
  }
  // a new spell: read its key cards, then use it in a practice round with the sage who taught it
  const teach = id => wizard(spellCards(id), () => startBattle(id, true, null, true));
  const sageOf = id => { const ch = CHAPTERS.find(c => c.levels.includes(id)); return ch.sages[ch.levels.indexOf(id)]; };
  // id: a gate monster's spell; foe: { roamer, kind } for a roaming monster (each round a random learned spell)
  // practice: one generated round against the sage, no clock and no damage, passed within PRACTICE × par keys
  function startBattle(id, training, foe = null, practice = false) {
    clearInterval(B?.timer);
    const m = foe ? { spr: CH().roamer, name: ROAMERS[CH().roamer] } : practice ? sageOf(id) : MONSTERS[id];
    B = { id, training, foe, practice, R: rng(Date.now() | 0), round: 0, total: practice ? 1 : foe ? FIGHTS[foe.kind].rounds : id === 'boss' ? BOSS_ROUNDS : ROUNDS,
      hp: D_().hp, keys: 0, par: 0, state: 'fight', timer: setInterval(tickBattle, 100) };
    $('foeIcon').className = 'sprite'; $('foeIcon').innerHTML = img(m.spr);
    $('meIcon').innerHTML = img('hero');
    $('foeName').textContent = tx(m.name);
    $('meName').textContent = `${S.name.toUpperCase()}  ${S.lang === 'es' ? 'NV' : 'LV'} ${level()}`;
    $('bHelp').textContent = practice ? T().practiceHelp : T().battleHelp;
    $('battle').hidden = false;
    newRound();
  }
  function newRound() {
    B.spell = B.foe ? pickR(B.R, [...learnedSet()].filter(id => id !== 'boss')) : B.id;
    B.lv = makeRound(B.spell, B.R, B.foe || B.practice ? 1 + B.round : B.round, learnedSet());
    B.run = new Run(B.lv);
    B.d0 = lev(B.lv.start, B.lv.goal) || 1;
    // ponytail: "used the spell" = finished within 1.5x par (par is the cheapest path with the new spell); track the keys used if that proves too loose
    B.limit = B.practice ? Math.ceil(B.lv.par * 1.5) : B.lv.par;
    B.hint = ''; B.note = B.practice ? T().practiceNote(spellKeys(B.spell)) : B.round ? '' : T().goalNote;
    B.secs = roundSecs(B.lv.par, D_().pace, B.foe ? FIGHTS[B.foe.kind].time : 1);
    B.end = Date.now() + B.secs * 1000;
    const lv = LV[B.spell];
    $('bKeys').innerHTML = [...lv.keys.filter(([k]) => k !== 'u'), ['u', LV.hjkl.keys.at(-1)[1]]].map(([k, d]) => `<span><kbd>${esc(k)}</kbd> ${esc(d)}</span>`).join('');
    $('bLearn').textContent = lv.learn;
    renderBattle();
  }
  const roundLeft = () => Math.min(1, lev(B.run.vim.text, B.run.level.goal) / B.d0);
  function hit(id) { const el = $(id); el.classList.remove('hit'); void el.offsetWidth; el.classList.add('hit'); }
  // the clock only runs while fighting; at zero the monster wins
  function tickBattle() {
    if (B.practice) { $('bTime').style.width = '100%'; $('bClock').textContent = '⏱ ∞'; return; }
    if (B.state !== 'fight') return;
    const left = Math.max(0, B.end - Date.now());
    $('bTime').style.width = (left / (B.secs * 1000)) * 100 + '%';
    $('bTime').parentElement.classList.toggle('low', left < B.secs * 250);
    $('bClock').textContent = `⏱ ${Math.ceil(left / 1000)}s`;
    if (!left) { B.state = 'lost'; B.note = T().timeUp + ' ' + lostNote(); renderBattle(); }
  }
  const lostNote = () => (B.foe ? T().lostRoam : T().lost);
  function endBattle() { clearInterval(B.timer); $('battle').hidden = true; B = null; }
  // losing to a roamer costs a heart, like fleeing from one
  const roamerLost = () => { endBattle(); hurt(); };
  function battleKey(k) {
    if (B.state === 'lost') { if (k === '<CR>') B.foe ? roamerLost() : startBattle(B.id, B.training); return; }
    if (B.state !== 'fight') return;
    if (k.startsWith('Arrow')) { if (!B.practice) B.hp -= 3; B.note = T().arrowBurn; hit('meIcon'); return afterHit(); }
    const miss = locked(B.run.vim, k, learnedSet());
    if (miss) { B.run.vim.pending = ''; B.note = T().notLearnedB(LV[miss].title); return renderBattle(); }
    const before = roundLeft();
    B.run.press(k);
    B.note = B.run.vim.msg;
    if (B.run.keys > B.lv.par && !B.practice) { B.hp--; hit('meIcon'); }
    if (roundLeft() < before) hit('foeIcon');
    if (B.run.done) return roundWon();
    afterHit();
  }
  function afterHit() {
    if (B.hp <= 0) { B.hp = 0; B.state = 'lost'; B.note = lostNote(); }
    renderBattle();
  }
  function roundWon() {
    if (B.practice) {
      if (B.run.keys > B.limit) { B.run = new Run(B.lv); B.note = T().practiceRetry(spellKeys(B.spell)); return renderBattle(); }
      const { id } = B, sage = sageOf(id);
      endBattle(); draw();
      return say([person(sage, T().practiceDone(LV[id].title))], draw);
    }
    B.keys += B.run.keys; B.par += B.lv.par; B.round++;
    B.state = 'pause';
    B.note = B.round >= B.total ? T().finalBlow : T().cleared(B.round, B.run.keys <= B.lv.par);
    renderBattle();
    setTimeout(() => {
      if (B.round >= B.total) { $('foeIcon').classList.add('dead'); return setTimeout(winBattle, 700); }
      B.state = 'fight'; newRound();
    }, 800);
  }
  function winBattle() {
    if (B.foe) {
      const gold = 5 * B.total, name = tx(ROAMERS[CH().roamer]), { roamer } = B.foe;
      world.roamers = world.roamers.filter(r => r !== roamer);
      S.gold += gold; endBattle(); save(); draw();
      return say([[T().victory, T().roamWon(name, gold), CH().roamer]], draw);
    }
    const { id, training, keys, par } = B, m = MONSTERS[id], s = stars({ par }, keys), first = S.best[id] == null;
    S.best[id] = Math.max(S.best[id] || 0, s);
    endBattle();
    if (!training) { const p = world.find(String.fromCharCode(65 + CH().levels.indexOf(id))); if (p) world.set(p.r, p.c, ' '); }
    const lines = [[T().victory, T().defeated(tx(m.name), '★'.repeat(s) + '☆'.repeat(3 - s), keys, par), m.spr]];
    if (first) lines.push(hero(T().grew(level())));
    if (training && s === 3) {
      const n = S.replays[id] || 0, g = replayBonus(n);
      S.replays[id] = n + 1; S.gold += g;
      lines.push([T().victory, T().replayBonus(g), 'chest']);
    }
    if (id === 'boss' && first) { S.done = true; lines.push(...story(ENDING)); }
    save(); draw();
    // beating Dr. Clicker the first time ends in the Victory Parade
    say(lines, id === 'boss' && first ? nextChapter : draw);
  }
  // indices of a's chars left out of a longest common subsequence with b: what b is missing
  function unmatched(a = '', b = '') {
    const L = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
    for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--)
      L[i][j] = a[i] === b[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    const out = new Set();
    for (let i = 0, j = 0; i < a.length;) {
      if (j < b.length && a[i] === b[j]) { i++; j++; }
      else if (j < b.length && L[i][j + 1] >= L[i + 1][j]) j++;
      else out.add(i++);
    }
    return out;
  }
  // mark: class for the chars the other side doesn't have ('extra' in your text, 'miss' in the goal)
  function line(l, r, v, cls, other, mark) {
    let h = '';
    const n = Math.max(l.length, v && r === v.r ? v.c + 1 : 0, 1), diff = unmatched(l, other);
    for (let c = 0; c < n; c++) {
      const ch = l[c] ?? ' ';
      const k = [diff.has(c) && mark, v && r === v.r && c === v.c && (v.mode === 'insert' ? 'cur ins' : 'cur')].filter(Boolean).join(' ');
      h += k ? `<span class="${k}">${esc(ch)}</span>` : esc(ch);
    }
    return `<div class="ln ${cls}"><i>${r + 1}</i>${h}</div>`;
  }
  function renderBattle() {
    const run = B.run, v = run.vim, goal = run.level.goal.split('\n');
    $('bBuf').innerHTML = v.lines.map((l, r) => line(l, r, v, l !== goal[r] ? 'bad' : '', goal[r], 'extra')).join('');
    $('bGoal').innerHTML = goal.map((l, r) => line(l, r, null, l === v.lines[r] ? 'ok' : '', v.lines[r], 'miss')).join('');
    const foe = B.state === 'pause' ? (B.total - B.round) / B.total : (B.total - B.round - 1 + roundLeft()) / B.total;
    $('foeHP').style.width = foe * 100 + '%';
    $('round').textContent = (B.practice ? T().practiceTag + ' · ' : B.foe ? T().fights[B.foe.kind][0] + ' · ' : '') + `${T().round} ${Math.min(B.round + 1, B.total)}/${B.total}`;
    $('meHP').style.width = (B.hp / D_().hp) * 100 + '%';
    $('meHPtxt').textContent = `${S.lang === 'es' ? 'PV' : 'HP'} ${B.hp}/${D_().hp}`;
    $('bMode').textContent = v.mode === 'insert' ? T().insert : 'NORMAL';
    $('bMode').className = 'mode ' + v.mode;
    $('bPending').textContent = v.pending;
    $('bCount').textContent = (B.practice ? T().keysMax : T().keysPar)(run.keys, B.limit) + (run.keys > B.limit ? (B.practice ? T().overLimit : T().overPar) : '');
    $('bNote').textContent = nm(B.note || '');
    $('bHint').textContent = B.hint ? T().whisper(B.hint) : '';
  }

  // ---------- : command line ----------
  let cmd = null;
  const showCmd = (t, err) => { $('cmd').textContent = nm(t); $('cmd').className = err ? 'err' : ''; };
  const canCmd = () => (B ? B.state === 'lost' || (B.state === 'fight' && B.run.vim.mode === 'normal' && !B.run.vim.pending) : !world.nav.pending);
  function cmdKey(k) {
    if (k === '<Esc>' || (k === '<BS>' && !cmd)) { cmd = null; return showCmd(''); }
    if (k === '<CR>') { const c = cmd.trim(); cmd = null; showCmd(''); return runCmd(c); }
    if (k === '<BS>') cmd = cmd.slice(0, -1); else if (k.length === 1) cmd += k;
    showCmd(':' + cmd + '▏');
  }
  const findSpell = a => LEVELS.find(l => l.id === a || LV[l.id].title.toLowerCase().includes(a.toLowerCase()) || l.keys.some(([k]) => k.split(' ').includes(a)));
  function quest() {
    if (S.village) return say([[tx(CH().name), T().qVillage(!!world.find('>')), 'hero']]);
    const ch = CH(), gate = i => world.find(String.fromCharCode(65 + i));
    let next = null;
    ch.levels.forEach((id, i) => {
      if (next) return;
      if (!S.learned.includes(id)) next = T().qSage(tx(ch.sages[i].name), LV[id].title);
      else if (gate(i)) next = T().qFoe(tx(MONSTERS[id].name), LV[id].title, spellKeys(id));
    });
    next ||= world.find('>') ? T().qExit : S.done ? T().qDone : T().qBoss;
    const n = ch.levels.length;
    say([[tx(ch.name), `${T().next}: ${next}`, 'hero'],
      [T().progress, T().qProgress(ch.levels.filter(id => S.learned.includes(id)).length, n, ch.levels.filter((_, i) => !gate(i)).length, chestsOpened(), world.chests.length, ch.lore.filter((_, i) => S.lore.includes(loreId(S.ch, i))).length, ch.lore.length), 'chest']]);
  }
  function runCmd(c) {
    const [name = '', ...rest] = c.split(/\s+/), arg = rest.join(' ');
    const err = t => showCmd(t, true);
    const notInBattle = () => B && err(T().notNow);
    switch (name) {
      case '': return;
      case 'h': case 'help': {
        if (!arg) return toggleDrawer(true);
        const lv = findSpell(arg);
        if (!lv || !S.learned.includes(lv.id)) return err(T().noHelp(arg));
        const l = LV[lv.id];
        return say([[l.title, l.learn, 'elder'], [T().keys, l.keys.map(([k, d]) => (d ? `${k} ${d}` : k)).join(' · '), 'elder']]);
      }
      case 'quest': case 'where': case 'map': return notInBattle() || quest();
      case 'spells': case 'book': {
        const list = LEVELS.filter(l => S.learned.includes(l.id)).map(l => `${LV[l.id].title} (${spellKeys(l.id)}) ${'★'.repeat(S.best[l.id] || 0)}`);
        return say([[T().book, list.join(' · ') || T().bookEmpty, 'chest']]);
      }
      case 'lore': case 'journal': {
        const pages = CHAPTERS.flatMap((ch, c) => ch.lore.flatMap((p, i) => (S.lore.includes(loreId(c, i)) ? [[tx(p.title), tx(p.fact), p.spr]] : [])));
        return say(pages.length ? pages : [[T().lorePage, T().loreEmpty, 'keeper']]);
      }
      case 'stats': {
        const total = Object.values(S.best).reduce((a, b) => a + b, 0);
        return say([hero(T().stats(level(), S.hearts, MAX_HEARTS, S.gold, S.keys, total, LEVELS.length * 3, S.learned.length, LEVELS.length))]);
      }
      case 'back': if (notInBattle()) return; exitAsk = null; world.place(S.spawn.r, S.spawn.c); save(); draw(); return showCmd('⏪ ' + T().back);
      case 'train': {
        if (notInBattle()) return;
        const lv = arg && findSpell(arg);
        if (!lv) return err(T().trainArg);
        if (S.best[lv.id] == null) return err(T().notBeaten(tx(MONSTERS[lv.id].name)));
        return startBattle(lv.id, true);
      }
      case 'hint':
        if (!B || B.state !== 'fight') return err(T().hintOnly);
        if (!B.practice) B.hp -= 5;
        B.hint = B.lv.solution; return afterHit();
      case 'e!': case 'e':
        if (!B || B.state !== 'fight') return err(T().noFile);
        B.run = new Run(B.lv); B.note = T().restarted; return renderBattle();
      case 'q': case 'q!': case 'quit':
        if (!B) return err(T().noEscape);
        if (B.practice) return err(T().practiceStay);
        if (B.foe) return roamerLost();
        endBattle(); draw(); return showCmd(T().fled);
      case 'name':
        if (!arg) return err(T().nameArg);
        S.name = arg.slice(0, 12); save(); draw(); return showCmd(T().hello(S.name));
      case 'level': case 'difficulty':
        if (!DIFF[arg]) return err(T().levelArg(S.diff));
        S.diff = arg; S.hearts = Math.min(S.hearts, DIFF[arg].hearts); save(); draw(); return showCmd(T().level(...T().diff[arg]));
      case 'lang': case 'language':
        if (!UI[arg]) return err(T().langArg);
        S.lang = arg; save(); applyLang(); draw(); return showCmd(T().lang);
      case 'tutorial': {
        if (notInBattle()) return;
        if (!arg) return wizard(onboard());
        const lv = findSpell(arg);
        if (!lv || lv.id === 'boss' || !(lv.id === 'hjkl' || S.learned.includes(lv.id))) return err(T().noLesson(arg));
        return teach(lv.id);
      }
      case 'dojo': return notInBattle() || startDojo();
      case 'travel': case 'tr': return notInBattle() || openBooth('travel');
      case 'lessons': case 'index': case 'ls': return notInBattle() || openIndex();
      case 'menu': return notInBattle() || showMenu();
      case 'w': save(); return showCmd(T().written);
      case 'wq': case 'x': save(); return showCmd(T().seeYou);
      case 'new': return err(T().newNo);
      case 'new!':
        if (B) endBattle();
        return showMenu('name');
      // dev only (bun run dev): :ch 5 jumps to chapter V; stripped from the build
      case 'ch': {
        if (!import.meta.env.DEV || B) return err(T().notCmd(c));
        // :ch 5 opens chapter V, :ch 5v the village after it
        const [, n, v] = arg.match(/^(\d+)(v?)$/) || [];
        if (!CHAPTERS[n - 1]) return err(`:ch 1-${CHAPTERS.length}, or 1v-${CHAPTERS.length}v for a village`);
        return goTo(n - 1, !!v);
      }
      // dev only: the map scrolls freely and a click drops the hero on any walkable tile
      case 'dev':
        if (!import.meta.env.DEV) return err(T().notCmd(c));
        $('view').classList.toggle('dev');
        return showCmd($('view').classList.contains('dev') ? 'dev on: scroll the map, click a tile to jump there' : 'dev off');
      default: return err(T().notCmd(c));
    }
  }

  // ---------- title menu ----------
  let M = null;
  const started = () => S.seen.length > 0;
  // new game: name → diff → text (plain / code) → langs (code only) → loading
  const BACK = { diff: 'name', text: 'diff', langs: 'text' };
  const menuOpts = () => M.step === 'diff' ? Object.keys(DIFF).map(id => [id, ...T().diff[id]])
    : M.step === 'text' ? ['plain', 'code'].map(id => [id, ...T().textKind[id]])
    : M.step === 'langs' ? Object.entries(CODE_LANGS).map(([id, [label]]) => [id, (M.langs.includes(id) ? '☑ ' : '☐ ') + label, ''])
    : [...(started() ? [['continue', T().cont, `${S.name} · ${tx(CH().name)}`]] : []),
      ['new', T().newGame, T().newSub(started())],
      ...(started() ? [['lessons', T().idxOpt, T().idxSub]] : []),
      ['dojo', T().dojo, T().dojoSub(S.dojo)],
      ['lang', T().langOpt, T().langSub]];
  function showMenu(step = 'main') { M = { step, i: 0, name: '', langs: [] }; $('menu').hidden = false; renderMenu(); }
  const MENU_H = { diff: () => T().chooseLevel(M.name), text: () => T().textQ, langs: () => T().langsQ };
  function renderMenu() {
    $('mHelp').textContent = M.step === 'langs' ? T().langsHelp : T().menuHelp;
    if (M.step === 'loading') return void ($('mBody').innerHTML = `<h3>${esc(T().loading)}</h3>`);
    if (M.step === 'name') return void ($('mBody').innerHTML = `<h3>${esc(T().nameQ)}</h3><div class="name-in">${img('hero')} ${esc(M.name)}▏</div><small class="help">${esc(T().nameHelp)}</small>`);
    $('mBody').innerHTML = (MENU_H[M.step] ? `<h3>${esc(MENU_H[M.step]())}</h3>` : '') +
      menuOpts().map(([, label, sub], i) => `<div class="opt${i === M.i ? ' sel' : ''}">${esc(label)}<small>${esc(sub)}</small></div>`).join('');
  }
  function menuKey(k) {
    if (M.step === 'loading') return;
    if (M.step === 'name') {
      if (k === '<CR>') { M.name = M.name.trim() || 'Prompt'; M.step = 'diff'; M.i = 1; }
      else if (k === '<Esc>') { M.step = 'main'; M.i = 0; }
      else if (k === '<BS>') M.name = M.name.slice(0, -1);
      else if (k.length === 1 && M.name.length < 12) M.name += k;
      return renderMenu();
    }
    const opts = menuOpts();
    if (k === 'j') M.i = (M.i + 1) % opts.length;
    else if (k === 'k') M.i = (M.i + opts.length - 1) % opts.length;
    else if (k === '<Esc>' && BACK[M.step]) { M.step = BACK[M.step]; M.i = 0; }
    else if (k === ' ' && M.step === 'langs') toggleLang(opts[M.i][0]);
    else if (k === '<Esc>' && started()) return closeMenu();
    else if (k === '<CR>' || k === ' ') return pick(opts[M.i][0]);
    renderMenu();
  }
  const toggleLang = id => { M.langs = M.langs.includes(id) ? M.langs.filter(l => l !== id) : [...M.langs, id]; };
  function pick(id) {
    if (M.step === 'diff') { M.diff = id; M.step = 'text'; M.i = 0; return renderMenu(); }
    if (M.step === 'text') { if (id === 'plain') return begin('plain', []); M.step = 'langs'; M.i = 0; return renderMenu(); }
    // Enter with nothing ticked plays the highlighted language
    if (M.step === 'langs') return begin('code', M.langs.length ? M.langs : [id]);
    if (id === 'continue') { closeMenu(); return intro(); }
    if (id === 'new') { M.step = 'name'; return renderMenu(); }
    if (id === 'dojo') return startDojo();
    if (id === 'lessons') return openIndex();
    if (id === 'lang') { S.lang = S.lang === 'es' ? 'en' : 'es'; save(); applyLang(); draw(); return renderMenu(); }
  }
  async function begin(kind, langs) {
    M.step = 'loading'; renderMenu();
    const lines = await download(kind, langs).catch(() => []);
    const { dojo, lang } = S, { name, diff } = M;
    S = { ...fresh(), name, diff, hearts: DIFF[diff].hearts, dojo, lang, text: { kind, langs, lines } };
    useText(lines, kind === 'code');
    loadWorld(); save(); draw(); closeMenu();
    if (!lines.length) note(T().textFail);
    wizard(onboard(), intro);
  }
  function closeMenu() { M = null; $('menu').hidden = true; draw(); }

  // ---------- key wizard: one card per key, type the key to go on ----------
  const onboard = () => T().onboard.map(([title, key, text]) => ({ title, key, text }));
  const spellCards = id => [
    ...LV[id].keys.map(([key, text]) => ({ title: LV[id].title, key, text })),
    { title: LV[id].title, text: T().lessonEnd(LV[id].learn, LV[id].keys[0][0]) },
  ];
  // "Finger: d left middle · $ left index + right pinky on Shift"
  const fingerLine = key => {
    const F = T().finger, list = fingers(key);
    const parts = list.map(([ch, [f, sh]]) => `${list.length > 1 ? ch + ' ' : ''}${F[f]}${sh ? ' + ' + T().onShift(F[sh]) : ''}`);
    return parts.length ? T().fingerLine(parts.join(' · ')) : '';
  };
  // two hands seen from above (the right one is the left mirrored). Lit fingers: .on presses the key, .sh holds Shift
  const HANDS = (() => {
    const top = { p: 34, r: 16, m: 8, i: 18 };
    const hand = (s, tf = '') => `<g transform="${tf}"><rect class="palm" x="6" y="58" width="104" height="54" rx="16"/>`
      + `<rect class="palm" x="96" y="78" width="44" height="22" rx="11" transform="rotate(-28 96 89)"/>`
      + [...'prmi'].map((c, i) => `<rect data-f="${s + c}" x="${8 + i * 26}" y="${top[c]}" width="22" height="${74 - top[c]}" rx="11"/>`).join('') + '</g>';
    return `<svg class="hands" viewBox="0 0 300 116" aria-hidden="true">${hand('l')}${hand('r', 'translate(300 0) scale(-1 1)')}</svg>`;
  })();
  // light the fingers for a key; a combo plays each key in turn (2 ticks on, 1 off so repeats on one finger still blink)
  let handTimer;
  function showHands(el, key) {
    clearInterval(handTimer);
    const steps = key ? fingers(key).map(([, f]) => f) : [];
    el.innerHTML = steps.length ? HANDS : '';
    const light = ([f, sh] = []) => el.querySelectorAll('[data-f]').forEach(r => r.setAttribute('class', r.dataset.f === f ? 'on' : r.dataset.f === sh ? 'sh' : ''));
    light(steps[0]);
    let t = 0;
    if (steps.length > 1) handTimer = setInterval(() => { const n = ++t % (steps.length * 3); light(n % 3 === 2 ? [] : steps[(n / 3) | 0]); }, 300);
  }
  // what to type for a key label; null = a pattern like f{c} or "F T", just read it
  const want = key => ({ Esc: '<Esc>', Enter: '<CR>' })[key] || (/[{*\s]/.test(key) ? null : key);
  let W = null;
  function wizard(cards, done) { W = { cards, i: 0, buf: '', done }; $('wizard').hidden = false; renderWiz(); }
  function renderWiz(hint) {
    const c = W.cards[W.i], t = c.key && want(c.key);
    $('wStep').textContent = `${nm(c.title)}  ·  ${W.i + 1}/${W.cards.length}`;
    $('wKey').hidden = !c.key; $('wKey').textContent = c.key || '';
    $('wFinger').textContent = c.key ? fingerLine(c.key) : '';
    if (c !== W.shown) { W.shown = c; showHands($('wHands'), c.key); }
    $('wText').textContent = nm(c.text);
    $('wHint').textContent = hint || (t ? T().press(c.key, W.buf) : T().pressEnter);
  }
  function wizKey(k) {
    const c = W.cards[W.i], t = c.key && want(c.key);
    if (k === '<Esc>' && t !== '<Esc>') return endWiz();
    if (k.startsWith('Arrow')) return renderWiz(T().arrowCursed);
    if (t && !t.startsWith('<')) {
      W.buf += k;
      if (!t.startsWith(W.buf)) { W.buf = ''; return renderWiz(T().notQuite(c.key)); }
      if (W.buf !== t) return renderWiz();
    } else if (k !== (t || '<CR>') && !(!t && k === ' ')) return;
    W.i++; W.buf = '';
    if (W.i >= W.cards.length) return endWiz();
    renderWiz();
  }
  function endWiz() { clearInterval(handTimer); const f = W.done; W = null; $('wizard').hidden = true; f?.(); }

  // ---------- Key Dojo mini-game: type the key on each mouse before time runs out ----------
  const DOJO_MS = 30000;
  let D = null;
  // paid: played at Sensei Kip's in a village, one gold per mouse
  function startDojo(paid = false) {
    const pool = LEVELS.filter(l => l.id === 'hjkl' || S.learned.includes(l.id)).flatMap(l => LV[l.id].keys).filter(([k]) => want(k) && !want(k).startsWith('<'));
    clearInterval(D?.timer);
    D = { pool, paid, score: 0, buf: '', end: Date.now() + DOJO_MS, timer: setInterval(tickDojo, 100) };
    $('dojo').hidden = false; nextMouse();
  }
  function nextMouse() {
    D.cur = D.pool[Math.floor(Math.random() * D.pool.length)]; D.buf = '';
    $('dMouse').innerHTML = img(Math.random() < .5 ? 'rat' : 'pointer');
    $('dMouse').style.translate = `${Math.round(Math.random() * 240 - 120)}px 0`;
    renderDojo();
  }
  function renderDojo(msg) {
    $('dStat').textContent = T().dojoStat(D.score, S.dojo);
    $('dKey').textContent = D.cur[0];
    $('dFinger').textContent = fingerLine(D.cur[0]);
    if (D.cur !== D.shown) { D.shown = D.cur; showHands($('dHands'), D.cur[0]); }
    $('dText').textContent = msg || `${D.cur[1]}  ${D.buf}`;
  }
  function tickDojo() {
    const left = D.end - Date.now();
    $('dTime').style.width = Math.max(0, left / DOJO_MS) * 100 + '%';
    if (left > 0) return;
    clearInterval(D.timer); D.over = true;
    const best = D.score > S.dojo; S.dojo = Math.max(S.dojo, D.score);
    if (D.paid) S.gold += D.score;
    save();
    renderDojo(T().dojoOver(D.score, best) + (D.paid ? '  ·  ' + T().dojoGold(D.score) : ''));
  }
  function dojoKey(k) {
    if (k === '<Esc>') { clearInterval(D.timer); clearInterval(handTimer); D = null; $('dojo').hidden = true; return M ? renderMenu() : hud(); }
    if (D.over) return k === '<CR>' && startDojo(D.paid);
    if (k.length !== 1) return;
    const t = want(D.cur[0]);
    D.buf += k;
    if (D.buf === t) { D.score++; hit('dMouse'); return nextMouse(); }
    if (!t.startsWith(D.buf)) D.buf = '';
    renderDojo();
  }

  // ---------- village booths: Tilly's costume shop and Chester's chest game ----------
  const ITEM_IDS = Object.keys(ITEMS), CHEST_BET = 5, CHEST_WIN = 15;
  let Bo = null;
  const visited = () => STAGES.filter(st => S.seen.includes(stageKey(st.ch, st.village)));
  function openBooth(kind) {
    Bo = { kind, i: kind === 'chest' ? 1 : kind === 'travel' ? Math.max(0, visited().findIndex(st => st.ch === S.ch && st.village === !!S.village)) : 0, open: null };
    $('booth').hidden = false; renderBooth();
  }
  function closeBooth() { Bo = null; $('booth').hidden = true; draw(); }
  function renderBooth(msg) {
    if (Bo.kind === 'travel') {
      $('boTitle').textContent = T().travelTitle;
      $('boBody').innerHTML = visited().map((st, i) => `<div class="opt${i === Bo.i ? ' sel' : ''}">${esc(tx((st.village ? VILLAGES : CHAPTERS)[st.ch].name))}${
        st.ch === S.ch && st.village === !!S.village ? `<small>${esc(T().here)}</small>` : ''}</div>`).join('');
    } else if (Bo.kind === 'shop') {
      $('boTitle').textContent = T().shopTitle(S.gold);
      $('boBody').innerHTML = `<div class="preview">${img('hero')}</div>` + ITEM_IDS.map((id, i) => {
        const it = ITEMS[id], tag = S.wear[it.slot] === id ? T().worn : S.owned.includes(id) ? T().owned : T().price(it.price);
        return `<div class="opt item${i === Bo.i ? ' sel' : ''}">${img(id)}<span>${esc(tx(it.name))}</span><small>${esc(tag)}</small></div>`;
      }).join('');
    } else {
      $('boTitle').textContent = T().chestTitle(S.gold);
      $('boBody').innerHTML = `<div class="chests">${[0, 1, 2].map(i => `<div class="${i === Bo.i ? 'sel' : ''}">${
        Bo.open == null ? img('chest') : i === Bo.prize ? img('chest') + `<b>+${CHEST_WIN}</b>` : img('rat')}</div>`).join('')}</div>`;
    }
    $('boHelp').textContent = msg || (Bo.kind === 'travel' ? T().travelHelp : Bo.kind === 'shop' ? T().shopHelp : T().chestHelp(CHEST_BET, CHEST_WIN));
  }
  function boothKey(k) {
    if (k === '<Esc>' || k === 'q') return closeBooth();
    if (Bo.kind === 'travel') {
      const list = visited();
      if (k === 'j' || k === 'k') { Bo.i = (Bo.i + (k === 'j' ? 1 : list.length - 1)) % list.length; return renderBooth(); }
      if (k !== '<CR>' && k !== ' ') return;
      const st = list[Bo.i];
      closeBooth();
      if (st.ch !== S.ch || st.village !== !!S.village) goTo(st.ch, st.village);
      return showCmd('🧭 ' + tx((st.village ? VILLAGES : CHAPTERS)[st.ch].name));
    }
    if (Bo.kind === 'shop') {
      if (k === 'j' || k === 'k') { Bo.i = (Bo.i + (k === 'j' ? 1 : ITEM_IDS.length - 1)) % ITEM_IDS.length; return renderBooth(); }
      if (k !== '<CR>' && k !== ' ') return;
      const id = ITEM_IDS[Bo.i], it = ITEMS[id];
      if (!S.owned.includes(id)) {
        if (S.gold < it.price) return renderBooth(T().poor(it.price - S.gold));
        S.gold -= it.price; S.owned.push(id);
      }
      // buying puts it on; Enter on something you own takes it on or off
      if (S.wear[it.slot] === id) delete S.wear[it.slot]; else S.wear[it.slot] = id;
      save(); draw(); return renderBooth();
    }
    if (Bo.open != null) { if (k === '<CR>' || k === ' ') { Bo.open = null; renderBooth(); } return; }
    if (k === 'h' || k === 'l') { Bo.i = Math.max(0, Math.min(2, Bo.i + (k === 'l' ? 1 : -1))); return renderBooth(); }
    if (k !== '<CR>' && k !== ' ') return;
    if (S.gold < CHEST_BET) return renderBooth(T().poor(CHEST_BET - S.gold));
    Bo.open = Bo.i; Bo.prize = Math.floor(Math.random() * 3);
    S.gold += Bo.prize === Bo.i ? CHEST_WIN - CHEST_BET : -CHEST_BET;
    save(); hud();
    renderBooth(Bo.prize === Bo.i ? T().chestWin(CHEST_WIN) : T().chestLose);
  }
  const ACTS = { shop: () => openBooth('shop'), chest: () => openBooth('chest'), dojo: () => startDojo(true) };

  // ---------- lesson index: every spell with its commands; replay any monster you've beaten ----------
  let I = null;
  const LORE_N = CHAPTERS.reduce((n, ch) => n + ch.lore.length, 0);
  const ORDER = CHAPTERS.flatMap(ch => ch.levels.map(id => ({ id, ch })));
  function openIndex() {
    I = { i: Math.min(ORDER.length - 1, ORDER.findIndex(o => S.best[o.id] == null) >>> 0) };
    $('index').hidden = false; renderIndex();
  }
  function closeIndex() { I = null; $('index').hidden = true; if (M) renderMenu(); }
  function renderIndex(msg) {
    let h = '', last = null;
    ORDER.forEach(({ id, ch }, i) => {
      if (ch !== last) { last = ch; h += `<h4>${esc(tx(ch.name))}</h4>`; }
      const best = S.best[id], mark = best != null ? '★'.repeat(best) + '☆'.repeat(3 - best) : learnedSet().has(id) ? '·' : '🔒';
      h += `<div class="opt${i === I.i ? ' sel' : ''}${best == null ? ' dim' : ''}">${esc(LV[id].title)}<span class="mk">${mark}</span></div>`;
    });
    $('iList').innerHTML = h;
    $('iList').querySelector('.sel').scrollIntoView({ block: 'nearest' });
    const { id } = ORDER[I.i], l = LV[id], m = MONSTERS[id], won = S.best[id] != null;
    const buf = (text, other, mark) => `<div class="buf">${text.split('\n').map((t, r) => line(t, r, null, '', other.split('\n')[r], mark)).join('')}</div>`;
    $('iPage').innerHTML = `<h3>${esc(l.title)}</h3><p>${esc(nm(l.learn))}</p>
      <table class="keys">${l.keys.map(([k, d]) => `<tr><td><kbd>${esc(k)}</kbd></td><td>${esc(d)}</td></tr>`).join('')}</table>
      <div class="ex"><div><h4>${esc(T().yourText)}</h4>${buf(l.start, l.goal, 'extra')}</div><div><h4>${esc(T().goal)}</h4>${buf(l.goal, l.start, 'miss')}</div></div>
      <p class="foe">${img(m.spr)}<span>${esc(won ? T().idxPlay(tx(m.name)) : T().idxLocked(tx(m.name)))}</span></p>`;
    $('iHelp').textContent = msg || T().idxHelp;
  }
  function indexKey(k) {
    if (k === 'j' || k === 'k') { I.i = (I.i + (k === 'j' ? 1 : ORDER.length - 1)) % ORDER.length; return renderIndex(); }
    if (k === '<Esc>' || k === 'q') return closeIndex();
    if (k !== '<CR>') return;
    const { id } = ORDER[I.i];
    if (S.best[id] == null) return renderIndex(T().notBeaten(tx(MONSTERS[id].name)));
    closeIndex();
    if (M) closeMenu();
    startBattle(id, true);
  }

  // ---------- help drawer: the :help text, opened from the ? button ----------
  const drawerOpen = () => $('drawer').classList.contains('open');
  function toggleDrawer(open = !drawerOpen()) {
    $('drTitle').textContent = T().helpTitle;
    $('drBody').innerHTML = T().help.map(([h, t]) => `<h4>${esc(h)}</h4><p>${esc(nm(t))}</p>`).join('');
    $('drawer').classList.toggle('open', open);
    $('drawer').inert = !open;
    document.activeElement?.blur();
  }
  const onHelpBtn = () => toggleDrawer(), onDrClose = () => toggleDrawer(false);
  $('helpBtn').addEventListener('click', onHelpBtn);
  $('drClose').addEventListener('click', onDrClose);

  // ---------- input ----------
  function onKey(e) {
    if (e.metaKey || e.altKey) return;
    let k = e.key;
    if (e.ctrlKey) {
      if (k === 'o' && !B && !M && !W && !D && !Bo && $('dialog').hidden) { e.preventDefault(); exitAsk = null; world.place(S.spawn.r, S.spawn.c); note(T().back); save(); return draw(); }
      if (k === '[' || k === 'c') k = '<Esc>'; else return;
    } else if (k === 'Escape') k = '<Esc>';
    else if (k === 'Enter') k = '<CR>';
    else if (k === 'Backspace') k = '<BS>';
    else if (k.length !== 1 && !k.startsWith('Arrow')) return;
    e.preventDefault();
    if (k === '<Esc>' && drawerOpen()) return toggleDrawer(false);
    if (cmd !== null) return cmdKey(k);
    if (D) return dojoKey(k);
    if (Bo) return boothKey(k);
    if (I) return indexKey(k);
    if (M) return menuKey(k);
    if (W) return wizKey(k);
    if (!$('dialog').hidden) return dialogKey(k);
    if (k === ':' && canCmd()) { cmd = ''; return showCmd(':▏'); }
    showCmd('');
    if (B) return battleKey(k);
    mapKey(k);
  }

  document.addEventListener('keydown', onKey);
  $('map').addEventListener('click', e => {
    const t = $('view').classList.contains('dev') && !B && e.target.closest('.t');
    if (!t) return;
    const i = [...$('map').children].indexOf(t), w = world.lines[0].length + 1, r = Math.floor(i / w), c = (i % w) - 1;
    if (world.walkable(r, c)) { world.place(r, c); save(); draw(); }
  });
  $('mVs').innerHTML = `${img('hero')}<b>VS</b>${img('clicker', 'villain')}`;
  applyLang(); loadWorld(); draw(); showMenu();
  return () => { document.removeEventListener('keydown', onKey); $('helpBtn').removeEventListener('click', onHelpBtn); $('drClose').removeEventListener('click', onDrClose); clearInterval(D?.timer); clearInterval(B?.timer); clearInterval(handTimer); css.remove(); };
}
