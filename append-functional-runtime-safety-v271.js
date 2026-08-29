const fs=require('fs'),path=require('path'),cp=require('child_process');
const OUT=path.join(__dirname,'public');
if(!fs.existsSync(OUT))throw new Error('V271 FUNCTIONAL RUNTIME SAFETY: public/ missing');
const htmlPath=path.join(OUT,'index.html');
const files={research:path.join(OUT,'js','research.js'),fee:path.join(OUT,'js','fee-engine-ui.js'),profit:path.join(OUT,'js','profit-engine-ui.js')};
for(const p of Object.values(files))if(!fs.existsSync(p))throw new Error('V271 missing '+p);
let research=fs.readFileSync(files.research,'utf8');
let fee=fs.readFileSync(files.fee,'utf8');
let profit=fs.readFileSync(files.profit,'utf8');
let html=fs.readFileSync(htmlPath,'utf8');

// Research entry points all yield to the existing request-running guard.
research=research.replace(/\$\('reanalyzeBtn'\)\?\.addEventListener\('click',\s*runResearch\);/g,"$('reanalyzeBtn')?.addEventListener('click', triggerResearch);");
research=research.replace(/Netlify Dev/gi,'Vercel Dev');

// Retire the known auto-mode confidence recursion when the generated runtime still carries it.
profit=profit.replace("message('Belum ada hasil Fee Engine yang presisi. Selesaikan Step 02 terlebih dahulu.','error');confidence();return false","message('Belum ada hasil Fee Engine yang presisi. Selesaikan Step 02 terlebih dahulu.','error');E.conf.textContent='CONFIDENCE · LOW';E.conf.className='low';return false");

fs.writeFileSync(files.research,research);
fs.writeFileSync(files.profit,profit);

// Transaction shield is deliberately separate from calculation engines: it only freezes UI controls
// around valid submits and never reads, rewrites, or computes fee/profit values.
const shield=`(()=>{'use strict';
const bind=(formId,extraSelector,hold)=>{const form=document.getElementById(formId);if(!form||form.dataset.v271Shield==='1')return;form.dataset.v271Shield='1';form.addEventListener('submit',()=>{if(!form.checkValidity())return;const controls=[...form.elements].filter(el=>!el.disabled);const extras=extraSelector?[...document.querySelectorAll(extraSelector)].filter(el=>!el.disabled):[];controls.forEach(el=>el.disabled=true);extras.forEach(el=>el.disabled=true);form.setAttribute('aria-busy','true');window.setTimeout(()=>{controls.forEach(el=>el.disabled=false);extras.forEach(el=>el.disabled=false);form.setAttribute('aria-busy','false')},hold)},true)};
const boot=()=>{bind('feeForm','',420);bind('profitForm','[data-profit-mode],#profitSwitchMode,#profitRefreshFee,#profitResetBtn',1120)};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.ARSTORE_FUNCTIONAL_SAFETY_V271={version:271,scope:'transaction-shield-only'};
})();`;
const shieldPath=path.join(OUT,'js','functional-runtime-safety-v271.js');
fs.writeFileSync(shieldPath,shield);
html=html.replace(/^\s*<script[^>]+functional-runtime-safety-v271\.js[^>]*><\/script>\s*$/gmi,'');
html=html.replace('</body>','<script src="js/functional-runtime-safety-v271.js?v=271" defer></script>\n</body>');
fs.writeFileSync(htmlPath,html);

for(const p of [...Object.values(files),shieldPath])cp.execFileSync(process.execPath,['--check',p],{stdio:'inherit'});
const submitPaths=s=>(s.match(/addEventListener\(['\"]submit['\"]/g)||[]).length+(s.match(/\.onsubmit\s*=/g)||[]).length;
const checks=[
 ['research request guard present',research.includes('researchRequestRunning')],
 ['research reanalyze avoids raw runResearch listener',!research.includes("$('reanalyzeBtn')?.addEventListener('click', runResearch)")],
 ['research local copy uses Vercel',!research.includes('Netlify Dev')],
 ['fee engine submit owner remains singular',submitPaths(fee)===1],
 ['profit engine submit owner remains singular',submitPaths(profit)===1],
 ['profit recursion retired',!profit.includes("'error');confidence();return false")],
 ['transaction shield wired once',(html.match(/functional-runtime-safety-v271\.js/g)||[]).length===1],
 ['fee shield present',shield.includes("bind('feeForm','',420)")],
 ['profit shield includes external mode controls',shield.includes("bind('profitForm','[data-profit-mode],#profitSwitchMode,#profitRefreshFee,#profitResetBtn',1120)")],
 ['shield is idempotent',shield.includes("form.dataset.v271Shield==='1'")],
 ['shield contains no engine calculate calls',!shield.includes('.calculate(')&&!shield.includes('ARSTORE_STEP02_FEE_ENGINE')],
 ['PROJECT LOCK untouched',!shield.includes('shopee-fee-db')&&!shield.includes('tiktok-fee-db')]
];
const failed=checks.filter(([,ok])=>!ok);if(failed.length){console.error('V271 failed checks:',failed.map(([n])=>n));process.exit(1)}
console.log(`V271 FUNCTIONAL RUNTIME SAFETY PASS · ${checks.length}/${checks.length} gates · Research guard + Fee/Profit transaction shields sealed · formulas/data untouched · PROJECT LOCK untouched`);
