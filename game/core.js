(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Hollowhaven = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const WORLD = { w: 1800, h: 1320 };
  const HOME = { x: 900, y: 1050, r: 135 };
  const BUILDINGS = [
    { x: 80, y: 60, w: 300, h: 185, name: 'THE LAST INN', type: 'inn' },
    { x: 510, y: 70, w: 310, h: 195, name: 'HOUSE OF NAMES' },
    { x: 1010, y: 65, w: 270, h: 200, name: 'THE SILENT ARCHIVE' },
    { x: 1430, y: 65, w: 285, h: 185, name: 'MOURNING HOUSE' },
    { x: 75, y: 490, w: 315, h: 225, name: 'CANDLEKEEPER' },
    { x: 540, y: 480, w: 240, h: 250, name: 'THE OLD COURT' },
    { x: 1030, y: 480, w: 250, h: 250, name: 'THE FORGOTTEN' },
    { x: 1440, y: 500, w: 280, h: 220, name: 'GLASS CHAPEL' },
    { x: 90, y: 960, w: 335, h: 265, name: 'THE VEIL MARKET' },
    { x: 550, y: 1080, w: 175, h: 160, name: 'KEEPER’S REST' },
    { x: 1060, y: 1080, w: 190, h: 160, name: 'BELL HOUSE' },
    { x: 1460, y: 1120, w: 255, h: 120, name: 'THE FAR GATE' }
  ];
  const RIFTS = [{ x: 475, y: 310, w: 45, h: 155 }, { x: 1285, y: 770, w: 175, h: 42 }, { x: 735, y: 820, w: 40, h: 150 }];
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  function createGame() {
    return {
      phase: 'title', time: 0, nightTime: 0, rescued: 0, pulses: [], kills: 0, pulseCooldown: 0,
      player: { x: 900, y: 945, r: 15, hp: 5, energy: 100, hurt: 0, facing: 1, moving: false },
      companion: { x: 950, y: 920 },
      beacons: [{ x: 270, y: 350, lit: false, name: 'Inn lantern' }, { x: 1520, y: 350, lit: false, name: 'Mourning lantern' }, { x: 1400, y: 1000, lit: false, name: 'Gate lantern' }],
      souls: [], enemies: [], spawnIn: 2, message: 'Azrik: The town is quiet. Too quiet. Light the three ward lanterns before we ring the bell.', messageTime: 9,
      events: [], paused: false, seed: 137
    };
  }
  function tell(g, text, seconds = 6) { g.message = text; g.messageTime = seconds; }
  function start(g) { if (g.phase === 'title') { g.phase = 'day'; g.events.push('start'); } }
  function random(g) { g.seed = (Math.imul(g.seed, 1664525) + 1013904223) >>> 0; return g.seed / 4294967296; }
  function blocked(g, x, y, r = 15) {
    if (x < 35 + r || y < 35 + r || x > WORLD.w - 35 - r || y > WORLD.h - 35 - r) return true;
    return BUILDINGS.concat(g.phase === 'night' ? RIFTS : []).some(b => x + r > b.x && x - r < b.x + b.w && y + r > b.y && y - r < b.y + b.h);
  }
  function move(g, actor, dx, dy, r) {
    if (!blocked(g, actor.x + dx, actor.y, r)) actor.x += dx;
    if (!blocked(g, actor.x, actor.y + dy, r)) actor.y += dy;
  }
  function nearest(g) {
    if (g.phase === 'day') {
      const beacon = g.beacons.find(b => !b.lit && dist(b, g.player) < 86);
      if (beacon) return { type: 'beacon', item: beacon, label: 'Light ward lantern' };
      if (dist(g.player, HOME) < 125) return { type: 'bell', label: g.beacons.every(b => b.lit) ? 'Ring the night bell' : 'The bell needs three lit wards' };
    }
    if (g.phase === 'night') {
      const soul = g.souls.find(s => s.state === 'lost' && dist(s, g.player) < 90);
      if (soul) return { type: 'soul', item: soul, label: 'Call the lost soul' };
    }
    return null;
  }
  function beginNight(g) {
    if (g.phase !== 'day' || !g.beacons.every(b => b.lit)) return false;
    g.phase = 'night'; g.nightTime = 0;
    g.player.energy = 100; g.player.hp = 5;
    g.souls = [{ x: 250, y: 335, name: 'The Lamplighter', state: 'lost' }, { x: 1550, y: 350, name: 'The Musician', state: 'lost' }, { x: 1390, y: 980, name: 'The Wanderer', state: 'lost' }];
    g.enemies = [{ x: 900, y: 380, hp: 2, stun: 0 }, { x: 450, y: 800, hp: 2, stun: 0 }, { x: 1380, y: 420, hp: 2, stun: 0 }];
    // Relocate safely if a future layout change would raise a wall under the player.
    if (blocked(g, g.player.x, g.player.y)) { g.player.x = HOME.x; g.player.y = HOME.y; }
    tell(g, 'Azrik: The streets have shifted. Find the three lost souls. Call them with E, then lead them into our sanctuary.', 10);
    g.events.push('night'); return true;
  }
  function interact(g) {
    if (g.paused) return;
    const n = nearest(g); if (!n) return;
    if (n.type === 'beacon') {
      n.item.lit = true; g.events.push('light');
      const count = g.beacons.filter(b => b.lit).length;
      tell(g, count === 3 ? 'Azrik: All three wards are burning. Return to the sanctuary and ring the bell.' : `Ward ${count} of 3 lit. Its light will mark our way home.`);
    } else if (n.type === 'bell') {
      if (!beginNight(g)) tell(g, 'Light all three ward lanterns first. Follow the gold markers on the map.');
    } else if (n.type === 'soul') {
      n.item.state = 'following'; g.events.push('soul');
      tell(g, `${n.item.name}: I remember that light. Please… take me home.`);
    }
  }
  function pulse(g) {
    if (g.paused || g.phase !== 'night' || g.pulseCooldown > 0 || g.player.energy < 24) return false;
    g.player.energy -= 24; g.pulseCooldown = 1.15;
    g.pulses.push({ x: g.player.x, y: g.player.y, age: 0 }); g.events.push('pulse');
    for (const e of g.enemies) if (dist(e, g.player) < 185) { e.hp--; e.stun = 1.6; }
    const alive = g.enemies.filter(e => e.hp > 0); g.kills += g.enemies.length - alive.length; g.enemies = alive;
    return true;
  }
  function update(g, dt, input = {}) {
    if (g.paused || !['day', 'night'].includes(g.phase)) return;
    dt = clamp(dt, 0, 0.05); g.time += dt;
    g.messageTime = Math.max(0, g.messageTime - dt);
    g.pulseCooldown = Math.max(0, g.pulseCooldown - dt);
    const p = g.player; p.hurt = Math.max(0, p.hurt - dt);
    let x = (input.right ? 1 : 0) - (input.left ? 1 : 0), y = (input.down ? 1 : 0) - (input.up ? 1 : 0);
    const length = Math.hypot(x, y); p.moving = length > 0;
    if (x) p.facing = x > 0 ? 1 : -1;
    const sprint = input.sprint && p.energy > 4 && length > 0;
    const speed = sprint ? 260 : 175;
    if (length) move(g, p, x / length * speed * dt, y / length * speed * dt, p.r);
    p.energy = clamp(p.energy + (sprint ? -18 : 12) * dt, 0, 100);
    g.companion.x += (p.x + 40 - g.companion.x) * Math.min(1, dt * 5);
    g.companion.y += (p.y - 20 - g.companion.y) * Math.min(1, dt * 5);
    g.pulses.forEach(v => v.age += dt); g.pulses = g.pulses.filter(v => v.age < 0.65);
    if (g.phase !== 'night') return;
    g.nightTime += dt; g.spawnIn -= dt;
    if (g.spawnIn <= 0) {
      g.spawnIn = Math.max(5, 11 - g.nightTime / 30);
      if (g.enemies.length < 12) {
        const points = [{ x: 60, y: 380 }, { x: 1750, y: 820 }, { x: 900, y: 60 }, { x: 500, y: 1260 }];
        const q = points[Math.floor(random(g) * points.length)];
        g.enemies.push({ ...q, hp: 2, stun: 0 });
      }
    }
    for (const e of g.enemies) {
      e.stun = Math.max(0, e.stun - dt);
      const d = dist(e, p);
      if (e.stun === 0) {
        const safe = dist(p, HOME) < HOME.r;
        const direction = safe && dist(e, HOME) < HOME.r + 45 ? -1 : 1;
        // Wraiths drift through buildings; this is deliberate and makes their approach readable.
        if (d > 1) {
          e.x += (p.x - e.x) / d * 64 * dt * direction;
          e.y += (p.y - e.y) / d * 64 * dt * direction;
        }
        if (d < 33 && p.hurt <= 0 && !safe) { p.hp--; p.hurt = 1.8; e.stun = 1; g.events.push('hurt'); }
      }
    }
    let leader = p;
    for (const s of g.souls) if (s.state === 'following') {
      const d = dist(s, leader);
      // Souls are incorporeal and safely follow through the shifting walls.
      if (d > 38) { s.x += (leader.x - s.x) / d * Math.min(d - 38, 210 * dt); s.y += (leader.y - s.y) / d * Math.min(d - 38, 210 * dt); }
      leader = s;
      if (dist(s, HOME) < HOME.r - 25) { s.state = 'saved'; g.rescued++; g.events.push('save'); p.hp = Math.min(5, p.hp + 1); tell(g, `${g.rescued} of 3 souls sheltered. The sanctuary mends your wounds.`); }
    }
    if (p.hp <= 0) { g.phase = 'lost'; g.events.push('lost'); }
    else if (g.rescued === 3) { g.phase = 'won'; g.events.push('won'); }
  }
  return { WORLD, HOME, BUILDINGS, RIFTS, dist, clamp, createGame, start, nearest, beginNight, interact, pulse, update, blocked };
});
