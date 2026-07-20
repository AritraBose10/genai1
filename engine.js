/* =====================================================================
   GENAI INTERACTION LAB — SHARED ENGINE
   Renderer · Bloom · Physics base class · Materials · Pointers · Pages
   Pages register themselves via LAB.definePage({...}).
===================================================================== */
"use strict";

const PHY = { dragLag:0.38, friction:0.985, bounce:0.62, maxSpeed:3.2,
              grabAssist:2.2, settleEps:0.01 };
const ROOM = 80;                         // world-units between page centers
const BOUND = { x:30, yTop:13, yBot:-12 };

/* ---------- renderer / scene ---------------------------------------- */
const renderer = new THREE.WebGLRenderer({ antialias:true, powerPreference:'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
document.body.appendChild(renderer.domElement);
renderer.domElement.id = 'cv';
renderer.domElement.style.touchAction = 'none';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x030509);
scene.fog = new THREE.FogExp2(0x030509, 0.012);
const camera = new THREE.PerspectiveCamera(46, innerWidth/innerHeight, 0.1, 400);
camera.position.set(0, 1.5, 44);

const composer = new THREE.EffectComposer(renderer);
composer.addPass(new THREE.RenderPass(scene, camera));
const bloom = new THREE.UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight), 1.25, 0.55, 0.12);
composer.addPass(bloom);
const rgb = new THREE.ShaderPass(THREE.RGBShiftShader);
rgb.uniforms.amount.value = 0.0011;
composer.addPass(rgb);

addEventListener('resize', ()=>{
  camera.aspect = innerWidth/innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
});

/* ---------- palette --------------------------------------------------- */
const COL = {
  CY:0x46f0ff, VI:0x9d6bff, MG:0xff5fd0, OK:0x3dffb0, RD:0xff5f6b, AM:0xff9f4d,
  ink:'#c9f7ff', dim:'#6d90a3', faint:'#4d6b7a'
};
const C = { CY:new THREE.Color(COL.CY), VI:new THREE.Color(COL.VI), MG:new THREE.Color(COL.MG),
            OK:new THREE.Color(COL.OK), RD:new THREE.Color(COL.RD), AM:new THREE.Color(COL.AM) };

/* ---------- environment ---------------------------------------------- */
function buildRoomFloor(cx){
  const g = new THREE.GridHelper(64, 26, 0x1a4a5a, 0x0d2833);
  g.position.set(cx, BOUND.yBot-2.5, 0);
  g.material.transparent = true; g.material.opacity = 0.5;
  scene.add(g);
}
const dust = (()=> {
  const N=700, geo=new THREE.BufferGeometry(), pos=new Float32Array(N*3);
  for(let i=0;i<N;i++){ pos[i*3]=(Math.random()*7-1)*ROOM; pos[i*3+1]=Math.random()*30-14;
    pos[i*3+2]=(Math.random()-0.5)*30; }
  geo.setAttribute('position', new THREE.BufferAttribute(pos,3));
  const p=new THREE.Points(geo, new THREE.PointsMaterial({ color:0x77d8ff, size:0.09,
    transparent:true, opacity:0.5, blending:THREE.AdditiveBlending, depthWrite:false }));
  scene.add(p); return p;
})();

/* ---------- materials ------------------------------------------------- */
const panelMats = [];
function fresnelMat(color, power=2.6, alpha=1.0){
  return new THREE.ShaderMaterial({
    uniforms:{ c:{value:new THREE.Color(color)}, p:{value:power}, a:{value:alpha} },
    vertexShader:`varying vec3 vN; varying vec3 vV;
      void main(){ vN=normalize(normalMatrix*normal);
        vec4 mv=modelViewMatrix*vec4(position,1.0); vV=-mv.xyz;
        gl_Position=projectionMatrix*mv; }`,
    fragmentShader:`uniform vec3 c; uniform float p; uniform float a;
      varying vec3 vN; varying vec3 vV;
      void main(){ float f=pow(1.0-abs(dot(normalize(vN),normalize(vV))),p);
        gl_FragColor=vec4(c*f*1.8, f*a); }`,
    transparent:true, blending:THREE.AdditiveBlending, depthWrite:false });
}
function holoPanelMat(color){
  const m=new THREE.ShaderMaterial({
    uniforms:{ c:{value:new THREE.Color(color)}, t:{value:0} },
    vertexShader:`varying vec2 vUv; void main(){ vUv=uv;
      gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader:`uniform vec3 c; uniform float t; varying vec2 vUv;
      void main(){ float scan=0.06*sin(vUv.y*140.0 - t*5.0);
        float edge=1.0-smoothstep(0.0,0.10,min(min(vUv.x,1.0-vUv.x),min(vUv.y,1.0-vUv.y)));
        vec3 col=c*(0.10+scan+edge*1.1);
        gl_FragColor=vec4(col, 0.16+edge*0.55+scan); }`,
    transparent:true, blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide });
  panelMats.push(m); return m;
}
function lineMat(color, op=1){ return new THREE.LineBasicMaterial({ color, transparent:true,
  opacity:op, blending:THREE.AdditiveBlending }); }
function basicMat(color, op=1, wire=false){ return new THREE.MeshBasicMaterial({ color,
  transparent:op<1, opacity:op, wireframe:wire }); }

/* ---------- geometry helpers ------------------------------------------ */
function circlePts(r, n=32){ const a=[]; for(let i=0;i<=n;i++){ const t=i/n*6.283;
  a.push(new THREE.Vector3(Math.cos(t)*r, Math.sin(t)*r, 0)); } return a; }
function lineLoop(pts, color, op=0.95){ const g=new THREE.BufferGeometry().setFromPoints(pts);
  return new THREE.Line(g, lineMat(color, op)); }
function segs(pairs, color, op=0.95){ const pts=[]; pairs.forEach(p=>pts.push(
  new THREE.Vector3(...p[0]), new THREE.Vector3(...p[1])));
  return new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), lineMat(color,op)); }

/* ---------- text sprite ----------------------------------------------- */
function textSprite(txt, px=42, color=COL.ink, op=0.95){
  const c=document.createElement('canvas'), g=c.getContext('2d');
  g.font=`${px}px "SF Mono", Consolas, monospace`;
  const w=Math.ceil(g.measureText(txt).width)+24;
  c.width=w; c.height=px*1.8;
  g.font=`${px}px "SF Mono", Consolas, monospace`;
  g.textBaseline='middle'; g.textAlign='center'; g.fillStyle=color; g.fillText(txt,w/2,c.height/2);
  const tex=new THREE.CanvasTexture(c); tex.minFilter=THREE.LinearFilter;
  const s=new THREE.Sprite(new THREE.SpriteMaterial({ map:tex, transparent:true, opacity:op, depthWrite:false }));
  s.scale.set(w/44, c.height/44, 1); s.userData.baseOp=op;
  return s;
}

/* ---------- audio ----------------------------------------------------- */
let AC=null, muted=false;
function beep(f=440,d=0.07,type='sine',g=0.05){
  if(muted) return;
  try{ AC=AC||new (window.AudioContext||window.webkitAudioContext)();
    const o=AC.createOscillator(), v=AC.createGain();
    o.type=type; o.frequency.value=f; v.gain.value=g; o.connect(v); v.connect(AC.destination);
    o.start(); v.gain.exponentialRampToValueAtTime(0.0001, AC.currentTime+d); o.stop(AC.currentTime+d+0.02);
  }catch(e){}
}

/* ---------- particle bursts ------------------------------------------- */
const bursts=[];
function burst(x,y,z,color,n=40,spd=0.35){
  const geo=new THREE.BufferGeometry(), pos=new Float32Array(n*3), vel=[];
  for(let i=0;i<n;i++){ pos[i*3]=x; pos[i*3+1]=y; pos[i*3+2]=z;
    const a=Math.random()*6.283,b=Math.random()*3.14,s=Math.random()*spd+0.05;
    vel.push([Math.cos(a)*Math.sin(b)*s, Math.cos(b)*s, Math.sin(a)*Math.sin(b)*s]); }
  geo.setAttribute('position', new THREE.BufferAttribute(pos,3));
  const pts=new THREE.Points(geo, new THREE.PointsMaterial({ color, size:0.24, transparent:true,
    opacity:1, blending:THREE.AdditiveBlending, depthWrite:false }));
  scene.add(pts); bursts.push({pts,vel,life:1});
}

/* ---------- base interactive object ----------------------------------- */
const objs=[];
class Obj{
  constructor(page,x,y,r){
    this.page=page; this.x=x; this.y=y; this.vx=0; this.vy=0;
    this.homeX=x; this.homeY=y; this.r=r;
    this.state='idle'; this.grabId=null; this.gox=0; this.goy=0;
    this.squash=1; this.spin=Math.random()*6.28; this.rejectT=0; this._bobPh=Math.random()*6.28;
    this.pinned=false;                       // pinned = not draggable (decor/labels)
    this.group=new THREE.Group(); this.group.position.set(x,y,0); scene.add(this.group);
    this.hitMesh=new THREE.Mesh(new THREE.SphereGeometry(r+PHY.grabAssist,8,8),
      new THREE.MeshBasicMaterial({visible:false}));
    this.group.add(this.hitMesh); this.hitMesh.userData.obj=this;
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
      const cx=this.page*ROOM;
      if(this.x<cx-BOUND.x+this.r){this.x=cx-BOUND.x+this.r;this.vx*=-PHY.bounce;beep(300,.04,'sine',.02);}
      if(this.x>cx+BOUND.x-this.r){this.x=cx+BOUND.x-this.r;this.vx*=-PHY.bounce;beep(300,.04,'sine',.02);}
      if(this.y>BOUND.yTop-this.r){this.y=BOUND.yTop-this.r;this.vy*=-PHY.bounce;}
      if(this.y<BOUND.yBot+this.r){this.y=BOUND.yBot+this.r;this.vy*=-PHY.bounce;}
      if(Math.hypot(this.vx,this.vy)<PHY.settleEps) this.state='idle';
      if(isNaN(this.x)||isNaN(this.y)){this.x=this.homeX;this.y=this.homeY;this.vx=this.vy=0;}
    }
    // ambient idle life: gentle breathing bob + gyro-drift, purely visual — never touches x/y physics
    const bob = (this.pinned || this.state==='grab') ? 0 : Math.sin(this.spin*1.4 + this._bobPh||0)*0.10;
    this.group.position.set(this.x, this.y + bob, 0);
    this.group.scale.set(this.squash,2-this.squash,this.squash);
    if(this.onUpdate) this.onUpdate(dt);
  }
  dispose(){ scene.remove(this.group); const i=objs.indexOf(this); if(i>=0)objs.splice(i,1); }
}

/* ---------- PAGE REGISTRY --------------------------------------------- */
const PAGES=[];         // {idx,name,title,build,reset,onDrop,onFrame,decor:[]}
const LAB = {
  THREE, scene, Obj, ROOM, BOUND, COL, C, PHY,
  fresnelMat, holoPanelMat, lineMat, basicMat, lineLoop, segs, circlePts,
  textSprite, beep, burst, buildRoomFloor,
  worldXOf:(page)=>page*ROOM,
  definePage(def){ def.idx=PAGES.length; PAGES.push(def); }
};
window.LAB = LAB;
window.__objsRef = ()=>objs;   // pages may need to scan live objects (e.g. proximity)

/* ---------- boot (called after pages load) ---------------------------- */
let page=0, camXT=0, started=false, genState={};
function resetPage(p){
  for(const o of [...objs]) if(o.page===p) o.dispose();
  PAGES[p].reset && PAGES[p].reset(LAB, p);
  beep(500,.1,'triangle',.04);
}
function gotoPage(p){
  page=Math.max(0,Math.min(PAGES.length-1,p)); camXT=page*ROOM;
  PAGES.forEach((pg,i)=>{ (pg.decor||[]).forEach(d=>{
    const target = i===page ? (d.userData.baseOp||0.95) : 0;
    d.material.opacity = target; }); });
  document.getElementById('pagename').textContent=PAGES[page].name;
  document.getElementById('titleText').textContent=PAGES[page].title;
  document.getElementById('prev').classList.toggle('hidden',page===0);
  document.getElementById('next').classList.toggle('hidden',page===PAGES.length-1);
  rebuildDots();
  beep(620,.06,'triangle');
}
function rebuildDots(){
  const el=document.getElementById('dots'); el.innerHTML='';
  PAGES.forEach((_,i)=>{ const d=document.createElement('div'); d.className='dot'+(i===page?' on':'');
    d.addEventListener('pointerdown',e=>{e.stopPropagation();gotoPage(i);}); el.appendChild(d); });
}

/* ---------- pointer interaction --------------------------------------- */
const ray=new THREE.Raycaster();
const dragPlane=new THREE.Plane(new THREE.Vector3(0,0,1),0);
const ndc=new THREE.Vector2(), wpt=new THREE.Vector3();
function worldFromEvent(e){ ndc.set((e.clientX/innerWidth)*2-1, -(e.clientY/innerHeight)*2+1);
  ray.setFromCamera(ndc,camera); ray.ray.intersectPlane(dragPlane,wpt); return {x:wpt.x,y:wpt.y}; }
const pointers=new Map(); const parallax={x:0,y:0};
function boot(){
  if(started) return; started=true;
  buildRoomFloor(0);
  PAGES.forEach((pg,i)=>{ buildRoomFloor(i*ROOM); pg.build && pg.build(LAB,i);
    pg.reset && pg.reset(LAB,i); });
  const el=renderer.domElement;
  el.addEventListener('pointerdown', e=>{
    el.setPointerCapture(e.pointerId); const w=worldFromEvent(e);
    ndc.set((e.clientX/innerWidth)*2-1, -(e.clientY/innerHeight)*2+1); ray.setFromCamera(ndc,camera);
    const hits=ray.intersectObjects(objs.map(o=>o.hitMesh));
    let obj=null;
    if(hits.length){ const o=hits[0].object.userData.obj;
      if(o.page===page && o.state!=='processing' && !o.pinned) obj=o; }
    if(obj){ for(const [,p] of pointers) if(p.obj===obj) p.obj=null; obj.grab(e.pointerId,w.x,w.y); }
    pointers.set(e.pointerId,{x:e.clientX,y:e.clientY,w,obj,startX:e.clientX,moved:0,t0:performance.now()});
  });
  el.addEventListener('pointermove', e=>{
    const p=pointers.get(e.pointerId);
    parallax.x=(e.clientX/innerWidth-0.5); parallax.y=(e.clientY/innerHeight-0.5);
    if(!p) return; p.moved+=Math.hypot(e.clientX-p.x,e.clientY-p.y); p.x=e.clientX; p.y=e.clientY;
    const w=worldFromEvent(e); p.w=w; if(p.obj) p.obj.dragTo(w.x,w.y);
  });
  function endP(e){
    const p=pointers.get(e.pointerId); if(!p) return;
    if(p.obj){ const o=p.obj; let consumed=false;
      if(PAGES[page].onDrop) consumed=PAGES[page].onDrop(LAB, o, p.w, page);
      if(!consumed) o.release();
    } else { const dx=e.clientX-p.startX, dt=performance.now()-p.t0;
      if(Math.abs(dx)>90 && dt<600 && Math.abs(dx)>p.moved*0.6) gotoPage(page+(dx<0?1:-1)); }
    pointers.delete(e.pointerId);
  }
  el.addEventListener('pointerup', endP); el.addEventListener('pointercancel', endP);
  // HUD
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
  gotoPage(0);
  requestAnimationFrame(frame);
}

/* ---------- main loop -------------------------------------------------- */
let last=performance.now(), fpsAvg=60, lowT=0, T=0;
function frame(now){
  const dt=Math.min(0.05,(now-last)/1000); last=now; T+=dt;
  fpsAvg=fpsAvg*0.95+(1/Math.max(dt,0.001))*0.05;
  if(LAB._showFPS && LAB._showFPS()) document.getElementById('fps').textContent=
    `FPS ${fpsAvg.toFixed(0)} · OBJ ${objs.length}`;
  if(fpsAvg<45){ lowT+=dt; if(lowT>2 && bloom.strength>0.5){ bloom.strength=0.5;
    dust.material.opacity=0.25; renderer.setPixelRatio(1); lowT=0; } } else lowT=0;

  camera.position.x += (camXT + parallax.x*1.4 - camera.position.x)*0.08;
  camera.position.y += (1.5 - parallax.y*1.0 - camera.position.y)*0.08;
  camera.lookAt(camXT, 0.4, 0);

  for(const m of panelMats) m.uniforms.t.value=T;
  if(PAGES[page].onFrame) PAGES[page].onFrame(LAB, dt, T);
  for(const o of [...objs]) o.update(dt);
  dust.rotation.y += dt*0.01;

  for(let i=bursts.length-1;i>=0;i--){ const b=bursts[i]; b.life-=dt*1.2;
    const pos=b.pts.geometry.attributes.position;
    for(let j=0;j<b.vel.length;j++){ pos.array[j*3]+=b.vel[j][0]; pos.array[j*3+1]+=b.vel[j][1];
      pos.array[j*3+2]+=b.vel[j][2]; b.vel[j][1]-=dt*0.15; }
    pos.needsUpdate=true; b.pts.material.opacity=Math.max(0,b.life);
    if(b.life<=0){ scene.remove(b.pts); b.pts.geometry.dispose(); bursts.splice(i,1); } }
  composer.render(); requestAnimationFrame(frame);
}
LAB.resetPage = resetPage;
LAB.gotoPage  = ()=>gotoPage;
window.addEventListener('load', ()=>setTimeout(boot, 30));
