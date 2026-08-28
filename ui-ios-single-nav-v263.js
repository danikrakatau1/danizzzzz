/* ARSTORE V263 — single iOS navigation authority; navigation/UI only */
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
    const isOpen=()=>sidebar.classList.contains('open');
    let locked=false,gesture=null,seq=0;
    const cleanClosed=()=>{
      sidebar.classList.remove('open','active','is-open');sidebar.setAttribute('aria-hidden','true');
      overlay.classList.remove('show','active','visible');overlay.setAttribute('aria-hidden','true');
      menu.setAttribute('aria-expanded','false');
      B.classList.remove('drawer-open','sidebar-open','menu-open','no-scroll','overflow-hidden');B.style.removeProperty('overflow');
      D.classList.remove('drawer-open','sidebar-open','menu-open','ar263-drawer-open','ar263-gesture');D.style.removeProperty('overflow');
      if(main&&'inert' in main)main.inert=false;
    };
    const cleanOpen=()=>{
      if(!isMobile())return;
      sidebar.classList.add('open');sidebar.classList.remove('active','is-open');sidebar.setAttribute('aria-hidden','false');
      overlay.classList.add('show');overlay.classList.remove('active','visible');overlay.setAttribute('aria-hidden','false');
      menu.setAttribute('aria-expanded','true');B.classList.add('drawer-open');B.style.overflow='hidden';D.classList.add('ar263-drawer-open');
      if(main&&'inert' in main)main.inert=true;
    };
    const open=()=>{if(locked||!isMobile())return;locked=true;cleanOpen();setTimeout(()=>locked=false,260)};
    const close=()=>{if(locked&&!gesture)return;locked=true;cleanClosed();setTimeout(()=>locked=false,260)};
    const toggleGroup=el=>{
      const group=el.closest('.nav-group');if(!group)return;
      const next=!group.classList.contains('is-open');group.classList.toggle('is-open',next);el.setAttribute('aria-expanded',String(next));
      try{const key='arstore_v3_accordion_state',state=JSON.parse(sessionStorage.getItem(key)||'{}')||{};state[el.dataset.navToggle]=next;sessionStorage.setItem(key,JSON.stringify(state))}catch(_){}
    };
    document.addEventListener('click',e=>{
      if(!isMobile())return;
      const target=e.target;
      const m=target.closest?.('#mobileMenuBtn');
      if(m){e.preventDefault();e.stopImmediatePropagation();isOpen()?close():open();return;}
      const parent=target.closest?.('#sidebar [data-nav-toggle],#sidebar .nav-parent');
      if(parent){e.preventDefault();e.stopImmediatePropagation();toggleGroup(parent);cleanOpen();return;}
      const leaf=target.closest?.('#sidebar [data-page],#sidebar [data-go]');
      if(leaf){
        const name=leaf.dataset.page||leaf.dataset.go;
        if(!name)return;e.preventDefault();e.stopImmediatePropagation();
        const ok=window.ARSTORE_NAV?.showPage?.(name,{closeDrawer:false});
        if(ok!==false)requestAnimationFrame(()=>requestAnimationFrame(cleanClosed));
        return;
      }
      if(target===overlay){e.preventDefault();e.stopImmediatePropagation();close();}
    },true);
    const excluded=t=>!!t.closest?.('input,textarea,select,[contenteditable="true"],input[type="range"],.horizontal-scroll,.carousel,[data-no-swipe],.research-modal,.quick-preview,.modal,.bottom-sheet');
    const EDGE=44,W=()=>Math.min(innerWidth*.86,340);
    addEventListener('touchstart',e=>{
      if(!isMobile()||e.touches.length!==1||excluded(e.target)||locked)return;
      const t=e.touches[0],startOpen=isOpen();if(!startOpen&&t.clientX>EDGE)return;
      gesture={id:++seq,startOpen,x0:t.clientX,y0:t.clientY,lastX:t.clientX,lastT:performance.now(),vx:0,owned:false};D.classList.add('ar263-gesture');
    },{passive:true,capture:true});
    addEventListener('touchmove',e=>{
      if(!gesture||e.touches.length!==1)return;const t=e.touches[0],dx=t.clientX-gesture.x0,dy=t.clientY-gesture.y0;
      if(!gesture.owned){if(Math.abs(dx)<8&&Math.abs(dy)<8)return;if(dx<=0||Math.abs(dy)>Math.abs(dx)*1.15){gesture=null;D.classList.remove('ar263-gesture');return}gesture.owned=true}
      if(e.cancelable)e.preventDefault();const now=performance.now(),dt=Math.max(8,now-gesture.lastT);gesture.vx=(t.clientX-gesture.lastX)/dt;gesture.lastX=t.clientX;gesture.lastT=now;
      const p=Math.max(0,Math.min(1,gesture.startOpen?1-dx/W():dx/W()));D.style.setProperty('--ar263-progress',String(p));
    },{passive:false,capture:true});
    const finish=()=>{
      if(!gesture)return;const g=gesture;gesture=null;D.classList.remove('ar263-gesture');D.style.removeProperty('--ar263-progress');if(!g.owned)return;
      const dx=g.lastX-g.x0,commit=dx>W()*.32||g.vx>.46;
      if(!commit){g.startOpen?cleanOpen():cleanClosed();return;}
      if(g.startOpen){cleanClosed();setTimeout(()=>{if(back)back.click();},40);}else cleanOpen();
    };
    addEventListener('touchend',finish,{passive:true,capture:true});addEventListener('touchcancel',finish,{passive:true,capture:true});
    const reconcile=()=>{gesture=null;locked=false;D.classList.remove('ar263-gesture');isOpen()?cleanOpen():cleanClosed()};
    addEventListener('pageshow',()=>setTimeout(reconcile,0),{passive:true});addEventListener('orientationchange',()=>setTimeout(reconcile,180),{passive:true});
    reconcile();window.ARSTORE_IOS_NAV_V263={open,close,reconcile,isOpen};
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
})();
