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
if(!html.includes('js/ui-runtime-v34.js')){
  html=html.replace('</body>','  <script src="js/ui-runtime-v34.js"></script>\n</body>');
}
fs.writeFileSync(htmlPath,html);

const cssPatch=fs.readFileSync('ui-theme-patch.css','utf8');
if(!cssPatch.includes('V3.4 FINAL THEME + FORM CONSISTENCY PACK'))throw new Error('UI theme patch marker missing');
const polishPatch=fs.readFileSync('ui-polish-v34.css','utf8');
if(!polishPatch.includes('POST-DEPLOY POLISH PACK #14–#22'))throw new Error('UI polish patch marker missing');
fs.appendFileSync('public/css/app.css','\n'+cssPatch+'\n'+polishPatch+'\n');

console.log('V3.4 verified runtime built',xz.length,'bytes','money',patched,'zero-placeholder',zeroPatched,'forms',formPatched,'UI overlays active');
