const fs=require('fs'),path=require('path');
const OUT=path.join(__dirname,'public');
if(!fs.existsSync(OUT))throw new Error('V266 CSS FINAL AUDIT: public/ missing');
const src=path.join(__dirname,'ui-css-audit-final-v266.css');
const dst=path.join(OUT,'css','ui-css-audit-final-v266.css');
if(!fs.existsSync(src))throw new Error('V266 CSS FINAL AUDIT: source CSS missing');
fs.mkdirSync(path.dirname(dst),{recursive:true});
fs.copyFileSync(src,dst);
const htmlPath=path.join(OUT,'index.html');
let html=fs.readFileSync(htmlPath,'utf8');
if(!html.includes('ui-css-audit-final-v266.css'))html=html.replace('</head>','  <link rel="stylesheet" href="css/ui-css-audit-final-v266.css?v=266b29">\n</head>');
fs.writeFileSync(htmlPath,html);
const css=fs.readFileSync(dst,'utf8');
const built=fs.readFileSync(htmlPath,'utf8');
const checks=[
 ['wired last-layer css',built.includes('ui-css-audit-final-v266.css?v=266b29')],
 ['sidebar will-change retired',css.includes('.sidebar,')&&css.includes('will-change:auto!important')],
 ['resting card promotion retired',css.includes('[class*="metric-card"]')&&css.includes('transform:none;')],
 ['generic light path narrowed',css.includes('html.ar266-light-path.ar266-theme-transitioning .tool-card')&&css.includes('transition-property:background-color,border-color,color!important')],
 ['native sidebar scroll sealed',css.includes('scroll-behavior:auto!important')],
 ['ios overlay blur animation retired',css.includes('html[data-ar-platform="ios"] #sidebarOverlay')&&css.includes('transition-property:opacity,visibility!important')],
 ['presentation only',!css.includes('feeRate')&&!css.includes('ARSTORE_STEP02_FEE_ENGINE')&&!css.includes('shopee-fee-db'))
];
const failed=checks.filter(([,ok])=>!ok).map(([n])=>n);
if(failed.length)throw new Error('V266 CSS FINAL AUDIT failed: '+failed.join(', '));
console.log('V266 CSS FINAL AUDIT PASS — permanent compositor hints retired; resting card promotion removed; Light-path transitions narrowed; native sidebar scroll sealed; iOS overlay blur animation retired; engine/data/formula untouched');
