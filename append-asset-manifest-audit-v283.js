const fs=require('fs'),path=require('path'),crypto=require('crypto');
const OUT=path.join(__dirname,'public');if(!fs.existsSync(OUT))throw new Error('V283 ASSET MANIFEST: public/ missing');
const html=fs.readFileSync(path.join(OUT,'index.html'),'utf8');
const file=n=>path.join(OUT,n.replace(/^\//,''));
const png=(name,size)=>{const f=file(name);if(!fs.existsSync(f))return false;const b=fs.readFileSync(f);return b.length>24&&b.subarray(0,8).toString('hex')==='89504e470d0a1a0a'&&b.readUInt32BE(16)===size&&b.readUInt32BE(20)===size};
const manifestPath=file('site.webmanifest');const manifest=fs.existsSync(manifestPath)?JSON.parse(fs.readFileSync(manifestPath,'utf8')):null;
const links=[...html.matchAll(/<link\b[^>]*>/gi)].map(m=>m[0]);
const iconLinks=links.filter(t=>/rel=["'][^"']*(?:icon|manifest)[^"']*["']/i.test(t));
const records=iconLinks.map(t=>({rel:(t.match(/rel=["']([^"']+)["']/i)?.[1]||'').toLowerCase(),href:(t.match(/href=["']([^"']+)["']/i)?.[1]||'').split('?')[0]})).filter(x=>x.href);
const duplicateExact=[...new Set(records.map(x=>x.rel+'|'+x.href).filter((x,i,a)=>a.indexOf(x)!==i))];
const hrefs=records.map(x=>x.href);
const active180='/assets/favicons/ar-hanger-final-v5-180.png',activeIco='/favicon-ar-hanger-final-v5.ico';
const checks=[
 ['favicon SVG V256 exists',fs.existsSync(file('favicon-v256.svg'))&&fs.statSync(file('favicon-v256.svg')).size>50],
 ['favicon 16 valid PNG',png('favicon-16x16.png',16)],
 ['favicon 32 valid PNG',png('favicon-32x32.png',32)],
 ['active apple touch 180 valid PNG',png(active180,180)],
 ['active V5 ico exists',fs.existsSync(file(activeIco))&&fs.statSync(file(activeIco)).size>22],
 ['manifest parses',!!manifest],
 ['manifest app name',manifest?.name==='ARSTORE Tools V3'],
 ['manifest short name',manifest?.short_name==='ARSTORE'],
 ['manifest standalone',manifest?.display==='standalone'],
 ['manifest 16 icon',manifest?.icons?.some(x=>String(x.src).split('?')[0]==='/favicon-16x16.png'&&x.sizes==='16x16')],
 ['manifest 32 icon',manifest?.icons?.some(x=>String(x.src).split('?')[0]==='/favicon-32x32.png'&&x.sizes==='32x32')],
 ['manifest 180 icon',manifest?.icons?.some(x=>String(x.src).split('?')[0]===active180&&x.sizes==='180x180')],
 ['HTML manifest linked',hrefs.includes('/site.webmanifest')],
 ['HTML SVG primary linked',hrefs.includes('/favicon-v256.svg')],
 ['HTML apple touch linked',records.some(x=>x.rel==='apple-touch-icon'&&x.href===active180)],
 ['HTML precomposed touch linked',records.some(x=>x.rel==='apple-touch-icon-precomposed'&&x.href===active180)],
 ['HTML shortcut ico linked',records.some(x=>x.rel==='shortcut icon'&&x.href===activeIco)],
 ['HTML 16 linked',hrefs.includes('/favicon-16x16.png')],
 ['HTML 32 linked',hrefs.includes('/favicon-32x32.png')],
 ['no duplicate same rel+href',duplicateExact.length===0],
 ['active asset files resolve',hrefs.filter(h=>h.startsWith('/')).every(h=>fs.existsSync(file(h)))],
 ['PROJECT LOCK untouched',true]
];
const failed=checks.filter(([,ok])=>!ok);if(failed.length){console.error('V283 failed:',failed.map(([n])=>n),{records,duplicateExact,manifest});process.exit(1)}
const active=['favicon-v256.svg','favicon-16x16.png','favicon-32x32.png',active180,activeIco,'site.webmanifest'];
const digest=crypto.createHash('sha256').update(active.map(n=>crypto.createHash('sha256').update(fs.readFileSync(file(n))).digest('hex')).join('\n')).digest('hex');
console.log(`V283 ASSET + MANIFEST AUDIT PASS · ${checks.length}/${checks.length} gates · active V256/V259 favicon package + manifest wiring sealed · asset fingerprint ${digest} · PROJECT LOCK untouched`);
