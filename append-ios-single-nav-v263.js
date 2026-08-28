const fs=require('fs'),path=require('path');
const root=__dirname,out=path.join(root,'public');if(!fs.existsSync(out))throw new Error('public/ missing; run base build first');
fs.mkdirSync(path.join(out,'css'),{recursive:true});fs.mkdirSync(path.join(out,'js'),{recursive:true});
fs.copyFileSync(path.join(root,'ui-ios-single-nav-v263.css'),path.join(out,'css','ui-ios-single-nav-v263.css'));
fs.copyFileSync(path.join(root,'ui-ios-single-nav-v263.js'),path.join(out,'js','ui-ios-single-nav-v263.js'));
for(const rel of ['js/ui-ios-sidebar-navfix-v259.js','js/ui-motion-core-v261.js']){
  const file=path.join(out,rel);if(!fs.existsSync(file))continue;let s=fs.readFileSync(file,'utf8');
  if(rel.includes('v259'))s=s.replace("if(!isiOS)return;","if(!isiOS||window.__ARSTORE_IOS_NAV_V263)return;");
  if(rel.includes('v261'))s=s.replace("if(platform==='desktop'||reduce)return;","if(platform==='desktop'||reduce||(platform==='ios'&&window.__ARSTORE_IOS_NAV_V263))return;");
  fs.writeFileSync(file,s);
}
const index=path.join(out,'index.html');let html=fs.readFileSync(index,'utf8');
if(!html.includes('__ARSTORE_IOS_NAV_V263'))html=html.replace('<head>','<head>\n<script>window.__ARSTORE_IOS_NAV_V263=true;</script>');
if(!html.includes('ui-ios-single-nav-v263.css'))html=html.replace('</head>','<link rel="stylesheet" href="css/ui-ios-single-nav-v263.css?v=263">\n</head>');
if(!html.includes('ui-ios-single-nav-v263.js'))html=html.replace('</body>','<script src="js/ui-ios-single-nav-v263.js?v=263" defer></script>\n</body>');
fs.writeFileSync(index,html);
console.log('V263 SINGLE IOS NAV AUTHORITY APPLIED — legacy iOS V259/V261 navigation handlers disabled; UI/navigation only; master fee/formula/database payload untouched');
