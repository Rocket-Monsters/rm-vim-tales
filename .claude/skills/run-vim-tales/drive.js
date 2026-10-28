// Headless-Chromium driver for vim-tales over the DevTools protocol (no Playwright package needed, just its cached browser).
// usage: bun drive.js <out-dir> <step>...   step = "SHOT" (screenshot) or space-separated keys ("Enter", "Esc", or single chars)
// env: URL (default http://localhost:5173/), CHROME (default: newest Playwright chromium_headless_shell in ~/Library/Caches/ms-playwright)
import { readdirSync, mkdirSync } from 'node:fs';
const [out, ...steps] = process.argv.slice(2);
if (!out) { console.error('usage: bun drive.js <out-dir> <step>...'); process.exit(2); }
mkdirSync(out, { recursive: true });
const cache = `${process.env.HOME}/Library/Caches/ms-playwright`;
const shell = readdirSync(cache).filter(d => d.startsWith('chromium_headless_shell-')).sort((a, b) => +b.split('-')[1] - +a.split('-')[1])[0];
const bin = process.env.CHROME || (shell && `${cache}/${shell}/${readdirSync(`${cache}/${shell}`).find(d => d.startsWith('chrome-headless-shell'))}/chrome-headless-shell`);
if (!bin) { console.error('no Chromium found: set CHROME or run `npx playwright install chromium-headless-shell`'); process.exit(2); }
const port = 9333, proc = Bun.spawn([bin, '--headless', `--remote-debugging-port=${port}`, '--no-sandbox', 'about:blank'], { stderr: 'ignore' });
let tabs; for (let i = 0; i < 50 && !tabs; i++) { try { tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); } catch { await Bun.sleep(200); } }
const ws = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl);
await new Promise(r => (ws.onopen = r));
let id = 0; const waiting = new Map(), errors = [];
ws.onmessage = e => {
  const m = JSON.parse(e.data);
  if (m.id) waiting.get(m.id)?.(m.result);
  if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description);
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push(m.params.args.map(a => a.value ?? a.description).join(' '));
};
const send = (method, params = {}) => new Promise(r => { waiting.set(++id, r); ws.send(JSON.stringify({ id, method, params })); });
await send('Runtime.enable'); await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1400, height: 900, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: process.env.URL || 'http://localhost:5173/' }); await Bun.sleep(2500);
const KEY = { Enter: ['Enter', 13], Esc: ['Escape', 27] };
let shot = 0;
for (const s of steps) {
  if (s === 'SHOT') {
    const { data } = await send('Page.captureScreenshot', { format: 'png' });
    await Bun.write(`${out}/shot${++shot}.png`, Buffer.from(data, 'base64'));
    console.log(`${out}/shot${shot}.png`);
    continue;
  }
  for (const k of s.split(' ')) {
    const [key, code] = KEY[k] || [k, k.charCodeAt(0)];
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key, windowsVirtualKeyCode: code, ...(KEY[k] ? {} : { text: k }) });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key, windowsVirtualKeyCode: code });
    await Bun.sleep(120);
  }
  await Bun.sleep(400);
}
console.log('errors:', errors.length ? errors : 'none');
proc.kill(); process.exit(0);
