(function(root){
  'use strict';
  const NETWORK_RE=/^PE-[A-Z0-9_-]{1,16}$/i;
  const normalizeNetwork=value=>{
    const raw=String(value||'PE-1').trim().toUpperCase().replace(/\s+/g,'-');
    return NETWORK_RE.test(raw)?raw:'PE-1';
  };
  const create=({sheet,registryDefinition,notify=()=>{},historyCapture=()=>{},scheduleElectricalRecalc=()=>{}}={})=>{
    if(!sheet?.querySelectorAll)throw new Error('TechRibEarthRuntime: sheet ausente');
    if(typeof registryDefinition!=='function')throw new Error('TechRibEarthRuntime: registryDefinition ausente');
    const fallbackBehavior=component=>{
      const type=String(component?.dataset?.type||'');
      if(type==='resid-haste-aterramento')return{type:'earth-reference',kind:'rod',defaultNetwork:'PE-1',virtualJoin:true,reference:true};
      if(type==='resid-barramento-terra')return{type:'earth-bus',kind:'busbar',defaultNetwork:'PE-1',virtualJoin:true,reference:false};
      return null;
    };
    const behaviorOf=component=>{
      const behavior=registryDefinition(component)?.behavior||fallbackBehavior(component);
      return ['earth-reference','earth-bus'].includes(String(behavior?.type||''))?behavior:null;
    };
    const earthTerminals=component=>[...component.querySelectorAll('[data-terminal]')].filter(terminal=>{
      const name=String(terminal.dataset.terminal||'').toUpperCase();
      const def=registryDefinition(component)?.terminals?.[terminal.dataset.terminal]||{};
      const domain=String(terminal.dataset.terminalDomain||terminal.dataset.domain||def.domain||'').toLowerCase();
      const fn=String(terminal.dataset.terminalFunction||terminal.dataset.function||def.function||'').toLowerCase();
      return domain==='protective-earth'||fn==='protective-earth'||/^PE(?:\d+)?$/.test(name)||name==='TERRA'||name==='GND-PE';
    });
    const networkOf=component=>normalizeNetwork(component?.dataset?.earthNetwork||behaviorOf(component)?.defaultNetwork||'PE-1');
    const refreshComponent=component=>{
      const behavior=behaviorOf(component);if(!behavior)return false;
      const network=networkOf(component);component.dataset.earthNetwork=network;component.dataset.earthRole=behavior.type;component.dataset.earthKind=String(behavior.kind||'');
      component.classList.add('techrib-earth-component');
      component.querySelectorAll('[data-earth-network-label]').forEach(label=>label.textContent=network);
      component.title=`${registryDefinition(component)?.name||component.dataset.label||'Aterramento'} • rede virtual ${network} • duplo clique para alterar`;
      return true;
    };
    const prepareComponent=component=>{
      if(!refreshComponent(component)||component.dataset.earthRuntimeBound==='true')return false;
      component.dataset.earthRuntimeBound='true';
      component.addEventListener('dblclick',event=>{
        if(event.target.closest('[data-terminal],[data-wire-anchor]'))return;
        event.preventDefault();event.stopPropagation();
        const current=networkOf(component),value=prompt('Rede de aterramento virtual (ex.: PE-1, PE-2, PE-3):',current);
        if(value===null)return;
        const next=normalizeNetwork(value);
        component.dataset.earthNetwork=next;refreshComponent(component);historyCapture();scheduleElectricalRecalc();
        notify(`${component.querySelector('small')?.textContent||'PE'}: rede ${next}`);
      });
      return true;
    };
    const augmentGraph=({graph,addEdge,keyOf}={})=>{
      if(!graph?.get||!graph?.set||typeof addEdge!=='function'||typeof keyOf!=='function')return new Map();
      const groups=new Map();
      sheet.querySelectorAll('.placed-component').forEach(component=>{
        const behavior=behaviorOf(component);if(!behavior||behavior.virtualJoin===false)return;
        const network=networkOf(component),terminals=earthTerminals(component);if(!terminals.length)return;
        if(!groups.has(network))groups.set(network,[]);groups.get(network).push(...terminals);
      });
      groups.forEach((terminals,network)=>{const hub=`earth-network:${network}`;terminals.forEach(terminal=>addEdge(graph,keyOf(terminal),hub))});
      return groups;
    };
    const reachableKeys=(graph,start)=>{
      const seen=new Set(),queue=[start];while(queue.length){const key=queue.shift();if(!key||seen.has(key))continue;seen.add(key);(graph.get(key)||[]).forEach(next=>{if(!seen.has(next))queue.push(next)})}return seen;
    };
    const isReferenceTerminal=terminal=>{
      const component=terminal?.closest?.('.placed-component');if(!component)return false;
      const behavior=behaviorOf(component);if(behavior?.reference===true)return true;
      const type=String(component.dataset.type||''),name=String(terminal.dataset.terminal||'').toUpperCase();
      if(type==='resid-haste-aterramento'&&name==='PE')return true;
      const reg=registryDefinition(component),bt=String(reg?.behavior?.type||'');
      if(name==='PE'&&['ac-source','dc-source','ac-dc-power-supply'].includes(bt))return true;
      if(name==='PE'&&/^(fonte-|alimentacao-)/.test(type))return true;
      return false;
    };
    const terminalClass=terminal=>{
      const component=terminal?.closest?.('.placed-component'),name=String(terminal?.dataset?.terminal||'').toUpperCase(),def=component?registryDefinition(component)?.terminals?.[terminal.dataset.terminal]||{}:{};
      const domain=String(terminal?.dataset?.terminalDomain||terminal?.dataset?.domain||def.domain||'').toLowerCase();
      const fn=String(terminal?.dataset?.terminalFunction||terminal?.dataset?.function||def.function||'').toLowerCase();
      const type=String(def.type||terminal?.dataset?.electricalType||'').toLowerCase();
      if(domain==='protective-earth'||fn==='protective-earth'||/^PE(?:\d+)?$/.test(name)||name==='TERRA'||name==='GND-PE')return'pe';
      if(type==='neutral'||fn==='neutral'||name==='N')return'neutral';
      if(type.includes('phase')||fn==='line'||fn==='power-output'||/^L[1234]?$/.test(name))return'live';
      return'other';
    };
    const inspectTerminal=(terminal,{graph,keyOf}={})=>{
      if(!terminal||!graph?.get||typeof keyOf!=='function')return{connected:false,hasReference:false,networks:[],hasLive:false,hasNeutral:false};
      const start=keyOf(terminal),reachable=reachableKeys(graph,start),networks=[...reachable].filter(k=>String(k).startsWith('earth-network:')).map(k=>String(k).slice(14));
      let hasReference=false,hasLive=false,hasNeutral=false;
      sheet.querySelectorAll('.placed-component [data-terminal]').forEach(candidate=>{
        if(!reachable.has(keyOf(candidate)))return;
        const cls=terminalClass(candidate);if(cls==='live')hasLive=true;else if(cls==='neutral')hasNeutral=true;
        if(isReferenceTerminal(candidate))hasReference=true;
      });
      return{connected:reachable.size>1,hasReference,networks:[...new Set(networks)],hasLive,hasNeutral,reachable};
    };
    const listNetworks=()=>{
      const out=new Map();sheet.querySelectorAll('.placed-component').forEach(component=>{const behavior=behaviorOf(component);if(!behavior)return;const network=networkOf(component);if(!out.has(network))out.set(network,{components:[],references:[]});const record=out.get(network);record.components.push(component);if(behavior.reference===true)record.references.push(component)});return out;
    };
    return Object.freeze({normalizeNetwork,behaviorOf,earthTerminals,networkOf,refreshComponent,prepareComponent,augmentGraph,inspectTerminal,listNetworks,isReferenceTerminal,terminalClass});
  };
  root.TechRibEarthRuntime=Object.freeze({create,normalizeNetwork});
})(typeof window!=='undefined'?window:globalThis);
