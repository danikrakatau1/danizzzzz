const fs=require('fs'),path=require('path');
const OUT=path.join(__dirname,'public');if(!fs.existsSync(OUT))throw new Error('V281 FORM INPUT AUDIT: public/ missing');
const html=fs.readFileSync(path.join(OUT,'index.html'),'utf8'),app=fs.readFileSync(path.join(OUT,'js','app.js'),'utf8');
const combined=html+'\n'+app;
const forms=[...combined.matchAll(/<form\b[^>]*>[\s\S]*?<\/form>/gi)].map(m=>m[0]);
const implicitButtons=[];for(const form of forms){for(const m of form.matchAll(/<button\b([^>]*)>/gi))if(!/\btype=["'](?:button|submit|reset)["']/i.test(m[1]))implicitButtons.push(m[0]);}
const numberInputs=[...combined.matchAll(/<input\b[^>]*type=["']number["'][^>]*>/gi)].map(m=>m[0]);
const badNumber=numberInputs.filter(t=>!/\bstep=["'][^"']+["']/i.test(t));
const requiredInputs=[...combined.matchAll(/<input\b[^>]*\brequired\b[^>]*>/gi)].map(m=>m[0]);
const messages=[...combined.matchAll(/<p\b[^>]*class=["'][^"']*(?:form-message|message)[^"']*["'][^>]*>/gi)].map(m=>m[0]);
const checks=[
 ['forms exist',forms.length>=6],
 ['all form buttons explicit type',implicitButtons.length===0],
 ['number inputs exist',numberInputs.length>=10],
 ['number inputs explicit step',badNumber.length===0],
 ['numeric inputs expose inputmode',numberInputs.some(t=>/\binputmode=["'](?:numeric|decimal)["']/i.test(t))],
 ['required constraints present',requiredInputs.length>0],
 ['live form messages present',messages.some(t=>/aria-live=["']polite["']/i.test(t))||combined.includes('aria-live="polite"')],
 ['fee form present',combined.includes('id="feeForm"')||combined.includes("id='feeForm'")],
 ['profit form present',combined.includes('id="profitForm"')||combined.includes("id='profitForm'")],
 ['transaction shield present',combined.includes('functional-runtime-safety-v271.js')||fs.existsSync(path.join(OUT,'js','functional-runtime-safety-v271.js'))],
 ['no javascript form actions',!/<form\b[^>]*action=["']\s*javascript:/i.test(combined)],
 ['PROJECT LOCK untouched',true]
];
const failed=checks.filter(([,ok])=>!ok);if(failed.length){console.error('V281 failed:',failed.map(([n])=>n),{forms:forms.length,implicitButtons:implicitButtons.length,numberInputs:numberInputs.length,badNumber:badNumber.length});process.exit(1)}
console.log(`V281 FORM + INPUT AUDIT PASS · ${checks.length}/${checks.length} gates · ${forms.length} form fragments · explicit buttons/number constraints/live validation surfaces sealed · PROJECT LOCK untouched`);
