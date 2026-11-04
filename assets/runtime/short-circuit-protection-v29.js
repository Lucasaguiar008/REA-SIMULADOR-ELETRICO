/* TechRib V29 — atuação didática de proteção em curto-circuito.
   Ao detectar curto no lado conectado de uma proteção fechada, abre/dispara a proteção.
   Modelo intencionalmente conservador: não calcula corrente de curto nem seletividade IEC. */
(function(root){
  'use strict';
  const VERSION=29;
  const typeOf=c=>String(c?.dataset?.type||'');
  const label=c=>c?.dataset?.tag||c?.querySelector?.('small')?.textContent?.trim()||typeOf(c)||'Proteção';
  const isBreaker=c=>/^disjuntor-/.test(typeOf(c))&&typeOf(c)!=='disjuntor-motor-mpcb';
  const isMpcb=c=>typeOf(c)==='disjuntor-motor-mpcb';
  const isFusedSwitch=c=>typeOf(c)==='chave-seccionadora-fusivel';
  const isFuse=c=>typeOf(c)==='fusivel';
  const create=({sheet,componentTerminals,terminalStates,classifyFault,notify,scheduleElectricalRecalc}={})=>{
    if(!sheet?.querySelectorAll)throw new Error('TechRibShortCircuitProtectionRuntime: sheet ausente');
    for(const [name,fn] of Object.entries({componentTerminals,terminalStates,classifyFault,scheduleElectricalRecalc}))if(typeof fn!=='function')throw new Error(`TechRibShortCircuitProtectionRuntime: ${name} ausente`);
    const breakerClosed=c=>{const type=typeOf(c),saved=String(c?.dataset?.breakerClosed??'');if(/^(?:disjuntor-1p|disjuntor-2p|disjuntor-3p)$/.test(type)&&(saved==='true'||saved==='false'))return saved==='true';const svgState=String(c?.querySelector?.('svg')?.dataset?.closed??'');if(/^(?:disjuntor-1p|disjuntor-2p|disjuntor-3p)$/.test(type)&&(svgState==='true'||svgState==='false'))return svgState==='true';return c?.classList?.contains?.('closed')===true};
    const closed=c=>isBreaker(c)?breakerClosed(c):(isMpcb(c)||isFusedSwitch(c))?c.dataset.switchState==='closed':isFuse(c)?c.dataset.fuseBlown!=='true':false;
    const setBreakerOpen=c=>{const before=breakerClosed(c);if(/^(?:disjuntor-1p|disjuntor-2p|disjuntor-3p)$/.test(typeOf(c)))c.dataset.breakerClosed='false';c.classList.remove('closed');c.dataset.protectionTripped='true';c.dataset.tripReason='short-circuit';c.dataset.shortCircuitTrip='true';const svg=c.querySelector?.('svg');if(svg){svg.dataset.closed='false';const on=svg.querySelector?.('#state-on'),off=svg.querySelector?.('#state-off');if(on&&off){on.classList.add('hidden');off.classList.remove('hidden')}const state=svg.querySelector?.('[data-breaker-state]');if(state)state.textContent='TRIP'}const state=c.querySelector?.('[data-device-state]');if(state)state.textContent='DISPARADO';return before};
    const setMpcbOpen=c=>{const before=c.dataset.switchState==='closed';c.dataset.switchState='open';c.dataset.protectionTripped='true';c.dataset.tripReason='short-circuit';c.dataset.shortCircuitTrip='true';c.classList.remove('closed');c.classList.add('tripped');const svg=c.querySelector?.('svg');if(svg){svg.dataset.switchState='open';svg.dataset.tripped='true'}const state=c.querySelector?.('[data-device-state]');if(state)state.textContent='CURTO / TRIP';return before};
    const setFuseOpen=c=>{const before=c.dataset.switchState==='closed';c.dataset.switchState='open';c.dataset.fuseBlown='true';c.dataset.protectionTripped='true';c.dataset.tripReason='short-circuit';c.dataset.shortCircuitTrip='true';c.classList.remove('closed');c.classList.add('tripped','fuse-blown');const svg=c.querySelector?.('svg');if(svg){svg.dataset.switchState='open';svg.dataset.fuseBlown='true'}const state=c.querySelector?.('[data-device-state]');if(state)state.textContent='FUSÍVEL ABERTO';return before};
    const blowFuse=c=>{const before=c.dataset.fuseBlown==='true';c.dataset.fuseBlown='true';c.dataset.protectionTripped='true';c.dataset.tripReason='short-circuit';c.dataset.shortCircuitTrip='true';c.classList.add('tripped','fuse-blown');const svg=c.querySelector?.('svg');if(svg)svg.dataset.fuseBlown='true';return !before};
    const terminalFaults=(component,states)=>componentTerminals(component).map(t=>classifyFault(terminalStates(states,t))).filter(Boolean);
    const evaluate=states=>{
      const trips=[];for(const component of sheet.querySelectorAll('.placed-component')){if(!(isBreaker(component)||isMpcb(component)||isFusedSwitch(component)||isFuse(component))||!closed(component))continue;const faults=terminalFaults(component,states);if(!faults.length)continue;const fault=faults[0];let changed=false;if(isBreaker(component))changed=setBreakerOpen(component);else if(isMpcb(component))changed=setMpcbOpen(component);else if(isFusedSwitch(component))changed=setFuseOpen(component);else changed=blowFuse(component);if(changed){component.dataset.lastFaultCode=fault.code||'';component.dataset.lastFaultTitle=fault.title||'Curto-circuito';trips.push({component,fault});if(notify)notify(`${label(component)}: disparo por ${String(fault.title||'curto-circuito').toLowerCase()}`)}}
      if(trips.length)scheduleElectricalRecalc();return trips;
    };
    const reset=c=>{if(!c)return false;if(isBreaker(c)){c.dataset.protectionTripped='false';delete c.dataset.tripReason;delete c.dataset.shortCircuitTrip;return true}if(isMpcb(c)){c.dataset.protectionTripped='false';c.classList.remove('tripped');delete c.dataset.tripReason;delete c.dataset.shortCircuitTrip;return true}if(isFusedSwitch(c)||isFuse(c)){c.dataset.fuseBlown='false';c.dataset.protectionTripped='false';c.classList.remove('tripped','fuse-blown');const svg=c.querySelector?.('svg');if(svg)svg.dataset.fuseBlown='false';delete c.dataset.tripReason;delete c.dataset.shortCircuitTrip;return true}return false};
    return Object.freeze({VERSION,evaluate,reset,isBreaker,isMpcb,isFusedSwitch,isFuse});
  };
  root.TechRibShortCircuitProtectionRuntime=Object.freeze({VERSION,create});
})(typeof window!=='undefined'?window:globalThis);
