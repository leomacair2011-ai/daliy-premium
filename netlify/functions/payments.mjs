import Stripe from 'stripe';
import merchant from '../../server/merchant.json' with {type:'json'};
import {getStore} from '@netlify/blobs';
import {createStoreDatabase} from '../storage.mjs';
import {checkoutResponse,webhookResponse,paymentStatus} from '../../server/stripe.mjs';
import settings from '../../store/settings.json' with {type:'json'};
import source from '../../store/products.json' with {type:'json'};
const json=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
const products=source.map(p=>({...p,productType:'physical',variants:p.variants.map(v=>({...v,colour:v.label,sizes:['One size'],stockBySize:{'One size':v.stock}}))}));
export function configured(env){return env.PAYMENTS_ENABLED==='true'&&env.FULFILMENT_READY==='true'&&env.PUBLIC_CHECKOUT_READY==='true'&&/^acct_[a-zA-Z0-9]+$/.test(merchant.accountId)&&!!env.STRIPE_SECRET_KEY&&!!env.STRIPE_WEBHOOK_SECRET&&settings.shipping.countries.length>0&&Number.isFinite(settings.shipping.fee)}
export async function handle(request,context={},runtime=process.env,storeFactory=getStore,makeStripe=key=>new Stripe(key,{httpClient:Stripe.createFetchHttpClient()})){
 const path=new URL(request.url).pathname,ready=configured(runtime);
 if(path==='/api/checkout-config')return json({provider:'stripe',enabled:!!ready,message:ready?'Pay securely with Stripe.':'Stripe checkout is not connected yet. Your bag is saved on this device.'});
 if(!ready)return json({error:'Stripe checkout is not available yet. Your bag is saved on this device.'},503);
 try{
  const env={...runtime,CURRENCY:'GBP',SHIPPING:settings.shipping,get DB(){return createStoreDatabase(storeFactory({name:'daliy-premium-'+(context.deploy?.context==='production'?'production':context.deploy?.id||'preview'),consistency:'strong'}))}};
  if(path==='/api/stripe-webhook')return await webhookResponse(request,env);
  if(path==='/api/payment-status')return await paymentStatus(request,env);
  if(path!=='/api/checkout')return json({error:'Not found'},404);
  if(request.method!=='POST')return json({error:'Method not allowed'},405);
  if(request.headers.get('Origin')!==new URL(request.url).origin)return json({error:'Invalid origin'},403);
  const stripe=makeStripe(runtime.STRIPE_SECRET_KEY),account=await stripe.accounts.retrieve();
  if(account.id!==merchant.accountId||!account.charges_enabled)return json({error:'The Daily Premium Stripe account is not ready for checkout.'},503);
  const h=new Headers(request.headers);h.set('CF-Connecting-IP',context.ip||'unknown');
  return await checkoutResponse(new Request(request,{headers:h}),env,async ids=>products.filter(p=>ids.includes(p.id)),()=>stripe);
 }catch{return json({error:'Stripe checkout is temporarily unavailable. Your bag has been kept.'},503)}
}
export default handle;
export const config={path:'/api/*',preferStatic:false};
