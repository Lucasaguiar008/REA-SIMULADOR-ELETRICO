(function(root){
  'use strict';
  const create=({wires,sheet,syncAssociatedAuxContacts,internalTerminalPairs,residentialTerminalPairs,softStarterPairs,scrPowerStagePairs,sourceDefinition,augmentEarthGraph=()=>{}}={})=>{
    if(!Array.isArray(wires))throw new Error('TechRibElectricalNetworkRuntime: wires ausente');
    if(!sheet?.querySelectorAll)throw new Error('TechRibElectricalNetworkRuntime: sheet ausente');
    for(const [name,fn] of Object.entries({syncAssociatedAuxContacts,internalTerminalPairs,residentialTerminalPairs,softStarterPairs,scrPowerStagePairs,sourceDefinition,augmentEarthGraph}))if(typeof fn!=='function')throw new Error(`TechRibElectricalNetworkRuntime: ${name} ausente`);
    const nodeKey=terminal=>{const component=terminal?.closest?.('.placed-component');if(!component)return'';const index=[...component.querySelectorAll('[data-terminal]')].indexOf(terminal);return`${component.dataset.componentId}:${terminal.dataset.terminal||'T'}:${index}`};
    const endpointKey=endpoint=>endpoint?.type==='junction'?`junction:${endpoint.junction?.id||endpoint.id}`:nodeKey(endpoint?.el);
    const componentTerminals=component=>[...component.querySelectorAll('[data-terminal]')];
    const addGraphEdge=(graph,a,b)=>{if(!a||!b)return;if(!graph.has(a))graph.set(a,new Set());if(!graph.has(b))graph.set(b,new Set());graph.get(a).add(b);graph.get(b).add(a)};
    const buildGraph=()=>{
      syncAssociatedAuxContacts();
      const graph=new Map(),sources=[];
      wires.forEach(wire=>addGraphEdge(graph,endpointKey(wire.from),endpointKey(wire.to)));
      sheet.querySelectorAll('.placed-component').forEach(component=>{
        [...internalTerminalPairs(component),...residentialTerminalPairs(component),...softStarterPairs(component),...scrPowerStagePairs(component)].forEach(([a,b])=>addGraphEdge(graph,nodeKey(a),nodeKey(b)));
        componentTerminals(component).forEach(terminal=>{const state=sourceDefinition(component,terminal);if(state)sources.push([nodeKey(terminal),state])});
      });
      augmentEarthGraph({graph,addGraphEdge,nodeKey});
      return{graph,sources};
    };
    const propagateFromSources=({graph,sources})=>{
      const states=new Map();
      sources.forEach(([start,state])=>{const queue=[start],visited=new Set();while(queue.length){const key=queue.shift();if(visited.has(key))continue;visited.add(key);if(!states.has(key))states.set(key,new Map());const potentialId=`${state.source}|${state.type}|${state.voltage}|${state.phase||''}|${state.polarity||''}`;states.get(key).set(potentialId,state);(graph.get(key)||[]).forEach(next=>{if(!visited.has(next))queue.push(next)})}});
      return states;
    };
    const propagateElectricalState=()=>propagateFromSources(buildGraph());
    return Object.freeze({nodeKey,endpointKey,componentTerminals,addGraphEdge,buildGraph,propagateFromSources,propagateElectricalState});
  };
  root.TechRibElectricalNetworkRuntime=Object.freeze({create});
})(typeof window!=='undefined'?window:globalThis);
