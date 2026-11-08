# Add your own Hollowhaven flair

The first chapter is intentionally small, and the story is easy to edit.

## Start with `game/content.js`

- `residents`: their names, positions, coat colours, and dialogue lines. Press E again to hear the next line.
- `memories`: titles, positions, and the text that appears in the journal. Each found memory adds 18 world units to your lantern pulse reach.
- `souls`: names, night locations, and the recollections added when rescued.

Use unique `id` values. Keep at least one dialogue line for each resident. The current mission expects three souls, three wards, and three optional memories. If you change those counts, also update the objective/win conditions and text in `core.js` and `game.js`.

Coordinates use a town measuring 1800 × 1320. X increases to the right and Y increases downward. Keep interactions outside the building rectangles and night barriers in `game/core.js`. Run `npm run check` after changes; the navigation tests catch unreachable required objectives.

## Appearance

- `game/style.css`: interface colours, type, spacing, and responsive layouts.
- `game/game.js`: canvas town art, buildings, residents, fog, and effects.
- `assets/characters/prototype/v1/`: the original Visreal and Azrik textures. Keep original files intact; add a new version for replacements and update the paths in `game/game.js` and `game/index.html`.

## Systems

`game/core.js` contains movement, collision, the day/night transition, pulse combat, soul followers, guardian protection, hound behavior and objectives. Story/Nightwatch selection lives in the game state. It does not depend on the browser, so its rules can be tested with Node. `game/game.js` connects those rules to the browser and draws the world.

## Try a change

1. Change one resident’s dialogue in `game/content.js`.
2. Run `python3 -m http.server 8000` from the repository.
3. Open http://localhost:8000/game/ and speak to them with E.
4. Open the journal with J to read their story.
5. Run `npm run check` and `npm run build` before committing.

Restarting or refreshing clears a run and its journal. There is no persistent save system yet.
