const fs=require('fs'),path=require('path'),cp=require('child_process');
const OUT=path.join(__dirname,'public');
if(!fs.existsSync(OUT))throw new Error('V266 ACCORDION AUDIT: public/ missing');
const appPath=path.join(OUT,'js','app.js');
const htmlPath=path.join(OUT,'index.html');
if(!fs.existsSync(appPath)||!fs.existsSync(htmlPath))throw new Error('V266 ACCORDION AUDIT: required output missing');
let app=fs.readFileSync(appPath,'utf8');

// Collapsed accordion descendants must not remain tabbable. Synchronize the
// controlled panel with the canonical group state while keeping base app as
// the sole toggle owner.
const oldSet=`  function setGroupOpen(name, open, persist = true) {\n    const config = GROUPS[name]; if (!config) return;\n    const group = $(config.id); if (!group) return;\n    const next = Boolean(open);\n    group.classList.toggle('is-open', next);\n    group.querySelector(':scope > [data-nav-toggle]')?.setAttribute('aria-expanded', String(next));\n    if (persist) { const state = accordionState(); state[name] = next; writeJSON(sessionStorage, ACCORDION_KEY, state); }\n  }`;
const newSet=`  function setGroupOpen(name, open, persist = true) {\n    const config = GROUPS[name]; if (!config) return;\n    const group = $(config.id); if (!group) return;\n    const next = Boolean(open);\n    const toggle = group.querySelector(':scope > [data-nav-toggle]');\n    const panelId = toggle?.getAttribute('aria-controls');\n    const panel = panelId ? $(panelId) : null;\n    group.classList.toggle('is-open', next);\n    toggle?.setAttribute('aria-expanded', String(next));\n    if (panel) {\n      panel.setAttribute('aria-hidden', String(!next));\n      if (next) panel.removeAttribute('inert'); else panel.setAttribute('inert', '');\n    }\n    if (persist) { const state = accordionState(); state[name] = next; writeJSON(sessionStorage, ACCORDION_KEY, state); }\n  }`;
if(!app.includes(oldSet)&&!app.includes(newSet))throw new Error('V266 ACCORDION AUDIT: setGroupOpen signature missing');
if(app.includes(oldSet))app=app.replace(oldSet,newSet);

// Start all generated panels in a truly collapsed semantic/focus state. The
// initial showPage/syncHierarchy pass immediately opens any active/saved chain.
app=app.replace(/class=\"nav-accordion-panel([^\"]*)\" id=\"([^\"]+)\"/g,(m,extra,id)=>{
  if(/aria-hidden=/.test(m))return m;
  return `class="nav-accordion-panel${extra}" id="${id}" aria-hidden="true" inert`;
});
fs.writeFileSync(appPath,app);
cp.execFileSync(process.execPath,['--check',appPath],{stdio:'inherit'});

const final34=fs.readFileSync(path.join(OUT,'js','ui-final-runtime-v34.js'),'utf8');
const css37=fs.readFileSync(path.join(OUT,'css','ui-final-sweep-v37-60.css'),'utf8');
const cssSidebar=fs.readFileSync(path.join(OUT,'css','ui-sidebar-scroll-stability-v266.css'),'utf8');
const v257=fs.readFileSync(path.join(OUT,'js','ui-premium-618-v257.js'),'utf8');
const v266=fs.readFileSync(path.join(OUT,'js','ui-interaction-authority-v266.js'),'utf8');
const html=fs.readFileSync(htmlPath,'utf8');
const count=(s,re)=>(s.match(re)||[]).length;
const checks=[
 ['single canonical accordion click owner',count(app,/const toggle = event\.target\.closest\('\[data-nav-toggle\]'\)/g)===1],
 ['setGroupOpen owns class state',app.includes("group.classList.toggle('is-open', next)")],
 ['setGroupOpen owns aria-expanded',app.includes("toggle?.setAttribute('aria-expanded', String(next))")],
 ['controlled panel derived from aria-controls',app.includes("const panelId = toggle?.getAttribute('aria-controls')")],
 ['collapsed panel aria-hidden synced',app.includes("panel.setAttribute('aria-hidden', String(!next))")],
 ['collapsed panel inert synced',app.includes("if (next) panel.removeAttribute('inert'); else panel.setAttribute('inert', '')")],
 ['generated panels start hidden/inert',count(app,/class="nav-accordion-panel[^\"]*" id="[^\"]+" aria-hidden="true" inert/g)>=4],
 ['market hierarchy auto-open',app.includes("setGroupOpen('market', true, false)")],
 ['accordion state session persisted',app.includes('ACCORDION_KEY')&&app.includes('writeJSON(sessionStorage, ACCORDION_KEY, state)')],
 ['final reveal observes aria-expanded only',final34.includes("attributeFilter:['aria-expanded']")||final34.includes("attributeFilter: ['aria-expanded']")],
 ['final reveal binding idempotent',final34.includes("nav.dataset.finalRevealBound === '1'")&&final34.includes("nav.dataset.finalRevealBound = '1'")],
 ['accordion motion uses grid rows',css37.includes('grid-template-rows:0fr!important')&&css37.includes(".nav-group.is-open>.nav-accordion-panel{grid-template-rows:1fr!important")],
 ['accordion overflow remains internal only',css37.includes('.nav-accordion-panel>.nav-accordion-inner')&&css37.includes('overflow:hidden!important')],
 ['permanent accordion will-change retired',cssSidebar.includes('.sidebar-nav .nav-accordion-panel')&&cssSidebar.includes('will-change:auto!important')],
 ['legacy V257 aria-expanded mutation retired',!v257.includes("qsa('[aria-expanded=\"true\"]')")],
 ['V266 no accordion click owner',!/addEventListener\(['\"]click['\"]/.test(v266)],
 ['retired custom iOS nav scripts absent',!html.includes('ui-ios-single-nav-v263.js')&&!html.includes('ui-ios-navigation-v264.js')]
];
const failed=checks.filter(([,ok])=>!ok).map(([n])=>n);
if(failed.length)throw new Error('V266 ACCORDION TOTAL AUDIT failed: '+failed.join(', '));
console.log('V266 ACCORDION TOTAL AUDIT PASS — base app remains sole toggle owner; class/aria/panel focus states are synchronized; collapsed descendants are inert; nested hierarchy/persistence/reveal/motion ownership stays coherent');
