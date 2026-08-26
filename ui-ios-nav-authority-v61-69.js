(() => {
  'use strict';

  /* V3.4 #61–#69 · IOS EXACT TAB HISTORY AUTHORITY
     Navigation/session layer only. Fee/DB/GOX/Profit/ROAS/Decision logic untouched. */
  const VERSION = 4;
  const STATE_TAG = '__arNavV';
  const NAV_KEY = 'arstore_v3_nav_authority_v4';
  const LEGACY_KEYS = ['arstore_v3_nav_history','arstore_v3_scroll_v37'];
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
  const PAGE_BY_ROUTE = Object.freeze(Object.fromEntries(Object.entries(ROUTES).map(([page, route]) => [route, page])));
  const nativePush = history.pushState.bind(history);
  const nativeReplace = history.replaceState.bind(history);
  let settledPage = activePage();
  let restoring = false;
  let navSequence = Number(history.state?.__arSeq ?? 0);

  function normalizePath(path) {
    let clean = String(path || '/').split('?')[0].split('#')[0];
    if (!clean.startsWith('/')) clean = '/' + clean;
    clean = clean.replace(/\/{2,}/g, '/');
    if (clean.length > 1) clean = clean.replace(/\/+$/, '');
    return clean || '/';
  }
  function pageFromPath(path) { return PAGE_BY_ROUTE[normalizePath(path)] || 'dashboard'; }
  function activePage() {
    return document.querySelector('.page.active')?.id?.replace(/^page-/, '') || 'dashboard';
  }
  function validPage(page) { return typeof page === 'string' && Object.prototype.hasOwnProperty.call(ROUTES, page); }
  function currentScroll() { return Math.max(0, Math.round(window.scrollY || 0)); }

  function accordionSnapshot() {
    const out = {};
    document.querySelectorAll('[data-nav-group]').forEach(group => {
      const name = group.dataset.navGroup;
      if (name) out[name] = group.classList.contains('is-open');
    });
    return out;
  }
  function applyAccordion(snapshot, page) {
    const data = snapshot && typeof snapshot === 'object' ? snapshot : {};
    document.querySelectorAll('[data-nav-group]').forEach(group => {
      const name = group.dataset.navGroup;
      if (!name || !(name in data)) return;
      const open = Boolean(data[name]);
      group.classList.toggle('is-open', open);
      group.querySelector(':scope > [data-nav-toggle]')?.setAttribute('aria-expanded', String(open));
    });
    // Active ancestors must stay revealable even if an older snapshot says closed.
    const active = document.querySelector(`[data-page="${CSS.escape(page)}"]`);
    let group = active?.closest?.('[data-nav-group]');
    while (group) {
      group.classList.add('is-open');
      group.querySelector(':scope > [data-nav-toggle]')?.setAttribute('aria-expanded', 'true');
      group = group.parentElement?.closest?.('[data-nav-group]') || null;
    }
  }

  function stateFor(page, base = {}, overrides = {}) {
    const safePage = validPage(page) ? page : pageFromPath(location.pathname);
    return Object.assign({}, base || {}, {
      [STATE_TAG]: VERSION,
      page: safePage,
      __arSeq: Number(base?.__arSeq ?? overrides.__arSeq ?? navSequence),
      scrollY: Number.isFinite(Number(overrides.scrollY)) ? Math.max(0, Math.round(Number(overrides.scrollY))) : currentScroll(),
      accordion: overrides.accordion || accordionSnapshot()
    }, overrides, { [STATE_TAG]: VERSION, page: safePage });
  }

  function persistSession(page, state) {
    try {
      sessionStorage.setItem(NAV_KEY, JSON.stringify({
        version: VERSION,
        page,
        seq: Number(state?.__arSeq ?? navSequence),
        at: Date.now()
      }));
    } catch (_) {}
  }

  function canonicalizeCurrent(page = settledPage, overrides = {}) {
    const safePage = validPage(page) ? page : activePage();
    const base = history.state && typeof history.state === 'object' ? history.state : {};
    const next = stateFor(safePage, base, {
      __arSeq: Number(base.__arSeq ?? navSequence),
      scrollY: overrides.scrollY ?? currentScroll(),
      accordion: overrides.accordion || accordionSnapshot()
    });
    nativeReplace(next, '', ROUTES[safePage]);
    navSequence = Number(next.__arSeq ?? navSequence);
    persistSession(safePage, next);
    return next;
  }

  // Replace the previous decorators with one canonical owner. Any app code that
  // calls pushState/replaceState now passes through this authority.
  history.pushState = function(state, title, url) {
    const targetPage = validPage(state?.page) ? state.page : pageFromPath(url || location.pathname);
    const fromPage = validPage(settledPage) ? settledPage : activePage();

    // Critical #61/#66: the DOM tab being LEFT becomes the exact previous entry,
    // even if Safari URL/history was stale before this click.
    canonicalizeCurrent(fromPage);

    navSequence += 1;
    const targetState = stateFor(targetPage, state || {}, {
      __arSeq: navSequence,
      scrollY: 0,
      accordion: accordionSnapshot()
    });
    nativePush(targetState, title || '', ROUTES[targetPage]);
    persistSession(targetPage, targetState);
  };

  history.replaceState = function(state, title, url) {
    const page = validPage(state?.page) ? state.page : (validPage(settledPage) ? settledPage : pageFromPath(url || location.pathname));
    const base = history.state && typeof history.state === 'object' ? history.state : {};
    const next = stateFor(page, Object.assign({}, base, state || {}), {
      __arSeq: Number(state?.__arSeq ?? base.__arSeq ?? navSequence),
      scrollY: Number.isFinite(Number(state?.scrollY)) ? Number(state.scrollY) : currentScroll(),
      accordion: state?.accordion || accordionSnapshot()
    });
    navSequence = Number(next.__arSeq ?? navSequence);
    nativeReplace(next, title || '', ROUTES[page]);
    persistSession(page, next);
  };

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  function restoreEntry(state, fallbackPath = location.pathname) {
    const page = validPage(state?.page) ? state.page : pageFromPath(fallbackPath);
    const scrollY = Math.max(0, Math.round(Number(state?.scrollY || 0)));
    const accordion = state?.accordion;
    const seq = Number(state?.__arSeq);
    if (Number.isFinite(seq)) navSequence = seq;

    restoring = true;
    settledPage = page;
    try {
      window.ARSTORE_NAV?.showPage?.(page, {
        push: false,
        replace: false,
        scroll: false,
        remember: false,
        closeDrawer: true
      });
    } finally {
      restoring = false;
    }

    requestAnimationFrame(() => {
      applyAccordion(accordion, page);
      requestAnimationFrame(() => {
        window.scrollTo({ top: scrollY, left: 0, behavior: 'auto' });
        canonicalizeCurrent(page, { scrollY, accordion: accordionSnapshot() });
      });
    });
    return page;
  }

  // #61/#68: capture before app.js' older popstate handler. Exact state.page wins.
  window.addEventListener('popstate', event => {
    event.stopImmediatePropagation();
    const state = event.state && typeof event.state === 'object' ? event.state : {};
    restoreEntry(state, location.pathname);
  }, { capture: true });

  document.addEventListener('arstore:page-change', event => {
    const page = validPage(event.detail?.page) ? event.detail.page : activePage();
    settledPage = page;
    if (restoring) return;
    requestAnimationFrame(() => canonicalizeCurrent(page));
  });

  // #68 BFCache: restore exact tab/scroll/accordion without adding an entry.
  window.addEventListener('pageshow', event => {
    if (!event.persisted) return;
    const state = history.state && typeof history.state === 'object' ? history.state : {};
    restoreEntry(state, location.pathname);
  }, { passive: true });

  window.addEventListener('pagehide', () => {
    canonicalizeCurrent(activePage());
  }, { passive: true });

  function init() {
    // #69: invalidate only obsolete navigation/session state. Calculator data stays.
    if (Number(history.state?.[STATE_TAG]) !== VERSION) {
      for (const key of LEGACY_KEYS) {
        try { sessionStorage.removeItem(key); } catch (_) {}
      }
      navSequence = 0;
      settledPage = activePage();
      nativeReplace(stateFor(settledPage, {}, { __arSeq: 0, scrollY: currentScroll(), accordion: accordionSnapshot() }), '', ROUTES[settledPage]);
    } else {
      settledPage = validPage(history.state?.page) ? history.state.page : activePage();
      navSequence = Number(history.state?.__arSeq ?? 0);
      canonicalizeCurrent(settledPage);
    }
    persistSession(settledPage, history.state);
    document.documentElement.dataset.navAuthority = 'v4';
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
