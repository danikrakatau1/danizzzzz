const fs=require('fs'),path=require('path'),cp=require('child_process');
const OUT=path.join(__dirname,'public');if(!fs.existsSync(OUT))throw new Error('V287 ACCORDION LOOP HOTFIX: public/ missing');
const html=fs.readFileSync(path.join(OUT,'index.html'),'utf8');
const jsPath=path.join(OUT,'js','ui-accordion-audit-v265.js');if(!fs.existsSync(jsPath))throw new Error('V287 accordion runtime missing');
const js=fs.readFileSync(jsPath,'utf8');cp.execFileSync(process.execPath,['--check',jsPath],{stdio:'inherit'});
const checks=[
 ['V265 runtime wired once',(html.match(/ui-accordion-audit-v265\.js/g)||[]).length===1],
 ['observer exists',js.includes('new MutationObserver')],
 ['observer sync is non-animated',js.includes("touched.forEach(group=>syncGroup(group,groups.indexOf(group),{animate:false}))")],
 ['observer does not animate touched groups',!js.includes("touched.forEach(group=>syncGroup(group,groups.indexOf(group),{animate:true}))")],
 ['user click still animates',js.includes("queueMicrotask(()=>syncGroup(group,[...document.querySelectorAll(GROUP_SELECTOR)].indexOf(group),{animate:true}))")],
 ['transition timer retained',js.includes('setTimeout(()=>finishTransition(group),MOTION_MS)')],
 ['rapid double-click guard retained',js.includes('stopImmediatePropagation')],
 ['ARIA expanded sync retained',js.includes("aria-expanded")],
 ['inert sync retained',js.includes('panel.inert=closed')],
 ['page-change sync retained',js.includes("arstore:page-change")],
 ['loopfix marker retained',js.includes("265.1-loopfix")],
 ['PROJECT LOCK untouched',!js.includes('ARSTORE_STEP02_FEE_ENGINE')&&!js.includes('shopee-fee-db')&&!js.includes('tiktok-fee-db')]
];
const failed=checks.filter(([,ok])=>!ok);if(failed.length){console.error('V287 failed:',failed.map(([n])=>n));process.exit(1)}
console.log(`V287 ACCORDION FEEDBACK LOOP HOTFIX PASS · ${checks.length}/${checks.length} gates · observer cannot re-arm transition guard · PROJECT LOCK untouched`);
