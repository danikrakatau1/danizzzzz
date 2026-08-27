/* ARSTORE V259 — iOS sidebar navigation anomaly fix; UI/router hygiene only */
(()=>{
  const ua=navigator.userAgent||'';
  const isiOS=/iPhone|iPad|iPod/i.test(ua)||(/Macintosh/i.test(ua)&&navigator.maxTouchPoints>1);
  if(!isiOS)return;
  const sidebar=document.getElementById('sidebar');
  const overlay=document.getElementById('sidebarOverlay');
  const menuBtn=document.getElementById('mobileMenuBtn');
  if(!sidebar||!overlay)return;

  const closeDrawer=()=>{
    sidebar.classList.remove('open','active','is-open');
    overlay.classList.remove('show','active','visible');
    overlay.setAttribute('aria-hidden','true');
    if(menuBtn)menuBtn.setAttribute('aria-expanded','false');
    document.documentElement.classList.remove('sidebar-open','menu-open','drawer-open');
    document.body.classList.remove('sidebar-open','menu-open','drawer-open','no-scroll','overflow-hidden');
    document.body.style.removeProperty('overflow');
    document.documentElement.style.removeProperty('overflow');
  };

  document.addEventListener('click',e=>{
    const target=e.target&&e.target.closest?e.target.closest('#sidebar [data-page],#sidebar [data-go]'):null;
    if(!target)return;
    if(target.matches('[data-nav-toggle],.nav-parent'))return;
    requestAnimationFrame(()=>requestAnimationFrame(closeDrawer));
  },true);

  overlay.addEventListener('click',closeDrawer,{passive:true});
  addEventListener('pageshow',()=>{
    if(!sidebar.classList.contains('open')&&!sidebar.classList.contains('active')&&!sidebar.classList.contains('is-open'))closeDrawer();
  });
})();
