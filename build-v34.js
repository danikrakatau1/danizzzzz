const fs=require('fs');const path=require('path');const crypto=require('crypto');const cp=require('child_process');
const P='.deploy-v34/';
const parts=['p00','p01','p02','p03','p04','p05','p06-00','p06-01','p06-02','p06-03','p06-04','p06-05','p06-06','p06-07','p07-00','p07-01','p07-02','p07-03','p07-04','p07-05','p07-06','p07-07','p08-00','p08-01','p08-02','p08-03','p08-04','p08-05','p08-06'];
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const b64=parts.map(n=>fs.readFileSync(P+n,'utf8')).join('');
if(b64.length!==176360)throw new Error('payload length '+b64.length);
if(sha(b64)!=='9c061331efaf8606efd6b8bcf1ddf07d1ab2b30571c388b87876e1e69c5fbd7c')throw new Error('payload text checksum');
const xz=Buffer.from(b64,'base64');
if(xz.length!==132268)throw new Error('payload binary length '+xz.length);
if(sha(xz)!=='2072eb660217d69c81738c4351ed6f8f7cead2ff7449ce5096584546296afa3d')throw new Error('payload binary checksum');
fs.writeFileSync('payload-v34.tar.xz',xz);cp.execFileSync('xz',['-t','payload-v34.tar.xz'],{stdio:'inherit'});
fs.rmSync('public',{recursive:true,force:true});fs.mkdirSync('public',{recursive:true});cp.execFileSync('tar',['-xJf','payload-v34.tar.xz','-C','public'],{stdio:'inherit'});
const src='assets/arstore-emblem-transparent.png',dst='public/assets/arstore-emblem-transparent.png';fs.mkdirSync(path.dirname(dst),{recursive:true});fs.copyFileSync(src,dst);
if(sha(fs.readFileSync(dst))!=='3ecfcfe7a95283c15669f0aeed013d3990b1d0a1bc9172773566b486f0d2488d')throw new Error('emblem checksum');

// V3.4 UI overlays only. Master fee/formula/DB payload stays byte-identical above.
const htmlPath='public/index.html';
let html=fs.readFileSync(htmlPath,'utf8');

// Free-form Rupiah input: do not force multiples of Rp100/Rp1.000.
const moneyIds=[
  'shopeeRoasRevenue','shopeeRoasAdSpend','shopeeRoasCogs','shopeeRoasMarketplaceFee','shopeeRoasOtherCost',
  'shopeePriceHpp','shopeePricePacking','shopeePriceOps','shopeePriceAds','shopeePriceExtra','shopeePriceFixedFee','shopeePriceTargetProfit',
  'tiktokRoasRevenue','tiktokRoasAdSpend','tiktokRoasCogs','tiktokRoasOtherCost','tiktokRoasFixedFee',
  'tiktokPriceHpp','tiktokPricePacking','tiktokPriceOps','tiktokPriceAds','tiktokPriceExtra','tiktokPriceFixedFee','tiktokPriceTargetProfit',
  'filterPriceMin','filterPriceMax'
];
let patched=0;
for(const id of moneyIds){
  const re=new RegExp('(<input\\s+id="'+id+'"[^>]*\\bstep=")(?:1000|100)("[^>]*>)','g');
  html=html.replace(re,(m,a,b)=>{patched++;return a+'1'+b;});
}
if(patched!==moneyIds.length)throw new Error('UI money step patch count '+patched+' / '+moneyIds.length);

// Optional money defaults show 0 as a placeholder, not as editable content.
const zeroPlaceholderIds=[
  'shopeePricePacking','shopeePriceOps','shopeePriceAds','shopeePriceExtra',
  'tiktokRoasFixedFee','tiktokPricePacking','tiktokPriceOps','tiktokPriceAds','tiktokPriceExtra','tiktokPriceFixedFee',
  'feeVoucherSeller','feeProcessingManual',
  'profitPacking','profitAds','profitOps','profitExtra'
];
let zeroPatched=0;
for(const id of zeroPlaceholderIds){
  const re=new RegExp('<input\\b[^>]*\\bid="'+id+'"[^>]*>');
  html=html.replace(re,tag=>{
    zeroPatched++;
    let next=tag.replace(/\svalue="0"/,'');
    if(!/\splaceholder=/.test(next))next=next.replace(/>$/,' placeholder="0">');
    return next;
  });
}
if(zeroPatched!==zeroPlaceholderIds.length)throw new Error('UI zero placeholder patch count '+zeroPatched+' / '+zeroPlaceholderIds.length);

// Reduce native browser form restoration for calculator drafts.
const draftFormIds=['shopeeRoasForm','shopeePriceForm','tiktokRoasForm','tiktokPriceForm','feeForm','profitForm'];
let formPatched=0;
for(const id of draftFormIds){
  const re=new RegExp('<form\\b[^>]*\\bid="'+id+'"[^>]*>');
  html=html.replace(re,tag=>{
    formPatched++;
    return /\sautocomplete=/.test(tag)?tag:tag.replace(/>$/,' autocomplete="off">');
  });
}
if(formPatched!==draftFormIds.length)throw new Error('UI form persistence patch count '+formPatched+' / '+draftFormIds.length);

// Runtime-only UI behavior: reset calculator drafts, premium loaders, sidebar scroll, motion.
const runtimeSrc='ui-runtime-v34.js';
const runtimeDst='public/js/ui-runtime-v34.js';
cp.execFileSync(process.execPath,['--check',runtimeSrc],{stdio:'inherit'});
fs.mkdirSync(path.dirname(runtimeDst),{recursive:true});
fs.copyFileSync(runtimeSrc,runtimeDst);
if(!html.includes('js/ui-runtime-v34.js')) html=html.replace('</body>','  <script src="js/ui-runtime-v34.js"></script>\n</body>');

// #34/#35 — user-provided AR favicon + Shopee/TikTok sidebar icons.
const finalAssets=require('./ui-final-assets-v34.js');
const read64=file=>fs.readFileSync(file,'utf8').trim();
const favicon512=[0,1,2,3,4,5].map(i=>read64('assets-final/favicon-512-v34.part'+i)).join('');
const assetMap={
  'public/assets/shopee-nav-icon.png':{data:finalAssets.shopee,size:96},
  'public/assets/tiktok-nav-icon.png':{data:finalAssets.tiktok,size:96},
  'public/assets/favicons/favicon-16x16.png':{data:read64('assets-final/favicon-16-v34.b64'),size:16},
  'public/assets/favicons/favicon-32x32.png':{data:read64('assets-final/favicon-32-v34.b64'),size:32},
  'public/assets/favicons/favicon-48x48.png':{data:finalAssets.favicon48,size:48},
  'public/assets/favicons/favicon-180x180.png':{data:read64('assets-final/favicon-180-v34.b64'),size:180},
  'public/assets/favicons/favicon-192x192.png':{data:read64('assets-final/favicon-192-v34.b64'),size:192},
  'public/assets/favicons/favicon-512x512.png':{data:favicon512,size:512}
};
let verifiedFavicons=0;
for(const [file,item] of Object.entries(assetMap)){
  if(!item.data||item.data.length<100)throw new Error('final UI asset missing '+file);
  const bin=Buffer.from(item.data,'base64');
  if(bin.length<24||bin.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw new Error('final UI asset PNG signature '+file);
  const width=bin.readUInt32BE(16),height=bin.readUInt32BE(20);
  if(width!==item.size||height!==item.size)throw new Error('final UI asset dimensions '+file+' '+width+'x'+height+' expected '+item.size);
  if(file.includes('/favicons/'))verifiedFavicons++;
  fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,bin);
}
html=html.replace('href="/assets/favicons/favicon.ico" sizes="any"','href="/assets/favicons/favicon-48x48.png" sizes="48x48"');
let marketIconPatched=0;
html=html.replace('<span class="nav-subdot"></span><span>Shopee</span><span class="nav-chevron"',()=>{marketIconPatched++;return '<img class="market-brand-icon" data-market-icon="shopee" src="assets/shopee-nav-icon.png" alt="" aria-hidden="true"><span>Shopee</span><span class="nav-chevron"';});
html=html.replace('<span class="nav-subdot"></span><span>TikTok</span><span class="nav-chevron"',()=>{marketIconPatched++;return '<img class="market-brand-icon" data-market-icon="tiktok" src="assets/tiktok-nav-icon.png" alt="" aria-hidden="true"><span>TikTok</span><span class="nav-chevron"';});
if(marketIconPatched!==2)throw new Error('market icon patch count '+marketIconPatched);

// #32/#33 — third Charcoal theme + persistence support. Patch UI shell only.
if(!html.includes('data-theme-choice="charcoal"')){
  html=html.replace('<button type="button" data-theme-choice="light">Terang</button>','<button type="button" data-theme-choice="light">Terang</button>\n              <button type="button" data-theme-choice="charcoal">Charcoal</button>');
}
html=html.replace('Pilih tema gelap atau terang. Preferensi tersimpan di browser.','Pilih tema gelap, terang, atau charcoal. Preferensi tersimpan di browser.');
const shellPath='public/js/v3-shell.js';
let shell=fs.readFileSync(shellPath,'utf8');
let themeLogicPatched=0;
shell=shell.replace("const next = theme === 'light' ? 'light' : 'dark';",()=>{themeLogicPatched++;return "const next = (theme === 'light' || theme === 'charcoal') ? theme : 'dark';";});
shell=shell.replace("metaTheme?.setAttribute('content', next === 'light' ? '#f4f6fb' : '#080b12');",()=>{themeLogicPatched++;return "metaTheme?.setAttribute('content', next === 'light' ? '#edf1f6' : next === 'charcoal' ? '#101114' : '#080b12');";});
if(themeLogicPatched!==2)throw new Error('charcoal theme logic patch '+themeLogicPatched);
fs.writeFileSync(shellPath,shell);
cp.execFileSync(process.execPath,['--check',shellPath],{stdio:'inherit'});

// #23–#36 — final visual runtime + theme/HD/semantic/skeleton layer.
const finalRuntimeSrc='ui-final-runtime-v34.js';
const finalRuntimeDst='public/js/ui-final-runtime-v34.js';
cp.execFileSync(process.execPath,['--check',finalRuntimeSrc],{stdio:'inherit'});
fs.copyFileSync(finalRuntimeSrc,finalRuntimeDst);
if(!html.includes('js/ui-final-runtime-v34.js')) html=html.replace('</body>','  <script src="js/ui-final-runtime-v34.js"></script>\n</body>');
fs.writeFileSync(htmlPath,html);

const cssPatch=fs.readFileSync('ui-theme-patch.css','utf8');
if(!cssPatch.includes('V3.4 FINAL THEME + FORM CONSISTENCY PACK'))throw new Error('UI theme patch marker missing');
const polishPatch=fs.readFileSync('ui-polish-v34.css','utf8');
if(!polishPatch.includes('POST-DEPLOY POLISH PACK #14–#22'))throw new Error('UI polish patch marker missing');
const finalSweep=fs.readFileSync('ui-final-sweep-v34.css','utf8');
if(!finalSweep.includes('FINAL SWEEP #23–#36'))throw new Error('final sweep marker missing');
fs.appendFileSync('public/css/app.css','\n'+cssPatch+'\n'+polishPatch+'\n'+finalSweep+'\n');

console.log('V3.4 verified runtime built',xz.length,'bytes','money',patched,'zero-placeholder',zeroPatched,'forms',formPatched,'market-icons',marketIconPatched,'theme-patches',themeLogicPatched,'favicons',verifiedFavicons,'FINAL #23-36 active');
