# ARSTORE Tools V2 — Review 19 Compatibility Checklist

Target platforms:
- Desktop: Chrome, Edge, Firefox/Safari where available
- Android: Chrome/Chromium mobile
- iPhone/iOS: Safari + Chrome (WebKit)

Fixed/hardened in Review 19:
- Mobile drawer keeps the existing design and has independent vertical scrolling.
- Page behind the drawer is locked while the drawer is open.
- Mobile hero reflows so visual cards do not overlap CTA buttons.
- Bottom navigation respects iPhone safe-area and content receives enough bottom clearance.
- Compact AR emblem remains visible in the closed mobile header; drawer branding remains unchanged.
- Quick Preview / Detail modal use internal scrolling and mobile visual-viewport-safe heights.
- Touch targets use predictable manipulation/pan behavior without blocking normal vertical page scroll.
- Desktop header/sidebar/hero composition remains unchanged.
- Existing Shopee direct-link implementation is preserved.

Verification note:
Static/source validation can catch syntax, DOM, CSS and event conflicts, but absolute “zero bugs” on every OS/browser version requires real-device/browser verification after deployment.
