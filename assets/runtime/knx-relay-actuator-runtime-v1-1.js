(function(root){
  'use strict';
  const base=root.TechRibCurrentLoopRuntimeV1;
  if(!base?.create)throw new Error('TechRibKnxRelayActuatorRuntimeV1_1: runtime base ausente');
  const baseCreate=base.create.bind(base);
  const create=options=>{
    const delegated=baseCreate(options);
    const {sheet,registryDefinition}=options||{};
    if(!sheet?.querySelectorAll||typeof registryDefinition!=='function')throw new Error('TechRibKnxRelayActuatorRuntimeV1_1: dependências ausentes');
    const all=()=>[...sheet.querySelectorAll('.placed-component[data-registry-id]')].filter(c=>registryDefinition(c)?.behavior?.family==='knx-switch-actuator');
    const recalc=()=>{try{root.TECHRIB_ELECTRICAL?.recalculate?.()}catch{}}
    const readObj=(c,key)=>{try{return JSON.parse(c.dataset[key]||'{}')}catch{return{}}};
    const applyChannelLeds=(c)=>{
      const states=readObj(c,'relayChannels');
      c.querySelectorAll('[data-relay-led]').forEach(node=>{
        const key=String(node.getAttribute('data-relay-led')||'');
        const active=states[key]===true;
        node.setAttribute('fill',active?'#7CFF5B':'#274e37');
        node.setAttribute('stroke',active?'#f7fee7':'#b7cdbd');
        node.setAttribute('stroke-width','3');
        if(active){
          node.style.filter='drop-shadow(0 0 8px #7CFF5B) drop-shadow(0 0 14px rgba(124,255,91,.95))';
        }else{
          node.style.filter='drop-shadow(0 0 1px rgba(39,78,55,.45))';
        }
      });
    };
    const render=c=>{
      const def=registryDefinition(c)||{},ch=Number(def.behavior?.channels||0),powered=c.dataset.logicPowered==='true',states=readObj(c,'relayChannels'),active=Object.entries(states).filter(([,v])=>v===true).map(([k])=>k);
      const led=c.querySelector('[data-knx-actuator-power-led]');if(led){led.setAttribute('fill',powered?'#22c55e':'#9ca3af');if(powered)led.style.filter='drop-shadow(0 0 6px #22c55e)';else led.style.removeProperty('filter')}
      const state=c.querySelector('[data-knx-actuator-state]');if(state)state.textContent=!powered?'SEM BARRAMENTO KNX':active.length?`ATIVOS: ${active.join(' • ')}`:`KNX TP1 • ${ch} CANAIS PRONTOS`;
      const p=c.querySelector('[data-knx-prog-led]');if(p)p.setAttribute('fill',c.dataset.knxActuatorProgramming==='true'?'#ef4444':'#7f1d1d');
      applyChannelLeds(c);
    };
    const bind=c=>{
      if(c.__techribKnxRelayBound)return;c.__techribKnxRelayBound=true;
      c.dataset.logicManualWiringTest='true';
      const def=registryDefinition(c)||{},ch=Number(def.behavior?.channels||0),init=readObj(c,'relayTestOverride');for(let i=1;i<=ch;i++)if(!Object.prototype.hasOwnProperty.call(init,String(i)))init[i]=false;c.dataset.relayTestOverride=JSON.stringify(init);
      c.querySelectorAll('[data-knx-channel-toggle]').forEach(n=>n.addEventListener('click',e=>{e.preventDefault?.();e.stopPropagation?.();if(c.dataset.logicPowered!=='true')return;const i=String(n.getAttribute('data-knx-channel-toggle')||'');const o=readObj(c,'relayTestOverride');o[i]=!Boolean(o[i]);c.dataset.relayTestOverride=JSON.stringify(o);recalc()}));
      c.querySelectorAll('[data-knx-prog-toggle]').forEach(n=>n.addEventListener('click',e=>{e.preventDefault?.();e.stopPropagation?.();c.dataset.knxActuatorProgramming=String(c.dataset.knxActuatorProgramming!=='true');render(c)}));
    };
    const evaluate=states=>{const changed=Boolean(delegated.evaluate?.(states));for(const c of all()){bind(c);render(c)}return changed};
    const reset=()=>{delegated.reset?.();for(const c of all()){delete c.dataset.knxActuatorProgramming;render(c)}};
    return Object.freeze({...delegated,evaluate,reset});
  };
  root.TechRibKnxRelayActuatorRuntimeV1=Object.freeze({version:'techrib.knx-relay-actuator-runtime/v1.1',create});
  root.TechRibCurrentLoopRuntimeV1=Object.freeze({create});
})(typeof window!=='undefined'?window:globalThis);
