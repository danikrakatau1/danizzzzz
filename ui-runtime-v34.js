(() => {
  'use strict';

  const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const draftDefaults = {
    shopeeRoasRevenue:'', shopeeRoasAdSpend:'', shopeeRoasCogs:'', shopeeRoasMarketplaceFee:'', shopeeRoasOtherCost:'',
    shopeeRoasOrders:'1', shopeeRoasTarget:'3',
    shopeePriceHpp:'', shopeePricePacking:'', shopeePriceOps:'', shopeePriceAds:'', shopeePriceExtra:'',
    shopeePriceFeeRate:'8.25', shopeePriceFixedFee:'1250', shopeePriceTargetMargin:'20', shopeePriceTargetProfit:'20000',
    tiktokRoasRevenue:'', tiktokRoasAdSpend:'', tiktokRoasCogs:'', tiktokRoasOtherCost:'',
    tiktokRoasOrders:'1', tiktokRoasItems:'1', tiktokRoasFixedFee:'', tiktokRoasTarget:'3',
    tiktokPriceHpp:'', tiktokPricePacking:'', tiktokPriceOps:'', tiktokPriceAds:'', tiktokPriceExtra:'',
    tiktokPriceFixedFee:'', tiktokPriceTargetMargin:'20', tiktokPriceTargetProfit:'20000',
    profitManualPrice:'', profitManualFee:'', profitManualNet:'', profitHpp:'', profitPacking:'', profitAds:'', profitOps:'', profitExtra:'',
    profitTargetNominal:'', profitTargetMargin:'', profitQty:'1', profitMinSafe:'10000', profitCpaBuffer:'20'
  };

  const zeroPlaceholderIds = new Set([
    'shopeePricePacking','shopeePriceOps','shopeePriceAds','shopeePriceExtra',
    'tiktokRoasFixedFee','tiktokPricePacking','tiktokPriceOps','tiktokPriceAds','tiktokPriceExtra','tiktokPriceFixedFee',
    'profitPacking','profitAds','profitOps','profitExtra'
  ]);

  const formsToDePersist = [
    'shopeeRoasForm','shopeePriceForm','tiktokRoasForm','tiktokPriceForm','profitForm'
  ];

  function resetDraftInputs() {
    formsToDePersist.forEach(id => {
      const form = document.getElementById(id);
      if (!form) return;
      form.setAttribute('autocomplete', 'off');
      form.querySelectorAll('input:not([type="checkbox"]):not([type="radio"]):not([type="range"]),select,textarea').forEach(control => {
        control.setAttribute('autocomplete', 'off');
      });
    });

    Object.entries(draftDefaults).forEach(([id, value]) => {
      const input = document.getElementById(id);
      if (!input || input.readOnly || input.disabled) return;
      input.value = value;
      if (zeroPlaceholderIds.has(id)) {
        input.value = '';
        input.placeholder = '0';
      }
    });
  }

  function wireZeroPlaceholderBehavior() {
    zeroPlaceholderIds.forEach(id => {
      const input = document.getElementById(id);
      if (!input) return;
      input.placeholder = input.placeholder || '0';
      input.addEventListener('focus', () => {
        if (input.value.trim() === '0') input.value = '';
      });
    });
  }

  const loadingConfigs = [
    {form:'shopeeRoasForm', result:'shopeeRoasResultCard', text:'Menghitung ROAS & titik BEP Shopee…'},
    {form:'shopeePriceForm', result:null, text:'Menyusun rekomendasi harga Shopee…'},
    {form:'tiktokRoasForm', result:'tiktokRoasResultCard', text:'Menghitung ROAS & fee TikTok…'},
    {form:'tiktokPriceForm', result:null, text:'Menyusun rekomendasi harga TikTok…'},
    {form:'feeForm', result:'feeResults', text:'Membaca Master Fee & struktur transaksi…'}
  ];

  function resolveResultCard(form, explicitId) {
    if (explicitId) return document.getElementById(explicitId);
    const layout = form.closest('.v3-calc-layout');
    return layout ? layout.querySelector('.v3-result-card') : null;
  }

  function ensureLoader(card) {
    let overlay = card.querySelector(':scope > .ui-calc-loader');
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.className = 'ui-calc-loader';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = '<div class="ui-calc-loader-core"><div class="ui-loader-logo"><img src="assets/arstore-emblem-transparent.png" alt="" aria-hidden="true"><span></span><i></i></div><strong>Memproses…</strong><small>ARSTORE sedang menyiapkan hasil.</small><div class="ui-loader-track"><b></b></div></div>';
    card.appendChild(overlay);
    return overlay;
  }

  function beginPremiumLoading(form, resultCard, label) {
    if (!resultCard || resultCard.dataset.uiLoading === '1') return;
    const overlay = ensureLoader(resultCard);
    const strong = overlay.querySelector('strong');
    const small = overlay.querySelector('small');
    if (strong) strong.textContent = 'Sedang menghitung…';
    if (small) small.textContent = label;

    resultCard.dataset.uiLoading = '1';
    resultCard.setAttribute('aria-busy', 'true');
    overlay.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => overlay.classList.add('is-visible'));

    const submit = form.querySelector('[type="submit"]');
    if (submit) {
      submit.classList.add('ui-is-calculating');
      submit.setAttribute('aria-busy', 'true');
    }

    const start = performance.now();
    const minimum = reducedMotion ? 360 : 820;
    window.setTimeout(() => {
      const elapsed = performance.now() - start;
      const wait = Math.max(0, minimum - elapsed);
      window.setTimeout(() => {
        overlay.classList.remove('is-visible');
        resultCard.classList.remove('ui-result-reveal');
        void resultCard.offsetWidth;
        resultCard.classList.add('ui-result-reveal');
        resultCard.setAttribute('aria-busy', 'false');
        delete resultCard.dataset.uiLoading;
        if (submit) {
          submit.classList.remove('ui-is-calculating');
          submit.setAttribute('aria-busy', 'false');
        }
        window.setTimeout(() => overlay.setAttribute('aria-hidden', 'true'), reducedMotion ? 10 : 240);
      }, wait);
    }, 0);
  }

  function wirePremiumLoading() {
    loadingConfigs.forEach(config => {
      const form = document.getElementById(config.form);
      if (!form) return;
      form.addEventListener('submit', () => {
        if (!form.checkValidity()) return;
        const resultCard = resolveResultCard(form, config.result);
        beginPremiumLoading(form, resultCard, config.text);
      }, true);
    });
  }

  function wireSidebarScroll() {
    const nav = document.querySelector('.sidebar-nav');
    if (!nav) return;

    nav.addEventListener('wheel', event => {
      if (nav.scrollHeight <= nav.clientHeight + 2) return;
      const delta = event.deltaY;
      const canUp = nav.scrollTop > 0;
      const canDown = nav.scrollTop + nav.clientHeight < nav.scrollHeight - 1;
      if ((delta < 0 && canUp) || (delta > 0 && canDown)) {
        event.preventDefault();
        nav.scrollTop += delta;
      }
    }, {passive:false});

    const reveal = element => {
      if (!element || nav.scrollHeight <= nav.clientHeight + 2) return;
      const nr = nav.getBoundingClientRect();
      const er = element.getBoundingClientRect();
      const pad = 18;
      let delta = 0;
      if (er.top < nr.top + pad) delta = er.top - nr.top - pad;
      else if (er.bottom > nr.bottom - pad) delta = er.bottom - nr.bottom + pad;
      if (delta) nav.scrollBy({top:delta, behavior:reducedMotion ? 'auto' : 'smooth'});
    };

    nav.addEventListener('click', event => {
      const item = event.target.closest('.nav-item,.nav-subitem');
      if (!item) return;
      window.setTimeout(() => reveal(item), 320);
    });

    const observer = new MutationObserver(records => {
      records.forEach(record => {
        if (record.type === 'attributes' && record.attributeName === 'aria-expanded' && record.target.getAttribute('aria-expanded') === 'true') {
          window.setTimeout(() => reveal(record.target), 320);
        }
      });
    });
    nav.querySelectorAll('[aria-expanded]').forEach(el => observer.observe(el, {attributes:true, attributeFilter:['aria-expanded']}));
  }

  function wirePageMotion() {
    const pages = document.querySelectorAll('.page');
    if (!pages.length || reducedMotion) return;
    const observer = new MutationObserver(records => {
      records.forEach(record => {
        const page = record.target;
        if (!page.classList.contains('active')) return;
        page.classList.remove('ui-page-enter');
        void page.offsetWidth;
        page.classList.add('ui-page-enter');
      });
    });
    pages.forEach(page => observer.observe(page, {attributes:true, attributeFilter:['class']}));
  }

  function init() {
    resetDraftInputs();
    wireZeroPlaceholderBehavior();
    wirePremiumLoading();
    wireSidebarScroll();
    wirePageMotion();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();

  window.addEventListener('pageshow', event => {
    if (event.persisted || performance.getEntriesByType('navigation')[0]?.type === 'reload') {
      window.setTimeout(resetDraftInputs, 0);
    }
  });
})();
