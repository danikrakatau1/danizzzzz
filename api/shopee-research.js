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
        res.status(200).json(data || {});
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
