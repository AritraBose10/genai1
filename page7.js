/* PAGE 7 — The Forward Pass */
(function(){
const L=window.LAB;
let net=null, runBtn=null;

class RunButton extends L.Obj{
  constructor(pageIdx,x,y){ super(pageIdx,x,y,40); this.isFire=true; }
  draw(ctx){ L.glowCircle(this.x,this.y,this.r,L.COL.OK,{strokeOnly:true,glow:14});
    L.drawText('RUN', this.x, this.y, {size:15,color:L.COL.OK,weight:'800'}); }
}
class Network{
  constructor(x,y,w,h){ this.x=x; this.y=y; this.layers=[3,4,4,2]; this.nodes=[]; this.pulseT=-1;
    this.layers.forEach((count,li)=>{ const col=[]; const lx=x-w/2+li*(w/(this.layers.length-1));
      for(let n=0;n<count;n++){ const ny=y+(n-(count-1)/2)*(h/Math.max(count,2));
        col.push({x:lx,y:ny,li}); } this.nodes.push(col); });
  }
  forward(){ this.pulseT=0; L.beep(300,0.1,'sine',0.05); }
  update(dt){ if(this.pulseT>=0){ this.pulseT+=dt*0.55;
    if(this.pulseT>this.layers.length*0.8+0.6){ this.pulseT=-1;
      this.nodes[this.layers.length-1].forEach(nd=>L.burst(nd.x,nd.y,L.COL.MG,18,3)); } } }
  draw(ctx){
    L.drawText('A NEURAL NETWORK', this.x, this.y-190, {size:24,color:'#c9b3ff',weight:'800'});
    L.wrapText('many neurons in layers. signal flows left → right: the forward pass.', this.x, this.y-160, 520, 22, {size:16,color:L.COL.dim,weight:'500'});
    for(let li=0;li<this.layers.length-1;li++){ this.nodes[li].forEach(a=>{ this.nodes[li+1].forEach(b=>{
      const on = this.pulseT>=0 && this.pulseT>li*0.8 && this.pulseT<li*0.8+0.9;
      L.glowLine(a.x,a.y,b.x,b.y, on?'#9feaff':'#2a4a58', {width:on?2:1, glow:on?8:0, alpha:on?0.85:0.35}); }); }); }
    this.nodes.forEach((col,li)=>{ col.forEach(nd=>{
      const on = this.pulseT>=0 && this.pulseT>li*0.8 && this.pulseT<li*0.8+1.1;
      const color = li===0?L.COL.CY: li===this.layers.length-1?L.COL.MG:L.COL.VI;
      L.glowCircle(nd.x,nd.y,18,color,{fillA:on?0.9:0.25,glow:on?18:6}); }); });
  }
}

L.definePage({
  name:'Neurons Become a Network', title:'The Forward Pass',
  build(L,idx){ const X=L.pageCenterX(idx);
    net=new Network(X, L.H*0.5, 520, 280);
    this.caption=L.pageCaption(
      'Stack enough neurons in layers and the signal ripples through — that\'s a network "thinking."',
      'press RUN and watch the signal light up layer after layer, left to right',
      'this left-to-right ripple is the same "forward pass" that happens inside every model you\'ll use.');
  },
  reset(L,idx){ const X=L.pageCenterX(idx); net.pulseT=-1;
    runBtn=new RunButton(idx, X, L.H*0.82);
  },
  onDrop(L,o,w,idx){ if(o.isFire){ net.forward(); o.snapHome(); return true; } return false; },
  onFrame(L,dt,T){ net.update(dt); },
  draw(L,ctx,dt,T){ net.draw(ctx); }
});
})();
