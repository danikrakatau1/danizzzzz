(function(global){
"use strict";
const rupiah=v=>Math.round(Number(v||0));
const pct=(base,rate)=>rupiah(Number(base||0)*Number(rate||0)/100);
function feeBase({hargaJual=0,voucherSeller=0}){return Math.max(0,rupiah(hargaJual)-rupiah(voucherSeller));}
function calculate(input){
  const base=feeBase(input);
  const adminRate=Number(input.adminRatePercent||0),goRate=Number(input.gratisOngkirRatePercent||0),promoRate=Number(input.promoRatePercent||0);
  const adminFee=pct(base,adminRate),gratisOngkirFee=pct(base,goRate),promoFee=pct(base,promoRate);
  const processingFee=rupiah(input.processingFee||0);
  const actualAmsFee=input.actualAmsFee===undefined||input.actualAmsFee===null||input.actualAmsFee===""?null:rupiah(input.actualAmsFee);
  const knownNonAmsFee=adminFee+gratisOngkirFee+promoFee+processingFee;
  const actualNetRevenue=input.actualNetRevenue===undefined||input.actualNetRevenue===null||input.actualNetRevenue===""?null:rupiah(input.actualNetRevenue);
  let amsFee=actualAmsFee,amsSource=actualAmsFee!==null?"actual-fee":"unknown";
  if(amsFee===null&&actualNetRevenue!==null){amsFee=rupiah(base-knownNonAmsFee-actualNetRevenue);amsSource="reverse-from-actual-net";}
  const totalFee=amsFee===null?knownNonAmsFee:knownNonAmsFee+amsFee;
  const netRevenue=amsFee===null?null:rupiah(base-totalFee);
  const expectedFromActual=actualNetRevenue===null?null:actualNetRevenue;
  const delta=expectedFromActual===null||netRevenue===null?null:rupiah(netRevenue-expectedFromActual);
  return {valid:base>=0,base,fees:{adminFee,gratisOngkirFee,promoFee,processingFee,amsFee},rates:{adminRatePercent:adminRate,gratisOngkirRatePercent:goRate,promoRatePercent:promoRate,amsRatePercent:Number(input.amsRatePercent||0)},ams:{enabled:Number(input.amsRatePercent||0)>0||amsFee!==null,source:amsSource,note:amsFee===null?"AMS rate diketahui, tetapi nominal tidak dihitung tanpa eligible base/nominal aktual/total penghasilan aktual.":"Nominal AMS menggunakan data aktual atau reverse-check dari penghasilan aktual."},totalFee,netRevenue,actualNetRevenue,delta,matched:delta===0};
}
global.ARSTORE_STEP02_FEE_ENGINE={calculate,feeBase};
})(window);