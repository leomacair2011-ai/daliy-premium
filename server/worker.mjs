import {adminAPI} from './admin.mjs';
import {paymentsAPI} from './payments.mjs';
import {supportAPI,identity} from './support.mjs';
import assets from '../.openai/local/assets.json' with {type:'json'};
const headers={'X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self' https://checkout.stripe.com; frame-ancestors 'self' https://chatgpt.com https://*.chatgpt.com",'Permissions-Policy':'camera=(), microphone=(), geolocation=()'};
export default {async fetch(request,env){
 const url=new URL(request.url);if(url.pathname.length>1&&url.pathname.endsWith('/')&&['GET','HEAD'].includes(request.method))return Response.redirect(url.origin+url.pathname.replace(/\/$/,'')+url.search,301);const api=await adminAPI(request,env)||await paymentsAPI(request,env)||await supportAPI(request,env);if(api){Object.entries(headers).forEach(([k,v])=>api.headers.set(k,v));return api}
 if(url.pathname.startsWith('/api/'))return Response.json({error:'Not found.'},{status:404,headers});
 if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405,headers});
 let path=url.pathname.replace(/\/$/,'')||'/';
 if(path==='/owner'){
  const user=identity(request,env);
  if(!user)return Response.redirect(url.origin+'/signin-with-chatgpt?return_to=%2Fowner',302);
  if(!user.owner)return new Response('This dashboard is for the store owner. Return to /account to check your sign-in.',{status:403,headers:{...headers,'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}});
 }
 path=({'/':'/index.html','/contact':'/contact.html','/reviews':'/reviews.html','/account':'/account.html','/owner':'/owner.html'})[path]||path;
 // Do not permit the owner page alias to bypass the protected route.
 if(path==='/owner.html'&&!identity(request,env)?.owner)return new Response('Owner sign-in required',{status:403,headers});
 const asset=assets[path];if(!asset)return new Response(assets['/404.html']?Uint8Array.from(atob(assets['/404.html'].data),c=>c.charCodeAt(0)):'Page not found',{status:404,headers:{...headers,'Content-Type':'text/html; charset=utf-8'}});
 const cache=asset.type.startsWith('text/html')?'no-store':'public, max-age=0, must-revalidate';
 return new Response(request.method==='HEAD'?null:Uint8Array.from(atob(asset.data),c=>c.charCodeAt(0)),{headers:{...headers,'Content-Type':asset.type,'Cache-Control':cache}});
}};
