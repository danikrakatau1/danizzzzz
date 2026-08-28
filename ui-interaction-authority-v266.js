/* ARSTORE V266 — interaction authority + drawer/overlay reconciliation; NO custom swipe navigation */
(()=>{
  'use strict';
  const ua=navigator.userAgent||'';
  const isiOS=/iPhone|iPad|iPod/i.test(ua)||(/Macintosh/i.test(ua)&&navigator.maxTouchPoints>1);
  if(!isiOS)return;

  const D=document.documentElement,B=document.body;
  D.classList.add('ar266-authority');
  const q=(s,r=document)=>r.querySelector(s);
  let raf=0;

  function isMobile(){return matchMedia('(max-width: 820px), (max-width: 900px) and (pointer: coarse)').matches;}

  function reconcile(){
    cancelAnimationFrame(raf);
    raf=requestAnimationFrame(()=>{
      const sidebar=q('#sidebar'),overlay=q('#sidebarOverlay'),menu=q('#mobileMenuBtn'),main=q('.main-content');
      if(!sidebar||!overlay||!menu)return;

      // Canonical authority: base app owns user actions. V266 only repairs derived state.
      const open=isMobile()&&sidebar.classList.contains('open');
      sidebar.classList.remove('active','is-open');
      overlay.classList.toggle('show',open);
      overlay.classList.remove('active','visible');
      sidebar.setAttribute('aria-hidden',String(!open));
      overlay.setAttribute('aria-hidden',String(!open));
      menu.setAttribute('aria-expanded',String(open));
      B.classList.toggle('drawer-open',open);
      B.classList.remove('sidebar-open','menu-open','no-scroll','overflow-hidden');
      D.classList.remove('sidebar-open','menu-open','no-scroll','overflow-hidden','ar261-gesture','ar264-gesture');

      if(open){
        B.style.overflow='hidden';
        overlay.style.removeProperty('pointer-events');
        if(main&&'inert' in main)main.inert=true;
      }else{
        B.style.removeProperty('overflow');
        D.style.removeProperty('overflow');
        overlay.style.pointerEvents='none';
        overlay.style.removeProperty('opacity');
        overlay.style.removeProperty('backdrop-filter');
        overlay.style.removeProperty('-webkit-backdrop-filter');
        D.style.removeProperty('--ar261-drawer-progress');
        D.style.removeProperty('--ar264-progress');
        if(main&&'inert' in main)main.inert=false;
      }
    });
  }

  // No click/touch navigation handlers here. app.js owns hamburger, overlay, accordion and routes.
  document.addEventListener('arstore:page-change',reconcile);
  addEventListener('pageshow',reconcile,{passive:true});
  addEventListener('resize',reconcile,{passive:true});
  addEventListener('orientationchange',()=>setTimeout(reconcile,180),{passive:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)reconcile();});

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',reconcile,{once:true});else reconcile();
  window.ARSTORE_INTERACTION_V266={reconcile,hasCustomSwipe:false,authority:'base-app'};
})();
