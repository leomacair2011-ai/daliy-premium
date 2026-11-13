import Stripe from 'stripe';
export const API_VERSION=Stripe.API_VERSION;
export const paymentsEnabled=env=>Boolean(env.STRIPE_SECRET_KEY&&env.STRIPE_WEBHOOK_SECRET&&env.PAYMENTS_ENABLED==='true'&&env.DB);
const reply=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
const client=env=>new Stripe(env.STRIPE_SECRET_KEY,{apiVersion:API_VERSION,httpClient:Stripe.createFetchHttpClient(),maxNetworkRetries:2});
export function validatedItems(items,products){
 if(!Array.isArray(items)||!items.length||items.length>30)throw new Error('Choose between 1 and 30 items.');
 const totals=new Map();
 return items.map(line=>{
  if(!line||typeof line.id!=='string')throw new Error('Invalid item.');
  const p=products.find(p=>p.id===line.id);
  const variant=p?.variants?.find(v=>v.id===line.variantId);
  if(!p||p.availability==='unconfirmed'||!variant||!Number.isFinite(variant.price)||variant.price<=0)throw new Error('Choose an available option.');
  if(!Number.isInteger(line.qty)||line.qty<1||line.qty>99)throw new Error('Choose a quantity between 1 and 99.');
  const size=typeof line.size==='string'?line.size.trim():'',colour=typeof line.colour==='string'?line.colour.trim():'';
  if(!size||size.length>24||!colour||colour.length>120||/[\u0000-\u001f]/.test(size+colour))throw new Error('Choose the available options for every item.');
  if(!variant.sizes?.includes(size)||colour!==variant.colour)throw new Error('Choose a listed option and size.');
  const key=p.id+'|'+variant.id+'|'+size;
  const qty=(totals.get(key)||0)+line.qty;totals.set(key,qty);
  if(qty>99||qty>(variant.stockBySize?.[size]||0))throw new Error('Quantity exceeds available stock.');
  return {id:p.id,variantId:variant.id,name:p.name,productType:p.productType||'digital',size,colour,qty:line.qty,unitAmount:Math.round(variant.price*100),supplierUrl:variant.purchaseUrl,supplierOption:variant.supplierOption};
 });
}
export async function checkoutResponse(request,env,lookup,makeClient=client){
 if(!paymentsEnabled(env))return reply({error:'Online checkout is not available yet. Your basket is saved on this device.'},503);
 if(request.method!=='POST')return reply({error:'Method not allowed'},405);
 if(request.headers.get('Origin')!==new URL(request.url).origin)return reply({error:'Invalid origin'},403);
 let body;try{const raw=await request.text();if(raw.length>20000)return reply({error:'Basket too large'},413);body=JSON.parse(raw);}catch{return reply({error:'Invalid basket'},400);}
 if(!Array.isArray(body?.items)||body.items.length>30)return reply({error:'Invalid basket'},400);
 if(typeof body.checkoutId!=='string'||!/^[a-f0-9-]{36}$/.test(body.checkoutId))return reply({error:'Refresh the basket and try again.'},400);
 let items;try{items=validatedItems(body.items,await lookup(body.items.map(x=>x?.id)));}catch(error){return reply({error:error.message},400);}
 const subtotal=items.reduce((n,l)=>n+l.unitAmount*l.qty,0),id=body.checkoutId;
 const physical=items.some(l=>l.productType==='physical'),shipping=env.SHIPPING||{};
 if(physical&&(!Array.isArray(shipping.countries)||!shipping.countries.length))return reply({error:'Shipping destinations are not configured.'},503);
 const fee=physical&&!(shipping.freeOver>0&&subtotal>=Math.round(shipping.freeOver*100))?Math.round((shipping.fee||0)*100):0;
 const total=subtotal+fee,currency=(env.CURRENCY||'USD').toLowerCase();
 const previous=await env.DB.prepare('SELECT items_json FROM orders WHERE id = ?').bind(id).first();
 if(previous&&previous.items_json!==JSON.stringify(items))return reply({error:'Your basket changed. Please try checkout again.'},409);
 const ip=request.headers.get('CF-Connecting-IP')||'local';
 const ipHash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(ip)))).map(x=>x.toString(16).padStart(2,'0')).join('');
 const recent=await env.DB.prepare('SELECT count(*) AS total FROM orders WHERE ip_hash = ? AND created_at > ?').bind(ipHash,Date.now()-3600000).first();
 if(!previous&&recent.total>=20)return reply({error:'Please wait before starting another checkout.'},429);
 await env.DB.prepare('INSERT OR IGNORE INTO orders (id,items_json,total_pence,currency,status,created_at,ip_hash) VALUES (?,?,?,?,?,?,?)').bind(id,JSON.stringify(items),total,currency,'pending',Date.now(),ipHash).run();
 const origin=new URL(request.url).origin;
 const session=await makeClient(env).checkout.sessions.create({mode:'payment',excluded_payment_method_types:['crypto','paypal'],integration_identifier:'daliy_premium_pzqmwctn',client_reference_id:id,metadata:{daliy_order_id:id},
  line_items:items.map(l=>({quantity:l.qty,price_data:{currency,unit_amount:l.unitAmount,product_data:{name:l.name,description:l.productType==='physical'?`${l.colour} · Size ${l.size}`:`Plan: ${l.colour}`,metadata:{product_id:l.id,variant_id:l.variantId,size:l.size,colour:l.colour}}}})),
  ...(physical?{shipping_address_collection:{allowed_countries:shipping.countries},shipping_options:[{shipping_rate_data:{type:'fixed_amount',fixed_amount:{amount:fee,currency},display_name:fee?'Standard shipping':'Shipping included'}}]}:{}),
  success_url:origin+'/?session_id={CHECKOUT_SESSION_ID}',cancel_url:origin+'/?checkout=cancelled#collection'
 },{idempotencyKey:'daliy-checkout-'+id});
 await env.DB.prepare('UPDATE orders SET stripe_session_id = ? WHERE id = ?').bind(session.id,id).run();
 return reply({url:session.url,sessionId:session.id});
}
export async function webhookResponse(request,env,makeClient=client){
 if(!env.STRIPE_WEBHOOK_SECRET||!env.STRIPE_SECRET_KEY||!env.DB)return reply({error:'Webhook unavailable'},503);
 if(request.method!=='POST')return reply({error:'Method not allowed'},405);
 let event;try{event=await makeClient(env).webhooks.constructEventAsync(await request.text(),request.headers.get('Stripe-Signature')||'',env.STRIPE_WEBHOOK_SECRET,300,Stripe.createSubtleCryptoProvider());}catch{return reply({error:'Invalid webhook signature'},400);}
 if(!['checkout.session.completed','checkout.session.async_payment_succeeded','checkout.session.async_payment_failed','checkout.session.expired'].includes(event.type))return reply({received:true});
 const session=event.data.object,id=session.metadata?.daliy_order_id;
 if(!id)return reply({received:true});
 const order=await env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(id).first();
 if(!order)return reply({error:'Order not found'},409);
 if(order.stripe_session_id&&order.stripe_session_id!==session.id)return reply({error:'Order session mismatch'},409);
 if(session.payment_status==='paid'){
  if(session.amount_total!==order.total_pence||session.currency!==order.currency)return reply({error:'Payment total mismatch'},409);
  const customer={details:session.customer_details,shipping:session.collected_information?.shipping_details||session.shipping_details};
  // Repeated delivery is harmless; paid orders cannot be downgraded by older events.
  await env.DB.prepare("UPDATE orders SET status = 'paid', stripe_session_id = ?, customer_json = ?, paid_at = COALESCE(paid_at, ?) WHERE id = ?").bind(session.id,JSON.stringify(customer),Date.now(),id).run();
 }else if(event.type.endsWith('failed')||event.type.endsWith('expired')){
  await env.DB.prepare("UPDATE orders SET status = ? WHERE id = ? AND status != 'paid'").bind(event.type.endsWith('failed')?'failed':'expired',id).run();
 }
 return reply({received:true});
}
export async function paymentStatus(request,env){
 const id=new URL(request.url).searchParams.get('session_id');
 if(!id||!/^cs_(live|test)_[A-Za-z0-9]+$/.test(id)||!env.DB)return reply({status:'unknown'},404);
 const order=await env.DB.prepare('SELECT status FROM orders WHERE stripe_session_id = ?').bind(id).first();
 return reply({status:order?.status||'pending'});
}
