/* PAGE 4 — Hand-Built vs Learned Features */
(function(){
const L=window.LAB;
let tools=[], mlModel=null, dlStack=null;

class Photo extends L.Obj{
  constructor(pageIdx,x,y){ super(pageIdx,x,y,44); this.consumed=false; }
  draw(ctx){ const col=this.rejectT>0?L.COL.RD:'#8fe9ff';
    L.panel(this.x,this.y,90,90,col,{fillA:0.08,glow:10});
    ctx.save(); ctx.translate(this.x,this.y); ctx.strokeStyle='#9feaff'; ctx.lineWidth=2; ctx.shadowColor='#9feaff'; ctx.shadowBlur=8;
    ctx.beginPath(); ctx.arc(0,4,20,0,6.283); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-16,-8); ctx.lineTo(-24,-24); ctx.lineTo(-6,-14); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(16,-8); ctx.lineTo(24,-24); ctx.lineTo(6,-14); ctx.stroke();
    ctx.restore(); }
}
class Chip extends L.Obj{
  constructor(pageIdx,x,y,name,color){ super(pageIdx,x,y,28); this.name=name; this.color=color; L.burst(x,y,color,14,2.4); }
  draw(ctx){ ctx.save(); ctx.translate(this.x,this.y); ctx.rotate(this.spin*0.3);
    ctx.strokeStyle=this.color; ctx.lineWidth=2.4; ctx.shadowColor=this.color; ctx.shadowBlur=10;
    ctx.beginPath(); ctx.moveTo(0,-18); ctx.lineTo(16,0); ctx.lineTo(0,18); ctx.lineTo(-16,0); ctx.closePath(); ctx.stroke();
    ctx.restore();
    L.drawText(this.name, this.x, this.y+30, {size:13,color:L.COL.ink,weight:'600'}); }
}
class Tool{
  constructor(x,y,name,color){ this.hx=x; this.hy=y; this.name=name; this.color=color; }
  draw(ctx){ ctx.save(); ctx.translate(this.hx,this.hy); ctx.strokeStyle=this.color; ctx.lineWidth=2.2; ctx.shadowColor=this.color; ctx.shadowBlur=10;
    ctx.beginPath(); ctx.moveTo(0,-22); ctx.lineTo(16,16); ctx.lineTo(-16,16); ctx.closePath(); ctx.stroke(); ctx.restore();
    L.drawText(this.name, this.hx, this.hy+38, {size:14,color:L.COL.ink,weight:'700'}); }
}
class MLModel{
  constructor(x,y){ this.x=x; this.y=y; }
  over(wx,wy){ return Math.abs(wx-this.x)<130 && Math.abs(wy-this.y)<110; }
  draw(ctx){ L.panel(this.x,this.y,270,220,L.COL.CY,{fillA:0.05,glow:12,r:18});
    L.drawText('CLASSICAL ML', this.x, this.y-84, {size:22,color:L.COL.CY,weight:'800'});
    L.wrapText('STEP 1 drag a tool onto a photo   STEP 2 drag the chip in here', this.x, this.y-52, 240, 18, {size:13,color:L.COL.dim,weight:'500'});
    L.wrapText('raw photos are rejected — it only understands chips', this.x, this.y+86, 240, 18, {size:13,color:L.COL.CY,weight:'600'});
  }
}
class DLStack{
  constructor(x,y){ this.x=x; this.y=y; this.pulse=-1; this._cycle=0; }
  over(wx,wy){ return Math.abs(wx-this.x)<130 && Math.abs(wy-this.y)<130; }
  ripple(){ this.pulse=0; }
  nextChipName(){ const n=['edge','texture','shape']; return n[this._cycle++%n.length]; }
  update(dt){ if(this.pulse>=0){ this.pulse+=dt*2.2; if(this.pulse>3) this.pulse=-1; } }
  draw(ctx){ L.panel(this.x,this.y,270,240,L.COL.VI,{fillA:0.05,glow:12,r:18});
    for(let i=0;i<4;i++){ const fy=this.y+86-i*46;
      const on=this.pulse>=0 && Math.abs(this.pulse-i*0.4)<0.5;
      L.roundRect(this.x-110,fy-16,220,32,8);
      ctx.save(); ctx.fillStyle=L.hexA(L.COL.VI, on?0.35:0.08); ctx.fill();
      ctx.strokeStyle=L.hexA(L.COL.VI, on?0.9:0.4); ctx.lineWidth=1.4; ctx.stroke(); ctx.restore(); }
    L.drawText('DEEP LEARNING', this.x, this.y-104, {size:22,color:'#c9b3ff',weight:'800'});
    L.wrapText('ONE STEP: drag a raw photo straight in — it builds its own chips', this.x, this.y-72, 240, 18, {size:13,color:L.COL.dim,weight:'500'});
    L.wrapText('no tools needed', this.x, this.y+118, 240, 18, {size:13,color:'#c79bff',weight:'600'});
  }
}

L.definePage({
  name:'Two Ways to Find Features', title:'Hand-Built vs Learned',
  build(L,idx){ const X=L.pageCenterX(idx);
    mlModel=new MLModel(X-170, L.H*0.44); dlStack=new DLStack(X+190, L.H*0.44);
    tools=[ new Tool(X-380,L.H*0.3,'ear tool',L.COL.CY), new Tool(X-380,L.H*0.44,'whisker tool',L.COL.CY), new Tool(X-380,L.H*0.58,'texture tool',L.COL.CY) ];
    this.caption=L.pageCaption(
      'Classical ML needs YOU to describe what matters. Deep learning figures it out alone.',
      'left: tool then photo then chip then model.  right: just drop the raw photo straight in.',
      'deep learning didn\'t win because it\'s "smarter" — it won because it removes the manual feature step.');
  },
  reset(L,idx){ const X=L.pageCenterX(idx);
    for(let i=0;i<3;i++) spawnPhoto(idx, X-170, L.H*0.3+i*(L.H*0.28));
    for(let i=0;i<3;i++) spawnPhoto(idx, X+440, L.H*0.3+i*(L.H*0.28));
  },
  onDrop(L,o,w,idx){
    if(o instanceof Photo){
      if(mlModel.over(w.x,w.y)){ o.reject(); return true; }
      if(dlStack.over(w.x,w.y)){ o.consumed=true; o.dispose(); dlStack.ripple();
        L.burst(dlStack.x,dlStack.y,L.COL.VI,36,3); L.beep(300,0.25,'sine',0.05);
        for(let i=0;i<3;i++) setTimeout(()=>{ const c=new Chip(idx, dlStack.x+(Math.random()-0.5)*40, dlStack.y+90, dlStack.nextChipName(), L.COL.VI);
          c.state='fly'; c.vy=-4; c.vx=(Math.random()-0.5)*2; }, i*220);
        setTimeout(()=>spawnPhoto(idx, L.pageCenterX(idx)+440, L.H*0.3), 900);
        return true; }
      return false;
    }
    if(o instanceof Chip){ if(mlModel.over(w.x,w.y)){ o.dispose(); L.burst(mlModel.x,mlModel.y,L.COL.OK,22,3); L.beep(880,0.12,'triangle',0.05); return true; } return false; }
    return false;
  },
  onFrame(L,dt,T){ dlStack.update(dt);
    for(const o of window.__objsRef()){ if(o instanceof Photo && !o.consumed){
      for(const tl of tools){ if(Math.hypot(o.x-tl.hx,o.y-tl.hy)<50 && o.state!=='grab'){
        const c=new Chip(o.page, o.x+40,o.y, tl.name.replace(' tool','')+'-feat', tl.color); c.state='fly'; c.vx=3;
        o.consumed=true; setTimeout(()=>{o.consumed=false; o.reject();},1200);
      } } } }
  },
  draw(L,ctx,dt,T){ mlModel.draw(ctx); dlStack.draw(ctx); tools.forEach(t=>t.draw(ctx)); }
});
function spawnPhoto(pageIdx,x,y){ const p=new Photo(pageIdx,x,y); p.homeX=x; p.homeY=y; return p; }
})();
