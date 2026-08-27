const fs=require('fs'),path=require('path');
const ROOT=process.cwd(),PUB=path.join(ROOT,'public'),SRC=path.join(ROOT,'assets-favicon-v256');
for(const f of ['favicon-16x16.png','favicon-32x32.png']){
  const from=path.join(SRC,f),to=path.join(PUB,f);
  if(!fs.existsSync(from)) throw new Error('V256 missing '+f);
  fs.copyFileSync(from,to);
}
const svgCandidates=[path.join(ROOT,'favicon-v256.svg'),path.join(SRC,'favicon.svg')];
const svgSrc=svgCandidates.find(fs.existsSync);
if(svgSrc) fs.copyFileSync(svgSrc,path.join(PUB,'favicon-v256.svg'));
const manifest={name:'ARSTORE Tools V3',short_name:'ARSTORE',icons:[{src:'/favicon-32x32.png?v=256',sizes:'32x32',type:'image/png'},{src:'/favicon-16x16.png?v=256',sizes:'16x16',type:'image/png'}],theme_color:'#ffffff',background_color:'#ffffff',display:'standalone'};
fs.writeFileSync(path.join(PUB,'site.webmanifest'),JSON.stringify(manifest,null,2));
const htmlPath=path.join(PUB,'index.html');
let html=fs.readFileSync(htmlPath,'utf8');
html=html.replace(/<link[^>]+rel=["'](?:shortcut )?icon["'][^>]*>\s*/gi,'').replace(/<link[^>]+rel=["']manifest["'][^>]*>\s*/gi,'');
const svgTag=svgSrc?'  <link rel="icon" type="image/svg+xml" href="/favicon-v256.svg?v=256">\n':'';
const tags=svgTag+'  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png?v=256">\n  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png?v=256">\n  <link rel="manifest" href="/site.webmanifest?v=256">\n';
html=html.replace('</head>',tags+'</head>');
fs.writeFileSync(htmlPath,html);
console.log('FAVICON V256 PASS · new AR package staged · SVG primary when present · PNG fallback · UI/logo untouched');
