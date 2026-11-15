import {spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
const chrome='/tmp/mello-v3-browser/chrome/mac_arm-157.0.8103.78/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const dir='/Users/leowong/Documents/Codex/2026-11-13/https-dailypremium1-com-https-dailypremium1-com/outputs/daliy-premium/docs/mello-v3/evidence';
const summary=[];
for(const run of [1,2,3])for(const device of ['mobile','desktop'])for(const phase of ['before','after']){
 const url=`http://127.0.0.1:${phase==='before'?3188:3189}/`,file=`${dir}/lighthouse-${phase}-${device}-${run}.json`;
 const result=spawnSync(process.execPath,['/tmp/mello-v3-tools/node_modules/lighthouse/cli/index.js',url,'--quiet','--chrome-flags=--headless','--only-categories=performance,accessibility,best-practices,seo','--output=json',`--output-path=${file}`,...(device==='desktop'?['--preset=desktop']:[])],{env:{...process.env,CHROME_PATH:chrome},encoding:'utf8',timeout:120000});
 if(result.status!==0){console.log(JSON.stringify({phase,device,run,error:result.stderr.slice(-1000)}));continue;}
 const r=JSON.parse(readFileSync(file));const row={phase,device,run,url,lighthouseVersion:r.lighthouseVersion,fetchTime:r.fetchTime,scores:Object.fromEntries(Object.entries(r.categories).map(([k,v])=>[k,v.score*100])),lcp:r.audits['largest-contentful-paint'].numericValue,cls:r.audits['cumulative-layout-shift'].numericValue,tbt:r.audits['total-blocking-time'].numericValue};summary.push(row);writeFileSync(`${dir}/lighthouse-summary.json`,JSON.stringify(summary,null,2));console.log(JSON.stringify(row));
}
