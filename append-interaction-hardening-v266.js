const fs=require('fs'),path=require('path');
const root=__dirname,out=path.join(root,'public');
if(!fs.existsSync(out))throw new Error('public/ missing; run base build first');
fs.mkdirSync(path.join(out,'css'),{recursive:true});
fs.mkdirSync(path.join(out,'js'),{recursive:true});
fs.copyFileSync(path.join(root,'ui-interaction-authority-v266.css'),path.join(out,'css','ui-interaction-authority-v266.css'));
fs.copyFileSync(path.join(root,'ui-interaction-authority-v266.js'),path.join(out,'js','ui-interaction-authority-v266.js'));

const idx=path.join(out,'index.html');
let html=fs.readFileSync(idx,'utf8');
// Keep all custom iPhone swipe assets retired.
html=html
  .replace(/\s*<link[^>]+ui-ios-navigation-v264\.css[^>]*>/g,'')
  .replace(/\s*<script[^>]+ui-ios-navigation-v264\.js[^>]*><\/script>/g,'')
  .replace(/\s*<link[^>]+ui-ios-single-nav-v263\.css[^>]*>/g,'')
  .replace(/\s*<script[^>]+ui-ios-single-nav-v263\.js[^>]*><\/script>/g,'');
if(!html.includes('__ARSTORE_V266_INTERACTION_AUTHORITY'))html=html.replace('<head>','<head>\n<script>window.__ARSTORE_V266_INTERACTION_AUTHORITY=true;<\/script>');
if(!html.includes('ui-interaction-authority-v266.css'))html=html.replace('</head>','<link rel="stylesheet" href="css/ui-interaction-authority-v266.css?v=266">\n</head>');
if(!html.includes('ui-interaction-authority-v266.js'))html=html.replace('</body>','<script src="js/ui-interaction-authority-v266.js?v=266" defer></script>\n</body>');
fs.writeFileSync(idx,html);

// V261 may keep Android drawer gestures, but iOS must never initialize them.
const v261=path.join(out,'js','ui-motion-core-v261.js');
if(fs.existsSync(v261)){
  let s=fs.readFileSync(v261,'utf8');
  s=s.replace(/if\(!\(window\.__ARSTORE_V264_NAV_AUTHORITY&&platform==='ios'\)\)setupDrawerGesture\(\);/g,"if(platform!=='ios')setupDrawerGesture();");
  s=s.replace(/(^|\n)(\s*)setupDrawerGesture\(\);/g,(m,n,sp)=>`${n}${sp}if(platform!=='ios')setupDrawerGesture();`);
  fs.writeFileSync(v261,s);
}

const built=fs.readFileSync(idx,'utf8');
if(/ui-ios-navigation-v264\.js|ui-ios-single-nav-v263\.js/.test(built))throw new Error('V266 gate failed: retired custom iOS swipe asset is still wired');
if(!/ui-ios-compat-v265\.js/.test(built))throw new Error('V266 gate failed: V265 iOS compatibility baseline missing');
if(!/ui-interaction-authority-v266\.js/.test(built)||!/ui-interaction-authority-v266\.css/.test(built))throw new Error('V266 gate failed: interaction authority assets not wired');
if(fs.existsSync(v261)){
  const s=fs.readFileSync(v261,'utf8');
  if(!/if\(platform!=='ios'\)setupDrawerGesture\(\);/.test(s))throw new Error('V266 gate failed: V261 iOS drawer gesture not explicitly retired');
}
const v266src=fs.readFileSync(path.join(out,'js','ui-interaction-authority-v266.js'),'utf8');
if(/addEventListener\(['"]touch(?:start|move|end|cancel)['"]/.test(v266src))throw new Error('V266 gate failed: V266 must not install custom touch navigation handlers');
console.log('V266 BATCH 1 PASS — base app owns navigation/drawer actions; canonical iOS drawer-overlay reconciliation enabled; V263/V264 custom swipe retired; V261 iOS drawer gesture disabled; engine/data/formula untouched');
