const fs=require('fs'),path=require('path'),cp=require('child_process');
const OUT=path.join(__dirname,'public');
if(!fs.existsSync(OUT))throw new Error('V266 NAV OWNERSHIP: public/ missing');
const read=rel=>{const f=path.join(OUT,rel);if(!fs.existsSync(f))throw new Error('V266 NAV OWNERSHIP missing '+rel);return fs.readFileSync(f,'utf8')};
const html=read('index.html');
const app=read('js/app.js');
const v250=read('js/mobile-visual-recovery-v250.js');
const v261=read('js/ui-motion-core-v261.js');
const v265=read('js/ui-ios-compat-v265.js');
const v266=read('js/ui-interaction-authority-v266.js');
const history70=read('js/ui-smart-tab-history-v70.js');
const product71=read('js/product-center-v71.js');
for(const rel of ['js/app.js','js/mobile-visual-recovery-v250.js','js/ui-motion-core-v261.js','js/ui-ios-compat-v265.js','js/ui-interaction-authority-v266.js','js/ui-smart-tab-history-v70.js','js/product-center-v71.js'])cp.execFileSync(process.execPath,['--check',path.join(OUT,rel)],{stdio:'inherit'});
const count=(s,re)=>(s.match(re)||[]).length;
const historyScriptCount=count(html,/ui-smart-tab-history-v70\.js/gi);
const checks=[
 ['base router API',app.includes('window.ARSTORE_NAV')],
 ['base delegated route click',app.includes("const trigger = event.target.closest('[data-page],[data-go]')")],
 ['base hamburger owner',app.includes("mobileMenuBtn?.addEventListener('click'")],
 ['base overlay close owner',app.includes("overlay?.addEventListener('click', closeSidebar)")],
 ['base accordion owner',app.includes("const toggle = event.target.closest('[data-nav-toggle]')")],
 ['base popstate yields to Smart History',app.includes('__ARSTORE_HISTORY_AUTHORITY_ACTIVE')],
 ['Smart History marker',history70.includes('SMART TAB HISTORY UX AUTHORITY')],
 ['Smart History owns pushState',history70.includes('history.pushState=function')],
 ['Smart History owns replaceState',history70.includes('history.replaceState=function')],
 ['single Smart History script',historyScriptCount===1],
 ['retired V34/V61 history scripts absent',!html.includes('ui-ios-history-canonical-v34.js')&&!html.includes('ui-ios-nav-authority-v61-69.js')],
 ['retired iOS custom swipe scripts absent',!html.includes('ui-ios-single-nav-v263.js')&&!html.includes('ui-ios-navigation-v264.js')],
 ['V250 no leaf click owner',!v250.includes(".sidebar .nav-item,.sidebar .nav-subitem,.sidebar [data-page]'))setTimeout(hardCloseDrawer")],
 ['V250 no overlay click owner',!v250.includes("ov.addEventListener('click'")],
 ['V261 gesture explicitly non-iOS',v261.includes("if(platform!=='ios')setupDrawerGesture();")],
 ['V261 no overlay click owner',!v261.includes("o.addEventListener('click',closeDrawer")],
 ['V261 no leaf click owner',!v261.includes("#sidebar [data-page],#sidebar [data-go]')")],
 ['V265 no touch navigation',!/addEventListener\(['\"]touch(?:start|move|end|cancel)['\"]/.test(v265)],
 ['V266 derived-state only',v266.includes("authority:'base-app'")&&v266.includes('hasCustomSwipe:false')],
 ['V266 no click navigation',!/addEventListener\(['\"]click['\"]/.test(v266)],
 ['V266 no touch navigation',!/addEventListener\(['\"]touch(?:start|move|end|cancel)['\"]/.test(v266)],
 ['Product Center does not own browser history',!product71.includes('history.pushState')&&!product71.includes('history.replaceState')],
 ['history authority flag wired',html.includes('__ARSTORE_HISTORY_AUTHORITY_ACTIVE=true')]
];
const failed=checks.filter(([,ok])=>!ok).map(([n])=>n);
if(failed.length)throw new Error('V266 NAV OWNERSHIP failed: '+failed.join(', '));
console.log('V266 NAVIGATION OWNERSHIP PASS — base app is sole click/drawer/accordion/router owner; Smart History #70 is sole browser-history owner; Android gesture isolated to V261 non-iOS path; iOS uses Safari/native history with V265/V266 derived recovery only');
