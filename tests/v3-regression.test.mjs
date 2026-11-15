import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizeBag,bagTotal,filterProducts} from '../src/cart.mjs';
const products=[
 {id:'audio-3',name:'AirPods Pro 3',category:'Audio',price:24.99,variants:[{id:'white',price:24.99}]},
 {id:'audio-max',name:'AirPods Pro Max 2',category:'Audio',price:95.99,variants:[{id:'silver',price:95.99}]},
 {id:'phone-s26',name:'Samsung Galaxy S26 Ultra',category:'Phones',price:105.99,variants:[{id:'black',price:105.99}]},
 {id:'glasses',name:'Ray-Ban Glasses gen 2',category:'Smart glasses',price:68.99,variants:[{id:'black',price:68.99}]},
];
const find=search=>filterProducts(products,{search}).map(p=>p.id);
test('independent search: case, repeated spaces and punctuation identify the same product',()=>{
 for(const q of ['AirPods Pro 3',' AirPods  Pro-3 ','AIRPODS PRO 3'])assert.deepEqual(find(q),['audio-3'],q);
});
test('independent search: model punctuation and hyphenated manufacturer names remain discoverable',()=>{
 assert.deepEqual(find('S26-Ultra'),['phone-s26']);
 assert.deepEqual(find('Ray Ban'),['glasses']);
});
test('independent search: partial and category queries remain relevant; unknown query stays empty',()=>{
 assert.deepEqual(find('airpods'),['audio-3','audio-max']);
 assert.deepEqual(find('phones'),['phone-s26']);
 assert.deepEqual(find('refrigerator xyz'),[]);
 assert.deepEqual(find('undefined'),[],'missing optional brand cannot be indexed as literal undefined');
});
test('independent search: filters and price sorting do not mutate catalogue ordering',()=>{
 const before=structuredClone(products);
 assert.deepEqual(filterProducts(products,{category:'Audio',savedOnly:true,saved:['audio-max'],sort:'price-low'}).map(p=>p.id),['audio-max']);
 assert.deepEqual(products,before);
});
test('independent basket: malformed storage, removed products and removed variants are ignored',()=>{
 for(const malformed of [null,{},'broken',42])assert.deepEqual(normalizeBag(malformed,products),[]);
 const lines=[null,{},'invalid',{id:'deleted',variantId:'white',qty:1},{id:'audio-3',variantId:'removed',qty:1},{id:'audio-3',variantId:'white',qty:0},{id:'audio-3',variantId:'white',qty:-1},{id:'audio-3',variantId:'white',qty:1.5},{id:'audio-3',variantId:'white',qty:2,price:0.01}];
 assert.deepEqual(normalizeBag(lines,products),[{id:'audio-3',variantId:'white',qty:2}]);
});
test('independent basket: duplicate lines retain variant identity and cannot exceed quantity cap',()=>{
 const normalized=normalizeBag([{id:'audio-3',variantId:'white',qty:98},{id:'audio-3',variantId:'white',qty:5},{id:'audio-max',variantId:'silver',qty:1}],products);
 assert.deepEqual(normalized,[{id:'audio-3',variantId:'white',qty:99},{id:'audio-max',variantId:'silver',qty:1}]);
});
test('independent basket: totals use current variant prices in integer pennies',()=>{
 const lines=normalizeBag([{id:'audio-3',variantId:'white',qty:3,price:0.01},{id:'audio-max',variantId:'silver',qty:2}],products);
 assert.equal(bagTotal(lines,products),266.95);
 const repriced=structuredClone(products);repriced[0].variants[0].price=25.01;
 assert.equal(bagTotal(lines,repriced),267.01);
});
