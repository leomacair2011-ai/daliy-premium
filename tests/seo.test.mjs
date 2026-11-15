import test from 'node:test';
import assert from 'node:assert/strict';
import {seoResponse,STORE_ORIGIN} from '../server/seo.mjs';
const shell='<!doctype html><html lang="en-GB"><head><title>Mello</title><meta name="description" content="Store"><link href="./styles.css" rel="stylesheet"></head><body><header>Mello</header><a class="skip" href="#collection">Skip to products</a><main id="top"><h1>Store</h1></main><footer><a href="#collection">Collection</a></footer><script src="./app.js"></script></body></html>';
const asset=text=>({data:Buffer.from(text).toString('base64')});
const assets={'/index.html':asset(shell),'/404.html':asset(shell.replace('Store</h1>','Page not found</h1>'))};
const product={id:'daily-123',name:'Audio <special> & "new"',description:'A supplied product. <script>alert(1)</script>',category:'Audio',state:'published',images:['/media/00000000-0000-0000-0000-000000000000'],variants:[{id:'v1',label:'Black <small>',price:24.99,stock:0},{id:'v2',label:'White',price:35}]};
const options={assets,loadCatalogue:async()=>[product]};
const req=(path,method='GET')=>new Request('https://attacker.invalid'+path,{method});
test('direct product URL is useful server HTML with real options, canonical and private index controls',async()=>{
 const r=await seoResponse(req('/products/daily-123?variant=v2&utm=test'),{},options),html=await r.text();
 assert.equal(r.status,200);assert.equal(r.headers.get('x-robots-tag'),'noindex, nofollow');
 assert.match(html,/<h1 id="pageProductTitle">Audio &lt;special&gt; &amp; &quot;new&quot;<\/h1>/);assert.match(html,/£24.99/);assert.match(html,/White — £35.00/);
 assert.ok(html.includes('href="'+STORE_ORIGIN+'/products/daily-123"'));assert.ok(!html.includes('attacker.invalid'));
 assert.match(html,/<base href="\/">/);assert.match(html,/src="\/app.js"/);assert.match(html,/href="\/styles.css"/);assert.match(html,/data-product="daily-123"/);
 assert.ok(!html.includes('<script>alert'));assert.ok(!html.includes('"Offer"'));assert.ok(!html.includes('InStock'));assert.ok(!html.includes('AggregateRating'));
});
test('draft, archived, missing and malformed product paths return 404 without private content',async()=>{
 for(const p of ['/products/missing','/products/%3Cscript%3E','/products/daily-123/extra'])assert.equal((await seoResponse(req(p),{},options)).status,404);
 for(const state of ['draft','archived']){const r=await seoResponse(req('/products/daily-123'),{},{assets,loadCatalogue:async()=>[{...product,state}]});assert.equal(r.status,404);assert.ok(!(await r.text()).includes('Audio &lt;special&gt;'))}
});
test('catalogue failure returns unavailable rather than fabricated product or stale seed',async()=>{
 const r=await seoResponse(req('/products/daily-123'),{},{assets,loadCatalogue:async()=>{throw Error('db secret')}});assert.equal(r.status,503);assert.ok(!(await r.text()).includes('secret'));
});
test('private robots and sitemap advertise no indexable URLs',async()=>{
 const robots=await seoResponse(req('/robots.txt'),{},options);assert.equal(await robots.text(),'User-agent: *\nDisallow: /\n');
 const sitemap=await seoResponse(req('/sitemap.xml'),{},options);assert.equal(sitemap.headers.get('content-type'),'application/xml; charset=utf-8');assert.ok(!(await sitemap.text()).includes('<loc>'));
});
test('HEAD has matching status but no body; writes rejected; unrelated routes fall through',async()=>{
 const r=await seoResponse(req('/products/daily-123','HEAD'),{},options);assert.equal(r.status,200);assert.equal(await r.text(),'');assert.equal((await seoResponse(req('/products/daily-123','POST'),{},options)).status,405);assert.equal(await seoResponse(req('/contact'),{},options),null);
});
test('nonlocal product image values are not promoted into HTML or social metadata',async()=>{
 const r=await seoResponse(req('/products/daily-123'),{},{assets,loadCatalogue:async()=>[{...product,images:['javascript:alert(1)']}]});const html=await r.text();assert.ok(!html.includes('javascript:'));assert.ok(!html.includes('og:image'));
});
