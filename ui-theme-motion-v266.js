/* ARSTORE V266 B2.1 — presentation-only theme transition coordinator */
(()=>{
  'use strict';
  const root=document.documentElement;
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false;
  let timer=0;

  function arm(){
    if(reduced)return;
    root.classList.add('ar266-theme-transitioning');
    clearTimeout(timer);
    timer=setTimeout(()=>root.classList.remove('ar266-theme-transitioning'),340);
  }

  // Presentation preflight only. Theme state/click authority stays in v3-shell.
  document.addEventListener('pointerdown',event=>{
    if(event.target.closest?.('[data-theme-choice]'))arm();
  },{capture:true,passive:true});
  document.addEventListener('keydown',event=>{
    if((event.key==='Enter'||event.key===' ')&&event.target.closest?.('[data-theme-choice]'))arm();
  },{capture:true});

  new MutationObserver(records=>{
    if(records.some(r=>r.attributeName==='data-theme')){
      arm();
      const theme=root.dataset.theme||'dark';
      document.querySelectorAll('[data-theme-choice]').forEach(btn=>{
        const active=btn.dataset.themeChoice===theme;
        btn.classList.toggle('active',active);
        btn.setAttribute('aria-pressed',String(active));
      });
    }
  }).observe(root,{attributes:true,attributeFilter:['data-theme']});

  window.ARSTORE_THEME_MOTION_V266={presentationOnly:true,arm};
})();
