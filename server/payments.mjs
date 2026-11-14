import Stripe from 'stripe';
import merchant from './merchant.json' with {type:'json'};
import settings from '../store/settings.json' with {type:'json'};
import {checkoutResponse,webhookResponse,paymentStatus} from './stripe.mjs';
import {catalogueProducts} from './admin.mjs';
const json=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
export function checkoutReady(env){return !!(env.DB&&env.STRIPE_SECRET_KEY&&env.STRIPE_WEBHOOK_SECRET&&env.PAYMENTS_ENABLED==='true'&&env.FULFILMENT_READY==='true'&&env.PUBLIC_CHECKOUT_READY==='true'&&settings.shipping.countries.length&&Number.isFinite(settings.shipping.fee))}
export async function paymentsAPI(request,runtime){
 const path=new URL(request.url).pathname;
 if(!['/api/checkout-config','/api/checkout','/api/stripe-webhook','/api/payment-status'].includes(path))return null;
 const ready=checkoutReady(runtime),env={...runtime,CURRENCY:'GBP',SHIPPING:settings.shipping,PAYMENTS_ENABLED:ready?'true':'false'};
 if(path==='/api/checkout-config')return json({provider:'stripe',enabled:ready,message:ready?'Pay securely with Stripe.':'Stripe checkout is not connected yet. Your bag is saved on this device.'});
 try{
  if(path==='/api/stripe-webhook')return webhookResponse(request,env);
  if(path==='/api/payment-status')return paymentStatus(request,env);
  if(!ready)return json({error:'Stripe checkout is not available yet. Your bag is saved.'},503);
  if(request.method!=='POST')return json({error:'Method not allowed.'},405);
  if(request.headers.get('origin')!==new URL(request.url).origin)return json({error:'Invalid origin.'},403);
  const stripe=new Stripe(env.STRIPE_SECRET_KEY,{httpClient:Stripe.createFetchHttpClient()}),account=await stripe.accounts.retrieve();
  if(account.id!==merchant.accountId||!account.charges_enabled)return json({error:'The Daily Premium Stripe account is not ready.'},503);
  const products=(await catalogueProducts(env)).map(p=>({...p,productType:'physical',variants:p.variants.map(v=>({...v,colour:v.label,sizes:['One size'],stockBySize:{'One size':v.stock}}))}));
  return checkoutResponse(request,env,async ids=>products.filter(p=>ids.includes(p.id)),()=>stripe);
 }catch{return json({error:'Payment service is temporarily unavailable. Your bag is saved.'},503)}
}
