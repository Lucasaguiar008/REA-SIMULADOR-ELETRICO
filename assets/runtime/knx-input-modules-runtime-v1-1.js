(function(root){
  'use strict';
  const base=root.TechRibCurrentLoopRuntimeV1;
  if(!base?.create)throw new Error('TechRibKnxInputModulesRuntimeV1_2: runtime base ausente');
  const baseCreate=base.create.bind(base);
  const create=options=>{
    const delegated=baseCreate(options);
    const {sheet,registryDefinition,componentTerminals,measureBetween,wireOnlyConnected}=options||{};
    if(!sheet?.querySelectorAll||typeof registryDefinition!=='function'||typeof componentTerminals!=='function'||typeof measureBetween!=='function'||typeof wireOnlyConnected!=='function')throw new Error('TechRibKnxInputModulesRuntimeV1_2: dependências ausentes');

    const all=()=>[...sheet.querySelectorAll('.placed-component[data-registry-id]')];
    const inputs=()=>all().filter(c=>registryDefinition(c)?.behavior?.family==='knx-binary-input');
    const actuators=()=>all().filter(c=>registryDefinition(c)?.behavior?.family==='knx-switch-actuator');
    let lastStates=null;
    const recalc=()=>{try{root.TECHRIB_ELECTRICAL?.recalculate?.()}catch{}};
    const terms=c=>new Map(componentTerminals(c).map(t=>[String(t.dataset.terminal||''),t]));
    const readObj=(c,key)=>{try{return JSON.parse(c.dataset[key]||'{}')}catch{return{}}};
    const writeObj=(c,key,obj)=>{c.dataset[key]=JSON.stringify(obj)};
    const bus=(c,states)=>{
      const m=terms(c),a=m.get('KNX+'),b=m.get('KNX-');
      if(!a||!b)return{powered:false,voltage:0,source:''};
      const v=measureBetween(states,a,b,'DC')||{},voltage=Number(v.voltage||0);
      return{powered:v.type==='DC'&&voltage>=20.5&&voltage<=31.5,voltage,source:String(v.source||'')};
    };
    const sameBus=(a,b,states)=>{
      const x=bus(a,states),y=bus(b,states);
      return x.powered&&y.powered&&(!x.source||!y.source||x.source===y.source);
    };
    const setLed=(node,on,color='#32ff72')=>{if(!node)return;node.setAttribute('fill',on?color:'#d1d5db');if(on){node.style.filter=`drop-shadow(0 0 5px ${color}) drop-shadow(0 0 12px ${color})`;node.style.stroke=color;node.style.strokeWidth='1.8';node.style.opacity='1'}else{node.style.removeProperty('filter');node.style.stroke='#94a3b8';node.style.strokeWidth='1.2';node.style.opacity='.96'}};
    const pushbuttonLike=p=>{const b=registryDefinition(p)?.behavior||{},t=String(p.dataset.type||'');return b.type==='pushbutton-no'||/^botoeira-liga(?:-|$)/.test(t)};
    const wiredButton=(input,ch)=>{
      const im=terms(input),ca=im.get(`C${ch}`),ib=im.get(`IN${ch}`);if(!ca||!ib)return null;
      for(const p of all()){
        if(p===input||!pushbuttonLike(p))continue;
        const pm=terms(p),a=pm.get('13'),b=pm.get('14');if(!a||!b)continue;
        if((wireOnlyConnected(ca,a)&&wireOnlyConnected(ib,b))||(wireOnlyConnected(ca,b)&&wireOnlyConnected(ib,a)))return p;
      }
      return null;
    };
    const render=c=>{
      const def=registryDefinition(c)||{},beh=def.behavior||{},channels=Math.max(1,Number(beh.channels||8)),mode=String(beh.inputMode||'dry-contact'),powered=c.dataset.knxBinaryInputPowered==='true',states=readObj(c,'knxBinaryInputStates'),volts=readObj(c,'knxBinaryInputVoltages'),types=readObj(c,'knxBinaryInputTypes'),tx=c.dataset.knxBinaryInputTxPulse==='true';
      setLed(c.querySelector('[data-knx-input-power-led],[data-knx-binary-power-led],[data-knx-bus-led]'),powered);
      setLed(c.querySelector('[data-knx-input-tx-led],[data-knx-binary-tx-led],[data-knx-tx-led]'),tx,'#38bdf8');
      c.querySelectorAll('[data-knx-input-led]').forEach(n=>{const k=String(n.getAttribute('data-knx-input-led')||'');setLed(n,states[k]===true)});
      const active=Object.entries(states).filter(([,v])=>v===true).map(([k])=>k);
      const stateLabel=c.querySelector('[data-knx-input-state],[data-knx-binary-state]');
      if(stateLabel)stateLabel.textContent=!powered?'SEM BARRAMENTO KNX':active.length?`ENTRADAS ATIVAS: ${active.join(' • ')}`:`KNX TP1 • ${channels} ENTRADAS PRONTAS`;
      const info=c.querySelector('[data-knx-input-voltage],[data-knx-binary-voltage]');
      if(info){
        if(mode==='voltage'){
          const best=Object.entries(volts).sort((a,b)=>Number(b[1])-Number(a[1]))[0];
          info.textContent=best&&Number(best[1])>0.5?`CH${best[0]}: ${Number(best[1]).toFixed(0)} V ${types[best[0]]||''}`:'ENTRADAS: 0 V';
        }else if(mode==='manual-front-panel') info.textContent=powered?'TECLAS FRONTAIS: PRONTAS':'TECLAS FRONTAIS: SEM BUS';
        else info.textContent=active.length?`CONTATOS FECHADOS: ${active.join(' • ')}`:'CONTATOS: ABERTOS';
      }
      c.classList.toggle('peripheral-powered',powered);c.classList.toggle('peripheral-active',active.length>0);
      c.title=!powered?`${def.name||'Entrada binária KNX'} • sem barramento KNX`:active.length?`${def.name||'Entrada binária KNX'} • canais ativos: ${active.join(', ')}`:`${def.name||'Entrada binária KNX'} • pronta`;
    };
    const pulseTx=c=>{c.dataset.knxBinaryInputTxPulse='true';render(c);clearTimeout(c.__techribKnxBinaryTx);c.__techribKnxBinaryTx=setTimeout(()=>{if(c.isConnected){c.dataset.knxBinaryInputTxPulse='false';render(c)}},280)};
    const measureInput=(states,a,b)=>{
      if(!a||!b)return{voltage:0,type:''};
      const ac=measureBetween(states,a,b,'AC')||{},dc=measureBetween(states,a,b,'DC')||{},av=Number(ac.voltage||0),dv=Number(dc.voltage||0);
      return av>=dv?{voltage:av,type:ac.type==='AC'?'AC':''}:{voltage:dv,type:dc.type==='DC'?'DC':''};
    };
    const channelTargets=(input,ch,states)=>actuators().filter(a=>Number(registryDefinition(a)?.behavior?.channels||0)>=ch&&sameBus(input,a,states));
    const setChannel=(input,ch,on,states)=>{
      let changed=false;for(const a of channelTargets(input,ch,states)){a.dataset.logicManualWiringTest='true';const o=readObj(a,'relayTestOverride'),key=String(ch);if(Boolean(o[key])!==Boolean(on)){o[key]=Boolean(on);writeObj(a,'relayTestOverride',o);changed=true}}return changed;
    };
    const toggleChannel=(input,ch,states)=>{
      let changed=false;for(const a of channelTargets(input,ch,states)){a.dataset.logicManualWiringTest='true';const o=readObj(a,'relayTestOverride'),key=String(ch),next=!Boolean(o[key]);o[key]=next;writeObj(a,'relayTestOverride',o);changed=true}return changed;
    };
    const bindManualFrontPanel=c=>{
      if(c.__techribKnxInputManualBound)return;c.__techribKnxInputManualBound=true;
      c.querySelectorAll('[data-knx-input-toggle]').forEach(n=>n.addEventListener('click',e=>{
        e.preventDefault?.();e.stopPropagation?.();
        if(c.dataset.knxBinaryInputPowered!=='true'||!lastStates)return;
        const ch=Number(n.getAttribute('data-knx-input-toggle')||0),def=registryDefinition(c)||{},channels=Math.max(1,Number(def.behavior?.channels||4));
        if(!Number.isInteger(ch)||ch<1||ch>channels)return;
        const current=readObj(c,'knxBinaryInputStates'),key=String(ch),next=!Boolean(current[key]);current[key]=next;writeObj(c,'knxBinaryInputStates',current);
        if(toggleChannel(c,ch,lastStates)){pulseTx(c);render(c);recalc()}else{pulseTx(c);render(c)}
      }));
    };
    const evaluateInput=(c,states)=>{
      const def=registryDefinition(c)||{},beh=def.behavior||{},m=terms(c),b=bus(c,states),channels=Math.max(1,Number(beh.channels||8)),mode=String(beh.inputMode||'dry-contact'),action=String(c.dataset.knxInputAction||beh.eventMode||'toggle-on-rise'),previous=readObj(c,'knxBinaryInputStates'),next={},volts={},types={};
      let changed=c.dataset.knxBinaryInputPowered!==String(b.powered),transition=false;
      c.dataset.knxBinaryInputPowered=String(b.powered);c.dataset.knxBinaryInputBusVoltage=String(Math.round(b.voltage*10)/10);c.dataset.knxBinaryInputBusSource=b.source;
      if(mode==='manual-front-panel')bindManualFrontPanel(c);
      for(let i=1;i<=channels;i++){
        const key=String(i),had=Object.prototype.hasOwnProperty.call(previous,key),old=Boolean(previous[key]);let on=false;
        if(mode==='manual-front-panel'){
          on=Boolean(previous[key]);volts[key]=0;types[key]='MANUAL';
        }else if(mode==='voltage'){
          const meas=measureInput(states,m.get(`IN${i}`),m.get(`C${i}`)),min=Number(beh.inputMinVoltage??10),max=Number(beh.inputMaxVoltage??253);
          on=b.powered&&meas.voltage>=min&&meas.voltage<=max;volts[key]=Math.round(meas.voltage*10)/10;types[key]=meas.type;
        }else{
          const p=wiredButton(c,i);on=b.powered&&!!p&&p.classList.contains('pressed');volts[key]=0;types[key]='DRY';
        }
        next[key]=on;
        if(!had||old!==on)changed=true;
        if(mode==='manual-front-panel')continue;
        const rising=had&&!old&&on;
        const falling=had&&old&&!on;
        if(action==='follow'){
          if((rising||falling)&&setChannel(c,i,on,states))changed=true;
          if(rising||falling)transition=true;
        }else if(rising){
          if(toggleChannel(c,i,states))changed=true;transition=true;
        }
      }
      writeObj(c,'knxBinaryInputStates',next);writeObj(c,'knxBinaryInputVoltages',volts);writeObj(c,'knxBinaryInputTypes',types);
      if(transition)pulseTx(c);else render(c);
      return changed;
    };
    const evaluate=states=>{lastStates=states;let changed=Boolean(delegated.evaluate?.(states));for(const c of inputs())if(evaluateInput(c,states))changed=true;return changed};
    const reset=()=>{delegated.reset?.();for(const c of inputs()){writeObj(c,'knxBinaryInputStates',{});writeObj(c,'knxBinaryInputVoltages',{});writeObj(c,'knxBinaryInputTypes',{});c.dataset.knxBinaryInputPowered='false';delete c.dataset.knxBinaryInputTxPulse;delete c.dataset.knxBinaryInputBusSource;c.dataset.knxBinaryInputBusVoltage='0';render(c)}};
    return Object.freeze({...delegated,evaluate,reset});
  };
  root.TechRibKnxInputModulesRuntimeV1_1=Object.freeze({version:'techrib.knx-input-modules-runtime/v1.3',create});
  root.TechRibCurrentLoopRuntimeV1=Object.freeze({create});
})(typeof window!=='undefined'?window:globalThis);
