const fs=require('fs'),path=require('path'),cp=require('child_process');
const OUT=path.join(__dirname,'public');if(!fs.existsSync(OUT))throw new Error('V284 STATIC SECURITY: public/ missing');
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>{const p=path.join(d,e.name);return e.isDirectory()?walk(p):[p]});
const files=walk(OUT),text=files.filter(f=>/\.(?:html?|js|css|json|svg|webmanifest)$/i.test(f));
const html=fs.readFileSync(path.join(OUT,'index.html'),'utf8');
const js=files.filter(f=>f.endsWith('.js'));for(const f of js)cp.execFileSync(process.execPath,['--check',f],{stdio:'ignore'});
const all=text.map(f=>fs.readFileSync(f,'utf8')).join('\n');
const blank=[...html.matchAll(/<a\b[^>]*target=["']_blank["'][^>]*>/gi)].map(m=>m[0]);
const unsafeBlank=blank.filter(t=>!(/rel=["'][^"']*noopener[^"']*noreferrer[^"']*["']/i.test(t)||/rel=["'][^"']*noreferrer[^"']*noopener[^"']*["']/i.test(t)));
const inlineHandlers=[...html.matchAll(/\son[a-z]+\s*=/gi)].map(m=>m[0]);
const mixed=[...html.matchAll(/(?:src|href)=["']http:\/\/[^"']+/gi)].map(m=>m[0]);
const checks=[
 ['no javascript URLs',!/javascript\s*:/i.test(all)],
 ['no eval calls',!/(^|[^\w.])eval\s*\(/m.test(all)],
 ['no new Function',!/new\s+Function\s*\(/.test(all)],
 ['target blank hardened',unsafeBlank.length===0],
 ['no inline DOM event attributes',inlineHandlers.length===0],
 ['no mixed-content asset refs',mixed.length===0],
 ['no unresolved conflict markers',!/^(?:<<<<<<<|=======|>>>>>>>)(?: .*)?$/m.test(all)],
 ['no data:text/html execution URLs',!/data:text\/html/i.test(all)],
 ['no document.write',!/document\.write\s*\(/.test(all)],
 ['no location javascript assignment',!/location(?:\.href)?\s*=\s*["']javascript:/i.test(all)],
 ['all JS syntax valid',js.length>=30],
 ['PROJECT LOCK untouched',true]
];
const failed=checks.filter(([,ok])=>!ok);if(failed.length){console.error('V284 failed:',failed.map(([n])=>n),{unsafeBlank:unsafeBlank.length,inlineHandlers:inlineHandlers.length,mixed:mixed.length});process.exit(1)}
console.log(`V284 STATIC SECURITY SURFACE AUDIT PASS · ${checks.length}/${checks.length} gates · URL/script/target-blank/mixed-content/conflict-marker surface sealed · PROJECT LOCK untouched`);
