(function(root){
  'use strict';
  const base=root.TechRibCurrentLoopRuntimeV1;
  if(!base?.create)throw new Error('TechRibKnxShutterRuntimeV1: runtime base ausente');
  const baseCreate=base.create.bind(base);
  const create=options=>{
    const delegated=baseCreate(options);
    const {sheet,registryDefinition}=options||{};
    if(!sheet?.querySelectorAll||typeof registryDefinition!=='function')throw new Error('TechRibKnxShutterRuntimeV1: dependências ausentes');
    const all=()=>[...sheet.querySelectorAll('.placed-component[data-registry-id]')].filter(c=>registryDefinition(c)?.behavior?.family==='knx-shutter-actuator');
    const recalc=()=>{try{root.TECHRIB_ELECTRICAL?.recalculate?.()}catch{}};
    const readObj=(c,key)=>{try{return JSON.parse(c.dataset[key]||'{}')}catch{return{}}};
    const pairFor=(ch)=>({up:(ch-1)*2+1,down:(ch-1)*2+2});
    const applyCommand=(c,ch,action)=>{
      if(c.dataset.logicPowered!=='true')return false;
      const o=readObj(c,'relayTestOverride'),p=pairFor(ch);
      o[String(p.up)]=action==='up';o[String(p.down)]=action==='down';
      c.dataset.relayTestOverride=JSON.stringify(o);c.dataset.knxShutterLastCommand=`${ch}:${action}`;recalc();return true;
    };
    const bind=c=>{if(c.__techribKnxShutterBound)return;c.__techribKnxShutterBound=true;c.dataset.logicManualWiringTest='true';const init=readObj(c,'relayTestOverride');for(let i=1;i<=8;i++)if(!Object.prototype.hasOwnProperty.call(init,String(i)))init[i]=false;c.dataset.relayTestOverride=JSON.stringify(init);c.querySelectorAll('[data-knx-shutter-command]').forEach(n=>n.addEventListener('click',e=>{e.preventDefault?.();e.stopPropagation?.();applyCommand(c,Number(n.getAttribute('data-channel')||0),String(n.getAttribute('data-knx-shutter-command')||'stop'))}))};
    const render=c=>{const powered=c.dataset.logicPowered==='true',states=readObj(c,'relayChannels');const bus=c.querySelector('[data-knx-shutter-bus-led]');if(bus){bus.setAttribute('fill',powered?'#22c55e':'#9ca3af');if(powered)bus.style.filter='drop-shadow(0 0 8px #22c55e)';else bus.style.removeProperty('filter')};for(let ch=1;ch<=4;ch++){const p=pairFor(ch),up=states[String(p.up)]===true,down=states[String(p.down)]===true,node=c.querySelector(`[data-knx-shutter-state="${ch}"]`);if(node)node.textContent=`CH${ch} • ${!powered?'SEM BUS':up?'SUBIR':down?'DESCER':'PARADO'}`}};
    const evaluate=states=>{const changed=Boolean(delegated.evaluate?.(states));for(const c of all()){bind(c);render(c)}return changed};
    const reset=()=>{delegated.reset?.();for(const c of all()){c.dataset.relayTestOverride=JSON.stringify({'1':false,'2':false,'3':false,'4':false,'5':false,'6':false,'7':false,'8':false});delete c.dataset.knxShutterLastCommand;render(c)}};
    return Object.freeze({...delegated,evaluate,reset,applyCommand});
  };
  root.TechRibKnxShutterRuntimeV1=Object.freeze({version:'techrib.knx-shutter-runtime/v1',create});
  root.TechRibCurrentLoopRuntimeV1=Object.freeze({create});
})(typeof window!=='undefined'?window:globalThis);
