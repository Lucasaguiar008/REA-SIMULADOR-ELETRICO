/* TechRib IoT Cloud — IR operacional de topologia e lógica local.
 * Não transporta credenciais, tokens de ativação nem comandos de dispositivos.
 * Entrada: resultado de TechRibCodeGenerator.analyze(controller, 'espidf').
 * Contrato Cloud: usar catálogo da versão instalada, nunca assumir drivers.
 */
(function(root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.TechRibCloudIRV2 = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';
  const VERSION = '2.2.0';
  let DEFAULT_CAPABILITIES=null;
  if(typeof require==='function')try{DEFAULT_CAPABILITIES=require('./techrib-cloud-capabilities-v1.json');}catch{}
  const allowedModes = new Set(['output', 'input', 'input_pullup', 'input_pulldown', 'analog-input', 'analog-output', 'i2c_sda', 'i2c_scl']);
  const asString = x => String(x == null ? '' : x).trim();
  const field = (v, key) => asString(v && v.dataset && v.dataset[key]);
  const numberOrNull = x => (typeof x === 'number' && Number.isInteger(x) && x >= 0) ? x : null;
  const isObject = x => !!x && typeof x === 'object' && !Array.isArray(x);
  const code = s => asString(s).replace(/[^a-zA-Z0-9_.-]/g, '_').slice(0, 64);
  const h32 = value => {
    let h = 2166136261;
    for (let i = 0; i < value.length; i++) {
      h ^= value.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(16).padStart(8, '0');
  };
  const sort = (a, b) => a.localeCompare(b, 'en');
  const loc = component => ({ id: field(component, 'componentId'), type: field(component, 'registryId') || field(component, 'type') });
  const term = t => {
    const m = t && t.meta || {}, el = t && t.el || null, c = t && t.component || null;
    return {
      componentId: field(c, 'componentId'),
      componentType: field(c, 'registryId') || field(c, 'type'),
      terminal: asString(m.name) || field(el, 'terminal') || field(el, 'terminalMetaId'),
      domain: asString(m.domain).toLowerCase(),
      function: asString(m.function).toLowerCase(),
      voltageClass: asString(m.voltageClass).toLowerCase(),
      direction: asString(m.direction).toLowerCase()
    };
  };
  const STRUCTURAL_CODES = new Set(['NO_CONTROLLER','CONTROLLER_NO_ID','CATALOG_NOT_LOADED','TERMINAL_NO_ID','NET_HASH_COLLISION','COMPONENT_NO_ID','DUPLICATE_COMPONENT_ID','GPIO_NO_NET','GPIO_INVALID','GPIO_MODE_UNKNOWN','GPIO_CONFLICT','MANIFEST_COMPONENT_LIMIT']);
  const PENDING_CODES = new Set(['MCP23017_CLOUD_DRIVER_UNAVAILABLE','PERIPHERAL_CLOUD_DRIVER_UNAVAILABLE','LOGIC_RULE_UNSUPPORTED','LOGIC_PROGRAM_VERSION_UNSUPPORTED']);
  const issue = (out, level, codeValue, message, ref, category) => {
    const obj = {level, code: codeValue, message, category:category||(STRUCTURAL_CODES.has(codeValue)?'structural':PENDING_CODES.has(codeValue)?'pending':'hardware')};
    if (ref) obj.ref = ref;
    out.issues.push(obj);
  };
  const normalizedType = (definition, selected) => {
    const possible = asString(selected);
    return possible && Object.prototype.hasOwnProperty.call(definition, possible) ? possible : null;
  };
  // Uma classe "configuravel" ou "contato seco" nao e uma tensao medida.
  // A compatibilidade exige roles adequados dos bornes; nenhuma tolerancia
  // e inferida pela posicao dos desenhos ou por nomes comerciais.
  const isGroundReference = t => t.voltageClass === '0v' &&
    ['logic-ground','ground','power-ground','protective-ground'].includes(t.function);
  const groundReturnNetwork = terms => {
    if (!terms.some(isGroundReference)) return false;
    return terms.every(t =>
      isGroundReference(t) ||
      (t.voltageClass === '0v' && t.function === 'measurement-reference') ||
      (t.voltageClass === 'measurement-dc' && t.function === 'measurement-reference' && t.direction === 'passive') ||
      (t.voltageClass === 'dry-contact' && t.function === 'dry-contact' && t.direction === 'bidirectional') ||
      (t.voltageClass === 'configurable-dc' && t.function === 'switching-terminal' && t.direction === 'passive') ||
      (t.voltageClass === 'configurable-logic' && t.function === 'opto-input' && t.direction === 'input' && t.terminal.toUpperCase()==='K') ||
      (t.voltageClass === 'configurable-logic' && t.function === 'opto-output' && t.direction === 'passive' && t.terminal.toUpperCase()==='E')
    );
  };
  const logicContactNetwork = terms => {
    const classes = new Set(terms.map(t=>t.voltageClass));
    if (!classes.has('3v3') || classes.size < 2 ||
        [...classes].some(v=>!['3v3','dry-contact','configurable-logic'].includes(v))) return false;
    return terms.every(t=>
      (t.voltageClass==='3v3' && t.domain==='logic' && t.function==='digital-io') ||
      (t.voltageClass==='dry-contact' && t.function==='dry-contact' && t.direction==='bidirectional') ||
      (t.voltageClass==='configurable-logic' && ['control-input','digital-input'].includes(t.function) && t.direction==='input') ||
      (t.voltageClass==='configurable-logic' && t.function==='opto-output' && (t.direction==='output'||(t.direction==='passive'&&t.terminal.toUpperCase()==='E')))
    );
  };
  const driverClampSupplyNetwork = terms => {
    const classes=new Set(terms.map(t=>t.voltageClass));
    if(!classes.has('5v')||!classes.has('configurable-dc')||[...classes].some(v=>!['5v','configurable-dc','dry-contact'].includes(v)))return false;
    return terms.every(t=>
      (t.voltageClass==='5v' && ['logic-power-input','logic-power-output','logic-power'].includes(t.function)) ||
      (t.voltageClass==='configurable-dc' && t.function==='driver-common' && t.direction==='passive') ||
      (t.voltageClass==='dry-contact' && t.function==='dry-contact' && t.direction==='bidirectional')
    );
  };
  const optoCollectorSupplyNetwork = terms => {
    const classes=new Set(terms.map(t=>t.voltageClass));
    if(classes.size!==2||!classes.has('3v3')||!classes.has('configurable-logic'))return false;
    return terms.every(t=>
      (t.voltageClass==='3v3' && ['logic-power-input','logic-power-output','logic-power'].includes(t.function)) ||
      (t.voltageClass==='configurable-logic' && t.function==='opto-output' && t.direction==='output' && t.terminal.toUpperCase()==='C')
    );
  };
  // PC817 configurado como seguidor de emissor: C ligado a 3V3 do próprio
  // controlador; E em um único GPIO. O pull-down INTERNO será configurado
  // pelo firmware apenas se a rede e o perfil da placa forem comprovados.
  const pc817EmitterValidated = (nets, id, binding, cid) => {
    const signal=nets.find(n=>n.id===binding.netId);
    if (!signal || signal.terminals.length!==2 ||
        !signal.terminals.some(t=>t.componentId===id && t.terminal.toUpperCase()==='E' && t.function==='opto-output') ||
        !signal.terminals.some(t=>t.componentId===cid && t.terminal.toUpperCase()===binding.pin.toUpperCase() && t.domain==='logic' && t.function==='digital-io' && t.voltageClass==='3v3'))return false;
    return nets.some(n=>n.terminals.some(t=>t.componentId===id && t.terminal.toUpperCase()==='C' && t.function==='opto-output') &&
      n.terminals.some(t=>t.componentId===cid && t.voltageClass==='3v3' && t.function==='logic-power-output' && t.domain==='logic') &&
      n.terminals.every(t=>(t.componentId===cid && t.voltageClass==='3v3' && t.function==='logic-power-output') ||
        (t.terminal.toUpperCase()==='C' && t.function==='opto-output' && t.voltageClass==='configurable-logic')));
  };
  const typeFromHardware = (sourceType, bindings, catalog) => {
    if (!bindings.length) return null;
    const modes = bindings.map(b=>b.mode);
    if (sourceType==='botoeira-liga-tatil-2p' && modes.every(m=>m==='input'||m==='input_pullup'))
      return Object.prototype.hasOwnProperty.call(catalog,'binary_sensor')?'binary_sensor':null;
    if (sourceType==='elec-mosfet-irlz44n' && modes.every(m=>m==='output'))
      return Object.prototype.hasOwnProperty.call(catalog,'switch')?'switch':null;
    return null;
  };
  const interfaceChannelType = (sourceType, binding, catalog) => {
    const terminal=asString(binding&&binding.terminal).toUpperCase();
    if(sourceType==='elec-uln2003ag' && /^IN[1-7]$/.test(terminal) && binding.mode==='output')
      return Object.prototype.hasOwnProperty.call(catalog,'switch')?'switch':null;
    if(['elec-pc817','opto-pc817'].includes(sourceType) && terminal==='C' && ['input','input_pullup'].includes(binding.mode))
      return Object.prototype.hasOwnProperty.call(catalog,'binary_sensor')?'binary_sensor':null;
    return null;
  };
  const intAddress = raw => {
    if (typeof raw === 'number' && Number.isInteger(raw)) return raw;
    const s = asString(raw);
    if (/^0x[\da-f]+$/i.test(s)) return parseInt(s.slice(2), 16);
    if (/^\d+$/.test(s)) return Number(s);
    return null;
  };
  const familyFromType = type => {
    const value=asString(type).toLowerCase().replace(/_/g,'-');
    for(const family of ['esp32-c61','esp32-s31','esp32-s3','esp32-s2','esp32-c6','esp32-c5','esp32-c3','esp32-h2','esp32-p4'])
      if(value.includes(family)||value.includes(family.replace('-','')))return family;
    return value.includes('esp32')?'esp32':null;
  };
  const boardProfile = (type, capabilities) => {
    const caps=capabilities||DEFAULT_CAPABILITIES||((typeof globalThis!=='undefined')?globalThis.TechRibCloudCapabilitiesV1:null);
    if(!caps||!isObject(caps.families))return null;
    const value=asString(type).toLowerCase(),override=caps.boardOverrides&&caps.boardOverrides[value];
    const family=override?.family||familyFromType(value),base=family&&caps.families[family];
    if(!base)return null;
    return {id:override?.id||value.replace(/^board-/,'')||family,label:override?.label||base.label,family,
      idfTarget:base.target,flashMb:override?.flash||base.flash||4,pwmChannels:base.pwm||0,input:base.input||[],output:base.output||[],
      noPull:override?.noPull||base.noPull||[],hard:{...(base.hard||{}),...(override?.hard||{})},warn:{...(base.warn||{}),...(override?.warn||{})},aliases:override?.aliases||{},console:override?.console||'uart',
      wifi:base.wifi===true,ble:base.ble===true,runtime:base.runtime||'diagnostic',limitation:base.limitation||null};
  };
  function validateBoardPins(out,profile){
    if(!profile)return;
    for(const pin of out.gpio){
      if(pin.number===null)continue;
      const reason=profile.hard[pin.number];
      if(reason){issue(out,'error','BOARD_GPIO_RESERVED',`${profile.label}: GPIO${pin.number} está reservado para ${reason}; o recurso será desativado.`,pin.pin);continue;}
      const output=pin.mode==='output'||pin.mode==='analog-output';
      const allowed=output?profile.output:profile.input;
      if(!allowed.includes(pin.number)){issue(out,'error','BOARD_GPIO_UNAVAILABLE',`${profile.label}: GPIO${pin.number} não está disponível para ${output?'saída':'entrada'}; o recurso será desativado.`,pin.pin);continue;}
      if(profile.noPull.includes(pin.number)&&['input_pullup','input_pulldown'].includes(pin.mode))issue(out,'error','BOARD_GPIO_NO_INTERNAL_PULL',`${profile.label}: GPIO${pin.number} não oferece o resistor interno solicitado.`,pin.pin);
      if(profile.warn[pin.number])issue(out,'warning','BOARD_GPIO_SHARED',`${profile.label}: GPIO${pin.number} também atende ${profile.warn[pin.number]}.`,pin.pin);
    }
  }
  const gpioName = value => {
    const raw=asString(isObject(value)?value.pin:value).toUpperCase();
    const match=/^(?:GPIO)?(\d{1,2})$/.exec(raw);
    return match ? `GPIO${Number(match[1])}` : null;
  };
  function translateLogic(analysis,out,cid){
    const program=isObject(analysis.program)?analysis.program:{};
    const rules=Array.isArray(program.rules)?program.rules:[];
    out.logic_program={version:3,rules:[]};
    out.logicRuleCount=rules.length;
    if(!rules.length)return;
    const missingVersion=program.version===undefined||program.version===null||asString(program.version)==='';
    const legacyRuleCompatible=raw=>{
      const type=asString(raw&&raw.type).toLowerCase();
      if(type==='toggle')return !!(raw&&raw.trigger&&raw.output);
      if(type==='set-reset')return !!(raw&&((raw.set&&raw.set.pin)||raw.setPin)&&((raw.reset&&raw.reset.pin)||raw.resetPin)&&raw.output);
      return false;
    };
    const legacyCompatible=missingVersion&&rules.every(legacyRuleCompatible);
    if(Number(program.version)!==3&&!legacyCompatible){
      issue(out,'error','LOGIC_PROGRAM_VERSION_UNSUPPORTED',`Versão lógica ${asString(program.version)||'ausente'} incompatível; esperado version 3.`,cid);
      if(missingVersion)rules.forEach((raw,index)=>{
        const type=asString(raw&&raw.type).toLowerCase();
        issue(out,'error',type&&['toggle','set-reset'].includes(type)?'LOGIC_RULE_INVALID':'LOGIC_RULE_UNSUPPORTED',`Regra ${index+1}: estrutura ${type||'sem tipo'} não é compatível com o programa lógico legado v3.`,cid);
      });
      return;
    }
    const pins=new Map(out.gpio.flatMap(p=>[[p.pin.toUpperCase(),p],[`GPIO${p.number}`,p]]));
    const resolve=(value,role,index)=>{
      const rawName=asString(isObject(value)?value.pin:value).toUpperCase();
      const alias=out.controller?.pinAliases?.[rawName];
      const name=Number.isInteger(alias)?`GPIO${alias}`:gpioName(value);
      const pin=name&&pins.get(name);
      if(!pin)issue(out,'error','LOGIC_PIN_NOT_FOUND',`Regra ${index+1}: ${role} ${name||asString(value)||'ausente'} não existe na topologia.`,cid);
      return pin||null;
    };
    const digitalInput=(pin,index)=>{
      if(pin&&!['input','input_pullup','input_pulldown'].includes(pin.mode))issue(out,'error','LOGIC_TRIGGER_MODE',`Regra ${index+1}: ${pin.pin} deve ser entrada digital, mas está como ${pin.mode}.`,pin.pin);
      return !!pin&&['input','input_pullup','input_pulldown'].includes(pin.mode);
    };
    const digitalOutput=(pin,index)=>{
      if(pin&&pin.mode!=='output')issue(out,'error','LOGIC_OUTPUT_MODE',`Regra ${index+1}: ${pin.pin} deve ser saída digital, mas está como ${pin.mode}.`,pin.pin);
      return !!pin&&pin.mode==='output';
    };
    const memories=new Set();
    rules.forEach((raw,index)=>{
      const type=asString(raw&&raw.type).toLowerCase();
      const debounce=Math.max(5,Math.min(500,Number(raw&&raw.debounce_ms)||35));
      const output=resolve(raw&&raw.output,'saída',index);
      if(type==='toggle'){
        const trigger=resolve(raw&&raw.trigger,'entrada',index);
        const inputOk=digitalInput(trigger,index),outputOk=digitalOutput(output,index);
        if(!inputOk||!outputOk)return;
        const memory=code(raw.memory||`toggle_${output.number}`);
        if(!memory||memories.has(memory)){issue(out,'error','LOGIC_MEMORY_CONFLICT',`Regra ${index+1}: memória lógica duplicada ou inválida.`,cid);return;}
        memories.add(memory);
        out.logic_program.rules.push({id:`rule_${index+1}`,type,trigger:{gpio:trigger.number,active:asString(raw.trigger&&raw.trigger.active).toUpperCase()==='HIGH'?'HIGH':'LOW'},output:{gpio:output.number},memory,debounce_ms:debounce});
        return;
      }
      if(type==='set-reset'){
        const set=resolve(raw&&((raw.set&&raw.set.pin)||raw.setPin),'entrada SET',index);
        const reset=resolve(raw&&((raw.reset&&raw.reset.pin)||raw.resetPin),'entrada RESET',index);
        const setOk=digitalInput(set,index),resetOk=digitalInput(reset,index),outputOk=digitalOutput(output,index);
        if(!setOk||!resetOk||!outputOk)return;
        const memory=code(raw.memory||`set_reset_${output.number}`);
        if(!memory||memories.has(memory)){issue(out,'error','LOGIC_MEMORY_CONFLICT',`Regra ${index+1}: memória lógica duplicada ou inválida.`,cid);return;}
        memories.add(memory);
        out.logic_program.rules.push({id:`rule_${index+1}`,type,set:{gpio:set.number,active:asString(raw.set&&raw.set.active).toUpperCase()==='HIGH'?'HIGH':'LOW'},reset:{gpio:reset.number,active:asString(raw.reset&&raw.reset.active).toUpperCase()==='HIGH'?'HIGH':'LOW'},output:{gpio:output.number},memory,debounce_ms:debounce});
        return;
      }
      issue(out,'error','LOGIC_RULE_UNSUPPORTED',`Regra ${index+1}: tipo ${type||'ausente'} ainda não possui tradução ESP-IDF segura.`,cid);
    });
  }
  function build(analysis, config = {}) {
    const catalog = config.catalog && config.catalog.types ? config.catalog.types : (config.catalog || {});
    const mappings = config.mappings || {};
    const out = {
      kind: 'techrib.cloud.topology-ir', version: VERSION,
      contract: asString(config.contract || 'techrib.capabilities'),
      contract_version: asString(config.contractVersion || '2.0.0'),
      readyForFirmware: false,
      controller: null, nets: [], gpio: [], buses: [], peripherals: [], components: [], issues: []
    };
    if (!analysis || !analysis.controller) {
      issue(out, 'error', 'NO_CONTROLLER', 'Nenhum controlador selecionado.');
      out.blocking = true;
      return out;
    }
    const cid = field(analysis.controller, 'componentId');
    const capabilities=config.capabilities||DEFAULT_CAPABILITIES||((typeof globalThis!=='undefined')?globalThis.TechRibCloudCapabilitiesV1:null);
    const controllerLoc=loc(analysis.controller),profile=boardProfile(controllerLoc.type,capabilities),reportedTarget=asString(analysis.profile && analysis.profile.idfTarget);
    out.controller = {...controllerLoc,idfTarget:profile?.idfTarget||reportedTarget,boardProfile:profile?.id||null,family:profile?.family||null,flashMb:profile?.flashMb||null,pwmChannels:profile?.pwmChannels||null,pinAliases:profile?.aliases||{}};
    if(!profile)issue(out,'error','CONTROLLER_VARIANT_UNSUPPORTED',`${controllerLoc.type||'Controlador'}: família ESP32 não encontrada no registro de capacidades.`,controllerLoc.type,'structural');
    else if(reportedTarget&&reportedTarget!==profile.idfTarget)issue(out,'error','IDF_TARGET_MISMATCH',`${profile.label}: o analisador informou ${reportedTarget}, mas o target obrigatório é ${profile.idfTarget}.`,controllerLoc.type);
    if(profile?.runtime!=='cloud')issue(out,'warning','FAMILY_RUNTIME_PENDING',`${profile.label}: ${profile.limitation||'runtime Cloud ainda não homologado'} O ZIP será diagnóstico e não anunciará componentes.`,controllerLoc.type,'pending');
    if (!cid) issue(out, 'error', 'CONTROLLER_NO_ID', 'O controlador não possui componentId estável.');
    if (!Object.keys(catalog).length) issue(out, 'error', 'CATALOG_NOT_LOADED', 'Catálogo TechRib Cloud indisponível; classificação bloqueada.');
    const byNetObj = new Map(), byNetKey = new Map(), usedNetIds = new Map();
    for (const n of analysis.nets || []) {
      if (!n || !Array.isArray(n.terminals)) continue;
      const seenTerminal = new Set(), terms = [];
      for (const item of n.terminals) {
        const t = term(item), key = `${t.componentId}\u0000${t.terminal}`;
        if (!t.componentId || !t.terminal) {
          issue(out, 'error', 'TERMINAL_NO_ID', 'Borne sem identidade estável na rede.');
          continue;
        }
        if (seenTerminal.has(key)) continue;
        seenTerminal.add(key);
        terms.push(t);
      }
      terms.sort((a,b) => sort(a.componentId + ':' + a.terminal, b.componentId + ':' + b.terminal));
      // O analisador retorna redes de TODA a prancha. Usar apenas redes do controlador selecionado.
      if (!terms.some(t => t.componentId === cid)) continue;
      const signature = terms.map(t => `${t.componentId.length}:${t.componentId}|${t.terminal.length}:${t.terminal}`).join(';');
      const id = 'net_' + h32(signature);
      if (usedNetIds.has(id) && usedNetIds.get(id) !== signature) issue(out, 'error', 'NET_HASH_COLLISION', 'Conflito entre identificadores de redes.');
      usedNetIds.set(id, signature);
      const domains = [...new Set(terms.map(t => t.domain).filter(Boolean))].sort(sort);
      const voltages = [...new Set(terms.map(t => t.voltageClass).filter(Boolean))].sort(sort);
      const groundReturn=groundReturnNetwork(terms);
      const logicContact=logicContactNetwork(terms);
      const clampSupply=driverClampSupplyNetwork(terms);
      const optoCollectorSupply=optoCollectorSupplyNetwork(terms);
      if (domains.includes('power') && domains.includes('logic') && !groundReturn)
        issue(out, 'error', 'MIXED_POWER_LOGIC', 'Rede mistura domínios POWER e LOGIC fora de uma referência de retorno validada.', id);
      if (voltages.length > 1 && !groundReturn && !logicContact && !clampSupply && !optoCollectorSupply)
        issue(out, 'error', 'VOLTAGE_CONFLICT', 'Rede contém classes de tensão incompatíveis ou não verificadas: ' + voltages.join(', '), id);
      const obj = {id, terminals:terms, domains, voltageClasses:voltages};
      out.nets.push(obj);
      byNetObj.set(n, id);
      if (n.id != null) byNetKey.set(String(n.id), id);
    }
    out.nets.sort((a,b) => sort(a.id,b.id));
    const pinSeen = new Map();
    const candidates = new Map();
    const ensureCandidate = c => {
      if (!c || c === analysis.controller) return null;
      const id = field(c, 'componentId');
      if (!id) { issue(out, 'error', 'COMPONENT_NO_ID', 'Componente conectado sem componentId estável.'); return null; }
      if (!candidates.has(id)) candidates.set(id, {ref:loc(c), label:field(c,'tag') || field(c,'label') || id, node:c, pins:new Map(), terminalNames:new Set()});
      else if (candidates.get(id).node !== c) issue(out, 'error', 'DUPLICATE_COMPONENT_ID', 'Dois componentes diferentes usam o ID ' + id, id);
      return candidates.get(id);
    };
    for (const p of analysis.pins || []) {
      if (!p) continue;
      const pin=asString(p.pin), alias=profile?.aliases?.[pin.toUpperCase()];
      const number=Number.isInteger(alias)?alias:numberOrNull(p.number), mode=asString(p.mode).toLowerCase();
      const netId = byNetObj.get(p.net) || byNetKey.get(String(p.net && p.net.id || '')) || null;
      if (!netId) issue(out, 'error', 'GPIO_NO_NET', `${pin || 'GPIO'}: rede não identificada na topologia.`, pin);
      if (number === null) issue(out, 'error', 'GPIO_INVALID', `${pin || 'GPIO'}: número físico inválido.`, pin);
      if (!allowedModes.has(mode)) issue(out, 'error', 'GPIO_MODE_UNKNOWN', `${pin || 'GPIO'}: modo ${mode || 'desconhecido'} não validado.`, pin);
      if (number !== null && pinSeen.has(number) && pinSeen.get(number) !== netId)
        issue(out, 'error', 'GPIO_CONFLICT', `GPIO${number} ligado a redes diferentes.`, pin);
      if (number !== null) pinSeen.set(number, netId);
      out.gpio.push({pin, number, mode, netId, confidence:asString(p.confidence), terminal:term({component:analysis.controller, meta:p.meta, el:p.terminal})});
      const terms = out.nets.find(n => n.id === netId)?.terminals || [];
      const connectedIds = new Set(terms.map(t => t.componentId).filter(x=>x!==cid));
      // p.others inclui destinos atrás de pontes semânticas (ex.: resistor).
      // Não inventar vinculação física: só candidatos com componentId na rede elétrica real.
      for (const o of p.others || []) {
        const obj = ensureCandidate(o.component);
        if (!obj) continue;
        if (!connectedIds.has(obj.ref.id)) {
          issue(out,'warning','SEMANTIC_BRIDGE',`O destino ${obj.ref.id} está atrás de uma ponte semântica; a ligação direta deve ser confirmada.`,obj.ref.id);
          continue;
        }
        const k = `${pin}:${number}:${netId}:${asString(o.meta && o.meta.name)}`;
        obj.pins.set(k,{gpio:number, pin, mode, netId, terminal:asString(o.meta && o.meta.name)});
        obj.terminalNames.add(asString(o.meta && o.meta.name));
      }
      // A rede contém componentes que não foram inferidos como 'others'; não escondê-los.
      for (const nt of terms) {
        if (nt.componentId === cid) continue;
        const original = (p.net && p.net.terminals || []).find(t => field(t.component,'componentId')===nt.componentId);
        const obj = original && ensureCandidate(original.component);
        if (!obj) continue;
        const k = `${pin}:${number}:${netId}:${nt.terminal}`;
        obj.pins.set(k,{gpio:number,pin,mode,netId,terminal:nt.terminal});
        obj.terminalNames.add(nt.terminal);
      }
    }
    out.gpio.sort((a,b) => (a.number??9999)-(b.number??9999) || sort(a.pin,b.pin));
    validateBoardPins(out,profile);
    for (const [id, raw] of [...candidates.entries()].sort((a,b) => sort(a[0],b[0]))) {
      const datasetType = field(raw.node,'techribCloudType') || field(raw.node,'cloudType') || field(raw.node,'iotType');
      const bindings = [...raw.pins.values()].sort((a,b) => (a.gpio??9999)-(b.gpio??9999) || sort(a.terminal,b.terminal));
      const interfaceSource=raw.ref.type==='elec-uln2003ag'||['elec-pc817','opto-pc817'].includes(raw.ref.type);
      const pc817=['elec-pc817','opto-pc817'].includes(raw.ref.type);
      const acceptedBindings=bindings.map(binding=>{
        if (!pc817 || asString(binding.terminal).toUpperCase()!=='E' ||
            !['input','input_pulldown'].includes(binding.mode))return binding;
        if (profile?.noPull?.includes(binding.gpio) ||
            !profile?.input?.includes(binding.gpio) ||
            !pc817EmitterValidated(out.nets,id,binding,cid))return binding;
        // auto-configuração restrita a E->GPIO e C->3V3 verificados. Não
        // altera a prancha nem o código ESP-IDF convencional.
        const pin=out.gpio.find(p=>p.number===binding.gpio && p.netId===binding.netId);
        if(pin)pin.mode='input_pulldown';
        return {...binding,mode:'input_pulldown',bias:'internal-pulldown'};
      });
      const interfaceBindings=acceptedBindings.filter(binding=>
        interfaceChannelType(raw.ref.type,binding,catalog) ||
        (pc817 && asString(binding.terminal).toUpperCase()==='E' &&
          binding.mode==='input_pulldown' && binding.bias==='internal-pulldown' &&
          Object.prototype.hasOwnProperty.call(catalog,'binary_sensor')));
      if(interfaceSource){
        for(const binding of interfaceBindings){
          const mappingKey=`${id}:${binding.terminal}:${binding.netId}`;
          const explicit=mappings[mappingKey]||mappings[id]||{};
          const requested=explicit.expose!==false;
          const inferred=interfaceChannelType(raw.ref.type,binding,catalog) || (pc817 && binding.bias==='internal-pulldown' ? 'binary_sensor' : null);
          const type=requested?normalizedType(catalog,explicit.type||datasetType||inferred):null;
          if(requested&&!type)issue(out,'error',(explicit.type||datasetType)?'TYPE_NOT_IN_CATALOG':'TYPE_UNASSIGNED',`${mappingKey}: canal físico sem tipo Cloud válido.`,mappingKey);
          out.components.push({
            id:'c_'+h32(mappingKey),sourceComponentId:id,sourceType:raw.ref.type,sourceTerminal:binding.terminal,sourceNetId:binding.netId,mappingKey,
            name:asString(explicit.name||`${raw.label} ${binding.terminal}`).slice(0,120),exposure:requested?'implemented':'auxiliary',
            type:type||null,commands:type?Object.keys(catalog[type].commands||{}).sort(sort):[],bindings:[binding],
            implementation:requested&&type?'direct-gpio':'not-exported',classification:type&&!explicit.type&&!datasetType?'hardware-channel-auto':'explicit'
          });
        }
        if(interfaceBindings.some(b=>b.bias==='internal-pulldown'))
          issue(out,'warning','PC817_INPUT_LED_VERIFY',`${id}: confirmar alimentação/polaridade e resistor limitador do LED de entrada A/K do PC817; as redes sem controlador não constam nesta IR.`,id);
        for(const binding of acceptedBindings.filter(binding=>!interfaceBindings.includes(binding))){
          if(pc817&&asString(binding.terminal).toUpperCase()==='E')
            issue(out,'error','PC817_EMITTER_BIAS_UNVERIFIED',`${id}.E -> GPIO${binding.gpio}: necessita C no 3,3 V do controlador, E somente neste GPIO, modo INPUT e pull-down permitido pelo perfil. Não é seguro gerar sem confirmar a topologia.`,`${id}:E`);
          else issue(out,'error','INTERFACE_TERMINAL_UNSUPPORTED',`${id}.${binding.terminal}: ligação ao GPIO não corresponde a um canal lógico seguro desta interface física.`,`${id}:${binding.terminal}`);
        }
        continue;
      }
      const explicit = mappings[id] || {};
      const requested = explicit.expose === false ? false : true;
      const inferred = typeFromHardware(raw.ref.type,bindings,catalog);
      const typeInput = asString(explicit.type || datasetType || inferred);
      const type = requested ? normalizedType(catalog,typeInput) : null;
      if (requested && !type) issue(out, 'error', typeInput?'TYPE_NOT_IN_CATALOG':'TYPE_UNASSIGNED',
        `${id}: ${typeInput?'tipo não encontrado no catálogo: '+typeInput:'escolha explicitamente o tipo Cloud ou marque como componente auxiliar'}.`, id);
      if (requested && type && !bindings.length) issue(out,'error','UNBOUND_COMPONENT',`${id}: sem conexão direta ao GPIO.`,id);
      if (requested && type==='switch' && bindings.some(b => ['input','input_pullup','input_pulldown','analog-input'].includes(b.mode)))
        issue(out,'error','SWITCH_DIRECTION',`${id}: switch de saída conectado a GPIO de entrada.`,id);
      if (requested && type==='binary_sensor' && bindings.some(b => b.mode==='output'))
        issue(out,'error','SENSOR_DIRECTION',`${id}: sensor binário conectado a GPIO configurado como saída.`,id);
      out.components.push({
        id:'c_'+h32(id), sourceComponentId:id, sourceType:raw.ref.type,
        name:asString(explicit.name || raw.label).slice(0,120),
        exposure:requested?'implemented':'auxiliary',
        type:type || null,
        commands:type?Object.keys(catalog[type].commands || {}).sort(sort):[],
        bindings,
        implementation:requested&&type&&bindings.length?'direct-gpio':'not-exported',
        classification:type && !explicit.type && !datasetType && inferred ? 'hardware-auto' : 'explicit'
      });
    }
    const i2c = analysis.i2c;
    if (i2c && (i2c.bus || (i2c.expanders || []).length)) {
      const bus = i2c.bus || {}, expansions = [], addresses = new Set();
      for (const [i,e] of (i2c.expanders || []).entries()) {
        const address = intAddress(e.addressRaw !== undefined ? e.addressRaw : e.address), name = asString(e.tag) || `MCP${i+1}`;
        if (address === null || address < 0x20 || address > 0x27) issue(out,'error','I2C_ADDRESS_INVALID',`${name}: endereço MCP23017 inválido.`,name);
        else if (addresses.has(address)) issue(out,'error','I2C_ADDRESS_DUPLICATE',`${name}: endereço MCP23017 repetido.`,name);
        if (address!==null) addresses.add(address);
        expansions.push({name, type:'mcp23017', address, pinModes:isObject(e.pinModes)?Object.fromEntries(Object.entries(e.pinModes).filter(([key])=>/^GP[AB][0-7]$/i.test(key)).map(([key,value])=>[key,asString(value)]).sort((a,b)=>sort(a[0],b[0]))):{}});
      }
      expansions.sort((a,b)=>(a.address??999)-(b.address??999) || sort(a.name,b.name));
      out.buses.push({kind:'i2c',source:i2c.declarative?'profile-declarative':'simulator-analysis',sda:numberOrNull(bus.sdaNumber),scl:numberOrNull(bus.sclNumber),frequency:Number(bus.frequency)||null,expanders:expansions});
      if (out.buses[0].sda===null || out.buses[0].scl===null) issue(out,'error','I2C_PIN_MISSING','Barramento I²C sem SDA/SCL físicos válidos.');
      if (out.buses[0].sda===out.buses[0].scl) issue(out,'error','I2C_PIN_COLLISION','SDA e SCL não podem usar o mesmo GPIO.');
      for (const p of out.gpio) {
        if (p.number===out.buses[0].sda && p.mode!=='i2c_sda') issue(out,'error','I2C_GPIO_COLLISION',`GPIO${p.number} usado por SDA e também como ${p.mode}.`,p.pin);
        if (p.number===out.buses[0].scl && p.mode!=='i2c_scl') issue(out,'error','I2C_GPIO_COLLISION',`GPIO${p.number} usado por SCL e também como ${p.mode}.`,p.pin);
      }
      if (i2c.declarative) issue(out,'warning','DECLARATIVE_EXPANDERS','Expansores definidos por perfil: não são prova de componentes MCP23017 desenhados e ligados na prancha.');
      issue(out,'warning','MCP23017_CLOUD_DRIVER_UNAVAILABLE','MCP23017 identificado, porém este exportador Cloud ainda não inclui o driver físico e não publicará canais fictícios.',undefined,'pending');
      // Canais declarativos NÃO viram instâncias Cloud nesta etapa.
    }
    for (const device of analysis.peripherals && analysis.peripherals.devices || []) {
      const id = field(device.component,'componentId') || asString(device.id);
      out.peripherals.push({componentId:id,interface:asString(device.interface),type:asString(device.type),source:'simulator-peripherals'});
      if (!id) issue(out,'warning','PERIPHERAL_UNBOUND','Periférico sem identidade explícita; confirmar sua vinculação física.');
      issue(out,'warning','PERIPHERAL_CLOUD_DRIVER_UNAVAILABLE',`${id||'Periférico'}: não há driver Cloud homologado para ${asString(device.type)||asString(device.interface)||'este recurso'}.`,id||undefined,'pending');
    }
    out.peripherals.sort((a,b)=>sort(a.componentId,b.componentId));
    translateLogic(analysis,out,cid);
    const pwmRequired=out.components.reduce((count,c)=>count+(c.exposure==='auxiliary'?0:c.type==='light_rgb'?3:c.type==='dimmer'?1:0),0);
    out.hardware={profile:profile?.id||null,family:profile?.family||null,idfTarget:profile?.idfTarget||null,pwmChannelsRequired:pwmRequired,pwmChannelsAvailable:profile?.pwmChannels||0,console:profile?.console||'uart',wifi:profile?.wifi===true,ble:profile?.ble===true,runtime:profile?.runtime||'diagnostic'};
    if(profile&&pwmRequired>profile.pwmChannels)issue(out,'error','PWM_CHANNEL_LIMIT',`${profile.label}: o circuito exige ${pwmRequired} canais LEDC, mas o perfil validado oferece ${profile.pwmChannels}.`,controllerLoc.type);
    for (const w of analysis.warnings || []) {
      if (w && (w.level==='error'||w.level==='warning')) issue(out,w.level,'SIMULATOR_ANALYSIS',asString(w.text || w.message));
    }
    for (const w of i2c && i2c.warnings || []) {
      if (w && w.level==='error') issue(out,'error','I2C_ANALYSIS',asString(w.text || w.message));
    }
    for (const w of analysis.peripherals && analysis.peripherals.issues || []) {
      if (w && w.level==='error') issue(out,'error','PERIPHERAL_ANALYSIS',asString(w.text || w.message));
    }
    if (out.components.filter(c=>c.exposure!=='auxiliary').length > 256)
      issue(out,'error','MANIFEST_COMPONENT_LIMIT','Mais de 256 instâncias Cloud para o contrato atual.');
    if (!out.gpio.length && !out.buses.length && !out.peripherals.length)
      issue(out,'error','EMPTY_TOPOLOGY','Nenhuma ligação/periférico do controlador selecionado.');
    const unsafeGpios=new Set(out.gpio.filter(pin=>out.issues.some(x=>x.level==='error'&&x.category==='hardware'&&(x.ref===pin.pin||x.ref===pin.netId))).map(pin=>pin.number));
    for(const component of out.components){
      const unsafe=(component.bindings||[]).some(binding=>unsafeGpios.has(binding.gpio)||out.issues.some(x=>x.level==='error'&&x.category==='hardware'&&[component.sourceComponentId,component.sourceNetId,component.mappingKey,`${component.sourceComponentId}:${component.sourceTerminal}`].filter(Boolean).includes(x.ref)));
      component.runtimeEnabled=profile?.runtime==='cloud'&&component.exposure!=='auxiliary'&&component.implementation==='direct-gpio'&&!unsafe;
      component.status=component.runtimeEnabled?'implemented':component.exposure==='auxiliary'?'auxiliary':profile?.runtime!=='cloud'?'family-runtime-pending':unsafe?'disabled-unsafe':'driver-pending';
    }
    out.issues.sort((a,b)=>sort(a.category+':'+a.level+':'+a.code+':'+(a.ref||''),b.category+':'+b.level+':'+b.code+':'+(b.ref||'')));
    out.diagnostics={structural:out.issues.filter(x=>x.category==='structural'),hardware:out.issues.filter(x=>x.category==='hardware'),pending:out.issues.filter(x=>x.category==='pending')};
    out.blocking = out.issues.some(x=>x.category==='structural'&&x.level==='error');
    out.readyForFirmware = !out.blocking;
    return out;
  }
  return {VERSION,familyFromType,boardProfile,build};
});

// Interface de diagnóstico usa o mesmo IR posteriormente enviado ao exportador.
(function() {
  'use strict';
  if (typeof document==='undefined' || typeof window==='undefined') return;
  const access=window.TECHRIB_USER_ACCESS||{};
  if(access.isAdmin!==true && access.canEditStandardExamples!==true) return;
  const modal = document.querySelector('[data-codegen-modal]');
  const toolbar = modal && modal.querySelector('.codegen-toolbar');
  const dialog = modal && modal.querySelector('.codegen-dialog');
  if (!toolbar || !dialog || !window.TechRibCloudIRV2) return;
  const action = document.createElement('button');
  action.type = 'button';
  action.textContent = 'Validar circuito Cloud';
  action.title = 'Verificar os componentes, bornes e ligações do circuito';
  action.dataset.techribCloudIr = '';
  toolbar.appendChild(action);
  const panel = document.createElement('section');
  panel.hidden = true;
  panel.style.cssText = 'padding:12px;margin:10px 0;border:1px solid #56728b;border-radius:9px';
  dialog.appendChild(panel);
  const title = document.createElement('h4'); title.textContent = 'TechRib IoT Cloud — diagnóstico do circuito'; panel.appendChild(title);
  const note = document.createElement('p');note.textContent='Revise os componentes e os recursos identificados. A análise não altera a prancha.';panel.appendChild(note);
  const summary = document.createElement('p');panel.appendChild(summary);
  const rows = document.createElement('div');panel.appendChild(rows);
  const issues = document.createElement('pre'); issues.style.cssText='max-height:180px;overflow:auto;white-space:pre-wrap';panel.appendChild(issues);
  const controls = document.createElement('div'); controls.style.cssText='display:flex;gap:8px;flex-wrap:wrap';panel.appendChild(controls);
  const refresh = document.createElement('button');refresh.type='button';refresh.textContent='Revalidar';controls.appendChild(refresh);
  const exportButton = document.createElement('button');exportButton.type='button';exportButton.textContent='Exportar diagnóstico JSON';controls.appendChild(exportButton);
  const close = document.createElement('button');close.type='button';close.textContent='Fechar';controls.appendChild(close);
  const message = document.createElement('small');panel.appendChild(message);
  const mappings = Object.create(null);
  let latest = null;
  const cat = () => window.TechRibIoTCloudMappingV1 && window.TechRibIoTCloudMappingV1.catalog;
  const fill = () => {
    rows.replaceChildren(); message.textContent='';
    const cId = modal.querySelector('[data-codegen-controller]')?.value;
    const c = [...document.querySelectorAll('.schematic-sheet .placed-component')].find(x=>x.dataset.componentId===cId);
    if (!c) { latest=null;summary.textContent='Selecione um controlador no gerador.';issues.textContent='';return; }
    const a = window.TechRibCodeGenerator?.analyze(c,'espidf');
    latest = window.TechRibCloudIRV2.build(a, {catalog:cat(),mappings,capabilities:window.TechRibCloudCapabilitiesV1});
    summary.textContent=`${latest.nets.length} redes • ${latest.gpio.length} GPIO • ${latest.components.length} componentes conectados • ${latest.buses.length} barramento(s) • ${latest.diagnostics?.structural?.filter(x=>x.level==='error').length||0} bloqueio(s) estrutural(is).`;
    const names=Object.keys(cat()?.types||{}).sort();
    for (const item of latest.components) {
      const row = document.createElement('div');row.style.cssText='margin:7px 0;display:flex;align-items:center;gap:8px;flex-wrap:wrap';
      const label=document.createElement('span');label.textContent=`${item.sourceComponentId} (${item.sourceType}) — ${item.bindings.map(b=>`GPIO${b.gpio}`).join(', ') || 'sem GPIO direto'}`;row.appendChild(label);
      const select=document.createElement('select');
      const empty=document.createElement('option');empty.value='';empty.textContent='Escolher tipo Cloud';select.appendChild(empty);
      for (const n of names) {const opt=document.createElement('option');opt.value=n;opt.textContent=n;select.appendChild(opt);}
      const mappingKey=item.mappingKey||item.sourceComponentId;
      select.value=mappings[mappingKey]?.type || item.type || '';
      const ignored=document.createElement('label');ignored.textContent='Auxiliar (não publicar)';
      const cb=document.createElement('input');cb.type='checkbox';cb.checked=mappings[mappingKey]?.expose === false;ignored.prepend(cb);
      const change=()=>{mappings[mappingKey]={type:select.value,expose:!cb.checked};fill();};
      select.addEventListener('change',change);cb.addEventListener('change',change);
      row.append(select,ignored);rows.appendChild(row);
    }
    issues.textContent=latest.issues.map(x=>`${x.level==='error'?'ERRO':'AVISO'} ${String(x.category||'hardware').toUpperCase()} [${x.code}]: ${x.message}`).join('\n') || 'Nenhuma incompatibilidade de topologia identificada.';
  };
  action.addEventListener('click',()=>{panel.hidden=!panel.hidden;if(!panel.hidden)fill();});
  refresh.addEventListener('click',fill);
  close.addEventListener('click',()=>{panel.hidden=true;});
  window.TechRibCloudIRPanel={open:()=>{panel.hidden=false;fill();},getLatest:()=>latest,getMappings:()=>({...mappings})};
  exportButton.addEventListener('click',()=>{
    if(!latest){message.textContent='Analise o circuito primeiro.';return;}
    const blob=new Blob([JSON.stringify(latest,null,2)+'\n'],{type:'application/json'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='techrib-cloud-diagnostico-circuito.json';a.click();
    setTimeout(()=>URL.revokeObjectURL(url),2500);
    message.textContent='Diagnóstico técnico exportado em JSON.';
  });
})();
