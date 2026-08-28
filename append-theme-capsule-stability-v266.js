const fs=require('fs'),path=require('path');
const out=path.join(__dirname,'public');
if(!fs.existsSync(out))throw new Error('V266 B2.5 gate: public/ missing');

const cssSrc=path.join(__dirname,'ui-theme-capsule-stability-v266.css');
const cssDst=path.join(out,'css','ui-theme-capsule-stability-v266.css');
if(!fs.existsSync(cssSrc))throw new Error('V266 B2.5 gate: stability CSS missing');
fs.mkdirSync(path.dirname(cssDst),{recursive:true});
fs.copyFileSync(cssSrc,cssDst);

const runtimePath=path.join(out,'js','gear-action-capsule-v200.js');
if(!fs.existsSync(runtimePath))throw new Error('V266 B2.5 gate: V200 capsule runtime missing');
let runtime=fs.readFileSync(runtimePath,'utf8');

/* B2.5 keeps V200 as sole behavior owner, but makes open/close/indicator phases
   non-overlapping. Indicator geometry is never measured while shell width moves. */
const oldDecl="let open=false,closeTimer=0,settleTimer=0;const reducedMotion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;";
const newDecl="let open=false,closeTimer=0,settleTimer=0,openSyncTimer=0;const reducedMotion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;";
if(!runtime.includes(oldDecl))throw new Error('V266 B2.5 gate: B2.4 declaration signature changed');
runtime=runtime.replace(oldDecl,newDecl);

const oldOpen="if(next){clearTimeout(settleTimer);open=true;clone.classList.remove('is-closing');clone.classList.add('is-open');gear.setAttribute('aria-expanded','true');requestAnimationFrame(()=>requestAnimationFrame(()=>sync()));return;}";
const newOpen="if(next){clearTimeout(settleTimer);clearTimeout(openSyncTimer);open=true;clone.classList.remove('is-closing','indicator-snap');clone.classList.add('is-open','is-opening');gear.setAttribute('aria-expanded','true');clone.dataset.activeTheme=root.dataset.theme||'dark';openSyncTimer=setTimeout(()=>{if(!open)return;clone.classList.add('indicator-snap');sync(root.dataset.theme);clone.classList.remove('is-opening');requestAnimationFrame(()=>requestAnimationFrame(()=>clone.classList.remove('indicator-snap')))},reducedMotion()?1:370);return;}";
if(!runtime.includes(oldOpen))throw new Error('V266 B2.5 gate: B2.4 open signature changed');
runtime=runtime.replace(oldOpen,newOpen);

const oldCloseStart="open=false;gear.setAttribute('aria-expanded','false');if(reducedMotion()){clone.classList.remove('is-open','is-closing');return;}clone.classList.add('is-closing');clone.classList.remove('is-open');closeTimer=setTimeout(()=>clone.classList.remove('is-closing'),380)";
const newCloseStart="open=false;clearTimeout(openSyncTimer);gear.setAttribute('aria-expanded','false');if(reducedMotion()){clone.classList.remove('is-open','is-opening','is-closing','indicator-snap');return;}clone.classList.remove('is-opening','indicator-snap');clone.classList.add('is-closing');clone.classList.remove('is-open');closeTimer=setTimeout(()=>clone.classList.remove('is-closing'),400)";
if(!runtime.includes(oldCloseStart))throw new Error('V266 B2.5 gate: B2.4 close signature changed');
runtime=runtime.replace(oldCloseStart,newCloseStart);

const oldChoice="settleTimer=setTimeout(()=>setOpen(false),reducedMotion()?1:560)";
const newChoice="settleTimer=setTimeout(()=>setOpen(false),reducedMotion()?1:700)";
if(!runtime.includes(oldChoice))throw new Error('V266 B2.5 gate: B2.4 auto-close timing changed');
runtime=runtime.replace(oldChoice,newChoice);

const oldResize="new ResizeObserver(()=>{if(open)sync()}).observe(clone);";
const newResize="new ResizeObserver(()=>{if(open&&!clone.classList.contains('is-opening')&&!clone.classList.contains('is-closing'))sync(root.dataset.theme)}).observe(clone);";
if(!runtime.includes(oldResize))throw new Error('V266 B2.5 gate: ResizeObserver signature changed');
runtime=runtime.replace(oldResize,newResize);

const oldObserver="clone.dataset.activeTheme=root.dataset.theme||'dark';if(open)requestAnimationFrame(()=>sync(root.dataset.theme))";
const newObserver="clone.dataset.activeTheme=root.dataset.theme||'dark';if(open&&!clone.classList.contains('is-opening')&&!clone.classList.contains('is-closing'))requestAnimationFrame(()=>sync(root.dataset.theme))";
if(!runtime.includes(oldObserver))throw new Error('V266 B2.5 gate: theme observer signature changed');
runtime=runtime.replace(oldObserver,newObserver);

fs.writeFileSync(runtimePath,runtime);

const htmlPath=path.join(out,'index.html');
let html=fs.readFileSync(htmlPath,'utf8');
if(!html.includes('ui-theme-capsule-stability-v266.css'))html=html.replace('</head>','  <link rel="stylesheet" href="css/ui-theme-capsule-stability-v266.css?v=266b25">\n</head>');
if(!html.includes('__ARSTORE_V266_CAPSULE_STABILITY'))html=html.replace('<head>','<head>\n  <script>window.__ARSTORE_V266_CAPSULE_STABILITY=true;<\/script>');
fs.writeFileSync(htmlPath,html);

const builtRuntime=fs.readFileSync(runtimePath,'utf8');
const builtHtml=fs.readFileSync(htmlPath,'utf8');
const builtCss=fs.readFileSync(cssDst,'utf8');
const checks=[
 ['V200 owner retained',builtRuntime.includes('ARSTORE_GEAR_V200')],
 ['opening phase',builtRuntime.includes("classList.add('is-open','is-opening')")],
 ['post-open snap',builtRuntime.includes("classList.add('indicator-snap')")],
 ['opening geometry delay',builtRuntime.includes('reducedMotion()?1:370')],
 ['settled auto close',builtRuntime.includes('reducedMotion()?1:700')],
 ['old 560 close retired',!builtRuntime.includes('reducedMotion()?1:560')],
 ['resize gated',builtRuntime.includes("!clone.classList.contains('is-opening')&&!clone.classList.contains('is-closing')")],
 ['indicator hidden while opening',builtCss.includes('.theme-action-capsule.is-opening .theme-capsule-indicator')],
 ['indicator close fade',builtCss.includes('.theme-action-capsule.is-closing .theme-capsule-indicator')],
 ['css wired',builtHtml.includes('ui-theme-capsule-stability-v266.css?v=266b25')],
 ['no router authority',!builtCss.includes('data-page')]
];
const failed=checks.filter(([,ok])=>!ok).map(([name])=>name);
if(failed.length)throw new Error('V266 B2.5 gate failed: '+failed.join(', '));
console.log('V266 B2.5 PASS — indicator hidden during shell resize, snapped after open, animated only between stable theme buttons, and faded before auto-close; V200 remains sole capsule owner; engine/data/formula untouched');
