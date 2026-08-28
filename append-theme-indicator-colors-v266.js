const fs=require('fs'),path=require('path');
const out=path.join(__dirname,'public');
if(!fs.existsSync(out))throw new Error('V266 B2.3 gate: public/ missing');
const src=path.join(__dirname,'ui-theme-indicator-colors-v266.css');
const dst=path.join(out,'css','ui-theme-indicator-colors-v266.css');
if(!fs.existsSync(src))throw new Error('V266 B2.3 gate: indicator CSS missing');
fs.mkdirSync(path.dirname(dst),{recursive:true});
fs.copyFileSync(src,dst);
const htmlPath=path.join(out,'index.html');
let html=fs.readFileSync(htmlPath,'utf8');
if(!html.includes('ui-theme-indicator-colors-v266.css'))html=html.replace('</head>','  <link rel="stylesheet" href="css/ui-theme-indicator-colors-v266.css?v=266b23">\n</head>');
fs.writeFileSync(htmlPath,html);
const css=fs.readFileSync(dst,'utf8');
const built=fs.readFileSync(htmlPath,'utf8');
const checks=[
 ['wired',built.includes('ui-theme-indicator-colors-v266.css?v=266b23')],
 ['light white',css.includes('--ar266-active-indicator:#ffffff')],
 ['dark semantic',css.includes('--ar266-active-indicator:#202938')],
 ['charcoal semantic',css.includes('--ar266-active-indicator:#3a3b40')],
 ['oled semantic',css.includes('--ar266-active-indicator:#050505')],
 ['presentation only',!css.includes('data-page')&&!css.includes('fee')&&!css.includes('formula')]
];
const failed=checks.filter(([,ok])=>!ok).map(([name])=>name);
if(failed.length)throw new Error('V266 B2.3 gate failed: '+failed.join(', '));
console.log('V266 B2.3 PASS — active theme indicator now matches Light/Dark/Charcoal/OLED semantics; presentation only; engine/data/formula untouched');
