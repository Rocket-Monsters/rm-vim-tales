# vim-tales

A retro RPG that teaches Vim. Walk the overworld Zelda-style with real Vim motions,
talk to sages to learn new commands, and fight Final-Fantasy-style battles where
every spell is a Vim edit — the fewer keystrokes, the harder you hit.

Five chapters, from `hjkl` to text objects, dot-repeat and registers.

## Play

```sh
bun install
bun run dev       # local server with hot reload → http://localhost:5173
bun run build     # static site in dist/ — publish only that folder
bun run preview   # serve dist/ locally to check the build
bun run test      # type check + every level solvable, every map passable
```

Press `:` in game for the command line (`:help`, `:quest`, `:spells`, `:dojo`, `:level`, `:name`, ...).

## Structure

```
index.html              Vite entry, mounts the Solid app
src/
  main.tsx              render(<App />)
  App.tsx               layout, starts the game controller on mount
  styles.css
  components/           Header, Overworld, Dialog, Battle, Screens (menu, wizard, dojo) markup
  ui/controller.js      game loop: menu, tutorial, dojo, overworld, dialog, battles, : commands
  ui/i18n.js            English / Spanish UI text and lessons
  core/                 pure typed logic, no DOM
    engine.ts           the Vim subset (modes, counts, operators, motions, text objects, undo, .)
    game.ts             overworld movement and procedural battle rounds
    story.ts            chapters, maps, NPCs, monsters ([en, es] text)
    sprites.ts          16x16 pixel art (PICO-8 palette) rendered as SVG
tests/core.test.js
```

## License

MIT
