/* PAGE 8 — Learning From Mistakes: loss landscape + gradient descent */
(function(){
const L=window.LAB, T=L.THREE, ROOM=L.ROOM, X=8*ROOM;
let terrain=null, balls=[], lr={x:0, min:-6,max:6, val:0.35}, lrHandle=null, runBtn=null, training=false, decor=[];

/* the loss function we descend — has a broad bowl + a couple of local wrinkles */
function h(x,y){ return 0.045*(x*x+y*y) + 0.9*Math.sin(x*0.55)*Math.cos(y*0.55); }
function grad(x,y){ const e=0.4;
  return [ (h(x+e,y)-h(x-e,y))/(2*e), (h(x,y+e)-h(x,y-e))/(2*e) ]; }

class Terrain{
  constructor(cx,cy){ this.cx=cx; this.cy=cy;
    const N=22, span=11; const pos=[], col=[];
    let lo=1e9, hi=-1e9;
    const hs=[];
    for(let i=0;i<N;i++)for(let j=0;j<N;j++){ const x=(i/(N-1)-0.5)*span*2, y=(j/(N-1)-0.5)*span*2;
      const v=h(x,y); hs.push(v); lo=Math.min(lo,v); hi=Math.max(hi,v); }
    let k=0;
    for(let i=0;i<N;i++)for(let j=0;j<N;j++){ const x=(i/(N-1)-0.5)*span*2, y=(j/(N-1)-0.5)*span*2;
      pos.push(cx+x, cy+y, 0);
      const v=(hs[k++]-lo)/(hi-lo);           // 0 = low loss(good), 1 = high loss
      const c=new T.Color().setHSL(0.42-v*0.42, 0.85, 0.35+v*0.25); // green (low) -> violet/red (high)
      col.push(c.r,c.g,c.b);
    }
    const geo=new T.BufferGeometry();
    geo.setAttribute('position', new T.BufferAttribute(new Float32Array(pos),3));
    geo.setAttribute('color', new T.BufferAttribute(new Float32Array(col),3));
    this.pts=new T.Points(geo, new T.PointsMaterial({ size:0.55, vertexColors:true, transparent:true,
      opacity:0.85, blending:T.AdditiveBlending, depthWrite:false }));
    L.scene.add(this.pts);
  }
  colorAt(x,y){ return h(x-this.cx,y-this.cy); }
}

class Ball extends L.Obj{
  constructor(x,y,color){ super(8,x,y,1.3); this.color=color;
    this.body=new T.Mesh(new T.SphereGeometry(1,20,20), L.fresnelMat(color,2.4,0.95));
    this.core=new T.Mesh(new T.SphereGeometry(0.55,14,14), L.basicMat(0xffffff,0.9));
    this.group.add(this.body,this.core);
    // trail buffer
    this.trailN=50; this.trailBuf=new Float32Array(this.trailN*3);
    for(let i=0;i<this.trailN;i++){ this.trailBuf[i*3]=x; this.trailBuf[i*3+1]=y; this.trailBuf[i*3+2]=0.1; }
    this.trailGeo=new T.BufferGeometry(); this.trailGeo.setAttribute('position', new T.BufferAttribute(this.trailBuf,3));
    this.trailPts=new T.Points(this.trailGeo, new T.PointsMaterial({ color, size:0.22, transparent:true,
      opacity:0.55, blending:T.AdditiveBlending, depthWrite:false }));
    L.scene.add(this.trailPts); this._ti=0;
  }
  pushTrail(){ this._ti=(this._ti+1)%this.trailN;
    this.trailBuf[this._ti*3]=this.x; this.trailBuf[this._ti*3+1]=this.y; this.trailGeo.attributes.position.needsUpdate=true; }
  onUpdate(dt){ this.body.rotation.z += (this.vx)*0.15; this.body.rotation.x += (-this.vy)*0.15;
    this.trailPts.material.opacity=0.55; }
  dispose(){ L.scene.remove(this.trailPts); this.trailGeo.dispose(); super.dispose(); }
}

class Handle extends L.Obj{           // learning-rate slider handle — constrained to a horizontal track
  constructor(x,y){ super(8,x,y,1.3); this.trackY=y;
    this.body=new T.Mesh(new T.SphereGeometry(0.9,16,16), L.fresnelMat(0x3dffb0,2.4,0.9));
    this.group.add(this.body);
  }
  onUpdate(dt){ this.y += (this.trackY-this.y)*0.3;         // snap to track vertically
    lr.val = 0.06 + ( (Math.max(lr.min,Math.min(lr.max,this.x - (X)))-lr.min)/(lr.max-lr.min) )*2.2;
    this.body.material.uniforms.c.value.set(lr.val>1.4?0xff5f6b:lr.val>0.6?0xffb35f:0x3dffb0);
  }
}

L.definePage({
  name:'Learning From Mistakes', title:'Gradient Descent',
  build(L,idx){
    terrain=new Terrain(X,1);
    const h1=L.textSprite('The network doesn\'t know the answer — it rolls downhill toward one.',26,L.COL.ink); h1.position.set(X,13,0);
    const h2=L.textSprite('drag the ball anywhere · press RUN · drag the green handle to change learning rate',20,L.COL.faint); h2.position.set(X,-11.4,0);
    const h3=L.textSprite('too high a rate and it overshoots the bowl entirely — that IS the lesson',18,'#ff9f6b'); h3.position.set(X,-13.0,0);
    const trackL=L.lineLoop([new T.Vector3(X-6,-9.4,0),new T.Vector3(X+6,-9.4,0),new T.Vector3(X+6,-9.4,0)],0x2f6f7f,0.6);
    const lrLbl=L.textSprite('learning rate',18,L.COL.faint); lrLbl.position.set(X,-8.5,0);
    this._lrLbl=lrLbl;
    decor=[h1,h2,h3,trackL,lrLbl]; decor.forEach(d=>L.scene.add(d)); this.decor=decor;

    runBtn=new L.Obj(8, X-9, 9, 1.7); runBtn.isFire=true;
    const ring=L.lineLoop(L.circlePts(1.5),0x3dffb0); const t=L.textSprite('RUN',24,'#3dffb0'); t.position.set(0,0,0.1);
    runBtn.group.add(ring,t);
    const spawnBtn=new L.Obj(8, X+9, 9, 1.7); spawnBtn.isSpawn=true;
    const ring2=L.lineLoop(L.circlePts(1.5),0x9d6bff); const t2=L.textSprite('+5 BALLS',20,'#c9b3ff'); t2.position.set(0,0,0.1);
    spawnBtn.group.add(ring2,t2);
    this._runBtn=runBtn; this._spawnBtn=spawnBtn;
  },
  reset(L,p){
    for(const b of balls) b.dispose(); balls=[];
    training=false;
    balls.push(new Ball(X-3,4,0x46f0ff));
    lrHandle=new Handle(X-6+((0.35-0.06)/2.2)*12, -9.4);
    if(runBtn){ runBtn.x=X-9; runBtn.y=9; runBtn.homeX=runBtn.x; runBtn.homeY=runBtn.y; }
    if(this._spawnBtn){ this._spawnBtn.x=X+9; this._spawnBtn.y=9; this._spawnBtn.homeX=X+9; this._spawnBtn.homeY=9; }
  },
  onDrop(L,o,w,page){
    if(o.isFire){ training=!training; L.beep(training?600:300,0.12,'triangle',0.05); o.snapHome(); return true; }
    if(o.isSpawn){ for(let i=0;i<5;i++){ const bx=X+(Math.random()-0.5)*10, by=(Math.random()-0.5)*8;
        const col=new T.Color().setHSL(Math.random(),0.8,0.6).getHex();
        balls.push(new Ball(bx,by,col)); }
      L.burst(o.x,o.y,0,0x9d6bff,30,0.35); o.snapHome(); return true; }
    if(o instanceof Ball){ o.snapHome(); return true; }   // manual placement — just let it settle where dropped
    return false;
  },
  onFrame(L,dt,T){
    if(training){
      for(const b of balls){
        if(b.state==='grab') continue;
        const [gx,gy]=grad(b.x-X, b.y-1);
        b.vx += -gx*lr.val*0.8; b.vy += -gy*lr.val*0.8;
        b.state='fly';
      }
    }
    for(const b of balls) b.pushTrail();
  }
});
})();
