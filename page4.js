/* PAGE 4 — ML vs Deep Learning: hand-crafted features vs learned features */
(function(){
const L=window.LAB, T=L.THREE, ROOM=L.ROOM, X=4*ROOM;
let tools=[], mlModel=null, dlStack=null, decor=[], fed={ml:0,dl:0};

/* a photo token (raw data) */
class Photo extends L.Obj{
  constructor(x,y){ super(4,x,y,2.2); this.consumed=false;
    this.panel=new T.Mesh(new T.PlaneGeometry(4,4), L.holoPanelMat(0x46f0ff));
    const f=2; this.frame=L.lineLoop([new T.Vector3(-f,-f,0),new T.Vector3(f,-f,0),new T.Vector3(f,f,0),new T.Vector3(-f,f,0),new T.Vector3(-f,-f,0)],0x8fe9ff);
    // a little abstract "creature" glyph
    this.icon=L.lineLoop(L.circlePts(1.1),0x9feaff);
    const ears=L.segs([[[-0.9,0.7,0],[-1.3,1.7,0]],[[-1.3,1.7,0],[-0.4,1.05,0]],[[0.9,0.7,0],[1.3,1.7,0]],[[1.3,1.7,0],[0.4,1.05,0]]],0x9feaff);
    this.group.add(this.panel,this.frame,this.icon,ears);
  }
  onUpdate(dt){ this.group.rotation.y=Math.sin(this.spin*0.5)*0.06;
    if(this.rejectT>0) this.frame.material.color.set(L.C.RD); }
}
/* a feature chip peeled off by a tool */
class Chip extends L.Obj{
  constructor(x,y,name,color){ super(4,x,y,1.4); this.name=name;
    this.body=new T.Mesh(new T.OctahedronGeometry(1,0), L.basicMat(color,0.9,true));
    this.lbl=L.textSprite(name,20,'#c9f7ff'); this.lbl.position.set(0,-1.7,0);
    this.group.add(this.body,this.lbl); L.burst(x,y,0,color,16,0.2);
  }
  onUpdate(dt){ this.body.rotation.x=this.spin; this.body.rotation.y=this.spin*0.7; }
}

class Tool{
  constructor(x,y,name,color){ this.hx=x; this.hy=y; this.name=name; this.color=color;
    this.g=new T.Group(); this.g.position.set(x,y,0); L.scene.add(this.g);
    this.g.add(new T.Mesh(new T.ConeGeometry(0.9,1.8,16), L.basicMat(color,0.5,true)));
    const l=L.textSprite(name,18,'#c9f7ff'); l.position.set(0,-1.7,0); this.g.add(l); }
}

class MLModel{
  constructor(x,y){ this.x=x; this.y=y; this.g=new T.Group(); this.g.position.set(x,y,0); L.scene.add(this.g);
    const box=new T.BoxGeometry(7,6,4);
    this.g.add(new T.LineSegments(new T.EdgesGeometry(box), L.lineMat(0x46f0ff,0.9)));
    this.g.add(new T.Mesh(box, new T.MeshBasicMaterial({color:0x46f0ff,transparent:true,opacity:0.05,blending:T.AdditiveBlending,depthWrite:false})));
    const l1=L.textSprite('CLASSICAL ML',30,'#8fe9ff'); l1.position.set(0,4.4,0);
    const l2=L.textSprite('you hand-build the features',22,'#6d90a3'); l2.position.set(0,3.5,0);
    const l3=L.textSprite('feed it CHIPS, not photos',20,'#5fd8ff'); l3.position.set(0,-3.9,0);
    this.g.add(l1,l2,l3); }
  over(wx,wy){ return Math.abs(wx-this.x)<3.7 && Math.abs(wy-this.y)<3.2; }
}
class DLStack{
  constructor(x,y){ this.x=x; this.y=y; this.g=new T.Group(); this.g.position.set(x,y,0); L.scene.add(this.g); this.floors=[];
    for(let i=0;i<4;i++){ const p=new T.Mesh(new T.BoxGeometry(7,1.1,4),
      new T.MeshBasicMaterial({color:0x9d6bff,transparent:true,opacity:0.12,blending:T.AdditiveBlending,depthWrite:false}));
      p.position.y=-3+i*1.8; this.g.add(p);
      this.g.add(new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(7,1.1,4)), L.lineMat(0x9d6bff,0.7)).translateY(-3+i*1.8));
      this.floors.push(p); }
    const l1=L.textSprite('DEEP LEARNING',30,'#c9b3ff'); l1.position.set(0,4.6,0);
    const l2=L.textSprite('learns its own features',22,'#6d90a3'); l2.position.set(0,3.7,0);
    const l3=L.textSprite('feed it RAW photos',20,'#c79bff'); l3.position.set(0,-4.4,0);
    this.g.add(l1,l2,l3); this.pulse=-1; }
  over(wx,wy){ return Math.abs(wx-this.x)<3.7 && Math.abs(wy-this.y)<4.4; }
  ripple(){ this.pulse=0; }
  update(dt){ if(this.pulse>=0){ this.pulse+=dt*2.5;
    this.floors.forEach((f,i)=>{ const d=Math.abs(this.pulse-i*0.4);
      f.material.opacity=0.12+Math.max(0,0.5-d)*0.9; });
    if(this.pulse>3) this.pulse=-1; }
    else this.floors.forEach(f=>f.material.opacity=0.12+Math.sin(performance.now()*0.001+f.position.y)*0.03); }
}

L.definePage({
  name:'Two Ways to Find Features', title:'Hand-Built vs Learned',
  build(L,idx){
    mlModel=new MLModel(X-9,-1); dlStack=new DLStack(X+9,0);
    tools=[ new Tool(X-16,4,'ear tool',0x46f0ff), new Tool(X-16,1,'whisker',0x46f0ff), new Tool(X-16,-2,'texture',0x46f0ff) ];
    const h1=L.textSprite('Classical ML needs you to describe what matters. Deep learning figures it out.',24,L.COL.ink); h1.position.set(X,13,0);
    const h2=L.textSprite('drag a tool onto a photo to peel off a feature — then feed the model',20,L.COL.faint); h2.position.set(X,-11.4,0);
    const h3=L.textSprite('Why it matters: deep learning didn\'t win because it\'s "smarter" — it won because it removes the manual feature step entirely.',18,'#5fd8ff'); h3.position.set(X,-13.0,0);
    decor=[h1,h2,h3]; decor.forEach(d=>L.scene.add(d)); this.decor=decor;
  },
  reset(L,p){ fed={ml:0,dl:0};
    // photos on a shelf
    for(let i=0;i<3;i++){ const ph=new Photo(X-2+i*0.1, -6+i*3); ph.x=X-9; ph.y=6-i*3; ph.homeX=ph.x; ph.homeY=ph.y; ph.group.position.set(ph.x,ph.y,0);} 
    // extra photos near the DL side too
    const ph2=new Photo(X+3,7); ph2.homeX=ph2.x; ph2.homeY=ph2.y;
  },
  onDrop(L,o,w,page){
    // tool onto photo → peel a chip
    if(o instanceof Photo){
      // dropped on ML model?
      if(mlModel.over(w.x,w.y)){ o.reject(); // ML rejects raw photos
        return true; }
      if(dlStack.over(w.x,w.y)){ o.consumed=true; o.dispose(); dlStack.ripple();
        L.burst(dlStack.x,dlStack.y,0,0x9d6bff,40,0.3); L.beep(300,0.25,'sine',0.05);
        fed.dl++;
        // DL auto-emits its own chips flowing upward
        for(let i=0;i<3;i++) setTimeout(()=>{ const c=new Chip(dlStack.x,dlStack.y-2,'auto-feature',0x9d6bff);
          c.state='fly'; c.vy=0.6; c.vx=(Math.random()-0.5)*0.4; },i*160);
        return true; }
      return false;
    }
    // chip onto ML model → accepted
    if(o instanceof Chip){ if(mlModel.over(w.x,w.y)){ o.dispose();
      L.burst(mlModel.x,mlModel.y,0,0x3dffb0,26,0.3); L.beep(880,0.12,'triangle',0.05); fed.ml++; return true; } return false; }
    return false;
  },
  onFrame(L,dt,T){ if(dlStack) dlStack.update(dt);
    // tool proximity: if a photo overlaps a tool while flying/idle, peel a chip once
    for(const o of window.__objsRef()){ if(o instanceof Photo && !o.consumed){
      for(const tl of tools){ if(Math.hypot(o.x-tl.hx,o.y-tl.hy)<2.2 && o.state!=='grab'){
        // peel
        const c=new Chip(o.x+2,o.y, tl.name.replace(' tool','')+'-feat', tl.color); c.state='fly'; c.vx=1; 
        o.consumed=true; setTimeout(()=>{o.consumed=false;},1200); // debounce
        L.beep(600,0.08,'triangle',0.04);
      } } } }
  }
});
})();
