const fs=require('fs'),path=require('path');
const out=path.join(__dirname,'public');
if(!fs.existsSync(out))throw new Error('V266 B2.4 gate: public/ missing');

const cssSrc=path.join(__dirname,'ui-theme-indicator-geometry-v266.css');
const cssDst=path.join(out,'css','ui-theme-indicator-geometry-v266.css');
if(!fs.existsSync(cssSrc))throw new Error('V266 B2.4 gate: geometry CSS missing');
fs.mkdirSync(path.dirname(cssDst),{recursive:true});
fs.copyFileSync(cssSrc,cssDst);

const runtimePath=path.join(out,'js','gear-action-capsule-v200.js');
if(!fs.existsSync(runtimePath))throw new Error('V266 B2.4 gate: V200 capsule runtime missing');
let runtime=fs.readFileSync(runtimePath,'utf8');

/* B2.2 leaves V200 as the sole capsule behavior owner. Replace only its internal
   indicator measurement + theme-settle timing. No second click/router owner. */
const oldDecl="let open=false,closeTimer=0;const reducedMotion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;const sync=()=>{const active=opts.querySelector('.theme-capsule-option.active')||opts.querySelector('[data-theme-choice=\"'+(root.dataset.theme||'dark')+'\"]');if(active){opts.style.setProperty('--indicator-left',active.offsetLeft+'px');opts.style.setProperty('--indicator-width',active.offsetWidth+'px')}};";
const newDecl="let open=false,closeTimer=0,settleTimer=0;const reducedMotion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;const sync=(preferredTheme)=>{const theme=preferredTheme||root.dataset.theme||'dark';const active=opts.querySelector('[data-theme-choice=\"'+theme+'\"]')||opts.querySelector('.theme-capsule-option.active');if(!active)return;const optsRect=opts.getBoundingClientRect(),activeRect=active.getBoundingClientRect();const x=Math.max(0,activeRect.left-optsRect.left+opts.scrollLeft);opts.style.setProperty('--indicator-x',x+'px');opts.style.setProperty('--indicator-width',activeRect.width+'px');clone.dataset.activeTheme=active.dataset.themeChoice||theme};";
if(!runtime.includes(oldDecl))throw new Error('V266 B2.4 gate: B2.2 declaration signature changed');
runtime=runtime.replace(oldDecl,newDecl);

const oldOpen="if(next){open=true;clone.classList.remove('is-closing');clone.classList.add('is-open');gear.setAttribute('aria-expanded','true');requestAnimationFrame(sync);return;}";
const newOpen="if(next){clearTimeout(settleTimer);open=true;clone.classList.remove('is-closing');clone.classList.add('is-open');gear.setAttribute('aria-expanded','true');requestAnimationFrame(()=>requestAnimationFrame(()=>sync()));return;}";
if(!runtime.includes(oldOpen))throw new Error('V266 B2.4 gate: B2.2 open signature changed');
runtime=runtime.replace(oldOpen,newOpen);

const oldChoice="opts.querySelectorAll('.theme-capsule-option').forEach(btn=>btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();applyTheme(btn.dataset.themeChoice);requestAnimationFrame(sync);setTimeout(()=>setOpen(false),reducedMotion()?1:310)}));";
const newChoice="opts.querySelectorAll('.theme-capsule-option').forEach(btn=>btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();const target=btn.dataset.themeChoice;clearTimeout(settleTimer);clone.dataset.activeTheme=target;opts.querySelectorAll('.theme-capsule-option').forEach(b=>{const active=b===btn;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))});sync(target);requestAnimationFrame(()=>applyTheme(target));settleTimer=setTimeout(()=>setOpen(false),reducedMotion()?1:560)}));";
if(!runtime.includes(oldChoice))throw new Error('V266 B2.4 gate: B2.2 choice signature changed');
runtime=runtime.replace(oldChoice,newChoice);

/* When the root theme observer fires, preserve the same geometry path. */
const oldObserver="if(m.some(x=>x.attributeName==='data-theme')){document.querySelectorAll('.theme-capsule-option').forEach(b=>{const a=b.dataset.themeChoice===root.dataset.theme;b.classList.toggle('active',a);b.setAttribute('aria-pressed',String(a))});if(open)sync()}";
const newObserver="if(m.some(x=>x.attributeName==='data-theme')){document.querySelectorAll('.theme-capsule-option').forEach(b=>{const a=b.dataset.themeChoice===root.dataset.theme;b.classList.toggle('active',a);b.setAttribute('aria-pressed',String(a))});clone.dataset.activeTheme=root.dataset.theme||'dark';if(open)requestAnimationFrame(()=>sync(root.dataset.theme))}";
if(!runtime.includes(oldObserver))throw new Error('V266 B2.4 gate: observer signature changed');
runtime=runtime.replace(oldObserver,newObserver);

fs.writeFileSync(runtimePath,runtime);

const htmlPath=path.join(out,'index.html');
let html=fs.readFileSync(htmlPath,'utf8');
if(!html.includes('ui-theme-indicator-geometry-v266.css'))html=html.replace('</head>','  <link rel="stylesheet" href="css/ui-theme-indicator-geometry-v266.css?v=266b24">\n</head>');
if(!html.includes('__ARSTORE_V266_INDICATOR_GEOMETRY'))html=html.replace('<head>','<head>\n  <script>window.__ARSTORE_V266_INDICATOR_GEOMETRY=true;<\/script>');
fs.writeFileSync(htmlPath,html);

const builtRuntime=fs.readFileSync(runtimePath,'utf8');
const builtHtml=fs.readFileSync(htmlPath,'utf8');
const builtCss=fs.readFileSync(cssDst,'utf8');
const checks=[
 ['V200 owner retained',builtRuntime.includes('ARSTORE_GEAR_V200')],
 ['rect geometry',builtRuntime.includes('activeRect.left-optsRect.left')],
 ['translate var',builtCss.includes('translate3d(var(--indicator-x,6px),0,0)')],
 ['target theme immediate',builtRuntime.includes('clone.dataset.activeTheme=target')],
 ['stale auto-close retired',!builtRuntime.includes('reducedMotion()?1:310')],
 ['settled auto-close',builtRuntime.includes('reducedMotion()?1:560')],
 ['double raf open sync',builtRuntime.includes('requestAnimationFrame(()=>requestAnimationFrame(()=>sync()))')],
 ['css wired',builtHtml.includes('ui-theme-indicator-geometry-v266.css?v=266b24')],
 ['no router authority',!builtCss.includes('data-page')],
];
const failed=checks.filter(([,ok])=>!ok).map(([name])=>name);
if(failed.length)throw new Error('V266 B2.4 gate failed: '+failed.join(', '));
console.log('V266 B2.4 PASS — active indicator follows exact selected-button geometry via translate3d; target color updates immediately; theme repaint completes before auto-close; V200 remains sole capsule owner; engine/data/formula untouched');
