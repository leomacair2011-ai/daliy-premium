import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../dist/server/index.js';
test('built Worker serves product HTML, privacy directives and correct error statuses',async()=>{
 const env={DB:{prepare(){return {all:async()=>({results:[]})}}}};
 const get=p=>worker.fetch(new Request('http://localhost'+p),env);
 const p=await get('/products/daily-7720755');assert.equal(p.status,200);const html=await p.text();assert.match(html,/AirPods Pro 3/);assert.match(html,/rel="canonical"/);assert.equal(p.headers.get('x-robots-tag'),'noindex, nofollow');
 assert.equal((await get('/products/not-a-product')).status,404);assert.equal((await get('/api/unknown')).status,404);
 const home=await(await get('/')).text();assert.ok(!home.includes('src="./admin.js'));assert.ok(home.includes('href="./admin.css'));
 const reviews=await(await get('/reviews')).text();assert.ok(reviews.includes('No customer reviews published yet'));assert.ok(!reviews.includes('Sample stories'));
 const cap=await worker.fetch(new Request('http://localhost/api/checkout',{method:'POST',headers:{'content-length':String(7*1024*1024)},body:'x'}),{});assert.equal(cap.status,413);
 const config=await(await get('/api/checkout-config')).json();assert.equal(config.enabled,false);
});
