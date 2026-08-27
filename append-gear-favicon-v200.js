const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const htmlPath='public/index.html';
const srcDir='assets-favicon-v200';
const publicDir='public';
const sourceAssets=[
 ['favicon-16x16.png',16,'532e5a8fe7177ed1a0e5db26cb8bb0761c1177ff1e36038b19c8656ff40e5f45'],
 ['favicon-32x32.png',32,'c239837afd582d64c39e3a74fb246b807ac14c644b87eccab274ea4ee14fa7e3'],
];
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function checkPng(buf,size,name){if(buf.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw new Error('V200 bad PNG '+name);if(buf.readUInt32BE(16)!==size||buf.readUInt32BE(20)!==size)throw new Error('V200 wrong PNG size '+name)}
for(const [name,size,expected] of sourceAssets){const src=path.join(srcDir,name);if(!fs.existsSync(src))throw new Error('V200 source missing '+src);const b=fs.readFileSync(src);if(sha(b)!==expected)throw new Error('V200 hash mismatch '+name);checkPng(b,size,name);fs.writeFileSync(path.join(publicDir,name),b)}
function crc32(buf){let c=0xffffffff;for(const byte of buf){c^=byte;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0)}return (c^0xffffffff)>>>0}
function chunk(type,data){const t=Buffer.from(type);const out=Buffer.alloc(12+data.length);out.writeUInt32BE(data.length,0);t.copy(out,4);data.copy(out,8);out.writeUInt32BE(crc32(Buffer.concat([t,data])),8+data.length);return out}
function decodeRgbaPng(buf){const w=buf.readUInt32BE(16),h=buf.readUInt32BE(20),depth=buf[24],type=buf[25];if(depth!==8||type!==6)throw new Error('V200 source must be RGBA8');let off=8,idat=[];while(off<buf.length){const len=buf.readUInt32BE(off),typ=buf.toString('ascii',off+4,off+8);if(typ==='IDAT')idat.push(buf.subarray(off+8,off+8+len));off+=12+len}const raw=require('zlib').inflateSync(Buffer.concat(idat)),stride=w*4,out=Buffer.alloc(w*h*4);let prev=Buffer.alloc(stride),pos=0;for(let y=0;y<h;y++){const filter=raw[pos++],row=raw.subarray(pos,pos+stride);pos+=stride;const cur=Buffer.alloc(stride);for(let x=0;x<stride;x++){const a=x>=4?cur[x-4]:0,b=prev[x]||0,c=x>=4?(prev[x-4]||0):0;let v=row[x];if(filter===1)v=(v+a)&255;else if(filter===2)v=(v+b)&255;else if(filter===3)v=(v+Math.floor((a+b)/2))&255;else if(filter===4){const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);v=(v+(pa<=pb&&pa<=pc?a:pb<=pc?b:c))&255}else if(filter!==0)throw new Error('V200 unsupported PNG filter');cur[x]=v}cur.copy(out,y*stride);prev=cur}return {w,h,data:out}}
function encodeRgbaPng(w,h,data){const sig=Buffer.from('89504e470d0a1a0a','hex'),ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(w,0);ihdr.writeUInt32BE(h,4);ihdr[8]=8;ihdr[9]=6;const raw=Buffer.alloc(h*(1+w*4));for(let y=0;y<h;y++){raw[y*(1+w*4)]=0;data.copy(raw,y*(1+w*4)+1,y*w*4,(y+1)*w*4)}return Buffer.concat([sig,chunk('IHDR',ihdr),chunk('IDAT',require('zlib').deflateSync(raw,{level:9})),chunk('IEND',Buffer.alloc(0))])}
function resizeNearest(src,target){const out=Buffer.alloc(target*target*4);for(let y=0;y<target;y++){const sy=Math.min(src.h-1,Math.floor(y*src.h/target));for(let x=0;x<target;x++){const sx=Math.min(src.w-1,Math.floor(x*src.w/target)),si=(sy*src.w+sx)*4,di=(y*target+x)*4;src.data.copy(out,di,si,si+4)}}return encodeRgbaPng(target,target,out)}
const source=decodeRgbaPng(fs.readFileSync(path.join(publicDir,'favicon-32x32.png')));fs.writeFileSync(path.join(publicDir,'apple-touch-icon.png'),resizeNearest(source,180));fs.writeFileSync(path.join(publicDir,'android-chrome-192x192.png'),resizeNearest(source,192));fs.writeFileSync(path.join(publicDir,'android-chrome-512x512.png'),resizeNearest(source,512));
const png32=fs.readFileSync(path.join(publicDir,'favicon-32x32.png')),icoHeader=Buffer.alloc(22);icoHeader.writeUInt16LE(0,0);icoHeader.writeUInt16LE(1,2);icoHeader.writeUInt16LE(1,4);icoHeader[6]=32;icoHeader[7]=32;icoHeader.writeUInt16LE(1,10);icoHeader.writeUInt16LE(32,12);icoHeader.writeUInt32LE(png32.length,14);icoHeader.writeUInt32LE(22,18);fs.writeFileSync(path.join(publicDir,'favicon.ico'),Buffer.concat([icoHeader,png32]));
const manifest={name:'ARSTORE Tools',short_name:'ARSTORE',icons:[{src:'/android-chrome-192x192.png',sizes:'192x192',type:'image/png'},{src:'/android-chrome-512x512.png',sizes:'512x512',type:'image/png'}],theme_color:'#080b12',background_color:'#080b12',display:'standalone',start_url:'/'};
fs.writeFileSync(path.join(publicDir,'site.webmanifest'),JSON.stringify(manifest,null,2)+'\n');
const css=`/* ARSTORE V3.4 · Gear Action Capsule repair #176-#200 */
.theme-action-capsule{contain:none!important;overflow:visible!important;isolation:isolate!important;pointer-events:auto!important;z-index:1300!important}
.topbar,.topbar-actions{overflow:visible!important}
.theme-capsule-shell{contain:none!important;overflow:hidden!important;pointer-events:auto!important;z-index:3!important}
.theme-capsule-toggle{pointer-events:auto!important;cursor:pointer!important;touch-action:manipulation!important;position:relative!important;z-index:5!important}
.theme-action-capsule.is-open{width:46px!important;overflow:visible!important}
.theme-action-capsule.is-open .theme-capsule-shell{overflow:hidden!important;pointer-events:auto!important}
.theme-action-capsule.is-open .theme-capsule-options{pointer-events:auto!important;visibility:visible!important}
.theme-capsule-options{visibility:hidden}
.theme-action-capsule.is-open .theme-capsule-options{visibility:visible}
.theme-capsule-option{pointer-events:auto!important;touch-action:manipulation!important}
@media(max-width:640px){.theme-action-capsule{z-index:1350!important}.theme-action-capsule.is-open .theme-capsule-shell{max-width:calc(100vw - max(12px,env(safe-area-inset-left)) - max(12px,env(safe-area-inset-right)))!important}}
@media(prefers-reduced-motion:reduce){.theme-capsule-shell,.theme-capsule-options,.theme-gear,.theme-capsule-indicator{transition-duration:1ms!important}}
`;
const js=`(()=>{'use strict';
const root=document.documentElement,KEY='arstore_v3_theme',VALID=['light','dark','charcoal','oled'];
function applyTheme(t){if(!VALID.includes(t))return;root.dataset.theme=t;try{localStorage.setItem(KEY,t)}catch(_){};document.querySelectorAll('[data-theme-choice]').forEach(b=>{const a=b.dataset.themeChoice===t;b.classList.toggle('active',a);b.setAttribute('aria-pressed',String(a))});document.dispatchEvent(new CustomEvent('arstore:theme-change',{detail:{theme:t,source:'capsule-v200'}}));}
function boot(){const old=document.querySelector('.theme-action-capsule');if(!old)return setTimeout(boot,60);if(old.dataset.v200==='1')return;const clone=old.cloneNode(true);clone.dataset.v200='1';old.replaceWith(clone);const shell=clone.querySelector('.theme-capsule-shell'),gear=clone.querySelector('.theme-capsule-toggle'),opts=clone.querySelector('.theme-capsule-options');if(!shell||!gear||!opts)return;
gear.removeAttribute('data-page');gear.dataset.themeCapsuleToggle='';gear.setAttribute('type','button');gear.setAttribute('aria-haspopup','true');gear.setAttribute('aria-expanded','false');gear.setAttribute('aria-label','Pilih tema');
let open=false;const sync=()=>{const active=opts.querySelector('.theme-capsule-option.active')||opts.querySelector('[data-theme-choice="'+(root.dataset.theme||'dark')+'"]');if(active){opts.style.setProperty('--indicator-left',active.offsetLeft+'px');opts.style.setProperty('--indicator-width',active.offsetWidth+'px')}};
const setOpen=v=>{open=!!v;clone.classList.toggle('is-open',open);gear.setAttribute('aria-expanded',String(open));if(open)requestAnimationFrame(sync)};
gear.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();setOpen(!open)});
gear.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setOpen(!open)}});
opts.querySelectorAll('.theme-capsule-option').forEach(btn=>btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();applyTheme(btn.dataset.themeChoice);requestAnimationFrame(sync);setTimeout(()=>setOpen(false),matchMedia('(prefers-reduced-motion: reduce)').matches?1:180)}));
document.addEventListener('pointerdown',e=>{if(open&&!clone.contains(e.target))setOpen(false)},true);document.addEventListener('keydown',e=>{if(e.key==='Escape'&&open){e.preventDefault();setOpen(false);gear.focus({preventScroll:true})}if(!open)return;const bs=[...opts.querySelectorAll('.theme-capsule-option')],i=bs.indexOf(document.activeElement);if(e.key==='ArrowRight'){e.preventDefault();bs[(i+1+bs.length)%bs.length]?.focus()}if(e.key==='ArrowLeft'){e.preventDefault();bs[(i-1+bs.length)%bs.length]?.focus()}if(e.key==='Home'){e.preventDefault();bs[0]?.focus()}if(e.key==='End'){e.preventDefault();bs.at(-1)?.focus()}});
new ResizeObserver(()=>{if(open)sync()}).observe(clone);new MutationObserver(m=>{if(m.some(x=>x.attributeName==='data-theme')){document.querySelectorAll('.theme-capsule-option').forEach(b=>{const a=b.dataset.themeChoice===root.dataset.theme;b.classList.toggle('active',a);b.setAttribute('aria-pressed',String(a))});if(open)sync()}}).observe(root,{attributes:true,attributeFilter:['data-theme']});
applyTheme(VALID.includes(root.dataset.theme)?root.dataset.theme:'dark');window.ARSTORE_GEAR_V200={open:()=>setOpen(true),close:()=>setOpen(false),toggle:()=>setOpen(!open),state:()=>({open,theme:root.dataset.theme})};}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();window.addEventListener('pageshow',()=>setTimeout(boot,0));})();`;
fs.writeFileSync('public/css/gear-action-capsule-v200.css',css);fs.writeFileSync('public/js/gear-action-capsule-v200.js',js);
let html=fs.readFileSync(htmlPath,'utf8');
html=html.replace(/<link\b(?=[^>]*\brel=["'][^"']*(?:icon|manifest)[^"']*["'])[^>]*>\s*/gi,'');
const icons=`  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=200">\n  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png?v=200">\n  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png?v=200">\n  <link rel="shortcut icon" href="/favicon.ico?v=200">\n  <link rel="manifest" href="/site.webmanifest?v=200">`;
html=html.replace(/(<meta name="theme-color"[^>]*>)/i,`$1\n${icons}`);
html=html.replace('</head>',`  <link rel="stylesheet" href="css/gear-action-capsule-v200.css?v=3.4.200">\n</head>`);
html=html.replace('</body>',`  <script src="js/gear-action-capsule-v200.js?v=3.4.200"></script>\n</body>`);
fs.writeFileSync(htmlPath,html);
for(const p of ['favicon-16x16.png','favicon-32x32.png','apple-touch-icon.png','android-chrome-192x192.png','android-chrome-512x512.png','favicon.ico','site.webmanifest','css/gear-action-capsule-v200.css','js/gear-action-capsule-v200.js'])if(!fs.existsSync(path.join(publicDir,p)))throw new Error('V200 output missing '+p);
const out=fs.readFileSync(htmlPath,'utf8');for(const token of ['gear-action-capsule-v200.css','gear-action-capsule-v200.js','/site.webmanifest?v=200','/apple-touch-icon.png?v=200'])if(!out.includes(token))throw new Error('V200 HTML missing '+token);
console.log('GEAR + FAVICON V200 PASS · #176-#200 · uploaded favicon pack · no fee/formula changes');
