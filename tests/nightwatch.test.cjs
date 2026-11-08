const test=require('node:test');
const assert=require('node:assert/strict');
const H=require('../game/core.js');
const at=(g,p)=>Object.assign(g.player,{x:p.x,y:p.y});
function night(mode='nightwatch'){const g=H.createGame(mode);H.start(g);g.beacons.forEach(b=>b.lit=true);H.beginNight(g);return g;}
function advance(g,seconds,input={}){for(let i=0;i<Math.round(seconds*100);i++)H.update(g,.01,input);}
// Ten-unit BFS paths, traversed in two normal five-unit walking frames per edge.
function path(g,target) {
  const key=(x,y)=>`${x},${y}`, start=[Math.round(g.player.x/10),Math.round((g.player.y-5)/10)];
  const finish=[Math.round(target.x/10),Math.round((target.y-5)/10)], queue=[start], seen=new Map([[key(...start),null]]);
  for(let i=0;i<queue.length;i++) {
    const [x,y]=queue[i]; if(x===finish[0]&&y===finish[1]) break;
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const nx=x+dx,ny=y+dy,k=key(nx,ny);
      if(seen.has(k)||H.blocked(g,nx*10,ny*10+5)) continue;
      seen.set(k,[x,y]); queue.push([nx,ny]);
    }
  }
  assert.ok(seen.has(key(...finish)),`Unreachable ${g.phase} target: ${target.id||target.name}`);
  const result=[]; for(let p=finish;p;p=seen.get(key(...p))) result.push({x:p[0]*10,y:p[1]*10+5});
  return result.reverse().slice(1);
}
function walk(g,target) {
  for(const p of path(g,target)) {
    const input={right:p.x>g.player.x+1,left:p.x<g.player.x-1,down:p.y>g.player.y+1,up:p.y<g.player.y-1};
    for(let i=0;i<2;i++) {
      if(g.enemies.some(e=>H.dist(e,g.player)<120)) H.guard(g);
      if(g.enemies.some(e=>H.dist(e,g.player)<H.pulseRadius(g)-20)) H.pulse(g);
      if(H.nearest(g)?.type==='soul') H.interact(g);
      H.update(g,1/35,input); assert.notEqual(g.phase,'lost'); assert.equal(H.blocked(g,g.player.x,g.player.y),false);
      if(g.phase==='won') return;
    }
    assert.ok(H.dist(g.player,p)<.001);
  }
}

test('mode selection is validated and locks after title; Nightwatch begins with two three-HP hounds',()=>{
 const g=H.createGame();assert.equal(g.mode,'story');assert.equal(H.chooseMode(g,'invalid'),false);
 assert.equal(H.chooseMode(g,'nightwatch'),true);H.start(g);assert.equal(H.chooseMode(g,'story'),false);
 const n=night();assert.equal(n.enemies.filter(e=>e.type==='hunter').length,2);assert.ok(n.enemies.filter(e=>e.type==='hunter').every(e=>e.hp===3));
 const s=night('story');assert.equal(s.enemies.some(e=>e.type==='hunter'),false);
});
test('guard has no energy cost, lasts three seconds, cooldown eighteen, and pauses with simulation',()=>{
 const g=night();g.enemies=[];g.spawnIn=999;const energy=g.player.energy;
 assert.equal(H.guard(g),true);assert.equal(g.guardTime,3);assert.equal(g.guardCooldown,18);assert.equal(g.player.energy,energy);assert.equal(g.guardUses,1);
 assert.equal(H.guard(g),false);advance(g,2.9);assert.ok(g.guardTime>0);assert.ok(H.protectedByGuard(g,g.player));
 g.paused=true;const before=JSON.stringify(g);advance(g,5);assert.equal(H.guard(g),false);assert.equal(JSON.stringify(g),before);
 g.paused=false;advance(g,.11);assert.equal(g.guardTime,0);assert.equal(H.guard(g),false);advance(g,15);assert.equal(H.guard(g),true);
 const d=H.createGame();assert.equal(H.guard(d),false);H.start(d);assert.equal(H.guard(d),false);
});
test('guard protects contact, stuns nearby enemies and cancels an active hound charge',()=>{
 const g=night();at(g,{x:900,y:400});const h=H.makeHunter(900,400);h.mode='dash';h.modeTime=.42;g.enemies=[h];
 H.guard(g);assert.equal(h.mode,'recover');assert.equal(h.stun,.8);advance(g,1);assert.equal(g.player.hp,5);assert.equal(g.damageTaken,0);
 assert.equal(H.protectedByGuard(g,{x:1074,y:400}),true);assert.equal(H.protectedByGuard(g,{x:1075,y:400}),false);
});
test('hounds telegraph for 0.8 seconds then dash on fixed aim and recover',()=>{
 const g=night();at(g,{x:900,y:400});const h=H.makeHunter(700,400);g.enemies=[h];g.spawnIn=999;
 H.update(g,.01);assert.equal(h.mode,'tell');assert.equal(h.modeTime,.8);assert.equal(h.aimX,1);assert.equal(h.aimY,0);
 at(g,{x:900,y:800});advance(g,.79);assert.equal(h.mode,'tell');assert.equal(h.x,700);
 advance(g,.02);assert.equal(h.mode,'dash');assert.equal(h.aimY,0);advance(g,.43);
 assert.equal(h.mode,'recover');assert.ok(Math.abs(h.x-880.6)<.001);assert.equal(h.y,400);
 advance(g,1.4);assert.equal(h.mode,'stalk');
});
test('hound contact damages once, pulse cancels attack, and sanctuary blocks damage',()=>{
 const g=night();at(g,{x:900,y:400});const h=H.makeHunter(900,400);g.enemies=[h];g.spawnIn=999;
 H.update(g,.01);assert.equal(g.player.hp,4);assert.equal(g.damageTaken,1);H.update(g,.01);assert.equal(g.player.hp,4);
 h.stun=0;h.mode='tell';h.modeTime=.5;H.pulse(g);assert.equal(h.hp,2);assert.equal(h.mode,'recover');assert.equal(h.stun,1.6);
 at(g,H.HOME);g.player.hurt=0;Object.assign(h,{x:H.HOME.x+10,y:H.HOME.y,stun:0,mode:'dash',modeTime:.42});
 H.update(g,.01);assert.equal(g.player.hp,4);assert.equal(h.mode,'recover');assert.ok(h.x>H.HOME.x+10);
});
test('Nightwatch speeds up wraiths and makes every third new spawn a hunter',()=>{
 for(const [mode,speed] of [['story',64],['nightwatch',78]]){
  const g=night(mode);at(g,{x:900,y:400});const w={x:500,y:400,hp:2,stun:0};g.enemies=[w];g.spawnIn=999;
  H.update(g,.05);assert.ok(Math.abs(w.x-(500+speed*.05))<.001);
 }
 const g=night();g.enemies=[];for(let i=1;i<=3;i++){g.spawnIn=0;H.update(g,.01);assert.equal(g.enemies.at(-1).type==='hunter',i===3);}
});
test('soul scattering is Nightwatch-only and E recall provides 2.5 seconds of grace',()=>{
 for(const mode of ['story','nightwatch']){
  const g=night(mode);at(g,{x:900,y:400});const s=g.souls[0];Object.assign(s,{x:850,y:400,state:'following',recallGrace:0});
  g.enemies=[{x:850,y:400,hp:2,stun:0}];H.update(g,.01);
  assert.equal(s.state,mode==='story'?'following':'lost');assert.equal(g.soulScatters,mode==='story'?0:1);
  if(mode==='nightwatch'){H.interact(g);assert.equal(s.state,'following');assert.equal(s.recallGrace,2.5);H.update(g,.01);assert.equal(s.state,'following');assert.ok(s.recallGrace>2.48);}
 }
});
test('guard protects following souls within radius but not outside its radius',()=>{
 for(const [distance,expected] of [[70,'following'],[190,'lost']]){
  const g=night();at(g,{x:900,y:800});const s=g.souls[0];Object.assign(s,{x:900,y:800-distance,state:'following',recallGrace:0});
  g.enemies=[{x:s.x,y:s.y,hp:2,stun:0}];H.guard(g);g.enemies[0].stun=0;H.update(g,.01);assert.equal(s.state,expected);
 }
});
test('souls scattering inside buildings relocate to a recallable position instead of softlocking',()=>{
 const g=night();at(g,{x:900,y:605});const s=g.souls[0];Object.assign(s,{x:660,y:600,state:'following',recallGrace:0});
 g.enemies=[{x:660,y:600,hp:2,stun:0}];H.update(g,.01);assert.equal(s.state,'lost');
 let reachable=false;for(let x=50;x<=1750&&!reachable;x+=5)for(let y=50;y<=1270;y+=5)if(!H.blocked(g,x,y)&&H.dist({x,y},s)<90){reachable=true;break;}
 assert.equal(reachable,true,'Scattered soul must be within recall distance of walkable terrain');
 assert.equal(H.blocked(g,s.x,s.y),false);assert.ok(path(g,s).length>0);
 walk(g,s);if(s.state==='lost')H.interact(g);assert.equal(s.state,'following');
 walk(g,H.HOME);advance(g,2);assert.equal(s.state,'saved');
});
test('full realistic Nightwatch run: wards, live hounds, pulse/guard defense, all three rescued',t=>{
 const g=H.createGame('nightwatch');H.start(g);
 for(const b of g.beacons){walk(g,b);H.interact(g);assert.equal(b.lit,true);}
 walk(g,H.HOME);H.interact(g);assert.equal(g.phase,'night');
 let attempts=0;
 while(g.phase==='night'&&attempts++<12){
  const s=g.souls.find(s=>s.state==='lost');if(s){walk(g,s);if(s.state==='lost')H.interact(g);}
  walk(g,H.HOME);for(let i=0;i<70&&g.phase==='night';i++)H.update(g,1/35,{});
 }
 assert.equal(g.phase,'won');assert.equal(g.rescued,3);assert.ok(g.guardUses>0);assert.ok(g.events.includes('pulse'));
 assert.equal(g.journal.filter(e=>e.kind==='soul').length,3);
 t.diagnostic(`Nightwatch won: ${g.time.toFixed(1)} seconds, HP ${g.player.hp}, guard uses ${g.guardUses}, damage ${g.damageTaken}, scatters ${g.soulScatters}, kills ${g.kills}.`);
});
