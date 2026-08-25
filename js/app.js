(() => {
  'use strict';

  const THEME_KEY = 'arstore_v3_theme';
  const NAV_HISTORY_KEY = 'arstore_v3_nav_history';
  const ACCORDION_KEY = 'arstore_v3_accordion_state';
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false;

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

  const LEGACY_ROUTES = Object.freeze({
    '/produk-trending': 'research',
    '/fee-engine': 'fee',
    '/kalkulator-profit': 'profit',
    '/harga-ideal': 'pricing',
    '/simulator-iklan': 'ads',
    '/decision-center': 'decision',
    '/database-fee': 'database',
    '/kalkulator-roas': 'shopee-roas',
    '/harga-jual': 'shopee-price',
    '/produk': 'product-my'
  });

  const GROUPS = Object.freeze({
    market: { id: 'marketNavGroup', pages: ['shopee-roas', 'shopee-price', 'tiktok-roas', 'tiktok-price'] },
    shopee: { id: 'shopeeNavGroup', pages: ['shopee-roas', 'shopee-price'] },
    tiktok: { id: 'tiktokNavGroup', pages: ['tiktok-roas', 'tiktok-price'] },
    product: { id: 'productNavGroup', pages: ['product-my', 'product-finance', 'product-stock', 'product-competitor', 'product-affiliate', 'product-orders'] }
  });

  const PAGE_BY_ROUTE = Object.freeze(Object.fromEntries(Object.entries(ROUTES).map(([page, route]) => [route, page])));
  const $ = id => document.getElementById(id);

  function addStylesheet(href) {
    if (document.head.querySelector(`link[href="${href}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }

  function addHeadLink(rel, href, extra = {}) {
    if (document.head.querySelector(`link[rel="${rel}"][href="${href}"]`)) return;
    const link = document.createElement('link');
    link.rel = rel;
    link.href = href;
    Object.entries(extra).forEach(([key, value]) => link.setAttribute(key, value));
    document.head.appendChild(link);
  }

  function readJSON(storage, key, fallback) {
    try {
      const value = JSON.parse(storage.getItem(key) || 'null');
      return value ?? fallback;
    } catch (_) {
      return fallback;
    }
  }

  function writeJSON(storage, key, value) {
    try { storage.setItem(key, JSON.stringify(value)); } catch (_) {}
  }

  function applyTheme(theme) {
    const next = theme === 'light' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem(THEME_KEY, next); } catch (_) {}
    document.querySelectorAll('[data-theme-choice]').forEach(button => {
      button.classList.toggle('active', button.dataset.themeChoice === next);
      button.setAttribute('aria-pressed', String(button.dataset.themeChoice === next));
    });
  }

  function normalizePath(path) {
    let clean = String(path || '/').split('?')[0].split('#')[0];
    if (!clean.startsWith('/')) clean = `/${clean}`;
    clean = clean.replace(/\/{2,}/g, '/');
    if (clean.length > 1) clean = clean.replace(/\/+$/, '');
    return clean || '/';
  }

  function pageFromPath(path) {
    const normalized = normalizePath(path);
    return PAGE_BY_ROUTE[normalized] || LEGACY_ROUTES[normalized] || 'dashboard';
  }

  function marketRoasPage(pageId, title, market, prefix, feeNote) {
    return `<section class="page" id="page-${pageId}" data-title="${title}">
      <div class="v3-tool-page market-tool-page" data-market="${market.toLowerCase()}">
        <div class="v3-tool-head">
          <div><span class="step-badge">MARKET TOOLS · ${market.toUpperCase()}</span><h2>${title}</h2><p>Hitung Actual ROAS, ROAS BEP, batas biaya iklan, CPA maksimum, dan profit setelah ads untuk ${market}. ${feeNote}</p></div>
          <button type="button" class="secondary-btn" id="${prefix}LoadProfit">Isi dari Profit Terakhir</button>
        </div>
        <div class="v3-calc-layout">
          <form class="v3-calc-card" id="${prefix}Form">
            <div class="v3-field-grid">
              <label>Omzet / Revenue <input id="${prefix}Revenue" type="number" min="0" step="1000" inputmode="numeric" placeholder="Rp0" required></label>
              <label>Biaya Iklan <input id="${prefix}AdSpend" type="number" min="0" step="1000" inputmode="numeric" placeholder="Rp0" required></label>
              <label>HPP / Modal Total <input id="${prefix}Cogs" type="number" min="0" step="1000" inputmode="numeric" placeholder="Rp0"></label>
              <label>Fee Marketplace <input id="${prefix}MarketplaceFee" type="number" min="0" step="1000" inputmode="numeric" placeholder="Rp0"></label>
              <label>Biaya Lain <input id="${prefix}OtherCost" type="number" min="0" step="1000" inputmode="numeric" placeholder="Rp0"></label>
              <label>Jumlah Order <input id="${prefix}Orders" type="number" min="1" step="1" inputmode="numeric" value="1"></label>
              <label>Target ROAS <input id="${prefix}Target" type="number" min="0" step="0.1" inputmode="decimal" value="3"></label>
            </div>
            <button class="primary-btn calc-submit" type="submit">Hitung ROAS ${market} <span>→</span></button>
            <p class="v3-form-message" id="${prefix}Message" aria-live="polite"></p>
          </form>
          <aside class="v3-result-card" id="${prefix}ResultCard">
            <span class="eyebrow">HASIL ROAS ${market.toUpperCase()}</span>
            <div class="v3-metric-grid">
              <article><span>Actual ROAS</span><strong id="${prefix}Actual">—</strong></article>
              <article><span>ROAS BEP</span><strong id="${prefix}Bep">—</strong></article>
              <article><span>Profit Setelah Ads</span><strong id="${prefix}Profit">—</strong></article>
              <article><span>Margin</span><strong id="${prefix}Margin">—</strong></article>
              <article><span>Ads Break-Even</span><strong id="${prefix}AdsBep">—</strong></article>
              <article><span>Max CPA</span><strong id="${prefix}MaxCpa">—</strong></article>
            </div>
            <div class="v3-health" id="${prefix}Health"><strong id="${prefix}HealthTitle">Menunggu data</strong><p id="${prefix}HealthText">Masukkan data untuk membaca kesehatan iklan.</p></div>
          </aside>
        </div>
      </div>
    </section>`;
  }

  function marketPricePage(pageId, title, market, prefix, defaultFee, defaultFixed, feeNote) {
    return `<section class="page" id="page-${pageId}" data-title="${title}">
      <div class="v3-tool-page market-tool-page" data-market="${market.toLowerCase()}">
        <div class="v3-tool-head">
          <div><span class="step-badge">MARKET TOOLS · ${market.toUpperCase()}</span><h2>${title}</h2><p>Hitung harga minimum, harga aman, dan harga target dari biaya produk serta fee ${market}. ${feeNote}</p></div>
          <button type="button" class="secondary-btn" id="${prefix}LoadWorkspace">Isi dari Workspace</button>
        </div>
        <div class="v3-calc-layout">
          <form class="v3-calc-card" id="${prefix}Form">
            <div class="v3-field-grid">
              <label>HPP <input id="${prefix}Hpp" type="number" min="0" step="1000" inputmode="numeric" required></label>
              <label>Packing <input id="${prefix}Packing" type="number" min="0" step="1000" inputmode="numeric" value="0"></label>
              <label>Operasional <input id="${prefix}Ops" type="number" min="0" step="1000" inputmode="numeric" value="0"></label>
              <label>Budget Ads / Unit <input id="${prefix}Ads" type="number" min="0" step="1000" inputmode="numeric" value="0"></label>
              <label>Biaya Tambahan <input id="${prefix}Extra" type="number" min="0" step="1000" inputmode="numeric" value="0"></label>
              <label>Fee Marketplace (%) <input id="${prefix}FeeRate" type="number" min="0" max="95" step="0.01" inputmode="decimal" value="${defaultFee}"></label>
              <label>Biaya Tetap / Order <input id="${prefix}FixedFee" type="number" min="0" step="100" inputmode="numeric" value="${defaultFixed}"></label>
            </div>
            <div class="target-selector" data-target-selector="${prefix}">
              <button type="button" class="target-choice active" data-price-target="margin" data-price-prefix="${prefix}">Target Margin</button>
              <button type="button" class="target-choice" data-price-target="profit" data-price-prefix="${prefix}">Target Profit</button>
            </div>
            <div class="v3-field-grid target-fields">
              <label id="${prefix}MarginWrap">Target Margin (%) <input id="${prefix}TargetMargin" type="number" min="0" max="80" step="0.5" value="20"></label>
              <label id="${prefix}ProfitWrap" hidden>Target Profit / Unit <input id="${prefix}TargetProfit" type="number" min="0" step="1000" value="20000"></label>
            </div>
            <button class="primary-btn calc-submit" type="submit">Hitung Harga Jual ${market} <span>→</span></button>
            <p class="v3-form-message" id="${prefix}Message" aria-live="polite"></p>
          </form>
          <aside class="v3-result-card">
            <span class="eyebrow">REKOMENDASI HARGA ${market.toUpperCase()}</span>
            <div class="v3-price-hero"><span>Harga Target</span><strong id="${prefix}Ideal">—</strong></div>
            <div class="v3-metric-grid">
              <article><span>Harga Minimum</span><strong id="${prefix}Minimum">—</strong></article>
              <article><span>Harga Aman</span><strong id="${prefix}Safe">—</strong></article>
              <article><span>Profit Estimasi</span><strong id="${prefix}Profit">—</strong></article>
              <article><span>Margin Estimasi</span><strong id="${prefix}MarginResult">—</strong></article>
            </div>
            <div class="v3-health" id="${prefix}Health"><strong id="${prefix}HealthTitle">Menunggu data</strong><p id="${prefix}HealthText">Masukkan struktur biaya untuk menghitung harga jual.</p></div>
          </aside>
        </div>
      </div>
    </section>`;
  }

  function productPage(pageId, title, description, note) {
    return `<section class="page" id="page-${pageId}" data-title="${title}">
      <div class="product-workspace">
        <span class="step-badge">PRODUCT CENTER</span><h2>${title}</h2><p>${description}</p>
        <div class="product-workspace-panel"><strong>${title}</strong><span>${note}</span></div>
      </div>
    </section>`;
  }

  function buildSidebar() {
    const nav = document.querySelector('.sidebar-nav');
    if (!nav) return;
    nav.innerHTML = `
      <button class="nav-item active" data-page="dashboard"><span class="nav-icon">⌂</span><span>Dashboard</span></button>
      <div class="nav-section-title">WORKFLOW</div>
      <button class="nav-item" data-page="seller-tools"><span class="nav-icon">✦</span><span>Seller Tools</span></button>
      <div class="nav-group nav-group-level-1" id="marketNavGroup" data-nav-group="market">
        <button class="nav-item nav-parent" type="button" data-nav-toggle="market" aria-expanded="false" aria-controls="marketToolsPanel"><span class="nav-icon">◈</span><span>Market Tools</span><span class="nav-chevron" aria-hidden="true">⌄</span></button>
        <div class="nav-accordion-panel" id="marketToolsPanel"><div class="nav-accordion-inner">
          <div class="nav-group nav-group-level-2" id="shopeeNavGroup" data-nav-group="shopee">
            <button class="nav-subitem nav-parent nav-market-parent" type="button" data-nav-toggle="shopee" aria-expanded="false" aria-controls="shopeeToolsPanel"><span class="nav-subdot"></span><span>Shopee</span><span class="nav-chevron" aria-hidden="true">⌄</span></button>
            <div class="nav-accordion-panel nav-accordion-panel-nested" id="shopeeToolsPanel"><div class="nav-accordion-inner">
              <button class="nav-subitem nav-leaf nav-level-3" type="button" data-page="shopee-roas"><span class="nav-subdot"></span><span>Kalkulator ROAS Shopee</span></button>
              <button class="nav-subitem nav-leaf nav-level-3" type="button" data-page="shopee-price"><span class="nav-subdot"></span><span>Harga Jual Shopee</span></button>
            </div></div>
          </div>
          <div class="nav-group nav-group-level-2" id="tiktokNavGroup" data-nav-group="tiktok">
            <button class="nav-subitem nav-parent nav-market-parent" type="button" data-nav-toggle="tiktok" aria-expanded="false" aria-controls="tiktokToolsPanel"><span class="nav-subdot"></span><span>TikTok</span><span class="nav-chevron" aria-hidden="true">⌄</span></button>
            <div class="nav-accordion-panel nav-accordion-panel-nested" id="tiktokToolsPanel"><div class="nav-accordion-inner">
              <button class="nav-subitem nav-leaf nav-level-3" type="button" data-page="tiktok-roas"><span class="nav-subdot"></span><span>Kalkulator ROAS TikTok</span></button>
              <button class="nav-subitem nav-leaf nav-level-3" type="button" data-page="tiktok-price"><span class="nav-subdot"></span><span>Harga Jual TikTok</span></button>
            </div></div>
          </div>
        </div></div>
      </div>
      <div class="nav-section-title">CEK PRODUK</div>
      <div class="nav-group nav-group-level-1" id="productNavGroup" data-nav-group="product">
        <button class="nav-item nav-parent" type="button" data-nav-toggle="product" aria-expanded="false" aria-controls="productCenterPanel"><span class="nav-icon">▦</span><span>Product Center</span><span class="nav-chevron" aria-hidden="true">⌄</span></button>
        <div class="nav-accordion-panel" id="productCenterPanel"><div class="nav-accordion-inner">
          <button class="nav-subitem nav-leaf" data-page="product-my"><span class="nav-subdot"></span><span>Produk Saya</span></button>
          <button class="nav-subitem nav-leaf" data-page="product-finance"><span class="nav-subdot"></span><span>Keuangan</span></button>
          <button class="nav-subitem nav-leaf" data-page="product-stock"><span class="nav-subdot"></span><span>Stok</span></button>
          <button class="nav-subitem nav-leaf" data-page="product-competitor"><span class="nav-subdot"></span><span>Kompetitor</span></button>
          <button class="nav-subitem nav-leaf" data-page="product-affiliate"><span class="nav-subdot"></span><span>Content / Affiliate</span></button>
          <button class="nav-subitem nav-leaf" data-page="product-orders"><span class="nav-subdot"></span><span>Order Analytics</span></button>
        </div></div>
      </div>
      <div class="nav-section-title">DATA & SYSTEM</div>
      <button class="nav-item" data-page="database"><span class="nav-icon">↻</span><span>Update Database</span></button>
      <div class="nav-section-title">PENGATURAN</div>
      <button class="nav-item" data-page="settings"><span class="nav-icon">⚙</span><span>Pengaturan</span></button>`;
  }

  function buildDashboard() {
    const page = $('page-dashboard');
    if (!page) return;
    page.innerHTML = `<div class="v3-dashboard">
      <section class="v3-hero">
        <div><span class="eyebrow accent">AR STORE SELLER COMMAND CENTER</span><h2>Kerja lebih cepat.<br><span>Fokus ke keputusan penting.</span></h2><p>Workflow seller, kalkulator marketplace, product center, dan database AR STORE dirapikan dalam satu command center.</p><div class="v3-hero-actions"><button class="primary-btn" data-go="seller-tools">Buka Seller Tools <span>→</span></button><button class="secondary-btn" data-go="shopee-roas">Kalkulator ROAS Shopee</button></div></div>
        <div class="v3-status-card"><span class="eyebrow">SYSTEM STATUS</span><strong>Workspace V3</strong><small>Seller Tools aktif · Market Tools aktif · Vercel backend</small></div>
      </section>
      <section class="v3-quick"><div class="section-title-row v3-section-title"><div><span class="eyebrow">QUICK TOOLS</span><h3>Marketplace tools</h3></div></div><div class="v3-quick-grid">
        <button data-go="shopee-roas"><span>S</span><strong>Kalkulator ROAS Shopee</strong><small>ROAS, BEP, CPA & profit iklan</small></button>
        <button data-go="shopee-price"><span>Rp</span><strong>Harga Jual Shopee</strong><small>Harga minimum, aman & target</small></button>
        <button data-go="tiktok-roas"><span>T</span><strong>Kalkulator ROAS TikTok</strong><small>ROAS, BEP, CPA & profit iklan</small></button>
        <button data-go="tiktok-price"><span>Rp</span><strong>Harga Jual TikTok</strong><small>Harga jual dengan fee manual</small></button>
      </div></section>
      <section class="v3-summary-grid"><article><span>Profit terakhir</span><strong id="v3LastProfit">—</strong><small>Dari Seller Tools</small></article><article><span>Margin terakhir</span><strong id="v3LastMargin">—</strong><small>Workspace snapshot</small></article><article><span>Produk terakhir</span><strong id="v3LastProduct">—</strong><small>Analisis terakhir</small></article><article><span>Status database</span><strong>Siap</strong><small>Fee DB tersedia</small></article></section>
      <section class="v3-recent"><div class="panel-topline"><div><span class="eyebrow">RECENT ACTIVITY</span><h3>Aktivitas terakhir</h3></div></div><div class="v3-recent-list"><div><span>•</span><p>Workspace V3 siap digunakan.</p></div></div></section>
    </div>`;
  }

  function buildSellerTools(main) {
    if ($('page-seller-tools')) return;
    const page = document.createElement('section');
    page.className = 'page'; page.id = 'page-seller-tools'; page.dataset.title = 'Seller Tools';
    page.innerHTML = `<div class="seller-tools-hub"><div class="seller-tools-head"><div><span class="step-badge">SELLER WORKFLOW</span><h2>Seller Tools</h2><p>Project existing AR STORE tetap hidup sebagai workflow Step 01–06. Logic Research, Fee Engine, dan Profit tidak dibuang.</p></div><div class="seller-workflow-summary"><span class="eyebrow">WORKFLOW STATUS</span><strong id="sellerWorkflowProgress">0 / 6</strong><small id="sellerWorkflowCaption">Mulai dari Produk Trending</small></div></div><div class="seller-tools-grid">
      <button data-go="research"><span>01</span><strong>Produk Trending</strong><small>Analisis pasar & produk Shopee</small><em id="sellerStep1Status">Belum</em></button>
      <button data-go="fee"><span>02</span><strong>Fee Engine</strong><small>Hitung biaya marketplace</small><em id="sellerStep2Status">Belum</em></button>
      <button data-go="profit"><span>03</span><strong>Kalkulator Profit</strong><small>Profit, margin, ROI, CPA & warning</small><em id="sellerStep3Status">Belum</em></button>
      <button data-go="pricing"><span>04</span><strong>Harga Ideal</strong><small>Terhubung ke Harga Jual Shopee</small><em id="sellerStep4Status">Belum</em></button>
      <button data-go="ads"><span>05</span><strong>Simulator Iklan</strong><small>Terhubung ke ROAS Shopee</small><em id="sellerStep5Status">Belum</em></button>
      <button data-go="decision"><span>06</span><strong>Decision Center</strong><small>Ringkasan keputusan workflow</small><em id="sellerStep6Status">Belum</em></button>
    </div><div class="seller-continue-row"><button class="primary-btn" id="sellerContinueBtn" data-go="research">Lanjutkan Workflow <span>→</span></button><small>Data Step 01–03 tetap kompatibel dengan workspace yang sudah ada.</small></div></div>`;
    const research = $('page-research'); main.insertBefore(page, research || main.firstChild);
  }

  function buildWorkflowBridges() {
    const pricing = $('page-pricing');
    if (pricing) pricing.innerHTML = `<div class="seller-module-bar"><button type="button" data-go="seller-tools">← Seller Tools</button><span>Seller Workflow · Step 04/06</span></div><div class="workflow-bridge"><span class="step-badge">STEP 04</span><h2>Harga Ideal</h2><p>Step 04 memakai engine Harga Jual Shopee dari Market Tools supaya logic tidak ganda.</p><div class="workflow-bridge-grid"><article><span>Harga Target</span><strong id="step04Price">—</strong></article><article><span>Harga Minimum</span><strong id="step04Min">—</strong></article><article><span>Margin</span><strong id="step04Margin">—</strong></article></div><div class="workflow-actions"><button class="primary-btn" data-go="shopee-price">Buka Harga Jual Shopee <span>→</span></button><button class="secondary-btn" data-go="ads">Lanjut Step 05</button></div></div>`;
    const ads = $('page-ads');
    if (ads) ads.innerHTML = `<div class="seller-module-bar"><button type="button" data-go="seller-tools">← Seller Tools</button><span>Seller Workflow · Step 05/06</span></div><div class="workflow-bridge"><span class="step-badge">STEP 05</span><h2>Simulator Iklan / ROAS</h2><p>Step 05 memakai Kalkulator ROAS Shopee. Data Profit terakhir bisa dimuat otomatis.</p><div class="workflow-bridge-grid"><article><span>Actual ROAS</span><strong id="step05Roas">—</strong></article><article><span>ROAS BEP</span><strong id="step05Bep">—</strong></article><article><span>Max CPA</span><strong id="step05Cpa">—</strong></article></div><div class="workflow-actions"><button class="primary-btn" data-go="shopee-roas">Buka Kalkulator ROAS Shopee <span>→</span></button><button class="secondary-btn" data-go="decision">Lanjut Step 06</button></div></div>`;
    const decision = $('page-decision');
    if (decision) decision.innerHTML = `<div class="seller-module-bar"><button type="button" data-go="seller-tools">← Seller Tools</button><span>Seller Workflow · Step 06/06</span></div><div class="decision-center-v3"><span class="step-badge">STEP 06</span><h2>Decision Center</h2><p>Rangkuman otomatis dari Produk Trending, Fee Engine, Profit, Harga Jual Shopee, dan ROAS Shopee.</p><div class="decision-score"><span class="eyebrow">FINAL STATUS</span><strong id="decisionStatus">Belum lengkap</strong><p id="decisionSummary">Selesaikan workflow untuk mendapatkan keputusan.</p></div><div class="decision-grid"><article><span>Produk</span><strong id="decisionProduct">—</strong><small id="decisionMarket">Belum dianalisis</small></article><article><span>Effective Fee</span><strong id="decisionFee">—</strong><small id="decisionNet">Belum dihitung</small></article><article><span>Profit</span><strong id="decisionProfit">—</strong><small id="decisionMargin">Belum dihitung</small></article><article><span>Harga Target</span><strong id="decisionPrice">—</strong><small id="decisionPriceMargin">Belum dihitung</small></article><article><span>ROAS</span><strong id="decisionRoas">—</strong><small id="decisionRoasStatus">Belum disimulasikan</small></article></div><div class="decision-recommendation"><strong>Next Action</strong><p id="decisionNextAction">Mulai dari Step 01 untuk membangun keputusan.</p></div></div>`;
  }

  function buildSystemPages() {
    const database = $('page-database');
    if (database) {
      database.dataset.title = 'Update Database';
      database.innerHTML = `<div class="database-v3"><span class="step-badge secondary">DATA & SYSTEM</span><h2>Update Database</h2><p>Pusat status dan pembaruan database fee yang digunakan Seller Tools.</p><div class="database-grid"><article><span>Versi</span><strong id="databaseVersion">2026 Exact</strong></article><article><span>Total Grup Fee</span><strong id="databaseRows">437</strong></article><article><span>Regular</span><strong id="databaseRegular">215</strong></article><article><span>Mall</span><strong id="databaseMall">222</strong></article></div><div class="database-note"><strong>Integrity Check</strong><p id="databaseIntegrity">PASS · database exact siap digunakan.</p></div></div>`;
    }
    const settings = $('page-settings');
    if (settings) {
      settings.dataset.title = 'Pengaturan';
      settings.innerHTML = `<div class="settings-v3"><span class="step-badge secondary">PENGATURAN</span><h2>Pengaturan</h2><p>Atur tampilan workspace tanpa mengubah data analisis.</p><section class="settings-card"><div><span class="eyebrow">TEMA</span><h3>Ganti Tema</h3><p>Pilih tema gelap atau terang. Preferensi tersimpan di browser.</p></div><div class="theme-segment" role="group" aria-label="Pilih tema"><button type="button" data-theme-choice="dark">Gelap</button><button type="button" data-theme-choice="light">Terang</button></div></section></div>`;
    }
  }

  function appendNewPages(main) {
    const blocks = [
      ['page-shopee-roas', marketRoasPage('shopee-roas', 'Kalkulator ROAS Shopee', 'Shopee', 'shopeeRoas', 'Fee dapat dimuat dari hasil Profit/Shopee workspace.')],
      ['page-shopee-price', marketPricePage('shopee-price', 'Harga Jual Shopee', 'Shopee', 'shopeePrice', '8.25', '1250', 'Fee Shopee dapat dimuat dari Fee Engine agar sinkron dengan Seller Workflow.')],
      ['page-tiktok-roas', marketRoasPage('tiktok-roas', 'Kalkulator ROAS TikTok', 'TikTok', 'tiktokRoas', 'Fee TikTok diisi manual agar tidak memakai asumsi fee Shopee.')],
      ['page-tiktok-price', marketPricePage('tiktok-price', 'Harga Jual TikTok', 'TikTok', 'tiktokPrice', '0', '0', 'Fee TikTok default 0% dan wajib disesuaikan dengan struktur fee akun/program yang berlaku.')],
      ['page-product-my', productPage('product-my', 'Produk Saya', 'Workspace khusus daftar produk, performa, dan ringkasan produk AR STORE.', 'Halaman mandiri. Tidak digabung dengan Keuangan, Stok, atau analytics lain.')],
      ['page-product-finance', productPage('product-finance', 'Keuangan', 'Workspace khusus keuangan produk dan ringkasan hasil penjualan.', 'Halaman mandiri untuk data keuangan produk.')],
      ['page-product-stock', productPage('product-stock', 'Stok', 'Workspace khusus monitoring stok dan kebutuhan restock.', 'Halaman mandiri untuk kontrol stok.')],
      ['page-product-competitor', productPage('product-competitor', 'Kompetitor', 'Workspace khusus perbandingan produk, harga, dan sinyal kompetitor.', 'Halaman mandiri untuk analisis kompetitor.')],
      ['page-product-affiliate', productPage('product-affiliate', 'Content / Affiliate', 'Workspace khusus konten, affiliate, dan performa aktivitas promosi.', 'Halaman mandiri untuk content dan affiliate insight.')],
      ['page-product-orders', productPage('product-orders', 'Order Analytics', 'Workspace khusus analisis order, tren, dan pola transaksi.', 'Halaman mandiri untuk analisis order.')]
    ];
    const holder = document.createElement('div');
    for (const [id, markup] of blocks) {
      if ($(id)) continue;
      holder.innerHTML = markup.trim();
      const node = holder.firstElementChild;
      if (node) main.appendChild(node);
    }
  }

  function buildV3() {
    addStylesheet('/css/v3-master.css');
    addHeadLink('icon', '/assets/arstore-emblem-transparent.png', { type: 'image/png' });
    addHeadLink('apple-touch-icon', '/assets/arstore-emblem-transparent.png');
    document.title = 'ARSTORE Tools V3';
    document.querySelector('.topbar .eyebrow')?.replaceChildren(document.createTextNode('ARSTORE TOOLS V3'));
    document.querySelector('.bottom-nav')?.remove();
    buildSidebar();
    buildDashboard();
    const main = document.querySelector('.main-content');
    if (!main) return;
    buildSellerTools(main);
    buildWorkflowBridges();
    buildSystemPages();
    appendNewPages(main);
  }

  buildV3();
  applyTheme(localStorage.getItem(THEME_KEY) || 'dark');

  const pageTitle = $('pageTitle');
  const sidebar = $('sidebar');
  const overlay = $('sidebarOverlay');
  const mobileMenuBtn = $('mobileMenuBtn');
  const resetBtn = $('resetWorkspaceBtn');
  const pages = [...document.querySelectorAll('.page')];

  const getActivePage = () => document.querySelector('.page.active')?.id?.replace(/^page-/, '') || 'dashboard';
  const getHistory = () => {
    const value = readJSON(sessionStorage, NAV_HISTORY_KEY, []);
    return Array.isArray(value) ? value : [];
  };
  const saveHistory = value => writeJSON(sessionStorage, NAV_HISTORY_KEY, value.slice(-30));

  function rememberCurrent(nextPage) {
    const current = getActivePage();
    if (!current || current === nextPage) return;
    const stack = getHistory();
    if (stack.at(-1) !== current) stack.push(current);
    saveHistory(stack);
  }

  function closeSidebar() {
    sidebar?.classList.remove('open', 'active', 'is-open');
    overlay?.classList.remove('show', 'active', 'visible');
    document.body.classList.remove('drawer-open', 'sidebar-open', 'menu-open', 'no-scroll');
    mobileMenuBtn?.setAttribute('aria-expanded', 'false');
    if (!document.querySelector('.research-modal.is-open,.quick-preview.is-open')) document.body.style.overflow = '';
    sidebar?.setAttribute('aria-hidden', window.innerWidth <= 820 ? 'true' : 'false');
  }

  function openSidebar() {
    if (!sidebar || window.innerWidth > 820) return;
    sidebar.classList.add('open'); overlay?.classList.add('show'); document.body.classList.add('drawer-open');
    document.body.style.overflow = 'hidden'; sidebar.setAttribute('aria-hidden', 'false'); mobileMenuBtn?.setAttribute('aria-expanded', 'true');
  }

  function toggleSidebar() {
    if (!sidebar || window.innerWidth > 820) return;
    sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
  }

  function accordionState() {
    const state = readJSON(sessionStorage, ACCORDION_KEY, {});
    return state && typeof state === 'object' ? state : {};
  }

  function setGroupOpen(name, open, persist = true) {
    const config = GROUPS[name]; if (!config) return;
    const group = $(config.id); if (!group) return;
    const next = Boolean(open);
    group.classList.toggle('is-open', next);
    group.querySelector(':scope > [data-nav-toggle]')?.setAttribute('aria-expanded', String(next));
    if (persist) { const state = accordionState(); state[name] = next; writeJSON(sessionStorage, ACCORDION_KEY, state); }
  }

  function syncHierarchy(page) {
    const saved = accordionState();
    Object.entries(GROUPS).forEach(([name, config]) => {
      const active = config.pages.includes(page);
      setGroupOpen(name, active || Boolean(saved[name]), false);
      $(config.id)?.classList.toggle('has-active-child', active);
    });
    if (GROUPS.shopee.pages.includes(page) || GROUPS.tiktok.pages.includes(page)) setGroupOpen('market', true, false);
  }

  function updateMeta(target, page) {
    const title = target?.dataset.title || 'Dashboard';
    if (pageTitle) pageTitle.textContent = title;
    document.title = page === 'dashboard' ? 'ARSTORE Tools V3' : `${title} — ARSTORE Tools V3`;
  }

  function showPage(page, options = {}) {
    const { push = true, replace = false, scroll = true, remember = true, closeDrawer = true } = options;
    const target = $(`page-${page}`);
    if (!target || !ROUTES[page]) return false;
    if (remember) rememberCurrent(page);
    pages.forEach(node => node.classList.toggle('active', node === target));
    document.querySelectorAll('[data-page]').forEach(item => item.classList.toggle('active', item.dataset.page === page));
    syncHierarchy(page); updateMeta(target, page);
    if (!reduceMotion) {
      target.classList.remove('is-entering');
      requestAnimationFrame(() => { target.classList.add('is-entering'); setTimeout(() => target.classList.remove('is-entering'), 600); });
    }
    const route = ROUTES[page], current = normalizePath(location.pathname);
    if (push && route !== current) {
      const state = { page };
      replace ? history.replaceState(state, '', route) : history.pushState(state, '', route);
    }
    if (scroll) window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    if (closeDrawer) closeSidebar();
    document.dispatchEvent(new CustomEvent('arstore:page-change', { detail: { page } }));
    return true;
  }

  document.addEventListener('click', event => {
    const theme = event.target.closest('[data-theme-choice]');
    if (theme) { event.preventDefault(); applyTheme(theme.dataset.themeChoice); return; }

    const toggle = event.target.closest('[data-nav-toggle]');
    if (toggle) {
      event.preventDefault();
      const name = toggle.dataset.navToggle, config = GROUPS[name], group = config ? $(config.id) : null;
      if (group) setGroupOpen(name, !group.classList.contains('is-open'));
      return;
    }

    const trigger = event.target.closest('[data-page],[data-go]');
    if (!trigger) return;
    const page = trigger.dataset.page || trigger.dataset.go;
    if (!ROUTES[page]) return;
    event.preventDefault();
    showPage(page, { closeDrawer: window.innerWidth <= 820 });
  });

  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeSidebar(); });
  mobileMenuBtn?.addEventListener('click', event => { event.preventDefault(); toggleSidebar(); });
  overlay?.addEventListener('click', closeSidebar);

  resetBtn?.addEventListener('click', () => {
    if (!confirm('Reset data workspace lokal ARSTORE Tools V3?\n\nResearch, Fee, Profit, Market Tools, dan Decision Center akan dihapus dari browser ini.')) return;
    ['arstore_v2_research_state','arstore_v2_recent_researches','arstore_v2_fee_result','arstore_v2_profit_result','arstore_v2_profit_history','arstore_v2_profit_cost_preset','arstore_v2_profit_scenarios','arstore_v3_roas_result','arstore_v3_selling_price_result','arstore_v3_tiktok_roas_result','arstore_v3_tiktok_selling_price_result','arstore_v3_decision_result'].forEach(key => { try { localStorage.removeItem(key); } catch (_) {} });
    document.dispatchEvent(new CustomEvent('arstore:workspace-update', { detail: { source: 'reset' } }));
    showPage('dashboard');
  });

  window.addEventListener('popstate', () => showPage(pageFromPath(location.pathname), { push: false, scroll: false, remember: false }));
  window.addEventListener('resize', () => {
    if (window.innerWidth > 820) { closeSidebar(); sidebar?.setAttribute('aria-hidden', 'false'); }
    else if (!sidebar?.classList.contains('open')) sidebar?.setAttribute('aria-hidden', 'true');
  }, { passive: true });

  if (window.innerWidth <= 820) sidebar?.setAttribute('aria-hidden', 'true'); else sidebar?.setAttribute('aria-hidden', 'false');
  mobileMenuBtn?.setAttribute('aria-expanded', 'false');

  const initialPage = pageFromPath(location.pathname);
  history.replaceState({ page: initialPage }, '', ROUTES[initialPage]);
  showPage(initialPage, { push: false, scroll: false, remember: false, closeDrawer: false });
  window.ARSTORE_NAV = { showPage, openSidebar, closeSidebar };

  function loadScript(src, marker, onload) {
    const existing = document.querySelector(`script[data-${marker}]`);
    if (existing) { if (onload) existing.addEventListener('load', onload, { once: true }); return; }
    const script = document.createElement('script'); script.src = src; script.defer = true; script.dataset[marker.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = '1';
    if (onload) script.addEventListener('load', onload, { once: true }); document.body.appendChild(script);
  }

  loadScript('/js/fee-bootstrap.js', 'arstore-fee-bootstrap');
  loadScript('/js/profit-bootstrap.js', 'arstore-profit-bootstrap');
  loadScript('/js/v3-calculators.js', 'arstore-v3-calculators', () => loadScript('/js/v3-tools.js', 'arstore-v3-tools'));

  // Safety text patch: no stale Netlify hint can surface in the Vercel build.
  const researchMessage = $('researchMessage');
  if (researchMessage) {
    const cleanNetlifyText = () => {
      const value = researchMessage.textContent || '';
      if (/Netlify/i.test(value)) researchMessage.textContent = value.replace(/Netlify Dev/gi, 'Vercel Dev').replace(/Netlify/gi, 'Vercel');
    };
    new MutationObserver(cleanNetlifyText).observe(researchMessage, { childList: true, characterData: true, subtree: true });
  }
})();
