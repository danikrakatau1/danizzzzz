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
  },{passive:true});
  if(innerWidth<=820) sidebar?.setAttribute('aria-hidden','true');

  const initial=pageFromLocation(), path=normalizePath(location.pathname);
  if(!PAGE_BY_ROUTE[path]) history.replaceState({page:'dashboard'},'',ROUTES.dashboard);
  else history.replaceState({page:initial},'',ROUTES[initial]);
  showPage(initial,{push:false,scroll:false,rememberFrom:false});

  window.ARSTORE_NAV={showPage,goBack,openSidebar,closeSidebar};

  if(!document.querySelector('script[data-arstore-fee-bootstrap]')){
    const s=document.createElement('script');
    s.src='/js/fee-bootstrap.js'; s.defer=true; s.dataset.arstoreFeeBootstrap='1';
    document.body.appendChild(s);
  }
})();