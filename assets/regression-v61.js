(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const hooks=()=>window.TechRibRegressionHooks;
const CHECKS=['fio','terminal','anilha','curva','perfil','bitola','tensao','simulacao','salvamento','carregamento'];
const baselineKey='techrib.regression.v64.current-project.baselines';
const clone=x=>JSON.parse(JSON.stringify(x));
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const check=(passed,detail='')=>({passed:Boolean(passed),detail});
const terminalMeta=t=>({name:t?.dataset.terminal||'',domain:t?.dataset.terminalDomain||'',fn:t?.dataset.terminalFunction||'',voltage:t?.dataset.terminalVoltageClass||''});
const endpointIsTerminal=e=>e?.type==='terminal';
const expectedMarkers=wires=>wires.reduce((sum,w)=>sum+(endpointIsTerminal(w.from)?1:0)+(endpointIsTerminal(w.to)?1:0),0);
const renderedMarkers=wires=>wires.reduce((sum,w)=>sum+(w.annotations?.filter(n=>n.classList?.contains('wire-terminal-marker')).length||0),0);
const projectWireProps=data=>(data?.wires||[]).map(w=>({number:String(w.number??''),identification:String(w.identification??w.number??''),color:String(w.color??''),profile:String(w.profile??''),crossSectionMm2:Number(w.crossSectionMm2),crossSectionMode:String(w.crossSectionMode??'auto'),visualThickness:String(w.visualThickness??'auto'),terminalType:String(w.terminalType??'ferrule'),from:w.from,to:w.to,waypoints:(w.waypoints||[]).map(p=>({x:Number(p.x),y:Number(p.y),manual:p.manual!==false}))}));
const normalizedTerminalMetadata=c=>(c?.terminalMetadata||[]).map(m=>({id:String(m?.id||''),name:String(m?.name||''),domain:String(m?.domain||''),function:String(m?.function||''),voltageClass:String(m?.voltageClass||''),direction:String(m?.direction||'')}));
const comparableProject=data=>({
 name:String(data?.name||''),format:String(data?.format||''),titleFields:(data?.titleFields||[]).map(String),
 components:(data?.components||[]).map(c=>({type:String(c.type||''),componentId:String(c.componentId||''),label:String(c.label||''),left:String(c.left||''),top:String(c.top||''),terminalMetadata:normalizedTerminalMetadata(c)})),
 junctions:(data?.junctions||[]).map(j=>({id:String(j.id||''),x:Number(j.x),y:Number(j.y)})),
 wires:projectWireProps(data)
});
const sameSavedState=(before,after)=>JSON.stringify(comparableProject(before))===JSON.stringify(comparableProject(after));
const markerCapacity=()=>{try{return (window.TechRibWireRouter?.inspectEndpointAssemblies?.()||[])}catch{return[]}};
const projectIdentity=data=>{
 const types=(data?.components||[]).map(c=>c.type).sort();
 const wireShape=(data?.wires||[]).map(w=>`${w.from?.componentId||w.from?.id||'J'}:${w.from?.id||w.from?.index||''}>${w.to?.componentId||w.to?.id||'J'}:${w.to?.id||w.to?.index||''}`).sort();
 const raw=JSON.stringify({name:data?.name||'Projeto sem título',types,wireShape});
 let hash=2166136261;for(let i=0;i<raw.length;i++){hash^=raw.charCodeAt(i);hash=Math.imul(hash,16777619)}
 return `${String(data?.name||'Projeto sem título').trim()||'Projeto sem título'}::${(hash>>>0).toString(16)}`;
};
const loadBaselines=()=>{try{return JSON.parse(localStorage.getItem(baselineKey)||'{}')||{}}catch{return{}}};
const saveBaselines=data=>localStorage.setItem(baselineKey,JSON.stringify(data));
const compareBaseline=(identity,result)=>{
 const base=loadBaselines()[identity];if(!base)return{has:false,regressions:[],at:null};
 const regressions=[];CHECKS.forEach(k=>{if(base.checks?.[k]===true&&!result.checks[k]?.passed)regressions.push(k)});
 return{has:true,regressions,at:base.at};
};
const evaluateCurrentProject=async()=>{
 const h=hooks();const snapshot=clone(h.snapshot());const result={name:snapshot.name||'Projeto atual',identity:projectIdentity(snapshot),checks:{},passed:false,error:null};
 const set=(name,passed,detail)=>result.checks[name]=check(passed,detail);
 const components=h.components(),wires=h.wires();
 set('fio',wires.length>0,`${wires.length} ligação(ões) existentes no projeto atual`);
 const terminalCount=components.reduce((sum,c)=>sum+h.terminals(c).length,0);
 const terminalEnds=expectedMarkers(wires);
 const endpointsOk=wires.every(w=>(!endpointIsTerminal(w.from)||w.from.el?.isConnected)&&(!endpointIsTerminal(w.to)||w.to.el?.isConnected));
 set('terminal',terminalCount>0&&endpointsOk,`${terminalCount} bornes reconhecidos • ${terminalEnds} extremidade(s) de fio em borne`);
 h.redraw();await wait(0);
 const physicalExpected=expectedMarkers(wires),layoutStatus=markerCapacity();
 let renderableExpected=0,insufficientStraight=0;
 wires.forEach((w,index)=>{const status=layoutStatus[index];if(endpointIsTerminal(w.from)){if(status?.source?.valid)renderableExpected++;else insufficientStraight++}if(endpointIsTerminal(w.to)){if(status?.target?.valid)renderableExpected++;else insufficientStraight++}});
 if(!layoutStatus.length){renderableExpected=physicalExpected;insufficientStraight=0}
 const rendered=renderedMarkers(wires),markersOk=rendered>=renderableExpected;
 set('anilha',markersOk,`${rendered}/${renderableExpected} anilha(s) obrigatórias renderizada(s)${insufficientStraight?` • ${insufficientStraight} extremidade(s) sem trecho reto suficiente (não reprova o circuito)`:''}`);
 const routeResults=wires.map(w=>{try{return h.routeTests(w)}catch(e){return{passed:false,error:e.message}}});
 const geometryOk=routeResults.every(r=>r?.passed!==false);
 const withWaypoints=wires.filter(w=>(w.waypoints||[]).length>0);
 const curvesOk=withWaypoints.every(w=>(w.path?.getAttribute('d')||'').includes(' Q '));
 set('curva',geometryOk&&curvesOk,withWaypoints.length?`${withWaypoints.length} fio(s) com curva/desvio • geometria das extremidades ${geometryOk?'válida':'inválida'}`:`nenhuma curva manual • geometria das extremidades ${geometryOk?'válida':'inválida'}`);
 const profiles=wires.map(w=>w.profile||'').filter(Boolean);
 set('perfil',wires.length>0&&wires.every(w=>['logic','control','power'].includes(w.profile)),profiles.join(', ')||'nenhum fio');
 const allowed=[.5,.75,1,1.5,2.5,4,6];
 set('bitola',wires.length>0&&wires.every(w=>allowed.includes(Number(w.crossSectionMm2))),wires.map(w=>`${w.crossSectionMm2} mm²`).join(', ')||'nenhum fio');
 let metadataEnds=0,missingMeta=[];
 wires.forEach(w=>[w.from,w.to].forEach(e=>{if(!endpointIsTerminal(e))return;const m=terminalMeta(e.el);if(m.domain||m.voltage)metadataEnds++;else missingMeta.push(m.name||e.id||'?')}));
 set('tensao',wires.length>0&&metadataEnds>0,`${metadataEnds}/${terminalEnds} extremidade(s) em borne possuem domain/voltageClass${missingMeta.length?` • sem metadados: ${[...new Set(missingMeta)].slice(0,8).join(', ')}`:''}`);
 let simOk=false,simDetail='';
 try{
   const electrical=h.startSimulation();await wait(0);h.recalculate();await wait(0);
   const validation=h.validation();const states=window.TECHRIB_ELECTRICAL?.states;
   simOk=Boolean(electrical&&states instanceof Map);
   simDetail=`${states?.size||0} nós elétricos calculados • ${validation?.OK||0} OK • ${validation?.AVISO||0} aviso(s) • ${validation?.ERRO||0} erro(s)`;
 }catch(e){simDetail=e.message||String(e)}finally{try{h.stopSimulation()}catch{}}
 set('simulacao',simOk,simDetail);
 let serialized='';let saved=null;
 try{saved=clone(h.projectData());serialized=JSON.stringify(saved);JSON.parse(serialized);set('salvamento',serialized.length>30,`${saved.components?.length||0} componentes / ${saved.wires?.length||0} fios • ${serialized.length} bytes serializados`)}catch(e){set('salvamento',false,e.message||String(e))}
 try{
   if(!serialized)throw new Error('Salvamento não produziu dados válidos');
   const before=clone(saved);h.load(JSON.parse(serialized));await wait(0);h.redraw();await wait(0);const after=clone(h.projectData()),preserved=sameSavedState(before,after);
   set('carregamento',preserved,`${after.components?.length||0} componentes / ${after.wires?.length||0} fios restaurados • ${preserved?'topologia, bornes e propriedades persistentes preservadas':'diferença persistente encontrada após reabrir'}`);
 }catch(e){set('carregamento',false,e.message||String(e))}
 CHECKS.forEach(k=>{if(!result.checks[k])set(k,false,'verificação não executada')});
 result.passed=CHECKS.every(k=>result.checks[k].passed);
 // A função é não destrutiva: restaura o projeto exatamente como estava antes do teste.
 try{h.load(snapshot);await wait(0);h.redraw()}catch(e){console.error('Falha ao restaurar o projeto atual após regressão',e);result.error=`Falha ao restaurar o projeto: ${e.message||e}`;result.passed=false}
 return result;
};
const modal=()=>$('[data-regression-modal]');
const render=(result,runtimeMs)=>{
 const body=$('[data-regression-body]'),summary=$('[data-regression-summary]');body.replaceChildren();
 const cmp=compareBaseline(result.identity,result),gate=result.passed&&cmp.regressions.length===0;
 window.TechRibRegressionGate={accepted:gate,result,identity:result.identity,regressions:cmp.regressions,ranAt:new Date().toISOString()};
 summary.className=`regression-summary ${gate?'ok':'error'}`;
 summary.innerHTML=`<b>${gate?'PROJETO ATUAL APROVADO':'PROJETO ATUAL COM FALHAS'}</b><span>${CHECKS.filter(k=>result.checks[k]?.passed).length}/${CHECKS.length} verificações aprovadas • ${runtimeMs} ms${cmp.has?` • baseline ${new Date(cmp.at).toLocaleString('pt-BR')}`:' • sem baseline deste projeto'}</span>`;
 if(cmp.regressions.length){const alert=document.createElement('div');alert.className='regression-regressions';alert.innerHTML=`<b>REGRESSÕES DETECTADAS NESTE PROJETO</b><span>${cmp.regressions.map(x=>x.toUpperCase()).join(' • ')}</span><small>Essas verificações passavam quando este projeto foi aprovado como baseline e agora falharam.</small>`;body.append(alert)}
 const card=document.createElement('article');card.className=`regression-card ${result.passed?'pass':'fail'}`;
 const checks=CHECKS.map(k=>`<li class="${result.checks[k].passed?'pass':'fail'}"><b>${result.checks[k].passed?'✓':'✕'} ${k.toUpperCase()}</b><small>${result.checks[k].detail||''}</small></li>`).join('');
 card.innerHTML=`<header><b>${result.name}</b><span>${result.passed?'APROVADO':'FALHOU'}</span></header><div class="regression-example-source">Origem: <b>projeto aberto atualmente no canvas</b></div><ul>${checks}</ul>`;body.append(card);
 const approve=$('[data-regression-approve]');approve.disabled=!result.passed;approve.title=result.passed?'Aprovar o estado atual deste projeto como baseline':'Corrija as verificações com falha antes de aprovar como baseline';
};
const runCurrent=async()=>{
 const h=hooks();if(!h)return alert('API de regressão ainda não carregou. Atualize a página.');
 const snapshot=h.snapshot();if(!(snapshot.components||[]).length)return alert('O projeto atual está vazio. Adicione ou abra um circuito antes de executar a regressão.');
 const run=$('[data-regression-run]');run.disabled=true;run.textContent='Testando…';$('[data-regression-current]').textContent='Analisando o projeto que está aberto agora…';const started=performance.now();
 try{const result=await evaluateCurrentProject();render(result,Math.round(performance.now()-started));$('[data-regression-current]').textContent='Teste concluído. O mesmo projeto foi restaurado.'}
 catch(e){console.error(e);alert(`Falha ao executar regressão: ${e.message||e}`);$('[data-regression-current]').textContent='Falha durante o teste.'}
 finally{run.disabled=false;run.textContent='Testar projeto atual'}
};
const approveBaseline=()=>{
 const gate=window.TechRibRegressionGate;if(!gate?.result?.passed)return;
 const all=loadBaselines(),checks={};CHECKS.forEach(k=>checks[k]=Boolean(gate.result.checks[k]?.passed));
 all[gate.identity]={version:64,source:'current-project',projectName:gate.result.name,at:new Date().toISOString(),checks};saveBaselines(all);
 $('[data-regression-current]').textContent='Baseline deste projeto atual aprovada e gravada neste navegador.';render(gate.result,0);
};
const bind=()=>{
 $$('[data-action="regression"]').forEach(b=>b.addEventListener('click',()=>{modal().hidden=false;$('[data-regression-current]').textContent='Pronto para testar o projeto aberto atualmente.'}));
 $$('[data-regression-close]').forEach(b=>b.addEventListener('click',()=>modal().hidden=true));
 $('[data-regression-run]')?.addEventListener('click',runCurrent);$('[data-regression-approve]')?.addEventListener('click',approveBaseline);
 window.TechRibRegression={run:runCurrent,checks:CHECKS,getBaselines:loadBaselines};
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
})();
