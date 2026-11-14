import baseProducts from '../store/products.json' with {type:'json'};
import {identity} from './support.mjs';
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const categories=['Phones','Audio','Smart glasses','Watches','Hair care','Fragrance'];
const uuidPattern=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
class Invalid extends Error{constructor(message,status=400){super(message);this.status=status}}
const fail=(message,status)=>{throw new Invalid(message,status)};
function str(value,max,label,required=false){if(typeof value!=='string'||value.length>max||(required&&!value.trim())||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value))fail('Check '+label+'.');return value.trim()}
export async function limitedBody(request,limit){
 if(Number(request.headers.get('content-length')||0)>limit)fail('This file or request is too large.',413);
 const reader=request.body?.getReader();if(!reader)return new Uint8Array();let size=0;const chunks=[];
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>limit){await reader.cancel();fail('This file or request is too large.',413)}chunks.push(value)}
 const all=new Uint8Array(size);let offset=0;for(const chunk of chunks){all.set(chunk,offset);offset+=chunk.length}return all;
}
async function input(request){if(!request.headers.get('content-type')?.startsWith('application/json'))fail('Send a JSON request.');try{return JSON.parse(new TextDecoder().decode(await limitedBody(request,100000)))}catch(e){if(e instanceof Invalid)throw e;fail('Invalid request.')}}
export async function catalogueProducts(env,admin=false){
 if(!env.DB)throw new Error('Catalogue database unavailable');
 const rows=(await env.DB.prepare('SELECT * FROM catalogue_products').all()).results;
 const all=new Map(baseProducts.map(p=>[p.id,{...p,state:'published',revision:0}]));
 for(const row of rows)all.set(row.id,{...JSON.parse(row.data),state:row.state,managed:true,revision:row.revision,updatedAt:row.updated_at});
 return [...all.values()].filter(p=>admin||p.state==='published');
}
function publicProduct(p){const {sourceOptions,sourceStock,revision,updatedAt,state,...rest}=p;return rest}
function imageType(bytes){
 if(bytes.length<12)return null;
 if(bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff)return 'image/jpeg';
 if([137,80,78,71,13,10,26,10].every((n,i)=>bytes[i]===n))return 'image/png';
 const s=new TextDecoder('ascii').decode(bytes.slice(0,12));if(s.startsWith('RIFF')&&s.slice(8)==='WEBP')return 'image/webp';return null;
}
async function validatedProduct(raw,existing,env){
 const name=str(raw.name,120,'product name',true),description=str(raw.description,3000,'description');
 if(!categories.includes(raw.category))fail('Choose a category.');
 if(!['draft','published','archived'].includes(raw.state))fail('Choose a listing state.');
 if(!['available','unconfirmed'].includes(raw.availability))fail('Choose a stock confirmation state.');
 if(!Array.isArray(raw.variants)||!raw.variants.length||raw.variants.length>60)fail('Add between 1 and 60 product options.');
 const ids=new Set();const variants=raw.variants.map(v=>{
  if(!v||typeof v!=='object')fail('Check each product option.');
  const id=str(v.id,80,'option identifier',true);if(!/^[a-zA-Z0-9-]+$/.test(id)||ids.has(id))fail('Option identifiers must be unique.');ids.add(id);
  const label=str(v.label,120,'option label',true),price=Number(v.price),stock=Number(v.stock);
  if(!Number.isFinite(price)||price<0.01||price>100000||Math.abs(price*100-Math.round(price*100))>0.00001)fail('Use a positive price with up to two decimal places.');
  if(!Number.isInteger(stock)||stock<0||stock>100000)fail('Stock must be a whole number between 0 and 100,000.');
  return {id,label,price,stock,images:[]};
 });
 if(!Array.isArray(raw.images)||raw.images.length>10)fail('Choose up to 10 product photos.');
 const images=[...new Set(raw.images)];
 for(const image of images){if(typeof image!=='string')fail('Invalid product photo.');if(existing?.images.includes(image))continue;const id=image.match(/^\/media\/([a-f0-9-]{36})$/)?.[1];if(!id||!await env.DB.prepare('SELECT id FROM product_media WHERE id=?').bind(id).first())fail('Upload photos using the photo uploader.');}
 if(raw.state==='published'&&!images.length)fail('Add at least one photo before publishing.');
 return {...(existing||{}),id:raw.id,type:'physical',name,category:raw.category,description,images,variants,price:Math.min(...variants.map(v=>v.price)),stock:variants.reduce((n,v)=>n+v.stock,0),availability:raw.availability,customImages:existing?.customImages||JSON.stringify(images)!==JSON.stringify(existing?.images||[]),state:raw.state};
}
function orderObject(row){return {...row,items:JSON.parse(row.items_json),customer:row.customer_json?JSON.parse(row.customer_json):null,items_json:undefined,customer_json:undefined,ip_hash:undefined}}
export async function adminAPI(request,env){
 const url=new URL(request.url),path=url.pathname,method=request.method,user=identity(request,env);
 const mediaRoute=path.startsWith('/media/');
 if(path!=='/catalogue.json'&&!path.startsWith('/api/admin/')&&!mediaRoute)return null;
 const protectedRoute=path.startsWith('/api/admin/');
 if(protectedRoute&&!user?.owner)return json({error:user?'Only the store owner can use this area.':'Sign in as the store owner.'},user?403:401);
 if(!['GET','POST','HEAD'].includes(method))return json({error:'Method not allowed.'},405);
 if(method==='POST'&&(!protectedRoute||request.headers.get('origin')!==url.origin))return json({error:'Send this request from the store.'},403);
 if(!env.DB)return json({error:'Store management is temporarily unavailable.'},503);
 try{
  if(path==='/catalogue.json'&&method==='GET')return json((await catalogueProducts(env)).map(publicProduct));
  if(mediaRoute&&['GET','HEAD'].includes(method)){
   const id=path.slice(7);if(!uuidPattern.test(id))return json({error:'Photo not found.'},404);
   if(!user?.owner){const published=await env.DB.prepare("SELECT id FROM catalogue_products WHERE state='published' AND data LIKE ? LIMIT 1").bind('%/media/'+id+'%').first();if(!published)return json({error:'Photo not found.'},404)}
   const row=await env.DB.prepare('SELECT * FROM product_media WHERE id=?').bind(id).first();if(!row||!env.BUCKET)return json({error:'Photo unavailable.'},404);
   const object=await env.BUCKET.get(row.object_key);if(!object)return json({error:'Photo unavailable.'},404);
   return new Response(method==='HEAD'?null:object.body,{headers:{'Content-Type':row.content_type,'Content-Length':String(row.size),'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
  }
  if(path==='/api/admin/products'&&method==='GET')return json({products:await catalogueProducts(env,true)});
  if(path==='/api/admin/product'&&method==='POST'){
   const raw=await input(request);if(!raw||typeof raw!=='object'||!/^([a-zA-Z0-9-]){1,80}$/.test(raw.id||''))fail('Invalid product identifier.');
   const existing=(await catalogueProducts(env,true)).find(p=>p.id===raw.id);
   if(!existing&&!raw.id.startsWith('custom-'))fail('New listings need a new product identifier.');
   if(!Number.isInteger(raw.revision)||raw.revision!==(existing?.revision||0))fail('This product changed in another tab. Reload it before saving.',409);
   const product=await validatedProduct(raw,existing,env);delete product.revision;delete product.updatedAt;
   const now=Date.now(),data=JSON.stringify(product);let result;
   if(raw.revision===0)result=await env.DB.prepare('INSERT OR IGNORE INTO catalogue_products (id,data,state,revision,updated_at) VALUES (?,?,?,1,?)').bind(raw.id,data,raw.state,now).run();
   else result=await env.DB.prepare('UPDATE catalogue_products SET data=?,state=?,revision=revision+1,updated_at=? WHERE id=? AND revision=?').bind(data,raw.state,now,raw.id,raw.revision).run();
   if(!result.meta.changes)fail('This product changed in another tab. Reload it before saving.',409);
   return json({product:{...product,revision:raw.revision+1,updatedAt:now}});
  }
  if(path==='/api/admin/upload'&&method==='POST'){
   if(!env.BUCKET)fail('Photo storage is temporarily unavailable.',503);
   const count=await env.DB.prepare('SELECT count(*) AS n FROM product_media WHERE created_at>?').bind(Date.now()-3600000).first();if(count.n>=100)fail('Upload limit reached. Try again in an hour.',429);
   const bytes=await limitedBody(request,5*1024*1024),type=imageType(bytes);if(!type||request.headers.get('content-type')!==type)fail('Upload a JPEG, PNG or WebP photo. SVG and other file types are not supported.');
   let name='Product photo';try{name=decodeURIComponent(request.headers.get('x-file-name')||name)}catch{}
   name=name.replace(/[\u0000-\u001f]/g,'').slice(0,160);const id=crypto.randomUUID(),key='products/'+id;
   await env.BUCKET.put(key,bytes,{httpMetadata:{contentType:type}});
   try{await env.DB.prepare('INSERT INTO product_media (id,object_key,name,content_type,size,created_at) VALUES (?,?,?,?,?,?)').bind(id,key,name,type,bytes.length,Date.now()).run()}catch(e){await env.BUCKET.delete(key);throw e}
   return json({id,url:'/media/'+id,name,size:bytes.length},201);
  }
  if(path==='/api/admin/orders'&&method==='GET'){
   const q=(url.searchParams.get('q')||'').slice(0,120),status=url.searchParams.get('status')||'all',page=Math.max(0,Math.min(100000,Number(url.searchParams.get('page'))||0));
   const conditions=[],args=[];
   if(q){conditions.push("(id LIKE ? ESCAPE '\\' OR customer_json LIKE ? ESCAPE '\\')");const like='%'+q.replace(/[\\%_]/g,'\\$&')+'%';args.push(like,like)}
   if(['pending','paid','failed','expired'].includes(status)){conditions.push('status=?');args.push(status)}
   if(['unfulfilled','processing','shipped','delivered','cancelled'].includes(status)){conditions.push('fulfilment=?');args.push(status)}
   const where=conditions.length?' WHERE '+conditions.join(' AND '):'';
   const rows=(await env.DB.prepare('SELECT * FROM orders'+where+' ORDER BY created_at DESC,id DESC LIMIT 25 OFFSET ?').bind(...args,Math.floor(page)*25).all()).results;
   const count=await env.DB.prepare('SELECT count(*) AS n FROM orders'+where).bind(...args).first();
   const stats=await env.DB.prepare("SELECT count(*) AS total,COALESCE(sum(CASE WHEN status='paid' AND fulfilment IN ('unfulfilled','processing') THEN 1 ELSE 0 END),0) AS to_pack,COALESCE(sum(CASE WHEN status='paid' THEN total_pence ELSE 0 END),0) AS paid_total FROM orders").first();
   return json({orders:rows.map(orderObject),total:count.n,page:Math.floor(page),stats});
  }
  if(path==='/api/admin/order'&&method==='GET'){
   const row=await env.DB.prepare('SELECT * FROM orders WHERE id=?').bind((url.searchParams.get('id')||'').slice(0,80)).first();if(!row)fail('Order not found.',404);return json({order:orderObject(row)});
  }
  if(path==='/api/admin/order'&&method==='POST'){
   const raw=await input(request);if(!raw||typeof raw.id!=='string')fail('Invalid order.');
   const row=await env.DB.prepare('SELECT * FROM orders WHERE id=?').bind(raw.id).first();if(!row)fail('Order not found.',404);
   if(!['unfulfilled','processing','shipped','delivered','cancelled'].includes(raw.fulfilment))fail('Choose a fulfilment status.');
   if(['processing','shipped','delivered'].includes(raw.fulfilment)&&row.status!=='paid')fail('Only Stripe-confirmed paid orders can be fulfilled.');
   const tracking=str(raw.tracking,300,'tracking reference'),notes=str(raw.notes,2000,'private notes');
   const result=await env.DB.prepare('UPDATE orders SET fulfilment=?,tracking=?,notes=?,revision=revision+1,updated_at=? WHERE id=? AND revision=?').bind(raw.fulfilment,tracking,notes,Date.now(),row.id,raw.revision).run();
   if(!result.meta.changes)fail('This order changed in another tab. Reopen it before saving.',409);
   return json({saved:true});
  }
  return json({error:'Not found.'},404);
 }catch(e){if(e instanceof Invalid)return json({error:e.message},e.status);console.error('Store management request failed',path);return json({error:'Store management is temporarily unavailable. Please try again.'},503)}
}
