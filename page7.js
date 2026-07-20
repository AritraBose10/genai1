/* PAGE 7 — Neural Networks: neurons → layers → forward pass */
(function(){
const L=window.LAB, T=L.THREE, ROOM=L.ROOM, X=7*ROOM;
let net=null, decor=[];

class Network{
  constructor(x,y){ this.x=x; this.y=y; this.g=new T.Group(); this.g.position.set(x,y,0); L.scene.add(this.g);
    this.layers=[3,4,4,2]; this.nodes=[]; this.edges=[]; this.pulseT=-1;
    const spanX=22, spanY=12;
    this.layers.forEach((count,li)=>{ const col=[]; const lx=-spanX/2 + li*(spanX/(this.layers.length-1));
      for(let n=0;n<count;n++){ const ny=(n-(count-1)/2)*(spanY/Math.max(count, 2));
        const mesh=new T.Mesh(new T.SphereGeometry(0.7,18,18), L.fresnelMat(li===0?0x46f0ff:li===this.layers.length-1?0xff5fd0:0x9d6bff,2.2,0.85));
        const coreN=new T.Mesh(new T.SphereGeometry(0.4,12,12), L.basicMat(0xffffff,0.2));
        const ng=new T.Group(); ng.position.set(lx,ny,0); ng.add(mesh,coreN); this.g.add(ng);
        col.push({ng,coreN,lx,ny,li}); }
      this.nodes.push(col); });
    // fully connect
    for(let li=0;li<this.layers.length-1;li++){ this.nodes[li].forEach(a=>{ this.nodes[li+1].forEach(b=>{
      const geo=new T.BufferGeometry().setFromPoints([new T.Vector3(a.lx,a.ny,0),new T.Vector3(b.lx,b.ny,0)]);
      const line=new T.Line(geo, L.lineMat(0x4a7a8a, 0.25)); this.g.add(line);
      this.edges.push({line, a, b, li}); }); }); }
    const l1=L.textSprite('A NEURAL NETWORK',30,'#c9b3ff'); l1.position.set(0,8.2,0);
    const l2=L.textSprite('many neurons in layers. signal flows left → right: the forward pass.',22,'#6d90a3'); l2.position.set(0,7.2,0);
    this.g.add(l1,l2);
    // fire button
    this.fireBtn=new L.Obj(7, x, y-9, 1.7); this.fireBtn.isFire=true;
    this.fireBtn.group.add(L.lineLoop(L.circlePts(1.5),0x3dffb0)); const t=L.textSprite('RUN FORWARD PASS',20,'#3dffb0'); t.position.set(0,-2.2,0.1); this.fireBtn.group.add(t);
  }
  forward(){ this.pulseT=0; L.beep(300,0.1,'sine',0.05); }
  update(dt,T){
    this.nodes.forEach(col=>col.forEach(nd=>{ nd.ng.rotation.y+=dt*0.3; }));
    if(this.pulseT>=0){ this.pulseT+=dt*1.4;
      // light nodes layer by layer
      this.nodes.forEach((col,li)=>{ const on=this.pulseT>li*0.8 && this.pulseT<li*0.8+1.2;
        col.forEach(nd=>{ nd.coreN.material.opacity = on?0.95:0.2;
          if(on && Math.random()<0.05) L.beep(400+li*100,0.05,'sine',0.02); }); });
      // light edges of the active hop
      this.edges.forEach(e=>{ const on=this.pulseT>e.li*0.8 && this.pulseT<e.li*0.8+1.0;
        e.line.material.opacity = on?0.9:0.25; e.line.material.color.set(on?0x9feaff:0x4a7a8a); });
      if(this.pulseT>this.layers.length*0.8+1.4){ this.pulseT=-1;
        this.nodes[this.layers.length-1].forEach(nd=>L.burst(this.x+nd.lx,this.y+nd.ny,0,0xff5fd0,20,0.3)); }
    }
  }
}

L.definePage({
  name:'Neurons Become a Network', title:'The Forward Pass',
  build(L,idx){ net=new Network(X,0.5);
    const h=L.textSprite('press RUN and watch the signal ripple through the layers',20,L.COL.faint); h.position.set(X,-11.4,0);
    const h2=L.textSprite('Why it matters: this left-to-right ripple is the same "forward pass" that happens inside every model you\'ll use this semester.',18,'#5fd8ff'); h2.position.set(X,-13.0,0);
    decor=[h,h2]; decor.forEach(d=>L.scene.add(d)); this.decor=decor;
  },
  reset(L,p){ if(net) net.pulseT=-1; },
  onDrop(L,o,w,page){ if(o.isFire){ net.forward(); o.snapHome(); return true; } return false; },
  onFrame(L,dt,T){ if(net) net.update(dt,T); }
});
})();
