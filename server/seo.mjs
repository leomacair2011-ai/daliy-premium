import {catalogueProducts} from './admin.mjs';

// Keep the approved existing origin. A request Host header must never select a canonical.
export const STORE_ORIGIN='https://daliy-premium.zany-sugar-0629.chatgpt.site';
export const PRIVATE_ROBOTS='noindex, nofollow';
const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const amount=value=>new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP'}).format(value);
const assetText=asset=>asset?new TextDecoder().decode(Uint8Array.from(atob(asset.data),c=>c.charCodeAt(0))):'';
const response=(request,body,status=200,type='text/html; charset=utf-8')=>new Response(request.method==='HEAD'?null:body,{status,headers:{'Content-Type':type,'Cache-Control':'no-store','X-Robots-Tag':PRIVATE_ROBOTS}});
function imagePath(value){
 if(typeof value!=='string')return null;
 if(/^\/media\/[a-f0-9-]{36}$/.test(value))return value;
 if(/^\.?\/assets\/products\/[a-zA-Z0-9_.-]+$/.test(value))return value.replace(/^\.\//,'/');
 return null;
}
function rootShell(template){
 return template.replace('<head>','<head>\n  <base href="/">').replace(/(?:<link rel="canonical"[^>]*>|<meta name="robots"[^>]*>)/g,'').replace(/(src|href)="\.\//g,'$1="/').replace(/href="#collection"/g,'href="/#collection"').replace(/href="#top"/g,'href="/"').replace('<body>','<body data-page="product">');
}
function renderProduct(template,product){
 const canonical=STORE_ORIGIN+'/products/'+encodeURIComponent(product.id),name=escape(product.name);
 const description=String(product.description||product.name),summary=escape(description.replace(/\s+/g,' ').trim().slice(0,160));
 const validVariants=(product.variants||[]).filter(v=>Number.isFinite(v.price)&&v.price>0);
 const price=validVariants.length?amount(Math.min(...validVariants.map(v=>v.price))):null;
 const cover=imagePath(product.images?.[0]);
 const image=cover?`<div class="detail-image-wrap"><img class="detail-image" src="${escape(cover)}" alt="${name}" width="700" height="700" fetchpriority="high"></div>`:'';
 const main=`<main id="top"><section class="detail-layout" aria-labelledby="pageProductTitle"><div class="detail-gallery">${image}<p class="gallery-caption">Product illustration. Confirm the actual item and contents with the store.</p></div><div class="detail-body"><p class="eyebrow">${escape(product.category)}</p><h1 id="pageProductTitle">${name}</h1>${price?`<p class="detail-price">From ${price}</p><p class="detail-note">Pack prices · GBP</p>`:''}<p>${escape(description)}</p><details open><summary>Product options</summary><ul>${validVariants.map(v=>`<li>${escape(v.label)} — ${amount(v.price)}</li>`).join('')}</ul></details><p class="detail-status">Confirm the product’s condition, contents, stock and delivery details before ordering. Adding to your bag does not reserve stock.</p><button class="primary" data-product="${escape(product.id)}">Choose your option</button><a class="text-link" href="/contact">Ask about this product ›</a><p><a class="text-link" href="/#collection">Back to the collection ›</a></p></div></section></main>`;
 const metadata=`<meta name="robots" content="${PRIVATE_ROBOTS}"><link rel="canonical" href="${canonical}"><meta property="og:type" content="website"><meta property="og:title" content="${name} — Mello"><meta property="og:description" content="${summary}"><meta property="og:url" content="${canonical}">${cover?`<meta property="og:image" content="${STORE_ORIGIN+escape(cover)}">`:''}`;
 return rootShell(template).replace(/<title>[\s\S]*?<\/title>/,`<title>${name} — Mello</title>`).replace(/<meta name="description"[^>]*>/,`<meta name="description" content="${summary}">`).replace('</head>',metadata+'</head>').replace(/<main id="top">[\s\S]*?<\/main>/,main).replace('<a class="skip" href="/#collection">Skip to products</a>','<a class="skip" href="#top">Skip to product</a>');
}

export async function seoResponse(request,env,{assets={},loadCatalogue=catalogueProducts}={}){
 const path=new URL(request.url).pathname;
 if(path!=='/robots.txt'&&path!=='/sitemap.xml'&&!path.startsWith('/products/'))return null;
 if(!['GET','HEAD'].includes(request.method))return response(request,'Method not allowed',405,'text/plain; charset=utf-8');
 // This private staging policy is intentionally not an indexing/launch claim.
 if(path==='/robots.txt')return response(request,'User-agent: *\nDisallow: /\n',200,'text/plain; charset=utf-8');
 if(path==='/sitemap.xml')return response(request,'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>',200,'application/xml; charset=utf-8');
 const match=path.match(/^\/products\/([a-zA-Z0-9-]{1,80})$/);
 const missing=()=>response(request,rootShell(assetText(assets['/404.html']))||'Product not found',404);
 if(!match)return missing();
 try{
  const product=(await loadCatalogue(env)).find(p=>p.id===match[1]&&(!p.state||p.state==='published'));
  if(!product)return missing();
  const template=assetText(assets['/index.html']);if(!template)throw new Error('Store template missing');
  return response(request,renderProduct(template,product));
 }catch{return response(request,'Product information is temporarily unavailable. Please try again.',503,'text/plain; charset=utf-8')}
}
