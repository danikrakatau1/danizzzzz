const fs=require('fs'),path=require('path'),cp=require('child_process');
const OUT=path.join(__dirname,'public');if(!fs.existsSync(OUT))throw new Error('V280 STATE PERSISTENCE: public/ missing');
const read=r=>{const f=path.join(OUT,r);if(!fs.existsSync(f))throw new Error('V280 missing '+r);return fs.readFileSync(f,'utf8')};
const app=read('js/app.js'),history=read('js/ui-smart-tab-history-v70.js'),gear=read('js/gear-action-capsule-v200.js'),accordion=read('js/ui-accordion-audit-v265.js');
for(const r of ['js/app.js','js/ui-smart-tab-history-v70.js','js/gear-action-capsule-v200.js','js/ui-accordion-audit-v265.js'])cp.execFileSync(process.execPath,['--check',path.join(OUT,r)],{stdio:'inherit'});
const checks=[
 ['theme storage key stable',gear.includes("arstore_v3_theme")],
 ['accordion storage key stable',app.includes("arstore_v3_accordion_state")],
 ['navigation history key stable',app.includes("arstore_v3_nav_history")],
 ['session JSON reads guarded',app.includes('function readSession')&&app.includes("JSON.parse(sessionStorage.getItem(key)")&&app.includes('catch (_) { return fallback; }')],
 ['session JSON writes guarded',app.includes('function writeSession')&&app.includes('try { sessionStorage.setItem(key, JSON.stringify(value)); } catch (_) {}')],
 ['malformed history falls back to array',app.includes('Array.isArray(value) ? value : []')],
 ['malformed accordion falls back to object',app.includes("saved && typeof saved === 'object' ? saved : {}")],
 ['navigation history bounded',app.includes('value.slice(-30)')],
 ['theme localStorage write guarded',gear.includes('try{localStorage.setItem')||gear.includes('try { localStorage.setItem')],
 ['theme validates four allowed values',gear.includes("VALID=['light','dark','charcoal','oled']")],
 ['active market write guarded',app.includes("localStorage.setItem('arstore_v3_active_market'")&&app.includes('catch (_) {}')],
 ['accordion runtime avoids localStorage ownership',!accordion.includes('localStorage.setItem')],
 ['Smart History handles pageshow',history.includes('pageshow')],
 ['Smart History tracks selected product',history.includes('selectedProduct')],
 ['Smart History exports marker',history.includes('ARSTORE_SMART_HISTORY')],
 ['workspace reset storage removals guarded',app.includes('localStorage.removeItem(key)')&&app.includes('catch (_) {}')],
 ['storage code contains no credential persistence',!/(password|passwd|secret|access[_-]?token|refresh[_-]?token)\s*[,=:][^\n]{0,80}(?:localStorage|sessionStorage)/i.test(app+history+gear)],
 ['PROJECT LOCK untouched',!gear.includes('ARSTORE_STEP02_FEE_ENGINE')&&!accordion.includes('shopee-fee-db')]
];
const failed=checks.filter(([,ok])=>!ok);if(failed.length){console.error('V280 failed:',failed.map(([n])=>n));process.exit(1)}
console.log(`V280 STATE + PERSISTENCE AUDIT PASS · ${checks.length}/${checks.length} gates · guarded session/local storage + malformed-state fallbacks + bounded history sealed · PROJECT LOCK untouched`);
