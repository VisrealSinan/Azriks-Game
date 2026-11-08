# Character textures: static prototype v1

Two isolated, front-facing **static RGBA PNG textures** for the first Hollowhaven street prototype. These are importable 2D stand-ins, not finished animation, layered art, a rig, or a 3D model.

- `visreal-sinan-idle-front-v1.png`: the taller player character, wearing his black/red explorer coat and satchel. Empty hands keep this base pose reusable.
- `azrik-idle-front-v1.png`: the compact winged companion in his black/red jacket, with visible empty hands.
- `characters.json`: dimensions, alpha bounds, bottom-center ground pivots, provisional relative scale, and SHA-256 hashes.
- `GENERATION_PROMPTS.md`: exact generation prompts and source handling.

## Import convention

Each source is **1024 × 1536 pixels**, straight-alpha RGBA. Retain the alpha channel. Do not flatten onto black or import as a JPEG. The source RGB contains color in transparent pixels; a viewer that ignores alpha may show a dark red backdrop. A normal alpha-aware renderer shows the isolated character.

Positions in `characters.json` use top-left origin, +x right, +y down. Bounds are `[left, top, right, bottom]`, with right and bottom exclusive, measured at alpha ≥ 128. Ground pivots sit between the feet at the visible sole baseline. Full source bytes are unchanged. Very faint antialiasing can extend beyond those bounds, so use a threshold rather than every nonzero pixel when calculating trim bounds. Do not auto-trim without adjusting the pivot.

Use `suggested_visible_height_px / (bottom - top)` as the uniform source scale. Draw at `ground - pivot × scale`. The preview uses 360px for Visreal and 230px for Azrik, about **64% of Visreal's ear-to-sole height**. This is a proposal for readability, not locked lore or a final size requirement. Keep ground pivots aligned, not canvas bottoms. Set foot collisions separately; do not use broad wings as a collision rectangle.

For Unity-style bottom-left normalized pivots, use `(pivot_x / width, 1 - pivot_y / height)`. For top-left sprite systems, use `(pivot_x / width, pivot_y / height)`. Use linear filtering at reduced display sizes. Inspect over light and dark backgrounds before shipping; an engine may need its standard straight/premultiplied-alpha import setting.

## Preview and verification

From the repository root, run `python3 -m http.server 8000`, then open `http://localhost:8000/preview/`. The preview displays the actual texture files, supports light/night/checker backgrounds, and shares one ground baseline. It is an asset viewer, not gameplay.

Run `python3 -m pip install -r requirements-dev.txt` and `python3 tools/validate_character_assets.py` for file, alpha, bounds, pivot and hash checks. These checks passed. Generated artwork was visually inspected, but the browser preview could not be run in this environment: local Chromium failed on its socket restriction, and the available cloud browser could not access the local server. Browser layout, controls, and missing-image behavior still need a manual check. No game-engine import, walk cycle, animation, or performance test is claimed.

## Remaining production work

1. Confirm camera, on-screen size and proportions before committing directional views.
2. Create side/back poses and aligned walk/idle/interaction animation frames.
3. Build foot collision shapes and an engine-specific import configuration.
4. Review character/source licensing before commercial release.

## Rights and sources

Generated from the already-published concept boards, with the original private VRM excluded. Existing character/source licensing caveats in `../../concepts/v1/CHARACTER_ART_NOTES.md` still apply. This pack does not grant a new license or establish commercial clearance. No private original models or unrelated source files are included.
