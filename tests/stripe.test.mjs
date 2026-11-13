import {test} from 'node:test';import assert from 'node:assert/strict';import Stripe from 'stripe';
import {validatedItems,checkoutResponse,webhookResponse,paymentsEnabled} from '../server/stripe.mjs';
const variant={id:'black',colour:'Black',price:81,sizes:['M'],stockBySize:{M:3},purchaseUrl:'https://weidian.com/item.html?itemID=123',supplierOption:'Black jacket'};const products=[{id:'p1',name:'Jacket',price:70,variants:[variant]}];const line={id:'p1',variantId:'black',qty:2,size:'M',colour:'Black',price:0.01};
test('catalogue price overrides client price and selected options remain attached',()=>{assert.deepEqual(validatedItems([line],products),[{id:'p1',variantId:'black',name:'Jacket',productType:'digital',qty:2,size:'M',colour:'Black',unitAmount:8100,supplierUrl:variant.purchaseUrl,supplierOption:variant.supplierOption}]);});
test('rejects absent options, invalid quantities, unknown products and over-stock split lines',()=>{for(const change of [{size:''},{colour:''},{qty:-1},{qty:1.5},{id:'unknown'},{size:'XL'},{colour:'Custom red'},{variantId:'forged'}])assert.throws(()=>validatedItems([{...line,...change}],products));assert.throws(()=>validatedItems([line,line],products));});
test('payments cannot start without keys and explicit activation',async()=>{assert.equal(paymentsEnabled({DB:{}}),false);assert.equal((await checkoutResponse(new Request('https://store.test/api/checkout',{method:'POST'}),{},()=>products)).status,503);});
test('checkout creates server-priced USD session with selected plan and retry key',async()=>{
 let params,opts;const calls=[];const env={STRIPE_SECRET_KEY:'mock',STRIPE_WEBHOOK_SECRET:'mock',PAYMENTS_ENABLED:'true',DB:{prepare(sql){return {bind(...args){calls.push({sql,args});return {first:async()=>sql.includes('count(*)')?{total:0}:null,run:async()=>({success:true})};}}}}};
 const id=crypto.randomUUID();const r=await checkoutResponse(new Request('https://store.test/api/checkout',{method:'POST',headers:{Origin:'https://store.test'},body:JSON.stringify({items:[line],checkoutId:id})}),env,async()=>products,()=>({checkout:{sessions:{create:async(p,o)=>{params=p;opts=o;return{id:'cs_test_example',url:'https://checkout.stripe.com/example'};}}}}));
 assert.equal(r.status,200);assert.equal(params.line_items[0].price_data.unit_amount,8100);assert.equal(params.line_items[0].price_data.product_data.metadata.colour,'Black');assert.equal(opts.idempotencyKey,'daliy-checkout-'+id);assert.ok(!('payment_method_types' in params));assert.deepEqual(params.excluded_payment_method_types,['crypto','paypal']);assert.equal(params.integration_identifier,'daliy_premium_pzqmwctn');assert.ok(!('shipping_address_collection' in params));assert.equal(params.line_items[0].price_data.currency,'usd');assert.equal(params.line_items[0].price_data.product_data.description,'Plan: Black');assert.ok(calls.some(c=>c.sql.startsWith('INSERT')&&c.args[2]===16200));
});
test('webhooks verify signatures and record only paid matching totals',async()=>{
 const stripe=new Stripe('sk_test_dummy');const secret='whsec_local_fixture';let updates=0;
 const order={id:'order',total_pence:16200,currency:'gbp',stripe_session_id:'cs_test_example'};
 const env={STRIPE_SECRET_KEY:'sk_test_dummy',STRIPE_WEBHOOK_SECRET:secret,DB:{prepare(sql){return{bind(){return{first:async()=>order,run:async()=>{updates++;}}}}}}};
 const invoke=async(payment_status,amount_total=16200,badSignature=false)=>{const payload=JSON.stringify({type:'checkout.session.completed',data:{object:{id:'cs_test_example',metadata:{daliy_order_id:'order'},payment_status,amount_total,currency:'gbp'}}});const signature=stripe.webhooks.generateTestHeaderString({payload,secret:badSignature?'wrong':secret});return webhookResponse(new Request('https://store.test/api/stripe-webhook',{method:'POST',headers:{'Stripe-Signature':signature},body:payload}),env,()=>stripe);};
 assert.equal((await invoke('paid',16200,true)).status,400);assert.equal(updates,0);assert.equal((await invoke('unpaid')).status,200);assert.equal(updates,0);assert.equal((await invoke('paid',100)).status,409);assert.equal(updates,0);assert.equal((await invoke('paid')).status,200);assert.equal(updates,1);
});

test('size stock is enforced per colour and size, including repeated basket lines',()=>{const white={...variant,id:'white',colour:'White',price:90,stockBySize:{M:1}};const all=[{...products[0],variants:[variant,white]}];assert.throws(()=>validatedItems([{...line,variantId:'white',colour:'White'}],all));const result=validatedItems([line,{...line,variantId:'white',colour:'White',qty:1}],all);assert.equal(result[1].unitAmount,9000);assert.throws(()=>validatedItems([line,line],all));assert.throws(()=>validatedItems([{...line,variantId:undefined}],all));});

test('mixed baskets collect a shipping address and reconcile the shipping charge; digital orders do not',async()=>{
 const physical={...products[0],productType:'physical'},digital={...products[0],id:'download',productType:'digital'};
 let args,total;const env={STRIPE_SECRET_KEY:'mock',STRIPE_WEBHOOK_SECRET:'mock',PAYMENTS_ENABLED:'true',SHIPPING:{countries:['GB'],fee:5,freeOver:0},DB:{prepare(sql){return{bind(...v){if(sql.startsWith('INSERT'))total=v[2];return{first:async()=>sql.includes('count(*)')?{total:0}:null,run:async()=>({})};}};}}};
 const req=new Request('https://store.test/api/checkout',{method:'POST',headers:{Origin:'https://store.test'},body:JSON.stringify({items:[line,{...line,id:'download'}],checkoutId:crypto.randomUUID()})});
 const res=await checkoutResponse(req,env,async()=>[physical,digital],()=>({checkout:{sessions:{create:async p=>{args=p;return{id:'cs_test_example',url:'https://checkout.stripe.com/example'};}}}}));
 assert.equal(res.status,200);assert.deepEqual(args.shipping_address_collection.allowed_countries,['GB']);assert.equal(args.shipping_options[0].shipping_rate_data.fixed_amount.amount,500);assert.equal(total,32900);
 assert.match(args.line_items[0].price_data.product_data.description,/Size M/);
});

test('restored GBP clothing prices are charged and recorded in pounds',async()=>{
 let session,stored;const env={CURRENCY:'GBP',SHIPPING:{countries:['GB'],fee:0,freeOver:0},STRIPE_SECRET_KEY:'mock',STRIPE_WEBHOOK_SECRET:'mock',PAYMENTS_ENABLED:'true',DB:{prepare(sql){return{bind(...args){if(sql.startsWith('INSERT'))stored=args;return{first:async()=>sql.includes('count(*)')?{total:0}:null,run:async()=>({})};}};}}};
 const req=new Request('https://store.test/api/checkout',{method:'POST',headers:{Origin:'https://store.test'},body:JSON.stringify({items:[line],checkoutId:crypto.randomUUID()})});
 const res=await checkoutResponse(req,env,async()=>[{...products[0],productType:'physical'}],()=>({checkout:{sessions:{create:async p=>{session=p;return{id:'cs_test_example',url:'https://checkout.stripe.com/example'};}}}}));
 assert.equal(res.status,200);assert.equal(session.line_items[0].price_data.currency,'gbp');assert.equal(session.line_items[0].price_data.unit_amount,8100);assert.equal(session.shipping_options[0].shipping_rate_data.fixed_amount.currency,'gbp');assert.equal(stored[3],'gbp');
});
