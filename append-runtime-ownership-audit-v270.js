const fs=require('fs'),path=require('path'),cp=require('child_process');
const OUT=path.join(__dirname,'public');
if(!fs.existsSync(OUT))throw new Error('V270 RUNTIME OWNERSHIP: public/ missing');
const htmlPath=path.join(OUT,'index.html');
const files={
  runtime34:path.join(OUT,'js','ui-runtime-v34.js'),
  final34:path.join(OUT,'js','ui-final-runtime-v34.js'),
  v250:path.join(OUT,'js','mobile-visual-recovery-v250.js'),
  v257:path.join(OUT,'js','ui-premium-618-v257.js'),
  v261:path.join(OUT,'js','ui-motion-core-v261.js'),
  v264:path.join(OUT,'js','ui-ios-navigation-v264.js'),
  v265:path.join(OUT,'js','ui-accordion-audit-v265.js')
};
for(const p of Object.values(files))if(!fs.existsSync(p))throw new Error('V270 missing '+p);
let html=fs.readFileSync(htmlPath,'utf8');
let runtime34=fs.readFileSync(files.runtime34,'utf8');
let final34=fs.readFileSync(files.final34,'utf8');
let v250=fs.readFileSync(files.v250,'utf8');
let v257=fs.readFileSync(files.v257,'utf8');
const v261=fs.readFileSync(files.v261,'utf8');
const v264=fs.readFileSync(files.v264,'utf8');
const v265=fs.readFileSync(files.v265,'utf8');

// V258 JS is superseded by V261; retain its CSS/presentation only.
html=html.replace(/^\s*<script[^>]+ui-motion-core-v258\.js[^>]*><\/script>\s*$/gmi,'');

// Sidebar wheel owner was retired by V269; keep this idempotent.
runtime34=runtime34.replace(/\n\s*wireSidebarScroll\(\);\s*\n/,'\n');

// Accordion reveal should have one schedule source: aria-expanded observer.
final34=final34.replace('[0, 90, 220, 380].forEach(delay => {','[0, 260].forEach(delay => {');
final34=final34.replace(
`    nav.addEventListener('click', event => {\n      const toggle = event.target.closest('[data-nav-toggle]');\n      if (toggle) {\n        settle(toggle);\n        return;\n      }\n      const leaf = event.target.closest('.nav-item,.nav-subitem');\n      if (leaf) window.setTimeout(() => revealElement(leaf, 18), 40);\n    });`,
`    nav.addEventListener('click', event => {\n      if (event.target.closest('[data-nav-toggle]')) return;\n      const leaf = event.target.closest('.nav-item,.nav-subitem');\n      if (leaf) window.setTimeout(() => revealElement(leaf, 18), 40);\n    });`);

// V200/base app own capsule + drawer clicks. V250 remains overlay recovery/presentation only.
v250=v250.replace("function buildCapsule(){const actions=q('.topbar-actions');","function buildCapsule(){if(window.ARSTORE_GEAR_V200)return;const actions=q('.topbar-actions');");
v250=v250.replace("if(s)new MutationObserver(()=>requestAnimationFrame(syncOverlay)).observe(s,{attributes:true,attributeFilter:['class','aria-hidden']});","if(s)new MutationObserver(()=>requestAnimationFrame(syncOverlay)).observe(s,{attributes:true,attributeFilter:['class']});");
for(const snippet of [
 "if(ov)new MutationObserver(()=>requestAnimationFrame(syncOverlay)).observe(ov,{attributes:true,attributeFilter:['class','aria-hidden','style']});",
 "if(menu)menu.addEventListener('click',()=>setTimeout(syncOverlay,0));",
 "document.addEventListener('click',e=>{if(e.target.closest('.sidebar .nav-item,.sidebar .nav-subitem,.sidebar [data-page]'))setTimeout(hardCloseDrawer,0)},true);",
 "if(ov)ov.addEventListener('click',()=>setTimeout(hardCloseDrawer,0),true);"
])v250=v250.replace(snippet,'');

// V257 keeps accessibility helpers, but yields theme, accordion Escape, viewport and value animation to newer layers.
v257=v257.replace(/try\{const raw=localStorage\.getItem\(themeKey\);if\(raw\)\{const t=raw\.replaceAll\('"',''\);if\(\['light','dark','charcoal'\]\.includes\(t\)\)\{root\.dataset\.theme=t;d\.body\?\.setAttribute\('data-theme',t\)\}\}\}catch\{\}/,'');
v257=v257.replace("if(e.key==='Escape'){const overlay=qs('.sidebar-overlay');if(sidebar?.classList.contains('open'))overlay?.click();qsa('[aria-expanded=\"true\"]').forEach(x=>{if(x.matches('button,summary,[role=\"button\"]'))x.setAttribute('aria-expanded','false')})}",'');
v257=v257.replace(/d\.addEventListener\('click',e=>\{const c=e\.target\.closest\('\[data-theme-choice\]'\);if\(!c\)return;const t=c\.dataset\.themeChoice;if\(!\['light','dark','charcoal'\]\.includes\(t\)\)return;root\.dataset\.theme=t;d\.body\.setAttribute\('data-theme',t\);storage\.set\(themeKey,t\);const meta=qs\('meta\[name="theme-color"\]'\);if\(meta\)meta\.content=t==='light'\?'#eef2f7':t==='charcoal'\?'#101114':'#080b12'\}\);/,'');
v257=v257.replace(/if\(w\.visualViewport\)\{const vv=\(\)=>\{const occluded=Math\.max\(0,w\.innerHeight-w\.visualViewport\.height\);root\.style\.setProperty\('--ar-keyboard-h',occluded\+'px'\);d\.body\.classList\.toggle\('ar-keyboard-open',occluded>120\)\};w\.visualViewport\.addEventListener\('resize',vv,\{passive:true\}\);w\.visualViewport\.addEventListener\('scroll',vv,\{passive:true\}\);vv\(\)\}/,'');
v257=v257.replace(/const resultSelectors='\.snapshot-grid strong,\.metric-value,\.result-value,\[data-number\],\.profit-value,\.margin-value,\.roas-value';const mark=el=>\{el\.classList\.remove\('ar-value-updated'\);void el\.offsetWidth;el\.classList\.add\('ar-value-updated'\);setTimeout\(\(\)=>el\.classList\.remove\('ar-value-updated'\),500\)\};const valueObserver=new MutationObserver\(m=>m\.forEach\(x=>\{const el=x\.target\.nodeType===3\?x\.target\.parentElement:x\.target;if\(el\?\.matches\?\.\(resultSelectors\)\)mark\(el\)\}\)\);qsa\(resultSelectors\)\.forEach\(el=>valueObserver\.observe\(el,\{subtree:true,childList:true,characterData:true\}\)\);/,'');

fs.writeFileSync(htmlPath,html);
fs.writeFileSync(files.runtime34,runtime34);
fs.writeFileSync(files.final34,final34);
fs.writeFileSync(files.v250,v250);
fs.writeFileSync(files.v257,v257);
for(const p of Object.values(files))cp.execFileSync(process.execPath,['--check',p],{stdio:'inherit'});

const checks=[
 ['V258 runtime retired',!html.includes('ui-motion-core-v258.js')],
 ['V258 CSS retained',html.includes('ui-motion-core-v258.css')],
 ['V261 runtime retained',html.includes('ui-motion-core-v261.js')],
 ['legacy sidebar wheel owner inactive',!/\n\s*wireSidebarScroll\(\);\s*\n/.test(runtime34)],
 ['accordion reveal single toggle source',!final34.includes("if (toggle) {\n        settle(toggle);")],
 ['accordion reveal settle reduced',final34.includes('[0, 260].forEach(delay => {')],
 ['V250 yields capsule to V200',v250.includes('if(window.ARSTORE_GEAR_V200)return')],
 ['V250 overlay observer retired',!v250.includes("attributeFilter:['class','aria-hidden','style']")],
 ['V250 hamburger click retired',!v250.includes("menu.addEventListener('click'")],
 ['V250 nav close click retired',!v250.includes(".sidebar .nav-item,.sidebar .nav-subitem,.sidebar [data-page]'))setTimeout(hardCloseDrawer")],
 ['V250 overlay click retired',!v250.includes("ov.addEventListener('click'")],
 ['V257 legacy theme init retired',!v257.includes('const raw=localStorage.getItem(themeKey)')],
 ['V257 theme click retired',!v257.includes("const c=e.target.closest('[data-theme-choice]')")],
 ['V257 accordion Escape mutation retired',!v257.includes("qsa('[aria-expanded=\"true\"]')")],
 ['V257 VisualViewport owner retired',!v257.includes("visualViewport.addEventListener('resize',vv")],
 ['V257 value observer retired',!v257.includes('const valueObserver=new MutationObserver')],
 ['V261 modern motion authority intact',v261.includes('ARSTORE')||v261.includes('setupDrawerGesture')],
 ['V264 iOS authority intact',v264.includes('ARSTORE_IOS_NAV_V264')],
 ['V265 accordion authority intact',v265.includes('ARSTORE_ACCORDION_AUDIT_V265')],
 ['PROJECT LOCK untouched',!v250.includes('shopee-fee-db')&&!v250.includes('tiktok-fee-db')&&!v257.includes('shopee-fee-db')&&!v257.includes('tiktok-fee-db')]
];
const failed=checks.filter(([,ok])=>!ok);
if(failed.length){console.error('V270 failed checks:',failed.map(([n])=>n));process.exit(1)}
console.log(`V270 RUNTIME OWNERSHIP CONSOLIDATION PASS · ${checks.length}/${checks.length} gates · legacy V258/V250/V257 owners retired · one runtime authority per concern · PROJECT LOCK untouched`);
