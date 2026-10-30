// chiptune sound effects and music synthesized with Web Audio: no asset files. :sound and :music toggle them, remembered per browser
// each sound is a list of [frequency Hz, duration s, wave]; notes play back to back
const SOUNDS = {
  gold: [[988, .06, 'square'], [1319, .12, 'square']],
  heart: [[523, .08, 'triangle'], [659, .08, 'triangle'], [784, .16, 'triangle']],
  key: [[1568, .05, 'square'], [2093, .1, 'square']],
  door: [[196, .08, 'sawtooth'], [147, .14, 'sawtooth']],
  hurt: [[220, .08, 'sawtooth'], [110, .2, 'sawtooth']],
  hit: [[660, .04, 'square'], [440, .05, 'square']],
  ouch: [[150, .08, 'sawtooth']],
  round: [[784, .07, 'square'], [1047, .12, 'square']],
  win: [[523, .1, 'square'], [659, .1, 'square'], [784, .1, 'square'], [1047, .3, 'square']],
  lose: [[392, .15, 'triangle'], [330, .15, 'triangle'], [262, .4, 'triangle']],
  learn: [[659, .08, 'triangle'], [880, .08, 'triangle'], [1319, .2, 'triangle']],
  blip: [[880, .03, 'square']],
};

// music loops: lead is one note per eighth (- rests), bass one note per quarter, so bass has half as many notes as lead
// ch0..ch6 follow the chapters; every village shares one tune, shifted up per chapter (VILLAGE_KEY semitones)
export const TRACKS = {
  ch0: { bpm: 132, wave: 'square', // Hjkl Village: bright and pastoral
    lead: 'E5 - G5 - C6 - G5 - A5 G5 F5 E5 D5 - - - E5 - G5 - A5 - G5 E5 F5 E5 D5 C5 C5 - - -',
    bass: 'C3 C3 A2 A2 F2 F2 G2 G2 C3 C3 A2 A2 F2 G2 C3 C3' },
  ch1: { bpm: 144, wave: 'triangle', // Counting Fields: bouncy
    lead: 'G4 B4 D5 B4 G4 B4 D5 G5 F#5 D5 A4 D5 F#5 E5 D5 - E5 G5 E5 C5 D5 F#5 D5 B4 C5 B4 A4 F#4 G4 - - -',
    bass: 'G2 G2 D3 D3 D2 D2 D3 D3 C3 C3 D3 D3 C3 D3 G2 G2' },
  ch2: { bpm: 96, wave: 'triangle', // Typo Swamp: slow and murky
    lead: 'A4 - C5 - E5 - - D5 C5 - B4 - A4 - - - G4 - B4 - D5 - - C5 B4 - G#4 - A4 - - -',
    bass: 'A2 A2 E2 E2 F2 F2 E2 E2 G2 G2 D2 D2 E2 E2 A2 A2' },
  ch3: { bpm: 100, wave: 'triangle', // Operator Caverns: deep and echoing
    lead: 'D5 - - A4 F5 - E5 - D5 - C5 - A4 - - - D5 - - A4 G5 - F5 - E5 - C#5 - D5 - - -',
    bass: 'D2 D2 D2 D2 A#1 A#1 C2 C2 D2 D2 G1 G1 A1 A1 D2 D2' },
  ch4: { bpm: 110, wave: 'square', // Object Ruins: mysterious
    lead: 'E5 F5 E5 - B4 - C5 - B4 A4 G4 - A4 - - - E5 F5 G5 - F5 E5 D5 - E5 - B4 - E4 - - -',
    bass: 'E2 E2 F2 F2 E2 E2 D2 D2 C2 C2 D2 D2 E2 E2 E2 E2' },
  ch5: { bpm: 120, wave: 'triangle', // Shapeshifter Coast: breezy
    lead: 'C5 - F5 - A5 - G5 F5 E5 - G5 - C5 - - - D5 - F5 - A#5 - A5 G5 F5 - E5 - F5 - - -',
    bass: 'F2 F2 C3 C3 C3 C3 C2 C2 A#2 A#2 F2 F2 C3 C2 F2 F2' },
  ch6: { bpm: 150, wave: 'square', // Dr. Clicker's Tower: driving
    lead: 'C5 C5 D#5 C5 G5 - F5 D#5 D5 D5 F5 D5 G4 - - - C5 C5 D#5 C5 G#5 - G5 F5 D#5 D5 C5 B4 C5 - - -',
    bass: 'C2 C3 C2 C3 G1 G2 G1 G2 G#1 G#2 G#1 G#2 G1 G2 C2 C3' },
  village: { bpm: 108, wave: 'triangle', // cozy
    lead: 'G4 - C5 - E5 - D5 - C5 - A4 - G4 - - - F4 - A4 - C5 - B4 - G4 - B4 - C5 - - -',
    bass: 'C3 C3 A2 A2 F2 F2 C3 C3 D3 D3 G2 G2 G2 G2 C3 C3' },
  battle: { bpm: 168, wave: 'square',
    lead: 'A4 A4 C5 A4 E5 A4 D5 C5 A4 A4 C5 A4 F5 E5 D5 B4 A4 A4 C5 A4 E5 A4 G5 E5 F5 E5 D5 C5 B4 G#4 A4 -',
    bass: 'A2 A3 A2 A3 F2 F3 G2 G3 A2 A3 A2 A3 F2 E2 E2 E3' },
  boss: { bpm: 176, wave: 'sawtooth',
    lead: 'E5 E5 G5 E5 B5 A5 G5 F#5 E5 E5 G5 E5 C6 B5 A5 F#5 E5 D#5 E5 F#5 G5 F#5 G5 A5 B5 C6 B5 A5 G5 F#5 E5 -',
    bass: 'E2 E3 E2 E3 C2 C3 D2 D3 E2 E3 C2 C3 A1 B1 E2 E3' },
};
const VILLAGE_KEY = [0, 2, 4, 5, 7, -3, -2];
const SEMI = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
// 'A4' -> 440 Hz, '-' -> null
export const freq = (n, shift = 0) => {
  const m = /^([A-G]#?)(\d)$/.exec(n);
  return m ? 440 * 2 ** ((SEMI[m[1]] + 12 * (+m[2] + 1) + shift - 69) / 12) : null;
};

let ctx = null, musicBus = null, muted = false, musicOff = false;
try { muted = localStorage.getItem('vimTalesMute') === '1'; musicOff = localStorage.getItem('vimTalesMusic') === '0'; } catch {}

function ac() {
  if (!ctx) {
    ctx = new AudioContext();
    musicBus = ctx.createGain(); musicBus.gain.value = musicOff ? 0 : 1; musicBus.connect(ctx.destination);
  }
  return ctx;
}
// browsers keep audio suspended until a user gesture: resume on every keypress (cheap once running)
if (typeof document !== 'undefined') document.addEventListener('keydown', () => { try { if (ac().state === 'suspended') ctx.resume(); } catch {} });

function note(f, t, d, type, vol, out) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.value = f;
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(.001, t + d);
  o.connect(g).connect(out);
  o.start(t); o.stop(t + d);
}

export function toggleSound() {
  muted = !muted;
  try { localStorage.setItem('vimTalesMute', muted ? '1' : '0'); } catch {}
  return !muted;
}

export function sfx(name) {
  if (muted || !SOUNDS[name]) return;
  try {
    let t = ac().currentTime;
    for (const [f, d, type] of SOUNDS[name]) { note(f, t, d, type, .08, ctx.destination); t += d; }
  } catch {}
}

// ---------- music: a lookahead scheduler queues the next eighths every 100 ms ----------
let track = null, shift = 0, step = 0, next = 0, timer = null;
export function music(name) {
  const id = /^v\d$/.test(name) ? 'village' : name, sh = id === 'village' ? VILLAGE_KEY[+name[1]] : 0;
  if (id === track && sh === shift) return;
  track = id; shift = sh; step = 0; next = 0;
  timer ||= setInterval(tick, 100);
}
function tick() {
  try {
    if (!TRACKS[track] || ac().state !== 'running') return;
    const T = TRACKS[track], lead = T.lead.split(' '), bass = T.bass.split(' '), dur = 30 / T.bpm;
    if (next < ctx.currentTime) next = ctx.currentTime + .05;
    while (next < ctx.currentTime + .25) {
      const l = freq(lead[step % lead.length], shift), b = step % 2 ? null : freq(bass[(step / 2) % bass.length], shift);
      if (l) note(l, next, dur * .9, T.wave, .025, musicBus);
      if (b) note(b, next, dur * 1.8, 'triangle', .05, musicBus);
      step++; next += dur;
    }
  } catch {}
}
export function toggleMusic() {
  musicOff = !musicOff;
  try { localStorage.setItem('vimTalesMusic', musicOff ? '0' : '1'); } catch {}
  if (musicBus) musicBus.gain.value = musicOff ? 0 : 1;
  return !musicOff;
}
