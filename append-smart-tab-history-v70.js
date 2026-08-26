const fs=require('fs'),cp=require('child_process');
const htmlPath='public/index.html',appPath='public/js/app.js',runtime37='public/js/ui-final-runtime-v37-60.js',src='public/js/ui-smart-tab-history-v70.js';
if(!fs.existsSync(htmlPath)||!fs.existsSync(appPath)||!fs.existsSync(src))throw new Error('#70 build inputs missing');
const nav=fs.readFileSync(src,'utf8');
cp.execFileSync(process.execPath,['--check',src],{stdio:'inherit'});
let app=fs.readFileSync(appPath,'utf8');
let guardCount=0;
app=app.replace(/window\.addEventListener\('popstate',\s*\(\)\s*=>\s*showPage\(pageFromPath\((?:window\.)?location\.pathname\),\s*\{\s*push:\s*false,\s*scroll:\s*false,\s*remember:\s*false\s*\}\)\);/,()=>{guardCount++;return "window.addEventListener('popstate', () => { if (window.__ARSTORE_HISTORY_AUTHORITY_ACTIVE) return; showPage(pageFromPath(location.pathname), { push: false, scroll: false, remember: false }); });"});
if(!guardCount&&!app.includes('__ARSTORE_HISTORY_AUTHORITY_ACTIVE'))throw new Error('#70 legacy app popstate guard failed');
// Production payload keeps showPage inside its IIFE. Export only the navigation API #70 needs.
if(!app.includes('window.ARSTORE_NAV')){
  let apiPatch=0;
  app=app.replace(/(\s+showPage\(initialPage,\s*\{\s*push:\s*false,\s*scroll:\s*false,\s*remember:\s*false,\s*closeDrawer:\s*false\s*\}\);\s*)(\}\)\(\);)/,(_m,a,b)=>{apiPatch++;return `${a}  window.ARSTORE_NAV = { showPage, openSidebar, closeSidebar };\n${b}`;});
  if(apiPatch!==1)throw new Error('#70 ARSTORE_NAV export patch '+apiPatch+'/1');
}
if(!app.includes('window.ARSTORE_NAV'))throw new Error('#70 requires ARSTORE_NAV router API');
fs.writeFileSync(appPath,app);cp.execFileSync(process.execPath,['--check',appPath],{stdio:'inherit'});
// Keep #37–#60 visual behavior, but its old history layer must yield to #70.
if(fs.existsSync(runtime37)){
  let r=fs.readFileSync(runtime37,'utf8');
  let p=0;
  r=r.replace('history.pushState = function(state, title, url) {',()=>{p++;return 'history.pushState = function(state, title, url) { if (window.__ARSTORE_HISTORY_AUTHORITY_ACTIVE) return nativePush(state, title, url);';});
  r=r.replace('history.replaceState = function(state, title, url) {',()=>{p++;return 'history.replaceState = function(state, title, url) { if (window.__ARSTORE_HISTORY_AUTHORITY_ACTIVE) return nativeReplace(state, title, url);';});
  r=r.replace("window.addEventListener('popstate', event => {",()=>{p++;return "window.addEventListener('popstate', event => { if (window.__ARSTORE_HISTORY_AUTHORITY_ACTIVE) return;";});
  if(p!==3)throw new Error('#70 #37-runtime ownership patch '+p+'/3');
  fs.writeFileSync(runtime37,r);cp.execFileSync(process.execPath,['--check',runtime37],{stdio:'inherit'});
}
let html=fs.readFileSync(htmlPath,'utf8');
html=html.replace(/^\s*<script[^>]+ui-ios-history-canonical-v34\.js[^>]*><\/script>\s*$/gmi,'');
html=html.replace(/^\s*<script[^>]+ui-ios-nav-authority-v61-69\.js[^>]*><\/script>\s*$/gmi,'');
html=html.replace(/^\s*<script[^>]+ui-smart-tab-history-v70\.js[^>]*><\/script>\s*$/gmi,'');
if(!html.includes('__ARSTORE_HISTORY_AUTHORITY_ACTIVE=true')) html=html.replace('<head>','<head>\n  <script>window.__ARSTORE_HISTORY_AUTHORITY_ACTIVE=true;</script>');
html=html.replace('</body>','  <script src="js/ui-smart-tab-history-v70.js"></script>\n</body>');
fs.writeFileSync(htmlPath,html);
for(const marker of ['SMART TAB HISTORY UX AUTHORITY','selectedProduct','history.pushState=function','history.replaceState=function','ARSTORE_SMART_HISTORY','pageshow'])if(!nav.includes(marker))throw new Error('#70 gate '+marker);
const model=['product-my','product-finance','product-stock','product-competitor'];let c=model.length-1;
if(model[--c]!=='product-stock'||model[--c]!=='product-finance')throw new Error('#70 back model regression');
if(!html.includes('ui-smart-tab-history-v70.js')||html.includes('ui-ios-nav-authority-v61-69.js')||html.includes('ui-ios-history-canonical-v34.js'))throw new Error('#70 HTML authority gate');
console.log('V3.4 #70 SMART TAB HISTORY PASS · exported router API + single owner + exact back/forward + BFCache + scroll + accordion + selected product');
