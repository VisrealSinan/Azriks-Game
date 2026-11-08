const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'dist');
fs.mkdirSync(out, { recursive: true });
fs.cpSync(path.join(root, 'game'), path.join(out, 'game'), { recursive: true });
fs.cpSync(path.join(root, 'assets/characters/prototype/v1'), path.join(out, 'assets/characters/prototype/v1'), { recursive: true });
fs.writeFileSync(path.join(out, 'index.html'), '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Hollowhaven</title><meta http-equiv="refresh" content="0;url=game/"><a href="game/">Enter Hollowhaven</a></html>\n');
console.log('Built dependency-free game in dist/');
