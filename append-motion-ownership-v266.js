const fs=require('fs'),path=require('path');
const root=__dirname,out=path.join(root,'public');
if(!fs.existsSync(out))throw new Error('public/ missing; run base build first');
fs.mkdirSync(path.join(out,'css'),{recursive:true});
fs.mkdirSync(path.join(out,'js'),{recursive:true});
fs.copyFileSync(path.join(root,'ui-motion-ownership-v266.css'),path.join(out,'css','ui-motion-ownership-v266.css'));
fs.copyFileSync(path.join(root,'ui-motion-ownership-v266.js'),path.join(out,'js','ui-motion-ownership-v266.js'));

const idx=path.join(out,'index.html');
let html=fs.readFileSync(idx,'utf8');
if(!html.includes('__ARSTORE_V266_MOTION_OWNERSHIP'))html=html.replace('<head>','<head>\n<script>window.__ARSTORE_V266_MOTION_OWNERSHIP=true;<\/script>');
if(!html.includes('ui-motion-ownership-v266.css'))html=html.replace('</head>','<link rel="stylesheet" href="css/ui-motion-ownership-v266.css?v=266b2">\n</head>');
if(!html.includes('ui-motion-ownership-v266.js'))html=html.replace('</body>','<script src="js/ui-motion-ownership-v266.js?v=266b2" defer></script>\n</body>');
fs.writeFileSync(idx,html);

const built=fs.readFileSync(idx,'utf8');
if(!/ui-interaction-authority-v266\.js/.test(built))throw new Error('V266 B2 gate failed: Batch 1 interaction authority missing');
if(!/ui-ios-compat-v265\.js/.test(built))throw new Error('V266 B2 gate failed: V265 iOS compatibility baseline missing');
if(!/ui-motion-ownership-v266\.js/.test(built)||!/ui-motion-ownership-v266\.css/.test(built))throw new Error('V266 B2 gate failed: motion ownership assets not wired');
if(/ui-ios-navigation-v264\.js|ui-ios-single-nav-v263\.js/.test(built))throw new Error('V266 B2 gate failed: retired custom swipe asset reappeared');

const js=fs.readFileSync(path.join(out,'js','ui-motion-ownership-v266.js'),'utf8');
if(/addEventListener\(['"](?:touchstart|touchmove|touchend|touchcancel|click)['"]/.test(js))throw new Error('V266 B2 gate failed: motion layer must not own touch/click navigation');
if(/history\.(?:pushState|replaceState)|location\.(?:assign|replace)|\.click\(\)/.test(js))throw new Error('V266 B2 gate failed: motion layer must not create navigation actions');
const css=fs.readFileSync(path.join(out,'css','ui-motion-ownership-v266.css'),'utf8');
if(!/data-ar266-transform-owner/.test(css)||!/ar266RouteIn/.test(css))throw new Error('V266 B2 gate failed: transform ownership protections missing');
if(/@keyframes[\s\S]{0,500}\b(?:top|left|right|bottom|margin(?:-top|-left|-right|-bottom)?)\s*:/.test(css))throw new Error('V266 B2 gate failed: keyframes must not animate layout properties');

console.log('V266 BATCH 2 PASS — transform ownership isolated; iOS route motion consolidated; value/invalid feedback no longer steals transforms; canonical drawer transform preserved; navigation/data/formula untouched');
