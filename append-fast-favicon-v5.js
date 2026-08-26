const fs=require('fs');
const path=require('path');
const crypto=require('crypto');

const htmlPath='public/index.html';
const src48='assets-fast-v5/ar-hanger-final-v5-48.b64';
const src180='assets-fast-v5/ar-hanger-final-v5-180.b64';
const outDir='public/assets/favicons';
const out48=path.join(outDir,'ar-hanger-final-v5-48.png');
const out180=path.join(outDir,'ar-hanger-final-v5-180.png');
const icoPath='public/favicon-ar-hanger-final-v5.ico';

const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const expected48='f0be49ac67275b689484dd146eb21f35587314c04db58422eae4f1b83a23b306';
const expected180='2bc7af22431c1f6e2ba002704899a9fe6b49fea8635d754caf015024225014d3';

if(!fs.existsSync(htmlPath))throw new Error('FAST FAVICON V5: public index missing');
for(const f of [src48,src180])if(!fs.existsSync(f))throw new Error('FAST FAVICON V5: source missing '+f);

const b48=Buffer.from(fs.readFileSync(src48,'utf8').trim(),'base64');
const b180=Buffer.from(fs.readFileSync(src180,'utf8').trim(),'base64');
function checkPng(buf,size,expected,label){
  if(buf.length<24||buf.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw new Error('FAST FAVICON V5 bad PNG '+label);
  if(buf.readUInt32BE(16)!==size||buf.readUInt32BE(20)!==size)throw new Error('FAST FAVICON V5 wrong size '+label);
  if(sha(buf)!==expected)throw new Error('FAST FAVICON V5 hash mismatch '+label);
}
checkPng(b48,48,expected48,'48');
checkPng(b180,180,expected180,'180');
fs.mkdirSync(outDir,{recursive:true});
fs.writeFileSync(out48,b48);
fs.writeFileSync(out180,b180);

// Minimal ICO fallback built directly from the verified 48px PNG.
const icoHeader=Buffer.alloc(22);
icoHeader.writeUInt16LE(0,0); icoHeader.writeUInt16LE(1,2); icoHeader.writeUInt16LE(1,4);
icoHeader[6]=48; icoHeader[7]=48;
icoHeader.writeUInt16LE(1,10); icoHeader.writeUInt16LE(32,12);
icoHeader.writeUInt32LE(b48.length,14); icoHeader.writeUInt32LE(22,18);
const ico=Buffer.concat([icoHeader,b48]);
fs.writeFileSync(icoPath,ico);
fs.writeFileSync('public/favicon.ico',ico);

let html=fs.readFileSync(htmlPath,'utf8');
// Remove every previous icon/manifest declaration so Safari sees one identity only.
html=html.replace(/^\s*<link\b[^>]*\brel=["'][^"']*(?:icon|manifest)[^"']*["'][^>]*>\s*$/gmi,'');
html=html.replace(/^\s*<meta\b[^>]*name=["']apple-mobile-web-app-title["'][^>]*>\s*$/gmi,'');
const links=`  <link rel="icon" type="image/png" sizes="48x48" href="/assets/favicons/ar-hanger-final-v5-48.png">\n  <link rel="shortcut icon" type="image/x-icon" href="/favicon-ar-hanger-final-v5.ico">\n  <link rel="apple-touch-icon" sizes="180x180" href="/assets/favicons/ar-hanger-final-v5-180.png">\n  <link rel="apple-touch-icon-precomposed" sizes="180x180" href="/assets/favicons/ar-hanger-final-v5-180.png">\n  <meta name="apple-mobile-web-app-title" content="ARSTORE">`;
if(/<meta name="theme-color"[^>]*>/i.test(html)) html=html.replace(/(<meta name="theme-color"[^>]*>)/i,`$1\n${links}`);
else html=html.replace('</head>',`${links}\n</head>`);
fs.writeFileSync(htmlPath,html);

// Prevent runtime code from re-inserting the old emblem as a competing favicon.
for(const jsPath of ['public/js/app.js','public/js/v3-shell.js']){
  if(!fs.existsSync(jsPath))continue;
  let js=fs.readFileSync(jsPath,'utf8');
  js=js.replace(/addHeadLink\(\s*['"]icon['"]\s*,\s*['"][^'"]+['"]\s*,\s*\{[^}]*\}\s*\);?/g,"addHeadLink('icon','/assets/favicons/ar-hanger-final-v5-48.png',{type:'image/png',sizes:'48x48'});");
  js=js.replace(/addHeadLink\(\s*['"]apple-touch-icon['"]\s*,\s*['"][^'"]+['"](?:\s*,\s*\{[^}]*\})?\s*\);?/g,"addHeadLink('apple-touch-icon','/assets/favicons/ar-hanger-final-v5-180.png',{sizes:'180x180'});");
  fs.writeFileSync(jsPath,js);
}

const finalHtml=fs.readFileSync(htmlPath,'utf8');
for(const req of ['ar-hanger-final-v5-48.png','ar-hanger-final-v5-180.png','favicon-ar-hanger-final-v5.ico'])if(!finalHtml.includes(req))throw new Error('FAST FAVICON V5 HTML gate missing '+req);
if(/favicon-48x48\.png\?v=37-60|favicon-180x180\.png\?v=37-60/i.test(finalHtml))throw new Error('FAST FAVICON V5 old favicon still referenced');
console.log('FAST FAVICON V5 PASS · AR + hanger + suit · 48 + 180 + ICO · Safari cache-safe filenames');
