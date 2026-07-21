/* =====================================================================
   GENAI INTERACTION LAB — 2D ENGINE (Canvas 2D, no WebGL/3D)
   Clean techy dashboard look: dark grid, neon glow strokes, card panels.
   Pages register via LAB.definePage({...}).
===================================================================== */
"use strict";

/* ---------- physics config --------------------------------------------- */
const PHY = { dragLag:0.38, friction:0.985, bounce:0.6, maxSpeed:46,
              grabAssist:22, settleEps:0.06 };

/* ---------- canvas / DPR ------------------------------------------------ */
const cv = document.getElementById('cv');
const ctx = cv.getContext('2d');
let W=1280, H=800, DPR=1;          // W,H are the FIXED VIRTUAL layout size — every
                                     // page positions things against this, never against
                                     // the real screen size, so nothing shifts per device.
let vScale=1, vOffX=0, vOffY=0;     // real-screen scale/offset to fit the virtual canvas

/* ---------- palette (techy neon-on-dark) -------------------------------- */
const COL = {
  bg:'#060912', grid:'rgba(70,150,190,0.10)', ink:'#eaf9ff', dim:'#7fa3b8', faint:'#4d6b7a',
  CY:'#46f0ff', VI:'#9d6bff', MG:'#ff5fd0', OK:'#3dffb0', RD:'#ff5f6b', AM:'#ffb35f'
};

/* ---------- page registry ----------------------------------------------- */
const PAGES = [];
let page=0, worldX=0, worldXT=0, started=false;
const objs = [];
function definePage(def){ def.idx=PAGES.length; PAGES.push(def); }

/* ---------- text helper (direct canvas draw, crisp & simple) ------------ */
function drawText(txt, x, y, {size=18, color=COL.ink, align='center', weight='600', glow=0, alpha=1}={}){
  ctx.save();
  ctx.globalAlpha=alpha;
  ctx.font = `${weight} ${size}px "SF Mono", "Cascadia Mono", Consolas, monospace`;
  ctx.textAlign = align; ctx.textBaseline = 'middle';
  if(glow>0){ ctx.shadowColor=color; ctx.shadowBlur=glow; }
  ctx.fillStyle = color;
  ctx.fillText(txt, x, y);
  ctx.restore();
}
function wrapText(txt, x, y, maxWidth, lineHeight, opts){
  const words=txt.split(' '); let line=''; const lines=[];
  ctx.font = `${opts.weight||'600'} ${opts.size||18}px "SF Mono", Consolas, monospace`;
  for(const w of words){ const test=line?line+' '+w:w;
    if(ctx.measureText(test).width>maxWidth && line){ lines.push(line); line=w; } else line=test; }
  if(line) lines.push(line);
  lines.forEach((l,i)=>drawText(l, x, y+i*lineHeight, opts));
  return lines.length;
}

/* ---------- shape helpers ------------------------------------------------ */
function roundRect(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
function panel(x,y,w,h,color,{fillA=0.06, strokeA=0.85, glow=10, r=14}={}){
  ctx.save();
  roundRect(x-w/2,y-h/2,w,h,r);
  ctx.fillStyle = hexA(color,fillA); ctx.fill();
  ctx.shadowColor=color; ctx.shadowBlur=glow;
  ctx.strokeStyle=hexA(color,strokeA); ctx.lineWidth=1.6; ctx.stroke();
  ctx.restore();
}
function glowCircle(x,y,r,color,{fillA=0.85, glow=16, strokeOnly=false}={}){
  ctx.save(); ctx.shadowColor=color; ctx.shadowBlur=glow;
  ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2);
  if(strokeOnly){ ctx.strokeStyle=color; ctx.lineWidth=2; ctx.stroke(); }
  else { ctx.fillStyle=hexA(color,fillA); ctx.fill(); }
  ctx.restore();
}
function glowLine(x1,y1,x2,y2,color,{width=2, glow=8, alpha=0.9}={}){
  ctx.save(); ctx.globalAlpha=alpha; ctx.shadowColor=color; ctx.shadowBlur=glow;
  ctx.strokeStyle=color; ctx.lineWidth=width;
  ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); ctx.restore();
}
function hexA(hex, a){ // '#rrggbb' -> 'rgba(r,g,b,a)'
  const h=hex.replace('#',''); const r=parseInt(h.slice(0,2),16), g=parseInt(h.slice(2,4),16), b=parseInt(h.slice(4,6),16);
  return `rgba(${r},${g},${b},${a})`;
}

/* ---------- audio --------------------------------------------------------- */
let AC=null, muted=false;
function beep(f=440,d=0.07,type='sine',g=0.05){
  if(muted) return;
  try{ AC=AC||new (window.AudioContext||window.webkitAudioContext)();
    const o=AC.createOscillator(), v=AC.createGain();
    o.type=type; o.frequency.value=f; v.gain.value=g; o.connect(v); v.connect(AC.destination);
    o.start(); v.gain.exponentialRampToValueAtTime(0.0001, AC.currentTime+d); o.stop(AC.currentTime+d+0.02);
  }catch(e){}
}

/* ---------- particle bursts ------------------------------------------------ */
const bursts=[];
function burst(x,y,color,n=24,spd=3){
  const parts=[]; for(let i=0;i<n;i++){ const a=Math.random()*6.283, s=Math.random()*spd+0.6;
    parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:1,r:Math.random()*2.4+1}); }
  bursts.push({parts,color});
}
const ripples=[];
function ripple(x,y,big=false){ ripples.push({x,y,r:big?6:3,max:big?90:52,a:0.7}); }

/* ---------- base interactive object --------------------------------------- */
class Obj{
  constructor(pageIdx,x,y,r){
    this.page=pageIdx; this.x=x; this.y=y; this.vx=0; this.vy=0;
    this.homeX=x; this.homeY=y; this.r=r;
    this.state='idle'; this.grabId=null; this.gox=0; this.goy=0;
    this.squash=1; this.spin=Math.random()*6.28; this._bobPh=Math.random()*6.28; this.rejectT=0;
    this.pinned=false;
    objs.push(this);
  }
  grab(pid,wx,wy){ if(this.pinned) return; this.state='grab'; this.grabId=pid;
    this.gox=this.x-wx; this.goy=this.y-wy; this.squash=0.84; beep(880,0.05,'sine',0.04); }
  dragTo(wx,wy){ const tx=wx+this.gox, ty=wy+this.goy;
    this.vx=(tx-this.x)*PHY.dragLag*2.0; this.vy=(ty-this.y)*PHY.dragLag*2.0;
    this.x+=(tx-this.x)*PHY.dragLag; this.y+=(ty-this.y)*PHY.dragLag; }
  release(){ this.state='fly'; this.grabId=null; this.squash=1.12;
    const cap=v=>Math.max(-PHY.maxSpeed,Math.min(PHY.maxSpeed,v)); this.vx=cap(this.vx); this.vy=cap(this.vy);
    beep(520,0.06,'sine',0.04); }
  reject(){ this.rejectT=1; this.state='fly';
    this.vx=(this.homeX-this.x)*0.06; this.vy=(this.homeY-this.y)*0.06; beep(160,0.14,'sawtooth',0.05); }
  snapHome(){ this.state='fly'; this.vx=(this.homeX-this.x)*0.08; this.vy=(this.homeY-this.y)*0.08; }
  update(dt){
    this.squash+=(1-this.squash)*0.16; this.spin+=dt*0.6;
    if(this.rejectT>0) this.rejectT-=dt*2.4;
    if(this.state==='fly'){
      this.vx*=PHY.friction; this.vy*=PHY.friction; this.x+=this.vx; this.y+=this.vy;
      const pageX0=this.page*W, m=44;
      if(this.x<pageX0+m+this.r){ this.x=pageX0+m+this.r; this.vx*=-PHY.bounce; beep(300,.04,'sine',.02); }
      if(this.x>pageX0+W-m-this.r){ this.x=pageX0+W-m-this.r; this.vx*=-PHY.bounce; beep(300,.04,'sine',.02); }
      if(this.y<96+this.r){ this.y=96+this.r; this.vy*=-PHY.bounce; }
      if(this.y>H-118-this.r){ this.y=H-118-this.r; this.vy*=-PHY.bounce; }
      if(Math.hypot(this.vx,this.vy)<PHY.settleEps) this.state='idle';
      if(isNaN(this.x)||isNaN(this.y)){ this.x=this.homeX; this.y=this.homeY; this.vx=this.vy=0; }
    }
    if(this.onUpdate) this.onUpdate(dt);
  }
  bobY(){ return (this.pinned||this.state==='grab') ? 0 : Math.sin(this.spin*1.4+this._bobPh)*2.2; }
  draw(ctx){ /* override in subclass */ }
  dispose(){ const i=objs.indexOf(this); if(i>=0) objs.splice(i,1); }
}

/* ---------- resize -------------------------------------------------------- */
function resize(){
  DPR=Math.min(devicePixelRatio||1,2);
  cv.width=Math.round(innerWidth*DPR); cv.height=Math.round(innerHeight*DPR);
  cv.style.width=innerWidth+'px'; cv.style.height=innerHeight+'px';  // pin CSS size = window
  vScale = Math.min(innerWidth/W, innerHeight/H);
  vOffX = (innerWidth - W*vScale)/2;
  vOffY = (innerHeight - H*vScale)/2;
}
addEventListener('resize', ()=>{ resize(); });

/* ---------- background: grid + drifting particles ------------------------ */
let bgParts=[];
function seedBG(){ bgParts=[]; const n=110;
  for(let i=0;i<n;i++) bgParts.push({ x:Math.random()*W*Math.max(1,PAGES.length),
    y:Math.random()*H, vx:(Math.random()-.5)*.15, vy:(Math.random()-.5)*.15,
    r:Math.random()*1.4+.4, a:Math.random()*.3+.06 }); }
function drawGrid(){
  const step=64, x0=Math.floor(worldX/step)*step - step;
  ctx.save(); ctx.strokeStyle=COL.grid; ctx.lineWidth=1;
  for(let x=x0; x<worldX+W+step; x+=step){ ctx.beginPath(); ctx.moveTo(x-worldX,0); ctx.lineTo(x-worldX,H); ctx.stroke(); }
  for(let y=0; y<H; y+=step){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
  ctx.restore();
}

/* ---------- standardized page caption layout ------------------------------ */
function pageCaption(title, subtitle, why){ return { title, subtitle, why }; }
function pageCenterX(idx){ return idx*W + W/2; }
function drawCaption(cap){
  if(!cap) return;
  const cx=W/2;
  if(cap.title) wrapText(cap.title, cx, 116, Math.min(W-140,980), 32, {size:27, color:COL.ink, weight:'700'});
  if(cap.subtitle) wrapText(cap.subtitle, cx, H-96, Math.min(W-160,1000), 25, {size:19, color:COL.dim, weight:'500'});
  if(cap.why) wrapText('WHY IT MATTERS  ·  '+cap.why, cx, H-56, Math.min(W-160,1000), 23, {size:16, color:COL.CY, weight:'600'});
}

/* ---------- LAB export ----------------------------------------------------- */
const LAB = {
  Obj, COL, PHY,
  get W(){return W;}, get H(){return H;}, get worldX(){return worldX;}, get page(){return page;},
  drawText, wrapText, roundRect, panel, glowCircle, glowLine, hexA,
  beep, burst, ripple, pageCaption, pageCenterX,
  definePage,
};
window.LAB = LAB;
window.__objsRef = ()=>objs;

/* ---------- navigation ------------------------------------------------------ */
function gotoPage(p){
  page=Math.max(0,Math.min(PAGES.length-1,p)); worldXT=page*W;
  document.getElementById('pagename').textContent=PAGES[page].name;
  document.getElementById('titleText').textContent=PAGES[page].title;
  document.getElementById('prev').classList.toggle('hidden',page===0);
  document.getElementById('next').classList.toggle('hidden',page===PAGES.length-1);
  rebuildDots(); beep(620,.06,'triangle');
}
function rebuildDots(){ const el=document.getElementById('dots'); el.innerHTML='';
  PAGES.forEach((_,i)=>{ const d=document.createElement('div'); d.className='dot'+(i===page?' on':'');
    d.addEventListener('pointerdown',e=>{e.stopPropagation();gotoPage(i);}); el.appendChild(d); }); }
function resetPage(p){ for(const o of [...objs]) if(o.page===p) o.dispose();
  PAGES[p].reset && PAGES[p].reset(LAB,p); beep(500,.1,'triangle',.04); }

/* ---------- pointer interaction ---------------------------------------------- */
const pointers=new Map();
function toVirtual(clientX, clientY){ return { x:(clientX-vOffX)/vScale, y:(clientY-vOffY)/vScale }; }
function boot(){
  if(started) return; started=true;
  resize(); seedBG();
  PAGES.forEach((pg,i)=>{ pg.build && pg.build(LAB,i); pg.reset && pg.reset(LAB,i); });
  cv.addEventListener('pointerdown', e=>{
    cv.setPointerCapture(e.pointerId);
    const v=toVirtual(e.clientX,e.clientY); ripple(v.x,v.y,true);
    const w={x:v.x+worldX, y:v.y};
    let hit=null;
    for(let i=objs.length-1;i>=0;i--){ const o=objs[i];
      if(o.page===page && o.state!=='processing' && !o.pinned){
        if(Math.hypot(w.x-o.x, w.y-o.y) < o.r+PHY.grabAssist){ hit=o; break; } } }
    if(hit){ for(const [,p] of pointers) if(p.obj===hit) p.obj=null; hit.grab(e.pointerId,w.x,w.y);
      objs.splice(objs.indexOf(hit),1); objs.push(hit); }
    pointers.set(e.pointerId,{x:v.x,y:v.y,w,obj:hit,startX:v.x,moved:0,t0:performance.now()});
  });
  cv.addEventListener('pointermove', e=>{
    const p=pointers.get(e.pointerId); if(!p) return;
    const v=toVirtual(e.clientX,e.clientY);
    p.moved+=Math.hypot(v.x-p.x,v.y-p.y); p.x=v.x; p.y=v.y;
    const w={x:v.x+worldX, y:v.y}; p.w=w; if(p.obj) p.obj.dragTo(w.x,w.y);
  });
  function endP(e){ const p=pointers.get(e.pointerId); if(!p) return;
    const v=toVirtual(e.clientX,e.clientY);
    if(p.obj){ const o=p.obj; let consumed=false;
      if(PAGES[page].onDrop) consumed=PAGES[page].onDrop(LAB,o,p.w,page);
      if(!consumed) o.release();
    } else { const dx=v.x-p.startX, dt=performance.now()-p.t0;
      if(Math.abs(dx)>70 && dt<600 && Math.abs(dx)>p.moved*0.6) gotoPage(page+(dx<0?1:-1)); }
    pointers.delete(e.pointerId); ripple(v.x,v.y);
  }
  cv.addEventListener('pointerup', endP); cv.addEventListener('pointercancel', endP);

  document.getElementById('prev').addEventListener('pointerdown',e=>{e.stopPropagation();gotoPage(page-1);});
  document.getElementById('next').addEventListener('pointerdown',e=>{e.stopPropagation();gotoPage(page+1);});
  document.getElementById('resetBtn').addEventListener('pointerdown',e=>{e.stopPropagation();resetPage(page);});
  document.getElementById('muteBtn').addEventListener('pointerdown',e=>{e.stopPropagation();
    muted=!muted; e.target.textContent=muted?'Sound: Off':'Sound: On';});
  let dbg=0,dbgT=null,showFPS=false;
  addEventListener('pointerdown',e=>{ if(e.clientX>innerWidth-120&&e.clientY<100){
    dbg++; clearTimeout(dbgT); dbgT=setTimeout(()=>dbg=0,700);
    if(dbg>=5){showFPS=!showFPS; document.getElementById('fps').style.display=showFPS?'block':'none'; dbg=0;} } });
  LAB._showFPS=()=>showFPS;
  gotoPage(0); requestAnimationFrame(frame);
}

/* ---------- main loop ---------------------------------------------------------- */
let last=performance.now(), fpsAvg=60, T=0;
function frame(now){
  const dt=Math.min(0.05,(now-last)/1000); last=now; T+=dt;
  fpsAvg=fpsAvg*0.95+(1/Math.max(dt,0.001))*0.05;
  if(LAB._showFPS && LAB._showFPS()) document.getElementById('fps').textContent=`FPS ${fpsAvg.toFixed(0)} · OBJ ${objs.length}`;

  worldX += (worldXT-worldX)*0.14;

  // Clear the FULL real screen first (this also paints any letterbox bars on
  // screens with a different aspect ratio than the virtual canvas).
  ctx.setTransform(DPR,0,0,DPR,0,0);
  ctx.fillStyle=COL.bg; ctx.fillRect(0,0,innerWidth,innerHeight);

  // Switch into virtual coordinate space: from here on, 1 unit = 1 virtual pixel,
  // and everything (all page code) draws in the same fixed W×H space regardless
  // of the real screen's size — this is what makes layout identical everywhere.
  ctx.setTransform(DPR*vScale,0,0,DPR*vScale, DPR*vOffX, DPR*vOffY);
  drawGrid();

  // background particles reacting to touch
  ctx.save();
  for(const b of bgParts){
    b.x+=b.vx; b.y+=b.vy;
    for(const [,p] of pointers){ const dx=b.x-(p.x+worldX), dy=b.y-p.y, d=Math.hypot(dx,dy);
      if(d<120 && d>1){ b.vx+=dx/d*.10; b.vy+=dy/d*.10; } }
    b.vx*=.985; b.vy*=.985;
    const sx=b.x-worldX;
    if(sx<-20||sx>W+20){ b.x=worldX+Math.random()*W; }
    if(b.y<0)b.y=H; if(b.y>H)b.y=0;
    ctx.fillStyle=`rgba(120,220,255,${b.a})`;
    ctx.beginPath(); ctx.arc(sx,b.y,b.r,0,6.283); ctx.fill();
  }
  ctx.restore();

  // world-space content
  ctx.save(); ctx.translate(-worldX,0);
  const pg=PAGES[page];
  if(pg && pg.draw) pg.draw(LAB, ctx, dt, T);
  if(pg && pg.onFrame) pg.onFrame(LAB, dt, T);
  for(const o of [...objs]){ if(Math.abs(o.page-page)>1) continue; o.update(dt);
    ctx.save(); ctx.translate(0, o.bobY()); o.draw(ctx); ctx.restore(); }
  ctx.restore();

  // bursts (screen space, follow world scroll too -> draw in world space)
  ctx.save(); ctx.translate(-worldX,0);
  for(let i=bursts.length-1;i>=0;i--){ const b=bursts[i]; let alive=false;
    for(const p of b.parts){ if(p.life<=0) continue; alive=true;
      p.x+=p.vx; p.y+=p.vy; p.vx*=.95; p.vy*=.95; p.life-=.025;
      ctx.globalAlpha=Math.max(0,p.life); ctx.fillStyle=b.color;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,6.283); ctx.fill(); }
    ctx.globalAlpha=1; if(!alive) bursts.splice(i,1); }
  ctx.restore();

  // ripples (screen space)
  for(let i=ripples.length-1;i>=0;i--){ const r=ripples[i]; r.r+=(r.max-r.r)*.12; r.a*=.9;
    ctx.strokeStyle=`rgba(70,240,255,${r.a})`; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.arc(r.x,r.y,r.r,0,6.283); ctx.stroke();
    if(r.a<0.02) ripples.splice(i,1); }

  // caption overlay (screen space, always same position regardless of scroll)
  if(pg && pg.caption) drawCaption(pg.caption);

  requestAnimationFrame(frame);
}
window.addEventListener('load', ()=>setTimeout(boot,20));
