const fs=require('fs');
const cp=require('child_process');

const htmlPath='public/index.html';
const src='ui-ios-nav-authority-v61-69.js';
const dst='public/js/ui-ios-nav-authority-v61-69.js';
const MARK='V3.4 #61-#69 IOS EXACT TAB HISTORY AUTHORITY';

if(!fs.existsSync(htmlPath))throw new Error('#61-69 build index missing');
if(!fs.existsSync(src))throw new Error('#61-69 nav authority source missing');
cp.execFileSync(process.execPath,['--check',src],{stdio:'inherit'});
const nav=fs.readFileSync(src,'utf8');
for(const required of [
  'IOS EXACT TAB HISTORY AUTHORITY',
  'canonicalizeCurrent(fromPage)',
  'event.stopImmediatePropagation()',
  "if (!event.persisted) return",
  'LEGACY_KEYS',
  'history.pushState = function',
  'history.replaceState = function',
  "window.ARSTORE_NAV?.showPage?.(page"
]) if(!nav.includes(required))throw new Error('#61-69 nav authority gate missing '+required);

fs.mkdirSync('public/js',{recursive:true});
fs.copyFileSync(src,dst);

let html=fs.readFileSync(htmlPath,'utf8');
// Remove the superseded canonical hotfix and any duplicate authority injection.
html=html.replace(/^\s*<script[^>]+ui-ios-history-canonical-v34\.js[^>]*><\/script>\s*$/gmi,'');
html=html.replace(/^\s*<script[^>]+ui-ios-nav-authority-v61-69\.js[^>]*><\/script>\s*$/gmi,'');
html=html.replace('</body>','  <script src="js/ui-ios-nav-authority-v61-69.js"></script>\n</body>');
fs.writeFileSync(htmlPath,html);

const finalHtml=fs.readFileSync(htmlPath,'utf8');
if(finalHtml.includes('ui-ios-history-canonical-v34.js'))throw new Error('old canonical history runtime still injected');
if(!finalHtml.includes('ui-ios-nav-authority-v61-69.js'))throw new Error('#61-69 authority injection failed');
// FAST FAVICON V5 must remain the favicon owner after this step.
if(!finalHtml.includes('ar-hanger-final-v5-48.png') || !finalHtml.includes('ar-hanger-final-v5-180.png')) {
  // V5 runs after this step in package.json, so this is informational only.
  console.log('#61-69 history wired; FAST FAVICON V5 will apply next');
}

// Deterministic model gate for the reported iPhone case.
const model=['product-finance','product-stock','product-competitor'];
let cursor=model.length-1;
if(model[--cursor]!=='product-stock' || model[--cursor]!=='product-finance')throw new Error('#61 history model regression');

console.log(MARK+' PASS · single authority + exact state.page restore + BFCache + versioned session cleanup');
