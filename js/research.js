(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const form = $('researchForm');
  if (!form) return;

  const els = {
    keyword: $('researchKeyword'), clearKeyword: $('clearKeywordBtn'), priceMin: $('filterPriceMin'), priceMax: $('filterPriceMax'), soldMin: $('filterSoldMin'), ratingMin: $('filterRatingMin'), pageSize: $('filterPageSize'), sort: $('filterSort'), advancedFilters: $('advancedFilters'), recentSearches: $('recentSearches'), recentSearchList: $('recentSearchList'), searchSourceFreshness: $('searchSourceFreshness'), keywordHistoryBadge: $('keywordHistoryBadge'), smartSuggestions: $('smartSuggestions'), smartSuggestionList: $('smartSuggestionList'),
    submit: $('researchSubmit'), message: $('researchMessage'), loading: $('researchLoading'), loadingText: $('researchLoadingText'), results: $('researchResults'), freshness: $('researchFreshness'),
    marketKeyword: $('marketKeyword'), productCount: $('marketProductCount'), medianPrice: $('marketMedianPrice'), sold30: $('marketSold30'), medianRating: $('marketMedianRating'),
    competitionScore: $('competitionScore'), competitionMeter: $('competitionMeter'), competitionLabel: $('competitionLabel'), opportunityScore: $('opportunityScore'), opportunityMeter: $('opportunityMeter'), opportunityLabel: $('opportunityLabel'), sweetSpot: $('marketSweetSpot'), rangeCaption: $('marketRangeCaption'),
    productList: $('productList'), resultSortNote: $('resultSortNote'), signalTitle: $('marketSignalTitle'), signalText: $('marketSignalText'), demandValue: $('demandValue'), competitionValue: $('competitionValue'), priceOpportunityValue: $('priceOpportunityValue'), demandBar: $('demandBar'), competitionBar: $('competitionBar'), priceOpportunityBar: $('priceOpportunityBar'),
    referenceCard: $('referenceCard'), referenceEmpty: $('referenceEmpty'), referenceSelected: $('referenceSelected'), referenceName: $('referenceName'), referenceMeta: $('referenceMeta'), referenceImage: $('referenceImage'), referenceImageFallback: $('referenceImageFallback'), statTime: $('statTimeValue'), updateTime: $('updateTimeValue'), freshnessStatus: $('freshnessStatus'),
    modal: $('researchModal'), detailRank: $('detailRank'), detailName: $('detailProductName'), detailShop: $('detailShopName'), detailImage: $('detailProductImage'), detailImageFallback: $('detailProductImageFallback'), detailMetrics: $('detailMetrics'), detailTrending: $('detailTrending'), detailBestSeller: $('detailBestSeller'), detailPricePosition: $('detailPricePosition'), detailStrengths: $('detailStrengths'), detailRisks: $('detailRisks'), detailLink: $('detailShopeeLink'), detailFreshness: $('detailFreshness'), useReference: $('useReferenceBtn'),
    quickPreview: $('quickPreview'), quickPreviewImage: $('quickPreviewImage'), quickPreviewImageFallback: $('quickPreviewImageFallback'), quickPreviewName: $('quickPreviewName'), quickPreviewShop: $('quickPreviewShop'), quickPreviewPrice: $('quickPreviewPrice'), quickPreviewSold: $('quickPreviewSold'), quickPreviewRating: $('quickPreviewRating'), quickPreviewRatings: $('quickPreviewRatings'), quickPreviewRevenue: $('quickPreviewRevenue'), quickPreviewTrending: $('quickPreviewTrending'), quickPreviewDetail: $('quickPreviewDetail'), quickPreviewReference: $('quickPreviewReference'), quickPreviewShopee: $('quickPreviewShopee')
  };

  const STORAGE_KEY = 'arstore_v2_research_state';
  const RECENT_KEY = 'arstore_v2_recent_researches';
  const state = { raw: null, keyword: '', products: [], market: null, selectedProduct: null, modalProduct: null, quickPreviewProduct: null, loadingTimers: [] };

  const clamp = (n, min = 0, max = 100) => Math.max(min, Math.min(max, Number.isFinite(Number(n)) ? Number(n) : min));
  const num = value => {
    if (value === null || value === undefined || value === '') return 0;
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    const cleaned = String(value).replace(/[^0-9.,-]/g, '').replace(/,/g, '');
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  };
  const first = (...values) => values.find(v => v !== undefined && v !== null && v !== '');
  const text = value => value === null || value === undefined ? '' : String(value).trim();
  const formatRp = value => `Rp${Math.round(num(value)).toLocaleString('id-ID')}`;
  const compact = value => new Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: 1 }).format(num(value));
  const formatRating = value => num(value) ? num(value).toFixed(1).replace('.', ',') : '—';
  const median = arr => {
    const values = arr.map(num).filter(v => Number.isFinite(v) && v > 0).sort((a,b) => a-b);
    if (!values.length) return 0;
    const mid = Math.floor(values.length / 2);
    return values.length % 2 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
  };
  const percentile = (arr, p) => {
    const values = arr.map(num).filter(v => v > 0).sort((a,b) => a-b);
    if (!values.length) return 0;
    const idx = (values.length - 1) * p;
    const lo = Math.floor(idx), hi = Math.ceil(idx);
    return values[lo] + ((values[hi] ?? values[lo]) - values[lo]) * (idx - lo);
  };
  const scoreRelative = (value, values) => {
    const valid = values.map(num).filter(v => v >= 0);
    if (!valid.length) return 0;
    const lo = Math.min(...valid), hi = Math.max(...valid);
    if (hi === lo) return value > 0 ? 75 : 0;
    return clamp(((num(value) - lo) / (hi - lo)) * 100);
  };
  const dateLabel = value => {
    if (!value) return 'Tidak tersedia';
    let d;
    if (typeof value === 'number' || /^\d{10,13}$/.test(String(value))) {
      const n = Number(value); d = new Date(n < 1e12 ? n * 1000 : n);
    } else d = new Date(value);
    if (Number.isNaN(d.getTime())) return text(value) || 'Tidak tersedia';
    return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(d);
  };

  const parseDate = value => {
    if (!value) return null;
    let d;
    if (typeof value === 'number' || /^\d{10,13}$/.test(String(value))) {
      const n = Number(value); d = new Date(n < 1e12 ? n * 1000 : n);
    } else d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  };
  const safeImage = value => {
    const v = text(value);
    if (!v) return '';
    if (/^https?:\/\//i.test(v) || /^data:image\//i.test(v)) return v;
    return '';
  };

  const decodeUrlCandidate = value => {
    let v = text(value);
    if (!v) return '';
    try {
      if (/^https?%3A%2F%2F/i.test(v)) v = decodeURIComponent(v);
    } catch (_) {}
    if (v.startsWith('//')) v = `https:${v}`;
    if (v.startsWith('/') && /(?:-i\.\d+\.\d+|\/product\/\d+\/\d+)/i.test(v)) v = `https://shopee.co.id${v}`;
    return v;
  };

  // Nexscope documents products[].productUrl as the product link. Treat that
  // explicit provider field as authoritative instead of requiring a particular
  // Shopee URL shape, because providers may return redirect/tracking URLs.
  const safeProviderProductUrl = value => {
    const candidate = decodeUrlCandidate(value);
    if (!candidate) return '';
    try {
      const u = new URL(candidate, location.origin);
      if (!/^https?:$/.test(u.protocol)) return '';
      // Never allow an accidental internal SPA/dashboard URL to masquerade as
      // a marketplace link.
      if (u.origin === location.origin) return '';
      return u.href;
    } catch (_) { return ''; }
  };

  const findShopeeProductUrl = (root, source) => {
    // Official Nexscope response field. Keep this first and do not over-validate.
    const official = safeProviderProductUrl(first(source.productUrl, root?.productUrl));
    if (official) return official;

    // Compatibility fallbacks for older/alternate provider shapes.
    const candidates = [
      source.product_url, source.itemUrl, source.item_url, source.detailUrl, source.detail_url,
      source.productLink, source.product_link, source.webUrl, source.web_url, source.link,
      root?.product_url, root?.itemUrl, root?.detailUrl, root?.productLink
    ];
    for (const value of candidates) {
      const valid = safeProviderProductUrl(value);
      if (valid) return valid;
    }

    // Canonical Shopee fallback. Nexscope documents `pid` as the product ID
    // and `shopId` as the store ID. Shopee's canonical product route accepts
    // /product/{shopId}/{productId}. Prefer explicit itemId when present, then
    // fall back to numeric pid so every analysed listing can still link out.
    const productId = text(first(
      source.itemId, source.item_id, root?.itemId, root?.item_id,
      source.pid, root?.pid
    ));
    const shopId = text(first(source.shopId, source.shop_id, source.shop?.shopId, root?.shopId, root?.shop_id));
    if (/^\d+$/.test(productId) && /^\d+$/.test(shopId)) {
      return `https://shopee.co.id/product/${shopId}/${productId}`;
    }
    return '';
  };

  const openShopeeProduct = product => {
    if (!product) return false;
    const url = safeProviderProductUrl(product.url);
    if (!url) {
      setMessage('Link produk dari provider tidak tersedia untuk listing ini.', 'error');
      return false;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
    return true;
  };
  const countUp = (el, target, formatter = v => Math.round(v).toLocaleString('id-ID'), duration = 650) => {
    if (!el) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce || duration <= 0) { el.textContent = formatter(target); return; }
    const start = performance.now();
    const from = 0;
    const frame = now => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = formatter(from + (target - from) * eased);
      if (t < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  };
  const animateBar = (el, value, delay = 80) => {
    if (!el) return;
    el.style.width = '0%';
    requestAnimationFrame(() => setTimeout(() => { el.style.width = `${clamp(value)}%`; }, delay));
  };
  const setImage = (img, fallback, src, alt = '') => {
    if (!img || !fallback) return;
    const url = safeImage(src);
    img.onload = () => { img.hidden = false; fallback.hidden = true; img.classList.add('image-loaded'); };
    img.onerror = () => { img.hidden = true; fallback.hidden = false; img.removeAttribute('src'); };
    if (url) { img.alt = alt || 'Gambar produk'; img.referrerPolicy = 'no-referrer'; img.src = url; }
    else { img.hidden = true; fallback.hidden = false; img.removeAttribute('src'); }
  };
  const freshnessInfo = value => {
    const d = parseDate(value);
    if (!d) return { label: 'Tidak tersedia', cls: 'unknown' };
    const hours = Math.max(0, (Date.now() - d.getTime()) / 36e5);
    if (hours <= 24) return { label: 'Fresh', cls: 'fresh' };
    if (hours <= 168) return { label: 'Perlu refresh', cls: 'stale' };
    return { label: 'Data lama', cls: 'old' };
  };
  const getRecent = () => { try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch (_) { return []; } };
  const saveRecent = keyword => {
    const clean = text(keyword); if (!clean) return;
    const list = [clean, ...getRecent().filter(x => String(x).toLowerCase() !== clean.toLowerCase())].slice(0, 5);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(list)); } catch (_) {}
    renderRecent();
  };
  function renderRecent() {
    const list = getRecent();
    if (!els.recentSearches || !els.recentSearchList) return;
    els.recentSearches.hidden = !list.length;
    els.recentSearchList.innerHTML = list.map(q => `<button type="button" data-recent="${escapeHtml(q)}">${escapeHtml(q)}</button>`).join('');
  }

  function setMessage(message = '', type = '') {
    els.message.textContent = message;
    els.message.className = `research-message${type ? ` ${type}` : ''}`;
  }

  function startLoading() {
    state.loadingTimers.forEach(clearTimeout); state.loadingTimers = [];
    els.loading.hidden = false; els.results.hidden = true; els.submit.disabled = true; setMessage('');
    els.submit.classList.add('is-loading');
    els.submit.querySelector('span').textContent = 'Menganalisis Shopee...';
    els.submit.querySelector('b').textContent = '↻';
    const steps = [...els.loading.querySelectorAll('.scan-steps span')];
    steps.forEach((step, idx) => { step.classList.remove('active','done'); step.dataset.step = String(idx + 1); });
    const phases = [
      [0, 'Menghubungkan ke data Shopee dan mencari produk yang sesuai keyword.'],
      [1, 'Membaca penjualan 30 hari, rating, ulasan, harga, dan omzet.'],
      [2, 'Menghitung Trending Score dan Best Seller Score ARSTORE.'],
      [3, 'Menyusun Market Opportunity dan rekomendasi pasar.']
    ];
    phases.forEach(([idx, msg], i) => {
      state.loadingTimers.push(setTimeout(() => {
        steps.forEach((step, n) => {
          step.classList.toggle('done', n < idx);
          step.classList.toggle('active', n === idx);
        });
        els.loadingText.textContent = msg;
      }, i * 1050));
    });
  }

  function stopLoading(success = false) {
    state.loadingTimers.forEach(clearTimeout); state.loadingTimers = [];
    if (success) {
      const steps = [...els.loading.querySelectorAll('.scan-steps span')];
      steps.forEach(step => { step.classList.remove('active'); step.classList.add('done'); });
      els.loadingText.textContent = 'Analisis selesai. Menampilkan hasil...';
    }
    window.setTimeout(() => { els.loading.hidden = true; }, success ? 260 : 0);
    els.submit.disabled = false;
    els.submit.classList.remove('is-loading');
    els.submit.querySelector('span').textContent = 'Analisis Sekarang';
    els.submit.querySelector('b').textContent = '→';
  }

  function walkForProducts(root) {
    // Nexscope's documented Shopee response is a direct { products: [...] } payload.
    // In practice some gateway layers can wrap that object or serialize it as text,
    // so we unwrap known containers and cautiously parse JSON-looking strings.
    const arrays = [];
    const visited = new WeakSet();
    const preferredKeys = ['products', 'productList', 'items', 'list', 'records', 'rows', 'resultList', 'dataList'];

    const productLike = item => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return false;
      const source = item.data || item.item || item.product || item;
      const keys = ['pid','productId','itemId','item_id','productName','title','itemName','name','price','minPrice','sold','estimateSold','historicalSold','payment','rating','ratings','productUrl'];
      return keys.some(key => source[key] !== undefined && source[key] !== null && source[key] !== '');
    };

    const addArray = (arr, bonus = 0, path = '') => {
      if (!Array.isArray(arr) || !arr.length) return;
      const objects = arr.filter(x => x && typeof x === 'object' && !Array.isArray(x));
      if (!objects.length) return;
      const productCount = objects.filter(productLike).length;
      arrays.push({ arr, score: productCount * 100 + objects.length + bonus, path });
    };

    function visit(node, depth = 0, path = 'root') {
      if (node === null || node === undefined || depth > 12) return;

      if (typeof node === 'string') {
        const trimmed = node.trim();
        if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
          try { visit(JSON.parse(trimmed), depth + 1, `${path}<json>`); } catch (_) {}
        }
        return;
      }

      if (typeof node !== 'object') return;
      if (visited.has(node)) return;
      visited.add(node);

      if (Array.isArray(node)) {
        addArray(node, 0, path);
        node.forEach((item, i) => visit(item, depth + 1, `${path}[${i}]`));
        return;
      }

      for (const key of preferredKeys) {
        if (Array.isArray(node[key])) addArray(node[key], key === 'products' ? 10000 : 3000, `${path}.${key}`);
      }

      // Common MCP / gateway wrappers.
      for (const key of ['structuredContent','data','result','output','response','body','content','payload']) {
        if (node[key] !== undefined) visit(node[key], depth + 1, `${path}.${key}`);
      }

      // Last-resort traversal for an undocumented wrapper shape.
      Object.entries(node).forEach(([key, value]) => {
        if (!preferredKeys.includes(key) && !['structuredContent','data','result','output','response','body','content','payload'].includes(key)) {
          visit(value, depth + 1, `${path}.${key}`);
        }
      });
    }

    visit(root);
    arrays.sort((a, b) => b.score - a.score);
    state.productArrayPath = arrays[0]?.path || '';
    return arrays[0]?.arr || [];
  }

  function normalizeProduct(item, idx) {
    const root = item || {};
    const source = root.data || root.item || root.product || root;
    const shop = source.shop || source.shopInfo || {};
    const price = num(first(source.price, source.currentPrice, source.salePrice, source.minPrice, source.priceMin, source.price_min));
    const sold30 = num(first(source.sold, source.sold30Days, source.monthlySold, source.sales30d, source.sales30Days, source.estimateSold));
    const historicalSold = num(first(source.historicalSold, source.totalSold, source.soldTotal, source.historical_sales));
    const rating = num(first(source.rating, source.ratingStar, source.itemRating, source.rating_star));
    const ratings = num(first(source.ratings, source.ratingCount, source.reviewCount, source.reviews, source.rating_count));
    const payment = num(first(source.payment, source.revenue30Days, source.revenue, source.gmv30d, source.salesAmount));
    return {
      id: text(first(source.pid, source.productId, source.itemId, source.item_id, source.id, `${idx}-${first(source.productName,source.title,source.name,'product')}`)),
      pid: text(first(source.pid, root.pid)),
      itemId: text(first(source.itemId, source.item_id, root.itemId, root.item_id)),
      shopId: text(first(source.shopId, source.shop_id, shop.shopId, root.shopId, root.shop_id)),
      name: text(first(source.productName, source.title, source.itemName, source.name, source.product_name, 'Produk Shopee')),
      shopName: text(first(source.shopName, source.sellerName, source.shop_name, source.merchantName, shop.name, shop.shopName, 'Toko tidak tersedia')),
      rawProductUrl: text(first(source.productUrl, root?.productUrl)),
      url: findShopeeProductUrl(root, source),
      price, minPrice: num(first(source.minPrice, source.priceMin, source.price_min, price)), maxPrice: num(first(source.maxPrice, source.priceMax, source.price_max, price)),
      sold30, historicalSold, rating, ratings, payment,
      category: text(first(source.categoryStructure, source.categoryName, source.category, source.catName)),
      isHotSales: Boolean(first(source.isHotSales, source.hotSales, false)),
      statTime: first(source.statTime, source.stat_time, source.statisticsTime),
      lastUpdate: first(source.lastModiTime, source.lastUpdateTime, source.updatedAt, source.last_modified),
      image: safeImage(first(source.imageUrl, source.imageURL, source.image, source.imageSrc, source.thumbnail, source.thumbnailUrl, source.cover, source.coverUrl, source.image_url, source.thumbUrl, source.picUrl, source.picture, source.productImage, source.mainImage, source.images?.[0], root.imageUrl, root.image)),
      raw: root
    };
  }

  function dedupeProducts(items) {
    const seen = new Set();
    return items.filter(p => {
      const key = p.url || p.id || `${p.name}|${p.shopName}|${p.price}`;
      if (seen.has(key) || !p.name || (!p.price && !p.sold30 && !p.historicalSold && !p.rating)) return false;
      seen.add(key); return true;
    });
  }

  function calculateScores(products) {
    const sales = products.map(p => p.sold30);
    const historical = products.map(p => p.historicalSold);
    const reviews = products.map(p => p.ratings);
    const revenues = products.map(p => p.payment);
    const prices = products.map(p => p.price).filter(Boolean);
    const medPrice = median(prices);
    const medRating = median(products.map(p => p.rating).filter(Boolean));

    products.forEach(p => {
      p.salesScore = scoreRelative(p.sold30, sales);
      const reviewVolume = scoreRelative(Math.log10(p.ratings + 1), reviews.map(v => Math.log10(v + 1)));
      const ratingQuality = p.rating ? clamp(((p.rating - 3.5) / 1.5) * 100) : 0;
      p.reviewScore = clamp(reviewVolume * .62 + ratingQuality * .38);
      p.ratingScore = ratingQuality;
      p.revenueScore = p.payment ? scoreRelative(p.payment, revenues) : scoreRelative(p.sold30 * p.price, sales.map((s,i) => s * (prices[i] || medPrice || 1)));
      const distance = medPrice > 0 ? Math.abs(p.price - medPrice) / medPrice : 0;
      p.priceScore = clamp(100 - distance * 120);
      p.trendingScore = Math.round(clamp(p.salesScore * .40 + p.reviewScore * .20 + p.ratingScore * .15 + p.revenueScore * .15 + p.priceScore * .10));
      const historyScore = scoreRelative(p.historicalSold || p.sold30, historical.some(Boolean) ? historical : sales);
      p.bestSellerScore = Math.round(clamp(historyScore * .50 + p.reviewScore * .30 + p.ratingScore * .20));
      p.pricePosition = medPrice ? ((p.price - medPrice) / medPrice) * 100 : 0;
    });

    return { medPrice, medRating };
  }

  function calculateMarket(products, basics) {
    const totalSold30 = products.reduce((sum,p) => sum + p.sold30, 0);
    const totalRevenue = products.reduce((sum,p) => sum + (p.payment || p.sold30 * p.price), 0);
    const sortedSales = [...products].sort((a,b) => b.sold30 - a.sold30);
    const top5Share = totalSold30 ? sortedSales.slice(0,5).reduce((s,p) => s + p.sold30,0) / totalSold30 : 0;
    const strongListings = products.length ? products.filter(p => p.trendingScore >= 75).length / products.length : 0;
    const reviewPressure = median(products.map(p => p.ratings)) > 1000 ? 1 : median(products.map(p => p.ratings)) / 1000;
    const competition = Math.round(clamp(35 + top5Share * 25 + strongListings * 25 + clamp(reviewPressure*100)*.15));
    const demand = Math.round(clamp(scoreRelative(totalSold30, [0, Math.max(totalSold30, 1)]) * .35 + median(products.map(p=>p.trendingScore)) * .65));
    const q25 = percentile(products.map(p=>p.price), .25), q75 = percentile(products.map(p=>p.price), .75);
    const priceSpread = basics.medPrice ? (q75 - q25) / basics.medPrice : 0;
    const priceOpportunity = Math.round(clamp(82 - Math.abs(priceSpread - .35) * 65));
    const opportunity = Math.round(clamp(demand * .48 + (100 - competition) * .32 + priceOpportunity * .20));
    const validPrices = products.map(p=>p.price).filter(v => v > 0);
    return { totalSold30, totalRevenue, competition, demand, priceOpportunity, opportunity, q25, q75, minPrice: validPrices.length ? Math.min(...validPrices) : 0, maxPrice: validPrices.length ? Math.max(...validPrices) : 0 };
  }

  function statusForScore(score) {
    if (score >= 90) return 'Sangat kuat'; if (score >= 80) return 'Kuat'; if (score >= 70) return 'Menarik'; if (score >= 60) return 'Sedang'; return 'Lemah';
  }
  function trendTier(score) {
    const n = clamp(score);
    if (n <= 30) return { cls: 'tier-low', label: 'LOW' };
    if (n <= 50) return { cls: 'tier-weak', label: 'WEAK' };
    if (n <= 70) return { cls: 'tier-medium', label: 'MEDIUM' };
    if (n <= 85) return { cls: 'tier-high', label: 'HIGH' };
    return { cls: 'tier-very-high', label: 'VERY HIGH' };
  }

  function competitionText(score) { return score >= 80 ? 'Tinggi' : score >= 60 ? 'Sedang–tinggi' : score >= 40 ? 'Sedang' : 'Rendah'; }
  function opportunityText(score) { return score >= 80 ? 'Sangat menarik' : score >= 70 ? 'Menarik' : score >= 55 ? 'Perlu seleksi' : 'Berisiko'; }

  function sortProducts(products, mode) {
    const copy = [...products];
    const key = mode === 'sold' ? 'sold30' : mode === 'historicalSold' ? 'historicalSold' : mode === 'ratings' ? 'ratings' : mode === 'rating' ? 'rating' : mode === 'payment' ? 'payment' : 'trendingScore';
    return copy.sort((a,b) => num(b[key]) - num(a[key]));
  }

  function renderProducts() {
    let sorted = sortProducts(state.products, els.sort.value);
    const soldMin = num(els.soldMin?.value);
    if (soldMin) sorted = sorted.filter(p => p.sold30 >= soldMin);
    els.productList.innerHTML = '';
    sorted.forEach((p, idx) => {
      const row = document.createElement('article');
      row.className = `product-row${state.selectedProduct?.id === p.id ? ' selected' : ''}`;
      row.dataset.id = p.id;
      row.tabIndex = 0;
      row.setAttribute('role', 'button');
      row.setAttribute('aria-label', `Preview cepat ${p.name}`);
      row.style.setProperty('--row-delay', `${Math.min(idx, 12) * 55}ms`);
      const image = safeImage(p.image);
      const tier = trendTier(p.trendingScore);
      const shopeeUrl = p.url || safeProviderProductUrl(p.rawProductUrl);
      row.innerHTML = `
        <div class="product-rank">#${idx + 1}</div>
        <div class="product-thumb"><span>AR</span>${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(p.name)}" loading="lazy" referrerpolicy="no-referrer" />` : ''}</div>
        <div class="product-main">
          <h4 title="${escapeHtml(p.name)}">${escapeHtml(p.name)}</h4>
          <div class="product-sub"><span class="product-price">${formatRp(p.price)}</span><span class="product-meta meta-sales">🔥 ${compact(p.sold30)} terjual / 30D</span><span class="product-meta meta-rating">★ ${formatRating(p.rating)}</span><span class="product-meta meta-reviews">${compact(p.ratings)} rating</span></div>
          <div class="product-shop"><span class="shop-name">${escapeHtml(p.shopName)}</span>${p.payment ? `<span class="shop-sep"> · </span><span class="revenue-meta">Omzet 30D ${formatRp(p.payment)}</span>` : ''}</div>
        </div>
        <div class="product-scores"><div class="trend-score ${tier.cls}"><span>TRENDING · ${tier.label}</span><strong data-score-target="${p.trendingScore}">0</strong></div><div class="product-actions"><button type="button" class="detail-action" data-detail="${escapeHtml(p.id)}"><span class="action-icon">↗</span>Analisis Detail</button><button type="button" class="use-ref" data-reference="${escapeHtml(p.id)}"><span class="action-icon">✓</span>${state.selectedProduct?.id === p.id ? 'Referensi Dipilih' : 'Gunakan sebagai Referensi'}</button>${shopeeUrl ? `<a class="shopee-action" href="${escapeHtml(shopeeUrl)}" target="_blank" rel="noopener noreferrer" data-external-shopee="${escapeHtml(p.id)}"><span class="action-icon">↗</span>Lihat di Shopee</a>` : ''}</div></div>`;
      const img = row.querySelector('.product-thumb img');
      if (img) { img.addEventListener('load', () => row.querySelector('.product-thumb')?.classList.add('has-image'), { once:true }); img.addEventListener('error', () => img.remove(), { once:true }); }
      els.productList.appendChild(row);
      const scoreEl = row.querySelector('[data-score-target]');
      setTimeout(() => countUp(scoreEl, p.trendingScore, v => String(Math.round(v)), 520), Math.min(idx, 10) * 55 + 120);
    });
    if (!sorted.length) els.productList.innerHTML = '<div class="empty-filter-result">Tidak ada produk yang lolos filter cepat. Longgarkan filter untuk melihat hasil.</div>';
    els.resultSortNote.textContent = els.sort.options[els.sort.selectedIndex]?.text || 'Ranking ARSTORE';
  }

  function escapeHtml(value) { return text(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }

  function renderMarket() {
    const m = state.market;
    els.marketKeyword.textContent = state.keyword;
    countUp(els.productCount, state.products.length, v => Math.round(v).toLocaleString('id-ID'));
    countUp(els.medianPrice, m.medPrice, v => formatRp(v));
    countUp(els.sold30, m.totalSold30, v => compact(v));
    countUp(els.medianRating, m.medRating, v => num(v).toFixed(1).replace('.', ','));
    countUp(els.competitionScore, m.competition, v => `${Math.round(v)}/100`);
    animateBar(els.competitionMeter, m.competition, 120);
    els.competitionLabel.textContent = `${competitionText(m.competition)} · semakin tinggi semakin ketat`;
    countUp(els.opportunityScore, m.opportunity, v => `${Math.round(v)}/100`);
    animateBar(els.opportunityMeter, m.opportunity, 180);
    els.opportunityLabel.textContent = `${opportunityText(m.opportunity)} · market-only score`;
    els.sweetSpot.textContent = m.q25 && m.q75 ? `${formatRp(m.q25)} – ${formatRp(m.q75)}` : formatRp(m.medPrice);
    els.rangeCaption.textContent = m.minPrice && m.maxPrice ? `Range terpantau ${formatRp(m.minPrice)} – ${formatRp(m.maxPrice)}` : 'Range harga tidak lengkap';
    countUp(els.demandValue, m.demand, v => String(Math.round(v))); animateBar(els.demandBar, m.demand, 180);
    countUp(els.competitionValue, m.competition, v => String(Math.round(v))); animateBar(els.competitionBar, m.competition, 240);
    countUp(els.priceOpportunityValue, m.priceOpportunity, v => String(Math.round(v))); animateBar(els.priceOpportunityBar, m.priceOpportunity, 300);
    els.signalTitle.textContent = m.opportunity >= 80 ? 'Market sangat menarik' : m.opportunity >= 70 ? 'Ada peluang yang layak diuji' : m.opportunity >= 55 ? 'Peluang ada, seleksi ketat' : 'Pasar perlu kehati-hatian';
    els.signalText.textContent = `Demand ${m.demand}/100 dengan kompetisi ${m.competition}/100. Score ini baru membaca kondisi pasar; margin dan kelayakan iklan dihitung setelah Fee Engine dan Kalkulator Profit.`;

    const competitionCard = els.competitionScore?.closest('.score-card');
    if (competitionCard) competitionCard.dataset.level = m.competition >= 80 ? 'high' : m.competition >= 60 ? 'medium' : 'low';
    const opportunityCard = els.opportunityScore?.closest('.score-card');
    if (opportunityCard) opportunityCard.dataset.level = m.opportunity >= 75 ? 'high' : m.opportunity >= 55 ? 'medium' : 'low';

    const statCandidates = state.products.map(p => p.statTime).filter(Boolean);
    const updateCandidates = state.products.map(p => p.lastUpdate).filter(Boolean);
    const stat = statCandidates[0], update = updateCandidates[0];
    els.statTime.textContent = dateLabel(stat); els.updateTime.textContent = dateLabel(update);
    const fresh = freshnessInfo(update || stat);
    if (els.freshnessStatus) { els.freshnessStatus.textContent = fresh.label; els.freshnessStatus.className = `freshness-status ${fresh.cls}`; }
    const freshText = update ? `Update: ${dateLabel(update)}` : stat ? `Statistik: ${dateLabel(stat)}` : 'Timestamp tidak tersedia';
    els.freshness.textContent = freshText;
    if (els.searchSourceFreshness) els.searchSourceFreshness.textContent = `Shopee Indonesia · ${fresh.label}${update || stat ? ` · ${dateLabel(update || stat)}` : ''}`;
  }

  function showQuickPreview(product) {
    if (!product || !els.quickPreview) return;
    state.quickPreviewProduct = product;
    els.quickPreviewName.textContent = product.name;
    els.quickPreviewShop.textContent = product.shopName || 'Toko tidak tersedia';
    els.quickPreviewPrice.textContent = formatRp(product.price);
    els.quickPreviewSold.textContent = `${compact(product.sold30)} / 30D`;
    els.quickPreviewRating.textContent = `★ ${formatRating(product.rating)}`;
    els.quickPreviewRatings.textContent = compact(product.ratings);
    els.quickPreviewRevenue.textContent = product.payment ? formatRp(product.payment) : '—';
    const tier = trendTier(product.trendingScore);
    els.quickPreviewTrending.textContent = `${product.trendingScore}/100 · ${tier.label}`;
    const trendCard = els.quickPreviewTrending.closest('.quick-preview-trend');
    if (trendCard) { trendCard.className = `quick-preview-trend ${tier.cls}`; }
    setImage(els.quickPreviewImage, els.quickPreviewImageFallback, product.image, product.name);
    const url = product.url || safeProviderProductUrl(product.rawProductUrl);
    if (url) { els.quickPreviewShopee.href = url; els.quickPreviewShopee.hidden = false; }
    else { els.quickPreviewShopee.hidden = true; els.quickPreviewShopee.removeAttribute('href'); }
    els.quickPreviewReference.innerHTML = `<span class="action-icon">✓</span>${state.selectedProduct?.id === product.id ? 'Referensi Dipilih' : 'Gunakan sebagai Referensi'}`;
    els.quickPreview.hidden = false;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => els.quickPreview.classList.add('is-open'));
  }

  function closeQuickPreview({ restoreScroll = true } = {}) {
    if (!els.quickPreview || els.quickPreview.hidden) return;
    els.quickPreview.classList.remove('is-open');
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    window.setTimeout(() => {
      els.quickPreview.hidden = true;
      if (restoreScroll && els.modal.hidden) document.body.style.overflow = '';
    }, reduce ? 0 : 180);
  }

  function showModal(product) {
    if (!product) return;
    state.modalProduct = product;
    const sorted = sortProducts(state.products, 'trending');
    const rank = sorted.findIndex(p => p.id === product.id) + 1;
    els.detailRank.textContent = `#${rank || '—'}`; els.detailName.textContent = product.name;
    const detailUrl = product.url || safeProviderProductUrl(product.rawProductUrl);
    els.detailShop.innerHTML = detailUrl ? `<span>${escapeHtml(product.shopName)}</span><a class="detail-shop-link" href="${escapeHtml(detailUrl)}" target="_blank" rel="noopener noreferrer">Lihat listing ↗</a>` : `<span>${escapeHtml(product.shopName)}</span>`;
    setImage(els.detailImage, els.detailImageFallback, product.image, product.name);
    const metrics = [
      ['Harga', formatRp(product.price)], ['Terjual 30D', compact(product.sold30)], ['Total terjual', product.historicalSold ? compact(product.historicalSold) : '—'], ['Rating', product.rating ? `★ ${formatRating(product.rating)}` : '—'], ['Jumlah rating', compact(product.ratings)], ['Omzet 30D', product.payment ? formatRp(product.payment) : '—'], ['Statistik', dateLabel(product.statTime)], ['Update', dateLabel(product.lastUpdate)]
    ];
    els.detailMetrics.innerHTML = metrics.map(([k,v]) => `<article><span>${k}</span><strong>${escapeHtml(v)}</strong></article>`).join('');
    const detailTier = trendTier(product.trendingScore);
    els.detailTrending.textContent = `${product.trendingScore}/100 · ${detailTier.label}`;
    const trendCard = els.detailTrending.closest('article');
    if (trendCard) trendCard.className = `modal-score-card modal-trending ${detailTier.cls}`;
    els.detailBestSeller.textContent = `${product.bestSellerScore}/100`;
    const bestCard = els.detailBestSeller.closest('article');
    if (bestCard) bestCard.className = 'modal-score-card modal-best-seller';
    let priceClass = 'near';
    let priceText = 'Dekat median';
    if (product.pricePosition > 8) { priceClass = 'above'; priceText = `${Math.abs(product.pricePosition).toFixed(0)}% di atas median`; }
    else if (product.pricePosition < -8) { priceClass = 'below'; priceText = `${Math.abs(product.pricePosition).toFixed(0)}% di bawah median`; }
    els.detailPricePosition.textContent = priceText;
    const priceCard = els.detailPricePosition.closest('article');
    if (priceCard) priceCard.className = `modal-score-card modal-price-position ${priceClass}`;
    const modalFresh = freshnessInfo(product.lastUpdate || product.statTime);
    if (els.detailFreshness) { els.detailFreshness.textContent = `${modalFresh.label}${product.lastUpdate || product.statTime ? ` · ${dateLabel(product.lastUpdate || product.statTime)}` : ''}`; els.detailFreshness.className = `detail-freshness ${modalFresh.cls}`; }
    const strengths = [];
    if (product.salesScore >= 75) strengths.push('Penjualan 30 hari termasuk kelompok terkuat pada hasil pencarian.');
    if (product.rating >= 4.7) strengths.push('Rating sangat kuat dan membantu social proof.');
    if (product.reviewScore >= 75) strengths.push('Volume rating/ulasan relatif tinggi dibanding kompetitor.');
    if (product.priceScore >= 75) strengths.push('Harga berada dekat pusat pasar yang terpantau.');
    if (!strengths.length) strengths.push('Belum ada sinyal dominan; gunakan sebagai pembanding tambahan.');
    const risks = [];
    if (state.market.competition >= 75) risks.push('Kompetisi keyword tinggi; diferensiasi produk akan penting.');
    if (product.pricePosition < -25) risks.push('Harga jauh di bawah median dan berpotensi memicu tekanan margin.');
    if (product.pricePosition > 35) risks.push('Harga jauh di atas median sehingga perlu value proposition yang kuat.');
    if (product.rating && product.rating < 4.5) risks.push('Rating relatif rendah untuk listing dengan performa kuat.');
    if (!risks.length) risks.push('Tidak ada risiko besar yang terdeteksi dari field marketplace yang tersedia.');
    els.detailStrengths.innerHTML = strengths.map(x => `<li>${escapeHtml(x)}</li>`).join(''); els.detailRisks.innerHTML = risks.map(x => `<li>${escapeHtml(x)}</li>`).join('');
    const validProductUrl = detailUrl;
    if (validProductUrl) { els.detailLink.href = validProductUrl; els.detailLink.hidden = false; }
    else { els.detailLink.removeAttribute('href'); els.detailLink.hidden = true; }
    els.modal.hidden = false; document.body.style.overflow = 'hidden'; document.body.classList.add('modal-open'); requestAnimationFrame(() => els.modal.classList.add('is-open'));
  }

  function closeModal() {
    if (els.modal.hidden) return;
    els.modal.classList.remove('is-open');
    document.body.classList.remove('modal-open');
    window.setTimeout(() => { els.modal.hidden = true; document.body.style.overflow = ''; }, window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 0 : 190);
  }

  function selectReference(product, { close = true } = {}) {
    if (!product) return;
    state.selectedProduct = product;
    const payload = {
      keyword: state.keyword,
      referenceProduct: { id: product.id, itemId: product.itemId, shopId: product.shopId, name: product.name, shopName: product.shopName, url: product.url, image: product.image, price: product.price, sold30: product.sold30, historicalSold: product.historicalSold, rating: product.rating, ratings: product.ratings, payment: product.payment },
      market: { minPrice: state.market.minPrice, medianPrice: state.market.medPrice, maxPrice: state.market.maxPrice, sweetSpotLow: state.market.q25, sweetSpotHigh: state.market.q75, competitionScore: state.market.competition, marketOpportunityScore: state.market.opportunity },
      trendingScore: product.trendingScore,
      bestSellerScore: product.bestSellerScore,
      statTime: product.statTime || null,
      lastUpdateTime: product.lastUpdate || null,
      savedAt: new Date().toISOString()
    };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(payload)); } catch (_) {}
    renderReference(payload); renderProducts(); updateDashboardReference(payload); setMessage('Produk referensi disimpan. Step 01 selesai dan siap dilanjutkan ke Fee Engine.', 'success');
    if (close) closeModal();
  }

  function renderReference(payload) {
    if (!payload?.referenceProduct) { els.referenceEmpty.hidden = false; els.referenceSelected.hidden = true; els.referenceCard?.classList.remove('has-reference'); return; }
    els.referenceEmpty.hidden = true; els.referenceSelected.hidden = false; els.referenceCard?.classList.add('has-reference');
    els.referenceName.textContent = payload.referenceProduct.name; els.referenceMeta.textContent = `${formatRp(payload.referenceProduct.price)} · Trending ${payload.trendingScore}/100 · Market ${payload.market.marketOpportunityScore}/100`;
    setImage(els.referenceImage, els.referenceImageFallback, payload.referenceProduct.image, payload.referenceProduct.name);
    els.referenceSelected.classList.remove('reference-reveal'); void els.referenceSelected.offsetWidth; els.referenceSelected.classList.add('reference-reveal');
  }

  function updateDashboardReference(payload) {
    const activePanel = document.querySelector('#page-dashboard .active-analysis');
    if (activePanel) {
      const h3 = activePanel.querySelector('.panel-topline h3'); const badge = activePanel.querySelector('.status-badge'); const strong = activePanel.querySelector('.empty-state-line strong'); const p = activePanel.querySelector('.empty-state-line p');
      if (h3) h3.textContent = payload.keyword; if (badge) { badge.textContent = 'Step 01 selesai'; badge.className = 'status-badge'; }
      if (strong) strong.textContent = payload.referenceProduct.name; if (p) p.textContent = `${formatRp(payload.referenceProduct.price)} · Trending ${payload.trendingScore}/100 · Market Opportunity ${payload.market.marketOpportunityScore}/100`;
    }
    const progress = document.querySelector('#page-dashboard .progress-panel');
    if (progress) { const h3 = progress.querySelector('h3'), pct = progress.querySelector('.progress-percent'), bar = progress.querySelector('.progress-track span'), dot = progress.querySelector('.progress-dots button[data-go="research"] span'); if(h3) h3.textContent='1 dari 6 selesai'; if(pct) pct.textContent='17%'; if(bar) bar.style.width='16.67%'; if(dot){dot.style.background='rgba(46,204,140,.12)';dot.style.borderColor='rgba(46,204,140,.32)';dot.style.color='#78deb5';} }
  }

  async function runResearch() {
    const keyword = els.keyword.value.trim();
    if (keyword.length < 2) return setMessage('Masukkan keyword produk minimal 2 karakter.', 'error');
    const min = num(els.priceMin.value), max = num(els.priceMax.value);
    if (min && max && min > max) return setMessage('Harga minimum tidak boleh lebih besar dari harga maksimum.', 'error');

    state.keyword = keyword; saveRecent(keyword); startLoading();
    const payload = { keyword, station: 'ID', page: 1, pageSize: Number(els.pageSize.value) || 20, orderBy: els.sort.value === 'trending' ? 'sold' : els.sort.value, orderByType: 'DESC' };
    if (els.soldMin?.value) payload.soldMin = Number(els.soldMin.value);
    if (min) payload.priceMin = min; if (max) payload.priceMax = max; if (els.ratingMin.value) payload.ratingMin = Number(els.ratingMin.value);

    try {
      const response = await fetch('/api/shopee-research', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      let data = null; try { data = await response.json(); } catch (_) {}
      if (!response.ok) throw new Error(data?.message || `HTTP ${response.status}`);
      state.raw = data;
      const rawProducts = Array.isArray(data?.products) ? data.products : walkForProducts(data);
      let products = dedupeProducts(rawProducts.map(normalizeProduct));
      const soldMin = num(els.soldMin?.value);
      if (soldMin) products = products.filter(p => p.sold30 >= soldMin);
      if (!products.length) {
        const total = num(first(data?.total, data?.totalSize, data?.totalCount));
        if (Array.isArray(data?.products) && data.products.length === 0) {
          throw new Error(`Shopee tidak mengembalikan produk untuk keyword/filter ini${total ? ` (total provider: ${total})` : ''}. Coba keyword lebih umum atau longgarkan filter.`);
        }
        const keys = data && typeof data === 'object' ? Object.keys(data).slice(0, 10).join(', ') : typeof data;
        throw new Error(`Response provider diterima, tetapi format listing belum dikenali. Struktur teratas: ${keys || 'kosong'}.`);
      }
      const basics = calculateScores(products); const market = calculateMarket(products, basics);
      state.products = products; state.market = { ...basics, ...market };
      renderMarket(); renderProducts(); els.results.hidden = false;
      els.results.classList.remove('results-enter'); void els.results.offsetWidth; els.results.classList.add('results-enter');
      setMessage(`${products.length} produk berhasil dianalisis dari data provider Shopee.`, 'success');
      stopLoading(true);
      return;
    } catch (error) {
      els.results.hidden = true;
      const localHint = location.hostname === 'localhost' || location.protocol === 'file:' ? ' Jika sedang test lokal, jalankan project dengan Netlify Dev agar /api/shopee-research aktif.' : '';
      setMessage(`Gagal mengambil data: ${error?.message || 'Request gagal.'}${localHint}`, 'error');
    } finally { if (els.submit.disabled) stopLoading(false); }
  }

  let researchRequestRunning = false;
  const triggerResearch = async e => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (researchRequestRunning || els.submit.disabled) return;
    researchRequestRunning = true;
    try { await runResearch(); } finally { researchRequestRunning = false; }
  };
  // Direct button listener for reliable mouse/touch activation, while the form
  // submit listener keeps Enter-key submission working.
  els.submit.addEventListener('click', triggerResearch);
  form.addEventListener('submit', triggerResearch);
  document.querySelectorAll('[data-example]').forEach(btn => btn.addEventListener('click', () => { els.keyword.value = btn.dataset.example; els.keyword.focus(); }));
  els.keyword.addEventListener('input', () => {
    const value = els.keyword.value.trim();
    if (els.clearKeyword) els.clearKeyword.hidden = !value;
    const recent = getRecent();
    if (els.keywordHistoryBadge) els.keywordHistoryBadge.hidden = !value || !recent.some(q => String(q).toLowerCase() === value.toLowerCase());
    if (els.smartSuggestions && els.smartSuggestionList) {
      const words = value.split(/\s+/).filter(Boolean);
      if (value.length >= 3) {
        const candidates = [`${value} terbaru`, `${value} premium`, `${value} murah`].filter((x,i,a) => a.indexOf(x) === i).slice(0,3);
        els.smartSuggestionList.innerHTML = candidates.map(q => `<button type="button" data-suggest="${escapeHtml(q)}">${escapeHtml(q)}</button>`).join('');
        els.smartSuggestions.hidden = false;
      } else { els.smartSuggestions.hidden = true; els.smartSuggestionList.innerHTML = ''; }
    }
  });
  els.clearKeyword?.addEventListener('click', () => { els.keyword.value = ''; els.clearKeyword.hidden = true; els.keyword.focus(); });
  els.recentSearchList?.addEventListener('click', e => { const btn = e.target.closest('[data-recent]'); if (!btn) return; els.keyword.value = btn.dataset.recent; els.clearKeyword.hidden = false; els.keyword.focus(); });
  els.smartSuggestionList?.addEventListener('click', e => { const btn = e.target.closest('[data-suggest]'); if (!btn) return; els.keyword.value = btn.dataset.suggest; els.clearKeyword.hidden = false; els.smartSuggestions.hidden = true; els.keyword.focus(); });
  document.querySelectorAll('[data-quick]').forEach(btn => btn.addEventListener('click', () => {
    btn.classList.toggle('active');
    const key = btn.dataset.quick;
    if (key === 'rating47') els.ratingMin.value = btn.classList.contains('active') ? '4.7' : '';
    if (key === 'sold1000') els.soldMin.value = btn.classList.contains('active') ? '1000' : '';
    if (key === 'under100k') els.priceMax.value = btn.classList.contains('active') ? '100000' : '';
    if (key === 'top20') els.pageSize.value = '20';
  }));
  renderRecent();
  // Move modal to document.body so position:fixed is always viewport-centered, even when page transitions use transforms.
  if (els.modal && els.modal.parentElement !== document.body) document.body.appendChild(els.modal);
  if (els.quickPreview && els.quickPreview.parentElement !== document.body) document.body.appendChild(els.quickPreview);
  $('reanalyzeBtn')?.addEventListener('click', runResearch);
  els.sort.addEventListener('change', () => { if (state.products.length) renderProducts(); });
  els.productList.addEventListener('click', e => {
    const shopeeLink = e.target.closest('a.shopee-action');
    if (shopeeLink) { e.stopPropagation(); return; }
    const detailBtn = e.target.closest('[data-detail]');
    const refBtn = e.target.closest('[data-reference]');
    if (detailBtn) { e.preventDefault(); e.stopPropagation(); showModal(state.products.find(p => p.id === detailBtn.dataset.detail)); return; }
    if (refBtn) { e.preventDefault(); e.stopPropagation(); selectReference(state.products.find(p => p.id === refBtn.dataset.reference), { close: false }); return; }
    const row = e.target.closest('.product-row[data-id]');
    if (row) showQuickPreview(state.products.find(p => p.id === row.dataset.id));
  });
  els.productList.addEventListener('keydown', e => {
    if (!['Enter',' '].includes(e.key) || e.target.closest('button,a')) return;
    const row = e.target.closest('.product-row[data-id]');
    if (!row) return;
    e.preventDefault();
    showQuickPreview(state.products.find(p => p.id === row.dataset.id));
  });
  document.querySelectorAll('[data-close-quick-preview]').forEach(el => el.addEventListener('click', () => closeQuickPreview()));
  els.quickPreviewDetail?.addEventListener('click', () => {
    const product = state.quickPreviewProduct;
    closeQuickPreview({ restoreScroll: false });
    window.setTimeout(() => showModal(product), window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 0 : 120);
  });
  els.quickPreviewReference?.addEventListener('click', () => {
    const product = state.quickPreviewProduct;
    selectReference(product, { close: false });
    closeQuickPreview();
  });
  els.quickPreviewShopee?.addEventListener('click', e => e.stopPropagation());
  document.querySelectorAll('[data-close-modal]').forEach(el => el.addEventListener('click', closeModal));
  els.useReference.addEventListener('click', () => selectReference(state.modalProduct));

  // External Shopee links are native anchors and must never be consumed by
  // the SPA/card click handlers on desktop, Android, or iOS/Safari.
  document.addEventListener('click', e => {
    const link = e.target.closest('a.shopee-action, a.modal-shopee-btn, a.detail-shop-link');
    if (!link) return;
    e.stopPropagation();
  }, true);

  document.addEventListener('keydown', e => { if (e.key !== 'Escape') return; if (els.quickPreview && !els.quickPreview.hidden) closeQuickPreview(); else if (!els.modal.hidden) closeModal(); });
  $('continueFeeBtn')?.addEventListener('click', () => document.querySelector('[data-page="fee"]')?.click());
  $('clearReferenceBtn')?.addEventListener('click', () => { state.selectedProduct = null; try { localStorage.removeItem(STORAGE_KEY); } catch (_) {} renderReference(null); renderProducts(); setMessage('Referensi dilepas. Hasil analisis masih tersedia.', ''); });

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (saved?.referenceProduct) { renderReference(saved); updateDashboardReference(saved); }
  } catch (_) {}
})();
