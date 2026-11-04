/* TechRib Premium — Braço Robótico SCARA ESP32 v7
   Correção funcional completa:
   - animação da cena não depende do Motion API para existir;
   - limpa overrides manuais dos GPIOs antes do PWM do exemplo;
   - confirma alimentação e propagação do sinal pela rede elétrica TechRib;
   - painel GPIO do ESP32 aciona testes reais dos três eixos;
   - sequências abortam corretamente em falha e nunca deixam BUSY travado. */
(function(root){
'use strict';
const EXAMPLE_ID='premium-robotics-esp32-scara-arm';
const API=()=>root.TechRibMotionComponentsV1||null;
const sound=()=>root.TechRibSoundLibrary||null;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const running=()=>document.documentElement.getAttribute('data-techrib-mode')==='simulate';
const paused=()=>document.documentElement.getAttribute('data-techrib-mode')==='paused';
const byId=id=>document.querySelector(`.placed-component[data-component-id="${CSS.escape(id)}"]`);
let ctx=null,seqToken=0,pollTimer=0,lastManualSig='',manualHoldUntil=0;
const PICK={x:183,y:468};
const PLACE={x:528,y:468};
const GRIP_DEPTH=30;
const PICK_APPROACH=[103,150,78];
const PICK_FINAL=[103,156.5,78];
const PICK_CLOSED=[103,156.5,18];
const PLACE_APPROACH=[77,10,18];
const PLACE_FINAL=[77,0,18];

const pctFromAng=a=>clamp(Number(a)/1.8,0,100);
const pwmByte=a=>Math.round(6+clamp(a,0,180)/180*26);
const angFromPot=p=>{
  const span=Math.abs(Number(p?.dataset?.potSpanVoltage||0));
  const out=Number(p?.dataset?.potOutputVoltage||0);
  if(p?.dataset?.potOutputValid==='true'&&span>.05)return clamp(out/span*180,0,180);
  return clamp(Number(p?.dataset?.potPercent||50)*1.8,0,180);
};
const jsonObj=value=>{try{const x=JSON.parse(value||'{}');return x&&typeof x==='object'&&!Array.isArray(x)?x:{}}catch{return{}}};
const potSignature=()=>ctx?[ctx.p1?.dataset?.potOutputVoltage,ctx.p2?.dataset?.potOutputVoltage,ctx.p3?.dataset?.potOutputVoltage,ctx.p1?.dataset?.potPercent,ctx.p2?.dataset?.potPercent,ctx.p3?.dataset?.potPercent].join('|'):'';
const holdManual=ms=>{manualHoldUntil=Math.max(manualHoldUntil,performance.now()+Math.max(0,Number(ms)||0))};

function status(text,tone='ok'){
  if(!ctx?.scene)return;
  const n=ctx.scene.querySelector('[data-arm-status]'),m=ctx.scene.querySelector('[data-arm-mini-status]');
  const color=tone==='err'?'#fca5a5':tone==='warn'?'#fdba74':'#a7f3d0';
  if(n){n.textContent=text;n.setAttribute('fill',color)}
  if(m){m.textContent=tone==='err'?'FALHA':tone==='warn'?'ATENÇÃO':'ATIVO';m.setAttribute('fill',color)}
}

function recalcNow(){
  try{root.TECHRIB_ELECTRICAL?.recalculate?.()}catch(_){}
  try{root.TechRibLogic?.recalculate?.()}catch(_){}
}
function clearManualOverride(pin){
  if(!ctx?.esp||!pin)return;
  const raw=jsonObj(ctx.esp.dataset.gpioManualOverrides);delete raw[pin];
  if(Object.keys(raw).length)ctx.esp.dataset.gpioManualOverrides=JSON.stringify(raw);else delete ctx.esp.dataset.gpioManualOverrides;
}
function clearServoOverrides(){['GPIO25','GPIO26','GPIO27'].forEach(clearManualOverride)}
function setPin(pin,state){
  if(!ctx?.esp)return;
  try{root.TechRibLogic?.setGpioState?.(ctx.esp,pin,state)}catch(_){}
  if(!root.TechRibLogic?.setGpioState){const s=jsonObj(ctx.esp.dataset.gpioStates);s[pin]=String(state).toUpperCase()==='HIGH'?'HIGH':'LOW';ctx.esp.dataset.gpioStates=JSON.stringify(s)}
  ctx.esp.techribRefreshLogicControls?.();
}
function setPwm(pin,value){
  if(!ctx?.esp)return;
  const api=API();
  if(api?.setPwm){try{api.setPwm(ctx.esp,pin,value);return}catch(_){}}
  const pwm=jsonObj(ctx.esp.dataset.pwmValues);pwm[pin]=clamp(value,0,255);ctx.esp.dataset.pwmValues=JSON.stringify(pwm);setPin(pin,Number(value)>0?'HIGH':'LOW');
}
function releaseServoSignals(){
  clearServoOverrides();
  ['GPIO25','GPIO26','GPIO27'].forEach(pin=>setPwm(pin,0));
  recalcNow();
}

const localTween=(duration,step)=>new Promise(resolve=>{
  const start=performance.now(),ms=Math.max(1,Number(duration)||1);
  const tick=now=>{const p=Math.min(1,(now-start)/ms),e=p<.5?2*p*p:1-Math.pow(-2*p+2,2)/2;step(e,p);if(p<1)requestAnimationFrame(tick);else resolve()};
  requestAnimationFrame(tick);
});
function tween(duration,step){
  const api=API();
  if(api?.rafTween){try{const r=api.rafTween(duration,step);if(r&&typeof r.then==='function')return r}catch(_){}}
  return localTween(duration,step);
}
async function servoVisual(node,target,duration){
  if(!node)return false;
  const api=API();
  if(api?.setServoAngle){try{return await api.setServoAngle(node,target,{duration,silent:true})}catch(_){}}
  target=clamp(target,0,180);const from=clamp(node.dataset.servoAngle||0,0,180),horn=node.querySelector('[data-servo-horn]'),label=node.querySelector('[data-servo-angle]');
  await localTween(duration,e=>{const a=from+(target-from)*e;node.dataset.servoAngle=a.toFixed(1);if(horn)horn.setAttribute('transform',`rotate(${a.toFixed(1)} 115 60)`);if(label)label.textContent=`${Math.round(a)}°`});
  return true;
}
function setPot(node,pct){
  if(!node)return;
  const api=API();if(api?.setPot){try{api.setPot(node,pct);return}catch(_){}}
  node.dataset.potPercent=clamp(pct,0,100).toFixed(1);recalcNow();
}
function waitFor(predicate,timeout=850,step=35){return new Promise(resolve=>{const started=performance.now();const tick=()=>{let ok=false;try{ok=!!predicate()}catch(_){}if(ok)return resolve(true);if(performance.now()-started>=timeout)return resolve(false);setTimeout(tick,step)};tick()})}

function renderScene(a1,a2,a3){
  if(!ctx?.scene)return;
  a1=clamp(a1,0,180);a2=clamp(a2,0,180);a3=clamp(a3,0,180);
  const cx=355,cy=320,L1=155,L2=135,t1=a1*Math.PI/180,t2=(a2-90)*Math.PI/180,ex1=cx+L1*Math.cos(t1),ey1=cy+L1*Math.sin(t1),endA=t1+t2,ex2=ex1+L2*Math.cos(endA),ey2=ey1+L2*Math.sin(endA);
  const q=s=>ctx.scene.querySelector(s),setLine=(sel,x1,y1,x2,y2)=>{const e=q(sel);if(e){e.setAttribute('x1',x1.toFixed(1));e.setAttribute('y1',y1.toFixed(1));e.setAttribute('x2',x2.toFixed(1));e.setAttribute('y2',y2.toFixed(1))}};
  setLine('[data-arm-link1]',cx,cy,ex1,ey1);setLine('[data-arm-link1-highlight]',cx,cy-7,ex1,ey1-7);setLine('[data-arm-link2]',ex1,ey1,ex2,ey2);setLine('[data-arm-link2-highlight]',ex1,ey1-6,ex2,ey2-6);
  const j=q('[data-arm-joint2]');if(j){j.setAttribute('cx',ex1.toFixed(1));j.setAttribute('cy',ey1.toFixed(1))}
  const g=q('[data-arm-gripper]');if(g)g.setAttribute('transform',`translate(${ex2.toFixed(1)} ${ey2.toFixed(1)}) rotate(${(endA*180/Math.PI).toFixed(1)})`);
  // A abertura visual é dimensionada para a peça de 48 px: fechada abraça a peça,
  // aberta deixa folga suficiente para aproximar sem atravessar o objeto.
  const opening=24+clamp(a3,0,90)/90*20,jl=q('[data-arm-jaw-left]'),jr=q('[data-arm-jaw-right]');
  if(jl)jl.setAttribute('d',`M-10 8 L-${opening.toFixed(1)} 28 L-${(opening-9).toFixed(1)} 38`);
  if(jr)jr.setAttribute('d',`M10 8 L${opening.toFixed(1)} 28 L${(opening-9).toFixed(1)} 38`);
  [['[data-arm-a1]',a1],['[data-arm-a2]',a2],['[data-arm-a3]',a3]].forEach(([s,a])=>{const e=q(s);if(e)e.textContent=`${Math.round(a)}°`});
  [['[data-arm-bar1]',a1],['[data-arm-bar2]',a2],['[data-arm-bar3]',a3]].forEach(([s,a])=>{const e=q(s);if(e)e.setAttribute('width',(220*a/180).toFixed(1))});
  ctx.end={x:ex2,y:ey2,angle:endA*180/Math.PI};
  if(ctx.objectAttached)positionAttachedObject();
  ctx.angles=[a1,a2,a3];
}
function gripPoint(){
  if(!ctx?.end)return {x:0,y:0,angle:0};
  const r=Number(ctx.end.angle||0)*Math.PI/180;
  return {
    x:Number(ctx.end.x||0)-Math.sin(r)*GRIP_DEPTH,
    y:Number(ctx.end.y||0)+Math.cos(r)*GRIP_DEPTH,
    angle:Number(ctx.end.angle||0)
  };
}
function objectAt(x,y,angle=0){
  if(!ctx?.scene)return;
  const o=ctx.scene.querySelector('[data-arm-object]');
  ctx.objectPose={x:Number(x),y:Number(y),angle:Number(angle)||0};
  if(o){
    o.setAttribute('transform',`translate(${Number(x).toFixed(1)} ${Number(y).toFixed(1)}) rotate(${Number(angle||0).toFixed(1)})`);
    o.dataset.armAttached=ctx.objectAttached?'true':'false';
    const box=o.querySelector('rect');
    if(box)box.setAttribute('stroke',ctx.objectAttached?'#fef08a':'#fecaca');
  }
}
function positionAttachedObject(){
  if(!ctx?.objectAttached)return;
  const gp=gripPoint();
  objectAt(gp.x,gp.y,gp.angle);
}
function pieceDistance(){
  const gp=gripPoint(),op=ctx?.objectPose||PICK;
  return Math.hypot(gp.x-Number(op.x||0),gp.y-Number(op.y||0));
}
function captureObject(maxDistance=24){
  if(!ctx)return false;
  const d=pieceDistance();
  if(d>maxDistance){
    status(`GARRA FORA DA PEÇA • DISTÂNCIA ${Math.round(d)} px`,'err');
    return false;
  }
  ctx.objectAttached=true;
  positionAttachedObject();
  sound()?.play?.('gate.stop',{volume:.45}).catch?.(()=>{});
  status('GARRA FECHADA • PEÇA PRESA ENTRE AS MANDÍBULAS');
  return true;
}
function dropObject(x=PLACE.x,y=PLACE.y){
  if(!ctx)return;
  ctx.objectAttached=false;
  objectAt(x,y,0);
  sound()?.play?.('gate.stop',{volume:.4}).catch?.(()=>{});
}
function sceneGeometryOk(){return !!ctx?.scene?.querySelector('[data-arm-link1]')&&!!ctx.scene.querySelector('[data-arm-link2]')&&!!ctx.scene.querySelector('[data-arm-gripper]')}
function ensureRun(){if(running()&&!paused())return true;status('CLIQUE EM ▶ EXECUTAR PARA ATIVAR O BRAÇO','warn');sound()?.play?.('system.alert',{volume:.35}).catch?.(()=>{});return false}
function powered(){return ctx?.esp?.dataset?.logicPowered==='true'&&[ctx?.s1,ctx?.s2,ctx?.s3].every(s=>s?.dataset?.peripheralPowered==='true')}
async function ensureElectrical(){
  if(!ctx||!ensureRun())return false;
  recalcNow();
  await waitFor(()=>ctx?.esp?.dataset?.logicPowered==='true',500);
  if(ctx.esp?.dataset?.logicPowered!=='true'){status('ESP32 SEM ALIMENTAÇÃO • CONFIRA VIN 5 V E GND','err');sound()?.play?.('system.alert',{volume:.45}).catch?.(()=>{});return false}
  await waitFor(()=>[ctx.s1,ctx.s2,ctx.s3].every(s=>s?.dataset?.peripheralPowered==='true'),500);
  if(![ctx.s1,ctx.s2,ctx.s3].every(s=>s?.dataset?.peripheralPowered==='true')){status('SERVO SEM 5 V/GND • CONFIRA A FONTE E O GND COMUM','err');sound()?.play?.('system.alert',{volume:.45}).catch?.(()=>{});return false}
  if(!sceneGeometryOk()){status('CENA DO BRAÇO INCOMPLETA • REABRA O EXEMPLO','err');return false}
  return true;
}
async function armServoSignals(a1,a2,a3){
  clearServoOverrides();
  setPwm('GPIO25',pwmByte(a1));setPwm('GPIO26',pwmByte(a2));setPwm('GPIO27',pwmByte(a3));
  recalcNow();
  return waitFor(()=>[ctx.s1,ctx.s2,ctx.s3].every(s=>s?.dataset?.peripheralActive==='true'),900,40);
}
async function moveAngles(a1,a2,a3,{duration=650,syncPots=true,silent=false,source='scene'}={}){
  if(!ctx||!(await ensureElectrical()))return false;
  a1=clamp(a1,0,180);a2=clamp(a2,0,180);a3=clamp(a3,0,180);
  if(source!=='pots')holdManual(duration+450);
  if(syncPots){setPot(ctx.p1,pctFromAng(a1));setPot(ctx.p2,pctFromAng(a2));setPot(ctx.p3,pctFromAng(a3));lastManualSig=potSignature()}
  const signalOk=await armServoSignals(a1,a2,a3);
  if(!signalOk){
    releaseServoSignals();
    status('PWM NÃO CHEGOU AOS 3 SERVOS • VERIFIQUE GPIO25/26/27 E OS FIOS SIG','err');
    sound()?.play?.('system.alert',{volume:.45}).catch?.(()=>{});return false;
  }
  const from=[...(ctx.angles||[90,20,70])];
  if(!silent)sound()?.startLoop?.(ctx.scene,'servo.motor',{volume:.58,playbackRate:1.02}).catch?.(()=>{});
  try{
    const visuals=[servoVisual(ctx.s1,a1,duration),servoVisual(ctx.s2,a2,duration),servoVisual(ctx.s3,a3,duration)];
    await tween(duration,e=>renderScene(from[0]+(a1-from[0])*e,from[1]+(a2-from[1])*e,from[2]+(a3-from[2])*e));
    await Promise.allSettled(visuals);
    renderScene(a1,a2,a3);
    return true;
  }finally{
    if(!silent)sound()?.stopLoop?.(ctx.scene,.08);
    releaseServoSignals();
  }
}
function failSequence(text='MOVIMENTO INTERROMPIDO • CONFIRA O DIAGNÓSTICO ELÉTRICO'){ctx.busy=false;status(text,'err');return false}
async function stepOrFail(promise,my){const ok=await promise;if(my!==seqToken)return false;if(!ok)return failSequence();return true}

async function home(){if(!ctx||ctx.busy||!ensureRun())return;ctx.busy=true;const my=++seqToken;try{status('RETORNANDO PARA HOME');if(!await stepOrFail(moveAngles(90,20,70,{duration:780}),my))return;status('HOME • PRONTO PARA NOVO CICLO')}finally{if(my===seqToken)ctx.busy=false}}
async function pick(){
  if(!ctx||ctx.busy||!ensureRun())return;
  ctx.busy=true;const my=++seqToken;
  try{
    if(ctx.objectAttached){status('A GARRA JÁ ESTÁ SEGURANDO A PEÇA','warn');return}
    status('APROXIMANDO DA PEÇA • GARRA ABERTA');
    if(!await stepOrFail(moveAngles(...PICK_APPROACH,{duration:680}),my))return;
    if(!await stepOrFail(moveAngles(...PICK_FINAL,{duration:360}),my))return;
    const d=pieceDistance();
    status(`CENTRALIZANDO GARRA • DISTÂNCIA ${Math.round(d)} px`);
    if(d>24)return failSequence(`NÃO FOI POSSÍVEL ALCANÇAR A PEÇA • DISTÂNCIA ${Math.round(d)} px`);
    if(!await stepOrFail(moveAngles(...PICK_CLOSED,{duration:380}),my))return;
    if(!captureObject(24))return failSequence('GARRA NÃO CONSEGUIU PRENDER A PEÇA');
    await sleep(180);
    if(!await stepOrFail(moveAngles(103,150,18,{duration:430}),my))return;
    status('PEÇA SEGURA NA GARRA • USE TRANSFERIR OU CICLO AUTOMÁTICO');
  }finally{if(my===seqToken)ctx.busy=false}
}
async function place(){
  if(!ctx||ctx.busy||!ensureRun())return;
  ctx.busy=true;const my=++seqToken;
  try{
    status(ctx.objectAttached?'TRANSFERINDO PEÇA PARA A ESTAÇÃO DE COLOCAÇÃO':'SEM PEÇA NA GARRA • MOVENDO PARA ESTAÇÃO','warn');
    if(!await stepOrFail(moveAngles(...PLACE_APPROACH,{duration:820}),my))return;
    if(!await stepOrFail(moveAngles(...PLACE_FINAL,{duration:380}),my))return;
    const gp=gripPoint(),d=Math.hypot(gp.x-PLACE.x,gp.y-PLACE.y);
    status(ctx.objectAttached?`POSICIONADO SOBRE COLOCA • ERRO ${Math.round(d)} px • CLIQUE EM SOLTAR`:'POSIÇÃO DE COLOCAÇÃO ATINGIDA');
  }finally{if(my===seqToken)ctx.busy=false}
}
async function release(){
  if(!ctx||ctx.busy||!ensureRun())return;
  ctx.busy=true;const my=++seqToken;
  try{
    status('ABRINDO GARRA');
    if(!await stepOrFail(moveAngles(ctx.angles?.[0]??PLACE_FINAL[0],ctx.angles?.[1]??PLACE_FINAL[1],78,{duration:380}),my))return;
    if(ctx.objectAttached){dropObject(PLACE.x,PLACE.y);status('PEÇA DEPOSITADA COM SUCESSO')}
    else status('GARRA ABERTA • NÃO HAVIA PEÇA','warn');
  }finally{if(my===seqToken)ctx.busy=false}
}
async function auto(){
  if(!ctx||ctx.busy||!ensureRun())return;ctx.busy=true;const my=++seqToken;
  try{
    ctx.objectAttached=false;objectAt(PICK.x,PICK.y,0);status('CICLO AUTOMÁTICO • HOME');
    if(!await stepOrFail(moveAngles(90,20,75,{duration:620}),my))return;
    status('CICLO 1/4 • APROXIMAÇÃO');
    if(!await stepOrFail(moveAngles(...PICK_APPROACH,{duration:620}),my))return;
    if(!await stepOrFail(moveAngles(...PICK_FINAL,{duration:340}),my))return;
    const pickGap=pieceDistance();
    if(pickGap>24)return failSequence(`CICLO ABORTADO • GARRA NÃO ALCANÇOU A PEÇA (${Math.round(pickGap)} px)`);
    status('CICLO 2/4 • FECHANDO GARRA');
    if(!await stepOrFail(moveAngles(...PICK_CLOSED,{duration:360}),my))return;
    if(!captureObject(24))return failSequence('CICLO ABORTADO • PEÇA NÃO FOI CAPTURADA');
    if(!await stepOrFail(moveAngles(103,150,18,{duration:400}),my))return;
    status('CICLO 3/4 • TRANSFERINDO PEÇA PRESA NA GARRA');
    if(!await stepOrFail(moveAngles(...PLACE_APPROACH,{duration:820}),my))return;
    if(!await stepOrFail(moveAngles(...PLACE_FINAL,{duration:380}),my))return;
    const gp=gripPoint(),placeGap=Math.hypot(gp.x-PLACE.x,gp.y-PLACE.y);
    if(placeGap>24)return failSequence(`CICLO ABORTADO • GARRA FORA DA ESTAÇÃO COLOCA (${Math.round(placeGap)} px)`);
    status('CICLO 4/4 • ABRINDO GARRA E DEPOSITANDO');
    if(!await stepOrFail(moveAngles(PLACE_FINAL[0],PLACE_FINAL[1],78,{duration:360}),my))return;
    dropObject(PLACE.x,PLACE.y);
    sound()?.play?.('parking.chime',{volume:.45,playbackRate:1.06}).catch?.(()=>{});
    await sleep(260);if(my!==seqToken)return;
    if(!await stepOrFail(moveAngles(90,20,70,{duration:680}),my))return;
    status('CICLO AUTOMÁTICO CONCLUÍDO • PEÇA TRANSFERIDA DE PEGA PARA COLOCA');
  }finally{if(my===seqToken)ctx.busy=false}
}

function reset(){
  seqToken++;if(!ctx)return;ctx.busy=false;ctx.objectAttached=false;ctx.manualGripperClosed=false;clearServoOverrides();objectAt(PICK.x,PICK.y,0);
  setPot(ctx.p1,50);setPot(ctx.p2,11.1);setPot(ctx.p3,38.9);
  [ctx.s1,ctx.s2,ctx.s3].forEach((s,i)=>servoVisual(s,[90,20,70][i],1));
  renderScene(90,20,70);releaseServoSignals();holdManual(500);lastManualSig=potSignature();
  status(running()?'SIMULAÇÃO ATIVA • AUTO, POTENCIÔMETROS OU GPIO25/26/27':'EXEMPLO CARREGADO • CLIQUE EM ▶ EXECUTAR','warn');
}
function action(name){if(name==='home')home();else if(name==='pick')pick();else if(name==='place')place();else if(name==='release')release();else if(name==='auto')auto()}
function bindScene(){
  if(!ctx?.scene||ctx.scene.dataset.robotArmRuntimeBound==='v7')return;ctx.scene.dataset.robotArmRuntimeBound='v7';
  const find=e=>e.target?.closest?.('[data-arm-action]');
  ctx.scene.addEventListener('pointerdown',e=>{if(!find(e))return;e.preventDefault();e.stopPropagation()});
  ctx.scene.addEventListener('pointerup',e=>{const b=find(e);if(!b)return;e.preventDefault();e.stopPropagation();action(b.dataset.armAction)});
}
function restoreManualHook(){if(!ctx?.esp)return;if(ctx.esp.techribOnManualGpio===ctx.manualGpioHook){if(typeof ctx.previousManualGpio==='function')ctx.esp.techribOnManualGpio=ctx.previousManualGpio;else delete ctx.esp.techribOnManualGpio}}
function nearAngle(value,target,tol=4){return Math.abs(Number(value||0)-Number(target||0))<=tol}
function armNearPick(){const a=ctx?.angles||[];return nearAngle(a[0],PICK_FINAL[0],5)&&nearAngle(a[1],PICK_FINAL[1],6)}
function armNearPlace(){const a=ctx?.angles||[];return nearAngle(a[0],PLACE_FINAL[0],5)&&nearAngle(a[1],PLACE_FINAL[1],6)}
function gpioGuidance(){
  if(!ctx)return;
  if(ctx.objectAttached&&armNearPlace())status('ESP32 • PEÇA SOBRE COLOCA • GPIO27 PARA SOLTAR');
  else if(!ctx.objectAttached&&armNearPick())status('ESP32 • GARRA SOBRE A PEÇA • GPIO27 PARA PEGAR');
  else if(ctx.objectAttached)status('ESP32 • PEÇA PRESA • GPIO25/GPIO26 LEVAM PARA COLOCA');
}
function dropFromManualGrip(){
  if(!ctx?.objectAttached)return false;
  const gp=gripPoint();
  const dPlace=Math.hypot(gp.x-PLACE.x,gp.y-PLACE.y);
  const dPick=Math.hypot(gp.x-PICK.x,gp.y-PICK.y);
  if(dPlace<=28)dropObject(PLACE.x,PLACE.y);
  else if(dPick<=28)dropObject(PICK.x,PICK.y);
  else dropObject(gp.x,gp.y);
  return true;
}
async function gpioTest(pin){
  if(!ctx||ctx.busy||!ensureRun())return false;
  let target=null,action='move';

  // V7: os botões do próprio ESP32 passam a ser comandos semânticos e
  // determinísticos. Não é mais necessário coordenar eixo por eixo nem
  // clicar rapidamente antes que o controle analógico reassuma.
  if(pin==='GPIO25'){
    // IR PARA PEGA: move base + articulação juntas e mantém a garra aberta
    // quando não há peça. Se já há peça, preserva a garra fechada.
    target=[PICK_FINAL[0],PICK_FINAL[1],ctx.objectAttached?PICK_CLOSED[2]:78];
    status('PAINEL ESP32 • GPIO25 → IR PARA PEGA','warn');
  }
  else if(pin==='GPIO26'){
    // IR PARA COLOCA: move base + articulação juntas. Com uma peça presa a
    // garra permanece fechada durante todo o transporte.
    target=[PLACE_FINAL[0],PLACE_FINAL[1],ctx.objectAttached?PICK_CLOSED[2]:78];
    status('PAINEL ESP32 • GPIO26 → IR PARA COLOCA','warn');
  }
  else if(pin==='GPIO27'){
    // A fonte de verdade da garra é objectAttached. Sem peça, GPIO27 sempre
    // significa PEGAR; com peça, sempre significa SOLTAR.
    action=ctx.objectAttached?'open':'close';
    const a=[...(ctx.angles||[90,20,70])];
    target=[a[0],a[1],action==='close'?PICK_CLOSED[2]:78];
    status(`PAINEL ESP32 • GPIO27 → ${action==='close'?'PEGAR / FECHAR GARRA':'SOLTAR / ABRIR GARRA'}`,'warn');
  }
  else return false;

  ctx.busy=true;const my=++seqToken;
  try{
    // O ESP32 não gira fisicamente os potenciômetros. Mantemos os ADCs como
    // controles manuais independentes e apenas registramos a assinatura atual,
    // para que o manualPoll só reassuma quando o usuário realmente mexer em P1/P2/P3.
    const ok=await moveAngles(target[0],target[1],target[2],{duration:560,syncPots:false,source:'gpio'});
    if(!ok||my!==seqToken)return false;
    lastManualSig=potSignature();holdManual(900);

    if(pin==='GPIO25'){
      ctx.manualGripperClosed=ctx.objectAttached;
      status(ctx.objectAttached?'ESP32 • POSIÇÃO PEGA ATINGIDA • PEÇA CONTINUA PRESA':'ESP32 • POSIÇÃO PEGA ATINGIDA • GPIO27 PARA PEGAR');
      return true;
    }
    if(pin==='GPIO26'){
      ctx.manualGripperClosed=ctx.objectAttached;
      status(ctx.objectAttached?'ESP32 • POSIÇÃO COLOCA ATINGIDA • GPIO27 PARA SOLTAR':'ESP32 • POSIÇÃO COLOCA ATINGIDA • SEM PEÇA NA GARRA','warn');
      return true;
    }

    if(pin==='GPIO27'&&action==='close'){
      ctx.manualGripperClosed=true;
      if(ctx.objectAttached){status('ESP32 • PEÇA JÁ ESTÁ PRESA');return true}

      // Se o usuário pedir PEGAR fora de PEGA, o próprio comando termina a
      // aproximação antes de fechar. Assim o GPIO27 nunca falha silenciosamente.
      if(!armNearPick()){
        status('ESP32 • GPIO27 → APROXIMANDO AUTOMATICAMENTE DA PEÇA');
        const approachOk=await moveAngles(PICK_FINAL[0],PICK_FINAL[1],78,{duration:520,syncPots:false,source:'gpio'});
        if(!approachOk||my!==seqToken)return false;
        const closeOk=await moveAngles(PICK_CLOSED[0],PICK_CLOSED[1],PICK_CLOSED[2],{duration:320,syncPots:false,source:'gpio'});
        if(!closeOk||my!==seqToken)return false;
      }

      // A peça do exemplo oficial nasce na estação PEGA. Quando o braço está
      // geometricamente em PEGA, anexamos explicitamente o mesmo objeto usado
      // pelo controlador visual e o posicionamos no centro real das mandíbulas.
      const d=pieceDistance();
      if(armNearPick()||d<=44){
        ctx.objectAttached=true;
        positionAttachedObject();
        sound()?.play?.('gate.stop',{volume:.45}).catch?.(()=>{});
        status('ESP32 • PEÇA CAPTURADA • AGORA GPIO26 LEVA PARA COLOCA');
        return true;
      }
      status(`ESP32 • NÃO FOI POSSÍVEL PEGAR • DISTÂNCIA ${Math.round(d)} px`,'err');
      return false;
    }

    if(pin==='GPIO27'&&action==='open'){
      ctx.manualGripperClosed=false;
      const gp=gripPoint();
      const dPlace=Math.hypot(gp.x-PLACE.x,gp.y-PLACE.y);
      if(dPlace<=44||armNearPlace()){
        dropObject(PLACE.x,PLACE.y);
        status('ESP32 • PEÇA DEPOSITADA EXATAMENTE EM COLOCA');
      }else{
        dropObject(gp.x,gp.y);
        status('ESP32 • PEÇA SOLTA NA POSIÇÃO ATUAL','warn');
      }
      return true;
    }
    return true;
  }finally{if(my===seqToken)ctx.busy=false}
}
function bindEsp32Panel(){
  if(!ctx?.esp)return;
  ctx.esp.dataset.logicProgramLocked='true';
  ctx.esp.dataset.gpioLabels=JSON.stringify({GPIO25:'IR PARA PEGA',GPIO26:'IR PARA COLOCA',GPIO27:'PEGAR / SOLTAR',GPIO34:'POT BASE',GPIO35:'POT ARTICULAÇÃO',GPIO36:'POT GARRA'});
  ctx.previousManualGpio=ctx.esp.techribOnManualGpio;
  ctx.manualGpioHook=(pin,next)=>{
    try{ctx.previousManualGpio?.(pin,next)}catch(_){}
    if(!ctx||!['GPIO25','GPIO26','GPIO27'].includes(pin)||String(next).toUpperCase()!=='HIGH')return;
    clearManualOverride(pin);setPin(pin,'LOW');ctx.esp.techribRefreshLogicControls?.();recalcNow();gpioTest(pin);
  };
  ctx.esp.techribOnManualGpio=ctx.manualGpioHook;ctx.esp.techribRefreshLogicControls?.();
}
function manualPoll(){
  clearInterval(pollTimer);pollTimer=setInterval(async()=>{
    if(!ctx||ctx.busy||!running()||paused()||performance.now()<manualHoldUntil)return;
    const sig=potSignature();
    if(!sig||sig===lastManualSig)return;lastManualSig=sig;
    if(![ctx.p1,ctx.p2,ctx.p3].every(p=>p?.dataset?.potOutputValid==='true')){status('CONTROLE MANUAL BLOQUEADO • CONFIRA 3V3/GND/W DOS POTENCIÔMETROS','err');return}
    const a=[angFromPot(ctx.p1),angFromPot(ctx.p2),angFromPot(ctx.p3)];ctx.busy=true;const my=++seqToken;
    try{status(`MANUAL ADC • BASE ${Math.round(a[0])}° • ART ${Math.round(a[1])}° • GARRA ${Math.round(a[2])}°`);await moveAngles(a[0],a[1],a[2],{duration:220,syncPots:false,silent:false,source:'pots'})}finally{if(my===seqToken)ctx.busy=false}
  },160)
}
function diagnose(){
  return {initialized:!!ctx,api:!!API(),scene:!!ctx?.scene,geometry:sceneGeometryOk(),espPowered:ctx?.esp?.dataset?.logicPowered,servoPowered:[ctx?.s1,ctx?.s2,ctx?.s3].map(s=>s?.dataset?.peripheralPowered),servoActive:[ctx?.s1,ctx?.s2,ctx?.s3].map(s=>s?.dataset?.peripheralActive),angles:ctx?.angles?[...ctx.angles]:null,objectAttached:!!ctx?.objectAttached,objectPose:ctx?.objectPose?{...ctx.objectPose}:null,grip:ctx?gripPoint():null,pieceDistance:ctx?pieceDistance():null,gpioStates:ctx?.esp?jsonObj(ctx.esp.dataset.gpioStates):{},overrides:ctx?.esp?jsonObj(ctx.esp.dataset.gpioManualOverrides):{}};
}
function init(){
  if(ctx)restoreManualHook();cleanup(false);ctx=null;
  const scene=[...document.querySelectorAll('.placed-component[data-type="braco-robotico-scara-esp32"]')][0];if(!scene)return;
  ctx={scene,esp:byId('esp'),p1:byId('p1'),p2:byId('p2'),p3:byId('p3'),s1:byId('s1'),s2:byId('s2'),s3:byId('s3'),angles:[90,20,70],busy:false,objectAttached:false,manualGripperClosed:false,objectPose:{x:PICK.x,y:PICK.y,angle:0},end:{x:645,y:320,angle:0},previousManualGpio:null,manualGpioHook:null};
  if(!ctx.esp||![ctx.p1,ctx.p2,ctx.p3,ctx.s1,ctx.s2,ctx.s3].every(Boolean)){status('EXEMPLO INCOMPLETO • REABRA O BRAÇO ROBÓTICO','err');return}
  bindScene();bindEsp32Panel();reset();manualPoll();
  setTimeout(()=>{if(!ctx||!running())return;recalcNow();setTimeout(()=>{if(ctx&&!powered())status('ALIMENTAÇÃO INCOMPLETA • CONFIRA 5 V, GND E VIN','err')},180)},220);
}
function cleanup(clear=true){seqToken++;clearInterval(pollTimer);pollTimer=0;if(ctx){restoreManualHook();releaseServoSignals();sound()?.stopLoop?.(ctx.scene,.05)}if(clear)ctx=null}
document.addEventListener('techrib:official-example-opened',e=>{if(e.detail?.id===EXAMPLE_ID)setTimeout(init,130);else cleanup()});
document.addEventListener('techrib:official-example-closed',()=>cleanup());
document.addEventListener('techrib:simulation-mode',e=>{
  if(!ctx)return;
  if(e.detail?.mode==='edit'){seqToken++;ctx.busy=false;releaseServoSignals();sound()?.stopLoop?.(ctx.scene,.05);status('SIMULAÇÃO PARADA • CLIQUE EM ▶ EXECUTAR','warn')}
  else if(e.detail?.mode==='simulate'){clearServoOverrides();recalcNow();holdManual(450);lastManualSig=potSignature();status('SIMULAÇÃO ATIVA • AUTO, P1/P2/P3 OU GPIO25/26/27')}
  else if(e.detail?.mode==='paused')status('SIMULAÇÃO PAUSADA','warn');
});
root.TechRibPremiumRobotArmESP32V1={id:EXAMPLE_ID,version:7,init,reset,home,pick,place,release,auto,gpioTest,diagnose};
})(typeof window!=='undefined'?window:globalThis);
