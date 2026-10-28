// vim-tales pixel art: 16x16 sprites, one char per pixel. 0-f = PICO-8 palette, w/p/q = water and dirt, '.' = transparent.
// Short rows are padded with '.'. Uppercase letters are swap slots filled per character: H hat/hair, R robe/shirt,
// T trim/pants, K skin, B beard.
const PAL: Record<string, string> = {
  0: '#000000', 1: '#1d2b53', 2: '#7e2553', 3: '#008751', 4: '#ab5236', 5: '#5f574f', 6: '#c2c3c7', 7: '#fff1e8',
  8: '#ff004d', 9: '#ffa300', a: '#ffec27', b: '#00e436', c: '#29adff', d: '#83769c', e: '#ff77a8', f: '#ffccaa',
  w: '#1d5f9c', p: '#b8925a', q: '#d9bc84',
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
    '', '', '', '...44', '..4444', '.44844444444', '444444444444444', 'ee44444444444444', 'e744444444444444',
    '.744444444444444', '..44444444444444', '..44..44...44.44', '..00..00...00.00',
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
    '', '', '....c......c', '...ccc....ccc', '..cccc....cccc', '..ccccc..ccccc', '...ccc5555ccc', '.....558855',
    '......5555', '......5555', '.....5.55.5', '....5..88..5', '...5...88...5', '.......88',
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
    '.......3', '......333', '.....33b33', '....3333333', '.....3b333', '....3333b333', '...3333333333', '....333b3333',
    '...333333b333', '..333333333333', '..3333b3333333', '.33333333333333', '......444', '......444', '.....44444',
  ],
  oak: [
    '', '.....333333', '...33bb33bb33', '..3bbbb33bbb33', '.33bbb3333bb333', '.3bbbb33bbbb333', '.33b3333bb33b33',
    '..333333333333', '...3333333333', '.....334433', '......4444', '......4444', '.....444444',
  ],
  reed: [
    '', '', '...4......4', '...4...4..4', '...3...4..3..4', '..33...3..3..4', '..3.3..3.33..3', '..3.3.33.3.3.3',
    '.3..3.3..3.3.33', '.3.33.3.33.3.3', '.3.3..3.3..33.3', '33.3.33.3..3..3', '3.33.3..3.33.33',
  ],
  boulder: [
    '', '', '', '.....555555', '...5566666655', '..566776666665', '..567766666665', '.56676666666655', '.56666666666655',
    '.55666666666555', '.55566666655555', '..555555555555', '...1111111111',
  ],
  brick: [
    '5555555555555555', '9994444599944445', '4444444544444445', '4444444544444445', '5555555555555555', '4445999444459994',
    '4445444444454444', '4445444444454444', '5555555555555555', '9994444599944445', '4444444544444445', '4444444544444445',
    '5555555555555555', '4445999444459994', '4445444444454444', '4445444444454444',
  ],
  chest: [
    '', '', '', '', '...4444444444', '..499999999994', '..4aaaaaaaaaa4', '..444444444444', '..aaaaa00aaaaa',
    '..44444aa44444', '..444444444444', '..4a44444444a4', '..aaaaaaaaaaaa',
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
    '', '.......88', '......8888', '.....888888', '....88888888', '...8888888888', '..888888888888', '.88888888888888',
    '..ffffffffffff', '..fccffff444ff', '..fccffff444ff', '..fffffff4a4ff', '..fffffff444ff', '..444444444444',
  ],
  // ---------- ground ----------
  tuft: ['', '', '', '...3.3', '....3', '', '', '', '', '', '...........3.3', '............3'],
  water: [
    'wwwwwwwwwwwwwwww', 'wwwwwwwwwwwwwwww', 'wwccwwwwwwwwwwww', 'wcwwcwwwwwwwwwww', 'wwwwwwwwwwwwwwww', 'wwwwwwwwwwwccwww',
    'wwwwwwwwwwcwwcww', 'wwwwwwwwwwwwwwww', 'wwwwwwwwwwwwwwww', 'wwwwwccwwwwwwwww', 'wwwwcwwcwwwwwwww', 'wwwwwwwwwwwwwwww',
    'wwwwwwwwwwwwwwww', 'wwwwwwwwwwwwccww', 'wwwwwwwwwwwcwwcw', 'wwwwwwwwwwwwwwww',
  ],
  stone: [
    'wwwwwwwwwwwwwwww', 'wwwwwwwwwwwwwwww', 'wwwwwwwwwwwwwwww', 'wwww55555555wwww', 'www5667766665www', 'ww566766666665ww',
    'ww566666666665ww', 'ww566666666655ww', 'ww556666666555ww', 'www5555555555www', 'wwwwccccccccwwww', 'wwwwwwwwwwwwwwww',
    'wwwwwwwwwwwwwwww', 'wwwccwwwwwwwwwww', 'wwcwwcwwwwwwwwww', 'wwwwwwwwwwwwwwww',
  ],
  path: [
    'pppppppppppppppp', 'ppppqpppppppppp4', 'pppppppppppppppp', 'ppppppppp4pppppp', 'pqpppppppppppqpp', 'pppppppppppppppp',
    'ppppp4pppppppppp', 'pppppppppppqpppp', 'pppppppppppppppp', 'ppqpppppppp4pppp', 'pppppppppppppppp', 'pppppp4ppppppppp',
    'pppppppppppppqpp', 'pqpppppppppppppp', 'pppppppp4ppppppp', 'pppppppppppppppp',
  ],
  sand: [
    'wwwwwwwwwwwwwwww', 'wwwwwccccccwwwww', 'wwwcqqqqqqqqcwww', 'wwcqqqqqqqqqqcww', 'wcqqqqpqqqqqqqcw', 'wcqqqqqqqqqpqqcw',
    'cqqqqqqqqqqqqqqc', 'cqqpqqqqqqqqqqqc', 'cqqqqqqqqqpqqqqc', 'cqqqqqqqqqqqqqqc', 'wcqqqqqpqqqqqqcw', 'wcqqqqqqqqqqqqcw',
    'wwcqqqqqqqqqqcww', 'wwwcqqqqqqqqcwww', 'wwwwwccccccwwwww', 'wwwwwwwwwwwwwwww',
  ],
};

// characters built from the sage / folk templates: [template, slot colors as "H R T K B"]
const CAST: Record<string, [string, string]> = {
  elder: ['sage', '6 1 c f 7'], wanderer: ['sage', '3 b a f f'], margin: ['sage', '2 d 7 f 7'],
  seeker: ['sage', '0 1 5 f 1'], fairy: ['sage', 'e e 7 f f'], djinn: ['sage', 'c 2 a c c'], mer: ['sage', 'c 3 b f f'],
  smith: ['sage', '5 4 9 f 4'], changeling: ['sage', 'd 2 e f f'], witch: ['sage', '0 2 b f f'], monk: ['sage', '9 9 4 f f'],
  king: ['sage', 'a d 7 6 6'], wizard: ['sage', '1 1 a f 7'],
  mom: ['folk', '4 e 2 f'], farmer: ['folk', 'a 3 4 f'], fisher: ['folk', '5 c 1 f'], shepherd: ['folk', 'f 7 4 f'],
  girl: ['folk', '9 8 1 f'], ferry: ['folk', '0 4 5 f'], scribe: ['folk', '6 2 1 f'], kid: ['folk', '4 c 4 f'],
  miner: ['folk', 'a 5 4 f'], hermit: ['folk', '7 d 5 f'], dwarf: ['folk', '9 4 5 f'], captain: ['folk', '8 1 8 f'],
  teacher: ['folk', '5 3 1 f'], nine: ['folk', 'a 9 4 f'],
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

// sprite name → SVG data URL (horizontal runs merged into one rect)
const cache = new Map<string, string>();
function sprite(name: string): string {
  let url = cache.get(name);
  if (url) return url;
  let rects = '';
  grid(name).forEach((row, y) => {
    for (let x = 0; x < row.length;) {
      const ch = row[x];
      let n = 1;
      while (row[x + n] === ch) n++;
      if (ch !== '.') rects += `<rect x="${x}" y="${y}" width="${n}" height="1" fill="${PAL[ch]}"/>`;
      x += n;
    }
  });
  url = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges">${rects}</svg>`)}`;
  cache.set(name, url);
  return url;
}
const NAMES = [...Object.keys(ART).filter(n => n !== 'sage' && n !== 'folk'), ...Object.keys(CAST)];

export { sprite, grid, PAL, NAMES };
