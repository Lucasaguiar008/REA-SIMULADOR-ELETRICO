(function(root){
  'use strict';
  const SEVERITY_RANK={OK:0,AVISO:1,ERRO:2};
  const create=({terminalMetadata,terminalRegistryDefinition,isDryContactMeta,voltageClassSpec,stateVoltageForValidation,terminalStates,componentTerminals,measureBetween}={})=>{
    const required={terminalMetadata,terminalRegistryDefinition,isDryContactMeta,voltageClassSpec,stateVoltageForValidation,terminalStates,componentTerminals,measureBetween};
    for(const [name,fn] of Object.entries(required))if(typeof fn!=='function')throw new Error(`TechRibElectricalValidationRuntime: ${name} ausente`);
    const isResidentialSwitchTerminal=terminal=>/^(?:resid-interruptor-simples|resid-three-way|resid-four-way)$/.test(String(terminal?.closest?.('.placed-component')?.dataset?.type||''));
    const terminalExpectedElectrical=terminal=>{
      const meta=terminalMetadata(terminal),component=terminal?.closest?.('.placed-component'),fn=String(meta?.function||'').toLowerCase();
      if(isResidentialSwitchTerminal(terminal)||isDryContactMeta(meta))return{meta:{...meta,domain:'control',function:'dry-contact',voltageClass:'',direction:'passive'},dryContact:true,voltage:null,type:'',tolerance:.15};
      let spec=voltageClassSpec(meta?.voltageClass),type=spec?.type||'',voltage=spec?.voltage??null;
      if(fn==='coil'){
        const rated=Number(component?.dataset?.coilRatedVoltage||component?.electrical?.coil?.ratedVoltage||0),ratedType=String(component?.dataset?.coilType||component?.electrical?.coil?.type||'').toUpperCase();
        if(rated){voltage=rated;type=ratedType||type}
      }
      if(meta?.domain==='logic'&&!type)type='DC';
      return{meta,dryContact:false,voltage,type,tolerance:meta?.domain==='logic'?.12:.20};
    };
    const representativeLiveState=(states,terminal)=>{
      const values=terminalStates(states,terminal),live=values.filter(x=>!x.reference);
      if(!live.length)return null;
      return live.sort((a,b)=>Number(b.lineVoltage||b.voltage||0)-Number(a.lineVoltage||a.voltage||0))[0]||null;
    };
    const worstValidation=(...items)=>items.filter(Boolean).sort((a,b)=>(SEVERITY_RANK[b.level]||0)-(SEVERITY_RANK[a.level]||0))[0]||{level:'OK',message:'Ligação compatível.'};
    const validateTerminalElectrical=(terminal,state)=>{
      const expected=terminalExpectedElectrical(terminal),meta=expected.meta||{},name=meta.name||terminal?.dataset?.terminal||'borne';
      if(expected.dryContact)return{level:'OK',message:`${name}: contato seco; a tensão é definida pela rede conectada.`,dryContact:true};
      if(!state){
        if(meta.domain==='protective-earth')return{level:'OK',message:`${name}: condutor de proteção PE; tensão operacional não é exigida para validar continuidade.`};
        return{level:'AVISO',message:`${name}: sem tensão medida na rede neste momento.`};
      }
      const measuredType=String(state.type||'').toUpperCase(),measuredVoltage=stateVoltageForValidation(state);
      if(meta.domain==='logic'&&measuredType==='AC')return{level:'ERRO',message:`${name}: borne lógico não pode receber ${measuredVoltage.toFixed(1)} Vac.`};
      if(expected.type&&measuredType&&expected.type!==measuredType)return{level:'ERRO',message:`${name}: esperado ${expected.type}, mas a rede é ${measuredType}.`};
      const terminalDef=terminalRegistryDefinition(terminal)||{},signalLogic=meta.domain==='logic'&&!['logic-power','logic-ground'].includes(String(meta.function||'').toLowerCase());
      if(signalLogic&&measuredType==='DC'){const maxSafe=Number(terminalDef.maxVoltage||0);if(maxSafe&&measuredVoltage>maxSafe*1.02)return{level:'ERRO',message:`${name}: ${measuredVoltage.toFixed(1)} Vdc excede o máximo seguro de ${maxSafe.toFixed(1)} V.`};if(!maxSafe&&measuredVoltage>5.5)return{level:'ERRO',message:`${name}: ${measuredVoltage.toFixed(1)} Vdc excede a faixa de lógica de baixa tensão.`};return{level:'OK',message:`${name}: ${measuredVoltage.toFixed(1)} Vdc dentro da faixa segura do sinal lógico.`};}
      if(meta.domain==='logic'&&measuredType==='DC'&&!expected.voltage&&measuredVoltage>5.5)return{level:'ERRO',message:`${name}: ${measuredVoltage.toFixed(1)} Vdc excede a faixa de lógica de baixa tensão.`};
      if(expected.voltage){const min=expected.voltage*(1-expected.tolerance),max=expected.voltage*(1+expected.tolerance);if(measuredVoltage<min||measuredVoltage>max)return{level:'ERRO',message:`${name}: ${measuredVoltage.toFixed(1)} V ${measuredType} incompatível com ${expected.voltage} V ${expected.type||measuredType}.`};}
      return{level:'OK',message:`${name}: ${measuredVoltage.toFixed(1)} V ${measuredType} compatível.`};
    };
    const validateEndpoint=(terminal,state,states)=>{const expected=terminalExpectedElectrical(terminal);if(expected.meta?.function==='coil'){const component=terminal.closest('.placed-component'),byName=new Map(componentTerminals(component).map(t=>[t.dataset.terminal,t])),a1=byName.get('A1'),a2=byName.get('A2');if(a1&&a2){const measured=measureBetween(states,a1,a2,expected.type||'');if(measured.type&&measured.voltage>0)return validateTerminalElectrical(terminal,{type:measured.type,voltage:measured.voltage,lineVoltage:measured.voltage,reference:false})}}return validateTerminalElectrical(terminal,state)};
    const isProtectiveEarthTerminal=(terminal,meta)=>{
      const name=String(meta?.name||terminal?.dataset?.terminal||terminal?.dataset?.wireAnchor||'').trim().toUpperCase();
      const fn=String(meta?.function||terminal?.dataset?.terminalFunction||'').toLowerCase();
      const domain=String(meta?.domain||terminal?.dataset?.terminalDomain||'').toLowerCase();
      const voltageClass=String(meta?.voltageClass||terminal?.dataset?.terminalVoltageClass||'').toLowerCase();
      return domain==='protective-earth'||fn==='protective-earth'||voltageClass==='pe'||/^(?:PE(?:\d+)?|TERRA|GND-PE)$/.test(name);
    };
    const validateWireElectrical=(wire,states)=>{
      if(wire?.fault)return{level:'ERRO',message:`${wire.fault.title}: ${wire.fault.cause}`,faultCode:wire.fault.code,shortCircuit:wire.fault.shortCircuit===true};
      const a=wire.from?.type==='terminal'?wire.from.el:null,b=wire.to?.type==='terminal'?wire.to.el:null,ma=a?terminalMetadata(a):null,mb=b?terminalMetadata(b):null;
      if(!a||!b)return{level:'AVISO',message:'Ligação com derivação/junção: validação depende da rede conectada.'};
      const aPe=isProtectiveEarthTerminal(a,ma),bPe=isProtectiveEarthTerminal(b,mb),aDry=isResidentialSwitchTerminal(a)||isDryContactMeta(ma),bDry=isResidentialSwitchTerminal(b)||isDryContactMeta(mb);
      // PE semantics take precedence over stale legacy domain labels.
      if(aPe!==bPe)return{level:'AVISO',message:'Terra de proteção conectado a borne de outro domínio. Confirme a ligação.'};
      const sa=representativeLiveState(states,a),sb=representativeLiveState(states,b),networkState=sa||sb;
      if(aDry||bDry){
        const nonDry=aDry?b:a,dry=aDry?a:b,nonDryMeta=terminalMetadata(nonDry);
        if(!networkState)return{level:'OK',message:`${terminalMetadata(dry)?.name||dry.dataset.terminal}: contato seco aberto/sem tensão neste estado — condição normal.`};
        let targetValidation=validateEndpoint(nonDry,networkState,states);
        if(targetValidation.level==='ERRO')return targetValidation;
        return{level:'OK',message:`Contato seco conduzindo ${stateVoltageForValidation(networkState).toFixed(1)} V ${networkState.type}; ${nonDryMeta?.name||nonDry.dataset.terminal} compatível.`};
      }
      if((ma?.domain==='power'&&mb?.domain==='logic')||(ma?.domain==='logic'&&mb?.domain==='power'))return{level:'ERRO',message:`Incompatibilidade grave: borne de POTÊNCIA ligado diretamente a borne de LÓGICA (${ma?.name||a.dataset.terminal} ↔ ${mb?.name||b.dataset.terminal}).`};
      if(!networkState){
        if(aPe&&bPe)return{level:'OK',message:'Condutor PE: continuidade de proteção; tensão operacional não é exigida nesta ligação.'};
        if(ma?.domain==='logic'&&mb?.domain==='logic')return{level:'OK',message:'Ligação lógica compatível; sem tensão presente no momento.'};
        // Ausência de tensão em um condutor, isoladamente, não caracteriza anomalia:
        // saídas de relé abertas, retornos de lâmpadas desligadas, entradas lógicas e
        // circuitos de comando em repouso ficam legitimamente sem potencial. Falhas
        // reais de alimentação são diagnosticadas no componente/carga correspondente.
        return{level:'OK',message:'Condutor sem tensão no estado atual — condição normal enquanto o circuito correspondente estiver desligado/aberto.'};
      }
      return worstValidation(validateEndpoint(a,networkState,states),validateEndpoint(b,networkState,states));
    };
    return Object.freeze({terminalExpectedElectrical,representativeLiveState,worstValidation,validateTerminalElectrical,validateWireElectrical,levels:['OK','AVISO','ERRO']});
  };
  root.TechRibElectricalValidationRuntime=Object.freeze({create,levels:['OK','AVISO','ERRO']});
})(typeof window!=='undefined'?window:globalThis);
