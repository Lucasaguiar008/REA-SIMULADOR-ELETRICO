/* TechRib Premium — Mini CNC ESP32 + DRV8825 v4
   Ponte determinística para STEP: primeiro usa a rede elétrica nativa; se a borda
   não for consumida no mesmo ciclo, o próprio runtime nativo do DRV consome 1 passo,
   mas somente quando o driver está eletricamente READY. */
(function(root){
'use strict';
const doc=root.document;if(!doc)return;
const VERSION='2026.09.05-mini-cnc-v6-manual-jog';
const EXAMPLE_ID='premium-robotics-esp32-mini-cnc-linear-axis';
const SCENE_TYPE='mini-cnc-eixo-linear-esp32';
const STEPS_PER_MM=5,TRAVEL_MM=250,MAX_STEPS=1250,TRAVEL_PX=560,ESP_MANUAL_JOG_MM=10;
const SPEEDS=[70,120,180,260];
let ctx=null,pollTimer=0,seq=0,speedIndex=1,stepObserver=null;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
const running=()=>doc.documentElement?.getAttribute('data-techrib-mode')==='simulate';
const paused=()=>doc.documentElement?.getAttribute('data-techrib-mode')==='paused'||doc.documentElement?.getAttribute('data-techrib-simulation-paused')==='true';
const sound=()=>root.TechRibSoundLibrary||null;
const api=()=>root.TechRibMotionComponentsV1||null;
const jsonObj=s=>{try{const o=JSON.parse(s||'{}');return o&&typeof o==='object'&&!Array.isArray(o)?o:{}}catch{return{}}};
const allComponents=()=>[...doc.querySelectorAll('.placed-component')];
const findComponent=({id='',role='',type=''})=>allComponents().find(n=>id&&String(n.dataset.componentId||'')===id)||allComponents().find(n=>role&&String(n.dataset.cncRole||'')===role)||allComponents().find(n=>type&&String(n.dataset.type||'')===type)||null;
const sceneNode=()=>findComponent({id:'scene',role:'scene',type:SCENE_TYPE});
const recalcNow=()=>{try{if(root.TECHRIB_ELECTRICAL?.recalculate){root.TECHRIB_ELECTRICAL.recalculate();return true}}catch(_){}try{root.TechRibLogic?.recalculate?.();return true}catch(_){}return false};
const currentSteps=()=>Math.round(Number(ctx?.stepper?.dataset?.stepperSteps||0));
const currentMm=()=>clamp(currentSteps()/STEPS_PER_MM,0,TRAVEL_MM);
const status=(text,kind='ok')=>{const scene=ctx?.scene||sceneNode();if(!scene)return;scene.dataset.cncStatus=String(text);scene.dataset.cncStatusKind=kind;const el=scene.querySelector('[data-cnc-status]');if(el){el.textContent=String(text);el.style.fill=kind==='err'?'#fca5a5':kind==='warn'?'#fde68a':'#e2e8f0'}};
const readPin=pin=>{if(!ctx?.esp)return'LOW';const states=jsonObj(ctx.esp.dataset.gpioStates),over=jsonObj(ctx.esp.dataset.gpioManualOverrides);return String(Object.prototype.hasOwnProperty.call(over,pin)?over[pin]:(states[pin]||'LOW')).toUpperCase()==='HIGH'?'HIGH':'LOW'};
const directionHigh=()=>readPin('GPIO26')==='HIGH';
const clearOverride=pin=>{if(!ctx?.esp)return;const o=jsonObj(ctx.esp.dataset.gpioManualOverrides);if(!Object.prototype.hasOwnProperty.call(o,pin))return;delete o[pin];if(Object.keys(o).length)ctx.esp.dataset.gpioManualOverrides=JSON.stringify(o);else delete ctx.esp.dataset.gpioManualOverrides};
function setOutput(pin,state,{clear=true,recalc=true}={}){if(!ctx?.esp)return false;if(clear)clearOverride(pin);if(api()?.setGpio)api().setGpio(ctx.esp,pin,state);else if(root.TechRibLogic?.setGpioState)root.TechRibLogic.setGpioState(ctx.esp,pin,state);else{const s=jsonObj(ctx.esp.dataset.gpioStates);s[pin]=String(state).toUpperCase()==='HIGH'?'HIGH':'LOW';ctx.esp.dataset.gpioStates=JSON.stringify(s)}ctx.esp.techribRefreshLogicControls?.();if(recalc)recalcNow();return true}
const waitFor=async(fn,timeout=700,interval=12)=>{const start=performance.now();while(performance.now()-start<timeout){if(fn())return true;await sleep(interval)}return !!fn()};
function resolveContext(){
  const scene=sceneNode();if(!scene)return null;
  const next={
    scene,
    esp:findComponent({id:'esp',role:'controller',type:'esp32-devkit'}),
    drv:findComponent({id:'drv',role:'driver',type:'techrib-drv8825-functional'}),
    stepper:findComponent({id:'stepper',role:'stepper',type:'techrib-stepper-bipolar-functional'}),
    home:findComponent({id:'lsHome',role:'homeLimit'}),
    end:findComponent({id:'lsEnd',role:'endLimit'}),
    homeActive:ctx?.homeActive||false,endActive:ctx?.endActive||false,busy:ctx?.busy||false
  };
  return next.esp&&next.drv&&next.stepper?next:null;
}
function bindStepperObserver(){if(stepObserver){stepObserver.disconnect();stepObserver=null}if(!ctx?.stepper)return;stepObserver=new MutationObserver(records=>{if(records.some(r=>r.attributeName==='data-stepper-steps')){syncLimits();render()}});stepObserver.observe(ctx.stepper,{attributes:true,attributeFilter:['data-stepper-steps']})}
function ensureContext(){const oldStepper=ctx?.stepper,next=resolveContext();if(!next)return false;ctx=next;try{api()?.scan?.()}catch(_){}if(oldStepper!==ctx.stepper)bindStepperObserver();bindSceneActions();ensureEspHook();return true}
function switchVisual(node,on){if(!node)return;node.dataset.detected=String(on);node.classList.toggle('sensor-active',on);node.classList.toggle('device-active',on);const a=node.querySelector('[data-sensor-actuator]');if(a)a.setAttribute('transform',on?'rotate(20 118 76)':'');const led=node.querySelector('[data-sensor-led],[data-limit-led]');if(led)led.setAttribute('fill',on?'#22c55e':'#0b2a5b')}
function syncLimits({force=false}={}){if(!ctx&&!ensureContext())return;const mm=currentMm(),home=mm<=.01,end=mm>=TRAVEL_MM-.01,changed=home!==ctx.homeActive||end!==ctx.endActive;ctx.homeActive=home;ctx.endActive=end;switchVisual(ctx.home,home);switchVisual(ctx.end,end);if((changed||force)&&running())recalcNow()}
function render(){if(!ctx&&!ensureContext())return;const steps=currentSteps(),mm=currentMm(),scene=ctx.scene,car=scene.querySelector('[data-cnc-carriage]'),tx=(mm/TRAVEL_MM)*TRAVEL_PX;if(car){car.setAttribute('transform',`translate(${tx.toFixed(2)} 0)`);car.style.removeProperty('transform')}const pos=scene.querySelector('[data-cnc-position]'),count=scene.querySelector('[data-cnc-steps]'),dir=scene.querySelector('[data-cnc-direction]'),speed=scene.querySelector('[data-cnc-speed]'),driver=scene.querySelector('[data-cnc-driver]'),led=scene.querySelector('[data-cnc-driver-led]'),limits=scene.querySelector('[data-cnc-limits]');if(pos)pos.textContent=`${mm.toFixed(1)} mm`;if(count)count.textContent=String(steps);if(dir)dir.textContent=directionHigh()?'→ CW':'← CCW';if(speed)speed.textContent=`${SPEEDS[speedIndex]} STEP/s`;const ready=ctx.drv.dataset.drvReady==='true';if(driver)driver.textContent=ready?'PRONTO • EN=GND':'AGUARDANDO ALIMENTAÇÃO';if(led)led.setAttribute('fill',ready?'#22c55e':'#f59e0b');if(limits)limits.textContent=`HOME: ${ctx.homeActive?'ON':'OFF'} • FIM: ${ctx.endActive?'ON':'OFF'}`;scene.dataset.cncRuntimeVersion=VERSION;scene.dataset.cncRuntimeLoaded='true';scene.dataset.cncPositionMm=mm.toFixed(3);scene.dataset.cncSteps=String(steps);scene.dataset.cncDriverReady=String(ready)}
function ensureRun(){if(running()&&!paused())return true;status('CLIQUE EM ▶ EXECUTAR PARA ATIVAR O EIXO','warn');return false}
async function ensureElectrical(){if(!ensureContext()||!ensureRun())return false;recalcNow();await waitFor(()=>ctx.esp.dataset.logicPowered==='true',500);if(ctx.esp.dataset.logicPowered!=='true'){status('ESP32 SEM 5 V/GND','err');return false}const ok=await waitFor(()=>ctx.drv.dataset.drvReady==='true',650);if(!ok){const v=ctx.drv.dataset.drvSupplyVoltage||'0',rst=ctx.drv.dataset.drvRst||'?',slp=ctx.drv.dataset.drvSlp||'?';status(`DRV8825 NÃO PRONTO • VMOT ${v} V • RST ${rst} • SLP ${slp}`,'err');return false}return true}
function nativeFallbackStep(before,source='cnc'){if(currentSteps()!==before)return true;const fn=api()?.forceDrvStep;if(typeof fn!=='function')return false;return !!fn(ctx.drv,{direction:directionHigh(),source})}
async function pulseOnce({source='panel'}={}){
  if(!ensureContext()||!ensureRun())return false;syncLimits();const right=directionHigh();if((right&&ctx.endActive)||(!right&&ctx.homeActive)){status(right?'FIM FINAL ATIVO • PASSO BLOQUEADO':'HOME ATIVO • PASSO BLOQUEADO','warn');return false}
  if(!(await ensureElectrical({autoEnable:true})))return false;
  const before=currentSteps();clearOverride('GPIO25');setOutput('GPIO25','LOW');setOutput('GPIO25','HIGH');
  // recalculate() é síncrono quando o motor está em execução; se não consumir a borda,
  // usa o mesmo stepMotor interno do runtime nativo, condicionado a drvReady=true.
  let moved=currentSteps()!==before;setOutput('GPIO25','LOW');if(!moved)moved=nativeFallbackStep(before,source);
  if(!moved){status(`STEP NÃO CONSUMIDO • DRV=${ctx.drv.dataset.drvReady||'false'}`,'err');return false}syncLimits();render();return true;
}
async function moveTo(mm){
  if(!ensureContext()||ctx.busy||!ensureRun())return false;mm=clamp(mm,0,TRAVEL_MM);ctx.busy=true;const token=++seq;
  try{if(!(await ensureElectrical()))return false;const target=Math.round(mm*STEPS_PER_MM),start=currentSteps(),right=target>start;if(target===start){syncLimits({force:true});render();status(`POSIÇÃO ${mm.toFixed(0)} mm JÁ ATINGIDA`);return true}clearOverride('GPIO26');setOutput('GPIO26',right?'HIGH':'LOW');setOutput('GPIO25','LOW');ctx.stepper.dataset.stepperSoundMode='loop';sound()?.startLoop?.(ctx.scene,'motion.stepper',{volume:.28,playbackRate:right?1.04:.96}).catch?.(()=>{});status(`MOVENDO • ${currentMm().toFixed(1)} → ${mm.toFixed(1)} mm`);let guard=0;const batchDelay=Math.max(2,Math.round(1000/SPEEDS[speedIndex]));while(token===seq&&currentSteps()!==target&&guard++<MAX_STEPS+50){const ok=await pulseOnce({source:'cnc-panel'});if(!ok)break;if((guard%5)===0)await sleep(batchDelay*3)}syncLimits({force:true});render();if(token!==seq)return false;const error=Math.abs(currentSteps()-target);if(error<=1){status(`OK • ${currentMm().toFixed(1)} mm • ${currentSteps()} PASSOS`);return true}status(`PAROU EM ${currentMm().toFixed(1)} mm • ERRO ${error} PASSOS`,'warn');return false}finally{sound()?.stopLoop?.(ctx?.scene,.08);if(ctx)ctx.busy=false}}
function stop(){seq++;if(ctx)ctx.busy=false;sound()?.stopLoop?.(ctx?.scene,.05);if(ensureContext())setOutput('GPIO25','LOW');status(`STOP • ${currentMm().toFixed(1)} mm`,'warn')}
function adjustSpeed(delta){speedIndex=clamp(speedIndex+delta,0,SPEEDS.length-1);render();status(`VELOCIDADE ${SPEEDS[speedIndex]} STEP/s`)}
function handleAction(name){if(name==='home')return moveTo(0);if(name==='50')return moveTo(50);if(name==='150')return moveTo(150);if(name==='250')return moveTo(250);if(name==='jog-left')return moveTo(currentMm()-10);if(name==='jog-right')return moveTo(currentMm()+10);if(name==='speed-down')return adjustSpeed(-1);if(name==='speed-up')return adjustSpeed(1);if(name==='stop')return stop()}
function bindSceneActions(){if(!ctx?.scene||ctx.scene._techribCncV4Bound)return;ctx.scene._techribCncV4Bound=true;const find=e=>e.target?.closest?.('[data-cnc-action]');ctx.scene.addEventListener('pointerdown',e=>{if(!find(e))return;e.preventDefault();e.stopPropagation()});ctx.scene.addEventListener('pointerup',e=>{const b=find(e);if(!b)return;e.preventDefault();e.stopPropagation();handleAction(b.dataset.cncAction)})}
async function manualEspJog(){
  if(!ensureContext()||!ensureRun())return false;
  if(ctx.busy){status('ESP32 GPIO25 • AGUARDE O MOVIMENTO ATUAL','warn');return false}
  syncLimits();const right=directionHigh();
  if((right&&ctx.endActive)||(!right&&ctx.homeActive)){status(right?'ESP32 JOG BLOQUEADO • FIM FINAL ATIVO':'ESP32 JOG BLOQUEADO • HOME ATIVO','warn');return false}
  const start=currentMm(),target=clamp(start+(right?ESP_MANUAL_JOG_MM:-ESP_MANUAL_JOG_MM),0,TRAVEL_MM);
  clearOverride('GPIO25');setOutput('GPIO25','LOW');
  status(`ESP32 GPIO25 • JOG ${right?'→':'←'} ${Math.abs(target-start).toFixed(1)} mm • GERANDO ${Math.abs(Math.round((target-start)*STEPS_PER_MM))} PULSOS STEP`);
  const ok=await moveTo(target);
  if(ok)status(`ESP32 GPIO25 • JOG CONCLUÍDO • ${currentSteps()} PASSOS • ${currentMm().toFixed(1)} mm`);
  return ok;
}
function ensureEspHook(){
  if(!ctx?.esp)return;const esp=ctx.esp;if(esp._techribCncHook&&esp.techribOnManualGpio===esp._techribCncHook)return;const previous=esp.techribOnManualGpio;
  const hook=(pin,next)=>{try{if(typeof previous==='function')previous(pin,next)}catch(_){}if(!ensureContext()||!running())return;const high=String(next).toUpperCase()==='HIGH';
    if(pin==='GPIO25'&&high){clearOverride('GPIO25');setOutput('GPIO25','LOW');setTimeout(()=>{manualEspJog().catch(()=>status('ESP32 GPIO25 • FALHA AO GERAR JOG','err'))},0)}
    else if(pin==='GPIO26'){recalcNow();setTimeout(()=>{render();status(`ESP32 DIR • ${high?'CW →':'← CCW'}`)},15)}
      };
  hook._techribCnc=true;esp._techribCncPrevious=previous;esp._techribCncHook=hook;esp.techribOnManualGpio=hook;esp.techribRefreshLogicControls?.();
}
function restoreEspHook(){const esp=ctx?.esp;if(!esp?._techribCncHook)return;if(esp.techribOnManualGpio===esp._techribCncHook){if(typeof esp._techribCncPrevious==='function')esp.techribOnManualGpio=esp._techribCncPrevious;else delete esp.techribOnManualGpio}delete esp._techribCncHook;delete esp._techribCncPrevious}
function initializePins(){if(!ensureContext()||!running())return;['GPIO25','GPIO26'].forEach(clearOverride);setOutput('GPIO25','LOW');setOutput('GPIO26','HIGH');ctx.drv.dataset.cncStepperId=ctx.stepper.dataset.componentId||'stepper';ctx.stepper.dataset.stepperSoundMode='loop';ctx.stepper.dataset.stepsPerRevolution='200';if(!ctx.stepper.dataset.stepperSteps)ctx.stepper.dataset.stepperSteps='0';syncLimits({force:true});render()}
function init(attempt=0){const next=resolveContext();if(!next){if(attempt<50)setTimeout(()=>init(attempt+1),100);return false}ctx=next;try{api()?.scan?.()}catch(_){}ctx.drv.dataset.cncStepperId=ctx.stepper.dataset.componentId||'stepper';bindStepperObserver();bindSceneActions();ensureEspHook();if(!pollTimer)pollTimer=setInterval(()=>{if(!sceneNode()){cleanup();return}if(!ensureContext())return;ensureEspHook();syncLimits();render()},120);if(running())initializePins();render();status(running()?'RUNTIME V6 ATIVO • GPIO25=JOG 10 mm • GPIO26=DIR • EN=GND':'RUNTIME V6 CARREGADO • CLIQUE EM ▶ EXECUTAR');return true}
function cleanup(){seq++;restoreEspHook();if(stepObserver){stepObserver.disconnect();stepObserver=null}if(pollTimer){clearInterval(pollTimer);pollTimer=0}ctx=null}
const observer=new MutationObserver(()=>{if(sceneNode()){if(!ctx)setTimeout(()=>init(0),60)}else if(ctx)cleanup()});
if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',()=>{observer.observe(doc.body,{childList:true,subtree:true});init(0)});else{observer.observe(doc.body,{childList:true,subtree:true});init(0)}
doc.addEventListener('techrib:official-example-opened',e=>{if(e.detail?.id===EXAMPLE_ID){cleanup();setTimeout(()=>init(0),140)}else if(ctx)cleanup()});
doc.addEventListener('techrib:official-example-closed',cleanup);
doc.addEventListener('techrib:simulation-mode',e=>{if(!sceneNode())return;if(e.detail?.mode==='simulate')setTimeout(()=>{init(0);initializePins();recalcNow();status('SIMULAÇÃO ATIVA • GPIO25=JOG 10 mm • GPIO26=DIR • EN FIXO NO GND')},100);else if(e.detail?.mode==='paused')status('SIMULAÇÃO PAUSADA','warn');else if(e.detail?.mode==='edit'){stop();status('SIMULAÇÃO PARADA • CLIQUE EM ▶ EXECUTAR','warn')}});
doc.addEventListener('techrib:stepper-step',()=>{if(!sceneNode())return;ensureContext();syncLimits();render()});
root.TechRibPremiumMiniCncV1=Object.freeze({VERSION,EXAMPLE_ID,init,moveTo,stop,pulseOnce,render,diagnose:()=>{ensureContext();return ctx?{version:VERSION,ready:true,steps:currentSteps(),mm:currentMm(),driverReady:ctx.drv.dataset.drvReady,vmot:ctx.drv.dataset.drvSupplyVoltage||'',home:ctx.homeActive,end:ctx.endActive,direction:directionHigh()?'CW':'CCW',enableGrounded:true,runtimeLoaded:ctx.scene.dataset.cncRuntimeLoaded,sceneBound:ctx.scene._techribCncV4Bound===true}:{version:VERSION,ready:false}}});
})(typeof window!=='undefined'?window:globalThis);
