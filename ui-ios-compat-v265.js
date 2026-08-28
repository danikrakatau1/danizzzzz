/* ARSTORE V265 — iPhone/iOS/Safari compatibility runtime; NO custom swipe navigation */
(()=>{
  'use strict';
  const ua=navigator.userAgent||'';
  const isiOS=/iPhone|iPad|iPod/i.test(ua)||(/Macintosh/i.test(ua)&&navigator.maxTouchPoints>1);
  if(!isiOS)return;

  const D=document.documentElement,B=document.body;
  D.dataset.arPlatform='ios';
  D.classList.add('ar265-ios');
  const q=(s,r=document)=>r.querySelector(s);
  const qa=(s,r=document)=>[...r.querySelectorAll(s)];
  let viewportRAF=0,reconcileRAF=0,lastViewportH=0;

  function setViewportVars(){
    cancelAnimationFrame(viewportRAF);
    viewportRAF=requestAnimationFrame(()=>{
      const vv=window.visualViewport;
      const h=Math.max(1,vv?.height||innerHeight||document.documentElement.clientHeight||1);
      const w=Math.max(1,vv?.width||innerWidth||document.documentElement.clientWidth||1);
      D.style.setProperty('--ar265-vh',`${h*.01}px`);
      D.style.setProperty('--ar265-vw',`${w*.01}px`);
      const keyboard=!!vv&&innerHeight-h>Math.max(120,innerHeight*.16);
      D.classList.toggle('ar265-keyboard-open',keyboard);
      lastViewportH=h;
    });
  }

  function isMobile(){return matchMedia('(max-width: 820px), (max-width: 900px) and (pointer: coarse)').matches;}
  function drawerOpen(){return !!q('#sidebar')?.classList.contains('open');}

  function reconcileUI(){
    cancelAnimationFrame(reconcileRAF);
    reconcileRAF=requestAnimationFrame(()=>{
      const sidebar=q('#sidebar'),overlay=q('#sidebarOverlay'),menu=q('#mobileMenuBtn'),main=q('.main-content');
      if(sidebar&&overlay&&menu){
        const open=isMobile()&&drawerOpen();
        sidebar.classList.remove('active','is-open');
        sidebar.setAttribute('aria-hidden',String(!open));
        menu.setAttribute('aria-expanded',String(open));
        overlay.classList.toggle('show',open);
        overlay.classList.remove('active','visible');
        overlay.setAttribute('aria-hidden',String(!open));
        overlay.style.removeProperty('opacity');
        overlay.style.removeProperty('backdrop-filter');
        overlay.style.removeProperty('-webkit-backdrop-filter');
        B.classList.toggle('drawer-open',open);
        B.classList.remove('sidebar-open','menu-open','no-scroll','overflow-hidden');
        if(open){B.style.overflow='hidden';if(main&&'inert' in main)main.inert=true;}
        else{B.style.removeProperty('overflow');D.style.removeProperty('overflow');if(main&&'inert' in main)main.inert=false;}
      }
      qa('[aria-hidden="true"]').forEach(el=>{if(el.matches('#sidebarOverlay')&&!drawerOpen())el.style.pointerEvents='none';});
    });
  }

  function syncThemeColor(){
    const theme=D.dataset.theme||'dark';
    const map={light:'#f7f7fa',dark:'#0b0b0f',charcoal:'#17171c',oled:'#000000'};
    let meta=q('meta[name="theme-color"]');
    if(!meta){meta=document.createElement('meta');meta.name='theme-color';document.head.appendChild(meta);}
    meta.content=map[theme]||map.dark;
  }

  function enhanceInputs(){
    qa('input,textarea,select').forEach(el=>{
      if(el.dataset.ar265Enhanced)return;
      el.dataset.ar265Enhanced='1';
      el.addEventListener('focus',()=>{
        setTimeout(()=>{
          if(!document.contains(el))return;
          const r=el.getBoundingClientRect(),vv=visualViewport;
          const top=vv?.offsetTop||0,bottom=top+(vv?.height||innerHeight);
          if(r.bottom>bottom-24||r.top<top+72)el.scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
        },180);
      },{passive:true});
    });
  }

  function applyMotionPolicy(){
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    D.classList.toggle('ar265-low-motion',reduced||document.hidden);
  }

  function recover(){setViewportVars();syncThemeColor();enhanceInputs();reconcileUI();applyMotionPolicy();}

  // V265 intentionally installs NO touchstart/touchmove/touchend navigation handlers.
  // Hamburger, accordion, leaf routing, overlay close and browser history remain owned by the base app/Safari.
  addEventListener('resize',setViewportVars,{passive:true});
  addEventListener('orientationchange',()=>setTimeout(recover,180),{passive:true});
  addEventListener('pageshow',()=>setTimeout(recover,0),{passive:true});
  addEventListener('pagehide',()=>{D.classList.remove('ar265-keyboard-open');},{passive:true});
  visualViewport?.addEventListener('resize',setViewportVars,{passive:true});
  visualViewport?.addEventListener('scroll',setViewportVars,{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)applyMotionPolicy();else setTimeout(recover,0);});
  document.addEventListener('arstore:page-change',()=>setTimeout(recover,0));
  document.addEventListener('focusin',enhanceInputs,{passive:true});

  const themeObserver=new MutationObserver(()=>syncThemeColor());
  themeObserver.observe(D,{attributes:true,attributeFilter:['data-theme']});

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',recover,{once:true});else recover();
  window.ARSTORE_IOS_COMPAT_V265={reconcile:recover,setViewportVars,hasCustomSwipe:false};
})();
