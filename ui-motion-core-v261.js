/* ARSTORE V261 — cross-device premium runtime; UI/UX only; no fee/formula/database writes */
(()=>{
  const D=document.documentElement,B=document.body;if(!D||!B)return;
  const ua=navigator.userAgent||'', touch=navigator.maxTouchPoints||0;
  const isiOS=/iPhone|iPad|iPod/i.test(ua)||(/Macintosh/i.test(ua)&&touch>1);
  const isAndroid=/Android/i.test(ua);
  const platform=isiOS?'ios':isAndroid?'android':'desktop';
  D.dataset.arPlatform=platform;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cores=navigator.hardwareConcurrency||4,mem=navigator.deviceMemory||4;
  const low=cores<=2||mem<=2||reduce;
  D.dataset.arMotion=reduce?'reduced':'normal';D.dataset.arPerformance=low?'low':'normal';
  if(low)D.classList.add('ar261-low');

  const q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
  const raf2=fn=>requestAnimationFrame(()=>requestAnimationFrame(fn));
  const ready=()=>{
    B.classList.add('ar261-route-in');setTimeout(()=>B.classList.remove('ar261-route-in'),520);

    const reveal=qa('.hero-panel,.next-action,.active-analysis,.progress-panel,.snapshot-panel,.tool-card,.panel,.card,[class*="result-card"],[class*="metric-card"]').slice(0,120);
    reveal.forEach((el,i)=>{el.classList.add('ar261-reveal');el.style.setProperty('--ar261-i',i%8)});
    if(!reduce&&'IntersectionObserver'in window){
      const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('ar261-in');io.unobserve(e.target)}}),{threshold:.06,rootMargin:'56px 0px -20px'});
      reveal.forEach(el=>io.observe(el));
    }else reveal.forEach(el=>el.classList.add('ar261-in'));

    if(platform==='desktop'&&!reduce&&!low){
      qa('.tool-card,.card,.snapshot-panel,[class*="result-card"]').forEach(el=>{
        el.classList.add('ar261-pointer');
        let pending=false,last;
        el.addEventListener('pointermove',e=>{last=e;if(pending)return;pending=true;requestAnimationFrame(()=>{const r=el.getBoundingClientRect();el.style.setProperty('--ar261-x',`${last.clientX-r.left}px`);el.style.setProperty('--ar261-y',`${last.clientY-r.top}px`);pending=false})},{passive:true});
      });
    }

    if(platform==='android'){
      qa('button,[role="button"],.nav-item,.tool-card,.icon-btn').forEach(el=>{
        el.classList.add('ar261-ripple');
        el.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse')return;const r=el.getBoundingClientRect();el.style.setProperty('--ar261-rx',`${e.clientX-r.left}px`);el.style.setProperty('--ar261-ry',`${e.clientY-r.top}px`);el.classList.remove('ar261-rippling');void el.offsetWidth;el.classList.add('ar261-rippling');setTimeout(()=>el.classList.remove('ar261-rippling'),560)},{passive:true});
      });
    }

    const values='.metric-value,.result-value,[data-number],.price,.money,.roas,.margin,.profit,[data-result]';
    try{
      const mo=new MutationObserver(ms=>{for(const m of ms){const el=m.target.nodeType===1?m.target:m.target.parentElement;if(el?.matches?.(values)){el.classList.remove('ar261-value-update');void el.offsetWidth;el.classList.add('ar261-value-update')}}});
      qa(values).forEach(el=>mo.observe(el,{childList:true,characterData:true,subtree:true}));
    }catch(_){}

    let scrollTimer=0,ticking=false;
    addEventListener('scroll',()=>{D.classList.add('ar261-scrolling');clearTimeout(scrollTimer);scrollTimer=setTimeout(()=>D.classList.remove('ar261-scrolling'),140);if(ticking)return;ticking=true;requestAnimationFrame(()=>{B.classList.toggle('ar261-scrolled',scrollY>8);ticking=false})},{passive:true});

    let theme=D.getAttribute('data-theme')||B.getAttribute('data-theme')||'';
    const syncTheme=()=>{const t=D.getAttribute('data-theme')||B.getAttribute('data-theme')||(B.classList.contains('light')?'light':'');if(t!==theme){theme=t;D.classList.add('ar261-theme-changing');setTimeout(()=>D.classList.remove('ar261-theme-changing'),420)}};
    new MutationObserver(syncTheme).observe(D,{attributes:true,attributeFilter:['data-theme','class']});
    new MutationObserver(syncTheme).observe(B,{attributes:true,attributeFilter:['data-theme','class']});

    const vv=visualViewport;let baseH=vv?.height||innerHeight;
    const viewportSync=()=>{if(!vv)return;if(vv.height>baseH)baseH=vv.height;const open=baseH-vv.height>140;D.dataset.arKeyboard=open?'open':'closed';D.style.setProperty('--ar261-vvh',`${vv.height}px`)};
    vv?.addEventListener('resize',viewportSync,{passive:true});vv?.addEventListener('scroll',viewportSync,{passive:true});viewportSync();

    setupDrawerGesture();
    cleanupNavigationState();
    document.addEventListener('visibilitychange',()=>D.classList.toggle('ar261-hidden',document.hidden),{passive:true});
    addEventListener('pageshow',()=>{cleanupNavigationState();viewportSync()},{passive:true});
    addEventListener('orientationchange',()=>setTimeout(()=>{cleanupNavigationState();viewportSync()},180),{passive:true});
  };

  function cleanupNavigationState(){
    const s=q('#sidebar'),o=q('#sidebarOverlay');if(!s||!o)return;
    const opened=s.classList.contains('open')||s.classList.contains('active')||s.classList.contains('is-open');
    if(!opened){D.style.setProperty('--ar261-drawer-progress','0');D.classList.remove('ar261-drawer-open','ar261-gesture');o.classList.remove('active','visible');if(!o.classList.contains('show'))o.setAttribute('aria-hidden','true');}
  }

  function setupDrawerGesture(){
    if(platform==='desktop'||reduce)return;
    const s=q('#sidebar'),o=q('#sidebarOverlay'),menu=q('#mobileMenuBtn');if(!s||!o)return;
    const W=()=>Math.min(innerWidth*.86,340);
    let active=false,startX=0,startY=0,lastX=0,lastT=0,vel=0,opening=false,owned=false;
    const isOpen=()=>s.classList.contains('open')||s.classList.contains('active')||s.classList.contains('is-open');
    const setP=p=>{p=Math.max(0,Math.min(1,p));D.style.setProperty('--ar261-drawer-progress',String(p));D.classList.toggle('ar261-drawer-open',p>.01);return p};
    const openDrawer=()=>{s.classList.add('open');o.classList.add('show');o.setAttribute('aria-hidden','false');menu?.setAttribute('aria-expanded','true');D.classList.add('ar261-drawer-open');setP(1)};
    const closeDrawer=()=>{s.classList.remove('open','active','is-open');o.classList.remove('show','active','visible');o.setAttribute('aria-hidden','true');menu?.setAttribute('aria-expanded','false');D.classList.remove('ar261-drawer-open');B.classList.remove('sidebar-open','menu-open','drawer-open','no-scroll','overflow-hidden');D.classList.remove('sidebar-open','menu-open','drawer-open');B.style.removeProperty('overflow');D.style.removeProperty('overflow');setP(0)};
    const excluded=t=>!!t.closest('input,textarea,select,[contenteditable="true"],input[type="range"],.horizontal-scroll,.carousel,[data-no-swipe],.modal,.bottom-sheet');

    addEventListener('touchstart',e=>{
      if(e.touches.length!==1||excluded(e.target))return;
      const t=e.touches[0],open=isOpen(),edge=platform==='ios'?34:28;
      if(!open&&t.clientX>edge)return;
      active=true;owned=false;opening=!open;startX=lastX=t.clientX;startY=t.clientY;lastT=performance.now();vel=0;
      if(open)setP(1);D.classList.add('ar261-gesture');
    },{passive:true});

    addEventListener('touchmove',e=>{
      if(!active||e.touches.length!==1)return;const t=e.touches[0],dx=t.clientX-startX,dy=t.clientY-startY;
      if(!owned){if(Math.abs(dx)<7&&Math.abs(dy)<7)return;if(Math.abs(dy)>Math.abs(dx)*1.18){active=false;D.classList.remove('ar261-gesture');return}owned=true}
      if(e.cancelable)e.preventDefault();
      const now=performance.now(),dt=Math.max(8,now-lastT);vel=(t.clientX-lastX)/dt;lastX=t.clientX;lastT=now;
      const p=opening?dx/W():1+dx/W();setP(p);
    },{passive:false});

    const end=()=>{
      if(!active)return;active=false;D.classList.remove('ar261-gesture');
      const raw=parseFloat(getComputedStyle(D).getPropertyValue('--ar261-drawer-progress'))||0;
      const complete=opening?(raw>.42||vel>.55):(raw>.58&&vel>-.55);
      requestAnimationFrame(()=>{if(complete)openDrawer();else closeDrawer()});
    };
    addEventListener('touchend',end,{passive:true});addEventListener('touchcancel',end,{passive:true});
    o.addEventListener('click',closeDrawer,{passive:true});
    document.addEventListener('click',e=>{const leaf=e.target.closest?.('#sidebar [data-page],#sidebar [data-go]');if(leaf&&!leaf.matches('.nav-parent,[data-nav-toggle]'))raf2(closeDrawer)},true);
    menu?.addEventListener('click',()=>setTimeout(()=>setP(isOpen()?1:0),0),{passive:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
})();