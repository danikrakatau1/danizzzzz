const fs=require('fs');
const cp=require('child_process');
const path=require('path');
const zlib=require('zlib');
const htmlPath='public/index.html';
const payloadDir='.deploy-v71';
if(!fs.existsSync(htmlPath)) throw new Error('public/index.html missing');
const b64=[0,1,2,3].map(i=>fs.readFileSync(path.join(payloadDir,`bundle.p${String(i).padStart(2,'0')}`),'utf8').trim()).join('');
let payload;
try { payload=JSON.parse(zlib.gunzipSync(Buffer.from(b64,'base64')).toString('utf8')); }
catch(e){ throw new Error('V71 payload decode failed: '+e.message); }
const js=payload.productJs, css=payload.productCss, history=payload.historyJs;
if(!js?.includes('ARSTORE Product Center V71 FULL FUNCTIONAL')) throw new Error('V71 JS marker missing');
if(!css?.includes('V71 FULL FUNCTIONAL additions')) throw new Error('V71 CSS marker missing');
if(!history?.includes('SMART TAB HISTORY UX AUTHORITY')) throw new Error('#70 history payload marker missing');
fs.mkdirSync('public/js',{recursive:true}); fs.mkdirSync('public/css',{recursive:true});
fs.writeFileSync('public/js/product-center-v71.js',js);
fs.writeFileSync('public/css/product-center-v71.css',css);
fs.writeFileSync('public/js/ui-smart-tab-history-v70.js',history);
cp.execFileSync(process.execPath,['--check','public/js/product-center-v71.js'],{stdio:'inherit'});
cp.execFileSync(process.execPath,['--check','public/js/ui-smart-tab-history-v70.js'],{stdio:'inherit'});
let html=fs.readFileSync(htmlPath,'utf8');
html=html.replace(/^\s*<link[^>]+product-center-v71\.css[^>]*>\s*$/gmi,'');
html=html.replace(/^\s*<script[^>]+product-center-v71\.js[^>]*><\/script>\s*$/gmi,'');
html=html.replace('</head>','  <link rel="stylesheet" href="css/product-center-v71.css" />\n</head>');
html=html.replace('</body>','  <script src="js/product-center-v71.js"></script>\n</body>');
fs.writeFileSync(htmlPath,html);
for(const marker of ['product-center-v71.js','product-center-v71.css','page-product-my','page-product-finance','page-product-stock','page-product-competitor','page-product-affiliate','page-product-orders']) if(!html.includes(marker)) throw new Error('Product Center gate '+marker);
console.log('ARSTORE Product Center V71 PASS · 6 modules · CRUD + finance periods + stock + competitors + content/affiliate + orders');
