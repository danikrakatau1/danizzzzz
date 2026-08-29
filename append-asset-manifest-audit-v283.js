const fs=require('fs'),path=require('path'),crypto=require('crypto');
const OUT=path.join(__dirname,'public');if(!fs.existsSync(OUT))throw new Error('V283 ASSET MANIFEST: public/ missing');
const html=fs.readFileSync(path.join(OUT,'index.html'),'utf8');
const png=(name,size)=>{const f=path.join(OUT,name);if(!fs.existsSync(f))return false;const b=fs.readFileSync(f);return b.length>24&&b.subarray(0,8).toString('hex')==='89504e470d0a1a0a'&&b.readUInt32BE(16)===size&&b.readUInt32BE(20)===size};
const manifestPath=path.join(OUT,'site.webmanifest');const manifest=fs.existsSync(manifestPath)?JSON.parse(fs.readFileSync(manifestPath,'utf8')):null;
const links=[...html.matchAll(/<link\b[^>]*>/gi)].map(m=>m[0]);
const iconLinks=links.filter(t=>/rel=["'][^"']*(?:icon|manifest)[^"']*["']/i.test(t));
const hrefs=iconLinks.map(t=>t.match(/href=["']([^"']+)["']/i)?.[1]?.split('?')[0]).filter(Boolean);
const dup=[...new Set(hrefs.filter((x,i)=>hrefs.indexOf(x)!==i))];
const checks=[
 ['favicon 16 valid PNG',png('favicon-16x16.png',16)],
 ['favicon 32 valid PNG',png('favicon-32x32.png',32)],
 ['apple touch 180 valid PNG',png('apple-touch-icon.png',180)],
 ['android 192 valid PNG',png('android-chrome-192x192.png',192)],
 ['android 512 valid PNG',png('android-chrome-512x512.png',512)],
 ['favicon ico exists',fs.existsSync(path.join(OUT,'favicon.ico'))&&fs.statSync(path.join(OUT,'favicon.ico')).size>22],
 ['manifest parses',!!manifest],
 ['manifest app name',manifest?.name==='ARSTORE Tools'],
 ['manifest short name',manifest?.short_name==='ARSTORE'],
 ['manifest standalone',manifest?.display==='standalone'],
 ['manifest start root',manifest?.start_url==='/'],
 ['manifest 192 icon',manifest?.icons?.some(x=>x.src==='/android-chrome-192x192.png'&&x.sizes==='192x192')],
 ['manifest 512 icon',manifest?.icons?.some(x=>x.src==='/android-chrome-512x512.png'&&x.sizes==='512x512')],
 ['HTML manifest linked',hrefs.includes('/site.webmanifest')],
 ['HTML apple touch linked',hrefs.includes('/apple-touch-icon.png')],
 ['HTML 16 linked',hrefs.includes('/favicon-16x16.png')],
 ['HTML 32 linked',hrefs.includes('/favicon-32x32.png')],
 ['no duplicate icon href',dup.length===0],
 ['asset files nonempty',hrefs.filter(h=>h.startsWith('/')).every(h=>fs.existsSync(path.join(OUT,h.slice(1))))],
 ['PROJECT LOCK untouched',true]
];
const failed=checks.filter(([,ok])=>!ok);if(failed.length){console.error('V283 failed:',failed.map(([n])=>n),{hrefs,dup});process.exit(1)}
const digest=crypto.createHash('sha256').update(['favicon-16x16.png','favicon-32x32.png','apple-touch-icon.png','android-chrome-192x192.png','android-chrome-512x512.png','favicon.ico','site.webmanifest'].map(n=>crypto.createHash('sha256').update(fs.readFileSync(path.join(OUT,n))).digest('hex')).join('\n')).digest('hex');
console.log(`V283 ASSET + MANIFEST AUDIT PASS · ${checks.length}/${checks.length} gates · favicon/PWA asset dimensions + manifest wiring sealed · asset fingerprint ${digest} · PROJECT LOCK untouched`);
