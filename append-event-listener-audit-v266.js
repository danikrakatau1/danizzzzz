const fs=require('fs'),path=require('path'),cp=require('child_process');
const OUT=path.join(__dirname,'public');
if(!fs.existsSync(OUT))throw new Error('V266 EVENT AUDIT: public/ missing');
const htmlPath=path.join(OUT,'index.html');
let html=fs.readFileSync(htmlPath,'utf8');

// V259 CSS/favicon hardening stays, but its legacy iOS click/pageshow runtime must not execute.
html=html.replace(/^\s*<script[^>]+ui-ios-sidebar-navfix-v259\.js[^>]*><\/script>\s*$/gmi,'');
fs.writeFileSync(htmlPath,html);

const read=rel=>{const f=path.join(OUT,rel);if(!fs.existsSync(f))throw new Error('V266 EVENT AUDIT missing '+rel);return fs.readFileSync(f,'utf8')};
const app=read('js/app.js');
const runtime34=read('js/ui-runtime-v34.js');
const final34=read('js/ui-final-runtime-v34.js');
const final37=read('js/ui-final-runtime-v37-60.js');
const v250=read('js/mobile-visual-recovery-v250.js');
const v257=read('js/ui-premium-618-v257.js');
const v261=read('js/ui-motion-core-v261.js');
const v265=read('js/ui-ios-compat-v265.js');
const v266=read('js/ui-interaction-authority-v266.js');
const research=read('js/research.js');
const fee=read('js/fee-engine-ui.js');
const profit=read('js/profit-engine-ui.js');
const history70=read('js/ui-smart-tab-history-v70.js');

for(const rel of ['js/app.js','js/ui-runtime-v34.js','js/ui-final-runtime-v34.js','js/ui-final-runtime-v37-60.js','js/mobile-visual-recovery-v250.js','js/ui-premium-618-v257.js','js/ui-motion-core-v261.js','js/ui-ios-compat-v265.js','js/ui-interaction-authority-v266.js','js/research.js','js/fee-engine-ui.js','js/profit-engine-ui.js','js/ui-smart-tab-history-v70.js'])cp.execFileSync(process.execPath,['--check',path.join(OUT,rel)],{stdio:'inherit'});

const count=(s,re)=>(s.match(re)||[]).length;
const submitPaths=s=>count(s,/addEventListener\(['\"]submit['\"]/g)+count(s,/\.onsubmit\s*=/g);
const checks=[
 ['V259 legacy listener runtime unwired',!html.includes('ui-ios-sidebar-navfix-v259.js')],
 ['V259 presentation CSS retained',html.includes('ui-ios-sidebar-navfix-v259.css')],
 ['legacy V34 wheel binder not initialized',!/\n\s*wireSidebarScroll\(\);\s*\n/.test(runtime34)],
 ['final sidebar reveal bind guarded',final34.includes("nav.dataset.finalRevealBound === '1'")&&final34.includes("nav.dataset.finalRevealBound = '1'")],
 ['V250 no menu click owner',!v250.includes("menu.addEventListener('click'")],
 ['V250 no overlay click owner',!v250.includes("ov.addEventListener('click'")],
 ['V261 Android gesture scoped away from iOS',v261.includes("if(platform!=='ios')setupDrawerGesture();")],
 ['V261 overlay click duplicate retired',!v261.includes("o.addEventListener('click',closeDrawer")],
 ['V261 leaf click duplicate retired',!v261.includes("#sidebar [data-page],#sidebar [data-go]')")],
 ['V261 only intentional non-passive listener',count(v261,/passive:false/g)===1&&v261.includes("addEventListener('touchmove'")],
 ['V265 has no custom touch listeners',!/addEventListener\(['\"]touch(?:start|move|end|cancel)['\"]/.test(v265)],
 ['V265 input focus binding idempotent',v265.includes('if(el.dataset.ar265Enhanced)return')&&v265.includes("el.dataset.ar265Enhanced='1'")],
 ['V266 no click listener',!/addEventListener\(['\"]click['\"]/.test(v266)],
 ['V266 no touch listener',!/addEventListener\(['\"]touch(?:start|move|end|cancel)['\"]/.test(v266)],
 ['base overlay listener single source',count(app,/overlay\?\.addEventListener\('click', closeSidebar\)/g)===1],
 ['base hamburger listener single source',count(app,/mobileMenuBtn\?\.addEventListener\('click'/g)===1],
 ['Smart History popstate listener present',/addEventListener\(['\"]popstate['\"]/.test(history70)],
 ['legacy final37 history yields to Smart History',final37.includes('__ARSTORE_HISTORY_AUTHORITY_ACTIVE')],
 ['final37 edge-touch visual listeners passive',final37.includes("touchstart', event =>")&&final37.includes('{passive:true}')],
 ['research submit uses single running guard',research.includes('researchRequestRunning')&&research.includes("$('reanalyzeBtn')?.addEventListener('click', triggerResearch)")],
 ['fee one submit transaction path',submitPaths(fee)===1],
 ['profit one submit transaction path',submitPaths(profit)===1],
 ['V257 DOM ready is once-only',v257.includes("addEventListener('DOMContentLoaded',fn,{once:true})")],
 ['V261 DOM ready is once-only',v261.includes("addEventListener('DOMContentLoaded',ready,{once:true})")],
 ['V265 DOM ready is once-only',v265.includes("addEventListener('DOMContentLoaded',recover,{once:true})")],
 ['final37 DOM ready is once-only',final37.includes("addEventListener('DOMContentLoaded', init, {once:true})")]
];
const failed=checks.filter(([,ok])=>!ok).map(([n])=>n);
if(failed.length)throw new Error('V266 EVENT LISTENER AUDIT failed: '+failed.join(', '));
console.log('V266 EVENT LISTENER AUDIT PASS — V259 legacy iOS listener runtime retired; no duplicate drawer click owners; sidebar wheel interception remains uninitialized; lifecycle bindings are once/idempotent; touch/wheel passive policy constrained; Research/Fee/Profit submit paths single-owned');
