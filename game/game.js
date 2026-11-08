/* Hollowhaven: The First Night. Dependency-free canvas presentation. */
(() => {
  'use strict';
  const H = window.Hollowhaven;
  const $ = id => document.getElementById(id);
  const canvas = $('world'), ctx = canvas.getContext('2d');
  const map = $('minimap'), m = map.getContext('2d');
  let game = H.createGame(), width = innerWidth, height = innerHeight, ratio = 1;
  let lastTime = 0, camera = { x: 900, y: 760 }, audio = null, soundOn = false;
  const keys = {}, touch = {}, reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const playerImage = new Image(), companionImage = new Image();
  playerImage.src = '../assets/characters/prototype/v1/visreal-sinan-idle-front-v1.png';
  companionImage.src = '../assets/characters/prototype/v1/azrik-idle-front-v1.png';
  let imageFailures = 0;
  [playerImage, companionImage].forEach(img => img.onerror = () => { imageFailures++; $('announcer').textContent = 'A character image could not load. The game will use a simple marker.'; });
  function resize() { width = innerWidth; height = innerHeight; ratio = Math.min(devicePixelRatio || 1, 2); canvas.width = width * ratio; canvas.height = height * ratio; }
  addEventListener('resize', resize); resize();
  const terrain = {};
  function ellipse(c, x, y, rx, ry, color) { c.fillStyle = color; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fill(); }
  function poly(c, points, color, stroke) { c.fillStyle = color; c.beginPath(); points.forEach((p, i) => i ? c.lineTo(...p) : c.moveTo(...p)); c.closePath(); c.fill(); if (stroke) { c.strokeStyle = stroke; c.stroke(); } }
  function glow(c, x, y, r, color) { const gr = c.createRadialGradient(x, y, 1, x, y, r); gr.addColorStop(0, color); gr.addColorStop(1, 'transparent'); c.fillStyle = gr; c.fillRect(x-r,y-r,r*2,r*2); }
  function makeTerrain(night) {
    const surface = document.createElement('canvas'); surface.width = H.WORLD.w; surface.height = H.WORLD.h;
    const c = surface.getContext('2d');
    c.fillStyle = night ? '#111e25' : '#243330'; c.fillRect(0,0,H.WORLD.w,H.WORLD.h);
    let seed = 131; const rand = () => { seed = (Math.imul(seed,1664525)+1013904223)>>>0; return seed/4294967296; };
    // Hand-laid paving and worn mortar, deterministic between day and night.
    for (let row = 0; row < 61; row++) for (let col = 0; col < 50; col++) {
      const x = col * 40 + (row % 2) * 20, y = row * 24;
      c.fillStyle = night ? `rgba(100,136,142,${.025+rand()*.055})` : `rgba(157,172,143,${.035+rand()*.06})`;
      c.fillRect(x+1,y+1,37,21);
    }
    c.strokeStyle = night ? '#43505a32' : '#6a77714a'; c.lineWidth = 2;
    for (const x of [450,900,1360]) { c.beginPath(); c.moveTo(x,0); c.lineTo(x,1320); c.stroke(); }
    for (const y of [380,815]) { c.beginPath(); c.moveTo(0,y); c.lineTo(1800,y); c.stroke(); }
    // Drain covers and tufts of silver grass.
    for (let i = 0; i < 140; i++) {
      const x = 45+rand()*1710,y = 40+rand()*1240;
      if (H.BUILDINGS.some(b=>x>b.x-20&&x<b.x+b.w+20&&y>b.y-20&&y<b.y+b.h+20)) continue;
      c.strokeStyle = night?'#3a53524d':'#62766c66'; c.lineWidth=1;
      c.beginPath(); c.moveTo(x,y); c.lineTo(x-3,y-8); c.moveTo(x,y); c.lineTo(x+5,y-10); c.stroke();
    }
    // Sanctuary's concentric stone mosaic.
    for (const r of [148,137,120,65]) { c.strokeStyle = night?'#a2c6aa48':'#c0b58255';c.lineWidth=r===137?4:1;c.beginPath();c.arc(H.HOME.x,H.HOME.y,r,0,Math.PI*2);c.stroke(); }
    for (let i=0;i<12;i++){const a=i*Math.PI/6;c.save();c.translate(H.HOME.x+Math.cos(a)*129,H.HOME.y+Math.sin(a)*129);c.rotate(a);c.fillStyle='#9c9c695c';c.fillRect(-3,-2,6,4);c.restore();}
    c.font='12px Georgia';c.fillStyle=night?'#8ba9a1':'#b0b499';c.textAlign='center';c.fillText('THE SANCTUARY',900,1230);
    // Town perimeter.
    c.strokeStyle='#060d12';c.lineWidth=38;c.strokeRect(0,0,1800,1320);
    return surface;
  }
  terrain.day = makeTerrain(false); terrain.night = makeTerrain(true);
  function drawBuilding(b, night) {
    const x=b.x,y=b.y,w=b.w,h=b.h;
    ctx.fillStyle='#030b0c55';ctx.fillRect(x+12,y+15,w+8,h+14);
    ctx.fillStyle=night?'#1e3037':'#394843';ctx.fillRect(x,y,w,h);
    ctx.fillStyle=night?'#14242d':'#293b37';ctx.fillRect(x,y,w,h-45);
    ctx.strokeStyle=night?'#50636a':'#697b6c';ctx.lineWidth=1;ctx.strokeRect(x+.5,y+.5,w-1,h-1);
    poly(ctx,[[x-8,y+22],[x+w/2,y-26],[x+w+8,y+22],[x+w+8,y+h-64],[x+w/2,y+h-104],[x-8,y+h-64]],night?'#1a2b33':'#344b43','#455c55');
    ctx.strokeStyle=night?'#41586355':'#71917a44';ctx.lineWidth=1;
    for(let row=0;row<5;row++){ctx.beginPath();ctx.moveTo(x,y+28+row*22);ctx.lineTo(x+w/2,y-18+row*22);ctx.lineTo(x+w,y+28+row*22);ctx.stroke();}
    ctx.strokeStyle='#80938855';ctx.beginPath();ctx.moveTo(x+w/2,y-23);ctx.lineTo(x+w/2,y+h-103);ctx.stroke();
    // Thin windows and recessed door.
    for(let wx=x+30;wx<x+w-20;wx+=52){ctx.fillStyle=night?'#e0b96a':'#bfc19b';ctx.globalAlpha=night?.73:.4;ctx.fillRect(wx,y+h-37,11,18);ctx.globalAlpha=1;ctx.fillStyle='#172b2c';ctx.fillRect(wx+5,y+h-37,2,18);}
    ctx.fillStyle='#0a1519';ctx.fillRect(x+w/2-14,y+h-35,28,35);ctx.strokeStyle='#6b8176';ctx.strokeRect(x+w/2-14,y+h-35,28,35);
    ctx.fillStyle='#d0ba82';ctx.fillRect(x+w/2+7,y+h-18,2,2);
    ctx.font='9px Georgia';ctx.textAlign='center';ctx.fillStyle=night?'#8da8a6':'#b6c3aa';ctx.fillText(b.name,x+w/2,y+h+24);
  }
  function beacon(b) {
    glow(ctx,b.x,b.y-20,b.lit?105:35,b.lit?'#d0b35944':'#b3b29416');
    ellipse(ctx,b.x,b.y+4,19,7,'#0005');ctx.strokeStyle='#9b9d78';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(b.x,b.y-54);ctx.stroke();
    ctx.fillStyle=b.lit?'#f1ce85':'#293938';ctx.fillRect(b.x-7,b.y-66,14,20);ctx.strokeStyle='#c0ad79';ctx.lineWidth=2;ctx.strokeRect(b.x-8,b.y-67,16,22);
    poly(ctx,[[b.x-12,b.y-67],[b.x,b.y-76],[b.x+12,b.y-67]],'#81856d');
    if(!b.lit&&game.phase==='day'){ctx.fillStyle='#e2ca8c';ctx.font='20px Georgia';ctx.textAlign='center';ctx.fillText('✦',b.x,b.y-93+Math.sin(game.time*2)*3);}
  }
  function bell() {
    const x=H.HOME.x,y=H.HOME.y;
    glow(ctx,x,y,145,game.phase==='night'?'#95d6bc24':'#caba6617');
    ellipse(ctx,x,y+24,27,9,'#02090d70');ctx.fillStyle='#1c3036';ctx.fillRect(x-32,y-62,9,86);ctx.fillRect(x+23,y-62,9,86);ctx.fillRect(x-35,y-66,70,8);
    poly(ctx,[[x-13,y-54],[x+13,y-54],[x+18,y-26],[x+24,y-20],[x-24,y-20],[x-18,y-26]],'#ad9964','#e2cc89');
    ctx.fillStyle='#efe0a0';ctx.fillRect(x-3,y-22,6,10);
    if(game.phase==='day'&&game.beacons.every(b=>b.lit)){ctx.font='22px Georgia';ctx.fillStyle='#e5d5a1';ctx.textAlign='center';ctx.fillText('✦',x,y-83);}
  }
  function wraith(e) {
    const bob=reduced?0:Math.sin(game.time*3+e.x)*4;
    ellipse(ctx,e.x,e.y+7,18,7,'#0006');glow(ctx,e.x,e.y-12,42,e.stun>0?'#d0ca8555':'#96427025');
    poly(ctx,[[e.x,e.y-47+bob],[e.x+15,e.y-26+bob],[e.x+19,e.y+3],[e.x+8,e.y-2],[e.x,e.y+8],[e.x-8,e.y-2],[e.x-19,e.y+3],[e.x-15,e.y-26+bob]],e.stun>0?'#84988c':'#261f36','#74506a');
    ctx.fillStyle='#df82b2';ctx.fillRect(e.x-8,e.y-24+bob,4,3);ctx.fillRect(e.x+4,e.y-24+bob,4,3);
    if(e.hp===1){ctx.fillStyle='#aa708d';ctx.fillRect(e.x-10,e.y-56+bob,20,2);}
  }
  function soul(s) {
    const bob=reduced?0:Math.sin(game.time*2+s.x)*4;
    glow(ctx,s.x,s.y-15,65,'#97e5d737');ellipse(ctx,s.x,s.y-21+bob,10,15,'#c7eee0c0');
    poly(ctx,[[s.x-10,s.y-14+bob],[s.x+10,s.y-14+bob],[s.x+18,s.y+5+bob],[s.x,s.y+1+bob],[s.x-18,s.y+5+bob]],'#9bd8cb77');
    if(s.state==='lost'){ctx.font='18px Georgia';ctx.textAlign='center';ctx.fillStyle='#cceedd';ctx.fillText('✦',s.x,s.y-58+bob);}
  }
  function character(img,x,y,height,pivot,flip=false,alpha=1) {
    ellipse(ctx,x,y+3,height*.18,height*.055,'#0007');ctx.save();ctx.translate(x,y);ctx.globalAlpha=alpha;
    if(flip)ctx.scale(-1,1);
    const bob=!reduced&&game.player.moving?Math.sin(game.time*15)*1.6:0;
    if(img.complete&&img.naturalWidth){const scale=height/img.height;ctx.drawImage(img,-img.width*scale/2,-pivot*scale+bob,img.width*scale,img.height*scale);}
    else{ctx.fillStyle='#d6c49b';ctx.fillRect(-9,-height*.65,18,height*.65);ellipse(ctx,0,-height*.72,9,10,'#a1b6a7');}
    ctx.restore();
  }
  function drawMap() {
    m.clearRect(0,0,210,154);const sx=210/1800,sy=154/1320;
    m.fillStyle='#101f25';m.fillRect(0,0,210,154);
    m.fillStyle='#35484a';for(const b of H.BUILDINGS)m.fillRect(b.x*sx,b.y*sy,b.w*sx,b.h*sy);
    if(game.phase==='night'){m.fillStyle='#956785';for(const b of H.RIFTS)m.fillRect(b.x*sx,b.y*sy,b.w*sx,b.h*sy);}
    m.strokeStyle='#789b8b';m.beginPath();m.arc(900*sx,1050*sy,15,0,Math.PI*2);m.stroke();
    const goals=game.phase==='day'?game.beacons:game.souls.filter(s=>s.state!=='saved');
    for(const b of goals){m.fillStyle=b.lit?'#6d8073':game.phase==='day'?'#e1c587':'#b1e5d2';m.beginPath();m.arc(b.x*sx,b.y*sy,b.lit?2:3,0,Math.PI*2);m.fill();}
    const p=game.player;m.fillStyle='#fff4d5';m.beginPath();m.moveTo(p.x*sx,p.y*sy-4);m.lineTo(p.x*sx+3,p.y*sy);m.lineTo(p.x*sx,p.y*sy+4);m.lineTo(p.x*sx-3,p.y*sy);m.closePath();m.fill();
  }
  function draw() {
    const night=['night','won','lost'].includes(game.phase);
    ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,width,height);
    const zoom=width<600?.84:1;
    const target=game.phase==='title'?{x:920,y:760}:game.player;
    camera.x+=(target.x-camera.x)*.1;camera.y+=(target.y-camera.y)*.1;
    const vw=width/zoom,vh=height/zoom;
    const cx=H.clamp(camera.x,vw/2-30,H.WORLD.w-vw/2+30),cy=H.clamp(camera.y,vh/2-30,H.WORLD.h-vh/2+30);
    ctx.save();ctx.translate(width/2,height/2);ctx.scale(zoom,zoom);ctx.translate(-cx,-cy);
    ctx.drawImage(night?terrain.night:terrain.day,0,0);
    if(night){for(const r of H.RIFTS){glow(ctx,r.x+r.w/2,r.y+r.h/2,130,'#7d426b22');ctx.fillStyle='#151320';ctx.fillRect(r.x,r.y,r.w,r.h);ctx.strokeStyle='#99678a';ctx.lineWidth=2;ctx.setLineDash([8,7]);ctx.strokeRect(r.x,r.y,r.w,r.h);ctx.setLineDash([]);for(let k=0;k<r.w;k+=22)poly(ctx,[[r.x+k,r.y+r.h],[r.x+k+10,r.y-25],[r.x+k+20,r.y+r.h]],'#222332','#75536c');}}
    const objects=H.BUILDINGS.map(b=>({y:b.y+b.h,draw:()=>drawBuilding(b,night)}));
    game.beacons.forEach(b=>objects.push({y:b.y,draw:()=>beacon(b)}));
    objects.push({y:H.HOME.y,draw:bell});
    game.souls.filter(s=>s.state!=='saved').forEach(s=>objects.push({y:s.y,draw:()=>soul(s)}));
    game.enemies.forEach(e=>objects.push({y:e.y,draw:()=>wraith(e)}));
    const p=game.player,a=game.companion;
    glow(ctx,p.x,p.y-20,night?215:100,night?'#d4c48222':'#e2d49b11');
    objects.push({y:p.y,draw:()=>character(playerImage,p.x,p.y,100,1509,p.facing<0,p.hurt>0&&Math.sin(game.time*24)>0?.45:1)});
    objects.push({y:a.y,draw:()=>character(companionImage,a.x,a.y-10+(reduced?0:Math.sin(game.time*3)*5),53,1491)});
    objects.sort((a,b)=>a.y-b.y).forEach(o=>o.draw());
    for(const v of game.pulses){ctx.beginPath();ctx.arc(v.x,v.y-12,185*Math.min(1,v.age/.3),0,Math.PI*2);ctx.strokeStyle=`rgba(219,230,171,${Math.max(0,1-v.age/.65)})`;ctx.lineWidth=4;ctx.stroke();}
    if(!reduced){for(let i=0;i<28;i++){const x=(i*179+game.time*(i%2?5:-3)+1800)%1800,y=(i*131)%1320;ctx.fillStyle=night?'#c7ead555':'#c3caba35';ctx.fillRect(x,y+Math.sin(game.time+i)*7,2,2);}}
    ctx.restore();
    if(night){const fog=ctx.createRadialGradient(width/2,height/2,80,width/2,height/2,Math.max(width,height)*.7);fog.addColorStop(0,'#07131a00');fog.addColorStop(1,'#0208117a');ctx.fillStyle=fog;ctx.fillRect(0,0,width,height);}
    drawMap();
  }
  function updateUI() {
    const running=['day','night'].includes(game.phase),night=game.phase==='night';
    $('hud').classList.toggle('hidden',!running);$('intro').classList.toggle('hidden',game.phase!=='title');
    $('pause').disabled=!running;$('pause-menu').classList.toggle('hidden',!game.paused||!running);
    $('hearts').textContent=Array.from({length:5},(_,i)=>i<game.player.hp?'◆':'◇').join(' ');$('hearts').setAttribute('aria-label',`${game.player.hp} of 5 health`);
    $('energy').style.width=`${game.player.energy}%`;
    $('pulse-status').textContent=night?(game.pulseCooldown>0?'Recharging':game.player.energy<24?'Gathering light':'Pulse ready'):'Light holds the dark';
    $('phase').textContent=night?'AFTER THE BELL':'LATE AFTERNOON';
    $('chapter').textContent=night?'02 / THE FIRST NIGHT':'01 / BEFORE THE BELL';
    const lit=game.beacons.filter(b=>b.lit).length,following=game.souls.filter(s=>s.state==='following').length;
    $('objective').textContent=night?(following?'Lead them home.':'Find the lost souls.'):(lit===3?'Ring the night bell.':'Wake the ward lanterns.');
    $('objective-detail').textContent=night?'E calls a soul. Bring it inside the sanctuary. Space drives wraiths away.':lit===3?'Return to the circle on your map. Press E by the bell.':'Light three lanterns, then return to the sanctuary.';
    $('counter').textContent=night?`${game.rescued} / 3 SOULS SAFE${following?' · '+following+' FOLLOWING':''}`:`${lit} / 3 WARDS LIT`;
    const n=H.nearest(game);$('prompt').classList.toggle('hidden',!n||game.paused);if(n)$('prompt').querySelector('span').textContent=n.label;
    $('dialogue').classList.toggle('hidden',game.messageTime<=0||game.paused);
    const text=game.message.replace(/^Azrik: /,'');if($('dialogue').querySelector('p').textContent!==text){$('dialogue').querySelector('p').textContent=text;$('announcer').textContent=text;}
    $('ending').classList.toggle('hidden',!['won','lost'].includes(game.phase));
    if(['won','lost'].includes(game.phase)){
      const won=game.phase==='won';$('end-eyebrow').textContent=won?'DAWN COMES TO HOLLOWHAVEN':'THE VEIL CLOSES IN';$('end-title').textContent=won?'No one left behind.':'Your light went out.';
      $('end-copy').textContent=won?'Three souls found shelter. For one more night, the town remembers their names. Azrik settles beside you as the bells welcome the morning.':'The town still needs you. Keep your lantern charged, pulse before wraiths get close, and return to the sanctuary between rescues.';
      $('end-stats').textContent=`${game.rescued} souls sheltered · ${game.kills} wraiths banished · ${Math.floor(game.nightTime/60)}:${String(Math.floor(game.nightTime%60)).padStart(2,'0')} after dark`;
    }
  }
  function sound(event){
    if(!soundOn)return;
    try{audio??=new (window.AudioContext||window.webkitAudioContext)();audio.resume();const osc=audio.createOscillator(),gain=audio.createGain();osc.connect(gain);gain.connect(audio.destination);
      const frequencies={start:220,light:660,night:110,soul:520,save:780,pulse:165,hurt:70,won:880,lost:55};
      osc.type=['pulse','hurt','lost'].includes(event)?'triangle':'sine';osc.frequency.setValueAtTime(frequencies[event]||330,audio.currentTime);osc.frequency.exponentialRampToValueAtTime((frequencies[event]||330)*.55,audio.currentTime+.6);gain.gain.setValueAtTime(.0001,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.12,audio.currentTime+.02);gain.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+1.2);osc.start();osc.stop(audio.currentTime+1.3);
    }catch{soundOn=false;$('sound').textContent='Sound unavailable';}
  }
  function toggleSound(){soundOn=!soundOn;$('sound').textContent=soundOn?'Sound on':'Sound off';$('sound').setAttribute('aria-label',soundOn?'Disable sound':'Enable sound');if(soundOn)sound('light');}
  function clearInput(){for(const k of Object.keys(keys))delete keys[k];for(const k of Object.keys(touch))delete touch[k];}
  function pause(){if(!['day','night'].includes(game.phase))return;game.paused=!game.paused;clearInput();updateUI();if(game.paused)$('resume').focus();}
  function restart(){clearInput();game=H.createGame();H.start(game);camera={x:game.player.x,y:game.player.y};lastTime=performance.now();updateUI();$('start').blur();$('restart').blur();$('restart-pause').blur();}
  $('start').onclick=()=>{H.start(game);updateUI();$('start').blur();};$('restart').onclick=restart;$('restart-pause').onclick=restart;
  $('pause').onclick=pause;$('resume').onclick=pause;$('sound').onclick=toggleSound;
  $('touch-interact').onclick=()=>H.interact(game);$('touch-pulse').onclick=()=>H.pulse(game);
  document.querySelectorAll('[data-key]').forEach(button=>{
    button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);touch[button.dataset.key]=true;});
    for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,()=>{touch[button.dataset.key]=false;});
  });
  const keyMap={KeyW:'up',ArrowUp:'up',KeyS:'down',ArrowDown:'down',KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right',ShiftLeft:'sprint',ShiftRight:'sprint'};
  addEventListener('keydown',e=>{
    if(keyMap[e.code]||['Space','Escape','KeyE'].includes(e.code))e.preventDefault();
    if(keyMap[e.code])keys[e.code]=true;
    if(e.repeat)return;
    if(e.code==='KeyE')H.interact(game);if(e.code==='Space')H.pulse(game);if(e.code==='Escape')pause();if(e.code==='KeyM')toggleSound();
  });
  addEventListener('keyup',e=>{if(keyMap[e.code])keys[e.code]=false;});
  addEventListener('blur',()=>{clearInput();if(['day','night'].includes(game.phase)&&!game.paused)pause();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();if(['day','night'].includes(game.phase)&&!game.paused)pause();}});
  function frame(now){const dt=lastTime?Math.min((now-lastTime)/1000,.05):0;lastTime=now;const input={};for(const k of ['up','down','left','right','sprint'])input[k]=!!(touch[k]||Object.keys(keys).some(code=>keys[code]&&keyMap[code]===k));H.update(game,dt,input);for(const event of game.events.splice(0))sound(event);draw();updateUI();requestAnimationFrame(frame);}
  requestAnimationFrame(frame);
  // Read-only inspection for local QA; no save, account, network, or telemetry.
  window.hollowhavenStatus=()=>({phase:game.phase,paused:game.paused,player:{...game.player},lit:game.beacons.filter(b=>b.lit).length,rescued:game.rescued,following:game.souls.filter(s=>s.state==='following').length,enemyCount:game.enemies.length,imageFailures});
})();
