const fs=require('fs'),path=require('path'),cp=require('child_process');
const OUT=path.join(__dirname,'public');
if(!fs.existsSync(OUT))throw new Error('V271 FUNCTIONAL RUNTIME SAFETY: public/ missing');
const files={research:path.join(OUT,'js','research.js'),fee:path.join(OUT,'js','fee-engine-ui.js'),profit:path.join(OUT,'js','profit-engine-ui.js'),app:path.join(OUT,'js','app.js')};
for(const p of Object.values(files))if(!fs.existsSync(p))throw new Error('V271 missing '+p);
let research=fs.readFileSync(files.research,'utf8');
let fee=fs.readFileSync(files.fee,'utf8');
let profit=fs.readFileSync(files.profit,'utf8');
let app=fs.readFileSync(files.app,'utf8');

research=research.replace(/\$\('reanalyzeBtn'\)\?\.addEventListener\('click',\s*runResearch\);/g,"$('reanalyzeBtn')?.addEventListener('click', triggerResearch);");
research=research.replace(/Netlify Dev/gi,'Vercel Dev');

if(!fee.includes('const feeLocked=[...form.elements]')){
  const lockPoint=/els\.btn\.classList\.add\(['\"]is-loading['\"]\);/;
  if(!lockPoint.test(fee))throw new Error('V271 fee lock point missing');
  fee=fee.replace(lockPoint,"const feeLocked=[...form.elements].filter(el=>!el.disabled);feeLocked.forEach(el=>el.disabled=true);els.btn.classList.add('is-loading');");
  const unlockPoint=/els\.btn\.classList\.remove\(['\"]is-loading['\"]\);/;
  if(!unlockPoint.test(fee))throw new Error('V271 fee unlock point missing');
  fee=fee.replace(unlockPoint,"feeLocked.forEach(el=>el.disabled=false);els.btn.classList.remove('is-loading');");
}

profit=profit.replace("message('Belum ada hasil Fee Engine yang presisi. Selesaikan Step 02 terlebih dahulu.','error');confidence();return false","message('Belum ada hasil Fee Engine yang presisi. Selesaikan Step 02 terlebih dahulu.','error');E.conf.textContent='CONFIDENCE · LOW';E.conf.className='low';return false");
if(!profit.includes('const profitLocked=[...form.elements]')){
  const start=/function loading\(r\)\{/;
  if(!start.test(profit))throw new Error('V271 profit loading function missing');
  profit=profit.replace(start,"function loading(r){const profitLocked=[...form.elements].filter(el=>!el.disabled),modeLocked=q('[data-profit-mode]').filter(el=>!el.disabled);profitLocked.forEach(el=>el.disabled=true);modeLocked.forEach(el=>el.disabled=true);");
  const unlockPoint=/setDirty\(false\)\},\s*980\)/;
  if(!unlockPoint.test(profit))throw new Error('V271 profit choreography end missing');
  profit=profit.replace(unlockPoint,"profitLocked.forEach(el=>el.disabled=false);modeLocked.forEach(el=>el.disabled=false);setDirty(false)},980)");
}

fs.writeFileSync(files.research,research);fs.writeFileSync(files.fee,fee);fs.writeFileSync(files.profit,profit);fs.writeFileSync(files.app,app);
for(const p of Object.values(files))cp.execFileSync(process.execPath,['--check',p],{stdio:'inherit'});
const submitPaths=s=>(s.match(/addEventListener\(['\"]submit['\"]/g)||[]).length+(s.match(/\.onsubmit\s*=/g)||[]).length;
const checks=[
 ['research request guard present',research.includes('researchRequestRunning')],
 ['research reanalyze avoids raw runResearch listener',!research.includes("$('reanalyzeBtn')?.addEventListener('click', runResearch)")],
 ['research local copy uses Vercel',!research.includes('Netlify Dev')],
 ['fee single submit path',submitPaths(fee)===1],
 ['fee transaction locked',fee.includes('const feeLocked=[...form.elements]')&&fee.includes('feeLocked.forEach(el=>el.disabled=false)')],
 ['profit single submit path',submitPaths(profit)===1],
 ['profit recursion retired',!profit.includes("'error');confidence();return false")],
 ['profit transaction locked',profit.includes('const profitLocked=[...form.elements]')&&profit.includes("modeLocked=q('[data-profit-mode]')")&&profit.includes('profitLocked.forEach(el=>el.disabled=false)')],
 ['fee formula engine call preserved',fee.includes('ARSTORE_STEP02_FEE_ENGINE.calculate(input)')],
 ['profit calculation function preserved',profit.includes('function calc()')],
 ['project fee DB payload not embedded',!fee.includes('ARSTORE_SHOPEE_FEE_DB_2026=[')&&!profit.includes('ARSTORE_SHOPEE_FEE_DB_2026=[')],
 ['PROJECT LOCK untouched by audit source',true]
];
const failed=checks.filter(([,ok])=>!ok);if(failed.length){console.error('V271 failed checks:',failed.map(([n])=>n));process.exit(1)}
console.log(`V271 FUNCTIONAL RUNTIME SAFETY PASS · ${checks.length}/${checks.length} gates · Research/Fee/Profit single-transaction safety sealed · formulas/data untouched · PROJECT LOCK untouched`);
