# ARSTORE Tools V2 — Review 11 Shopee Links


Dashboard V2 + clean routing + animasi logo + Step 01 **Analisis Produk Trending di Shopee**.

## Route
- `/` Dashboard
- `/produk-trending` Step 01
- `/fee-engine` Step 02
- `/kalkulator-profit` Step 03
- `/harga-ideal` Step 04
- `/simulator-iklan` Step 05
- `/decision-center` Step 06

## Step 01 yang sudah hidup
- Search keyword Shopee Indonesia
- Filter harga, rating, jumlah hasil, sorting
- Market Overview
- Trending Score ARSTORE
- Best Seller Score
- Competition Score
- Market Opportunity Score
- Sweet spot harga
- Detail produk
- Pilih listing sebagai referensi pasar
- Simpan research state di browser
- Lanjut ke Fee Engine
- Timestamp/freshness ditampilkan jika tersedia dari provider

## Netlify
Tambahkan environment variable:
`NEXSCOPE_API_KEY`

Function:
`netlify/functions/shopee-research.js`

Frontend memakai route:
`POST /api/shopee-research`

## Test lokal di VS Code
1. Install Node.js LTS.
2. Buka terminal pada folder project.
3. `npm install`
4. Buat `.env` berdasarkan `.env.example` dan masukkan API key.
5. `npm run dev`
6. Buka URL localhost yang diberikan Netlify Dev (umumnya `http://localhost:8888`).

Jangan memakai Live Server untuk mengetes Product Trending karena Live Server tidak menjalankan Netlify Function.

## Review 8 patch
- Parser produk memprioritaskan response resmi Nexscope `products[]` dan dapat membuka wrapper/JSON-string gateway.
- Error dibedakan antara hasil kosong dan format response yang tidak dikenali.
- Tombol Analisis Sekarang memiliki staged loader, scanning line, skeleton shimmer, dan success reveal.

## Review 9 — Step 01 Polish Batch

Batch perbaikan UI/UX Step 01 mencakup:
- Thumbnail produk asli dari `products[].imageUrl` Nexscope (dengan fallback aman).
- Entrance animation hasil, count-up score/KPI, shimmer/reveal image, dan staggered product rows.
- Modal Analisis Detail dipindahkan ke `document.body`, fixed ke viewport, selalu center, scroll internal, dan open/close transition halus.
- Market Overview memakai accent warna per metrik, progress bars animasi, dan warna score dinamis.
- Search area premium: clear keyword, Mode Trending, source/freshness, quick filters, recent searches, smart query suggestions, history badge, helper ranking, dan Advanced Filters.
- Market Signal / Produk Referensi / Data Freshness memakai warna berbeda, reveal animation, thumbnail referensi, dan badge freshness Fresh / Perlu refresh / Data lama.
- Filter Minimal Terjual 30D dikirim ke Nexscope sebagai `soldMin`.

Semua data marketplace tetap berasal dari response provider. ARSTORE hanya melakukan normalisasi, scoring, dan presentasi.


## Review 11 additions
- Tombol Lihat di Shopee pada Top Products dan modal Analisis Detail.
- Trending tier berwarna di modal, Best Seller accent biru, Posisi Harga dinamis.
- Nama toko + tautan listing dan freshness badge di modal.


## Review 12 — Direct Shopee Link Fix
- Tombol Lihat di Shopee ada pada setiap Top Product yang memiliki URL listing valid.
- Tombol yang sama tersedia di modal Analisis Detail.
- URL divalidasi harus listing Shopee Indonesia (`shopee.co.id`) dan, bila ID tersedia, item/shop ID harus cocok dengan produk terkait.
- Link eksternal dibuka di tab baru lewat handler khusus dan tidak melewati SPA router.
- URL generik/home/search Shopee tidak dianggap sebagai listing produk.


## Review 13 — Native Shopee Link Fix
- `Lihat di Shopee` pada card Top Products sekarang berupa link `<a>` native dengan `href` listing yang sudah divalidasi.
- `Lihat di Shopee` pada modal Analisis Detail juga berupa link native.
- Browser membuka listing lewat `target="_blank"`; tidak lagi bergantung pada `window.open()` atau event delegation.
- Link toko/listing di header modal juga native.
- Pointer events/z-index action diperkuat agar area klik tidak tertutup layer lain.


## Review 14 — Shopee Link Real Fix
- `productUrl` provider menjadi sumber utama untuk tombol Lihat di Shopee.
- `pid/productId` tidak lagi dianggap sebagai `itemId` Shopee.
- Pencocokan item/shop ID hanya dilakukan jika `itemId` dan `shopId` eksplisit tersedia.
- URL Shopee generik/search ditolak.
- Fallback canonical `/product/{shopId}/{itemId}` hanya dibuat dari ID eksplisit provider.
- Semua link Shopee tetap native `<a target="_blank">` sehingga tidak diproses SPA router.

## Review 15 — Provider productUrl fix
- `products[].productUrl` dari Nexscope dipakai sebagai sumber link produk utama sesuai dokumentasi provider.
- Tidak lagi mewajibkan URL memiliki pola/domain Shopee tertentu karena provider dapat memakai redirect/tracking URL.
- URL kosong, skema non-http(s), dan URL internal dashboard tetap ditolak.
- Tombol Lihat di Shopee dirender di Top Products dan modal selama provider mengirim productUrl yang valid.

## Review 17 — Quick Preview + Mobile Shopee Action
- Card Top Products dapat ditap untuk membuka Quick Product Preview.
- Desktop: Quick Preview tampil sebagai modal kecil di tengah.
- Mobile: Quick Preview tampil sebagai bottom sheet.
- Action card desktop: Trending + Analisis Detail + Gunakan sebagai Referensi + Lihat di Shopee.
- Action mobile: Analisis Detail + Gunakan sebagai Referensi, lalu Lihat di Shopee full-width.
- Klik tombol/link di dalam card tidak memicu Quick Preview.
- Link Shopee pada card, Quick Preview, dan Analisis Detail memakai URL produk yang sama bila tersedia.

## Review 18 — Compatibility + Shopee Direct Link Fix
- Direct Shopee links use provider `productUrl`; if absent, numeric Nexscope `pid` + `shopId` build Shopee's canonical `/product/{shopId}/{pid}` fallback.
- Shopee anchors are insulated from card/SPA click handlers and open in a new tab.
- Top-product mobile action layout: two actions + full-width Shopee action.
- Quick Preview cyan/violet button colors are forced consistently on desktop/mobile.
- Mobile hero reflows into one column; desktop hero is unchanged.
- Bottom navigation uses iOS safe-area spacing and content gets enough bottom padding.
- Compact AR emblem appears in the closed mobile header beside Settings; drawer branding and desktop branding remain unchanged.
