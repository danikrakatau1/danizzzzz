(() => {
  'use strict';
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const productPages = new Set(['product-my','product-finance','product-stock','product-competitor','product-affiliate','product-orders']);

  function flashSkeleton(container, duration = 520) {
    if (!container || reduced || container.querySelector(':scope > .ui-page-skeleton')) return;
    const style = getComputedStyle(container);
    if (style.position === 'static') container.style.position = 'relative';
    const sk = document.createElement('div');
    sk.className = 'ui-page-skeleton';
    sk.setAttribute('aria-hidden', 'true');
    sk.innerHTML = '<i></i><b></b><b></b><b></b>';
    container.appendChild(sk);
    window.setTimeout(() => {
      sk.style.opacity = '0';
      sk.style.transition = 'opacity .18s ease';
      window.setTimeout(() => sk.remove(), 190);
    }, duration);
  }

  function handlePage(page) {
    if (productPages.has(page)) {
      flashSkeleton(document.querySelector('#page-' + page + ' .product-workspace-panel'));
      return;
    }
    if (page === 'database') {
      document.querySelectorAll('#page-database .database-market-block').forEach((el, i) => {
        window.setTimeout(() => flashSkeleton(el, 460), i * 70);
      });
    }
  }

  document.addEventListener('arstore:page-change', event => handlePage(event.detail?.page));

  function markMarketplaceIcons() {
    document.querySelectorAll('.market-brand-icon').forEach(img => {
      img.addEventListener('error', () => { img.style.display = 'none'; }, {once:true});
    });
  }

  /* Final sidebar navigation hardening.
     When a nested accordion opens, reveal the expanded group itself (not only
     the clicked header), so items below it never look "hidden". */
  function wireSidebarAccordionReveal() {
    const nav = document.querySelector('.sidebar-nav');
    const sidebar = document.getElementById('sidebar');
    if (!nav || nav.dataset.finalRevealBound === '1') return;
    nav.dataset.finalRevealBound = '1';

    const behavior = () => reduced ? 'auto' : 'smooth';

    function scrollByDelta(delta) {
      if (!Number.isFinite(delta) || Math.abs(delta) < 2) return;
      const max = Math.max(0, nav.scrollHeight - nav.clientHeight);
      const top = Math.max(0, Math.min(max, nav.scrollTop + delta));
      nav.scrollTo({top, behavior:behavior()});
    }

    function revealElement(el, pad = 16) {
      if (!el || nav.scrollHeight <= nav.clientHeight + 2) return;
      const nr = nav.getBoundingClientRect();
      const er = el.getBoundingClientRect();
      if (er.top < nr.top + pad) scrollByDelta(er.top - nr.top - pad);
      else if (er.bottom > nr.bottom - pad) scrollByDelta(er.bottom - nr.bottom + pad);
    }

    function revealExpandedGroup(toggle) {
      if (!toggle) return;
      const group = toggle.closest('.nav-group') || toggle;
      const nr = nav.getBoundingClientRect();
      const gr = group.getBoundingClientRect();
      const tr = toggle.getBoundingClientRect();
      const pad = 16;
      const available = Math.max(80, nr.height - pad * 2);

      /* If the whole expanded group fits, show the whole thing. If it is taller
         than the viewport, pin its header near the top and leave normal scroll
         available for the rest of the submenu. */
      if (gr.height <= available) {
        if (gr.top < nr.top + pad) scrollByDelta(gr.top - nr.top - pad);
        else if (gr.bottom > nr.bottom - pad) scrollByDelta(gr.bottom - nr.bottom + pad);
      } else {
        scrollByDelta(tr.top - nr.top - pad);
      }
    }

    function settle(toggle) {
      /* Accordion CSS animates height, so measure more than once until it settles. */
      [0, 90, 220, 380].forEach(delay => {
        window.setTimeout(() => {
          if (toggle.getAttribute('aria-expanded') === 'true') revealExpandedGroup(toggle);
          else revealElement(toggle);
        }, delay);
      });
    }

    nav.addEventListener('click', event => {
      const toggle = event.target.closest('[data-nav-toggle]');
      if (toggle) {
        settle(toggle);
        return;
      }
      const leaf = event.target.closest('.nav-item,.nav-subitem');
      if (leaf) window.setTimeout(() => revealElement(leaf, 18), 40);
    });

    const expandedObserver = new MutationObserver(records => {
      for (const record of records) {
        if (record.type !== 'attributes' || record.attributeName !== 'aria-expanded') continue;
        settle(record.target);
      }
    });
    nav.querySelectorAll('[aria-expanded]').forEach(el => expandedObserver.observe(el, {
      attributes:true,
      attributeFilter:['aria-expanded']
    }));

    document.addEventListener('arstore:page-change', () => {
      window.setTimeout(() => {
        const active = nav.querySelector('.nav-item.active,.nav-subitem.active');
        if (!active) return;
        revealElement(active, 20);
        const groupToggle = active.closest('.nav-group')?.querySelector(':scope > [data-nav-toggle]');
        if (groupToggle?.getAttribute('aria-expanded') === 'true') revealExpandedGroup(groupToggle);
      }, 80);
    });

    if (sidebar) {
      const drawerObserver = new MutationObserver(() => {
        if (!sidebar.classList.contains('open')) return;
        window.setTimeout(() => {
          const active = nav.querySelector('.nav-item.active,.nav-subitem.active');
          if (active) revealElement(active, 20);
        }, 80);
      });
      drawerObserver.observe(sidebar, {attributes:true, attributeFilter:['class']});
    }
  }

  function init() {
    markMarketplaceIcons();
    wireSidebarAccordionReveal();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
