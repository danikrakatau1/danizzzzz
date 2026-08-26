const fs=require('fs');
const path=require('path');
const cp=require('child_process');
const MARK='FINAL SWEEP #37–#60';
const htmlPath='public/index.html';
const cssPath='public/css/app.css';
const shellPath='public/js/v3-shell.js';
if(!fs.existsSync(htmlPath)||!fs.existsSync(cssPath)||!fs.existsSync(shellPath))throw new Error('V3.4 build output missing');

let html=fs.readFileSync(htmlPath,'utf8');
let shell=fs.readFileSync(shellPath,'utf8');
const css=fs.readFileSync('ui-final-sweep-v37-60.css','utf8');
const runtime=fs.readFileSync('ui-final-runtime-v37-60.js','utf8');
if(!css.includes(MARK))throw new Error('final #37-60 CSS marker missing');
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

// Theme-aware favicon cache bust + canonical ICO fallback.
const FAV='v=37-60-20260826';
html=html.replace(/(href="\/assets\/favicons\/favicon-(?:16x16|32x32|48x48|180x180)\.png)(?:\?[^\"]*)?(\")/g,`$1?${FAV}$2`);
if(!html.includes('rel="shortcut icon"'))html=html.replace('<link rel="manifest" href="/site.webmanifest">','<link rel="shortcut icon" href="/favicon.ico?'+FAV+'">\n  <link rel="manifest" href="/site.webmanifest?'+FAV+'">');

// #37/#44 — extend shell theme allow-list without touching any engine logic.
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

// #43 — final favicon pack from the exact user-provided AR emblem crop.
function b64(name){return fs.readFileSync(path.join('assets-final',name),'utf8').trim();}
const favs={
  'public/assets/favicons/favicon-16x16.png':['favicon-16-v34.b64',16],
  'public/assets/favicons/favicon-32x32.png':['favicon-32-v34.b64',32],
  'public/assets/favicons/favicon-48x48.png':['favicon-48-v37.b64',48],
  'public/assets/favicons/favicon-180x180.png':['favicon-180-v34.b64',180],
  'public/assets/favicons/favicon-192x192.png':['favicon-192-v34.b64',192],
  'public/assets/favicons/favicon-512x512.png':['favicon-512-v37.b64',512]
};
for(const [dest,[src,size]] of Object.entries(favs)){
  const bin=Buffer.from(b64(src),'base64');
  if(bin.length<24||bin.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw new Error('favicon PNG signature '+dest);
  if(bin.readUInt32BE(16)!==size||bin.readUInt32BE(20)!==size)throw new Error('favicon dimensions '+dest);
  fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,bin);
}
const ico=Buffer.from(b64('favicon-v37.ico.b64'),'base64');
if(ico.length<10||ico[0]!==0||ico[1]!==0||ico[2]!==1||ico[3]!==0)throw new Error('favicon ICO signature');
fs.writeFileSync('public/favicon.ico',ico);fs.writeFileSync('public/assets/favicons/favicon.ico',ico);

const manifest={name:'ARSTORE Tools V3.4',short_name:'ARSTORE',start_url:'/',display:'standalone',background_color:'#080b12',theme_color:'#080b12',icons:[
  {src:'/assets/favicons/favicon-192x192.png?'+FAV,sizes:'192x192',type:'image/png',purpose:'any'},
  {src:'/assets/favicons/favicon-512x512.png?'+FAV,sizes:'512x512',type:'image/png',purpose:'any maskable'}
]};
fs.writeFileSync('public/site.webmanifest',JSON.stringify(manifest,null,2)+'\n');

fs.appendFileSync(cssPath,'\n'+css+'\n');
html=html.replace('<html lang="id">','<html lang="id" data-ui-sweep="37-60">');
fs.writeFileSync(htmlPath,html);

// #48/#60 — static production visual gate. Fail build on missing critical pieces.
const checks=[
  ['viewport-fit',html.includes('viewport-fit=cover')],['OLED button',html.includes('data-theme-choice="oled"')],
  ['sidebar back',html.includes('id="sidebarBackBtn"')],['mobile brand',html.includes('mobile-header-brand')],
  ['runtime',html.includes('ui-final-runtime-v37-60.js')],['favicon 16',fs.existsSync('public/assets/favicons/favicon-16x16.png')],
  ['favicon 512',fs.existsSync('public/assets/favicons/favicon-512x512.png')],['manifest',fs.existsSync('public/site.webmanifest')],
  ['CSS marker',fs.readFileSync(cssPath,'utf8').includes(MARK)],['shell OLED',fs.readFileSync(shellPath,'utf8').includes("theme === 'oled'")]
];
const failed=checks.filter(([,ok])=>!ok).map(([name])=>name);if(failed.length)throw new Error('FINAL #37-60 gate failed: '+failed.join(', '));
console.log('V3.4 FINAL #37-60 appended · OLED + motion + iOS history + favicon + visual gate PASS');
