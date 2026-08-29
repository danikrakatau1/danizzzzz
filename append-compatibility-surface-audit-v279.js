const fs=require('fs'),path=require('path'),cp=require('child_process');
const OUT=path.join(__dirname,'public');
if(!fs.existsSync(OUT))throw new Error('V279 COMPATIBILITY SURFACE: public/ missing');
const read=rel=>{const f=path.join(OUT,rel);if(!fs.existsSync(f))throw new Error('V279 missing '+rel);return fs.readFileSync(f,'utf8')};
const html=read('index.html'),app=read('js/app.js'),v261=read('js/ui-motion-core-v261.js'),v264=read('js/ui-ios-navigation-v264.js');
const sidebar=read('css/ui-sidebar-total-audit-v269.css'),css274=read('css/ui-css-audit-final-v274.css'),residual=read('css/ui-residual-historical-audit-v278.css');
for(const rel of ['js/app.js','js/ui-motion-core-v261.js','js/ui-ios-navigation-v264.js'])cp.execFileSync(process.execPath,['--check',path.join(OUT,rel)],{stdio:'inherit'});
const viewport=html.match(/<meta\b[^>]*name=["']viewport["'][^>]*content=["']([^"']+)["']/i)?.[1]||'';
const allCss=[sidebar,css274,residual].join('\n');
const count=(s,re)=>(s.match(re)||[]).length;
const checks=[
 ['single viewport meta',count(html,/<meta\b[^>]*name=["']viewport["']/gi)===1],
 ['viewport width device',/width=device-width/i.test(viewport)],
 ['viewport fit cover',/viewport-fit=cover/i.test(viewport)],
 ['safe area bottom used',allCss.includes('env(safe-area-inset-bottom')],
 ['safe area horizontal used',html.includes('safe-area-inset-left')||[...fs.readdirSync(path.join(OUT,'css'))].some(n=>fs.readFileSync(path.join(OUT,'css',n),'utf8').includes('safe-area-inset-left'))],
 ['sidebar touch pan-y',sidebar.includes('touch-action:pan-y!important')],
 ['sidebar momentum scroll',sidebar.includes('-webkit-overflow-scrolling:touch!important')],
 ['sidebar overflow y native',sidebar.includes('overflow-y:auto!important')&&sidebar.includes('overflow-x:hidden!important')],
 ['coarse pointer breakpoint',sidebar.includes('(pointer:coarse)')||sidebar.includes('(pointer: coarse)')],
 ['mobile touch targets >=46px',sidebar.includes('min-height:46px')],
 ['iOS authority UA detection',/iPhone\|iPad\|iPod/.test(v264)&&v264.includes('navigator.maxTouchPoints>1')],
 ['iOS mobile media contract',v264.includes('max-width: 820px')&&v264.includes('pointer: coarse')],
 ['iOS excluded input surfaces',v264.includes('input,textarea,select')&&v264.includes('[contenteditable="true"]')],
 ['iOS touchmove cancelable guard',v264.includes('if(e.cancelable)e.preventDefault()')],
 ['iOS BFCache pageshow recovery',v264.includes("addEventListener('pageshow'")],
 ['iOS orientation recovery',v264.includes("addEventListener('orientationchange'")],
 ['iOS visibility recovery',v264.includes("visibilitychange")],
 ['iOS inert main while drawer open',v264.includes("'inert' in main")],
 ['iOS body overflow restored',v264.includes("B.style.removeProperty('overflow')")],
 ['iOS hidden overlay blur retired',css274.includes('backdrop-filter:none!important')&&css274.includes('transition-property:opacity,visibility!important')],
 ['Android/non-iOS gesture remains isolated',v261.includes('setupDrawerGesture')&&!v261.includes("platform==='ios'?setupDrawerGesture")],
 ['base drawer API exists',app.includes('openSidebar')&&app.includes('closeSidebar')],
 ['reduced motion navigation seal',css274.includes('@media(prefers-reduced-motion:reduce)')],
 ['post-historical reduced motion capsule seal',residual.includes('@media(prefers-reduced-motion:reduce)')],
 ['PROJECT LOCK untouched',!residual.includes('shopee-fee-db')&&!residual.includes('tiktok-fee-db')&&!v264.includes('ARSTORE_STEP02_FEE_ENGINE')]
];
const failed=checks.filter(([,ok])=>!ok);if(failed.length){console.error('V279 failed:',failed.map(([n])=>n),{viewport});process.exit(1)}
console.log(`V279 COMPATIBILITY SURFACE AUDIT PASS · ${checks.length}/${checks.length} gates · viewport/safe-area/touch/BFCache/iOS/Android/mobile overflow contracts sealed · PROJECT LOCK untouched`);
