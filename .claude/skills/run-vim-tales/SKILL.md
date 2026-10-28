---
name: run-vim-tales
description: Launch vim-tales (Vite dev server) and drive it in headless Chromium with key presses to take screenshots of the menu, overworld map, battles, or the :lessons index. Use when asked to run, screenshot, or visually check the game.
---

# Run vim-tales and screenshot it

The game is keyboard-only, so it's driven by key presses over the Chrome DevTools protocol.
`drive.js` (next to this file) uses the Chromium that Playwright already caches in
`~/Library/Caches/ms-playwright` (no Playwright npm package needed). If none is cached:
`npx playwright install chromium-headless-shell`. `qlmanage` hangs on the game's SVGs, so don't use it.

## 1. Start the dev server (macOS has no `timeout`: poll with a loop)

```bash
cd <repo>
lsof -ti:5173 -sTCP:LISTEN >/dev/null || (npx vite --port 5173 > "$SCRATCH/vite.log" 2>&1 &)
for i in $(seq 30); do curl -sf http://localhost:5173 >/dev/null && echo up && break; sleep 1; done
```

## 2. Drive it

`bun .claude/skills/run-vim-tales/drive.js <out-dir> <step>...`. Each step is `SHOT` or a
space-separated key list (`Enter`, `Esc`, or single characters). It prints each screenshot path and
any console errors. Each run starts from a fresh browser profile (no save), so the title menu shows "New game" first.

Known sequences:

| Goal | Steps |
|---|---|
| Title menu | `SHOT` |
| New game → chapter I map (name, difficulty, skip tutorial, click through intro) | `"Enter Enter Enter" Esc "Enter Enter Enter Enter Enter Enter Enter Enter Enter Enter Enter Enter Enter Enter Enter Enter" SHOT` |
| Then the lesson index | `": l e s s o n s Enter" SHOT` |
| Then move down the index | `"j j j" SHOT` |
| Run any : command | `": h e l p Enter" SHOT` |

The intro dialog needs ~16 Enters. If a screenshot still shows a dialog box, add more `Enter`s before typing `:`.

Example:

```bash
bun .claude/skills/run-vim-tales/drive.js "$SCRATCH/shots" "Enter Enter Enter" Esc \
  "Enter Enter Enter Enter Enter Enter Enter Enter Enter Enter Enter Enter Enter Enter Enter Enter" SHOT \
  ": l e s s o n s Enter" SHOT
```

Then **Read the PNGs and look at them**. A dialog still covering the map, or a blank frame, means the steps were off.

## 3. Stop the server

```bash
lsof -ti:5173 -sTCP:LISTEN | xargs kill
```
