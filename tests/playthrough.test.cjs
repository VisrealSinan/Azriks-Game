const test = require('node:test');
const assert = require('node:assert/strict');
const H = require('../game/core.js');

// Navigation uses the same cardinal keys and fixed simulation steps as a player.
// No player/objective/enemy positions, health, energy, timers, or spawn settings
// are overwritten. The grid is aligned to the real starting point (900, 945).
function route(g, target) {
  const sx = Math.round(g.player.x / 10), sy = Math.round((g.player.y - 5) / 10);
  const tx = Math.round(target.x / 10), ty = Math.round((target.y - 5) / 10);
  const key = (x, y) => `${x},${y}`;
  const queue = [[sx, sy]], previous = new Map([[key(sx, sy), null]]);
  let reached = false;
  for (let i = 0; i < queue.length; i++) {
    const [x, y] = queue[i];
    if (x === tx && y === ty) { reached = true; break; }
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const nx = x + dx, ny = y + dy, k = key(nx, ny);
      if (previous.has(k) || H.blocked(g, nx * 10, ny * 10 + 5)) continue;
      previous.set(k, [x,y]); queue.push([nx,ny]);
    }
  }
  assert.ok(reached, `No ${g.phase} route from ${sx},${sy} to ${tx},${ty}`);
  const result = [];
  for (let p = [tx, ty]; p; p = previous.get(key(...p))) result.push({ x: p[0] * 10, y: p[1] * 10 + 5 });
  return result.reverse().slice(1);
}
function tick(g, input, usePulse) {
  if (usePulse && g.enemies.some(e => H.dist(e, g.player) < 155)) H.pulse(g);
  H.update(g, 1 / 35, input); // Walking travels exactly five world units.
  assert.notEqual(g.phase, 'lost', `Lost at ${g.player.x},${g.player.y}, night ${g.nightTime}`);
  assert.equal(H.blocked(g, g.player.x, g.player.y), false);
}
function walk(g, target, usePulse = true) {
  for (const p of route(g, target)) {
    const input = {right: p.x > g.player.x + 1, left: p.x < g.player.x - 1,
      down: p.y > g.player.y + 1, up: p.y < g.player.y - 1};
    tick(g, input, usePulse); if (g.phase === 'won') return;
    tick(g, input, usePulse); if (g.phase === 'won') return;
    assert.ok(H.dist(g.player, p) < .001, 'Movement did not reach planned waypoint');
  }
}
function run(usePulse) {
  const g = H.createGame(); H.start(g);
  for (const b of g.beacons) { walk(g, b, usePulse); H.interact(g); assert.equal(b.lit, true); }
  walk(g, H.HOME, usePulse); H.interact(g); assert.equal(g.phase, 'night');
  for (const s of g.souls) {
    walk(g, s, usePulse); H.interact(g); assert.equal(s.state, 'following');
    walk(g, H.HOME, usePulse);
    for (let i = 0; i < 70 && s.state !== 'saved'; i++) tick(g, {}, usePulse);
    assert.equal(s.state, 'saved');
  }
  assert.equal(g.phase, 'won'); assert.equal(g.rescued, 3);
  return g;
}

test('complete walking playthrough: three wards, bell, all souls, live enemies and pulses', t => {
  const g = run(true);
  t.diagnostic(`Won in ${g.time.toFixed(1)} seconds (${g.nightTime.toFixed(1)} at night), ${g.player.hp} HP, ${g.kills} kills.`);
});
test('all wards remain reachable from home across night barriers', () => {
  const g = H.createGame(); H.start(g);
  for (const b of g.beacons) { walk(g, b); H.interact(g); }
  walk(g, H.HOME); H.interact(g);
  for (const s of g.souls) assert.ok(route(g, s).length > 0);
});
test('pause prevents nearby objectives and bell transitions, then resumes normally', () => {
  const g = H.createGame(); H.start(g); walk(g, g.beacons[0]);
  g.paused = true; const before = JSON.stringify(g); H.interact(g); H.pulse(g); H.update(g, .05, {right:true});
  assert.equal(JSON.stringify(g), before);
  g.paused = false; H.interact(g); assert.equal(g.beacons[0].lit, true);
});
test('restart creates an independent clean game after a complete win', () => {
  const old = run(true), fresh = H.createGame(); H.start(fresh);
  assert.equal(fresh.phase, 'day'); assert.equal(fresh.rescued, 0); assert.equal(fresh.kills, 0);
  assert.equal(fresh.player.hp, 5); assert.equal(fresh.player.energy, 100);
  assert.equal(fresh.beacons.some(b => b.lit), false); assert.equal(fresh.souls.length, 0);
  assert.equal(old.phase, 'won');
});

test('walking without sprint or pulses can rescue all souls with sensible routes', t => {
  const g = run(false);
  t.diagnostic(`No-sprint/no-pulse win: ${g.player.hp} HP, ${g.nightTime.toFixed(1)} seconds after dark.`);
});
