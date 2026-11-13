import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const url='https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap';
const response=await fetch(url,{headers:{'User-Agent':'Mozilla/5.0 Chrome/131.0.0.0 Safari/537.36'},signal:AbortSignal.timeout(30000)});
if(!response.ok)throw Error(`Font stylesheet HTTP${response.status}`);
let css=await response.text();
const sources=[...new Set([...css.matchAll(/url\((https:[^)]+)\)/g)].map(match=>match[1]))];
const directory=path.join(root,'assets/fonts');await fs.mkdir(directory,{recursive:true});
for(const [index,source] of sources.entries()){
  const result=await fetch(source,{signal:AbortSignal.timeout(30000)});if(!result.ok)throw Error(`Font HTTP${result.status}`);
  const extension=new URL(source).pathname.endsWith('.woff2')?'woff2':'ttf';
  const filename=`atelier-${String(index+1).padStart(2,'0')}.${extension}`;
  await fs.writeFile(path.join(directory,filename),Buffer.from(await result.arrayBuffer()));
  css=css.replaceAll(source,`./fonts/${filename}`);
}
await fs.writeFile(path.join(root,'assets/fonts.css'),`/* Cormorant Garamond + Plus Jakarta Sans, locally cached from Google Fonts. */\n${css}`);
await fs.writeFile(path.join(directory,'sources.json'),JSON.stringify({stylesheet:url,sources},null,2));
console.log(`Vendored ${sources.length} font files.`);
