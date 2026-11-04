(function(root){
  'use strict';
  const create=({sheet,componentTerminals,terminalStates,notify}={})=>{
    const required={componentTerminals,terminalStates};
    if(!sheet?.querySelectorAll)throw new Error('TechRibProtectionRuntime: sheet ausente');
    for(const [name,fn] of Object.entries(required))if(typeof fn!=='function')throw new Error(`TechRibProtectionRuntime: ${name} ausente`);
    if(notify!==undefined&&typeof notify!=='function')throw new Error('TechRibProtectionRuntime: notify inválido');

    const isBreakerClosed=component=>{if(!component)return false;const type=String(component.dataset?.type||'');if(/^(?:disjuntor-1p|disjuntor-2p|disjuntor-3p)$/.test(type)){const saved=String(component.dataset.breakerClosed??'');if(saved==='true'||saved==='false')return saved==='true';const svgState=String(component.querySelector?.('svg')?.dataset?.closed??'');if(svgState==='true'||svgState==='false')return svgState==='true'}return component.classList.contains('closed')||component.dataset.switchState==='closed'};
    const isThermalTripped=component=>!!component&&(component.classList.contains('tripped')||component.dataset.tripped==='true');

    const setThermalTrip=(component,tripped,{announce=false}={})=>{if(!component)return false;const next=Boolean(tripped),before=isThermalTripped(component);component.dataset.tripped=String(next);component.classList.toggle('device-tripped',next);component.classList.toggle('tripped',next);if(!next){if(component.overloadTripTimer){clearTimeout(component.overloadTripTimer);component.overloadTripTimer=null}delete component.dataset.overloadStartedAt;delete component.dataset.overloadTripDueAt;delete component.dataset.tripReason;component.dataset.overloadState='idle'}else component.dataset.tripReason=component.dataset.tripReason||'manual';const led=component.querySelector('[data-thermal-led]');if(led)led.setAttribute('fill',next?'#ef4444':'#22c55e');if(announce&&notify)notify(`${component.querySelector('small')?.textContent||'Relé térmico'}: ${next?'disparado':'rearmado'}`);return before!==next};
    const toggleThermalTrip=(component,options={})=>{const next=!isThermalTripped(component);setThermalTrip(component,next,options);return next};

    const evaluateProtectionAuxContacts=()=>{let changed=false;sheet.querySelectorAll('.placed-component').forEach(component=>{const type=component.dataset.type;if(type==='contato-auxiliar-disjuntor'){const owner=[...sheet.querySelectorAll('.placed-component')].find(x=>x.dataset.componentId===component.dataset.associatedBreakerId),closed=isBreakerClosed(owner);if(component.dataset.ownerClosed!==String(closed)){component.dataset.ownerClosed=String(closed);const label=component.querySelector('[data-device-state]');if(label)label.textContent=owner?(closed?'DISJ. ON':'DISJ. OFF'):'SEM ASSOC.';changed=true}}else if(type==='contato-rele-termico-9596-9798'){const owner=[...sheet.querySelectorAll('.placed-component[data-type="rele-termico"]')].find(x=>x.dataset.componentId===component.dataset.associatedThermalId),tripped=isThermalTripped(owner);if(component.dataset.ownerTripped!==String(tripped)){component.dataset.ownerTripped=String(tripped);const label=component.querySelector('[data-device-state]');if(label)label.textContent=owner?(tripped?'DISPARADO':'NORMAL'):'SEM ASSOC.';changed=true}}});return changed};

    const evaluatePhaseRelay=(component,states)=>{const byName=new Map(componentTerminals(component).map(t=>[t.dataset.terminal,t])),values=['L1','L2','L3'].map(name=>terminalStates(states,byName.get(name)).filter(value=>value.type==='AC'&&!value.reference)),sources=values.map(list=>new Set(list.map(value=>value.source))),healthy=values.every(list=>list.length)&&[...sources[0]].some(source=>sources[1].has(source)&&sources[2].has(source));component.classList.toggle('phase-ok',healthy);component.dataset.phaseOk=String(healthy);const svg=component.querySelector('svg');if(svg)svg.dataset.phaseOk=String(healthy);component.title=healthy?'Rede trifásica normal — contato 11/14 fechado':'Falta ou incompatibilidade de fase — contato 11/12 fechado';return healthy};

    return Object.freeze({isBreakerClosed,isThermalTripped,setThermalTrip,toggleThermalTrip,evaluateProtectionAuxContacts,evaluatePhaseRelay});
  };
  root.TechRibProtectionRuntime=Object.freeze({create});
})(typeof window!=='undefined'?window:globalThis);
