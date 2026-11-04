/* TechRib V24 — retenção por exemplos
   Favoritos persistentes para usuários autenticados, sem salvar projeto gratuito. */
(()=>{
  'use strict';
  const access=window.TECHRIB_USER_ACCESS||{};
  if(access.authenticated!==true)return;
  const csrf=document.querySelector('meta[name="csrf-token"]')?.content||'';
  if(!csrf)return;

  let favorites=new Set();
  let loaded=false;
  const endpoint='/?api=saas-example-library';
  const escapeId=value=>String(value||'').trim();

  const api=async(payload=null)=>{
    const options={credentials:'same-origin',headers:{'Accept':'application/json'}};
    if(payload){
      options.method='POST';
      options.headers['Content-Type']='application/json';
      options.headers['X-CSRF-Token']=csrf;
      options.body=JSON.stringify(payload);
    }
    const response=await fetch(endpoint,options);
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(data.error||'Não foi possível atualizar seus favoritos.');
    return data;
  };

  const exampleCardFrom=node=>node?.closest?.('.example-card[data-example-id]')||null;
  const exampleName=card=>String(card?.querySelector?.('.example-card-copy>b')?.textContent||card?.title?.split('\n')?.[0]||card?.dataset?.exampleId||'Exemplo').trim();
  const syncControl=control=>{
    const card=exampleCardFrom(control);
    const id=escapeId(card?.dataset?.exampleId);
    const active=favorites.has(id);
    control.classList.toggle('active',active);
    control.textContent=active?'★':'☆';
    control.setAttribute('aria-pressed',active?'true':'false');
    control.title=active?'Remover dos favoritos':'Adicionar aos favoritos';
    control.setAttribute('aria-label',control.title);
  };
  const decorate=card=>{
    if(!card||card.dataset.favoriteReady==='1')return;
    const id=escapeId(card.dataset.exampleId);
    if(!id)return;
    card.dataset.favoriteReady='1';
    const control=document.createElement('span');
    control.className='techrib-example-favorite';
    control.dataset.favoriteToggle='';
    control.setAttribute('role','button');
    control.tabIndex=0;
    card.appendChild(control);
    syncControl(control);
  };
  const decorateAll=root=>{
    if(root?.matches?.('.example-card[data-example-id]'))decorate(root);
    root?.querySelectorAll?.('.example-card[data-example-id]').forEach(decorate);
  };
  const refreshAll=()=>document.querySelectorAll('.techrib-example-favorite').forEach(syncControl);

  const toggle=async control=>{
    const card=exampleCardFrom(control);
    const id=escapeId(card?.dataset?.exampleId);
    if(!id||control.dataset.busy==='1')return;
    control.dataset.busy='1';
    control.classList.add('busy');
    try{
      const data=await api({
        action:'toggle_favorite',
        exampleId:id,
        exampleName:exampleName(card),
        premium:String(card.dataset.exampleAccess||'')==='premium'
      });
      if(data.favorite)favorites.add(id);else favorites.delete(id);
      refreshAll();
      document.dispatchEvent(new CustomEvent('techrib:example-favorites-changed',{detail:{exampleId:id,favorite:Boolean(data.favorite)}}));
    }catch(error){
      if(window.TechRibSaaS?.notify)window.TechRibSaaS.notify(error.message);
      else console.warn('TechRib favoritos:',error);
    }finally{
      delete control.dataset.busy;
      control.classList.remove('busy');
    }
  };

  document.addEventListener('click',event=>{
    const control=event.target.closest?.('[data-favorite-toggle]');
    if(!control)return;
    event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
    toggle(control);
  },true);
  document.addEventListener('keydown',event=>{
    const control=event.target.closest?.('[data-favorite-toggle]');
    if(!control||!['Enter',' '].includes(event.key))return;
    event.preventDefault();event.stopPropagation();
    toggle(control);
  },true);

  const observer=new MutationObserver(records=>records.forEach(record=>record.addedNodes.forEach(node=>{if(node.nodeType===1)decorateAll(node)})));
  observer.observe(document.documentElement,{childList:true,subtree:true});
  decorateAll(document);

  api().then(data=>{
    favorites=new Set((data.favorites||[]).map(item=>escapeId(typeof item==='string'?item:item.id)).filter(Boolean));
    loaded=true;refreshAll();
  }).catch(error=>console.warn('TechRib favoritos:',error));
})();
