(function(root){
  'use strict';
  const VERSION=34;
  const now=()=>Date.now();
  const truth=value=>String(value||'').toLowerCase()==='true';
  const create=({sheet,scheduleElectricalRecalc,notify,soundLibrary}={})=>{
    if(!sheet?.querySelectorAll)throw new Error('TechRibAtsRuntimeV34: sheet ausente');
    if(typeof scheduleElectricalRecalc!=='function')throw new Error('TechRibAtsRuntimeV34: scheduleElectricalRecalc ausente');
    const timers=new WeakMap();
    const byId=id=>id?[...sheet.querySelectorAll('.placed-component')].find(node=>node.dataset.componentId===id):null;
    const standardBreakerClosed=node=>{if(!node)return false;const saved=String(node.dataset?.breakerClosed??'');if(saved==='true'||saved==='false')return saved==='true';const svgState=String(node.querySelector?.('svg')?.dataset?.closed??'');if(svgState==='true'||svgState==='false')return svgState==='true';return node.classList?.contains?.('closed')===true};
    const queue=(generator,ms=90)=>{clearTimeout(timers.get(generator));const handle=setTimeout(()=>{timers.delete(generator);scheduleElectricalRecalc()},Math.max(40,ms));timers.set(generator,handle)};
    const renderGenerator=generator=>{
      if(!generator)return;
      const state=generator.dataset.generatorState||'standby',source=truth(generator.dataset.sourceEnabled),ready=truth(generator.dataset.transferReady),start=truth(generator.dataset.generatorStartCommand),svg=generator.querySelector('svg');
      if(svg){svg.dataset.running=String(source);svg.dataset.ready=String(ready)}
      const status=generator.querySelector('[data-generator-status]'),output=generator.querySelector('[data-generator-output]');
      let text={standby:'PARADO',starting:'PARTINDO',warming:'ESTABILIZANDO',running:'PRONTO',cooldown:'ARREFECENDO'}[state]||state.toUpperCase();if(state==='running'&&!truth(generator.dataset.generatorProtectionOk))text='QFG ABERTO';
      if(status)status.textContent=text;if(output)output.textContent=source?'380/220 V':'0 V';
      const led=(name,on,color)=>{const node=generator.querySelector(`[data-generator-led="${name}"]`);if(node){node.setAttribute('fill',on?color:'#334155');if(on)node.setAttribute('filter','url(#genGlow)');else node.removeAttribute('filter')}};
      led('engine',source||state==='starting','#22c55e');led('voltage',source,'#38bdf8');led('ready',ready,'#facc15');
      generator.classList.toggle('running',source);generator.dataset.state=source?'on':'off';generator.title=`Gerador • START ${start?'220 V':'0 V'} • ${text} • ${source?'tensão disponível':'sem tensão'}${ready?' • READY liberado':''}`;
    };
    const releaseContactor=node=>{if(!node)return;node.classList?.remove?.('energized');node.dataset.coilEnergized='false';node.dataset.contactorState='open';node.dataset.state='off';const svg=node.querySelector?.('svg');if(svg){svg.dataset.state='off';svg.dataset.energized='false'}};
    const resetTimer=node=>{if(!node)return;node.dataset.timerDone='false';node.dataset.timerCoilPowered='false';node.dataset.timerProgress='0';node.dataset.energized='false';node.timerStartedAt=0;clearTimeout(node.timerRuntimeHandle);node.timerRuntimeHandle=null;const hand=node.querySelector('[data-timer-hand]'),state=node.querySelector('[data-timer-state]'),setting=node.querySelector('[data-timer-setting]');if(hand)hand.removeAttribute('transform');if(state)state.textContent='REPOUSO';if(setting)setting.textContent=`${Number(node.dataset.timerDelaySeconds||2).toFixed(1)} s`};
    const configure=(generator,{phase,main,backup,genBreaker,ktStart,ktReturn}={},resetState=true)=>{
      if(!generator)return false;
      generator.dataset.atsController='true';generator.dataset.atsPhaseRelayId=phase?.dataset.componentId||generator.dataset.atsPhaseRelayId||'ff1';generator.dataset.atsMainContactorId=main?.dataset.componentId||generator.dataset.atsMainContactorId||'kmr';generator.dataset.atsGenContactorId=backup?.dataset.componentId||generator.dataset.atsGenContactorId||'kmg';generator.dataset.atsGenBreakerId=genBreaker?.dataset.componentId||generator.dataset.atsGenBreakerId||'qfg';generator.dataset.atsStartTimerId=ktStart?.dataset.componentId||generator.dataset.atsStartTimerId||'kt1';generator.dataset.atsReturnTimerId=ktReturn?.dataset.componentId||generator.dataset.atsReturnTimerId||'kt2';generator.dataset.lineVoltage='380';generator.dataset.phaseVoltage='220';
      if(main){main.dataset.atsRole='mains';main.dataset.coilRatedVoltage='220';main.dataset.coilType='AC'}if(backup){backup.dataset.atsRole='generator';backup.dataset.coilRatedVoltage='220';backup.dataset.coilType='AC'}if(phase)phase.dataset.atsRole='mains-monitor';
      if(ktStart){ktStart.dataset.timerDelaySeconds=ktStart.dataset.timerDelaySeconds||'2';ktStart.dataset.coilRatedVoltage='220';ktStart.dataset.coilType='AC'}if(ktReturn){ktReturn.dataset.timerDelaySeconds=ktReturn.dataset.timerDelaySeconds||'2';ktReturn.dataset.coilRatedVoltage='220';ktReturn.dataset.coilType='AC'}
      generator.dataset.generatorProtectionOk=String(!genBreaker||standardBreakerClosed(genBreaker));
      if(resetState){clearTimeout(timers.get(generator));timers.delete(generator);generator.dataset.generatorState='standby';generator.dataset.sourceEnabled='false';generator.dataset.transferReady='false';generator.dataset.generatorStartCommand='false';generator.dataset.generatorStartVoltage='0';generator.dataset.atsInterlockFault='false';delete generator.dataset.startAt;delete generator.dataset.warmAt;delete generator.dataset.cooldownAt;releaseContactor(main);releaseContactor(backup);resetTimer(ktStart);resetTimer(ktReturn);soundLibrary?.stopLoop?.(generator)}
      renderGenerator(generator);return true;
    };
    const install=created=>{if(!created)return false;return configure(created.get('gen'),{phase:created.get('ff1'),main:created.get('kmr'),backup:created.get('kmg'),genBreaker:created.get('qfg'),ktStart:created.get('kt1'),ktReturn:created.get('kt2')},true)};
    const findComponent=({id,type,tag}={})=>{const exact=byId(id);if(exact)return exact;const nodes=[...sheet.querySelectorAll('.placed-component')];if(tag){const wanted=String(tag).toUpperCase(),match=nodes.find(node=>String(node.dataset.tag||node.querySelector('small')?.textContent||'').toUpperCase()===wanted);if(match)return match}if(type)return nodes.find(node=>node.dataset.type===type)||null;return null};
    const discover=generator=>{if(!generator)return null;const phase=findComponent({id:generator.dataset.atsPhaseRelayId||'ff1',type:'rele-falta-fase',tag:'FF1'}),main=findComponent({id:generator.dataset.atsMainContactorId||'kmr',tag:'KM-REDE'}),backup=findComponent({id:generator.dataset.atsGenContactorId||'kmg',tag:'KM-GER'}),genBreaker=findComponent({id:generator.dataset.atsGenBreakerId||'qfg',tag:'QF-GER'}),ktStart=findComponent({id:generator.dataset.atsStartTimerId||'kt1',tag:'KT-GER'}),ktReturn=findComponent({id:generator.dataset.atsReturnTimerId||'kt2',tag:'KT-RET'});if(!phase||!main||!backup||!genBreaker||!ktStart||!ktReturn)return null;return{phase,main,backup,genBreaker,ktStart,ktReturn}};
    const restore=(generator,{resetState=true}={})=>{if(!generator)return false;const parts=discover(generator);if(!parts)return false;return configure(generator,parts,resetState)};
    const atsGenerators=()=>[...new Set([...sheet.querySelectorAll('.placed-component[data-ats-controller="true"],.placed-component[data-type="gerador-trifasico"]')])];
    const rehydrateAll=({resetState=true}={})=>{let count=0;atsGenerators().forEach(generator=>{if(restore(generator,{resetState}))count+=1});return count};
    const prepareAll=()=>rehydrateAll({resetState:true});
    const stepGenerator=generator=>{
      if(!truth(generator.dataset.atsController))return false;
      const main=byId(generator.dataset.atsMainContactorId),backup=byId(generator.dataset.atsGenContactorId),genBreaker=byId(generator.dataset.atsGenBreakerId),genBreakerOk=!genBreaker||standardBreakerClosed(genBreaker),start=truth(generator.dataset.generatorStartCommand),time=now(),before=[generator.dataset.generatorState,generator.dataset.sourceEnabled,generator.dataset.transferReady,generator.dataset.generatorProtectionOk,generator.dataset.atsInterlockFault].join('|');
      generator.dataset.generatorProtectionOk=String(genBreakerOk);let state=generator.dataset.generatorState||'standby';const crankTime=1200,warmTime=900,cooldownTime=1800;
      if(start){
        if(state==='standby'||state==='cooldown'){generator.dataset.generatorState='starting';generator.dataset.startAt=String(time);delete generator.dataset.cooldownAt;generator.dataset.sourceEnabled='false';generator.dataset.transferReady='false';state='starting'}
        if(state==='starting'){const elapsed=time-Number(generator.dataset.startAt||time);generator.dataset.sourceEnabled='false';generator.dataset.transferReady='false';if(elapsed>=crankTime){generator.dataset.generatorState='warming';generator.dataset.warmAt=String(time);generator.dataset.sourceEnabled='true';state='warming';soundLibrary?.play?.('pump.start',{volume:.7}).catch?.(()=>{})}else queue(generator,crankTime-elapsed+30)}
        if(state==='warming'){const elapsed=time-Number(generator.dataset.warmAt||time);generator.dataset.sourceEnabled='true';generator.dataset.transferReady='false';if(elapsed>=warmTime){generator.dataset.generatorState='running';generator.dataset.transferReady=String(genBreakerOk);state='running'}else queue(generator,warmTime-elapsed+30)}
        if(state==='running'){generator.dataset.sourceEnabled='true';generator.dataset.transferReady=String(genBreakerOk)}
      }else{
        if(state==='starting'){generator.dataset.generatorState='standby';generator.dataset.sourceEnabled='false';generator.dataset.transferReady='false';state='standby'}
        else if(state==='warming'||state==='running'){generator.dataset.generatorState='cooldown';generator.dataset.cooldownAt=String(time);generator.dataset.sourceEnabled='true';generator.dataset.transferReady='false';state='cooldown';soundLibrary?.play?.('gate.stop',{volume:.55}).catch?.(()=>{})}
        if(state==='cooldown'){const elapsed=time-Number(generator.dataset.cooldownAt||time);generator.dataset.sourceEnabled='true';generator.dataset.transferReady='false';if(elapsed>=cooldownTime){generator.dataset.generatorState='standby';generator.dataset.sourceEnabled='false';state='standby'}else queue(generator,cooldownTime-elapsed+30)}
        if(state==='standby'){generator.dataset.sourceEnabled='false';generator.dataset.transferReady='false'}
      }
      const locked=truth(main?.dataset.coilEnergized)&&truth(backup?.dataset.coilEnergized),wasFault=truth(generator.dataset.atsInterlockFault);if(locked){generator.dataset.atsInterlockFault='true';generator.dataset.transferReady='false';if(!wasFault)soundLibrary?.play?.('system.alert',{volume:.8}).catch?.(()=>{})}else generator.dataset.atsInterlockFault='false';
      renderGenerator(generator);if(truth(generator.dataset.sourceEnabled)||state==='starting'){if(!soundLibrary?.hasLoop?.(generator))soundLibrary?.startLoop?.(generator,'generator.motor').catch?.(()=>{})}else soundLibrary?.stopLoop?.(generator);
      const after=[generator.dataset.generatorState,generator.dataset.sourceEnabled,generator.dataset.transferReady,generator.dataset.generatorProtectionOk,generator.dataset.atsInterlockFault].join('|');return before!==after;
    };
    const step=()=>{let changed=false;sheet.querySelectorAll('.placed-component[data-ats-controller="true"]').forEach(generator=>{if(stepGenerator(generator))changed=true});return changed};
    const animate=()=>{sheet.querySelectorAll('.placed-component[data-ats-controller="true"]').forEach(generator=>{if(!truth(generator.dataset.sourceEnabled)&&generator.dataset.generatorState!=='starting')return;const rotor=generator.querySelector('[data-generator-rotor]');if(rotor){const angle=(performance.now()/5)%360;rotor.setAttribute('transform',`rotate(${angle.toFixed(1)} 497 290)`)}});root.requestAnimationFrame?.(animate)};root.requestAnimationFrame?.(animate);
    const reset=()=>{sheet.querySelectorAll('.placed-component[data-ats-controller="true"]').forEach(generator=>{clearTimeout(timers.get(generator));timers.delete(generator);generator.dataset.generatorState='standby';generator.dataset.sourceEnabled='false';generator.dataset.transferReady='false';generator.dataset.generatorStartCommand='false';generator.dataset.generatorStartVoltage='0';delete generator.dataset.startAt;delete generator.dataset.warmAt;delete generator.dataset.cooldownAt;resetTimer(byId(generator.dataset.atsStartTimerId));resetTimer(byId(generator.dataset.atsReturnTimerId));soundLibrary?.stopLoop?.(generator);renderGenerator(generator)})};
    return Object.freeze({version:VERSION,install,restore,rehydrateAll,prepareAll,step,reset,renderGenerator});
  };
  root.TechRibAtsRuntimeV34=Object.freeze({VERSION,create});
})(typeof window!=='undefined'?window:globalThis);
