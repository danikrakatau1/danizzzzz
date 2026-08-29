const fs=require('fs'),path=require('path');
const OUT=path.join(__dirname,'public');
const htmlPath=path.join(OUT,'index.html');
if(!fs.existsSync(htmlPath))throw new Error('V275 HTML FINAL AUDIT: public/index.html missing');
let html=fs.readFileSync(htmlPath,'utf8');

// Static drawer semantics must be correct before JavaScript boots.
html=html.replace(/<button([^>]*\bid=["']mobileMenuBtn["'][^>]*)>/i,(tag,attrs)=>{
  let a=attrs;
  if(!/\btype=/.test(a))a=' type="button"'+a;
  if(!/\baria-controls=/.test(a))a+=' aria-controls="sidebar"';
  if(!/\baria-expanded=/.test(a))a+=' aria-expanded="false"';
  return '<button'+a+'>';
});
html=html.replace(/<div([^>]*\bid=["']sidebarOverlay["'][^>]*)>/i,(tag,attrs)=>{
  let a=attrs;if(!/\baria-hidden=/.test(a))a+=' aria-hidden="true"';return '<div'+a+'>';
});
fs.writeFileSync(htmlPath,html);

const ids=[...html.matchAll(/\bid=["']([^"']+)["']/g)].map(m=>m[1]);
const duplicateIds=[...new Set(ids.filter((id,i)=>ids.indexOf(id)!==i))];
const idSet=new Set(ids);
const scripts=[...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)].map(m=>m[1].split('?')[0]);
const duplicateScripts=[...new Set(scripts.filter((src,i)=>scripts.indexOf(src)!==i))];
const styles=[...html.matchAll(/<link\b[^>]*\brel=["'][^"']*stylesheet[^"']*["'][^>]*\bhref=["']([^"']+)["'][^>]*>/gi)].map(m=>m[1].split('?')[0]);
const duplicateStyles=[...new Set(styles.filter((href,i)=>styles.indexOf(href)!==i))];
const localRefs=[...scripts,...styles].filter(x=>!/^https?:\/\//i.test(x)&&!/^\/\//.test(x)).map(x=>x.replace(/^\//,''));
const missingAssets=[...new Set(localRefs.filter(x=>!fs.existsSync(path.join(OUT,x))))];

const blankLinks=[...html.matchAll(/<a\b[^>]*\btarget=["']_blank["'][^>]*>/gi)].map(m=>m[0]);
const unsafeBlank=blankLinks.filter(tag=>!(/\brel=["'][^"']*\bnoopener\b/i.test(tag)&&/\brel=["'][^"']*\bnoreferrer\b/i.test(tag)));
const images=[...html.matchAll(/<img\b[^>]*>/gi)].map(m=>m[0]);
const missingAlt=images.filter(tag=>!/\balt=["'][^"']*["']/i.test(tag));
const labels=[...html.matchAll(/<label\b[^>]*\bfor=["']([^"']+)["'][^>]*>/gi)].map(m=>m[1]);
const brokenLabels=labels.filter(id=>!idSet.has(id));
const controls=[...html.matchAll(/\baria-controls=["']([^"']+)["']/gi)].map(m=>m[1]);
const brokenControls=controls.filter(id=>!idSet.has(id));
const labelledBy=[...html.matchAll(/\baria-labelledby=["']([^"']+)["']/gi)].map(m=>m[1]);
const brokenLabelledBy=labelledBy.filter(id=>!idSet.has(id));
const forms=[...html.matchAll(/<form\b[^>]*>[\s\S]*?<\/form>/gi)].map(m=>m[0]);
const submitDefaultButtons=[];
for(const form of forms){for(const m of form.matchAll(/<button\b([^>]*)>/gi)){if(!/\btype=["'](?:button|submit|reset)["']/i.test(m[1]))submitDefaultButtons.push(m[0]);}}
const viewport=html.match(/<meta\b[^>]*\bname=["']viewport["'][^>]*\bcontent=["']([^"']+)["'][^>]*>/i)?.[1]||'';
const semanticPath=path.join(OUT,'js','ui-html-runtime-semantics-v272.js');
const semantic=fs.existsSync(semanticPath)?fs.readFileSync(semanticPath,'utf8'):'';
const checks=[
 ['doctype',/^\s*<!doctype html>/i.test(html)],
 ['language id',/<html\b[^>]*\blang=["']id["']/i.test(html)],
 ['single charset',(html.match(/<meta\b[^>]*\bcharset=/gi)||[]).length===1],
 ['single viewport',(html.match(/<meta\b[^>]*\bname=["']viewport["']/gi)||[]).length===1],
 ['viewport cover',/viewport-fit=cover/i.test(viewport)],
 ['single main',(html.match(/<main\b/gi)||[]).length===1],
 ['unique ids',duplicateIds.length===0],
 ['unique script wiring',duplicateScripts.length===0],
 ['unique stylesheet wiring',duplicateStyles.length===0],
 ['referenced local js/css exist',missingAssets.length===0],
 ['safe target blank',unsafeBlank.length===0],
 ['images have alt',missingAlt.length===0],
 ['label targets exist',brokenLabels.length===0],
 ['aria-controls targets exist',brokenControls.length===0],
 ['aria-labelledby targets exist',brokenLabelledBy.length===0],
 ['form buttons explicit type',submitDefaultButtons.length===0],
 ['menu controls sidebar',/id=["']mobileMenuBtn["'][^>]*aria-controls=["']sidebar["']/i.test(html)||/aria-controls=["']sidebar["'][^>]*id=["']mobileMenuBtn["']/i.test(html)],
 ['menu starts collapsed',/id=["']mobileMenuBtn["'][^>]*aria-expanded=["']false["']/i.test(html)||/aria-expanded=["']false["'][^>]*id=["']mobileMenuBtn["']/i.test(html)],
 ['overlay starts hidden',/id=["']sidebarOverlay["'][^>]*aria-hidden=["']true["']/i.test(html)||/aria-hidden=["']true["'][^>]*id=["']sidebarOverlay["']/i.test(html)],
 ['settings four themes',['light','dark','charcoal','oled'].every(t=>html.includes(`data-theme-choice="${t}"`))],
 ['runtime drawer aria sync',semantic.includes("setAttribute('aria-expanded',String(isOpen))")&&semantic.includes("setAttribute('aria-hidden',String(!isOpen))")],
 ['no javascript href',!/href=["']\s*javascript:/i.test(html)],
 ['PROJECT LOCK untouched',!html.includes('ARSTORE_SHOPEE_FEE_DB_2026=[')&&!html.includes('ARSTORE_TIKTOK_FEE_DB_2026=[')]
];
const failed=checks.filter(([,ok])=>!ok).map(([n])=>n);
if(failed.length){
 const detail={duplicateIds,duplicateScripts,duplicateStyles,missingAssets,unsafeBlank:unsafeBlank.length,missingAlt:missingAlt.length,brokenLabels,brokenControls,brokenLabelledBy,submitDefaultButtons:submitDefaultButtons.length};
 throw new Error('V275 HTML FINAL AUDIT failed: '+failed.join(', ')+' · '+JSON.stringify(detail));
}
console.log(`V275 HTML FINAL AUDIT PASS · ${checks.length}/${checks.length} gates · document/meta/assets/forms/ARIA/security semantics sealed · PROJECT LOCK untouched`);
