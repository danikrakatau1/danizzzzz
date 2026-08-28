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

// Fee UI: do not allow Reset to race the delayed calculation callback.
const fee=patch('js/fee-engine-ui.js',[
  ["els.btn.classList.add('is-loading');els.btn.querySelector('span').textContent='Menghitung Fee...';setTimeout(()=>{","els.btn.classList.add('is-loading');els.reset.disabled=true;els.btn.querySelector('span').textContent='Menghitung Fee...';setTimeout(()=>{",'fee reset lock start'],
  ["els.btn.classList.remove('is-loading');els.btn.querySelector('span').textContent='Hitung Fee Sekarang';},260);","els.btn.classList.remove('is-loading');els.reset.disabled=false;els.btn.querySelector('span').textContent='Hitung Fee Sekarang';},260);",'fee reset lock end']
]);

// Profit UI: missing Fee data must not recurse through confidence()->base()->loadFee().
// Also lock Reset while the delayed result choreography is active.
const profit=patch('js/profit-engine-ui.js',[
  ["message('Belum ada hasil Fee Engine yang presisi. Selesaikan Step 02 terlebih dahulu.','error');confidence();return false","message('Belum ada hasil Fee Engine yang presisi. Selesaikan Step 02 terlebih dahulu.','error');E.conf.textContent='CONFIDENCE · LOW';E.conf.className='low';return false",'profit auto recursion'],
  ["function loading(r){E.empty.hidden=true;E.content.hidden=true;E.load.hidden=false;$('profitCalculateBtn').disabled=true;","function loading(r){E.empty.hidden=true;E.content.hidden=true;E.load.hidden=false;$('profitCalculateBtn').disabled=true;$('profitResetBtn').disabled=true;",'profit reset lock start'],
  ["render(r);$('profitCalculateBtn').disabled=false;setDirty(false)},980)","render(r);$('profitCalculateBtn').disabled=false;$('profitResetBtn').disabled=false;setDirty(false)},980)",'profit reset lock end']
]);

const checks=[
 ['research guarded',research.includes("$('reanalyzeBtn')?.addEventListener('click', triggerResearch)")],
 ['research stale Netlify copy retired',!research.includes('Netlify Dev')],
 ['fee reset locked',fee.includes('els.reset.disabled=true')&&fee.includes('els.reset.disabled=false')],
 ['profit recursion retired',!profit.includes("'error');confidence();return false")],
 ['profit reset locked',profit.includes("$('profitResetBtn').disabled=true")&&profit.includes("$('profitResetBtn').disabled=false")]
];
const failed=checks.filter(([,ok])=>!ok).map(([n])=>n);if(failed.length)throw new Error('V266 B2.8 functional gate failed: '+failed.join(', '));
console.log('V266 B2.8 FUNCTIONAL PASS — research request guard unified; Fee/Profit delayed-reset races blocked; missing Fee auto-mode recursion removed; formulas/data untouched');
