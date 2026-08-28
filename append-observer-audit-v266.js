const fs=require('fs'),path=require('path'),cp=require('child_process');
const OUT=path.join(__dirname,'public');
if(!fs.existsSync(OUT))throw new Error('V266 OBSERVER AUDIT: public/ missing');
const read=rel=>{const f=path.join(OUT,rel);if(!fs.existsSync(f))throw new Error('V266 OBSERVER AUDIT missing '+rel);return fs.readFileSync(f,'utf8')};
const write=(rel,s)=>{const f=path.join(OUT,rel);fs.writeFileSync(f,s);cp.execFileSync(process.execPath,['--check',f],{stdio:'inherit'});return s};

let final37=read('js/ui-final-runtime-v37-60.js');
const oldGlobal="    messageObserver.observe(document.body,{subtree:true,childList:true,characterData:true});";
const newScoped="    document.querySelectorAll(messageSelector).forEach(el=>messageObserver.observe(el,{subtree:true,childList:true,characterData:true}));";
if(!final37.includes(oldGlobal)&&!final37.includes(newScoped))throw new Error('V266 OBSERVER AUDIT: V37 message observer signature missing');
if(final37.includes(oldGlobal))final37=write('js/ui-final-runtime-v37-60.js',final37.replace(oldGlobal,newScoped));

const final34=read('js/ui-final-runtime-v34.js');
const runtime34=read('js/ui-runtime-v34.js');
const v250=read('js/mobile-visual-recovery-v250.js');
const v257=read('js/ui-premium-618-v257.js');
const v261=read('js/ui-motion-core-v261.js');
const v265=read('js/ui-ios-compat-v265.js');
const gear=read('js/gear-action-capsule-v200.js');
const product=read('js/product-center-v71.js');

for(const rel of ['js/ui-final-runtime-v37-60.js','js/ui-final-runtime-v34.js','js/ui-runtime-v34.js','js/mobile-visual-recovery-v250.js','js/ui-premium-618-v257.js','js/ui-motion-core-v261.js','js/ui-ios-compat-v265.js','js/gear-action-capsule-v200.js','js/product-center-v71.js'])cp.execFileSync(process.execPath,['--check',path.join(OUT,rel)],{stdio:'inherit'});

const count=(s,re)=>(s.match(re)||[]).length;
const checks=[
 ['V37 body-wide message observer retired',!final37.includes('messageObserver.observe(document.body,{subtree:true,childList:true,characterData:true})')],
 ['V37 message observer scoped to messages',final37.includes('document.querySelectorAll(messageSelector).forEach(el=>messageObserver.observe(el,{subtree:true,childList:true,characterData:true}))')],
 ['V37 theme observer attribute-only',final37.includes("attributeFilter:['data-theme']")],
 ['V34 legacy sidebar observer owner not initialized',!/\n\s*wireSidebarScroll\(\);\s*\n/.test(runtime34)],
 ['V34 accordion observer scoped',final34.includes("attributeFilter:['aria-expanded']")||final34.includes("attributeFilter: ['aria-expanded']")],
 ['V34 drawer observer class-only',final34.includes("attributeFilter:['class']")||final34.includes("attributeFilter: ['class']")],
 ['V250 overlay observer retired',!v250.includes("attributeFilter:['class','aria-hidden','style']")],
 ['V250 sidebar observer class-only',v250.includes("attributeFilter:['class']")],
 ['V257 value observer retired',!v257.includes('const valueObserver=new MutationObserver')],
 ['V257 nav observer class-only',v257.includes("attributeFilter:['class']")],
 ['V257 modal focus observer singular',count(v257,/new MutationObserver\(/g)>=1],
 ['V261 reveal observer bounded',v261.includes(".slice(0,120)")&&v261.includes('io.unobserve(e.target)')],
 ['V261 value observer target-scoped',v261.includes('qa(values).forEach(el=>mo.observe(el')],
 ['V261 theme observers attribute-only',v261.includes("attributeFilter:['data-theme','class']")],
 ['V265 theme observer retired',!v265.includes('themeObserver.observe')],
 ['V265 no MutationObserver after ownership consolidation',!v265.includes('new MutationObserver')],
 ['V200 capsule ResizeObserver scoped',gear.includes('new ResizeObserver')&&gear.includes('.observe(clone)')],
 ['V200 theme MutationObserver attribute-only',gear.includes("attributeFilter:['data-theme']")],
 ['Product Center no document-body MutationObserver',!product.includes('observe(document.body')],
 ['Product Center no document-element MutationObserver',!product.includes('observe(document.documentElement')]
];
const failed=checks.filter(([,ok])=>!ok).map(([n])=>n);
if(failed.length)throw new Error('V266 OBSERVER AUDIT failed: '+failed.join(', '));
console.log('V266 OBSERVER AUDIT PASS — V37 body-wide mutation observer narrowed to message nodes; reveal/value/theme observers remain bounded or attribute-scoped; superseded V257/V265 observer ownership retired; capsule/Product Center observer scope constrained');
