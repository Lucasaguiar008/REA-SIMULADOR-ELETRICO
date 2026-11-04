(function(root){
  'use strict';
  const create=({sheet,workbench,wires,registryBehavior,componentTerminals,terminalMetadata,terminalStates,electricalEndpointKey,electricalNodeKey,incompatiblePotentials,classifyElectricalFault,afterElectricalVisuals}={})=>{
    if(!sheet?.querySelectorAll)throw new Error('TechRibComponentStateRuntime: sheet ausente');
    if(!workbench?.dataset)throw new Error('TechRibComponentStateRuntime: workbench ausente');
    if(!Array.isArray(wires))throw new Error('TechRibComponentStateRuntime: wires ausente');
    for(const [name,fn] of Object.entries({registryBehavior,componentTerminals,terminalMetadata,terminalStates,electricalEndpointKey,electricalNodeKey,incompatiblePotentials}))if(typeof fn!=='function')throw new Error(`TechRibComponentStateRuntime: ${name} ausente`);
    const classifyFault=typeof classifyElectricalFault==='function'?classifyElectricalFault:(potentials=>incompatiblePotentials(potentials)?Object.freeze({code:'ELECTRICAL_CONFLICT',className:'electrical-short',severity:'ERRO',title:'Conflito elétrico',cause:'potenciais incompatíveis no mesmo nó.'}):null);
    const electricalFamilyOf=component=>{
      const type=String(component?.dataset?.type||''),behavior=String(registryBehavior(component)?.type||'');
      if(/^fonte-/.test(type)||type==='transformador-comando')return'fontes';
      if(/^(disjuntor-|fusivel$|interruptor-dr$|rele-termico$)/.test(type)||type==='disjuntor-motor-mpcb')return'protecoes';
      if(/^(botoeira-|botao-|chave-seletora-|contator|contato-auxiliar-|rele-auxiliar$|temporizador$|rele-estrela-triangulo$|temporizador-estrela-triangulo$|rele-biestavel-impulso$)/.test(type))return'comando';
      if(/^(motor-|bomba-|sinaleiro-)/.test(type)||['resid-lampada','resid-tomada-4x2','resid-chuveiro-220v'].includes(type))return'cargas';
      if(/esp32|arduino|relay-module|sensor|driver|mosfet|transistor|optocoupler|microcontroller|logic-peripheral|analog-|indicator-led|rgb-led/.test(`${type} ${behavior}`))return'automacao';
      return'comando';
    };
    const familyInputsFor=(component,states)=>componentTerminals(component).map(terminal=>{
      const meta=terminalMetadata(terminal),values=terminalStates(states,terminal),live=values.filter(v=>!v.reference);
      return{id:meta.id,name:meta.name,domain:meta.domain,function:meta.function,voltageClass:meta.voltageClass,direction:meta.direction,states:live.map(v=>({type:v.type,voltage:Number(v.voltage||0),phase:v.phase||'',polarity:v.polarity??null,source:v.source||''}))};
    });
    const familyOutputsFor=(component,states)=>componentTerminals(component).filter(terminal=>{
      const meta=terminalMetadata(terminal);return meta.direction==='output'||/output|relay-no|relay-nc|power-output|digital-io/.test(meta.function||'');
    }).map(terminal=>{const meta=terminalMetadata(terminal),values=terminalStates(states,terminal).filter(v=>!v.reference);return{id:meta.id,name:meta.name,domain:meta.domain,function:meta.function,states:values.map(v=>({type:v.type,voltage:Number(v.voltage||0),phase:v.phase||'',polarity:v.polarity??null,source:v.source||''}))}});
    const internalStateFor=component=>{
      const type=String(component.dataset.type||''),family=electricalFamilyOf(component),state={family,mode:'idle'};
      if(family==='fontes')state.mode='source';
      else if(type.startsWith('motor-')||type.startsWith('bomba-')){state.mode=component.dataset.electricalRunning==='true'?'running':'stopped';state.speed=Number(component.dataset.speed||0);state.status=component.dataset.motorElectricalStatus||'parado'}
      else if(type.startsWith('contator'))state.mode=component.dataset.coilEnergized==='true'?'energized':'released';
      else if(type==='rele-termico')state.mode=component.dataset.tripped==='true'?'tripped':'normal';
      else if(type.startsWith('sinaleiro-'))state.mode=component.dataset.energized==='true'?'on':'off';
      else if(component.dataset.state)state.mode=component.dataset.state;
      else if(component.dataset.energized)state.mode=component.dataset.energized==='true'?'energized':'idle';
      return state;
    };
    const updateComponentElectricalModel=(component,states)=>{
      const family=electricalFamilyOf(component),inputs=familyInputsFor(component,states),internal=internalStateFor(component),outputs=familyOutputsFor(component,states);
      component.dataset.electricalFamily=family;component.dataset.electricalInternalState=internal.mode;
      component.techribElectricalModel={family,inputs,internal,outputs};
      return component.techribElectricalModel;
    };
    const updateAllComponentElectricalModels=states=>sheet.querySelectorAll('.placed-component').forEach(component=>updateComponentElectricalModel(component,states));
    const FAULT_CLASSES=['electrical-short','fault-phase-phase','fault-phase-neutral','fault-phase-earth','fault-dc-short','fault-ac-dc','fault-source-source','fault-voltage'];
    // V25.1: classes de falha devem ser idempotentes. O canvas observa mudanças de `class`
    // para solicitar novo recálculo; remover/adicionar as mesmas classes em cada ciclo criava
    // um loop de MutationObserver quando havia curto-circuito. Só alteramos o DOM se necessário.
    const applyFaultClasses=(target,fault)=>{
      if(!target?.classList)return false;
      const wanted=new Set(fault?['electrical-short',...(fault.className&&fault.className!=='electrical-short'?[fault.className]:[])]:[]);
      let changed=false;
      FAULT_CLASSES.forEach(name=>{
        const shouldHave=wanted.has(name),has=target.classList.contains(name);
        if(has!==shouldHave){target.classList.toggle(name,shouldHave);changed=true}
      });
      return changed;
    };
    const updateElectricalVisuals=states=>{let conflicts=0;wires.forEach(wire=>{const from=[...(states.get(electricalEndpointKey(wire.from))?.values()||[])],to=[...(states.get(electricalEndpointKey(wire.to))?.values()||[])],potentials=from.length?from:to;wire.electricalState=potentials;wire.energized=potentials.some(state=>!state.reference);const fault=classifyFault(potentials),conflict=Boolean(fault)||incompatiblePotentials(potentials);wire.fault=fault||null;if(conflict)conflicts++;wire.path.classList.toggle('energized',wire.energized);wire.path.classList.toggle('logic-energized',wire.energized&&potentials.some(state=>state.type==='DC'&&Number(state.voltage)<=5.5));wire.path.classList.toggle('electrical-conflict',conflict);applyFaultClasses(wire.path,fault);if(wire.path.dataset){if(fault)wire.path.dataset.faultType=fault.code;else delete wire.path.dataset.faultType}});sheet.querySelectorAll('.placed-component').forEach(component=>{let conflict=false;const faults=[];componentTerminals(component).forEach(terminal=>{terminal.electricalState=[...(states.get(electricalNodeKey(terminal))?.values()||[])];const fault=classifyFault(terminal.electricalState);if(fault)faults.push(fault);conflict=conflict||Boolean(fault)||incompatiblePotentials(terminal.electricalState)});component.techribElectricalFaults=faults;component.classList.toggle('electrical-conflict',conflict);applyFaultClasses(component,faults[0]||null)});workbench.dataset.electricalConflicts=String(conflicts);if(typeof afterElectricalVisuals==='function'){try{afterElectricalVisuals({states,conflicts,wires})}catch(error){console.error('TechRib: pós-processamento visual elétrico falhou',error)}}return conflicts};
    return Object.freeze({electricalFamilyOf,familyInputsFor,familyOutputsFor,internalStateFor,updateComponentElectricalModel,updateAllComponentElectricalModels,updateElectricalVisuals});
  };
  root.TechRibComponentStateRuntime=Object.freeze({create});
})(typeof window!=='undefined'?window:globalThis);
