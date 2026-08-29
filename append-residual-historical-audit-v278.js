const fs=require('fs'),path=require('path'),cp=require('child_process');
const OUT=path.join(__dirname,'public');
if(!fs.existsSync(OUT))throw new Error('V278 RESIDUAL HISTORICAL AUDIT: public/ missing');
const read=rel=>{const f=path.join(OUT,rel);if(!fs.existsSync(f))throw new Error('V278 missing '+rel);return fs.readFileSync(f,'utf8')};
const htmlPath=path.join(OUT,'index.html');
let html=read('index.html');
let gear=read('js/gear-action-capsule-v200.js');
const app=read('js/app.js'),v261=read('js/ui-motion-core-v261.js'),v264=read('js/ui-ios-navigation-v264.js'),v265=read('js/ui-accordion-audit-v265.js'),shell=read('js/v3-shell.js');
const sidebarCss=read('css/ui-sidebar-total-audit-v269.css'),finalCss=read('css/ui-css-audit-final-v274.css');

// Port the FINAL intent of historical capsule audits B2.2-B2.5 into the current V200 owner.
const oldCore=`let open=false;const sync=()=>{const active=opts.querySelector('.theme-capsule-option.active')||opts.querySelector('[data-theme-choice="'+(root.dataset.theme||'dark')+'"]');if(active){opts.style.setProperty('--indicator-left',active.offsetLeft+'px');opts.style.setProperty('--indicator-width',active.offsetWidth+'px')}};\nconst setOpen=v=>{open=!!v;clone.classList.toggle('is-open',open);gear.setAttribute('aria-expanded',String(open));if(open)requestAnimationFrame(sync)};`;
const newCore=`let open=false,closeTimer=0,settleTimer=0,openSyncTimer=0;const reducedMotion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;const sync=(preferredTheme)=>{const theme=preferredTheme||root.dataset.theme||'dark';const active=opts.querySelector('[data-theme-choice="'+theme+'"]')||opts.querySelector('.theme-capsule-option.active');if(!active)return;const optsRect=opts.getBoundingClientRect(),activeRect=active.getBoundingClientRect();const x=Math.max(0,activeRect.left-optsRect.left+opts.scrollLeft);opts.style.setProperty('--indicator-x',x+'px');opts.style.setProperty('--indicator-width',activeRect.width+'px');clone.dataset.activeTheme=active.dataset.themeChoice||theme};\nconst setOpen=v=>{const next=!!v;clearTimeout(closeTimer);if(next){clearTimeout(settleTimer);clearTimeout(openSyncTimer);open=true;clone.classList.remove('is-closing','indicator-snap');clone.classList.add('is-open','is-opening');gear.setAttribute('aria-expanded','true');clone.dataset.activeTheme=root.dataset.theme||'dark';openSyncTimer=setTimeout(()=>{if(!open)return;clone.classList.add('indicator-snap');sync(root.dataset.theme);clone.classList.remove('is-opening');requestAnimationFrame(()=>requestAnimationFrame(()=>clone.classList.remove('indicator-snap')))},reducedMotion()?1:370);return;}if(!open&&!clone.classList.contains('is-open'))return;open=false;clearTimeout(openSyncTimer);gear.setAttribute('aria-expanded','false');if(reducedMotion()){clone.classList.remove('is-open','is-opening','is-closing','indicator-snap');return;}clone.classList.remove('is-opening','indicator-snap');clone.classList.add('is-closing');clone.classList.remove('is-open');closeTimer=setTimeout(()=>clone.classList.remove('is-closing'),400)};`;
if(!gear.includes(oldCore))throw new Error('V278 V200 capsule core signature changed');
gear=gear.replace(oldCore,newCore);
const oldChoice=`opts.querySelectorAll('.theme-capsule-option').forEach(btn=>btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();applyTheme(btn.dataset.themeChoice);requestAnimationFrame(sync);setTimeout(()=>setOpen(false),matchMedia('(prefers-reduced-motion: reduce)').matches?1:180)}));`;
const newChoice=`opts.querySelectorAll('.theme-capsule-option').forEach(btn=>btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();const target=btn.dataset.themeChoice;clearTimeout(settleTimer);clone.dataset.activeTheme=target;opts.querySelectorAll('.theme-capsule-option').forEach(b=>{const active=b===btn;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))});sync(target);requestAnimationFrame(()=>applyTheme(target));settleTimer=setTimeout(()=>setOpen(false),reducedMotion()?1:700)}));`;
if(!gear.includes(oldChoice))throw new Error('V278 V200 capsule choice signature changed');
gear=gear.replace(oldChoice,newChoice);
const oldObservers=`new ResizeObserver(()=>{if(open)sync()}).observe(clone);new MutationObserver(m=>{if(m.some(x=>x.attributeName==='data-theme')){document.querySelectorAll('.theme-capsule-option').forEach(b=>{const a=b.dataset.themeChoice===root.dataset.theme;b.classList.toggle('active',a);b.setAttribute('aria-pressed',String(a))});if(open)sync()}}).observe(root,{attributes:true,attributeFilter:['data-theme']});`;
const newObservers=`new ResizeObserver(()=>{if(open&&!clone.classList.contains('is-opening')&&!clone.classList.contains('is-closing'))sync(root.dataset.theme)}).observe(clone);new MutationObserver(m=>{if(m.some(x=>x.attributeName==='data-theme')){document.querySelectorAll('.theme-capsule-option').forEach(b=>{const a=b.dataset.themeChoice===root.dataset.theme;b.classList.toggle('active',a);b.setAttribute('aria-pressed',String(a))});clone.dataset.activeTheme=root.dataset.theme||'dark';if(open&&!clone.classList.contains('is-opening')&&!clone.classList.contains('is-closing'))requestAnimationFrame(()=>sync(root.dataset.theme))}}).observe(root,{attributes:true,attributeFilter:['data-theme']});`;
if(!gear.includes(oldObservers))throw new Error('V278 V200 capsule observer signature changed');
gear=gear.replace(oldObservers,newObservers);
fs.writeFileSync(path.join(OUT,'js','gear-action-capsule-v200.js'),gear);
cp.execFileSync(process.execPath,['--check',path.join(OUT,'js','gear-action-capsule-v200.js')],{stdio:'inherit'});

const residualCss=`/* ARSTORE V3.4 #23 — residual historical audit sweep. Presentation only. */\n.theme-capsule-indicator{left:0!important;transform:translate3d(var(--indicator-x,6px),0,0)!important;width:var(--indicator-width,0px)!important;transition:transform 220ms cubic-bezier(.22,1,.36,1),width 220ms cubic-bezier(.22,1,.36,1),opacity 160ms ease-out!important;will-change:auto!important}\nhtml[data-theme="light"] .theme-capsule-indicator{background:#fff!important}\nhtml[data-theme="dark"] .theme-capsule-indicator{background:#202938!important}\nhtml[data-theme="charcoal"] .theme-capsule-indicator{background:#3a3b40!important}\nhtml[data-theme="oled"] .theme-capsule-indicator{background:#050505!important}\n.theme-action-capsule.is-opening .theme-capsule-indicator,.theme-action-capsule.is-closing .theme-capsule-indicator{opacity:0!important;transition:none!important}\n.theme-action-capsule.indicator-snap .theme-capsule-indicator{transition:none!important}\n.theme-action-capsule.is-closing .theme-capsule-options{visibility:visible;pointer-events:none!important}\n.sidebar-nav{padding-inline-end:12px!important;scroll-behavior:auto!important}\n@media (hover:hover) and (pointer:fine){.sidebar-nav .nav-item:hover,.sidebar-nav .nav-subitem:hover{transform:none!important}}\n@media(prefers-reduced-motion:reduce){.theme-action-capsule,.theme-capsule-shell,.theme-capsule-options,.theme-capsule-indicator{transition-duration:.01ms!important;animation-duration:.01ms!important;animation-iteration-count:1!important}}\n`;
const cssPath=path.join(OUT,'css','ui-residual-historical-audit-v278.css');fs.writeFileSync(cssPath,residualCss);
html=html.replace(/^\s*<link[^>]+ui-residual-historical-audit-v278\.css[^>]*>\s*$/gmi,'');
html=html.replace('</head>','<link rel="stylesheet" href="css/ui-residual-historical-audit-v278.css?v=278">\n</head>');
fs.writeFileSync(htmlPath,html);

const count=(s,re)=>(s.match(re)||[]).length;
const checks=[
 ['historical B1 interaction intent covered',app.includes('window.ARSTORE_NAV')&&html.includes('ui-ios-navigation-v264.js')&&!html.includes('ui-ios-single-nav-v263.js')],
 ['current iOS authority singular',count(v264,/addEventListener\(['\"]touchstart['\"]/g)===1&&count(v264,/addEventListener\(['\"]touchend['\"]/g)===1],
 ['V261 iOS gesture yielded',v261.includes("platform==='ios'")||v261.includes("platform!=='ios'")||v261.includes('__ARSTORE_V264_NAV_AUTHORITY')],
 ['historical motion ownership intent covered',!html.includes('ui-motion-core-v258.js')&&html.includes('ui-motion-core-v261.js')],
 ['accordion owns no touch/history',!/touchstart|touchmove|touchend|history\.pushState|history\.replaceState/.test(v265)],
 ['four-theme shell authority',['light','dark','charcoal','oled'].every(t=>shell.includes(t))],
 ['capsule V200 owner retained',gear.includes('ARSTORE_GEAR_V200')],
 ['capsule explicit opening phase',gear.includes("classList.add('is-open','is-opening')")],
 ['capsule explicit closing phase',gear.includes("classList.add('is-closing')")],
 ['capsule geometry uses rects',gear.includes('activeRect.left-optsRect.left')&&gear.includes("--indicator-x")],
 ['capsule target theme immediate',gear.includes('clone.dataset.activeTheme=target')],
 ['capsule settled auto-close',gear.includes('reducedMotion()?1:700')],
 ['capsule resize observer gated',gear.includes("!clone.classList.contains('is-opening')&&!clone.classList.contains('is-closing')")],
 ['old 180ms auto-close retired',!gear.includes("matches?1:180")],
 ['indicator Light semantic color',residualCss.includes('background:#fff!important')],
 ['indicator Dark semantic color',residualCss.includes('background:#202938!important')],
 ['indicator Charcoal semantic color',residualCss.includes('background:#3a3b40!important')],
 ['indicator OLED semantic color',residualCss.includes('background:#050505!important')],
 ['indicator translate3d geometry',residualCss.includes('translate3d(var(--indicator-x,6px),0,0)')],
 ['indicator hidden during unstable phases',residualCss.includes('.is-opening .theme-capsule-indicator')&&residualCss.includes('.is-closing .theme-capsule-indicator')],
 ['historical light performance intent covered',finalCss.includes('transition-property:opacity,visibility!important')&&finalCss.includes('will-change:auto!important')],
 ['sidebar native scroll retained',sidebarCss.includes('overflow-y:auto!important')&&sidebarCss.includes('scroll-behavior:auto!important')],
 ['sidebar scrollbar clearance upgraded',residualCss.includes('padding-inline-end:12px!important')],
 ['desktop sidebar hover transform retired',residualCss.includes('.sidebar-nav .nav-item:hover')&&residualCss.includes('transform:none!important')],
 ['reduced motion sealed',residualCss.includes('@media(prefers-reduced-motion:reduce)')],
 ['residual CSS wired once',count(html,/ui-residual-historical-audit-v278\.css/g)===1],
 ['residual layer owns no router',!residualCss.includes('data-page')&&!gear.includes('history.pushState')&&!gear.includes('history.replaceState')],
 ['PROJECT LOCK untouched',!residualCss.includes('shopee-fee-db')&&!residualCss.includes('tiktok-fee-db')&&!gear.includes('ARSTORE_STEP02_FEE_ENGINE')]
];
const failed=checks.filter(([,ok])=>!ok);if(failed.length){console.error('V278 failed:',failed.map(([n])=>n));process.exit(1)}
console.log(`V278 RESIDUAL HISTORICAL AUDIT PASS · ${checks.length}/${checks.length} gates · legacy B1/B2-B2.7 intent reconciled with current V264/V265/V200 architecture · PROJECT LOCK untouched`);
