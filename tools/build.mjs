import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const destination=path.resolve(root,'dist');
// Only this generated, repository-owned directory may be replaced by a build.
if(path.dirname(destination)!==root||path.basename(destination)!=='dist')throw Error('Unsafe build target');
try{if((await fs.lstat(destination)).isSymbolicLink())throw Error('Refusing linked build directory');}catch(error){if(error.code!=='ENOENT')throw error;}
await fs.rm(destination,{recursive:true,force:true});
await fs.mkdir(path.join(destination,'assets'),{recursive:true});
await build({entryPoints:[path.join(root,'src/main.js')],outfile:path.join(destination,'assets/showroom.js'),bundle:true,format:'esm',platform:'browser',target:['es2022'],minify:true,legalComments:'eof',metafile:true,logLevel:'info'}).then(async result=>{
  await fs.mkdir(path.join(root,'.preview'),{recursive:true});
  await fs.writeFile(path.join(root,'.preview/build-meta.json'),JSON.stringify(result.metafile,null,2));
});
for(const filename of ['index.html','admin.html'])await fs.copyFile(path.join(root,filename),path.join(destination,filename));
for(const filename of ['config.js','local-preview.js','product-image-sources.js','favicon.svg','fonts.css','THREE-LICENSE.txt','styles.css','admin.css','admin.js','admin-email.js','admin-invoice-link.js','admin-biteship.js']){
  await fs.copyFile(path.join(root,'assets',filename),path.join(destination,'assets',filename));
}
await fs.cp(path.join(root,'assets/fonts'),path.join(destination,'assets/fonts'),{recursive:true});
for(const directory of ['cutout','products'])await fs.cp(path.join(root,'assets/images',directory),path.join(destination,'assets/images',directory),{recursive:true});
for(const filename of ['qris-extreme-studios.jpeg'])await fs.copyFile(path.join(root,'assets/images',filename),path.join(destination,'assets/images',filename));
console.log(`Built Three.js showroom: ${destination}`);
