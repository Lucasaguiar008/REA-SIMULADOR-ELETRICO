(function(root){
  'use strict';
  const create=({sheet,componentTerminals,registryDefinition,boardPowerState,measureBetween,wireOnlyConnected,gpioReadState,effectiveGpioState,setGpioInputState}={})=>{
    if(!sheet?.querySelectorAll)throw new Error('TechRibModbusRtuIoRuntimeV1: sheet ausente');
    const readGpio=typeof gpioReadState==='function'?gpioReadState:effectiveGpioState;
    for(const [name,fn] of Object.entries({componentTerminals,registryDefinition,boardPowerState,measureBetween,wireOnlyConnected,readGpio,setGpioInputState}))if(typeof fn!=='function')throw new Error(`TechRibModbusRtuIoRuntimeV1: ${name} ausente`);
    const byName=component=>new Map(componentTerminals(component).map(t=>[t.dataset.terminal,t]));
    const parse=(value,fallback={})=>{try{return value?JSON.parse(value):fallback}catch{return fallback}};
    const boolMap=(value)=>{const x=parse(value,{});return x&&typeof x==='object'?x:{}};
    const setLed=(component,selector,on,onColor='#22c55e',offColor='#334155')=>{const led=component.querySelector?.(selector);if(!led)return;led.setAttribute('fill',on?onColor:offColor);if(on){led.style.filter=`drop-shadow(0 0 10px ${onColor}) drop-shadow(0 0 18px ${onColor})`;led.style.opacity='1';led.style.stroke=onColor;led.style.strokeWidth='2.2'}else{led.style.removeProperty?.('filter');led.style.removeProperty?.('opacity');led.style.removeProperty?.('stroke');led.style.removeProperty?.('stroke-width')}};
    const unitIdOf=(component,behavior)=>{const raw=Number(component.dataset.modbusUnitId??behavior.modbus?.unitIdDefault??1),min=Number(behavior.modbus?.unitIdMin??1),max=Number(behavior.modbus?.unitIdMax??247);return Math.max(min,Math.min(max,Math.round(Number.isFinite(raw)?raw:1)))};
    const snapshot=component=>['modbusPowered','modbusUnitId','modbusInputs','modbusCoils','modbusCommunication','modbusAddressConflict','modbusPolarityFault','modbusLastFunction','modbusLastMaster'].map(k=>component.dataset[k]||'').join('|');
    const transceiverPins=definition=>({ro:'RO',re:'RE',de:'DE',di:'DI',a:'A',b:'B',...(definition?.behavior?.pins||{})});
    const busPins=behavior=>({a:behavior.bus?.a||'A',b:behavior.bus?.b||'B'});
    const findMasterTransceiver=(master,transceivers)=>{
      const masterTerms=componentTerminals(master),candidates=[];
      for(const tx of transceivers){const def=registryDefinition(tx),pins=transceiverPins(def),tm=byName(tx),logicNames=[pins.di,pins.ro,pins.de,pins.re].filter(Boolean);let score=0;for(const name of logicNames){const terminal=tm.get(name);if(terminal&&masterTerms.some(mt=>wireOnlyConnected(mt,terminal)))score++}if(score)candidates.push({tx,score})}
      candidates.sort((a,b)=>b.score-a.score);return candidates[0]?.tx||null;
    };
    const busRelation=(tx,module)=>{
      const td=registryDefinition(tx),md=registryDefinition(module),tp=transceiverPins(td),mp=busPins(md?.behavior||{}),tm=byName(tx),mm=byName(module),ta=tm.get(tp.a),tb=tm.get(tp.b),ma=mm.get(mp.a),mb=mm.get(mp.b);if(!ta||!tb||!ma||!mb)return'none';
      if(wireOnlyConnected(ta,ma)&&wireOnlyConnected(tb,mb))return'normal';
      if(wireOnlyConnected(ta,mb)&&wireOnlyConnected(tb,ma))return'swapped';
      return'none';
    };
    const readDigitalInputs=(node,states)=>{
      const {component,behavior,power,map}=node,result={};
      (behavior.digitalInputs||[]).forEach((def,index)=>{const n=Number(def.index??index+1),terminal=map.get(def.terminal||`DI${n}`),ref=map.get(def.reference||behavior.power?.ground||'0V');let active=false;if(power.powered&&terminal&&ref){const m=measureBetween(states,terminal,ref,'DC'),highMin=Number(def.highMin??15),max=Number(def.maxVoltage??36);active=m.type==='DC'&&Number(m.voltage||0)>=highMin&&Number(m.voltage||0)<=max}result[n]=active});
      return result;
    };
    const blankCoils=behavior=>Object.fromEntries((behavior.digitalOutputs||[]).map((def,index)=>[Number(def.index??index+1),false]));
    const activeFrom=(state,spec)=>String(state||'LOW').toUpperCase()===String(spec||'HIGH').toUpperCase();
    const render=node=>{
      const c=node.component,inputs=boolMap(c.dataset.modbusInputs),coils=boolMap(c.dataset.modbusCoils),comm=c.dataset.modbusCommunication==='true',addrFault=c.dataset.modbusAddressConflict==='true',polarity=c.dataset.modbusPolarityFault==='true';
      const indicators=node.behavior.indicators||{},actionColor=indicators.actionActiveColor||'#ef4444';
      setLed(c,'[data-modbus-power-led]',node.power.powered,indicators.powerActiveColor||'#22c55e');setLed(c,'[data-modbus-bus-led]',comm,indicators.busActiveColor||'#38bdf8');setLed(c,'[data-modbus-fault-led]',addrFault||polarity,indicators.faultActiveColor||'#ef4444');
      (node.behavior.digitalInputs||[]).forEach((def,index)=>{const n=Number(def.index??index+1);setLed(c,`[data-modbus-di-led="${n}"]`,inputs[n]===true,actionColor)});
      (node.behavior.digitalOutputs||[]).forEach((def,index)=>{const n=Number(def.index??index+1);setLed(c,`[data-modbus-do-led="${n}"]`,coils[n]===true,actionColor)});
      c.classList.toggle('peripheral-powered',node.power.powered);c.classList.toggle('peripheral-active',comm||Object.values(coils).some(Boolean));c.classList.toggle('electrical-conflict',addrFault||polarity);
      const ins=Object.entries(inputs).filter(([,v])=>v).map(([k])=>`DI${k}`),outs=Object.entries(coils).filter(([,v])=>v).map(([k])=>`DO${k}`);
      c.title=!node.power.powered?`${node.definition.name} • sem alimentação 24 Vcc`:polarity?`${node.definition.name} • ERRO: A/B invertidos`:addrFault?`${node.definition.name} • ERRO: endereço Modbus duplicado (${node.unitId})`:comm?`${node.definition.name} • endereço ${node.unitId} • Modbus OK${ins.length?` • ${ins.join(', ')} ON`:''}${outs.length?` • ${outs.join(', ')} ON`:''}`:`${node.definition.name} • endereço ${node.unitId} • aguardando mestre Modbus`;
    };
    const evaluate=(states)=>{
      const components=[...sheet.querySelectorAll('.placed-component[data-registry-id]')],transceivers=components.filter(c=>registryDefinition(c)?.behavior?.type==='rs485-transceiver');
      const modules=components.filter(c=>registryDefinition(c)?.behavior?.type==='modbus-rtu-io').map(component=>{const definition=registryDefinition(component),behavior=definition.behavior||{},power=boardPowerState(component,states,behavior),map=power.byName||byName(component),unitId=unitIdOf(component,behavior),before=snapshot(component);return{component,definition,behavior,power,map,unitId,before}});
      if(!modules.length)return false;
      modules.forEach(node=>{const c=node.component;c.dataset.modbusPowered=String(node.power.powered);c.dataset.modbusSupplyVoltage=String(Math.round(Number(node.power.voltage||0)*100)/100);c.dataset.modbusSupplySource=node.power.source||'';c.dataset.modbusUnitId=String(node.unitId);c.dataset.modbusInputs=JSON.stringify(readDigitalInputs(node,states));c.dataset.modbusCoils=JSON.stringify(blankCoils(node.behavior));c.dataset.modbusCommunication='false';c.dataset.modbusAddressConflict='false';c.dataset.modbusPolarityFault='false';c.dataset.modbusLastFunction='';c.dataset.modbusLastMaster=''});
      const masters=components.filter(c=>c.dataset?.modbusMasterProgram);
      masters.forEach(master=>{
        const program=parse(master.dataset.modbusMasterProgram,null);if(!program||String(program.transport||'modbus-rtu').toLowerCase()!=='modbus-rtu')return;
        const tx=findMasterTransceiver(master,transceivers);if(!tx){master.dataset.modbusRtuStatus='no-transceiver';return}
        const txDef=registryDefinition(tx),txPower=boardPowerState(tx,states,txDef?.behavior||{});if(!txPower.powered){master.dataset.modbusRtuStatus='transceiver-unpowered';return}if(tx.dataset.rs485BusCollision==='true'){master.dataset.modbusRtuStatus='bus-collision';return}
        const normal=[],swapped=[];modules.forEach(node=>{const r=busRelation(tx,node.component);if(r==='normal')normal.push(node);else if(r==='swapped')swapped.push(node)});swapped.forEach(node=>node.component.dataset.modbusPolarityFault='true');
        const wanted=Math.max(1,Math.min(247,Math.round(Number(program.unitId||1)))),targets=normal.filter(node=>node.unitId===wanted&&node.power.powered),duplicates=targets.length>1;
        if(duplicates)targets.forEach(node=>node.component.dataset.modbusAddressConflict='true');
        if(targets.length!==1||duplicates){master.dataset.modbusRtuStatus=duplicates?'address-conflict':'no-slave';return}
        const node=targets[0],c=node.component,coils=blankCoils(node.behavior),inputs=boolMap(c.dataset.modbusInputs);
        (program.writes||[]).forEach(write=>{const coil=Number(write.coil);if(!Object.prototype.hasOwnProperty.call(coils,coil))return;const state=readGpio(master,write.sourcePin||'');coils[coil]=activeFrom(state,write.active||'HIGH')});
        (program.reads||[]).forEach(read=>{const input=Number(read.discreteInput),pin=read.targetPin;if(!pin||!Object.prototype.hasOwnProperty.call(inputs,input))return;const high=inputs[input]===true;setGpioInputState(master,pin,high?'HIGH':'LOW')});
        c.dataset.modbusCoils=JSON.stringify(coils);c.dataset.modbusCommunication='true';c.dataset.modbusLastFunction=(program.writes?.length&&program.reads?.length)?'FC01+FC02/05':program.writes?.length?'FC05':'FC02';c.dataset.modbusLastMaster=master.dataset.componentId||master.dataset.type||'master';
        master.dataset.modbusRtuStatus='ok';master.dataset.modbusRtuUnitId=String(wanted);master.dataset.modbusRtuLastResponse=JSON.stringify({unitId:wanted,inputs,coils});
      });
      modules.forEach(render);
      return modules.some(node=>node.before!==snapshot(node.component));
    };
    const reset=()=>{[...sheet.querySelectorAll('.placed-component[data-registry-id]')].forEach(component=>{if(registryDefinition(component)?.behavior?.type!=='modbus-rtu-io')return;['modbusPowered','modbusSupplyVoltage','modbusSupplySource','modbusUnitId','modbusInputs','modbusCoils','modbusCommunication','modbusAddressConflict','modbusPolarityFault','modbusLastFunction','modbusLastMaster'].forEach(k=>delete component.dataset[k]);component.classList.remove('peripheral-powered','peripheral-active','electrical-conflict');setLed(component,'[data-modbus-power-led]',false);setLed(component,'[data-modbus-bus-led]',false);setLed(component,'[data-modbus-fault-led]',false);for(let i=1;i<=16;i++){setLed(component,`[data-modbus-di-led="${i}"]`,false);setLed(component,`[data-modbus-do-led="${i}"]`,false)}})};
    return Object.freeze({evaluate,reset,busRelation,findMasterTransceiver});
  };
  root.TechRibModbusRtuIoRuntimeV1=Object.freeze({create});
})(typeof window!=='undefined'?window:globalThis);
