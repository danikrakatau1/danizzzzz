(function(global){
"use strict";
const DB={rows:global.ARSTORE_SHOPEE_FEE_ROWS_2026||[]};
if(!DB.rows.length)throw new Error("Database fee Shopee belum dimuat.");
global.ARSTORE_SHOPEE_FEE_DB_2026=DB;
const norm=v=>String(v||"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").trim().toLowerCase().replace(/\s+/g," ");
const sellerKey=s=>["mall","shopee mall"].includes(norm(s))?"MALL":"REGULAR";
const decoded=DB.rows.map((r,i)=>({id:`fee-${i}`,sellerType:r[0],kategoriUtama:r[1],subKategori:r[2],productTypes:r[3]||[],jenisProduk:(r[3]||[]).join(", "),adminFeePercent:r[4],adminFeeLabel:r[5]}));
function getCategories(sellerType){const k=sellerKey(sellerType);return [...new Set(decoded.filter(r=>r.sellerType===k).map(r=>r.kategoriUtama))].sort((a,b)=>a.localeCompare(b,"id"));}
function getSubCategories(sellerType,kategoriUtama){const k=sellerKey(sellerType),c=norm(kategoriUtama);return [...new Set(decoded.filter(r=>r.sellerType===k&&norm(r.kategoriUtama)===c).map(r=>r.subKategori))].sort((a,b)=>a.localeCompare(b,"id"));}
function findRows(sellerType,kategoriUtama,subKategori){const k=sellerKey(sellerType),c=norm(kategoriUtama),s=norm(subKategori);return decoded.filter(r=>r.sellerType===k&&norm(r.kategoriUtama)===c&&norm(r.subKategori)===s);}
function lookupFee({sellerType,kategoriUtama,subKategori,jenisProduk=""}){const rows=findRows(sellerType,kategoriUtama,subKategori);if(!rows.length)return null;if(!jenisProduk)return rows.length===1?{...rows[0],matchType:"subcategory"}:{choices:rows,matchType:"multiple"};const q=norm(jenisProduk);let best=null,score=-1;for(const row of rows){for(const p of row.productTypes){const np=norm(p);let s=0;if(np===q)s=100;else if(np.includes(q)||q.includes(np))s=Math.min(np.length,q.length)+20;if(s>score){score=s;best=row;}}}return best?{...best,matchType:score>=100?"exact-product":"fuzzy-product",matchScore:score}:null;}
function search(query,sellerType){const q=norm(query),k=sellerType?sellerKey(sellerType):null;if(!q)return[];return decoded.filter(r=>(!k||r.sellerType===k)&&[r.kategoriUtama,r.subKategori,r.jenisProduk].some(v=>norm(v).includes(q)));}
global.ARSTORE_SHOPEE_FEE_LOOKUP={getSellerKey:sellerKey,getCategories,getSubCategories,findRows,lookupFee,search};
})(window);