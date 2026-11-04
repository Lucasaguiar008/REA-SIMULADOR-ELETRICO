/* TechRib V25 — classificação central de falhas/curtos elétricos.
   Fonte única para visualização da simulação e painéis de diagnóstico. */
(function(root){
  'use strict';

  const upper=value=>String(value??'').trim().toUpperCase();
  const num=value=>Number.isFinite(Number(value))?Number(value):0;
  const uniq=items=>[...new Set(items.filter(value=>value!==''&&value!=null))];
  const isAc=state=>upper(state?.type)==='AC';
  const isDc=state=>upper(state?.type)==='DC';
  const phaseOf=state=>upper(state?.phase);
  const isPe=state=>isAc(state)&&(phaseOf(state)==='PE'||upper(state?.conductor)==='PE');
  const isNeutral=state=>isAc(state)&&['N','X2','NEUTRAL','NEUTRO'].includes(phaseOf(state));
  const live=state=>state&&state.reference!==true&&Math.abs(num(state.voltage))>.0001;
  const reference=state=>state&&state.reference===true;
  const stateVoltage=state=>isAc(state)?num(state.lineVoltage||state.voltage):num(state.voltage);

  const makeFault=(code,title,cause,states,extra={})=>{
    const phases=uniq(states.filter(isAc).map(phaseOf));
    const sources=uniq(states.map(state=>String(state?.source||'')).filter(Boolean));
    const voltages=uniq(states.map(state=>stateVoltage(state)).filter(value=>Number.isFinite(value)&&value>0));
    return Object.freeze({
      code,
      kind:'short-circuit',
      severity:'ERRO',
      title,
      cause,
      phases:Object.freeze(phases),
      sources:Object.freeze(sources),
      voltages:Object.freeze(voltages),
      className:extra.className||'electrical-short',
      shortCircuit:extra.shortCircuit!==false,
      ...extra,
    });
  };

  function classifyPotentials(potentials){
    const states=(potentials||[]).filter(Boolean);
    if(states.length<2)return null;

    const acLive=states.filter(state=>isAc(state)&&live(state));
    const acRefs=states.filter(state=>isAc(state)&&reference(state));
    const dcLive=states.filter(state=>isDc(state)&&live(state));
    const dcRefs=states.filter(state=>isDc(state)&&reference(state));

    // Curto fase-terra deve ter prioridade quando PE está no mesmo nó de uma fase.
    if(acLive.length&&acRefs.some(isPe)){
      return makeFault(
        'AC_PHASE_EARTH',
        'Curto-circuito fase–terra',
        'uma fase energizada está conectada diretamente ao condutor de proteção PE/terra no mesmo nó elétrico.',
        states,
        {className:'fault-phase-earth',reference:'PE'}
      );
    }

    // Fase-neutro / fase-X2: referência funcional diretamente no mesmo nó da fase.
    if(acLive.length&&acRefs.some(isNeutral)){
      const ref=acRefs.some(state=>phaseOf(state)==='N')?'N':'X2';
      return makeFault(
        'AC_PHASE_NEUTRAL',
        ref==='N'?'Curto-circuito fase–neutro':'Curto-circuito fase–referência',
        ref==='N'
          ?'uma fase energizada está conectada diretamente ao neutro no mesmo nó elétrico.'
          :'uma fase energizada está conectada diretamente à referência do secundário no mesmo nó elétrico.',
        states,
        {className:'fault-phase-neutral',reference:ref}
      );
    }

    // Qualquer outra referência AC de 0 V diretamente ligada a uma fase é tratada como curto de referência.
    if(acLive.length&&acRefs.length){
      return makeFault(
        'AC_PHASE_REFERENCE',
        'Curto-circuito fase–referência',
        'uma fase energizada foi ligada diretamente a uma referência de 0 V no mesmo nó elétrico.',
        states,
        {className:'fault-phase-neutral',reference:phaseOf(acRefs[0])||'REF'}
      );
    }

    // Duas ou mais fases distintas no mesmo nó.
    const livePhases=uniq(acLive.map(phaseOf).filter(Boolean));
    if(livePhases.length>1){
      return makeFault(
        'AC_PHASE_PHASE',
        'Curto-circuito fase–fase',
        `fases diferentes (${livePhases.join(' × ')}) foram conectadas diretamente ao mesmo nó elétrico.`,
        states,
        {className:'fault-phase-phase'}
      );
    }

    // Positivo DC diretamente à referência/negativo.
    if(dcLive.length&&dcRefs.length){
      return makeFault(
        'DC_POSITIVE_NEGATIVE',
        'Curto-circuito DC positivo–negativo',
        'um potencial DC positivo está conectado diretamente ao retorno/negativo no mesmo nó elétrico.',
        states,
        {className:'fault-dc-short'}
      );
    }

    // AC e DC ativos no mesmo nó.
    if(acLive.length&&dcLive.length){
      return makeFault(
        'AC_DC_CONFLICT',
        'Conflito grave AC–DC',
        'redes AC e DC energizadas foram conectadas diretamente ao mesmo nó elétrico.',
        states,
        {className:'fault-ac-dc'}
      );
    }

    // Fontes independentes energizadas diretamente em paralelo continuam sendo conflito grave.
    const active=[...acLive,...dcLive];
    const sources=uniq(active.map(state=>String(state.source||'')).filter(Boolean));
    if(active.length>1&&sources.length>1){
      return makeFault(
        'SOURCE_SOURCE_CONFLICT',
        'Conflito entre fontes energizadas',
        'saídas de fontes elétricas diferentes estão ligadas diretamente ao mesmo nó.',
        states,
        {className:'fault-source-source'}
      );
    }

    // Mesmo tipo/fase, mas tensões claramente incompatíveis no mesmo nó.
    const activeVoltages=uniq(active.map(state=>`${upper(state.type)}:${stateVoltage(state)}`));
    if(active.length>1&&activeVoltages.length>1){
      return makeFault(
        'VOLTAGE_CONFLICT',
        'Conflito de tensões',
        'potenciais de tensões diferentes foram conectados diretamente ao mesmo nó elétrico.',
        states,
        {className:'fault-voltage'}
      );
    }

    return null;
  }

  const signature=fault=>fault?[
    fault.code,
    [...(fault.phases||[])].sort().join(','),
    [...(fault.sources||[])].sort().join(','),
    [...(fault.voltages||[])].sort((a,b)=>a-b).join(',')
  ].join('|'):'';

  const endpointLabel=endpoint=>{
    if(!endpoint)return'?';
    if(endpoint.type==='junction')return endpoint.id||endpoint.junction?.id||'JUNÇÃO';
    const terminal=endpoint.el;
    const component=terminal?.closest?.('.placed-component');
    const tag=component?.dataset?.tag||component?.querySelector?.('small')?.textContent?.trim()||component?.dataset?.label||component?.dataset?.type||'COMP';
    const name=terminal?.dataset?.terminalName||terminal?.dataset?.terminal||endpoint.id||'?';
    return `${tag} ${name}`;
  };

  function summarizeWireFaults(wires){
    const groups=new Map();
    (wires||[]).forEach(wire=>{
      const fault=wire?.fault||null;
      if(!fault)return;
      const key=signature(fault)||`${fault.code}|${wire.number||''}`;
      if(!groups.has(key))groups.set(key,{fault,wires:[],endpoints:new Set()});
      const group=groups.get(key);group.wires.push(wire);
      group.endpoints.add(endpointLabel(wire.from));group.endpoints.add(endpointLabel(wire.to));
    });
    return [...groups.values()].map(group=>Object.freeze({
      fault:group.fault,
      wires:Object.freeze(group.wires),
      wireNumbers:Object.freeze(uniq(group.wires.map(w=>String(w.number||w.identification||'').trim()).filter(Boolean))),
      endpoints:Object.freeze([...group.endpoints]),
    }));
  }

  const detailsForGroup=group=>{
    const f=group?.fault||{};
    const details=[];
    if(group?.wireNumbers?.length)details.push(`Condutor(es): ${group.wireNumbers.join(', ')}`);
    if(group?.endpoints?.length)details.push(`Rede afetada: ${group.endpoints.join(' ↔ ')}`);
    if(f.phases?.length)details.push(`Potenciais/fases detectados: ${f.phases.join(', ')}`);
    if(f.voltages?.length)details.push(`Tensão de linha/rede: ${f.voltages.map(v=>`${Number(v).toFixed(Number(v)%1?1:0)} V`).join(', ')}`);
    return details;
  };

  root.TechRibElectricalFaults=Object.freeze({
    version:25,
    classifyPotentials,
    hasFault:potentials=>Boolean(classifyPotentials(potentials)),
    signature,
    summarizeWireFaults,
    detailsForGroup,
    endpointLabel,
  });
})(typeof window!=='undefined'?window:globalThis);
