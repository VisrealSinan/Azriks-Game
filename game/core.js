(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./content.js'));
  else root.Hollowhaven = factory(root.HollowhavenContent);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (CONTENT) {
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
  function createGame(mode = 'story') {
    return {
      mode: mode === 'nightwatch' ? 'nightwatch' : 'story',
      guardTime: 0, guardCooldown: 0, guardUses: 0, damageTaken: 0, soulScatters: 0, spawnCount: 0,
      phase: 'title', time: 0, nightTime: 0, rescued: 0, pulses: [], kills: 0, pulseCooldown: 0,
      player: { x: 900, y: 945, r: 15, hp: 5, energy: 100, hurt: 0, facing: 1, moving: false },
      companion: { x: 950, y: 920 },
      beacons: [{ x: 270, y: 350, lit: false, name: 'Inn lantern' }, { x: 1520, y: 350, lit: false, name: 'Mourning lantern' }, { x: 1400, y: 1000, lit: false, name: 'Gate lantern' }],
      souls: [], enemies: [], spawnIn: 2,
      memories: CONTENT.memories.map(item => ({ ...item, found: false })),
      residents: CONTENT.residents.map(item => ({ ...item, lines: [...item.lines], spoken: 0 })),
      journal: [], message: 'Azrik: The town is quiet. Too quiet. Light the three ward lanterns before we ring the bell.', messageTime: 9,
      events: [], paused: false, seed: 137
    };
  }
  function tell(g, text, seconds = 6) { g.message = text; g.messageTime = seconds; }
  function chooseMode(g, mode) {
    if (g.phase !== 'title' || !['story', 'nightwatch'].includes(mode)) return false;
    g.mode = mode; return true;
  }
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
    if (['day', 'night'].includes(g.phase)) {
      const memory = g.memories.find(item => !item.found && dist(item, g.player) < 72);
      if (memory) return { type: 'memory', item: memory, label: 'Gather a memory' };
      if (g.phase === 'day') {
        const resident = g.residents.find(item => dist(item, g.player) < 78);
        if (resident) return { type: 'resident', item: resident, label: `Speak with ${resident.name.split(',')[0]}` };
      }
    }
    return null;
  }
  function beginNight(g) {
    if (g.phase !== 'day' || !g.beacons.every(b => b.lit)) return false;
    g.phase = 'night'; g.nightTime = 0;
    g.player.energy = 100; g.player.hp = 5;
    g.souls = CONTENT.souls.map(s => ({ ...s, state: 'lost', recallGrace: 0 }));
    g.enemies = [{ x: 900, y: 380, hp: 2, stun: 0 }, { x: 450, y: 800, hp: 2, stun: 0 }, { x: 1380, y: 420, hp: 2, stun: 0 }];
    if (g.mode === 'nightwatch') {
      g.enemies.push(makeHunter(1200, 835), makeHunter(520, 810));
    }
    // Relocate safely if a future layout change would raise a wall under the player.
    if (blocked(g, g.player.x, g.player.y)) { g.player.x = HOME.x; g.player.y = HOME.y; }
    tell(g, g.mode === 'nightwatch'
      ? 'Azrik: The hounds are awake. Sidestep their amber warning. Q calls my shelter; E recalls a scattered soul.'
      : 'Azrik: Find the three lost souls. E calls them, Space pushes back wraiths, and Q calls my shelter. Bring them home.', 12);
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
    } else if (n.type === 'memory') {
      n.item.found = true;
      g.journal.push({ id: n.item.id, title: n.item.title, text: n.item.text, kind: 'memory' });
      g.events.push('memory');
      tell(g, `Memory found: ${n.item.title}. Your lantern reaches farther. Open the journal with J to read it.`, 7);
    } else if (n.type === 'resident') {
      const resident = n.item;
      tell(g, `${resident.name}: ${resident.lines[resident.spoken % resident.lines.length]}`, 9);
      if (!g.journal.some(entry => entry.id === resident.id)) {
        g.journal.push({ id: resident.id, title: resident.name, text: resident.lines.join(' '), kind: 'resident' });
      }
      resident.spoken++;
      g.events.push('talk');
    } else if (n.type === 'soul') {
      n.item.state = 'following'; n.item.recallGrace = 2.5; g.events.push('soul');
      tell(g, `${n.item.name}: I remember that light. Please… take me home.`);
    }
  }
  function pulseRadius(g) { return 185 + g.memories.filter(item => item.found).length * 18; }
  function pulse(g) {
    if (g.paused || g.phase !== 'night' || g.pulseCooldown > 0 || g.player.energy < 24) return false;
    g.player.energy -= 24; g.pulseCooldown = 1.15;
    g.pulses.push({ x: g.player.x, y: g.player.y, age: 0, radius: pulseRadius(g) }); g.events.push('pulse');
    for (const e of g.enemies) if (dist(e, g.player) < pulseRadius(g)) { e.hp--; e.stun = 1.6; if (e.type === 'hunter') { e.mode = 'recover'; e.modeTime = 1.4; } }
    const alive = g.enemies.filter(e => e.hp > 0); g.kills += g.enemies.length - alive.length; g.enemies = alive;
    return true;
  }
  function makeHunter(x, y) {
    return { x, y, hp: 3, stun: 0, type: 'hunter', mode: 'stalk', modeTime: 0, aimX: 0, aimY: 1 };
  }
  function guard(g) {
    if (g.paused || g.phase !== 'night' || g.guardCooldown > 0) return false;
    g.guardTime = 3; g.guardCooldown = 18; g.guardUses++;
    for (const e of g.enemies) if (dist(e, g.player) < 175) {
      e.stun = Math.max(e.stun, .8);
      if (e.type === 'hunter') { e.mode = 'recover'; e.modeTime = 1.4; }
    }
    tell(g, 'Azrik: Under my wings. Keep the souls close!', 3);
    g.events.push('guard'); return true;
  }
  function protectedByGuard(g, actor) { return g.guardTime > 0 && dist(actor, g.player) < 175; }
  function updateHunter(g, e, dt, safe) {
    const p = g.player, d = dist(e, p);
    if (safe && dist(e, HOME) < HOME.r + 60) {
      const hd = Math.max(1, dist(e, HOME));
      e.x += (e.x - HOME.x) / hd * 80 * dt;
      e.y += (e.y - HOME.y) / hd * 80 * dt;
      e.mode = 'recover'; e.modeTime = 1.4; return;
    }
    if (e.mode === 'tell') {
      e.modeTime -= dt;
      if (e.modeTime <= 0) { e.mode = 'dash'; e.modeTime = .42; g.events.push('dash'); }
    } else if (e.mode === 'dash') {
      // Fixed aim makes every charge dodgeable rather than homing on the player.
      const travel = Math.min(dt, e.modeTime);
      e.x = clamp(e.x + e.aimX * 430 * travel, 30, WORLD.w - 30);
      e.y = clamp(e.y + e.aimY * 430 * travel, 30, WORLD.h - 30);
      e.modeTime -= dt;
      if (e.modeTime <= 0) { e.mode = 'recover'; e.modeTime = 1.4; }
    } else if (e.mode === 'recover') {
      e.modeTime -= dt; if (e.modeTime <= 0) e.mode = 'stalk';
    } else if (!safe && d < 300 && d > 1) {
      e.mode = 'tell'; e.modeTime = .8; e.aimX = (p.x - e.x) / d; e.aimY = (p.y - e.y) / d;
      g.events.push('warning');
    } else if (d > 1) {
      e.x += (p.x - e.x) / d * 78 * dt; e.y += (p.y - e.y) / d * 78 * dt;
    }
  }
  function moveSoulToSafety(g, soul) {
    if (!blocked(g, soul.x, soul.y)) return;
    // Spectral followers cross roofs. A broken trail must never strand a lost
    // soul inside solid geometry, beyond the player's interaction radius.
    for (let radius = 20; radius <= 2400; radius += 20) {
      for (let step = 0; step < 32; step++) {
        const angle = step * Math.PI / 16;
        const x = soul.x + Math.cos(angle) * radius, y = soul.y + Math.sin(angle) * radius;
        if (!blocked(g, x, y)) { soul.x = x; soul.y = y; return; }
      }
    }
    soul.x = HOME.x; soul.y = HOME.y;
  }
  function update(g, dt, input = {}) {
    if (g.paused || !['day', 'night'].includes(g.phase)) return;
    dt = clamp(dt, 0, 0.05); g.time += dt;
    g.messageTime = Math.max(0, g.messageTime - dt);
    g.pulseCooldown = Math.max(0, g.pulseCooldown - dt);
    g.guardTime = Math.max(0, g.guardTime - dt);
    g.guardCooldown = Math.max(0, g.guardCooldown - dt);
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
      g.spawnIn = g.mode === 'nightwatch' ? Math.max(4, 8 - g.nightTime / 40) : Math.max(5, 11 - g.nightTime / 30);
      if (g.enemies.length < 12) {
        const points = [{ x: 60, y: 380 }, { x: 1750, y: 820 }, { x: 900, y: 60 }, { x: 500, y: 1260 }];
        const q = points[Math.floor(random(g) * points.length)];
        g.spawnCount++;
        g.enemies.push(g.mode === 'nightwatch' && g.spawnCount % 3 === 0 ? makeHunter(q.x, q.y) : { ...q, hp: 2, stun: 0 });
      }
    }
    for (const e of g.enemies) {
      e.stun = Math.max(0, e.stun - dt);
      if (e.stun > 0) continue;
      const safe = dist(p, HOME) < HOME.r;
      if (e.type === 'hunter') updateHunter(g, e, dt, safe);
      else {
        const d = dist(e, p), direction = safe && dist(e, HOME) < HOME.r + 45 ? -1 : 1;
        const speed = g.mode === 'nightwatch' ? 78 : 64;
        // Spectral enemies drift through buildings; their attack cues remain visible.
        if (d > 1) { e.x += (p.x - e.x) / d * speed * dt * direction; e.y += (p.y - e.y) / d * speed * dt * direction; }
      }
      if (dist(e, p) < 33 && p.hurt <= 0 && !safe && !protectedByGuard(g, p)) {
        p.hp--; p.hurt = 1.8; e.stun = 1; g.damageTaken++; g.events.push('hurt');
      }
    }
    let leader = p;
    for (const s of g.souls) s.recallGrace = Math.max(0, (s.recallGrace || 0) - dt);
    for (const s of g.souls) if (s.state === 'following') {
      if (g.mode === 'nightwatch' && !s.recallGrace && dist(s, HOME) >= HOME.r && !protectedByGuard(g, s) && g.enemies.some(e => e.stun <= 0 && dist(e, s) < 28)) {
        s.state = 'lost'; s.recallGrace = 2.5; moveSoulToSafety(g, s); g.soulScatters++; g.events.push('scatter');
        tell(g, 'Azrik: Their trail broke! Call the scattered soul again with E. My shelter keeps them safe.', 6);
        continue;
      }
      const d = dist(s, leader);
      // Souls are incorporeal and safely follow through the shifting walls.
      if (d > 38) { s.x += (leader.x - s.x) / d * Math.min(d - 38, 210 * dt); s.y += (leader.y - s.y) / d * Math.min(d - 38, 210 * dt); }
      leader = s;
      if (dist(s, HOME) < HOME.r - 25) { s.state = 'saved'; g.rescued++; g.events.push('save'); g.journal.push({ id: s.id, title: s.name, text: s.recollection, kind: 'soul' }); p.hp = Math.min(5, p.hp + 1); tell(g, `${g.rescued} of 3 souls sheltered. The sanctuary mends your wounds.`); }
    }
    if (p.hp <= 0) { g.phase = 'lost'; g.events.push('lost'); }
    else if (g.rescued === 3) { g.phase = 'won'; g.events.push('won'); }
  }
  return { WORLD, HOME, BUILDINGS, RIFTS, dist, clamp, createGame, chooseMode, start, nearest, beginNight, interact, pulse, pulseRadius, guard, protectedByGuard, makeHunter, update, blocked };
});
