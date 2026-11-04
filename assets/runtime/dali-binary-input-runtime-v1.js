(function(root){
  'use strict';
  const base=root.TechRibCurrentLoopRuntimeV1;
  if(!base?.create)throw new Error('TechRibDaliBinaryInputRuntimeV1: runtime base ausente');
  const baseCreate=base.create.bind(base);
  const create=options=>{
    const delegated=baseCreate(options);
    const {sheet,registryDefinition,componentTerminals,measureBetween,wireOnlyConnected}=options||{};
    if(!sheet?.querySelectorAll||typeof registryDefinition!=='function'||typeof componentTerminals!=='function'||typeof measureBetween!=='function'||typeof wireOnlyConnected!=='function')throw new Error('TechRibDaliBinaryInputRuntimeV1: dependências ausentes');
    const all=()=>[...sheet.querySelectorAll('.placed-component[data-registry-id]')];
    const family=f=>all().filter(c=>registryDefinition(c)?.behavior?.family===f);
    const mainsInputs=()=>family('dali-mains-voltage-input');
    const universalInputs=()=>family('dali-universal-switch-input');
    const controllers=()=>family('dali-application-controller');
    const actuators=()=>family('dali-switch-actuator');
    const terms=c=>new Map(componentTerminals(c).map(t=>[t.dataset.terminal,t]));
    const readObj=(c,key)=>{try{return JSON.parse(c.dataset[key]||'{}')}catch{return{}}};
    const writeObj=(c,key,obj)=>{c.dataset[key]=JSON.stringify(obj)};
    const bus=(c,states)=>{const m=terms(c),v=measureBetween(states,m.get('DA+'),m.get('DA-'),'DC'),voltage=Number(v?.voltage||0);return{powered:v?.type==='DC'&&voltage>=9.5&&voltage<=22.5,voltage,source:String(v?.source||'')}};
    let lastStates=null;
    const sameBus=(a,b,states)=>{const x=bus(a,states),y=bus(b,states);return x.powered&&y.powered&&(!x.source||!y.source||x.source===y.source)};
    const recalc=()=>{try{root.TECHRIB_ELECTRICAL?.recalculate?.()}catch{}};

    const setStatusLed=(node,on,onColor='#32ff72',offColor='#d1d5db',glowColor=onColor)=>{if(!node)return;node.setAttribute('fill',on?onColor:offColor);if(on){node.style.filter=`drop-shadow(0 0 5px ${glowColor}) drop-shadow(0 0 12px ${glowColor})`;node.style.stroke=onColor;node.style.strokeWidth='1.8';node.style.opacity='1'}else{node.style.removeProperty('filter');node.style.stroke='#94a3b8';node.style.strokeWidth='1.2';node.style.opacity='0.96'}};
    const setPulseLed=(node,on,onColor='#38bdf8',offColor='#d1d5db')=>{if(!node)return;node.setAttribute('fill',on?onColor:offColor);if(on){node.style.filter=`drop-shadow(0 0 5px ${onColor}) drop-shadow(0 0 12px ${onColor})`;node.style.stroke=onColor;node.style.strokeWidth='1.8';node.style.opacity='1'}else{node.style.removeProperty('filter');node.style.stroke='#94a3b8';node.style.strokeWidth='1.2';node.style.opacity='0.96'}};
    const controllerFor=(input,states)=>controllers().find(c=>sameBus(input,c,states))||null;
    const pulseController=c=>{if(!c)return;c.dataset.daliTxPulse='true';clearTimeout(c.__daliInputCtrlPulse);c.__daliInputCtrlPulse=setTimeout(()=>{if(c.isConnected)c.dataset.daliTxPulse='false'},320)};
    const setAddress=(source,address,value,states)=>{
      const ctrl=controllerFor(source,states); if(!ctrl)return false;
      let done=false;
      for(const a of actuators()){
        if(!sameBus(source,a,states))continue;
        const total=Number(registryDefinition(a)?.behavior?.channels||0),baseAddr=Number(a.dataset.daliAddressBase||1);
        if(address<baseAddr||address>=baseAddr+total)continue;
        const local=address-baseAddr+1,o=readObj(a,'relayTestOverride');
        a.dataset.logicManualWiringTest='true';o[String(local)]=Boolean(value);writeObj(a,'relayTestOverride',o);done=true;
      }
      ctrl.dataset.daliLastCommand=`input-address-${address}-${value?'on':'off'}`;pulseController(ctrl);if(done)recalc();return done;
    };
    const renderMains=c=>{const powered=c.dataset.daliMainsPowered==='true',states=readObj(c,'daliMainsInputStates'),volts=readObj(c,'daliMainsInputVoltages'),tx=c.dataset.daliMainsTxPulse==='true',busLed=c.querySelector('[data-dali-mains-bus-led]'),txLed=c.querySelector('[data-dali-mains-tx-led]'),label=c.querySelector('[data-dali-mains-state]'),vlabel=c.querySelector('[data-dali-mains-voltage]'),active=Object.entries(states).filter(([,v])=>v===true).map(([k])=>k);if(busLed)setStatusLed(busLed,powered);if(txLed)setPulseLed(txLed,tx);c.querySelectorAll('[data-dali-mains-input-led]').forEach(n=>{const k=String(n.getAttribute('data-dali-mains-input-led')||''),on=states[k]===true;setStatusLed(n,on)});if(label)label.textContent=!powered?'SEM BARRAMENTO DALI':active.length?`ATIVAS: ${active.join(' • ')}`:'DALI-2 • 4 ENTRADAS PRONTAS';if(vlabel)vlabel.textContent=`ENTRADAS: ${[1,2,3,4].map(i=>Math.round(Number(volts[i]||0))).join(' / ')} Vca`};
    const renderUniversal=c=>{const powered=c.dataset.daliUniversalPowered==='true',states=readObj(c,'daliUniversalInputStates'),tx=c.dataset.daliUniversalTxPulse==='true',busLed=c.querySelector('[data-dali-universal-bus-led]'),txLed=c.querySelector('[data-dali-universal-tx-led]'),label=c.querySelector('[data-dali-universal-state]'),active=Object.entries(states).filter(([,v])=>v===true).map(([k])=>k);if(busLed)setStatusLed(busLed,powered);if(txLed)setPulseLed(txLed,tx);c.querySelectorAll('[data-dali-universal-input-led]').forEach(n=>{const k=String(n.getAttribute('data-dali-universal-input-led')||''),on=states[k]===true;setStatusLed(n,on)});if(label)label.textContent=!powered?'SEM BARRAMENTO DALI':active.length?`EVENTOS: ${active.join(' • ')}`:'DALI-2 • 6 ENTRADAS PRONTAS'};
    const pulse=(c,key,render)=>{c.dataset[key]='true';render(c);clearTimeout(c.__daliBinaryPulse);c.__daliBinaryPulse=setTimeout(()=>{if(c.isConnected){c.dataset[key]='false';render(c)}},300)};
    const evaluateMains=(c,states)=>{const def=registryDefinition(c)||{},beh=def.behavior||{},b=bus(c,states),m=terms(c),previous=readObj(c,'daliMainsInputStates'),next={},volts={};let changed=c.dataset.daliMainsPowered!==String(b.powered);c.dataset.daliMainsPowered=String(b.powered);for(let i=1;i<=Number(beh.channels||4);i++){const meas=measureBetween(states,m.get(`IN${i}`),m.get(beh.inputReference||'N'),'AC'),v=Number(meas?.voltage||0),on=b.powered&&meas?.type==='AC'&&v>=Number(beh.inputMinVoltage||190)&&v<=Number(beh.inputMaxVoltage||253);next[i]=on;volts[i]=v;if(Object.prototype.hasOwnProperty.call(previous,String(i))&&Boolean(previous[i])!==on){setAddress(c,i,on,states);c.dataset.daliMainsLastChannel=String(i);pulse(c,'daliMainsTxPulse',renderMains);changed=true}}writeObj(c,'daliMainsInputStates',next);writeObj(c,'daliMainsInputVoltages',volts);renderMains(c);return changed};
    const pushbuttonLike=p=>{const b=registryDefinition(p)?.behavior||{},t=String(p.dataset.type||'');return b.type==='pushbutton-no'||/botoeira-liga/.test(t)};
    const wiredButton=(input,ch)=>{const im=terms(input),ca=im.get(`C${ch}`),ib=im.get(`IN${ch}`);if(!ca||!ib)return null;for(const p of all()){if(p===input||!pushbuttonLike(p))continue;const pm=terms(p),a=pm.get('13'),b=pm.get('14');if(!a||!b)continue;if((wireOnlyConnected(ca,a)&&wireOnlyConnected(ib,b))||(wireOnlyConnected(ca,b)&&wireOnlyConnected(ib,a)))return p}return null};
    const triggerUniversal=(c,ch,states)=>{if(c.dataset.daliUniversalPowered!=='true')return;const st=readObj(c,'daliUniversalInputStates'),next=!Boolean(st[String(ch)]);st[String(ch)]=next;writeObj(c,'daliUniversalInputStates',st);c.dataset.daliUniversalLastChannel=String(ch);setAddress(c,Number(ch),next,states);pulse(c,'daliUniversalTxPulse',renderUniversal);renderUniversal(c)};
    const bindUniversal=c=>{if(!c.__techribDaliUniversalBound){c.__techribDaliUniversalBound=true;writeObj(c,'daliUniversalInputStates',{1:false,2:false,3:false,4:false,5:false,6:false});c.__techribDaliUniversalButtons=new WeakSet()}for(let i=1;i<=6;i++){const p=wiredButton(c,i);if(!p||c.__techribDaliUniversalButtons.has(p))continue;c.__techribDaliUniversalButtons.add(p);p.addEventListener('pointerdown',()=>{if(lastStates)triggerUniversal(c,i,lastStates)},true)}};
    const evaluate=states=>{lastStates=states;const baseChanged=Boolean(delegated.evaluate?.(states));let changed=baseChanged;for(const c of mainsInputs())if(evaluateMains(c,states))changed=true;for(const c of universalInputs()){const b=bus(c,states);c.dataset.daliUniversalPowered=String(b.powered);bindUniversal(c);renderUniversal(c)}return changed};
    const reset=()=>{lastStates=null;delegated.reset?.();for(const c of mainsInputs()){writeObj(c,'daliMainsInputStates',{1:false,2:false,3:false,4:false});writeObj(c,'daliMainsInputVoltages',{1:0,2:0,3:0,4:0});delete c.dataset.daliMainsTxPulse;renderMains(c)}for(const c of universalInputs()){writeObj(c,'daliUniversalInputStates',{1:false,2:false,3:false,4:false,5:false,6:false});delete c.dataset.daliUniversalTxPulse;renderUniversal(c)}};
    return Object.freeze({...delegated,evaluate,reset});
  };
  root.TechRibDaliBinaryInputRuntimeV1=Object.freeze({version:'techrib.dali-binary-input-runtime/v1',create});
  root.TechRibCurrentLoopRuntimeV1=Object.freeze({create});
})(typeof window!=='undefined'?window:globalThis);
