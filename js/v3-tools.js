(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const num = value => { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : 0; };
  const rp = value => `Rp${Math.round(num(value)).toLocaleString('id-ID')}`;
  const pct = (value, digits = 2) => `${num(value).toFixed(digits).replace('.', ',')}%`;
  const ratio = value => Number.isFinite(value) ? `${value.toFixed(2).replace('.', ',')}x` : '∞';
  const read = key => { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (_) { return null; } };
  const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {} document.dispatchEvent(new CustomEvent('arstore:workspace-update', { detail: { source: key } })); };
  const setText = (id, value) => { const el = $(id); if (el) el.textContent = value; };
  const setMessage = (id, text = '', type = '') => { const el = $(id); if (!el) return; el.textContent = text; el.className = `v3-form-message${type ? ` ${type}` : ''}`; };

  function initRoasTool({ prefix, storageKey, market, copyShopeeFee }) {
    const form = $(`${prefix}Form`); if (!form) return;
    const fields = { revenue: $(`${prefix}Revenue`), adSpend: $(`${prefix}AdSpend`), cogs: $(`${prefix}Cogs`), fee: $(`${prefix}MarketplaceFee`), other: $(`${prefix}OtherCost`), orders: $(`${prefix}Orders`), target: $(`${prefix}Target`) };
    const calculate = ({ silent = false } = {}) => {
      const result = window.ARSTORE_V3_CALCULATORS?.calculateRoas({ revenue: fields.revenue.value, adSpend: fields.adSpend.value, cogs: fields.cogs.value, marketplaceFee: fields.fee.value, otherCost: fields.other.value, orders: fields.orders.value, targetRoas: fields.target.value });
      if (!result?.ok) { if (!silent) setMessage(`${prefix}Message`, result?.error || 'Engine ROAS tidak tersedia.', 'error'); return null; }
      setText(`${prefix}Actual`, ratio(result.actualRoas)); setText(`${prefix}Bep`, ratio(result.bepRoas)); setText(`${prefix}Profit`, rp(result.profit)); setText(`${prefix}Margin`, pct(result.marginPercent)); setText(`${prefix}AdsBep`, rp(result.adsBreakEven)); setText(`${prefix}MaxCpa`, rp(result.maxCpa));
      const health = $(`${prefix}Health`); if (health) health.className = `v3-health ${result.healthClass}`;
      setText(`${prefix}HealthTitle`, result.status); setText(`${prefix}HealthText`, result.healthText);
      const payload = { ...result, market, updatedAt: new Date().toISOString() }; delete payload.ok; delete payload.error; write(storageKey, payload);
      if (!silent) setMessage(`${prefix}Message`, `Perhitungan ROAS ${market} selesai.`, 'success'); return payload;
    };
    form.addEventListener('submit', event => { event.preventDefault(); calculate(); });
    $(`${prefix}LoadProfit`)?.addEventListener('click', () => {
      const profit = read('arstore_v2_profit_result');
      if (!profit) return setMessage(`${prefix}Message`, 'Belum ada hasil Kalkulator Profit untuk dimuat.', 'error');
      fields.revenue.value = Math.max(0, num(profit.price)); fields.adSpend.value = Math.max(0, num(profit.ads)); fields.cogs.value = Math.max(0, num(profit.hpp)); fields.fee.value = copyShopeeFee ? Math.max(0, num(profit.marketplaceFee)) : 0; fields.other.value = Math.max(0, num(profit.packing) + num(profit.ops) + num(profit.extra)); fields.orders.value = 1;
      setMessage(`${prefix}Message`, copyShopeeFee ? 'Data Profit terakhir berhasil dimuat.' : `Data biaya dimuat. Fee ${market} tetap perlu diisi manual.`, 'success'); calculate({ silent: true });
    });
    const saved = read(storageKey);
    if (saved) { fields.revenue.value = num(saved.revenue); fields.adSpend.value = num(saved.adSpend); fields.cogs.value = num(saved.cogs); fields.fee.value = num(saved.marketplaceFee); fields.other.value = num(saved.otherCost); fields.orders.value = Math.max(1, num(saved.orders) || 1); fields.target.value = num(saved.targetRoas) || 3; calculate({ silent: true }); }
  }

  function initPriceTool({ prefix, storageKey, market, useShopeeFee }) {
    const form = $(`${prefix}Form`); if (!form) return;
    const fields = { hpp: $(`${prefix}Hpp`), packing: $(`${prefix}Packing`), ops: $(`${prefix}Ops`), ads: $(`${prefix}Ads`), extra: $(`${prefix}Extra`), feeRate: $(`${prefix}FeeRate`), fixedFee: $(`${prefix}FixedFee`), margin: $(`${prefix}TargetMargin`), profit: $(`${prefix}TargetProfit`) };
    let targetMode = 'margin';
    const setTargetMode = mode => {
      targetMode = mode === 'profit' ? 'profit' : 'margin';
      document.querySelectorAll(`[data-price-prefix="${prefix}"]`).forEach(button => button.classList.toggle('active', button.dataset.priceTarget === targetMode));
      if ($(`${prefix}MarginWrap`)) $(`${prefix}MarginWrap`).hidden = targetMode !== 'margin';
      if ($(`${prefix}ProfitWrap`)) $(`${prefix}ProfitWrap`).hidden = targetMode !== 'profit';
    };
    document.querySelector(`[data-target-selector="${prefix}"]`)?.addEventListener('click', event => { const button = event.target.closest('[data-price-target]'); if (button) setTargetMode(button.dataset.priceTarget); });
    const calculate = ({ silent = false } = {}) => {
      const result = window.ARSTORE_V3_CALCULATORS?.calculateSellingPrice({ hpp: fields.hpp.value, packing: fields.packing.value, ops: fields.ops.value, ads: fields.ads.value, extra: fields.extra.value, feeRatePercent: fields.feeRate.value, fixedFee: fields.fixedFee.value, targetMarginPercent: fields.margin.value, targetProfit: fields.profit.value, targetMode });
      if (!result?.ok) { if (!silent) setMessage(`${prefix}Message`, result?.error || 'Engine Harga Jual tidak tersedia.', 'error'); return null; }
      setText(`${prefix}Minimum`, rp(result.minimumPrice)); setText(`${prefix}Safe`, rp(result.safePrice)); setText(`${prefix}Ideal`, rp(result.idealPrice)); setText(`${prefix}Profit`, rp(result.profit)); setText(`${prefix}MarginResult`, pct(result.marginPercent));
      const health = $(`${prefix}Health`); if (health) health.className = `v3-health ${result.healthClass}`;
      setText(`${prefix}HealthTitle`, result.status); setText(`${prefix}HealthText`, result.healthText);
      const payload = { ...result, market, updatedAt: new Date().toISOString() }; delete payload.ok; delete payload.error; write(storageKey, payload);
      if (!silent) setMessage(`${prefix}Message`, `Rekomendasi harga jual ${market} selesai dihitung.`, 'success'); return payload;
    };
    form.addEventListener('submit', event => { event.preventDefault(); calculate(); });
    $(`${prefix}LoadWorkspace`)?.addEventListener('click', () => {
      const profit = read('arstore_v2_profit_result'), fee = read('arstore_v2_fee_result');
      if (!profit && !(useShopeeFee && fee)) return setMessage(`${prefix}Message`, 'Belum ada data workspace untuk dimuat.', 'error');
      if (profit) { fields.hpp.value = Math.max(0, num(profit.hpp)); fields.packing.value = Math.max(0, num(profit.packing)); fields.ops.value = Math.max(0, num(profit.ops)); fields.ads.value = Math.max(0, num(profit.ads)); fields.extra.value = Math.max(0, num(profit.extra)); if (num(profit.targetMargin) > 0) fields.margin.value = num(profit.targetMargin); }
      if (useShopeeFee && fee) {
        const fixed = Math.max(0, num(fee.fees?.processingFee)), sellingPrice = Math.max(0, num(fee.sellingPrice)), variableFee = Math.max(0, num(fee.totalMarketplaceFee) - fixed), variableRate = sellingPrice > 0 ? variableFee / sellingPrice * 100 : num(fee.effectiveFeePercent);
        fields.feeRate.value = variableRate.toFixed(2); fields.fixedFee.value = fixed;
      }
      setMessage(`${prefix}Message`, useShopeeFee ? 'Data Fee/Profit Shopee berhasil dimuat.' : `Data biaya dimuat. Fee ${market} tetap perlu diisi manual.`, 'success'); calculate({ silent: true });
    });
    const saved = read(storageKey);
    if (saved) { fields.hpp.value = num(saved.hpp); fields.packing.value = num(saved.packing); fields.ops.value = num(saved.ops); fields.ads.value = num(saved.ads); fields.extra.value = num(saved.extra); fields.fixedFee.value = num(saved.fixedFee); fields.feeRate.value = num(saved.feeRatePercent); fields.margin.value = num(saved.targetMarginPercent) || 20; fields.profit.value = num(saved.targetProfit) || 20000; setTargetMode(saved.targetMode); calculate({ silent: true }); }
  }

  function updateDashboard() {
    const profit = read('arstore_v2_profit_result'), research = read('arstore_v2_research_state');
    setText('v3LastProfit', profit ? rp(profit.profit) : '—'); setText('v3LastMargin', profit ? pct(profit.marginPercent) : '—');
    setText('v3LastProduct', research?.referenceProduct?.name || research?.keyword || '—');
  }

  function updateWorkflow() {
    const research = read('arstore_v2_research_state'), fee = read('arstore_v2_fee_result'), profit = read('arstore_v2_profit_result'), price = read('arstore_v3_selling_price_result'), roas = read('arstore_v3_roas_result'), decision = read('arstore_v3_decision_result');
    const states = [!!research?.referenceProduct, !!fee, !!profit, !!price, !!roas, !!decision], ids = ['sellerStep1Status','sellerStep2Status','sellerStep3Status','sellerStep4Status','sellerStep5Status','sellerStep6Status'];
    ids.forEach((id, index) => { const el = $(id); if (!el) return; el.textContent = states[index] ? 'Selesai' : 'Belum'; el.className = states[index] ? 'done' : ''; });
    const completed = states.filter(Boolean).length;
    setText('sellerWorkflowProgress', `${completed} / 6`);
    const routes = ['research','fee','profit','pricing','ads','decision'], captions = ['Mulai analisis produk','Lanjut hitung fee','Lanjut hitung profit','Lanjut tentukan harga','Lanjut simulasi iklan','Buat keputusan akhir','Workflow selesai'];
    const index = states.findIndex(value => !value); setText('sellerWorkflowCaption', captions[index < 0 ? 6 : index]);
    const button = $('sellerContinueBtn'); if (button) button.dataset.go = index < 0 ? 'decision' : routes[index];
    setText('step04Price', price ? rp(price.idealPrice) : '—'); setText('step04Min', price ? rp(price.minimumPrice) : '—'); setText('step04Margin', price ? pct(price.marginPercent) : '—');
    setText('step05Roas', roas ? ratio(roas.actualRoas) : '—'); setText('step05Bep', roas ? ratio(roas.bepRoas) : '—'); setText('step05Cpa', roas ? rp(roas.maxCpa) : '—');
  }

  function updateDecision() {
    const research = read('arstore_v2_research_state'), fee = read('arstore_v2_fee_result'), profit = read('arstore_v2_profit_result'), price = read('arstore_v3_selling_price_result'), roas = read('arstore_v3_roas_result');
    setText('decisionProduct', research?.referenceProduct?.name || '—'); setText('decisionMarket', research?.market ? `Market opportunity ${Math.round(num(research.market.marketOpportunityScore))}/100` : 'Belum dianalisis'); setText('decisionFee', fee ? pct(fee.effectiveFeePercent) : '—'); setText('decisionNet', fee?.netRevenue != null ? `Net ${rp(fee.netRevenue)}` : 'Belum dihitung'); setText('decisionProfit', profit ? rp(profit.profit) : '—'); setText('decisionMargin', profit ? `Margin ${pct(profit.marginPercent)}` : 'Belum dihitung'); setText('decisionPrice', price ? rp(price.idealPrice) : '—'); setText('decisionPriceMargin', price ? `Margin ${pct(price.marginPercent)}` : 'Belum dihitung'); setText('decisionRoas', roas ? ratio(roas.actualRoas) : '—'); setText('decisionRoasStatus', roas ? roas.status : 'Belum disimulasikan');
    const complete = !!research?.referenceProduct && !!fee && !!profit && !!price && !!roas;
    if (!complete) {
      const missing = [[!research?.referenceProduct,'Produk Trending'],[!fee,'Fee Engine'],[!profit,'Kalkulator Profit'],[!price,'Harga Jual Shopee'],[!roas,'ROAS Shopee']].filter(([miss]) => miss).map(([, name]) => name);
      setText('decisionStatus', 'Belum lengkap'); setText('decisionSummary', `Masih perlu: ${missing.join(', ')}.`); setText('decisionNextAction', `Selesaikan ${missing[0] || 'workflow'} terlebih dahulu.`); try { localStorage.removeItem('arstore_v3_decision_result'); } catch (_) {} return;
    }
    let score = 0; if (num(research.market?.marketOpportunityScore) >= 60) score++; if (num(fee.effectiveFeePercent) < 20) score++; if (num(profit.profit) > 0) score++; if (num(profit.marginPercent) >= 10) score++; if (num(price.marginPercent) >= 10) score++; if (num(roas.profit) >= 0 && (!Number.isFinite(roas.actualRoas) || num(roas.actualRoas) >= num(roas.bepRoas))) score++;
    let status, summary, next;
    if (score >= 5) { status = 'SEHAT / LAYAK'; summary = `Skor ${score}/6. Struktur produk, profit, harga, dan iklan relatif sehat.`; next = 'Lanjutkan dengan kontrol budget iklan dan pantau margin aktual.'; }
    else if (score >= 3) { status = 'REVIEW'; summary = `Skor ${score}/6. Masih ada area yang perlu diperbaiki.`; next = 'Review fee, harga target, margin, dan batas CPA sebelum scale.'; }
    else { status = 'RISIKO TINGGI'; summary = `Skor ${score}/6. Kombinasi biaya, margin, atau ROAS belum aman.`; next = 'Jangan scale dulu. Revisi struktur biaya atau harga lalu hitung ulang.'; }
    setText('decisionStatus', status); setText('decisionSummary', summary); setText('decisionNextAction', next);
    try { localStorage.setItem('arstore_v3_decision_result', JSON.stringify({ status, score, summary, nextAction: next, updatedAt: new Date().toISOString() })); } catch (_) {}
  }

  function refresh() { updateDashboard(); updateDecision(); updateWorkflow(); }

  initRoasTool({ prefix: 'shopeeRoas', storageKey: 'arstore_v3_roas_result', market: 'Shopee', copyShopeeFee: true });
  initPriceTool({ prefix: 'shopeePrice', storageKey: 'arstore_v3_selling_price_result', market: 'Shopee', useShopeeFee: true });
  initRoasTool({ prefix: 'tiktokRoas', storageKey: 'arstore_v3_tiktok_roas_result', market: 'TikTok', copyShopeeFee: false });
  initPriceTool({ prefix: 'tiktokPrice', storageKey: 'arstore_v3_tiktok_selling_price_result', market: 'TikTok', useShopeeFee: false });
  refresh();
  document.addEventListener('arstore:workspace-update', refresh);
  document.addEventListener('arstore:page-change', refresh);
})();
