(function(root,factory){
  'use strict';
  const api=factory(root||{});
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.TechRibGenerationEngineV27B=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  'use strict';
  const VERSION='27B.1';
  const GENERATOR_ID='TR-GENERATION-27B';
  const norm=v=>String(v??'').trim().toLowerCase();
  const text=v=>String(v??'').trim();
  const uniq=a=>[...new Set((a||[]).filter(Boolean))];
  const slug=v=>{let s=text(v).toLowerCase();try{s=s.normalize('NFD').replace(/[\u0300-\u036f]/g,'')}catch{}s=s.replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'');return s||'techrib';};
  const q=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
  const yamlQ=v=>'"'+String(v??'').replace(/\\/g,'\\\\').replace(/"/g,'\\"')+'"';
  const commentHeader=(prefix,title)=>[
    `${prefix} ${title}`,
    `${prefix} Gerado automaticamente pelo Simulador TechRib`,
    `${prefix} Generator ID: ${GENERATOR_ID}`,
    `${prefix} Endereços sugeridos devem ser confirmados no comissionamento real.`,
    ''
  ].join('\n');

  const NAMES_DATASET='techribIntegrationNames';
  function parseNames(raw){
    let value=raw;
    if(typeof value==='string'){try{value=JSON.parse(value)}catch{value=null}}
    if(!value||typeof value!=='object'||Array.isArray(value))value={};
    const scopes=value.scopes&&typeof value.scopes==='object'&&!Array.isArray(value.scopes)?value.scopes:{};
    return{version:1,scopes};
  }
  function namesFor(component){
    const raw=component?.el?.dataset?.[NAMES_DATASET]??component?.integrationNames??component?.projectNames??null;
    return parseNames(raw);
  }
  function aliasFor(component,scope,index,fallback=''){
    const value=namesFor(component).scopes?.[scope]?.[String(index)];
    return text(value)||text(fallback);
  }
  function cleanAlias(value){return text(value).replace(/[\r\n\t]+/g,' ').replace(/\s{2,}/g,' ').slice(0,100).trim();}
  function componentKey(component){return text(component?.componentId)||text(component?.id)||'';}

  function definitionFor(el){
    try{return root.TechRibLogic?.getDefinition?.(el)||root.TechRibLogic?.registry?.[el?.dataset?.registryId]||null}catch{return null}
  }
  function labelFor(el,def){return text(el?.dataset?.tag)||text(el?.dataset?.label)||text(def?.name)||text(el?.dataset?.type)||text(el?.dataset?.registryId)||'COMP';}
  function snapshotFromDom(){
    if(!root.document?.querySelectorAll)return{components:[]};
    const els=[...root.document.querySelectorAll('.schematic-sheet .placed-component')];
    return{components:els.map((el,index)=>{const def=definitionFor(el)||{};return{
      index,el,def,id:text(def.id||el.dataset?.registryId||el.dataset?.type||`comp-${index+1}`),componentId:text(el.dataset?.componentId||`comp-${index+1}`),label:labelFor(el,def),
      behavior:def.behavior||{},contract:def.contract||{},codegen:def.codegen||{},integration:def.integration||{},terminals:def.terminals||{},integrationNames:parseNames(el.dataset?.[NAMES_DATASET])
    };})};
  }
  function protocolsOf(c){return uniq([...(c.contract?.protocols||[]),c.behavior?.protocol,c.integration?.protocol].map(norm));}
  function familyOf(c){return norm(c.behavior?.family);}
  function isMcu(c){return c.codegen?.role==='controller'||familyOf(c)==='microcontroller'||/esp32|esp8266|arduino|raspberry.*pico|microcontroller/.test(norm(`${c.id} ${c.label} ${c.behavior?.type||''}`));}
  function isKnx(c){return protocolsOf(c).some(p=>p.startsWith('knx'))||/\bknx\b/.test(norm(`${c.id} ${c.label} ${familyOf(c)}`));}
  function isDali(c){return protocolsOf(c).some(p=>p.startsWith('dali'))||/\bdali/.test(norm(`${c.id} ${c.label} ${familyOf(c)}`));}
  function isKnxIp(c){const i=c.integration||{},f=familyOf(c),s=norm(`${c.id} ${c.label}`);return i.gateway==='knx-ip'||i.bridge==='knx-ip'||i.transport==='knxnet-ip'||/knx[- ]?ip/.test(f+' '+s);}
  function isKnxDaliGateway(c){const i=c.integration||{},f=familyOf(c),s=norm(`${c.id} ${c.label}`);return i.bridge==='knx-dali'||/knx.*dali|dali.*knx/.test(f+' '+s);}
  function isSupportedHaDaliGateway(c){const i=c.integration||{},targets=Array.isArray(i.targets)?i.targets.map(norm):[];return isDali(c)&&(targets.includes('homeassistant')||norm(i.homeAssistantIntegration)==='sunricher_dali'||norm(c.id)==='sunricher-sr-gw-eda');}

  function analyzeSnapshot(snapshot){
    const cs=snapshot?.components||[],mcus=cs.filter(isMcu),knx=cs.filter(isKnx),dali=cs.filter(isDali),knxIp=cs.filter(isKnxIp),knxDali=cs.filter(isKnxDaliGateway),haDali=cs.filter(isSupportedHaDaliGateway);
    const hasKnx=knx.length>0,hasDali=dali.length>0,hasMcu=mcus.length>0;
    const target=(id,label,kind,state,reason)=>({id,label,kind,state,reason});
    const targets=[
      target('esp32-arduino','ESP32 (Arduino avançado)','firmware',hasMcu?'available':'incompatible',hasMcu?'Controlador disponível.':'Nenhum microcontrolador compatível no projeto.'),
      target('arduino','Arduino avançado','firmware',hasMcu?'available':'incompatible',hasMcu?'Controlador disponível.':'Nenhum microcontrolador compatível no projeto.'),
      target('esphome','ESPHome completo','firmware',hasMcu?'available':'incompatible',hasMcu?'Controlador disponível.':'Nenhum microcontrolador compatível no projeto.'),
      target('espidf','ESP-IDF (projeto ZIP)','firmware',hasMcu?'available':'incompatible',hasMcu?'Controlador disponível.':'Nenhum microcontrolador compatível no projeto.'),
      target('knx-commissioning','KNX / ETS — endereços e comissionamento','integration',hasKnx?'available':'incompatible',hasKnx?'Barramento KNX detectado.':'Nenhum componente KNX detectado.'),
      target('homeassistant-knx','Home Assistant / KNX','integration',!hasKnx?'incompatible':knxIp.length?'available':'warning',!hasKnx?'Nenhum KNX detectado.':knxIp.length?'KNX/IP detectado; configuração KNX pode ser gerada.':'KNX detectado, mas falta uma Interface/Router KNX/IP desenhada no projeto.'),
      target('openhab-knx','openHAB / KNX','integration',!hasKnx?'incompatible':knxIp.length?'available':'warning',!hasKnx?'Nenhum KNX detectado.':knxIp.length?'Gateway KNX/IP detectado; configuração openHAB pode ser gerada.':'KNX detectado, mas falta um gateway KNX/IP/serial compatível desenhado no projeto.'),
      target('dali-commissioning','DALI-2 — endereçamento e comissionamento','integration',hasDali?'available':'incompatible',hasDali?'Barramento DALI detectado.':'Nenhum componente DALI detectado.'),
      target('homeassistant-dali','Home Assistant / DALI','integration',!hasDali?'incompatible':haDali.length?'available':'warning',!hasDali?'Nenhum DALI detectado.':haDali.length?'Gateway DALI explicitamente compatível com Home Assistant detectado.':'DALI detectado, mas nenhum gateway Home Assistant compatível foi identificado. Será gerado somente um plano de integração, sem inventar YAML de gateway.'),
      target('knx-dali','KNX ↔ DALI — mapa de integração','integration',!(hasKnx&&hasDali)?'incompatible':knxDali.length?'available':'warning',!(hasKnx&&hasDali)?'O projeto precisa conter KNX e DALI.':knxDali.length?'Gateway KNX/DALI detectado.':'KNX e DALI detectados, mas nenhum gateway KNX↔DALI explícito foi encontrado; o mapa será tratado como proposta de comissionamento.')
    ];
    return{version:VERSION,generatorId:GENERATOR_ID,components:cs,mcus,knx,dali,knxIp,knxDali,haDali,hasMcu,hasKnx,hasDali,targets};
  }
  function analyzeProject(){return analyzeSnapshot(snapshotFromDom());}
  function targetInfo(id,analysis=analyzeProject()){return analysis.targets.find(t=>t.id===id)||null;}
  const isIntegrationTarget=id=>['knx-commissioning','homeassistant-knx','openhab-knx','dali-commissioning','homeassistant-dali','knx-dali'].includes(String(id||''));

  function currentTopology(){try{return root.TechRibCodeGenerator?.buildTopology?.()||[]}catch{return[]}}
  function netFor(component,terminalName,topology){
    const name=String(terminalName||'');
    return (topology||[]).find(n=>n.terminals?.some(x=>x.component===component.el&&String(x.meta?.name||'')===name))||null;
  }
  function connectedLabels(component,terminalName,topology){
    const n=netFor(component,terminalName,topology);if(!n)return[];
    return uniq(n.terminals.filter(x=>x.component!==component.el).map(x=>{const d=definitionFor(x.component)||{};return labelFor(x.component,d)}));
  }
  function usefulConnected(values){return (values||[]).filter(v=>!/fonte|rede|neutro|disjuntor|barramento|controlador/i.test(v));}
  function outputSuggestion(component,ch,topology){const dest=usefulConnected(connectedLabels(component,`NO${ch}`,topology));return dest[0]||`${component.label} CH${ch}`;}
  function outputName(component,ch,topology){return aliasFor(component,'knx-switch',ch,outputSuggestion(component,ch,topology));}
  function shutterSuggestion(component,ch,topology){
    const pair=component.behavior?.pairedRelays?.[String(ch)]||component.behavior?.pairedRelays?.[ch]||{up:(ch*2)-1,down:ch*2};
    const a=connectedLabels(component,`NO${pair.up}`,topology),b=connectedLabels(component,`NO${pair.down}`,topology),dest=usefulConnected(uniq([...a,...b]));
    return dest[0]||`${component.label} Persiana ${ch}`;
  }
  function shutterName(component,ch,topology){return aliasFor(component,'knx-shutter',ch,shutterSuggestion(component,ch,topology));}
  function inputSuggestion(component,ch,topology,prefix='CH'){const dest=usefulConnected(connectedLabels(component,`IN${ch}`,topology));return dest[0]||`${component.label} ${prefix}${ch}`;}
  function daliGearSuggestion(component,index,count,topology){
    const f=familyOf(component);
    if(f==='dali-switch-actuator'){const dest=usefulConnected(connectedLabels(component,`NO${index}`,topology));if(dest[0])return dest[0];}
    if(['dali-control-gear','dali-dt8-control-gear','dali-analog-converter'].includes(f)){const dest=usefulConnected(uniq([...connectedLabels(component,'LED+',topology),...connectedLabels(component,'LED-',topology),...connectedLabels(component,'OUT+',topology),...connectedLabels(component,'OUT-',topology)]));if(dest[0])return dest[0];}
    return count>1?`${component.label} CH${index}`:component.label;
  }
  function controlDeviceInstanceCount(component){const b=component.behavior||{};return Array.isArray(b.instances)?Math.max(1,b.instances.length):Math.max(1,Number(b.channels||1));}
  function daliInputSuggestion(component,index,topology){const dest=usefulConnected(connectedLabels(component,`IN${index}`,topology));if(dest[0])return dest[0];const instance=Array.isArray(component.behavior?.instances)?component.behavior.instances[index-1]:null;return instance?.type?`${component.label} — ${instance.type}`:`${component.label} CH${index}`;}
  function namingPoints(analysis=analyzeProject(),topology=currentTopology()){
    const points=[];
    const add=(component,technology,scope,index,technical,suggested)=>points.push({key:`${componentKey(component)}|${scope}|${index}`,technology,componentId:componentKey(component),registryId:component.id,componentLabel:component.label,scope,index,technical,suggested:cleanAlias(suggested),value:aliasFor(component,scope,index,''),effective:aliasFor(component,scope,index,suggested)});
    analysis.knx.forEach(c=>{const f=familyOf(c),b=c.behavior||{};if(f==='knx-switch-actuator'){for(let ch=1;ch<=Math.max(0,Number(b.channels||0));ch++)add(c,'KNX','knx-switch',ch,`CH${ch}`,outputSuggestion(c,ch,topology));}
      else if(f==='knx-shutter-actuator'){for(let ch=1;ch<=Math.max(0,Number(b.shutterChannels||Math.floor(Number(b.channels||0)/2)));ch++)add(c,'KNX','knx-shutter',ch,`PERSIANA ${ch}`,shutterSuggestion(c,ch,topology));}
      else if(f==='knx-binary-input'){for(let ch=1;ch<=Math.max(0,Number(b.channels||0));ch++)add(c,'KNX','knx-input',ch,`CH${ch}`,inputSuggestion(c,ch,topology));}});
    analysis.dali.forEach(c=>{if(isDaliGear(c)){const count=Math.max(1,Number(c.behavior?.addresses||1));for(let i=1;i<=count;i++)add(c,'DALI','dali-gear',i,count>1?`SA sugerido • CH${i}`:'SA sugerido',daliGearSuggestion(c,i,count,topology));}
      else if(isDaliControlDevice(c)){const count=controlDeviceInstanceCount(c);for(let i=1;i<=count;i++)add(c,'DALI','dali-input',i,count>1?`INST ${i}`:'DISPOSITIVO',daliInputSuggestion(c,i,topology));}});
    return points;
  }
  function applyNamingEntries(entries=[],analysis=analyzeProject()){
    const components=new Map((analysis.components||[]).map(c=>[componentKey(c),c]));let changed=0;
    (entries||[]).forEach(entry=>{const c=components.get(text(entry.componentId));if(!c?.el?.dataset)return;const names=namesFor(c),scope=text(entry.scope),idx=String(entry.index),value=cleanAlias(entry.name);if(!scope||!idx)return;if(!names.scopes[scope])names.scopes[scope]={};const before=text(names.scopes[scope][idx]);if(value)names.scopes[scope][idx]=value;else delete names.scopes[scope][idx];if(!Object.keys(names.scopes[scope]).length)delete names.scopes[scope];if(before!==value){c.el.dataset[NAMES_DATASET]=JSON.stringify(names);c.integrationNames=names;changed++;}});
    if(changed)try{root.TechRibSaaSBridge?.markProjectChanged?.()}catch{}
    return{changed,points:namingPoints(analyzeProject(),currentTopology())};
  }
  function isLightingName(v){return /lamp|lâmp|lumin|light|led|spot|fita/i.test(String(v||''));}
  function ga(main,middle,sub){return `${main}/${middle}/${sub}`;}
  function buildKnxModel(analysis=analyzeProject(),topology=currentTopology()){
    let sw=0,cv=0;
    const switches=[],covers=[],inputs=[];
    analysis.knx.forEach(c=>{
      const f=familyOf(c),b=c.behavior||{};
      if(f==='knx-switch-actuator'){
        const count=Math.max(0,Number(b.channels||0));
        for(let ch=1;ch<=count;ch++){
          const idx=++sw,name=outputName(c,ch,topology);
          switches.push({component:c.id,componentLabel:c.label,channel:ch,name,entityKind:isLightingName(name)?'light':'switch',command:ga(1,0,idx),state:ga(1,1,idx),dpt:'1.001'});
        }
      }else if(f==='knx-shutter-actuator'){
        const count=Math.max(0,Number(b.shutterChannels||Math.floor(Number(b.channels||0)/2)));
        for(let ch=1;ch<=count;ch++){
          const idx=++cv,name=shutterName(c,ch,topology);
          covers.push({component:c.id,componentLabel:c.label,channel:ch,name,move:ga(2,0,idx),stop:ga(2,1,idx),position:ga(2,2,idx),positionState:ga(2,3,idx),dpts:{move:'1.008',stop:'1.010',position:'5.001'}});
        }
      }else if(f==='knx-binary-input'){
        const count=Math.max(0,Number(b.channels||0));
        for(let ch=1;ch<=count;ch++)inputs.push({component:c.id,componentLabel:c.label,channel:ch,name:aliasFor(c,'knx-input',ch,inputSuggestion(c,ch,topology))});
      }
    });
    const issues=[];
    if(!analysis.hasKnx)issues.push({level:'error',text:'Nenhum componente KNX foi encontrado.'});
    if(!switches.length&&!covers.length)issues.push({level:'warning',text:'KNX detectado, mas nenhum atuador de comutação/persiana conhecido foi encontrado para criar entidades automaticamente.'});
    if(inputs.length)issues.push({level:'info',text:`${inputs.length} canal(is) de entrada KNX detectados. O vínculo final dos Group Objects deve ser confirmado no ETS.`});
    if(switches.length>255)issues.push({level:'error',text:`${switches.length} canais de comutação excedem a faixa de subgrupo usada pelo perfil automático TechRib. Divida/reenderece o projeto antes de gerar.`});
    if(covers.length>255)issues.push({level:'error',text:`${covers.length} persianas excedem a faixa de subgrupo usada pelo perfil automático TechRib. Divida/reenderece o projeto antes de gerar.`});
    if(!analysis.knxIp.length)issues.push({level:'warning',text:'Nenhuma Interface/Router KNX/IP foi encontrada na prancha. Home Assistant/openHAB exigirão um gateway compatível para acessar o barramento.'});
    return{switches,covers,inputs,issues};
  }

  function etsCsv(model){
    const lines=[['Main','Middle','Sub','Address'].map(q).join(';')];
    if(model.switches.length){
      lines.push([q('Comutação'),q(''),q(''),q('1/-/-')].join(';'));
      lines.push([q(''),q('Comando'),q(''),q('1/0/-')].join(';'));
      model.switches.forEach(x=>lines.push([q(''),q(''),q(`${x.name} — comando`),q(x.command)].join(';')));
      lines.push([q(''),q('Estado'),q(''),q('1/1/-')].join(';'));
      model.switches.forEach(x=>lines.push([q(''),q(''),q(`${x.name} — estado`),q(x.state)].join(';')));
    }
    if(model.covers.length){
      lines.push([q('Persianas'),q(''),q(''),q('2/-/-')].join(';'));
      const groups=[['Movimento','move'],['Parada','stop'],['Posição','position'],['Estado posição','positionState']];
      groups.forEach(([title,key],middle)=>{lines.push([q(''),q(title),q(''),q(`2/${middle}/-`)].join(';'));model.covers.forEach(x=>lines.push([q(''),q(''),q(`${x.name} — ${title.toLowerCase()}`),q(x[key])].join(';')));});
    }
    return lines.join('\n')+'\n';
  }
  function knxMappingCsv(model){
    const rows=[['technology','kind','name','channel','purpose','group_address','dpt']];
    model.switches.forEach(x=>{rows.push(['KNX',x.entityKind,x.name,x.channel,'command',x.command,x.dpt]);rows.push(['KNX',x.entityKind,x.name,x.channel,'state',x.state,x.dpt]);});
    model.covers.forEach(x=>{rows.push(['KNX','cover',x.name,x.channel,'move',x.move,x.dpts.move]);rows.push(['KNX','cover',x.name,x.channel,'stop',x.stop,x.dpts.stop]);rows.push(['KNX','cover',x.name,x.channel,'position',x.position,x.dpts.position]);rows.push(['KNX','cover',x.name,x.channel,'position_state',x.positionState,x.dpts.position]);});
    return rows.map(r=>r.map(q).join(';')).join('\n')+'\n';
  }
  function knxInputCsv(model){const rows=[['technology','kind','component','channel','name','group_address','status']];model.inputs.forEach(x=>rows.push(['KNX','binary_input',x.componentLabel,x.channel,x.name,'','MAPEAR_NO_ETS']));return rows.map(r=>r.map(q).join(';')).join('\n')+'\n';}
  function haKnxYaml(model){
    const lights=model.switches.filter(x=>x.entityKind==='light'),switches=model.switches.filter(x=>x.entityKind!=='light');
    const lines=[commentHeader('#','Home Assistant / KNX'),'knx:'];
    if(lights.length){lines.push('  light:');lights.forEach(x=>lines.push(`    - name: ${yamlQ(x.name)}`,`      address: ${yamlQ(x.command)}`,`      state_address: ${yamlQ(x.state)}`));}
    if(switches.length){lines.push('  switch:');switches.forEach(x=>lines.push(`    - name: ${yamlQ(x.name)}`,`      address: ${yamlQ(x.command)}`,`      state_address: ${yamlQ(x.state)}`));}
    if(model.covers.length){lines.push('  cover:');model.covers.forEach(x=>lines.push(`    - name: ${yamlQ(x.name)}`,`      move_long_address: ${yamlQ(x.move)}`,`      stop_address: ${yamlQ(x.stop)}`,`      position_address: ${yamlQ(x.position)}`,`      position_state_address: ${yamlQ(x.positionState)}`));}
    if(lines.length===2)lines.push('  # Nenhuma entidade KNX conhecida pôde ser criada automaticamente.');
    return lines.join('\n')+'\n';
  }
  function openhabEntries(model){let n=0;return[...model.switches.map(x=>({kind:'switch',x,id:`${slug(x.name)}_${++n}`})),...model.covers.map(x=>({kind:'cover',x,id:`${slug(x.name)}_${++n}`}))];}
  function openhabKnxThings(model){
    const lines=[commentHeader('//','openHAB / KNX'),'// Defina o endereço do gateway KNX/IP antes de usar em produção.','Bridge knx:ip:bridge [','    type="TUNNEL"','    // ipAddress="192.168.1.10"','    autoReconnectPeriod=60','] {','    Thing device techrib "TechRib KNX" {'];
    openhabEntries(model).forEach(e=>{const x=e.x;if(e.kind==='switch')lines.push(`        Type switch : ${e.id} "${String(x.name).replace(/"/g,"'")}" [ ga="${x.command}+<${x.state}" ]`);else lines.push(`        Type rollershutter : ${e.id} "${String(x.name).replace(/"/g,"'")}" [ upDown="${x.move}", stopMove="${x.stop}", position="${x.position}+<${x.positionState}" ]`);});
    lines.push('    }','}','');return lines.join('\n');
  }
  function openhabKnxItems(model){
    const lines=[commentHeader('//','openHAB Items / KNX')];
    openhabEntries(model).forEach(e=>{const x=e.x;if(e.kind==='switch')lines.push(`Switch ${e.id} "${String(x.name).replace(/"/g,"'")} [%s]" { channel="knx:device:bridge:techrib:${e.id}" }`);else lines.push(`Rollershutter ${e.id} "${String(x.name).replace(/"/g,"'")} [%d %%]" { channel="knx:device:bridge:techrib:${e.id}" }`);});
    if(lines.length===1)lines.push('// Nenhum item KNX conhecido pôde ser criado automaticamente.');
    return lines.join('\n')+'\n';
  }
  function knxReadme(model,targetState){
    const warn=targetState?.state==='warning'?`\n## Requisito pendente\n\n${targetState.reason}\n`:'';
    return `# TechRib — KNX / Comissionamento\n\nGerado por **${GENERATOR_ID}**.\n\nOs endereços de grupo deste pacote são **sugestões determinísticas** do TechRib. Confirme ou edite no ETS antes de baixar a configuração para dispositivos reais.\n\n- Comutações detectadas: ${model.switches.length}\n- Persianas detectadas: ${model.covers.length}\n- Entradas KNX detectadas: ${model.inputs.length}\n- Nomes personalizados: preservados como aliases do projeto, sem alterar CH/IN/borne interno.\n${warn}\n## Regras usadas\n\n- Comando liga/desliga: DPT 1.001\n- Movimento de persiana: DPT 1.008\n- Parada de persiana: DPT 1.010\n- Posição absoluta: DPT 5.001\n\nO arquivo \`ets-group-addresses.csv\` usa estrutura de 3 níveis para facilitar importação/revisão no ETS. O arquivo \`group-addresses-techrib.csv\` preserva também finalidade e DPT.\n`;
  }

  function isDaliGear(c){const f=familyOf(c);return ['dali-control-gear','dali-switch-actuator','dali-dt8-control-gear','dali-analog-converter'].includes(f)||/dali.*control-gear/.test(f);}
  function isDaliControlDevice(c){const f=familyOf(c);return ['dali-input-device','dali-pushbutton-coupler','dali-universal-switch-input','dali-mains-voltage-input'].includes(f);}
  function buildDaliModel(analysis=analyzeProject(),topology=currentTopology()){
    const gear=[],controlDevices=[],controllers=[];let gearAddr=0,controlAddr=0,group=0;
    analysis.dali.forEach(c=>{
      if(familyOf(c)==='dali-application-controller'){controllers.push({component:c.id,name:c.label,ethernet:Boolean(c.behavior?.ethernet),integratedPsu:Boolean(c.behavior?.integratedDaliPsu)});return;}
      if(isDaliGear(c)){
        const count=Math.max(1,Number(c.behavior?.addresses||1));
        for(let i=1;i<=count;i++){const suggested=daliGearSuggestion(c,i,count,topology);gear.push({component:c.id,componentLabel:c.label,instance:i,name:aliasFor(c,'dali-gear',i,suggested),shortAddress:gearAddr++,group:group<16?group:null,deviceType:text(c.behavior?.deviceType||''),family:familyOf(c)});}
        group++;
      }else if(isDaliControlDevice(c)){
        const instances=controlDeviceInstanceCount(c),instanceNames=[];for(let i=1;i<=instances;i++)instanceNames.push({instance:i,name:aliasFor(c,'dali-input',i,daliInputSuggestion(c,i,topology))});
        controlDevices.push({component:c.id,name:instanceNames[0]?.name||c.label,componentLabel:c.label,shortAddress:controlAddr++,parts:c.behavior?.parts||[],instances,instanceNames});
      }
    });
    const hasPsu=analysis.dali.some(c=>familyOf(c)==='dali-bus-power-supply'||Boolean(c.behavior?.integratedDaliPsu));
    const issues=[];
    if(gear.length>64)issues.push({level:'error',text:`Foram sugeridos ${gear.length} endereços de control gear; uma linha DALI suporta até 64.`});
    if(controlDevices.length>64)issues.push({level:'error',text:`Foram sugeridos ${controlDevices.length} endereços de control devices; uma linha DALI-2 suporta até 64.`});
    if(!controllers.length)issues.push({level:'warning',text:'Nenhum Application Controller DALI-2 foi encontrado. O barramento pode precisar de um controlador para processar eventos e enviar comandos.'});
    if(!hasPsu)issues.push({level:'warning',text:'Nenhuma fonte de barramento DALI explícita/integrada foi identificada.'});
    return{gear,controlDevices,controllers,hasPsu,issues};
  }
  function daliCsv(model){
    const rows=[['class','name','short_address','suggested_group','device_type_or_parts','instances']];
    model.gear.forEach(x=>rows.push(['control_gear',x.name,x.shortAddress,x.group??'',x.deviceType||x.family,1]));
    model.controlDevices.forEach(x=>rows.push(['control_device',x.name,x.shortAddress,'',(x.parts||[]).join(','),x.instances]));
    return rows.map(r=>r.map(q).join(';')).join('\n')+'\n';
  }
  function daliInputCsv(model){const rows=[['class','device','short_address','instance','name','status']];model.controlDevices.forEach(x=>(x.instanceNames||[]).forEach(i=>rows.push(['control_device_instance',x.componentLabel||x.name,x.shortAddress,i.instance,i.name,'COMMISSIONAR_NO_CONTROLADOR'])));return rows.map(r=>r.map(q).join(';')).join('\n')+'\n';}
  function daliReadme(model,targetState,analysis){
    const warning=targetState?.state==='warning'?`\n## Integração externa\n\n${targetState.reason}\n`:'';
    return `# TechRib — DALI-2 / Comissionamento\n\nGerado por **${GENERATOR_ID}**.\n\nOs short addresses e grupos deste pacote são **sugestões de planejamento**, não valores lidos de uma instalação real. O comissionamento final deve ser feito no controlador/gateway DALI utilizado.\n\n- Control gear endereçado: ${model.gear.length}/64\n- Control devices endereçados: ${model.controlDevices.length}/64\n- Application Controllers detectados: ${model.controllers.length}\n- Fonte de barramento detectada: ${model.hasPsu?'sim':'não'}\n- Nomes personalizados: preservados como aliases do projeto, sem alterar endereços técnicos internos.\n${warning}\nO TechRib não gera uma configuração DALI/Home Assistant genérica quando nenhum gateway explicitamente suportado é identificado. Isso evita produzir arquivos que parecem válidos mas não correspondem à API do gateway real.\n`;
  }
  function knxDaliMapping(knx,dali){
    const rows=[['knx_group_address','knx_name','dali_short_address','dali_name','mapping_status']];
    const knxPoints=[...knx.switches.map(x=>({ga:x.command,name:x.name})),...knx.covers.map(x=>({ga:x.move,name:x.name}))];
    const n=Math.min(knxPoints.length,dali.gear.length);
    for(let i=0;i<n;i++)rows.push([knxPoints[i].ga,knxPoints[i].name,dali.gear[i].shortAddress,dali.gear[i].name,'SUGGESTED']);
    return rows.map(r=>r.map(q).join(';')).join('\n')+'\n';
  }
  function packagePreview(files,primary){
    const keys=Object.keys(files),p=primary&&files[primary]?primary:keys[0];
    return `PACOTE TECHRIB — ${GENERATOR_ID}\n\nArquivos:\n${keys.map(k=>' - '+k).join('\n')}\n\n--- ${p} ---\n${files[p]||''}`;
  }
  function buildResult(target,analysis,files,primary,summary,issues=[]){
    const state=targetInfo(target,analysis);return{target,kind:'integration',state,issues:[...(issues||[])],files,code:packagePreview(files,primary),filename:`techrib-${target}.zip`,summary,exportKind:'zip'};
  }
  function generate(target,analysis=analyzeProject()){
    const state=targetInfo(target,analysis);if(!state||state.state==='incompatible')return{target,kind:'integration',state:state||{state:'incompatible',reason:'Destino desconhecido.'},issues:[{level:'error',text:state?.reason||'Destino desconhecido.'}],files:null,code:'',filename:'',summary:'Geração bloqueada.',exportKind:'none'};
    const topology=currentTopology();
    if(target==='knx-commissioning'){
      const k=buildKnxModel(analysis,topology),files={'README.md':knxReadme(k,state),'knx/ets-group-addresses.csv':etsCsv(k),'knx/group-addresses-techrib.csv':knxMappingCsv(k),'knx/group-addresses.json':JSON.stringify({generator:GENERATOR_ID,...k},null,2)+'\n','knx/input-channels.csv':knxInputCsv(k)};
      return buildResult(target,analysis,files,'knx/group-addresses-techrib.csv',`KNX: ${k.switches.length} comutação(ões) • ${k.covers.length} persiana(s)`,k.issues);
    }
    if(target==='homeassistant-knx'){
      const k=buildKnxModel(analysis,topology),files={'README.md':knxReadme(k,state),'home-assistant/knx.yaml':haKnxYaml(k),'knx/ets-group-addresses.csv':etsCsv(k),'knx/group-addresses-techrib.csv':knxMappingCsv(k),'knx/input-channels.csv':knxInputCsv(k)};
      return buildResult(target,analysis,files,'home-assistant/knx.yaml',`Home Assistant / KNX • ${k.switches.length+k.covers.length} entidade(s) sugerida(s)`,k.issues);
    }
    if(target==='openhab-knx'){
      const k=buildKnxModel(analysis,topology),files={'README.md':knxReadme(k,state),'openhab/knx.things':openhabKnxThings(k),'openhab/knx.items':openhabKnxItems(k),'knx/ets-group-addresses.csv':etsCsv(k),'knx/group-addresses-techrib.csv':knxMappingCsv(k),'knx/input-channels.csv':knxInputCsv(k)};
      return buildResult(target,analysis,files,'openhab/knx.things',`openHAB / KNX • ${k.switches.length+k.covers.length} canal(is) sugerido(s)`,k.issues);
    }
    if(target==='dali-commissioning'){
      const d=buildDaliModel(analysis,topology),files={'README.md':daliReadme(d,state,analysis),'dali/dali-addresses.csv':daliCsv(d),'dali/control-device-instances.csv':daliInputCsv(d),'dali/dali-addresses.json':JSON.stringify({generator:GENERATOR_ID,...d},null,2)+'\n'};
      return buildResult(target,analysis,files,'dali/dali-addresses.csv',`DALI-2: ${d.gear.length} gear • ${d.controlDevices.length} control device(s)`,d.issues);
    }
    if(target==='homeassistant-dali'){
      const d=buildDaliModel(analysis,topology),files={'README.md':daliReadme(d,state,analysis),'dali/dali-addresses.csv':daliCsv(d),'dali/control-device-instances.csv':daliInputCsv(d),'home-assistant/INTEGRATION-PLAN.txt':`TechRib ${GENERATOR_ID}\n\n${state.reason}\n\nNenhum YAML universal de gateway foi gerado. Configure o gateway suportado em Home Assistant e use dali/dali-addresses.csv como mapa de comissionamento.\n`};
      return buildResult(target,analysis,files,'home-assistant/INTEGRATION-PLAN.txt',`Home Assistant / DALI • ${state.state==='warning'?'gateway pendente':'gateway reconhecido'}`,d.issues);
    }
    if(target==='knx-dali'){
      const k=buildKnxModel(analysis,topology),d=buildDaliModel(analysis,topology),files={'README.md':`# TechRib — KNX ↔ DALI\n\nGerado por **${GENERATOR_ID}**.\n\n${state.reason}\n\nO arquivo de mapeamento é uma **proposta** e deve ser ajustado aos objetos do gateway KNX/DALI real durante o comissionamento.\n`,'knx-dali/mapping.csv':knxDaliMapping(k,d),'knx/group-addresses-techrib.csv':knxMappingCsv(k),'dali/dali-addresses.csv':daliCsv(d),'dali/control-device-instances.csv':daliInputCsv(d),'knx/input-channels.csv':knxInputCsv(k)};
      return buildResult(target,analysis,files,'knx-dali/mapping.csv',`KNX ↔ DALI • proposta de ${Math.min(k.switches.length+k.covers.length,d.gear.length)} vínculo(s)`,[...k.issues,...d.issues]);
    }
    return{target,kind:'integration',state:{state:'incompatible',reason:'Destino não implementado.'},issues:[{level:'error',text:'Destino não implementado.'}],files:null,code:'',filename:'',summary:'Geração bloqueada.',exportKind:'none'};
  }
  function zipBlob(result){
    if(!result?.files)return null;const zip=root.TechRibIdfProjectGenerator;if(!zip?.createZipBytes)return null;const bytes=zip.createZipBytes(result.files,'techrib-integration');if(typeof Blob==='undefined')return bytes;return new Blob([bytes],{type:'application/zip'});
  }
  return Object.freeze({version:VERSION,generatorId:GENERATOR_ID,snapshotFromDom,analyzeSnapshot,analyzeProject,targetInfo,isIntegrationTarget,buildKnxModel,buildDaliModel,namingPoints,applyNamingEntries,generate,zipBlob,_test:{protocolsOf,familyOf,isKnx,isDali,isKnxIp,isSupportedHaDaliGateway,etsCsv,haKnxYaml,openhabKnxThings,daliCsv,knxInputCsv,daliInputCsv,parseNames,aliasFor}});
});
