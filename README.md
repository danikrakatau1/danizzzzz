# ARSTORE Tools V3

AR STORE Seller Command Center V3.

## Struktur utama

- Dashboard — ringkas, quick tools, dan status workspace.
- Seller Tools — rumah workflow existing Step 01–06:
  1. Produk Trending
  2. Fee Engine
  3. Kalkulator Profit
  4. Harga Ideal
  5. Simulator Iklan
  6. Decision Center
- Market Tools
  - Shopee
    - Kalkulator ROAS Shopee
    - Harga Jual Shopee
  - TikTok
    - Kalkulator ROAS TikTok
    - Harga Jual TikTok
- Product Center
  - Produk Saya
  - Keuangan
  - Stok
  - Kompetitor
  - Content / Affiliate
  - Order Analytics
- Update Database
- Pengaturan tema Gelap / Terang

## Backend

Production menggunakan Vercel Functions. Endpoint research Shopee:

`POST /api/shopee-research`

Environment variables di Vercel:

- `NEXSCOPE_API_KEY`
- `NEXSCOPE_PROXY_BASE=https://api.nexscope.ai`

Untuk development lokal gunakan:

```bash
npm run dev
```

Script tersebut menjalankan `npx vercel dev` supaya route `/api/shopee-research` tersedia. Jangan membuka project melalui `file://` atau Live Server bila ingin menguji API serverless.

## Routing V3

- `/seller-tools`
- `/seller-tools/produk-trending`
- `/seller-tools/fee-engine`
- `/seller-tools/kalkulator-profit`
- `/seller-tools/harga-ideal`
- `/seller-tools/simulator-iklan`
- `/seller-tools/decision-center`
- `/market-tools/shopee/kalkulator-roas`
- `/market-tools/shopee/harga-jual`
- `/market-tools/tiktok/kalkulator-roas`
- `/market-tools/tiktok/harga-jual`
- `/produk/produk-saya`
- `/produk/keuangan`
- `/produk/stok`
- `/produk/kompetitor`
- `/produk/content-affiliate`
- `/produk/order-analytics`
- `/database`
- `/pengaturan`

Route V2 lama tetap memiliki rewrite/alias untuk kompatibilitas.

## Catatan

Fee Engine dan Profit Engine existing tetap dipertahankan. Market Tools dan Product Center ditambahkan di atas fondasi existing sehingga pekerjaan V2 tidak dibuang.
