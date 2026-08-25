(() => {
  'use strict';
  const ROUTES = Object.freeze({
    dashboard:'/', research:'/produk-trending', fee:'/fee-engine', profit:'/kalkulator-profit',
    pricing:'/harga-ideal', ads:'/simulator-iklan', decision:'/decision-center',
    database:'/database-fee', settings:'/pengaturan'
  });
  const PAGE_BY_ROUTE = Object.freeze(Object.fromEntries(Object.entries(ROUTES).map(([p,r])=>[r,p])));
  const HISTORY_KEY='arstore_v2_nav_history';
  const pageTitle=document.getElementById('pageTitle');
  const sidebar=document.getElementById('sidebar');
  const overlay=document.getElementById('sidebarOverlay');
  const mobileMenuBtn=document.getElementById('mobileMenuBtn');
  const mobileMoreBtn=document.getElementById('mobileMoreBtn');
  const resetBtn=document.getElementById('resetWorkspaceBtn');
  const bottomNav=document.querySelector('.bottom-nav');
  const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const normalizePath=path=>{
    let clean=(path||'/').split('?')[0].split('#')[0];
    if(!clean.startsWith('/')) clean='/'+clean;
    clean=clean.replace(/\/{2,}/g,'/');
    if(clean.length>1) clean=clean.replace(/\/+$/,'');
    return clean||'/';
  };
  const pageFromLocation=()=>PAGE_BY_ROUTE[normalizePath(location.pathname)]||'dashboard';
  const activePage=()=>document.querySelector('.page.active')?.id?.replace(/^page-/,'')||'dashboard';
  const getHistory=()=>{try{return JSON.parse(sessionStorage.getItem(HISTORY_KEY)||'[]')}catch(_){return[]}};
  const setHistory=h=>{try{sessionStorage.setItem(HISTORY_KEY,JSON.stringify(h.slice(-30)))}catch(_){}};
  const remember=current=>{
    const h=getHistory();
    if(current&&h[h.length-1]!==current) h.push(current);
    setHistory(h);
  };

  function closeSidebar(){
    sidebar?.classList.remove('open');
    overlay?.classList.remove('show');
    document.body.classList.remove('drawer-open','sidebar-open','menu-open');
    if(!document.querySelector('.research-modal.is-open,.quick-preview.is-open')) document.body.style.overflow='';
    mobileMenuBtn?.setAttribute('aria-expanded','false');
    sidebar?.setAttribute('aria-hidden',matchMedia('(max-width:820px)').matches?'true':'false');
  }
  function openSidebar(){
    if(!sidebar)return;
    sidebar.classList.add('open'); overlay?.classList.add('show');
    document.body.classList.add('drawer-open'); document.body.style.overflow='hidden';
    mobileMenuBtn?.setAttribute('aria-expanded','true'); sidebar.setAttribute('aria-hidden','false');
  }
  function toggleSidebar(e){
    e?.preventDefault();
    sidebar?.classList.contains('open')?closeSidebar():openSidebar();
  }
  function animatePage(target){
    if(!target||reduceMotion)return;
    target.classList.remove('is-entering'); void target.offsetWidth; target.classList.add('is-entering');
    setTimeout(()=>target.classList.remove('is-entering'),700);
  }
  function syncLiquidIndicator(){
    if(!bottomNav) return;
    const indicator=bottomNav.querySelector('.bottom-nav-liquid-indicator');
    const items=[...bottomNav.querySelectorAll('.bottom-item')];
    const active=bottomNav.querySelector('.bottom-item.active')||items[0];
    if(!indicator||!active||!items.length) return;
    const navRect=bottomNav.getBoundingClientRect(), rect=active.getBoundingClientRect();
    indicator.style.width=`${rect.width}px`;
    indicator.style.transform=`translate3d(${rect.left-navRect.left}px,0,0)`;
  }
  function showPage(name,{push=true,replace=false,scroll=true,rememberFrom=false}={}){
    const target=document.getElementById(`page-${name}`);
    if(!target||!ROUTES[name])return false;
    const current=activePage();
    if(rememberFrom&&current!==name) remember(current);
    document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p===target));
    document.querySelectorAll('[data-page]').forEach(i=>i.classList.toggle('active',i.dataset.page===name));
    const title=target.dataset.title||'ARSTORE Tools V2';
    if(pageTitle) pageTitle.textContent=title;
    document.title=name==='dashboard'?'ARSTORE Tools V2':`${title} — ARSTORE Tools V2`;
    animatePage(target);
    const route=ROUTES[name], currentRoute=normalizePath(location.pathname);
    if(push&&currentRoute!==route){
      const state={page:name};
      replace?history.replaceState(state,'',route):history.pushState(state,'',route);
    }
    if(scroll) scrollTo({top:0,behavior:reduceMotion?'auto':'smooth'});
    closeSidebar();
    requestAnimationFrame(syncLiquidIndicator);
    return true;
  }
  function goBack(){
    const h=getHistory(), prev=h.pop(); setHistory(h);
    if(prev&&showPage(prev,{rememberFrom:false})) return;
    const current=activePage();
    if(current!=='dashboard') showPage('dashboard',{rememberFrom:false});
    else closeSidebar();
  }

  document.addEventListener('click',e=>{
    const back=e.target.closest('[data-nav-back]');
    if(back){e.preventDefault();goBack();return}
    const nav=e.target.closest('[data-page],[data-go]');
    if(nav){
      const name=nav.dataset.page||nav.dataset.go;
      if(name&&ROUTES[name]){e.preventDefault();showPage(name,{rememberFrom:true});return}
    }
    const mode=e.target.closest('.mode-btn');
    if(mode){
      const group=mode.closest('.mode-switch');
      group?.querySelectorAll('.mode-btn').forEach(b=>b.classList.toggle('active',b===mode));
    }
  });

  document.addEventListener('keydown',e=>{
    if(e.key==='Escape') closeSidebar();
    const nav=e.target.closest?.('[data-go][tabindex]');
    if(nav&&(e.key==='Enter'||e.key===' ')){
      e.preventDefault(); showPage(nav.dataset.go,{rememberFrom:true});
    }
  });
  window.addEventListener('popstate',()=>showPage(pageFromLocation(),{push:false,scroll:false,rememberFrom:false}));
  mobileMenuBtn?.addEventListener('click',toggleSidebar);
  mobileMoreBtn?.addEventListener('click',toggleSidebar);
  overlay?.addEventListener('click',closeSidebar);
  resetBtn?.addEventListener('click',()=>{
    if(confirm('Reset tampilan workspace V2?\n\nData analisis tersimpan lokal akan tetap aman kecuali dihapus dari masing-masing step.')){
      setHistory([]); showPage('dashboard',{rememberFrom:false});
    }
  });
  window.addEventListener('resize',()=>{
    if(innerWidth>820) closeSidebar();
    else if(!sidebar?.classList.contains('open')) sidebar?.setAttribute('aria-hidden','true');
    requestAnimationFrame(syncLiquidIndicator);
  },{passive:true});
  if(innerWidth<=820) sidebar?.setAttribute('aria-hidden','true');

  const initial=pageFromLocation(), path=normalizePath(location.pathname);
  if(!PAGE_BY_ROUTE[path]) history.replaceState({page:'dashboard'},'',ROUTES.dashboard);
  else history.replaceState({page:initial},'',ROUTES[initial]);
  showPage(initial,{push:false,scroll:false,rememberFrom:false});

  window.ARSTORE_NAV={showPage,goBack,openSidebar,closeSidebar};

  function addHeadLink(rel,href,extra={}){
    if(document.head.querySelector(`link[href="${href}"]`)) return;
    const l=document.createElement('link'); l.rel=rel; l.href=href;
    Object.entries(extra).forEach(([k,v])=>l.setAttribute(k,v)); document.head.appendChild(l);
  }
  addHeadLink('icon','/assets/arstore-emblem-transparent.png',{'type':'image/png'});
  addHeadLink('apple-touch-icon','/assets/arstore-emblem-transparent.png');
  addHeadLink('manifest','/site.webmanifest');
  addHeadLink('stylesheet','/css/ui-polish.css',{'data-arstore-ui-polish':'1'});

  if(bottomNav&&!bottomNav.querySelector('.bottom-nav-liquid-indicator')){
    const bubble=document.createElement('span'); bubble.className='bottom-nav-liquid-indicator'; bubble.setAttribute('aria-hidden','true');
    bottomNav.prepend(bubble); requestAnimationFrame(syncLiquidIndicator);

    let startX=0,startY=0,dragging=false,suppressClick=false;
    const items=()=>[...bottomNav.querySelectorAll('.bottom-item')];
    bottomNav.addEventListener('pointerdown',e=>{
      if(innerWidth>820||e.pointerType==='mouse') return;
      startX=e.clientX; startY=e.clientY; dragging=false; suppressClick=false;
    },{passive:true});
    bottomNav.addEventListener('pointermove',e=>{
      if(innerWidth>820||!startX) return;
      const dx=e.clientX-startX,dy=e.clientY-startY;
      if(!dragging&&Math.abs(dx)>12&&Math.abs(dx)>Math.abs(dy)+5){dragging=true;suppressClick=true;bottomNav.classList.add('is-dragging')}
      if(!dragging) return;
      const bubble=bottomNav.querySelector('.bottom-nav-liquid-indicator'),rect=bottomNav.getBoundingClientRect();
      if(!bubble) return;
      const w=bubble.getBoundingClientRect().width, x=Math.max(0,Math.min(rect.width-w,e.clientX-rect.left-w/2));
      bubble.style.transform=`translate3d(${x}px,0,0)`;
    },{passive:true});
    const finishDrag=e=>{
      if(!startX) return;
      if(dragging){
        const list=items(),x=e.clientX;
        let nearest=list[0],dist=Infinity;
        list.forEach(it=>{const r=it.getBoundingClientRect(),d=Math.abs(x-(r.left+r.width/2));if(d<dist){dist=d;nearest=it}});
        bottomNav.classList.remove('is-dragging');
        const page=nearest?.dataset.page;
        if(page) showPage(page,{rememberFrom:true}); else if(nearest?.id==='mobileMoreBtn') toggleSidebar(e);
      }
      startX=0;startY=0;dragging=false;setTimeout(()=>{suppressClick=false},80);requestAnimationFrame(syncLiquidIndicator);
    };
    bottomNav.addEventListener('pointerup',finishDrag,{passive:true});
    bottomNav.addEventListener('pointercancel',finishDrag,{passive:true});
    bottomNav.addEventListener('click',e=>{if(suppressClick){e.preventDefault();e.stopImmediatePropagation()}},true);
  }

  let lastY=Math.max(0,window.scrollY), scrollTick=false;
  const updateBottomNavVisibility=()=>{
    scrollTick=false;
    if(!bottomNav||innerWidth>820){bottomNav?.classList.remove('is-hidden');return;}
    const y=Math.max(0,window.scrollY), delta=y-lastY;
    const activeEl=document.activeElement, editing=activeEl&&/^(INPUT|TEXTAREA|SELECT)$/.test(activeEl.tagName);
    if(y<36||editing||sidebar?.classList.contains('open')) bottomNav.classList.remove('is-hidden');
    else if(delta>14) bottomNav.classList.add('is-hidden');
    else if(delta<-14) bottomNav.classList.remove('is-hidden');
    if(Math.abs(delta)>5) lastY=y;
  };
  window.addEventListener('scroll',()=>{if(!scrollTick){scrollTick=true;requestAnimationFrame(updateBottomNavVisibility)}},{passive:true});

  if(!document.querySelector('script[data-arstore-fee-bootstrap]')){
    const s=document.createElement('script');
    s.src='/js/fee-bootstrap.js'; s.defer=true; s.dataset.arstoreFeeBootstrap='1';
    document.body.appendChild(s);
  }
  if(!document.querySelector('script[data-arstore-profit-bootstrap]')){
    const s=document.createElement('script');
    s.src='/js/profit-bootstrap.js'; s.defer=true; s.dataset.arstoreProfitBootstrap='1';
    document.body.appendChild(s);
  }
})();
