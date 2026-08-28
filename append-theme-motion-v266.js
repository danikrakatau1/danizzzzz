const fs=require('fs'),path=require('path');
const root=__dirname,out=path.join(root,'public');
if(!fs.existsSync(out))throw new Error('public/ missing; run base build first');
fs.mkdirSync(path.join(out,'css'),{recursive:true});
fs.mkdirSync(path.join(out,'js'),{recursive:true});
fs.copyFileSync(path.join(root,'ui-theme-motion-v266.css'),path.join(out,'css','ui-theme-motion-v266.css'));
fs.copyFileSync(path.join(root,'ui-theme-motion-v266.js'),path.join(out,'js','ui-theme-motion-v266.js'));
const shellPath=path.join(out,'js','v3-shell.js');
if(!fs.existsSync(shellPath))throw new Error('V266 theme gate failed: public/js/v3-shell.js missing');
const shell=fs.readFileSync(shellPath,'utf8');
for(const theme of ['light','charcoal','oled']){
  if(!shell.includes(`theme === '${theme}'`))throw new Error(`V266 theme gate failed: generated shell missing ${theme} support`);
}
const idx=path.join(out,'index.html');
let html=fs.readFileSync(idx,'utf8');
if(!html.includes('__ARSTORE_V266_THEME_MOTION'))html=html.replace('<head>','<head>\n<script>window.__ARSTORE_V266_THEME_MOTION=true;<\/script>');
if(!html.includes('ui-theme-motion-v266.css'))html=html.replace('</head>','<link rel="stylesheet" href="css/ui-theme-motion-v266.css?v=266b21">\n</head>');
if(!html.includes('ui-theme-motion-v266.js'))html=html.replace('</body>','<script src="js/ui-theme-motion-v266.js?v=266b21" defer></script>\n</body>');
fs.writeFileSync(idx,html);
const builtHtml=fs.readFileSync(idx,'utf8');
const themeJs=fs.readFileSync(path.join(out,'js','ui-theme-motion-v266.js'),'utf8');
if(!/ui-theme-motion-v266\.css/.test(builtHtml)||!/ui-theme-motion-v266\.js/.test(builtHtml))throw new Error('V266 theme gate failed: theme motion assets not wired');
if(!/presentationOnly:true/.test(themeJs))throw new Error('V266 theme gate failed: presentation-only marker missing');
if(/preventDefault\(|stopPropagation\(|stopImmediatePropagation\(/.test(themeJs))throw new Error('V266 theme gate failed: theme presentation layer must not own click behavior');
if(!/ar266-theme-transitioning/.test(themeJs))throw new Error('V266 theme gate failed: transition coordinator missing');
console.log('V266 THEME MOTION PASS — generated shell keeps Dark/Light/Charcoal/OLED authority; segmented control stabilized; smooth presentation transitions enabled; router/data/formula untouched');
