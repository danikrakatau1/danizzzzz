const fs=require('fs'),path=require('path'),cp=require('child_process');
const out=path.join(__dirname,'public');
if(!fs.existsSync(out))throw new Error('V266 B2.8 gate: public/ missing');
const htmlPath=path.join(out,'index.html');
let html=fs.readFileSync(htmlPath,'utf8');

function replaceOnce(text,before,after,label){
  if(!text.includes(before))throw new Error('V266 B2.8 signature missing: '+label);
  return text.replace(before,after);
}
function patchFile(rel,fn){
  const file=path.join(out,rel);
  if(!fs.existsSync(file))throw new Error('V266 B2.8 missing '+rel);
  let text=fs.readFileSync(file,'utf8');
  text=fn(text);
  fs.writeFileSync(file,text);
  cp.execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
  return text;
}

// V258 JS is fully superseded by V261. Keep its CSS for visual compatibility,
// but run only one motion runtime to avoid duplicate pointer/scroll/theme/viewport observers.
html=html.replace(/^\s*<script[^>]+ui-motion-core-v258\.js[^>]*><\/script>\s*$/gmi,'');

// Base V34 runtime no longer owns sidebar scrolling. Native overflow is canonical;
// final-runtime-v34 may reveal clicked/expanded items after layout settles.
const runtime34=patchFile(path.join('js','ui-runtime-v34.js'),text=>
  replaceOnce(text,'    wireSidebarScroll();\n','    // V266 B2.8: native sidebar scroll; legacy wheel/click observer owner retired.\n','ui-runtime sidebar owner')
);

// Final reveal owner: avoid scheduling the same accordion reveal from both click
// and MutationObserver, and reduce four settle passes to two stable measurements.
const final34=patchFile(path.join('js','ui-final-runtime-v34.js'),text=>{
  text=replaceOnce(text,'      [0, 90, 220, 380].forEach(delay => {','      [0, 260].forEach(delay => {','final reveal settle passes');
  const oldClick=`    nav.addEventListener('click', event => {\n      const toggle = event.target.closest('[data-nav-toggle]');\n      if (toggle) {\n        settle(toggle);\n        return;\n      }\n      const leaf = event.target.closest('.nav-item,.nav-subitem');\n      if (leaf) window.setTimeout(() => revealElement(leaf, 18), 40);\n    });`;
  const newClick=`    nav.addEventListener('click', event => {\n      // Accordion toggles are revealed by the aria-expanded observer below.\n      // Keep click ownership only for leaf navigation so one interaction creates one reveal schedule.\n      if (event.target.closest('[data-nav-toggle]')) return;\n      const leaf = event.target.closest('.nav-item,.nav-subitem');\n      if (leaf) window.setTimeout(() => revealElement(leaf, 18), 40);\n    });`;
  return replaceOnce(text,oldClick,newClick,'final reveal duplicate click');
});

// V250 remains a recovery layer only. V200 owns the theme capsule and base app
// owns hamburger/overlay/nav actions. Observe canonical sidebar class only.
const v250=patchFile(path.join('js','mobile-visual-recovery-v250.js'),text=>{
  text=replaceOnce(text,"function buildCapsule(){const actions=q('.topbar-actions');","function buildCapsule(){if(window.ARSTORE_GEAR_V200)return;const actions=q('.topbar-actions');",'V250 capsule owner guard');
  text=replaceOnce(text,"if(s)new MutationObserver(()=>requestAnimationFrame(syncOverlay)).observe(s,{attributes:true,attributeFilter:['class','aria-hidden']});","if(s)new MutationObserver(()=>requestAnimationFrame(syncOverlay)).observe(s,{attributes:true,attributeFilter:['class']});",'V250 sidebar observer scope');
  for(const [before,label] of [
    ["if(ov)new MutationObserver(()=>requestAnimationFrame(syncOverlay)).observe(ov,{attributes:true,attributeFilter:['class','aria-hidden','style']});",'V250 overlay observer'],
    ["if(menu)menu.addEventListener('click',()=>setTimeout(syncOverlay,0));",'V250 menu click owner'],
    ["document.addEventListener('click',e=>{if(e.target.closest('.sidebar .nav-item,.sidebar .nav-subitem,.sidebar [data-page]'))setTimeout(hardCloseDrawer,0)},true);",'V250 nav click owner'],
    ["if(ov)ov.addEventListener('click',()=>setTimeout(hardCloseDrawer,0),true);",'V250 overlay click owner']
  ]) text=replaceOnce(text,before,'',label);
  return text;
});

// V257 keeps accessibility/scroll-state helpers, but yields theme, viewport,
// accordion Escape state and value animation ownership to newer layers.
const v257=patchFile(path.join('js','ui-premium-618-v257.js'),text=>{
  const legacyThemeInit=`const themeKey='arstore-theme';try{const raw=localStorage.getItem(themeKey);if(raw){const t=raw.replaceAll('"','');if(['light','dark','charcoal'].includes(t)){root.dataset.theme=t;d.body?.setAttribute('data-theme',t)}}}catch{}`;
  text=replaceOnce(text,legacyThemeInit,"const themeKey='arstore-theme';",'V257 legacy theme init');
  const legacyThemeClick=`d.addEventListener('click',e=>{const c=e.target.closest('[data-theme-choice]');if(!c)return;const t=c.dataset.themeChoice;if(!['light','dark','charcoal'].includes(t))return;root.dataset.theme=t;d.body.setAttribute('data-theme',t);storage.set(themeKey,t);const meta=qs('meta[name="theme-color"]');if(meta)meta.content=t==='light'?'#eef2f7':t==='charcoal'?'#101114':'#080b12'});`;
  text=replaceOnce(text,legacyThemeClick,'','V257 theme click owner');
  const oldKeydown=`d.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('.tool-card[tabindex],[data-go][tabindex],[role="button"][tabindex]')){e.preventDefault();e.target.click()}if(e.key==='Escape'){const overlay=qs('.sidebar-overlay');if(sidebar?.classList.contains('open'))overlay?.click();qsa('[aria-expanded="true"]').forEach(x=>{if(x.matches('button,summary,[role="button"]'))x.setAttribute('aria-expanded','false')})}});`;
  const newKeydown=`d.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('.tool-card[tabindex],[data-go][tabindex],[role="button"][tabindex]')){e.preventDefault();e.target.click()}});`;
  text=replaceOnce(text,oldKeydown,newKeydown,'V257 Escape ownership');
  const vvBlock=`if(w.visualViewport){const vv=()=>{const occluded=Math.max(0,w.innerHeight-w.visualViewport.height);root.style.setProperty('--ar-keyboard-h',occluded+'px');d.body.classList.toggle('ar-keyboard-open',occluded>120)};w.visualViewport.addEventListener('resize',vv,{passive:true});w.visualViewport.addEventListener('scroll',vv,{passive:true});vv()}`;
  text=replaceOnce(text,vvBlock,'','V257 VisualViewport owner');
  const valueBlock=`const resultSelectors='.snapshot-grid strong,.metric-value,.result-value,[data-number],.profit-value,.margin-value,.roas-value';const mark=el=>{el.classList.remove('ar-value-updated');void el.offsetWidth;el.classList.add('ar-value-updated');setTimeout(()=>el.classList.remove('ar-value-updated'),500)};const valueObserver=new MutationObserver(m=>m.forEach(x=>{const el=x.target.nodeType===3?x.target.parentElement:x.target;if(el?.matches?.(resultSelectors))mark(el)}));qsa(resultSelectors).forEach(el=>valueObserver.observe(el,{subtree:true,childList:true,characterData:true}));`;
  text=replaceOnce(text,valueBlock,'','V257 value observer owner');
  return text;
});

// V265 owns iOS viewport/keyboard/input compatibility only. V266 owns iOS
// drawer reconciliation and the global final runtime owns theme-color.
const v265=patchFile(path.join('js','ui-ios-compat-v265.js'),text=>{
  text=replaceOnce(text,'  function recover(){setViewportVars();syncThemeColor();enhanceInputs();reconcileUI();applyMotionPolicy();}','  function recover(){setViewportVars();enhanceInputs();applyMotionPolicy();}','V265 recovery ownership');
  text=replaceOnce(text,"  document.addEventListener('arstore:page-change',()=>setTimeout(recover,0));\n",'', 'V265 page-change duplicate recovery');
  const themeObserver=`  const themeObserver=new MutationObserver(()=>syncThemeColor());\n  themeObserver.observe(D,{attributes:true,attributeFilter:['data-theme']});\n\n`;
  text=replaceOnce(text,themeObserver,'','V265 theme-color observer');
  return text;
});

// V261 keeps VisualViewport only for Android/other non-iOS motion behavior.
const v261=patchFile(path.join('js','ui-motion-core-v261.js'),text=>
  replaceOnce(text,'    const vv=visualViewport;let baseH=vv?.height||innerHeight;','    const vv=platform===\'ios\'?null:visualViewport;let baseH=vv?.height||innerHeight;','V261 iOS VisualViewport owner')
);

// B2.1 pointer/keyboard intent already arms the transition. A subsequent
// data-theme mutation must not restart the same timer; programmatic changes still arm it.
const themeMotion=patchFile(path.join('js','ui-theme-motion-v266.js'),text=>
  replaceOnce(text,"      arm();\n      const theme=root.dataset.theme||'dark';","      if(!root.classList.contains('ar266-theme-transitioning'))arm();\n      const theme=root.dataset.theme||'dark';",'B2.1 duplicate arm')
);

fs.writeFileSync(htmlPath,html);
const checks=[
  ['V258 runtime retired',!html.includes('ui-motion-core-v258.js')],
  ['V257 runtime retained',html.includes('ui-premium-618-v257.js')],
  ['legacy sidebar owner not initialized',!runtime34.includes('    wireSidebarScroll();\n')],
  ['final reveal single toggle source',!final34.includes('if (toggle) {\n        settle(toggle);')],
  ['V250 V200 guard',v250.includes('if(window.ARSTORE_GEAR_V200)return')],
  ['V250 nav click owner retired',!v250.includes(".sidebar .nav-item,.sidebar .nav-subitem,.sidebar [data-page]'))setTimeout(hardCloseDrawer")],
  ['V250 overlay observer retired',!v250.includes("attributeFilter:['class','aria-hidden','style']")],
  ['V257 legacy theme init retired',!v257.includes("const raw=localStorage.getItem(themeKey)")],
  ['V257 theme click retired',!v257.includes("const c=e.target.closest('[data-theme-choice]')")],
  ['V257 accordion aria mutation retired',!v257.includes("qsa('[aria-expanded=\"true\"]')")],
  ['V257 VisualViewport retired',!v257.includes("w.visualViewport.addEventListener('resize',vv")],
  ['V257 value observer retired',!v257.includes('const valueObserver=new MutationObserver')],
  ['V265 drawer reconciliation yielded',v265.includes('function recover(){setViewportVars();enhanceInputs();applyMotionPolicy();}')],
  ['V265 theme observer retired',!v265.includes('themeObserver.observe')],
  ['V265 page-change recovery retired',!v265.includes("document.addEventListener('arstore:page-change'" )],
  ['V261 iOS viewport yielded',v261.includes("platform==='ios'?null:visualViewport")],
  ['theme mutation does not restart active timer',themeMotion.includes("if(!root.classList.contains('ar266-theme-transitioning'))arm();")]
];
const failed=checks.filter(([,ok])=>!ok).map(([name])=>name);
if(failed.length)throw new Error('V266 B2.8 gate failed: '+failed.join(', '));
console.log('V266 B2.8 PASS — runtime ownership consolidated; native sidebar scroll restored; legacy V257/V258/V250 conflicts retired; V266 solely reconciles iOS drawer; V265 owns viewport/input only; theme timers single-owned; engine/data/formula untouched');
