(function(root){
  'use strict';
  const create=({sheet,componentTerminals,registryDefinition,boardPowerState,measureBetween,wireOnlyConnected}={})=>{
    if(!sheet?.querySelectorAll)throw new Error('TechRibI2cAdcRuntimeV1: sheet ausente');
    for(const [name,fn] of Object.entries({componentTerminals,registryDefinition,boardPowerState,measureBetween,wireOnlyConnected}))if(typeof fn!=='function')throw new Error(`TechRibI2cAdcRuntimeV1: ${name} ausente`);
    const parse=(value,fallback=null)=>{try{return value?JSON.parse(value):fallback}catch{return fallback}};
    const byName=component=>new Map(componentTerminals(component).map(t=>[String(t.dataset.terminal||''),t]));
    const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
    const setLed=(component,selector,on,onColor='#22c55e',offColor='#64748b')=>{const led=component.querySelector?.(selector);if(!led)return;led.setAttribute('fill',on?onColor:offColor);if(on)led.style.filter=`drop-shadow(0 0 6px ${onColor})`;else led.style.removeProperty?.('filter')};
    const snapshot=c=>['i2cAdcPowered','i2cAdcSupplyVoltage','i2cAdcAddress','i2cAdcReadings','i2cAdcConnected','i2cAdcAddressConflict','i2cAdcFault','i2cAdcLastMaster','i2cAdcLastChannel'].map(k=>c.dataset[k]||'').join('|');
    const addressHex=n=>`0x${Number(n||0).toString(16).toUpperCase().padStart(2,'0')}`;
    const addressOf=(component,behavior,map)=>{
      const cfg=behavior.address||{},options=cfg.options||{},explicit=Number(component.dataset.i2cAddress);
      if(Number.isInteger(explicit)&&Object.values(options).map(Number).includes(explicit))return explicit;
      const addr=map.get(cfg.terminal||'ADDR');if(!addr)return Number(cfg.default||72);
      for(const key of ['VDD','SDA','SCL','GND']){const target=map.get(key);if(target&&wireOnlyConnected(addr,target)&&options[key]!=null)return Number(options[key])}
      return Number(cfg.default||72);
    };
    const readChannels=(node,states)=>{
      const result={},ground=node.map.get(node.behavior.power?.ground||'GND'),fsr=Math.max(.256,Number(node.behavior.adc?.fullScaleVoltage||4.096)),maxInput=Math.max(0,Number(node.power.voltage||0)+0.3);let fault='';
      (node.behavior.adc?.channels||[]).forEach((spec,index)=>{const ch=Number(spec.index??index),terminal=node.map.get(spec.terminal||`A${ch}`);let voltage=0,valid=false,source='';if(node.power.powered&&terminal&&ground){const m=measureBetween(states,terminal,ground,'DC');if(m?.type==='DC'){voltage=Number(m.voltage||0);source=m.source||'';valid=Number.isFinite(voltage);if(voltage<-.05||voltage>maxInput+.05)fault=fault||`A${ch} fora da faixa`;voltage=clamp(voltage,0,Math.min(fsr,maxInput||fsr))}}const raw=Math.round(clamp(voltage/fsr,0,1)*32767);result[ch]={voltage:Math.round(voltage*10000)/10000,raw,valid,source}});
      return{result,fault,fsr};
    };
    const busRelation=(master,adc,program)=>{
      const md=byName(master),ad=byName(adc),def=registryDefinition(adc),bus=def?.behavior?.bus||{},msda=md.get(program?.sda||'GPIO21'),mscl=md.get(program?.scl||'GPIO22'),asda=ad.get(bus.sda||'SDA'),ascl=ad.get(bus.scl||'SCL');
      return Boolean(msda&&mscl&&asda&&ascl&&wireOnlyConnected(msda,asda)&&wireOnlyConnected(mscl,ascl));
    };
    const render=node=>{
      const c=node.component,b=node.behavior,ind=b.indicators||{},connected=c.dataset.i2cAdcConnected==='true',fault=Boolean(c.dataset.i2cAdcFault)||c.dataset.i2cAdcAddressConflict==='true';
      setLed(c,'[data-i2c-adc-power-led]',node.power.powered,ind.powerActiveColor||'#22c55e');setLed(c,'[data-i2c-adc-bus-led]',connected,ind.busActiveColor||'#38bdf8');setLed(c,'[data-i2c-adc-conv-led]',connected&&!fault,ind.conversionActiveColor||'#ef4444');setLed(c,'[data-i2c-adc-fault-led]',fault,ind.faultActiveColor||'#ef4444');
      const readings=parse(c.dataset.i2cAdcReadings,{})||{},ch=Number(c.dataset.i2cAdcLastChannel||0),r=readings[ch]||readings[String(ch)]||{voltage:0,raw:0};const vt=c.querySelector?.(`[data-i2c-adc-channel-text="${ch}"]`)||c.querySelector?.('[data-i2c-adc-channel-text="0"]'),rt=c.querySelector?.(`[data-i2c-adc-raw-text="${ch}"]`)||c.querySelector?.('[data-i2c-adc-raw-text="0"]');if(vt)vt.textContent=`A${ch} ${Number(r.voltage||0).toFixed(3)} V`;if(rt)rt.textContent=`RAW ${Math.round(Number(r.raw||0))}`;
      c.classList.toggle('peripheral-powered',node.power.powered);c.classList.toggle('peripheral-active',connected&&!fault);c.classList.toggle('electrical-conflict',fault);
      const addr=addressHex(node.address);c.title=!node.power.powered?`${node.definition.name} • sem alimentação`:c.dataset.i2cAdcAddressConflict==='true'?`${node.definition.name} • ERRO: endereço I²C duplicado ${addr}`:c.dataset.i2cAdcFault?`${node.definition.name} • ERRO: ${c.dataset.i2cAdcFault}`:connected?`${node.definition.name} • ${addr} • I²C OK • A${ch} ${Number(r.voltage||0).toFixed(3)} V / ${Math.round(Number(r.raw||0))}`:`${node.definition.name} • ${addr} • aguardando mestre I²C`;
    };
    const evaluate=(states)=>{
      const all=[...sheet.querySelectorAll('.placed-component[data-registry-id]')],adcs=all.filter(c=>registryDefinition(c)?.behavior?.type==='i2c-adc').map(component=>{const definition=registryDefinition(component),behavior=definition.behavior||{},power=boardPowerState(component,states,behavior),map=power.byName||byName(component),address=addressOf(component,behavior,map),before=snapshot(component),read=readChannels({component,definition,behavior,power,map,address},states);return{component,definition,behavior,power,map,address,before,read}});if(!adcs.length)return false;
      adcs.forEach(node=>{const c=node.component;c.dataset.i2cAdcPowered=String(node.power.powered);c.dataset.i2cAdcSupplyVoltage=String(Math.round(Number(node.power.voltage||0)*1000)/1000);c.dataset.i2cAdcAddress=String(node.address);c.dataset.i2cAdcReadings=JSON.stringify(node.read.result);c.dataset.i2cAdcConnected='false';c.dataset.i2cAdcAddressConflict='false';c.dataset.i2cAdcFault=node.read.fault||'';c.dataset.i2cAdcLastMaster='';c.dataset.i2cAdcLastChannel=c.dataset.i2cAdcLastChannel||'0'});
      const masters=all.filter(c=>c.dataset?.i2cAdcMasterProgram);masters.forEach(master=>{const program=parse(master.dataset.i2cAdcMasterProgram,null);if(!program||String(program.transport||'i2c').toLowerCase()!=='i2c')return;const wanted=Number(program.address??72),targets=adcs.filter(node=>node.power.powered&&node.address===wanted&&busRelation(master,node.component,program));if(targets.length>1){targets.forEach(node=>node.component.dataset.i2cAdcAddressConflict='true');master.dataset.i2cAdcStatus='address-conflict';return}if(targets.length!==1){master.dataset.i2cAdcStatus='no-device';return}const node=targets[0],reads=node.read.result,requested=Array.isArray(program.reads)&&program.reads.length?program.reads:[{channel:0}],response={address:wanted,channels:{}};(requested).forEach(spec=>{const ch=Number(spec.channel??0),r=reads[ch]||reads[String(ch)];if(!r)return;response.channels[ch]=r;node.component.dataset.i2cAdcLastChannel=String(ch)});node.component.dataset.i2cAdcConnected='true';node.component.dataset.i2cAdcLastMaster=master.dataset.componentId||master.dataset.type||'master';master.dataset.i2cAdcStatus='ok';master.dataset.i2cAdcLastRead=JSON.stringify(response)});
      adcs.forEach(render);return adcs.some(node=>node.before!==snapshot(node.component));
    };
    const reset=()=>{[...sheet.querySelectorAll('.placed-component[data-registry-id]')].forEach(c=>{if(registryDefinition(c)?.behavior?.type!=='i2c-adc')return;['i2cAdcPowered','i2cAdcSupplyVoltage','i2cAdcAddress','i2cAdcReadings','i2cAdcConnected','i2cAdcAddressConflict','i2cAdcFault','i2cAdcLastMaster','i2cAdcLastChannel'].forEach(k=>delete c.dataset[k]);c.classList.remove('peripheral-powered','peripheral-active','electrical-conflict');setLed(c,'[data-i2c-adc-power-led]',false);setLed(c,'[data-i2c-adc-bus-led]',false);setLed(c,'[data-i2c-adc-conv-led]',false);setLed(c,'[data-i2c-adc-fault-led]',false);const vt=c.querySelector?.('[data-i2c-adc-channel-text="0"]'),rt=c.querySelector?.('[data-i2c-adc-raw-text="0"]');if(vt)vt.textContent='A0 0.000 V';if(rt)rt.textContent='RAW 0'})};
    return Object.freeze({evaluate,reset,addressOf,busRelation});
  };
  root.TechRibI2cAdcRuntimeV1=Object.freeze({create});
})(typeof window!=='undefined'?window:globalThis);
