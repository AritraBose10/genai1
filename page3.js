/* PAGE 3 — AI ⊃ ML ⊃ DL ⊃ GenAI : nested rings + sorting game */
(function(){
const L=window.LAB, T=L.THREE, ROOM=L.ROOM, X=3*ROOM;
let rings=[], slots=[], decor=[], scoreSprite=null, score=0;

const RINGDEF=[
  {r:11, name:'AI', color:0x2f6f7f, def:'any machine doing "smart" tasks'},
  {r:8.2,name:'MACHINE LEARNING', color:0x46f0ff, def:'learns patterns from data'},
  {r:5.4,name:'DEEP LEARNING', color:0x9d6bff, def:'many-layered neural nets'},
  {r:2.8,name:'GENERATIVE AI', color:0xff5fd0, def:'makes new data'},
];
// tokens: which ring they belong in (0=AI only ... 3=GenAI). thermostat = -1 (none)
const TOKENS=[
  {t:'spam filter', ring:1}, {t:'chess bot', ring:0}, {t:'ChatGPT', ring:3},
  {t:'face unlock', ring:2}, {t:'image maker', ring:3}, {t:'thermostat', ring:-1},
];

function ringMesh(def){
  const g=new T.Group();
  const ringGeo=new T.RingGeometry(def.r-0.12, def.r, 96);
  const m=new T.Mesh(ringGeo, new T.MeshBasicMaterial({color:def.color,transparent:true,opacity:0.85,side:T.DoubleSide,blending:T.AdditiveBlending}));
  const glow=new T.Mesh(new T.RingGeometry(def.r-0.5,def.r+0.4,96), new T.MeshBasicMaterial({color:def.color,transparent:true,opacity:0.12,side:T.DoubleSide,blending:T.AdditiveBlending}));
  g.add(m,glow); return g;
}

class ChipToken extends L.Obj{
  constructor(x,y,def){ super(3,x,y,2.3); this.def=def; this.placed=false;
    this.panel=new T.Mesh(new T.PlaneGeometry(5.2,2.2), L.holoPanelMat(0x46f0ff));
    const w=2.6,h=1.1; this.frame=L.lineLoop([new T.Vector3(-w,-h,0),new T.Vector3(w,-h,0),new T.Vector3(w,h,0),new T.Vector3(-w,h,0),new T.Vector3(-w,-h,0)],0x8fe9ff);
    this.lbl=L.textSprite(def.t,26,'#c9f7ff'); this.lbl.position.set(0,0,0.1);
    this.group.add(this.panel,this.frame,this.lbl);
  }
  onUpdate(dt){ this.group.rotation.y=Math.sin(this.spin*0.5)*0.06;
    if(this.rejectT>0) this.frame.material.color.set(L.C.RD);
    else if(this.placed) this.frame.material.color.set(L.C.OK);
    else this.frame.material.color.set(new T.Color(0x8fe9ff)); }
}

function correctRingFor(ringIdx, wx, wy){
  // radial distance from center decides which ring band the drop lands in
  const d=Math.hypot(wx-X, wy-1);
  // band boundaries (outer→inner): AI 8.2-11, ML 5.4-8.2, DL 2.8-5.4, GenAI 0-2.8
  let band; if(d>8.2)band=0; else if(d>5.4)band=1; else if(d>2.8)band=2; else band=3;
  return band;
}

L.definePage({
  name:'How It All Nests', title:'AI Contains ML Contains DL',
  build(L,idx){
    RINGDEF.forEach(def=>{ const m=ringMesh(def); m.position.set(X,1,0); L.scene.add(m); rings.push({m,def});
      const lbl=L.textSprite(def.name,22, '#'+def.color.toString(16).padStart(6,'0')==='#2f6f7f'?'#7fbecb':'#c9f7ff');
      lbl.position.set(X, 1+def.r-0.75, 0.2); L.scene.add(lbl); });
    const h1=L.textSprite('They are not rivals. Each lives inside the last.',28,L.COL.ink); h1.position.set(X,13.2,0);
    const h2=L.textSprite('drop each system into the ring it belongs to',22,L.COL.faint); h2.position.set(X,-11.6,0);
    const h3=L.textSprite('Why it matters: "AI" in a headline could mean any of these four things. Precision here saves confusion later.',18,'#5fd8ff'); h3.position.set(X,-13.2,0);
    scoreSprite=L.textSprite('placed: 0 / '+TOKENS.filter(t=>t.ring>=0).length,22,'#3dffb0'); scoreSprite.position.set(X+11,12,0);
    decor=[h1,h2,h3,scoreSprite]; decor.forEach(d=>L.scene.add(d)); this.decor=decor;
  },
  reset(L,p){ score=0; if(scoreSprite){ scoreSprite.material.map.image.getContext&&0; }
    TOKENS.forEach((td,i)=>{ const col=i%2, row=Math.floor(i/2);
      const t=new ChipToken(X-17+col*0, -6+row*3.4, td); // stack on left shelf
      t.x=X-15.5; t.y=6-i*2.6; t.homeX=t.x; t.homeY=t.y; t.group.position.set(t.x,t.y,0); });
  },
  onDrop(L,o,w,page){
    if(!(o instanceof ChipToken)) return false;
    const d=Math.hypot(w.x-X, w.y-1);
    if(d>11.5){ return false; }                 // dropped outside → just release
    const band=correctRingFor(0,w.x,w.y);
    if(o.def.ring===-1){ o.reject(); return true; }   // thermostat belongs nowhere
    if(band===o.def.ring){ o.placed=true; o.pinned=true; o.state='idle';
      L.burst(w.x,w.y,0,0x3dffb0,26,0.3); L.beep(880,0.12,'triangle',0.05);
      score++; return true; }
    else { o.reject(); return true; }
  },
  onFrame(L,dt,T){ rings.forEach((r,i)=>{ r.m.rotation.z=Math.sin(T*0.2+i)*0.03;
    r.m.children[0].material.opacity=0.75+Math.sin(T*1.5+i)*0.15; }); }
});
})();
