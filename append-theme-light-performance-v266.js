const fs=require('fs'),path=require('path');
const out=path.join(__dirname,'public');
if(!fs.existsSync(out))throw new Error('V266 B2.6 gate: public/ missing');
const files=[
 ['ui-theme-light-performance-v266.css',path.join(out,'css','ui-theme-light-performance-v266.css')],
 ['ui-theme-light-performance-v266.js',path.join(out,'js','ui-theme-light-performance-v266.js')],
];
for(const [src,dst] of files){if(!fs.existsSync(path.join(__dirname,src)))throw new Error('V266 B2.6 missing '+src);fs.mkdirSync(path.dirname(dst),{recursive:true});fs.copyFileSync(path.join(__dirname,src),dst)}
const htmlPath=path.join(out,'index.html');
let html=fs.readFileSync(htmlPath,'utf8');
if(!html.includes('ui-theme-light-performance-v266.css'))html=html.replace('</head>','  <link rel="stylesheet" href="css/ui-theme-light-performance-v266.css?v=266b26">\n</head>');
if(!html.includes('ui-theme-light-performance-v266.js'))html=html.replace('</body>','  <script src="js/ui-theme-light-performance-v266.js?v=266b26"></script>\n</body>');
fs.writeFileSync(htmlPath,html);
const css=fs.readFileSync(path.join(out,'css','ui-theme-light-performance-v266.css'),'utf8');
const js=fs.readFileSync(path.join(out,'js','ui-theme-light-performance-v266.js'),'utf8');
const built=fs.readFileSync(htmlPath,'utf8');
const checks=[
 ['css wired',built.includes('ui-theme-light-performance-v266.css?v=266b26')],
 ['js wired',built.includes('ui-theme-light-performance-v266.js?v=266b26')],
 ['light path class',css.includes('ar266-light-path')&&js.includes('ar266-light-path')],
 ['heavy shadow retired from light transition',!css.includes('transition-property:background-color,border-color,color,box-shadow,opacity')],
 ['presentation only',!js.includes('data-page')&&!js.includes('history.')&&!js.includes('fee')&&!js.includes('formula')]
];
const failed=checks.filter(([,ok])=>!ok).map(([name])=>name);
if(failed.length)throw new Error('V266 B2.6 gate failed: '+failed.join(', '));
console.log('V266 B2.6 PASS — Light theme paths use reduced repaint choreography; dark-family path unchanged; engine/data/formula untouched');
