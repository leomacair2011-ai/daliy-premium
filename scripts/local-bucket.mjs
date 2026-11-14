import {mkdir,writeFile,readFile,unlink} from 'node:fs/promises';
import path from 'node:path';
export function localBucket(directory='.openai/local/uploads'){
 const resolve=key=>{if(!/^products\/[a-f0-9-]{36}$/.test(key))throw Error('Invalid storage key');return path.join(directory,key)};
 return {async put(key,value){const file=resolve(key);await mkdir(path.dirname(file),{recursive:true});await writeFile(file,value)},async get(key){try{return {body:await readFile(resolve(key))}}catch(e){if(e.code==='ENOENT')return null;throw e}},async delete(key){await unlink(resolve(key)).catch(e=>{if(e.code!=='ENOENT')throw e})}};
}
