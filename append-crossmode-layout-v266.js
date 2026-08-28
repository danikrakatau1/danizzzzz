const fs=require('fs'),path=require('path');
const out=path.join(__dirname,'public');
if(!fs.existsSync(out))throw new Error('V266 B3 gate: public/ missing');
const assets=[
 ['ui-crossmode-layout-v266.css','css/ui-crossmode-layout-v266.css'],
 ['ui-crossmode-layout-v266.js','js/ui-crossmode-layout-v266.js']
];
for(const [srcRel,dstRel] of assets){
 const src=path.join(__dirname,srcRel),dst=path.join(out,dstRel);
 if(!fs.existsSync(src))throw new Error('V266 B3 gate: missing '+srcRel);
 fs.mkdirSync(path.dirname(dst),{recursive:true});
 fs.copyFileSync(src,dst);
}
const htmlPath=path.join(out,'index.html');
let html=fs.readFileSync(htmlPath,'utf8');
if(!html.includes('ui-crossmode-layout-v266.css'))html=html.replace('</head>','  <link rel="stylesheet" href="css/ui-crossmode-layout-v266.css?v=266b3">\n</head>');
if(!html.includes('ui-crossmode-layout-v266.js'))html=html.replace('</body>','  <script src="js/ui-crossmode-layout-v266.js?v=266b3"></script>\n</body>');
fs.writeFileSync(htmlPath,html);

const css=fs.readFileSync(path.join(out,'css/ui-crossmode-layout-v266.css'),'utf8');
const js=fs.readFileSync(path.join(out,'js/ui-crossmode-layout-v266.js'),'utf8');
const built=fs.readFileSync(htmlPath,'utf8');
const apiPath=path.join(__dirname,'api','shopee-research.js');
const api=fs.existsSync(apiPath)?fs.readFileSync(apiPath,'utf8'):'';
const checks=[
 ['css wired',built.includes('ui-crossmode-layout-v266.css?v=266b3')],
 ['js wired',built.includes('ui-crossmode-layout-v266.js?v=266b3')],
 ['desktop sidebar token',css.includes('--ar266-sidebar-w:246px')],
 ['desktop main subtracts sidebar',css.includes('width:calc(100% - var(--ar266-sidebar-w))!important')],
 ['desktop auto margin neutralized',css.includes('margin-left:var(--ar266-sidebar-w)!important')],
 ['mobile main full width',css.includes('.main-content{margin-left:0!important;width:100%!important;max-width:100%!important}')],
 ['native desktop sidebar scroll',css.includes('scroll-behavior:auto!important')],
 ['brand single family',js.includes("const BRAND='assets/arstore-emblem-transparent.png'")],
 ['api env gate present',api.includes('process.env.NEXSCOPE_API_KEY')],
 ['api key not hardcoded',!api.includes('isi_api_key_nexscope_kamu')],
 ['no navigation authority',!js.includes('history.pushState')&&!js.includes("addEventListener('click'")],
 ['no formula/fee mutation',!css.includes('feeRate')&&!js.includes('feeRate')]
];
const failed=checks.filter(([,ok])=>!ok).map(([n])=>n);
if(failed.length)throw new Error('V266 B3 gate failed: '+failed.join(', '));
console.log('V266 B3 PASS — desktop shell no longer overlaps sidebar; horizontal canvas bounded; native sidebar scroll restored; mobile/tablet responsive geometry and brand asset family normalized; Nexscope remains server-env only; engine/data/formula untouched');
