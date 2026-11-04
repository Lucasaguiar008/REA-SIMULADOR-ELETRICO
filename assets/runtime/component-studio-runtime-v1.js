/* TechRib Component Studio V1 — estado funcional -> visual declarativo. */
(function(root){
  'use strict';
  const VERSION=1;
  const asConfig=(component,registryDefinition)=>{
    if(component?.techribEditorConfig)return component.techribEditorConfig;
    const definition=registryDefinition(component)||{};
    let config=definition.editorConfig||null;
    if(!config&&component?.dataset?.editorConfig){try{config=JSON.parse(component.dataset.editorConfig)}catch{config=null}}
    if(config&&typeof config==='object'){component.techribEditorConfig=config;return config}
    return null;
  };
  const target=(component,id)=>id?component.querySelector(`#${CSS.escape(String(id))}`):null;
  const functionalState=component=>{
    if(component.dataset.editorState)return component.dataset.editorState;
    if(component.dataset.validationError==='true'||component.dataset.fault==='true')return'fault';
    if(component.dataset.electricalRunning==='true'||component.dataset.running==='true')return'running';
    if(component.dataset.coilEnergized==='true')return'energized';
    if(component.dataset.energized==='true'||component.dataset.powered==='true'||component.dataset.logicPowered==='true'||component.dataset.relayEnergized==='true')return'on';
    return component.dataset.state||'off';
  };
  const setAction=(element,action)=>{
    if(!element||!action)return;
    const property=String(action.property||''),value=String(action.value??'');
    if(property==='text')element.textContent=value;
    else if(property==='display')element.style.display=value;
    else if(property==='visibility')element.style.visibility=value;
    else if(['transform','fill','stroke','opacity'].includes(property))element.setAttribute(property,value);
  };
  const keyframes=animation=>{
    const from=animation.from??'',to=animation.to??'',pivot=`${Number(animation.pivotX||0)}px ${Number(animation.pivotY||0)}px`;
    const angle=(value,fallback)=>{const match=String(value).match(/-?\d+(?:\.\d+)?/);return match?Number(match[0]):fallback};
    if(animation.type==='rotate')return[{transformOrigin:pivot,transform:`rotate(${angle(from,0)}deg)`},{transformOrigin:pivot,transform:`rotate(${angle(to,360)}deg)`}];
    if(animation.type==='move'||animation.type==='position'||animation.type==='compound')return[{transform:String(from||'translate(0px,0px)')},{transform:String(to||'translate(0px,0px)')}];
    if(animation.type==='scale')return[{transformOrigin:pivot,transform:`scale(${Number(from)||1})`},{transformOrigin:pivot,transform:`scale(${Number(to)||1})`}];
    if(animation.type==='color')return[{fill:String(from||'currentColor')},{fill:String(to||'currentColor')}];
    if(animation.type==='opacity'||animation.type==='show'||animation.type==='hide')return[{opacity:String(from!==''?from:(animation.type==='show'?0:1))},{opacity:String(to!==''?to:(animation.type==='hide'?0:1))}];
    if(animation.type==='blink')return[{opacity:'1'},{opacity:'.15'},{opacity:'1'}];
    return null;
  };
  function create(options={}){
    const sheet=options.sheet,registryDefinition=typeof options.registryDefinition==='function'?options.registryDefinition:()=>null;
    const scheduleElectricalRecalc=typeof options.scheduleElectricalRecalc==='function'?options.scheduleElectricalRecalc:()=>{};
    const animationHandles=new WeakMap();
    const stopAnimation=(element,index)=>{const map=animationHandles.get(element);map?.get(index)?.cancel?.();map?.delete(index)};
    const playAnimation=(element,animation,index,rate=1)=>{
      if(!element?.animate)return;
      let map=animationHandles.get(element);if(!map){map=new Map();animationHandles.set(element,map)}
      if(map.has(index))return;
      const frames=keyframes(animation);if(!frames)return;
      const handle=element.animate(frames,{duration:Math.max(20,Number(animation.duration)||300),easing:animation.easing||'ease',iterations:animation.repeat?Infinity:1,direction:animation.direction||'normal',fill:'both'});
      handle.playbackRate=Math.max(.1,Number(rate)||1);map.set(index,handle);
    };
    const triggerActive=(component,state,trigger)=>{
      trigger=String(trigger||'on');
      if(trigger===state)return true;
      if(trigger==='on')return['on','energized','running','closed','pressed'].includes(state);
      if(trigger==='off')return['off','stopped','open','released'].includes(state);
      if(trigger==='energized')return component.dataset.coilEnergized==='true'||component.dataset.energized==='true';
      if(trigger==='running')return component.dataset.electricalRunning==='true';
      if(trigger==='fault')return state==='fault'||component.dataset.validationError==='true';
      return component.dataset[trigger]==='true'||component.dataset[trigger]==='1';
    };
    const render=(component,{force=false,previewState=null,rate=1}={})=>{
      const config=asConfig(component,registryDefinition);if(!config)return null;
      const state=previewState||functionalState(component),previous=component.dataset.studioVisualState||'';
      if(force||previous!==state){
        const stateDef=(config.states||[]).find(item=>item.name===state)||(config.states||[]).find(item=>item.name===(['energized','running'].includes(state)?'on':state));
        (stateDef?.actions||[]).forEach(action=>setAction(target(component,action.elementId),action));
        component.dataset.studioVisualState=state;
      }
      (config.animations||[]).forEach((animation,index)=>{
        const element=target(component,animation.elementId);if(!element)return;
        if(animation.type==='text'&&triggerActive(component,state,animation.trigger)){element.textContent=String(animation.to??'');return}
        if(triggerActive(component,state,animation.trigger))playAnimation(element,animation,index,rate);else stopAnimation(element,index);
      });
      return state;
    };
    const setState=(component,state)=>{component.dataset.editorState=String(state||'off');render(component,{force:true});scheduleElectricalRecalc();component.dispatchEvent(new CustomEvent('techrib:component-state',{bubbles:true,detail:{state:component.dataset.editorState}}))};
    const bind=(component)=>{
      if(!component||component.dataset.studioBound==='true')return;
      const config=asConfig(component,registryDefinition);if(!config)return;
      component.dataset.studioBound='true';
      (config.interactions||[]).forEach(interaction=>{
        const element=target(component,interaction.elementId);if(!element)return;
        element.style.pointerEvents='all';element.style.cursor='pointer';
        const apply=()=>{const current=functionalState(component),next=interaction.action==='toggle-state'&&current===interaction.state?(interaction.resetState||'off'):(interaction.state||'on');setState(component,next)};
        if(interaction.action==='momentary'){
          element.addEventListener('pointerdown',event=>{event.stopPropagation();setState(component,interaction.state||'on')});
          element.addEventListener('pointerup',event=>{event.stopPropagation();setState(component,interaction.resetState||'off')});
          element.addEventListener('pointercancel',()=>setState(component,interaction.resetState||'off'));
        }else element.addEventListener(interaction.event||'click',event=>{event.stopPropagation();apply()});
      });
      render(component,{force:true});
    };
    const evaluateAll=(states,{coilHasSupply=null}={})=>{let changed=false;sheet?.querySelectorAll?.('.placed-component').forEach(component=>{bind(component);const config=asConfig(component,registryDefinition);if(config&&(config.contacts||[]).some(contact=>['coil','bobina'].includes(String(contact.dependency||contact.type||'').toLowerCase()))&&typeof coilHasSupply==='function'){const energized=Boolean(coilHasSupply(component,states)),before=component.dataset.coilEnergized==='true';component.dataset.coilEnergized=String(energized);if(before!==energized)changed=true}render(component)});if(changed)scheduleElectricalRecalc();return states};
    const preview=(component,state,rate=1)=>render(component,{force:true,previewState:state,rate});
    const observer=sheet&&root.MutationObserver?new MutationObserver(records=>records.forEach(record=>record.addedNodes.forEach(node=>{if(node?.matches?.('.placed-component'))bind(node);node?.querySelectorAll?.('.placed-component').forEach(bind)}))):null;
    const observe=()=>{sheet?.querySelectorAll?.('.placed-component').forEach(bind);observer?.observe(sheet,{childList:true,subtree:true})};
    return Object.freeze({version:VERSION,config:component=>asConfig(component,registryDefinition),functionalState,bind,render,evaluateAll,setState,preview,observe});
  }
  root.TechRibComponentStudioRuntimeV1=Object.freeze({VERSION,create});
})(typeof window!=='undefined'?window:globalThis);
