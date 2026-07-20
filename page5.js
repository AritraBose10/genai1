/* PAGE 5 — What Deep Learning "sees": the layer-by-layer feature stack */
(function(){
const L=window.LAB, T=L.THREE, ROOM=L.ROOM, X=5*ROOM;
let building=null, decor=[], input=null;

const FLOORS=[
  {name:'edges', color:0x46f0ff}, {name:'textures', color:0x5fd8ff},
  {name:'parts', color:0x9d6bff}, {name:'the whole thing → CAT', color:0xff5fd0},
];

class Building{
  constructor(x,y){ this.x=x; this.y=y; this.g=new T.Group(); this.g.position.set(x,y,0); L.scene.add(this.g);
    this.floors=[]; this.spread=0; this.spreadT=0.2;
    FLOORS.forEach((fd,i)=>{ const fg=new T.Group();
      const glass=new T.Mesh(new T.BoxGeometry(9,2,5), new T.MeshBasicMaterial({color:fd.color,transparent:true,opacity:0.08,blending:T.AdditiveBlending,depthWrite:false}));
      const edge=new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(9,2,5)), L.lineMat(fd.color,0.6));
      // feature glyphs living on the floor
      const feat=new T.Group();
      for(let k=0;k<5;k++){ let m;
        if(i===0){ m=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(-0.6,-0.4,0),new T.Vector3(0.6,0.5,0)]), L.lineMat(fd.color,0.9)); }
        else if(i===1){ m=L.lineLoop(L.circlePts(0.35,12),fd.color); }
        else if(i===2){ m=L.lineLoop([new T.Vector3(0,0.5,0),new T.Vector3(0.45,-0.3,0),new T.Vector3(-0.45,-0.3,0),new T.Vector3(0,0.5,0)],fd.color); }
        else { m=new T.Mesh(new T.IcosahedronGeometry(0.4,0), L.basicMat(fd.color,0.9,true)); }
        m.position.set(-3.2+k*1.6, 0, 0.4); feat.add(m); }
      fg.add(glass,edge,feat); fg.position.y=-3+i*2; this.g.add(fg);
      const lbl=L.textSprite(fd.name,20,'#c9f7ff'); lbl.position.set(6.2,-3+i*2,0); fg.add(lbl); lbl.visible=false; fg.userData.lbl=lbl;
      this.floors.push(fg); });
  }
  over(wx,wy){ return Math.abs(wx-this.x)<5 && Math.abs(wy-this.y)<6; }
  update(dt){ this.spread += (this.spreadT-this.spread)*0.08;
    this.floors.forEach((fg,i)=>{ fg.position.y=-3+i*(2+this.spread*2.2);
      fg.userData.lbl.visible = this.spread>0.5;
      fg.userData.lbl.material.opacity=Math.min(1,this.spread);
      fg.rotation.y=Math.sin(performance.now()*0.0006+i)*0.05; }); }
  toggle(){ this.spreadT = this.spreadT>1 ? 0.2 : 1.6; L.beep(500,0.1,'triangle',0.05); }
  feed(kind){ // cascade a pulse up the floors
    this.floors.forEach((fg,i)=>setTimeout(()=>{ L.burst(this.x, fg.position.y+this.y, 0, FLOORS[i].color, 20, 0.25);
      L.beep(400+i*120,0.08,'sine',0.04); },i*220)); }
}

class Feeder extends L.Obj{      /* draggable input image */
  constructor(x,y,kind){ super(5,x,y,2.0); this.kind=kind;
    this.panel=new T.Mesh(new T.PlaneGeometry(3.6,3.6), L.holoPanelMat(kind==='noise'?0xff5f6b:0x46f0ff));
    const f=1.8; this.frame=L.lineLoop([new T.Vector3(-f,-f,0),new T.Vector3(f,-f,0),new T.Vector3(f,f,0),new T.Vector3(-f,f,0),new T.Vector3(-f,-f,0)],kind==='noise'?0xff5f6b:0x8fe9ff);
    let icon; if(kind==='cat') icon=L.lineLoop(L.circlePts(1),0x9feaff);
      else if(kind==='car') icon=L.lineLoop([new T.Vector3(-1.3,-0.4,0),new T.Vector3(1.3,-0.4,0),new T.Vector3(1,0.5,0),new T.Vector3(-1,0.5,0),new T.Vector3(-1.3,-0.4,0)],0x9feaff);
      else { icon=new T.Group(); for(let i=0;i<12;i++){ const d=new T.Mesh(new T.SphereGeometry(0.08,6,6),L.basicMat(0xff5f6b)); d.position.set((Math.random()-0.5)*2.6,(Math.random()-0.5)*2.6,0.2); icon.add(d);} }
    const lbl=L.textSprite(kind.toUpperCase(),20,'#c9f7ff'); lbl.position.set(0,-2.4,0);
    this.group.add(this.panel,this.frame,icon,lbl);
  }
  onUpdate(dt){ this.group.rotation.y=Math.sin(this.spin*0.5)*0.06; }
}

L.definePage({
  name:'What The Layers See', title:'Features, Floor by Floor',
  build(L,idx){ building=new Building(X-3,0);
    const h1=L.textSprite('A deep net builds understanding in layers: edges → textures → parts → object.',24,L.COL.ink); h1.position.set(X,13,0);
    const h2=L.textSprite('feed an image in · tap RESET to collapse the stack · drag the stack open',20,L.COL.faint); h2.position.set(X,-11.4,0);
    const h3=L.textSprite('drop CAT / CAR / NOISE into the stack',20,'#5fd8ff'); h3.position.set(X+11,10,0);
    const h4=L.textSprite('Why it matters: this is why deep nets need real examples — noise in gives noise out, all the way up.',18,'#5fd8ff'); h4.position.set(X,-13.0,0);
    // a "spread" toggle handle
    decor=[h1,h2,h3,h4]; decor.forEach(d=>L.scene.add(d)); this.decor=decor;
  },
  reset(L,p){ new Feeder(X+12,4,'cat'); new Feeder(X+12,0,'car'); new Feeder(X+12,-4,'noise');
    if(building){ building.spreadT=1.6; } },
  onDrop(L,o,w,page){ if(o instanceof Feeder && building && building.over(w.x,w.y)){
    building.feed(o.kind); o.snapHome();
    if(o.kind==='noise'){ L.beep(120,0.3,'sawtooth',0.05); } return true; } return false; },
  onFrame(L,dt,T){ if(building) building.update(dt); }
});
})();
