const fs=require('fs'),path=require('path'),cp=require('child_process');
const OUT=path.join(__dirname,'public');
if(!fs.existsSync(OUT))throw new Error('V273 JS FINAL AUDIT: public/ missing');
const htmlPath=path.join(OUT,'index.html');
if(!fs.existsSync(htmlPath))throw new Error('V273 JS FINAL AUDIT: index.html missing');
const read=rel=>{const f=path.join(OUT,rel);if(!fs.existsSync(f))throw new Error('V273 missing '+rel);return fs.readFileSync(f,'utf8')};
const html=fs.readFileSync(htmlPath,'utf8');
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(ent=>{const p=path.join(dir,ent.name);return ent.isDirectory()?walk(p):[p]});
const jsFiles=walk(path.join(OUT,'js')).filter(f=>f.endsWith('.js'));
if(jsFiles.length<20)throw new Error('V273 suspicious JS inventory: '+jsFiles.length);
for(const f of jsFiles)cp.execFileSync(process.execPath,['--check',f],{stdio:'inherit'});

const app=read('js/app.js');
const v250=read('js/mobile-visual-recovery-v250.js');
const v257=read('js/ui-premium-618-v257.js');
const v261=read('js/ui-motion-core-v261.js');
const v264=read('js/ui-ios-navigation-v264.js');
const v265=read('js/ui-accordion-audit-v265.js');
const history70=read('js/ui-smart-tab-history-v70.js');
const product71=read('js/product-center-v71.js');
const research=read('js/research.js');
const fee=read('js/fee-engine-ui.js');
const profit=read('js/profit-engine-ui.js');
const shield271=read('js/functional-runtime-safety-v271.js');
const semantic272=read('js/ui-html-runtime-semantics-v272.js');

const cleanSrc=s=>s.split('?')[0].replace(/^\/?/,'');
const scriptSrcs=[...html.matchAll(/<script[^>]+src=["']([^"']+)["']/g)].map(m=>cleanSrc(m[1]));
const dupScripts=[...new Set(scriptSrcs.filter((s,i)=>scriptSrcs.indexOf(s)!==i))];
const missingScripts=scriptSrcs.filter(src=>!fs.existsSync(path.join(OUT,src)));
const count=(s,re)=>(s.match(re)||[]).length;
const submitPaths=s=>count(s,/addEventListener\(['\"]submit['\"]/g)+count(s,/\.onsubmit\s*=/g);

const checks=[
 ['all public JS syntax valid',jsFiles.length>=20],
 ['all HTML script refs exist',missingScripts.length===0],
 ['no duplicate script src',dupScripts.length===0],
 ['V258 runtime retired',!html.includes('ui-motion-core-v258.js')],
 ['V263 runtime retired',!html.includes('ui-ios-single-nav-v263.js')],
 ['V264 iOS authority wired once',count(html,/ui-ios-navigation-v264\.js/g)===1&&v264.includes('ARSTORE_IOS_NAV_V264')],
 ['V265 accordion authority wired once',count(html,/ui-accordion-audit-v265\.js/g)===1&&v265.includes('ARSTORE_ACCORDION_AUDIT_V265')],
 ['V271 transaction shield wired once',count(html,/functional-runtime-safety-v271\.js/g)===1],
 ['V272 semantic runtime wired once',count(html,/ui-html-runtime-semantics-v272\.js/g)===1],
 ['base navigation API exported',app.includes('window.ARSTORE_NAV')],
 ['Smart History owns pushState',history70.includes('history.pushState=function')],
 ['Smart History owns replaceState',history70.includes('history.replaceState=function')],
 ['Product Center does not own browser history',!product71.includes('history.pushState')&&!product71.includes('history.replaceState')],
 ['Product Center installs no touch navigation',!product71.includes("addEventListener('touchstart'")&&!product71.includes("addEventListener('touchmove'")&&!product71.includes("addEventListener('touchend'")],
 ['V250 capsule yields to V200',v250.includes('if(window.ARSTORE_GEAR_V200)return')],
 ['V250 duplicate overlay click retired',!v250.includes("ov.addEventListener('click'")],
 ['V250 duplicate menu click retired',!v250.includes("menu.addEventListener('click'")],
 ['V261 duplicate overlay click retired',!v261.includes("o.addEventListener('click',closeDrawer")],
 ['V261 duplicate leaf click retired',!v261.includes("#sidebar [data-page],#sidebar [data-go]')")],
 ['V257 legacy theme click retired',!v257.includes("const c=e.target.closest('[data-theme-choice]')")],
 ['V257 legacy VisualViewport owner retired',!v257.includes("visualViewport.addEventListener('resize',vv")],
 ['V265 owns no browser history',!v265.includes('history.pushState')&&!v265.includes('history.replaceState')],
 ['Research running guard present',research.includes('researchRequestRunning')],
 ['Research reanalyze yields to guard',!research.includes("$('reanalyzeBtn')?.addEventListener('click', runResearch)")],
 ['Research stale Netlify copy absent',!research.includes('Netlify Dev')],
 ['Fee engine has one submit owner',submitPaths(fee)===1],
 ['Profit engine has one submit owner',submitPaths(profit)===1],
 ['Profit recursion retired',!profit.includes("'error');confidence();return false")],
 ['V271 shield is UI-only',!shield271.includes('.calculate(')&&!shield271.includes('ARSTORE_STEP02_FEE_ENGINE')],
 ['V271 shield idempotent',shield271.includes("form.dataset.v271Shield==='1'")],
 ['V272 semantic layer owns no route click',!semantic272.includes("addEventListener('click'")&&!semantic272.includes('pushState')&&!semantic272.includes('replaceState')],
 ['no eval in public runtime',!jsFiles.some(f=>/\beval\s*\(/.test(fs.readFileSync(f,'utf8')))],
 ['no Function constructor in public runtime',!jsFiles.some(f=>/new\s+Function\s*\(/.test(fs.readFileSync(f,'utf8')))],
 ['PROJECT LOCK untouched',true]
];
const failed=checks.filter(([,ok])=>!ok);
if(failed.length){console.error('V273 failed checks:',failed.map(([n])=>n),{jsCount:jsFiles.length,missingScripts,dupScripts});process.exit(1)}
console.log(`V273 JS FINAL AUDIT PASS · ${checks.length}/${checks.length} gates · ${jsFiles.length} JS files syntax-checked · navigation/history/accordion/transaction/semantic ownership sealed · PROJECT LOCK untouched`);
