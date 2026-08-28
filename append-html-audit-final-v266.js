const fs=require('fs'),path=require('path');
const OUT=path.join(__dirname,'public');
const htmlPath=path.join(OUT,'index.html');
if(!fs.existsSync(htmlPath))throw new Error('V266 HTML FINAL AUDIT: public/index.html missing');
let html=fs.readFileSync(htmlPath,'utf8');

// Static drawer semantics should be correct before JavaScript boots.
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

const blankLinks=[...html.matchAll(/<a\b[^>]*\btarget=["']_blank["'][^>]*>/gi)].map(m=>m[0]);
const unsafeBlank=blankLinks.filter(tag=>!(/\brel=["'][^"']*\bnoopener\b[^"']*\bnoreferrer\b[^"']*["']/i.test(tag)||/\brel=["'][^"']*\bnoreferrer\b[^"']*\bnoopener\b[^"']*["']/i.test(tag)));
const images=[...html.matchAll(/<img\b[^>]*>/gi)].map(m=>m[0]);
const missingAlt=images.filter(tag=>!/\balt=["'][^"']*["']/i.test(tag));
const labels=[...html.matchAll(/<label\b[^>]*\bfor=["']([^"']+)["'][^>]*>/gi)].map(m=>m[1]);
const brokenLabels=labels.filter(id=>!idSet.has(id));
const controls=[...html.matchAll(/\baria-controls=["']([^"']+)["']/gi)].map(m=>m[1]);
const brokenControls=controls.filter(id=>!idSet.has(id));
const dialogs=[...html.matchAll(/<[^>]+\brole=["']dialog["'][^>]*>/gi)].map(m=>m[0]);
const brokenDialogs=dialogs.filter(tag=>{const m=tag.match(/\baria-labelledby=["']([^"']+)["']/i);return !m||!idSet.has(m[1]);});

const forms=[...html.matchAll(/<form\b[^>]*>[\s\S]*?<\/form>/gi)].map(m=>m[0]);
const submitDefaultButtons=[];
for(const form of forms){for(const m of form.matchAll(/<button\b([^>]*)>/gi)){if(!/\btype=["'](?:button|submit|reset)["']/i.test(m[1]))submitDefaultButtons.push(m[0]);}}

const viewport=html.match(/<meta\b[^>]*\bname=["']viewport["'][^>]*\bcontent=["']([^"']+)["'][^>]*>/i)?.[1]||'';
const app=fs.readFileSync(path.join(OUT,'js','app.js'),'utf8');
const checks=[
 ['doctype',/^\s*<!doctype html>/i.test(html)],
 ['language',/<html\b[^>]*\blang=["']id["']/i.test(html)],
 ['single charset',(html.match(/<meta\b[^>]*\bcharset=/gi)||[]).length===1],
 ['single viewport',(html.match(/<meta\b[^>]*\bname=["']viewport["']/gi)||[]).length===1],
 ['viewport cover',/viewport-fit=cover/i.test(viewport)],
 ['single main',(html.match(/<main\b/gi)||[]).length===1],
 ['unique ids',duplicateIds.length===0],
 ['unique script wiring',duplicateScripts.length===0],
 ['unique stylesheet wiring',duplicateStyles.length===0],
 ['safe target blank',unsafeBlank.length===0],
 ['images have alt',missingAlt.length===0],
 ['label targets exist',brokenLabels.length===0],
 ['aria-controls targets exist',brokenControls.length===0],
 ['dialogs labelled',brokenDialogs.length===0],
 ['form buttons explicit type',submitDefaultButtons.length===0],
 ['menu controls sidebar',/id=["']mobileMenuBtn["'][^>]*aria-controls=["']sidebar["']/i.test(html)||/aria-controls=["']sidebar["'][^>]*id=["']mobileMenuBtn["']/i.test(html)],
 ['overlay starts hidden',/id=["']sidebarOverlay["'][^>]*aria-hidden=["']true["']/i.test(html)||/aria-hidden=["']true["'][^>]*id=["']sidebarOverlay["']/i.test(html)],
 ['settings four themes',['light','dark','charcoal','oled'].every(t=>app.includes(`data-theme-choice=\"${t}\"`))],
 ['base accepts four themes',app.includes("['light','dark','charcoal','oled']")],
 ['drawer aria runtime sync',app.includes("overlay?.setAttribute('aria-hidden', 'false')")&&app.includes("overlay?.setAttribute('aria-hidden', 'true')")]
];
const failed=checks.filter(([,ok])=>!ok).map(([n])=>n);
if(failed.length){
  const detail={duplicateIds,duplicateScripts,duplicateStyles,unsafeBlank:unsafeBlank.length,missingAlt:missingAlt.length,brokenLabels,brokenControls,brokenDialogs:brokenDialogs.length,submitDefaultButtons:submitDefaultButtons.length};
  throw new Error('V266 HTML FINAL AUDIT failed: '+failed.join(', ')+' · '+JSON.stringify(detail));
}
console.log('V266 HTML FINAL AUDIT PASS — document/meta semantics valid; IDs/assets unique; forms/dialogs/labels safe; target=_blank hardened; drawer ARIA synced; Settings exposes all 4 themes');
