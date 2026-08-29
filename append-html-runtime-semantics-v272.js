const fs=require('fs'),path=require('path'),cp=require('child_process');
const OUT=path.join(__dirname,'public');
if(!fs.existsSync(OUT))throw new Error('V272 HTML RUNTIME SEMANTICS: public/ missing');
const htmlPath=path.join(OUT,'index.html'),shellPath=path.join(OUT,'js','v3-shell.js'),runtimePath=path.join(OUT,'js','ui-html-runtime-semantics-v272.js');
if(!fs.existsSync(htmlPath)||!fs.existsSync(shellPath))throw new Error('V272 required output missing');
let html=fs.readFileSync(htmlPath,'utf8');
let shell=fs.readFileSync(shellPath,'utf8');

// Settings must expose the same four themes as the production theme system.
html=html.replace(/<div class="theme-segment" role="group" aria-label="Pilih tema">[\s\S]*?<\/div>/,
'<div class="theme-segment" role="group" aria-label="Pilih tema"><button type="button" data-theme-choice="light">Terang</button><button type="button" data-theme-choice="dark">Gelap</button><button type="button" data-theme-choice="charcoal">Charcoal</button><button type="button" data-theme-choice="oled">OLED</button></div>');
html=html.replace(/Pilih tema[^<.]*\.\s*Preferensi tersimpan di browser\./gi,'Pilih Terang, Gelap, Charcoal, atau OLED. Preferensi tersimpan di browser.');

// Normalize any three-theme allow-list or ternary still present in generated shell.
shell=shell.replace(/\[\s*['\"]light['\"]\s*,\s*['\"]dark['\"]\s*,\s*['\"]charcoal['\"]\s*\]/g,"['light','dark','charcoal','oled']");
shell=shell.replace(/\[\s*['\"]light['\"]\s*,\s*['\"]charcoal['\"]\s*,\s*['\"]dark['\"]\s*\]/g,"['light','dark','charcoal','oled']");
shell=shell.replace(/const next = \(theme === ['\"]light['\"] \|\| theme === ['\"]charcoal['\"]\) \? theme : ['\"]dark['\"];/g,
"const next = ['light','dark','charcoal','oled'].includes(theme) ? theme : 'dark';");
shell=shell.replace(/const next = theme === ['\"]light['\"] \? ['\"]light['\"] : ['\"]dark['\"];/g,
"const next = ['light','dark','charcoal','oled'].includes(theme) ? theme : 'dark';");
fs.writeFileSync(shellPath,shell);cp.execFileSync(process.execPath,['--check',shellPath],{stdio:'inherit'});

// Semantic drawer reconciliation only; no routing/click ownership.
const runtime=`(()=>{'use strict';if(window.ARSTORE_HTML_SEMANTICS_V272)return;window.ARSTORE_HTML_SEMANTICS_V272=true;
const sidebar=document.getElementById('sidebar'),overlay=document.getElementById('sidebarOverlay')||document.querySelector('.sidebar-overlay'),menu=document.getElementById('mobileMenuBtn');
function open(){return !!sidebar&&(sidebar.classList.contains('open')||sidebar.classList.contains('is-open')||sidebar.classList.contains('active')||document.body.classList.contains('drawer-open')||document.body.classList.contains('sidebar-open')||document.body.classList.contains('menu-open'))}
function sync(){const isOpen=open();if(menu){menu.setAttribute('aria-controls','sidebar');menu.setAttribute('aria-expanded',String(isOpen))}if(overlay)overlay.setAttribute('aria-hidden',String(!isOpen));if(sidebar){sidebar.setAttribute('aria-label',sidebar.getAttribute('aria-label')||'Navigasi utama');sidebar.setAttribute('role',sidebar.getAttribute('role')||'navigation')}}
if(sidebar)new MutationObserver(sync).observe(sidebar,{attributes:true,attributeFilter:['class']});
new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['class']});
document.addEventListener('arstore:page-change',()=>queueMicrotask(sync));window.addEventListener('pageshow',sync,{passive:true});sync();})();`;
fs.writeFileSync(runtimePath,runtime);cp.execFileSync(process.execPath,['--check',runtimePath],{stdio:'inherit'});
html=html.replace(/^\s*<script[^>]+ui-html-runtime-semantics-v272\.js[^>]*><\/script>\s*$/gmi,'');
html=html.replace('</body>','  <script src="js/ui-html-runtime-semantics-v272.js?v=272"></script>\n</body>');
fs.writeFileSync(htmlPath,html);

const ids=[...html.matchAll(/\sid=["']([^"']+)["']/g)].map(m=>m[1]);
const dupIds=[...new Set(ids.filter((id,i)=>ids.indexOf(id)!==i))];
const scripts=[...html.matchAll(/<script[^>]+src=["']([^"']+)["']/g)].map(m=>m[1].replace(/\?.*$/,''));
const dupScripts=[...new Set(scripts.filter((s,i)=>scripts.indexOf(s)!==i))];
const styles=[...html.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["']/g)].map(m=>m[1].replace(/\?.*$/,''));
const dupStyles=[...new Set(styles.filter((s,i)=>styles.indexOf(s)!==i))];
const checks=[
 ['four-theme settings controls',['light','dark','charcoal','oled'].every(t=>html.includes(`data-theme-choice=\"${t}\"`))],
 ['settings copy normalized',/Charcoal, atau OLED/.test(html)],
 ['shell recognizes OLED',shell.includes('oled')],
 ['semantic runtime wired once',(html.match(/ui-html-runtime-semantics-v272\.js/g)||[]).length===1],
 ['menu controls sidebar',runtime.includes("setAttribute('aria-controls','sidebar')")],
 ['menu expanded synced',runtime.includes("setAttribute('aria-expanded',String(isOpen))")],
 ['overlay hidden synced',runtime.includes("setAttribute('aria-hidden',String(!isOpen))")],
 ['semantic layer owns no click route',!runtime.includes("addEventListener('click'")&&!runtime.includes('pushState')&&!runtime.includes('replaceState')],
 ['no duplicate static ids',dupIds.length===0],
 ['no duplicate script src',dupScripts.length===0],
 ['no duplicate stylesheet href',dupStyles.length===0],
 ['PROJECT LOCK untouched',!runtime.includes('FEE_DB')&&!runtime.includes('calculate(')&&!shell.includes('ARSTORE_SHOPEE_FEE_DB_2026=[')]
];
const failed=checks.filter(([,ok])=>!ok);if(failed.length){console.error('V272 failed checks:',failed.map(([n])=>n),{dupIds,dupScripts,dupStyles});process.exit(1)}
console.log(`V272 HTML RUNTIME SEMANTICS PASS · ${checks.length}/${checks.length} gates · four-theme Settings/shell + drawer ARIA + duplicate wiring sealed · PROJECT LOCK untouched`);
