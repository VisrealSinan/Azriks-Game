#!/usr/bin/env python3
"""Validate static prototype texture metadata. Requires Pillow."""
import hashlib
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'assets/characters/prototype/v1'
manifest = json.loads((ASSETS / 'characters.json').read_text())
assert manifest['schema_version'] == 1
assert manifest['status'] == 'static_prototype'
assert len(manifest['characters']) == 2
for character in manifest['characters']:
    path = ASSETS / character['file']
    assert path.is_file(), path
    assert hashlib.sha256(path.read_bytes()).hexdigest() == character['sha256']
    with Image.open(path) as image:
        image.load()
        assert image.format == 'PNG'
        assert image.mode == 'RGBA'
        assert list(image.size) == character['canvas_px']
        alpha = image.getchannel('A')
        assert alpha.getextrema()[0] == 0, 'No transparent pixels'
        assert alpha.getextrema()[1] >= 250, 'Subject is too translucent'
        histogram = alpha.histogram()
        assert histogram[0] / (image.width * image.height) > .40
        visible = alpha.point(lambda a: 255 if a >= 128 else 0).getbbox()
        assert list(visible) == character['visible_bounds_px']
        x, y = character['pivot_px']
        assert 0 <= x <= image.width and 0 <= y <= image.height
        assert visible[3] <= y <= visible[3] + 3
        assert character['frames'] == 1 and character['animation'] is None
        print(f"PASS {character['id']}: {image.width}x{image.height} RGBA, "
              f"{histogram[0] / (image.width * image.height):.1%} fully transparent, "
              f"pivot {x},{y}, SHA-256 verified")
print('PASS: 2 static front-facing textures. Animation and engine integration are not tested.')
