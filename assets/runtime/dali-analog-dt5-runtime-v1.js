(function(root){
  'use strict';
  const base=root.TechRibCurrentLoopRuntimeV1;
  if(!base?.create)throw new Error('TechRibDaliAnalogDt5RuntimeV1: runtime base ausente');
  const baseCreate=base.create.bind(base);
  const create=options=>{
    const delegated=baseCreate(options);
    const {sheet,registryDefinition,componentTerminals,measureBetween}=options||{};
    if(!sheet?.querySelectorAll||typeof registryDefinition!=='function'||typeof componentTerminals!=='function'||typeof measureBetween!=='function')throw new Error('TechRibDaliAnalogDt5RuntimeV1: dependências ausentes');
    const all=()=>[...sheet.querySelectorAll('.placed-component[data-registry-id]')];
    const converters=()=>all().filter(c=>registryDefinition(c)?.behavior?.family==='dali-analog-converter');
    const controllers=()=>all().filter(c=>registryDefinition(c)?.behavior?.family==='dali-application-controller');
    const terms=c=>new Map(componentTerminals(c).map(t=>[t.dataset.terminal,t]));
    const bus=(c,states)=>{const m=terms(c),v=measureBetween(states,m.get('DA+'),m.get('DA-'),'DC'),voltage=Number(v?.voltage||0);return{powered:v?.type==='DC'&&voltage>=9.5&&voltage<=22.5,voltage,source:String(v?.source||'')}};
    const sameBus=(a,b,states)=>{const x=bus(a,states),y=bus(b,states);return x.powered&&y.powered&&(!x.source||!y.source||x.source===y.source)};
    const clamp=v=>Math.max(0,Math.min(100,Number(v)||0));

    const setStatusLed=(node,on,onColor='#32ff72',offColor='#d1d5db',glowColor=onColor)=>{if(!node)return;node.setAttribute('fill',on?onColor:offColor);if(on){node.style.filter=`drop-shadow(0 0 5px ${glowColor}) drop-shadow(0 0 12px ${glowColor})`;node.style.stroke=onColor;node.style.strokeWidth='1.8';node.style.opacity='1'}else{node.style.removeProperty('filter');node.style.stroke='#94a3b8';node.style.strokeWidth='1.2';node.style.opacity='0.96'}};
    const setPulseLed=(node,on,onColor='#38bdf8',offColor='#d1d5db')=>{if(!node)return;node.setAttribute('fill',on?onColor:offColor);if(on){node.style.filter=`drop-shadow(0 0 5px ${onColor}) drop-shadow(0 0 12px ${onColor})`;node.style.stroke=onColor;node.style.strokeWidth='1.8';node.style.opacity='1'}else{node.style.removeProperty('filter');node.style.stroke='#94a3b8';node.style.strokeWidth='1.2';node.style.opacity='0.96'}};
    const render=c=>{const powered=c.dataset.daliAnalogPowered==='true',level=clamp(c.dataset.daliAnalogLevel),voltage=Number(c.dataset.daliAnalogVoltage||0),busLed=c.querySelector('[data-dali-analog-bus-led]'),outLed=c.querySelector('[data-dali-analog-out-led]'),lv=c.querySelector('[data-dali-analog-level]'),vv=c.querySelector('[data-dali-analog-voltage]');if(busLed)setStatusLed(busLed,powered);if(outLed)setStatusLed(outLed,powered&&voltage>0.05);if(lv)lv.textContent=`LEVEL: ${level}%`;if(vv)vv.textContent=`OUT: ${voltage.toFixed(1)} V`};
    const evaluate=states=>{let changed=Boolean(delegated.evaluate?.(states));for(const c of converters()){const b=bus(c,states),ctrl=controllers().find(x=>sameBus(c,x,states)),level=b.powered&&ctrl?clamp(ctrl.dataset.daliBroadcastLevel):0,def=registryDefinition(c)||{},mode=String(def.behavior?.mode||'0-10'),max=Number(def.behavior?.output?.maxVoltage||10),min=Number(def.behavior?.output?.minVoltage||0),voltage=mode==='1-10'?(level<=0?1:1+(max-1)*(level/100)):min+(max-min)*(level/100),old=Number(c.dataset.daliAnalogVoltage||0);c.dataset.daliAnalogPowered=String(b.powered);c.dataset.daliAnalogLevel=String(level);c.dataset.daliAnalogVoltage=String(b.powered?voltage:0);c.dataset.daliAnalogSource=b.source;c.dataset.daliAnalogLastCommand=String(ctrl?.dataset?.daliLastCommand||'');render(c);if(Math.abs(old-Number(c.dataset.daliAnalogVoltage||0))>.001)changed=true}return changed};
    const reset=()=>{delegated.reset?.();for(const c of converters()){c.dataset.daliAnalogPowered='false';c.dataset.daliAnalogLevel='0';c.dataset.daliAnalogVoltage='0';render(c)}};
    return Object.freeze({...delegated,evaluate,reset});
  };
  root.TechRibDaliAnalogDt5RuntimeV1=Object.freeze({version:'techrib.dali-analog-dt5-runtime/v1',create});
  root.TechRibCurrentLoopRuntimeV1=Object.freeze({create});
})(typeof window!=='undefined'?window:globalThis);
