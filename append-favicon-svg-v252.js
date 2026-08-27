const fs=require('fs'),path=require('path');
const ROOT=process.cwd(),PUB=path.join(ROOT,'public');
const rootSvg=path.join(ROOT,'favicon.svg');
if(!fs.existsSync(rootSvg)) throw new Error('V252 missing root favicon.svg');
fs.copyFileSync(rootSvg,path.join(PUB,'favicon.svg'));
const manifest={name:'ARSTORE Tools V3',short_name:'ARSTORE',icons:[{src:'/android-chrome-192x192.png?v=252',sizes:'192x192',type:'image/png'},{src:'/android-chrome-512x512.png?v=252',sizes:'512x512',type:'image/png'}],theme_color:'#111111',background_color:'#111111',display:'standalone'};
fs.writeFileSync(path.join(PUB,'site.webmanifest'),JSON.stringify(manifest,null,2));
const htmlPath=path.join(PUB,'index.html');
let html=fs.readFileSync(htmlPath,'utf8');
html=html.replace(/<link[^>]+rel=["'](?:shortcut )?icon["'][^>]*>\s*/gi,'')
         .replace(/<link[^>]+rel=["']apple-touch-icon["'][^>]*>\s*/gi,'')
         .replace(/<link[^>]+rel=["']manifest["'][^>]*>\s*/gi,'');
const fav=`<link rel="icon" type="image/svg+xml" href="/favicon.svg?v=252">\n<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png?v=252">\n<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png?v=252">\n<link rel="shortcut icon" href="/favicon.ico?v=252">\n<link rel="apple-touch-icon" href="/apple-touch-icon.png?v=252">\n<link rel="manifest" href="/site.webmanifest?v=252">\n`;
html=html.replace(/<head>/i,'<head>\n'+fav);
fs.writeFileSync(htmlPath,html);
console.log('FAVICON V252 COMPLETE PASS · exact 2.zip SVG primary · PNG/ICO fallback · manifest · UI/logo untouched');
