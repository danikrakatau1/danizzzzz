(() => {
  'use strict';

  /* V3.4 IOS SWIPE-BACK CANONICAL HISTORY FIX
     Navigation/history layer only. No fee, DB, GOX, profit, ROAS or decision logic. */
  const ROUTES = Object.freeze({
    dashboard: '/',
    'seller-tools': '/seller-tools',
    research: '/seller-tools/produk-trending',
    fee: '/seller-tools/fee-engine',
    profit: '/seller-tools/kalkulator-profit',
    pricing: '/seller-tools/harga-ideal',
    ads: '/seller-tools/simulator-iklan',
    decision: '/seller-tools/decision-center',
    'shopee-roas': '/market-tools/shopee/kalkulator-roas',
    'shopee-price': '/market-tools/shopee/harga-jual',
    'tiktok-roas': '/market-tools/tiktok/kalkulator-roas',
    'tiktok-price': '/market-tools/tiktok/harga-jual',
    'product-my': '/produk/produk-saya',
    'product-finance': '/produk/keuangan',
    'product-stock': '/produk/stok',
    'product-competitor': '/produk/kompetitor',
    'product-affiliate': '/produk/content-affiliate',
    'product-orders': '/produk/order-analytics',
    database: '/database',
    settings: '/pengaturan'
  });

  function normalizePath(path) {
    let clean = String(path || '/').split('?')[0].split('#')[0];
    if (!clean.startsWith('/')) clean = '/' + clean;
    clean = clean.replace(/\/{2,}/g, '/');
    if (clean.length > 1) clean = clean.replace(/\/+$/, '');
    return clean || '/';
  }

  function activePage() {
    return document.querySelector('.page.active')?.id?.replace(/^page-/, '') || 'dashboard';
  }

  function canonicalizeCurrentEntry(page = activePage()) {
    const route = ROUTES[page];
    if (!route) return false;
    const state = history.state && typeof history.state === 'object' ? history.state : {};
    const pathMatches = normalizePath(location.pathname) === route;
    const stateMatches = state.page === page;
    if (pathMatches && stateMatches) return false;

    /* history.replaceState has already been decorated by the #37–#60 runtime,
       so __arIdx is preserved while the current entry is repaired in-place. */
    history.replaceState(Object.assign({}, state, { page }), '', route);
    return true;
  }

  /* Critical ordering: capture runs before app.js' bubble click handler changes
     the active page and calls pushState. This makes the page being LEFT the exact
     previous Safari history entry. Example: Stok -> Kompetitor -> swipe back = Stok. */
  document.addEventListener('click', event => {
    const trigger = event.target.closest?.('[data-page],[data-go]');
    if (!trigger) return;
    const next = trigger.dataset.page || trigger.dataset.go;
    const current = activePage();
    if (!ROUTES[next] || next === current) return;
    canonicalizeCurrentEntry(current);
  }, { capture: true });

  /* Keep every settled page/history state canonical. This also repairs an older
     tab that was already open before this hotfix was deployed. */
  document.addEventListener('arstore:page-change', event => {
    const page = event.detail?.page || activePage();
    requestAnimationFrame(() => canonicalizeCurrentEntry(page));
  });

  window.addEventListener('pageshow', () => {
    requestAnimationFrame(() => canonicalizeCurrentEntry(activePage()));
  }, { passive: true });

  function init() {
    requestAnimationFrame(() => requestAnimationFrame(() => canonicalizeCurrentEntry(activePage())));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
