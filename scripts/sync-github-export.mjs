import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';

const checkout=process.cwd();
const built=resolve(checkout,'dist/client');
const github=resolve(checkout,'work/github-export');
if (!existsSync(join(built,'index.html')) || !readFileSync(join(built,'publications.html'),'utf8').includes('Leading author papers')) throw new Error('Build the revised website before exporting.');
mkdirSync(github,{recursive:true});
for (const name of ['index.html','404.html','publications.html','presentations.html','index.rsc','publications.rsc','presentations.rsc','vinext-client-entry-manifest.json','visitor-snapshot.json','_next']) {
  if (existsSync(join(built,name))) cpSync(join(built,name),join(github,name),{recursive:true});
}
writeFileSync(join(github,'.nojekyll'),'\n');
console.log(`GitHub static export prepared: ${github}`);
