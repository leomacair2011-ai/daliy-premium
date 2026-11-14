const json=(data,status=200,headers={})=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}});
const cookieName='__Host-dp_chat';
const uuid=()=>crypto.randomUUID();
const isUUID=v=>typeof v==='string'&&/^[a-f0-9-]{36}$/.test(v);
export function identity(request,env){
 const id=request.headers.get('oai-authenticated-user-id'),email=request.headers.get('oai-authenticated-user-email');
 if(!id||!email)return null;
 let name='';try{name=decodeURIComponent(request.headers.get('oai-authenticated-user-full-name')||'')}catch{}
 return {id,name:name||'Customer',owner:!!env.OWNER_EMAIL&&email.toLowerCase()===env.OWNER_EMAIL.toLowerCase()};
}
async function hash(s){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))).map(x=>x.toString(16).padStart(2,'0')).join('')}
async function visitor(request,env,create=false){
 const user=identity(request,env);if(user)return {key:'user:'+user.id,name:user.name,cookie:null};
 let token=request.headers.get('cookie')?.split(';').map(s=>s.trim()).find(s=>s.startsWith(cookieName+'='))?.slice(cookieName.length+1);
 if(token&&!/^[a-f0-9-]{73}$/.test(token))token=null;
 let cookie=null;if(!token&&create){token=uuid()+'-'+uuid();cookie=`${cookieName}=${token}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=2592000`}
 return token?{key:'device:'+await hash(token),name:'Guest',cookie}:null;
}
async function bodyOf(request){
 if(!request.headers.get('content-type')?.startsWith('application/json'))throw new Error('Please send JSON.');
 if(Number(request.headers.get('content-length')||0)>12000)throw new Error('Message is too large.');
 const text=await request.text();if(text.length>12000)throw new Error('Message is too large.');
 try{return JSON.parse(text)}catch{throw new Error('Invalid request.')}
}
function messageBody(value){if(typeof value!=='string'||!value.trim()||value.trim().length>2000)throw new Error('Write a message of 1–2,000 characters.');return value.trim()}
async function currentThread(db,v){return v?db.prepare('SELECT * FROM support_threads WHERE visitor_key = ?').bind(v.key).first():null}
async function messagesFor(db,id){return (await db.prepare('SELECT id, role, body, created_at FROM (SELECT id, role, body, created_at, rowid AS seq FROM support_messages WHERE thread_id = ? ORDER BY created_at DESC, rowid DESC LIMIT 100) ORDER BY created_at ASC, seq ASC').bind(id).all()).results}
async function online(db){const p=await db.prepare("SELECT * FROM support_presence WHERE id = 'owner'").first();return !!p?.available&&p.last_seen>Date.now()-30000}
export async function supportAPI(request,env){
 const path=new URL(request.url).pathname,user=identity(request,env),method=request.method;
 if(path==='/api/me'&&method==='GET')return json({signedIn:!!user,name:user?.name||null,isOwner:!!user?.owner,signInUrl:'/signin-with-chatgpt?return_to=%2Faccount',signOutUrl:'/signout-with-chatgpt?return_to=%2F',sessionNotice:'Your sign-in is remembered by this browser until the secure session expires or you sign out.'});
 if(!path.startsWith('/api/chat/')&&!path.startsWith('/api/owner/'))return null;
 if(path.startsWith('/api/owner/')&&!user?.owner)return json({error:user?'This area is for the store owner.':'Sign in to open the owner dashboard.'},user?403:401);
 if(!['GET','POST'].includes(method))return json({error:'Method not allowed.'},405);
 if(method==='POST'&&request.headers.get('origin')!==new URL(request.url).origin)return json({error:'Please send this request from the store.'},403);
 if(!env.DB)return json({error:'Chat is temporarily unavailable. Please contact us on WhatsApp.'},503);
 const db=env.DB;
 try{
  if(path==='/api/chat/thread'&&method==='GET'){
   const v=await visitor(request,env),thread=await currentThread(db,v);
   return json({thread:thread?{id:thread.id,name:thread.name,status:thread.status}:null,messages:thread?await messagesFor(db,thread.id):[],online:await online(db)});
  }
  if(path==='/api/chat/message'&&method==='POST'){
   const input=await bodyOf(request),body=messageBody(input.body);if(!isUUID(input.requestId))return json({error:'Invalid message identifier.'},400);
   const v=await visitor(request,env,true),now=Date.now();
   const name=typeof input.name==='string'?input.name.trim().slice(0,60):v.name;
   await db.prepare("INSERT OR IGNORE INTO support_threads (id,visitor_key,name,status,created_at,updated_at) VALUES (?,?,?,'open',?,?)").bind(uuid(),v.key,name||v.name,now,now).run();
   const t=await currentThread(db,v);
   const previous=await db.prepare('SELECT body FROM support_messages WHERE thread_id = ? AND request_id = ?').bind(t.id,input.requestId).first();
   if(previous){if(previous.body!==body)return json({error:'Message identifier already used.'},409);return json({sent:true},200,v.cookie?{'Set-Cookie':v.cookie}:{})}
   const rate=await db.prepare("SELECT count(*) AS n FROM support_messages WHERE thread_id = ? AND role = 'customer' AND created_at > ?").bind(t.id,now-60000).first();
   if(rate.n>=12)return json({error:'Please wait a minute before sending more messages.'},429);
   await db.batch([
    db.prepare("INSERT OR IGNORE INTO support_messages (id,thread_id,role,body,created_at,request_id) VALUES (?,?,'customer',?,?,?)").bind(uuid(),t.id,body,now,input.requestId),
    db.prepare("UPDATE support_threads SET updated_at = ?, status = 'open', name = ? WHERE id = ?").bind(now,name||t.name,t.id)
   ]);
   return json({sent:true},200,v.cookie?{'Set-Cookie':v.cookie}:{});
  }
  if(path==='/api/owner/inbox'&&method==='GET'){
   const threads=(await db.prepare("SELECT t.id,t.name,t.status,t.created_at,t.updated_at,(SELECT count(*) FROM support_messages m WHERE m.thread_id=t.id AND m.role='customer' AND m.created_at>t.owner_read_at) AS unread,(SELECT body FROM support_messages m WHERE m.thread_id=t.id ORDER BY m.created_at DESC,m.rowid DESC LIMIT 1) AS preview FROM support_threads t ORDER BY t.updated_at DESC LIMIT 100").all()).results;
   const p=await db.prepare("SELECT available FROM support_presence WHERE id = 'owner'").first();
   return json({threads,available:!!p?.available});
  }
  if(path==='/api/owner/presence'&&method==='POST'){
   const input=await bodyOf(request);
   if(typeof input.available==='boolean')await db.prepare("INSERT INTO support_presence (id,available,last_seen) VALUES ('owner',?,?) ON CONFLICT(id) DO UPDATE SET available=excluded.available,last_seen=excluded.last_seen").bind(input.available?1:0,Date.now()).run();
   else await db.prepare("UPDATE support_presence SET last_seen = ? WHERE id = 'owner'").bind(Date.now()).run();
   return json({ok:true});
  }
  if(path==='/api/owner/thread'&&method==='GET'){
   const id=new URL(request.url).searchParams.get('id');if(!isUUID(id))return json({error:'Invalid conversation.'},400);
   const thread=await db.prepare('SELECT id,name,status FROM support_threads WHERE id = ?').bind(id).first();if(!thread)return json({error:'Conversation not found.'},404);
   return json({thread,messages:await messagesFor(db,id)});
  }
  if(path==='/api/owner/action'&&method==='POST'){
   const input=await bodyOf(request);if(!isUUID(input.id))return json({error:'Invalid conversation.'},400);
   if(input.action==='read')await db.prepare('UPDATE support_threads SET owner_read_at = ? WHERE id = ?').bind(Date.now(),input.id).run();
   else if(input.action==='close')await db.prepare("UPDATE support_threads SET status = 'closed' WHERE id = ?").bind(input.id).run();
   else return json({error:'Unknown action.'},400);
   return json({ok:true});
  }
  if(path==='/api/owner/reply'&&method==='POST'){
   const input=await bodyOf(request),body=messageBody(input.body);
   if(!isUUID(input.id)||!isUUID(input.requestId))return json({error:'Invalid message identifier.'},400);
   if(!await db.prepare('SELECT id FROM support_threads WHERE id = ?').bind(input.id).first())return json({error:'Conversation not found.'},404);
   const now=Date.now();
   await db.batch([
    db.prepare("INSERT OR IGNORE INTO support_messages (id,thread_id,role,body,created_at,request_id) VALUES (?,?,'owner',?,?,?)").bind(uuid(),input.id,body,now,input.requestId),
    db.prepare("UPDATE support_threads SET updated_at = ?, owner_read_at = ?, status = 'open' WHERE id = ?").bind(now,now,input.id)
   ]);return json({sent:true});
  }
  return json({error:'Not found.'},404);
 }catch(e){if(['Please send JSON.','Message is too large.','Invalid request.','Write a message of 1–2,000 characters.'].includes(e.message))return json({error:e.message},400);console.error('Support request failed',path);return json({error:'Chat is temporarily unavailable. Please try again or use WhatsApp.'},503)}
}
