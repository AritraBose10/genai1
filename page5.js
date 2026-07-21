/* PAGE 5 — What Deep Learning "Sees": layer stack */
(function(){
const L=window.LAB;
let building=null;

const FLOORS=[
  {name:'FLOOR 1 · EDGES', desc:'finds simple lines and edges', color:L.COL.CY},
  {name:'FLOOR 2 · TEXTURES', desc:'groups edges into textures & patterns', color:'#5fd8ff'},
  {name:'FLOOR 3 · PARTS', desc:'assembles textures into parts — an ear, an eye', color:L.COL.VI},
  {name:'FLOOR 4 · OBJECT', desc:'combines the parts into one whole guess', color:L.COL.MG},
];

class Building{
  constructor(x,y){ this.x=x; this.y=y; this.pulseT=-1; this.pulseColor=L.COL.CY;
    this.verdict='drop something below to see a guess'; this.verdictCol='#ff9fe0'; }
  floorY(i){ return this.y+150-i*100; }
  over(wx,wy){ return Math.abs(wx-this.x)<190 && wy>this.floorY(0)-260 && wy<this.floorY(0)+40; }
  feed(kind){ this.pulseT=0; this.pulseColor = kind==='noise'?L.COL.RD:L.COL.CY;
    FLOORS.forEach((f,i)=>setTimeout(()=>{ L.burst(this.x, this.floorY(i), f.color, 24, 3); L.beep(400+i*120,0.08,'sine',0.04); }, i*240));
    setTimeout(()=>{ this.verdict = kind==='cat'?'guess: CAT ✓' : kind==='car'?'guess: CAR ✓' : 'guess: ??? — noise in, noise out';
      this.verdictCol = kind==='noise'?L.COL.AM:L.COL.OK;
      L.beep(kind==='noise'?140:900, kind==='noise'?0.3:0.15, kind==='noise'?'sawtooth':'triangle', 0.06);
    }, FLOORS.length*240+150);
  }
  update(dt){ if(this.pulseT>=0){ this.pulseT+=dt*0.8; if(this.pulseT>=1) this.pulseT=-1; } }
  draw(ctx){
    FLOORS.forEach((f,i)=>{ const fy=this.floorY(i);
      L.panel(this.x,fy,380,72,f.color,{fillA:0.07,glow:10,r:14});
      L.drawText(f.name, this.x-160, fy-10, {size:16,color:'#e9fbff',align:'left',weight:'800'});
      L.drawText(f.desc, this.x-160, fy+14, {size:13,color:L.COL.dim,align:'left',weight:'500'});
    });
    L.drawText(this.verdict, this.x+160, this.floorY(3)-10, {size:15,color:this.verdictCol,align:'right',weight:'800'});
    if(this.pulseT>=0){ const span=FLOORS.length-1, idxF=this.pulseT*span, i0=Math.floor(idxF), i1=Math.min(span,i0+1), f=idxF-i0;
      const y0=this.floorY(i0), y1=this.floorY(i1), py=y0+(y1-y0)*f;
      L.glowCircle(this.x-190, py, 9, this.pulseColor, {fillA:0.95,glow:18}); }
  }
}

class Feeder extends L.Obj{
  constructor(pageIdx,x,y,kind){ super(pageIdx,x,y,40); this.kind=kind; }
  draw(ctx){ const col = this.kind==='noise'?L.COL.RD:'#8fe9ff';
    L.panel(this.x,this.y,84,84,col,{fillA:0.08,glow:8});
    ctx.save(); ctx.translate(this.x,this.y); ctx.strokeStyle='#9feaff'; ctx.lineWidth=2; ctx.shadowColor='#9feaff'; ctx.shadowBlur=8;
    if(this.kind==='cat'){ ctx.beginPath(); ctx.arc(0,4,18,0,6.283); ctx.stroke(); }
    else if(this.kind==='car'){ ctx.beginPath(); ctx.moveTo(-20,10); ctx.lineTo(20,10); ctx.lineTo(14,-8); ctx.lineTo(-14,-8); ctx.closePath(); ctx.stroke(); }
    else { ctx.strokeStyle=L.COL.RD; for(let i=0;i<10;i++){ ctx.beginPath(); ctx.arc((Math.random()-0.5)*30,(Math.random()-0.5)*30,1.6,0,6.283); ctx.stroke(); } }
    ctx.restore();
    L.drawText(this.kind.toUpperCase(), this.x, this.y+34, {size:13,color:L.COL.ink,weight:'700'}); }
}

L.definePage({
  name:'What The Layers See', title:'Features, Floor by Floor',
  build(L,idx){ const X=L.pageCenterX(idx);
    building=new Building(X-100, L.H*0.5);
    this.caption=L.pageCaption(
      'A deep network builds understanding one layer at a time: edges → textures → parts → object.',
      'drag CAT / CAR / NOISE into the stack and watch the signal climb, floor by floor',
      'this is why deep nets need real examples to train on — noise in gives noise out, all the way up.');
  },
  reset(L,idx){ const X=L.pageCenterX(idx);
    new Feeder(idx, X+340, L.H*0.28, 'cat'); new Feeder(idx, X+340, L.H*0.5, 'car'); new Feeder(idx, X+340, L.H*0.72, 'noise');
  },
  onDrop(L,o,w,idx){ if(o instanceof Feeder && building.over(w.x,w.y)){ building.feed(o.kind); o.snapHome(); return true; } return false; },
  onFrame(L,dt,T){ building.update(dt); },
  draw(L,ctx,dt,T){ building.draw(ctx); }
});
})();
