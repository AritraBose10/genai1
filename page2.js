/* PAGE 2 — CONTRAST: Discriminative vs Generative */
(function(){
const L=window.LAB, T=L.THREE, ROOM=L.ROOM;
let machines=[];

function tokenShape(kind,color){ const grp=new T.Group();
  if(kind===0) grp.add(L.lineLoop(L.circlePts(1.3),color));
  if(kind===1) grp.add(L.lineLoop([new T.Vector3(0,1.4,0),new T.Vector3(1.25,-0.8,0),new T.Vector3(-1.25,-0.8,0),new T.Vector3(0,1.4,0)],color));
  if(kind===2) grp.add(L.lineLoop([new T.Vector3(-1.1,-1.1,0),new T.Vector3(1.1,-1.1,0),new T.Vector3(1.1,1.1,0),new T.Vector3(-1.1,1.1,0),new T.Vector3(-1.1,-1.1,0)],color));
  return grp; }

class Token extends L.Obj{
  constructor(x,y,kind){ super(1,x,y,2.6); this.kind=kind; this.made=null;
    this.panel=new T.Mesh(new T.PlaneGeometry(4.8,4.8), L.holoPanelMat(0x46f0ff));
    const f=2.4; this.frame=L.lineLoop([new T.Vector3(-f,-f,0),new T.Vector3(f,-f,0),new T.Vector3(f,f,0),new T.Vector3(-f,f,0),new T.Vector3(-f,-f,0)],0x8fe9ff);
    this.icon=tokenShape(kind,0x9feaff); this.icon.scale.setScalar(0.8);
    this.group.add(this.panel,this.frame,this.icon); this._mat=0; this.group.scale.setScalar(0.01); L.burst(x,y,0,0x46f0ff,20,0.22);
  }
  onUpdate(dt){ if(this._mat!==undefined&&this._mat<1){ this._mat+=dt*2.4; const s=Math.min(1,this._mat);
    this.group.scale.setScalar((1-Math.pow(1-s,3))*this.squash); if(s>=1)this._mat=undefined; }
    if(this.rejectT>0) this.frame.material.color.set(L.C.RD);
    this.group.rotation.y=Math.sin(this.spin*0.5)*0.08; }
}

class Machine{
  constructor(x,y,type){ this.x=x+ROOM; this.y=y; this.type=type; this.busy=null; this.t=0; this.flash=0;
    const color=type==='A'?0x46f0ff:0x9d6bff; this.color=color;
    this.g=new T.Group(); this.g.position.set(this.x,this.y,0); L.scene.add(this.g);
    const box=new T.BoxGeometry(12,10,6);
    this.edges=new T.LineSegments(new T.EdgesGeometry(box), L.lineMat(color,0.9));
    this.g.add(this.edges, new T.Mesh(box, new T.MeshBasicMaterial({color,transparent:true,opacity:0.045,blending:T.AdditiveBlending,depthWrite:false})));
    if(type==='A'){ this.pts=new T.Group();
      for(let i=0;i<14;i++){ const left=i<7,px=(left?-1:1)*(0.6+Math.random()*3),py=(Math.random()-0.5)*5.4;
        const d=new T.Mesh(new T.SphereGeometry(0.22,10,10),L.basicMat(left?0x46f0ff:0xff9f4d)); d.position.set(px,py,0.2); this.pts.add(d); }
      this.boundary=new T.Mesh(new T.PlaneGeometry(0.08,8),new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.8,blending:T.AdditiveBlending})); this.boundary.position.z=0.25;
      this.g.add(this.pts,this.boundary);
    } else { this.cluster=new T.Group();
      for(let i=0;i<12;i++){ const a=Math.random()*6.28,rr=Math.random()*2.4;
        const d=new T.Mesh(new T.SphereGeometry(0.24,10,10),L.basicMat(0x9d6bff)); d.position.set(Math.cos(a)*rr,Math.sin(a)*rr+0.3,0.2); this.cluster.add(d); }
      this.g.add(this.cluster); }
    const l1=L.textSprite(type==='A'?'DISCRIMINATIVE':'GENERATIVE',44,type==='A'?'#8fe9ff':'#c9b3ff'); l1.position.set(0,6.6,0);
    const l2=L.textSprite(type==='A'?'learns the border between things':'learns what things are made of — then makes more',24,'#6d90a3'); l2.position.set(0,5.4,0);
    const l3=L.textSprite(type==='A'?'asks:  which side?':'asks:  what does one look like?',24,type==='A'?'#5fd8ff':'#c79bff'); l3.position.set(0,-6.3,0);
    this.g.add(l1,l2,l3);
  }
  over(wx,wy){ return Math.abs(wx-this.x)<6.2 && Math.abs(wy-this.y)<5.4; }
  accept(tok){ if(this.busy){tok.reject();return;} this.busy={tok,t:0,ate:false}; tok.state='processing'; tok.vx=tok.vy=0; tok.homeX=tok.x; tok.homeY=tok.y;
    L.beep(this.type==='A'?700:240,.12,this.type==='A'?'square':'sine',.05); }
  update(dt){ this.t+=dt; if(this.flash>0)this.flash-=dt*2;
    this.edges.material.opacity=0.55+Math.sin(this.t*2)*0.08+this.flash*0.4;
    if(this.boundary) this.boundary.material.opacity=0.6+Math.sin(this.t*3)*0.2;
    if(this.cluster) this.cluster.rotation.z=Math.sin(this.t*0.4)*0.1;
    if(!this.busy) return; const b=this.busy; b.t+=dt; const tok=b.tok;
    tok.x+=(this.x-tok.x)*0.15; tok.y+=(this.y-tok.y)*0.15;
    if(this.type==='A'){ if(b.t>1.0){ const side=tok.kind===2?'CLASS B':'CLASS A';
      const st=L.textSprite('→ '+side,34,side==='CLASS B'?'#ff9f4d':'#5fd8ff'); st.position.set(0,-1.7,0.1); tok.group.add(st);
      tok.frame.material.color.set(side==='CLASS B'?L.C.AM:L.C.CY); tok.state='fly'; tok.vx=0.5; tok.vy=0.3;
      this.flash=1; L.burst(this.x+6,this.y,0,0x46f0ff,22,0.3); L.beep(1040,.12,'triangle',.06); this.busy=null; } }
    else { if(b.t<0.6) tok.squash=Math.max(0.06,1-b.t/0.6);
      if(b.t>=0.6&&!b.ate){ b.ate=true; tok.group.visible=false; L.burst(this.x,this.y,0,0x9d6bff,40,0.28); }
      if(b.t>1.6){ tok.dispose(); const nt=new Token(this.x+9.5,this.y+1.5,b.tok.kind); nt.homeX=nt.x; nt.homeY=nt.y; nt.made=true;
        setTimeout(()=>{ nt.frame.material.color.set(L.C.MG); nt.panel.material.uniforms.c.value.set(L.C.MG);
          const tag=L.textSprite('NEW SAMPLE',22,'#ff9fe0'); tag.position.set(0,-1.7,0.1); nt.group.add(tag);
          if(nt.icon.children[0]) nt.icon.children[0].material.color.set(L.C.MG); },30);
        nt.state='fly'; nt.vx=0.5; nt.vy=0.35; L.burst(this.x+7,this.y,0,0xff5fd0,54,0.42);
        L.beep(300,.3,'sine',.06); setTimeout(()=>L.beep(600,.2,'sine',.05),120); this.flash=1; this.busy=null; } }
  }
}

L.definePage({
  name:'Discriminative vs Generative', title:'Two Ways to Learn',
  build(L,idx){ machines=[new Machine(-13,1.2,'A'), new Machine(13,1.2,'B')];
    const h1=L.textSprite('Same data. Two completely different jobs.',26,L.COL.ink); h1.position.set(ROOM,13,0);
    const h2=L.textSprite('Why it matters: almost every model you use is one of these two — knowing which is which tells you what it can and can\'t do.',18,'#5fd8ff'); h2.position.set(ROOM,-11.5,0);
    this.decor=[h1,h2]; this.decor.forEach(d=>L.scene.add(d));
  },
  reset(L,p){ for(let i=0;i<3;i++){ const t=new Token(ROOM+(i-1)*7.2,-8.8,i); t.homeX=t.x; t.homeY=t.y; }
    for(const m of machines) m.busy=null; },
  onDrop(L,o,w,page){ if(o instanceof Token){ for(const m of machines){ if(m.over(w.x,w.y)){
    if(o.made&&m.type==='B') o.reject(); else m.accept(o); return true; } } } return false; },
  onFrame(L,dt,T){ for(const m of machines) m.update(dt); }
});
})();
