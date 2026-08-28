const fs=require('fs'),path=require('path'),cp=require('child_process');
const OUT=path.join(__dirname,'public');
if(!fs.existsSync(OUT))throw new Error('V266 B2.8 functional gate: public/ missing');
function patch(rel,changes){
  const file=path.join(OUT,rel);if(!fs.existsSync(file))throw new Error('V266 B2.8 functional missing '+rel);
  let s=fs.readFileSync(file,'utf8');
  for(const [before,after,label] of changes){
    if(!s.includes(before))throw new Error('V266 B2.8 functional signature missing: '+label);
    s=s.replace(before,after);
  }
  fs.writeFileSync(file,s);cp.execFileSync(process.execPath,['--check',file],{stdio:'inherit'});return s;
}

// Research: one request guard for submit, direct click, and Re-analyze.
const research=patch('js/research.js',[
  ["$('reanalyzeBtn')?.addEventListener('click', runResearch);","$('reanalyzeBtn')?.addEventListener('click', triggerResearch);",'research reanalyze guard'],
  ["Jika sedang test lokal, jalankan project dengan Netlify Dev agar /api/shopee-research aktif.","Jika sedang test lokal, jalankan project melalui Vercel Dev agar /api/shopee-research aktif.",'research local runtime copy']
]);

// The source copy is now correct, so app.js no longer needs a MutationObserver
// whose only job was rewriting the old Netlify wording after every message update.
const staleResearchObserver=`  // Safety text patch: no stale Netlify hint can surface in the Vercel build.\n  const researchMessage = $('researchMessage');\n  if (researchMessage) {\n    const cleanNetlifyText = () => {\n      const value = researchMessage.textContent || '';\n      if (/Netlify/i.test(value)) researchMessage.textContent = value.replace(/Netlify Dev/gi, 'Vercel Dev').replace(/Netlify/gi, 'Vercel');\n    };\n    new MutationObserver(cleanNetlifyText).observe(researchMessage, { childList: true, characterData: true, subtree: true });\n  }\n`;
const app=patch('js/app.js',[[staleResearchObserver,'','app stale research observer']]);

// Fee UI: freeze the submitted form for the short calculation choreography.
// This prevents a captured category/rate from being combined with values edited
// during the 260ms delay, and also removes Reset races.
const fee=patch('js/fee-engine-ui.js',[
  ["els.btn.classList.add('is-loading');els.btn.querySelector('span').textContent='Menghitung Fee...';setTimeout(()=>{","const feeLocked=[...form.elements].filter(el=>!el.disabled);feeLocked.forEach(el=>el.disabled=true);els.btn.classList.add('is-loading');els.btn.querySelector('span').textContent='Menghitung Fee...';setTimeout(()=>{",'fee transaction lock start'],
  ["els.btn.classList.remove('is-loading');els.btn.querySelector('span').textContent='Hitung Fee Sekarang';},260);","feeLocked.forEach(el=>el.disabled=false);els.btn.classList.remove('is-loading');els.btn.querySelector('span').textContent='Hitung Fee Sekarang';},260);",'fee transaction lock end']
]);

// Profit UI: missing Fee data must not recurse through confidence()->base()->loadFee().
// Freeze both the workspace form and external mode buttons during the 980ms
// choreography so the rendered result always belongs to the submitted snapshot.
const profit=patch('js/profit-engine-ui.js',[
  ["message('Belum ada hasil Fee Engine yang presisi. Selesaikan Step 02 terlebih dahulu.','error');confidence();return false","message('Belum ada hasil Fee Engine yang presisi. Selesaikan Step 02 terlebih dahulu.','error');E.conf.textContent='CONFIDENCE · LOW';E.conf.className='low';return false",'profit auto recursion'],
  ["function loading(r){E.empty.hidden=true;E.content.hidden=true;E.load.hidden=false;$('profitCalculateBtn').disabled=true;","function loading(r){const profitLocked=[...form.elements].filter(el=>!el.disabled),modeLocked=q('[data-profit-mode]').filter(el=>!el.disabled);profitLocked.forEach(el=>el.disabled=true);modeLocked.forEach(el=>el.disabled=true);E.empty.hidden=true;E.content.hidden=true;E.load.hidden=false;$('profitCalculateBtn').disabled=true;",'profit transaction lock start'],
  ["render(r);$('profitCalculateBtn').disabled=false;setDirty(false)},980)","render(r);profitLocked.forEach(el=>el.disabled=false);modeLocked.forEach(el=>el.disabled=false);$('profitCalculateBtn').disabled=false;setDirty(false)},980)",'profit transaction lock end']
]);

const checks=[
 ['research guarded',research.includes("$('reanalyzeBtn')?.addEventListener('click', triggerResearch)")],
 ['research stale Netlify copy retired',!research.includes('Netlify Dev')],
 ['app stale observer retired',!app.includes('cleanNetlifyText')],
 ['fee transaction locked',fee.includes('const feeLocked=[...form.elements]')&&fee.includes('feeLocked.forEach(el=>el.disabled=false)')],
 ['profit recursion retired',!profit.includes("'error');confidence();return false")],
 ['profit transaction locked',profit.includes('const profitLocked=[...form.elements]')&&profit.includes("modeLocked=q('[data-profit-mode]')")&&profit.includes('profitLocked.forEach(el=>el.disabled=false)')]
];
const failed=checks.filter(([,ok])=>!ok).map(([n])=>n);if(failed.length)throw new Error('V266 B2.8 functional gate failed: '+failed.join(', '));
console.log('V266 B2.8 FUNCTIONAL PASS — research request guard unified; stale observer retired; Fee/Profit calculations transaction-locked; missing Fee auto-mode recursion removed; formulas/data untouched');
