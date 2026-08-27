const fs=require('fs'),path=require('path');
const ROOT=process.cwd(),PUB=path.join(ROOT,'public'),SRC=path.join(ROOT,'assets-favicon-v253');
for(const f of ['favicon-16x16.png','favicon-32x32.png']){
  const from=path.join(SRC,f),to=path.join(PUB,f);
  if(!fs.existsSync(from)) throw new Error('V253 missing '+f);
  fs.copyFileSync(from,to);
}
const manifest={name:'ARSTORE Tools V3',short_name:'ARSTORE',theme_color:'#ffffff',background_color:'#ffffff',display:'standalone'};
fs.writeFileSync(path.join(PUB,'site.webmanifest'),JSON.stringify(manifest));
const htmlPath=path.join(PUB,'index.html');
let html=fs.readFileSync(htmlPath,'utf8');
html=html.replace(/<link[^>]+rel=["'](?:shortcut )?icon["'][^>]*>\s*/gi,'')
         .replace(/<link[^>]+rel=["']manifest["'][^>]*>\s*/gi,'');
const tags='  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png?v=253">\n  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png?v=253">\n  <link rel="manifest" href="/site.webmanifest?v=253">\n';
html=html.replace('</head>',tags+'</head>');
fs.writeFileSync(htmlPath,html);
console.log('FAVICON V253 PASS · square package 16/32 primary · manifest named · UI/logo untouched');
