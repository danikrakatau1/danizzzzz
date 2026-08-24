exports.handler = async function(event) {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Cache-Control": "no-store"
  };
  const reply = (statusCode, data) => ({ statusCode, headers, body: JSON.stringify(data) });

  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers, body: "" };
  if (event.httpMethod !== "POST") return reply(405, { message: "Method not allowed. Use POST." });

  const apiKey = String(process.env.NEXSCOPE_API_KEY || "").trim();
  if (!apiKey) return reply(500, { message: "NEXSCOPE_API_KEY belum dikonfigurasi di Netlify." });

  let body;
  try { body = JSON.parse(event.body || "{}"); }
  catch { return reply(400, { message: "JSON request tidak valid." }); }

  const keyword = String(body.keyword || "").trim();
  if (!keyword) return reply(400, { message: "Keyword wajib diisi." });
  if (keyword.length > 120) return reply(400, { message: "Keyword terlalu panjang (maksimal 120 karakter)." });

  const allowed = [
    "station","keyword","keywordType","notExistKeyword","notExistKeywordType",
    "priceMin","priceMax","soldMin","soldMax","estimateSoldStart","estimateSoldEnd",
    "historicalSoldStart","historicalSoldEnd","paymentStart","paymentEnd",
    "ratingMin","ratingMax","ratingsMin","ratingsMax","favoriteMin","favoriteMax",
    "skuNumberStart","skuNumberEnd","listingDateFrom","listingDateTo",
    "statTimeStart","statTimeEnd","lastModiTimeStart","lastModiTimeEnd",
    "approvedDateStart","approvedDateEnd","pL1Id","pL2Id","pL3Id","cidList",
    "shopIdList","notExistShopIdList","merchant","shopLocation","shippingIconType",
    "cbOption","isShopeeVerified","isOfficialShop","isHotSales","pids",
    "orderBy","orderByType","page","pageSize"
  ];

  const payload = {};
  for (const key of allowed) if (body[key] !== undefined && body[key] !== "") payload[key] = body[key];
  payload.station = String(payload.station || "ID").toUpperCase();
  payload.keyword = keyword;
  payload.keywordType = Number(payload.keywordType) || 2;
  payload.page = Math.max(1, Math.min(100, Number(payload.page) || 1));
  payload.pageSize = Math.max(1, Math.min(30, Number(payload.pageSize) || 20));
  payload.orderBy = String(payload.orderBy || "sold");
  payload.orderByType = String(payload.orderByType || "DESC").toUpperCase() === "ASC" ? "ASC" : "DESC";

  const path = "/api/skill-api/v1/skills/shopee-product-search/run";
  const bases = [];
  const configured = String(process.env.NEXSCOPE_PROXY_BASE || "").trim().replace(/\/+$/, "");
  if (configured) bases.push(configured);
  for (const fallback of ["https://api.nexscope.ai", "https://claw-callback.nexscope.ai"]) if (!bases.includes(fallback)) bases.push(fallback);

  const attempts = [];
  for (const base of bases) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const upstream = await fetch(base + path, {
        method: "POST",
        headers: { "Authorization": "Bearer " + apiKey, "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      const responseText = await upstream.text();
      let data;
      try { data = responseText ? JSON.parse(responseText) : {}; }
      catch { data = { message: responseText || "Response provider kosong/non-JSON." }; }
      if (upstream.ok) return reply(200, data || {});
      attempts.push({ base, status: upstream.status, message: data?.message || data?.msg || data?.errmsg || `HTTP ${upstream.status}` });
      if (![404,405,429,502,503,504].includes(upstream.status)) break;
    } catch (error) {
      attempts.push({ base, status: error?.name === "AbortError" ? 504 : 502, message: error?.name === "AbortError" ? "Provider timeout." : (error?.message || "Network error") });
    } finally { clearTimeout(timeout); }
  }

  return reply(502, { message: "Nexscope request gagal.", attempts });
};
