const fs=require('fs'),cp=require('child_process');
const OUT='public';
const files={
  final37:`${OUT}/js/ui-final-runtime-v37-60.js`,
  v261:`${OUT}/js/ui-motion-core-v261.js`,
  v265:`${OUT}/js/ui-accordion-audit-v265.js`,
  gear:`${OUT}/js/gear-action-capsule-v200.js`
};
for(const p of Object.values(files))if(!fs.existsSync(p))throw new Error('V268 OBSERVER AUDIT missing '+p);
let final37=fs.readFileSync(files.final37,'utf8');

// #13 Observer Scope Audit: message-state tracking must never watch the entire body subtree.
const oldDecl="  const messageObserver = new MutationObserver(records => {\n";
if(!final37.includes(oldDecl))throw new Error('V268 observer declaration not found');
if(final37.includes("messageObserver.observe(document.body,{subtree:true,childList:true,characterData:true});")){
  final37=final37.replace(
    "  const messageObserver = new MutationObserver(records => {\n",
    "  const observedMessages = new WeakSet();\n  const messageObserver = new MutationObserver(records => {\n"
  );
  final37=final37.replace(
    "  function init() {",
    "  function bindMessageObservers(scope=document) {\n    scope.querySelectorAll?.(messageSelector).forEach(el => {\n      if (observedMessages.has(el)) return;\n      observedMessages.add(el);\n      messageObserver.observe(el,{subtree:true,childList:true,characterData:true});\n    });\n  }\n\n  function init() {"
  );
  final37=final37.replace(
    "    messageObserver.observe(document.body,{subtree:true,childList:true,characterData:true});",
    "    bindMessageObservers();"
  );
  final37=final37.replace(
    "    refreshEmptyStates();\n  });",
    "    refreshEmptyStates();\n    bindMessageObservers(document.getElementById(`page-${page}`) || document);\n  });"
  );
}
fs.writeFileSync(files.final37,final37);
for(const p of Object.values(files))cp.execFileSync(process.execPath,['--check',p],{stdio:'inherit'});
const read=p=>fs.readFileSync(p,'utf8');
const v261=read(files.v261),v265=read(files.v265),gear=read(files.gear);
const count=(s,re)=>(s.match(re)||[]).length;
const broadBodyObserver=/\.observe\(document\.body\s*,\s*\{[^}]*subtree\s*:\s*true/i;
const broadDocumentObserver=/\.observe\(document\s*,\s*\{[^}]*subtree\s*:\s*true/i;
const checks=[
 ['legacy full-body message observer retired',!broadBodyObserver.test(final37)],
 ['no full-document subtree observer',!broadDocumentObserver.test(final37)&&!broadDocumentObserver.test(v261)&&!broadDocumentObserver.test(v265)&&!broadDocumentObserver.test(gear)],
 ['message observers bound per target',final37.includes('const observedMessages = new WeakSet()')&&final37.includes('messageObserver.observe(el,{subtree:true,childList:true,characterData:true})')],
 ['message observer binding idempotent',final37.includes('if (observedMessages.has(el)) return')&&final37.includes('observedMessages.add(el)')],
 ['page-change rebind scoped to active page',final37.includes('bindMessageObservers(document.getElementById(`page-${page}`) || document)')],
 ['theme observer filtered to data-theme',final37.includes("attributeFilter:['data-theme']")],
 ['V261 metric observer targets metric elements only',v261.includes('qa(values).forEach(el=>mo.observe(el,{childList:true,characterData:true,subtree:true}))')],
 ['V261 theme observers are attribute-filtered',count(v261,/attributeFilter:\['data-theme','class'\]/g)===2],
 ['V265 accordion observer watches group class only',v265.includes("observer.observe(group,{attributes:true,attributeFilter:['class']})")],
 ['Gear theme observer watches root data-theme only',gear.includes("attributeFilter:['data-theme']")],
 ['observer audit does not touch route/history',!final37.includes('ARSTORE_OBSERVER_ROUTE_OWNER')],
 ['PROJECT LOCK untouched',!final37.includes('shopee-fee-db')&&!final37.includes('tiktok-fee-db')&&!v261.includes('shopee-fee-db')&&!v261.includes('tiktok-fee-db')]
];
const failed=checks.filter(([,ok])=>!ok);
if(failed.length){console.error('V268 failed checks:',failed.map(([n])=>n));process.exit(1);}
console.log(`V268 OBSERVER + MUTATION SCOPE AUDIT PASS · ${checks.length}/${checks.length} gates · full-body observer retired · message/theme/accordion observers narrowly scoped · PROJECT LOCK untouched`);
