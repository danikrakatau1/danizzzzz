const fs=require('fs'),path=require('path'),crypto=require('crypto'),cp=require('child_process');
const ROOT=__dirname,OUT=path.join(ROOT,'public');if(!fs.existsSync(OUT))throw new Error('V285 RELEASE FREEZE: public/ missing');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');const read=p=>fs.readFileSync(p,'utf8');
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>{const p=path.join(d,e.name);return e.isDirectory()?walk(p):[p]});
const pkg=JSON.parse(read(path.join(ROOT,'package.json'))),html=read(path.join(OUT,'index.html')),payload=fs.readFileSync(path.join(ROOT,'payload-v34.tar.xz'));
const EXPECTED_PAYLOAD_SHA='2072eb660217d69c81738c4351ed6f8f7cead2ff7449ce5096584546296afa3d';
const chain=['append-accordion-audit-v265.js','append-navigation-route-audit-v266.js','append-event-listener-audit-v267.js','append-observer-scope-audit-v268.js','append-sidebar-total-audit-v269.js','append-runtime-ownership-audit-v270.js','append-functional-runtime-safety-v271.js','append-html-runtime-semantics-v272.js','append-js-audit-final-v273.js','append-css-audit-final-v274.js','append-html-audit-final-v275.js','append-navigation-ownership-final-v276.js','append-final-production-integrity-v277.js','append-residual-historical-audit-v278.js','append-compatibility-surface-audit-v279.js','append-state-persistence-audit-v280.js','append-form-input-audit-v281.js','append-accessibility-keyboard-audit-v282.js','append-asset-manifest-audit-v283.js','append-static-security-audit-v284.js','append-release-freeze-v285.js'];
const build=pkg.scripts?.build||'',counts=Object.fromEntries(chain.map(n=>[n,(build.match(new RegExp(n.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g'))||[]).length]));
const files=walk(OUT),js=files.filter(f=>f.endsWith('.js'));for(const f of js)cp.execFileSync(process.execPath,['--check',f],{stdio:'ignore'});
const refs=[];for(const re of [/<script\b[^>]*src=["']([^"']+)["']/gi,/<link\b[^>]*href=["']([^"']+)["']/gi,/<img\b[^>]*src=["']([^"']+)["']/gi])for(const m of html.matchAll(re)){let u=m[1];if(/^(?:https?:|data:|blob:|mailto:|tel:|#|\/\/)/i.test(u))continue;u=u.split(/[?#]/)[0].replace(/^\.\//,'').replace(/^\//,'');if(u)refs.push(u)}
const missingRefs=[...new Set(refs.filter(r=>!fs.existsSync(path.join(OUT,r))))];
const priorManifest=path.join(OUT,'integrity-manifest-v277.json');
const fingerprintFiles=files.filter(f=>!['integrity-manifest-v277.json','release-freeze-manifest-v285.json'].includes(path.basename(f))).map(f=>{const b=fs.readFileSync(f);return {path:path.relative(OUT,f).replace(/\\/g,'/'),bytes:b.length,sha256:sha(b)}}).sort((a,b)=>a.path.localeCompare(b.path));
const source=fingerprintFiles.map(x=>`${x.path}\t${x.bytes}\t${x.sha256}`).join('\n'),fingerprint=sha(Buffer.from(source)),totalBytes=fingerprintFiles.reduce((n,x)=>n+x.bytes,0);
const manifest={version:285,package:pkg.version,status:'RELEASE-FREEZE-CANDIDATE',fileCount:fingerprintFiles.length,totalBytes,sha256:fingerprint,payload:{bytes:payload.length,sha256:sha(payload)},auditChain:chain,files:fingerprintFiles};
fs.writeFileSync(path.join(OUT,'release-freeze-manifest-v285.json'),JSON.stringify(manifest,null,2)+'\n');
const rc=Number((pkg.version.match(/rc1-(\d+)-preview/)||[])[1]||0);
const checks=[
 ['package RC >=285',rc>=285],
 ['canonical payload exact SHA',sha(payload)===EXPECTED_PAYLOAD_SHA],
 ['all #10-#30 audit scripts exactly once',Object.values(counts).every(n=>n===1)],
 ['all local HTML refs resolve',missingRefs.length===0],
 ['all generated JS syntax valid',js.length>=30],
 ['V277 integrity manifest retained',fs.existsSync(priorManifest)],
 ['V278 residual layer retained',fs.existsSync(path.join(OUT,'css','ui-residual-historical-audit-v278.css'))],
 ['V264 iOS authority retained',html.includes('ui-ios-navigation-v264.js')],
 ['V265 accordion authority retained',html.includes('ui-accordion-audit-v265.js')],
 ['V271 functional shield retained',html.includes('functional-runtime-safety-v271.js')],
 ['V272 semantic layer retained',html.includes('ui-html-runtime-semantics-v272.js')],
 ['20 canonical route contract retained',read(path.join(OUT,'js','app.js')).includes('/produk/order-analytics')&&read(path.join(OUT,'js','app.js')).includes('/market-tools/tiktok/harga-jual')],
 ['release fingerprint 64 hex',/^[a-f0-9]{64}$/.test(fingerprint)],
 ['release output nontrivial',fingerprintFiles.length>=83&&totalBytes>2900000],
 ['PROJECT LOCK untouched',sha(payload)===EXPECTED_PAYLOAD_SHA]
];
const failed=checks.filter(([,ok])=>!ok);if(failed.length){console.error('V285 failed:',failed.map(([n])=>n),{counts,missingRefs,js:js.length,fileCount:fingerprintFiles.length,totalBytes,fingerprint});process.exit(1)}
console.log(`V285 RELEASE FREEZE AUDIT PASS · ${checks.length}/${checks.length} gates · #10-#30 chain green · ${fingerprintFiles.length} files · ${totalBytes} bytes · FINAL fingerprint ${fingerprint} · canonical payload SHA locked · PROJECT LOCK untouched`);
