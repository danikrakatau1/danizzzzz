const fs=require('fs'),path=require('path'),cp=require('child_process');
const OUT=path.join(__dirname,'public');
if(!fs.existsSync(OUT))throw new Error('V269 SIDEBAR TOTAL AUDIT: public/ missing');
const htmlPath=path.join(OUT,'index.html');
const cssSrc=path.join(__dirname,'ui-sidebar-total-audit-v269.css');
const cssDst=path.join(OUT,'css','ui-sidebar-total-audit-v269.css');
fs.mkdirSync(path.dirname(cssDst),{recursive:true});
fs.copyFileSync(cssSrc,cssDst);
let html=fs.readFileSync(htmlPath,'utf8');
html=html.replace(/^\s*<link[^>]+ui-sidebar-total-audit-v269\.css[^>]*>\s*$/gmi,'');
html=html.replace('</head>','<link rel="stylesheet" href="css/ui-sidebar-total-audit-v269.css?v=269">\n</head>');
fs.writeFileSync(htmlPath,html);
const files={app:path.join(OUT,'js','app.js'),runtime34:path.join(OUT,'js','ui-runtime-v34.js'),final34:path.join(OUT,'js','ui-final-runtime-v34.js'),v261:path.join(OUT,'js','ui-motion-core-v261.js'),v264:path.join(OUT,'js','ui-ios-navigation-v264.js'),v265:path.join(OUT,'js','ui-accordion-audit-v265.js')};
for(const p of Object.values(files))if(!fs.existsSync(p))throw new Error('V269 SIDEBAR TOTAL AUDIT missing '+p);
for(const p of Object.values(files))cp.execFileSync(process.execPath,['--check',p],{stdio:'inherit'});
const read=p=>fs.readFileSync(p,'utf8');
const app=read(files.app),runtime34=read(files.runtime34),final34=read(files.final34),v261=read(files.v261),v264=read(files.v264),v265=read(files.v265),css=read(cssDst);
const count=(s,re)=>(s.match(re)||[]).length;
const checks=[
 ['sidebar ids exist',/id=["']sidebar["']/.test(html)&&/id=["']sidebarOverlay["']/.test(html)&&/id=["']mobileMenuBtn["']/.test(html)],
 ['V269 CSS wired once',count(html,/ui-sidebar-total-audit-v269\.css/g)===1],
 ['nav single scroll owner',css.includes('overflow-y:auto!important')&&css.includes('#sidebar{overflow:hidden!important}')],
 ['horizontal clipping blocked',css.includes('overflow-x:hidden!important')],
 ['safe area bottom clearance',css.includes('env(safe-area-inset-bottom,0px)')],
 ['stable scrollbar gutter',css.includes('scrollbar-gutter:stable!important')],
 ['legacy spacer removed',css.includes('.sidebar-nav::after{content:none!important;height:0!important;display:none!important}')],
 ['rows not clipped',css.includes('overflow:visible!important')],
 ['labels ellipsize only',css.includes('text-overflow:ellipsis!important')&&css.includes('white-space:nowrap!important')],
 ['accordion containment retired',css.includes('.sidebar-nav .nav-accordion-panel{contain:none!important;will-change:auto!important}')],
 ['focus stays visible',css.includes('outline-offset:-2px!important')],
 ['legacy wheel binder remains uninitialized',!/\n\s*wireSidebarScroll\(\);\s*\n/.test(runtime34)],
 ['final reveal binder idempotent',final34.includes("nav.dataset.finalRevealBound === '1'")&&final34.includes("nav.dataset.finalRevealBound = '1'")],
 ['base hamburger owner present',/mobileMenuBtn\?\.addEventListener\(\s*['\"]click['\"]/.test(app)],
 ['base overlay owner present',/(?:sidebarOverlay|overlay)\?\.addEventListener\(\s*['\"]click['\"]\s*,\s*closeSidebar/.test(app)],
 ['base accordion owner present',app.includes("event.target.closest('[data-nav-toggle]')")],
 ['V264 iOS drawer authority present',v264.includes('ARSTORE_IOS_NAV_V264')],
 ['V261 duplicate click owners still retired',!v261.includes("o.addEventListener('click',closeDrawer")&&!v261.includes("menu?.addEventListener('click'")],
 ['V265 accessibility sync intact',v265.includes('aria-hidden')&&v265.includes('panel.inert=closed')],
 ['PROJECT LOCK untouched',!css.includes('shopee-fee-db')&&!css.includes('tiktok-fee-db')&&!css.includes('profit-engine')]
];
const failed=checks.filter(([,ok])=>!ok);
if(failed.length){console.error('V269 failed checks:',failed.map(([n])=>n));process.exit(1)}
console.log(`V269 SIDEBAR TOTAL AUDIT PASS · ${checks.length}/${checks.length} gates · single mobile scroll owner · safe-area/focus/ellipsis sealed · PROJECT LOCK untouched`);
