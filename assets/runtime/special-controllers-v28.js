(function(root){
  'use strict';

  const VERSION=28;
  const TECHRIB32_TYPE='techrib-placa-32-reles-v2';
  const TECHRIB32_CHANNELS=32;
  const TECHRIB32_VISIBLE_CHANNELS=10;

  const readObject=(component,key,fallback={})=>{
    try{
      const value=JSON.parse(component?.dataset?.[key]||'');
      return value&&typeof value==='object'&&!Array.isArray(value)?value:fallback;
    }catch(_){return fallback}
  };
  const writeObject=(component,key,value)=>{if(component?.dataset)component.dataset[key]=JSON.stringify(value||{})};
  const defaultModes=()=>Object.fromEntries(Array.from({length:TECHRIB32_CHANNELS},(_,index)=>[String(index+1),'momentary']));
  const normalizeModes=component=>{
    const modes={...defaultModes(),...readObject(component,'techrib32Modes',{})};
    for(let i=1;i<=TECHRIB32_CHANNELS;i++)modes[i]=modes[i]==='toggle'?'toggle':'momentary';
    writeObject(component,'techrib32Modes',modes);
    return modes;
  };

  function create(options={}){
    const historyCapture=typeof options.historyCapture==='function'?options.historyCapture:()=>{};
    const scheduleAutosave=typeof options.scheduleAutosave==='function'?options.scheduleAutosave:()=>{};
    const scheduleElectricalRecalc=typeof options.scheduleElectricalRecalc==='function'?options.scheduleElectricalRecalc:()=>{};
    const notify=typeof options.notify==='function'?options.notify:()=>{};
    const initializers=new Map();

    const refreshTechRib32=component=>{
      if(!component||component.dataset.type!==TECHRIB32_TYPE)return false;
      const panel=component.querySelector?.('[data-techrib32-controller]');if(!panel)return false;
      const modes=normalizeModes(component),states=readObject(component,'relayChannels',{}),physical=readObject(component,'techrib32PhysicalInputs',{}),latched=readObject(component,'techrib32Latched',{}),powered=component.dataset.logicPowered==='true';
      panel.classList.toggle('is-powered',powered);
      const powerLabel=panel.querySelector('[data-techrib32-power]');if(powerLabel)powerLabel.textContent=powered?'5V OK':'SEM 5V';
      panel.querySelectorAll('[data-techrib32-cell]').forEach(cell=>{
        const channel=String(cell.dataset.techrib32Cell),on=states[channel]===true,input=physical[channel]===true,mode=modes[channel]||'momentary';
        cell.classList.toggle('is-on',on);cell.classList.toggle('is-input-active',input);cell.classList.toggle('is-latched',mode==='toggle'&&latched[channel]===true);
        const state=cell.querySelector('[data-techrib32-state]');if(state)state.textContent=on?'ON':'OFF';
        const channelButton=cell.querySelector('[data-techrib32-channel]');if(channelButton)channelButton.setAttribute('aria-pressed',on?'true':'false');
        const modeButton=cell.querySelector('[data-techrib32-mode]');if(modeButton){modeButton.textContent=mode==='toggle'?'TRV':'MOM';modeButton.setAttribute('aria-pressed',mode==='toggle'?'true':'false');modeButton.title=mode==='toggle'?`Canal ${channel}: travado / toggle`:`Canal ${channel}: momentâneo`}
      });
      return true;
    };

    const applyTechRib32Position=component=>{
      const panel=component?.querySelector?.('[data-techrib32-controller]');if(!panel)return false;
      const x=Number(component.dataset.techrib32ControllerX),y=Number(component.dataset.techrib32ControllerY);
      if(Number.isFinite(x)&&Number.isFinite(y)){
        panel.style.setProperty('left',`${x}px`,'important');panel.style.setProperty('top',`${y}px`,'important');panel.style.setProperty('transform','none','important');
      }
      const grid=panel.querySelector('[data-techrib32-scroll]');
      const scrollTop=Number(component.dataset.techrib32ScrollTop||0);
      if(grid&&Number.isFinite(scrollTop)&&scrollTop>=0)grid.scrollTop=scrollTop;
      return true;
    };

    const initializeTechRib32=component=>{
      if(!component||component.dataset.type!==TECHRIB32_TYPE)return false;
      component.dataset.relayActiveLow='true';normalizeModes(component);
      if(!component.dataset.techrib32Latched)writeObject(component,'techrib32Latched',{});
      if(!component.dataset.techrib32ManualPressed)writeObject(component,'techrib32ManualPressed',{});
      if(!component.dataset.techrib32PreviousInputs)writeObject(component,'techrib32PreviousInputs',{});
      if(!component.dataset.techrib32PhysicalInputs)writeObject(component,'techrib32PhysicalInputs',{});
      let panel=component.querySelector?.('[data-techrib32-controller]');
      if(!panel){
        panel=root.document.createElement('div');panel.className='techrib32-controller';panel.dataset.techrib32Controller='';panel.dataset.controllerRuntime='v28';
        panel.innerHTML=`<div class="techrib32-head" data-techrib32-drag-handle title="Arraste por aqui para mover o controlador"><div class="techrib32-title"><b>☷ ESP32 • 32R</b><small>4× MCP23017 • 0x20–0x23 • ARRASTE O CABEÇALHO</small></div><span data-techrib32-power>SEM 5V</span><button type="button" data-techrib32-all-off title="Desligar todos os canais travados">OFF ALL</button></div><div class="techrib32-grid" data-techrib32-scroll role="region" tabindex="0" aria-label="Canais 1 a 32; dez canais visíveis por vez"></div><div class="techrib32-help">${TECHRIB32_VISIBLE_CHANNELS} canais visíveis • role para 11–32 • MOM: mantém enquanto pressiona • TRV: toque liga/desliga</div>`;
        const grid=panel.querySelector('.techrib32-grid');
        for(let i=1;i<=TECHRIB32_CHANNELS;i++){
          const cell=root.document.createElement('div');cell.className='techrib32-cell';cell.dataset.techrib32Cell=String(i);
          cell.innerHTML=`<button type="button" class="techrib32-channel" data-techrib32-channel="${i}" title="Acionamento manual do canal ${i}" aria-pressed="false"><i></i><b>CANAL ${String(i).padStart(2,'0')}</b><span data-techrib32-state>OFF</span></button><button type="button" class="techrib32-mode" data-techrib32-mode="${i}" title="Alternar Momentâneo / Travado" aria-pressed="false">MOM</button>`;
          grid.appendChild(cell);
        }
        component.insertBefore(panel,component.querySelector(':scope>small'));
        panel.addEventListener('pointerdown',event=>event.stopPropagation());panel.addEventListener('dblclick',event=>event.stopPropagation());
        grid.addEventListener('scroll',()=>{component.dataset.techrib32ScrollTop=String(Math.round(grid.scrollTop||0))},{passive:true});
        const manualPress=(channel,on)=>{const manual=readObject(component,'techrib32ManualPressed',{});manual[String(channel)]=Boolean(on);writeObject(component,'techrib32ManualPressed',manual);refreshTechRib32(component);scheduleElectricalRecalc()};
        const toggleLatch=channel=>{const latched=readObject(component,'techrib32Latched',{}),key=String(channel);latched[key]=!Boolean(latched[key]);writeObject(component,'techrib32Latched',latched);historyCapture();scheduleAutosave();refreshTechRib32(component);scheduleElectricalRecalc()};
        panel.querySelectorAll('[data-techrib32-channel]').forEach(button=>{
          button.addEventListener('pointerdown',event=>{event.preventDefault();event.stopPropagation();const channel=button.dataset.techrib32Channel,modes=normalizeModes(component);if(modes[channel]==='toggle'){toggleLatch(channel);return}manualPress(channel,true);try{button.setPointerCapture(event.pointerId)}catch(_){}});
          const release=event=>{event?.stopPropagation?.();const channel=button.dataset.techrib32Channel,modes=normalizeModes(component);if(modes[channel]==='momentary')manualPress(channel,false)};
          button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);button.addEventListener('lostpointercapture',release);
        });
        panel.querySelectorAll('[data-techrib32-mode]').forEach(button=>button.addEventListener('click',event=>{
          event.preventDefault();event.stopPropagation();const channel=String(button.dataset.techrib32Mode),modes=normalizeModes(component),next=modes[channel]==='toggle'?'momentary':'toggle';modes[channel]=next;writeObject(component,'techrib32Modes',modes);
          const manual=readObject(component,'techrib32ManualPressed',{}),latched=readObject(component,'techrib32Latched',{});manual[channel]=false;if(next==='momentary')latched[channel]=false;writeObject(component,'techrib32ManualPressed',manual);writeObject(component,'techrib32Latched',latched);
          historyCapture();scheduleAutosave();refreshTechRib32(component);scheduleElectricalRecalc();notify(`Canal ${channel}: ${next==='toggle'?'TRAVADO':'MOMENTÂNEO'}`);
        }));
        panel.querySelector('[data-techrib32-all-off]')?.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();writeObject(component,'techrib32Latched',{});writeObject(component,'techrib32ManualPressed',{});historyCapture();scheduleAutosave();refreshTechRib32(component);scheduleElectricalRecalc();notify('Placa 32 relés: canais travados desligados')});
      }
      applyTechRib32Position(component);
      if(panel.dataset.techrib32DragBound!=='true'){
        panel.dataset.techrib32DragBound='true';
        const handle=panel.querySelector('[data-techrib32-drag-handle]');
        handle?.addEventListener('pointerdown',event=>{
          if(event.button!==0||event.target.closest('button'))return;
          event.preventDefault();event.stopPropagation();
          const compRect=component.getBoundingClientRect(),panelRect=panel.getBoundingClientRect();
          const scaleX=component.offsetWidth?compRect.width/component.offsetWidth:1,scaleY=component.offsetHeight?compRect.height/component.offsetHeight:scaleX;
          const startLeft=(panelRect.left-compRect.left)/(scaleX||1),startTop=(panelRect.top-compRect.top)/(scaleY||1),startX=event.clientX,startY=event.clientY;
          handle.classList.add('is-dragging');try{handle.setPointerCapture(event.pointerId)}catch(_){}
          const move=moveEvent=>{if(moveEvent.pointerId!==event.pointerId)return;const left=startLeft+(moveEvent.clientX-startX)/(scaleX||1),top=startTop+(moveEvent.clientY-startY)/(scaleY||1);panel.style.setProperty('left',`${Math.round(left)}px`,'important');panel.style.setProperty('top',`${Math.round(top)}px`,'important');panel.style.setProperty('transform','none','important');component.dataset.techrib32ControllerX=String(Math.round(left));component.dataset.techrib32ControllerY=String(Math.round(top))};
          const finish=upEvent=>{if(upEvent.pointerId!==event.pointerId)return;handle.classList.remove('is-dragging');handle.removeEventListener('pointermove',move);handle.removeEventListener('pointerup',finish);handle.removeEventListener('pointercancel',finish);try{handle.releasePointerCapture(event.pointerId)}catch(_){}historyCapture();scheduleAutosave()};
          handle.addEventListener('pointermove',move);handle.addEventListener('pointerup',finish);handle.addEventListener('pointercancel',finish);
        });
      }
      component.techribApply32ControllerPosition=()=>applyTechRib32Position(component);
      component.techribRefresh32Controller=()=>refreshTechRib32(component);
      refreshTechRib32(component);
      return true;
    };

    initializers.set(TECHRIB32_TYPE,initializeTechRib32);
    const register=(type,initializer)=>{if(type&&typeof initializer==='function')initializers.set(String(type),initializer);return api};
    const initialize=component=>{const fn=initializers.get(String(component?.dataset?.type||''));return fn?fn(component):false};
    const refresh=component=>component?.dataset?.type===TECHRIB32_TYPE?refreshTechRib32(component):false;
    const applySavedPosition=component=>component?.dataset?.type===TECHRIB32_TYPE?applyTechRib32Position(component):false;
    const api={version:VERSION,capabilities:Object.freeze({techrib32:true,draggableController:true,scrollable32Channels:true,visibleChannels:TECHRIB32_VISIBLE_CHANNELS}),register,initialize,refresh,applySavedPosition};
    return Object.freeze(api);
  }

  root.TechRibSpecialControllersRuntime=Object.freeze({VERSION,TECHRIB32_TYPE,TECHRIB32_CHANNELS,TECHRIB32_VISIBLE_CHANNELS,create});
})(typeof window!=='undefined'?window:globalThis);
