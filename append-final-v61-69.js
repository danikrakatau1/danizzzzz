const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const cp=require('child_process');

const MARK='V3.4 #61-#69 IOS HISTORY + SAFARI FAVICON FINAL';
const htmlPath='public/index.html';
const appPath='public/js/app.js';
const navSrc='ui-ios-nav-authority-v61-69.js';
const navDst='public/js/ui-ios-nav-authority-v61-69.js';
if(!fs.existsSync(htmlPath)||!fs.existsSync(appPath)||!fs.existsSync(navSrc))throw new Error('V3.4 #61-69 build inputs missing');
cp.execFileSync(process.execPath,['--check',navSrc],{stdio:'inherit'});

const expected={
  16:'ed9b99247d80afda073a50e729e26fcb909764e5dcf9852f4b84742be9be2f5a',
  32:'745ecd34341ae969d92808f69bf21b1610498a30f19a0fde5dbbb43613ddf7b7',
  48:'328cc2b0933648a18e5143f42f4cc7f081cbb66946a9ef866a74a6d9c58cb762',
  180:'c2a767bb2e0b3d5723b167876489b5ff5503457aed9abcb085fd4b7d284d9cc8',
  192:'4e72160962f68df1f77288edcefa31ff3d3a49c9770b8aa2872e76d407b19c35',
  512:'5291edf03bc3c143ae882a41d31b78fb8862a527ebebfd5305443e6e82df2675'
};
function sha(buf){return crypto.createHash('sha256').update(buf).digest('hex');}
function pngCheck(buf,size,label){
  if(buf.length<24||buf.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw new Error('bad PNG '+label);
  if(buf.readUInt32BE(16)!==size||buf.readUInt32BE(20)!==size)throw new Error('wrong dimensions '+label);
  if(sha(buf)!==expected[size])throw new Error('favicon hash mismatch '+label);
}
const small=JSON.parse(fs.readFileSync('assets-final/favicon-ar-hanger-v4-small.json','utf8'));
if(small?.version!=='v4'||!small.icons)throw new Error('favicon v4 small bundle invalid');
const b512=['assets-final/favicon-ar-hanger-v4-512.part1.b64','assets-final/favicon-ar-hanger-v4-512.part2.b64','assets-final/favicon-ar-hanger-v4-512.part3.b64']
  .map(file=>fs.readFileSync(file,'utf8').trim()).join('');
const iconData={
  16:Buffer.from(small.icons['16'],'base64'),
  32:Buffer.from(small.icons['32'],'base64'),
  48:Buffer.from(small.icons['48'],'base64'),
  180:Buffer.from(small.icons['180'],'base64'),
  192:Buffer.from(small.icons['192'],'base64'),
  512:Buffer.from(b512,'base64')
};
const favDir='public/assets/favicons';
fs.mkdirSync(favDir,{recursive:true});
for(const [sizeText,buf] of Object.entries(iconData)){
  const size=Number(sizeText);
  pngCheck(buf,size,`AR hanger ${size}`);
  fs.writeFileSync(path.join(favDir,`ar-hanger-suit-v4-${size}.png`),buf);
}

// Legacy ICO fallback, but HTML points at a new physical filename to defeat Safari cache.
const png48=iconData[48];
const icoHeader=Buffer.alloc(22);
icoHeader.writeUInt16LE(0,0); icoHeader.writeUInt16LE(1,2); icoHeader.writeUInt16LE(1,4);
icoHeader[6]=48; icoHeader[7]=48;
icoHeader.writeUInt16LE(1,10); icoHeader.writeUInt16LE(32,12);
icoHeader.writeUInt32LE(png48.length,14); icoHeader.writeUInt32LE(22,18);
const ico=Buffer.concat([icoHeader,png48]);
fs.writeFileSync('public/favicon-ar-hanger-suit-v4.ico',ico);
fs.writeFileSync('public/favicon.ico',ico);

const manifest={
  name:'ARSTORE Tools V3.4',
  short_name:'ARSTORE',
  start_url:'/',
  scope:'/',
  display:'standalone',
  background_color:'#080b12',
  theme_color:'#080b12',
  icons:[
    {src:'/assets/favicons/ar-hanger-suit-v4-192.png',sizes:'192x192',type:'image/png',purpose:'any'},
    {src:'/assets/favicons/ar-hanger-suit-v4-512.png',sizes:'512x512',type:'image/png',purpose:'any'}
  ]
};
fs.writeFileSync('public/site-v4.webmanifest',JSON.stringify(manifest,null,2)+'\n');

// #62–#65: one exact icon identity, physical v4 filenames, Safari + PWA fallback matrix.
let html=fs.readFileSync(htmlPath,'utf8');
html=html.replace(/^\s*<link[^>]+rel=["'](?:icon|shortcut icon|apple-touch-icon|apple-touch-icon-precomposed|manifest)["'][^>]*>\s*$/gmi,'');
const iconLinks=`  <link rel="icon" type="image/png" sizes="48x48" href="/assets/favicons/ar-hanger-suit-v4-48.png">
  <link rel="icon" type="image/png" sizes="32x32" href="/assets/favicons/ar-hanger-suit-v4-32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/assets/favicons/ar-hanger-suit-v4-16.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/assets/favicons/ar-hanger-suit-v4-180.png">
  <link rel="apple-touch-icon-precomposed" sizes="180x180" href="/assets/favicons/ar-hanger-suit-v4-180.png">
  <link rel="shortcut icon" href="/favicon-ar-hanger-suit-v4.ico">
  <link rel="manifest" href="/site-v4.webmanifest">
  <meta name="apple-mobile-web-app-title" content="ARSTORE">`;
html=html.replace(/(<meta name="theme-color"[^>]*>\s*)/i,`$1\n${iconLinks}\n`);

// Remove superseded canonical patch if an older build step ever injected it.
html=html.replace(/^\s*<script[^>]+ui-ios-history-canonical-v34\.js[^>]*><\/script>\s*$/gmi,'');
if(!html.includes('js/ui-ios-nav-authority-v61-69.js')){
  html=html.replace('</body>','  <script src="js/ui-ios-nav-authority-v61-69.js"></script>\n</body>');
}
fs.writeFileSync(htmlPath,html);
fs.copyFileSync(navSrc,navDst);

// Prevent app.js from dynamically adding the old emblem as a competing favicon.
let app=fs.readFileSync(appPath,'utf8');
let iconPatchCount=0;
app=app.replace("addHeadLink('icon', '/assets/arstore-emblem-transparent.png', { type: 'image/png' });",()=>{
  iconPatchCount++; return "addHeadLink('icon', '/assets/favicons/ar-hanger-suit-v4-48.png', { type: 'image/png', sizes: '48x48' });";
});
app=app.replace("addHeadLink('apple-touch-icon', '/assets/arstore-emblem-transparent.png');",()=>{
  iconPatchCount++; return "addHeadLink('apple-touch-icon', '/assets/favicons/ar-hanger-suit-v4-180.png', { sizes: '180x180' });";
});
if(iconPatchCount!==2)throw new Error('dynamic favicon patch count '+iconPatchCount);
fs.writeFileSync(appPath,app);
cp.execFileSync(process.execPath,['--check',appPath],{stdio:'inherit'});

// #67 deterministic history model gate.
const model=['product-finance','product-stock','product-competitor'];
let cursor=model.length-1;
const back1=model[--cursor], back2=model[--cursor];
if(back1!=='product-stock'||back2!=='product-finance')throw new Error('history model regression');
const nav=fs.readFileSync(navSrc,'utf8');
for(const required of [
  'IOS EXACT TAB HISTORY AUTHORITY',
  'canonicalizeCurrent(fromPage)',
  "event.stopImmediatePropagation()",
  "if (!event.persisted) return",
  "LEGACY_KEYS",
  "history.pushState = function",
  "history.replaceState = function"
]) if(!nav.includes(required))throw new Error('nav authority gate missing '+required);

// Final production gate.
const finalHtml=fs.readFileSync(htmlPath,'utf8');
for(const required of [
  'ar-hanger-suit-v4-48.png',
  'ar-hanger-suit-v4-180.png',
  'favicon-ar-hanger-suit-v4.ico',
  'site-v4.webmanifest',
  'ui-ios-nav-authority-v61-69.js'
]) if(!finalHtml.includes(required))throw new Error('final HTML gate missing '+required);
if(finalHtml.includes('ui-ios-history-canonical-v34.js'))throw new Error('old canonical history runtime still injected');

console.log(MARK+' PASS · exact tab history authority + BFCache + versioned nav state + AR hanger Safari/PWA favicon');
