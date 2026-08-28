const fs=require('fs'),path=require('path');
const root=__dirname,out=path.join(root,'public');if(!fs.existsSync(out))throw new Error('public/ missing; run base build first');
fs.mkdirSync(path.join(out,'css'),{recursive:true});fs.mkdirSync(path.join(out,'js'),{recursive:true});
fs.copyFileSync(path.join(root,'ui-ios-navigation-v264.css'),path.join(out,'css','ui-ios-navigation-v264.css'));
fs.copyFileSync(path.join(root,'ui-ios-navigation-v264.js'),path.join(out,'js','ui-ios-navigation-v264.js'));
const idx=path.join(out,'index.html');let html=fs.readFileSync(idx,'utf8');
// V263 is intentionally retired after regression; V264 uses base app.js for clicks and owns iOS swipe only.
html=html.replace(/\s*<link[^>]+ui-ios-single-nav-v263\.css[^>]*>/g,'').replace(/\s*<script[^>]+ui-ios-single-nav-v263\.js[^>]*><\/script>/g,'');
if(!html.includes('__ARSTORE_V264_NAV_AUTHORITY'))html=html.replace('<head>','<head>\n<script>window.__ARSTORE_V264_NAV_AUTHORITY=true;<\/script>');
if(!html.includes('ui-ios-navigation-v264.css'))html=html.replace('</head>','<link rel="stylesheet" href="css/ui-ios-navigation-v264.css?v=264">\n</head>');
if(!html.includes('ui-ios-navigation-v264.js'))html=html.replace('</body>','<script src="js/ui-ios-navigation-v264.js?v=264" defer></script>\n</body>');
fs.writeFileSync(idx,html);
// Disable older iOS gesture ownership while preserving all non-navigation motion/features.
const v261=path.join(out,'js','ui-motion-core-v261.js');if(fs.existsSync(v261)){let s=fs.readFileSync(v261,'utf8');s=s.replace('    setupDrawerGesture();','    if(!(window.__ARSTORE_V264_NAV_AUTHORITY&&platform===\'ios\'))setupDrawerGesture();');fs.writeFileSync(v261,s);}
const v259=path.join(out,'js','ui-ios-sidebar-navfix-v259.js');if(fs.existsSync(v259)){let s=fs.readFileSync(v259,'utf8');s=s.replace("  const ua=navigator.userAgent||'';","  if(window.__ARSTORE_V264_NAV_AUTHORITY)return;\n  const ua=navigator.userAgent||'';");fs.writeFileSync(v259,s);}
console.log('V264 FULL UI CODE HARDENING APPLIED — V263 retired; base click/router authority restored; iOS one-gesture/one-action enabled; database/data/formula payload untouched');
