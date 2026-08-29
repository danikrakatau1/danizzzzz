const fs=require('fs'),cp=require('child_process');
const OUT='public';
const htmlPath=`${OUT}/index.html`;
const files={
  app:`${OUT}/js/app.js`,
  v261:`${OUT}/js/ui-motion-core-v261.js`,
  v264:`${OUT}/js/ui-ios-navigation-v264.js`,
  v265:`${OUT}/js/ui-accordion-audit-v265.js`,
  history:`${OUT}/js/ui-smart-tab-history-v70.js`,
  research:`${OUT}/js/research.js`,
  fee:`${OUT}/js/fee-engine-ui.js`,
  profit:`${OUT}/js/profit-engine-ui.js`,
  product:`${OUT}/js/product-center-v71.js`,
  gear:`${OUT}/js/gear-action-capsule-v200.js`
};
if(!fs.existsSync(htmlPath))throw new Error('V267 EVENT AUDIT: public/index.html missing');
for(const p of Object.values(files))if(!fs.existsSync(p))throw new Error('V267 EVENT AUDIT missing '+p);

let html=fs.readFileSync(htmlPath,'utf8');
let v261=fs.readFileSync(files.v261,'utf8');

// #12 ownership hardening: V259 presentation CSS stays, but its legacy runtime is fully unwired.
html=html.replace(/^\s*<script[^>]+ui-ios-sidebar-navfix-v259\.js[^>]*><\/script>\s*$/gmi,'');

// Base app.js owns hamburger/overlay/leaf clicks. V261 keeps Android gesture + premium motion only.
const retire=[
  /\n\s*o\.addEventListener\('click',closeDrawer,\{passive:true\}\);?/,
  /\n\s*document\.addEventListener\('click',e=>\{const leaf=e\.target\.closest\?\.\('#sidebar \[data-page\],#sidebar \[data-go\]'\);if\(leaf&&!leaf\.matches\('\.nav-parent,\[data-nav-toggle\]'\)\)raf2\(closeDrawer\)\},true\);?/,
  /\n\s*menu\?\.addEventListener\('click',\(\)=>setTimeout\(\(\)=>setP\(isOpen\(\)\?1:0\),0\),\{passive:true\}\);?/
];
for(const re of retire)v261=v261.replace(re,'');
fs.writeFileSync(htmlPath,html);
fs.writeFileSync(files.v261,v261);

for(const p of Object.values(files))cp.execFileSync(process.execPath,['--check',p],{stdio:'inherit'});

const read=p=>fs.readFileSync(p,'utf8');
const app=read(files.app),v264=read(files.v264),v265=read(files.v265),history=read(files.history),research=read(files.research),fee=read(files.fee),profit=read(files.profit),product=read(files.product),gear=read(files.gear);
const count=(s,re)=>(s.match(re)||[]).length;
const submitPaths=s=>count(s,/addEventListener\(['\"]submit['\"]/g)+count(s,/\.onsubmit\s*=/g);
const scriptSrcs=[...html.matchAll(/<script[^>]+src=["']([^"']+)["'][^>]*>/gi)].map(m=>m[1].split('?')[0]);
const duplicateScripts=[...new Set(scriptSrcs.filter((src,i,a)=>a.indexOf(src)!==i))];
const baseOverlayOwners=count(app,/(?:sidebarOverlay|overlay)\?\.addEventListener\(\s*['\"]click['\"]\s*,\s*closeSidebar\s*\)/g);
const baseHamburgerOwners=count(app,/mobileMenuBtn\?\.addEventListener\(\s*['\"]click['\"]/g);

const checks=[
  ['V259 legacy runtime unwired',!html.includes('ui-ios-sidebar-navfix-v259.js')],
  ['V259 presentation CSS retained',html.includes('ui-ios-sidebar-navfix-v259.css')],
  ['no duplicate script src',duplicateScripts.length===0],
  ['base overlay owner singular',baseOverlayOwners===1],
  ['base hamburger owner singular',baseHamburgerOwners===1],
  ['V261 iOS gesture blocked by V264',v261.includes("if(!(window.__ARSTORE_V264_NAV_AUTHORITY&&platform==='ios'))setupDrawerGesture();")],
  ['V261 duplicate overlay click retired',!v261.includes("o.addEventListener('click',closeDrawer")],
  ['V261 duplicate leaf click retired',!v261.includes("#sidebar [data-page],#sidebar [data-go]')")],
  ['V261 duplicate hamburger click retired',!v261.includes("menu?.addEventListener('click'")],
  ['V261 gesture still available',/function setupDrawerGesture\(\)/.test(v261)&&count(v261,/addEventListener\('touch(?:start|move|end|cancel)'/g)>=4],
  ['V264 owns exactly one touch sequence',count(v264,/addEventListener\('touchstart'/g)===1&&count(v264,/addEventListener\('touchmove'/g)===1&&count(v264,/addEventListener\('touchend'/g)===1&&count(v264,/addEventListener\('touchcancel'/g)===1],
  ['V264 does not own route clicks',!v264.includes("addEventListener('click'")],
  ['V265 click guard scoped to accordion',v265.includes("const SELECTOR='[data-nav-toggle]'")&&!v265.includes("[data-page],[data-go]")],
  ['V265 does not own touch',!/addEventListener\(['\"]touch(?:start|move|end|cancel)['\"]/.test(v265)],
  ['Smart History remains popstate owner',/addEventListener\(['\"]popstate['\"]/.test(history)],
  ['Product Center avoids touch ownership',!/addEventListener\(['\"]touch(?:start|move|end|cancel)['\"]/.test(product)],
  ['Product Center avoids wheel interception',!/addEventListener\(['\"]wheel['\"]/.test(product)],
  ['Product Center avoids history ownership',!product.includes('history.pushState')&&!product.includes('history.replaceState')],
  ['Gear boot idempotent',gear.includes("if(old.dataset.v200==='1')return")],
  ['Gear primary click owner singular',count(gear,/gear\.addEventListener\('click'/g)===1],
  ['Research request has running guard',research.includes('researchRequestRunning')],
  ['Fee has one submit transaction path',submitPaths(fee)===1],
  ['Profit has one submit transaction path',submitPaths(profit)===1],
  ['PROJECT LOCK untouched',!v261.includes('shopee-fee-db')&&!v261.includes('tiktok-fee-db')&&!v264.includes('shopee-fee-db')&&!v264.includes('tiktok-fee-db')]
];
const failed=checks.filter(([,ok])=>!ok);
if(failed.length){
  console.error('V267 failed checks:',failed.map(([name])=>name));
  console.error('V267 owner counts:',{baseOverlayOwners,baseHamburgerOwners});
  if(duplicateScripts.length)console.error('Duplicate scripts:',duplicateScripts);
  process.exit(1);
}
console.log(`V267 EVENT LISTENER + ONE-ACTION AUDIT PASS · ${checks.length}/${checks.length} gates · duplicate navigation click owners retired · Research/Fee/Profit single-submit verified · PROJECT LOCK untouched`);
