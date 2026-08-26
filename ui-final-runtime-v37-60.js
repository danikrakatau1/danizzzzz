(() => {
  'use strict';
  const root = document.documentElement;
  const reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const coarse = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
  const THEME_KEY = 'arstore_v3_theme';
  const SCROLL_KEY = 'arstore_v3_scroll_v37';
  const APP_HISTORY_KEY = 'arstore_v3_nav_history';
  const themeColors = { dark:'#080b12', light:'#edf1f6', charcoal:'#101114', oled:'#000000' };
  const validThemes = new Set(Object.keys(themeColors));
  let currentIndex = Number(history.state?.__arIdx ?? 0);
  let lastPage = activePage();
  let lastScrollY = window.scrollY || 0;
  let compact = false;
  let ticking = false;
  let pendingPopDirection = '';

  function activePage() {
    return document.querySelector('.page.active')?.id?.replace(/^page-/, '') || 'dashboard';
  }
  function readJson(key, fallback) {
    try { const value = JSON.parse(sessionStorage.getItem(key) || 'null'); return value ?? fallback; } catch (_) { return fallback; }
  }
  function writeJson(key, value) { try { sessionStorage.setItem(key, JSON.stringify(value)); } catch (_) {} }
  function scrollMap() { const value = readJson(SCROLL_KEY, {}); return value && typeof value === 'object' ? value : {}; }
  function saveScroll(page = activePage(), y = window.scrollY || 0) { const map = scrollMap(); map[page] = Math.max(0, Math.round(y)); writeJson(SCROLL_KEY, map); }
  function restoreScroll(page) {
    const y = Number(scrollMap()[page] || 0);
    requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo({top:y, left:0, behavior:'auto'})));
  }

  /* #42/#52 — decorate same-document history entries with a monotonic index.
     Existing app.js remains the router; this only adds direction/scroll metadata. */
  const nativePush = history.pushState.bind(history);
  const nativeReplace = history.replaceState.bind(history);
  history.pushState = function(state, title, url) {
    saveScroll(lastPage, window.scrollY || 0);
    currentIndex += 1;
    const next = Object.assign({}, state || {}, {__arIdx:currentIndex});
    return nativePush(next, title, url);
  };
  history.replaceState = function(state, title, url) {
    const idx = Number(state?.__arIdx ?? history.state?.__arIdx ?? currentIndex ?? 0);
    currentIndex = Number.isFinite(idx) ? idx : 0;
    const next = Object.assign({}, state || {}, {__arIdx:currentIndex});
    return nativeReplace(next, title, url);
  };
  if (!Number.isFinite(Number(history.state?.__arIdx))) {
    nativeReplace(Object.assign({}, history.state || {}, {__arIdx:0}), '', location.href);
    currentIndex = 0;
  }
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  function animateActive(direction) {
    const page = document.querySelector('.page.active');
    if (!page || reduced) return;
    page.classList.remove('ui-nav-enter-forward','ui-nav-enter-back');
    void page.offsetWidth;
    page.classList.add(direction === 'back' ? 'ui-nav-enter-back' : 'ui-nav-enter-forward');
    window.setTimeout(() => page.classList.remove('ui-nav-enter-forward','ui-nav-enter-back'), 360);
  }

  /* Capture first so app.js sees the correct direction context while it restores
     the requested page. The page-change event performs the single animation. */
  window.addEventListener('popstate', event => {
    const nextIndex = Number(event.state?.__arIdx);
    const direction = Number.isFinite(nextIndex) && nextIndex < currentIndex ? 'back' : 'forward';
    currentIndex = Number.isFinite(nextIndex) ? nextIndex : Math.max(0,currentIndex - 1);
    pendingPopDirection = direction;
    root.dataset.navDirection = direction;
    requestAnimationFrame(() => {
      const page = activePage();
      lastPage = page;
      restoreScroll(page);
      document.body.classList.remove('ui-edge-swipe-armed');
      pendingPopDirection = '';
      root.dataset.navDirection = '';
    });
  }, {capture:true});

  document.addEventListener('click', event => {
    const nav = event.target.closest('[data-page],[data-go]');
    if (!nav) return;
    const next = nav.dataset.page || nav.dataset.go;
    if (next && next !== activePage()) saveScroll(activePage(), window.scrollY || 0);
  }, true);

  document.addEventListener('arstore:page-change', event => {
    const page = event.detail?.page || activePage();
    const direction = pendingPopDirection || root.dataset.navDirection || 'forward';
    if (page !== lastPage) {
      animateActive(direction === 'back' ? 'back' : 'forward');
      lastPage = page;
      if (!pendingPopDirection && direction !== 'back') window.setTimeout(() => window.scrollTo({top:0,left:0,behavior:'auto'}), 0);
    }
    if (!pendingPopDirection) root.dataset.navDirection = '';
    refreshEmptyStates();
  });

  /* #42 — give iOS edge-swipe a themed underlay instead of a white compositor gap. */
  function ensureSwipeUnderlay() {
    if (document.querySelector('.ui-swipe-underlay')) return;
    const underlay = document.createElement('div');
    underlay.className = 'ui-swipe-underlay';
    underlay.setAttribute('aria-hidden','true');
    document.body.prepend(underlay);
  }
  let edgeTouch = false;
  document.addEventListener('touchstart', event => {
    if (!coarse || !event.touches?.length) return;
    const x = event.touches[0].clientX;
    edgeTouch = x <= 26 && activePage() !== 'dashboard';
    if (edgeTouch) document.body.classList.add('ui-edge-swipe-armed');
  }, {passive:true});
  document.addEventListener('touchend', () => {
    if (!edgeTouch) return;
    edgeTouch = false;
    window.setTimeout(() => document.body.classList.remove('ui-edge-swipe-armed'), 420);
  }, {passive:true});
  document.addEventListener('touchcancel', () => { edgeTouch=false; document.body.classList.remove('ui-edge-swipe-armed'); }, {passive:true});

  /* #44/#50/#59 — keep browser chrome and first paint in sync with active theme. */
  function syncTheme() {
    const theme = validThemes.has(root.dataset.theme) ? root.dataset.theme : 'dark';
    const color = themeColors[theme];
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) { meta = document.createElement('meta'); meta.name='theme-color'; document.head.appendChild(meta); }
    meta.setAttribute('content', color);
    root.style.backgroundColor = color;
    document.body?.style.setProperty('--ui-browser-bg', color);
    document.querySelectorAll('[data-theme-choice]').forEach(btn => btn.classList.toggle('active', btn.dataset.themeChoice === theme));
    requestAnimationFrame(() => root.classList.add('ui-theme-ready'));
  }
  new MutationObserver(records => {
    if (records.some(r => r.attributeName === 'data-theme')) syncTheme();
  }).observe(root,{attributes:true,attributeFilter:['data-theme']});

  /* #51 — compact sticky header only while scrolling down, restore on upward intent. */
  function onScrollFrame() {
    ticking = false;
    const y = Math.max(0, window.scrollY || 0);
    const down = y > lastScrollY + 6;
    const up = y < lastScrollY - 6;
    if (y < 28) compact = false;
    else if (down && y > 90) compact = true;
    else if (up) compact = false;
    document.body.classList.toggle('ui-header-compact', compact);
    lastScrollY = y;
  }
  window.addEventListener('scroll', () => { if (!ticking) { ticking=true; requestAnimationFrame(onScrollFrame); } }, {passive:true});

  /* #46/#54 — mark visual placeholders and message states without changing logic. */
  const emptyIds = ['v3LastProfit','v3LastMargin','v3LastProduct','decisionProduct','decisionFee','decisionProfit','decisionPrice','decisionRoas'];
  function refreshEmptyStates() {
    emptyIds.forEach(id => {
      const el = document.getElementById(id); if (!el) return;
      const empty = !el.textContent.trim() || el.textContent.trim() === '—';
      el.classList.toggle('ui-empty-value', empty);
    });
  }
  function inferState(text) {
    const t = String(text || '').trim().toLowerCase();
    if (!t) return '';
    if (/gagal|error|tidak valid|invalid|wajib|belum lengkap|tidak ditemukan/.test(t)) return 'error';
    if (/peringatan|warning|hati-hati|risiko|anomali/.test(t)) return 'warning';
    if (/berhasil|sukses|siap|tersimpan|selesai|pass/.test(t)) return 'success';
    return 'info';
  }
  const messageSelector = '.v3-form-message,.fee-message,.profit-message,.research-message';
  function refreshMessages(scope=document) {
    scope.querySelectorAll?.(messageSelector).forEach(el => {
      const state = inferState(el.textContent);
      if (state) el.dataset.uiState = state; else delete el.dataset.uiState;
    });
  }
  const messageObserver = new MutationObserver(records => {
    for (const record of records) {
      const target = record.target.nodeType === 1 ? record.target : record.target.parentElement;
      const el = target?.closest?.(messageSelector);
      if (el) refreshMessages(el.parentElement || document);
    }
    refreshEmptyStates();
  });

  function init() {
    root.dataset.uiSweep = '37-60';
    ensureSwipeUnderlay();
    syncTheme();
    refreshEmptyStates();
    refreshMessages();
    messageObserver.observe(document.body,{subtree:true,childList:true,characterData:true});
    window.addEventListener('pagehide', () => saveScroll(activePage(), window.scrollY || 0), {passive:true});
    window.addEventListener('pageshow', () => {
      syncTheme();
      pendingPopDirection = '';
      root.dataset.navDirection = '';
      document.body.classList.remove('ui-edge-swipe-armed');
      const page = activePage();
      lastPage = page;
      refreshEmptyStates();
    }, {passive:true});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
