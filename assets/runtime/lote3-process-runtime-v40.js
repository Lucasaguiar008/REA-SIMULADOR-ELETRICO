(()=>{'use strict';
const truth=v=>String(v||'').toLowerCase()==='true';
const create=deps=>{
  const {sheet,notify=()=>{},soundLibrary,isSimulationRunning=()=>true}=deps||{};
  const owners=new Set();
  let rafId=0,pausedAt=0;
  const byId=id=>[...sheet.querySelectorAll('.placed-component')].find(n=>n.dataset.componentId===id);
  const loop=(o,n,on)=>{if(!o||!soundLibrary)return;if(on&&isSimulationRunning()){if(!soundLibrary.hasLoop?.(o))soundLibrary.startLoop?.(o,n).catch?.(()=>{})}else soundLibrary.stopLoop?.(o)};
  const panel=(o,k,x,y,html)=>{sheet.querySelectorAll(`.lote3-panel[data-kind="${k}"]`).forEach(n=>n.remove());let p=document.createElement('div');p.className='lote3-panel';p.dataset.kind=k;p.dataset.owner=o.dataset.componentId;p.style.cssText=`position:absolute;z-index:55;left:${x}px;top:${y}px;width:520px;padding:12px 14px;border:2px solid #4c7688;border-radius:14px;background:#071e2df5;color:#fff;font:700 11px Arial`;p.innerHTML=html;sheet.appendChild(p);return p};
  const setRunVisual=(n,run,sel)=>{const b=n?.querySelector(sel);if(b)b.style.animation=run?'belt .55s linear infinite':''};
  const pruneOwners=()=>{owners.forEach(o=>{if(!o?.isConnected)owners.delete(o)})};
  const panelInfo=o=>sheet.querySelector(`.lote3-panel[data-owner="${CSS.escape(o.dataset.componentId)}"] [data-info]`);
  const ensureFillAudioOwner=o=>{if(o.__fillAudioOwner?.isConnected)return o.__fillAudioOwner;const a=document.createElement('span');a.hidden=true;a.dataset.techribAudioOwner='filling-flow';o.appendChild(a);o.__fillAudioOwner=a;return a};
  const stopFillAudio=o=>{soundLibrary?.stopLoop?.(o);if(o?.__fillAudioOwner)soundLibrary?.stopLoop?.(o.__fillAudioOwner);if(o)o.dataset.fillAudio='false'};

  const fillTargetX=510; // bottle neck center (x+40) aligned with nozzle x=550
  const bottleAtNozzle=x=>Math.abs(Number(x||0)-fillTargetX)<=18;
  const syncFill=o=>{
    const st=o.dataset.stage||'idle',external=st==='idle',externalRun=external&&truth(o.dataset.externalRun),externalValve=external&&truth(o.dataset.externalValve);
    const x=Math.max(120,Math.min(800,Number(o.dataset.externalBottleX||120)));
    const atNozzle=bottleAtNozzle(x),internalValve=st==='fill',fillAllowed=internalValve||(externalValve&&atNozzle);
    // During internal AUTO the belt moves only in MOVE/DEPART. In external mode RUN controls the belt.
    const run=['move','depart'].includes(st)||externalRun;
    o.dataset.run=String(run);o.dataset.valve=String(fillAllowed);o.dataset.bottleAtNozzle=String(atNozzle);setRunVisual(o,run,'[data-fill-belt]');
    const stream=o.querySelector('[data-fill-stream]');if(stream)stream.setAttribute('opacity',fillAllowed?'1':'0');
    const sensor=o.querySelector('[data-fill-sensor]');if(sensor){sensor.setAttribute('fill',atNozzle?'#22c55e':'#475569');sensor.style.filter=atNozzle?'drop-shadow(0 0 8px #22c55e)':''}
    const state=o.querySelector('[data-fill-state]');if(state)state.textContent=fillAllowed?'ENVASANDO':externalValve&&!atNozzle?'AGUARDANDO GARRAFA':run?'ESTEIRA':'PARADA';
    const bottle=o.querySelector('[data-bottle]');if(bottle)bottle.setAttribute('transform',`translate(${x.toFixed(1)} 0)`);
    const liquid=o.querySelector('[data-liquid]');if(liquid){const h=Math.max(0,Math.min(75,Number(o.dataset.externalFillLevel||0)));liquid.setAttribute('y',455-h);liquid.setAttribute('height',h)}
    loop(o,'conveyor.motor',run);
    if(fillAllowed&&isSimulationRunning()){
      if(!truth(o.dataset.fillAudio)){o.dataset.fillAudio='true';soundLibrary?.play?.('solenoid.open').catch?.(()=>{});soundLibrary?.startLoop?.(ensureFillAudioOwner(o),'filling.flow').catch?.(()=>{})}
    }else if(truth(o.dataset.fillAudio)){
      o.dataset.fillAudio='false';if(o.__fillAudioOwner)soundLibrary?.stopLoop?.(o.__fillAudioOwner);if(isSimulationRunning())soundLibrary?.play?.('solenoid.close').catch?.(()=>{})
    }
    const p=panelInfo(o);if(p)p.textContent=st==='idle'?(fillAllowed?'ENVASANDO':externalValve&&!atNozzle?'VÁLVULA BLOQUEADA • SEM GARRAFA':run?'ESTEIRA EXTERNA':'PRONTA'):st==='fill'?'ENVASANDO':st.toUpperCase()
  };
  const syncReject=o=>{const run=truth(o.dataset.run);loop(o,'conveyor.motor',run);if(o.dataset.type==='industrial-esteira-separadora'){o.dataset.running=String(run);o.classList.toggle('running',run)}const active=Number(o.dataset.rejectUntil||0)>performance.now();const p=panelInfo(o);if(p)p.textContent=active?'REJEITANDO PEÇA NOK':run?'INSPECIONANDO':'PARADA'};
  const syncWeight=o=>{const w=Number(o.dataset.weight||750),ok=w>=500&&w<=1000,run=truth(o.dataset.run);setRunVisual(o,run,'[data-weight-belt]');loop(o,'conveyor.motor',run);const pv=o.querySelector('[data-weight-pv]');if(pv)pv.textContent=`${w} g`;const st=o.querySelector('[data-weight-state]');if(st){st.textContent=ok?'APROVADO':'REJEITADO';st.setAttribute('fill',ok?'#86efac':'#fca5a5')}const mod=byId(o.dataset.weightModuleId);if(mod){const d=mod.querySelector('[data-weight-display]');if(d)d.textContent=`${w} g`;const s=mod.querySelector('[data-weight-status]');if(s)s.textContent=ok?'APROVADO':'REJEITADO'}const cell=byId(o.dataset.weightCellId);const cv=cell?.querySelector('[data-load-value]');if(cv)cv.textContent=`${w} g`;const p=panelInfo(o);if(p)p.textContent=`${w} g • ${ok?'APROVADO':'REJEITADO'}`};

  const processOwners=()=>{const now=performance.now();pruneOwners();owners.forEach(o=>{if(o.dataset.l3==='fill'){let st=o.dataset.stage||'idle',t=now-Number(o.dataset.t0||now);
      if(st==='move'){const q=Math.max(0,Math.min(1,t/1200));o.dataset.externalBottleX=String(120+(fillTargetX-120)*q);o.dataset.externalFillLevel='0';if(q>=1){o.dataset.stage='fill';o.dataset.t0=String(now);o.dataset.externalBottleX=String(fillTargetX)}}
      else if(st==='fill'){o.dataset.externalBottleX=String(fillTargetX);o.dataset.externalFillLevel=String(Math.max(0,Math.min(75,75*(t/1500))));if(t>=1500){o.dataset.stage='depart';o.dataset.t0=String(now);o.dataset.externalFillLevel='75'}}
      else if(st==='depart'){const q=Math.max(0,Math.min(1,t/1300));o.dataset.externalBottleX=String(fillTargetX+(800-fillTargetX)*q);o.dataset.externalFillLevel='75';if(q>=1){o.dataset.stage='move';o.dataset.t0=String(now);o.dataset.externalBottleX='120';o.dataset.externalFillLevel='0'}}
      else if(st==='idle'){
        const run=truth(o.dataset.externalRun),valve=truth(o.dataset.externalValve),last=Number(o.dataset.externalAnimAt||now),dt=Math.max(0,Math.min(80,now-last));o.dataset.externalAnimAt=String(now);let x=Number(o.dataset.externalBottleX||120),fill=Number(o.dataset.externalFillLevel||0);
        if(run){x+=dt*.20;if(x>800){x=120;fill=0}}
        // Physical interlock: an open valve cannot fill a bottle that is not under the nozzle.
        if(valve&&bottleAtNozzle(x))fill=Math.min(75,fill+dt*.075);
        o.dataset.externalBottleX=String(x);o.dataset.externalFillLevel=String(fill)
      }
      syncFill(o)
    }else if(o.dataset.l3==='reject'){syncReject(o)}else if(o.dataset.l3==='weight'){if(truth(o.dataset.run)&&now>Number(o.dataset.weightUntil||0)){o.dataset.run='false';syncWeight(o)}}})};
  const needsClock=()=>{const now=performance.now();for(const o of owners){if(!o?.isConnected)continue;if(o.dataset.l3==='fill'){if((o.dataset.stage||'idle')!=='idle'||truth(o.dataset.externalRun)||truth(o.dataset.externalValve))return true}if(o.dataset.l3==='reject'&&Number(o.dataset.rejectUntil||0)>now)return true;if(o.dataset.l3==='weight'&&truth(o.dataset.run))return true}return false};
  const cancelClock=()=>{if(rafId){cancelAnimationFrame(rafId);rafId=0}};
  const tick=()=>{rafId=0;if(!isSimulationRunning()){return}processOwners();if(needsClock())rafId=requestAnimationFrame(tick)};
  const ensureClock=()=>{if(!rafId&&isSimulationRunning()&&needsClock())rafId=requestAnimationFrame(tick)};
  const requireSimulation=()=>{if(isSimulationRunning())return true;notify('Inicie a simulação para executar este processo.');return false};

  const initFill=(o,opt={})=>{o.dataset.l3='fill';o.dataset.stage='idle';o.dataset.run='false';o.dataset.valve='false';o.dataset.externalRun=o.dataset.externalRun||'false';o.dataset.externalValve=o.dataset.externalValve||'false';o.dataset.externalBottleX=o.dataset.externalBottleX||'120';o.dataset.externalFillLevel=o.dataset.externalFillLevel||'0';o.dataset.externalAnimAt='0';o.techribSyncLote3=()=>{syncFill(o);if(needsClock())ensureClock();else cancelClock()};owners.add(o);const p=panel(o,'fill',opt.x||1450,opt.y||90,`<b>ENVASADORA • PROCESSO AUTOMÁTICO</b><p>CTRL: RUN = esteira • VALVE = válvula<br>O envase só ocorre com a garrafa posicionada sob o bico. Os sinais podem vir de Arduino, ESP32 ou outro controlador via relé.</p><button data-start>INICIAR AUTO</button> <button data-stop>PARAR AUTO</button><div data-info style="margin-top:8px">PRONTA</div>`);p.onclick=e=>{if(e.target.matches('[data-start]')){if(!requireSimulation())return;o.dataset.stage='move';o.dataset.externalBottleX='120';o.dataset.externalFillLevel='0';o.dataset.t0=String(performance.now());syncFill(o);ensureClock()}if(e.target.matches('[data-stop]')){o.dataset.stage='idle';o.dataset.run='false';o.dataset.valve='false';o.dataset.externalBottleX='120';o.dataset.externalFillLevel='0';syncFill(o);if(!needsClock())cancelClock()}};syncFill(o)};
  const initReject=(o,opt={})=>{o.dataset.l3='reject';o.dataset.run='false';o.dataset.bad='false';owners.add(o);const p=panel(o,'reject',opt.x||1500,opt.y||80,`<b>ESTEIRA • INSPEÇÃO E REJEIÇÃO</b><p>Peças boas seguem; NOK aciona o rejeitador.</p><button data-good>PEÇA OK</button> <button data-bad>PEÇA NOK</button> <button data-stop>PARAR</button><div data-info style="margin-top:8px">PARADA</div>`);p.onclick=e=>{if(e.target.matches('[data-good]')){if(!requireSimulation())return;o.dataset.run='true';o.dataset.bad='false';o.dataset.rejectUntil='0'}if(e.target.matches('[data-bad]')){if(!requireSimulation())return;o.dataset.run='true';o.dataset.bad='true';o.dataset.rejectUntil=String(performance.now()+900);soundLibrary?.play?.('gate.stop',{volume:.55}).catch?.(()=>{});ensureClock()}if(e.target.matches('[data-stop]')){o.dataset.run='false';o.dataset.rejectUntil='0'}syncReject(o)}};
  const initWeight=(o,opt={})=>{o.dataset.l3='weight';o.dataset.weight='750';o.dataset.run='false';owners.add(o);const mod=opt.module;if(mod)o.dataset.weightModuleId=mod.dataset.componentId;const cell=opt.cell;if(cell)o.dataset.weightCellId=cell.dataset.componentId;const p=panel(o,'weight',opt.x||1500,opt.y||80,`<b>ESTEIRA • PESAGEM</b><p>Faixa aprovada: 500 g a 1000 g.</p><button data-w="450">450 g</button> <button data-w="750">750 g</button> <button data-w="1200">1200 g</button><div data-info style="margin-top:8px">750 g • APROVADO</div>`);p.onclick=e=>{const b=e.target.closest('[data-w]');if(!b||!requireSimulation())return;o.dataset.weight=b.dataset.w;o.dataset.run='true';o.dataset.weightUntil=String(performance.now()+1500);syncWeight(o);ensureClock();if(Number(b.dataset.w)<500||Number(b.dataset.w)>1000)soundLibrary?.play?.('system.alert',{volume:.55}).catch?.(()=>{})};syncWeight(o)};

  const step=()=>{if(!isSimulationRunning())return false;processOwners();ensureClock();return false};
  const setPaused=paused=>{const now=performance.now();if(paused){if(!pausedAt)pausedAt=now;cancelClock();owners.forEach(o=>{if(o.dataset.l3==='fill')stopFillAudio(o);else soundLibrary?.stopLoop?.(o)});return}if(pausedAt){const delta=now-pausedAt;owners.forEach(o=>{if(o.dataset.l3==='fill'&&Number(o.dataset.t0||0)>0)o.dataset.t0=String(Number(o.dataset.t0)+delta);if(o.dataset.l3==='fill')o.dataset.externalAnimAt=String(now);if(o.dataset.l3==='reject'&&Number(o.dataset.rejectUntil||0)>0)o.dataset.rejectUntil=String(Number(o.dataset.rejectUntil)+delta);if(o.dataset.l3==='weight'&&Number(o.dataset.weightUntil||0)>0)o.dataset.weightUntil=String(Number(o.dataset.weightUntil)+delta)});pausedAt=0}owners.forEach(o=>{if(o.dataset.l3==='fill')syncFill(o)});ensureClock()};
  const reset=()=>{cancelClock();pausedAt=0;owners.forEach(o=>{if(!o?.isConnected)return;if(o.dataset.l3==='fill'){stopFillAudio(o);o.dataset.stage='idle';o.dataset.t0='0';o.dataset.externalRun='false';o.dataset.externalValve='false';o.dataset.externalBottleX='120';o.dataset.externalFillLevel='0';o.dataset.externalAnimAt='0';syncFill(o)}else if(o.dataset.l3==='reject'){soundLibrary?.stopLoop?.(o);o.dataset.run='false';o.dataset.rejectUntil='0';syncReject(o)}else if(o.dataset.l3==='weight'){soundLibrary?.stopLoop?.(o);o.dataset.run='false';o.dataset.weightUntil='0';syncWeight(o)}})};
  const dispose=()=>{reset();owners.forEach(o=>{try{delete o.techribSyncLote3}catch{}if(o.__fillAudioOwner){soundLibrary?.stopLoop?.(o.__fillAudioOwner);o.__fillAudioOwner.remove?.();delete o.__fillAudioOwner}});sheet.querySelectorAll('.lote3-panel').forEach(n=>n.remove());owners.clear();cancelClock();pausedAt=0};
  return{initFill,initReject,initWeight,step,reset,dispose,setPaused};
};
window.TechRibLote3ProcessRuntimeV40={create};
})();
