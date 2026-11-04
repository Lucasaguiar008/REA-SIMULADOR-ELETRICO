(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.TechRibCodegenPeripherals=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const VERSION='26G.1';
  const GENERATOR_ID=`TR-CODEGEN-${String(VERSION).split('.')[0]}`;
  const GENERIC_INTERFACES=new Set([
    'analog-0-10v-bidirectional','analog-current-receiver','digital-field-sensor',
    'digital-gas-co-sensor','digital-presence-sensor','dual-relay-shutter','isolated-digital-input'
  ]);
  const SPECIAL_INTERFACES=new Set([
    'i2c-gpio-expander','i2c-pwm-controller','i2c-rtc','i2c-adc',
    'serial-shift-register','parallel-input-shift-register','ethernet-w5500','ethernet-lan8720-rmii',
    'can-twai-transceiver','rs485-transceiver','modbus-rtu-slave-io','modbus-rtu-energy-meter',
    'lora-sx1278-spi','zigbee-cc2530-znp-uart','matter-thread-esp32h2-rcp-uart','knx-tp1-uart'
  ]);
  const KNOWN_INTERFACES=new Set([...GENERIC_INTERFACES,...SPECIAL_INTERFACES,'mcp23017-relay-bank']);
  const TRANSPORT_MODE=/^(?:i2c_|spi_|uart_|can_|rmii_|eth_|shift_|transport_)/;
  const ident=(s,f='item')=>{let x=String(s||'').toLowerCase().normalize?.('NFD').replace(/[\u0300-\u036f]/g,'')||'';x=x.replace(/[^a-z0-9_]+/g,'_').replace(/_+/g,'_').replace(/^_+|_+$/g,'');if(!x)x=f;if(/^\d/.test(x))x='tr_'+x;return x;};
  const upper=(s,f='PIN')=>{let x=String(s||'').toUpperCase().replace(/[^A-Z0-9_]+/g,'_').replace(/_+/g,'_').replace(/^_+|_+$/g,'');return x||f;};
  const num=v=>{const n=Number(v);return Number.isInteger(n)?n:null};
  const gpioNumber=name=>{const m=String(name||'').toUpperCase().match(/(?:GPIO|IO|D)?\s*(\d+)/);return m?Number(m[1]):null};
  const hex=(v,w=2)=>'0x'+Number(v||0).toString(16).toUpperCase().padStart(w,'0');
  const cFloat=v=>{let x=String(Number(v));if(!/[.eE]/.test(x))x+='.0';return x+'f';};
  const parse=s=>{if(!s)return null;if(typeof s==='object')return s;try{return JSON.parse(s)}catch{return null}};
  const tagOf=c=>c?.dataset?.tag||c?.dataset?.componentId||c?.dataset?.type||'DEV';
  function definitionOf(c){try{return globalThis.TechRibLogic?.getDefinition?.(c)||globalThis.TechRibLogic?.registry?.[c?.dataset?.registryId]||null}catch{return null}}
  function datasetObject(c){const out={};if(!c?.dataset)return out;for(const k of Object.keys(c.dataset))out[k]=c.dataset[k];return out}
  function buildDevice(component,pins=[]){
    const def=definitionOf(component),cfg=def?.codegen||null;if(!cfg?.interface)return null;
    const d={id:component?.dataset?.componentId||tagOf(component),tag:tagOf(component),type:component?.dataset?.type||component?.dataset?.registryId||def?.id||'',label:def?.label||def?.name||tagOf(component),interface:String(cfg.interface),cfg,behavior:def?.behavior||{},dataset:datasetObject(component),pins:{},component};
    for(const p of pins||[])for(const o of p.others||[])if(o.component===component)d.pins[String(o.meta?.name||'').toUpperCase()]={pin:p.pin,number:p.number,mode:p.mode};
    return d;
  }
  function terminalByName(component,name){
    if(!component?.querySelectorAll)return null;const n=String(name||'').toUpperCase();
    return [...component.querySelectorAll('[data-terminal]')].find(t=>String(t?.dataset?.terminalName||t?.dataset?.terminal||t?.dataset?.terminalMetaId||'').toUpperCase()===n)||null;
  }
  function netForTerminal(nets,terminal){if(!terminal)return null;const id=terminal?.dataset?.terminalId;return (nets||[]).find(n=>(n.terminals||[]).some(x=>x.el===terminal||(id&&x.el?.dataset?.terminalId===id)))||null;}
  /* Descoberta é deliberadamente topológica. Um controlador só enxerga componentes ligados aos seus GPIOs.
     A única travessia de barramento aqui é RS485 -> escravo Modbus, pois o escravo não toca diretamente o MCU. */
  function allRegistryDevices(pins=[],nets=[]){
    const map=new Map();
    for(const p of pins)for(const o of p.others||[]){const c=o.component;if(!c||map.has(c))continue;const d=buildDevice(c,pins);if(d)map.set(c,d)}
    for(const [c,d] of [...map.entries()]){
      if(d.interface!=='rs485-transceiver')continue;
      const aName=d.cfg?.busA||'A',bName=d.cfg?.busB||'B',nA=netForTerminal(nets,terminalByName(c,aName)),nB=netForTerminal(nets,terminalByName(c,bName));
      const peers=new Set();for(const n of [nA,nB])for(const item of n?.terminals||[])if(item.component&&item.component!==c)peers.add(item.component);
      const status={aConnected:!!nA,bConnected:!!nB,shorted:!!nA&&nA===nB,peers:[]};
      for(const peer of peers){
        const pd=buildDevice(peer,pins);if(!pd||!/^modbus-rtu-/.test(pd.interface))continue;
        const pa=pd.cfg?.busA||pd.behavior?.bus?.a||'A',pb=pd.cfg?.busB||pd.behavior?.bus?.b||'B',pA=netForTerminal(nets,terminalByName(peer,pa)),pB=netForTerminal(nets,terminalByName(peer,pb));
        const peerShorted=!!pA&&pA===pB,exact=!!nA&&!!nB&&nA!==nB&&!peerShorted&&pA===nA&&pB===nB,swapped=!!nA&&!!nB&&nA!==nB&&!peerShorted&&pA===nB&&pB===nA;
        const touches=!!((nA&&(pA===nA||pB===nA))||(nB&&(pA===nB||pB===nB)));
        status.peers.push({tag:pd.tag||pd.label||'Modbus',exact,swapped,touches,hasA:!!pA,hasB:!!pB,shorted:peerShorted});
        if(exact&&!map.has(peer))map.set(peer,pd);
      }
      d.rs485Bus=status;
    }
    return [...map.values()];
  }
  function controllerExtras(controller){
    return{
      i2cAdc:parse(controller?.dataset?.i2cAdcMasterProgram),
      i2cGpio:parse(controller?.dataset?.i2cGpioMasterProgram),
      modbus:parse(controller?.dataset?.modbusMasterProgram),
      modbusEnergy:parse(controller?.dataset?.modbusEnergyMasterProgram),
      simulation:parse(controller?.dataset?.simulationControlProgram)
    };
  }
  const findDevice=(a,iface)=>a.devices.find(d=>d.interface===iface);
  const byType=(a,type)=>a.devices.find(d=>String(d.cfg?.chip||d.type||'').toUpperCase()===String(type||'').toUpperCase());
  const byTypeAll=(a,type)=>a.devices.filter(d=>String(d.cfg?.chip||d.type||'').toUpperCase()===String(type||'').toUpperCase());
  const devicesByInterface=(a,iface)=>(a?.devices||[]).filter(d=>d.interface===iface);
  function allocateDeviceIds(devices=[]){
    const used=new Set(),out=new Map();
    for(const d of devices){const base=ident(d?.tag||d?.label||d?.type||d?.interface||'device'),n0=base||'device';let id=n0,n=2;while(used.has(id))id=`${n0}_${n++}`;used.add(id);out.set(d,id);}
    return out;
  }
  function createIdAllocator(){
    const used=new Set(),assigned=new Map();
    return(key,preferred)=>{if(assigned.has(key))return assigned.get(key);const base=ident(preferred)||'id';let id=base,n=2;while(used.has(id))id=`${base}_${n++}`;used.add(id);assigned.set(key,id);return id;};
  }
  const hasOwn=(o,k)=>!!o&&Object.prototype.hasOwnProperty.call(o,k);
  const deviceRefMatches=(d,ref)=>{const r=String(ref||'');return !!r&&[d?.id,d?.tag,d?.label,d?.type,d?.component?.dataset?.componentId].some(x=>String(x||'')===r);};
  function roleForTerminal(iface,terminal,cfg={}){
    const t=String(terminal||'').toUpperCase();
    if(/^i2c-/.test(iface)){if(t===String(cfg.i2cSdaTerminal||'SDA').toUpperCase())return['i2c_sda','barramento I²C: SDA bidirecional'];if(t===String(cfg.i2cSclTerminal||'SCL').toUpperCase())return['i2c_scl','barramento I²C: SCL'];}
    if(iface==='ethernet-w5500'){const m=cfg.spiTerminals||{};if(t===String(m.sclk||'SCLK').toUpperCase())return['spi_sck','Ethernet W5500: clock SPI'];if(t===String(m.mosi||'MOSI').toUpperCase())return['spi_mosi','Ethernet W5500: MOSI SPI'];if(t===String(m.miso||'MISO').toUpperCase())return['spi_miso','Ethernet W5500: MISO SPI'];if(t===String(m.cs||'CS').toUpperCase())return['spi_cs','Ethernet W5500: chip-select'];if(t===String(cfg.interruptTerminal||'INT').toUpperCase())return['eth_interrupt','Ethernet W5500: interrupção'];if(t===String(cfg.resetTerminal||'RST').toUpperCase())return['eth_reset','Ethernet W5500: reset'];}
    if(iface==='lora-sx1278-spi'){const m=cfg.spiTerminals||{};if(t===String(m.sck||'SCK').toUpperCase())return['spi_sck','LoRa SX1278: clock SPI'];if(t===String(m.mosi||'MOSI').toUpperCase())return['spi_mosi','LoRa SX1278: MOSI SPI'];if(t===String(m.miso||'MISO').toUpperCase())return['spi_miso','LoRa SX1278: MISO SPI'];if(t===String(m.cs||'NSS').toUpperCase())return['spi_cs','LoRa SX1278: NSS/chip-select'];if(t===String(cfg.resetTerminal||'RST').toUpperCase())return['transport_reset','LoRa SX1278: reset'];if(t===String(cfg.dio0Terminal||'DIO0').toUpperCase())return['transport_irq','LoRa SX1278: DIO0'];}
    if(iface==='serial-shift-register'){const m=cfg.pins||{};if(t===String(m.data||'DS').toUpperCase())return['shift_data_out','74HC595: dados seriais'];if(t===String(m.clock||'SH_CP').toUpperCase())return['shift_clock','74HC595: clock'];if(t===String(m.latch||'ST_CP').toUpperCase())return['shift_latch','74HC595: latch'];}
    if(iface==='parallel-input-shift-register'){const m=cfg.pins||{};if(t===String(m.load||'SH_LD').toUpperCase())return['shift_load','74HC165: carga paralela'];if(t===String(m.clock||'CLK').toUpperCase())return['shift_clock','74HC165: clock'];if(t===String(m.data||'QH').toUpperCase())return['shift_data_in','74HC165: dados seriais'];}
    if(iface==='can-twai-transceiver'){if(t===String(cfg.txTerminal||'TXD').toUpperCase())return['can_tx','CAN/TWAI: TX'];if(t===String(cfg.rxTerminal||'RXD').toUpperCase())return['can_rx','CAN/TWAI: RX'];}
    if(iface==='rs485-transceiver'){if(t===String(cfg.uartTxTerminal||'DI').toUpperCase())return['uart_tx','RS485: UART TX/DI'];if(t===String(cfg.uartRxTerminal||'RO').toUpperCase())return['uart_rx','RS485: UART RX/RO'];if(t===String(cfg.driverEnableTerminal||'DE').toUpperCase())return['uart_de','RS485: driver enable'];if(t===String(cfg.receiverEnableTerminal||'RE').toUpperCase())return['uart_re','RS485: receiver enable'];}
    if(['zigbee-cc2530-znp-uart','matter-thread-esp32h2-rcp-uart','knx-tp1-uart'].includes(iface)){const m=cfg.uartTerminals||{};/* terminal RX do módulo recebe TX do host */if(t===String(m.rx||'RXD').toUpperCase())return['uart_tx',`${iface}: UART TX do host`];if(t===String(m.tx||'TXD').toUpperCase())return['uart_rx',`${iface}: UART RX do host`];if(t===String(cfg.resetTerminal||'RST').toUpperCase())return['transport_reset',`${iface}: reset`];if(t===String(cfg.bootTerminal||'BOOT').toUpperCase())return['transport_boot',`${iface}: boot`];}
    if(iface==='ethernet-lan8720-rmii'){const mg=cfg.managementTerminals||{},rm=cfg.rmiiTerminals||{};const q=[[mg.mdc||'MDC','rmii_mdc'],[mg.mdio||'MDIO','rmii_mdio'],[rm.txd0||'TXD0','rmii_txd0'],[rm.txd1||'TXD1','rmii_txd1'],[rm.txEnable||'TX_EN','rmii_tx_en'],[rm.rxd0||'RXD0','rmii_rxd0'],[rm.rxd1||'RXD1','rmii_rxd1'],[rm.crsDv||'CRS_DV','rmii_crs_dv'],[rm.refClk||'REF_CLK','rmii_ref_clk'],[cfg.resetTerminal||'RST','eth_reset']];for(const [name,mode] of q)if(t===String(name).toUpperCase())return[mode,`LAN8720 RMII: ${name}`];}
    return null;
  }
  /* Papéis GPIO/analógicos genéricos são usados SOMENTE pelo árbitro de recursos.
     Eles não substituem o modo inferido do pino em applyPinRoles(), evitando regressão
     no gerador genérico enquanto ainda impedem que um mesmo GPIO seja usado por
     sensor/atuador comum e, ao mesmo tempo, por I2C/SPI/UART/CAN/RMII. */
  function genericResourceRole(d,terminal){
    const iface=String(d?.interface||''),cfg=d?.cfg||{},t=String(terminal||'').toUpperCase();
    const eq=name=>!!name&&t===String(name).toUpperCase();
    if(['isolated-digital-input','digital-field-sensor','digital-gas-co-sensor','digital-presence-sensor'].includes(iface)&&eq(cfg.outputTerminal||'OUT'))return['gpio_input',`${iface}: sinal digital para entrada do controlador`];
    if(iface==='analog-current-receiver'&&eq(cfg.outputTerminal||'OUT'))return['analog_input','receptor analógico: sinal para ADC do controlador'];
    if(iface==='analog-0-10v-bidirectional'){
      if(eq(cfg.logicAdcTerminal||'ADC'))return['analog_input','interface 0-10 V: ADC lógico'];
      if(eq(cfg.logicDacTerminal||'DAC'))return['analog_output','interface 0-10 V: DAC lógico'];
    }
    if(iface==='dual-relay-shutter'){const c=cfg.commands||{};if(eq(c.up||'UP')||eq(c.down||'DOWN'))return['gpio_output','atuador de persiana: comando digital do controlador'];}
    return null;
  }
  function resourceRoleForTerminal(d,terminal){return roleForTerminal(d?.interface,terminal,d?.cfg)||genericResourceRole(d,terminal);}
  function applyPinRoles(pins,a){
    if(!a?.devices)return;
    for(const d of a.devices){for(const [term,p] of Object.entries(d.pins||{})){const role=roleForTerminal(d.interface,term,d.cfg);if(!role)continue;const target=pins.find(x=>x.number===p.number&&String(x.pin).toUpperCase()===String(p.pin).toUpperCase())||pins.find(x=>x.number===p.number);if(target){target.mode=role[0];target.reason=role[1];target.confidence='configured';}}}
    const program=a.program||{};const buses=[];if(program.i2c?.bus)buses.push(program.i2c.bus);if(a.extras?.i2cAdc)buses.push(a.extras.i2cAdc);if(a.extras?.i2cGpio)buses.push(a.extras.i2cGpio);
    for(const bus of buses){for(const [key,mode] of [['sda','i2c_sda'],['scl','i2c_scl']]){const n=gpioNumber(bus?.[key]);const target=pins.find(x=>x.number===n);if(target){target.mode=mode;target.reason=`barramento I²C: ${key.toUpperCase()}`;target.confidence='configured';}}}
  }
  function interfaceSupport(iface,target,profileFamily=''){
    const pf=String(profileFamily||'').toLowerCase();
    const espTarget=target==='esp32-arduino'||target==='esphome'||target==='espidf';
    const espProfile=pf.startsWith('esp32');
    if(GENERIC_INTERFACES.has(iface)||iface==='mcp23017-relay-bank')return{ok:true,mode:'generic'};
    if(iface==='i2c-rtc'&&target==='esphome')return{ok:false,reason:'DS3231: o catálogo oficial atual do ESPHome não fornece plataforma DS3231 nativa; o TechRib bloqueia este alvo em vez de gerar YAML inválido.'};
    if(['i2c-gpio-expander','i2c-pwm-controller','i2c-rtc','i2c-adc','serial-shift-register','parallel-input-shift-register'].includes(iface))return{ok:true,mode:'native'};
    if(iface==='ethernet-w5500'||iface==='ethernet-lan8720-rmii'){
      if(target==='arduino')return{ok:false,reason:`${iface} exige a implementação Ethernet do ESP32; use o alvo ESP32 Arduino ou ESPHome.`};
      if(!espTarget&&!espProfile)return{ok:false,reason:`${iface} nesta implementação exige controlador ESP32.`};
      if(iface==='ethernet-lan8720-rmii'&&pf&&pf!=='esp32')return{ok:false,reason:'LAN8720 RMII nesta implementação usa o EMAC do ESP32 clássico. O TechRib bloqueia outros SoCs em vez de assumir compatibilidade de RMII inexistente.'};
      return{ok:true,mode:'native'};
    }
    if(iface==='can-twai-transceiver'){
      if(target==='arduino')return{ok:false,reason:'CAN/TWAI usa o controlador TWAI interno do ESP32. Use ESP32 Arduino, ESPHome ou ESP-IDF.'};
      if(!espTarget&&!espProfile)return{ok:false,reason:'CAN/TWAI desta implementação exige controlador ESP32 com periférico TWAI.'};
      return{ok:true,mode:'native'};
    }
    if(iface==='lora-sx1278-spi'){
      if(target==='arduino')return{ok:false,reason:'SX1278 desta implementação usa o perfil SPI/IRQ validado para ESP32. Use ESP32 Arduino, ESPHome ou ESP-IDF.'};
      if(!espTarget&&!espProfile)return{ok:false,reason:'SX1278 desta implementação exige controlador ESP32.'};
      return{ok:true,mode:'native'};
    }
    if(iface==='rs485-transceiver'){
      if(target==='arduino')return{ok:false,reason:'RS485/Modbus usa UART dedicada; Arduino genérico não garante Serial2. Use ESP32 Arduino, ESPHome ou ESP-IDF.'};
      return{ok:true,mode:'transport'};
    }
    if(['modbus-rtu-slave-io','modbus-rtu-energy-meter'].includes(iface)){
      if(target==='arduino')return{ok:false,reason:'Modbus RTU usa UART dedicada; Arduino genérico não garante Serial2. Use ESP32 Arduino, ESPHome ou ESP-IDF.'};
      return{ok:true,mode:'native'};
    }
    if(iface==='zigbee-cc2530-znp-uart')return{ok:false,reason:'CC2530 ZNP: UART, papel, canal e PAN não bastam para inferir uma aplicação Zigbee funcional. O gerador bloqueia o alvo até o component.json declarar perfil ZNP/firmware, commissioning e endpoints/clusters.'};
    if(iface==='matter-thread-esp32h2-rcp-uart')return{ok:false,reason:'Matter/Thread via ESP32-H2 RCP requer perfil de host OpenThread/ESP-Matter (Spinel, endpoint e commissioning). A topologia atual não declara esses dados; geração automática foi bloqueada para não produzir firmware falso.'};
    if(iface==='knx-tp1-uart')return{ok:false,reason:'A interface KNX TP1 atual declara UART e barramento, mas não define protocolo UART do módulo, endereços de grupo nem datapoints. Sem esse contrato, código KNX funcional não pode ser inferido com segurança.'};
    return{ok:false,reason:`Interface de geração desconhecida: ${iface}.`};
  }
  function requiredTerminals(d){
    const c=d?.cfg||{},i=d?.interface||'';
    if(/^i2c-/.test(i))return[c.i2cSdaTerminal||'SDA',c.i2cSclTerminal||'SCL'];
    if(i==='serial-shift-register')return[c.pins?.data||'DS',c.pins?.clock||'SH_CP',c.pins?.latch||'ST_CP'];
    if(i==='parallel-input-shift-register')return[c.pins?.load||'SH_LD',c.pins?.clock||'CLK',c.pins?.data||'QH'];
    if(i==='ethernet-w5500')return[c.spiTerminals?.sclk||'SCLK',c.spiTerminals?.mosi||'MOSI',c.spiTerminals?.miso||'MISO',c.spiTerminals?.cs||'CS',c.interruptTerminal||'INT',c.resetTerminal||'RST'];
    if(i==='ethernet-lan8720-rmii'){const m=c.managementTerminals||{},r=c.rmiiTerminals||{};return[m.mdc||'MDC',m.mdio||'MDIO',r.txd0||'TXD0',r.txd1||'TXD1',r.txEnable||'TX_EN',r.rxd0||'RXD0',r.rxd1||'RXD1',r.crsDv||'CRS_DV',r.refClk||'REF_CLK',c.resetTerminal||'RST'];}
    if(i==='can-twai-transceiver')return[c.txTerminal||'TXD',c.rxTerminal||'RXD'];
    if(i==='rs485-transceiver')return[c.uartTxTerminal||'DI',c.uartRxTerminal||'RO',c.driverEnableTerminal||'DE']; // /RE pode ficar fixo em GND ou compartilhar DE
    if(i==='lora-sx1278-spi')return[c.spiTerminals?.sck||'SCK',c.spiTerminals?.mosi||'MOSI',c.spiTerminals?.miso||'MISO',c.spiTerminals?.cs||'NSS',c.resetTerminal||'RST',c.dio0Terminal||'DIO0'];
    if(['zigbee-cc2530-znp-uart','matter-thread-esp32h2-rcp-uart','knx-tp1-uart'].includes(i)){const u=c.uartTerminals||{};const out=[u.rx||'RXD',u.tx||'TXD'];if(c.resetTerminal)out.push(c.resetTerminal);if(c.bootTerminal)out.push(c.bootTerminal);return out;}
    return[];
  }
  function i2cAddressInfo(d,a){
    const explicit=[];
    if(hasOwn(d?.programDevice,'address'))explicit.push({source:'programDevice.address',raw:d.programDevice.address});
    if(hasOwn(d?.dataset,'i2cAddress'))explicit.push({source:'dataset.i2cAddress',raw:d.dataset.i2cAddress});
    if(hasOwn(d?.dataset,'address'))explicit.push({source:'dataset.address',raw:d.dataset.address});
    if(d?.interface==='i2c-gpio-expander'&&hasOwn(a?.extras?.i2cGpio,'address'))explicit.push({source:'extras.i2cGpio.address',raw:a.extras.i2cGpio.address});
    if(d?.interface==='i2c-adc'&&hasOwn(a?.extras?.i2cAdc,'address'))explicit.push({source:'extras.i2cAdc.address',raw:a.extras.i2cAdc.address});
    for(const e of explicit){const n=Number(e.raw);if(Number.isFinite(n)&&Number.isInteger(n))return{value:n,source:e.source,explicit:true,valid:true};return{value:null,source:e.source,explicit:true,valid:false,raw:e.raw};}
    const def=d?.cfg?.defaultAddress??d?.behavior?.address?.default??d?.behavior?.address?.fixed;
    const n=Number(def);return Number.isFinite(n)&&Number.isInteger(n)?{value:n,source:'default',explicit:false,valid:true}:{value:null,source:'none',explicit:false,valid:false};
  }
  function i2cAddressFor(d,a){const info=i2cAddressInfo(d,a);return info.valid?info.value:null;}
  function i2cAddressAllowed(d,address){
    if(!Number.isInteger(address)||address<0||address>0x7F)return false;
    const fixed=d?.behavior?.address?.fixed;if(Number.isFinite(Number(fixed))&&address!==Number(fixed))return false;
    const options=d?.cfg?.addressOptions;if(Array.isArray(options)&&options.length&& !options.map(Number).includes(address))return false;
    const br=d?.behavior?.address||{};if(Number.isFinite(Number(br.min))&&address<Number(br.min))return false;if(Number.isFinite(Number(br.max))&&address>Number(br.max))return false;
    const range=d?.cfg?.addressRange;if(Array.isArray(range)&&range.length){const vals=range.map(Number).filter(Number.isFinite);if(vals.length===2&&Math.abs(vals[1]-vals[0])>1){if(address<Math.min(...vals)||address>Math.max(...vals))return false;}else if(vals.length&&!vals.includes(address))return false;}
    return true;
  }
  function modbusUnitInfo(d,a){
    const explicit=[];
    if(hasOwn(d?.dataset,'modbusUnitId'))explicit.push({source:'dataset.modbusUnitId',raw:d.dataset.modbusUnitId});
    if(hasOwn(d?.dataset,'unitId'))explicit.push({source:'dataset.unitId',raw:d.dataset.unitId});
    if(hasOwn(d?.dataset,'modbusAddress'))explicit.push({source:'dataset.modbusAddress',raw:d.dataset.modbusAddress});
    const mbs=(a?.devices||[]).filter(x=>/^modbus-rtu-/.test(x.interface));
    if(!explicit.length&&mbs.length===1){const ex=d?.interface==='modbus-rtu-energy-meter'?a?.extras?.modbusEnergy:a?.extras?.modbus;if(hasOwn(ex,'unitId'))explicit.push({source:'masterProgram.unitId',raw:ex.unitId});}
    for(const e of explicit){const n=Number(e.raw);if(Number.isFinite(n)&&Number.isInteger(n)&&n>=1&&n<=247)return{value:n,source:e.source,explicit:true,valid:true};return{value:null,source:e.source,explicit:true,valid:false,raw:e.raw};}
    const def=d?.behavior?.modbus?.unitIdDefault??d?.cfg?.defaultUnitId??1,n=Number(def);return Number.isInteger(n)&&n>=1&&n<=247?{value:n,source:'default',explicit:false,valid:true}:{value:null,source:'default',explicit:false,valid:false,raw:def};
  }
  function modbusUnitFor(d,a){const i=modbusUnitInfo(d,a);return i.valid?i.value:null;}
  function modbusSerialKey(d){const b=d?.behavior?.bus||{},c=d?.cfg||{};return`${Number(c.baud??b.baud??9600)}:${String(b.parity??'N').toUpperCase()}:${Number(b.dataBits??8)}:${Number(b.stopBits??1)}`;}
  function targetModbusDevice(a,kind){const list=(a?.devices||[]).filter(d=>kind==='energy'?d.interface==='modbus-rtu-energy-meter':d.interface==='modbus-rtu-slave-io'),ex=kind==='energy'?a?.extras?.modbusEnergy:a?.extras?.modbus,unit=Number(ex?.unitId);if(Number.isInteger(unit))return list.find(d=>modbusUnitFor(d,a)===unit)||null;return list[0]||null;}
  function i2cBusKey(d){const s=d?.cfg?.i2cSdaTerminal||d?.behavior?.bus?.sda||'SDA',c=d?.cfg?.i2cSclTerminal||d?.behavior?.bus?.scl||'SCL',sd=Number(d?.pins?.[String(s).toUpperCase()]?.number),cl=Number(d?.pins?.[String(c).toUpperCase()]?.number);return Number.isInteger(sd)&&Number.isInteger(cl)?`${sd}:${cl}`:null;}
  function spiBusKey(d){const i=d?.interface,c=d?.cfg||{};let m=null;if(i==='ethernet-w5500')m={sck:c.spiTerminals?.sclk||'SCLK',mosi:c.spiTerminals?.mosi||'MOSI',miso:c.spiTerminals?.miso||'MISO'};else if(i==='lora-sx1278-spi')m={sck:c.spiTerminals?.sck||'SCK',mosi:c.spiTerminals?.mosi||'MOSI',miso:c.spiTerminals?.miso||'MISO'};if(!m)return null;const sck=Number(d?.pins?.[String(m.sck).toUpperCase()]?.number),mosi=Number(d?.pins?.[String(m.mosi).toUpperCase()]?.number),miso=Number(d?.pins?.[String(m.miso).toUpperCase()]?.number);return [sck,mosi,miso].every(Number.isInteger)?`${sck}:${mosi}:${miso}`:null;}
  function resourceConflicts(a){
    const issues=[],uses=new Map(),shareable=new Set(['i2c_sda','i2c_scl','spi_sck','spi_mosi','spi_miso','gpio_output','analog_output']);
    for(const d of a?.devices||[])for(const [term,p] of Object.entries(d.pins||{})){const n=Number(p?.number),role=resourceRoleForTerminal(d,term)?.[0];if(!Number.isInteger(n)||!role)continue;if(!uses.has(n))uses.set(n,[]);uses.get(n).push({d,term,role});}
    for(const [gpio,list] of uses){if(list.length<2)continue;for(let i=0;i<list.length;i++)for(let j=i+1;j<list.length;j++){const x=list[i],y=list[j];if(x.d===y.d&&new Set([x.role,y.role]).size<=2&&[x.role,y.role].every(r=>r==='uart_de'||r==='uart_re'))continue;const sameShare=x.role===y.role&&shareable.has(x.role);if(sameShare){if(x.d===y.d&&x.role==='gpio_output'&&String(x.term)!==String(y.term)){issues.push({level:'error',text:`GPIO${gpio}: ${x.d.tag} usa o mesmo GPIO para saídas funcionais distintas ${x.term} e ${y.term}; comandos distintos do mesmo dispositivo devem usar GPIOs diferentes.`});}continue;}issues.push({level:'error',text:`GPIO${gpio}: conflito de recursos entre ${x.d.tag}.${x.term} (${x.role}) e ${y.d.tag}.${y.term} (${y.role}).`});}}
    return issues;
  }
  function meterRegisterDefinitions(d){
    if(!d||d.interface!=='modbus-rtu-energy-meter')return[];const behavior=d.behavior?.registers||{},map=d.cfg?.registerMap||{},keys=[...new Set([...Object.keys(map),...Object.keys(behavior)])];
    return keys.map(key=>{const b=behavior[key]||{},address=Number(b.address??map[key]),scale=Number(b.scale),offset=Number(b.offset??0),unit=String(b.unit??''),valueType=String(b.valueType??''),registerType=String(b.registerType??'');return{key,address,scale,offset,unit,valueType,registerType};});
  }
  function validateDevicePins(a){
    const issues=[];
    for(const d of a?.devices||[]){
      if(/^modbus-rtu-/.test(d.interface))continue;
      const missing=requiredTerminals(d).filter(t=>!Number.isInteger(Number(d.pins?.[String(t).toUpperCase()]?.number)));
      if(missing.length)issues.push({level:'error',text:`${d.tag||d.label}: faltam ligações obrigatórias ao controlador para ${d.interface}: ${missing.join(', ')}.`});
    }
    const i2cGroups=new Map(),i2cBuses=new Map();
    for(const d of a?.devices||[]){if(!/^i2c-/.test(d.interface))continue;const info=i2cAddressInfo(d,a),address=info.value,bus=i2cBusKey(d);if(!info.valid){const detail=info.explicit?`valor ${JSON.stringify(info.raw)} inválido em ${info.source}`:'endereço ausente';issues.push({level:'error',text:`${d.tag}: ${detail}; o gerador não pode substituir por 0x00 nem inventar endereço I²C.`});continue}if(!i2cAddressAllowed(d,address)){issues.push({level:'error',text:`${d.tag}: endereço I²C ${hex(address)} inválido para ${d.cfg?.chip||d.interface}.`});continue}if(bus){if(!i2cBuses.has(bus))i2cBuses.set(bus,[]);i2cBuses.get(bus).push(d);const key=`${bus}@${address}`;if(i2cGroups.has(key)){const prev=i2cGroups.get(key);issues.push({level:'error',text:`Conflito I²C no barramento GPIO${bus.split(':')[0]}/GPIO${bus.split(':')[1]}: ${prev.tag} e ${d.tag} usam o mesmo endereço ${hex(address)}.`});}else i2cGroups.set(key,d);}}
    if(i2cBuses.size>1){const pairs=[...i2cBuses.keys()];issues.push({level:'error',text:`Múltiplos pares I²C no mesmo controlador não são suportados por este gerador: ${pairs.map(x=>`GPIO${x.split(':')[0]}/GPIO${x.split(':')[1]}`).join(' e ')}. Todos os dispositivos I²C devem compartilhar exatamente o mesmo par SDA/SCL.`});}
    const spiBuses=new Map();for(const d of a?.devices||[]){const key=spiBusKey(d);if(!key)continue;if(!spiBuses.has(key))spiBuses.set(key,[]);spiBuses.get(key).push(d);}
    if(spiBuses.size>1){const pairs=[...spiBuses.keys()];issues.push({level:'error',text:`Múltiplos barramentos SPI no mesmo controlador não são suportados de forma consistente por todos os backends: ${pairs.map(x=>{const q=x.split(':');return`SCK GPIO${q[0]}/MOSI GPIO${q[1]}/MISO GPIO${q[2]}`;}).join(' e ')}. W5500/SX1278 devem compartilhar exatamente o mesmo trio SCK/MOSI/MISO e usar CS distintos.`});}
    const mcp=a?.i2cProfile;if(mcp?.bus&&Array.isArray(mcp.expanders)){const bus=`${Number(mcp.bus.sdaNumber??gpioNumber(mcp.bus.sda))}:${Number(mcp.bus.sclNumber??gpioNumber(mcp.bus.scl))}`;for(const e of mcp.expanders||[]){const addr=Number(e.address),key=`${bus}@${addr}`;if(i2cGroups.has(key))issues.push({level:'error',text:`Conflito I²C: ${i2cGroups.get(key).tag} usa ${hex(addr)}, já reservado por ${e.tag||'MCP23017'} no mesmo barramento.`});}}
    issues.push(...resourceConflicts(a));
    const singleIface=[
      ['i2c-pwm-controller','PCA9685'],['i2c-adc','ADS1115'],['i2c-rtc','DS3231'],
      ['serial-shift-register','74HC595'],['parallel-input-shift-register','74HC165'],
      ['ethernet-w5500','W5500'],['ethernet-lan8720-rmii','LAN8720'],['can-twai-transceiver','CAN/TWAI'],
      ['rs485-transceiver','RS485'],['lora-sx1278-spi','SX1278']
    ];
    for(const [iface,label] of singleIface){const ds=devicesByInterface(a,iface);if(ds.length>1)issues.push({level:'error',text:`${label}: ${ds.length} instâncias no mesmo controlador ainda não são suportadas por este backend; o gerador bloqueia a topologia para não omitir dispositivos silenciosamente.`});}
    if(devicesByInterface(a,'ethernet-w5500').length&&devicesByInterface(a,'ethernet-lan8720-rmii').length)issues.push({level:'error',text:'Ethernet: W5500 e LAN8720 simultâneos no mesmo controlador não são suportados por este gerador; selecione uma interface Ethernet por controlador.'});
    const rsDevices=(a?.devices||[]).filter(d=>d.interface==='rs485-transceiver'),mbDevices=(a?.devices||[]).filter(d=>/^modbus-rtu-/.test(d.interface));
    const mbUnits=new Map(),mbSerial=new Map();
    for(const mb of mbDevices){const ui=modbusUnitInfo(mb,a);if(!ui.valid){issues.push({level:'error',text:`${mb.tag}: Unit ID Modbus inválido (${JSON.stringify(ui.raw)}); use um endereço entre 1 e 247.`});continue;}const key=ui.value;if(mbUnits.has(key))issues.push({level:'error',text:`Conflito Modbus RTU: ${mbUnits.get(key).tag} e ${mb.tag} usam o mesmo Unit ID ${key} no barramento RS485.`});else mbUnits.set(key,mb);const sk=modbusSerialKey(mb);mbSerial.set(sk,(mbSerial.get(sk)||0)+1);}
    if(mbSerial.size>1)issues.push({level:'error',text:`Modbus RTU: escravos no mesmo barramento usam parâmetros seriais diferentes (${[...mbSerial.keys()].join(' e ')}); baud/paridade/data bits/stop bits devem coincidir.`});
    for(const rs of rsDevices){const st=rs.rs485Bus;if(st){if(st.shorted)issues.push({level:'error',text:`${rs.tag}: curto RS485 detectado; A e B pertencem à mesma rede elétrica e devem ser redes distintas.`});for(const peer of st.peers||[]){if(peer.shorted){issues.push({level:'error',text:`${rs.tag} ↔ ${peer.tag}: curto RS485 detectado; A e B do escravo pertencem à mesma rede.`});continue}if(peer.exact)continue;if(peer.swapped)issues.push({level:'error',text:`${rs.tag} ↔ ${peer.tag}: polaridade RS485 invertida; A deve chegar em A e B em B.`});else if(peer.touches)issues.push({level:'error',text:`${rs.tag} ↔ ${peer.tag}: barramento Modbus incompleto; A e B devem estar ambos ligados ao mesmo escravo.`});}}}
    if(rsDevices.length&&!mbDevices.length&&!rsDevices.some(r=>(r.rs485Bus?.peers||[]).some(p=>p.touches)))issues.push({level:'warning',text:`${rsDevices[0].tag}: transceptor RS485 detectado, mas nenhum escravo Modbus com contrato codegen foi encontrado no barramento A/B.`});
    if(mbDevices.length&&!rsDevices.length)issues.push({level:'error',text:`${mbDevices[0].tag}: dispositivo Modbus encontrado sem transceptor RS485 ligado ao controlador selecionado.`});
    for(const mb of mbDevices.filter(d=>d.interface==='modbus-rtu-energy-meter')){const regs=meterRegisterDefinitions(mb);if(!regs.length)issues.push({level:'error',text:`${mb.tag}: mapa de registradores do medidor Modbus ausente.`});for(const r of regs){if(!Number.isInteger(r.address)||r.address<0||r.address>0xFFFF||!Number.isFinite(r.scale)||!Number.isFinite(r.offset)||!r.unit||!r.valueType||!r.registerType)issues.push({level:'error',text:`${mb.tag}: contrato incompleto para registrador ${r.key}; são obrigatórios address, valueType, registerType, scale, offset e unit.`});}}
    const lan=findDevice(a,'ethernet-lan8720-rmii');
    if(lan&&String(a.profile?.idfTarget||a.profile?.id||'').toLowerCase()==='esp32'){
      const exp={TXD0:19,TXD1:22,TX_EN:21,RXD0:25,RXD1:26,CRS_DV:27,REF_CLK:0};
      for(const [t,n] of Object.entries(exp)){const got=pinFromDevice(lan,t);if(Number.isInteger(got)&&got!==n)issues.push({level:'error',text:`${lan.tag}: LAN8720 no ESP32 clássico exige ${t}=GPIO${n}; a topologia usa GPIO${got}.`});}
    }
    return issues;
  }
  function analysis(input={}){
    const controller=input.controller,program=input.program||null,pins=input.pins||[],target=input.target||'',profile=input.profile||null;
    const devices=allRegistryDevices(pins,input.nets||[]),extras=controllerExtras(controller);
    const a={version:VERSION,controller,program,pins,target,profile,i2cProfile:input.i2c||null,devices,extras,issues:[],interfaces:[...new Set(devices.map(d=>d.interface))],hasAdvanced:false,summary:''};
    a.hasAdvanced=a.interfaces.some(x=>SPECIAL_INTERFACES.has(x));
    for(const iface of a.interfaces){if(!KNOWN_INTERFACES.has(iface))a.issues.push({level:'error',text:`Componente com interface codegen não catalogada: ${iface}.`});const s=interfaceSupport(iface,target,profile?.idfTarget||profile?.id||profile?.family||'');if(!s.ok)a.issues.push({level:'error',text:s.reason});}
    for(const chip of ['PCF8574','PCA9685','DS3231','ADS1115']){
      const ds=byTypeAll(a,chip),pds=(program?.i2c?.devices||[]).filter(x=>String(x.type||'').toUpperCase()===chip),used=new Set();
      ds.forEach((d,idx)=>{
        const explicit=[d?.dataset?.i2cAddress,d?.dataset?.address,d?.cfg?.defaultAddress].map(Number).find(Number.isFinite);
        let pi=pds.findIndex((pd,j)=>!used.has(j)&&Number.isFinite(explicit)&&Number(pd?.address)===explicit);
        if(pi<0)pi=pds.findIndex((pd,j)=>!used.has(j));
        if(pi>=0){d.programDevice=pds[pi];used.add(pi);}
        else if(chip==='PCF8574'&&idx===0&&extras.i2cGpio)d.programDevice={type:'PCF8574',address:extras.i2cGpio.address??d.cfg.defaultAddress,pinModes:extras.i2cGpio.pinModes||{}};
      });
    }
    a.issues.push(...validateDevicePins(a));
    applyPinRoles(pins,a);
    a.summary=a.interfaces.length?`Periféricos: ${a.interfaces.join(', ')}`:'Sem periférico especial';
    return a;
  }
  function busFrom(a){const b=a.program?.i2c?.bus||a.extras?.i2cAdc||a.extras?.i2cGpio||{};return{sda:gpioNumber(b.sda)??21,scl:gpioNumber(b.scl)??22,frequency:Number(b.frequency||100000)};}
  function pinFromDevice(d,term,def=null){const p=d?.pins?.[String(term||'').toUpperCase()];return p?.number??gpioNumber(def)}
  function generatedHeader(target,a){return[`/*`,` * Projeto gerado automaticamente pelo Simulador TechRib`,` * © 2026 TechRib. Todos os direitos reservados.`,` * Gerador de periféricos: ${GENERATOR_ID} (${VERSION})`,` * Alvo: ${target}`,` * Interfaces: ${a.interfaces.join(', ')}`,` */`,`#define TECHRIB_GENERATED_CODE 1`,`#define TECHRIB_GENERATOR_ID "${GENERATOR_ID}"`].join('\n')}
  function serialPrintValue(lines,label,expr){lines.push(`  Serial.print(${JSON.stringify(label)}); Serial.println(${expr});`);}
  function arduino(a,esp32=true){
    if(!a?.hasAdvanced)return null;
    for(const iface of a.interfaces){const s=interfaceSupport(iface,esp32?'esp32-arduino':'arduino',a.profile?.idfTarget||a.profile?.id||a.profile?.family||'');if(!s.ok)return null;}
    if(validateDevicePins(a).some(x=>x.level==='error'))return null;
    const L=[generatedHeader(esp32?'ESP32 Arduino':'Arduino',a),'','#include <Arduino.h>'];
    const hasI2C=a.interfaces.some(x=>/^i2c-/.test(x));
    const w=findDevice(a,'ethernet-w5500'),lan=findDevice(a,'ethernet-lan8720-rmii'),lora=findDevice(a,'lora-sx1278-spi'),can=findDevice(a,'can-twai-transceiver');
    if(hasI2C)L.push('#include <Wire.h>');
    if(w||lora)L.push('#include <SPI.h>');
    if(w||lan)L.push('#include <ETH.h>');
    if(can)L.push('#include "freertos/FreeRTOS.h"','#include "driver/twai.h"');
    L.push('');
    const bus=busFrom(a);
    if(hasI2C)L.push(`constexpr int TR_I2C_SDA = ${bus.sda};`,`constexpr int TR_I2C_SCL = ${bus.scl};`,`constexpr uint32_t TR_I2C_FREQ = ${bus.frequency};`, '');

    const pcfs=byTypeAll(a,'PCF8574'),pcf=pcfs[0];
    const pcfNames=pcfs.map((d,i)=>({d,i,addr:i2cAddressFor(d,a),addrName:i===0?'TR_PCF_ADDR':`TR_PCF_ADDR_${i+1}`,shadow:i===0?'tr_pcf_shadow':`tr_pcf_shadow_${i+1}`,write:i===0?'trPcfWrite':`trPcfWrite_${i+1}`,read:i===0?'trPcfRead':`trPcfRead_${i+1}`}));
    for(const n of pcfNames){
      L.push(`constexpr uint8_t ${n.addrName} = ${hex(n.addr)};`,`uint8_t ${n.shadow} = 0xFF;`,`void ${n.write}(uint8_t value){ ${n.shadow}=value; Wire.beginTransmission(${n.addrName}); Wire.write(value); Wire.endTransmission(); }`,`uint8_t ${n.read}(){ Wire.requestFrom((int)${n.addrName},1); return Wire.available()?Wire.read():0xFF; }`,'');
    }
    const pca=byType(a,'PCA9685');
    if(pca){
      const addr=Number(pca.programDevice?.address??pca.cfg.defaultAddress??64),freq=Number(pca.programDevice?.frequencyHz??pca.cfg.defaultFrequencyHz??50);
      L.push(`constexpr uint8_t TR_PCA_ADDR = ${hex(addr)};`,`constexpr float TR_PCA_FREQ = ${freq}.0f;`,'void trI2cWrite8(uint8_t addr,uint8_t reg,uint8_t v){ Wire.beginTransmission(addr);Wire.write(reg);Wire.write(v);Wire.endTransmission(); }','uint8_t trI2cRead8(uint8_t addr,uint8_t reg){ Wire.beginTransmission(addr);Wire.write(reg);Wire.endTransmission(false);Wire.requestFrom((int)addr,1);return Wire.available()?Wire.read():0; }','void trPcaInit(float hz){ uint8_t old=trI2cRead8(TR_PCA_ADDR,0x00);float pv=25000000.0f/4096.0f/hz-1.0f;uint8_t pre=(uint8_t)(pv+0.5f);trI2cWrite8(TR_PCA_ADDR,0x00,(old&0x7F)|0x10);trI2cWrite8(TR_PCA_ADDR,0xFE,pre);trI2cWrite8(TR_PCA_ADDR,0x00,old);delay(5);trI2cWrite8(TR_PCA_ADDR,0x00,old|0xA1); }','void trPcaSet(uint8_t ch,uint16_t off){ if(ch>15)return;off&=0x0FFF;uint8_t r=0x06+4*ch;Wire.beginTransmission(TR_PCA_ADDR);Wire.write(r);Wire.write(0);Wire.write(0);Wire.write(off&0xFF);Wire.write(off>>8);Wire.endTransmission(); }','uint16_t trServoTicks(uint8_t degrees){ degrees=constrain(degrees,0,180);uint16_t us=500U+(uint32_t(degrees)*2000U)/180U;return (uint32_t(us)*4096U)/20000U; }','');
    }
    const ads=findDevice(a,'i2c-adc');
    if(ads){
      const ad=Number(a.extras?.i2cAdc?.address??ads.cfg.defaultAddress??72);
      L.push(`constexpr uint8_t TR_ADS_ADDR = ${hex(ad)};`,'void trAdsWriteReg(uint8_t reg,uint16_t v){Wire.beginTransmission(TR_ADS_ADDR);Wire.write(reg);Wire.write(v>>8);Wire.write(v&0xFF);Wire.endTransmission();}','uint16_t trAdsReadReg(uint8_t reg){Wire.beginTransmission(TR_ADS_ADDR);Wire.write(reg);Wire.endTransmission(false);Wire.requestFrom((int)TR_ADS_ADDR,2);uint16_t v=0;if(Wire.available())v=(uint16_t)Wire.read()<<8;if(Wire.available())v|=Wire.read();return v;}','int16_t trAdsReadSingle(uint8_t ch){ch=constrain(ch,0,3);uint16_t cfg=0x8000|((0x04+ch)<<12)|0x0200|0x0100|0x0080|0x0003;trAdsWriteReg(0x01,cfg);uint32_t t=millis();while(!(trAdsReadReg(0x01)&0x8000)&&millis()-t<20)delay(1);return (int16_t)trAdsReadReg(0x00);}','float trAdsVolts(int16_t raw){return raw*(4.096f/32768.0f);}','');
    }
    const rtc=byType(a,'DS3231');
    if(rtc){
      const addr=Number(rtc.programDevice?.address??rtc.cfg.defaultAddress??104);
      L.push(`constexpr uint8_t TR_RTC_ADDR = ${hex(addr)};`,'uint8_t trBcd(uint8_t v){return (v>>4)*10+(v&15);}',`void trRtcRead(){Wire.beginTransmission(TR_RTC_ADDR);Wire.write(0x00);Wire.endTransmission(false);Wire.requestFrom((int)TR_RTC_ADDR,7);if(Wire.available()<7)return;uint8_t s=trBcd(Wire.read()&0x7F),m=trBcd(Wire.read()),h=trBcd(Wire.read()&0x3F);Wire.read();uint8_t d=trBcd(Wire.read()),mo=trBcd(Wire.read()&0x1F),y=trBcd(Wire.read());Serial.print("RTC 20");if(y<10)Serial.print('0');Serial.print(y);Serial.print('-');if(mo<10)Serial.print('0');Serial.print(mo);Serial.print('-');if(d<10)Serial.print('0');Serial.print(d);Serial.print(' ');if(h<10)Serial.print('0');Serial.print(h);Serial.print(':');if(m<10)Serial.print('0');Serial.print(m);Serial.print(':');if(s<10)Serial.print('0');Serial.println(s);}`,'');
    }
    const sr595=findDevice(a,'serial-shift-register');
    if(sr595){
      const pr=(a.program?.shiftRegisters||[]).find(x=>String(x.type).toUpperCase()==='74HC595')||{},data=gpioNumber(pr.data)??pinFromDevice(sr595,sr595.cfg.pins?.data),clk=gpioNumber(pr.clock)??pinFromDevice(sr595,sr595.cfg.pins?.clock),latch=gpioNumber(pr.latch)??pinFromDevice(sr595,sr595.cfg.pins?.latch);
      L.push(`constexpr int TR_595_DATA=${data};`,`constexpr int TR_595_CLK=${clk};`,`constexpr int TR_595_LATCH=${latch};`,'uint8_t tr595State=0;','void tr595Write(uint8_t v){tr595State=v;digitalWrite(TR_595_LATCH,LOW);shiftOut(TR_595_DATA,TR_595_CLK,MSBFIRST,v);digitalWrite(TR_595_LATCH,HIGH);}','');
    }
    const sr165=findDevice(a,'parallel-input-shift-register');
    if(sr165){
      const pr=(a.program?.parallelShiftRegisters||[]).find(x=>String(x.type).toUpperCase()==='74HC165')||{},load=gpioNumber(pr.load)??pinFromDevice(sr165,sr165.cfg.pins?.load),clk=gpioNumber(pr.clock)??pinFromDevice(sr165,sr165.cfg.pins?.clock),data=gpioNumber(pr.data)??pinFromDevice(sr165,sr165.cfg.pins?.data);
      L.push(`constexpr int TR_165_LOAD=${load};`,`constexpr int TR_165_CLK=${clk};`,`constexpr int TR_165_DATA=${data};`,'uint8_t tr165Read(){digitalWrite(TR_165_LOAD,LOW);delayMicroseconds(2);digitalWrite(TR_165_LOAD,HIGH);return shiftIn(TR_165_DATA,TR_165_CLK,MSBFIRST);}','');
    }
    if(w){
      const m=w.cfg.spiTerminals||{},sck=pinFromDevice(w,m.sclk),mosi=pinFromDevice(w,m.mosi),miso=pinFromDevice(w,m.miso),cs=pinFromDevice(w,m.cs),irq=pinFromDevice(w,w.cfg.interruptTerminal),rst=pinFromDevice(w,w.cfg.resetTerminal);
      L.push(`constexpr int TR_ETH_SCK=${sck}, TR_ETH_MISO=${miso}, TR_ETH_MOSI=${mosi}, TR_ETH_CS=${cs}, TR_ETH_IRQ=${irq}, TR_ETH_RST=${rst};`,'bool trEthernetBegin(){SPI.begin(TR_ETH_SCK,TR_ETH_MISO,TR_ETH_MOSI);return ETH.begin(ETH_PHY_W5500,1,TR_ETH_CS,TR_ETH_IRQ,TR_ETH_RST,SPI);}','');
    }
    if(lan){
      const m=lan.cfg.managementTerminals||{},rm=lan.cfg.rmiiTerminals||{},mdc=pinFromDevice(lan,m.mdc),mdio=pinFromDevice(lan,m.mdio),rst=pinFromDevice(lan,lan.cfg.resetTerminal),clk=pinFromDevice(lan,rm.refClk);
      L.push(`constexpr int TR_ETH_MDC=${mdc}, TR_ETH_MDIO=${mdio}, TR_ETH_RST=${rst}, TR_ETH_CLK=${clk};`,'bool trEthernetBegin(){return ETH.begin(ETH_PHY_LAN8720,0,TR_ETH_MDC,TR_ETH_MDIO,TR_ETH_RST,ETH_CLOCK_GPIO0_IN);}','');
    }
    if(can){
      const tx=pinFromDevice(can,can.cfg.txTerminal),rx=pinFromDevice(can,can.cfg.rxTerminal);
      L.push(`constexpr int TR_CAN_TX=${tx}, TR_CAN_RX=${rx};`,'bool trCanBegin(){twai_general_config_t g=TWAI_GENERAL_CONFIG_DEFAULT((gpio_num_t)TR_CAN_TX,(gpio_num_t)TR_CAN_RX,TWAI_MODE_NORMAL);twai_timing_config_t t=TWAI_TIMING_CONFIG_500KBITS();twai_filter_config_t f=TWAI_FILTER_CONFIG_ACCEPT_ALL();return twai_driver_install(&g,&t,&f)==ESP_OK&&twai_start()==ESP_OK;}','');
    }
    const rs=findDevice(a,'rs485-transceiver'),mbDevices=(a.devices||[]).filter(d=>/^modbus-rtu-/.test(d.interface)),mb=mbDevices[0]||null;
    if(rs&&mbDevices.length){
      const tx=pinFromDevice(rs,rs.cfg.uartTxTerminal),rx=pinFromDevice(rs,rs.cfg.uartRxTerminal),de=pinFromDevice(rs,rs.cfg.driverEnableTerminal),re=pinFromDevice(rs,rs.cfg.receiverEnableTerminal)??-1,baud=Number(mb.cfg.baud||mb.behavior?.bus?.baud||9600),units=mbDevices.map(d=>modbusUnitFor(d,a));
      L.push(`constexpr int TR_RS485_TX=${tx},TR_RS485_RX=${rx},TR_RS485_DE=${de},TR_RS485_RE=${re};`,`constexpr uint32_t TR_MODBUS_BAUD=${baud};`,`constexpr uint8_t TR_MODBUS_UNIT=${units[0]};`,...units.slice(1).map((u,i)=>`constexpr uint8_t TR_MODBUS_UNIT_${i+2}=${u};`),'uint16_t trModbusCrc(const uint8_t* p,size_t n){uint16_t c=0xFFFF;while(n--){c^=*p++;for(uint8_t i=0;i<8;i++)c=(c&1)?(c>>1)^0xA001:c>>1;}return c;}','void trRs485Tx(bool on){if(TR_RS485_DE>=0)digitalWrite(TR_RS485_DE,on?HIGH:LOW);if(TR_RS485_RE>=0)digitalWrite(TR_RS485_RE,on?HIGH:LOW);}','bool trModbusRequestUnit(uint8_t unit,uint8_t fn,uint16_t addr,uint16_t value,uint8_t* resp,size_t &len){uint8_t q[8]={unit,fn,(uint8_t)(addr>>8),(uint8_t)addr,(uint8_t)(value>>8),(uint8_t)value,0,0};uint16_t c=trModbusCrc(q,6);q[6]=c&255;q[7]=c>>8;while(Serial2.available())Serial2.read();trRs485Tx(true);Serial2.write(q,8);Serial2.flush();trRs485Tx(false);uint32_t t=millis();len=0;while(millis()-t<180&&len<32){if(Serial2.available())resp[len++]=Serial2.read();}if(len<5)return false;uint16_t got=resp[len-2]|((uint16_t)resp[len-1]<<8);return got==trModbusCrc(resp,len-2)&&resp[0]==unit;}','bool trModbusRequest(uint8_t fn,uint16_t addr,uint16_t value,uint8_t* resp,size_t &len){return trModbusRequestUnit(TR_MODBUS_UNIT,fn,addr,value,resp,len);}','');
    }
    if(lora){
      const m=lora.cfg.spiTerminals||{},sck=pinFromDevice(lora,m.sck),mosi=pinFromDevice(lora,m.mosi),miso=pinFromDevice(lora,m.miso),cs=pinFromDevice(lora,m.cs),rst=pinFromDevice(lora,lora.cfg.resetTerminal),dio=pinFromDevice(lora,lora.cfg.dio0Terminal),freq=Number(lora.dataset?.loraFrequencyHz||lora.cfg.frequencyHz||433000000);
      L.push(`constexpr int TR_LORA_SCK=${sck},TR_LORA_MOSI=${mosi},TR_LORA_MISO=${miso},TR_LORA_CS=${cs},TR_LORA_RST=${rst},TR_LORA_DIO0=${dio};`,`constexpr uint32_t TR_LORA_FREQ=${freq}UL;`,'uint8_t trLoraReg(uint8_t r,uint8_t v,bool wr){digitalWrite(TR_LORA_CS,LOW);SPI.transfer((wr?0x80:0)|r);uint8_t out=SPI.transfer(v);digitalWrite(TR_LORA_CS,HIGH);return out;}','void trLoraWrite(uint8_t r,uint8_t v){trLoraReg(r,v,true);} uint8_t trLoraRead(uint8_t r){return trLoraReg(r,0,false);}','bool trLoraBegin(){pinMode(TR_LORA_CS,OUTPUT);pinMode(TR_LORA_RST,OUTPUT);digitalWrite(TR_LORA_RST,LOW);delay(2);digitalWrite(TR_LORA_RST,HIGH);delay(10);SPI.begin(TR_LORA_SCK,TR_LORA_MISO,TR_LORA_MOSI,TR_LORA_CS);if(trLoraRead(0x42)!=0x12)return false;trLoraWrite(0x01,0x80);uint64_t frf=((uint64_t)TR_LORA_FREQ<<19)/32000000ULL;trLoraWrite(0x06,frf>>16);trLoraWrite(0x07,frf>>8);trLoraWrite(0x08,frf);trLoraWrite(0x0E,0x00);trLoraWrite(0x0F,0x00);trLoraWrite(0x01,0x85);return true;}','bool trLoraSend(const uint8_t* data,uint8_t len){if(!data||!len||len>255)return false;trLoraWrite(0x01,0x81);trLoraWrite(0x0D,0x00);digitalWrite(TR_LORA_CS,LOW);SPI.transfer(0x80|0x00);for(uint8_t i=0;i<len;i++)SPI.transfer(data[i]);digitalWrite(TR_LORA_CS,HIGH);trLoraWrite(0x22,len);trLoraWrite(0x12,0xFF);trLoraWrite(0x01,0x83);uint32_t t=millis();while(millis()-t<3000){if(trLoraRead(0x12)&0x08){trLoraWrite(0x12,0x08);trLoraWrite(0x01,0x85);return true;}}trLoraWrite(0x01,0x85);return false;}','');
    }

    L.push('void setup(){','  Serial.begin(115200);');
    if(hasI2C){if(esp32)L.push('  Wire.begin(TR_I2C_SDA,TR_I2C_SCL,TR_I2C_FREQ);');else L.push('  Wire.begin();','  Wire.setClock(TR_I2C_FREQ);');}
    for(const n of pcfNames){const pm=n.d.programDevice?.pinModes||{};let init=0xFF;for(let i=0;i<8;i++){const md=String(pm['P'+i]||'unused');if(md==='output')init|=(1<<i);}L.push(`  ${n.write}(${hex(init)}); // ${n.d.tag}: PCF8574 HIGH libera os pinos quasi-bidirecionais`);}
    if(pca)L.push('  trPcaInit(TR_PCA_FREQ);');
    if(sr595)L.push('  pinMode(TR_595_DATA,OUTPUT);pinMode(TR_595_CLK,OUTPUT);pinMode(TR_595_LATCH,OUTPUT);tr595Write(0);');
    if(sr165)L.push('  pinMode(TR_165_LOAD,OUTPUT);pinMode(TR_165_CLK,OUTPUT);pinMode(TR_165_DATA,INPUT);digitalWrite(TR_165_CLK,LOW);digitalWrite(TR_165_LOAD,HIGH);');
    const setupInputs=new Set();
    for(const r of a.program?.pwmRules||[]){const p=gpioNumber(r.sourcePin);if(p!==null)setupInputs.add(p);}
    for(const r of a.program?.serialRules||[]){const p=gpioNumber(r.trigger?.pin);if(p!==null)setupInputs.add(p);}
    for(const r of a.extras?.modbus?.writes||[]){const p=gpioNumber(r.sourcePin);if(p!==null)setupInputs.add(p);}
    for(const r of a.extras?.i2cGpio?.writes||[]){const p=gpioNumber(r.sourcePin);if(p!==null)setupInputs.add(p);}
    for(const p of setupInputs)L.push(`  pinMode(${p},INPUT_PULLUP);`);
    if(w||lan)L.push('  Serial.println(trEthernetBegin()?"Ethernet iniciado":"Falha Ethernet");');
    if(can)L.push('  Serial.println(trCanBegin()?"CAN/TWAI iniciado":"Falha CAN/TWAI");');
    if(rs&&mb)L.push('  if(TR_RS485_DE>=0)pinMode(TR_RS485_DE,OUTPUT);if(TR_RS485_RE>=0)pinMode(TR_RS485_RE,OUTPUT);trRs485Tx(false);Serial2.begin(TR_MODBUS_BAUD,SERIAL_8N1,TR_RS485_RX,TR_RS485_TX);');
    if(lora)L.push('  Serial.println(trLoraBegin()?"SX1278 iniciado":"Falha SX1278");');
    L.push('}','', 'void loop(){');

    if(pcf&&a.program?.rules?.length){
      for(const r of a.program.rules){
        if(r.type==='toggle'&&r.trigger?.device&&r.output?.device){const ti=Math.max(0,pcfs.findIndex(d=>deviceRefMatches(d,r.trigger.device))),oi=Math.max(0,pcfs.findIndex(d=>deviceRefMatches(d,r.output.device))),tn=pcfNames[ti]||pcfNames[0],on=pcfNames[oi]||pcfNames[0],ib=Number(String(r.trigger.pin||'').replace(/\D/g,'')),ob=Number(String(r.output.pin||'').replace(/\D/g,'')),k=ident(r.memory||`m_${ib}_${ob}`),initial=!!a.program?.memory?.[r.memory],trigHigh=String(r.trigger.active||'LOW').toUpperCase()==='HIGH',activeHigh=String(r.output.active||'LOW').toUpperCase()==='HIGH',inactiveHigh=String(r.output.inactive||'HIGH').toUpperCase()==='HIGH';L.push(`  static bool tr_ready_${k}=false,tr_last_${k}=false,tr_mem_${k}=${initial?'true':'false'};`,`  bool tr_now_${k}=(((${tn.read}()>>${ib})&1u)==${trigHigh?'1u':'0u'});`,`  if(!tr_ready_${k}){tr_last_${k}=tr_now_${k};tr_ready_${k}=true;}else if(tr_now_${k}&&!tr_last_${k}){tr_mem_${k}=!tr_mem_${k};bool tr_high_${k}=tr_mem_${k}?${activeHigh?'true':'false'}:${inactiveHigh?'true':'false'};if(tr_high_${k})${on.shadow}|=(1u<<${ob});else ${on.shadow}&=~(1u<<${ob});${on.write}(${on.shadow});}`,`  tr_last_${k}=tr_now_${k};`);}
      }
    }
    if(pcf&&a.extras?.i2cGpio){
      const legacy=a.extras.i2cGpio;
      for(const r of legacy.writes||[]){const p=gpioNumber(r.sourcePin),ob=Number(String(r.pin||'').replace(/\D/g,''));if(p===null||!Number.isInteger(ob))continue;const inv=!!r.invert;L.push(`  if(digitalRead(${p})${inv?'==HIGH':'==LOW'})tr_pcf_shadow&=~(1u<<${ob});else tr_pcf_shadow|=(1u<<${ob});`);}
      if((legacy.writes||[]).length)L.push('  trPcfWrite(tr_pcf_shadow);');
      for(const r of legacy.reads||[]){const ib=Number(String(r.pin||'').replace(/\D/g,''));if(Number.isInteger(ib))L.push(`  {uint8_t tr_v=trPcfRead();Serial.print("PCF8574 P${ib}=");Serial.println((tr_v>>${ib})&1);}`);}
    }
    if(pca){for(const r of a.program?.pwmRules||[]){const src=gpioNumber(r.sourcePin);if(src!==null)L.push(`  trPcaSet(${Number(r.channel)},trServoTicks(digitalRead(${src})?${Number(r.highAngle??90)}:${Number(r.lowAngle??0)}));`);}}
    if(ads){for(const r of a.extras?.i2cAdc?.reads||[{channel:0}]){const ch=Number(r.channel||0);L.push(`  {int16_t raw=trAdsReadSingle(${ch});Serial.print("ADS1115 A${ch}: ");Serial.print(trAdsVolts(raw),4);Serial.println(" V");}`);}L.push('  delay(500);');}
    if(rtc)L.push('  trRtcRead();delay(1000);');
    if(sr165&&!sr595)L.push('  static uint32_t tr165_t=0;if(millis()-tr165_t>100){tr165_t=millis();uint8_t v=tr165Read();Serial.print("74HC165: 0x");Serial.println(v,HEX);}');
    if(sr165&&sr595){L.push('  static bool tr165_ready=false;static uint8_t tr165_prev=0;uint8_t tr165_in=tr165Read();uint8_t tr165_rise=tr165_ready?(uint8_t)(tr165_in&~tr165_prev):0;tr165_prev=tr165_in;tr165_ready=true;');for(let i=0;i<8;i++)L.push(`  if(tr165_rise&(1u<<${i}))tr595State^=(1u<<${i});`);L.push('  tr595Write(tr595State);');}
    if(sr595&&!sr165){
      let idx=0;
      for(const r of a.program?.serialRules||[]){
        const p=gpioNumber(r.trigger?.pin);if(p===null)continue;const active=String(r.trigger?.active||'HIGH').toUpperCase()==='HIGH'?'HIGH':'LOW';
        if(String(r.type||'').toLowerCase()==='write-byte')L.push(`  {static bool tr595_last_${idx}=false;bool tr595_now_${idx}=digitalRead(${p})==${active};if(tr595_now_${idx}&&!tr595_last_${idx})tr595Write(${Math.max(0,Math.min(255,Number(r.value)||0))});tr595_last_${idx}=tr595_now_${idx};}`);
        else if(String(r.type||'').toLowerCase()==='map-bit')L.push(`  if(digitalRead(${p})==${active})tr595State|=(1u<<${Math.max(0,Math.min(7,Number(r.bit)||0))});else tr595State&=~(1u<<${Math.max(0,Math.min(7,Number(r.bit)||0))});`);
        idx++;
      }
      if((a.program?.serialRules||[]).length)L.push('  tr595Write(tr595State);');
    }
    if(rs&&mbDevices.length){
      const io=targetModbusDevice(a,'io'),ioUnit=io?modbusUnitFor(io,a):null;
      for(const r of a.extras?.modbus?.writes||[]){const p=gpioNumber(r.sourcePin);if(p!==null&&ioUnit!==null)L.push(`  {uint8_t resp[32];size_t n=0;uint16_t val=digitalRead(${p})==${String(r.active||'HIGH').toUpperCase()==='HIGH'?'HIGH':'LOW'}?0xFF00:0x0000;trModbusRequestUnit(${ioUnit},0x05,${Math.max(0,Number(r.coil||1)-1)},val,resp,n);}`);}
      for(const r of a.extras?.modbus?.reads||[])if(ioUnit!==null)L.push(`  {uint8_t resp[32];size_t n=0;if(trModbusRequestUnit(${ioUnit},0x02,${Math.max(0,Number(r.discreteInput||1)-1)},1,resp,n)&&n>=6){Serial.print("DI${Number(r.discreteInput||1)}=");Serial.println(resp[3]&1);}}`);
      for(const meter of mbDevices.filter(d=>d.interface==='modbus-rtu-energy-meter')){const unit=modbusUnitFor(meter,a),defs=meterRegisterDefinitions(meter),wanted=new Set((a.extras?.modbusEnergy?.unitId==null||Number(a.extras.modbusEnergy.unitId)===unit?(a.extras?.modbusEnergy?.reads||defs.map(r=>r.address)):[]).map(Number));for(const r of defs){if(!wanted.has(r.address))continue;L.push(`  {uint8_t resp[32];size_t n=0;if(trModbusRequestUnit(${unit},0x03,${r.address},1,resp,n)&&n>=7){const uint16_t raw=(uint16_t(resp[3])<<8)|resp[4];const float value=float(raw)*${cFloat(r.scale)}+${cFloat(r.offset)};Serial.print(${JSON.stringify((mbDevices.filter(x=>x.interface==='modbus-rtu-energy-meter').length>1?meter.tag+' ':'')+r.key+'=')});Serial.print(value,${Math.max(0,Math.min(6,String(r.scale).split('.')[1]?.length||0))});Serial.println(${JSON.stringify(' '+r.unit)});}}`);}}
      L.push('  delay(250);');
    }
    if(can)L.push('  twai_message_t rx={};if(twai_receive(&rx,pdMS_TO_TICKS(1))==ESP_OK){Serial.print("CAN id=0x");Serial.print((unsigned long)rx.identifier,HEX);Serial.print(" len=");Serial.println(rx.data_length_code);}');
    if(lora)L.push('  // SX1278 permanece em RX contínuo; use trLoraSend(data,len) para transmitir e o runtime do projeto para definir a lógica da aplicação.');
    if(!(pcfs.length||pca||ads||rtc||sr595||sr165||w||lan||can||(rs&&mb)||lora))L.push('  delay(10);');
    L.push('}','');
    return{code:L.join('\n'),ext:'ino',unsupported:[]};
  }
  function yamlQuote(s){return '"'+String(s||'').replace(/"/g,'\\"')+'"'}
  function servoLevelFromAngle(deg){const d=Math.max(0,Math.min(180,Number(deg)||0));return Math.round(((d/90)-1)*1000)/10;}
  function esphome(a){
    if(!a?.hasAdvanced)return null;
    for(const iface of a.interfaces){const s=interfaceSupport(iface,'esphome',a.profile?.idfTarget||a.profile?.id||a.profile?.family||'');if(!s.ok)return null;}
    if(validateDevicePins(a).some(x=>x.level==='error'))return null;
    const name=ident(a.controller?.dataset?.tag||'techrib_esp32');
    const L=['# Projeto gerado automaticamente pelo Simulador TechRib',`# Generator ID: ${GENERATOR_ID}`,'esphome:',`  name: ${name}`,'','esp32:','  board: esp32dev','  framework:','    type: esp-idf','','logger:','','api:','','ota:','  - platform: esphome'];
    const sections={switch:[],binary_sensor:[],sensor:[],output:[],servo:[],button:[]};
    const add=(section,lines)=>sections[section].push(...lines),deviceIds=allocateDeviceIds(a.devices),allocId=createIdAllocator(),devPos=new Map((a.devices||[]).map((d,i)=>[d,i]));
    const hubId=(d,prefix='')=>allocId(`hub:${devPos.get(d)}:${prefix}`,`${prefix}${deviceIds.get(d)||ident(d.tag)}`);
    const hasI2C=a.interfaces.some(x=>/^i2c-/.test(x)),bus=busFrom(a);
    if(hasI2C)L.push('','i2c:',`  sda: GPIO${bus.sda}`,`  scl: GPIO${bus.scl}`,`  frequency: ${bus.frequency}Hz`,'  scan: true');

    const pcfs=byTypeAll(a,'PCF8574'),pcf=pcfs[0];
    if(pcfs.length){
      L.push('','pcf8574:');
      pcfs.forEach((d,di)=>{
        const addr=i2cAddressFor(d,a),id=hubId(d);
        L.push(`  - id: ${id}`,`    address: ${hex(addr)}`);
        const pm={...(d.programDevice?.pinModes||{})},outs=[],ins=[];
        if(di===0){for(const r of a.extras?.i2cGpio?.writes||[]){const i=Number(String(r.pin||'').replace(/\D/g,''));if(Number.isInteger(i))pm['P'+i]='output';}for(const r of a.extras?.i2cGpio?.reads||[]){const i=Number(String(r.pin||'').replace(/\D/g,''));if(Number.isInteger(i))pm['P'+i]='input_pullup';}}
        for(let i=0;i<8;i++){if(pm['P'+i]==='output')outs.push(i);if(/input/.test(pm['P'+i]||''))ins.push(i);}
        for(const i of outs){const rr=(a.program?.rules||[]).find(r=>r.type==='toggle'&&deviceRefMatches(d,r.output?.device)&&String(r.output?.pin).toUpperCase()==='P'+i),inv=rr?String(rr.output?.active||'LOW').toUpperCase()==='LOW':false,outId=allocId(`entity:pcf:${devPos.get(d)}:out:${i}`,`${id}_p${i}_out`);add('switch',['  - platform: gpio',`    id: ${outId}`,`    name: ${yamlQuote(`${d.tag} P${i}`)}`,'    pin:',`      pcf8574: ${id}`,`      number: ${i}`,'      mode: OUTPUT',`      inverted: ${inv?'true':'false'}`]);}
        for(const i of ins){const rr=(a.program?.rules||[]).find(r=>r.type==='toggle'&&deviceRefMatches(d,r.trigger?.device)&&String(r.trigger?.pin).toUpperCase()==='P'+i),inv=rr?String(rr.trigger?.active||'LOW').toUpperCase()==='LOW':false,inId=allocId(`entity:pcf:${devPos.get(d)}:in:${i}`,`${id}_p${i}_in`);const lines=['  - platform: gpio',`    id: ${inId}`,`    name: ${yamlQuote(`${d.tag} P${i}`)}`,'    pin:',`      pcf8574: ${id}`,`      number: ${i}`,'      mode: INPUT',`      inverted: ${inv?'true':'false'}`,'    filters:','      - delayed_on: 20ms','      - delayed_off: 20ms'];if(rr){const ob=Number(String(rr.output?.pin||'').replace(/\D/g,'')),od=pcfs.find(x=>deviceRefMatches(x,rr.output?.device))||d,oid=hubId(od),outId=allocId(`entity:pcf:${devPos.get(od)}:out:${ob}`,`${oid}_p${ob}_out`);lines.push('    on_press:','      then:',`        - switch.toggle: ${outId}`);}add('binary_sensor',lines);}
        if(di===0){for(const [ri,r] of (a.extras?.i2cGpio?.writes||[]).entries()){const src=gpioNumber(r.sourcePin),ob=Number(String(r.pin||'').replace(/\D/g,''));if(src===null||!Number.isInteger(ob))continue;const sid=allocId(`entity:pcf:${devPos.get(d)}:legacy:${ri}`,`${id}_legacy_src_${ri}`),outId=allocId(`entity:pcf:${devPos.get(d)}:out:${ob}`,`${id}_p${ob}_out`);add('binary_sensor',['  - platform: gpio',`    id: ${sid}`,`    name: ${yamlQuote(`${d.tag} comando P${ob}`)}`,`    pin: GPIO${src}`,'    on_press:','      then:',`        - switch.${r.invert?'turn_on':'turn_off'}: ${outId}`,'    on_release:','      then:',`        - switch.${r.invert?'turn_off':'turn_on'}: ${outId}`]);}}
      });
    }

    const pca=byType(a,'PCA9685');
    if(pca){
      const addr=Number(pca.programDevice?.address??pca.cfg.defaultAddress??64),freq=Number(pca.programDevice?.frequencyHz??pca.cfg.defaultFrequencyHz??50),id=hubId(pca);
      L.push('','pca9685:',`  - id: ${id}`,`    address: ${hex(addr)}`,`    frequency: ${freq}Hz`);
      const rules=a.program?.pwmRules||[];
      rules.forEach((r,i)=>{
        const ch=Math.max(0,Math.min(15,Number(r.channel)||0)),outId=allocId(`entity:pca:${devPos.get(pca)}:out:${ch}`,`${id}_ch${ch}`),servoId=allocId(`entity:pca:${devPos.get(pca)}:servo:${ch}`,`servo_${id}_${ch}`);
        add('output',['  - platform: pca9685',`    pca9685_id: ${id}`,`    channel: ${ch}`,`    id: ${outId}`]);
        add('servo',[`  - id: ${servoId}`,`    output: ${outId}`]);
        const src=gpioNumber(r.sourcePin);
        if(src!==null){
          const bs=allocId(`entity:pca:${devPos.get(pca)}:src:${i}`,`${id}_src_${i}`),lo=servoLevelFromAngle(r.lowAngle??0),hi=servoLevelFromAngle(r.highAngle??90);
          add('binary_sensor',['  - platform: gpio',`    id: ${bs}`,`    name: ${yamlQuote(`${pca.tag} CH${ch} controle`)}`,`    pin: GPIO${src}`,'    on_press:','      then:','        - servo.write:',`            id: ${servoId}`,`            level: ${hi}%`,'    on_release:','      then:','        - servo.write:',`            id: ${servoId}`,`            level: ${lo}%`]);
        }
      });
    }

    const ads=findDevice(a,'i2c-adc');
    if(ads){
      const addr=Number(a.extras?.i2cAdc?.address??ads.cfg.defaultAddress??72),id=hubId(ads);
      L.push('','ads1115:',`  - address: ${hex(addr)}`,`    id: ${id}`);
      for(const r of a.extras?.i2cAdc?.reads||[{channel:0}]){const ch=Math.max(0,Math.min(3,Number(r.channel)||0));add('sensor',['  - platform: ads1115',`    ads1115_id: ${id}`,`    multiplexer: A${ch}_GND`,'    gain: 4.096',`    name: ${yamlQuote(`ADS1115 A${ch}`)}`]);}
    }

    const sr595=findDevice(a,'serial-shift-register');
    if(sr595){
      const pr=(a.program?.shiftRegisters||[]).find(x=>String(x.type).toUpperCase()==='74HC595')||{},data=gpioNumber(pr.data)??pinFromDevice(sr595,sr595.cfg.pins?.data),clk=gpioNumber(pr.clock)??pinFromDevice(sr595,sr595.cfg.pins?.clock),latch=gpioNumber(pr.latch)??pinFromDevice(sr595,sr595.cfg.pins?.latch),id=hubId(sr595);
      L.push('','sn74hc595:',`  - id: ${id}`,`    data_pin: GPIO${data}`,`    clock_pin: GPIO${clk}`,`    latch_pin: GPIO${latch}`,'    sr_count: 1');
      for(let i=0;i<8;i++){const qid=allocId(`entity:595:${devPos.get(sr595)}:${i}`,`${id}_q${i}`);add('switch',['  - platform: gpio',`    id: ${qid}`,`    name: ${yamlQuote(`${sr595.tag} Q${i}`)}`,'    pin:',`      sn74hc595: ${id}`,`      number: ${i}`,'      inverted: false']);}
    }

    const sr165=findDevice(a,'parallel-input-shift-register');
    if(sr165){
      const pr=(a.program?.parallelShiftRegisters||[]).find(x=>String(x.type).toUpperCase()==='74HC165')||{},load=gpioNumber(pr.load)??pinFromDevice(sr165,sr165.cfg.pins?.load),clk=gpioNumber(pr.clock)??pinFromDevice(sr165,sr165.cfg.pins?.clock),data=gpioNumber(pr.data)??pinFromDevice(sr165,sr165.cfg.pins?.data),id=hubId(sr165);
      L.push('','sn74hc165:',`  - id: ${id}`,`    clock_pin: GPIO${clk}`,`    data_pin: GPIO${data}`,`    load_pin: GPIO${load}`,'    sr_count: 1');
      for(let i=0;i<8;i++){const iid=allocId(`entity:165:${devPos.get(sr165)}:${i}`,`${id}_in${i}`);add('binary_sensor',['  - platform: gpio',`    id: ${iid}`,`    name: ${yamlQuote(`${sr165.tag} ${String.fromCharCode(65+i)}`)}`,'    pin:',`      sn74hc165: ${id}`,`      number: ${i}`,'      inverted: false']);}
    }

    const w=findDevice(a,'ethernet-w5500');
    if(w){const m=w.cfg.spiTerminals||{};L.push('','ethernet:','  type: W5500',`  clk_pin: GPIO${pinFromDevice(w,m.sclk)}`,`  mosi_pin: GPIO${pinFromDevice(w,m.mosi)}`,`  miso_pin: GPIO${pinFromDevice(w,m.miso)}`,`  cs_pin: GPIO${pinFromDevice(w,m.cs)}`,`  interrupt_pin: GPIO${pinFromDevice(w,w.cfg.interruptTerminal)}`,`  reset_pin: GPIO${pinFromDevice(w,w.cfg.resetTerminal)}`);}

    const lan=findDevice(a,'ethernet-lan8720-rmii');
    if(lan){const m=lan.cfg.managementTerminals||{},rm=lan.cfg.rmiiTerminals||{};L.push('','ethernet:','  type: LAN8720',`  mdc_pin: GPIO${pinFromDevice(lan,m.mdc)}`,`  mdio_pin: GPIO${pinFromDevice(lan,m.mdio)}`,'  clk:',`    pin: GPIO${pinFromDevice(lan,rm.refClk)}`,'    mode: CLK_EXT_IN','  phy_addr: 0',`  power_pin: GPIO${pinFromDevice(lan,lan.cfg.resetTerminal)}`);}

    const can=findDevice(a,'can-twai-transceiver');
    if(can)L.push('','canbus:','  - platform: esp32_can',`    tx_pin: GPIO${pinFromDevice(can,can.cfg.txTerminal)}`,`    rx_pin: GPIO${pinFromDevice(can,can.cfg.rxTerminal)}`,'    can_id: 1','    bit_rate: 500kbps');

    const rs=findDevice(a,'rs485-transceiver'),mbDevices=(a.devices||[]).filter(d=>/^modbus-rtu-/.test(d.interface));
    if(rs&&mbDevices.length){
      const tx=pinFromDevice(rs,rs.cfg.uartTxTerminal),rx=pinFromDevice(rs,rs.cfg.uartRxTerminal),de=pinFromDevice(rs,rs.cfg.driverEnableTerminal),baud=Number(mbDevices[0].cfg.baud||mbDevices[0].behavior?.bus?.baud||9600);
      L.push('','uart:',`  tx_pin: GPIO${tx}`,`  rx_pin: GPIO${rx}`,`  baud_rate: ${baud}`,'','modbus:',`  flow_control_pin: GPIO${de}`,'  role: client','','modbus_controller:');
      const mbIds=new Map();for(const d of mbDevices){const id=allocId(`hub:modbus:${devPos.get(d)}`,`modbus_${deviceIds.get(d)||ident(d.tag)}`),unit=modbusUnitFor(d,a);mbIds.set(d,id);L.push(`  - id: ${id}`,`    address: ${unit}`);}
      const io=targetModbusDevice(a,'io');if(io){const id=mbIds.get(io);for(const r of a.extras?.modbus?.reads||[])add('binary_sensor',['  - platform: modbus_controller',`    modbus_controller_id: ${id}`,'    register_type: discrete_input',`    address: ${Math.max(0,Number(r.discreteInput||1)-1)}`,`    name: ${yamlQuote(`Modbus ${io.tag} DI${Number(r.discreteInput||1)}`)}`]);for(const r of a.extras?.modbus?.writes||[])add('switch',['  - platform: modbus_controller',`    modbus_controller_id: ${id}`,'    register_type: coil',`    address: ${Math.max(0,Number(r.coil||1)-1)}`,`    name: ${yamlQuote(`Modbus ${io.tag} DO${Number(r.coil||1)}`)}`]);}
      for(const meter of mbDevices.filter(d=>d.interface==='modbus-rtu-energy-meter')){const id=mbIds.get(meter);for(const r of meterRegisterDefinitions(meter)){const lines=['  - platform: modbus_controller',`    modbus_controller_id: ${id}`,`    register_type: ${r.registerType}`,`    address: ${r.address}`,`    value_type: ${r.valueType}`,`    name: ${yamlQuote(`${meter.tag} ${r.key}`)}`,`    unit_of_measurement: ${yamlQuote(r.unit)}`,`    accuracy_decimals: ${Math.max(0,Math.min(6,String(r.scale).split('.')[1]?.length||0))}`];if(r.scale!==1||r.offset!==0){lines.push('    filters:');if(r.scale!==1)lines.push(`      - multiply: ${r.scale}`);if(r.offset!==0)lines.push(`      - offset: ${r.offset}`);}add('sensor',lines);}}
    }

    const lora=findDevice(a,'lora-sx1278-spi');
    if(lora){
      const m=lora.cfg.spiTerminals||{},freq=Number(lora.dataset?.loraFrequencyHz||lora.cfg.frequencyHz||433000000)/1000000;
      L.push('','spi:',`  clk_pin: GPIO${pinFromDevice(lora,m.sck)}`,`  mosi_pin: GPIO${pinFromDevice(lora,m.mosi)}`,`  miso_pin: GPIO${pinFromDevice(lora,m.miso)}`,'','sx127x:',`  cs_pin: GPIO${pinFromDevice(lora,m.cs)}`,`  rst_pin: GPIO${pinFromDevice(lora,lora.cfg.resetTerminal)}`,`  dio0_pin: GPIO${pinFromDevice(lora,lora.cfg.dio0Terminal)}`,`  frequency: ${freq}MHz`,'  modulation: LORA','  bandwidth: 125_0kHz','  spreading_factor: 7','  coding_rate: CR_4_5','  crc_enable: true','  rx_start: true');
    }

    for(const key of ['output','servo','switch','binary_sensor','sensor','button']){if(sections[key].length)L.push('',`${key}:`,...sections[key]);}
    return{code:L.join('\n')+'\n',ext:'yaml',unsupported:[]};
  }
  function idfPinFilter(pin){return !TRANSPORT_MODE.test(String(pin?.mode||''));}
  function idfManifestWithDeps(src,deps={},idfRange='>=5.5,<6.0'){
    const text=String(src||'').trimEnd();
    if(!text)return ['# Perfil ESP-IDF gerado pelo TechRib','dependencies:',`  idf: "${idfRange}"`,...Object.entries(deps).map(([name,ver])=>`  ${name}: "${ver}"`)].join('\n')+'\n';
    const lines=text.split(/\r?\n/);let depAt=lines.findIndex(x=>/^dependencies:\s*$/.test(x));
    if(depAt<0){lines.push('dependencies:');depAt=lines.length-1;}
    let end=depAt+1;while(end<lines.length&&(lines[end].trim()===''||/^\s+/.test(lines[end])))end++;
    const block=lines.slice(depAt+1,end);
    const setDirect=(name,value)=>{const re=new RegExp(`^  ${String(name).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}:\\s*`);const i=block.findIndex(x=>re.test(x));const line=`  ${name}: "${value}"`;if(i>=0)block[i]=line;else block.push(line);};
    setDirect('idf',idfRange);for(const [name,ver] of Object.entries(deps))setDirect(name,ver);
    return [...lines.slice(0,depAt+1),...block,...lines.slice(end)].join('\n')+'\n';
  }
  function idfCmakeAdd(project,reqs=[]){
    let cm=project.files['main/CMakeLists.txt']||'';
    if(!cm.includes('"techrib_peripherals.c"')){
      if(cm.includes('"techrib_metadata.c"'))cm=cm.replace('"techrib_metadata.c"','"techrib_metadata.c" "techrib_peripherals.c"');
      else cm=cm.replace(/SRCS\s+([^\n]+)/,m=>m+' "techrib_peripherals.c"');
    }
    const unique=[...new Set(reqs.filter(Boolean))];
    cm=cm.replace(/PRIV_REQUIRES([^\n\)]*)/,(_,tail)=>{
      const existing=String(tail||'').trim().split(/\s+/).filter(Boolean);
      return 'PRIV_REQUIRES '+[...new Set([...existing,...unique])].join(' ');
    });
    project.files['main/CMakeLists.txt']=cm;
  }
  function idfHookAppMain(project){
    let app=project.files['main/app_main.c']||'';
    if(!app.includes('#include "techrib_peripherals.h"')){
      const includes=[...app.matchAll(/^#include[^\n]*$/gm)];
      if(includes.length){const m=includes[includes.length-1],at=m.index+m[0].length;app=app.slice(0,at)+'\n#include "techrib_peripherals.h"'+app.slice(at);}
      else app='#include "techrib_peripherals.h"\n'+app;
    }
    if(!app.includes('techrib_peripherals_init();')){
      const mcp='ESP_ERROR_CHECK(techrib_mcp23017_init());';
      if(app.includes(mcp))app=app.replace(mcp,mcp+'\n    ESP_ERROR_CHECK(techrib_peripherals_init());');
      else app=app.replace('techrib_control_init();','techrib_control_init();\n    ESP_ERROR_CHECK(techrib_peripherals_init());');
    }
    if(!app.includes('techrib_peripherals_step();')){
      const mcp='techrib_mcp23017_step();';
      if(app.includes(mcp))app=app.replace(mcp,mcp+'\n        techrib_peripherals_step();');
      else app=app.replace('techrib_control_step();','techrib_control_step();\n        techrib_peripherals_step();');
    }
    project.files['main/app_main.c']=app;
  }
  function idfPeripheralFiles(a){
    const hasI2C=a.interfaces.some(x=>/^i2c-/.test(x));
    const pcfs=byTypeAll(a,'PCF8574'),pcf=pcfs[0],pca=byType(a,'PCA9685'),ads=findDevice(a,'i2c-adc'),rtc=byType(a,'DS3231');
    const sr595=findDevice(a,'serial-shift-register'),sr165=findDevice(a,'parallel-input-shift-register');
    const w=findDevice(a,'ethernet-w5500'),lan=findDevice(a,'ethernet-lan8720-rmii'),can=findDevice(a,'can-twai-transceiver');
    const rs=findDevice(a,'rs485-transceiver'),mbDevices=(a.devices||[]).filter(d=>/^modbus-rtu-/.test(d.interface)),mb=mbDevices[0]||null,lora=findDevice(a,'lora-sx1278-spi');
    const reqs=['esp_driver_gpio','freertos'];
    const deps={};
    const H=['#pragma once','#include <stddef.h>','#include <stdint.h>','#include <stdbool.h>','#include "esp_err.h"','','esp_err_t techrib_peripherals_init(void);','void techrib_peripherals_step(void);'];
    const C=[`/* Gerado automaticamente pelo Simulador TechRib - ${GENERATOR_ID} */`,'#include "techrib_peripherals.h"','#include "freertos/FreeRTOS.h"','#include "freertos/task.h"','#include "driver/gpio.h"','#include "esp_log.h"','#include <string.h>','','static const char *TAG="TechRibPeriph";'];
    const init=[],step=[];

    if(hasI2C){
      reqs.push('esp_driver_i2c');
      const b=busFrom(a);
      C.push('#include "driver/i2c_master.h"','',`#define TR_I2C_SDA ${b.sda}`,`#define TR_I2C_SCL ${b.scl}`,`#define TR_I2C_FREQ ${Math.max(10000,Number(b.frequency)||100000)}`,'static i2c_master_bus_handle_t s_i2c_bus;','static esp_err_t tr_i2c_bus_init(void){','  esp_err_t e=i2c_master_get_bus_handle(I2C_NUM_0,&s_i2c_bus);','  if(e==ESP_OK)return ESP_OK;','  i2c_master_bus_config_t cfg={.i2c_port=I2C_NUM_0,.sda_io_num=TR_I2C_SDA,.scl_io_num=TR_I2C_SCL,.clk_source=I2C_CLK_SRC_DEFAULT,.glitch_ignore_cnt=7,.flags.enable_internal_pullup=true};','  return i2c_new_master_bus(&cfg,&s_i2c_bus);','}','static esp_err_t tr_i2c_add(uint8_t address,uint32_t hz,i2c_master_dev_handle_t *out){','  i2c_device_config_t d={.dev_addr_length=I2C_ADDR_BIT_LEN_7,.device_address=address,.scl_speed_hz=hz};','  return i2c_master_bus_add_device(s_i2c_bus,&d,out);','}','static esp_err_t tr_i2c_reg_write(i2c_master_dev_handle_t dev,uint8_t reg,const uint8_t *data,size_t n){','  uint8_t buf[10]; if(n>sizeof(buf)-1)return ESP_ERR_INVALID_SIZE;buf[0]=reg;if(n)memcpy(buf+1,data,n);return i2c_master_transmit(dev,buf,n+1,100);','}','static esp_err_t tr_i2c_reg_read(i2c_master_dev_handle_t dev,uint8_t reg,uint8_t *data,size_t n){return i2c_master_transmit_receive(dev,&reg,1,data,n,100);}','');
      init.push('ESP_ERROR_CHECK(tr_i2c_bus_init());');
    }
    if(pcfs.length){
      const names=pcfs.map((d,i)=>({d,i,addr:i2cAddressFor(d,a),handle:i===0?'s_pcf':`s_pcf_${i+1}`,shadow:i===0?'s_pcf_shadow':`s_pcf_shadow_${i+1}`,write:i===0?'techrib_pcf8574_write':`techrib_pcf8574_write_${i+1}`,read:i===0?'techrib_pcf8574_read':`techrib_pcf8574_read_${i+1}`}));
      for(const n of names){const pm=n.d.programDevice?.pinModes||{};let shadow=255;for(let i=0;i<8;i++)shadow|=(1<<i);C.push(`static i2c_master_dev_handle_t ${n.handle};`,`static uint8_t ${n.shadow}=${shadow};`,`esp_err_t ${n.write}(uint8_t value){${n.shadow}=value;return i2c_master_transmit(${n.handle},&value,1,100);}`,`esp_err_t ${n.read}(uint8_t *value){if(!value)return ESP_ERR_INVALID_ARG;return i2c_master_receive(${n.handle},value,1,100);}`,'');H.push(`esp_err_t ${n.write}(uint8_t value);`,`esp_err_t ${n.read}(uint8_t *value);`);init.push(`ESP_ERROR_CHECK(tr_i2c_add(${hex(n.addr)},100000,&${n.handle}));`,`ESP_ERROR_CHECK(${n.write}(${n.shadow}));`);}
      let ri=0;
      for(const r of a.program?.rules||[]){if(r.type!=='toggle'||!r.trigger?.pin||!r.output?.pin)continue;const ti=Math.max(0,pcfs.findIndex(d=>deviceRefMatches(d,r.trigger?.device))),oi=Math.max(0,pcfs.findIndex(d=>deviceRefMatches(d,r.output?.device))),tn=names[ti]||names[0],on=names[oi]||names[0],ib=Number(String(r.trigger.pin).replace(/\D/g,'')),ob=Number(String(r.output.pin).replace(/\D/g,''));if(!Number.isInteger(ib)||!Number.isInteger(ob))continue;const mem=ident(r.memory||`m_${ib}_${ob}`),initial=!!a.program?.memory?.[r.memory],trigHigh=String(r.trigger.active||'LOW').toUpperCase()==='HIGH',activeHigh=String(r.output.active||'LOW').toUpperCase()==='HIGH',inactiveHigh=String(r.output.inactive||'HIGH').toUpperCase()==='HIGH';C.push(`static bool tr_pcf_mem_${mem}=${initial?'true':'false'};`,`static bool tr_pcf_prev_${mem}=false;`,`static bool tr_pcf_ready_${mem}=false;`);step.push(`{uint8_t v=0;if(${tn.read}(&v)==ESP_OK){bool now=(((v>>${ib})&1u)==${trigHigh?'1u':'0u'});if(!tr_pcf_ready_${mem}){tr_pcf_prev_${mem}=now;tr_pcf_ready_${mem}=true;}else if(now&&!tr_pcf_prev_${mem}){tr_pcf_mem_${mem}=!tr_pcf_mem_${mem};bool high=tr_pcf_mem_${mem}?${activeHigh?'true':'false'}:${inactiveHigh?'true':'false'};if(high)${on.shadow}|=(1u<<${ob});else ${on.shadow}&=(uint8_t)~(1u<<${ob});(void)${on.write}(${on.shadow});}tr_pcf_prev_${mem}=now;}}`);ri++;}
      const legacy=a.extras?.i2cGpio;if(legacy&&names[0]){const n=names[0];for(const r of legacy.writes||[]){const gp=gpioNumber(r.sourcePin),ob=Number(String(r.pin||'').replace(/\D/g,''));if(gp===null||!Number.isInteger(ob))continue;init.push(`gpio_set_direction((gpio_num_t)${gp},GPIO_MODE_INPUT);`);step.push(`{bool on=gpio_get_level((gpio_num_t)${gp})${r.invert?'!=0':'==0'};if(on)${n.shadow}&=(uint8_t)~(1u<<${ob});else ${n.shadow}|=(1u<<${ob});(void)${n.write}(${n.shadow});}`);}for(const r of legacy.reads||[]){const ib=Number(String(r.pin||'').replace(/\D/g,''));if(!Number.isInteger(ib))continue;step.push(`{static TickType_t t=0;if(xTaskGetTickCount()-t>=pdMS_TO_TICKS(250)){t=xTaskGetTickCount();uint8_t v=0;if(${n.read}(&v)==ESP_OK)ESP_LOGI(TAG,"PCF8574 P${ib}=%u",(unsigned)((v>>${ib})&1u));}}`);}}
    }
    if(pca){
      const addr=Number(pca.programDevice?.address??pca.cfg.defaultAddress??64),freq=Math.max(24,Math.min(1526,Number(pca.programDevice?.frequencyHz??pca.cfg.defaultFrequencyHz??50)));
      C.push('static i2c_master_dev_handle_t s_pca;','static uint8_t tr_pca_read8(uint8_t r){uint8_t v=0;tr_i2c_reg_read(s_pca,r,&v,1);return v;}','static esp_err_t tr_pca_write8(uint8_t r,uint8_t v){return tr_i2c_reg_write(s_pca,r,&v,1);}','esp_err_t techrib_pca9685_set(uint8_t ch,uint16_t off){if(ch>15)return ESP_ERR_INVALID_ARG;off&=0x0fff;uint8_t b[4]={0,0,(uint8_t)(off&0xff),(uint8_t)(off>>8)};return tr_i2c_reg_write(s_pca,(uint8_t)(0x06+4*ch),b,4);}','');
      H.push('esp_err_t techrib_pca9685_set(uint8_t channel,uint16_t off_ticks);');
      init.push(`ESP_ERROR_CHECK(tr_i2c_add(${hex(addr)},400000,&s_pca));`,`{uint8_t old=tr_pca_read8(0x00);uint8_t pre=(uint8_t)((25000000.0f/(4096.0f*${freq}.0f))-1.0f+0.5f);ESP_ERROR_CHECK(tr_pca_write8(0x00,(old&0x7f)|0x10));ESP_ERROR_CHECK(tr_pca_write8(0xfe,pre));ESP_ERROR_CHECK(tr_pca_write8(0x00,old));vTaskDelay(pdMS_TO_TICKS(5));ESP_ERROR_CHECK(tr_pca_write8(0x00,old|0xa1));}`);
      const pwm=a.program?.pwmRules||[];
      if(pwm.length)C.push('static uint16_t tr_servo_ticks(int deg){if(deg<0)deg=0;if(deg>180)deg=180;uint32_t us=500u+((uint32_t)deg*2000u)/180u;return (uint16_t)((us*4096u)/20000u);}');
      for(const r of pwm){const gp=gpioNumber(r.sourcePin);if(gp===null)continue;const ch=Math.max(0,Math.min(15,Number(r.channel)||0)),lo=Number(r.lowAngle??0),hi=Number(r.highAngle??90);init.push(`gpio_set_direction((gpio_num_t)${gp},GPIO_MODE_INPUT);`);step.push(`(void)techrib_pca9685_set(${ch},tr_servo_ticks(gpio_get_level((gpio_num_t)${gp})?${hi}:${lo}));`);}
    }
    if(ads){
      const addr=Number(a.extras?.i2cAdc?.address??ads.cfg.defaultAddress??72);
      C.push('static i2c_master_dev_handle_t s_ads;','esp_err_t techrib_ads1115_read(uint8_t ch,int16_t *raw){if(!raw||ch>3)return ESP_ERR_INVALID_ARG;uint16_t mux=(uint16_t)(4+ch)<<12;uint16_t cfg=0x8000|mux|0x0200|0x0100|0x0080|0x0003;uint8_t b[2]={(uint8_t)(cfg>>8),(uint8_t)cfg};esp_err_t e=tr_i2c_reg_write(s_ads,0x01,b,2);if(e!=ESP_OK)return e;vTaskDelay(pdMS_TO_TICKS(10));uint8_t r[2];e=tr_i2c_reg_read(s_ads,0x00,r,2);if(e==ESP_OK)*raw=(int16_t)(((uint16_t)r[0]<<8)|r[1]);return e;}','');
      H.push('esp_err_t techrib_ads1115_read(uint8_t channel,int16_t *raw);');
      init.push(`ESP_ERROR_CHECK(tr_i2c_add(${hex(addr)},400000,&s_ads));`);
      const reads=a.extras?.i2cAdc?.reads||[];if(reads.length)step.push(`{static TickType_t t=0;if(xTaskGetTickCount()-t>=pdMS_TO_TICKS(500)){t=xTaskGetTickCount();int16_t raw=0;if(techrib_ads1115_read(${Math.max(0,Math.min(3,Number(reads[0].channel)||0))},&raw)==ESP_OK)ESP_LOGI(TAG,"ADS1115 raw=%d",(int)raw);}}`);
    }
    if(rtc){
      const addr=Number(rtc.programDevice?.address??rtc.cfg.defaultAddress??104);
      C.push('static i2c_master_dev_handle_t s_rtc;','static uint8_t tr_bcd(uint8_t v){return (uint8_t)((v>>4)*10+(v&0x0f));}','esp_err_t techrib_ds3231_read(uint8_t *hh,uint8_t *mm,uint8_t *ss){if(!hh||!mm||!ss)return ESP_ERR_INVALID_ARG;uint8_t r[3];esp_err_t e=tr_i2c_reg_read(s_rtc,0x00,r,3);if(e==ESP_OK){*ss=tr_bcd(r[0]&0x7f);*mm=tr_bcd(r[1]&0x7f);*hh=tr_bcd(r[2]&0x3f);}return e;}','');
      H.push('esp_err_t techrib_ds3231_read(uint8_t *hour,uint8_t *minute,uint8_t *second);');
      init.push(`ESP_ERROR_CHECK(tr_i2c_add(${hex(addr)},100000,&s_rtc));`);
      step.push('{static TickType_t t=0;if(xTaskGetTickCount()-t>=pdMS_TO_TICKS(1000)){t=xTaskGetTickCount();uint8_t h,m,s;if(techrib_ds3231_read(&h,&m,&s)==ESP_OK)ESP_LOGI(TAG,"DS3231 %02u:%02u:%02u",h,m,s);}}');
    }
    if(sr595){
      const pr=(a.program?.shiftRegisters||[]).find(x=>String(x.type).toUpperCase()==='74HC595')||{},data=gpioNumber(pr.data)??pinFromDevice(sr595,sr595.cfg.pins?.data),clk=gpioNumber(pr.clock)??pinFromDevice(sr595,sr595.cfg.pins?.clock),latch=gpioNumber(pr.latch)??pinFromDevice(sr595,sr595.cfg.pins?.latch);
      C.push(`#define TR_595_DATA ${data}`,`#define TR_595_CLK ${clk}`,`#define TR_595_LATCH ${latch}`,'static uint8_t s_595_state=0;','esp_err_t techrib_74hc595_write(uint8_t v){s_595_state=v;gpio_set_level(TR_595_LATCH,0);for(int i=7;i>=0;i--){gpio_set_level(TR_595_CLK,0);gpio_set_level(TR_595_DATA,(v>>i)&1);gpio_set_level(TR_595_CLK,1);}gpio_set_level(TR_595_LATCH,1);return ESP_OK;}','');
      H.push('esp_err_t techrib_74hc595_write(uint8_t value);');
      init.push('gpio_set_direction(TR_595_DATA,GPIO_MODE_OUTPUT);gpio_set_direction(TR_595_CLK,GPIO_MODE_OUTPUT);gpio_set_direction(TR_595_LATCH,GPIO_MODE_OUTPUT);ESP_ERROR_CHECK(techrib_74hc595_write(0));');
      let sri=0;for(const r of a.program?.serialRules||[]){const gp=gpioNumber(r.trigger?.pin);if(gp===null)continue;const high=String(r.trigger?.active||'HIGH').toUpperCase()==='HIGH';init.push(`gpio_set_direction((gpio_num_t)${gp},GPIO_MODE_INPUT);`);if(String(r.type||'').toLowerCase()==='write-byte'){const value=Math.max(0,Math.min(255,Number(r.value)||0));C.push(`static bool tr_595_prev_${sri}=false;`);step.push(`{bool now=gpio_get_level((gpio_num_t)${gp})==${high?'1':'0'};if(now&&!tr_595_prev_${sri})(void)techrib_74hc595_write(${value});tr_595_prev_${sri}=now;}`);}else if(String(r.type||'').toLowerCase()==='map-bit'){const bit=Math.max(0,Math.min(7,Number(r.bit)||0));step.push(`{bool on=gpio_get_level((gpio_num_t)${gp})==${high?'1':'0'};if(on)s_595_state|=(1u<<${bit});else s_595_state&=(uint8_t)~(1u<<${bit});(void)techrib_74hc595_write(s_595_state);}`);}sri++;}
    }
    if(sr165){
      const pr=(a.program?.parallelShiftRegisters||[]).find(x=>String(x.type).toUpperCase()==='74HC165')||{},load=gpioNumber(pr.load)??pinFromDevice(sr165,sr165.cfg.pins?.load),clk=gpioNumber(pr.clock)??pinFromDevice(sr165,sr165.cfg.pins?.clock),data=gpioNumber(pr.data)??pinFromDevice(sr165,sr165.cfg.pins?.data);
      C.push(`#define TR_165_LOAD ${load}`,`#define TR_165_CLK ${clk}`,`#define TR_165_DATA ${data}`,'uint8_t techrib_74hc165_read(void){uint8_t v=0;gpio_set_level(TR_165_LOAD,0);esp_rom_delay_us(5);gpio_set_level(TR_165_LOAD,1);for(int i=7;i>=0;i--){v|=(gpio_get_level(TR_165_DATA)?1u:0u)<<i;gpio_set_level(TR_165_CLK,1);esp_rom_delay_us(2);gpio_set_level(TR_165_CLK,0);}return v;}','');
      H.push('uint8_t techrib_74hc165_read(void);');
      C.splice(4,0,'#include "esp_rom_sys.h"');
      init.push('gpio_set_direction(TR_165_LOAD,GPIO_MODE_OUTPUT);gpio_set_direction(TR_165_CLK,GPIO_MODE_OUTPUT);gpio_set_direction(TR_165_DATA,GPIO_MODE_INPUT);gpio_set_level(TR_165_LOAD,1);gpio_set_level(TR_165_CLK,0);');
      if(sr595){
        const rr=(a.program?.rules||[]).filter(r=>r.type==='toggle'&&r.trigger?.device&&r.output?.device);
        if(rr.length){C.push('static uint8_t s_165_prev=0;','static bool s_165_ready=false;');let qi=0;for(const r of rr){const ib=Math.max(0,Math.min(7,String(r.trigger.pin||'A').toUpperCase().charCodeAt(0)-65)),ob=Math.max(0,Math.min(7,Number(String(r.output.pin||'Q0').replace(/\D/g,''))||0)),mem=ident(r.memory||`m${qi}`),initial=!!a.program?.memory?.[r.memory];C.push(`static bool tr_shift_mem_${mem}=${initial?'true':'false'};`);step.push(`{uint8_t v=techrib_74hc165_read();bool now=((v>>${ib})&1u)!=0,prev=((s_165_prev>>${ib})&1u)!=0;if(s_165_ready&&now&&!prev){tr_shift_mem_${mem}=!tr_shift_mem_${mem};if(tr_shift_mem_${mem})s_595_state|=(1u<<${ob});else s_595_state&=(uint8_t)~(1u<<${ob});(void)techrib_74hc595_write(s_595_state);}s_165_prev=(uint8_t)((s_165_prev&~(1u<<${ib}))|(now?(1u<<${ib}):0));s_165_ready=true;}`);qi++;}}
      }else step.push('{static TickType_t t=0;if(xTaskGetTickCount()-t>=pdMS_TO_TICKS(100)){t=xTaskGetTickCount();ESP_LOGI(TAG,"74HC165=0x%02X",techrib_74hc165_read());}}');
    }
    if(can){
      reqs.push('esp_driver_twai');const tx=pinFromDevice(can,can.cfg.txTerminal),rx=pinFromDevice(can,can.cfg.rxTerminal),bitrate=Number(can.dataset?.canBitrate||500000);
      C.push('#include "esp_twai.h"','#include "esp_twai_onchip.h"','static twai_node_handle_t s_twai;','static bool tr_twai_rx(twai_node_handle_t h,const twai_rx_done_event_data_t *e,void *ctx){(void)e;(void)ctx;uint8_t b[8]={0};twai_frame_t f={.buffer=b,.buffer_len=sizeof(b)};if(twai_node_receive_from_isr(h,&f)==ESP_OK){/* o callback mantém o driver drenado; lógica da aplicação pode ser adicionada sobre este ponto */}return false;}','esp_err_t techrib_can_send(uint32_t id,const uint8_t *data,size_t len){if(!data||len>8)return ESP_ERR_INVALID_ARG;twai_frame_t f={.header.id=id,.buffer=(uint8_t*)data,.buffer_len=len};esp_err_t e=twai_node_transmit(s_twai,&f,100);if(e!=ESP_OK)return e;return twai_node_transmit_wait_all_done(s_twai,100);}','');
      H.push('esp_err_t techrib_can_send(uint32_t id,const uint8_t *data,size_t len);');
      init.push(`{twai_onchip_node_config_t cfg={.io_cfg.tx=${tx},.io_cfg.rx=${rx},.bit_timing.bitrate=${bitrate},.fail_retry_cnt=-1,.tx_queue_depth=8};ESP_ERROR_CHECK(twai_new_node_onchip(&cfg,&s_twai));twai_event_callbacks_t cb={.on_rx_done=tr_twai_rx};ESP_ERROR_CHECK(twai_node_register_event_callbacks(s_twai,&cb,NULL));ESP_ERROR_CHECK(twai_node_enable(s_twai));}`);
    }
    if(rs&&mbDevices.length){
      reqs.push('esp_driver_uart');const tx=pinFromDevice(rs,rs.cfg.uartTxTerminal),rx=pinFromDevice(rs,rs.cfg.uartRxTerminal),de=pinFromDevice(rs,rs.cfg.driverEnableTerminal),re=pinFromDevice(rs,rs.cfg.receiverEnableTerminal)??-1,baud=Number(mb.cfg.baud||mb.behavior?.bus?.baud||9600),units=mbDevices.map(d=>modbusUnitFor(d,a));
      C.push('#include "driver/uart.h"',`#define TR_MB_UNIT ${units[0]}`,...units.slice(1).map((u,i)=>`#define TR_MB_UNIT_${i+2} ${u}`),`#define TR_RS485_DE ${de}`,`#define TR_RS485_RE ${re}`,'static uint16_t tr_crc16(const uint8_t *p,size_t n){uint16_t c=0xffff;while(n--){c^=*p++;for(int i=0;i<8;i++)c=(c&1)?(uint16_t)((c>>1)^0xa001):(uint16_t)(c>>1);}return c;}','static void tr_rs485_tx(bool on){if(TR_RS485_DE>=0)gpio_set_level((gpio_num_t)TR_RS485_DE,on?1:0);if(TR_RS485_RE>=0)gpio_set_level((gpio_num_t)TR_RS485_RE,on?1:0);}','esp_err_t techrib_modbus_request_unit(uint8_t unit,uint8_t fn,uint16_t addr,uint16_t value,uint8_t *response,size_t *response_len){if(!response||!response_len)return ESP_ERR_INVALID_ARG;uint8_t q[8]={unit,fn,(uint8_t)(addr>>8),(uint8_t)addr,(uint8_t)(value>>8),(uint8_t)value,0,0};uint16_t c=tr_crc16(q,6);q[6]=(uint8_t)c;q[7]=(uint8_t)(c>>8);uart_flush_input(UART_NUM_2);tr_rs485_tx(true);int n=uart_write_bytes(UART_NUM_2,(const char*)q,sizeof(q));uart_wait_tx_done(UART_NUM_2,pdMS_TO_TICKS(100));tr_rs485_tx(false);if(n!=(int)sizeof(q))return ESP_FAIL;int r=uart_read_bytes(UART_NUM_2,response,64,pdMS_TO_TICKS(120));if(r<5)return ESP_ERR_TIMEOUT;uint16_t got=(uint16_t)response[r-2]|((uint16_t)response[r-1]<<8);if(got!=tr_crc16(response,(size_t)r-2)||response[0]!=unit)return ESP_FAIL;*response_len=(size_t)r;return ESP_OK;}','esp_err_t techrib_modbus_request(uint8_t fn,uint16_t addr,uint16_t value,uint8_t *response,size_t *response_len){return techrib_modbus_request_unit(TR_MB_UNIT,fn,addr,value,response,response_len);}','');
      H.push('esp_err_t techrib_modbus_request_unit(uint8_t unit,uint8_t function,uint16_t address,uint16_t value,uint8_t *response,size_t *response_len);','esp_err_t techrib_modbus_request(uint8_t function,uint16_t address,uint16_t value,uint8_t *response,size_t *response_len);');
      init.push(`{uart_config_t u={.baud_rate=${baud},.data_bits=UART_DATA_8_BITS,.parity=UART_PARITY_DISABLE,.stop_bits=UART_STOP_BITS_1,.flow_ctrl=UART_HW_FLOWCTRL_DISABLE,.source_clk=UART_SCLK_DEFAULT};ESP_ERROR_CHECK(uart_driver_install(UART_NUM_2,256,256,0,NULL,0));ESP_ERROR_CHECK(uart_param_config(UART_NUM_2,&u));ESP_ERROR_CHECK(uart_set_pin(UART_NUM_2,${tx},${rx},UART_PIN_NO_CHANGE,UART_PIN_NO_CHANGE));if(TR_RS485_DE>=0)gpio_set_direction((gpio_num_t)TR_RS485_DE,GPIO_MODE_OUTPUT);if(TR_RS485_RE>=0)gpio_set_direction((gpio_num_t)TR_RS485_RE,GPIO_MODE_OUTPUT);tr_rs485_tx(false);}`);
      const io=targetModbusDevice(a,'io'),ioUnit=io?modbusUnitFor(io,a):null;
      for(const r of a.extras?.modbus?.writes||[]){const gp=gpioNumber(r.sourcePin);if(gp===null||ioUnit===null)continue;const active=String(r.active||'HIGH').toUpperCase()==='HIGH',addr=Math.max(0,Number(r.coil||1)-1);init.push(`gpio_set_direction((gpio_num_t)${gp},GPIO_MODE_INPUT);`);const call=ioUnit===units[0]?'techrib_modbus_request':'techrib_modbus_request_unit';const args=ioUnit===units[0]?`0x05,${addr},on?0xFF00:0x0000,resp,&n`:`${ioUnit},0x05,${addr},on?0xFF00:0x0000,resp,&n`;step.push(`{static int last=-1;int on=gpio_get_level((gpio_num_t)${gp})==${active?'1':'0'};if(on!=last){uint8_t resp[64];size_t n=0;(void)${call}(${args});last=on;}}`);}
      for(const r of a.extras?.modbus?.reads||[]){if(ioUnit===null)continue;const addr=Math.max(0,Number(r.discreteInput||1)-1),di=Number(r.discreteInput||1),call=ioUnit===units[0]?'techrib_modbus_request':'techrib_modbus_request_unit',args=ioUnit===units[0]?`0x02,${addr},1,resp,&n`:`${ioUnit},0x02,${addr},1,resp,&n`;step.push(`{static TickType_t t=0;if(xTaskGetTickCount()-t>=pdMS_TO_TICKS(250)){t=xTaskGetTickCount();uint8_t resp[64];size_t n=0;if(${call}(${args})==ESP_OK&&n>=6)ESP_LOGI(TAG,"Modbus DI${di}=%u",(unsigned)(resp[3]&1u));}}`);}
      for(const meter of mbDevices.filter(d=>d.interface==='modbus-rtu-energy-meter')){const unit=modbusUnitFor(meter,a),defs=meterRegisterDefinitions(meter),wanted=new Set((a.extras?.modbusEnergy?.unitId==null||Number(a.extras.modbusEnergy.unitId)===unit?(a.extras?.modbusEnergy?.reads||defs.map(r=>r.address)):[]).map(Number));for(const r of defs){if(!wanted.has(r.address))continue;const call=unit===units[0]?'techrib_modbus_request':'techrib_modbus_request_unit',args=unit===units[0]?`0x03,${r.address},1,resp,&n`:`${unit},0x03,${r.address},1,resp,&n`;step.push(`{static TickType_t t=0;if(xTaskGetTickCount()-t>=pdMS_TO_TICKS(500)){t=xTaskGetTickCount();uint8_t resp[64];size_t n=0;if(${call}(${args})==ESP_OK&&n>=7){uint16_t raw=(uint16_t)(((uint16_t)resp[3]<<8)|resp[4]);float value=((float)raw)*${cFloat(r.scale)}+${cFloat(r.offset)};ESP_LOGI(TAG,"Modbus ${mbDevices.filter(x=>x.interface==='modbus-rtu-energy-meter').length>1?meter.tag+' ':''}${r.key}=%.6g ${r.unit}",(double)value);}}}`);}}
    }
    if(lora){
      reqs.push('esp_driver_spi');const m=lora.cfg.spiTerminals||{},sck=pinFromDevice(lora,m.sck),mosi=pinFromDevice(lora,m.mosi),miso=pinFromDevice(lora,m.miso),cs=pinFromDevice(lora,m.cs),rst=pinFromDevice(lora,lora.cfg.resetTerminal),dio0=pinFromDevice(lora,lora.cfg.dio0Terminal),freq=Number(lora.dataset?.loraFrequencyHz||lora.cfg.frequencyHz||433000000);
      C.push('#include "driver/spi_master.h"',`#define TR_LORA_RST ${rst}`,`#define TR_LORA_DIO0 ${dio0}`,'static spi_device_handle_t s_lora;','static esp_err_t tr_lora_reg(uint8_t reg,uint8_t val){spi_transaction_t t={.length=16,.flags=SPI_TRANS_USE_TXDATA};t.tx_data[0]=reg|0x80;t.tx_data[1]=val;return spi_device_polling_transmit(s_lora,&t);}','esp_err_t techrib_lora_send(const uint8_t *data,size_t len){if(!data||!len||len>255)return ESP_ERR_INVALID_ARG;ESP_ERROR_CHECK(tr_lora_reg(0x01,0x81));ESP_ERROR_CHECK(tr_lora_reg(0x0d,0));ESP_ERROR_CHECK(tr_lora_reg(0x22,(uint8_t)len));for(size_t i=0;i<len;i++)ESP_ERROR_CHECK(tr_lora_reg(0x00,data[i]));ESP_ERROR_CHECK(tr_lora_reg(0x01,0x83));return ESP_OK;}','');
      H.push('esp_err_t techrib_lora_send(const uint8_t *data,size_t len);');
      const frf=Math.round(freq/61.03515625);
      init.push(`{spi_bus_config_t b={.mosi_io_num=${mosi},.miso_io_num=${miso},.sclk_io_num=${sck},.quadwp_io_num=-1,.quadhd_io_num=-1};ESP_ERROR_CHECK(spi_bus_initialize(SPI3_HOST,&b,SPI_DMA_CH_AUTO));spi_device_interface_config_t d={.clock_speed_hz=8000000,.mode=0,.spics_io_num=${cs},.queue_size=4};ESP_ERROR_CHECK(spi_bus_add_device(SPI3_HOST,&d,&s_lora));gpio_set_direction(TR_LORA_RST,GPIO_MODE_OUTPUT);gpio_set_level(TR_LORA_RST,0);vTaskDelay(pdMS_TO_TICKS(2));gpio_set_level(TR_LORA_RST,1);vTaskDelay(pdMS_TO_TICKS(10));ESP_ERROR_CHECK(tr_lora_reg(0x01,0x80));ESP_ERROR_CHECK(tr_lora_reg(0x06,${(frf>>16)&255}));ESP_ERROR_CHECK(tr_lora_reg(0x07,${(frf>>8)&255}));ESP_ERROR_CHECK(tr_lora_reg(0x08,${frf&255}));ESP_ERROR_CHECK(tr_lora_reg(0x01,0x85));}`);
    }
    if(w){
      reqs.push('esp_driver_spi','esp_eth','esp_netif','esp_event');deps['espressif/w5500']='^1.0.1';const m=w.cfg.spiTerminals||{},sck=pinFromDevice(w,m.sclk),mosi=pinFromDevice(w,m.mosi),miso=pinFromDevice(w,m.miso),cs=pinFromDevice(w,m.cs),irq=pinFromDevice(w,w.cfg.interruptTerminal),rst=pinFromDevice(w,w.cfg.resetTerminal);
      C.push('#include "driver/spi_master.h"','#include "esp_eth.h"','#include "esp_eth_netif_glue.h"','#include "esp_netif.h"','#include "esp_event.h"','#include "esp_eth_mac_w5500.h"','#include "esp_eth_phy_w5500.h"','static esp_eth_handle_t s_w5500;','static esp_err_t tr_netif_once(void){static bool done=false;if(done)return ESP_OK;esp_err_t e=esp_netif_init();if(e!=ESP_OK&&e!=ESP_ERR_INVALID_STATE)return e;e=esp_event_loop_create_default();if(e!=ESP_OK&&e!=ESP_ERR_INVALID_STATE)return e;done=true;return ESP_OK;}','static esp_err_t tr_w5500_init(void){ESP_ERROR_CHECK(tr_netif_once());spi_bus_config_t b={.mosi_io_num='+mosi+',.miso_io_num='+miso+',.sclk_io_num='+sck+',.quadwp_io_num=-1,.quadhd_io_num=-1};esp_err_t e=spi_bus_initialize(SPI2_HOST,&b,SPI_DMA_CH_AUTO);if(e!=ESP_OK&&e!=ESP_ERR_INVALID_STATE)return e;spi_device_interface_config_t d={.mode=0,.clock_speed_hz=12000000,.spics_io_num='+cs+',.queue_size=16};eth_w5500_config_t wc=ETH_W5500_DEFAULT_CONFIG(SPI2_HOST,&d);wc.int_gpio_num='+irq+';eth_mac_config_t mc=ETH_MAC_DEFAULT_CONFIG();eth_phy_config_t pc=ETH_PHY_DEFAULT_CONFIG();pc.reset_gpio_num='+rst+';esp_eth_mac_t *mac=esp_eth_mac_new_w5500(&wc,&mc);esp_eth_phy_t *phy=esp_eth_phy_new_w5500(&pc);if(!mac||!phy)return ESP_ERR_NO_MEM;esp_eth_config_t ec=ETH_DEFAULT_CONFIG(mac,phy);ESP_ERROR_CHECK(esp_eth_driver_install(&ec,&s_w5500));esp_netif_config_t nc=ESP_NETIF_DEFAULT_ETH();esp_netif_t *netif=esp_netif_new(&nc);if(!netif)return ESP_ERR_NO_MEM;ESP_ERROR_CHECK(esp_netif_attach(netif,esp_eth_new_netif_glue(s_w5500)));return esp_eth_start(s_w5500);}','');
      init.push('ESP_ERROR_CHECK(tr_w5500_init());');
    }
    if(lan){
      reqs.push('esp_eth','esp_netif','esp_event');deps['espressif/lan87xx']='^1.0.0';const mg=lan.cfg.managementTerminals||{},rm=lan.cfg.rmiiTerminals||{},mdc=pinFromDevice(lan,mg.mdc),mdio=pinFromDevice(lan,mg.mdio),clk=pinFromDevice(lan,rm.refClk),rst=pinFromDevice(lan,lan.cfg.resetTerminal),phy=Number(lan.dataset?.phyAddress||0);
      if(!w)C.push('#include "esp_eth.h"','#include "esp_eth_netif_glue.h"','#include "esp_netif.h"','#include "esp_event.h"','static esp_err_t tr_netif_once(void){static bool done=false;if(done)return ESP_OK;esp_err_t e=esp_netif_init();if(e!=ESP_OK&&e!=ESP_ERR_INVALID_STATE)return e;e=esp_event_loop_create_default();if(e!=ESP_OK&&e!=ESP_ERR_INVALID_STATE)return e;done=true;return ESP_OK;}');
      C.push('#include "esp_eth_mac_esp.h"','#include "esp_eth_phy_lan87xx.h"','static esp_eth_handle_t s_lan8720;','static esp_err_t tr_lan8720_init(void){ESP_ERROR_CHECK(tr_netif_once());eth_mac_config_t mc=ETH_MAC_DEFAULT_CONFIG();eth_esp32_emac_config_t em=ETH_ESP32_EMAC_DEFAULT_CONFIG();em.smi_gpio.mdc_num='+mdc+';em.smi_gpio.mdio_num='+mdio+';em.interface=EMAC_DATA_INTERFACE_RMII;em.clock_config.rmii.clock_mode=EMAC_CLK_EXT_IN;em.clock_config.rmii.clock_gpio='+clk+';esp_eth_mac_t *mac=esp_eth_mac_new_esp32(&em,&mc);eth_phy_config_t pc=ETH_PHY_DEFAULT_CONFIG();pc.phy_addr='+phy+';pc.reset_gpio_num='+rst+';esp_eth_phy_t *phy=esp_eth_phy_new_lan87xx(&pc);if(!mac||!phy)return ESP_ERR_NO_MEM;esp_eth_config_t ec=ETH_DEFAULT_CONFIG(mac,phy);ESP_ERROR_CHECK(esp_eth_driver_install(&ec,&s_lan8720));esp_netif_config_t nc=ESP_NETIF_DEFAULT_ETH();esp_netif_t *netif=esp_netif_new(&nc);if(!netif)return ESP_ERR_NO_MEM;ESP_ERROR_CHECK(esp_netif_attach(netif,esp_eth_new_netif_glue(s_lan8720)));return esp_eth_start(s_lan8720);}','');
      init.push('ESP_ERROR_CHECK(tr_lan8720_init());');
    }

    C.push('esp_err_t techrib_peripherals_init(void){',...init.map(x=>'  '+x),'  ESP_LOGI(TAG,"Perifericos TechRib inicializados");','  return ESP_OK;','}','void techrib_peripherals_step(void){',...(step.length?step.map(x=>'  '+x):['  /* Sem tarefa periódica obrigatória para os periféricos desta topologia. */']),' }','');
    return{files:{'main/techrib_peripherals.h':H.join('\n')+'\n','main/techrib_peripherals.c':C.join('\n')+'\n'},reqs:[...new Set(reqs)],deps};
  }
  function augmentIdf(project,a){
    if(!project||!a?.hasAdvanced)return project;
    if(validateDevicePins(a).some(x=>x.level==='error'))return project;
    for(const iface of a.interfaces){const s=interfaceSupport(iface,'espidf',a.profile?.idfTarget||a.profile?.id||a.profile?.family||'');if(!s.ok)return project;}
    const built=idfPeripheralFiles(a);Object.assign(project.files,built.files);idfCmakeAdd(project,built.reqs);idfHookAppMain(project);
    if(Object.keys(built.deps).length||a.hasAdvanced)project.files['main/idf_component.yml']=idfManifestWithDeps(project.files['main/idf_component.yml'],built.deps,'>=5.5,<6.0');
    const manifest={version:VERSION,interfaces:a.interfaces,devices:a.devices.map(d=>({tag:d.tag,type:d.type,interface:d.interface,pins:d.pins,codegen:d.cfg})),program:a.program||null,extras:a.extras||{}};
    project.files['main/techrib_peripherals.json']=JSON.stringify(manifest,null,2)+'\n';
    project.files['README.md']=(project.files['README.md']||'')+'\n\n## Periféricos avançados TechRib\n\nEste projeto inclui `techrib_peripherals.c/.h`, gerado a partir da topologia para: '+a.interfaces.join(', ')+'. O perfil avançado é fixado em ESP-IDF 5.5.x para manter as APIs de driver validadas pelo TechRib.\n';
    project.files['TECHRIB-GENERATED.txt']=(project.files['TECHRIB-GENERATED.txt']||'')+`Peripherals: ${a.interfaces.join(', ')}\nPeripheral generator: ${VERSION}\nESP-IDF peripheral profile: >=5.5,<6.0\n`;
    project.tree=[project.projectName+'/',...Object.keys(project.files).sort().map(f=>'  '+f)].join('\n');project.preview=project.files['main/app_main.c'];project.peripherals=manifest;project.version=`${project.version||''}+${VERSION}`;return project;
  }
  function issuesFor(a,target){const out=[];for(const iface of a?.interfaces||[]){const s=interfaceSupport(iface,target,a.profile?.idfTarget||a.profile?.id||a.profile?.family||'');if(!s.ok)out.push({level:'error',text:s.reason});}return out;}
  function catalogCoverage(interfaces=[]){const unknown=[...new Set(interfaces)].filter(x=>!KNOWN_INTERFACES.has(x));return{ok:unknown.length===0,total:new Set(interfaces).size,unknown,known:[...KNOWN_INTERFACES]};}
  function fixture(input={}){const a={version:VERSION,controller:input.controller||{dataset:{tag:'CTRL'}},program:input.program||{},pins:input.pins||[],target:input.target||'',profile:input.profile||{family:'esp32'},devices:input.devices||[],extras:input.extras||{},i2cProfile:input.i2cProfile||null,interfaces:[...new Set((input.devices||[]).map(d=>d.interface))],issues:[]};a.hasAdvanced=a.interfaces.some(x=>SPECIAL_INTERFACES.has(x));for(const d of a.devices){d.cfg=d.cfg||{};d.behavior=d.behavior||{};d.pins=d.pins||{};d.dataset=d.dataset||{};}return a;}
  return{version:VERSION,KNOWN_INTERFACES:[...KNOWN_INTERFACES],GENERIC_INTERFACES:[...GENERIC_INTERFACES],SPECIAL_INTERFACES:[...SPECIAL_INTERFACES],TRANSPORT_MODE,analysis,applyPinRoles,issuesFor,interfaceSupport,arduino,esphome,augmentIdf,idfPinFilter,catalogCoverage,fixture,requiredTerminals,validateDevicePins,allRegistryDevices,meterRegisterDefinitions,i2cAddressFor,i2cAddressInfo,resourceConflicts,genericResourceRole,resourceRoleForTerminal,allocateDeviceIds,createIdAllocator,spiBusKey,modbusUnitInfo,modbusUnitFor,targetModbusDevice};
});
