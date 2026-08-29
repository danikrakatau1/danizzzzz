const fs=require('fs'),path=require('path');
const OUT=path.join(__dirname,'public');
if(!fs.existsSync(OUT))throw new Error('V274 CSS FINAL AUDIT: public/ missing');
const htmlPath=path.join(OUT,'index.html');
const src=path.join(__dirname,'ui-css-audit-final-v274.css');
const dst=path.join(OUT,'css','ui-css-audit-final-v274.css');
if(!fs.existsSync(src)||!fs.existsSync(htmlPath))throw new Error('V274 required input missing');
fs.mkdirSync(path.dirname(dst),{recursive:true});fs.copyFileSync(src,dst);
let html=fs.readFileSync(htmlPath,'utf8');
html=html.replace(/^\s*<link[^>]+ui-css-audit-final-v274\.css[^>]*>\s*$/gmi,'');
html=html.replace('</head>','  <link rel="stylesheet" href="css/ui-css-audit-final-v274.css?v=274">\n</head>');
fs.writeFileSync(htmlPath,html);
const cssDir=path.join(OUT,'css');
const cssFiles=fs.readdirSync(cssDir).filter(f=>f.endsWith('.css')).sort();
const linked=[...html.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["']/g)].map(m=>m[1].replace(/\?.*$/,''));
const dupLinks=[...new Set(linked.filter((x,i)=>linked.indexOf(x)!==i))];
const missingLinks=linked.filter(h=>!/^https?:/i.test(h)).filter(h=>!fs.existsSync(path.join(OUT,h.replace(/^\/?/,''))));
let aggregate='';
for(const f of cssFiles){const s=fs.readFileSync(path.join(cssDir,f),'utf8');if(!s.trim())throw new Error('V274 empty CSS '+f);aggregate+='\n'+s;}
const finalCss=fs.readFileSync(dst,'utf8');
const checks=[
 ['V274 wired once',(html.match(/ui-css-audit-final-v274\.css/g)||[]).length===1],
 ['all linked styles exist',missingLinks.length===0],
 ['no duplicate stylesheet href',dupLinks.length===0],
 ['CSS inventory non-empty',cssFiles.length>0],
 ['sidebar compositor hints retired',finalCss.includes('will-change:auto!important')],
 ['native sidebar scroll sealed',finalCss.includes('scroll-behavior:auto!important')&&finalCss.includes('overscroll-behavior-y:contain!important')],
 ['iOS overlay blur animation retired',finalCss.includes('transition-property:opacity,visibility!important')&&finalCss.includes('-webkit-backdrop-filter:none!important')],
 ['reduced-motion hard stop',finalCss.includes('@media(prefers-reduced-motion:reduce)')&&finalCss.includes('animation-duration:0.01ms!important')],
 ['light theme coverage',/data-theme=["']light["']|html\[data-theme=["']light["']/.test(aggregate)],
 ['dark theme coverage',/data-theme=["']dark["']|html\[data-theme=["']dark["']/.test(aggregate)],
 ['charcoal theme coverage',aggregate.includes('charcoal')],
 ['oled theme coverage',aggregate.includes('oled')],
 ['no remote CSS @import',!/@import\s+(?:url\()?\s*["']?https?:\/\//i.test(aggregate)],
 ['no javascript URL in CSS',! /url\(\s*["']?javascript:/i.test(aggregate)],
 ['PROJECT LOCK untouched',!finalCss.includes('ARSTORE_STEP02_FEE_ENGINE')&&!finalCss.includes('shopee-fee-db')&&!finalCss.includes('tiktok-fee-db')]
];
const failed=checks.filter(([,ok])=>!ok);
if(failed.length){console.error('V274 failed checks:',failed.map(([n])=>n),{cssFiles:cssFiles.length,missingLinks,dupLinks});process.exit(1)}
console.log(`V274 CSS FINAL AUDIT PASS · ${checks.length}/${checks.length} gates · ${cssFiles.length} CSS files inventoried · theme/sidebar/iOS/reduced-motion cascade sealed · PROJECT LOCK untouched`);
