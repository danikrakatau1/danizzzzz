const fs=require('fs'),path=require('path');
const OUT=path.join(__dirname,'public');if(!fs.existsSync(OUT))throw new Error('V288 LIGHT SOFT PREMIUM: public/ missing');
const src=path.join(__dirname,'ui-light-soft-premium-v288.css'),dst=path.join(OUT,'css','ui-light-soft-premium-v288.css');
fs.copyFileSync(src,dst);
const idx=path.join(OUT,'index.html');let html=fs.readFileSync(idx,'utf8');
html=html.replace(/^\s*<link[^>]+ui-light-soft-premium-v288\.css[^>]*>\s*$/gmi,'');
html=html.replace('</head>','  <link rel="stylesheet" href="css/ui-light-soft-premium-v288.css?v=288">\n</head>');
fs.writeFileSync(idx,html);
const css=fs.readFileSync(dst,'utf8');
const checks=[
 ['wired once',(html.match(/ui-light-soft-premium-v288\.css/g)||[]).length===1],
 ['light scoped only',css.includes('html[data-theme="light"]')&&!css.includes('html[data-theme="dark"]')&&!css.includes('html[data-theme="charcoal"]')&&!css.includes('html[data-theme="oled"]')],
 ['no pure white background peak',!/(background(?:-color)?\s*:\s*#fff(?:fff)?\b)/i.test(css)],
 ['soft page background',css.includes('--ui-page-bg:#e8edf3')],
 ['soft surface hierarchy',css.includes('--ui-surface:#f3f5f7')&&css.includes('--ui-surface-2:#edf1f4')],
 ['soft topbar',css.includes('--ui-topbar-bg:rgba(236,240,244,.94)')],
 ['card surfaces overridden',css.includes('.v3-calc-card')&&css.includes('.profit-form-card')&&css.includes('.settings-card')],
 ['inputs softened',css.includes("html[data-theme=\"light\"] input")&&css.includes('background:#edf1f4!important')],
 ['text contrast retained',css.includes('--text:#172033')&&css.includes('--muted:#697589')],
 ['sidebar softened',css.includes('.sidebar{')&&css.includes('#eef2f5')],
 ['contrast preference supported',css.includes('prefers-contrast:more')],
 ['PROJECT LOCK untouched',!css.includes('ARSTORE_STEP02_FEE_ENGINE')&&!css.includes('shopee-fee-db-2026.js')&&!css.includes('tiktok-fee-db-2026.js')&&!css.includes('profit-engine-ui.js')]
];
const failed=checks.filter(([,ok])=>!ok);if(failed.length){console.error('V288 failed:',failed.map(([n])=>n));process.exit(1)}
console.log(`V288 SOFT PREMIUM LIGHT THEME PASS · ${checks.length}/${checks.length} gates · pure-white glare reduced with layered off-white surfaces · PROJECT LOCK untouched`);
