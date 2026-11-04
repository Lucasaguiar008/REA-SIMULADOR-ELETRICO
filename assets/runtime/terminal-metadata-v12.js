(function(root){
  'use strict';
  const DOMAINS=['logic','control','power','protective-earth'];
  const DIRECTIONS=['input','output','bidirectional','passive'];
  const create=({registryDefinition,normalizeVoltageClass}={})=>{
    if(typeof registryDefinition!=='function')throw new Error('TechRibTerminalMetadataRuntime: registryDefinition ausente');
    if(typeof normalizeVoltageClass!=='function')throw new Error('TechRibTerminalMetadataRuntime: normalizeVoltageClass ausente');
    const terminalMetadataEnums={domains:new Set(DOMAINS),directions:new Set(DIRECTIONS)};
    const registryDefinitionForTerminal=(terminal)=>{const component=terminal?.closest?.('.placed-component'),definition=component?registryDefinition(component):null,name=terminal?.dataset?.terminal||'';return definition?.terminals?.[name]||null};
    const infer=(terminal)=>{
      const component=terminal?.closest?.('.placed-component'),name=String(terminal?.dataset?.terminal||'T').trim(),upper=name.toUpperCase(),def=registryDefinitionForTerminal(terminal)||{},type=String(component?.dataset?.type||'').toLowerCase(),family=String(component?.dataset?.techFamily||'').toLowerCase(),behavior=String(registryDefinition(component)?.behavior?.type||'').toLowerCase(),legacyType=String(def.type||terminal?.dataset?.terminalRole||'').toLowerCase(),legacyDomain=String(def.domain||terminal?.dataset?.electricalDomain||'').toLowerCase();
      let domain='',fn='',voltageClass='',direction='passive';
      domain=String(terminal?.dataset?.terminalDomain||def.domain||'').toLowerCase();
      fn=String(terminal?.dataset?.terminalFunction||def.function||'').toLowerCase();
      voltageClass=normalizeVoltageClass(terminal?.dataset?.terminalVoltageClass||def.voltageClass||def.logicVoltage||def.nominalVoltage||'');
      direction=String(terminal?.dataset?.terminalDirection||def.direction||'').toLowerCase();
      // 17A2 — PE is a semantic identity, not an operational voltage domain.
      // Some legacy/loaded terminals can reach this layer with stale domain data;
      // canonical PE names/functions always win so diagnostic never treats them as control/power.
      const peHint=/^(?:PE(?:\d+)?|TERRA|GND-PE)$/i.test(upper)||fn==='protective-earth'||/protective-earth|earth-reference|earth-bus/.test(`${legacyType} ${legacyDomain} ${behavior}`);
      if(peHint){domain='protective-earth';fn='protective-earth';voltageClass=voltageClass||'pe';direction='passive'}
      const electronic=/microcontroller|relay-module|mosfet|transistor|optocoupler|driver|logic|sensor|multiplexer|visual-module/.test(behavior)||/(esp32|esp8266|arduino|stm32|raspberry|relay-1ch|modulo-rele|sensor|mosfet|74hc|cd74|driver|display)/.test(type);
      const residentialSwitch=/^(?:resid-interruptor-simples|resid-three-way|resid-four-way)$/.test(type);
      // Interruptores residenciais são contatos mecânicos secos e podem conduzir a tensão da rede.
      // Esta regra também corrige projetos antigos que salvaram OUT/V1/V2 como bornes lógicos.
      if(residentialSwitch){domain='control';fn='dry-contact';voltageClass='';direction='passive'}
      if(!domain||!terminalMetadataEnums.domains.has(domain)){
        if(upper==='PE'||/protective-earth|earth|ground-protect/.test(`${legacyType} ${legacyDomain}`))domain='protective-earth';
        else if(/^(COM|COM\d+|NO|NO\d+|NC|NC\d+)$/.test(upper)||/dry-contact|relay-common|relay-no|relay-nc/.test(legacyType))domain='control';
        else if((upper==='A1'||upper==='A2')&&!electronic||/coil|control|contact-no|contact-nc/.test(legacyType)||family==='comando')domain='control';
        else if(electronic&&/^(?:VCC|VDD|VSS|GND|3V3|3\.3V|5V|\+5V|VIN)$/.test(upper))domain='logic';
        else if(/^(L|F|L[123]|T[123]|U1?|V1?|W1?)$/.test(upper)||/power-input|power-output|motor-winding|mains/.test(legacyType)||family==='carga')domain='power';
        else if(electronic||/gpio|logic|digital|analog|signal/.test(legacyType)||/^(GPIO\d*|IO\d+|IN\d*|OUT\d*|VCC|VDD|VSS|GND|3V3|3\.3V|5V|\+5V|SDA|SCL|TX|RX|MISO|MOSI|SCK|CLK|ADC\d*|DAC\d*)$/.test(upper))domain='logic';
        else domain='control';
      }
      if(!fn){
        if(/^GPIO\d*$/.test(upper)||legacyType==='gpio')fn='digital-io';
        else if(/^(IN\d*|INPUT\d*)$/.test(upper)||legacyType==='logic-input')fn='digital-input';
        else if(/^(OUT\d*|OUTPUT\d*)$/.test(upper)||legacyType==='logic-output')fn='digital-output';
        else if(/^(VCC|VDD|3V3|3\.3V|5V|\+5V|VIN)$/.test(upper)&&domain==='logic')fn='logic-power';
        else if(/^(GND|VSS|0V)$/.test(upper)&&domain==='logic')fn='logic-ground';
        else if(upper==='PE')fn='protective-earth';
        else if(upper==='A1'||upper==='A2'||legacyType==='coil')fn='coil';
        else if(/^(L|F|L[123])$/.test(upper)||legacyType==='power-input')fn=component?.dataset?.type==='fonte-monofasica'?'power-output':'power-input';
        else if(/^T[123]$/.test(upper)||legacyType==='power-output')fn='power-output';
        else if(/^COM\d*$/.test(upper)||legacyType==='dry-contact')fn='relay-common';
        else if(/^NO\d*$/.test(upper)||legacyType==='dry-contact-no')fn='relay-no';
        else if(/^NC\d*$/.test(upper)||legacyType==='dry-contact-nc')fn='relay-nc';
        else if(/^ADC/.test(upper)||legacyType.includes('analog-input'))fn='analog-input';
        else if(/^DAC/.test(upper)||legacyType.includes('analog-output'))fn='analog-output';
        else fn=legacyType||'terminal';
      }
      if(!voltageClass){
        if(domain==='logic'){
          if(/^(VCC|5V|\+5V|VIN)$/.test(upper)&&(/relay-module/.test(behavior)||Number(def.nominalVoltage)===5||Number(def.voltage)===5))voltageClass='5v';
          else if(/^(3V3|3\.3V)$/.test(upper)||((/^GPIO\d*$/.test(upper)||def.type==='gpio')&&(/esp32|esp8266/.test(type)||Number(def.logicVoltage)===3.3)))voltageClass='3v3';
        }else if(fn==='coil'){
          const v=Number(component?.dataset?.coilRatedVoltage||0),ac=String(component?.dataset?.coilType||'AC').toUpperCase()==='AC';if(v)voltageClass=`${v}v${ac?'ac':'dc'}`;
        }
      }
      if(!direction||!terminalMetadataEnums.directions.has(direction)){
        if(/(?:input|power-input)$/.test(fn)||fn==='coil')direction='input';
        else if(/(?:output|power-output)$/.test(fn))direction='output';
        else if(fn==='digital-io'||fn==='analog-io')direction='bidirectional';
        else direction='passive';
      }
      return{id:String(def.id||terminal?.dataset?.terminalMetaId||name),name:String(def.name||terminal?.dataset?.terminalName||name),domain,function:fn,voltageClass,direction};
    };
    const apply=terminal=>{if(!terminal)return null;const meta=infer(terminal);terminal.dataset.terminalMetaId=meta.id;terminal.dataset.terminalName=meta.name;terminal.dataset.terminalDomain=meta.domain;terminal.dataset.terminalFunction=meta.function;terminal.dataset.terminalVoltageClass=meta.voltageClass||'';terminal.dataset.terminalDirection=meta.direction;terminal.techribTerminalMetadata=meta;return meta};
    const applyComponent=component=>{component?.querySelectorAll?.('[data-terminal]').forEach(apply);return component};
    const get=terminal=>terminal?.techribTerminalMetadata||apply(terminal);
    return Object.freeze({get,apply,applyComponent,infer,registryDefinitionForTerminal,domains:[...DOMAINS],directions:[...DIRECTIONS]});
  };
  root.TechRibTerminalMetadataRuntime=Object.freeze({create,domains:[...DOMAINS],directions:[...DIRECTIONS]});
})(typeof window!=='undefined'?window:globalThis);
