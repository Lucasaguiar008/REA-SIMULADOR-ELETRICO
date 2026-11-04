(function(root){
  'use strict';
  const create=({componentTerminals,terminalStates,registryDefinition,scheduleElectricalRecalc,wireOnlyConnected,estimateLoadCurrent}={})=>{
    const required={componentTerminals,terminalStates,registryDefinition,scheduleElectricalRecalc,wireOnlyConnected,estimateLoadCurrent};
    for(const [name,fn] of Object.entries(required))if(typeof fn!=='function')throw new Error(`TechRibElectricalMeasurementsRuntime: ${name} ausente`);

    const measureBetween=(states,a,b,preferredType='DC')=>{
      if(!a||!b)return{voltage:0,type:'',source:''};
      let measured=0,type='',source='';
      for(const left of terminalStates(states,a))for(const right of terminalStates(states,b)){
        if(left.source!==right.source||left.type!==right.type)continue;
        if(preferredType&&left.type!==preferredType)continue;
        let voltage=0;
        if(left.type==='DC')voltage=Math.abs(Number(left.voltage)-Number(right.voltage));
        else if(left.phase!==right.phase)voltage=left.reference||right.reference?Math.max(Number(left.voltage),Number(right.voltage)):Math.max(Number(left.lineVoltage||left.voltage),Number(right.lineVoltage||right.voltage));
        if(voltage>=measured){measured=voltage;type=left.type;source=left.source}
      }
      return{voltage:measured,type,source};
    };

    // Preserva o sinal para detectar polaridade DC invertida.
    const measureDirectedDc=(states,positive,negative)=>{
      if(!positive||!negative)return{voltage:0,type:'',source:'',found:false};
      let best={voltage:0,type:'',source:'',found:false};
      for(const left of terminalStates(states,positive))for(const right of terminalStates(states,negative)){
        if(left.source!==right.source||left.type!=='DC'||right.type!=='DC')continue;
        const voltage=Number(left.voltage)-Number(right.voltage);
        if(!best.found||Math.abs(voltage)>Math.abs(best.voltage))best={voltage,type:'DC',source:left.source,found:true};
      }
      return best;
    };

    const coilEvaluation=(component,states)=>{
      const terminals=componentTerminals(component),a1=terminals.find(t=>t.dataset.terminal==='A1'),a2=terminals.find(t=>t.dataset.terminal==='A2'),rated=Number(component.dataset.coilRatedVoltage||component.electrical?.coil?.ratedVoltage||220),ratedType=(component.dataset.coilType||component.electrical?.coil?.type||'AC').toUpperCase();
      if(!a1||!a2)return{energized:false,voltage:0,rated,ratedType};
      let measured=0,supplyType='';
      for(const left of terminalStates(states,a1))for(const right of terminalStates(states,a2)){
        if(left.source!==right.source||left.type!==right.type)continue;
        let voltage=0;
        if(left.type==='DC')voltage=Math.abs(Number(left.voltage)-Number(right.voltage));
        else if(left.phase!==right.phase)voltage=left.reference||right.reference?Math.max(Number(left.voltage),Number(right.voltage)):Math.max(Number(left.lineVoltage||left.voltage),Number(right.lineVoltage||right.voltage));
        if(voltage>measured){measured=voltage;supplyType=left.type}
      }
      const energized=supplyType===ratedType&&measured>=rated*.8&&measured<=rated*1.1;
      return{energized,voltage:measured,rated,ratedType,supplyType};
    };

    const coilHasSupply=(component,states)=>{
      const result=coilEvaluation(component,states);
      component.dataset.coilMeasuredVoltage=String(Math.round(result.voltage));component.dataset.coilSupplyType=result.supplyType||'';component.dataset.coilCompatible=String(result.energized);component.dataset.coilStatus=result.energized?'ARMADA':!result.voltage?'A1/A2 SEM TENSÃO':result.supplyType!==result.ratedType?`TIPO INCOMPATÍVEL (${result.supplyType||'?'}/${result.ratedType})`:`TENSÃO INCOMPATÍVEL (${Math.round(result.voltage)}/${result.rated} V)`;
      return result.energized;
    };

    const multimeterReading=(component,states)=>{
      const terminals=componentTerminals(component),com=terminals.find(t=>t.dataset.terminal==='COM'),probe=terminals.find(t=>t.dataset.terminal==='V_OHM_HZ'),mode=component.dataset.meterMode||'VAC',left=terminalStates(states,probe),right=terminalStates(states,com);let measured=0,found=false;
      for(const a of left)for(const b of right){if(a.source!==b.source||a.type!==(mode==='VDC'?'DC':'AC')||b.type!==a.type)continue;let voltage=0;if(a.type==='DC')voltage=Math.abs(Number(a.voltage)-Number(b.voltage));else if(a.phase!==b.phase)voltage=a.reference||b.reference?Math.max(Number(a.voltage),Number(b.voltage)):Math.max(Number(a.lineVoltage||a.voltage),Number(b.lineVoltage||b.voltage));if(voltage>=measured){measured=voltage;found=true}}
      const display=component.querySelector('[data-multimeter-display]')||component.querySelector('svg text[x="103"][y="198"]'),unit=component.querySelector('[data-multimeter-unit]')||component.querySelector('svg text[x="294"][y="213"]');
      if(display)display.textContent=mode==='OFF'?'OFF':found?measured.toFixed(measured<10?3:1):'0.000';if(unit)unit.textContent=mode==='VDC'?'V⎓':mode==='VAC'?'V~':'';component.dataset.measuredVoltage=String(found?measured:0);component.dataset.measuredType=mode==='VDC'?'DC':mode==='VAC'?'AC':'';component.title=mode==='OFF'?'Multímetro desligado':`${mode}: ${found?measured.toFixed(2):'0.00'} V`;
    };

    const evaluateMeasurementInstrument=(component,states)=>{
      const definition=registryDefinition(component),behavior=definition?.behavior||{};
      if(behavior.type!=='measurement-instrument')return;
      const byName=new Map(componentTerminals(component).map(terminal=>[terminal.dataset.terminal,terminal]));
      const terminal=name=>byName.get(name),set=(selector,value)=>component.querySelectorAll(selector).forEach(node=>node.textContent=String(value));
      const pair=behavior.measure||[],preferred=behavior.supply||'',measurement=measureBetween(states,terminal(pair[0]),terminal(pair[1]),preferred);
      const names=pair.length?pair:[...byName.keys()],involved=names.flatMap(name=>terminalStates(states,terminal(name)));
      const sourceIds=new Set(involved.map(state=>state.source).filter(Boolean));
      const frequency=Math.max(0,...involved.filter(state=>state.type==='AC').map(state=>Number(state.frequency||60)));
      const current=estimateLoadCurrent(states,sourceIds),page=Number(component.dataset.meterPage||0),kind=behavior.kind||'voltage-ac';
      let primary='0.0',secondary='',tertiary='',unit='',status='SEM SINAL',title='Instrumento sem sinal',meterFault=false;
      if(kind==='voltage-ac'||kind==='voltage-dc'){
        const value=measurement.voltage||0;primary=value.toFixed(value<10?2:1);unit=kind==='voltage-dc'?'V⎓':'V~';secondary=measurement.type||'—';status=value?'MEDINDO':'SEM TENSÃO';title=`${definition.name}: ${primary} V ${measurement.type||''}`;component.dataset.measuredVoltage=String(value);
      }else if(kind==='frequency'){
        primary=frequency?frequency.toFixed(2):'0.00';unit='Hz';secondary=measurement.voltage?`${measurement.voltage.toFixed(1)} V`:'SEM REDE';status=frequency?'REDE OK':'SEM SINAL';title=`${definition.name}: ${primary} Hz`;
      }else if(kind==='current-ac'){
        primary=current.toFixed(current<10?2:1);unit='A~';secondary=current?'TRMS / EST.':'SEM CARGA';status=sourceIds.size?'CIRCUITO ATIVO':'SEM REDE';title=`${definition.name}: ${primary} A (estimativa do simulador)`;component.dataset.measuredCurrent=String(current);
      }else if(kind==='power-energy'){
        const voltage=measurement.voltage||0,power=voltage*current,now=Date.now(),last=Number(component.dataset.energyUpdatedAt||now),elapsed=Math.max(0,Math.min(5000,now-last)),energy=Number(component.dataset.energyWh||0)+(power*elapsed/3600000);component.dataset.energyUpdatedAt=String(now);component.dataset.energyWh=String(energy);component.dataset.measuredPower=String(power);component.dataset.measuredCurrent=String(current);component.dataset.measuredVoltage=String(voltage);
        const pages=behavior.pages||['V','A','W','kWh'],selected=pages[page%pages.length]||'W';
        if(selected==='V'){primary=voltage.toFixed(1);unit='V';secondary=`${frequency.toFixed(1)} Hz`}else if(selected==='A'){primary=current.toFixed(2);unit='A';secondary='CORRENTE EST.'}else if(selected==='kWh'){primary=(energy/1000).toFixed(4);unit='kWh';secondary='ENERGIA'}else{primary=power.toFixed(power<100?1:0);unit='W';secondary=`FP ${power?'.92':'—'}`}
        status=voltage?'MEDIÇÃO ATIVA':'SEM REDE';tertiary=`${voltage.toFixed(0)}V  ${current.toFixed(2)}A`;title=`${definition.name}: ${voltage.toFixed(1)} V • ${current.toFixed(2)} A • ${power.toFixed(1)} W • ${(energy/1000).toFixed(4)} kWh`;
        if(!component.meterTimer)component.meterTimer=setTimeout(()=>{component.meterTimer=null;scheduleElectricalRecalc()},1000);
      }else if(kind==='multifunction-3p'){
        const phaseNames=behavior.phases||['L1','L2','L3'],neutral=terminal(behavior.neutral||'N'),phaseValues=phaseNames.map(name=>measureBetween(states,terminal(name),neutral,'AC').voltage),lineValues=[[0,1],[1,2],[2,0]].map(([a,b])=>measureBetween(states,terminal(phaseNames[a]),terminal(phaseNames[b]),'AC').voltage),phaseStates=phaseNames.map(name=>terminalStates(states,terminal(name)).find(state=>state.type==='AC'&&!state.reference)),healthy=phaseStates.every(Boolean)&&new Set(phaseStates.map(state=>state.source)).size===1&&new Set(phaseStates.map(state=>state.phase)).size===3,average=phaseValues.reduce((a,b)=>a+b,0)/Math.max(1,phaseValues.filter(Boolean).length),line=Math.max(...lineValues,0);
        primary=(page%3===1?line:page%3===2?frequency:average).toFixed(page%3===2?2:1);unit=page%3===2?'Hz':page%3===1?'V LL':'V LN';secondary=`L1 ${phaseValues[0].toFixed(0)}  L2 ${phaseValues[1].toFixed(0)}  L3 ${phaseValues[2].toFixed(0)}`;tertiary=`LL ${line.toFixed(0)}V  ${frequency.toFixed(1)}Hz`;status=healthy?'3 FASES OK':'FALTA / INVÁLIDA';title=`${definition.name}: ${secondary} • ${tertiary}`;meterFault=!healthy;component.dataset.phaseHealthy=String(healthy);
      }else if(kind==='phase-sequence'){
        const phaseNames=behavior.phases||['L1','L2','L3'],phaseStates=phaseNames.map(name=>terminalStates(states,terminal(name)).find(state=>state.type==='AC'&&!state.reference)),healthy=phaseStates.every(Boolean)&&new Set(phaseStates.map(state=>state.source)).size===1&&new Set(phaseStates.map(state=>state.phase)).size===3,sequence=healthy?phaseStates.map(state=>state.phase).join('-'):'— — —';primary=healthy?'RST':'FALTA';secondary=sequence;status=healthy?'SEQUÊNCIA DIRETA':'VERIFICAR FASES';title=healthy?`${definition.name}: sequência ${sequence}`:`${definition.name}: fase ausente ou rede incompatível`;component.querySelectorAll('[data-phase-led]').forEach((led,index)=>{const on=Boolean(phaseStates[index]);led.setAttribute('fill',on?'#28ef67':'#3b1717');if(on)led.style.filter='drop-shadow(0 0 5px #28ef67)';else led.style.removeProperty('filter')});meterFault=!healthy;
      }else if(kind==='oscilloscope'){
        const common=terminal(behavior.common||'COM'),a=measureBetween(states,terminal(behavior.channelA||'CH1'),common,''),b=measureBetween(states,terminal(behavior.channelB||'CH2'),common,''),active=a.voltage||b.voltage;primary=`A ${a.voltage.toFixed(1)}V`;secondary=`B ${b.voltage.toFixed(1)}V`;tertiary=`${frequency.toFixed(1)} Hz`;status=active?'AUTO / RUN':'SEM SINAL';title=`${definition.name}: CH1 ${a.voltage.toFixed(2)} V • CH2 ${b.voltage.toFixed(2)} V`;
        const wave=(selector,value,type,offset)=>{const path=component.querySelector(selector);if(!path)return;if(!value)path.setAttribute('d',`M48 ${offset}H372`);else if(type==='DC')path.setAttribute('d',`M48 ${offset-18}H372`);else{let d=`M48 ${offset}`;for(let x=48;x<=372;x+=6)d+=` L${x} ${(offset-Math.sin((x-48)/20)*18).toFixed(1)}`;path.setAttribute('d',d)}};wave('[data-scope-wave-a]',a.voltage,a.type,116);wave('[data-scope-wave-b]',b.voltage,b.type,154);
      }else if(kind==='insulation'){
        const a=terminal(pair[0]),b=terminal(pair[1]),wired=wireOnlyConnected(a,b),left=terminalStates(states,a),right=terminalStates(states,b),shared=left.some(first=>right.some(last=>first.source===last.source&&first.type===last.type&&first.phase===last.phase&&first.polarity===last.polarity)),shorted=wired||shared;primary=shorted?'0.00':sourceIds.size?'200+':'OL';unit='MΩ';secondary=shorted?'BAIXA ISOLAÇÃO':'ISOLAÇÃO OK';status=shorted?'REPROVADO':'TESTE 500 V';title=`${definition.name}: ${shorted?'baixa isolação/continuidade detectada':'sem continuidade entre as pontas'}`;meterFault=shorted;
      }
      component.classList.toggle('meter-fault',meterFault);set('[data-meter-display]',primary);set('[data-meter-unit]',unit);set('[data-meter-secondary]',secondary);set('[data-meter-tertiary]',tertiary);set('[data-meter-status]',status);component.title=title;
    };

    return Object.freeze({measureBetween,measureDirectedDc,coilEvaluation,coilHasSupply,multimeterReading,evaluateMeasurementInstrument});
  };
  root.TechRibElectricalMeasurementsRuntime=Object.freeze({create});
})(typeof window!=='undefined'?window:globalThis);
