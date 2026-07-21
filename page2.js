/* PAGE 2 — Discriminative vs Generative */
(function(){
const L=window.LAB;
let machines=[];

function drawShape(ctx,kind,x,y,size,color){
  ctx.save(); ctx.translate(x,y); ctx.strokeStyle=color; ctx.lineWidth=2.4; ctx.shadowColor=color; ctx.shadowBlur=10;
  if(kind===0){ ctx.beginPath(); ctx.arc(0,0,size,0,6.283); ctx.stroke(); }
  else if(kind===1){ ctx.beginPath(); ctx.moveTo(0,-size); ctx.lineTo(size*0.9,size*0.6); ctx.lineTo(-size*0.9,size*0.6); ctx.closePath(); ctx.stroke(); }
  else { ctx.strokeRect(-size*0.8,-size*0.8,size*1.6,size*1.6); }
  ctx.restore();
}

class Token extends L.Obj{
  constructor(pageIdx,x,y,kind){ super(pageIdx,x,y,42); this.kind=kind; this.made=false; this.stampTxt=null; this.stampCol=null; }
  draw(ctx){
    const col = this.rejectT>0 ? L.COL.RD : this.made ? L.COL.MG : '#8fe9ff';
    L.panel(this.x,this.y,96,96,col,{fillA:0.08,glow:this.made?18:10});
    drawShape(ctx,this.kind,this.x,this.y-6,20, this.made?L.COL.MG:'#9feaff');
    if(this.stampTxt) L.drawText(this.stampTxt, this.x, this.y+34, {size:14,color:this.stampCol,weight:'700'});
    if(this.made) L.drawText('NEW SAMPLE', this.x, this.y+34, {size:12,color:'#ff9fe0',weight:'700'});
  }
}

class Machine{
  constructor(pageIdx,x,y,type){ this.x=x; this.y=y; this.type=type; this.busy=null; this.t=0; this.flash=0;
    this.color = type==='A' ? L.COL.CY : L.COL.VI;
    if(type==='A'){ this.pts=[]; for(let i=0;i<12;i++){ const left=i<6;
      this.pts.push({x:(left?-1:1)*(14+Math.random()*70), y:(Math.random()-0.5)*130, col:left?L.COL.CY:L.COL.AM}); } }
    else { this.cluster=[]; for(let i=0;i<10;i++){ const a=Math.random()*6.283, r=Math.random()*54;
      this.cluster.push({x:Math.cos(a)*r, y:Math.sin(a)*r+8}); } }
  }
  over(wx,wy){ return Math.abs(wx-this.x)<150 && Math.abs(wy-this.y)<130; }
  accept(tok){ if(this.busy){ tok.reject(); return; } this.busy={tok,t:0,ate:false}; tok.state='processing'; tok.vx=tok.vy=0;
    tok.homeX=tok.x; tok.homeY=tok.y; L.beep(this.type==='A'?700:240,.12,this.type==='A'?'square':'sine',.05); }
  update(dt){ this.t+=dt; if(this.flash>0) this.flash-=dt*2;
    if(!this.busy) return; const b=this.busy; b.t+=dt; const tok=b.tok;
    tok.x+=(this.x-tok.x)*0.15; tok.y+=(this.y-tok.y)*0.15;
    if(this.type==='A'){ if(b.t>0.9){ const side=tok.kind===2?'CLASS B':'CLASS A';
      tok.stampTxt='→ '+side; tok.stampCol=side==='CLASS B'?L.COL.AM:L.COL.CY;
      tok.state='fly'; tok.vx=4; tok.vy=2; this.flash=1; L.burst(this.x+70,this.y,L.COL.CY,20,3); L.beep(1040,.12,'triangle',.06); this.busy=null; } }
    else { if(b.t<0.55) tok.squash=Math.max(0.08,1-b.t/0.55);
      if(b.t>=0.55 && !b.ate){ b.ate=true; L.burst(this.x,this.y,L.COL.VI,34,3); }
      if(b.t>1.4){ tok.dispose(); const nt=new Token(this.pageIdx,this.x+110,this.y+16,b.tok.kind);
        nt.homeX=nt.x; nt.homeY=nt.y; nt.made=true; nt.state='fly'; nt.vx=4; nt.vy=2;
        L.burst(this.x+80,this.y,L.COL.MG,50,4); L.beep(300,.3,'sine',.06); setTimeout(()=>L.beep(600,.2,'sine',.05),120);
        this.flash=1; this.busy=null; } }
  }
  draw(ctx){
    L.panel(this.x,this.y,300,260,this.color,{fillA:0.05,glow:14+this.flash*20,r:20});
    if(this.type==='A'){ this.pts.forEach(p=>L.glowCircle(this.x+p.x,this.y+p.y,5,p.col,{fillA:0.9,glow:6}));
      L.glowLine(this.x,this.y-90,this.x,this.y+90,'#ffffff',{width:2,glow:10,alpha:0.7+Math.sin(this.t*2)*0.2}); }
    else { this.cluster.forEach(p=>L.glowCircle(this.x+p.x,this.y+p.y,6,L.COL.VI,{fillA:0.85,glow:8})); }
    L.drawText(this.type==='A'?'DISCRIMINATIVE':'GENERATIVE', this.x, this.y-108, {size:22,color:this.color,weight:'800'});
    L.drawText(this.type==='A'?'learns the line between things':'learns what things are made of, then makes more',
      this.x, this.y-86, {size:14,color:L.COL.dim,weight:'500'});
    L.drawText(this.type==='A'?'asks: which side?':'asks: what does one look like?',
      this.x, this.y+108, {size:15,color:this.type==='A'?L.COL.CY:'#c79bff',weight:'700'});
  }
}

L.definePage({
  name:'Discriminative vs Generative', title:'Two Ways to Learn',
  build(L,idx){ const X=L.pageCenterX(idx);
    machines=[new Machine(idx,X-180,L.H*0.46,'A'), new Machine(idx,X+180,L.H*0.46,'B')];
    machines.forEach(m=>m.pageIdx=idx);
    this.caption=L.pageCaption(
      'Same kind of data. Two completely different jobs.',
      'drop a token into either machine and watch what it does with it',
      'almost every model you\'ll meet is one of these two — knowing which tells you what it can and can\'t do.');
  },
  reset(L,idx){ const X=L.pageCenterX(idx);
    for(let i=0;i<3;i++){ const t=new Token(idx, X+(i-1)*120, L.H-160, i); t.homeX=t.x; t.homeY=t.y; }
    for(const m of machines) m.busy=null;
  },
  onDrop(L,o,w,idx){ if(o instanceof Token){ for(const m of machines){ if(m.over(w.x,w.y)){
    if(o.made && m.type==='B') o.reject(); else m.accept(o); return true; } } } return false; },
  onFrame(L,dt,T){ for(const m of machines) m.update(dt); },
  draw(L,ctx,dt,T){ for(const m of machines) m.draw(ctx); }
});
})();
