const fs=require('fs'),path=require('path');
const out=path.join(__dirname,'public');
if(!fs.existsSync(out))throw new Error('V266 B2.7 gate: public/ missing');
const src=path.join(__dirname,'ui-sidebar-scroll-stability-v266.css');
const dst=path.join(out,'css','ui-sidebar-scroll-stability-v266.css');
if(!fs.existsSync(src))throw new Error('V266 B2.7 gate: sidebar CSS missing');
fs.mkdirSync(path.dirname(dst),{recursive:true});
fs.copyFileSync(src,dst);
const htmlPath=path.join(out,'index.html');
let html=fs.readFileSync(htmlPath,'utf8');
if(!html.includes('ui-sidebar-scroll-stability-v266.css'))html=html.replace('</head>','  <link rel="stylesheet" href="css/ui-sidebar-scroll-stability-v266.css?v=266b27">\n</head>');
fs.writeFileSync(htmlPath,html);
const css=fs.readFileSync(dst,'utf8');
const built=fs.readFileSync(htmlPath,'utf8');
const checks=[
 ['wired',built.includes('ui-sidebar-scroll-stability-v266.css?v=266b27')],
 ['native scroll',css.includes('scroll-behavior:auto!important')],
 ['scrollbar clearance',css.includes('padding-inline-end:12px!important')],
 ['no permanent will-change',css.includes('will-change:auto!important')],
 ['desktop hover transform retired',css.includes('.sidebar-nav .nav-item:hover')&&css.includes('transform:none!important')],
 ['UI only',!css.includes('fee')&&!css.includes('formula')&&!css.includes('database')]
];
const failed=checks.filter(([,ok])=>!ok).map(([name])=>name);
if(failed.length)throw new Error('V266 B2.7 gate failed: '+failed.join(', '));
console.log('V266 B2.7 PASS — sidebar native scroll hardened; hover/compositor churn reduced; scrollbar/content clearance reserved; engine/data/formula untouched');
// redeploy trigger after gate syntax correction
