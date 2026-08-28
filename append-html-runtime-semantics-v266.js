const fs=require('fs'),path=require('path'),cp=require('child_process');
const OUT=path.join(__dirname,'public');
if(!fs.existsSync(OUT))throw new Error('V266 HTML RUNTIME: public/ missing');
const appPath=path.join(OUT,'js','app.js');
if(!fs.existsSync(appPath))throw new Error('V266 HTML RUNTIME: app.js missing');
let app=fs.readFileSync(appPath,'utf8');
function replaceOnce(before,after,label){if(!app.includes(before))throw new Error('V266 HTML RUNTIME signature missing: '+label);app=app.replace(before,after);}

// Four-theme settings markup must match the final theme system.
replaceOnce(
"    const next = theme === 'light' ? 'light' : 'dark';",
"    const validThemes = ['light','dark','charcoal','oled'];\n    const next = validThemes.includes(theme) ? theme : 'dark';",
'base four-theme allow-list');
replaceOnce(
"<div class=\"theme-segment\" role=\"group\" aria-label=\"Pilih tema\"><button type=\"button\" data-theme-choice=\"dark\">Gelap</button><button type=\"button\" data-theme-choice=\"light\">Terang</button></div>",
"<div class=\"theme-segment\" role=\"group\" aria-label=\"Pilih tema\"><button type=\"button\" data-theme-choice=\"light\">Terang</button><button type=\"button\" data-theme-choice=\"dark\">Gelap</button><button type=\"button\" data-theme-choice=\"charcoal\">Charcoal</button><button type=\"button\" data-theme-choice=\"oled\">OLED</button></div>",
'settings four-theme controls');
replaceOnce(
'Pilih tema gelap atau terang. Preferensi tersimpan di browser.',
'Pilih Terang, Gelap, Charcoal, atau OLED. Preferensi tersimpan di browser.',
'settings four-theme copy');

// Keep accessibility state synchronized with the canonical drawer state.
replaceOnce(
"    overlay?.classList.remove('show', 'active', 'visible');",
"    overlay?.classList.remove('show', 'active', 'visible');\n    overlay?.setAttribute('aria-hidden', 'true');",
'overlay close aria');
replaceOnce(
"    sidebar.classList.add('open'); overlay?.classList.add('show'); document.body.classList.add('drawer-open');",
"    sidebar.classList.add('open'); overlay?.classList.add('show'); overlay?.setAttribute('aria-hidden', 'false'); document.body.classList.add('drawer-open');",
'overlay open aria');
replaceOnce(
"  mobileMenuBtn?.setAttribute('aria-expanded', 'false');",
"  mobileMenuBtn?.setAttribute('aria-expanded', 'false');\n  mobileMenuBtn?.setAttribute('aria-controls', 'sidebar');\n  overlay?.setAttribute('aria-hidden', 'true');",
'drawer initial aria');

fs.writeFileSync(appPath,app);cp.execFileSync(process.execPath,['--check',appPath],{stdio:'inherit'});
const checks=[
 ['four theme allow-list',app.includes("['light','dark','charcoal','oled']"))],
 ['four theme settings', ['light','dark','charcoal','oled'].every(t=>app.includes(`data-theme-choice=\"${t}\"`))],
 ['overlay close aria',app.includes("overlay?.setAttribute('aria-hidden', 'true')"))],
 ['overlay open aria',app.includes("overlay?.setAttribute('aria-hidden', 'false')"))],
 ['menu controls sidebar',app.includes("mobileMenuBtn?.setAttribute('aria-controls', 'sidebar')"))]
];
const failed=checks.filter(([,ok])=>!ok).map(([n])=>n);if(failed.length)throw new Error('V266 HTML RUNTIME failed: '+failed.join(', '));
console.log('V266 HTML RUNTIME PASS — Settings matches all 4 themes; drawer ARIA state follows canonical open/close; app syntax valid');
