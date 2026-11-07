(()=>{
'use strict';
const q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
const diagnosticComponents=()=>qa('.placed-component').filter(c=>c.dataset.diagnosticIgnore!=='true'&&c.dataset.type!=='functional-area-object');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(v,type='')=>Number.isFinite(Number(v))?`${Number(v).toFixed(Math.abs(Number(v))<10?2:1)} V${type==='AC'?'ac':type==='DC'?'dc':''}`:'—';
const terminalName=t=>t?.dataset?.terminalName||t?.dataset?.terminal||t?.dataset?.terminalMetaId||'?';
const terminalMeta=t=>({
 name:terminalName(t),domain:t?.dataset?.terminalDomain||'',function:t?.dataset?.terminalFunction||'',voltageClass:t?.dataset?.terminalVoltageClass||'',direction:t?.dataset?.terminalDirection||''
});
const terminalStates=t=>(t?.electricalState||[]).filter(Boolean);
const liveStates=t=>terminalStates(t).filter(s=>!s.reference);
const refStates=t=>terminalStates(t).filter(s=>s.reference);
const voltageClassSpec=value=>{
 const s=String(value||'').trim().toLowerCase().replace(/\s+/g,'');
 const aliases={
  '3v3':[3.3,'DC'],'3.3v':[3.3,'DC'],'3.3vdc':[3.3,'DC'],'5v':[5,'DC'],'5vdc':[5,'DC'],'12v':[12,'DC'],'12vdc':[12,'DC'],'24v':[24,'DC'],'24vdc':[24,'DC'],'48vdc':[48,'DC'],
  '24vac':[24,'AC'],'110vac':[110,'AC'],'127vac':[127,'AC'],'220vac':[220,'AC'],'230vac':[230,'AC'],'380vac':[380,'AC'],'400vac':[400,'AC'],'440vac':[440,'AC'],'480vac':[480,'AC']
 };
 if(aliases[s])return{voltage:aliases[s][0],type:aliases[s][1],label:value};
 const m=s.match(/(\d+(?:\.\d+)?)v?(ac|dc)/);return m?{voltage:Number(m[1]),type:m[2].toUpperCase(),label:value}:null;
};
const componentLabel=c=>c?.querySelector('small')?.textContent?.trim()||c?.dataset?.tag||c?.dataset?.label||c?.dataset?.type||c?.dataset?.componentId||'Componente';
const terminals=c=>qa('[data-terminal]',c).filter((t,i,a)=>a.findIndex(x=>x.dataset.terminal===t.dataset.terminal)===i);
const byTerminal=(c,name)=>terminals(c).find(t=>String(t.dataset.terminal||'').toUpperCase()===String(name).toUpperCase());
const registryDefinition=c=>c?.techribDefinition||window.TECHRIB_COMPONENT_REGISTRY?.[c?.dataset?.registryId||c?.dataset?.type||'']||null;
const registryTerminalDefinition=(c,t)=>registryDefinition(c)?.terminals?.[terminalName(t)]||null;
const logicVoltageSpec=(c,t,m)=>{
 let spec=voltageClassSpec(m?.voltageClass);if(spec)return spec;
 const def=registryTerminalDefinition(c,t)||{},definition=registryDefinition(c)||{},behavior=definition.behavior||{};
 const explicit=[def.logicVoltage,def.nominalVoltage,c?.dataset?.logicVoltage,behavior.logicVoltage].map(Number).find(v=>Number.isFinite(v)&&v>0);
 if(explicit)return{voltage:explicit,type:'DC',label:`${String(explicit).replace('.',',')} V`};
 const configurable=/configurable-(?:logic|control)/.test(String(m?.voltageClass||def.voltageClass||'').toLowerCase());
 const max=Number(def.maxVoltage||behavior.supplyMax||0);
 if(configurable&&Number.isFinite(max)&&max>0)return{voltage:max,type:'DC',label:`até ${String(max).replace('.',',')} V`};
 return null;
};
const isCoilTerminal=(c,t)=>{const m=terminalMeta(t),def=registryTerminalDefinition(c,t)||{},declared=String(`${def.type||''} ${def.function||''}`).toLowerCase().trim();return declared?/coil|bobina/.test(declared):m.function==='coil'};
const hasCoilPair=c=>{const a1=byTerminal(c,'A1'),a2=byTerminal(c,'A2');return Boolean(a1&&a2&&isCoilTerminal(c,a1)&&isCoilTerminal(c,a2))};
function measureBetween(a,b){
 const left=terminalStates(a),right=terminalStates(b);let best={voltage:0,type:'',found:false};
 for(const l of left)for(const r of right){
  if(!l||!r||l.source!==r.source||l.type!==r.type)continue;
  let v=0;
  if(l.type==='DC')v=Math.abs(Number(l.voltage||0)-Number(r.voltage||0));
  else if(l.type==='AC'){
   if(Boolean(l.reference)!==Boolean(r.reference))v=Math.max(Number(l.voltage||0),Number(r.voltage||0));
   else if(!l.reference&&!r.reference&&l.phase!==r.phase)v=Math.max(Number(l.lineVoltage||0),Number(r.lineVoltage||0),Number(l.voltage||0),Number(r.voltage||0));
   else v=Math.abs(Number(l.voltage||0)-Number(r.voltage||0));
  }
  if(v>best.voltage)best={voltage:v,type:l.type,found:true};
 }
 return best;
}
function stateSummary(t){
 const states=terminalStates(t);if(!states.length)return'sem tensão';
 const live=states.filter(s=>!s.reference);if(!live.length)return'retorno/referência presente';
 const s=live.sort((a,b)=>Number(b.voltage||0)-Number(a.voltage||0))[0];return fmt(s.voltage,s.type);
}
const issue=(level,title,details=[],cause='',component=null,terminal=null)=>({level,title,details:details.filter(Boolean),cause,component,terminal});
function diagnoseCoil(c){
 const a1=byTerminal(c,'A1'),a2=byTerminal(c,'A2');if(!a1||!a2)return[];
 const rated=Number(c.dataset.coilRatedVoltage||0),ratedType=String(c.dataset.coilType||'AC').toUpperCase(),m=measureBetween(a1,a2),on=c.dataset.coilEnergized==='true';
 const d=[`A1 = ${stateSummary(a1)}`,`A2 = ${stateSummary(a2)}`,rated?`Bobina nominal = ${rated} V${ratedType==='AC'?'ac':'dc'}`:''];
 if(!m.found||m.voltage<.5){
  const a1live=liveStates(a1).length>0,a2live=liveStates(a2).length>0,a1ref=refStates(a1).length>0,a2ref=refStates(a2).length>0;
  // Bobina sem tensão não é, por si só, uma falha: contatores normalmente ficam
  // desenergizados enquanto não existe ordem de comando. Mantemos ERRO apenas
  // quando há alimentação em um lado e falta o retorno no outro, ou quando os
  // dois lados estão ativos mas sem diferença de potencial útil.
  if(a1live&&!a2live&&!a2ref)return[issue('ERRO',`${componentLabel(c)} — circuito da bobina incompleto`,d,'A1 possui alimentação, mas A2 está sem retorno.',c)];
  if(a2live&&!a1live&&!a1ref)return[issue('ERRO',`${componentLabel(c)} — circuito da bobina incompleto`,d,'A2 possui alimentação, mas A1 está sem retorno.',c)];
  if(a1live&&a2live)return[issue('ERRO',`${componentLabel(c)} — sem diferença de potencial na bobina`,d,'A1 e A2 estão energizados, mas não há diferença de potencial suficiente entre os terminais.',c)];
  const referenceSide=a1ref?'A1':a2ref?'A2':'';
  const cause=referenceSide?`${referenceSide} possui retorno/referência e o outro terminal ainda não recebeu comando.`:'nenhuma tensão de comando foi detectada em A1/A2.';
  return[issue('AVISO',`${componentLabel(c)} — bobina desenergizada`,d,`${cause} Estado normal enquanto não houver ordem de acionamento.`,c)];
 }
 if(ratedType&&m.type&&ratedType!==m.type)return[issue('ERRO',`${componentLabel(c)} — tipo de tensão incompatível`,[...d,`Tensão medida = ${fmt(m.voltage,m.type)}`],`a bobina é ${ratedType}, mas a rede detectada é ${m.type}.`,c)];
 if(rated){const ratio=m.voltage/rated;if(ratio<.85)return[issue('ERRO',`${componentLabel(c)} — subtensão na bobina`,[...d,`Tensão medida = ${fmt(m.voltage,m.type)}`],`a tensão está abaixo da faixa necessária para a bobina de ${rated} V.`,c)];if(ratio>1.15)return[issue('ERRO',`${componentLabel(c)} — sobretensão na bobina`,[...d,`Tensão medida = ${fmt(m.voltage,m.type)}`],`a tensão excede a nominal da bobina de ${rated} V.`,c)];}
 if(!on)return[issue('AVISO',`${componentLabel(c)} recebeu tensão, mas não energizou`,[...d,`Tensão medida = ${fmt(m.voltage,m.type)}`],'a alimentação parece compatível; revisar lógica interna/estado de acionamento da contatora.',c)];
 return[issue('OK',`${componentLabel(c)} — bobina energizada`,[...d,`Tensão medida = ${fmt(m.voltage,m.type)}`],'alimentação da bobina compatível.',c)];
}
function diagnoseLogicTerminal(c,t){
 const type=String(c?.dataset?.type||'');if(/^(?:resid-interruptor-simples|resid-three-way|resid-four-way)$/.test(type))return[];
 const m=terminalMeta(t),name=m.name.toUpperCase(),isGpio=/^GPIO\d+/.test(name)||/digital-(?:io|input|output)/.test(m.function);if(!isGpio)return[];
 const states=liveStates(t);if(!states.length)return[];
 let spec=logicVoltageSpec(c,t,m);if(!spec&&/esp32|esp8266/.test(String(c.dataset.type||c.dataset.registryId||'').toLowerCase()))spec={voltage:3.3,type:'DC',label:'3,3 V'};
 if(!spec)return[issue('AVISO',`${componentLabel(c)} ${m.name}`,['Limite lógico = não configurado'],'borne lógico energizado sem limite elétrico conhecido; configure voltageClass/logicVoltage para validar sobretensão.',c,t)];
 const s=states.sort((a,b)=>Number(b.voltage||0)-Number(a.voltage||0))[0],v=Math.abs(Number(s.voltage||0));
 if(s.type&&spec.type&&s.type!==spec.type)return[issue('ERRO',`${componentLabel(c)} ${m.name}`,[`Tensão detectada = ${fmt(v,s.type)}`,`Limite = ${String(spec.voltage).replace('.',',')} V${spec.type==='AC'?'ac':'dc'}`],`tipo de rede incompatível: o borne espera ${spec.type} e recebeu ${s.type}.`,c,t)];
 if(v>spec.voltage*1.08)return[issue('ERRO',`${componentLabel(c)} ${m.name}`,[`Tensão detectada = ${fmt(v,s.type||spec.type)}`,`Limite = ${String(spec.voltage).replace('.',',')} V${spec.type==='AC'?'ac':'dc'}`],`sobretensão no ${/^GPIO/.test(name)?'GPIO':'borne lógico'}.`,c,t)];
 return[issue('OK',`${componentLabel(c)} ${m.name}`,[`Tensão detectada = ${fmt(v,s.type||spec.type)}`,`Limite = ${String(spec.voltage).replace('.',',')} V${spec.type==='AC'?'ac':'dc'}`],'nível elétrico compatível.',c,t)];
}
function diagnoseMotor(c){
 if(!(String(c.dataset.type||'').startsWith('motor-')||String(c.dataset.type||'').startsWith('bomba-')))return[];
 if(c.dataset.electricalRunning==='true')return[issue('OK',`${componentLabel(c)} em funcionamento`,[c.dataset.motorElectricalStatus||'alimentação válida'],'estado elétrico calculado indica marcha.',c)];
 return[issue('AVISO',`${componentLabel(c)} não está em marcha`,[c.dataset.motorElectricalStatus||'sem condição de funcionamento'],'verificar presença das fases, sequência/rede de potência e dispositivos de proteção/comando a montante.',c)];
}
function diagnoseComponent(c){
 if(!c)return[];let out=[];const type=String(c.dataset.type||'');
 if(['contator','contator-2','contator-4p'].includes(type)||hasCoilPair(c))out.push(...diagnoseCoil(c));
 terminals(c).forEach(t=>out.push(...diagnoseLogicTerminal(c,t)));
 out.push(...diagnoseMotor(c));
 if(c.dataset.logicFault==='true')out.push(issue('ERRO',`${componentLabel(c)} — falha lógica`,[c.dataset.logicFaultDetails||'',c.dataset.logicFaultPin?`Borne = ${c.dataset.logicFaultPin}`:'',c.dataset.logicFaultVoltage?`Tensão = ${c.dataset.logicFaultVoltage} V`:'' ],c.dataset.logicFaultLabel||'condição elétrica incompatível detectada pelo motor lógico.',c));
 if(c.dataset.meterError)out.push(issue('ERRO',`${componentLabel(c)} — instrumento`,[c.dataset.meterError],'configuração de medição inválida.',c));
 return out;
}
function diagnoseFaults(selected=null){
 const e=window.TECHRIB_ELECTRICAL,runtime=window.TechRibElectricalFaults;if(!e?.wires||!runtime?.summarizeWireFaults)return[];
 const selectedId=selected?.dataset?.componentId||'';
 const faultWires=selectedId?e.wires.filter(w=>[w.from,w.to].some(ep=>ep?.type==='terminal'&&ep.el?.closest?.('.placed-component')?.dataset?.componentId===selectedId)):e.wires;
 return runtime.summarizeWireFaults(faultWires).map(group=>issue('ERRO',group.fault.title,runtime.detailsForGroup?.(group)||[],group.fault.cause,selected||group.wires?.[0]?.from?.el?.closest?.('.placed-component')||group.wires?.[0]?.to?.el?.closest?.('.placed-component')||null,null));
}
function diagnoseProtectionTrips(selected=null){
 const nodes=selected?(selected.dataset.diagnosticIgnore==='true'?[]:[selected]):diagnosticComponents();
 return nodes.filter(c=>c.dataset.tripReason==='short-circuit'||c.dataset.shortCircuitTrip==='true'||c.dataset.fuseBlown==='true').map(c=>{
  const title=c.dataset.lastFaultTitle||'Curto-circuito';
  const code=c.dataset.lastFaultCode||'SHORT_CIRCUIT';
  const fuse=c.dataset.fuseBlown==='true';
  return issue('ERRO',`${componentLabel(c)} — ${fuse?'fusível atuou':'proteção disparou'}`,[`Falha registrada = ${title}`,`Código = ${code}`,`Estado = ${fuse?'FUSÍVEL ABERTO':'DISPARADO / ABERTO'}`],`o dispositivo interrompeu o circuito após detectar ${title.toLowerCase()}. Elimine a causa antes de rearmar/substituir a proteção.`,c);
 });
}
function diagnoseWires(){
 const e=window.TECHRIB_ELECTRICAL;if(!e?.wires)return[];return e.wires.map(w=>{
  if(w.fault||!w.validation||w.validation.level==='OK')return null;
  const message=String(w.validation.message||'');
  // Derivações/junções são validadas pela rede completa; este aviso genérico é informativo e
  // não deve poluir o painel com dezenas de falsos positivos. A validação original permanece no fio.
  if(w.validation.level==='AVISO'&&/^Ligação com derivação\/junção: validação depende da rede conectada\.?$/i.test(message))return null;
  return issue(w.validation.level,`Condutor ${w.number||''}`,[w.identification&&w.identification!==w.number?`Identificação = ${w.identification}`:''],message||'incompatibilidade elétrica detectada.',null,null);
 }).filter(Boolean);
}
function topologyIssues(scope='all',selected=null){
 const runtime=window.TechRibDiagnosticTopology,e=window.TECHRIB_ELECTRICAL;if(!runtime?.analyze||!e?.wires)return[];
 try{return runtime.analyze({components:diagnosticComponents(),wires:e.wires,registry:window.TECHRIB_COMPONENT_REGISTRY||{},target:scope==='selected'?selected:null})||[]}catch(error){console.error('TechRib: falha no diagnóstico topológico',error);return[issue('AVISO','Diagnóstico topológico indisponível',[],error.message||'não foi possível analisar o caminho de proteção do motor.')]}
}
function run(scope='all'){
 const e=window.TECHRIB_ELECTRICAL;if(!e?.simulationActive)return[issue('AVISO','Simulação elétrica parada',[],'inicie a simulação para que o diagnóstico tenha tensões e estados reais da rede.')];
 let list=[],selected=null;if(scope==='selected'){selected=q('.placed-component.selected');if(!selected)return[issue('AVISO','Nenhum componente selecionado',[],'selecione um componente no canvas e execute novamente.')];list.push(...diagnoseFaults(selected));list.push(...diagnoseProtectionTrips(selected));list.push(...diagnoseComponent(selected));list.push(...topologyIssues(scope,selected));}
 else{list.push(...diagnoseFaults());list.push(...diagnoseProtectionTrips());diagnosticComponents().forEach(c=>list.push(...diagnoseComponent(c)));list.push(...diagnoseWires());list.push(...topologyIssues(scope));}
 const significant=list.filter(x=>x.level!=='OK');return significant.length?significant:(list.length?list:[issue('OK','Nenhuma anomalia encontrada',[],'os estados analisados estão eletricamente coerentes no momento.')]);
}
function makePanel(){
 if(q('#techrib-diagnostic-panel'))return;
 const panel=document.createElement('aside');panel.id='techrib-diagnostic-panel';panel.innerHTML=`<header><div><small data-diag-mode>MODO EDITAR</small><strong>Diagnóstico elétrico</strong></div><button type="button" data-diag-close>×</button></header><div class="diag-actions"><button type="button" data-diag-all>Circuito inteiro</button><button type="button" data-diag-selected>Selecionado</button></div><div class="diag-debug"><button type="button" data-diag-debug-toggle>Ativar diagnóstico visual</button><div class="diag-debug-options"><label><input type="checkbox" data-diag-debug-option="terminals"> Bornes/potenciais</label><label><input type="checkbox" data-diag-debug-option="hitboxes"> Hitboxes</label><label><input type="checkbox" data-diag-debug-option="networks"> Redes/fios</label><label><input type="checkbox" data-diag-debug-option="i2c"> I²C</label><label><input type="checkbox" data-diag-debug-option="faults" checked> Falhas</label></div><div class="diag-debug-state" data-diag-debug-state>Overlay desligado</div></div><div class="diag-summary"></div><div class="diag-results"></div>`;document.body.appendChild(panel);
 const syncDebug=()=>{const visual=window.TechRibVisualDiagnostics,snap=visual?.snapshot?.()||{enabled:false,options:{}};const toggle=q('[data-diag-debug-toggle]',panel);if(toggle){toggle.classList.toggle('active',snap.enabled);toggle.textContent=snap.enabled?'Desativar diagnóstico visual':'Ativar diagnóstico visual'}qa('[data-diag-debug-option]',panel).forEach(input=>{const name=input.dataset.diagDebugOption;if(name in (snap.options||{}))input.checked=Boolean(snap.options[name])});const state=q('[data-diag-debug-state]',panel);if(state)state.textContent=snap.enabled?`${snap.simulationActive?'Simulação ativa':'Simulação parada'} • ${snap.faultCount||0} falha(s) visível(is)`:'Overlay desligado';const mode=q('[data-diag-mode]',panel);if(mode){const active=window.TECHRIB_ELECTRICAL?.simulationActive,paused=window.TechRibSimulationMode?.state?.paused===true;mode.textContent=!active?'MODO EDITAR':paused?'SIMULAÇÃO PAUSADA':'MODO SIMULAR'}};
 panel.addEventListener('change',ev=>{const input=ev.target.closest('[data-diag-debug-option]');if(!input)return;window.TechRibVisualDiagnostics?.setOption?.(input.dataset.diagDebugOption,input.checked);syncDebug()});
 panel.addEventListener('click',ev=>{if(ev.target.closest('[data-diag-close]'))panel.classList.remove('open');if(ev.target.closest('[data-diag-all]'))render('all');if(ev.target.closest('[data-diag-selected]'))render('selected');if(ev.target.closest('[data-diag-debug-toggle]')){const visual=window.TechRibVisualDiagnostics;if(visual)visual.setEnabled(!visual.enabled);syncDebug()}const card=ev.target.closest('.diag-card[data-diag-target]');if(card){const target=q(`.placed-component[data-component-id="${CSS.escape(card.dataset.diagTarget)}"]`);if(target){target.scrollIntoView({behavior:'smooth',block:'center',inline:'center'});target.animate?.([{filter:'drop-shadow(0 0 0 rgba(245,158,11,0))'},{filter:'drop-shadow(0 0 14px rgba(245,158,11,.95))'},{filter:'drop-shadow(0 0 0 rgba(245,158,11,0))'}],{duration:1100,easing:'ease-out'});}}});
 panel.techribSyncDebug=syncDebug;document.addEventListener('techrib:simulation-mode',syncDebug);syncDebug();
}
function render(scope='all'){
 makePanel();const panel=q('#techrib-diagnostic-panel'),results=run(scope),counts={ERRO:0,AVISO:0,OK:0};results.forEach(r=>counts[r.level]=(counts[r.level]||0)+1);
 q('.diag-summary',panel).innerHTML=`<b>${scope==='selected'?'Componente selecionado':'Circuito inteiro'}</b><span class="err">${counts.ERRO} erro(s)</span><span class="warn">${counts.AVISO} aviso(s)</span><span class="ok">${counts.OK} ok</span>`;
 q('.diag-results',panel).innerHTML=results.map(r=>{const target=r.component?.dataset?.componentId||'';return `<article class="diag-card ${r.level.toLowerCase()}"${target?` data-diag-target="${esc(target)}" title="Clique para localizar ${esc(componentLabel(r.component))}"`:''}><div class="diag-level">${esc(r.level)}</div><h3>${esc(r.title)}</h3>${r.details.length?`<dl>${r.details.map(x=>`<div><dd>${esc(x)}</dd></div>`).join('')}</dl>`:''}<div class="diag-cause"><b>Causa:</b> ${esc(r.cause)}</div></article>`}).join('');panel.techribSyncDebug?.();window.TechRibVisualDiagnostics?.refresh?.();panel.classList.add('open');
}
function installButton(){
 const host=q('.top-actions')||q('.cad-tools')||document.body;let b=q('[data-action="diagnostic"]');if(!b){b=document.createElement('button');b.type='button';b.dataset.action='diagnostic';b.className=host.classList.contains('top-actions')?'top-action diagnostic-action':'diagnostic-action';b.title='Explicar tecnicamente falhas elétricas';host.insertBefore(b,host.firstChild)}b.innerHTML='<svg class="top-action-svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg><b>Diagnóstico</b>';b.onclick=()=>render(q('.placed-component.selected')?'selected':'all');
}
makePanel();installButton();
window.TechRibDiagnostic={run,render,diagnoseComponent,diagnoseWires,diagnoseFaults,diagnoseProtectionTrips};
})();
