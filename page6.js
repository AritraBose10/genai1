/* PAGE 6 — The Neuron: inputs → weighted sum → threshold → fire */
(function(){
const L=window.LAB, T=L.THREE, ROOM=L.ROOM, X=6*ROOM;
let neuron=null, decor=[], inputs=[];

class InputOrb extends L.Obj{
  constructor(x,y,idx){ super(6,x,y,1.4); this.idx=idx; this.value=Math.round(Math.random());
    this.body=new T.Mesh(new T.SphereGeometry(1,20,20), L.fresnelMat(0x46f0ff,2.4,0.9));
    this.coreMesh=new T.Mesh(new T.SphereGeometry(0.6,16,16), L.basicMat(0x46f0ff, this.value?0.9:0.2));
    this.lbl=L.textSprite(this.value.toString(),26,'#c9f7ff'); this.lbl.position.set(0,0,1.1);
    this.group.add(this.body,this.coreMesh,this.lbl);
  }
  toggle(){ this.value=this.value?0:1; this.coreMesh.material.opacity=this.value?0.9:0.2;
    this.setLbl(); L.beep(this.value?720:300,0.06,'sine',0.04); }
  setLbl(){ this.group.remove(this.lbl); this.lbl=L.textSprite(this.value.toString(),26,'#c9f7ff'); this.lbl.position.set(0,0,1.1); this.group.add(this.lbl); }
}

class Neuron{
  constructor(x,y){ this.x=x; this.y=y; this.g=new T.Group(); this.g.position.set(x,y,0); L.scene.add(this.g);
    this.weights=[0.6,0.6,0.6]; this.threshold=1.0; this.charge=0; this.fireT=-1;
    // cell body (tank)
    this.body=new T.Mesh(new T.SphereGeometry(2.6,32,32), L.fresnelMat(0x9d6bff,2.2,0.8)); this.g.add(this.body);
    this.fill=new T.Mesh(new T.SphereGeometry(2.4,24,24), new T.MeshBasicMaterial({color:0x9d6bff,transparent:true,opacity:0.15,blending:T.AdditiveBlending,depthWrite:false})); this.g.add(this.fill);
    // axon
    this.axon=new T.Mesh(new T.CylinderGeometry(0.25,0.25,6,12), L.basicMat(0x9d6bff,0.5)); this.axon.rotation.z=Math.PI/2; this.axon.position.x=5; this.g.add(this.axon);
    // threshold ring
    this.thRing=new T.Mesh(new T.TorusGeometry(2.7,0.05,8,48), L.basicMat(0xffffff,0.7)); this.g.add(this.thRing);
    const l1=L.textSprite('THE NEURON',30,'#c9b3ff'); l1.position.set(0,5.4,0);
    const l2=L.textSprite('inputs × weights, summed. cross the threshold → it fires.',22,'#6d90a3'); l2.position.set(0,4.4,0);
    this.sumLbl=L.textSprite('sum 0.0 / 1.0',24,'#8fe9ff'); this.sumLbl.position.set(0,-4.6,0);
    this.g.add(l1,l2,this.sumLbl);
    // fire button
    this.fireBtn=new L.Obj(6, x+0.001, y-7.2, 1.6); this.fireBtn.pinned=false; this.fireBtn.isFire=true;
    const ring=L.lineLoop(L.circlePts(1.4),0x3dffb0); const t=L.textSprite('FIRE',22,'#3dffb0'); t.position.set(0,0,0.1);
    this.fireBtn.group.add(ring,t);
  }
  wire(inputs){ this.inputs=inputs; }
  compute(){ let s=0; this.inputs.forEach((inp,i)=>{ s+=inp.value*this.weights[i]; }); return s; }
  fire(){ const s=this.compute();
    this.g.remove(this.sumLbl); this.sumLbl=L.textSprite('sum '+s.toFixed(2)+' / '+this.threshold.toFixed(1),24, s>=this.threshold?'#3dffb0':'#ff9f4d'); this.sumLbl.position.set(0,-4.6,0); this.g.add(this.sumLbl);
    this.fill.material.opacity=Math.min(0.8, 0.15+s*0.4);
    if(s>=this.threshold){ this.fireT=0; L.burst(this.x+8,this.y,0,0x3dffb0,40,0.5); L.beep(140,0.25,'sine',0.08); setTimeout(()=>L.beep(90,0.3,'sine',0.06),40); }
    else { L.beep(160,0.2,'sawtooth',0.04); }
  }
  update(dt,T){ this.body.rotation.y+=dt*0.2; this.thRing.rotation.x=T*0.5;
    if(this.fireT>=0){ this.fireT+=dt*2; this.axon.material.opacity=0.5+Math.max(0,1-this.fireT)*0.5;
      if(this.fireT>1.2){ this.fireT=-1; this.axon.material.opacity=0.5; } } }
}

L.definePage({
  name:'One Cell of the Machine', title:'How a Neuron Fires',
  build(L,idx){ neuron=new Neuron(X,0.5);
    const h=L.textSprite('tap an input to flip it 0/1 · press FIRE · watch if the sum crosses the line',20,L.COL.faint); h.position.set(X,-11.4,0);
    const h2=L.textSprite('Why it matters: every network — however huge — is millions of this exact same tiny decision, wired together.',18,'#5fd8ff'); h2.position.set(X,-13.0,0);
    decor=[h,h2]; decor.forEach(d=>L.scene.add(d)); this.decor=decor;
  },
  reset(L,p){ inputs=[]; for(let i=0;i<3;i++){ const o=new InputOrb(X-9, 4-i*4, i); o.homeX=o.x; o.homeY=o.y; inputs.push(o); }
    neuron.wire(inputs); neuron.fireT=-1; },
  onDrop(L,o,w,page){
    if(o.isFire){ neuron.fire(); o.snapHome(); return true; }
    if(o instanceof InputOrb){ // if barely moved, treat as a tap-toggle
      if(Math.hypot(o.x-o.homeX,o.y-o.homeY)<1.2){ o.toggle(); o.snapHome(); return true; }
      o.snapHome(); return true; }
    return false;
  },
  onFrame(L,dt,T){ if(neuron) neuron.update(dt,T);
    // live sum preview
    if(neuron && neuron.inputs){ const s=neuron.compute();
      neuron.fill.material.opacity=0.15+Math.min(0.6, s*0.35); } }
});
})();
