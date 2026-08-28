const fs=require('fs'),path=require('path'),cp=require('child_process');
const OUT=path.join(__dirname,'public');
if(!fs.existsSync(OUT))throw new Error('V266 SIDEBAR TOTAL AUDIT: public/ missing');
const cssPath=path.join(OUT,'css','ui-sidebar-scroll-stability-v266.css');
const htmlPath=path.join(OUT,'index.html');
if(!fs.existsSync(cssPath)||!fs.existsSync(htmlPath))throw new Error('V266 SIDEBAR TOTAL AUDIT: required output missing');
let css=fs.readFileSync(cssPath,'utf8');

// Keep B2.7 native-scroll and clearance wins, but remove two risky containment/clipping rules.
css=css.replace('  contain:layout style!important;','  contain:none!important;');
css=css.replace(/\.sidebar-nav \.nav-item,\n\.sidebar-nav \.nav-subitem,\n\.sidebar-nav \.nav-parent\{\n  overflow:hidden!important;\n\}/,
`.sidebar-nav .nav-item,\n.sidebar-nav .nav-subitem,\n.sidebar-nav .nav-parent{\n  overflow:visible!important;\n}\n\n/* Clip/ellipsis only the text label, never the interactive row/focus ring. */\n.sidebar-nav .nav-item > span:last-child,\n.sidebar-nav .nav-subitem > span:not(.nav-chevron):last-of-type,\n.sidebar-nav .nav-parent > span:not(.nav-chevron):last-of-type{\n  min-width:0!important;\n  overflow:hidden!important;\n  text-overflow:ellipsis!important;\n  white-space:nowrap!important;\n}\n\n.sidebar-nav .nav-item:focus-visible,\n.sidebar-nav .nav-subitem:focus-visible,\n.sidebar-nav .nav-parent:focus-visible{\n  outline-offset:-2px!important;\n}\n`);

// Seal native vertical scrolling without taking horizontal gesture/navigation ownership.
if(!css.includes('overscroll-behavior-y:contain!important'))css += `\n.sidebar-nav{\n  overflow-y:auto!important;\n  overscroll-behavior-y:contain!important;\n  touch-action:pan-y!important;\n  -webkit-overflow-scrolling:touch;\n}\n`;
fs.writeFileSync(cssPath,css);

const read=rel=>{const f=path.join(OUT,rel);if(!fs.existsSync(f))throw new Error('V266 SIDEBAR TOTAL AUDIT missing '+rel);return fs.readFileSync(f,'utf8')};
const html=read('index.html');
const app=read('js/app.js');
const runtime34=read('js/ui-runtime-v34.js');
const final34=read('js/ui-final-runtime-v34.js');
const v261=read('js/ui-motion-core-v261.js');
const v266=read('js/ui-interaction-authority-v266.js');
for(const rel of ['js/app.js','js/ui-runtime-v34.js','js/ui-final-runtime-v34.js','js/ui-motion-core-v261.js','js/ui-interaction-authority-v266.js'])cp.execFileSync(process.execPath,['--check',path.join(OUT,rel)],{stdio:'inherit'});

const checks=[
 ['sidebar/nav ids exist',/id=["']sidebar["']/.test(html)&&/id=["']sidebarOverlay["']/.test(html)&&/id=["']mobileMenuBtn["']/.test(html)],
 ['native sidebar scroll',css.includes('overflow-y:auto!important')&&css.includes('scroll-behavior:auto!important')],
 ['scrollbar/content clearance',css.includes('scrollbar-gutter:stable!important')&&/padding-inline-end:(?:max\()?12px/.test(css)],
 ['risky layout containment retired',!css.includes('contain:layout style!important')&&css.includes('contain:none!important')],
 ['interactive rows not clipped',css.includes('.nav-parent{\n  overflow:visible!important;')],
 ['label-only ellipsis',css.includes('text-overflow:ellipsis!important')&&css.includes('white-space:nowrap!important')],
 ['keyboard focus stays visible',css.includes('outline-offset:-2px!important')],
 ['vertical touch scroll only',css.includes('touch-action:pan-y!important')],
 ['legacy wheel owner uninitialized',!/\n\s*wireSidebarScroll\(\);\s*\n/.test(runtime34)],
 ['reveal binder idempotent',final34.includes("nav.dataset.finalRevealBound === '1'")&&final34.includes("nav.dataset.finalRevealBound = '1'")],
 ['base hamburger owner',app.includes("mobileMenuBtn?.addEventListener('click'")],
 ['base overlay owner',app.includes("overlay?.addEventListener('click', closeSidebar)")],
 ['base accordion owner',app.includes("const toggle = event.target.closest('[data-nav-toggle]')")],
 ['V261 iOS gesture disabled',v261.includes("if(platform!=='ios')setupDrawerGesture();")],
 ['V266 iOS derived state only',v266.includes("authority:'base-app'")&&v266.includes('hasCustomSwipe:false')],
 ['V266 no touch navigation',!/addEventListener\(['\"]touch(?:start|move|end|cancel)['\"]/.test(v266)],
 ['overlay starts hidden',/id=["']sidebarOverlay["'][^>]*aria-hidden=["']true["']/.test(html)||/aria-hidden=["']true["'][^>]*id=["']sidebarOverlay["']/.test(html)]
];
const failed=checks.filter(([,ok])=>!ok).map(([n])=>n);
if(failed.length)throw new Error('V266 SIDEBAR TOTAL AUDIT failed: '+failed.join(', '));
console.log('V266 SIDEBAR TOTAL AUDIT PASS — native scroll preserved; risky layout containment/row clipping retired; label-only ellipsis and focus visibility sealed; base app remains drawer/accordion owner; iOS stays native/no custom swipe');
