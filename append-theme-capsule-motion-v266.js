const fs=require('fs'),path=require('path');
const out=path.join(__dirname,'public');
if(!fs.existsSync(out))throw new Error('V266 B2.2 gate: public/ missing');

const cssSrc=path.join(__dirname,'ui-theme-capsule-motion-v266.css');
const cssDst=path.join(out,'css','ui-theme-capsule-motion-v266.css');
if(!fs.existsSync(cssSrc))throw new Error('V266 B2.2 gate: capsule CSS missing');
fs.mkdirSync(path.dirname(cssDst),{recursive:true});
fs.copyFileSync(cssSrc,cssDst);

const runtimePath=path.join(out,'js','gear-action-capsule-v200.js');
if(!fs.existsSync(runtimePath))throw new Error('V266 B2.2 gate: V200 capsule runtime missing');
let runtime=fs.readFileSync(runtimePath,'utf8');

/* Keep V200 as the single behavior owner. Add an explicit closing phase so
   removing is-open cannot instantly hide the option strip, and defer the
   theme-triggered auto-close until the theme paint transition has settled. */
const oldSet="let open=false;const sync=()=>{const active=opts.querySelector('.theme-capsule-option.active')||opts.querySelector('[data-theme-choice=\"'+(root.dataset.theme||'dark')+'\"]');if(active){opts.style.setProperty('--indicator-left',active.offsetLeft+'px');opts.style.setProperty('--indicator-width',active.offsetWidth+'px')}};\nconst setOpen=v=>{open=!!v;clone.classList.toggle('is-open',open);gear.setAttribute('aria-expanded',String(open));if(open)requestAnimationFrame(sync)};";
const newSet="let open=false,closeTimer=0;const reducedMotion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;const sync=()=>{const active=opts.querySelector('.theme-capsule-option.active')||opts.querySelector('[data-theme-choice=\"'+(root.dataset.theme||'dark')+'\"]');if(active){opts.style.setProperty('--indicator-left',active.offsetLeft+'px');opts.style.setProperty('--indicator-width',active.offsetWidth+'px')}};\nconst setOpen=v=>{const next=!!v;clearTimeout(closeTimer);if(next){open=true;clone.classList.remove('is-closing');clone.classList.add('is-open');gear.setAttribute('aria-expanded','true');requestAnimationFrame(sync);return;}if(!open&&!clone.classList.contains('is-open'))return;open=false;gear.setAttribute('aria-expanded','false');if(reducedMotion()){clone.classList.remove('is-open','is-closing');return;}clone.classList.add('is-closing');clone.classList.remove('is-open');closeTimer=setTimeout(()=>clone.classList.remove('is-closing'),380)};";
if(!runtime.includes(oldSet))throw new Error('V266 B2.2 gate: V200 setOpen signature changed');
runtime=runtime.replace(oldSet,newSet);

const oldAuto="setTimeout(()=>setOpen(false),matchMedia('(prefers-reduced-motion: reduce)').matches?1:180)";
const newAuto="setTimeout(()=>setOpen(false),reducedMotion()?1:310)";
if(!runtime.includes(oldAuto))throw new Error('V266 B2.2 gate: V200 auto-close signature changed');
runtime=runtime.replace(oldAuto,newAuto);
fs.writeFileSync(runtimePath,runtime);

const htmlPath=path.join(out,'index.html');
let html=fs.readFileSync(htmlPath,'utf8');
if(!html.includes('ui-theme-capsule-motion-v266.css'))html=html.replace('</head>','  <link rel="stylesheet" href="css/ui-theme-capsule-motion-v266.css?v=266b22">\n</head>');
if(!html.includes('__ARSTORE_V266_CAPSULE_MOTION'))html=html.replace('<head>','<head>\n  <script>window.__ARSTORE_V266_CAPSULE_MOTION=true;<\/script>');
fs.writeFileSync(htmlPath,html);

const builtRuntime=fs.readFileSync(runtimePath,'utf8');
const builtHtml=fs.readFileSync(htmlPath,'utf8');
const builtCss=fs.readFileSync(cssDst,'utf8');
const checks=[
 ['V200 owner retained',builtRuntime.includes('ARSTORE_GEAR_V200')],
 ['closing lifecycle',builtRuntime.includes("classList.add('is-closing')")],
 ['close cleanup',builtRuntime.includes("classList.remove('is-closing')")],
 ['theme settle delay',builtRuntime.includes('reducedMotion()?1:310')],
 ['legacy 180 close retired',!builtRuntime.includes("matchMedia('(prefers-reduced-motion: reduce)').matches?1:180")],
 ['capsule css wired',builtHtml.includes('ui-theme-capsule-motion-v266.css?v=266b22')],
 ['closing css',builtCss.includes('.theme-action-capsule.is-closing .theme-capsule-options')],
 ['no router authority',!builtCss.includes('data-page')],
];
const failed=checks.filter(([,ok])=>!ok).map(([name])=>name);
if(failed.length)throw new Error('V266 B2.2 gate failed: '+failed.join(', '));
console.log('V266 B2.2 PASS — theme capsule open/close has explicit closing lifecycle; theme-triggered close waits for paint transition; V200 remains sole capsule owner; router/data/formula untouched');