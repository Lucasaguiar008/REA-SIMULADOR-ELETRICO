(function(root){
  'use strict';
  const create=({sheet,componentTerminals,registryDefinition,boardPowerState,measureBetween,wireOnlyConnected,gpioReadState}={})=>{
    if(!sheet?.querySelectorAll)throw new Error('TechRibShiftRegisterRuntimeV1: sheet ausente');
    for(const [name,fn] of Object.entries({componentTerminals,registryDefinition,boardPowerState,measureBetween,wireOnlyConnected,gpioReadState}))if(typeof fn!=='function')throw new Error(`TechRibShiftRegisterRuntimeV1: ${name} ausente`);
    const parse=(value,fallback=null)=>{try{return value?JSON.parse(value):fallback}catch{return fallback}};
    const byName=component=>new Map(componentTerminals(component).map(t=>[String(t.dataset.terminal||''),t]));
    const clampByte=value=>Math.max(0,Math.min(255,Math.round(Number(value)||0)))&0xff;
    const bits=value=>clampByte(value).toString(2).padStart(8,'0');
    const pins595=behavior=>({data:'DS',shiftClock:'SH_CP',latchClock:'ST_CP',masterReset:'MR',outputEnable:'OE',serialOut:'Q7S',outputs:['Q0','Q1','Q2','Q3','Q4','Q5','Q6','Q7'],...(behavior?.pins||{})});
    const pins165=behavior=>({shiftLoad:'SH_LD',clock:'CLK',clockInhibit:'CLK_INH',serialIn:'SER',serialOut:'QH',serialOutComplement:'QHN',inputs:['A','B','C','D','E','F','G','H'],...(behavior?.pins||{})});
    const snapshot595=c=>['shift595Powered','shift595SupplyVoltage','shift595Shift','shift595Output','shift595OutputEnabled','shift595PrevClock','shift595PrevLatch','shift595PrevMr','shift595LastByte','shift595Connected','shift595LastMaster'].map(k=>c.dataset[k]||'').join('|');
    const snapshot165=c=>['shift165Powered','shift165SupplyVoltage','shift165Register','shift165Parallel','shift165PrevClock','shift165PrevLoad','shift165SerialBit','shift165LastRead','shift165Connected','shift165LastMaster'].map(k=>c.dataset[k]||'').join('|');
    const terminalHigh=(node,states,name)=>{
      const terminal=node.map.get(name),gnd=node.map.get(node.behavior.power?.ground||'GND');if(!terminal||!gnd)return false;
      const m=measureBetween(states,terminal,gnd,'DC');
      const ratio=Number(node.behavior.logic?.highThresholdRatio??0.60),threshold=Math.max(1.2,Number(node.power.voltage||3.3)*ratio);
      return m?.type==='DC'&&Number(m.voltage||0)>=threshold;
    };
    const set595=(node,{shift,output,enabled,clock,latch,mr,lastByte}={})=>{
      const c=node.component;if(shift!=null)c.dataset.shift595Shift=String(clampByte(shift));if(output!=null)c.dataset.shift595Output=String(clampByte(output));if(enabled!=null)c.dataset.shift595OutputEnabled=String(Boolean(enabled));if(clock!=null)c.dataset.shift595PrevClock=String(Boolean(clock));if(latch!=null)c.dataset.shift595PrevLatch=String(Boolean(latch));if(mr!=null)c.dataset.shift595PrevMr=String(Boolean(mr));if(lastByte!=null)c.dataset.shift595LastByte=String(clampByte(lastByte));
    };
    const set165=(node,{register,parallel,clock,load,lastRead}={})=>{
      const c=node.component;if(register!=null)c.dataset.shift165Register=String(clampByte(register));if(parallel!=null)c.dataset.shift165Parallel=String(clampByte(parallel));if(clock!=null)c.dataset.shift165PrevClock=String(Boolean(clock));if(load!=null)c.dataset.shift165PrevLoad=String(Boolean(load));if(lastRead!=null)c.dataset.shift165LastRead=String(clampByte(lastRead));c.dataset.shift165SerialBit=String(Boolean(clampByte(c.dataset.shift165Register||register||0)&0x80));
    };
    const render595=node=>{
      const c=node.component,output=clampByte(c.dataset.shift595Output||0),shift=clampByte(c.dataset.shift595Shift||0),enabled=c.dataset.shift595OutputEnabled==='true',powered=c.dataset.shift595Powered==='true';
      const ot=c.querySelector?.('[data-shift595-output-text]'),st=c.querySelector?.('[data-shift595-shift-text]');if(ot)ot.textContent=`OUT ${bits(output)}`;if(st)st.textContent=`SHIFT ${bits(shift)}`;
      c.classList.toggle('peripheral-powered',powered);c.classList.toggle('peripheral-active',powered&&enabled&&output!==0);c.title=!powered?`${node.definition.name} • sem alimentação`:`${node.definition.name} • OUT 0b${bits(output)} • ${enabled?'saídas habilitadas':'OE desabilitado'}`;
    };
    const render165=node=>{
      const c=node.component,parallel=clampByte(c.dataset.shift165Parallel||0),register=clampByte(c.dataset.shift165Register||0),lastRead=clampByte(c.dataset.shift165LastRead??parallel),powered=c.dataset.shift165Powered==='true',qh=Boolean(register&0x80);
      const pt=c.querySelector?.('[data-shift165-parallel-text]'),rt=c.querySelector?.('[data-shift165-read-text]');if(pt)pt.textContent=`PAR ${bits(parallel)}`;if(rt)rt.textContent=`READ ${bits(lastRead)}`;
      c.classList.toggle('peripheral-powered',powered);c.classList.toggle('peripheral-active',powered&&parallel!==0);c.title=!powered?`${node.definition.name} • sem alimentação`:`${node.definition.name} • entradas A–H 0b${bits(parallel)} • última leitura 0b${bits(lastRead)} • QH ${qh?'HIGH':'LOW'}`;
    };
    const bus595=(master,node,spec)=>{
      const md=byName(master),p=pins595(node.behavior),data=md.get(spec.data||spec.ds||'GPIO23'),clk=md.get(spec.clock||spec.shiftClock||'GPIO18'),lat=md.get(spec.latch||spec.latchClock||'GPIO5'),ds=node.map.get(p.data),sh=node.map.get(p.shiftClock),st=node.map.get(p.latchClock);
      return Boolean(data&&clk&&lat&&ds&&sh&&st&&wireOnlyConnected(data,ds)&&wireOnlyConnected(clk,sh)&&wireOnlyConnected(lat,st));
    };
    const bus165=(master,node,spec)=>{
      const md=byName(master),p=pins165(node.behavior),load=md.get(spec.load||spec.shiftLoad||'GPIO23'),clk=md.get(spec.clock||'GPIO18'),data=md.get(spec.data||spec.serial||'GPIO19'),pl=node.map.get(p.shiftLoad),cp=node.map.get(p.clock),qh=node.map.get(p.serialOut);
      return Boolean(load&&clk&&data&&pl&&cp&&qh&&wireOnlyConnected(load,pl)&&wireOnlyConnected(clk,cp)&&wireOnlyConnected(data,qh));
    };
    const visibleProgram=master=>{const p=parse(master.dataset.logicProgram,null);return p&&(Array.isArray(p.shiftRegisters)||Array.isArray(p.parallelShiftRegisters))?p:null};
    const process595Controller=(master,program,nodes)=>{
      let runtime=parse(master.dataset.shift595ControllerRuntime,{previous:{}})||{previous:{}};runtime.previous=runtime.previous||{};let changed=false;
      for(const spec of program.shiftRegisters||[]){if(String(spec.type||'74HC595').toUpperCase()!=='74HC595')continue;let targets=nodes.filter(node=>node.power.powered&&bus595(master,node,spec));if(spec.tag)targets=targets.filter(node=>String(node.component.dataset.tag||'')===String(spec.tag));if(targets.length!==1)continue;const node=targets[0],tag=String(spec.tag||node.component.dataset.tag||node.component.dataset.componentId||'SR1');node.component.dataset.shift595Connected='true';node.component.dataset.shift595LastMaster=master.dataset.componentId||master.dataset.type||'master';
        for(const rule of program.serialRules||[]){if(String(rule.device||'')!==tag)continue;const type=String(rule.type||'write-byte'),pin=String(rule.trigger?.pin||rule.sourcePin||''),active=String(rule.trigger?.active||'HIGH').toUpperCase(),pinState=String(gpioReadState(master,pin)||'LOW').toUpperCase(),now=pinState===active,key=`${tag}.${pin}.${type}`,was=!!runtime.previous[key];if(type==='write-byte'){if(now&&!was){const value=clampByte(rule.value);set595(node,{shift:value,output:value,lastByte:value});node.component.dataset.shift595LastAction=`write-byte:${value}`;changed=true}}else if(type==='map-bit'&&now!==was){const bit=Math.max(0,Math.min(7,Math.round(Number(rule.bit)||0))),mask=1<<bit,current=clampByte(node.component.dataset.shift595Output||0),value=now?(current|mask):(current&~mask);if(value!==current){set595(node,{shift:value,output:value,lastByte:value});node.component.dataset.shift595LastAction=`map-bit:${bit}:${now?'1':'0'}`;changed=true}}runtime.previous[key]=now}
      }
      master.dataset.shift595ControllerRuntime=JSON.stringify(runtime);return changed;
    };
    const process165Controller=(master,program,nodes)=>{
      let runtime=parse(master.dataset.shift165ControllerRuntime,{previousParallel:{}})||{previousParallel:{}};runtime.previousParallel=runtime.previousParallel||{};let changed=false;
      for(const spec of program.parallelShiftRegisters||[]){if(String(spec.type||'74HC165').toUpperCase()!=='74HC165')continue;let targets=nodes.filter(node=>node.power.powered&&bus165(master,node,spec));if(spec.tag)targets=targets.filter(node=>String(node.component.dataset.tag||'')===String(spec.tag));if(targets.length!==1)continue;const node=targets[0],tag=String(spec.tag||node.component.dataset.tag||node.component.dataset.componentId||'SR1'),value=clampByte(node.component.dataset.shift165Parallel||0),before=runtime.previousParallel[tag];node.component.dataset.shift165Connected='true';node.component.dataset.shift165LastMaster=master.dataset.componentId||master.dataset.type||'master';
        if(spec.autoScan!==false&&(before===undefined||Number(before)!==value)){set165(node,{register:value,lastRead:value});node.component.dataset.shift165LastAction=`auto-read:${value}`;master.dataset.shift165LastReadByte=String(value);master.dataset.shift165LastReadBits=bits(value);runtime.previousParallel[tag]=value;master.techribRefreshLogicControls?.();changed=true}
      }
      master.dataset.shift165ControllerRuntime=JSON.stringify(runtime);return changed;
    };
    const processCrossRegisterRules=(master,program,nodes165,nodes595)=>{
      const rules=(program.rules||[]).filter(rule=>rule?.type==='toggle'&&rule?.trigger?.device&&rule?.output?.device);if(!rules.length)return false;
      let runtime=parse(master.dataset.shiftCrossRuleRuntime,{memory:{},previous:{}})||{memory:{},previous:{}};runtime.memory={...(program.memory||{}),...(runtime.memory||{})};runtime.previous=runtime.previous||{};let changed=false;
      // TECHRIB_SHIFT_VIRTUAL_MEMORY_COMMANDS_V4
      const virtualCommands=parse(master.dataset.shiftVirtualMemoryCommands,{})||{};
      if(virtualCommands&&typeof virtualCommands==='object'&&!Array.isArray(virtualCommands)){
        for(const [memoryKey,value] of Object.entries(virtualCommands)){
          if(Object.prototype.hasOwnProperty.call(runtime.memory,memoryKey)){
            const next=Boolean(value);
            if(Boolean(runtime.memory[memoryKey])!==next)changed=true;
            runtime.memory[memoryKey]=next;
          }
        }
      }
      if(master.dataset.shiftVirtualMemoryCommands)delete master.dataset.shiftVirtualMemoryCommands;
      const inSpecs=program.parallelShiftRegisters||[],outSpecs=program.shiftRegisters||[];
      const find165=tag=>{const spec=inSpecs.find(s=>String(s.tag||'')===String(tag));if(!spec)return null;let targets=nodes165.filter(node=>node.power.powered&&bus165(master,node,spec)&&String(node.component.dataset.tag||'')===String(tag));return targets.length===1?{node:targets[0],spec}:null};
      const find595=tag=>{const spec=outSpecs.find(s=>String(s.tag||'')===String(tag));if(!spec)return null;let targets=nodes595.filter(node=>node.power.powered&&bus595(master,node,spec)&&String(node.component.dataset.tag||'')===String(tag));return targets.length===1?{node:targets[0],spec}:null};
      for(const rule of rules){const input=find165(rule.trigger.device),output=find595(rule.output.device);if(!input||!output)continue;const inPins=pins165(input.node.behavior).inputs||[],outPins=pins595(output.node.behavior).outputs||[],inPin=String(rule.trigger.pin||'').toUpperCase(),outPin=String(rule.output.pin||'').toUpperCase(),inBit=inPins.findIndex(p=>String(p).toUpperCase()===inPin),outBit=outPins.findIndex(p=>String(p).toUpperCase()===outPin);if(inBit<0||outBit<0)continue;
        const value=clampByte(input.node.component.dataset.shift165LastRead??input.node.component.dataset.shift165Parallel??0),high=Boolean(value&(1<<inBit)),active=String(rule.trigger.active||'HIGH').toUpperCase()==='LOW'?!high:high,key=`${rule.trigger.device}.${inPin}`,was=!!runtime.previous[key],mem=String(rule.memory||key);
        if(active&&!was){runtime.memory[mem]=!Boolean(runtime.memory[mem]);changed=true}
        runtime.previous[key]=active;const on=Boolean(runtime.memory[mem]),activeLevel=String(rule.output.active||'HIGH').toUpperCase(),wantedHigh=on?(activeLevel!=='LOW'):(String(rule.output.inactive||'LOW').toUpperCase()!=='LOW'),mask=1<<outBit,current=clampByte(output.node.component.dataset.shift595Output||0),next=wantedHigh?(current|mask):(current&~mask);
        if(next!==current){set595(output.node,{shift:next,output:next,lastByte:next});output.node.component.dataset.shift595LastAction=`toggle:${outPin}:${wantedHigh?'1':'0'}`;changed=true}
      }
      master.dataset.shiftCrossRuleRuntime=JSON.stringify(runtime);master.dataset.shiftCrossMemory=JSON.stringify(runtime.memory);return changed;
    };
    const evaluate=states=>{
      const all=[...sheet.querySelectorAll('.placed-component[data-registry-id]')];
      const nodes595=all.filter(c=>registryDefinition(c)?.behavior?.type==='serial-shift-register').map(component=>{const definition=registryDefinition(component),behavior=definition.behavior||{},power=boardPowerState(component,states,behavior),map=power.byName||byName(component),before=snapshot595(component);return{component,definition,behavior,power,map,before}});
      const nodes165=all.filter(c=>registryDefinition(c)?.behavior?.type==='parallel-input-shift-register').map(component=>{const definition=registryDefinition(component),behavior=definition.behavior||{},power=boardPowerState(component,states,behavior),map=power.byName||byName(component),before=snapshot165(component);return{component,definition,behavior,power,map,before}});
      if(!nodes595.length&&!nodes165.length)return false;let changed=false;
      for(const node of nodes595){const c=node.component,p=pins595(node.behavior);c.dataset.shift595Powered=String(Boolean(node.power.powered));c.dataset.shift595SupplyVoltage=String(Math.round(Number(node.power.voltage||0)*1000)/1000);c.dataset.shift595SupplySource=node.power.source||'';c.dataset.shift595Connected='false';if(!node.power.powered){set595(node,{shift:0,output:0,enabled:false,clock:false,latch:false,mr:false,lastByte:0});render595(node);continue}
        let shift=clampByte(c.dataset.shift595Shift||0),output=clampByte(c.dataset.shift595Output||0),prevClock=c.dataset.shift595PrevClock==='true',prevLatch=c.dataset.shift595PrevLatch==='true';const dataHigh=terminalHigh(node,states,p.data),clockHigh=terminalHigh(node,states,p.shiftClock),latchHigh=terminalHigh(node,states,p.latchClock),mrHigh=terminalHigh(node,states,p.masterReset),oeHigh=terminalHigh(node,states,p.outputEnable);
        if(!mrHigh){if(shift!==0){shift=0;changed=true}}else if(clockHigh&&!prevClock){shift=((shift<<1)&0xff)|(dataHigh?1:0);changed=true}if(latchHigh&&!prevLatch){if(output!==shift){output=shift;changed=true}c.dataset.shift595LastByte=String(output)}const enabled=!oeHigh;set595(node,{shift,output,enabled,clock:clockHigh,latch:latchHigh,mr:mrHigh});
      }
      for(const node of nodes165){const c=node.component,p=pins165(node.behavior);c.dataset.shift165Powered=String(Boolean(node.power.powered));c.dataset.shift165SupplyVoltage=String(Math.round(Number(node.power.voltage||0)*1000)/1000);c.dataset.shift165SupplySource=node.power.source||'';c.dataset.shift165Connected='false';if(!node.power.powered){set165(node,{register:0,parallel:0,clock:false,load:false,lastRead:0});render165(node);continue}
        const parallel=(p.inputs||[]).reduce((v,name,i)=>terminalHigh(node,states,name)?(v|(1<<i)):v,0),loadHigh=terminalHigh(node,states,p.shiftLoad),clockHigh=terminalHigh(node,states,p.clock),inhibitHigh=terminalHigh(node,states,p.clockInhibit),serialHigh=terminalHigh(node,states,p.serialIn),prevClock=c.dataset.shift165PrevClock==='true';let reg=clampByte(c.dataset.shift165Register||0);
        if(!loadHigh){if(reg!==parallel){reg=parallel;changed=true}}else if(!inhibitHigh&&clockHigh&&!prevClock){reg=((reg<<1)&0xff)|(serialHigh?1:0);changed=true}set165(node,{register:reg,parallel,clock:clockHigh,load:loadHigh});
      }
      for(const master of all){const program=visibleProgram(master);if(program){changed=process595Controller(master,program,nodes595)||changed;changed=process165Controller(master,program,nodes165)||changed;changed=processCrossRegisterRules(master,program,nodes165,nodes595)||changed}}
      nodes595.forEach(render595);nodes165.forEach(render165);return changed||nodes595.some(n=>n.before!==snapshot595(n.component))||nodes165.some(n=>n.before!==snapshot165(n.component));
    };
    const reset=()=>{[...sheet.querySelectorAll('.placed-component[data-registry-id]')].forEach(c=>{const type=registryDefinition(c)?.behavior?.type;if(type==='serial-shift-register'){['shift595Powered','shift595SupplyVoltage','shift595SupplySource','shift595Shift','shift595Output','shift595OutputEnabled','shift595PrevClock','shift595PrevLatch','shift595PrevMr','shift595LastByte','shift595Connected','shift595LastMaster','shift595LastAction'].forEach(k=>delete c.dataset[k]);c.classList.remove('peripheral-powered','peripheral-active');const ot=c.querySelector?.('[data-shift595-output-text]'),st=c.querySelector?.('[data-shift595-shift-text]');if(ot)ot.textContent='OUT 00000000';if(st)st.textContent='SHIFT 00000000'}else if(type==='parallel-input-shift-register'){['shift165Powered','shift165SupplyVoltage','shift165SupplySource','shift165Register','shift165Parallel','shift165PrevClock','shift165PrevLoad','shift165SerialBit','shift165LastRead','shift165Connected','shift165LastMaster','shift165LastAction'].forEach(k=>delete c.dataset[k]);c.classList.remove('peripheral-powered','peripheral-active');const pt=c.querySelector?.('[data-shift165-parallel-text]'),rt=c.querySelector?.('[data-shift165-read-text]');if(pt)pt.textContent='PAR 00000000';if(rt)rt.textContent='READ 00000000'}if(c.dataset.shift595ControllerRuntime)delete c.dataset.shift595ControllerRuntime;if(c.dataset.shift165ControllerRuntime)delete c.dataset.shift165ControllerRuntime;if(c.dataset.shiftCrossRuleRuntime)delete c.dataset.shiftCrossRuleRuntime;delete c.dataset.shiftCrossMemory;delete c.dataset.shift165LastReadByte;delete c.dataset.shift165LastReadBits})};
    return Object.freeze({evaluate,reset,busRelation:bus595,bus595,bus165});
  };
  root.TechRibShiftRegisterRuntimeV1=Object.freeze({version:'1.2',create});
})(typeof window!=='undefined'?window:globalThis);
