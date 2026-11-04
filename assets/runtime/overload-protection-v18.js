(function(root){
  'use strict';

  const num=(value,fallback=0)=>{const n=Number(value);return Number.isFinite(n)?n:fallback};
  const typeOf=c=>String(c?.dataset?.type||c?.dataset?.registryId||'');
  const label=c=>c?.querySelector?.('small')?.textContent?.trim()||c?.dataset?.tag||c?.dataset?.label||typeOf(c)||'COMP?';
  const isMotor=c=>{const t=typeOf(c);return t.startsWith('motor-')||t.startsWith('bomba-')};
  const isThermal=c=>typeOf(c)==='rele-termico';
  const isMpcb=c=>typeOf(c)==='disjuntor-motor-mpcb';
  const defaultRatedCurrent=c=>typeOf(c).startsWith('bomba-')?5.5:4.5;
  const defaultSetting=c=>isMpcb(c)?8:5;
  const currentSetting=c=>Math.max(.1,num(c?.dataset?.currentSetting,defaultSetting(c)));
  const motorRatedCurrent=c=>Math.max(.1,num(c?.dataset?.ratedCurrent,defaultRatedCurrent(c)));
  const motorLoadPercent=c=>Math.max(0,Math.min(300,num(c?.dataset?.loadPercent,100)));
  const motorCurrent=c=>c?.dataset?.electricalRunning==='true'?motorRatedCurrent(c)*(motorLoadPercent(c)/100):0;
  const sizingResolved=c=>c?.dataset?.protectionSizingResolved!=='false';

  // Curva didática acelerada para treinamento. Não representa uma curva IEC real.
  const tripDelayMs=ratio=>{
    ratio=num(ratio,0);
    if(ratio<=1.05)return Infinity;
    if(ratio<=1.20)return 12000;
    if(ratio<=1.50)return 6000;
    if(ratio<=2.00)return 3000;
    return 1200;
  };

  const create=({sheet,wires=[],registry={},topology,setThermalTrip,notify,scheduleElectricalRecalc,now=()=>Date.now(),schedule=(fn,ms)=>setTimeout(fn,ms),cancel=handle=>clearTimeout(handle)}={})=>{
    if(!sheet?.querySelectorAll)throw new Error('TechRibOverloadProtectionRuntime: sheet ausente');
    if(!topology?.createGraph||!topology?.analyzeMotor)throw new Error('TechRibOverloadProtectionRuntime: topologia ausente');
    if(typeof setThermalTrip!=='function')throw new Error('TechRibOverloadProtectionRuntime: setThermalTrip ausente');
    if(typeof scheduleElectricalRecalc!=='function')throw new Error('TechRibOverloadProtectionRuntime: scheduleElectricalRecalc ausente');

    const cancelTimer=component=>{if(component?.overloadTripTimer){cancel(component.overloadTripTimer);component.overloadTripTimer=null}};
    const clearExposure=component=>{if(!component)return;cancelTimer(component);delete component.dataset.overloadStartedAt;delete component.dataset.overloadTripDueAt};
    const protectorTripped=component=>isThermal(component)?component.dataset.tripped==='true'||component.classList?.contains?.('tripped'):isMpcb(component)?component.dataset.protectionTripped==='true':false;

    const setMpcbTrip=(component,tripped,{announce=false}={})=>{
      if(!component)return false;
      const next=Boolean(tripped),before=component.dataset.protectionTripped==='true';
      component.dataset.protectionTripped=String(next);
      component.classList?.toggle?.('tripped',next);
      const svg=component.querySelector?.('svg');if(svg)svg.dataset.tripped=String(next);
      if(next){
        component.dataset.switchState='open';component.classList?.remove?.('closed');component.dataset.tripReason='overload';
        const state=component.querySelector?.('[data-device-state]');if(state)state.textContent='DISPARADO';
      }else{
        delete component.dataset.tripReason;clearExposure(component);
      }
      if(announce&&before!==next&&notify)notify(`${label(component)}: ${next?'DISPARO POR SOBRECARGA':'rearmado'}`);
      return before!==next;
    };

    const resetMpcbTrip=component=>setMpcbTrip(component,false,{announce:false});

    const updateMotorCurrent=motor=>{
      const rated=motorRatedCurrent(motor),load=motorLoadPercent(motor),current=motorCurrent(motor);
      if(!motor.dataset.ratedCurrent)motor.dataset.ratedCurrent=String(rated);
      if(!motor.dataset.loadPercent)motor.dataset.loadPercent=String(load);
      motor.dataset.estimatedCurrent=current.toFixed(4);
      motor.dataset.motorLoadCurrent=current.toFixed(4);
      const base=String(motor.dataset.motorElectricalStatus||'');
      motor.dataset.overloadCurrentLabel=`${current.toFixed(2)} A / In ${rated.toFixed(2)} A • carga ${Math.round(load)}%`;
      if(motor.dataset.electricalRunning==='true')motor.title=`EM MARCHA — ${base} • I≈${current.toFixed(2)} A • carga ${Math.round(load)}%`;
      return current;
    };

    const tripProtector=component=>{
      clearExposure(component);
      component.dataset.overloadState='tripped';
      if(isThermal(component)){component.dataset.tripReason='overload';return setThermalTrip(component,true,{announce:true})}
      if(isMpcb(component))return setMpcbTrip(component,true,{announce:true});
      return false;
    };

    const updateProtector=({component,current,nowMs})=>{
      const setting=currentSetting(component),ratio=setting>0?current/setting:0,tripped=protectorTripped(component);
      component.dataset.currentSetting=String(setting);
      component.dataset.measuredCurrent=current.toFixed(4);
      component.dataset.overloadRatio=ratio.toFixed(4);
      if(tripped){component.dataset.overloadState='tripped';cancelTimer(component);return false}
      if(ratio<=1.05){
        clearExposure(component);component.dataset.overloadState=current>0?'normal':'idle';
        const state=component.querySelector?.('[data-device-state]');if(state&&isMpcb(component)&&component.dataset.switchState==='closed')state.textContent='LIGADA';
        component.title=`${label(component)} • I≈${current.toFixed(2)} A / ajuste ${setting.toFixed(2)} A • ${current>0?'normal':'sem carga'}`;
        return false;
      }
      const delay=tripDelayMs(ratio),started=num(component.dataset.overloadStartedAt,0)||nowMs,due=started+delay,elapsed=nowMs-started;
      component.dataset.overloadStartedAt=String(started);component.dataset.overloadTripDueAt=String(due);component.dataset.overloadState='timing';
      const remaining=Math.max(0,due-nowMs);
      component.title=`${label(component)} • SOBRECARGA ${(ratio*100).toFixed(0)}% • ${current.toFixed(2)} A / ${setting.toFixed(2)} A • disparo didático em ${(remaining/1000).toFixed(1)} s`;
      if(elapsed>=delay)return tripProtector(component);
      if(!component.overloadTripTimer){component.overloadTripTimer=schedule(()=>{component.overloadTripTimer=null;scheduleElectricalRecalc()},Math.max(25,remaining+10))}
      return false;
    };

    const markSizingUnresolved=(component,current=0)=>{
      clearExposure(component);
      component.dataset.overloadState='sizing_unresolved';
      component.dataset.measuredCurrent=Number(current||0).toFixed(4);
      component.dataset.overloadRatio='0';
      component.title=`${label(component)} • dimensionamento pendente; proteção de sobrecarga não dispara por valor padrão`;
      return false;
    };

    const evaluate=()=>{
      const components=[...sheet.querySelectorAll('.placed-component')],motors=components.filter(isMotor),protectors=components.filter(c=>isThermal(c)||isMpcb(c)),currents=new Map(protectors.map(p=>[p,0])),unresolvedProtectors=new Set();
      motors.forEach(updateMotorCurrent);
      if(motors.length&&protectors.length){
        const ctx=topology.createGraph({components,wires,registry});
        motors.forEach(motor=>{
          const current=motorCurrent(motor);if(current<=0)return;
          const analysis=topology.analyzeMotor(motor,{components,wires,registry,ctx});
          (analysis.overloads||[]).forEach(protector=>{
            if(!currents.has(protector))return;
            if(!sizingResolved(motor)||!sizingResolved(protector)){unresolvedProtectors.add(protector);return}
            currents.set(protector,currents.get(protector)+current);
          });
        });
      }
      let changed=false;const nowMs=now();
      protectors.forEach(component=>{
        if(!sizingResolved(component)||unresolvedProtectors.has(component)){markSizingUnresolved(component,currents.get(component)||0);return}
        if(updateProtector({component,current:currents.get(component)||0,nowMs}))changed=true
      });
      return changed;
    };

    const clearTimers=()=>{[...sheet.querySelectorAll('.placed-component')].forEach(component=>{if(isThermal(component)||isMpcb(component)){cancelTimer(component);delete component.dataset.overloadStartedAt;delete component.dataset.overloadTripDueAt;component.dataset.measuredCurrent='0';component.dataset.overloadRatio='0';if(!protectorTripped(component))component.dataset.overloadState='idle'}if(isMotor(component)){component.dataset.estimatedCurrent='0';component.dataset.motorLoadCurrent='0'}})};

    return Object.freeze({evaluate,clearTimers,clearExposure,setMpcbTrip,resetMpcbTrip,protectorTripped,motorCurrent,motorRatedCurrent,motorLoadPercent,currentSetting,tripDelayMs});
  };

  root.TechRibOverloadProtectionRuntime=Object.freeze({create,tripDelayMs,motorRatedCurrent,motorLoadPercent,currentSetting});
})(typeof window!=='undefined'?window:globalThis);
