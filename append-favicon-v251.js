const fs=require('fs'),path=require('path');
const ROOT=process.cwd(),PUB=path.join(ROOT,'public'),SRC=path.join(ROOT,'assets-favicon-v251');
for(const f of ['favicon-16x16.png','favicon-32x32.png']){
  const from=path.join(SRC,f),to=path.join(PUB,f);
  if(!fs.existsSync(from)) throw new Error('V251 missing '+f);
  fs.copyFileSync(from,to);
}
const htmlPath=path.join(PUB,'index.html');
let html=fs.readFileSync(htmlPath,'utf8');
html=html.replace(/\/favicon-32x32\.png\?v=\d+/g,'/favicon-32x32.png?v=251')
         .replace(/\/favicon-16x16\.png\?v=\d+/g,'/favicon-16x16.png?v=251')
         .replace(/\/favicon\.ico\?v=\d+/g,'/favicon.ico?v=251')
         .replace(/\/apple-touch-icon\.png\?v=\d+/g,'/apple-touch-icon.png?v=251')
         .replace(/\/site\.webmanifest\?v=\d+/g,'/site.webmanifest?v=251');
fs.writeFileSync(htmlPath,html);
console.log('FAVICON V251 PASS · new 16x16 + 32x32 installed · UI/logo untouched');
