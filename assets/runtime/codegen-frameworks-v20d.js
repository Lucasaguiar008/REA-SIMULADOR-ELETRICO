(function(root,factory){
  'use strict'; const api=factory(); if(typeof module==='object'&&module.exports)module.exports=api; if(root)root.TechRibCodegenFrameworks=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const VERSION='20D.1-LCD20X4';
  const ident=(s,f='item')=>{let x=String(s||'').toLowerCase().normalize?.('NFD').replace(/[\u0300-\u036f]/g,'')||'';x=x.replace(/[^a-z0-9_]+/g,'_').replace(/_+/g,'_').replace(/^_+|_+$/g,'');if(!x)x=f;if(/^\d/.test(x))x='tr_'+x;return x;};
  const upper=(s,f='PIN')=>{let x=String(s||'').toUpperCase().replace(/[^A-Z0-9_]+/g,'_').replace(/_+/g,'_').replace(/^_+|_+$/g,'');return x||f;};
  const cppString=s=>JSON.stringify(String(s??'').replace(/[\r\n]+/g,' ').slice(0,80));
  const pinByName=(a,n)=>a.pins.find(p=>String(p.pin).toUpperCase()===String(n||'').toUpperCase());
  const connLabel=p=>p?.others?.map(o=>`${o.component?.dataset?.tag||o.component?.dataset?.type||'COMP'}.${o.meta?.name||'?'}`).join(' / ')||p?.reason||'';
  function ruleSet(a){
    const supported=[],unsupported=[]; (a.program?.rules||[]).forEach((r,i)=>{
      const type=String(r?.type||'').toLowerCase(); if(!['toggle','set-reset','analog-hysteresis'].includes(type)){unsupported.push({i,r,reason:`regra ${type||'?'} ainda não automatizada`});return;}
      if(type==='analog-hysteresis'){
        const input=pinByName(a,r?.input?.pin||r?.trigger?.pin),output=pinByName(a,r?.output);if(!input||!output){unsupported.push({i,r,reason:'pino analógico/output da regra não encontrado'});return;}
        if(input.mode!=='analog-input'){unsupported.push({i,r,reason:`regra analog-hysteresis requer analog-input; ${input.pin} está como ${input.mode||'unknown'}`});return;}
        if(output.mode!=='output'){unsupported.push({i,r,reason:`regra analog-hysteresis requer saída digital; ${output.pin} está como ${output.mode||'unknown'}`});return;}
        const sensor=String(r?.input?.sensor||r?.sensor||'raw').toLowerCase(),onAt=Number(r?.onAt),offAt=Number(r?.offAt);if(!Number.isFinite(onAt)||!Number.isFinite(offAt)||onAt<=offAt){unsupported.push({i,r,reason:'limites de histerese inválidos: onAt deve ser maior que offAt'});return;}
        if(!['lm35','raw'].includes(sensor)){unsupported.push({i,r,reason:`conversão analógica ${sensor} ainda não automatizada`});return;}
        supported.push({i,type,input,output,sensor,onAt,offAt,activeHigh:r?.activeHigh!==false,name:ident(r?.memory||`analog_${output.number}`)});return;
      }
      if(type==='toggle'){
        const input=pinByName(a,r?.trigger?.pin),output=pinByName(a,r?.output); if(!input||!output){unsupported.push({i,r,reason:'pino da regra não encontrado'});return;}
        if(input.mode==='analog-input'){unsupported.push({i,r,reason:`regra toggle requer entrada digital; ${input.pin} é analog-input`});return;}
        supported.push({i,type,input,output,active:String(r?.trigger?.active||'LOW').toUpperCase()==='HIGH'?1:0,name:ident(r?.memory||`saida_${output.number}`)});
      } else {
        const set=pinByName(a,r?.set?.pin||r?.setPin),reset=pinByName(a,r?.reset?.pin||r?.resetPin),output=pinByName(a,r?.output); if(!set||!reset||!output){unsupported.push({i,r,reason:'pinos set/reset/output não encontrados'});return;}
        if(set.mode==='analog-input'||reset.mode==='analog-input'){unsupported.push({i,r,reason:'regra set-reset requer entradas digitais; entrada analog-input detectada'});return;}
        supported.push({i,type,set,reset,output,setActive:String(r?.set?.active||'LOW').toUpperCase()==='HIGH'?1:0,resetActive:String(r?.reset?.active||'LOW').toUpperCase()==='HIGH'?1:0,name:ident(r?.memory||`saida_${output.number}`)});
      }
    }); return{supported,unsupported};
  }
  function arduinoWaterTankPc817(a){
    const req=['D2','D3','D4','D8'],p=Object.fromEntries(req.map(n=>[n,pinByName(a,n)])),missing=req.filter(n=>!p[n]||p[n].number===null);
    if(missing.length)return{code:`// TechRib: CodeGen bloqueado — pinos ausentes: ${missing.join(', ')}\n`,ext:'ino',unsupported:missing.map(pin=>({reason:`${pin} não encontrado na topologia`}))};
    const lines=['/*',' * Projeto gerado automaticamente pelo Simulador TechRib',' * Arduino Uno — Caixa d’Água com Entradas Isoladas PC817',' * Lógica: boias por PC817 em INPUT_PULLUP + proteção da cisterna + retenção da bomba.',' */','#define TECHRIB_GENERATED_CODE 1','#define TECHRIB_GENERATOR_ID "TR-CODEGEN-WATER-PC817-V1"','','#include <Arduino.h>','',`constexpr uint8_t PIN_MIN = ${p.D2.number};   // D2 • nível mínimo via PC817`,`constexpr uint8_t PIN_MAX = ${p.D3.number};   // D3 • nível máximo via PC817`,`constexpr uint8_t PIN_CISTERNA = ${p.D4.number}; // D4 • cisterna OK via PC817`,`constexpr uint8_t PIN_BOMBA = ${p.D8.number}; // D8 • ULN2003AG -> relé -> contatora`,'','bool demandaBomba = false;','','void setup() {','  pinMode(PIN_MIN, INPUT_PULLUP);','  pinMode(PIN_MAX, INPUT_PULLUP);','  pinMode(PIN_CISTERNA, INPUT_PULLUP);','  pinMode(PIN_BOMBA, OUTPUT);','  digitalWrite(PIN_BOMBA, LOW);','}','','void loop() {','  // PC817 conduzindo puxa a entrada para LOW.','  const bool nivelMinimo = digitalRead(PIN_MIN) == LOW;','  const bool nivelMaximo = digitalRead(PIN_MAX) == LOW;','  const bool cisternaOk = digitalRead(PIN_CISTERNA) == LOW;','','  // Prioridade de segurança: falta de água na cisterna ou caixa cheia desliga a bomba.','  if (!cisternaOk || nivelMaximo) {','    demandaBomba = false;','  } else if (nivelMinimo) {','    // Ao atingir o nível mínimo, mantém a bomba ligada até o nível máximo.','    demandaBomba = true;','  }','','  digitalWrite(PIN_BOMBA, demandaBomba ? HIGH : LOW);','  delay(20);','}',''];
    return{code:lines.join('\n'),ext:'ino',unsupported:[]};
  }
  function arduinoCompressorPressure(a){
    const pinMap=Object.fromEntries((a.pins||[]).map(p=>[String(p.pin||''),p]));
    const req=['D2','D3','D4','D5','D8'],missing=req.filter(k=>!pinMap[k]||pinMap[k].number===null||pinMap[k].number===undefined);
    if(missing.length)return{code:'',ext:'ino',unsupported:[`Compressor Arduino: pinos ausentes: ${missing.join(', ')}`]};
    const n=k=>Number(pinMap[k].number);
    const lines=['/*',' * Compressor — Controle com Arduino',' * Gerado pelo Simulador TechRib',' * Entradas com contato seco para GND + INPUT_PULLUP.',' * S0 (emergência) e RT1 (térmico) permanecem em série fisicamente com KM1.',' */','#include <Arduino.h>','',`constexpr uint8_t PIN_LIGA = ${n('D2')};`,`constexpr uint8_t PIN_STOP_NF = ${n('D3')};`,`constexpr uint8_t PIN_PRESS_LOW = ${n('D4')};`,`constexpr uint8_t PIN_PRESS_HIGH = ${n('D5')};`,`constexpr uint8_t PIN_RELE_KM1 = ${n('D8')};`,'','bool controleArmado = false;','bool demandaCompressor = false;','bool ligaAnterior = false;','','void setup() {','  pinMode(PIN_LIGA, INPUT_PULLUP);','  pinMode(PIN_STOP_NF, INPUT_PULLUP);','  pinMode(PIN_PRESS_LOW, INPUT_PULLUP);','  pinMode(PIN_PRESS_HIGH, INPUT_PULLUP);','  pinMode(PIN_RELE_KM1, OUTPUT);','  digitalWrite(PIN_RELE_KM1, LOW);','}','','void loop() {','  // Com INPUT_PULLUP, contato fechado para GND = LOW.','  const bool liga = digitalRead(PIN_LIGA) == LOW;','  const bool stop = digitalRead(PIN_STOP_NF) == HIGH; // NF abriu: parada solicitada','  const bool pressaoBaixa = digitalRead(PIN_PRESS_LOW) == LOW;','  const bool pressaoAlta = digitalRead(PIN_PRESS_HIGH) == LOW;','  const bool bordaLiga = liga && !ligaAnterior;','','  if (stop) {','    controleArmado = false;','    demandaCompressor = false;','  } else if (bordaLiga) {','    controleArmado = true;','  }','','  if (controleArmado) {','    if (pressaoAlta) {','      demandaCompressor = false;','    } else if (pressaoBaixa) {','      demandaCompressor = true;','    }','  } else {','    demandaCompressor = false;','  }','','  digitalWrite(PIN_RELE_KM1, demandaCompressor ? HIGH : LOW);','  ligaAnterior = liga;','  delay(20);','}',''];
    return{code:lines.join('\n'),ext:'ino',unsupported:[]};
  }
  function arduino(a,esp32=true){
    if(!esp32&&a.controller?.dataset?.codegenControlProfile==='compressor-arduino-pressure')return arduinoCompressorPressure(a);
    if(!esp32&&a.controller?.dataset?.codegenControlProfile==='water-tank-pc817')return arduinoWaterTankPc817(a);
    const transport=/^(?:i2c_|spi_|uart_|can_|rmii_|eth_|shift_|transport_)/;const pins=a.pins.filter(p=>p.number!==null&&p.mode!=='unknown'&&!transport.test(String(p.mode||''))),rules=ruleSet(a),outs=pins.filter(p=>p.mode==='output'),analogs=pins.filter(p=>p.mode==='analog-input'),ins=pins.filter(p=>p.mode!=='output'&&p.mode!=='analog-input'),motion=a.motion||{servos:[],ultrasonic:[],drvs:[],encoders:[],potentiometers:[]},lcds=(a.lcdDisplays||[]).filter(d=>!(d.missing||[]).length);
    const servoClassic=esp32?[]:(motion.servos||[]).filter(d=>d.pins?.SIG?.number!==null),servoEsp32=esp32?(motion.servos||[]).filter(d=>d.pins?.SIG?.number!==null):[];
    const lines=['/*',' * Projeto gerado automaticamente pelo Simulador TechRib',' * © 2026 TechRib. Todos os direitos reservados.',' * Gerador: TechRib Code Generator V3 / Etapa 20D',' *',' * Lógica inferida da topologia real do projeto.',' * Entradas, saídas, debounce e estado compartilhado foram gerados pelo TechRib.',' */','#define TECHRIB_GENERATED_CODE 1','#define TECHRIB_GENERATOR_ID "TR-CODEGEN-20D"','','#include <Arduino.h>'];
    if(servoClassic.length)lines.push('#include <Servo.h>');
    if(lcds.length)lines.push('#include <LiquidCrystal.h>');
    if(lcds.length){lines.push('');lcds.forEach((lcd,i)=>{const p=lcd.pins||{},id=`tr_lcd_${i+1}`;lines.push(`LiquidCrystal ${id}(${p.RS.number}, ${p.E.number}, ${p.D4.number}, ${p.D5.number}, ${p.D6.number}, ${p.D7.number}); // ${lcd.tag}`)})}
    lines.push('','namespace TechRib {','constexpr uint32_t kDebounceMs = 35;','');
    pins.forEach(p=>{if(p.mode==='analog-input'&&/^A\d+$/i.test(String(p.pin||'')))return;lines.push(`constexpr uint8_t ${upper(p.pin)} = ${p.number}; // ${connLabel(p)}`)});
    lines.push('','struct InputState { bool lastRaw; bool stable; uint32_t changedAt; };');
    ins.forEach(p=>lines.push(`InputState in_${ident(p.pin)}{HIGH, HIGH, 0};`));
    outs.forEach(p=>lines.push(`bool out_${ident(p.pin)} = false;`));
    analogs.forEach(p=>lines.push(`uint16_t analog_${ident(p.pin)} = 0; // leitura ADC bruta`));
    servoClassic.forEach((d,i)=>lines.push(`Servo servo_${ident(d.id||String(i))};`));
    lines.push('','void setOutput(uint8_t pin, bool state) {','  digitalWrite(pin, state ? HIGH : LOW);');
    outs.forEach(p=>lines.push(`  if (pin == ${upper(p.pin)}) out_${ident(p.pin)} = state;`));
    lines.push('}','', 'bool outputState(uint8_t pin) {'); outs.forEach(p=>lines.push(`  if (pin == ${upper(p.pin)}) return out_${ident(p.pin)};`)); lines.push('  return false;','}','', 'bool pressed(InputState &s, uint8_t pin, bool activeLevel) {','  const bool raw = digitalRead(pin);','  const uint32_t now = millis();','  if (raw != s.lastRaw) { s.lastRaw = raw; s.changedAt = now; }','  if (raw != s.stable && (now - s.changedAt) >= kDebounceMs) {','    s.stable = raw;','    if (s.stable == activeLevel) return true;','  }','  return false;','}');
    if(analogs.length){
      lines.push('', 'uint16_t analogValue(uint8_t pin) {');
      analogs.forEach(p=>lines.push(`  if (pin == ${upper(p.pin)}) return analog_${ident(p.pin)};`));
      lines.push('  return 0;','}','', 'void sampleAnalogInputs() {');
      analogs.forEach(p=>lines.push(`  analog_${ident(p.pin)} = analogRead(${upper(p.pin)}); // ${connLabel(p)}`));
      lines.push('}');
    }
    (motion.drvs||[]).forEach((d,i)=>{const st=d.pins?.STEP,di=d.pins?.DIR;if(!st||!di||st.number===null||di.number===null)return;const n=ident(d.id||`drv_${i}`);lines.push('',`void step_${n}(bool clockwise, uint32_t steps, uint16_t pulseUs = 3) {`,`  digitalWrite(${upper(di.pin)}, clockwise ? HIGH : LOW);`,'  for (uint32_t i = 0; i < steps; ++i) {',`    digitalWrite(${upper(st.pin)}, HIGH);`,'    delayMicroseconds(pulseUs);',`    digitalWrite(${upper(st.pin)}, LOW);`,'    delayMicroseconds(pulseUs);','  }','}');});
    (motion.ultrasonic||[]).forEach((d,i)=>{const tr=d.pins?.TRIG,ec=d.pins?.ECHO;if(!tr||!ec||tr.number===null||ec.number===null)return;const n=ident(d.id||`hcsr04_${i}`);lines.push('',`float distance_${n}_cm() {`,`  digitalWrite(${upper(tr.pin)}, LOW);`,'  delayMicroseconds(2);',`  digitalWrite(${upper(tr.pin)}, HIGH);`,'  delayMicroseconds(10);',`  digitalWrite(${upper(tr.pin)}, LOW);`,`  const unsigned long us = pulseIn(${upper(ec.pin)}, HIGH, 30000UL);`,'  return us ? (us / 58.0f) : -1.0f;','}');});
    servoClassic.forEach((d,i)=>{const sig=d.pins?.SIG;if(!sig)return;const n=ident(d.id||String(i));lines.push('',`void servo_${n}_write(uint8_t degrees) {`,`  servo_${n}.write(constrain(degrees, 0, 180));`,'}');});
    servoEsp32.forEach((d,i)=>{const sig=d.pins?.SIG;if(!sig)return;const n=ident(d.id||String(i));lines.push('',`void servo_${n}_write(uint8_t degrees) {`,'  degrees = constrain(degrees, 0, 180);','  const uint16_t pulseUs = 500U + (uint32_t(degrees) * 2000U) / 180U;','  const uint32_t duty = (uint32_t(uint64_t(pulseUs) * 65535ULL) / 20000ULL);',`  ledcWrite(${upper(sig.pin)}, duty);`,'}');});
    lines.push('','} // namespace TechRib','','void setup() {','  Serial.begin(115200);','  Serial.println("TechRib: iniciando firmware gerado");');
    outs.forEach(p=>lines.push(`  pinMode(TechRib::${upper(p.pin)}, OUTPUT);`,`  TechRib::setOutput(TechRib::${upper(p.pin)}, false);`));
    ins.forEach(p=>lines.push(`  pinMode(TechRib::${upper(p.pin)}, ${/pullup/.test(p.mode)?'INPUT_PULLUP':/pulldown/.test(p.mode)?'INPUT_PULLDOWN':'INPUT'});`));
    (motion.drvs||[]).forEach(d=>{const en=d.pins?.EN,rst=d.pins?.RST,slp=d.pins?.SLP;if(en?.mode==='output')lines.push(`  TechRib::setOutput(TechRib::${upper(en.pin)}, false); // DRV8825 EN ativo em LOW`);if(rst?.mode==='output')lines.push(`  TechRib::setOutput(TechRib::${upper(rst.pin)}, true); // libera RESET`);if(slp?.mode==='output')lines.push(`  TechRib::setOutput(TechRib::${upper(slp.pin)}, true); // libera SLEEP`);});
    servoClassic.forEach((d,i)=>{const sig=d.pins?.SIG;if(sig)lines.push(`  TechRib::servo_${ident(d.id||String(i))}.attach(TechRib::${upper(sig.pin)});`)});
    servoEsp32.forEach((d,i)=>{const sig=d.pins?.SIG;if(!sig)return;const n=ident(d.id||String(i));lines.push(`  ledcAttach(TechRib::${upper(sig.pin)}, 50, 16); // servo 50 Hz • Arduino-ESP32 3.x`,`  TechRib::servo_${n}_write(90); // posição inicial segura`);});
    lcds.forEach((lcd,i)=>{const id=`tr_lcd_${i+1}`,cols=Math.max(1,Number(lcd.columns)||16),rows=Math.max(1,Number(lcd.rows)||2),blank=' '.repeat(cols),initial=lcd.mode==='gpio-state'?[lcd.line1Off,lcd.line2Off]:lcd.mode==='dual-gpio-state'?[lcd.line1,lcd.line2Off,lcd.line3Off,lcd.line4]:[lcd.line1,lcd.line2,lcd.line3,lcd.line4];lines.push(`  ${id}.begin(${cols}, ${rows});`);for(let row=0;row<rows;row++){lines.push(`  ${id}.setCursor(0, ${row}); ${id}.print(${cppString(blank)});`,`  ${id}.setCursor(0, ${row}); ${id}.print(${cppString(initial[row]||'')});`)}});
    lines.push('}','', 'void loop() {');
    if(analogs.length)lines.push('  TechRib::sampleAnalogInputs();');
    rules.supported.forEach(x=>{
      if(x.type==='toggle')lines.push(`  // TechRib: ${x.input.pin} alterna ${x.output.pin}`,`  if (TechRib::pressed(TechRib::in_${ident(x.input.pin)}, TechRib::${upper(x.input.pin)}, ${x.active?'HIGH':'LOW'})) {`,`    TechRib::setOutput(TechRib::${upper(x.output.pin)}, !TechRib::outputState(TechRib::${upper(x.output.pin)}));`,'  }');
      else if(x.type==='set-reset')lines.push(`  // TechRib: SET ${x.set.pin} / RESET ${x.reset.pin} controla ${x.output.pin}`,`  if (TechRib::pressed(TechRib::in_${ident(x.set.pin)}, TechRib::${upper(x.set.pin)}, ${x.setActive?'HIGH':'LOW'})) {`,`    TechRib::setOutput(TechRib::${upper(x.output.pin)}, true);`,'  }',`  if (TechRib::pressed(TechRib::in_${ident(x.reset.pin)}, TechRib::${upper(x.reset.pin)}, ${x.resetActive?'HIGH':'LOW'})) {`,`    TechRib::setOutput(TechRib::${upper(x.output.pin)}, false);`,'  }');
      else if(x.type==='analog-hysteresis'){const value=`tr_analog_${x.i}`;if(x.sensor==='lm35')lines.push(`  // TechRib: LM35 ${x.input.pin} • liga ${x.output.pin} em ${x.onAt} °C e desliga em ${x.offAt} °C`,`  const float ${value} = (TechRib::analogValue(${upper(x.input.pin)}) * (${esp32?'3.3f / 4095.0f':'5.0f / 1023.0f'})) * 100.0f; // LM35 = 10 mV/°C`);else lines.push(`  const float ${value} = TechRib::analogValue(${upper(x.input.pin)});`);const onState=x.activeHigh?'true':'false',offState=x.activeHigh?'false':'true';lines.push(`  if (!TechRib::outputState(TechRib::${upper(x.output.pin)}) && ${value} >= ${x.onAt.toFixed(1)}f) TechRib::setOutput(TechRib::${upper(x.output.pin)}, ${onState});`,`  else if (TechRib::outputState(TechRib::${upper(x.output.pin)}) && ${value} <= ${x.offAt.toFixed(1)}f) TechRib::setOutput(TechRib::${upper(x.output.pin)}, ${offState});`);}
    });
    if(!rules.supported.length)lines.push('  // Nenhuma regra automática suportada foi encontrada.');
    lcds.forEach((lcd,i)=>{const id=`tr_lcd_${i+1}`,cols=Math.max(1,Number(lcd.columns)||16),blank=' '.repeat(cols);if(lcd.mode==='gpio-state'&&Number.isInteger(lcd.statusNumber)){const state=`tr_lcd_state_${i+1}`,last=`tr_lcd_last_${i+1}`,active=lcd.statusActive==='LOW'?'LOW':'HIGH';lines.push(`  const bool ${state} = digitalRead(${lcd.statusNumber}) == ${active};`,`  static int8_t ${last} = -1;`,`  if (${last} != (${state} ? 1 : 0)) {`,`    ${id}.setCursor(0, 0); ${id}.print(${cppString(blank)});`,`    ${id}.setCursor(0, 0); ${id}.print(${state} ? ${cppString(lcd.line1On)} : ${cppString(lcd.line1Off)});`,`    ${id}.setCursor(0, 1); ${id}.print(${cppString(blank)});`,`    ${id}.setCursor(0, 1); ${id}.print(${state} ? ${cppString(lcd.line2On)} : ${cppString(lcd.line2Off)});`,`    ${last} = ${state} ? 1 : 0;`,'  }')}else if(lcd.mode==='dual-gpio-state'&&Number.isInteger(lcd.statusNumber1)&&Number.isInteger(lcd.statusNumber2)){const s1=`tr_lcd_state1_${i+1}`,s2=`tr_lcd_state2_${i+1}`,last=`tr_lcd_last_${i+1}`,a1=lcd.statusActive1==='LOW'?'LOW':'HIGH',a2=lcd.statusActive2==='LOW'?'LOW':'HIGH',mask=`tr_lcd_mask_${i+1}`;lines.push(`  const bool ${s1} = digitalRead(${lcd.statusNumber1}) == ${a1};`,`  const bool ${s2} = digitalRead(${lcd.statusNumber2}) == ${a2};`,`  const uint8_t ${mask} = (${s1} ? 1 : 0) | (${s2} ? 2 : 0);`,`  static int8_t ${last} = -1;`,`  if (${last} != ${mask}) {`,`    ${id}.setCursor(0, 1); ${id}.print(${cppString(blank)});`,`    ${id}.setCursor(0, 1); ${id}.print(${s1} ? ${cppString(lcd.line2On)} : ${cppString(lcd.line2Off)});`,`    ${id}.setCursor(0, 2); ${id}.print(${cppString(blank)});`,`    ${id}.setCursor(0, 2); ${id}.print(${s2} ? ${cppString(lcd.line3On)} : ${cppString(lcd.line3Off)});`,`    ${last} = ${mask};`,'  }')}});
    if((motion.drvs||[]).length)lines.push('  // DRV8825 detectado: use TechRib::step_<id>(sentido, passos) conforme a lógica da aplicação.');
    if(servoEsp32.length)lines.push('  // Servo(s) ESP32 detectado(s): use TechRib::servo_<id>_write(angulo_0_a_180).');
    if(rules.unsupported.length){lines.push('','  // TODO TechRib: regras ainda não automatizadas:');rules.unsupported.forEach(u=>lines.push(`  // - ${u.reason}`));}
    lines.push('  delay(5);','}',''); return{code:lines.join('\n'),ext:'ino',unsupported:rules.unsupported};
  }
  function esphome(a){
    const name=ident(a.controller?.dataset?.tag||'techrib_esp32'),transport=/^(?:i2c_|spi_|uart_|can_|rmii_|eth_|shift_|transport_)/,pins=a.pins.filter(p=>p.number!==null&&p.mode!=='unknown'&&!transport.test(String(p.mode||''))),rules=ruleSet(a),outs=pins.filter(p=>p.mode==='output'),ins=pins.filter(p=>p.mode!=='output');
    const outputId=p=>`out_${ident(p.pin)}`,inputId=p=>`in_${ident(p.pin)}`;
    const lines=['# Projeto gerado automaticamente pelo Simulador TechRib','# © 2026 TechRib. Todos os direitos reservados.','# Generator ID: TR-CODEGEN-20D','#','# Use secrets.yaml para wifi_ssid, wifi_password e api_encryption_key.','', 'esphome:',`  name: ${name}`,`  friendly_name: "${a.controller?.dataset?.tag||'TechRib ESP32'}"`,'','esp32:','  board: esp32dev','  framework:','    type: esp-idf','','logger:','','api:','  encryption:','    key: !secret api_encryption_key','','ota:','  - platform: esphome','','wifi:','  ssid: !secret wifi_ssid','  password: !secret wifi_password','  ap:',`    ssid: "${name}-fallback"`,'','captive_portal:'];
    if(outs.length){lines.push('','switch:');outs.forEach(p=>{lines.push('  - platform: gpio',`    id: ${outputId(p)}`,`    name: "${connLabel(p)||p.pin}"`,'    restore_mode: ALWAYS_OFF','    pin:',`      number: GPIO${p.number}`,`    # TechRib: ${p.pin} -> ${connLabel(p)}`);});}
    if(ins.length){lines.push('','binary_sensor:');ins.forEach(p=>{
      const toggle=rules.supported.find(r=>r.type==='toggle'&&r.input===p);
      const setRule=rules.supported.find(r=>r.type==='set-reset'&&r.set===p);
      const resetRule=rules.supported.find(r=>r.type==='set-reset'&&r.reset===p);
      const active=toggle?toggle.active:setRule?setRule.setActive:resetRule?resetRule.resetActive:null;
      lines.push('  - platform: gpio',`    id: ${inputId(p)}`,`    name: "${connLabel(p)||p.pin}"`,'    pin:',`      number: GPIO${p.number}`);
      if(/pullup/.test(p.mode))lines.push('      mode:','        input: true','        pullup: true');
      if(active===0)lines.push('      inverted: true');
      lines.push('    filters:','      - delayed_on: 20ms','      - delayed_off: 20ms');
      if(toggle)lines.push('    on_press:','      then:',`        - switch.toggle: ${outputId(toggle.output)}`);
      else if(setRule)lines.push('    on_press:','      then:',`        - switch.turn_on: ${outputId(setRule.output)}`);
      else if(resetRule)lines.push('    on_press:','      then:',`        - switch.turn_off: ${outputId(resetRule.output)}`);
      lines.push(`    # TechRib: ${p.pin} <- ${connLabel(p)}`);
    });}
    if(rules.unsupported.length){lines.push('','# TODO TechRib — regras não automatizadas:');rules.unsupported.forEach(u=>lines.push(`# - ${u.reason}`));}
    return{code:lines.join('\n')+'\n',ext:'yaml',unsupported:rules.unsupported};
  }
  return{version:VERSION,arduino,esphome,ruleSet};
});
