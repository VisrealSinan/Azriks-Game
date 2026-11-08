# Hollowhaven: Azriks Game

Early character asset development for a gothic street-exploration game, with **Visreal Sinan** as the player and **Azrik** as his compact winged companion.

## New: transparent prototype textures

The first isolated front-facing textures are ready to try as static 2D stand-ins. Both are 1024 × 1536 RGBA PNGs with ground-pivot and provisional scale metadata.

- [Visreal Sinan transparent front pose](assets/characters/prototype/v1/visreal-sinan-idle-front-v1.png)
- [Azrik transparent front pose](assets/characters/prototype/v1/azrik-idle-front-v1.png)
- [Import notes and verification status](assets/characters/prototype/v1/README.md)
- [Character metadata](assets/characters/prototype/v1/characters.json)
- [Generation prompts](assets/characters/prototype/v1/GENERATION_PROMPTS.md)

### Local character viewer

Run `python3 -m http.server 8000` from this repository, then open **http://localhost:8000/preview/**. The viewer uses the actual transparent textures and offers light, night and alpha-grid backgrounds, a scale slider and a shared ground line. It is a local asset viewer, not a deployed website or playable game. Browser rendering remains unverified in the build environment; see the import notes.

### Check the assets

```sh
python3 -m pip install -r requirements-dev.txt
python3 tools/validate_character_assets.py
```

These checks verify file format, transparency, dimensions, alpha bounds, ground pivots and exact hashes. They do not test an engine import or gameplay. Each character currently has **one static pose, no animation and no rig**.

## Character concepts

The original concept boards remain available for design review. They are not sprite sheets or animation atlases.

- [Visreal Sinan concept board](assets/characters/concepts/v1/visreal-sinan-concept-v1.png)
- [Azrik concept board](assets/characters/concepts/v1/azrik-concept-v1.png)
- [Concept art notes and next steps](assets/characters/concepts/v1/CHARACTER_ART_NOTES.md)
- [Concept generation prompts](assets/characters/concepts/v1/GENERATION_PROMPTS.md)

## Next milestone

Choose the game camera and target on-screen size, then create directional views and aligned movement frames for a small explorable street scene. The current artwork keeps Visreal as the taller explorer and Azrik as the smaller companion; proportions remain open for review.

The original reference VRM and private source files are not included. Existing source-handling and licensing caveats still apply. No commercial clearance is implied by these generated assets.
