const fs=require('fs');
const path=require('path');
const cp=require('child_process');
const MARK='FINAL SWEEP #37–#60';
const HARDENING_MARK='FINAL #37–#60 POST-AUDIT HARDENING';
const htmlPath='public/index.html';
const cssPath='public/css/app.css';
const shellPath='public/js/v3-shell.js';
if(!fs.existsSync(htmlPath)||!fs.existsSync(cssPath)||!fs.existsSync(shellPath))throw new Error('V3.4 build output missing');

let html=fs.readFileSync(htmlPath,'utf8');
let shell=fs.readFileSync(shellPath,'utf8');
const css=fs.readFileSync('ui-final-sweep-v37-60.css','utf8');
const hardeningCss=fs.readFileSync('ui-final-hardening-v37-60.css','utf8');
const runtime=fs.readFileSync('ui-final-runtime-v37-60.js','utf8');
if(!css.includes(MARK))throw new Error('final #37-60 CSS marker missing');
if(!hardeningCss.includes(HARDENING_MARK))throw new Error('post-audit hardening marker missing');
cp.execFileSync(process.execPath,['--check','ui-final-runtime-v37-60.js'],{stdio:'inherit'});

// #37 — add OLED as a fourth persisted theme in the generated UI.
if(!html.includes('data-theme-choice="oled"')){
  html=html.replace('<button type="button" data-theme-choice="charcoal">Charcoal</button>', '<button type="button" data-theme-choice="charcoal">Charcoal</button>\n              <button type="button" data-theme-choice="oled">OLED Black</button>');
}
html=html.replace('Pilih tema gelap, terang, atau charcoal. Preferensi tersimpan di browser.','Pilih tema gelap, terang, charcoal, atau OLED Black. Preferensi tersimpan di browser.');
if(!html.includes('data-theme-choice="oled"'))throw new Error('OLED theme control patch failed');

// #44/#59 — apply saved theme before CSS paints to stop refresh flash.
const earlyTheme=`<script id="uiEarlyThemeV37">(()=>{try{const t=localStorage.getItem('arstore_v3_theme');const ok=['dark','light','charcoal','oled'];const v=ok.includes(t)?t:'dark';document.documentElement.dataset.theme=v;document.documentElement.style.background=v==='light'?'#edf1f6':v==='charcoal'?'#101114':v==='oled'?'#000':'#080b12'}catch(_){document.documentElement.dataset.theme='dark'}})();</script>`;
if(!html.includes('uiEarlyThemeV37'))html=html.replace('<meta name="theme-color" content="#080b12" />','<meta name="theme-color" content="#080b12" />\n  '+earlyTheme);

// #43/#44/#59 — favicon cache bust + canonical ICO fallback.
const FAV='v=37-60-20260826';
html=html.replace(/(href="\/assets\/favicons\/favicon-(?:16x16|32x32|48x48|180x180)\.png)(?:\?[^\"]*)?(\")/g,`$1?${FAV}$2`);
if(!html.includes('rel="shortcut icon"'))html=html.replace('<link rel="manifest" href="/site.webmanifest">','<link rel="shortcut icon" href="/favicon.ico?'+FAV+'">\n  <link rel="manifest" href="/site.webmanifest?'+FAV+'">');

// #37/#44 — extend shell theme allow-list without touching calculator/fee/DB logic.
let shellPatches=0;
shell=shell.replace("const next = (theme === 'light' || theme === 'charcoal') ? theme : 'dark';",()=>{shellPatches++;return "const next = (theme === 'light' || theme === 'charcoal' || theme === 'oled') ? theme : 'dark';";});
shell=shell.replace("metaTheme?.setAttribute('content', next === 'light' ? '#edf1f6' : next === 'charcoal' ? '#101114' : '#080b12');",()=>{shellPatches++;return "metaTheme?.setAttribute('content', next === 'light' ? '#edf1f6' : next === 'charcoal' ? '#101114' : next === 'oled' ? '#000000' : '#080b12');";});
if(shellPatches!==2)throw new Error('OLED shell patch count '+shellPatches);
fs.writeFileSync(shellPath,shell);
cp.execFileSync(process.execPath,['--check',shellPath],{stdio:'inherit'});

// #39–#60 runtime overlay.
const runtimeDst='public/js/ui-final-runtime-v37-60.js';
fs.writeFileSync(runtimeDst,runtime);
if(!html.includes('js/ui-final-runtime-v37-60.js'))html=html.replace('</body>','  <script src="js/ui-final-runtime-v37-60.js"></script>\n</body>');

// #43 — final favicon pack from the exact user-provided AR + hanger emblem crop.
function b64(name){return fs.readFileSync(path.join('assets-final',name),'utf8').trim();}
function pngFromB64(data,size,label){
  const bin=Buffer.from(data,'base64');
  if(bin.length<24||bin.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw new Error('favicon PNG signature '+label);
  if(bin.readUInt32BE(16)!==size||bin.readUInt32BE(20)!==size)throw new Error('favicon dimensions '+label);
  return bin;
}
const fav512=b64('favicon-512-v37.part1.b64')+b64('favicon-512-v37.part2.b64')+b64('favicon-512-v37.part3.b64')+b64('favicon-512-v37.part4.b64');
const favs={
  'public/assets/favicons/favicon-16x16.png':[b64('favicon-16-v34.b64'),16],
  'public/assets/favicons/favicon-32x32.png':[b64('favicon-32-v34.b64'),32],
  'public/assets/favicons/favicon-48x48.png':[b64('favicon-48-v37.b64'),48],
  'public/assets/favicons/favicon-180x180.png':[b64('favicon-180-v34.b64'),180],
  'public/assets/favicons/favicon-192x192.png':[b64('favicon-192-v34.b64'),192],
  'public/assets/favicons/favicon-512x512.png':[fav512,512]
};
let png48=null;
for(const [dest,[data,size]] of Object.entries(favs)){
  const bin=pngFromB64(data,size,dest);
  fs.mkdirSync(path.dirname(dest),{recursive:true});
  fs.writeFileSync(dest,bin);
  if(size===48)png48=bin;
}
// ICO with one PNG-compressed 48x48 image. Native browser-compatible and deterministic.
if(!png48)throw new Error('48px favicon missing for ICO');
const icoHeader=Buffer.alloc(22);
icoHeader.writeUInt16LE(0,0);icoHeader.writeUInt16LE(1,2);icoHeader.writeUInt16LE(1,4);
icoHeader[6]=48;icoHeader[7]=48;icoHeader[8]=0;icoHeader[9]=0;
icoHeader.writeUInt16LE(1,10);icoHeader.writeUInt16LE(32,12);
icoHeader.writeUInt32LE(png48.length,14);icoHeader.writeUInt32LE(22,18);
const ico=Buffer.concat([icoHeader,png48]);
fs.writeFileSync('public/favicon.ico',ico);
fs.writeFileSync('public/assets/favicons/favicon.ico',ico);

const manifest={name:'ARSTORE Tools V3.4',short_name:'ARSTORE',start_url:'/',display:'standalone',background_color:'#080b12',theme_color:'#080b12',icons:[
  {src:'/assets/favicons/favicon-192x192.png?'+FAV,sizes:'192x192',type:'image/png',purpose:'any'},
  {src:'/assets/favicons/favicon-512x512.png?'+FAV,sizes:'512x512',type:'image/png',purpose:'any maskable'}
]};
fs.writeFileSync('public/site.webmanifest',JSON.stringify(manifest,null,2)+'\n');

// Append the main final sweep, then post-audit overrides last so older hotfix
// specificity cannot clip drawer close animations or the four-theme mobile grid.
fs.appendFileSync(cssPath,'\n'+css+'\n'+hardeningCss+'\n');
html=html.replace('<html lang="id">','<html lang="id" data-ui-sweep="37-60">');
fs.writeFileSync(htmlPath,html);

// #48/#60 — static production visual gate. Fail build on missing critical pieces.
const builtCss=fs.readFileSync(cssPath,'utf8');
const builtShell=fs.readFileSync(shellPath,'utf8');
const checks=[
  ['viewport-fit',html.includes('viewport-fit=cover')],['OLED button',html.includes('data-theme-choice="oled"')],
  ['sidebar back',html.includes('id="sidebarBackBtn"')],['mobile brand',html.includes('mobile-header-brand')],
  ['runtime',html.includes('ui-final-runtime-v37-60.js')],['favicon 16',fs.existsSync('public/assets/favicons/favicon-16x16.png')],
  ['favicon 512',fs.existsSync('public/assets/favicons/favicon-512x512.png')],['favicon ICO',fs.existsSync('public/favicon.ico')],
  ['manifest',fs.existsSync('public/site.webmanifest')],['CSS marker',builtCss.includes(MARK)],
  ['OLED CSS',builtCss.includes('html[data-theme="oled"]')],['shell OLED',builtShell.includes("theme === 'oled'")],
  ['history runtime',runtime.includes('__arIdx')],['pop capture',runtime.includes('{capture:true}')],
  ['swipe underlay',builtCss.includes('.ui-swipe-underlay')],['hardening marker',builtCss.includes(HARDENING_MARK)],
  ['four theme grid',builtCss.includes('grid-template-columns:repeat(2,minmax(0,1fr))')]
];
const failed=checks.filter(([,ok])=>!ok).map(([name])=>name);
if(failed.length)throw new Error('FINAL #37-60 gate failed: '+failed.join(', '));
console.log('V3.4 FINAL #37-60 appended · OLED + motion + iOS history + AR hanger favicon + post-audit hardening PASS');
