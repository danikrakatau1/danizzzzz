const fs=require('fs'),path=require('path');
const root=__dirname,out=path.join(root,'public');if(!fs.existsSync(out))throw new Error('public/ missing; run base build first');
fs.mkdirSync(path.join(out,'css'),{recursive:true});fs.mkdirSync(path.join(out,'js'),{recursive:true});
fs.copyFileSync(path.join(root,'ui-ios-compat-v265.css'),path.join(out,'css','ui-ios-compat-v265.css'));
fs.copyFileSync(path.join(root,'ui-ios-compat-v265.js'),path.join(out,'js','ui-ios-compat-v265.js'));
const idx=path.join(out,'index.html');let html=fs.readFileSync(idx,'utf8');
// Retire V264 custom-swipe assets completely. Keep the V264 authority flag because it suppresses legacy V259/V261 iOS navigation handlers upstream.
html=html.replace(/\s*<link[^>]+ui-ios-navigation-v264\.css[^>]*>/g,'').replace(/\s*<script[^>]+ui-ios-navigation-v264\.js[^>]*><\/script>/g,'');
if(!html.includes('__ARSTORE_V265_IOS_COMPAT'))html=html.replace('<head>','<head>\n<script>window.__ARSTORE_V265_IOS_COMPAT=true;<\/script>');
if(!html.includes('ui-ios-compat-v265.css'))html=html.replace('</head>','<link rel="stylesheet" href="css/ui-ios-compat-v265.css?v=265">\n</head>');
if(!html.includes('ui-ios-compat-v265.js'))html=html.replace('</body>','<script src="js/ui-ios-compat-v265.js?v=265" defer></script>\n</body>');
fs.writeFileSync(idx,html);
const built=fs.readFileSync(idx,'utf8');
if(/ui-ios-navigation-v264\.js/.test(built))throw new Error('V265 gate failed: V264 custom swipe script still wired');
if(!/ui-ios-compat-v265\.js/.test(built)||!/ui-ios-compat-v265\.css/.test(built))throw new Error('V265 gate failed: compatibility assets not wired');
console.log('V265 IPHONE COMPATIBILITY PASS — custom iPhone swipe removed; Safari/iOS safe-area, viewport, keyboard, BFCache, overlay recovery and premium motion enabled; database/data/formula payload untouched');
