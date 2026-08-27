const fs=require('fs'),path=require('path');
const ROOT=process.cwd(),PUB=path.join(ROOT,'public');
const src=path.join(ROOT,'favicon-v254.svg'),dst=path.join(PUB,'favicon-v254.svg');
if(!fs.existsSync(src)) throw new Error('V254 missing favicon-v254.svg');
fs.copyFileSync(src,dst);
const manifest={name:'ARSTORE Tools V3',short_name:'ARSTORE',icons:[{src:'/android-chrome-192x192.png?v=254',sizes:'192x192',type:'image/png'},{src:'/android-chrome-512x512.png?v=254',sizes:'512x512',type:'image/png'}],theme_color:'#ffffff',background_color:'#ffffff',display:'standalone'};
fs.writeFileSync(path.join(PUB,'site.webmanifest'),JSON.stringify(manifest,null,2));
const htmlPath=path.join(PUB,'index.html');
let html=fs.readFileSync(htmlPath,'utf8');
html=html.replace(/<link[^>]+rel=["'](?:shortcut )?icon["'][^>]*>\s*/gi,'')
         .replace(/<link[^>]+rel=["']apple-touch-icon["'][^>]*>\s*/gi,'')
         .replace(/<link[^>]+rel=["']manifest["'][^>]*>\s*/gi,'');
const tags='  <link rel="icon" type="image/svg+xml" href="/favicon-v254.svg?v=254">\n  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png?v=254">\n  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png?v=254">\n  <link rel="shortcut icon" href="/favicon.ico?v=254">\n  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=254">\n  <link rel="manifest" href="/site.webmanifest?v=254">\n';
html=html.replace('</head>',tags+'</head>');
fs.writeFileSync(htmlPath,html);
console.log('FAVICON V254 PASS · square SVG HD primary · PNG/ICO fallback · UI/logo untouched');
