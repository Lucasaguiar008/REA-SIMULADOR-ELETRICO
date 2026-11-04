(()=>{
  const workbench=document.querySelector('[data-workbench]');
  if(!workbench)return;
  const compact=()=>window.matchMedia('(max-width:1024px)').matches;
  const initialize=()=>{
    document.documentElement.classList.toggle('techrib-compact',compact());
    if(compact()&&!sessionStorage.getItem('techrib-mobile-sidebar-seen')) workbench.classList.add('sidebar-hidden');
  };
  initialize();
  window.addEventListener('resize',initialize,{passive:true});
  window.addEventListener('orientationchange',()=>setTimeout(initialize,120),{passive:true});
  document.querySelector('.component-sidebar')?.addEventListener('click',event=>{
    if(!compact())return;
    const item=event.target.closest('.component-item');
    if(item&&!item.dataset.wireColor){
      sessionStorage.setItem('techrib-mobile-sidebar-seen','1');
      setTimeout(()=>workbench.classList.add('sidebar-hidden'),80);
    }
  });
  document.querySelectorAll('.sidebar-toggle,.close-sidebar').forEach(btn=>btn.addEventListener('click',()=>sessionStorage.setItem('techrib-mobile-sidebar-seen','1')));
})();
