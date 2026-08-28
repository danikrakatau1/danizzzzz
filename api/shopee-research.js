function parseJsonish(value) {
  if (typeof value !== 'string') return value;
  let text = value.trim();
  if (!text) return value;
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  }
  if (!((text.startsWith('{') && text.endsWith('}')) || (text.startsWith('[') && text.endsWith(']')))) return value;
  try { return JSON.parse(text); } catch (_) { return value; }
}

function productLike(item) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return false;
  const source = item.data || item.item || item.product || item;
  const keys = [
    'pid','productId','itemId','item_id','productName','title','itemName','name',
    'price','minPrice','maxPrice','sold','estimateSold','historicalSold','payment',
    'rating','ratings','productUrl','imageUrl','shopId'
  ];
  return keys.some(key => source?.[key] !== undefined && source?.[key] !== null && source?.[key] !== '');
}

function normalizeProviderPayload(input) {
  const visited = new WeakSet();
  const candidates = [];
  const preferredArrays = ['products','productList','items','list','records','rows','resultList','dataList'];
  const wrapperKeys = ['structuredContent','data','result','output','response','body','content','payload','text','contentText'];

  function addArray(arr, path, bonus = 0) {
    if (!Array.isArray(arr) || !arr.length) return;
    const objects = arr.filter(x => x && typeof x === 'object' && !Array.isArray(x));
    if (!objects.length) return;
    const matches = objects.filter(productLike).length;
    candidates.push({ arr, path, score: matches * 1000 + objects.length + bonus });
  }

  function visit(raw, depth = 0, path = 'root') {
    if (raw === null || raw === undefined || depth > 14) return;
    const node = parseJsonish(raw);
    if (typeof node !== 'object' || node === null) return;
    if (visited.has(node)) return;
    visited.add(node);

    if (Array.isArray(node)) {
      addArray(node, path);
      node.forEach((item, i) => visit(item, depth + 1, `${path}[${i}]`));
      return;
    }

    for (const key of preferredArrays) {
      if (Array.isArray(node[key])) addArray(node[key], `${path}.${key}`, key === 'products' ? 100000 : 10000);
    }

    for (const key of wrapperKeys) {
      if (node[key] !== undefined) visit(node[key], depth + 1, `${path}.${key}`);
    }

    Object.entries(node).forEach(([key, value]) => {
      if (!preferredArrays.includes(key) && !wrapperKeys.includes(key)) visit(value, depth + 1, `${path}.${key}`);
    });
  }

  visit(input);
  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];
  if (!best || !best.arr.some(productLike)) return null;

  const metaSources = [];
  let cursor = parseJsonish(input);
  for (let i = 0; i < 8 && cursor && typeof cursor === 'object' && !Array.isArray(cursor); i += 1) {
    metaSources.push(cursor);
    const next = ['data','structuredContent','result','output','response','payload']
      .map(key => parseJsonish(cursor[key]))
      .find(value => value && typeof value === 'object' && !Array.isArray(value));
    if (!next || next === cursor) break;
    cursor = next;
  }

  const pick = (...keys) => {
    for (const source of metaSources) {
      for (const key of keys) {
        if (source?.[key] !== undefined && source?.[key] !== null && source?.[key] !== '') return source[key];
      }
    }
    return undefined;
  };

  return {
    products: best.arr,
    total: pick('total','totalSize','totalCount','count'),
    totalSize: pick('totalSize','total','totalCount','count'),
    page: pick('page','pageIndex'),
    pageSize: pick('pageSize','limit'),
    dataSnapshotMonth: pick('dataSnapshotMonth'),
    statTime: pick('statTime','statisticsTime'),
    sourceType: pick('sourceType'),
    sourceTool: pick('sourceTool','toolName'),
    _arstoreNormalized: true,
    _arstoreProductPath: best.path
  };
}

function providerBusinessError(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return '';
  const code = data.code ?? data.errcode ?? data.status;
  const msg = String(data.msg || data.message || data.errmsg || '').trim();
  const codeText = String(code ?? '').toLowerCase();
  const success = code === undefined || code === null || code === '' || code === 0 || code === 1 || code === 200 || codeText === '0' || codeText === '1' || codeText === '200' || codeText === 'ok' || codeText === 'success';
  if (!success && msg) return msg;
  if (/^(error|failed|fail|unauthorized|forbidden)$/i.test(msg)) return msg;
  return '';
}

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Method not allowed. Use POST.' });
    return;
  }

  const apiKey = String(process.env.NEXSCOPE_API_KEY || '').trim();
  if (!apiKey) {
    res.status(500).json({ message: 'NEXSCOPE_API_KEY belum dikonfigurasi di Vercel.' });
    return;
  }

  let body = req.body || {};
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body || '{}');
    } catch (_) {
      res.status(400).json({ message: 'JSON request tidak valid.' });
      return;
    }
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    res.status(400).json({ message: 'Body request harus berupa object JSON.' });
    return;
  }

  const keyword = String(body.keyword || '').trim();
  if (!keyword) {
    res.status(400).json({ message: 'Keyword wajib diisi.' });
    return;
  }
  if (keyword.length > 120) {
    res.status(400).json({ message: 'Keyword terlalu panjang (maksimal 120 karakter).' });
    return;
  }

  const allowed = [
    'station','keyword','keywordType','notExistKeyword','notExistKeywordType',
    'priceMin','priceMax','soldMin','soldMax','estimateSoldStart','estimateSoldEnd',
    'historicalSoldStart','historicalSoldEnd','paymentStart','paymentEnd',
    'ratingMin','ratingMax','ratingsMin','ratingsMax','favoriteMin','favoriteMax',
    'skuNumberStart','skuNumberEnd','listingDateFrom','listingDateTo',
    'statTimeStart','statTimeEnd','lastModiTimeStart','lastModiTimeEnd',
    'approvedDateStart','approvedDateEnd','pL1Id','pL2Id','pL3Id','cidList',
    'shopIdList','notExistShopIdList','merchant','shopLocation','shippingIconType',
    'cbOption','isShopeeVerified','isOfficialShop','isHotSales','pids',
    'orderBy','orderByType','page','pageSize'
  ];

  const payload = {};
  for (const key of allowed) {
    if (body[key] !== undefined && body[key] !== '') payload[key] = body[key];
  }

  payload.station = String(payload.station || 'ID').toUpperCase();
  payload.keyword = keyword;
  payload.keywordType = Number(payload.keywordType) || 2;
  payload.page = Math.max(1, Math.min(100, Number(payload.page) || 1));
  payload.pageSize = Math.max(1, Math.min(30, Number(payload.pageSize) || 20));
  payload.orderBy = String(payload.orderBy || 'sold');
  payload.orderByType = String(payload.orderByType || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const apiPath = '/api/skill-api/v1/skills/shopee-product-search/run';
  const bases = [];
  const configured = String(process.env.NEXSCOPE_PROXY_BASE || '').trim().replace(/\/+$/, '');
  if (configured) bases.push(configured);
  for (const fallback of ['https://api.nexscope.ai', 'https://claw-callback.nexscope.ai']) {
    if (!bases.includes(fallback)) bases.push(fallback);
  }

  const attempts = [];

  for (const base of bases) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const upstream = await fetch(base + apiPath, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + apiKey,
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      const responseText = await upstream.text();
      let data;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (_) {
        data = { message: responseText || 'Response provider kosong/non-JSON.' };
      }

      if (upstream.ok) {
        const normalized = normalizeProviderPayload(data);
        if (normalized) {
          res.status(200).json(normalized);
          return;
        }

        const businessError = providerBusinessError(data);
        if (businessError) {
          res.status(502).json({ message: `Nexscope: ${businessError}` });
          return;
        }

        const topKeys = data && typeof data === 'object' && !Array.isArray(data) ? Object.keys(data).slice(0, 12) : [];
        const nested = parseJsonish(data?.data);
        const dataKeys = nested && typeof nested === 'object' && !Array.isArray(nested) ? Object.keys(nested).slice(0, 12) : [];
        res.status(502).json({
          message: `Nexscope merespons tetapi listing produk belum ditemukan.${dataKeys.length ? ` Struktur data: ${dataKeys.join(', ')}.` : ''}`,
          providerShape: { topKeys, dataKeys }
        });
        return;
      }

      attempts.push({
        base,
        status: upstream.status,
        message: data?.message || data?.msg || data?.errmsg || `HTTP ${upstream.status}`
      });
      if (![404, 405, 429, 502, 503, 504].includes(upstream.status)) break;
    } catch (error) {
      attempts.push({
        base,
        status: error?.name === 'AbortError' ? 504 : 502,
        message: error?.name === 'AbortError' ? 'Provider timeout.' : (error?.message || 'Network error')
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  res.status(502).json({ message: 'Nexscope request gagal.', attempts });
};
