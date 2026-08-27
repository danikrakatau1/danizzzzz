/* ARSTORE Tools V3.4 · FINAL RELEASE HARDENING #131–#175
   UI/release safety only. Locked engines and formulas are intentionally untouched. */
(()=>{'use strict';
  const root=document.documentElement;
  const VERSION=175;
  const RELEASE='V3.4-RC1-175-LOCAL';
  const THEME_KEY='arstore_v3_theme';
  const STORAGE_VERSION_KEY='arstore_v3_storage_schema';
  const supportedThemes=new Set(['dark','light','charcoal','oled']);
  const reduceMotion=matchMedia?.('(prefers-reduced-motion: reduce)')?.matches||false;
  let currentModal=null;
  let lastTrigger=null;
  root.dataset.release=RELEASE;
  root.dataset.themeReady='1';
  root.dataset.network=navigator.onLine===false?'offline':'online';
  if((navigator.hardwareConcurrency&&navigator.hardwareConcurrency<=4)||(navigator.deviceMemory&&navigator.deviceMemory<=4)) root.dataset.uiPerformance='reduced';
  function safeRead(key,fallback=null){try{const v=localStorage.getItem(key);return v===null?fallback:v}catch(_){return fallback}}
  function safeWrite(key,value){try{localStorage.setItem(key,value);return true}catch(_){return false}}
  function migrateStorage(){const previous=safeRead(STORAGE_VERSION_KEY,'0');const saved=safeRead(THEME_KEY,root.dataset.theme||'dark');if(!supportedThemes.has(saved)) safeWrite(THEME_KEY,'dark');safeWrite(STORAGE_VERSION_KEY,'3.4.175');return {from:previous,to:'3.4.175',theme:supportedThemes.has(saved)?saved:'dark'}}
  const migration=migrateStorage();
  function toast(message,{kind='info',ttl=3200}={}){let q=document.getElementById('arstoreToastQueue');if(!q){q=document.createElement('div');q.id='arstoreToastQueue';q.setAttribute('role','region');q.setAttribute('aria-label','Notifikasi');document.body.appendChild(q)}while(q.children.length>=3) q.firstElementChild?.remove();const n=document.createElement('div');n.className='arstore-toast';n.dataset.kind=kind;n.setAttribute('role',kind==='error'?'alert':'status');n.textContent=message;q.appendChild(n);setTimeout(()=>n.remove(),reduceMotion?Math.min(ttl,1200):ttl);return n}
  function syncNetwork(){root.dataset.network=navigator.onLine===false?'offline':'online';let b=document.getElementById('arstoreNetworkBanner');if(navigator.onLine===false){if(!b){b=document.createElement('div');b.id='arstoreNetworkBanner';b.setAttribute('role','status');b.textContent='Koneksi terputus · input tetap dipertahankan';document.body.appendChild(b)}}else if(b){b.remove();toast('Koneksi kembali aktif',{ttl:1800})}}
  addEventListener('online',syncNetwork);addEventListener('offline',syncNetwork);syncNetwork();
  const modalSelector='.pc-modal,.research-modal.is-open,.quick-preview.is-open';
  function visibleModal(){return document.querySelector('.pc-modal')||document.querySelector('.research-modal.is-open')||document.querySelector('.quick-preview.is-open')}
  function rememberTrigger(e){const t=e.target.closest('button,a,[role="button"]');if(t)lastTrigger=t}
  document.addEventListener('pointerdown',rememberTrigger,true);
  function releaseModalState({restore=false}={}){currentModal=null;if(!visibleModal()){document.body.classList.remove('pc-modal-open');document.body.style.overflow=''}if(restore&&lastTrigger?.isConnected){try{lastTrigger.focus({preventScroll:true})}catch(_){lastTrigger.focus()}}}
  addEventListener('popstate',()=>{const m=visibleModal();if(m?.classList.contains('pc-modal')) window.ARSTORE_FINAL_VISUAL_HARDENING?.closePcModal?.(m,{restoreFocus:false,animate:false});else if(m){m.classList.remove('is-open');m.setAttribute('aria-hidden','true');releaseModalState()}});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){const capsule=document.querySelector('.theme-action-capsule.is-open');if(capsule) capsule.querySelector('[data-theme-capsule-toggle]')?.click()}const option=e.target.closest?.('.theme-capsule-option');if(option&&(e.key==='Home'||e.key==='End')){const all=[...option.parentElement.querySelectorAll('.theme-capsule-option')];e.preventDefault();(e.key==='Home'?all[0]:all.at(-1))?.focus()}});
  function annotateDestructive(scope=document){scope.querySelectorAll?.('button').forEach(b=>{const text=(b.textContent||'').trim().toLowerCase();if(/^(hapus|delete|reset|clear|kosongkan)/.test(text)) b.dataset.destructive='true'})}
  document.addEventListener('submit',e=>{const form=e.target;if(!(form instanceof HTMLFormElement))return;if(form.dataset.submitLocked==='1'){e.preventDefault();e.stopImmediatePropagation();return}form.dataset.submitLocked='1';const submitter=e.submitter||form.querySelector('button[type="submit"],input[type="submit"]');if(submitter)submitter.setAttribute('aria-busy','true');setTimeout(()=>{if(form.isConnected){delete form.dataset.submitLocked;submitter?.removeAttribute('aria-busy')}},900)},true);
  const clickLocks=new WeakMap();document.addEventListener('click',e=>{const b=e.target.closest?.('button,[role="button"]');if(!b)return;if(!(b.dataset.destructive==='true'||b.hasAttribute('data-pc-close')||b.classList.contains('theme-capsule-option')))return;const now=performance.now(),prev=clickLocks.get(b)||0;clickLocks.set(b,now);if(now-prev<260){e.preventDefault();e.stopImmediatePropagation()}},true);
  let raf=0;function geometryRecovery(){cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>{document.querySelectorAll('.pc-modal-card').forEach(card=>{card.style.maxWidth='';card.scrollTop=Math.min(card.scrollTop,card.scrollHeight-card.clientHeight)});document.dispatchEvent(new CustomEvent('arstore:geometry-stable',{detail:{width:innerWidth,height:innerHeight,orientation:screen.orientation?.type||''}}))})}
  addEventListener('resize',geometryRecovery,{passive:true});addEventListener('orientationchange',geometryRecovery,{passive:true});visualViewport?.addEventListener('resize',geometryRecovery,{passive:true});
  document.addEventListener('input',e=>{const f=e.target.closest?.('form');if(f)f.dataset.dirty='1'},{capture:true,passive:true});
  const metrics={bootAt:Date.now(),delegatedListeners:8,observers:1,modalCycles:0,geometryCycles:0};
  const mo=new MutationObserver(muts=>{for(const m of muts) for(const n of m.addedNodes) if(n.nodeType===1){annotateDestructive(n);if(n.matches?.('.pc-modal')||n.querySelector?.('.pc-modal')){metrics.modalCycles++;currentModal=visibleModal()}}});mo.observe(document.body,{childList:true,subtree:true});annotateDestructive();document.addEventListener('arstore:geometry-stable',()=>metrics.geometryCycles++);
  const runtimeErrors=[];addEventListener('error',e=>runtimeErrors.push({type:'error',message:e.message||String(e.error||'error'),at:Date.now()}));addEventListener('unhandledrejection',e=>runtimeErrors.push({type:'rejection',message:String(e.reason?.message||e.reason||'rejection'),at:Date.now()}));
  window.ARSTORE_RELEASE_HARDENING={version:VERSION,release:RELEASE,migration,metrics,runtimeErrors,themes:[...supportedThemes],toast,syncNetwork,geometryRecovery,state(){return {theme:root.dataset.theme,network:root.dataset.network,performance:root.dataset.uiPerformance||'normal',modal:!!visibleModal(),errors:runtimeErrors.length}}};
})();
