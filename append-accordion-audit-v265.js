const fs=require('fs'),path=require('path');
const root=__dirname,out=path.join(root,'public');
if(!fs.existsSync(out))throw new Error('public/ missing; run base build first');
fs.mkdirSync(path.join(out,'css'),{recursive:true});
fs.mkdirSync(path.join(out,'js'),{recursive:true});
fs.copyFileSync(path.join(root,'ui-accordion-audit-v265.css'),path.join(out,'css','ui-accordion-audit-v265.css'));
fs.copyFileSync(path.join(root,'ui-accordion-audit-v265.js'),path.join(out,'js','ui-accordion-audit-v265.js'));
const idx=path.join(out,'index.html');
let html=fs.readFileSync(idx,'utf8');
if(!html.includes('ui-accordion-audit-v265.css'))html=html.replace('</head>','<link rel="stylesheet" href="css/ui-accordion-audit-v265.css?v=265">\n</head>');
if(!html.includes('ui-accordion-audit-v265.js'))html=html.replace('</body>','<script src="js/ui-accordion-audit-v265.js?v=265" defer></script>\n</body>');
fs.writeFileSync(idx,html);
const css=fs.readFileSync(path.join(out,'css','ui-accordion-audit-v265.css'),'utf8');
const js=fs.readFileSync(path.join(out,'js','ui-accordion-audit-v265.js'),'utf8');
const checks=[
  ['accordion css injected',html.includes('ui-accordion-audit-v265.css?v=265')],
  ['accordion js injected',html.includes('ui-accordion-audit-v265.js?v=265')],
  ['closed panel inert guard',js.includes("panel.inert=closed")],
  ['aria hidden sync',js.includes("aria-hidden")],
  ['rapid click guard',js.includes('stopImmediatePropagation')],
  ['mutation state sync',js.includes('MutationObserver')],
  ['reduced motion guard',css.includes('prefers-reduced-motion:reduce')],
  ['touch target guard',css.includes('min-height:48px')],
  ['project lock untouched',!js.includes('fee-engine')&&!js.includes('tiktok-fee')&&!js.includes('shopee-fee')]
];
const failed=checks.filter(([,ok])=>!ok);
if(failed.length)throw new Error('V265 accordion audit gate failed: '+failed.map(([name])=>name).join(', '));
console.log('V265 ACCORDION TOTAL AUDIT PASS · '+checks.length+'/'+checks.length+' static gates · navigation/UI only · PROJECT LOCK untouched');
