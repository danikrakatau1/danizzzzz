/* ARSTORE V264 — iOS one-gesture/one-action authority; UI/navigation only */
(()=>{
  'use strict';
  const ua=navigator.userAgent||'';
  const isiOS=/iPhone|iPad|iPod/i.test(ua)||(/Macintosh/i.test(ua)&&navigator.maxTouchPoints>1);
  if(!isiOS)return;
  const D=document.documentElement,B=document.body;
  const q=(s,r=document)=>r.querySelector(s);
  const ready=()=>{
    const sidebar=q('#sidebar'),overlay=q('#sidebarOverlay'),menu=q('#mobileMenuBtn'),back=q('#sidebarBackBtn'),main=q('.main-content');
    if(!sidebar||!overlay||!menu)return;
    const mobile=()=>matchMedia('(max-width: 820px), (max-width: 900px) and (pointer: coarse)').matches;
    const isOpen=()=>sidebar.classList.contains('open');
    const clean=()=>{
      const open=isOpen();
      sidebar.classList.toggle('open',open);
      sidebar.classList.remove('active','is-open');
      overlay.classList.toggle('show',open);
      overlay.classList.remove('active','visible');
      overlay.setAttribute('aria-hidden',String(!open));
      sidebar.setAttribute('aria-hidden',String(!open));
      menu.setAttribute('aria-expanded',String(open));
      B.classList.toggle('drawer-open',open);
      B.classList.remove('sidebar-open','menu-open','no-scroll','overflow-hidden');
      if(open){B.style.overflow='hidden';D.classList.add('ar264-drawer-open');if(main&&'inert' in main)main.inert=true;}
      else{B.style.removeProperty('overflow');D.style.removeProperty('overflow');D.classList.remove('ar264-drawer-open');if(main&&'inert' in main)main.inert=false;}
      if(!open){overlay.style.removeProperty('opacity');overlay.style.removeProperty('backdrop-filter');overlay.style.removeProperty('-webkit-backdrop-filter');}
    };
    const openDrawer=()=>{window.ARSTORE_NAV?.openSidebar?.();sidebar.classList.add('open');clean();};
    const closeDrawer=()=>{window.ARSTORE_NAV?.closeSidebar?.();sidebar.classList.remove('open','active','is-open');clean();};

    // Base app.js owns all clicks/accordion/routes. V264 owns only iOS swipe semantics + cleanup.
    let g=null,seq=0,settling=false,consumedUntil=0;
    const EDGE=44,W=()=>Math.min(innerWidth*.86,340);
    const excluded=t=>!!t.closest?.('input,textarea,select,[contenteditable="true"],input[type="range"],.horizontal-scroll,.carousel,[data-no-swipe],.research-modal,.quick-preview,.modal,.bottom-sheet');

    addEventListener('touchstart',e=>{
      if(!mobile()||settling||performance.now()<consumedUntil||e.touches.length!==1||excluded(e.target))return;
      const t=e.touches[0],startOpen=isOpen();
      if(!startOpen&&t.clientX>EDGE)return;
      g={id:++seq,startOpen,x0:t.clientX,y0:t.clientY,lastX:t.clientX,lastT:performance.now(),vx:0,owned:false};
      D.classList.add('ar264-gesture');
    },{capture:true,passive:true});

    addEventListener('touchmove',e=>{
      if(!g||e.touches.length!==1)return;
      const t=e.touches[0],dx=t.clientX-g.x0,dy=t.clientY-g.y0;
      if(!g.owned){
        if(Math.abs(dx)<8&&Math.abs(dy)<8)return;
        if(dx<=0||Math.abs(dy)>Math.abs(dx)*1.15){g=null;D.classList.remove('ar264-gesture');return;}
        g.owned=true;
      }
      if(e.cancelable)e.preventDefault();
      e.stopPropagation();
      const now=performance.now(),dt=Math.max(8,now-g.lastT);g.vx=(t.clientX-g.lastX)/dt;g.lastX=t.clientX;g.lastT=now;
      const p=Math.max(0,Math.min(1,g.startOpen?1-dx/W():dx/W()));
      D.style.setProperty('--ar264-progress',String(p));
    },{capture:true,passive:false});

    const finish=e=>{
      if(!g)return;
      const snap=g;g=null;D.classList.remove('ar264-gesture');D.style.removeProperty('--ar264-progress');
      if(!snap.owned)return;
      e?.stopPropagation?.();
      const dx=snap.lastX-snap.x0,commit=dx>W()*.32||snap.vx>.46;
      settling=true;consumedUntil=performance.now()+420;
      requestAnimationFrame(()=>{
        if(!commit){snap.startOpen?openDrawer():closeDrawer();settling=false;return;}
        if(snap.startOpen){
          // OPEN at touchstart => exactly one action: close/back. Never reopen in same sequence.
          closeDrawer();
          setTimeout(()=>{if(back&&q('.page.active')?.id!=='page-dashboard')back.click();settling=false;},90);
        }else{
          // CLOSED at touchstart => exactly one action: open drawer. Never back in same sequence.
          openDrawer();
          setTimeout(()=>{settling=false;clean();},180);
        }
      });
    };
    addEventListener('touchend',finish,{capture:true,passive:true});
    addEventListener('touchcancel',()=>{if(!g)return;const snap=g;g=null;D.classList.remove('ar264-gesture');D.style.removeProperty('--ar264-progress');snap.startOpen?openDrawer():closeDrawer();settling=false;consumedUntil=performance.now()+160;},{capture:true,passive:true});

    const watchdog=()=>{if(!mobile())return;const open=isOpen();if(!open&&overlay.classList.contains('show'))overlay.classList.remove('show','active','visible');clean();};
    document.addEventListener('arstore:page-change',()=>setTimeout(watchdog,0));
    addEventListener('pageshow',()=>setTimeout(watchdog,0),{passive:true});
    addEventListener('orientationchange',()=>setTimeout(watchdog,180),{passive:true});
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(watchdog,0)});
    setTimeout(watchdog,0);
    window.ARSTORE_IOS_NAV_V264={open:openDrawer,close:closeDrawer,reconcile:watchdog,isOpen};
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
})();
