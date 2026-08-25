(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ARSTORE_V3_CALCULATORS = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  const n = value => Number.isFinite(Number(value)) ? Number(value) : 0;

  function calculateRoas(input = {}) {
    const revenue = n(input.revenue), adSpend = n(input.adSpend), cogs = n(input.cogs), marketplaceFee = n(input.marketplaceFee), otherCost = n(input.otherCost);
    const orders = Math.max(1, Math.round(n(input.orders) || 1)), targetRoas = Math.max(0, n(input.targetRoas));
    if (revenue <= 0) return { ok: false, error: 'Omzet wajib lebih dari Rp0.' };
    if ([adSpend, cogs, marketplaceFee, otherCost].some(value => value < 0)) return { ok: false, error: 'Biaya tidak boleh bernilai negatif.' };
    const contributionBeforeAds = revenue - cogs - marketplaceFee - otherCost;
    const profit = contributionBeforeAds - adSpend;
    const actualRoas = adSpend > 0 ? revenue / adSpend : Infinity;
    const adsBreakEven = Math.max(0, contributionBeforeAds);
    const bepRoas = adsBreakEven > 0 ? revenue / adsBreakEven : Infinity;
    const marginPercent = revenue > 0 ? profit / revenue * 100 : 0;
    const maxCpa = adsBreakEven / orders;
    let healthClass = 'healthy', status = 'Sehat', healthText = 'ROAS berada di atas titik impas dan struktur iklan masih aman.';
    if (contributionBeforeAds <= 0) { healthClass = 'danger'; status = 'Rugi sebelum iklan'; healthText = 'HPP + fee + biaya lain sudah menghabiskan omzet sebelum ads.'; }
    else if (profit < 0) { healthClass = 'danger'; status = 'ROAS di bawah BEP'; healthText = 'Biaya iklan melewati batas break-even.'; }
    else if (Number.isFinite(actualRoas) && actualRoas < bepRoas) { healthClass = 'warning'; status = 'Rawan'; healthText = 'Actual ROAS masih di bawah ROAS BEP.'; }
    else if (targetRoas > 0 && Number.isFinite(actualRoas) && actualRoas < targetRoas) { healthClass = 'warning'; status = 'Belum capai target'; healthText = 'Profit masih positif, tetapi ROAS belum mencapai target.'; }
    return { ok: true, revenue, adSpend, cogs, marketplaceFee, otherCost, orders, targetRoas, contributionBeforeAds, profit, actualRoas, adsBreakEven, bepRoas, marginPercent, maxCpa, healthClass, status, healthText };
  }

  function calculateSellingPrice(input = {}) {
    const hpp = n(input.hpp), packing = n(input.packing), ops = n(input.ops), ads = n(input.ads), extra = n(input.extra), fixedFee = n(input.fixedFee);
    const feeRatePercent = n(input.feeRatePercent), targetMarginPercent = n(input.targetMarginPercent), targetProfit = n(input.targetProfit);
    const targetMode = input.targetMode === 'profit' ? 'profit' : 'margin';
    const costs = [hpp, packing, ops, ads, extra, fixedFee];
    if (hpp <= 0) return { ok: false, error: 'HPP wajib lebih dari Rp0.' };
    if (costs.some(value => value < 0) || feeRatePercent < 0 || feeRatePercent >= 95) return { ok: false, error: 'Periksa biaya dan fee. Fee harus di antara 0% sampai <95%.' };
    const feeRate = feeRatePercent / 100, baseCost = costs.reduce((a, b) => a + b, 0), minDen = 1 - feeRate;
    const minimumPrice = baseCost / minDen, safeDen = 1 - feeRate - 0.10, safePrice = safeDen > 0 ? baseCost / safeDen : minimumPrice * 1.15;
    let idealPrice;
    if (targetMode === 'profit') idealPrice = (baseCost + Math.max(0, targetProfit)) / minDen;
    else {
      const targetMargin = Math.max(0, targetMarginPercent) / 100, denominator = 1 - feeRate - targetMargin;
      if (denominator <= 0) return { ok: false, error: 'Target margin terlalu tinggi untuk fee yang dipilih.' };
      idealPrice = baseCost / denominator;
    }
    const profit = idealPrice * (1 - feeRate) - baseCost, marginPercent = idealPrice > 0 ? profit / idealPrice * 100 : 0;
    let healthClass = 'healthy', status = 'Harga sehat', healthText = 'Harga target menutup biaya dan memberi ruang profit sesuai target.';
    if (profit <= 0) { healthClass = 'danger'; status = 'Belum aman'; healthText = 'Harga target belum menghasilkan profit positif.'; }
    else if (marginPercent < 10) { healthClass = 'warning'; status = 'Margin tipis'; healthText = 'Profit positif, tetapi margin di bawah buffer aman 10%.'; }
    return { ok: true, hpp, packing, ops, ads, extra, fixedFee, feeRatePercent, targetMarginPercent, targetProfit, targetMode, baseCost, minimumPrice, safePrice, idealPrice, profit, marginPercent, healthClass, status, healthText };
  }

  return Object.freeze({ calculateRoas, calculateSellingPrice });
});
