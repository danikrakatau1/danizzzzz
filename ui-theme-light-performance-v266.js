/* ARSTORE V266 B2.6 — light-path theme coordinator hardening */
(()=>{
  'use strict';
  const root=document.documentElement;
  let clearTimer=0,lastTarget='';
  const mark=(target)=>{
    const current=root.dataset.theme||'dark';
    const lightPath=current==='light'||target==='light';
    root.classList.toggle('ar266-light-path',lightPath);
    lastTarget=target||current;
    clearTimeout(clearTimer);
    clearTimer=setTimeout(()=>{
      root.classList.remove('ar266-light-path');
      lastTarget='';
    },420);
  };
  document.addEventListener('pointerdown',e=>{
    const btn=e.target.closest?.('[data-theme-choice]');
    if(btn)mark(btn.dataset.themeChoice||'');
  },{capture:true,passive:true});
  document.addEventListener('keydown',e=>{
    if(e.key!=='Enter'&&e.key!==' ')return;
    const btn=e.target.closest?.('[data-theme-choice]');
    if(btn)mark(btn.dataset.themeChoice||'');
  },{capture:true});
  new MutationObserver(records=>{
    if(!records.some(r=>r.attributeName==='data-theme'))return;
    const next=root.dataset.theme||'dark';
    if(!lastTarget)mark(next);
  }).observe(root,{attributes:true,attributeFilter:['data-theme']});
  window.ARSTORE_THEME_LIGHT_PERF_V266={presentationOnly:true,mark};
})();
