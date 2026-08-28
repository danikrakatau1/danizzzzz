/* ARSTORE V262 — iPhone navigation state authority; UI/navigation only */
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
    const isMobile=()=>matchMedia('(max-width: 820px), (max-width: 900px) and (pointer: coarse)').matches;
    const isOpen=()=>sidebar.classList.contains('open')||sidebar.classList.contains('active')||sidebar.classList.contains('is-open');
    let state=isOpen()?'open':'closed', settling=false, gesture=null, seq=0;
    const setProgress=p=>{p=Math.max(0,Math.min(1,p));D.style.setProperty('--ar262-drawer-progress',String(p));D.style.setProperty('--ar261-drawer-progress',String(p));return p};
    const normalizeOpen=()=>{
      if(!isMobile())return;
      state='open';settling=false;
      sidebar.classList.add('open');sidebar.classList.remove('active','is-open');
      sidebar.setAttribute('aria-hidden','false');
      overlay.classList.add('show');overlay.classList.remove('active','visible');overlay.setAttribute('aria-hidden','false');
      menu.setAttribute('aria-expanded','true');
      B.classList.add('drawer-open');B.classList.remove('sidebar-open','menu-open');B.style.overflow='hidden';
      if(main&&'inert' in main)main.inert=true;
      D.classList.add('ar262-drawer-open');D.classList.remove('ar262-settling');setProgress(1);
    };
    const normalizeClosed=({restoreFocus=false}={})=>{
      state='closed';settling=false;
      sidebar.classList.remove('open','active','is-open');sidebar.setAttribute('aria-hidden','true');
      overlay.classList.remove('show','active','visible');overlay.setAttribute('aria-hidden','true');
      menu.setAttribute('aria-expanded','false');
      B.classList.remove('drawer-open','sidebar-open','menu-open','no-scroll','overflow-hidden');B.style.removeProperty('overflow');
      D.classList.remove('drawer-open','sidebar-open','menu-open','ar262-drawer-open','ar262-settling');D.style.removeProperty('overflow');
      if(main&&'inert' in main)main.inert=false;
      setProgress(0);
      if(restoreFocus)try{menu.focus({preventScroll:true})}catch(_){}
    };
    const settle=(wantOpen,cb)=>{
      settling=true;state=wantOpen?'opening':'closing';D.classList.add('ar262-settling');
      requestAnimationFrame(()=>{wantOpen?normalizeOpen():normalizeClosed();if(cb)setTimeout(cb,0)});
    };
    const routeBackAfterClose=()=>{
      const active=q('.page.active')?.id?.replace(/^page-/,'')||'dashboard';
      if(active==='dashboard')return;
      if(back){setTimeout(()=>back.click(),0);return;}
      history.back();
    };

    /* Hamburger has one deterministic outcome per tap, regardless of older listeners. */
    menu.addEventListener('click',e=>{
      if(!isMobile())return;
      const desired=!isOpen();
      const token=++seq;
      setTimeout(()=>{if(token!==seq)return;desired?normalizeOpen():normalizeClosed({restoreFocus:true})},0);
    },true);

    /* Parent accordion taps must never close the drawer. Base app still owns accordion state. */
    document.addEventListener('click',e=>{
      const parent=e.target.closest?.('#sidebar [data-nav-toggle],#sidebar .nav-parent');
      if(!parent||!isMobile())return;
      const was=isOpen();
      if(!was)return;
      const token=++seq;
      setTimeout(()=>{if(token!==seq)return;normalizeOpen()},0);
    },true);

    /* Real leaf navigation closes only after the route has actually activated. */
    document.addEventListener('click',e=>{
      const leaf=e.target.closest?.('#sidebar [data-page],#sidebar [data-go]');
      if(!leaf||leaf.matches('.nav-parent,[data-nav-toggle]'))return;
      const target=leaf.dataset.page||leaf.dataset.go;
      if(!target)return;
      const token=++seq;
      requestAnimationFrame(()=>requestAnimationFrame(()=>{
        if(token!==seq)return;
        const page=q(`#page-${CSS.escape(target)}`);
        if(page?.classList.contains('active'))normalizeClosed();
      }));
    },false);

    /* Overlay alone closes the drawer. Internal sidebar taps never count as overlay taps. */
    overlay.addEventListener('click',e=>{if(e.target===overlay){++seq;normalizeClosed({restoreFocus:true})}},true);

    const excluded=t=>!!t.closest?.('input,textarea,select,[contenteditable="true"],input[type="range"],.horizontal-scroll,.carousel,[data-no-swipe],.research-modal,.quick-preview,.modal,.bottom-sheet');
    const W=()=>Math.min(innerWidth*.86,340);
    const EDGE=42;

    /* Capture iOS swipe gestures before V261: CLOSED+right swipe=OPEN; OPEN+right swipe=CLOSE+previous page. */
    addEventListener('touchstart',e=>{
      if(!isMobile()||e.touches.length!==1||excluded(e.target)||settling)return;
      const t=e.touches[0],startOpen=isOpen();
      if(!startOpen&&t.clientX>EDGE)return;
      gesture={id:++seq,startOpen,x0:t.clientX,y0:t.clientY,lastX:t.clientX,lastT:performance.now(),vx:0,owned:false,p:startOpen?1:0};
      state=startOpen?'open':'closed';D.classList.add('ar262-gesture');setProgress(gesture.p);
      e.stopImmediatePropagation();
    },true);

    addEventListener('touchmove',e=>{
      if(!gesture||e.touches.length!==1)return;
      e.stopImmediatePropagation();
      const t=e.touches[0],dx=t.clientX-gesture.x0,dy=t.clientY-gesture.y0;
      if(!gesture.owned){
        if(Math.abs(dx)<7&&Math.abs(dy)<7)return;
        if(dx<=0||Math.abs(dy)>Math.abs(dx)*1.18){gesture=null;D.classList.remove('ar262-gesture');setProgress(isOpen()?1:0);return;}
        gesture.owned=true;
      }
      if(e.cancelable)e.preventDefault();
      const now=performance.now(),dt=Math.max(8,now-gesture.lastT);gesture.vx=(t.clientX-gesture.lastX)/dt;gesture.lastX=t.clientX;gesture.lastT=now;
      /* Both actions use a rightward drag, but visual progress is anchored to state at touchstart. */
      gesture.p=gesture.startOpen?Math.max(0,1-dx/W()):Math.min(1,dx/W());setProgress(gesture.p);
    },true);

    const finish=e=>{
      if(!gesture)return;
      e?.stopImmediatePropagation?.();
      const g=gesture;gesture=null;D.classList.remove('ar262-gesture');
      if(!g.owned){setProgress(g.startOpen?1:0);return;}
      const dx=g.lastX-g.x0;
      const commit=dx>W()*.34||g.vx>.48;
      if(g.startOpen){
        if(commit)settle(false,routeBackAfterClose);else settle(true);
      }else{
        if(commit)settle(true);else settle(false);
      }
    };
    addEventListener('touchend',finish,true);addEventListener('touchcancel',finish,true);

    const reconcile=()=>{gesture=null;settling=false;D.classList.remove('ar262-gesture','ar262-settling');isOpen()?normalizeOpen():normalizeClosed()};
    addEventListener('pageshow',()=>setTimeout(reconcile,0),{passive:true});
    addEventListener('orientationchange',()=>setTimeout(reconcile,180),{passive:true});
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(reconcile,0)},{passive:true});
    reconcile();
    window.ARSTORE_IOS_DRAWER_V262={open:normalizeOpen,close:normalizeClosed,reconcile,getState:()=>state};
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
})();
