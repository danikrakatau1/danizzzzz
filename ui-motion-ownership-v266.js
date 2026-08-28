/* ARSTORE V266 B2 — transform ownership diagnostics; no navigation/touch handlers */
(()=>{
  'use strict';
  const D=document.documentElement;
  const q=(s,r=document)=>r.querySelector(s);
  const qa=(s,r=document)=>[...r.querySelectorAll(s)];

  function mark(){
    q('#sidebar')?.setAttribute('data-ar266-transform-owner','drawer');
    q('#sidebarOverlay')?.setAttribute('data-ar266-motion-owner','overlay');
    qa('.page').forEach(el=>el.setAttribute('data-ar266-transform-owner','route'));
    qa('.nav-chevron').forEach(el=>el.setAttribute('data-ar266-transform-owner','chevron'));
    qa('.mobile-menu-btn,.sidebar-back-btn').forEach(el=>el.setAttribute('data-ar266-motion-owner','press'));
    D.dataset.ar266MotionOwnership='ready';
  }

  function reconcile(){
    D.classList.remove('ar261-gesture','ar264-gesture');
    D.style.removeProperty('--ar261-drawer-progress');
    D.style.removeProperty('--ar264-progress');
    mark();
  }

  // Presentation diagnostics only. No click, touch, router, history, drawer or form ownership.
  document.addEventListener('arstore:page-change',reconcile);
  addEventListener('pageshow',reconcile,{passive:true});
  addEventListener('orientationchange',()=>setTimeout(reconcile,180),{passive:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',reconcile,{once:true});else reconcile();

  window.ARSTORE_MOTION_OWNERSHIP_V266={reconcile,mode:'transform-isolation',ownsNavigation:false,ownsTouch:false};
})();
