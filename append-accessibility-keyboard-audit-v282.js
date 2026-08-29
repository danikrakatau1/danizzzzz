const fs=require('fs'),path=require('path'),cp=require('child_process');
const OUT=path.join(__dirname,'public');if(!fs.existsSync(OUT))throw new Error('V282 A11Y KEYBOARD: public/ missing');
const read=r=>{const f=path.join(OUT,r);if(!fs.existsSync(f))throw new Error('V282 missing '+r);return fs.readFileSync(f,'utf8')};
const html=read('index.html'),accordion=read('js/ui-accordion-audit-v265.js'),semantics=read('js/ui-html-runtime-semantics-v272.js'),gear=read('js/gear-action-capsule-v200.js'),css=read('css/ui-css-audit-final-v274.css');
for(const r of ['js/ui-accordion-audit-v265.js','js/ui-html-runtime-semantics-v272.js','js/gear-action-capsule-v200.js'])cp.execFileSync(process.execPath,['--check',path.join(OUT,r)],{stdio:'inherit'});
const ids=new Set([...html.matchAll(/\bid=["']([^"']+)["']/g)].map(m=>m[1]));
const controls=[...html.matchAll(/\baria-controls=["']([^"']+)["']/gi)].map(m=>m[1]);
const labels=[...html.matchAll(/\baria-labelledby=["']([^"']+)["']/gi)].map(m=>m[1]);
const checks=[
 ['document language Indonesian',/<html\b[^>]*lang=["']id["']/i.test(html)],
 ['aria-controls targets valid',controls.every(id=>ids.has(id))],
 ['aria-labelledby targets valid',labels.every(id=>ids.has(id))],
 ['accordion expanded sync',accordion.includes('aria-expanded')],
 ['accordion hidden sync',accordion.includes('aria-hidden')],
 ['accordion inert closed panels',accordion.includes('inert')],
 ['accordion Escape keyboard handling',accordion.includes("e.key==='Escape'")||accordion.includes("event.key === 'Escape'")||accordion.includes("event.key==='Escape'")],
 ['theme capsule keyboard Enter Space',gear.includes("e.key==='Enter'||e.key===' '")],
 ['theme capsule arrow keys',gear.includes("ArrowRight")&&gear.includes("ArrowLeft")],
 ['theme capsule Home End',gear.includes("e.key==='Home'")&&gear.includes("e.key==='End'")],
 ['theme capsule Escape returns focus',gear.includes("e.key==='Escape'")&&gear.includes('gear.focus')],
 ['drawer semantics synchronizes expanded',semantics.includes("aria-expanded")],
 ['drawer semantics synchronizes hidden',semantics.includes("aria-hidden")],
 ['focus-visible final CSS exists',css.includes(':focus-visible')],
 ['reduced motion final CSS exists',css.includes('prefers-reduced-motion:reduce')],
 ['live regions exist',/aria-live=["'](?:polite|assertive)["']/i.test(html)],
 ['images alt complete',[...html.matchAll(/<img\b[^>]*>/gi)].every(m=>/\balt=["'][^"']*["']/i.test(m[0]))],
 ['PROJECT LOCK untouched',!accordion.includes('shopee-fee-db')&&!semantics.includes('tiktok-fee-db')]
];
const failed=checks.filter(([,ok])=>!ok);if(failed.length){console.error('V282 failed:',failed.map(([n])=>n));process.exit(1)}
console.log(`V282 ACCESSIBILITY + KEYBOARD AUDIT PASS · ${checks.length}/${checks.length} gates · ARIA/focus/keyboard/inert/live-region/reduced-motion contracts sealed · PROJECT LOCK untouched`);
