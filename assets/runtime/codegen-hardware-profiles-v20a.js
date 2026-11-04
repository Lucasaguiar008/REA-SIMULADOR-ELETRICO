(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.TechRibCodegenHardwareProfiles=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const range=(a,b)=>Array.from({length:b-a+1},(_,i)=>a+i);
const set=(...parts)=>[...new Set(parts.flat())].sort((a,b)=>a-b);
const DOC='https://docs.espressif.com/projects/esp-idf/en/latest';
const profiles={
  'arduino-uno':{label:'Arduino Uno R3 / ATmega328P',platform:'arduino-avr',valid:range(0,13),debugWarn:[0,1],source:'https://docs.arduino.cc/hardware/uno-rev3/'},
  'arduino-mega2560':{label:'Arduino Mega 2560 / ATmega2560',platform:'arduino-avr',valid:range(0,53),debugWarn:[0,1,14,15,16,17,18,19],source:'https://docs.arduino.cc/hardware/mega-2560'},
  esp32:{label:'ESP32',idfTarget:'esp32',valid:set(range(0,19),range(21,23),range(25,27),range(32,39)),inputOnly:range(34,39),noInternalPull:range(34,39),adc:set([0,2,4],range(12,15),range(25,27),range(32,39)),adc2:set([0,2,4],range(12,15),range(25,27)),adc2WifiConflict:true,strapping:[0,2,5,12,15],reservedHard:range(6,11),reservedWarn:[16,17],debugWarn:[1,3,12,13,14,15],source:`${DOC}/esp32/api-reference/peripherals/gpio.html`},
  'esp32-s2':{label:'ESP32-S2',idfTarget:'esp32s2',valid:set(range(0,21),range(26,46)),inputOnly:[46],adc:range(1,20),adc2:range(11,20),strapping:[0,45,46],reservedHard:range(27,32),reservedWarn:[26],debugWarn:range(39,42),source:`${DOC}/esp32s2/api-reference/peripherals/gpio.html`},
  'esp32-s3':{label:'ESP32-S3',idfTarget:'esp32s3',valid:set(range(0,21),range(26,48)),adc:range(1,20),adc2:range(11,20),strapping:[0,3,45,46],reservedHard:range(26,32),reservedWarn:range(33,37),debugWarn:[19,20],source:`${DOC}/esp32s3/api-reference/peripherals/gpio.html`},
  'esp32-c3':{label:'ESP32-C3',idfTarget:'esp32c3',valid:range(0,21),adc:range(0,5),adc2:[5],strapping:[2,8,9],reservedHard:range(12,17),debugWarn:[18,19],source:`${DOC}/esp32c3/api-reference/peripherals/gpio.html`},
  'esp32-c5':{label:'ESP32-C5',idfTarget:'esp32c5',valid:range(0,28),adc:range(1,6),reservedHard:range(16,22),debugWarn:[13,14],source:`${DOC}/esp32c5/api-reference/peripherals/gpio.html`},
  'esp32-c6':{label:'ESP32-C6',idfTarget:'esp32c6',valid:range(0,30),adc:range(0,6),strapping:[4,5,8,9,15],reservedHard:range(24,30),debugWarn:[12,13],source:`${DOC}/esp32c6/api-reference/peripherals/gpio.html`},
  'esp32-c61':{label:'ESP32-C61',idfTarget:'esp32c61',valid:range(0,29),adc:[1,3,4,5],reservedHard:set(range(15,17),range(19,21)),reservedWarn:[14],debugWarn:[12,13],source:`${DOC}/esp32c61/api-reference/peripherals/gpio.html`},
  'esp32-h2':{label:'ESP32-H2',idfTarget:'esp32h2',valid:range(0,27),adc:range(1,5),strapping:[2,3,8,9,25],reservedHard:range(15,21),debugWarn:[26,27],source:`${DOC}/esp32h2/api-reference/peripherals/gpio.html`},
  'esp32-p4':{label:'ESP32-P4',idfTarget:'esp32p4',valid:range(0,56),adc:set(range(16,23),range(49,54)),adc2:range(49,54),strapping:range(34,38),debugWarn:[24,25],source:`${DOC}/esp32p4/api-reference/peripherals/gpio.html`},
  'esp32-s31':{label:'ESP32-S31',idfTarget:'esp32s31',valid:set(range(0,28),range(30,40),range(42,61)),adcValidation:'unverified-differential',strapping:set(range(36,40),[60,61]),reservedHard:set(range(26,28),range(30,32)),debugWarn:[58,59],source:`${DOC}/esp32s31/api-reference/peripherals/gpio.html`}
};
const norm=s=>String(s||'').trim().toLowerCase().replace(/_/g,'-');
function normalizeFamily(input){
  const s=norm(input);
  if(!s)return'';
  if(/arduino-avr-mega2560|arduino[- ]?mega|mega[- ]?2560|atmega2560/.test(s))return'arduino-mega2560';
  if(/arduino-avr-uno|arduino[- ]?uno|atmega328p/.test(s))return'arduino-uno';
  if(/esp32[- ]?s31/.test(s))return'esp32-s31';
  if(/esp32[- ]?s3/.test(s))return'esp32-s3';
  if(/esp32[- ]?s2/.test(s))return'esp32-s2';
  if(/esp32[- ]?c61/.test(s))return'esp32-c61';
  if(/esp32[- ]?c6/.test(s))return'esp32-c6';
  if(/esp32[- ]?c5/.test(s))return'esp32-c5';
  if(/esp32[- ]?c3/.test(s))return'esp32-c3';
  if(/esp32[- ]?h2/.test(s))return'esp32-h2';
  if(/esp32[- ]?p4/.test(s))return'esp32-p4';
  if(/esp32/.test(s))return'esp32';
  return s;
}
function detectFamily(info={}){
  const candidates=[info.family,info.registryId,info.type,info.label,info.name].filter(Boolean);
  for(const value of candidates){const f=normalizeFamily(value);if(profiles[f])return f;}
  return normalizeFamily(info.family||info.type||info.registryId||info.label||'');
}
function profileFor(info){const family=typeof info==='string'?normalizeFamily(info):detectFamily(info);return profiles[family]?{family,...profiles[family]}:null;}
function physicalGpio(name,profile){
  const s=String(name||'').trim().toUpperCase();
  if(profile?.family==='esp32'&&s==='VP')return 36;
  if(profile?.family==='esp32'&&s==='VN')return 39;
  const m=s.match(/^(?:GPIO|IO)\s*(\d+)(?:_\d+)?$/);if(m)return Number(m[1]);
  const d=s.match(/^D(\d+)$/);if(d)return Number(d[1]);
  return null;
}
function validatePin(profile,pin={}){
  const issues=[];if(!profile)return issues;
  const n=Number.isInteger(pin.number)?pin.number:physicalGpio(pin.name,profile);
  if(n===null){issues.push({level:'error',code:'pin-unmapped',text:`${pin.name||'?'}: alias sem mapeamento físico GPIO validado para ${profile.label}.`});return issues;}
  if(!profile.valid.includes(n)){issues.push({level:'error',code:'pin-invalid',text:`GPIO${n}: não é GPIO físico de uso geral válido no perfil ${profile.label}.`});return issues;}
  if((profile.inputOnly||[]).includes(n)&&pin.mode==='output')issues.push({level:'error',code:'input-only-output',text:`GPIO${n}: é somente entrada no ${profile.label} e não pode ser configurado como saída.`});
  if((profile.noInternalPull||[]).includes(n)&&['input_pullup','input_pulldown'].includes(pin.mode))issues.push({level:'error',code:'no-internal-pull',text:`GPIO${n}: não possui pull-up/pull-down interno suportado neste perfil.`});
  if(pin.mode==='analog-input'&&Array.isArray(profile.adc)&&!profile.adc.includes(n))issues.push({level:'error',code:'adc-unsupported',text:`GPIO${n}: não possui canal ADC no perfil ${profile.label}; selecione um GPIO com função ADC.`});
  if(pin.mode==='analog-input'&&profile.adc2WifiConflict&&(profile.adc2||[]).includes(n))issues.push({level:'warning',code:'adc2-wifi-conflict',text:`GPIO${n}: usa ADC2 no ${profile.label}. A documentação oficial alerta conflito de ADC2 com Wi-Fi; prefira ADC1 se o firmware usar Wi-Fi.`});
  if((profile.reservedHard||[]).includes(n))issues.push({level:'error',code:'flash-reserved',text:`GPIO${n}: normalmente é ocupado por SPI flash/PSRAM no ${profile.label}; o TechRib bloqueia geração automática nesse pino.`});
  if((profile.reservedWarn||[]).includes(n))issues.push({level:'warning',code:'memory-conditional',text:`GPIO${n}: pode estar ocupado por flash/PSRAM conforme módulo/encapsulamento; confirme a placa antes de usar.`});
  if((profile.strapping||[]).includes(n))issues.push({level:'warning',code:'strapping',text:`GPIO${n}: pino de strapping/boot; o circuito externo não deve forçar nível incompatível durante reset.`});
  if((profile.debugWarn||[]).includes(n))issues.push({level:'warning',code:'debug-default',text:`GPIO${n}: possui função padrão de depuração/UART/USB-JTAG/JTAG neste SoC; reutilizar pode desabilitar essa função.`});
  return issues;
}
function validateTarget(profile,target,family=''){
  family=normalizeFamily(family||profile?.family||'');
  const espressif=!!profile?.idfTarget;
  const arduinoAvr=profile?.platform==='arduino-avr';
  if(target==='espidf'&&!espressif)return{level:'error',code:'target-not-espressif',text:'ESP-IDF só pode ser gerado para uma família Espressif com perfil TechRib validado.'};
  if(target==='esp32-arduino'&&!espressif)return{level:'error',code:'target-not-esp32',text:'O destino ESP32 (Arduino) exige uma família ESP32 reconhecida. Selecione um destino compatível com a placa.'};
  if(target==='arduino'&&espressif)return{level:'warning',code:'prefer-esp32-arduino',text:`${profile.label}: prefira o destino “ESP32 (Arduino)” para aplicar as regras específicas do SoC.`};
  if(target==='arduino'&&arduinoAvr)return null;
  if(target==='arduino'&&!/(arduino|atmega|samd|rp2040|stm32)/.test(family))return{level:'error',code:'target-arduino-unknown',text:'Destino Arduino não certificado para esta família de controlador no TechRib.'};
  if(target==='esphome'&&!espressif&&!/esp8266/.test(family))return{level:'error',code:'target-esphome-unsupported',text:'ESPHome só está habilitado no TechRib para famílias Espressif reconhecidas nesta etapa.'};
  return null;
}
function validateAnalysis(info={}){
  const profile=profileFor(info.controller||info);
  const issues=[];
  const family=detectFamily(info.controller||info);
  const targetIssue=validateTarget(profile,info.target,family);if(targetIssue)issues.push(targetIssue);
  if(profile){
    const seen=new Map();
    for(const pin of info.pins||[]){
      const number=Number.isInteger(pin.number)?pin.number:physicalGpio(pin.pin||pin.name,profile);
      const normalized={name:pin.pin||pin.name,number,mode:norm(pin.mode)};
      issues.push(...validatePin(profile,normalized));
      if(normalized.mode==='analog-input'&&info.target==='esp32-arduino'&&!Array.isArray(profile.adc))issues.push({level:'error',code:'adc-map-unverified',text:`GPIO${number}: o mapa ADC do perfil ${profile.label} ainda não foi validado para geração automática Arduino; o TechRib bloqueia este uso para não gerar código incerto.`});
      if(number!==null){
        const netId=pin.net?.id||pin.net?.index||'';
        if(seen.has(number)&&seen.get(number).netId!==netId){issues.push({level:'error',code:'gpio-multiple-nets',text:`GPIO${number}: aparece conectado a redes elétricas diferentes (${seen.get(number).name} e ${normalized.name}). Um único GPIO físico não pode representar duas redes independentes.`});}
        else seen.set(number,{netId,name:normalized.name});
      }
    }
  }
  return{profile,issues,ok:!issues.some(x=>x.level==='error')};
}
return{version:'20A.4',profiles,normalizeFamily,detectFamily,profileFor,physicalGpio,validatePin,validateTarget,validateAnalysis};
});
