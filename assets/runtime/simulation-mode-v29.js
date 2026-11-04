/* TechRib V29 — modo EDITAR / SIMULAR.
   Centraliza os controles de execução e deixa o estado visual explícito sem mexer
   no motor elétrico propriamente dito. */
(function(root){
  'use strict';
  const VERSION=29;
  const create=({document:doc=root.document,workbench,getState,start,pause,stop}={})=>{
    if(!doc?.querySelectorAll)throw new Error('TechRibSimulationModeRuntime: document ausente');
    if(!workbench?.classList||!workbench?.dataset)throw new Error('TechRibSimulationModeRuntime: workbench ausente');
    for(const [name,fn] of Object.entries({getState,start,pause,stop}))if(typeof fn!=='function')throw new Error(`TechRibSimulationModeRuntime: ${name} ausente`);
    let bound=false;
    const buttons=()=>({
      start:[...doc.querySelectorAll('[data-action="simulate"]')],
      pause:[...doc.querySelectorAll('[data-action="pause-simulation"]')],
      stop:[...doc.querySelectorAll('[data-action="stop-simulation"]')],
    });
    const ensureBadge=()=>{
      let badge=doc.querySelector('[data-simulation-mode-badge]');
      if(badge)return badge;
      badge=doc.createElement('div');badge.className='simulation-mode-badge';badge.dataset.simulationModeBadge='';badge.setAttribute('role','status');badge.setAttribute('aria-live','polite');
      badge.innerHTML='<span class="simulation-mode-dot" aria-hidden="true"></span><span data-simulation-mode-text>EDITAR</span>';
      const group=doc.querySelector('.simulation-group');
      if(group?.parentNode)group.parentNode.insertBefore(badge,group);else (doc.querySelector('.cad-toolbar')||doc.body)?.appendChild?.(badge);
      return badge;
    };
    const normalize=state=>({active:Boolean(state?.active),paused:Boolean(state?.active&&state?.paused)});
    const sync=stateArg=>{
      const state=normalize(stateArg||getState()),mode=!state.active?'edit':state.paused?'paused':'simulate';
      const label=mode==='edit'?'EDITAR':mode==='paused'?'SIMULAÇÃO PAUSADA':'SIMULANDO';
      workbench.dataset.editorMode=mode;workbench.classList.toggle('simulation-running',state.active);workbench.classList.toggle('simulation-paused',state.paused);
      doc.documentElement?.setAttribute?.('data-techrib-mode',mode);
      const badge=ensureBadge();if(badge){badge.dataset.mode=mode;const text=badge.querySelector('[data-simulation-mode-text]');if(text)text.textContent=label;badge.title=mode==='edit'?'Edição liberada. A simulação está parada.':mode==='paused'?'Simulação pausada.':'Simulação elétrica em execução.'}
      const b=buttons();b.start.forEach(node=>{node.classList.toggle('active',state.active&&!state.paused);node.setAttribute('aria-pressed',String(state.active&&!state.paused))});b.pause.forEach(node=>{node.disabled=!state.active;node.classList.toggle('active',state.paused);node.setAttribute('aria-pressed',String(state.paused))});b.stop.forEach(node=>{node.disabled=!state.active});
      if(doc.dispatchEvent){const E=root.CustomEvent;try{doc.dispatchEvent(E?new E('techrib:simulation-mode',{detail:{...state,mode,label}}):{type:'techrib:simulation-mode',detail:{...state,mode,label}})}catch(_){}}

      return Object.freeze({...state,mode,label});
    };
    const bind=()=>{
      if(bound)return api;bound=true;const b=buttons();
      b.start.forEach(node=>node.addEventListener('click',()=>{start();sync()}));
      b.pause.forEach(node=>node.addEventListener('click',()=>{pause();sync()}));
      b.stop.forEach(node=>node.addEventListener('click',()=>{stop();sync()}));
      sync();return api;
    };
    const api=Object.freeze({VERSION,bind,sync,ensureBadge,get state(){return normalize(getState())}});
    return api;
  };
  root.TechRibSimulationModeRuntime=Object.freeze({VERSION,create});
})(typeof window!=='undefined'?window:globalThis);
