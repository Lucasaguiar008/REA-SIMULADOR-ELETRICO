(function(root){
  'use strict';
  const TYPE='sonoff-4ch-pro-r3';
  const read=(node,key)=>{try{const value=JSON.parse(node?.dataset?.[key]||'{}');return value&&typeof value==='object'&&!Array.isArray(value)?value:{}}catch{return{}}};
  const actualStates=component=>read(component,'relayChannels');
  const render=component=>{
    if(!component)return;
    const states=actualStates(component),powered=component.dataset.logicPowered==='true';
    for(let i=1;i<=4;i++){
      const on=powered&&states[String(i)]===true;
      const button=component.querySelector(`[data-sonoff-channel="${i}"]`);
      const face=component.querySelector(`[data-sonoff-button-face="${i}"]`);
      const led=component.querySelector(`[data-relay-led="${i}"]`);
      if(button)button.setAttribute('aria-pressed',String(on));
      if(face){
        face.setAttribute('fill-opacity',on?'0.13':'0');
        face.setAttribute('stroke-opacity',on?'0.95':'0');
        if(on)face.style.filter='drop-shadow(0 0 5px #4ade80)';else face.style.removeProperty('filter');
      }
      if(led){
        led.setAttribute('fill',on?'#22c55e':'#111827');
        led.setAttribute('fill-opacity',on?'1':'0.96');
        led.setAttribute('stroke',on?'#bbf7d0':'#020617');
        led.setAttribute('stroke-width',on?'2.4':'2');
        if(on)led.style.filter='drop-shadow(0 0 9px #4ade80)';else led.style.removeProperty('filter');
      }
    }
  };
  const renderSoon=component=>{setTimeout(()=>render(component),0);setTimeout(()=>render(component),35)};
  const initialize=component=>{
    if(!component||component.dataset.type!==TYPE)return;
    component.dataset.logicManualWiringTest='true';
    const current=read(component,'relayTestOverride');let changed=false;
    for(let i=1;i<=4;i++)if(typeof current[String(i)]!=='boolean'){current[String(i)]=false;changed=true}
    if(changed||!component.dataset.relayTestOverride)component.dataset.relayTestOverride=JSON.stringify(current);
    render(component);
  };
  const initializeAll=()=>document.querySelectorAll(`.placed-component[data-type="${TYPE}"]`).forEach(initialize);
  const toggleChannel=(component,channel)=>{
    initialize(component);
    const current=read(component,'relayTestOverride'),key=String(channel),next=current[key]!==true;
    current[key]=next;component.dataset.relayTestOverride=JSON.stringify(current);
    root.TECHRIB_ELECTRICAL?.recalculate?.();
    renderSoon(component);
    return next;
  };
  document.addEventListener('click',event=>{
    const target=event.target?.closest?.('[data-sonoff-channel]');if(!target)return;
    const component=target.closest(`.placed-component[data-type="${TYPE}"]`);
    if(!component||root.TECHRIB_ELECTRICAL?.simulationActive!==true)return;
    event.preventDefault();event.stopPropagation();
    toggleChannel(component,Math.max(1,Math.min(4,Number(target.getAttribute('data-sonoff-channel'))||1)));
  },true);
  document.addEventListener('techrib:simulation-mode',event=>{
    const mode=String(event.detail?.mode||'');initializeAll();
    if(mode==='edit'){
      document.querySelectorAll(`.placed-component[data-type="${TYPE}"]`).forEach(component=>{
        component.dataset.relayTestOverride=JSON.stringify({'1':false,'2':false,'3':false,'4':false});
        component.dataset.relayChannels='{}';render(component);
      });
    }else if(mode==='simulate'){
      setTimeout(()=>{root.TECHRIB_ELECTRICAL?.recalculate?.();document.querySelectorAll(`.placed-component[data-type="${TYPE}"]`).forEach(renderSoon)},0);
    }
  });
  document.addEventListener('techrib:project-loaded',()=>setTimeout(()=>{initializeAll();document.querySelectorAll(`.placed-component[data-type="${TYPE}"]`).forEach(renderSoon)},0));
  new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes||[]){if(node?.nodeType!==1)continue;if(node.matches?.(`.placed-component[data-type="${TYPE}"]`))initialize(node);node.querySelectorAll?.(`.placed-component[data-type="${TYPE}"]`).forEach(initialize)}}).observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(initializeAll,0);
  root.TechRibSonoff4ChRuntimeV1=Object.freeze({initializeAll,toggleChannel,render});
})(typeof window!=='undefined'?window:globalThis);
