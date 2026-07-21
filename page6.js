/* PAGE 6 — How a Neuron Fires */
(function(){
const L=window.LAB;
let neuron=null, inputs=[], fireBtn=null;

class InputOrb extends L.Obj{
  constructor(pageIdx,x,y){ super(pageIdx,x,y,30); this.value=Math.round(Math.random()); }
  toggle(){ this.value=this.value?0:1; L.beep(this.value?720:300,0.06,'sine',0.04); }
  draw(ctx){ L.glowCircle(this.x,this.y,this.r,L.COL.CY,{fillA:this.value?0.85:0.15,glow:this.value?18:6});
    L.drawText(this.value.toString(), this.x, this.y, {size:24,color:'#04141c',weight:'900'}); }
}
class FireButton extends L.Obj{
  constructor(pageIdx,x,y){ super(pageIdx,x,y,36); this.pinned=false; this.isFire=true; }
  draw(ctx){ L.glowCircle(this.x,this.y,this.r,L.COL.OK,{strokeOnly:true,glow:14});
    L.drawText('FIRE', this.x, this.y, {size:16,color:L.COL.OK,weight:'800'}); }
}
class Neuron{
  constructor(x,y){ this.x=x; this.y=y; this.weights=[0.6,0.6,0.6]; this.threshold=1.0; this.fireT=-1; this.fillLevel=0; }
  wire(list){ this.inputs=list; }
  compute(){ let s=0; this.inputs.forEach((inp,i)=>s+=inp.value*this.weights[i]); return s; }
  fire(){ const s=this.compute(); this.fillLevel=Math.min(1,s/1.6);
    if(s>=this.threshold){ this.fireT=0; L.burst(this.x+200,this.y,L.COL.OK,40,4); L.beep(140,0.25,'sine',0.08); setTimeout(()=>L.beep(90,0.3,'sine',0.06),40); }
    else L.beep(160,0.2,'sawtooth',0.04);
    this._lastSum=s;
  }
  update(dt){ if(this.fireT>=0){ this.fireT+=dt*1.8; if(this.fireT>1.3) this.fireT=-1; }
    if(this.inputs) this.fillLevel += ((this.compute()/1.6)-this.fillLevel)*0.1; }
  draw(ctx){
    L.drawText('THE NEURON', this.x, this.y-150, {size:24,color:'#c9b3ff',weight:'800'});
    L.wrapText('inputs × weights, summed. cross the threshold → it fires.', this.x, this.y-120, 460, 22, {size:16,color:L.COL.dim,weight:'500'});
    // cell body
    L.glowCircle(this.x,this.y,70,L.COL.VI,{strokeOnly:true,glow:14});
    L.glowCircle(this.x,this.y,64*Math.max(0.12,this.fillLevel),L.COL.VI,{fillA:0.35,glow:10});
    // dendrite wires
    if(this.inputs) this.inputs.forEach((inp,i)=>{ const w=1+this.weights[i]*4;
      L.glowLine(inp.x+inp.r, inp.y, this.x-70, this.y, L.COL.CY, {width:w,glow:8,alpha:0.6}); });
    // axon
    const axonA = this.fireT>=0 ? 0.95-Math.max(0,this.fireT-0.3) : 0.4;
    L.glowLine(this.x+70,this.y,this.x+220,this.y,L.COL.VI,{width:6,glow:12,alpha:axonA});
    if(this.fireT>=0 && this.fireT<1){ const px=this.x+70+this.fireT*150;
      L.glowCircle(px,this.y,10,L.COL.OK,{fillA:0.95,glow:20}); }
    // threshold readout
    const s=this._lastSum||0;
    L.drawText('sum '+s.toFixed(2)+' / '+this.threshold.toFixed(1), this.x, this.y+110, {size:18,color:s>=this.threshold?L.COL.OK:L.COL.AM,weight:'700'});
  }
}

L.definePage({
  name:'One Cell of the Machine', title:'How a Neuron Fires',
  build(L,idx){ const X=L.pageCenterX(idx);
    neuron=new Neuron(X-40, L.H*0.46);
    this.caption=L.pageCaption(
      'This tiny cell is the whole trick — everything bigger is just millions of these, wired together.',
      'tap an input to flip it 0/1  ·  press FIRE  ·  watch if the sum crosses the threshold',
      'every network, however huge, is millions of this exact same tiny decision, wired together.');
  },
  reset(L,idx){ const X=L.pageCenterX(idx);
    inputs=[ new InputOrb(idx,X-320,L.H*0.28), new InputOrb(idx,X-320,L.H*0.46), new InputOrb(idx,X-320,L.H*0.64) ];
    neuron.wire(inputs); neuron.fireT=-1;
    fireBtn=new FireButton(idx, X-40, L.H*0.74);
  },
  onDrop(L,o,w,idx){
    if(o.isFire){ neuron.fire(); o.snapHome(); return true; }
    if(o instanceof InputOrb){ if(Math.hypot(o.x-o.homeX,o.y-o.homeY)<26){ o.toggle(); } o.snapHome(); return true; }
    return false;
  },
  onFrame(L,dt,T){ neuron.update(dt); },
  draw(L,ctx,dt,T){ neuron.draw(ctx); }
});
})();
