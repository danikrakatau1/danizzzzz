(() => {
  'use strict';

  const SELECTOR='[data-nav-toggle]';
  const GROUP_SELECTOR='.nav-group[data-nav-group]';
  const MOTION_MS=310;
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false;
  const timers=new WeakMap();

  function directToggle(group){
    return group?.querySelector(':scope > [data-nav-toggle]')||null;
  }

  function directPanel(group,toggle){
    const id=toggle?.getAttribute('aria-controls');
    if(id){
      const panel=document.getElementById(id);
      if(panel&&group?.contains(panel))return panel;
    }
    return group?.querySelector(':scope > .nav-accordion-panel')||null;
  }

  function ensureIds(group,toggle,panel,index){
    if(!toggle||!panel)return;
    if(!toggle.id)toggle.id=`arstoreAccordionToggle${index+1}`;
    if(!panel.id)panel.id=`arstoreAccordionPanel${index+1}`;
    toggle.setAttribute('aria-controls',panel.id);
    panel.setAttribute('role','region');
    panel.setAttribute('aria-labelledby',toggle.id);
  }

  function setInert(panel,closed){
    if(!panel)return;
    panel.setAttribute('aria-hidden',String(closed));
    try{panel.inert=closed;}catch(_){
      if(closed)panel.setAttribute('inert','');else panel.removeAttribute('inert');
    }
  }

  function finishTransition(group){
    if(!group)return;
    group.classList.remove('is-accordion-transitioning');
    const old=timers.get(group);if(old)clearTimeout(old);timers.delete(group);
  }

  function markTransition(group){
    if(!group||reduced)return;
    finishTransition(group);
    group.classList.add('is-accordion-transitioning');
    const timer=setTimeout(()=>finishTransition(group),MOTION_MS);
    timers.set(group,timer);
  }

  function syncGroup(group,index=0,{animate=false}={}){
    if(!group)return;
    const toggle=directToggle(group),panel=directPanel(group,toggle);
    if(!toggle||!panel)return;
    ensureIds(group,toggle,panel,index);
    const open=group.classList.contains('is-open');
    toggle.setAttribute('aria-expanded',String(open));
    setInert(panel,!open);
    group.dataset.accordionState=open?'open':'closed';
    panel.dataset.accordionState=open?'open':'closed';
    if(animate)markTransition(group);
  }

  function syncAll(){
    document.querySelectorAll(GROUP_SELECTOR).forEach((group,index)=>syncGroup(group,index));
  }

  // Capture guard: the first click is handled by base app.js; repeated clicks during
  // the same transition are swallowed so nested accordion state cannot race.
  document.addEventListener('click',event=>{
    const toggle=event.target.closest?.(SELECTOR);
    if(!toggle)return;
    const group=toggle.closest(GROUP_SELECTOR);
    if(!group)return;
    if(group.classList.contains('is-accordion-transitioning')&&!reduced){
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    queueMicrotask(()=>syncGroup(group,[...document.querySelectorAll(GROUP_SELECTOR)].indexOf(group),{animate:true}));
  },true);

  // Native buttons already emit click for Enter/Space; this only prevents an
  // Escape/focus edge case when a panel closes programmatically around focused content.
  document.addEventListener('keydown',event=>{
    if(event.key!=='Escape')return;
    const focused=document.activeElement;
    const panel=focused?.closest?.('.nav-accordion-panel[aria-hidden="false"]');
    if(!panel)return;
    const group=panel.closest(GROUP_SELECTOR),toggle=directToggle(group);
    toggle?.focus({preventScroll:true});
  });

  const observer=new MutationObserver(records=>{
    const touched=new Set();
    for(const record of records){
      if(record.type==='attributes'&&record.attributeName==='class'){
        const group=record.target.closest?.(GROUP_SELECTOR);
        if(group)touched.add(group);
      }
    }
    if(!touched.size)return;
    const groups=[...document.querySelectorAll(GROUP_SELECTOR)];
    touched.forEach(group=>syncGroup(group,groups.indexOf(group),{animate:true}));
  });

  document.querySelectorAll(GROUP_SELECTOR).forEach(group=>observer.observe(group,{attributes:true,attributeFilter:['class']}));
  syncAll();

  // Re-run after route/history synchronization and late sidebar rebuilds.
  document.addEventListener('arstore:page-change',()=>requestAnimationFrame(syncAll));
  window.addEventListener('pageshow',syncAll,{passive:true});

  window.ARSTORE_ACCORDION_AUDIT_V265={
    sync:syncAll,
    version:'265',
    scope:'navigation-accordion-only'
  };
})();
