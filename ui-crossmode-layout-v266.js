/* ARSTORE V266 B3 — presentation-only cross-mode shell reconciliation */
(()=>{
  'use strict';
  const root=document.documentElement;
  const BRAND='assets/arstore-emblem-transparent.png';
  function syncBrand(){
    document.querySelectorAll('.brand-logo-orbit img,.mobile-header-brand img').forEach(img=>{
      const src=(img.getAttribute('src')||'').replace(/^\.\//,'');
      if(src!==BRAND) img.setAttribute('src',BRAND);
      img.setAttribute('decoding','async');
    });
  }
  function reconcile(){
    root.dataset.ar266Shell='1';
    syncBrand();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',reconcile,{once:true});
  else reconcile();
  window.addEventListener('pageshow',reconcile,{passive:true});
  window.ARSTORE_CROSSMODE_V266={presentationOnly:true,reconcile};
})();
