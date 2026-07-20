/* PAGE 1 — HOOK: "It makes new things." Seeds + generator core */
(function(){
const L=window.LAB, T=L.THREE;
let genCore=null, decor=[];

class Seed extends L.Obj{
  constructor(x,y,seed){ super(0,x,y,2.0); this.seed=seed;
    this.core=new T.Mesh(new T.IcosahedronGeometry(1.15,1), L.basicMat(seed.color,0.9,true));
    this.shell=new T.Mesh(new T.SphereGeometry(1.9,28,28), L.fresnelMat(seed.color,2.6,0.85));
    this.label=L.textSprite(seed.name,34,L.COL.ink); this.label.position.set(0,-2.7,0);
    this.group.add(this.core,this.shell,this.label);
  }
  onUpdate(dt){ this.core.rotation.x=this.spin*0.7; this.core.rotation.y=this.spin;
    this.core.scale.setScalar(1+Math.sin(this.spin*2)*0.06); }
}
const SEEDS=[{name:'FORM',color:0x46f0ff,hue:0.52},{name:'FLOW',color:0x9d6bff,hue:0.74},{name:'HUE',color:0xff5fd0,hue:0.88}];

class GenCore{
  constructor(x,y){ this.x=x;this.y=y;this.busy=null;this.t=0;this.spin=0;this.pulse=0;
    this.g=new T.Group(); this.g.position.set(x,y,0); L.scene.add(this.g); this.rings=[];
    for(let i=0;i<3;i++){ const r=new T.Mesh(new T.TorusGeometry(3.2+i*0.55,0.05,10,80),
      new T.MeshBasicMaterial({color:0xbfe9ff,transparent:true,opacity:0.5,blending:T.AdditiveBlending,depthWrite:false}));
      this.rings.push(r); this.g.add(r); }
    this.heart=new T.Mesh(new T.SphereGeometry(0.9,24,24), L.basicMat(0xffffff,0.85)); this.g.add(this.heart);
    const lbl=L.textSprite('GENERATOR',30,'#8fe9ff'); lbl.position.set(0,-5,0); this.g.add(lbl);
  }
  over(wx,wy){ return Math.hypot(wx-this.x,wy-this.y)<4.4; }
  consume(seed){ if(this.busy)return false; this.busy={seed,t:0}; this.pulse=1;
    L.burst(this.x,this.y,0,seed.seed.color,40,0.3); L.beep(200,0.25,'sine',0.06); return true; }
  emit(seedObj){
    const a=new L.Obj(0,this.x+7,this.y+2,2.2); const g=new T.Group();
    const baseHue=seedObj.seed.hue+(Math.random()-0.5)*0.25, n=5+Math.floor(Math.random()*7);
    for(let i=0;i<n;i++){ const col=new T.Color().setHSL((baseHue+i*0.03)%1,0.9,0.6), gp=Math.random();
      const geo=gp<0.4?new T.TetrahedronGeometry(0.4+Math.random()*0.6)
              :gp<0.7?new T.OctahedronGeometry(0.4+Math.random()*0.5)
              :new T.BoxGeometry(0.5+Math.random()*0.6,0.5+Math.random()*0.6,0.5+Math.random()*0.6);
      const m=new T.Mesh(geo,L.basicMat(col.getHex(),1,Math.random()<0.5));
      const rr=1.4+Math.random()*1.4,th=Math.random()*6.28,ph=Math.random()*3.14;
      m.position.set(Math.cos(th)*Math.sin(ph)*rr,Math.cos(ph)*rr,Math.sin(th)*Math.sin(ph)*rr);
      m.userData.spin=[Math.random()*0.04,Math.random()*0.04]; g.add(m); }
    g.add(new T.Mesh(new T.SphereGeometry(2.4,20,20), L.fresnelMat(new T.Color().setHSL(baseHue,0.9,0.6).getHex(),2.8,0.5)));
    a.group.add(g); a.artGroup=g;
    a.onUpdate=function(dt){ this.artGroup.rotation.y+=dt*0.4;
      this.artGroup.children.forEach(c=>{ if(c.userData.spin){c.rotation.x+=c.userData.spin[0];c.rotation.y+=c.userData.spin[1];} }); };
    a.state='fly'; a.vx=0.5; a.vy=0.4; a.homeX=a.x; a.homeY=a.y;
    L.burst(this.x+5,this.y,0,new T.Color().setHSL(baseHue,0.9,0.6).getHex(),60,0.5);
    L.beep(320,0.3,'sine',0.06); setTimeout(()=>L.beep(680,0.25,'triangle',0.05),140);
  }
  update(dt){ this.spin+=dt; if(this.pulse>0)this.pulse-=dt*1.5;
    this.rings.forEach((r,i)=>{ r.rotation.x=this.spin*(0.4+i*0.2); r.rotation.y=this.spin*(0.3+i*0.15);
      r.material.opacity=0.4+Math.sin(this.spin*2+i)*0.15+this.pulse*0.4; });
    this.heart.scale.setScalar(1+Math.sin(this.spin*3)*0.1+this.pulse*0.8);
    if(this.busy){ this.busy.t+=dt; if(this.busy.t>0.9){ this.emit(this.busy.seed);
      const s=this.busy.seed; s.snapHome(); this.busy=null; } } }
}

L.definePage({
  name:'What Generative AI Does', title:'It Makes New Things',
  build(L,idx){
    genCore=new GenCore(6,3);
    const h1=L.textSprite('Nothing here was drawn by a person.',30,L.COL.ink); h1.position.set(-2,11,0);
    const h2=L.textSprite('It was generated.  ·  Same seed, new result every time.',24,L.COL.dim); h2.position.set(-2,9.9,0);
    const h3=L.textSprite('drag a seed into the generator',22,L.COL.faint); h3.position.set(-11,-6.4,0);
    const h4=L.textSprite('Why it matters: every model in this course — text, image, or code — is this same idea at scale.',20,'#5fd8ff'); h4.position.set(-2,8.9,0);
    decor=[h1,h2,h3,h4]; decor.forEach(d=>L.scene.add(d)); this.decor=decor;
  },
  reset(L,p){ new Seed(-11,-2,SEEDS[0]); new Seed(-11,3,SEEDS[1]); new Seed(-11,8,SEEDS[2]);
    if(genCore) genCore.busy=null; },
  onDrop(L,o,w,page){ if(o instanceof Seed && genCore && genCore.over(w.x,w.y)){
    if(genCore.consume(o)){ o.state='processing'; return true; } } return false; },
  onFrame(L,dt,T){ if(genCore) genCore.update(dt); }
});
})();
