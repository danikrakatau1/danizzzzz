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

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', markMarketplaceIcons, {once:true});
  else markMarketplaceIcons();
})();
