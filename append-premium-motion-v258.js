const fs=require('fs');const path=require('path');
const root=__dirname,out=path.join(root,'public');if(!fs.existsSync(out))throw new Error('public/ missing; run base build first');
const css=['ui-motion-core-v258.css','ui-platform-ios-v258.css','ui-platform-android-v258.css','ui-platform-desktop-v258.css'];const js=['ui-motion-core-v258.js'];
fs.mkdirSync(path.join(out,'css'),{recursive:true});fs.mkdirSync(path.join(out,'js'),{recursive:true});
for(const f of css)fs.copyFileSync(path.join(root,f),path.join(out,'css',f));for(const f of js)fs.copyFileSync(path.join(root,f),path.join(out,'js',f));
const index=path.join(out,'index.html');let html=fs.readFileSync(index,'utf8');const cssTags=css.map(f=>`<link rel="stylesheet" href="css/${f}?v=258">`).join('\n');const jsTags=js.map(f=>`<script src="js/${f}?v=258" defer></script>`).join('\n');
if(!html.includes('ui-motion-core-v258.css'))html=html.replace('</head>',`${cssTags}\n</head>`);if(!html.includes('ui-motion-core-v258.js'))html=html.replace('</body>',`${jsTags}\n</body>`);fs.writeFileSync(index,html);
console.log('PREMIUM MOTION V258 APPLIED — GLOBAL + iOS + Android + Desktop; UI/UX only; fee/formula/database payload untouched');
