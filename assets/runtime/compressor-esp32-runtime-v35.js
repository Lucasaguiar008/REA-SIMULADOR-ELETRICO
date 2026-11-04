(()=>{
  'use strict';
  const STYLE_ID='techrib-compressor-esp32-runtime-v35-style';
  const ensureStyle=()=>{
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement('style');style.id=STYLE_ID;style.textContent=`
      .compressor-esp32-test-panel{position:absolute;z-index:52;width:520px;padding:14px 16px;border:2px solid #4c7688;border-radius:14px;background:linear-gradient(145deg,#0b2430f5,#07151df5);box-shadow:0 10px 28px #0006;color:#eaf7fb;font:700 12px Inter,Arial,sans-serif;pointer-events:auto}
      .compressor-esp32-test-panel .cp-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:10px}.compressor-esp32-test-panel .cp-head b{font-size:15px;color:#fff}.compressor-esp32-test-panel .cp-head small{display:block;margin-top:3px;color:#9ec7d8;font-size:10px}
      .compressor-esp32-test-panel .cp-state{min-width:148px;padding:7px 9px;border:1px solid #496775;border-radius:9px;background:#0a1b24;text-align:center;font:900 12px Consolas,monospace}.compressor-esp32-test-panel .cp-state[data-level="low"]{color:#fde68a}.compressor-esp32-test-panel .cp-state[data-level="normal"]{color:#86efac}.compressor-esp32-test-panel .cp-state[data-level="high"],.compressor-esp32-test-panel .cp-state[data-level="fault"]{color:#fca5a5}
      .compressor-esp32-test-panel .cp-buttons{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.compressor-esp32-test-panel .cp-buttons span{margin-right:3px;color:#bed8e4;font-size:10px;text-transform:uppercase;letter-spacing:.6px}.compressor-esp32-test-panel button{border:1px solid #567687;border-radius:8px;background:#163646;color:#fff;padding:7px 11px;font:900 10px Inter,Arial,sans-serif;cursor:pointer}.compressor-esp32-test-panel button:hover{background:#24536a}.compressor-esp32-test-panel button.active{outline:2px solid #f5c84c;outline-offset:1px}
      .compressor-esp32-test-panel .cp-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin-top:11px}.compressor-esp32-test-panel .cp-cell{padding:7px 8px;border:1px solid #294957;border-radius:8px;background:#0a1d27}.compressor-esp32-test-panel .cp-cell small{display:block;color:#80a8b9;font-size:9px}.compressor-esp32-test-panel .cp-cell b{display:block;margin-top:2px;color:#f7fbfd;font:900 11px Consolas,monospace}.compressor-esp32-test-panel .cp-safe{margin-top:9px;color:#9fc3d3;font-size:9px}
    `;document.head.appendChild(style)
  };
  const create=deps=>{
    const {sheet,notify=()=>{},gpioInputState,gpioState,setGpioState,writeGpioModes,writeGpioInputStates,scheduleElectricalRecalc=()=>{},soundLibrary}=deps||{};
    const byId=id=>id?[...sheet.querySelectorAll('.placed-component')].find(n=>n.dataset.componentId===id):null;
    const controllerParts=controller=>({
      compressor:byId(controller?.dataset?.compressorProcessId),
      thermal:byId(controller?.dataset?.compressorThermalId),
      emergency:byId(controller?.dataset?.compressorEmergencyId),
      relay:byId(controller?.dataset?.compressorRelayId),
      contactor:byId(controller?.dataset?.compressorContactorId)
    });
    const safetyState=controller=>{const {thermal,emergency}=controllerParts(controller),thermalTrip=Boolean(thermal?.classList.contains('tripped')),emergencyTrip=Boolean(emergency?.classList.contains('emergency-latched'));return{thermalTrip,emergencyTrip,fault:thermalTrip||emergencyTrip}};
    const pressureState=controller=>{const {compressor}=controllerParts(controller),p=Number(compressor?.dataset?.ipPressure||0),safety=safetyState(controller);if(safety.fault)return{key:'fault',label:'FALHA',pressure:p,...safety};if(p<=5.6)return{key:'low',label:'PRESSÃO BAIXA',pressure:p,...safety};if(p>=8.2)return{key:'high',label:'PRESSÃO ALTA',pressure:p,...safety};return{key:'normal',label:'PRESSÃO NORMAL',pressure:p,...safety}};
    const panelFor=controller=>sheet?.querySelector?.(`.compressor-esp32-test-panel[data-owner="${CSS.escape(controller?.dataset?.componentId||'')}"]`);
    const pinModes={GPIO32:'input',GPIO33:'input',GPIO34:'input',GPIO35:'input',GPIO25:'output'};
    const configureController=controller=>{if(!controller)return;controller.dataset.logicManualMode='false';controller.dataset.logicProgramLocked='true';controller.dataset.logicSpecialController='compressor-pressure-esp32';controller.dataset.codegenPreferredTarget='esp32-arduino';controller.dataset.gpioLabels=JSON.stringify({GPIO32:'LIGA S1',GPIO33:'DESLIGA S2',GPIO34:'PRESSÃO BAIXA',GPIO35:'PRESSÃO ALTA',GPIO25:'KM1'});writeGpioModes?.(controller,pinModes);if(!writeGpioModes)controller.dataset.gpioModes=JSON.stringify(pinModes);controller.dataset.logicProgram=JSON.stringify({version:3,name:'Compressor automático por pressão',source:'techrib-special-runtime',pinModes,rules:[]});const inputs={GPIO32:'LOW',GPIO33:'HIGH',GPIO34:'HIGH',GPIO35:'LOW'};writeGpioInputStates?.(controller,inputs);if(!writeGpioInputStates)controller.dataset.gpioInputStates=JSON.stringify(inputs)};
    const renderPanel=controller=>{
      const panel=panelFor(controller);if(!panel)return;
      const {compressor,contactor}=controllerParts(controller),pstate=pressureState(controller),armed=controller.dataset.compressorArmed==='true',demand=controller.dataset.compressorRunDemand==='true',running=compressor?.dataset?.ipRunning==='true',km=contactor?.dataset?.coilEnergized==='true';
      const state=panel.querySelector('[data-cp-state]');if(state){state.dataset.level=pstate.key;state.textContent=pstate.label}
      const set=(key,value)=>{const node=panel.querySelector(`[data-cp-value="${key}"]`);if(node)node.textContent=value};
      set('pressure',`${pstate.pressure.toFixed(1)} bar`);set('armed',armed?'ARMADO':'PARADO');set('output',demand?'GPIO25 HIGH':'GPIO25 LOW');set('motor',running&&km?'EM MARCHA':km?'KM1 FECHADO':'PARADO');
      panel.querySelectorAll('[data-cp-pressure]').forEach(button=>{const target=button.dataset.cpPressure,active=target==='low'?pstate.pressure<=5.6:target==='high'?pstate.pressure>=8.2:pstate.pressure>5.6&&pstate.pressure<8.2;button.classList.toggle('active',active)});
    };
    const startPanelLoop=controller=>{if(controller.__compressorPanelRaf)return;let last=0;const tick=now=>{if(!controller.isConnected){controller.__compressorPanelRaf=0;return}if(now-last>90){last=now;renderPanel(controller)}controller.__compressorPanelRaf=requestAnimationFrame(tick)};controller.__compressorPanelRaf=requestAnimationFrame(tick)};
    const attachPanel=(controller,{x=1240,y=120}={})=>{
      if(!sheet||!controller)return;ensureStyle();sheet.querySelectorAll(`.compressor-esp32-test-panel[data-owner="${CSS.escape(controller.dataset.componentId||'')}"]`).forEach(n=>n.remove());controller.dataset.compressorPanelX=String(x);controller.dataset.compressorPanelY=String(y);
      const panel=document.createElement('div');panel.className='compressor-esp32-test-panel';panel.dataset.owner=controller.dataset.componentId;panel.style.left=`${x}px`;panel.style.top=`${y}px`;panel.innerHTML=`<div class="cp-head"><div><b>COMPRESSOR • TESTE DE PRESSÃO</b><small>ESP32 • controle automático por histerese</small></div><div class="cp-state" data-cp-state data-level="low">PRESSÃO BAIXA</div></div><div class="cp-buttons"><span>Simular pressão</span><button type="button" data-cp-pressure="low">BAIXA • 5,0 bar</button><button type="button" data-cp-pressure="normal">NORMAL • 6,8 bar</button><button type="button" data-cp-pressure="high">ALTA • 8,35 bar</button></div><div class="cp-grid"><div class="cp-cell"><small>PRESSÃO</small><b data-cp-value="pressure">5.0 bar</b></div><div class="cp-cell"><small>CONTROLE</small><b data-cp-value="armed">PARADO</b></div><div class="cp-cell"><small>SAÍDA ESP32</small><b data-cp-value="output">GPIO25 LOW</b></div><div class="cp-cell"><small>MOTOR</small><b data-cp-value="motor">PARADO</b></div></div><div class="cp-safe">S0 Emergência e RT1 (95/96) interrompem fisicamente a bobina KM1. O ESP32 não substitui a cadeia de segurança.</div>`;
      panel.addEventListener('click',event=>{const button=event.target.closest('[data-cp-pressure]');if(!button)return;const {compressor}=controllerParts(controller);if(!compressor)return;const target=button.dataset.cpPressure,value=target==='low'?5:target==='high'?8.35:6.8;compressor.dataset.ipPressure=String(value);compressor.dataset.ipContactSignature='';scheduleElectricalRecalc();renderPanel(controller);notify(`Compressor: pressão de teste ajustada para ${value.toFixed(2)} bar`)});
      sheet.appendChild(panel);renderPanel(controller);startPanelLoop(controller)
    };
    const initialize=(controller,parts={},options={})=>{
      if(!controller)return;
      configureController(controller);controller.dataset.compressorEsp32Controller='true';
      if(parts.compressor)controller.dataset.compressorProcessId=parts.compressor.dataset.componentId;
      if(parts.thermal)controller.dataset.compressorThermalId=parts.thermal.dataset.componentId;
      if(parts.emergency)controller.dataset.compressorEmergencyId=parts.emergency.dataset.componentId;
      if(parts.relay)controller.dataset.compressorRelayId=parts.relay.dataset.componentId;
      if(parts.contactor)controller.dataset.compressorContactorId=parts.contactor.dataset.componentId;
      controller.dataset.compressorArmed='false';controller.dataset.compressorRunDemand='false';controller.dataset.compressorPrevStart='false';controller.dataset.compressorPrevStop='false';
      if(parts.compressor){parts.compressor.dataset.ipPressure=String(options.initialPressure??5.0);parts.compressor.dataset.ipDemand='false';parts.compressor.dataset.ipElectricalPowered='false';parts.compressor.dataset.ipDriveLevel='1';parts.compressor.dataset.ipContactSignature=''}
      setGpioState?.(controller,'GPIO25','LOW');attachPanel(controller,{x:options.panelX??1240,y:options.panelY??120});renderPanel(controller)
    };
    const restore=(controller,{resetState=true}={})=>{if(!controller||controller.dataset.compressorEsp32Controller!=='true')return false;configureController(controller);if(resetState){controller.dataset.compressorArmed='false';controller.dataset.compressorRunDemand='false';controller.dataset.compressorPrevStart='false';controller.dataset.compressorPrevStop='false';setGpioState?.(controller,'GPIO25','LOW')}const {compressor}=controllerParts(controller);if(compressor){const pressure=Number(compressor.dataset.ipPressure);if(!Number.isFinite(pressure))compressor.dataset.ipPressure='5';compressor.dataset.ipDemand='false';compressor.dataset.ipElectricalPowered='false';compressor.dataset.ipContactSignature=''}const x=Number(controller.dataset.compressorPanelX||1240),y=Number(controller.dataset.compressorPanelY||120);attachPanel(controller,{x:Number.isFinite(x)?x:1240,y:Number.isFinite(y)?y:120});controller.techribRefreshLogicControls?.();renderPanel(controller);return true};
    const rehydrateAll=()=>{let count=0;sheet?.querySelectorAll?.('.placed-component[data-compressor-esp32-controller="true"]').forEach(controller=>{if(restore(controller,{resetState:true}))count++});return count};
    const step=controller=>{
      if(!controller||controller.dataset.compressorEsp32Controller!=='true')return false;
      const before=`${controller.dataset.compressorArmed}:${controller.dataset.compressorRunDemand}:${gpioState?.(controller,'GPIO25')}`;
      const powered=controller.dataset.logicPowered==='true'&&controller.dataset.logicFault!=='true',safety=safetyState(controller);
      const startNow=powered&&gpioInputState?.(controller,'GPIO32')==='HIGH',stopNow=!powered||gpioInputState?.(controller,'GPIO33')!=='HIGH';
      const startEdge=startNow&&controller.dataset.compressorPrevStart!=='true';controller.dataset.compressorPrevStart=String(startNow);controller.dataset.compressorPrevStop=String(stopNow);
      let armed=controller.dataset.compressorArmed==='true',demand=controller.dataset.compressorRunDemand==='true';
      if(!powered||safety.fault||stopNow){armed=false;demand=false}else if(startEdge)armed=true;
      if(armed){const low=gpioInputState?.(controller,'GPIO34')==='HIGH',high=gpioInputState?.(controller,'GPIO35')==='HIGH';if(high)demand=false;else if(low)demand=true}else demand=false;
      controller.dataset.compressorArmed=String(armed);controller.dataset.compressorRunDemand=String(demand);setGpioState?.(controller,'GPIO25',demand&&!safety.fault?'HIGH':'LOW');
      const after=`${controller.dataset.compressorArmed}:${controller.dataset.compressorRunDemand}:${gpioState?.(controller,'GPIO25')}`;if(before!==after)renderPanel(controller);return before!==after
    };
    const reset=()=>{sheet?.querySelectorAll?.('.placed-component[data-compressor-esp32-controller="true"]').forEach(controller=>{controller.dataset.compressorArmed='false';controller.dataset.compressorRunDemand='false';controller.dataset.compressorPrevStart='false';controller.dataset.compressorPrevStop='false';setGpioState?.(controller,'GPIO25','LOW');const {compressor}=controllerParts(controller);if(compressor){compressor.dataset.ipPressure='5';compressor.dataset.ipDemand='false';compressor.dataset.ipElectricalPowered='false';compressor.dataset.ipContactSignature=''}renderPanel(controller)});sheet?.querySelectorAll?.('.compressor-esp32-test-panel').forEach(panel=>{const owner=byId(panel.dataset.owner);if(!owner)panel.remove()})};
    return{initialize,restore,rehydrateAll,step,reset,renderPanel,pressureState}
  };
  window.TechRibCompressorEsp32Runtime={create};
})();
