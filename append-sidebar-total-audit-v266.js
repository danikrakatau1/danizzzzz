const fs=require('fs'),path=require('path'),cp=require('child_process');
const OUT=path.join(__dirname,'public');
if(!fs.existsSync(OUT))throw new Error('V266 SIDEBAR TOTAL AUDIT: public/ missing');
const b27Path=path.join(OUT,'css','ui-sidebar-scroll-stability-v266.css');
const finalCssSrc=path.join(__dirname,'ui-sidebar-audit-final-v266.css');
const finalCssDst=path.join(OUT,'css','ui-sidebar-audit-final-v266.css');
const htmlPath=path.join(OUT,'index.html');
if(!fs.existsSync(b27Path)||!fs.existsSync(finalCssSrc)||!fs.existsSync(htmlPath))throw new Error('V266 SIDEBAR TOTAL AUDIT: required output/source missing');

// Remove risky B2.7 geometry/clipping at the source of the generated cascade.
let b27=fs.readFileSync(b27Path,'utf8');
b27=b27.replace('  contain:layout style!important;','  contain:none!important;');
b27=b27.replace(/\.sidebar-nav \.nav-item,\n\.sidebar-nav \.nav-subitem,\n\.sidebar-nav \.nav-parent\{\n  overflow:hidden!important;\n\}/,
`.sidebar-nav .nav-item,\n.sidebar-nav .nav-subitem,\n.sidebar-nav .nav-parent{\n  overflow:visible!important;\n}`);
fs.writeFileSync(b27Path,b27);

// Final sidebar CSS owns geometry/scroll/accessibility after all legacy layers.
fs.copyFileSync(finalCssSrc,finalCssDst);
let html=fs.readFileSync(htmlPath,'utf8');
html=html.replace(/^\s*<link[^>]+ui-sidebar-audit-final-v266\.css[^>]*>\s*$/gmi,'');
html=html.replace('</head>','  <link rel="stylesheet" href="css/ui-sidebar-audit-final-v266.css?v=266b34">\n</head>');
fs.writeFileSync(htmlPath,html);

const read=rel=>{const f=path.join(OUT,rel);if(!fs.existsSync(f))throw new Error('V266 SIDEBAR TOTAL AUDIT missing '+rel);return fs.readFileSync(f,'utf8')};
html=read('index.html');
const app=read('js/app.js');
const runtime34=read('js/ui-runtime-v34.js');
const final34=read('js/ui-final-runtime-v34.js');
const v261=read('js/ui-motion-core-v261.js');
const v266=read('js/ui-interaction-authority-v266.js');
const finalCss=fs.readFileSync(finalCssDst,'utf8');
for(const rel of ['js/app.js','js/ui-runtime-v34.js','js/ui-final-runtime-v34.js','js/ui-motion-core-v261.js','js/ui-interaction-authority-v266.js'])cp.execFileSync(process.execPath,['--check',path.join(OUT,rel)],{stdio:'inherit'});

const checks=[
 ['sidebar/nav ids exist',/id=["']sidebar["']/.test(html)&&/id=["']sidebarOverlay["']/.test(html)&&/id=["']mobileMenuBtn["']/.test(html)],
 ['final sidebar CSS wired',html.includes('ui-sidebar-audit-final-v266.css?v=266b34')],
 ['native nav scroll',finalCss.includes('overflow-y:auto!important')&&finalCss.includes('scroll-behavior:auto!important')],
 ['single mobile scroll owner',finalCss.includes('#sidebar{\n    overflow:hidden!important;')&&finalCss.includes('#sidebar .sidebar-nav{')],
 ['scrollbar/content clearance',finalCss.includes('scrollbar-gutter:stable!important')&&finalCss.includes('padding-inline-end:12px!important')],
 ['safe-area bottom clearance',finalCss.includes('env(safe-area-inset-bottom,0px)')],
 ['legacy huge bottom spacer retired',finalCss.includes('.sidebar-nav::after{')&&finalCss.includes('content:none!important')&&finalCss.includes('height:0!important')],
 ['scroll padding normalized',finalCss.includes('scroll-padding-bottom:max(20px,env(safe-area-inset-bottom,0px))!important')&&finalCss.includes('scroll-padding-bottom:max(24px,env(safe-area-inset-bottom,0px))!important')],
 ['risky layout containment retired',!b27.includes('contain:layout style!important')&&finalCss.includes('contain:none!important')],
 ['interactive rows not clipped',b27.includes('overflow:visible!important')&&finalCss.includes('overflow:visible!important')],
 ['label-only ellipsis',finalCss.includes('text-overflow:ellipsis!important')&&finalCss.includes('white-space:nowrap!important')],
 ['keyboard focus stays visible',finalCss.includes('outline-offset:-2px!important')],
 ['accordion compositor hints automatic',finalCss.includes('will-change:auto!important')],
 ['legacy wheel owner uninitialized',!/\n\s*wireSidebarScroll\(\);\s*\n/.test(runtime34)],
 ['reveal binder idempotent',final34.includes("nav.dataset.finalRevealBound === '1'")&&final34.includes("nav.dataset.finalRevealBound = '1'")],
 ['base hamburger owner',app.includes("mobileMenuBtn?.addEventListener('click'")],
 ['base overlay owner',app.includes("overlay?.addEventListener('click', closeSidebar)")],
 ['base accordion owner',app.includes("const toggle = event.target.closest('[data-nav-toggle]')")],
 ['V261 iOS gesture disabled',v261.includes("if(platform!=='ios')setupDrawerGesture();")],
 ['V266 iOS derived state only',v266.includes("authority:'base-app'")&&v266.includes('hasCustomSwipe:false')],
 ['V266 no touch navigation',!/addEventListener\(['\"]touch(?:start|move|end|cancel)['\"]/.test(v266)],
 ['V259 legacy listener runtime absent',!html.includes('ui-ios-sidebar-navfix-v259.js')],
 ['overlay starts hidden',/id=["']sidebarOverlay["'][^>]*aria-hidden=["']true["']/.test(html)||/aria-hidden=["']true["'][^>]*id=["']sidebarOverlay["']/.test(html)]
];
const failed=checks.filter(([,ok])=>!ok).map(([n])=>n);
if(failed.length)throw new Error('V266 SIDEBAR TOTAL AUDIT failed: '+failed.join(', '));
console.log('V266 SIDEBAR TOTAL AUDIT PASS — nav is the single mobile scroll owner; nested sidebar scrolling and legacy oversized bottom spacer retired; dynamic accordion geometry uncontained; row clipping replaced by label ellipsis; safe-area/scrollbar/focus clearance sealed; base app remains drawer/accordion owner; iOS remains native/no custom swipe');
