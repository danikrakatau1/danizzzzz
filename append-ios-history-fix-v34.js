const fs=require('fs');
const cp=require('child_process');

const htmlPath='public/index.html';
const src='ui-ios-history-canonical-v34.js';
const dst='public/js/ui-ios-history-canonical-v34.js';
const marker='V3.4 IOS SWIPE-BACK CANONICAL HISTORY FIX';

if(!fs.existsSync(htmlPath))throw new Error('V3.4 build index missing');
if(!fs.existsSync(src))throw new Error('iOS history source missing');
cp.execFileSync(process.execPath,['--check',src],{stdio:'inherit'});

const runtime=fs.readFileSync(src,'utf8');
if(!runtime.includes(marker))throw new Error('iOS history marker missing');
fs.mkdirSync('public/js',{recursive:true});
fs.writeFileSync(dst,runtime);

let html=fs.readFileSync(htmlPath,'utf8');
if(!html.includes('js/ui-ios-history-canonical-v34.js')){
  html=html.replace('</body>','  <script src="js/ui-ios-history-canonical-v34.js"></script>\n</body>');
}
if(!html.includes('js/ui-ios-history-canonical-v34.js'))throw new Error('iOS history runtime injection failed');
fs.writeFileSync(htmlPath,html);

console.log('V3.4 iOS swipe-back canonical history fix appended');
