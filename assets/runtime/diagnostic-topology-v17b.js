(function(global){
  'use strict';

  const upper=value=>String(value||'').trim().toUpperCase();
  const componentType=c=>String(c?.dataset?.type||c?.dataset?.registryId||'');
  const componentId=c=>String(c?.dataset?.componentId||'');
  const label=c=>c?.querySelector?.('small')?.textContent?.trim()||c?.dataset?.tag||c?.dataset?.label||componentType(c)||componentId(c)||'COMP?';
  const uniqueTerminals=c=>{
    const all=[...(c?.querySelectorAll?.('[data-terminal]')||[])];
    return all.filter((t,i)=>all.findIndex(x=>upper(x.dataset.terminal)===upper(t.dataset.terminal))===i);
  };
  const allTerminals=c=>[...(c?.querySelectorAll?.('[data-terminal]')||[])];
  const terminalName=t=>upper(t?.dataset?.terminal||t?.dataset?.terminalName||'');
  const defFor=(registry,c)=>registry?.[componentType(c)]||registry?.[c?.dataset?.registryId]||null;
  const behaviorType=(registry,c)=>String(defFor(registry,c)?.behavior?.type||c?.dataset?.behaviorType||'').toLowerCase();
  const isMotor=(registry,c)=>{
    const type=componentType(c),behavior=behaviorType(registry,c);
    return type.startsWith('motor-')||type.startsWith('bomba-')||behavior==='three-phase-load'||behavior==='motor-load';
  };
  const isSource=(registry,c)=>{
    const type=componentType(c),behavior=behaviorType(registry,c);
    return behavior==='ac-source'||/^fonte-(?:tri|bi|mono)fasica/.test(type)||type==='ac-three-n'||type==='ac-three-pe'||type==='ac-two-n'||type==='ac-one-n';
  };
  const isPhaseRelay=(registry,c)=>componentType(c)==='rele-falta-fase'||componentType(c)==='rele-falta-de-fase'||behaviorType(registry,c)==='phase-relay';
  const isOverload=(registry,c)=>componentType(c)==='rele-termico'||componentType(c)==='disjuntor-motor-mpcb'||behaviorType(registry,c)==='thermal-overload';
  const isCircuitProtection=(registry,c)=>{
    const type=componentType(c),behavior=behaviorType(registry,c);
    return type==='disjuntor-motor-mpcb'||/^disjuntor-(?:1p|2p|3p|4p)/.test(type)||/^disjuntor-dr-/.test(type)||type==='chave-seccionadora-fusivel'||/^fusivel(?:-|$)/.test(type)||behavior==='motor-protection';
  };
  const isContactor=(registry,c)=>behaviorType(registry,c)==='contactor'||['contator','contator-2','contator-4p','contator-12vac','contator-24vac','contator-reversor'].includes(componentType(c));

  const staticPairs=(registry,c)=>{
    const type=componentType(c),behavior=behaviorType(registry,c),pairs=[];
    const add=(a,b)=>pairs.push([upper(a),upper(b)]);
    if(type==='disjuntor-motor-mpcb'||type==='chave-seccionadora'||type==='chave-seccionadora-fusivel'){
      [['L1','T1'],['L2','T2'],['L3','T3']].forEach(p=>add(...p));
    }else if(/^disjuntor-(?:1p|2p|3p|4p)$/.test(type)||/^disjuntor-dr-(?:1p|2p|3p|4p)$/.test(type)){
      [['1','2'],['3','4'],['5','6'],['7','8']].forEach(p=>add(...p));
    }else if(behavior==='contactor'||['contator','contator-2','contator-4p','contator-12vac','contator-24vac'].includes(type)){
      [['L1','T1'],['L2','T2'],['L3','T3'],['L4','T4']].forEach(p=>add(...p));
    }else if(type==='contator-reversor'){
      [['L1','U'],['L2','V'],['L3','W']].forEach(p=>add(...p));
    }else if(type==='rele-termico'||behavior==='thermal-overload'){
      [['T1','2'],['T2','4'],['T3','6']].forEach(p=>add(...p));
    }else if(type==='soft-starter'||behavior==='soft-starter'){
      [['L1','U'],['L2','V'],['L3','W']].forEach(p=>add(...p));
    }else if(type==='inversor-frequencia'||behavior==='vfd'||behavior==='vfd-realistic'){
      [['L1','U'],['L2','V'],['L3','W']].forEach(p=>add(...p));
    }else if(type==='scr-power-stage-3p'){
      [['L1','T1'],['L2','T2'],['L3','T3'],['L1','U'],['L2','V'],['L3','W']].forEach(p=>add(...p));
    }else if(type==='chave-estrela-triangulo-manual'){
      [['L1','U1'],['L2','V1'],['L3','W1']].forEach(p=>add(...p));
    }
    return pairs;
  };

  function createGraph({components,wires,registry}){
    const graph=new Map(),sourceByTerminal=new Map(),terminalOwner=new Map();
    const add=(a,b,via=null,kind='wire')=>{
      if(!a||!b)return;
      if(!graph.has(a))graph.set(a,[]);if(!graph.has(b))graph.set(b,[]);
      graph.get(a).push({to:b,via,kind});graph.get(b).push({to:a,via,kind});
    };
    const junctionKey=ep=>`junction:${ep?.junction?.id||ep?.id||ep?.junctionId||'?'}`;
    const endpoint=ep=>ep?.type==='terminal'?ep.el:junctionKey(ep);
    (wires||[]).forEach(w=>add(endpoint(w.from),endpoint(w.to),null,'wire'));

    (components||[]).forEach(c=>{
      const all=allTerminals(c),byName=new Map();
      all.forEach(t=>{terminalOwner.set(t,c);const n=terminalName(t);if(!byName.has(n))byName.set(n,[]);byName.get(n).push(t)});
      // SVGs legados podem ter duas áreas para o mesmo borne. Elas são o mesmo nó lógico.
      byName.forEach(group=>{for(let i=1;i<group.length;i++)add(group[0],group[i],null,'alias')});
      staticPairs(registry,c).forEach(([a,b])=>{
        const aa=byName.get(a)||[],bb=byName.get(b)||[];
        aa.forEach(x=>bb.forEach(y=>add(x,y,c,'component')));
      });
      if(isSource(registry,c)){
        const def=defFor(registry,c),terms=uniqueTerminals(c);
        terms.forEach(t=>{
          const n=terminalName(t),td=def?.terminals?.[t.dataset.terminal]||{},phase=upper(td.phase||n),fn=String(td.function||t.dataset.terminalFunction||'').toLowerCase(),domain=String(td.domain||t.dataset.terminalDomain||'').toLowerCase();
          if(/^L[123]$/.test(n)||/^L[123]$/.test(phase)||((fn.includes('line')||fn.includes('phase'))&&domain!=='protective-earth'))sourceByTerminal.set(t,c);
        });
      }
    });
    return{graph,sourceByTerminal,terminalOwner,add};
  }

  function walkSources(start,ctx,blocked=null){
    const found=new Set(),queue=[start],seen=new Set();
    while(queue.length){
      const node=queue.shift();if(!node||seen.has(node))continue;seen.add(node);
      const source=ctx.sourceByTerminal.get(node);if(source)found.add(source);
      (ctx.graph.get(node)||[]).forEach(edge=>{if(blocked&&edge.via===blocked)return;if(!seen.has(edge.to))queue.push(edge.to)});
    }
    return found;
  }

  function pathToSource(start,ctx){
    const queue=[start],seen=new Set([start]),prev=new Map();let goal=null;
    while(queue.length){
      const node=queue.shift();if(ctx.sourceByTerminal.has(node)){goal=node;break}
      for(const edge of ctx.graph.get(node)||[]){if(seen.has(edge.to))continue;seen.add(edge.to);prev.set(edge.to,{node,edge});queue.push(edge.to)}
    }
    if(!goal)return null;
    const edges=[];let cur=goal;while(cur!==start){const item=prev.get(cur);if(!item)break;edges.push(item.edge);cur=item.node}edges.reverse();
    return{goal,source:ctx.sourceByTerminal.get(goal),edges};
  }

  const motorPowerTerminals=c=>{
    const terms=uniqueTerminals(c),preferred=['U1','V1','W1'].map(n=>terms.find(t=>terminalName(t)===n)).filter(Boolean);
    if(preferred.length>=2)return preferred;
    return['U','V','W'].map(n=>terms.find(t=>terminalName(t)===n)).filter(Boolean);
  };

  function componentCutsAllFeeds(candidate,powerTerms,ctx){
    if(!powerTerms.length||!powerTerms.every(t=>walkSources(t,ctx).size>0))return false;
    return powerTerms.every(t=>walkSources(t,ctx,candidate).size===0);
  }

  function relayMonitorsSources(relay,motorSources,ctx){
    if(!motorSources.size)return false;
    const terms=uniqueTerminals(relay),phaseTerms=['L1','L2','L3'].map(n=>terms.find(t=>terminalName(t)===n)).filter(Boolean);
    if(phaseTerms.length<3)return false;
    return phaseTerms.every(t=>[...walkSources(t,ctx)].some(src=>motorSources.has(src)));
  }

  function analyzeMotor(motor,{components,wires,registry,ctx}){
    ctx=ctx||createGraph({components,wires,registry});
    const tag=label(motor),powerTerms=motorPowerTerminals(motor),issues=[];
    if(powerTerms.length<2)return{motor,tag,issues,ok:false,chain:'',sources:[],overloads:[],circuitProtections:[],phaseRelays:[]};
    const phaseSourceSets=powerTerms.map(t=>walkSources(t,ctx)),motorSources=new Set(phaseSourceSets.flatMap(s=>[...s]));
    const allFed=phaseSourceSets.every(s=>s.size>0),sourceIds=new Set([...motorSources].map(componentId));
    const sourceConsistent=sourceIds.size<=1;
    const firstPath=pathToSource(powerTerms[0],ctx),via=[];
    if(firstPath)firstPath.edges.forEach(e=>{if(e.via&&!via.includes(e.via))via.push(e.via)});
    const chainParts=firstPath?[label(firstPath.source),...via.slice().reverse().map(label),tag]:[tag];
    const chain=[...new Set(chainParts)].join(' → ');
    const overloads=(components||[]).filter(c=>isOverload(registry,c)&&componentCutsAllFeeds(c,powerTerms,ctx));
    const circuitProtections=(components||[]).filter(c=>isCircuitProtection(registry,c)&&componentCutsAllFeeds(c,powerTerms,ctx));
    const contactors=(components||[]).filter(c=>isContactor(registry,c)&&componentCutsAllFeeds(c,powerTerms,ctx));
    const allOverloads=(components||[]).filter(c=>isOverload(registry,c));
    const allCircuit=(components||[]).filter(c=>isCircuitProtection(registry,c));
    const phaseRelays=(components||[]).filter(c=>isPhaseRelay(registry,c)&&relayMonitorsSources(c,motorSources,ctx));
    const allPhaseRelays=(components||[]).filter(c=>isPhaseRelay(registry,c));
    const threePhase=powerTerms.length>=3;

    if(!allFed){
      issues.push({level:'ERRO',title:`${tag} — ramo de potência não alcança a fonte`,details:[chain?`Caminho encontrado: ${chain}`:'',`Fases com caminho até fonte: ${phaseSourceSets.filter(s=>s.size).length}/${powerTerms.length}`],cause:'há condutores nos bornes do motor, mas pelo menos um caminho de potência não chega a uma fonte AC através dos equipamentos em série.',component:motor,code:'MOTOR_NO_SOURCE'});
    }else if(!sourceConsistent){
      issues.push({level:'ERRO',title:`${tag} — alimentação proveniente de fontes diferentes`,details:[`Caminho de referência: ${chain}`,`Fontes encontradas: ${[...motorSources].map(label).join(', ')}`],cause:'as fases do motor não convergem para a mesma fonte de alimentação no grafo topológico.',component:motor,code:'MOTOR_MIXED_SOURCES'});
    }
    if(allFed&&!overloads.length){
      const other=allOverloads.length?`Existe ${allOverloads.map(label).join(', ')} na prancha, porém não está em série com este motor.`:'Nenhum relé térmico/MPCB foi encontrado.';
      issues.push({level:'AVISO',title:`${tag} — proteção térmica ausente no ramo`,details:[`Caminho: ${chain}`,other],cause:'para contar como proteção, o relé térmico ou MPCB precisa interromper todos os caminhos de potência entre a fonte e este motor.',component:motor,code:'MOTOR_NO_OVERLOAD'});
    }
    if(allFed&&!circuitProtections.length){
      const other=allCircuit.length?`Existe ${allCircuit.map(label).join(', ')} na prancha, porém não protege este ramo.`:'Nenhum disjuntor/MPCB/fusível foi encontrado.';
      issues.push({level:'AVISO',title:`${tag} — proteção de circuito ausente no ramo`,details:[`Caminho: ${chain}`,other],cause:'o motor deve possuir proteção a montante no próprio caminho de alimentação; um dispositivo em outro circuito não protege este ramo.',component:motor,code:'MOTOR_NO_CIRCUIT_PROTECTION'});
    }
    const trippedProtections=overloads.filter(p=>p.dataset?.tripped==='true'||p.dataset?.protectionTripped==='true'||p.dataset?.overloadState==='tripped');
    const timingProtections=overloads.filter(p=>p.dataset?.overloadState==='timing'&&Number(p.dataset?.overloadRatio||0)>1.05);
    if(trippedProtections.length){
      const details=trippedProtections.map(p=>`${label(p)}: ${Number(p.dataset?.measuredCurrent||0).toFixed(2)} A / ajuste ${Number(p.dataset?.currentSetting||0).toFixed(2)} A`);
      issues.push({level:'ERRO',title:`${tag} — proteção disparada por sobrecarga`,details:[`Caminho: ${chain}`,...details],cause:'a proteção em série atingiu a curva didática de sobrecarga e permanece travada até rearme manual.',component:motor,code:'MOTOR_OVERLOAD_TRIPPED'});
    }else if(timingProtections.length){
      const details=timingProtections.map(p=>`${label(p)}: ${(Number(p.dataset?.overloadRatio||0)*100).toFixed(0)}% do ajuste • ${Number(p.dataset?.measuredCurrent||0).toFixed(2)} A / ${Number(p.dataset?.currentSetting||0).toFixed(2)} A`);
      issues.push({level:'AVISO',title:`${tag} — sobrecarga em temporização`,details:[`Caminho: ${chain}`,...details],cause:'a corrente simulada está acima do ajuste da proteção; o TechRib usa uma curva didática acelerada, não uma curva IEC certificada.',component:motor,code:'MOTOR_OVERLOAD_TIMING'});
    }
    if(allFed&&threePhase&&!phaseRelays.length){
      const other=allPhaseRelays.length?`Existe ${allPhaseRelays.map(label).join(', ')}, mas ele monitora outra alimentação ou está incompleto.`:'Nenhum relé de falta/inversão de fase foi identificado.';
      issues.push({level:'AVISO',title:`${tag} — supervisão de fases não vinculada à alimentação do motor`,details:[`Caminho: ${chain}`,other],cause:'a regra TechRib só considera o relé de fase quando L1/L2/L3 dele alcançam a mesma fonte que alimenta este motor.',component:motor,code:'MOTOR_NO_PHASE_MONITOR'});
    }
    if(!issues.length){
      issues.push({level:'OK',title:`${tag} — proteção topológica coerente`,details:[`Caminho: ${chain}`,`Proteção térmica: ${overloads.map(label).join(', ')||'—'}`,`Proteção de circuito: ${circuitProtections.map(label).join(', ')||'—'}`,threePhase?`Supervisão de fases: ${phaseRelays.map(label).join(', ')||'—'}`:'',contactors.length?`Comando em série: ${contactors.map(label).join(', ')}`:''],cause:'os dispositivos identificados pertencem ao mesmo ramo elétrico do motor e interrompem/monitoram a alimentação correspondente.',component:motor,code:'MOTOR_TOPOLOGY_OK'});
    }
    motor.dataset.diagnosticPowerPath=chain;
    motor.dataset.diagnosticOverloadProtection=overloads.map(label).join(', ');
    motor.dataset.diagnosticCircuitProtection=circuitProtections.map(label).join(', ');
    motor.dataset.diagnosticPhaseMonitor=phaseRelays.map(label).join(', ');
    return{motor,tag,issues,ok:!issues.some(i=>i.level!=='OK'),chain,sources:[...motorSources],overloads,circuitProtections,phaseRelays,contactors};
  }

  function analyze({components,wires,registry,target=null}={}){
    components=components||[...document.querySelectorAll('.placed-component')];
    wires=wires||global.TECHRIB_ELECTRICAL?.wires||[];
    registry=registry||global.TECHRIB_COMPONENT_REGISTRY||{};
    const ctx=createGraph({components,wires,registry});
    const motors=target?(isMotor(registry,target)?[target]:[]):components.filter(c=>isMotor(registry,c));
    return motors.flatMap(m=>analyzeMotor(m,{components,wires,registry,ctx}).issues);
  }

  global.TechRibDiagnosticTopology={createGraph,analyze,analyzeMotor,isMotor,isOverload,isCircuitProtection,isPhaseRelay,staticPairs,walkSources,componentCutsAllFeeds};
})(window);
