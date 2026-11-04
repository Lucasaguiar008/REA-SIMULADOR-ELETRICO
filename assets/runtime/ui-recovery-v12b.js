(function(global){
  'use strict';
  const q=(s,r=document)=>r.querySelector(s);
  const qa=(s,r=document)=>[...r.querySelectorAll(s)];
  const workbench=()=>q('.workbench');
  const tabs=()=>qa('[data-library-tab]');
  const selectTab=tab=>{
    const wb=workbench();
    if(!wb)return;
    wb.classList.toggle('examples-view',tab==='examples');
    wb.classList.toggle('automation-view',tab==='automation');
    tabs().forEach(button=>button.classList.toggle('active',button.dataset.libraryTab===tab));
    if(tab==='examples'){
      const section=q('.examples-group');
      if(section)section.classList.add('open');
    }
  };
  const handler=event=>{
    const tab=event.target.closest?.('[data-library-tab]');
    if(tab){selectTab(tab.dataset.libraryTab);return;}
    const examples=event.target.closest?.('[data-action="show-examples"]');
    if(examples){workbench()?.classList.remove('sidebar-hidden');selectTab('examples');}
  };
  // Capture phase: funciona mesmo que outra camada de UI pare antes de registrar os listeners normais.
  document.addEventListener('click',handler,true);
  document.addEventListener('pointerup',event=>{
    const target=event.target.closest?.('[data-library-tab="examples"]');
    if(target)selectTab('examples');
  },true);
  global.TechRibUiRecoveryV12B={selectTab,version:'12B'};
})(window);
