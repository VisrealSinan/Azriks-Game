const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const H = require('../game/core.js');
const C = require('../game/content.js');
const day = () => { const g = H.createGame(); H.start(g); return g; };
const at = (g, item) => Object.assign(g.player, {x:item.x,y:item.y});
function collect(g, memory) {
  for (let i=0; i<4 && !memory.found; i++) H.interact(g);
  assert.equal(memory.found, true);
}
function night(g) { for (const b of g.beacons) { at(g,b); H.interact(g); } at(g,H.HOME); H.interact(g); assert.equal(g.phase,'night'); }

// Unit tests may position actors directly. The end-to-end tests below never do.
test('memory pickups are idempotent, populate the journal and upgrade once', () => {
  const g=day();
  for (const [i,memory] of g.memories.entries()) {
    at(g,memory); collect(g,memory); H.interact(g); H.interact(g);
    assert.equal(g.journal.filter(e=>e.id===memory.id).length,1);
    assert.deepEqual(g.journal.find(e=>e.id===memory.id), {id:memory.id,title:memory.title,text:memory.text,kind:'memory'});
    assert.equal(H.pulseRadius(g),185+18*(i+1));
  }
  assert.equal(g.events.filter(e=>e==='memory').length,3);
  assert.equal(g.rescued,0);
});
test('resident dialogue cycles and one complete conversation is recorded per resident', () => {
  const g=day();
  for (const r of g.residents) {
    at(g,r);
    for (let i=0;i<r.lines.length*3;i++) {
      H.interact(g); assert.equal(g.message,`${r.name}: ${r.lines[i%r.lines.length]}`);
    }
    assert.equal(r.spoken,r.lines.length*3);
    assert.deepEqual(g.journal.filter(e=>e.id===r.id),[{id:r.id,title:r.name,text:r.lines.join(' '),kind:'resident'}]);
  }
  assert.equal(g.journal.length,3); assert.equal(H.pulseRadius(g),185);
  night(g); at(g,g.residents[0]); const count=g.residents[0].spoken; H.interact(g);
  assert.equal(g.residents[0].spoken,count,'Residents should not interact after dark');
});
test('all content IDs are globally unique and fresh games do not share mutable state', () => {
  const items=[...C.memories,...C.residents,...C.souls];
  assert.equal(new Set(items.map(i=>i.id)).size,items.length);
  const a=day(),b=day(); a.residents[0].lines[0]='changed'; a.memories[0].found=true;
  assert.notEqual(b.residents[0].lines[0],'changed'); assert.equal(b.memories[0].found,false);
  assert.notEqual(C.residents[0].lines[0],'changed'); assert.equal(b.journal.length,0);
});
test('pulse upgrades change actual hit range at every level without changing energy or cooldown', () => {
  for(let count=0;count<=3;count++) {
    const g=day();
    for(const item of g.memories.slice(0,count)) { at(g,item); collect(g,item); }
    night(g); const radius=185+18*count;
    g.enemies=[radius-1,radius,radius+1].map(d=>({x:g.player.x+d,y:g.player.y,hp:2,stun:0}));
    assert.equal(H.pulse(g),true); assert.equal(g.player.energy,76); assert.equal(g.pulseCooldown,1.15);
    assert.deepEqual(g.enemies.map(e=>e.hp),[1,2,2]); assert.equal(g.pulses[0].radius,radius);
    assert.equal(H.pulse(g),false); assert.equal(g.player.energy,76);
  }
});
test('pause and title block collecting memories and resident interactions', () => {
  const g=H.createGame(); at(g,g.memories[0]); H.interact(g); assert.equal(g.journal.length,0);
  H.start(g); g.paused=true; H.interact(g); assert.equal(g.journal.length,0);
  at(g,g.residents[0]); H.interact(g); assert.equal(g.residents[0].spoken,0);
});

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
      if(g.enemies.some(e=>H.dist(e,g.player)<H.pulseRadius(g)-20)) H.pulse(g);
      H.update(g,1/35,input); assert.notEqual(g.phase,'lost'); assert.equal(H.blocked(g,g.player.x,g.player.y),false);
      if(g.phase==='won') return;
    }
    assert.ok(H.dist(g.player,p)<.001);
  }
}
for(const collectPhase of ['day','night']) test(`complete real-movement playthrough with memories collected during ${collectPhase}`,t=>{
  const g=day();
  for(const r of g.residents) { walk(g,r); H.interact(g); assert.equal(r.spoken,1); }
  if(collectPhase==='day') for(const m of g.memories) { walk(g,m); collect(g,m); }
  for(const b of g.beacons) { walk(g,b); if(!b.lit) H.interact(g); assert.equal(b.lit,true); }
  walk(g,H.HOME); H.interact(g); assert.equal(g.phase,'night');
  if(collectPhase==='night') for(const m of g.memories) { walk(g,m); collect(g,m); }
  for(const s of g.souls) {
    if(s.state==='saved') continue;
    walk(g,s); if(s.state==='lost') H.interact(g); assert.equal(s.state,'following'); walk(g,H.HOME);
    for(let i=0;i<70&&s.state!=='saved';i++) H.update(g,1/35,{});
    assert.equal(s.state,'saved');
  }
  assert.equal(g.phase,'won'); assert.equal(g.rescued,3); assert.equal(g.journal.length,9);
  assert.equal(new Set(g.journal.map(e=>e.id)).size,9);
  assert.deepEqual(g.journal.filter(e=>e.kind==='soul').map(e=>e.text).sort(),C.souls.map(s=>s.recollection).sort());
  for(let i=0;i<100;i++) { H.update(g,.05); H.interact(g); }
  assert.equal(g.journal.length,9); assert.equal(H.pulseRadius(g),239);
  t.diagnostic(`All nine entries, full win, ${g.time.toFixed(1)} seconds, ${g.player.hp} HP; no teleports or state cheats.`);
});

// Lightweight DOM harness tests actual game.js control handlers; not a visual/browser test.
function ui() {
  const elements=new Map(),events={},noop=()=>{};
  const context=new Proxy({}, {get:(o,k)=>k in o?o[k]:(k==='createRadialGradient'?()=>({addColorStop:noop}):noop)});
  function element() {
    const children=new Map(); return {style:{},children:[],hidden:false,dataset:{},textContent:'',
      classList:{toggle(name,value){this[name]=value;}},getContext:()=>context,
      setAttribute:noop,focus:noop,blur:noop,addEventListener:noop,
      querySelector(selector){if(!children.has(selector))children.set(selector,element());return children.get(selector);},
      replaceChildren(){this.children=[];},append(...items){this.children.push(...items);}};
  }
  const get=id=>{if(!elements.has(id))elements.set(id,element());return elements.get(id);};
  let state; const api={...H,createGame:()=>state=H.createGame()};
  const sandbox={window:{Hollowhaven:api},document:{getElementById:get,createElement:element,querySelectorAll:()=>[],addEventListener:noop},
    innerWidth:1200,innerHeight:800,devicePixelRatio:1,matchMedia:()=>({matches:false}),
    Image:class {},addEventListener:(name,fn)=>events[name]=fn,requestAnimationFrame:noop,performance:{now:()=>1}};
  vm.runInNewContext(fs.readFileSync(require.resolve('../game/game.js'),'utf8'),sandbox);
  return {get,state:()=>state,key:code=>events.keydown({code,repeat:false,preventDefault:noop})};
}
test('journal UI pauses, restores prior pause state, closes with Escape and resets on restart',()=>{
  const u=ui(); u.key('KeyJ'); assert.equal(u.state().paused,false);
  u.get('start').onclick(); u.key('KeyJ'); assert.equal(u.state().paused,true);
  assert.equal(u.get('journal-menu').classList.hidden,false); assert.equal(u.get('journal-entries').children.length,1);
  u.key('Escape'); assert.equal(u.state().paused,false); assert.equal(u.get('journal-menu').classList.hidden,true);
  u.get('pause').onclick(); u.key('KeyJ'); u.get('journal-close').onclick();
  assert.equal(u.state().paused,true); assert.equal(u.get('pause-menu').classList.hidden,false);
  u.get('restart-pause').onclick(); assert.equal(u.state().paused,false); assert.equal(u.state().phase,'day');
  assert.equal(u.get('journal-menu').classList.hidden,true); assert.equal(u.state().journal.length,0);
});
test('journal UI displays new entries using text content and stays available after victory',()=>{
  const u=ui(); u.get('start').onclick(); const g=u.state(); at(g,g.memories[0]); collect(g,g.memories[0]);
  u.key('KeyJ'); const entries=u.get('journal-entries').children;
  assert.equal(entries.length,1); assert.equal(entries[0].children[1].textContent,g.memories[0].title);
  u.key('KeyJ'); g.phase='won'; u.key('KeyJ');
  assert.equal(u.get('journal-menu').classList.hidden,false); assert.equal(u.get('journal-button').disabled,false);
  u.key('KeyJ'); assert.equal(g.paused,false); assert.equal(g.phase,'won');
});
