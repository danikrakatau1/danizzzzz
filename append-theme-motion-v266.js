const fs=require('fs'),path=require('path');
const root=__dirname,out=path.join(root,'public');
if(!fs.existsSync(out))throw new Error('public/ missing; run base build first');
fs.mkdirSync(path.join(out,'css'),{recursive:true});
fs.copyFileSync(path.join(root,'ui-theme-motion-v266.css'),path.join(out,'css','ui-theme-motion-v266.css'));

const appPath=path.join(out,'js','app.js');
if(!fs.existsSync(appPath))throw new Error('V266 theme gate failed: public/js/app.js missing');
let app=fs.readFileSync(appPath,'utf8');

const oldApply=/function applyTheme\(theme\) \{[\s\S]*?\n  \}\n\n  function normalizePath/;
const replacement=`function applyTheme(theme) {
    const allowed = ['dark','light','charcoal','oled'];
    const next = allowed.includes(theme) ? theme : 'dark';
    const root = document.documentElement;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false;
    if (!reduced && root.dataset.theme !== next) {
      root.classList.add('ar266-theme-transitioning');
      clearTimeout(window.__ar266ThemeTimer);
      window.__ar266ThemeTimer = setTimeout(() => root.classList.remove('ar266-theme-transitioning'), 320);
    }
    root.dataset.theme = next;
    try { localStorage.setItem(THEME_KEY, next); } catch (_) {}
    document.querySelectorAll('[data-theme-choice]').forEach(button => {
      const active = button.dataset.themeChoice === next;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    document.dispatchEvent(new CustomEvent('arstore:theme-change', { detail: { theme: next } }));
  }

  function normalizePath`;
if(!oldApply.test(app))throw new Error('V266 theme gate failed: applyTheme source signature not found');
app=app.replace(oldApply,replacement);
fs.writeFileSync(appPath,app);

const idx=path.join(out,'index.html');
let html=fs.readFileSync(idx,'utf8');
if(!html.includes('__ARSTORE_V266_THEME_MOTION'))html=html.replace('<head>','<head>\n<script>window.__ARSTORE_V266_THEME_MOTION=true;<\/script>');
if(!html.includes('ui-theme-motion-v266.css'))html=html.replace('</head>','<link rel="stylesheet" href="css/ui-theme-motion-v266.css?v=266b21">\n</head>');
fs.writeFileSync(idx,html);

const builtApp=fs.readFileSync(appPath,'utf8');
const builtHtml=fs.readFileSync(idx,'utf8');
for(const theme of ['dark','light','charcoal','oled']){
  if(!builtApp.includes(`'${theme}'`))throw new Error(`V266 theme gate failed: ${theme} missing from applyTheme`);
}
if(/const next = theme === ['"]light['"] \? ['"]light['"] : ['"]dark['"]/.test(builtApp))throw new Error('V266 theme gate failed: legacy two-theme coercion still active');
if(!/ar266-theme-transitioning/.test(builtApp))throw new Error('V266 theme gate failed: transition state missing');
if(!/ui-theme-motion-v266\.css/.test(builtHtml))throw new Error('V266 theme gate failed: theme motion CSS not wired');
console.log('V266 THEME MOTION PASS — Dark/Light/Charcoal/OLED preserved; segmented control stabilized; theme paint transitions enabled; no router/data/formula changes');
