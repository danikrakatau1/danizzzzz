const fs=require('fs'),cp=require('child_process');
const htmlPath='public/index.html';
const appPath='public/js/app.js';
const histPath='public/js/ui-smart-tab-history-v70.js';
const iosPath='public/js/ui-ios-navigation-v264.js';
const accPath='public/js/ui-accordion-audit-v265.js';
for(const p of [htmlPath,appPath,histPath,iosPath,accPath])if(!fs.existsSync(p))throw new Error('V266 missing build artifact: '+p);
for(const p of [appPath,histPath,iosPath,accPath])cp.execFileSync(process.execPath,['--check',p],{stdio:'inherit'});
const html=fs.readFileSync(htmlPath,'utf8');
const app=fs.readFileSync(appPath,'utf8');
const hist=fs.readFileSync(histPath,'utf8');
const ios=fs.readFileSync(iosPath,'utf8');
const acc=fs.readFileSync(accPath,'utf8');
const count=(s,re)=>(s.match(re)||[]).length;
const routes=[
  '/', '/seller-tools','/seller-tools/produk-trending','/seller-tools/fee-engine','/seller-tools/kalkulator-profit','/seller-tools/harga-ideal','/seller-tools/simulator-iklan','/seller-tools/decision-center',
  '/market-tools/shopee/kalkulator-roas','/market-tools/shopee/harga-jual','/market-tools/tiktok/kalkulator-roas','/market-tools/tiktok/harga-jual',
  '/produk/produk-saya','/produk/keuangan','/produk/stok','/produk/kompetitor','/produk/content-affiliate','/produk/order-analytics','/database','/pengaturan'
];
const routeMiss=routes.filter(route=>route==='/'?!/dashboard:\s*'\/'/.test(app):!app.includes(`'${route}'`));
const checks=[
 ['history authority flag',html.includes('__ARSTORE_HISTORY_AUTHORITY_ACTIVE=true')],
 ['single smart history runtime',count(html,/ui-smart-tab-history-v70\.js/g)===1],
 ['single V264 iOS navigation runtime',count(html,/ui-ios-navigation-v264\.js/g)===1],
 ['single V265 accordion runtime',count(html,/ui-accordion-audit-v265\.js/g)===1],
 ['retired V263 runtime absent',!html.includes('ui-ios-single-nav-v263.js')&&!html.includes('ui-ios-single-nav-v263.css')],
 ['legacy iOS history runtime absent',!html.includes('ui-ios-history-canonical-v34.js')&&!html.includes('ui-ios-nav-authority-v61-69.js')],
 ['router API exported',app.includes('window.ARSTORE_NAV')],
 ['base popstate yields to history authority',app.includes('__ARSTORE_HISTORY_AUTHORITY_ACTIVE')],
 ['history owns pushState',hist.includes('history.pushState')],
 ['history owns replaceState',hist.includes('history.replaceState')],
 ['history handles pageshow/BFCache',hist.includes('pageshow')],
 ['history restores accordion',/accordion/i.test(hist)],
 ['history restores selected product',hist.includes('selectedProduct')],
 ['iOS layer does not own generic route clicks',!ios.includes("closest('[data-page],[data-go]')")&&!ios.includes('closest("[data-page],[data-go]")')],
 ['accordion layer does not push history',!acc.includes('pushState')&&!acc.includes('replaceState')],
 ['all canonical routes present',routeMiss.length===0],
 ['project lock untouched',!ios.includes('shopee-fee-db')&&!ios.includes('tiktok-fee-db')&&!acc.includes('shopee-fee-db')&&!acc.includes('tiktok-fee-db')]
];
const failed=checks.filter(([,ok])=>!ok);
if(failed.length){
  console.error('V266 failed checks:',failed.map(([name])=>name));
  if(routeMiss.length)console.error('Missing routes:',routeMiss);
  process.exit(1);
}
console.log('V266 NAVIGATION STATE + ROUTE INTEGRITY PASS · '+checks.length+'/'+checks.length+' gates · '+routes.length+' canonical routes · single history authority · PROJECT LOCK untouched');
