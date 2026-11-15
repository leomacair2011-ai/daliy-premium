import http from 'node:http';
import {mkdirSync} from 'node:fs';
import path from 'node:path';
import worker from '../dist/server/index.js';
import {localBucket} from './local-bucket.mjs';
import {localDB} from './local-db.mjs';
const port=Number(process.env.PORT||3187),dataDir=process.env.PREVIEW_DATA_DIR||'.openai/local';
mkdirSync(dataDir,{recursive:true});
const DB=localDB(path.join(dataDir,'support-preview.sqlite'));
http.createServer(async(req,res)=>{try{
 const url=new URL(req.url,`http://127.0.0.1:${port}`);
 // Local-only, explicit QA identities. These routes are not in the deployed Worker.
 if(url.pathname==='/__preview/login'){
  const role=url.searchParams.get('role');if(!['owner','customer','guest'].includes(role)){res.writeHead(400);res.end('Choose owner, customer or guest');return}
  res.writeHead(302,{'Set-Cookie':`dp_preview=${role}; Path=/; HttpOnly; SameSite=Lax`,'Location':role==='owner'?'/owner':'/contact'});res.end();return;
 }
 const headers=new Headers(req.headers);for(const k of [...headers.keys()])if(k.startsWith('oai-'))headers.delete(k);
 const role=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(x=>x.startsWith('dp_preview='))?.split('=')[1];
 if(role==='owner'||role==='customer'){headers.set('oai-authenticated-user-id','preview-'+role);headers.set('oai-authenticated-user-email',role+'@preview.local');headers.set('oai-authenticated-user-full-name',role==='owner'?'Preview%20Owner':'Preview%20Customer');}
 const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>6*1024*1024){res.writeHead(413);res.end('Too large');return}chunks.push(chunk)}
 const request=new Request(url,{method:req.method,headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(chunks)}:{})});
 const response=await worker.fetch(request,{DB,BUCKET:localBucket(path.join(dataDir,'uploads')),OWNER_EMAIL:'owner@preview.local'});const out=Object.fromEntries(response.headers);res.writeHead(response.status,out);res.end(Buffer.from(await response.arrayBuffer()));
 }catch(e){console.error(e.message);res.writeHead(500);res.end('Preview error');}
}).listen(port,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${port}\nQA identities: /__preview/login?role=owner or customer (local only).`));
