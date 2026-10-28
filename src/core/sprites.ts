// vim-tales pixel art: 16x16 sprites, one char per pixel. 0-f = PICO-8 palette, w/p/q = water and dirt, g-z = shaded ramps
// for the map (leaf g-j, bark k-m, stone n-t, roof u-x, plaster y-z), '.' = transparent.
// Short rows are padded with '.'. Uppercase letters are swap slots filled per character: H hat/hair, R robe/shirt,
// T trim/pants, K skin, B beard.
const PAL: Record<string, string> = {
  0: '#000000', 1: '#1d2b53', 2: '#7e2553', 3: '#008751', 4: '#ab5236', 5: '#5f574f', 6: '#c2c3c7', 7: '#fff1e8',
  8: '#ff004d', 9: '#ffa300', a: '#ffec27', b: '#00e436', c: '#29adff', d: '#83769c', e: '#ff77a8', f: '#ffccaa',
  w: '#1d5f9c', p: '#b8925a', q: '#d9bc84',
  g: '#173a24', h: '#25603a', i: '#3e8a3f', j: '#78c257', k: '#3a2416', l: '#6b4226', m: '#9a6a3d',
  n: '#2b2c38', o: '#4f5266', r: '#7d8399', s: '#b8bfd0', t: '#e8ecf4', u: '#5a1d24', v: '#8e2f2f', x: '#c4503a',
  y: '#e8d6b0', z: '#a8946e',
};

const ART: Record<string, string[]> = {
  // ---------- people ----------
  hero: [
    '', '..666666666666', '..600000000006', '..60b000000006', '..600b00000006', '..60b000bbb006', '..600000000006',
    '..666666666666', '......6666', '....3bbbbbb3', '...f3bbbbbb3f', '...f3bbbbbb3f', '....34444443', '....11....11',
    '....11....11', '...444....444',
  ],
  sage: [
    '.......HH', '......HHHH', '.....HHHHHH', '....HHHHTHHH', '...HHHHHHHHHH', '..TTTTTTTTTTTT', '....KK0KK0KK',
    '....KKKKKKKK', '....BBKKKKBB', '.....BBBBBB', '...RRBBBBBBRR', '..KRRRBBBBRRRK', '..RRRRRTTRRRRR', '...RRRRTTRRRR',
    '...RRRRRRRRRR', '..00RRRRRRRR00',
  ],
  folk: [
    '', '.....HHHHHH', '....HHHHHHHH', '....HKKKKKKH', '....K0KKKK0K', '....KKKKKKKK', '....KKKeeKKK', '.....KKKKKK',
    '....RRRRRRRR', '...RRRRRRRRRR', '..KRRRRRRRRRRK', '..K.RRRRRRRR.K', '....TTTTTTTT', '....TTT..TTT', '....TTT..TTT',
    '...000....000',
  ],
  long: [
    '.....HHHHHH', '....HHHHHHHH', '...HHHHHHHHHH', '...HHKKKKKKHH', '...HK0KKKK0KH', '...HKKKKKKKKH', '...HKKKeeKKKH',
    '...HHKKKKKKHH', '...HHRRTTRRHH', '...HRRRTTRRRH', '..KRRRRTTRRRRK', '..K.RRRRRRRR.K', '...RRRRRRRRRR', '..RRRRRRRRRRRR',
    '.....KK..KK', '....000..000',
  ],
  hat: [
    '', '......HHHH', '.....HHHHHH', '.....444444', '..HHHHHHHHHHHH', '....KKKKKKKK', '....K0KKKK0K', '....KKKeeKKK',
    '.....KKKKKK', '....RRRRRRRR', '..KRRRRRRRRRRK', '..K.RRRRRRRR.K', '....TTTTTTTT', '....TTT..TTT', '....TTT..TTT',
    '...000....000',
  ],
  helm: [
    '', '......HHHH', '.....HH77HH', '....HHH77HHH', '...HHHHHHHHHH', '....KKKKKKKK', '....K0KKKK0K', '....BKKKKKKB',
    '....BBBBBBBB', '...RBBBBBBBBR', '..RRRBBBBBBRRR', '..KRRRBBBBRRRK', '..K.RRRRRRRR.K', '....TTTTTTTT', '....TTT..TTT',
    '...000....000',
  ],
  hood: [
    '', '......HHHH', '....HHHHHHHH', '...HHHHHHHHHH', '...HHKKKKKKHH', '...HK0KKKK0KH', '...HKKKKKKKKH', '...HHKKeeKKHH',
    '...HHHKKKKHHH', '..HHRRRRRRRRHH', '..HRRRRTTRRRRH', '..KRRRRTTRRRRK', '...RRRRTTRRRR', '...RRRRTTRRRR', '..RRRRRRRRRRRR',
    '...00......00',
  ],
  crown: [
    '', '...a..a..a..a', '...aaaaaaaaaa', '...aa8aaaa8aa', '...aaaaaaaaaa', '....KKKKKKKK', '....KK0KK0KK', '....KKKKKKKK',
    '....BBKKKKBB', '.....BBBBBB', '...RRBBBBBBRR', '..KRRRBBBBRRRK', '..RRRRRTTRRRRR', '...RRRRTTRRRR', '...RRRRRRRRRR',
    '..00RRRRRRRR00',
  ],
  // ---------- monsters ----------
  rat: [
    '', '', '', '...ee', '..e55e', '..55555556', '.0855566666', '55555666666666', '.555566666666e', '..5556666666..e',
    '...55666666...e', '....5.5..5.5.e', '.............e', '...........ee',
  ],
  bat: [
    '', '', '2..............2', '22.....22.....22', '222...2222...222', '2222.222222.2222', '2222228228222222',
    '2222222222222222', '22222.2772.22222', '222....22....222', '22............22', '2..............2',
  ],
  snail: [
    '', '', '', '.............0.0', '....4444.....f.f', '...499994....f.f', '..49944994...fff', '..49499494...fff',
    '..49494494..ffff', '..49944494.fffff', '..499999944fffff', '.ffffffffffffff', 'ffffffffffffff',
  ],
  boar: [
    '', '', '', '......5.5', '....55555555', '...4555555554444', '..44044444444444', '.444444444444444', 'ee44444444444444',
    'e7e4444444444444', '.7.4444444444444', '...444444444444', '...44.44...44.44', '...00.00...00.00',
  ],
  serpent: [
    '', '.....bbbb', '....bbbbbb', '....b0bb0b', '....bbbbbb', '.....bbbb8', '......bb', '.......bb', '....bbbbbbbb',
    '...bb333333bb', '..bb3bbbbbb3bb', '..b3bbbbbbbb3b', '..bb33333333bb', '...bbbbbbbbbb',
  ],
  toad: [
    '', '', '', '...aa......aa', '..a00a....a00a', '..bbbbbbbbbbbb', '.bbbbbbbbbbbbbb', '.bb0000000000bb',
    '.bbbbbbbbbbbbbb', 'bbbbbffffffbbbbb', 'bbbbffffffffbbbb', '.bbbffffffffbbb', '..bbbbbbbbbbbb', '.bb3b......b3bb',
    '3333........3333',
  ],
  goblin: [
    '', '......8888', '.....888888', '8...88888888...8', '88.8888888888.88', '.888a08888a0888', '..888888888888',
    '...8807777088', '....88888888', '.....222222', '....22222222', '...8222222228', '....22222222', '....88....88',
    '...888....888',
  ],
  lizard: [
    '', '', '', '', '', '...........999', '..........99099', '9........999999', '99....94949494', '.99999999999999',
    '..999999999999', '...9.9....9.9', '..44.44..44.44',
  ],
  spider: [
    '', '', '.0............0', '..0..........0', '...0..5555..0', '0...55555555...0', '.0..55855855..0', '..555555555555',
    '.0.5555885555.0', '0..5555555555..0', '..0.55555555.0', '.0..5.5555.5..0', '0..0........0..0',
  ],
  scorpion: [
    '', '..........999', '.........9..98', '.........9', '..........9', '..........9', '99.......99', '9.9....9999',
    '.99.999999', '...99999999', '99.9999999', '9.9.9.9.9',
  ],
  crab: [
    '', '', '.88..........88', '8.88........88.8', '.888........888', '..8...0..0...8', '...8..8..8..8', '....88888888',
    '...8888888888', '..888888888888', '..888888888888', '...8888888888', '..8.8.8..8.8.8', '.8.8.8....8.8.8',
  ],
  ghost: [
    '', '.....777777', '...7777777777', '..777777777777', '..770077770077', '.77700777700777', '.77777777777777',
    '.77777700777777', '.77777777777777', '.7777777777777d', '.777777777777dd', '.77777777777ddd', '.77777777777ddd',
    '.77..777..777.dd', '.7....7....7...d',
  ],
  wolf: [
    '', '..5..........5', '..55........55', '..565......565', '..566555555665', '.56666666666665', '.5666a0660a6665',
    '.56666666666665', '..566667766665', '...5667777665', '....56700765', '.....567765', '......5885', '.......55',
  ],
  cat: [
    '', '', '..9..........9', '..99........99', '..9e9......9e9', '..999999999999', '.99999999999999', '.999b09999b0999',
    '.99999999999999', '.999999ee999999', '7.999990099999.7', '..999999999999', '...9999999999', '....99999999',
  ],
  owl: [
    '', '..4..........4', '..44........44', '..444444444444', '.47777444477774', '.47007444470074', '.47777499477774',
    '.44444499444444', '.44ffffffffff44', '.44f4ff4ff4ff44', '..4ffffffffff4', '..44f4ff4ff444', '...4444444444',
    '....99....99',
  ],
  mosquito: [
    '', '......0..0', '.......55', '......5885', '.......55', '..ccc..55..ccc', '.c777c5555c777c', '.c7777c55c7777c',
    '..c777c55c777c', '...ccc5885ccc', '......5885', '.....5.88.5', '....5..88..5', '...5...55...5',
  ],
  pointer: [
    '...0', '...00', '...070', '...0770', '...07770', '...077770', '...0777770', '...07777770', '...077777770',
    '...0777777770', '...077777000', '...0770770', '...070.0770', '...00..0770', '...0....0770', '.........000',
  ],
  clicker: [
    '..5555....5555', '.55ee55..55ee55', '.5eeee5665eeee5', '.55ee566665ee55', '...5666666665', '..566cc66cc665',
    '..56c00cc00c65', '..566cc66cc665', '...5666ee6665', '....56777765', '....77777777', '...7777887777',
    '..677778877776', '..677777777776', '...7777777777', '...00......00',
  ],
  // ---------- map objects ----------
  pine: [
    '.......gg', '......gjhg', '.....gjiihg', '....gjiihhhg', '.....gjihhg', '....gjiiihhg', '...gjiiihhhhg', '..gjiiihhhhhhg',
    '....gjiihhhg', '...gjiiihhhhg', '..gjiiiihhhhhg', '.gjiiiihhhhhhhg', '.gggiihhhhhgggg', '....gggggggg', '......mlk',
    '.....mllkk',
  ],
  oak: [
    '.....gggggg', '...gghjjihhgg', '..ghjjjiiihhhg', '.ghjjiiiiihhhhg', '.gjjiiiihiihhhg', 'ghjiiihhhiiihhhg',
    'gijiiiiihhhhhhhg', 'ghiiihhiiihhhhgg', 'ghiihhhiihhhhhgg', '.ghihhhhhhhhhgg', '.gghhhhhhhhhggg', '..gggghhhggggg',
    '....ggggggggg', '......mlkk', '......mlkk', '.....mmllkk',
  ],
  reed: [
    '', '...l.......l', '...k...l...k', '...k...k...k..l', '...j...k...i..k', '..ji...j..ji..k', '..i.i..i..i.i.i',
    '.ji.i.ji.ji.i.j', '.i..ijii.i..ij.i', '.i.ji.i.ji.jii.i', 'ji.i..i.i..i.i.h', 'i.hi.hi.i.hi.hih', 'ihh.hhihhhhihhh',
    'hghhgghhghhgghhg', '.gg.gg.gggg.gg',
  ],
  boulder: [
    '', '', '.....nnnnnn', '...nnrsstrrnn', '..nrsttssrrron', '.nrstsssrrrrron', '.nrssrrrrrooron', 'nrssrrrroorooonn',
    'nrsrrrrooooooonn', 'nrrrrooonoooonn', 'nroorooonnoonnn', '.noooonnnoonnn', '..nnnnnnnnnnn',
  ],
  // stone blocks, every other course offset by half a block
  brick: [0, 1, 2, 3].flatMap(b => ['tssssson', 'srrrrron', 'rooooonn', 'nnnnnnnn'].map(row => (b % 2 ? row.slice(4) + row.slice(0, 4) : row).repeat(2))),
  chest: [
    '', '', '', '', '...4444444444', '..499999999994', '..4aaaaaaaaaa4', '..444444444444', '..aaaaa00aaaaa',
    '..44444aa44444', '..444444444444', '..4a44444444a4', '..aaaaaaaaaaaa',
  ],
  chestOpen: [
    '', '...4444444444', '..499999999994', '..444444444444', '..400000000004', '..400000000004', '..400000000004',
    '..aaaaaaaaaaaa', '..444444444444', '..444444444444', '..4a44444444a4', '..aaaaaaaaaaaa',
  ],
  heart: [
    '', '', '', '...8888..8888', '..877888888888', '..878888888888', '..888888888888', '...8888888888', '....88888888',
    '.....888888', '......8888', '.......88',
  ],
  key: ['', '', '', '', '', '..aaaa', '.a9..9a', '.a9..9aaaaaaaaa', '.a9..9a99999a9a', '..aaaa......a.a'],
  door: [
    '', '...5555555555', '..554444444455', '..549494949495', '..549494949495', '..549494949495', '..549494949495',
    '..549494949495', '..54949494a495', '..549494949495', '..549494949495', '..549494949495', '..549494949495',
    '..549494949495', '..555555555555',
  ],
  portal: [
    '', '', '.....dddddd', '...dd222222dd', '..d22cccccc22d', '..d2cc7777cc2d', '.d2c77cccc77c2d', '.d2c7c2222c7c2d',
    '.d2c7c2772c7c2d', '.d2c7cc77cc7c2d', '.d2c77cccc7cc2d', '..d2cc7777cc2d', '..d22cccccc22d', '...dd222222dd',
    '.....dddddd',
  ],
  house: [
    '.......uu', '......uvvu', '.....uvxxvu', '....uvxxxxvu', '...uvxxvvxxvu', '..uvxxvvvvxxvu', '.uvxvvvvvvvvxvu',
    'uuuuuuuuuuuuuuuu', '..yyyyyyyyyyyz', '..yccyyyyklkyz', '..y1cyyyyklkyz', '..yyyyyyyklkyz', '..yyyyyyykmkyz',
    '..zzzzzzzklkzz', '..nnnnnnnnnnnn',
  ],
  // ---------- village ----------
  bush: [
    '', '', '....iiiiiiii', '..iijjiiiiiiii', '.iijjiieiiiiaii', '.iiiiiiiiiiiiii', 'iieiiiiijjiiiiii', 'iiiiiiaiiiiieiii',
    'iiijjiiiiiiiiiii', 'hiiiiieiiiiaiiih', '.hiiiiiiiiiiiih', '..hhiiiiiiiihh', '....hhhhhhhh',
  ],
  fountain: [
    '', '.......cc', '......c77c', '.......cc', '.......ss', '......cccc', '.....c7cc7c', '..rrrrrrrrrrrr', '.rssssssssssssr',
    '.rccc7cccc7cccr', '.rcc7ccccc7cccr', '.rssssssssssssr', '..rrrrrrrrrrrr', '...oooooooooo',
  ],
  balloons: [
    '..88.......cc', '.8788.....c7cc', '.8888..aa.cccc', '..88..a7aa.cc', '...0..aaaa.0', '....0..aa.0', '.....0.0.0',
    '......000', '.......0', '.......0', '......444', '.....44444',
  ],
  // ---------- costumes: drawn over the hero's 16x16 frame (hats on the screen's top edge, sword in the right hand, shield in the left) ----------
  partyhat: ['.......a', '......e8e', '.....8e8e8'],
  wizardhat: ['.......d', '......dad', '....dddddddd'],
  goldcrown: ['....a..aa..a', '....aaaaaaaa', '....a8acca8a'],
  woodsword: ['', '', '', '..............q', '..............q', '..............q', '..............q', '..............q',
    '..............q', '..............q', '.............444', '..............4', '..............4'],
  ironsword: ['', '', '..............7', '..............6', '..............6', '..............6', '..............6', '..............6',
    '..............6', '..............6', '.............555', '..............4', '..............a'],
  flamesword: ['', '', '..............a', '..............9', '..............8', '..............9', '..............8', '..............9',
    '..............8', '..............9', '.............222', '..............2', '..............a'],
  woodshield: ['', '', '', '', '', '', '', '', '.444', '4ppp4', '4pqp4', '4ppp4', '.4p4', '..4'],
  shell: ['', '', '', '', '', '', '', '', '.bbb', 'b3b3b', '3b3b3', 'b3b3b', '.333'],
  starshield: ['', '', '', '', '', '', '', '', 'ccccc', 'c7a7c', 'caaac', 'c7a7c', '.ccc', '..c'],
};

// characters built from the people templates: [template, slot colors as "H R T K B"]
// sage pointy hat · folk short hair · long hair + dress · hat wide brim · helm lamp + beard · hood · crown
const CAST: Record<string, [string, string]> = {
  elder: ['sage', '6 1 c f 7'], wanderer: ['sage', '3 b a f f'], margin: ['sage', '2 d 7 f 7'],
  seeker: ['hood', '0 1 5 f'], fairy: ['long', 'a e 7 f'], djinn: ['sage', 'c 2 a c c'], mer: ['long', 'c 3 b f'],
  smith: ['helm', '5 4 0 f 4'], changeling: ['sage', 'd 2 e f f'], witch: ['sage', '0 2 b f f'], monk: ['hood', '9 9 4 f'],
  king: ['crown', 'a d 7 6 6'], wizard: ['sage', '1 1 a f 7'],
  mom: ['long', '4 e 7 f'], farmer: ['hat', 'a 3 4 f'], fisher: ['hat', 'c c 1 f'], shepherd: ['hat', '4 7 4 f'],
  girl: ['long', '9 8 7 f'], ferry: ['hat', '5 4 5 f'], scribe: ['folk', '6 2 1 f'], kid: ['folk', '4 c 4 f'],
  miner: ['helm', 'a 5 4 f 5'], hermit: ['hood', '5 d 5 f'], dwarf: ['helm', '6 4 5 f 9'], captain: ['folk', '8 1 8 f'],
  teacher: ['long', '5 3 6 f'], nine: ['folk', 'a 9 4 f'],
  keeper: ['hood', '2 6 d f'], bard: ['hat', 'e 2 9 f'],
  tailor: ['long', 'e 2 a f'], sensei: ['hood', '7 8 0 f'], jester: ['sage', 'e a 8 f f'],
};

function grid(name: string): string[] {
  const cast = CAST[name];
  const rows = ART[cast ? cast[0] : name];
  if (!rows) throw new Error(`no sprite ${name}`);
  if (!cast) return rows;
  const [H, R, T, K, B = K] = cast[1].split(' ');
  const slot: Record<string, string> = { H, R, T, K, B };
  return rows.map(r => r.replace(/[HRTKB]/g, s => slot[s]));
}

// a 16x16 grid of colors ('' = clear) → SVG data URL (horizontal runs merged into one rect)
function svg(px: string[][]): string {
  let rects = '';
  px.forEach((row, y) => {
    for (let x = 0; x < row.length;) {
      let n = 1;
      while (row[x + n] === row[x]) n++;
      if (row[x]) rects += `<rect x="${x}" y="${y}" width="${n}" height="1" fill="${row[x]}"/>`;
      x += n;
    }
  });
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges">${rects}</svg>`)}`;
}
const paint = (rows: string[], color: (ch: string) => string) => rows.map(r => [...r].map(color));
const mix = (a: string, b: string, t: number) =>
  '#' + [1, 3, 5].map(i => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - t) + parseInt(b.slice(i, i + 2), 16) * t).toString(16).padStart(2, '0')).join('');
// map scenery is drawn pre-shaded; characters, monsters and items get a dark outline, lit from the top left
const SCENERY = new Set(['pine', 'oak', 'reed', 'boulder', 'brick', 'house', 'door', 'portal', 'bush']);
const OUTLINE = '#1a1220';
function pixels(name: string): string[][] {
  const g = grid(name), on = (x: number, y: number) => (g[y]?.[x] ?? '.') !== '.', fx = !SCENERY.has(name);
  return Array.from({ length: 16 }, (_, y) => Array.from({ length: 16 }, (_, x) => {
    if (!on(x, y)) return fx && (on(x - 1, y) || on(x + 1, y) || on(x, y - 1) || on(x, y + 1)) ? OUTLINE : '';
    const c = PAL[g[y][x]];
    if (!fx) return c;
    return !on(x, y - 1) || !on(x - 1, y) ? mix(c, '#ffffff', .28) : !on(x, y + 1) || !on(x + 1, y) ? mix(c, '#000000', .3) : c;
  }));
}
const cache = new Map<string, string>();
function sprite(name: string): string {
  let url = cache.get(name);
  if (!url) cache.set(name, (url = svg(pixels(name))));
  return url;
}
// the hero wearing costumes: item pixels over the hero's; an item's outline only lands on empty space
function outfit(items: string[]): string {
  const key = ['hero', ...items].join('+');
  let url = cache.get(key);
  if (!url) {
    const px = pixels('hero');
    for (const it of items) pixels(it).forEach((row, y) => row.forEach((c, x) => { if (c && (c !== OUTLINE || !px[y][x])) px[y][x] = c; }));
    cache.set(key, (url = svg(px)));
  }
  return url;
}

// ---------- procedural ground: seamless 16x16 textures, digits index a palette built from 4-step ramps (dark → light) ----------
export interface Ground { kind: 'grass' | 'rock' | 'tiles'; ramp: string[]; water?: string[]; flowers?: boolean }
const DIRT = ['#5e3f24', '#8a643a', '#ad8752', '#d2b07a'], SAND = ['#9c7f48', '#c9ad74', '#e2cb94', '#f5e8c0'];
const WATER = ['#14376b', '#1d5aa0', '#3a86c8', '#a9def5'], STONE = ['#3d3f4c', '#6c7083', '#9aa0b4', '#d3d8e4'];
const noise = (x: number, y: number, s: number) => {
  let h = Math.imul(x + 16 * y + 4096 * s, 0x27d4eb2d) ^ 0x9e3779b9;
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  return ((h ^ (h >>> 13)) >>> 0) / 4294967296;
};
// paint(set, rnd) fills a grid that starts at `base`; set() wraps around the edges so textures tile
function tex(base: number, paint: (set: (x: number, y: number, v: number) => void, rnd: (i: number) => number) => void, seed: number) {
  const g = Array.from({ length: 16 }, () => Array(16).fill(base));
  paint((x, y, v) => { g[((y % 16) + 16) % 16][((x % 16) + 16) % 16] = v; }, i => noise(i, 99, seed));
  return g.map(r => r.map(v => v.toString(16)).join(''));
}
const each = (f: (x: number, y: number) => void) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) f(x, y); };
const speckle = (set: (x: number, y: number, v: number) => void, seed: number, odds: [number, number][]) =>
  each((x, y) => { const n = noise(x, y, seed); let acc = 0; for (const [v, p] of odds) if (n < (acc += p)) return set(x, y, v); });
const ellipse = (set: (x: number, y: number, v: number) => void, cx: number, cy: number, rx: number, ry: number, shade: number[]) => each((x, y) => {
  const dx = (x + .5 - cx) / rx, dy = (y + .5 - cy) / ry, d = dx * dx + dy * dy;
  if (d > 1) return;
  // lit from the top left: rim → dark, lit side → light
  set(x, y, shade[d > .7 ? 0 : dx + dy < -.6 ? 3 : dx + dy < .2 ? 2 : 1]);
});
const FLOOR: Record<Ground['kind'], (v: number, flowers: boolean) => string[]> = {
  grass: (v, flowers) => tex(1, (set, rnd) => {
    speckle(set, v, [[0, .07], [2, .05]]);
    for (let i = 0; i < 5; i++) { // grass tufts: two lit blades over a dark root
      const x = Math.floor(rnd(i) * 16), y = Math.floor(rnd(i + 20) * 16);
      set(x, y, 3); set(x, y + 1, 2); set(x + 2, y + 1, 3); set(x + 2, y + 2, 2); set(x + 1, y + 2, 0);
    }
    if (flowers && v === 3) for (let i = 0; i < 2; i++) {
      const x = Math.floor(rnd(i + 40) * 16), y = Math.floor(rnd(i + 50) * 16), petal = 4 + i;
      set(x - 1, y, petal); set(x + 1, y, petal); set(x, y - 1, petal); set(x, y + 1, petal); set(x, y, 6);
    }
  }, v),
  rock: v => tex(1, (set, rnd) => {
    speckle(set, v, [[0, .06], [2, .08], [3, .01]]);
    for (let i = 0; i < 2; i++) { // cracks wander down-right
      let x = Math.floor(rnd(i) * 16), y = Math.floor(rnd(i + 9) * 16);
      for (let k = 0; k < 6; k++) { set(x, y, 0); set(x, y + 1, 2); if (rnd(i * 10 + k + 30) < .5) x++; else y++; }
    }
  }, v),
  tiles: v => tex(1, set => {
    speckle(set, v, [[0, .04], [2, .06]]);
    each((x, y) => {
      const ox = (x + (y >> 3) * 4) % 8, oy = y % 8; // flagstones, odd rows offset by half
      if (ox === 7 || oy === 7) set(x, y, 0);
      else if (ox === 0 || oy === 0) set(x, y, 2);
    });
    if (v === 3) set(5, 4, 3);
  }, v),
};
const ripples = (set: (x: number, y: number, v: number) => void, rnd: (i: number) => number) => {
  for (let i = 0; i < 5; i++) {
    const x = Math.floor(rnd(i) * 16), y = Math.floor(rnd(i + 7) * 16), n = 3 + Math.floor(rnd(i + 14) * 3);
    for (let k = 0; k < n; k++) { set(x + k, y, k && k < n - 1 && n > 3 ? 3 : 2); set(x + k + 1, y + 1, 0); }
  }
};
// class name → data URL for every ground tile of a chapter
function groundTiles(g: Ground): Record<string, string> {
  const water = g.water || WATER, pal = [...g.ramp, '#f7f2e0', '#f2a6c6', '#ffd24a'];
  const out: Record<string, string> = {};
  for (let v = 0; v < 4; v++) out['g-f' + v] = svg(paint(FLOOR[g.kind](v, !!g.flowers), ch => pal[parseInt(ch, 16)]));
  for (let v = 0; v < 2; v++) out['g-path' + v] = svg(paint(tex(1, (set, rnd) => {
    speckle(set, v + 10, [[0, .08], [2, .1], [3, .02]]);
    for (let i = 0; i < 3; i++) { const x = Math.floor(rnd(i) * 16), y = Math.floor(rnd(i + 5) * 16); set(x, y, 3); set(x + 1, y, 2); set(x, y + 1, 0); set(x + 1, y + 1, 0); }
  }, v + 10), ch => DIRT[+ch]));
  const both = [...water, ...STONE, ...SAND], wpal = (ch: string) => both[parseInt(ch, 16)];
  out['g-water'] = svg(paint(tex(1, ripples, 20), wpal));
  out['g-stone'] = svg(paint(tex(1, (set, rnd) => { ripples(set, rnd); ellipse(set, 8, 9, 7.5, 5, [2, 2, 2, 2]); ellipse(set, 8, 7.5, 6.5, 4.5, [4, 5, 6, 7]); }, 21), wpal));
  out['g-isle'] = svg(paint(tex(1, (set, rnd) => { ripples(set, rnd); ellipse(set, 8, 8.5, 8, 7, [3, 3, 3, 3]); ellipse(set, 8, 8, 7, 6, [8, 9, 10, 11]); }, 22), wpal));
  return out;
}
const TEMPLATES = new Set(Object.values(CAST).map(c => c[0]));
const NAMES = [...Object.keys(ART).filter(n => !TEMPLATES.has(n)), ...Object.keys(CAST)];

export { sprite, outfit, grid, pixels, groundTiles, PAL, NAMES };
