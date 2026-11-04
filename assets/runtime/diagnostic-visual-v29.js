/* TechRib V29 — diagnóstico visual avançado.
   Overlay opcional para bornes/potenciais, hitboxes, redes/fios, I²C e falhas. */
(function(root){
  'use strict';
  const VERSION=29;
  const esc=s=>String(s??'');
  const create=({document:doc=root.document,sheet,workbench,getWires,getElectrical}={})=>{
    if(!doc?.querySelectorAll||!doc?.createElement)throw new Error('TechRibDiagnosticVisualRuntime: document ausente');
    if(!sheet?.querySelectorAll)throw new Error('TechRibDiagnosticVisualRuntime: sheet ausente');
    if(!workbench?.dataset)throw new Error('TechRibDiagnosticVisualRuntime: workbench ausente');
    if(typeof getWires!=='function'||typeof getElectrical!=='function')throw new Error('TechRibDiagnosticVisualRuntime: dependências ausentes');
    const options={terminals:false,hitboxes:false,networks:false,i2c:false,faults:true};let enabled=false,raf=0;
    const ensureLayer=()=>{let layer=doc.querySelector('#techrib-visual-debug-layer');if(!layer){layer=doc.createElement('div');layer.id='techrib-visual-debug-layer';layer.setAttribute('aria-hidden','true');doc.body.appendChild(layer)}return layer};
    const visibleRect=rect=>rect&&rect.width>=0&&rect.height>=0&&rect.bottom>=0&&rect.right>=0&&rect.top<=root.innerHeight&&rect.left<=root.innerWidth;
    const add=(layer,cls,text,rect,{center=true,title=''}={})=>{if(!visibleRect(rect))return null;const n=doc.createElement('div');n.className=`techrib-debug-item ${cls}`;n.textContent=esc(text);if(title)n.title=title;const x=center?rect.left+rect.width/2:rect.left,y=center?rect.top+rect.height/2:rect.top;n.style.left=`${Math.round(x)}px`;n.style.top=`${Math.round(y)}px`;layer.appendChild(n);return n};
    const addBox=(layer,rect,text='')=>{if(!visibleRect(rect)||rect.width<2||rect.height<2)return;const n=doc.createElement('div');n.className='techrib-debug-hitbox';n.style.left=`${Math.round(rect.left)}px`;n.style.top=`${Math.round(rect.top)}px`;n.style.width=`${Math.round(rect.width)}px`;n.style.height=`${Math.round(rect.height)}px`;if(text)n.dataset.label=text;layer.appendChild(n)};
    const stateLabel=states=>{const list=(states||[]).filter(Boolean);if(!list.length)return'0 V';const parts=[];for(const s of list){const type=String(s.type||'').toUpperCase();if(type==='AC'){const p=s.phase||s.conductor||'AC';parts.push(s.reference?`${p} 0V`:`${p} ${Number(s.voltage||0).toFixed(Number(s.voltage||0)%1?1:0)}Vac`)}else if(type==='DC'){const p=s.reference?'−':(s.polarity||'+');parts.push(`${p}${Number(s.voltage||0).toFixed(Number(s.voltage||0)%1?1:0)}Vdc`)}else parts.push(type||'?')}return[...new Set(parts)].join(' / ')};
    const terminalName=t=>t?.dataset?.terminalName||t?.dataset?.terminal||'?';
    const isI2cTerminal=t=>{const text=`${terminalName(t)} ${t?.dataset?.terminalFunction||''} ${t?.dataset?.terminalDomain||''}`.toUpperCase();return /\b(SDA|SCL)\b|I2C|I²C/.test(text)};
    const refresh=()=>{
      raf=0;const layer=ensureLayer();layer.replaceChildren();layer.classList.toggle('active',enabled);if(!enabled)return;
      const electrical=getElectrical()||{},wires=getWires()||[];
      if(options.hitboxes)[...sheet.querySelectorAll('.placed-component')].slice(0,250).forEach(c=>addBox(layer,c.getBoundingClientRect(),c.dataset.tag||c.querySelector?.('small')?.textContent?.trim()||c.dataset.type||''));
      if(options.terminals){[...sheet.querySelectorAll('[data-terminal]')].slice(0,500).forEach(t=>{const r=t.getBoundingClientRect();const states=t.electricalState||[];add(layer,'terminal',`${terminalName(t)} • ${stateLabel(states)}`,r,{title:`${terminalName(t)} — ${stateLabel(states)}`})})}
      if(options.networks||options.faults){wires.slice(0,500).forEach(w=>{const r=w.path?.getBoundingClientRect?.();if(!r||!visibleRect(r))return;const fault=w.fault;const states=w.electricalState||[];if(options.faults&&fault)add(layer,'fault',`${w.number||w.identification||'FIO'} • ${fault.title}`,r,{title:fault.cause||fault.title});else if(options.networks)add(layer,'network',`${w.number||w.identification||'FIO'} • ${stateLabel(states)}`,r)})}
      if(options.i2c){[...sheet.querySelectorAll('.placed-component')].slice(0,250).forEach(c=>{const terms=[...c.querySelectorAll('[data-terminal]')],i2c=terms.filter(isI2cTerminal);const addr=c.dataset.i2cAddress||'';if(!i2c.length&&!addr)return;const r=c.getBoundingClientRect(),tag=c.dataset.tag||c.querySelector?.('small')?.textContent?.trim()||c.dataset.type||'I²C';add(layer,'i2c',`I²C ${tag}${addr?` • ${addr}`:''}`,{left:r.left,top:r.top,width:r.width,height:1},{title:i2c.length?`Bornes: ${i2c.map(terminalName).join(', ')}`:'Dispositivo I²C'})})}
      workbench.dataset.visualDebug=enabled?'true':'false';workbench.dataset.visualDebugOptions=Object.entries(options).filter(([,v])=>v).map(([k])=>k).join(',');
    };
    const schedule=()=>{if(raf)return;raf=root.requestAnimationFrame?root.requestAnimationFrame(refresh):setTimeout(refresh,0)};
    const setEnabled=value=>{enabled=Boolean(value);schedule();return enabled};
    const setOption=(name,value)=>{if(!(name in options))return false;options[name]=Boolean(value);if(options[name])enabled=true;schedule();return options[name]};
    const clear=()=>{enabled=false;const layer=ensureLayer();layer.replaceChildren();layer.classList.remove('active');workbench.dataset.visualDebug='false'};
    const snapshot=()=>Object.freeze({enabled,options:Object.freeze({...options}),faultCount:(getWires()||[]).filter(w=>w?.fault).length,simulationActive:Boolean(getElectrical()?.simulationActive)});
    root.addEventListener?.('resize',schedule,{passive:true});root.addEventListener?.('scroll',schedule,{passive:true,capture:true});doc.addEventListener?.('techrib:simulation-mode',schedule);doc.addEventListener?.('techrib:project-loaded',schedule);
    const api=Object.freeze({VERSION,setEnabled,setOption,refresh:schedule,clear,snapshot,get enabled(){return enabled},get options(){return Object.freeze({...options})}});
    return api;
  };
  root.TechRibDiagnosticVisualRuntime=Object.freeze({VERSION,create});
})(typeof window!=='undefined'?window:globalThis);
