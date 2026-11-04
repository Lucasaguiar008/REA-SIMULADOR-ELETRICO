(function(root){
'use strict';
const parse=(s,f={})=>{try{const v=JSON.parse(s||'');return v&&typeof v==='object'?v:f}catch{return f}};
const normPin=p=>String(p||'').toUpperCase();
const readStates=c=>parse(c?.dataset?.mcpStates,'')||{};
const readModes=c=>parse(c?.dataset?.mcpPinModes,'')||{};
const setState=(c,p,v)=>{const s=readStates(c);s[normPin(p)]=v?'HIGH':'LOW';c.dataset.mcpStates=JSON.stringify(s)};
const getState=(c,p)=>readStates(c)[normPin(p)]||'LOW';
const setModes=(c,m)=>{c.dataset.mcpPinModes=JSON.stringify(m||{})};
const mode=(c,p)=>readModes(c)[normPin(p)]||'input';
const setAddress=(c,a)=>{c.dataset.i2cAddress='0x'+Number(a).toString(16).padStart(2,'0').toUpperCase();c.dataset.i2cAddressValue=String(Number(a))};
const address=c=>{const n=Number(c?.dataset?.i2cAddressValue);if(Number.isInteger(n))return n;const x=parseInt(String(c?.dataset?.i2cAddress||'0x20'),16);return Number.isFinite(x)?x:0x20};
function evaluatePower(component,states,{componentTerminals,measureBetween}={}){
 if(!component||component.dataset.behaviorType!=='i2c-gpio-expander')return false;
 const by=new Map(componentTerminals(component).map(t=>[t.dataset.terminal,t]));
 const m=measureBetween(states,by.get('VDD'),by.get('VSS'),'DC');
 const powered=m.type==='DC'&&m.voltage>=1.75&&m.voltage<=5.6;
 const before=component.dataset.mcpPowered==='true';component.dataset.mcpPowered=String(powered);component.dataset.mcpVdd=String(m.voltage||0);component.dataset.mcpSupplySource=powered?(m.source||''):'';component.classList.toggle('electronic-active',powered);
 component.title=`MCP23017 • ${component.dataset.i2cAddress||'0x20'} • ${powered?`${m.voltage.toFixed(2)} V`:'SEM ALIMENTAÇÃO'}`;
 return before!==powered;
}
function initializeExpander(component,spec={}){
 if(!component)return;setAddress(component,spec.address??0x20);component.dataset.mcpRole=spec.role||'mixed';
 const modes={},states={},explicit=spec.pinModes||{};for(const p of [...Array(8)].flatMap((_,i)=>[`GPA${i}`,`GPB${i}`])){let m=explicit[p]||((spec.role==='output')?'output':'input_pullup');if((p==='GPA7'||p==='GPB7')&&m!=='output')m='output';modes[p]=m;states[p]=m==='output'?'LOW':'HIGH'}
 component.dataset.mcpPinModes=JSON.stringify(modes);component.dataset.mcpStates=JSON.stringify(states);component.dataset.mcpPullups=String(Object.values(modes).some(m=>m==='input_pullup'));
}
function stepController(controller,{sheet,scheduleElectricalRecalc}={}){
 if(!controller?.dataset?.i2cLogicProgram)return false;let program;try{program=JSON.parse(controller.dataset.i2cLogicProgram)}catch{return false}
 const comps=[...sheet.querySelectorAll('.placed-component')],byTag=t=>comps.find(c=>(c.dataset.tag||'')===t),runtime=parse(controller.dataset.i2cLogicRuntime,'')||{memory:{},previous:{}};runtime.memory||={};runtime.previous||={};let changed=false;
 for(const r of program.rules||[]){if(r.type!=='toggle')continue;const input=byTag(r.trigger?.expander),output=byTag(r.output?.expander),button=byTag(r.trigger?.buttonTag);if(!input||!output||!button)continue;const ready=controller.dataset.logicPowered==='true'&&input.dataset.mcpPowered==='true'&&output.dataset.mcpPowered==='true';const key=`${r.trigger.expander}.${r.trigger.pin}`;const active=ready&&button.classList.contains('pressed');const was=!!runtime.previous[key];if(active&&!was){const mem=r.memory||key;runtime.memory[mem]=!runtime.memory[mem];setState(output,r.output.pin,!!runtime.memory[mem]);changed=true}runtime.previous[key]=active}
 controller.dataset.i2cLogicRuntime=JSON.stringify(runtime);if(changed)scheduleElectricalRecalc?.();return changed;
}
root.TechRibMcp23017Runtime=Object.freeze({version:'20E',readStates,readModes,setState,getState,setModes,mode,setAddress,address,evaluatePower,initializeExpander,stepController});
})(typeof window!=='undefined'?window:globalThis);
