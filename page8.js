/* PAGE 8 — Gradient Descent */
(function(){
const L=window.LAB;
let terrainPts=[], balls=[], lrHandle=null, runBtn=null, spawnBtn=null, training=false, TX=0, TY=0;

function h(x,y){ return 0.0009*(x*x+y*y) + 34*Math.sin(x*0.012)*Math.cos(y*0.012); }
function grad(x,y){ const e=6; return [ (h(x+e,y)-h(x-e,y))/(2*e), (h(x,y+e)-h(x,y-e))/(2*e) ]; }

function buildTerrain(cx,cy){
  terrainPts=[]; const N=20, span=210;
  let lo=1e9,hi=-1e9; const raw=[];
  for(let i=0;i<N;i++)for(let j=0;j<N;j++){ const x=(i/(N-1)-0.5)*span*2, y=(j/(N-1)-0.5)*span*2;
    const v=h(x,y); raw.push(v); lo=Math.min(lo,v); hi=Math.max(hi,v); }
  let k=0;
  for(let i=0;i<N;i++)for(let j=0;j<N;j++){ const x=(i/(N-1)-0.5)*span*2, y=(j/(N-1)-0.5)*span*2;
    const v=(raw[k++]-lo)/(hi-lo);
    terrainPts.push({x:cx+x,y:cy+y,v});
  }
}
function valColor(v){ const hue=Math.round(130-v*130); return `hsl(${hue},80%,${38+v*18}%)`; }

class Ball extends L.Obj{
  constructor(pageIdx,x,y,color){ super(pageIdx,x,y,16); this.color=color; this.trail=[]; }
  onUpdate(dt){ this.trail.push({x:this.x,y:this.y}); if(this.trail.length>50) this.trail.shift(); }
  draw(ctx){ ctx.save();
    for(let i=0;i<this.trail.length;i++){ const t=this.trail[i]; ctx.globalAlpha=(i/this.trail.length)*0.5;
      ctx.fillStyle=this.color; ctx.beginPath(); ctx.arc(t.x,t.y,3,0,6.283); ctx.fill(); }
    ctx.restore();
    L.glowCircle(this.x,this.y,this.r,this.color,{fillA:0.95,glow:18});
  }
}
class Handle extends L.Obj{
  constructor(pageIdx,x,y){ super(pageIdx,x,y,20); this.trackY=y; }
  onUpdate(dt){ this.y+=(this.trackY-this.y)*0.3;
    const minX=TX-190, maxX=TX+190;
    const clampedX=Math.max(minX,Math.min(maxX,this.x));
    window.__lr = 0.5 + ((clampedX-minX)/(maxX-minX))*45;
  }
  draw(ctx){ const lr=window.__lr||8;
    const col = lr>34?L.COL.RD: lr>16?L.COL.AM:L.COL.OK;
    L.glowCircle(this.x,this.y,this.r,col,{fillA:0.95,glow:16});
    L.drawText('learning rate: '+(lr/10).toFixed(2), this.x, this.y-34, {size:15,color:col,weight:'700'}); }
}
class RunButton extends L.Obj{ constructor(pageIdx,x,y){ super(pageIdx,x,y,34); this.isFire=true; }
  draw(ctx){ L.glowCircle(this.x,this.y,this.r,L.COL.OK,{strokeOnly:true,glow:12}); L.drawText('RUN',this.x,this.y,{size:14,color:L.COL.OK,weight:'800'}); } }
class SpawnButton extends L.Obj{ constructor(pageIdx,x,y){ super(pageIdx,x,y,34); this.isSpawn=true; }
  draw(ctx){ L.glowCircle(this.x,this.y,this.r,L.COL.VI,{strokeOnly:true,glow:12}); L.drawText('+5',this.x,this.y,{size:16,color:'#c9b3ff',weight:'800'}); } }

L.definePage({
  name:'Learning From Mistakes', title:'Gradient Descent',
  build(L,idx){ const X=L.pageCenterX(idx); TX=X; TY=L.H*0.46;
    buildTerrain(TX,TY);
    this.caption=L.pageCaption(
      'The network doesn\'t know the answer — it rolls downhill toward one, one step at a time.',
      'drag the ball anywhere · press RUN · drag the green handle to change the learning rate',
      'too high a learning rate overshoots the bowl, too low crawls forever — this IS the tuning problem.');
  },
  reset(L,idx){ const X=L.pageCenterX(idx);
    for(const b of balls) b.dispose(); balls=[]; training=false;
    balls.push(new Ball(idx, TX-100, TY-80, L.COL.CY));
    window.__lr=8;
    lrHandle=new Handle(idx, TX-190+((8-0.5)/45)*380, L.H-140);
    runBtn=new RunButton(idx, TX-260, L.H-140);
    spawnBtn=new SpawnButton(idx, TX+260, L.H-140);
  },
  onDrop(L,o,w,idx){
    if(o.isFire){ training=!training; L.beep(training?600:300,0.12,'triangle',0.05); o.snapHome(); return true; }
    if(o.isSpawn){ for(let i=0;i<5;i++){ const bx=TX+(Math.random()-0.5)*380, by=TY+(Math.random()-0.5)*260;
      const col=`hsl(${Math.random()*360},80%,62%)`; balls.push(new Ball(idx,bx,by,col)); }
      L.burst(o.x,o.y,L.COL.VI,26,3); o.snapHome(); return true; }
    if(o instanceof Ball){ o.snapHome(); return true; }
    return false;
  },
  onFrame(L,dt,T){
    if(training){ const lr=(window.__lr||8)/10;
      for(const b of balls){ if(b.state==='grab') continue;
        const [gx,gy]=grad(b.x-TX,b.y-TY); b.vx += -gx*lr*0.9; b.vy += -gy*lr*0.9; b.state='fly'; } }
  },
  draw(L,ctx,dt,T){
    for(const p of terrainPts) ctx.fillStyle=valColor(p.v), ctx.fillRect(p.x-6,p.y-6,11,11);
    L.drawText('learning rate track', TX, L.H-176, {size:14,color:L.COL.dim,weight:'500'});
    L.glowLine(TX-190,L.H-140,TX+190,L.H-140,'#2f6f7f',{width:2,glow:0,alpha:0.6});
  }
});
})();
