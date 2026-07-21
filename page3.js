/* PAGE 3 — AI contains ML contains DL contains GenAI */
(function(){
const L=window.LAB;
let rings=[], score=0, CX=0, CY=0;

const RINGDEF=[
  {r:230, name:'AI', color:'#4d8a9a', def:'any computer doing a "smart" task'},
  {r:170, name:'MACHINE LEARNING', color:L.COL.CY, def:'learns patterns from data'},
  {r:110, name:'DEEP LEARNING', color:L.COL.VI, def:'uses many-layered neural networks'},
  {r:56,  name:'GENERATIVE AI', color:L.COL.MG, def:'makes brand-new data'},
];
const TOKENS=[
  {t:'spam filter', ring:1}, {t:'chess bot', ring:0}, {t:'ChatGPT', ring:3},
  {t:'face unlock', ring:2}, {t:'image maker', ring:3}, {t:'smart thermostat', ring:-1},
];

class Chip extends L.Obj{
  constructor(pageIdx,x,y,def){ super(pageIdx,x,y,58); this.def=def; this.placed=false; }
  draw(ctx){
    const col=this.rejectT>0?L.COL.RD:this.placed?L.COL.OK:'#8fe9ff';
    L.panel(this.x,this.y,150,60,col,{fillA:0.09,glow:this.placed?16:8,r:12});
    L.drawText(this.def.t, this.x, this.y, {size:16,color:L.COL.ink,weight:'700'});
  }
}
function bandForDist(d){ if(d>170) return 0; if(d>110) return 1; if(d>56) return 2; return 3; }

L.definePage({
  name:'How It All Nests', title:'AI Contains ML Contains DL',
  build(L,idx){ const X=L.pageCenterX(idx); CX=X-90; CY=L.H*0.5;
    rings=RINGDEF;
    this.caption=L.pageCaption(
      'These are not four rival things. Each one lives inside the last.',
      'drag each label into the ring band it belongs to',
      '"AI" in a headline could mean any of these four very different things — knowing which one avoids confusion.');
  },
  reset(L,idx){ const X=L.pageCenterX(idx); score=0;
    TOKENS.forEach((td,i)=>{ const c=new Chip(idx, X+280, 130+i*82, td); c.homeX=c.x; c.homeY=c.y; });
  },
  onDrop(L,o,w,idx){ if(!(o instanceof Chip)) return false;
    const d=Math.hypot(w.x-CX, w.y-CY);
    if(d>260){ return false; }
    if(o.def.ring===-1){ o.reject(); return true; }
    const band=bandForDist(d);
    if(band===o.def.ring){ o.placed=true; o.pinned=true; o.state='idle'; L.burst(w.x,w.y,L.COL.OK,22,3); L.beep(880,0.12,'triangle',0.05); score++; return true; }
    o.reject(); return true;
  },
  draw(L,ctx,dt,T){
    for(const r of rings){ ctx.save(); ctx.beginPath(); ctx.arc(CX,CY,r.r,0,6.283);
      ctx.strokeStyle=L.hexA(r.color,0.85); ctx.lineWidth=2.4; ctx.shadowColor=r.color; ctx.shadowBlur=14+Math.sin(T*1.6)*4; ctx.stroke();
      ctx.fillStyle=L.hexA(r.color,0.04); ctx.fill(); ctx.restore(); }
    // legend on the left of the rings
    RINGDEF.forEach((r,i)=>{ const ly=110+i*84;
      L.glowCircle(CX-330,ly,9,r.color,{fillA:0.9,glow:10});
      L.drawText(r.name, CX-300, ly-8, {size:18,color:r.color,align:'left',weight:'800'});
      L.drawText(r.def, CX-300, ly+14, {size:14,color:L.COL.dim,align:'left',weight:'500'});
    });
    L.drawText('placed: '+score+' / '+TOKENS.filter(t=>t.ring>=0).length, CX+280, 92, {size:17,color:L.COL.OK,weight:'700'});
  }
});
})();
