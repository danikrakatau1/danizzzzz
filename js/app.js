(() => {
  const pageTitle = document.getElementById('pageTitle');
  const pages = [...document.querySelectorAll('.page')];
  const navItems = [...document.querySelectorAll('[data-page]')];
  const goButtons = [...document.querySelectorAll('[data-go]')];
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileMoreBtn = document.getElementById('mobileMoreBtn');
  const resetWorkspaceBtn = document.getElementById('resetWorkspaceBtn');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let sidebarScrollY = 0;

  const ROUTES = Object.freeze({
    dashboard: '/',
    research: '/produk-trending',
    fee: '/fee-engine',
    profit: '/kalkulator-profit',
    pricing: '/harga-ideal',
    ads: '/simulator-iklan',
    decision: '/decision-center',
    database: '/database-fee',
    settings: '/pengaturan'
  });

  const PAGE_BY_ROUTE = Object.freeze(
    Object.fromEntries(Object.entries(ROUTES).map(([page, route]) => [route, page]))
  );

  const normalizePath = path => {
    if (!path) return '/';
    let clean = path.split('?')[0].split('#')[0];
    if (!clean.startsWith('/')) clean = `/${clean}`;
    clean = clean.replace(/\/{2,}/g, '/');
    if (clean.length > 1) clean = clean.replace(/\/+$/, '');
    return clean || '/';
  };

  const pageFromLocation = () => PAGE_BY_ROUTE[normalizePath(window.location.pathname)] || 'dashboard';

  function retriggerPageAnimation(target) {
    if (!target || reduceMotion) return;
    target.classList.remove('is-entering');
    void target.offsetWidth;
    target.classList.add('is-entering');
    window.setTimeout(() => target.classList.remove('is-entering'), 700);
  }

  function revealToolCards() {
    const cards = [...document.querySelectorAll('#page-dashboard .tool-card')];
    if (reduceMotion || !('IntersectionObserver' in window)) {
      cards.forEach(card => card.classList.add('reveal'));
      return;
    }
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14 });
    cards.forEach(card => observer.observe(card));
  }

  function updateDocumentMeta(target, name) {
    const title = target?.dataset.title || 'ARSTORE Tools V2';
    pageTitle.textContent = title;
    document.title = name === 'dashboard' ? 'ARSTORE Tools V2' : `${title} — ARSTORE Tools V2`;
  }

  function showPage(name, { push = true, replace = false, scroll = true } = {}) {
    const target = document.getElementById(`page-${name}`);
    if (!target || !ROUTES[name]) return;

    pages.forEach(page => page.classList.toggle('active', page === target));
    navItems.forEach(item => item.classList.toggle('active', item.dataset.page === name));
    updateDocumentMeta(target, name);
    retriggerPageAnimation(target);

    const nextRoute = ROUTES[name];
    const currentRoute = normalizePath(window.location.pathname);
    if (push && currentRoute !== nextRoute) {
      const state = { page: name };
      if (replace) history.replaceState(state, '', nextRoute);
      else history.pushState(state, '', nextRoute);
    }

    if (scroll) window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    closeSidebar();
  }

  function openSidebar() {
    if (!sidebar) return;
    sidebarScrollY = window.scrollY || window.pageYOffset || 0;
    sidebar.classList.add('open');
    sidebarOverlay?.classList.add('show');
    document.body.classList.add('drawer-open');
    document.body.style.overflow = 'hidden';
    sidebar.setAttribute('aria-hidden', 'false');
  }

  function closeSidebar() {
    sidebar?.classList.remove('open');
    sidebarOverlay?.classList.remove('show');
    document.body.classList.remove('drawer-open');
    /* Do not unlock body while a product modal / quick preview owns the lock. */
    const researchModalOpen = document.querySelector('.research-modal.is-open,.quick-preview.is-open');
    if (!researchModalOpen) document.body.style.overflow = '';
    sidebar?.setAttribute('aria-hidden', window.matchMedia('(max-width: 820px)').matches ? 'true' : 'false');
  }

  navItems.forEach(item => item.addEventListener('click', event => {
    event.preventDefault();
    showPage(item.dataset.page);
  }));

  goButtons.forEach(item => {
    item.addEventListener('click', event => {
      event.preventDefault();
      showPage(item.dataset.go);
    });
    if (item.matches('[tabindex]')) {
      item.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          showPage(item.dataset.go);
        }
      });
    }
  });

  window.addEventListener('popstate', () => {
    showPage(pageFromLocation(), { push: false, scroll: false });
  });

  mobileMenuBtn?.addEventListener('click', openSidebar);
  mobileMoreBtn?.addEventListener('click', openSidebar);
  sidebarOverlay?.addEventListener('click', closeSidebar);
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeSidebar(); });

  document.querySelectorAll('.mode-switch').forEach(group => {
    group.querySelectorAll('.mode-btn').forEach(btn => btn.addEventListener('click', () => {
      group.querySelectorAll('.mode-btn').forEach(item => item.classList.remove('active'));
      btn.classList.add('active');
    }));
  });

  resetWorkspaceBtn?.addEventListener('click', () => {
    if (confirm('Reset tampilan workspace V2?\n\nBelum ada data bisnis yang tersimpan pada dashboard shell ini.')) {
      showPage('dashboard');
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 820) {
      sidebar?.classList.remove('open');
      sidebarOverlay?.classList.remove('show');
      document.body.classList.remove('drawer-open');
      if (!document.querySelector('.research-modal.is-open,.quick-preview.is-open')) document.body.style.overflow = '';
      sidebar?.setAttribute('aria-hidden', 'false');
    } else if (!sidebar?.classList.contains('open')) {
      sidebar?.setAttribute('aria-hidden', 'true');
    }
  }, { passive: true });

  if (window.innerWidth <= 820) sidebar?.setAttribute('aria-hidden', 'true');

  revealToolCards();

  const initialPage = pageFromLocation();
  const normalizedInitialPath = normalizePath(window.location.pathname);
  if (!PAGE_BY_ROUTE[normalizedInitialPath]) {
    history.replaceState({ page: 'dashboard' }, '', ROUTES.dashboard);
  } else {
    history.replaceState({ page: initialPage }, '', ROUTES[initialPage]);
  }
  showPage(initialPage, { push: false, scroll: false });
})();
