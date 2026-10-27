# >_ rm-vim-tails

A retro RPG that teaches Vim. Walk the overworld Zelda-style with real Vim motions,
talk to sages to learn new commands, and fight Final-Fantasy-style battles where
every spell is a Vim edit — the fewer keystrokes, the harder you hit.

Five chapters, from `hjkl` to text objects, dot-repeat and registers.

## Play

No build, no dependencies. Open `index.html` in a browser.

Press `:` in game for the command line (`:help`, `:quest`, `:spells`, `:hint`, ...).

## Files

- `engine.js` — the Vim subset (modes, counts, operators, motions, text objects, undo, `.`)
- `game.js` — overworld movement and procedural battle rounds
- `story.js` — chapters, maps, NPCs, monsters
- `index.html` — UI
- `test.js` — `node test.js` checks every level is solvable and every map is passable

## License

MIT
