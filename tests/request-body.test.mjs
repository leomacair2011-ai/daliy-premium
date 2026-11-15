import test from 'node:test';
import assert from 'node:assert/strict';
import {boundedRequest} from '../server/request-body.mjs';
const streamed=(chunks,headers={})=>new Request('https://store.test/api/test',{method:'POST',headers,body:new ReadableStream({start(c){for(const chunk of chunks)c.enqueue(new TextEncoder().encode(chunk));c.close()}}),duplex:'half'});
test('body cap rejects chunked input without a content length',async()=>{await assert.rejects(boundedRequest(streamed(['123','456']),5),RangeError)});
test('body cap does not trust dishonest content length',async()=>{await assert.rejects(boundedRequest(streamed(['123456'],{'content-length':'1'}),5),RangeError)});
test('bounded body preserves exact signature bytes and headers',async()=>{const raw='{"type":"checkout.session.completed","text":"£ \\n"}\n';const r=await boundedRequest(streamed([raw],{'stripe-signature':'fixture'}));assert.equal(await r.text(),raw);assert.equal(r.headers.get('stripe-signature'),'fixture')});
test('GET and empty bodies pass unchanged; boundary length is accepted',async()=>{const get=new Request('https://store.test/');assert.equal(await boundedRequest(get),get);assert.equal(await (await boundedRequest(streamed(['12345']),5)).text(),'12345')});
