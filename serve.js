// Zero-dependency local server. Run: node serve.js   then open http://localhost:8080
const http=require('http'),fs=require('fs'),path=require('path');
const PORT=process.env.PORT||8080;
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css'};
http.createServer((req,res)=>{
  let rel=req.url.split('?')[0]; if(rel==='/')rel='/index.html';
  const p=path.join(__dirname, decodeURIComponent(rel));
  if(!p.startsWith(__dirname)){res.writeHead(403);return res.end('403');}
  fs.readFile(p,(e,d)=>{ if(e){res.writeHead(404);return res.end('Not found: '+rel);}
    res.writeHead(200,{'Content-Type':mime[path.extname(p)]||'application/octet-stream','Cache-Control':'no-cache, no-store, must-revalidate'}); res.end(d); });
}).listen(PORT,()=>console.log('\n  GenAI Interaction Lab (2D) running:\n  →  http://localhost:'+PORT+'\n\n  (Ctrl+C to stop)\n'));
