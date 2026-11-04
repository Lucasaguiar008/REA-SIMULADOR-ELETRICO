(function(root){
  'use strict';
  const create=({registryDefinition,canonicalGpioPin,gpioPinMode,effectiveGpioState}={})=>{
    if(typeof registryDefinition!=='function')throw new Error('TechRibElectricalSourcesRuntime: registryDefinition ausente');
    if(typeof canonicalGpioPin!=='function')throw new Error('TechRibElectricalSourcesRuntime: canonicalGpioPin ausente');
    if(typeof gpioPinMode!=='function')throw new Error('TechRibElectricalSourcesRuntime: gpioPinMode ausente');
    if(typeof effectiveGpioState!=='function')throw new Error('TechRibElectricalSourcesRuntime: effectiveGpioState ausente');
    const makeAc=(name,voltage,phase,lineVoltage=voltage,source='',frequency=60)=>({energized:true,voltage,lineVoltage,frequency,type:'AC',source,phase,polarity:null,conductor:name,reference:phase==='N'||phase==='X2'||voltage===0});
    const makeDc=(name,voltage,polarity,source='')=>({energized:true,voltage,lineVoltage:voltage,type:'DC',source,phase:null,polarity,conductor:name,reference:polarity==='-'||voltage===0});
    const sourceDefinition=(component,terminal)=>{
      const type=component.dataset.type,name=terminal.dataset.terminal||'',defaultSource=component.dataset.componentId,definition=registryDefinition(type),behavior=definition?.behavior||{},electrical=definition?.electrical||{};
      const ac=(voltage,phase,lineVoltage=voltage,source=defaultSource,frequency=60)=>makeAc(name,voltage,phase,lineVoltage,source,frequency);
      const dc=(voltage,polarity,source=defaultSource)=>makeDc(name,voltage,polarity,source);
      // V107: alimentador monofásico deve funcionar mesmo quando o SVG/registry usa L, L1 ou F para a fase.
      if(type==='fonte-monofasica'&&['L','L1','F','N','PE'].includes(name)){const voltage=Number(component.dataset.phaseVoltage||component.dataset.lineVoltage||127);if(name==='PE')return ac(0,'PE',voltage);if(name==='N')return ac(0,'N',voltage);return ac(voltage,'L1',voltage)}
      if(behavior.type==='dc-source'){if(name===behavior.positive)return dc(Number(behavior.voltage||5),'+');if(name===behavior.ground)return dc(0,'-')}
      // V122: compatibilidade com fontes DC legadas/salvas sem perfil registry completo.
      if(type==='fonte-5v'&&['+5V','GND'].includes(name))return dc(name==='+5V'?5:0,name==='+5V'?'+':'-');
      if(type==='fonte-3v3'&&['+3V3','GND'].includes(name))return dc(name==='+3V3'?3.3:0,name==='+3V3'?'+':'-');
      if(behavior.type==='ac-source'){
        const terminalDef=definition?.terminals?.[name]||{},line=Number(component.dataset.lineVoltage||electrical.lineVoltage||behavior.lineVoltage||220),phaseVoltage=Number(component.dataset.phaseVoltage||electrical.phaseVoltage||behavior.phaseVoltage||Math.round(line/Math.sqrt(3))),frequency=Number(electrical.frequency||behavior.frequency||60);
        if(terminalDef.type==='neutral'||terminalDef.phase==='N')return ac(0,'N',line,defaultSource,frequency);
        if(terminalDef.type==='protective-earth'||terminalDef.domain==='protective-earth'||terminalDef.function==='protective-earth')return ac(0,'PE',line,defaultSource,frequency);
        if(terminalDef.type==='power-output'&&terminalDef.supply==='AC')return ac(phaseVoltage,terminalDef.phase||name,line,defaultSource,frequency)
      }
      if(behavior.type==='switchable-ac-source'){
        const terminalDef=definition?.terminals?.[name]||{},line=Number(component.dataset.lineVoltage||electrical.lineVoltage||behavior.lineVoltage||220),phaseVoltage=Number(component.dataset.phaseVoltage||electrical.phaseVoltage||behavior.phaseVoltage||Math.round(line/Math.sqrt(3))),frequency=Number(electrical.frequency||behavior.frequency||60),enabled=component.dataset.sourceEnabled==='true',ready=component.dataset.transferReady==='true';
        if(terminalDef.type==='protective-earth'||terminalDef.domain==='protective-earth'||terminalDef.function==='protective-earth')return ac(0,'PE',line,defaultSource,frequency);
        if(name===behavior.readyTerminal)return ready?ac(phaseVoltage,terminalDef.phase||'L1',line,defaultSource,frequency):null;
        if(!enabled)return null;
        if(terminalDef.type==='neutral'||terminalDef.phase==='N')return ac(0,'N',line,defaultSource,frequency);
        if(terminalDef.type==='power-output'&&terminalDef.supply==='AC')return ac(phaseVoltage,terminalDef.phase||name,line,defaultSource,frequency)
      }
      // G51 V1: DALI-2 LED Driver DT6 CV. Publica a tensão média equivalente do PWM somente quando rede, barramento e comando DALI estão válidos.
      if(behavior.type==='dali-led-driver-cv'&&component.dataset.daliDriverOutputActive==='true'){
        const level=Math.max(0,Math.min(100,Number(component.dataset.daliDriverLevel||0))),nominal=Number(behavior.outputVoltage||electrical.outputVoltage||24),voltage=nominal*(level/100),source=component.dataset.componentId||defaultSource;
        if(name===(behavior.positive||'LED+'))return dc(voltage,voltage>0?'+':'-',source);
        if(name===(behavior.ground||'LED-'))return dc(0,'-',source);
      }
      // G59 V1: DALI-2 DT5 converte o nível DALI em uma fonte analógica DC real de 0–10 V.
      if(behavior.type==='dali-analog-converter'&&component.dataset.daliAnalogPowered==='true'){
        const voltage=Math.max(0,Math.min(Number(behavior.output?.maxVoltage||10),Number(component.dataset.daliAnalogVoltage||0))),source=component.dataset.daliAnalogSource||defaultSource;
        if(name===(behavior.output?.positive||'AO+'))return dc(voltage,voltage>0?'+':'-',source);
        if(name===(behavior.output?.ground||'AO-'))return dc(0,'-',source);
      }
      // G60 V1: DT8 Tunable White. LED+ e o comum positivo; CW-/WW- simulam a tensao media equivalente do PWM de cada canal.
      if(behavior.type==='dali-dt8-tunable-white-driver'&&component.dataset.daliDt8Ready==='true'){
        const nominal=Number(behavior.outputVoltage||24),cw=Math.max(0,Math.min(nominal,Number(component.dataset.daliDt8ColdVoltage||0))),ww=Math.max(0,Math.min(nominal,Number(component.dataset.daliDt8WarmVoltage||0))),source=component.dataset.componentId||defaultSource;
        if(name===(behavior.commonPositive||'LED+'))return dc(nominal,'+',source);
        if(name===(behavior.coldReturn||'CW-')){const v=Math.max(0,nominal-cw);return dc(v,v<=.001?'-':'+',source)}
        if(name===(behavior.warmReturn||'WW-')){const v=Math.max(0,nominal-ww);return dc(v,v<=.001?'-':'+',source)}
      }
      // G61 V1: DT8 RGBW CV. A saida usa o mesmo barramento 12-48 V e publica a tensao media PWM por canal.
      if(behavior.type==='dali-dt8-rgbw-dimmer-cv'&&component.dataset.daliDt8Ready==='true'){
        const supply=Math.max(0,Number(component.dataset.daliDt8SupplyVoltage||behavior.power?.nominalVoltage||24)),source=component.dataset.componentId||defaultSource,channels=behavior.channels||{};
        if(name===(behavior.commonPositive||'LED+'))return dc(supply,'+',source);
        const map={[channels.red||'R-']:Number(component.dataset.daliDt8RVoltage||0),[channels.green||'G-']:Number(component.dataset.daliDt8GVoltage||0),[channels.blue||'B-']:Number(component.dataset.daliDt8BVoltage||0),[channels.white||'W-']:Number(component.dataset.daliDt8WVoltage||0)};
        if(Object.prototype.hasOwnProperty.call(map,name)){const out=Math.max(0,Math.min(supply,map[name])),v=Math.max(0,supply-out);return dc(v,v<=.001?'-':'+',source)}
      }
      if(behavior.type==='ac-dc-power-supply'&&component.dataset.powerSupplyActive==='true'){
        const voltage=Number(behavior.outputVoltage||electrical.outputVoltage||24),source=component.dataset.powerSupplyInputSource||defaultSource;
        if(name===behavior.positive)return dc(voltage,'+',source);if(name===behavior.ground)return dc(0,'-',source);
        // G62–G65 V1: gateways KNX↔DALI reais podem possuir mais de uma linha DALI com PSU integrada.
        for(const output of (Array.isArray(behavior.additionalOutputs)?behavior.additionalOutputs:[])){
          const outV=Number(output?.outputVoltage||voltage);if(name===output?.positive)return dc(outV,'+',source);if(name===output?.ground)return dc(0,'-',source);
        }
      }
      // G65 V1: gateway DALI/IP alimentado em 24 Vcc. A linha DALI só vira fonte quando o runtime confirmou a alimentação DC real.
      if(behavior.type==='dali-ip-gateway-dc'&&component.dataset.daliIpPowered==='true'){
        const voltage=Number(behavior.outputVoltage||electrical.outputVoltage||16),source=component.dataset.daliIpInputSource||component.dataset.componentId||defaultSource;
        if(name===behavior.positive)return dc(voltage,'+',source);if(name===behavior.ground)return dc(0,'-',source);
      }
      if(behavior.type==='transformer'&&component.dataset.transformerActive==='true'){
        const secondary=behavior.secondary||[],voltage=Number(behavior.secondaryVoltage||electrical.secondaryVoltage||24),frequency=Number(behavior.frequency||electrical.frequency||60),source=component.dataset.transformerInputSource||defaultSource;
        if(name===secondary[0])return ac(voltage,'S1',voltage,source,frequency);if(name===secondary[1])return ac(0,'X2',voltage,source,frequency)
      }
      if(behavior.type==='bridge-rectifier'&&component.dataset.rectifierActive==='true'){
        const voltage=Number(component.dataset.rectifierOutputVoltage||0),source=component.dataset.rectifierSource||defaultSource;
        if(name==='+')return dc(voltage,'+',source);
        if(name==='-')return dc(0,'-',source)
      }
      if(behavior.type==='vfd-realistic'&&component.dataset.vfdPowerOk==='true'){
        const source=component.dataset.componentId||defaultSource;
        if(name==='+24V')return dc(24,'+',source);
        if(name==='DCM'||name==='COM')return dc(0,'-',source);
        if(name==='+10V')return dc(10,'+',source);
        if(name==='ACM'||name==='GND')return dc(0,'-',source);
      }
      // V3 Motion: sensores/atuadores funcionais publicam suas saídas pela MESMA fonte elétrica nativa.
      if(type==='techrib-potentiometer-functional'&&name==='W'&&component.dataset.potOutputValid==='true'){
        const voltage=Number(component.dataset.potOutputVoltage||0),source=component.dataset.potSource||defaultSource;
        return dc(voltage,voltage>0?'+':'-',source)
      }
      if(type==='techrib-rotary-encoder-functional'&&component.dataset.encoderOutputValid==='true'&&['A','B','SW'].includes(name)){
        const high=String(name==='A'?component.dataset.encoderA:name==='B'?component.dataset.encoderB:component.dataset.encoderSw||'HIGH').toUpperCase()==='HIGH',voltage=Number(component.dataset.encoderSupplyVoltage||3.3),source=component.dataset.encoderSupplySource||defaultSource;
        return dc(high?voltage:0,high?'+':'-',source)
      }
      if(type==='techrib-hc-sr04-functional'&&name==='ECHO'&&component.dataset.peripheralPowered==='true'){
        const high=component.dataset.ultrasonicEchoState==='HIGH',source=component.dataset.peripheralSupplySource||defaultSource;
        return dc(high?5:0,high?'+':'-',source)
      }
      if(type==='techrib-drv8825-functional'&&component.dataset.drvReady==='true'&&['A1','A2','B1','B2'].includes(name)){
        const voltage=Number(component.dataset.drvSupplyVoltage||0),source=component.dataset.drvSupplySource||defaultSource,phase=((Number(component.dataset.drvPhase||0)%4)+4)%4;
        const table=[{A1:1,A2:0,B1:1,B2:0},{A1:0,A2:1,B1:1,B2:0},{A1:0,A2:1,B1:0,B2:1},{A1:1,A2:0,B1:0,B2:1}],high=!!table[phase][name];
        return dc(high?voltage:0,high?'+':'-',source)
      }
      if(behavior.type==='analog-sensor'&&component.dataset.sensorPowered==='true'){
        const output=behavior.output,voltage=Number(component.dataset.sensorOutputVoltage||0),source=component.dataset.sensorSupplySource||defaultSource;
        if(name===output)return dc(voltage,voltage>0?'+':'-',source)
      }
      if(behavior.type==='isolated-digital-input'&&component.dataset.isolatedInputPowered==='true'&&name===behavior.output){
        const high=component.dataset.isolatedInputActive==='true',voltage=Number(component.dataset.isolatedLogicVoltage||behavior.logicHighVoltage||3.3),source=component.dataset.isolatedSupplySource||defaultSource;
        return dc(high?voltage:0,high?'+':'-',source)
      }
      if(behavior.type==='presence-sensor-digital'&&component.dataset.presenceSensorPowered==='true'&&name===(behavior.output||'OUT')){
        const high=component.dataset.presenceSensorActive==='true',voltage=Number(behavior.outputHighVoltage||3.3),source=component.dataset.presenceSensorSource||defaultSource;
        return dc(high?voltage:0,high?'+':'-',source)
      }
      // G24 V1: sensor digital de gás/CO. A saída típica do exemplo é ativa em LOW:
      // ar normal publica HIGH (3,3 V) e detecção publica LOW (0 V), sempre condicionada à alimentação real.
      if(behavior.type==='gas-sensor-digital'&&component.dataset.gasSensorPowered==='true'&&name===(behavior.output||'DO')){
        const alarm=component.dataset.gasSensorAlarm==='true',activeLow=String(behavior.active||'low').toLowerCase()==='low',high=activeLow?!alarm:alarm,voltage=Number(behavior.outputHighVoltage||3.3),source=component.dataset.gasSensorSource||defaultSource;
        return dc(high?voltage:0,high?'+':'-',source)
      }
      if(behavior.type==='current-loop-receiver'&&component.dataset.currentLoopPowered==='true'&&name===(behavior.output?.terminal||'OUT')){
        const voltage=Number(component.dataset.currentLoopOutputVoltage||0),source=component.dataset.currentLoopSourceId||defaultSource;
        return dc(voltage,voltage>0?'+':'-',source)
      }
      // G25 V1: interface bidirecional 0–10 V <-> 0–3,3 V. ADC e AO são fontes elétricas reais, condicionadas à alimentação de 24 V.
      if(behavior.type==='analog-0-10-interface'&&component.dataset.analog010Powered==='true'){
        const source=component.dataset.analog010Source||defaultSource;
        if(name===(behavior.input?.logic||'ADC')){const v=Number(component.dataset.analog010AdcVoltage||0);return dc(v,v>0?'+':'-',source)}
        if(name===(behavior.output?.field||'AO')){const v=Number(component.dataset.analog010AoVoltage||0);return dc(v,v>0?'+':'-',source)}
      }
      // G26 V1: W5500 publica INT ativo em LOW e um estado elétrico determinístico de MISO durante o teste de tráfego.
      if(behavior.type==='ethernet-w5500'&&component.dataset.w5500Powered==='true'){
        const source=component.dataset.w5500SupplySource||defaultSource,v=Number(behavior.logicVoltage||3.3);
        if(name===(behavior.interrupt?.terminal||'INT')){const high=component.dataset.w5500IntLow!=='true';return dc(high?v:0,high?'+':'-',source)}
        if(name===(behavior.spi?.miso||'MISO')){const high=component.dataset.w5500MisoHigh==='true';return dc(high?v:0,high?'+':'-',source)}
      }
      // G27 V1: LAN8720 RMII. RXD0/RXD1/CRS_DV e REF_CLK são saídas elétricas reais do PHY para o ESP32.
      if(behavior.type==='ethernet-lan8720'&&component.dataset.lan8720Powered==='true'){
        const source=component.dataset.lan8720SupplySource||defaultSource,v=Number(behavior.logicVoltage||3.3),rmii=behavior.rmii||{};
        if(name===(rmii.rxd?.[0]||'RXD0')){const high=component.dataset.lan8720RxD0High==='true';return dc(high?v:0,high?'+':'-',source)}
        if(name===(rmii.rxd?.[1]||'RXD1')){const high=component.dataset.lan8720RxD1High==='true';return dc(high?v:0,high?'+':'-',source)}
        if(name===(rmii.carrierDataValid||'CRS_DV')){const high=component.dataset.lan8720CrsDvHigh==='true';return dc(high?v:0,high?'+':'-',source)}
        if(name===(rmii.referenceClock||'REF_CLK')){const high=component.dataset.lan8720RefClkHigh==='true';return dc(high?v:0,high?'+':'-',source)}
      }
      // G28 V1: transceiver CAN/TWAI. RXD reproduz eletricamente o estado recessivo HIGH / dominante LOW do barramento.
      if(behavior.type==='can-transceiver'&&component.dataset.canPowered==='true'&&name===(behavior.pins?.rxd||'RXD')){
        const source=component.dataset.canSupplySource||defaultSource,v=Number(behavior.logicVoltage||3.3),high=component.dataset.canRxLow!=='true';return dc(high?v:0,high?'+':'-',source)
      }
      // G29 V1: SX1278. DIO0 sinaliza RX Done em HIGH e MISO publica nível lógico do rádio quando SPI está pronto.
      if(behavior.type==='lora-sx1278'&&component.dataset.loraPowered==='true'){
        const source=component.dataset.loraSupplySource||defaultSource,v=Number(behavior.logicVoltage||3.3);
        if(name===(behavior.interrupt?.terminal||'DIO0')){const high=component.dataset.loraDio0High==='true';return dc(high?v:0,high?'+':'-',source)}
        if(name===(behavior.spi?.miso||'MISO')){const high=component.dataset.loraMisoHigh==='true';return dc(high?v:0,high?'+':'-',source)}
      }
      // G30 V1: CC2530 ZNP. TXD fica HIGH em repouso e gera nível LOW durante o frame UART recebido via Zigbee.
      if(behavior.type==='zigbee-cc2530-znp'&&component.dataset.zigbeePowered==='true'&&name===(behavior.uart?.tx||'TXD')){
        const source=component.dataset.zigbeeSupplySource||defaultSource,v=Number(behavior.logicVoltage||3.3),high=component.dataset.zigbeeTxLow!=='true';return dc(high?v:0,high?'+':'-',source)
      }
      if(behavior.type==='matter-thread-esp32h2'&&component.dataset.matterThreadPowered==='true'&&name===(behavior.uart?.tx||'TXD')){
        const source=component.dataset.componentId||defaultSource,v=Number(behavior.logicVoltage||3.3),high=component.dataset.matterThreadTxLow!=='true';return dc(high?v:0,high?'+':'-',source)
      }
      if(behavior.type==='matter-device-thread'&&component.dataset.matterDevicePowered==='true'&&name===(behavior.output||'OUT')){
        const high=component.dataset.matterDeviceOutputHigh==='true',voltage=Number(behavior.logicHighVoltage||3.3),source=component.dataset.componentId||defaultSource;
        return dc(high?voltage:0,high?'+':'-',source)
      }
      if(behavior.type==='knx-tp1-uart'&&component.dataset.knxPowered==='true'&&name===(behavior.uart?.tx||'TXD')){
        const source=component.dataset.componentId||defaultSource,v=Number(behavior.logicVoltage||3.3),high=component.dataset.knxTxLow!=='true';return dc(high?v:0,high?'+':'-',source)
      }
      if(behavior.type==='rs485-transceiver'&&component.dataset.rs485Powered==='true'){
        const pins=behavior.pins||{},ro=pins.ro||'RO';
        if(name===ro&&component.dataset.rs485ReceiverEnabled==='true'&&component.dataset.rs485BusCollision!=='true'&&component.dataset.rs485PolarityFault!=='true'){
          const high=component.dataset.rs485RoHigh==='true',voltage=Number(behavior.outputHighVoltage||behavior.logicVoltage||5),source=component.dataset.rs485SupplySource||defaultSource;
          return dc(high?voltage:0,high?'+':'-',source)
        }
      }
      if(behavior.type==='i2c-gpio-expander'&&component.dataset.mcpPowered==='true'){
        const modes=(()=>{try{return JSON.parse(component.dataset.mcpPinModes||'{}')}catch{return{}}})(),vals=(()=>{try{return JSON.parse(component.dataset.mcpStates||'{}')}catch{return{}}})();
        if(/^GP[AB][0-7]$/.test(name)&&modes[name]==='output'){const high=String(vals[name]||'LOW').toUpperCase()==='HIGH',v=Number(component.dataset.mcpVdd||3.3),source=component.dataset.mcpSupplySource||defaultSource;return dc(high?v:0,high?'+':'-',source)}
      }
      // G17 V1.4: PCF8574 quasi-bidirecional. LOW é um sink elétrico real para GND;
      // HIGH não injeta 3,3 V na rede: apenas libera o pino para funcionar como entrada.
      if(behavior.type==='i2c-quasi-gpio-expander'&&component.dataset.i2cGpioPowered==='true'){
        const modes=(()=>{try{return JSON.parse(component.dataset.i2cGpioPinModes||'{}')}catch{return{}}})(),latch=(()=>{try{return JSON.parse(component.dataset.i2cGpioLatch||'{}')}catch{return{}}})();
        if(/^P[0-7]$/.test(name)&&String(modes[name]||'unused').toLowerCase()==='output'&&String(latch[name]||'HIGH').toUpperCase()==='LOW'){
          const source=component.dataset.i2cGpioSupplySource||defaultSource;return dc(0,'-',source)
        }
      }
      // G21 V1: PCA9685. O motor elétrico publica a tensão média equivalente do PWM;
      // atuadores servo recebem o ângulo diretamente pelo runtime PWM/I²C.
      if(behavior.type==='i2c-pwm-controller'&&component.dataset.pca9685Powered==='true'&&component.dataset.pca9685OutputEnabled==='true'){
        const outputs=Array.isArray(behavior.pwm?.outputs)?behavior.pwm.outputs:[],index=outputs.indexOf(name);
        if(index>=0){const values=(()=>{try{return JSON.parse(component.dataset.pca9685Channels||'{}')}catch{return{}}})(),max=(1<<Number(behavior.pwm?.resolutionBits||12))-1,count=Math.max(0,Math.min(max,Number(values[index]??values[String(index)]??0))),v=Number(component.dataset.pca9685SupplyVoltage||3.3),avg=max?count/max*v:0,source=component.dataset.pca9685SupplySource||defaultSource;return dc(avg,avg>0?'+':'-',source)}
      }
      // G22 V1: DS3231. SQW é uma saída lógica configurada em 1 Hz no exemplo; a saída 32K fica representada por metadados de frequência.
      if(behavior.type==='i2c-rtc'&&component.dataset.rtcBatteryPresent!=='false'){
        const sqw=behavior.squareWave?.terminal||'SQW';
        if(name===sqw){const high=String(component.dataset.rtcSqwState||'LOW').toUpperCase()==='HIGH',v=Number(component.dataset.rtcSupplyVoltage||behavior.power?.nominalVoltage||3.3)||3.3,source=component.dataset.rtcSupplySource||defaultSource;return dc(high?v:0,high?'+':'-',source)}
      }
      // G18 V1: 74HC595. Q0-Q7 são saídas push-pull quando OE está ativo (LOW); Q7S é a saída serial de cascata e independe de OE.
      if(behavior.type==='serial-shift-register'&&component.dataset.shift595Powered==='true'){
        const pins=behavior.pins||{},outputs=Array.isArray(pins.outputs)?pins.outputs:['Q0','Q1','Q2','Q3','Q4','Q5','Q6','Q7'],serialOut=pins.serialOut||'Q7S',enabled=component.dataset.shift595OutputEnabled==='true',out=Math.max(0,Math.min(255,Number(component.dataset.shift595Output||0)))|0,shift=Math.max(0,Math.min(255,Number(component.dataset.shift595Shift||0)))|0,v=Number(component.dataset.shift595SupplyVoltage||behavior.power?.nominalVoltage||3.3),source=component.dataset.shift595SupplySource||defaultSource;
        const index=outputs.indexOf(name);if(index>=0){if(!enabled)return null;const high=Boolean(out&(1<<index));return dc(high?v:0,high?'+':'-',source)}
        if(name===serialOut){const high=Boolean(shift&0x80);return dc(high?v:0,high?'+':'-',source)}
      }
      // G19 V1: 74HC165. QH e QH complementar sao saidas push-pull do ultimo estagio do registrador.
      if(behavior.type==='parallel-input-shift-register'&&component.dataset.shift165Powered==='true'){
        const pins=behavior.pins||{},serialOut=pins.serialOut||'QH',serialOutComplement=pins.serialOutComplement||'QHN',reg=Math.max(0,Math.min(255,Number(component.dataset.shift165Register||0)))|0,v=Number(component.dataset.shift165SupplyVoltage||behavior.power?.nominalVoltage||3.3),source=component.dataset.shift165SupplySource||defaultSource,high=Boolean(reg&0x80);
        if(name===serialOut)return dc(high?v:0,high?'+':'-',source);
        if(name===serialOutComplement)return dc(!high?v:0,!high?'+':'-',source);
      }
      if(behavior.type==='microcontroller'&&component.dataset.logicPowered==='true'){
        const supplySource=component.dataset.logicSupplySource||defaultSource,pinName=canonicalGpioPin(component,name),terminalDef=definition?.terminals?.[name]||definition?.terminals?.[pinName]||{};
        if(terminalDef.type==='power-output'&&Number.isFinite(Number(terminalDef.voltage)))return dc(Number(terminalDef.voltage),'+',supplySource);
        if(terminalDef.type==='gpio'&&gpioPinMode(component,pinName)==='output'){const high=effectiveGpioState(component,pinName)==='HIGH',voltage=Number(terminalDef.logicVoltage||behavior.logicVoltage||3.3);return dc(high?voltage:0,high?'+':'-',supplySource)}
      }
      if(type==='fonte-trifasica'&&['L1','L2','L3','N','PE'].includes(name)){const line=Number(component.dataset.lineVoltage||220),phase=Number(component.dataset.phaseVoltage||Math.round(line/Math.sqrt(3)));if(name==='PE')return ac(0,'PE',line);return ac(name==='N'?0:phase,name,line)}
      if(type==='fonte-bifasica'&&['L1','L2','N','PE'].includes(name)){const line=Number(component.dataset.lineVoltage||220),phase=Number(component.dataset.phaseVoltage||Math.round(line/Math.sqrt(3)));if(name==='PE')return ac(0,'PE',line);return ac(name==='N'?0:phase,name,line)}
      if(type==='fonte-monofasica'&&['L','L1','F','N','PE'].includes(name)){const voltage=Number(component.dataset.phaseVoltage||component.dataset.lineVoltage||127);if(name==='PE')return ac(0,'PE',voltage);if(name==='N')return ac(0,'N',voltage);return ac(voltage,'L1',voltage)}
      if(type==='transformador-comando'&&['X1','X2'].includes(name)){const voltage=Number(component.dataset.secondaryVoltage||12);return ac(name==='X1'?voltage:0,name,voltage)}
      return null
    };
    return Object.freeze({sourceDefinition,makeAc,makeDc});
  };
  root.TechRibElectricalSourcesRuntime=Object.freeze({create});
})(typeof window!=='undefined'?window:globalThis);
