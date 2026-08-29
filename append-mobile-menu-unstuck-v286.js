const fs=require('fs'),path=require('path'),cp=require('child_process'),crypto=require('crypto');
const OUT=path.join(__dirname,'public');if(!fs.existsSync(OUT))throw new Error('V286 MOBILE MENU UNSTUCK: public/ missing');
const htmlPath=path.join(OUT,'index.html'),appPath=path.join(OUT,'js','app.js'),runtimePath=path.join(OUT,'js','ui-mobile-menu-unstuck-v286.js');
let html=fs.readFileSync(htmlPath,'utf8');
const runtime=`/* ARSTORE V286 — post-navigation mobile drawer reconciliation; UI-only */
(()=>{\n'use strict';\nif(window.ARSTORE_MENU_UNSTUCK_V286)return;\nwindow.ARSTORE_MENU_UNSTUCK_V286={version:286,scope:'post-navigation-drawer-reconcile'};\nconst mq=matchMedia('(max-width: 820px), (max-width: 900px) and (pointer: coarse)');\nconst q=s=>document.querySelector(s);\nconst mobile=()=>mq.matches;\nfunction reconcile(){\n if(!mobile())return;\n const sidebar=q('#sidebar'),overlay=q('#sidebarOverlay'),menu=q('#mobileMenuBtn'),main=q('.main-content');\n if(!sidebar||!overlay||!menu)return;\n sidebar.classList.remove('open','active','is-open');\n overlay.classList.remove('show','active','visible');\n overlay.setAttribute('aria-hidden','true');\n overlay.style.removeProperty('opacity');overlay.style.removeProperty('backdrop-filter');overlay.style.removeProperty('-webkit-backdrop-filter');\n menu.setAttribute('aria-expanded','false');\n sidebar.setAttribute('aria-hidden','true');\n document.body.classList.remove('drawer-open','sidebar-open','menu-open','no-scroll','overflow-hidden');\n document.documentElement.classList.remove('sidebar-open','menu-open','drawer-open','ar264-drawer-open','ar264-gesture');\n document.body.style.removeProperty('overflow');document.documentElement.style.removeProperty('overflow');\n document.documentElement.style.removeProperty('--ar264-progress');\n if(main&&'inert' in main)main.inert=false;\n}\nfunction settle(){queueMicrotask(()=>requestAnimationFrame(()=>requestAnimationFrame(reconcile)));}\ndocument.addEventListener('click',e=>{\n const leaf=e.target?.closest?.('#sidebar [data-page],#sidebar [data-go]');\n if(!leaf||leaf.matches('[data-nav-toggle],.nav-parent'))return;\n settle();\n},false);\ndocument.addEventListener('arstore:page-change',settle);\naddEventListener('pageshow',settle,{passive:true});\ndocument.addEventListener('visibilitychange',()=>{if(!document.hidden)settle()});\n})();\n`;
fs.writeFileSync(runtimePath,runtime);cp.execFileSync(process.execPath,['--check',runtimePath],{stdio:'inherit'});
html=html.replace(/^\s*<script[^>]+ui-mobile-menu-unstuck-v286\.js[^>]*><\/script>\s*$/gmi,'');
html=html.replace('</body>','  <script src="js/ui-mobile-menu-unstuck-v286.js?v=286"></script>\n</body>');
fs.writeFileSync(htmlPath,html);
const app=fs.readFileSync(appPath,'utf8'),built=fs.readFileSync(runtimePath,'utf8');
const checks=[
 ['runtime wired once',(html.match(/ui-mobile-menu-unstuck-v286\.js/g)||[]).length===1],
 ['base router retained',app.includes("document.addEventListener('click'")&&app.includes('showPage(name')],
 ['hotfix owns no route',!built.includes('pushState')&&!built.includes('replaceState')&&!built.includes('location.assign')&&!built.includes('location.replace')],
 ['hotfix does not prevent default',!built.includes('preventDefault')&&!built.includes('stopPropagation')&&!built.includes('stopImmediatePropagation')],
 ['leaf-only cleanup',built.includes("#sidebar [data-page],#sidebar [data-go]")&&built.includes("[data-nav-toggle],.nav-parent")],
 ['overlay cleanup',built.includes("overlay.classList.remove('show','active','visible')")],
 ['body lock cleanup',built.includes("classList.remove('drawer-open','sidebar-open','menu-open','no-scroll','overflow-hidden')")],
 ['overflow cleanup',built.includes("document.body.style.removeProperty('overflow')")],
 ['main inert released',built.includes('main.inert=false')],
 ['menu aria reset',built.includes("menu.setAttribute('aria-expanded','false')")],
 ['page-change fallback',built.includes("addEventListener('arstore:page-change',settle")],
 ['PROJECT LOCK untouched',!built.includes('ARSTORE_STEP02_FEE_ENGINE')&&!built.includes('shopee-fee-db')&&!built.includes('tiktok-fee-db')]
];
const failed=checks.filter(([,ok])=>!ok);if(failed.length){console.error('V286 failed:',failed.map(([n])=>n));process.exit(1)}
const fp=crypto.createHash('sha256').update(runtime).digest('hex');
console.log(`V286 MOBILE MENU UNSTUCK PASS · ${checks.length}/${checks.length} gates · post-navigation drawer/overlay/body-lock reconciliation sealed · runtime ${fp} · PROJECT LOCK untouched`);
