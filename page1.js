/* PAGE 1 — "It Makes New Things": seeds + generator */
(function(){
const L=window.LAB;
let seeds=[], core=null, artifacts=[];

const SEEDS=[{name:'SHAPE',color:L.COL.CY,hue:190},{name:'MOTION',color:L.COL.VI,hue:265},{name:'COLOR',color:L.COL.MG,hue:320}];

class Seed extends L.Obj{
  constructor(pageIdx,x,y,seed){ super(pageIdx,x,y,34); this.seed=seed; }
  draw(ctx){
    L.glowCircle(this.x,this.y,this.r*this.squash,this.seed.color,{fillA:0.18,glow:22});
    L.glowCircle(this.x,this.y,this.r*0.55*this.squash,this.seed.color,{fillA:0.9,glow:14});
    L.drawText(this.seed.name, this.x, this.y+this.r+22, {size:15,color:L.COL.ink,weight:'700'});
  }
}
class Artifact extends L.Obj{
  constructor(pageIdx,x,y,hue){ super(pageIdx,x,y,40); this.hue=hue;
    this.shapes=[]; const n=5+Math.floor(Math.random()*5);
    for(let i=0;i<n;i++) this.shapes.push({ang:Math.random()*6.283, dist:14+Math.random()*22,
      size:6+Math.random()*10, kind:Math.floor(Math.random()*3), spin:(Math.random()-0.5)*0.05});
  }
  draw(ctx){
    const col=`hsl(${this.hue},85%,62%)`;
    ctx.save(); ctx.translate(this.x,this.y);
    L.glowCircle(0,0,this.r*this.squash,col,{fillA:0.10,glow:20});
    this.shapes.forEach(s=>{ s.ang+=s.spin;
      const sx=Math.cos(s.ang)*s.dist, sy=Math.sin(s.ang)*s.dist;
      ctx.save(); ctx.translate(sx,sy); ctx.shadowColor=col; ctx.shadowBlur=10;
      ctx.fillStyle=col; ctx.strokeStyle=col; ctx.lineWidth=1.5;
      if(s.kind===0){ ctx.beginPath(); ctx.arc(0,0,s.size*0.5,0,6.283); ctx.fill(); }
      else if(s.kind===1){ ctx.beginPath(); ctx.moveTo(0,-s.size*0.6); ctx.lineTo(s.size*0.55,s.size*0.4);
        ctx.lineTo(-s.size*0.55,s.size*0.4); ctx.closePath(); ctx.stroke(); }
      else { ctx.strokeRect(-s.size*0.4,-s.size*0.4,s.size*0.8,s.size*0.8); }
      ctx.restore(); });
    ctx.restore();
  }
}
class Core{
  constructor(pageIdx,x,y){ this.x=x; this.y=y; this.busy=null; this.t=0; this.pulse=0; }
  over(wx,wy){ return Math.hypot(wx-this.x,wy-this.y)<58; }
  consume(seed){ if(this.busy) return false; this.busy={seed,t:0}; this.pulse=1;
    L.burst(this.x,this.y,seed.seed.color,26,3.2); L.beep(200,0.25,'sine',0.06); return true; }
  emit(seedObj, pageIdx){
    const a=new Artifact(pageIdx, this.x+130, this.y+(Math.random()-0.5)*40, seedObj.seed.hue+(Math.random()-0.5)*40);
    a.homeX=a.x; a.homeY=a.y; a.state='fly'; a.vx=3; a.vy=(Math.random()-0.5)*2;
    L.burst(this.x+70,this.y,`hsl(${seedObj.seed.hue},85%,62%)`,44,4);
    L.beep(320,0.3,'sine',0.06); setTimeout(()=>L.beep(680,0.25,'triangle',0.05),140);
  }
  update(dt,pageIdx){ this.t+=dt; if(this.pulse>0) this.pulse-=dt*1.5;
    if(this.busy){ this.busy.t+=dt; if(this.busy.t>0.85){ this.emit(this.busy.seed,pageIdx);
      this.busy.seed.snapHome(); this.busy=null; } } }
  draw(ctx){
    for(let i=0;i<3;i++){ const rr=58+i*16;
      L.glowCircle(this.x,this.y,rr,'#8fe9ff',{strokeOnly:true,glow:10+this.pulse*20});
    }
    const dzAlpha=0.35+Math.sin(this.t*2.4)*0.15;
    ctx.save(); ctx.strokeStyle=L.hexA('#8fe9ff',dzAlpha); ctx.lineWidth=2; ctx.setLineDash([6,8]);
    ctx.beginPath(); ctx.arc(this.x,this.y,74,0,6.283); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
    L.glowCircle(this.x,this.y,20*(1+this.pulse*0.6),'#ffffff',{fillA:0.9,glow:18});
    L.drawText('GENERATOR', this.x, this.y+100, {size:16,color:'#8fe9ff',weight:'700'});
    L.drawText('drop a seed here', this.x, this.y+124, {size:14,color:'#8fe9ff',weight:'500'});
  }
}

L.definePage({
  name:'What Generative AI Does', title:'It Makes New Things',
  build(L,idx){
    const X=L.pageCenterX(idx);
    core=new Core(idx, X+140, L.H*0.44);
    this.caption=L.pageCaption(
      'Nothing on this screen was drawn by a person — it was generated.',
      'STEP 1: grab a seed on the left.  STEP 2: drop it in the ring.  STEP 3: watch it create something new.',
      'every model you\'ll use this course — text, image, or code — is this same idea, just much bigger.');
  },
  reset(L,idx){ const X=L.pageCenterX(idx);
    seeds=[ new Seed(idx,X-260,L.H*0.32,SEEDS[0]), new Seed(idx,X-260,L.H*0.5,SEEDS[1]), new Seed(idx,X-260,L.H*0.68,SEEDS[2]) ];
  },
  onDrop(L,o,w,idx){ if(o instanceof Seed && core.over(w.x,w.y)){ if(core.consume(o)){ o.state='processing'; return true; } } return false; },
  onFrame(L,dt,T){ if(core) core.update(dt, 0); },
  draw(L,ctx,dt,T){ if(core) core.draw(ctx); }
});
})();
