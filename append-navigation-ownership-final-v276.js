const fs=require('fs'),path=require('path'),cp=require('child_process');
const OUT=path.join(__dirname,'public');
if(!fs.existsSync(OUT))throw new Error('V276 NAV OWNERSHIP FINAL: public/ missing');
const read=rel=>{const f=path.join(OUT,rel);if(!fs.existsSync(f))throw new Error('V276 missing '+rel);return fs.readFileSync(f,'utf8')};
const html=read('index.html');
const app=read('js/app.js');
const v250=read('js/mobile-visual-recovery-v250.js');
const v261=read('js/ui-motion-core-v261.js');
const v264=read('js/ui-ios-navigation-v264.js');
const v265=read('js/ui-accordion-audit-v265.js');
const history70=read('js/ui-smart-tab-history-v70.js');
const product71=read('js/product-center-v71.js');
const semantics272=read('js/ui-html-runtime-semantics-v272.js');
for(const rel of ['js/app.js','js/mobile-visual-recovery-v250.js','js/ui-motion-core-v261.js','js/ui-ios-navigation-v264.js','js/ui-accordion-audit-v265.js','js/ui-smart-tab-history-v70.js','js/product-center-v71.js','js/ui-html-runtime-semantics-v272.js'])cp.execFileSync(process.execPath,['--check',path.join(OUT,rel)],{stdio:'inherit'});
const count=(s,re)=>(s.match(re)||[]).length;
const scriptSrcs=[...html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)].map(m=>m[1].replace(/\?.*$/,''));
const dupScripts=[...new Set(scriptSrcs.filter((s,i)=>scriptSrcs.indexOf(s)!==i))];
const touchCount=type=>count(v264,new RegExp(`addEventListener\\(['\"]${type}['\"]`,'g'));
const checks=[
 ['base router API present',app.includes('window.ARSTORE_NAV')],
 ['base delegated route owner',app.includes("event.target.closest('[data-page],[data-go]')")||app.includes("event.target.closest('[data-page], [data-go]')")],
 ['base hamburger owner singular',count(app,/mobileMenuBtn\?\.addEventListener\(\s*['\"]click['\"]/g)===1],
 ['base overlay close owner singular',count(app,/(?:sidebarOverlay|overlay)\?\.addEventListener\(\s*['\"]click['\"]\s*,\s*closeSidebar/g)===1],
 ['base accordion owner present',app.includes("event.target.closest('[data-nav-toggle]')")],
 ['base popstate yields to history authority',app.includes('__ARSTORE_HISTORY_AUTHORITY_ACTIVE')],
 ['Smart History marker present',history70.includes('SMART TAB HISTORY UX AUTHORITY')],
 ['Smart History owns pushState',history70.includes('history.pushState=function')],
 ['Smart History owns replaceState',history70.includes('history.replaceState=function')],
 ['Smart History wired once',count(html,/ui-smart-tab-history-v70\.js/gi)===1],
 ['retired canonical history scripts absent',!html.includes('ui-ios-history-canonical-v34.js')&&!html.includes('ui-ios-nav-authority-v61-69.js')],
 ['retired V263 runtime absent',!html.includes('ui-ios-single-nav-v263.js')],
 ['retired V259 runtime absent',!html.includes('ui-ios-sidebar-navfix-v259.js')],
 ['V264 iOS authority wired once',count(html,/ui-ios-navigation-v264\.js/gi)===1],
 ['V264 touchstart singular',touchCount('touchstart')===1],
 ['V264 touchmove singular',touchCount('touchmove')===1],
 ['V264 touchend singular',touchCount('touchend')===1],
 ['V264 touchcancel singular',touchCount('touchcancel')===1],
 ['V264 owns no generic route click',!v264.includes("addEventListener('click'")&&!v264.includes('history.pushState')&&!v264.includes('history.replaceState')],
 ['V261 duplicate overlay click retired',!v261.includes("o.addEventListener('click',closeDrawer")],
 ['V261 duplicate leaf click retired',!v261.includes("#sidebar [data-page],#sidebar [data-go]')")],
 ['V250 duplicate nav click retired',!v250.includes(".sidebar .nav-item,.sidebar .nav-subitem,.sidebar [data-page]'))setTimeout(hardCloseDrawer")&&!v250.includes("ov.addEventListener('click'")],
 ['V265 accordion owns no history',!v265.includes('history.pushState')&&!v265.includes('history.replaceState')],
 ['V265 accordion owns no touch',!/addEventListener\(['\"]touch(?:start|move|end|cancel)['\"]/.test(v265)],
 ['Product Center owns no browser history',!product71.includes('history.pushState')&&!product71.includes('history.replaceState')],
 ['Product Center owns no touch navigation',!/addEventListener\(['\"]touch(?:start|move|end|cancel)['\"]/.test(product71)],
 ['V272 semantics owns no click/history/touch',!semantics272.includes("addEventListener('click'")&&!semantics272.includes('history.pushState')&&!semantics272.includes('history.replaceState')&&!/addEventListener\(['\"]touch(?:start|move|end|cancel)['\"]/.test(semantics272)],
 ['no duplicate script wiring',dupScripts.length===0],
 ['history authority flag wired',html.includes('__ARSTORE_HISTORY_AUTHORITY_ACTIVE=true')],
 ['PROJECT LOCK untouched',!app.includes('ARSTORE_SHOPEE_FEE_DB_2026=[')&&!app.includes('ARSTORE_TIKTOK_FEE_DB_2026=[')]
];
const failed=checks.filter(([,ok])=>!ok);if(failed.length){console.error('V276 failed:',failed.map(([n])=>n),{dupScripts});process.exit(1)}
console.log(`V276 NAVIGATION OWNERSHIP FINAL PASS · ${checks.length}/${checks.length} gates · base click/router + Smart History + V264 iOS gesture + V265 accordion ownership sealed · PROJECT LOCK untouched`);
