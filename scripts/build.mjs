import {mkdir,cp,readFile,writeFile} from 'node:fs/promises';
const products=JSON.parse(await readFile('store/products.json'));
const ids=new Set();
for(const p of products){if(ids.has(p.id)||!p.name||!p.sourceUrl||!p.variants.length)throw Error('Invalid product '+p.id);ids.add(p.id);for(const v of p.variants)if(!Number.isSafeInteger(Math.round(v.price*100))||v.price<=0)throw Error('Invalid price');}
await mkdir('dist',{recursive:true});await cp('src','dist',{recursive:true});
await writeFile('dist/catalogue.json',JSON.stringify(products));await cp('store/settings.json','dist/settings.json');
console.log(`Built ${products.length} products and ${products.reduce((n,p)=>n+p.variants.length,0)} options.`);

await mkdir('dist/api',{recursive:true});await writeFile('dist/api/checkout-config',JSON.stringify({provider:'stripe',enabled:false,message:'Stripe checkout is not connected yet. Your bag is saved on this device.'}));
