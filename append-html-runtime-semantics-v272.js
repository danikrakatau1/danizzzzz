const fs=require('fs'),path=require('path'),cp=require('child_process');
const OUT=path.join(__dirname,'public');
if(!fs.existsSync(OUT))throw new Error('V272 HTML RUNTIME SEMANTICS: public/ missing');
const htmlPath=path.join(OUT,'index.html'),appPath=path.join(OUT,'js','app.js');
if(!fs.existsSync(htmlPath)||!fs.existsSync(appPath))throw new Error('V272 required output missing');
let html=fs.readFileSync(htmlPath,'utf8');
let app=fs.readFileSync(appPath,'utf8');

// Four-theme semantics belong to the base owner, not only overlay layers.
app=app.replace(/const next = theme === ['\"]light['\"] \? ['\"]light['\"] : ['\"]dark['\"];/,
"const validThemes = ['light','dark','charcoal','oled'];\n    const next = validThemes.includes(theme) ? theme : 'dark';");
app=app.replace(/Pilih tema gelap atau terang\. Preferensi tersimpan di browser\./g,'Pilih Terang, Gelap, Charcoal, atau OLED. Preferensi tersimpan di browser.');
if(!app.includes('data-theme-choice="charcoal"')||!app.includes('data-theme-choice="oled"')){
  app=app.replace(/<div class="theme-segment" role="group" aria-label="Pilih tema">[\s\S]*?<\/div>/,
'<div class="theme-segment" role="group" aria-label="Pilih tema"><button type="button" data-theme-choice="light">Terang</button><button type="button" data-theme-choice="dark">Gelap</button><button type="button" data-theme-choice="charcoal">Charcoal</button><button type="button" data-theme-choice="oled">OLED</button></div>');
}

// Canonical drawer semantics: controls/expanded/hidden must follow open/close state.
if(!app.includes("mobileMenuBtn?.setAttribute('aria-controls', 'sidebar')")){
  app=app.replace(/mobileMenuBtn\?\.setAttribute\(['\"]aria-expanded['\"],\s*['\"]false['\"]\);/,
"mobileMenuBtn?.setAttribute('aria-expanded', 'false');\n  mobileMenuBtn?.setAttribute('aria-controls', 'sidebar');");
}
app=app.replace(/overlay\?\.classList\.remove\('show', 'active', 'visible'\);(?!\s*overlay\?\.setAttribute)/,
"overlay?.classList.remove('show', 'active', 'visible');\n    overlay?.setAttribute('aria-hidden', 'true');");
app=app.replace(/sidebar\.classList\.add\('open'\); overlay\?\.classList\.add\('show'\);(?!\s*overlay\?\.setAttribute)/,
"sidebar.classList.add('open'); overlay?.classList.add('show'); overlay?.setAttribute('aria-hidden', 'false');");
if(!/overlay\?\.setAttribute\(['\"]aria-hidden['\"],\s*['\"]true['\"]\)/.test(app)){
  app=app.replace(/mobileMenuBtn\?\.setAttribute\(['\"]aria-controls['\"],\s*['\"]sidebar['\"]\);/,
"mobileMenuBtn?.setAttribute('aria-controls', 'sidebar');\n  overlay?.setAttribute('aria-hidden', 'true');");
}

fs.writeFileSync(appPath,app);cp.execFileSync(process.execPath,['--check',appPath],{stdio:'inherit'});

const ids=[...html.matchAll(/\sid=["']([^"']+)["']/g)].map(m=>m[1]);
const dupIds=[...new Set(ids.filter((id,i)=>ids.indexOf(id)!==i))];
const scriptSrcs=[...html.matchAll(/<script[^>]+src=["']([^"']+)["']/g)].map(m=>m[1].replace(/\?.*$/,''));
const dupScripts=[...new Set(scriptSrcs.filter((s,i)=>scriptSrcs.indexOf(s)!==i))];
const styleHrefs=[...html.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["']/g)].map(m=>m[1].replace(/\?.*$/,''));
const dupStyles=[...new Set(styleHrefs.filter((s,i)=>styleHrefs.indexOf(s)!==i))];
const checks=[
 ['four-theme allow-list',app.includes("['light','dark','charcoal','oled']")],
 ['four-theme settings controls',['light','dark','charcoal','oled'].every(t=>app.includes(`data-theme-choice=\"${t}\"`))],
 ['four-theme settings copy',app.includes('Pilih Terang, Gelap, Charcoal, atau OLED.')],
 ['drawer menu controls sidebar',app.includes("mobileMenuBtn?.setAttribute('aria-controls', 'sidebar')")],
 ['drawer overlay close aria',app.includes("overlay?.setAttribute('aria-hidden', 'true')")],
 ['drawer overlay open aria',app.includes("overlay?.setAttribute('aria-hidden', 'false')")],
 ['accordion aria-controls preserved',app.includes('aria-controls="marketToolsPanel"')&&app.includes('aria-controls="shopeeToolsPanel"')&&app.includes('aria-controls="tiktokToolsPanel"')],
 ['form submit buttons explicit',!/<form[\s\S]*?<button(?![^>]*type=)[^>]*>/i.test(html)],
 ['no duplicate static ids',dupIds.length===0],
 ['no duplicate script src',dupScripts.length===0],
 ['no duplicate stylesheet href',dupStyles.length===0],
 ['PROJECT LOCK untouched',!app.includes('ARSTORE_SHOPEE_FEE_DB_2026=[')&&!app.includes('ARSTORE_TIKTOK_FEE_DB_2026=[')]
];
const failed=checks.filter(([,ok])=>!ok);if(failed.length){console.error('V272 failed checks:',failed.map(([n])=>n),{dupIds,dupScripts,dupStyles});process.exit(1)}
console.log(`V272 HTML RUNTIME SEMANTICS PASS · ${checks.length}/${checks.length} gates · four-theme base semantics + drawer ARIA + duplicate wiring sealed · PROJECT LOCK untouched`);
