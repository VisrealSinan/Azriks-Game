# Hollowhaven: The First Night

A small **playable single-player vertical slice** of Azriks Game. Explore a gothic town at the edge of the afterlife as **Visreal Sinan**, with **Azrik** following at your side.

## Hosted playtest

[Play Hollowhaven: The First Night](https://hollowhaven-first-night.dependablegear.chatgpt.site)

The hosted build is private to the project owner. The repository remains public; visitors can run their own local copy below.

## Play locally

No packages or game engine are required. From the repository:

```sh
python3 -m http.server 8000
```

Open **http://localhost:8000/game/** in a modern desktop browser. You can also open `game/index.html` directly. The game uses local scripts and images, with no backend.

1. Find and light the three ward lanterns before nightfall.
2. Return to the sanctuary and ring the bell. The streets change and wraiths appear.
3. Call each lost soul and guide all three back to the sanctuary.

**WASD / arrows:** move · **E:** interact · **Space:** lantern pulse · **Shift:** run · **Escape:** pause · **M:** sound. Touch controls are included. The sanctuary is safe; delivering a soul restores one health. Win, lose, and restart are implemented.

This is a forgiving first playtest, not the full game. **Networked co-op is not implemented.** Azrik follows the player automatically. Characters use their existing static front-facing textures with simple motion effects, not rigged animations.

## Development and checks

```sh
npm run check
npm run build
```

Node.js 22+ is used for checks and packaging; there are no npm dependencies. `npm run build` copies the playable game and its textures to `dist/`. `npm run check` runs syntax checks and 16 gameplay tests, including full normal-movement playthroughs with live enemies and all three soul rescues. A GitHub Actions workflow repeats the checks and build on pushes and pull requests.

Read [play instructions, verification results and limitations](docs/PLAYTEST.md).

## Character assets and viewer

- [Visreal Sinan transparent front pose](assets/characters/prototype/v1/visreal-sinan-idle-front-v1.png)
- [Azrik transparent front pose](assets/characters/prototype/v1/azrik-idle-front-v1.png)
- [Import notes](assets/characters/prototype/v1/README.md), [metadata](assets/characters/prototype/v1/characters.json), and [generation prompts](assets/characters/prototype/v1/GENERATION_PROMPTS.md)
- [Original concept boards](assets/characters/concepts/v1/) and [concept art notes](assets/characters/concepts/v1/CHARACTER_ART_NOTES.md)
- Local asset viewer: **http://localhost:8000/preview/** using the same local server.

To validate the original textures:

```sh
python3 -m pip install -r requirements-dev.txt
python3 tools/validate_character_assets.py
```

Both textures are 1024 × 1536 RGBA PNGs with ground-pivot metadata. They contain one static pose each, no animation or rig. Original source PNGs and historical concept files are preserved. The reference VRM and private source files are not included. Existing source-handling and licensing caveats still apply; no commercial clearance is implied by generated assets.

## Next development steps

Directional character animation, a more detailed town, richer encounters, and eventually real co-op networking. The current prototype keeps that larger vision separate from what is actually playable today.
