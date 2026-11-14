import {mkdir,cp,readFile,writeFile,readdir,rm} from 'node:fs/promises';
import path from 'node:path';
import {build} from 'esbuild';
import {createHash} from 'node:crypto';
const products=JSON.parse(await readFile('store/products.json'));
const ids=new Set();for(const p of products){if(ids.has(p.id)||!p.name||!p.sourceUrl||!p.variants.length)throw Error('Invalid product '+p.id);ids.add(p.id);for(const v of p.variants)if(!Number.isSafeInteger(Math.round(v.price*100))||v.price<=0)throw Error('Invalid price');}
const publicDir='.openai/local/public';await rm(publicDir,{recursive:true,force:true});await mkdir(publicDir,{recursive:true});
await cp('src',publicDir,{recursive:true});await rm(path.join(publicDir,'pages'),{recursive:true,force:true});
const revision=createHash('sha256');
for(const name of ['app.js','cart.mjs','support.js','styles.css','support.css','storefront.css','admin.css','admin.js'])revision.update(await readFile('src/'+name));
const assetVersion=revision.digest('hex').slice(0,12);
const template=(await readFile('src/index.html','utf8')).replace(/(src|href)="(\.\/[^"]+\.(?:js|css))"/g,`$1="$2?v=${assetVersion}"`);
await writeFile(path.join(publicDir,'index.html'),template);
const titles={contact:'Contact us',reviews:'Reviews — Design preview',account:'Your account',owner:'Owner dashboard','404':'Page not found'};
for(const [page,title] of Object.entries(titles)){
 const main=await readFile(`src/pages/${page}.html`,'utf8');
 let html=template.replace(/<main id="top">[\s\S]*?<\/main>/,main).replace(/<title>.*?<\/title>/,`<title>${title} — Mello</title>`).replace(/href="#top"/g,'href="/"').replace(/<link rel="preload" as="image"[^>]+>/,'').replace('<body>',`<body data-page="${page}">`).replace(/href="#collection"/g,'href="/#collection"').replace('<a class="skip" href="/#collection">Skip to products</a>','<a class="skip" href="#top">Skip to content</a>');
 html=html.replace('content="Discover your next everyday favourite. Shop phones, audio, watches, smart glasses, hair care and fragrance at Mello."',`content="${title}. Mello customer support and shopping."`);
 await writeFile(path.join(publicDir,`${page}.html`),html);
}
await writeFile(path.join(publicDir,'catalogue.json'),JSON.stringify(products));await cp('store/settings.json',path.join(publicDir,'settings.json'));
await rm('dist',{recursive:true,force:true});
if(process.argv.includes('--static')){await cp(publicDir,'dist',{recursive:true});await mkdir('dist/api',{recursive:true});await writeFile('dist/api/checkout-config',JSON.stringify({provider:'stripe',enabled:false,message:'Stripe checkout is not connected yet. Your bag is saved on this device.'}));console.log('Built static storefront; Sites chat requires the Worker deployment.');}
else{
 const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml'};
 const assets={};async function walk(dir){for(const item of await readdir(dir,{withFileTypes:true})){const file=path.join(dir,item.name);if(item.isDirectory())await walk(file);else assets['/'+path.relative(publicDir,file)]={type:types[path.extname(file)]||'application/octet-stream',data:(await readFile(file)).toString('base64')};}}await walk(publicDir);
 await writeFile('.openai/local/assets.json',JSON.stringify(assets));await mkdir('dist/server',{recursive:true});
 await build({entryPoints:['server/worker.mjs'],outfile:'dist/server/index.js',bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true});
 await mkdir('dist/.openai',{recursive:true});await cp('.openai/hosting.json','dist/.openai/hosting.json');
 console.log(`Built Worker, ${Object.keys(assets).length} assets, ${products.length} products and ${products.reduce((n,p)=>n+p.variants.length,0)} options.`);
}
