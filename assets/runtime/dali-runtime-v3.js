(function(root){
  'use strict';
  const base=root.TechRibCurrentLoopRuntimeV1;
  if(!base?.create)throw new Error('TechRibDaliRuntimeV3: runtime base ausente');
  const baseCreate=base.create.bind(base);
  const create=options=>{
    const delegated=baseCreate(options);
    const {sheet,registryDefinition}=options||{};
    if(!sheet?.querySelectorAll||typeof registryDefinition!=='function')throw new Error('TechRibDaliRuntimeV3: dependências ausentes');
    const controllers=()=>[...sheet.querySelectorAll('.placed-component[data-registry-id]')].filter(c=>registryDefinition(c)?.behavior?.family==='dali-application-controller');
    const clamp=v=>Math.max(0,Math.min(100,Number(v)||0));
    const cctClamp=(c,v)=>{const b=registryDefinition(c)?.behavior||{},min=Number(b.cctMinK||2700),max=Number(b.cctMaxK||6500);return Math.max(min,Math.min(max,Number(v)||Number(b.cctDefaultK||4000)))};
    const presets=c=>{const p=registryDefinition(c)?.behavior?.colorPresets;return Array.isArray(p)&&p.length?p:['WHITE','RED','GREEN','BLUE','AMBER','CYAN','MAGENTA']};

    const setStatusLed=(node,on,onColor='#32ff72',offColor='#d1d5db',glowColor=onColor)=>{if(!node)return;node.setAttribute('fill',on?onColor:offColor);if(on){node.style.filter=`drop-shadow(0 0 5px ${glowColor}) drop-shadow(0 0 12px ${glowColor})`;node.style.stroke=onColor;node.style.strokeWidth='1.8';node.style.opacity='1'}else{node.style.removeProperty('filter');node.style.stroke='#94a3b8';node.style.strokeWidth='1.2';node.style.opacity='0.96'}};
    const setPulseLed=(node,on,onColor='#38bdf8',offColor='#d1d5db')=>{if(!node)return;node.setAttribute('fill',on?onColor:offColor);if(on){node.style.filter=`drop-shadow(0 0 5px ${onColor}) drop-shadow(0 0 12px ${onColor})`;node.style.stroke=onColor;node.style.strokeWidth='1.8';node.style.opacity='1'}else{node.style.removeProperty('filter');node.style.stroke='#94a3b8';node.style.strokeWidth='1.2';node.style.opacity='0.96'}};
    const render=c=>{
      const powered=c.dataset.powerSupplyActive==='true',level=clamp(c.dataset.daliBroadcastLevel),bcast=level>0?'ON':'OFF',scan=Number(c.dataset.daliScanCount||0),cct=cctClamp(c,c.dataset.daliCctK),color=String(c.dataset.daliColorPreset||'WHITE');
      const d=c.querySelector('[data-dali-controller-display]');if(d)d.textContent=powered?'DALI-2 CONTROLLER READY':'SEM ALIMENTAÇÃO';
      const l=c.querySelector('[data-dali-controller-line]');if(l)l.textContent=powered?'DALI LINE: 16 V / 250 mA':'DALI LINE: OFF';
      const s=c.querySelector('[data-dali-controller-status]');if(s)s.textContent=powered?`L:${level}% • ${cct}K • ${color} • SCAN:${scan}`:'BCAST: OFF • LEVEL: 0%';
      const bus=c.querySelector('[data-dali-bus-led]');if(bus)setStatusLed(bus,powered);
      const tx=c.querySelector('[data-dali-tx-led]'),pulse=c.dataset.daliTxPulse==='true';if(tx)setPulseLed(tx,pulse);
    };
    const pulse=c=>{c.dataset.daliTxPulse='true';render(c);clearTimeout(c.__daliTxTimer);c.__daliTxTimer=setTimeout(()=>{if(c.isConnected){c.dataset.daliTxPulse='false';render(c)}},330)};
    const command=(c,cmd)=>{
      if(c.dataset.powerSupplyActive!=='true')return;
      const b=registryDefinition(c)?.behavior||{},step=Math.max(1,Number(b.levelStepPercent||25)),cctStep=Math.max(100,Number(b.cctStepK||500));let level=clamp(c.dataset.daliBroadcastLevel),cct=cctClamp(c,c.dataset.daliCctK),color=String(c.dataset.daliColorPreset||'WHITE');
      if(cmd==='scan'){c.dataset.daliScanCount=String(Number(c.dataset.daliDetectedGear||0));c.dataset.daliLastCommand='scan';}
      if(cmd==='on'){level=100;c.dataset.daliBroadcastState='on';c.dataset.daliLastCommand='broadcast-on';}
      if(cmd==='off'){level=0;c.dataset.daliBroadcastState='off';c.dataset.daliLastCommand='broadcast-off';}
      if(cmd==='level-up'||cmd==='level-down'){level=clamp(level+(cmd==='level-up'?step:-step));c.dataset.daliBroadcastState=level>0?'on':'off';c.dataset.daliLastCommand=`broadcast-level-${level}`;}
      if(cmd==='cct-up'||cmd==='cct-down'){cct=cctClamp(c,cct+(cmd==='cct-up'?cctStep:-cctStep));c.dataset.daliCctK=String(cct);c.dataset.daliLastCommand=`dt8-cct-${cct}`;}
      if(cmd==='color-next'){const list=presets(c),idx=Math.max(0,list.indexOf(color)),next=list[(idx+1)%list.length];color=next;c.dataset.daliColorPreset=color;c.dataset.daliLastCommand=`dt8-color-${color.toLowerCase()}`;}
      c.dataset.daliBroadcastLevel=String(level);c.dataset.daliCctK=String(cct);c.dataset.daliColorPreset=color;pulse(c);render(c);try{root.TECHRIB_ELECTRICAL?.recalculate?.()}catch{}
    };
    const bind=c=>{if(c.__techribDaliBound)return;c.__techribDaliBound=true;if(!c.dataset.daliBroadcastState)c.dataset.daliBroadcastState='off';if(!c.dataset.daliBroadcastLevel)c.dataset.daliBroadcastLevel=c.dataset.daliBroadcastState==='on'?'100':'0';if(!c.dataset.daliCctK)c.dataset.daliCctK=String(registryDefinition(c)?.behavior?.cctDefaultK||4000);if(!c.dataset.daliColorPreset)c.dataset.daliColorPreset='WHITE';c.querySelectorAll('[data-dali-controller-command]').forEach(n=>n.addEventListener('click',e=>{e.preventDefault?.();e.stopPropagation?.();command(c,String(n.getAttribute('data-dali-controller-command')||''))}));render(c)};
    const evaluate=states=>{const changed=Boolean(delegated.evaluate?.(states));for(const c of controllers()){bind(c);render(c)}return changed};
    const reset=()=>{delegated.reset?.();for(const c of controllers()){c.dataset.daliBroadcastState='off';c.dataset.daliBroadcastLevel='0';c.dataset.daliScanCount='0';c.dataset.daliCctK=String(registryDefinition(c)?.behavior?.cctDefaultK||4000);c.dataset.daliColorPreset='WHITE';delete c.dataset.daliTxPulse;delete c.dataset.daliLastCommand;render(c)}};
    return Object.freeze({...delegated,evaluate,reset,command});
  };
  root.TechRibDaliRuntimeV1=Object.freeze({version:'techrib.dali-runtime/v3',create});
  root.TechRibCurrentLoopRuntimeV1=Object.freeze({create});
})(typeof window!=='undefined'?window:globalThis);
