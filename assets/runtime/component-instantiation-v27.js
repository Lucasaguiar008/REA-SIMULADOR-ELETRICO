(function(root){
  'use strict';

  const VERSION=27;
  const DEFAULT_COILS=Object.freeze({
    contator:[220,'AC'],'contator-2':[220,'AC'],'contator-4p':[220,'AC'],'contator-12vac':[12,'AC'],'contator-24vac':[24,'AC'],
    'rele-auxiliar':[220,'AC'],temporizador:[220,'AC'],'rele-estrela-triangulo':[220,'AC'],'temporizador-estrela-triangulo':[220,'AC'],'rele-biestavel-impulso':[220,'AC']
  });

  function create(options={}){
    const sheet=options.sheet;
    const empty=options.empty||null;
    const nextComponentTag=typeof options.nextComponentTag==='function'?options.nextComponentTag:type=>String(type||'').toUpperCase();
    const applyRegistryProfile=typeof options.applyRegistryProfile==='function'?options.applyRegistryProfile:()=>null;
    const prepareSvg=typeof options.prepareSvg==='function'?options.prepareSvg:()=>{};
    const cloneSvg=typeof options.cloneSvg==='function'?options.cloneSvg:svg=>svg?.cloneNode?.(true)||null;
    const sizingCallbacks=Array.isArray(options.sizingCallbacks)?options.sizingCallbacks.filter(fn=>typeof fn==='function'):[];
    const applyComponentTerminalMetadata=typeof options.applyComponentTerminalMetadata==='function'?options.applyComponentTerminalMetadata:()=>{};
    const electricalFamilyOf=typeof options.electricalFamilyOf==='function'?options.electricalFamilyOf:()=>'';
    const applyComponentMeta=typeof options.applyComponentMeta==='function'?options.applyComponentMeta:()=>{};
    const earthPrepare=typeof options.earthPrepare==='function'?options.earthPrepare:()=>{};
    const prepareHitbox=typeof options.prepareHitbox==='function'?options.prepareHitbox:()=>{};
    const select=typeof options.select==='function'?options.select:()=>{};
    const enableMove=typeof options.enableMove==='function'?options.enableMove:()=>{};
    const now=typeof options.now==='function'?options.now:()=>Date.now();
    const defaultCoils=options.defaultCoils||DEFAULT_COILS;

    const createBase=(source,x,y,{instanceIndex=1}={})=>{
      if(!source?.dataset?.component||!sheet)return null;
      const type=source.dataset.component;
      const node=root.document.createElement('div');
      node.className='placed-component';
      node.dataset.type=type;
      if(source.dataset.deviceMode)node.dataset.deviceMode=source.dataset.deviceMode;
      node.style.left=`${Math.max(30,Math.round(Number(x||0)/10)*10-52)}px`;
      node.style.top=`${Math.max(30,Math.round(Number(y||0)/10)*10-50)}px`;
      const sourceSvg=source.querySelector?.('svg');
      const svgClone=sourceSvg?cloneSvg(sourceSvg):null;
      const code=root.document.createElement('small');
      code.textContent=nextComponentTag(type);
      node.dataset.componentId=`${type}-${now().toString(36)}-${instanceIndex}`;
      node.dataset.tag=code.textContent;
      node.dataset.label=source.dataset.label||type;
      if(source.dataset.editorConfig){node.dataset.editorConfig=source.dataset.editorConfig;try{node.techribEditorConfig=JSON.parse(source.dataset.editorConfig)}catch(_){node.techribEditorConfig=null}}
      if(source.dataset.contactType)node.dataset.contactType=source.dataset.contactType;
      const registryProfile=applyRegistryProfile(node,type);
      const declaredCoil=registryProfile?.behavior?.coil||null;
      const coil=defaultCoils[type]||(declaredCoil?[Number(declaredCoil.ratedVoltage||220),String(declaredCoil.supply||'AC').toUpperCase()]:null);
      if(coil){const [ratedVoltage,coilType]=coil;node.electrical={coil:{ratedVoltage,type:coilType},state:'OFF'};node.dataset.coilRatedVoltage=String(ratedVoltage);node.dataset.coilType=coilType==='DC'?'DC':'AC';node.dataset.coilEnergized='false';if(type.startsWith('contator')||registryProfile?.behavior?.type==='contactor')node.dataset.contactorState='open'}
      if(svgClone){prepareSvg(svgClone,node,source);node.appendChild(svgClone)}
      sizingCallbacks.forEach(callback=>callback(node,registryProfile,type,source));
      node.querySelectorAll('[data-terminal]').forEach((terminal,index)=>{terminal.dataset.terminalId=`${node.dataset.componentId}:${terminal.dataset.terminal||'T'}:${index+1}`});
      applyComponentTerminalMetadata(node);
      if(type!=='functional-area-object')node.dataset.electricalFamily=electricalFamilyOf(node)||'';
      applyComponentMeta(node,type,registryProfile);
      earthPrepare(node,registryProfile);
      node.append(code);
      if(source.dataset.signalColor){node.dataset.signalColor=source.dataset.signalColor;if(source.dataset.signalMode)node.dataset.signalMode=source.dataset.signalMode;['--signal-dark','--signal-off','--signal-on','--signal-edge','--signal-ring','--signal-glow'].forEach(property=>node.style.setProperty(property,source.style.getPropertyValue(property)))}
      sheet.appendChild(node);
      empty?.classList?.add?.('hidden');
      prepareHitbox(node);
      select(node);
      enableMove(node);
      return{node,registryProfile,type,code,svgClone};
    };

    return Object.freeze({version:VERSION,createBase});
  }

  root.TechRibComponentInstantiationRuntime=Object.freeze({VERSION,DEFAULT_COILS,create});
})(typeof window!=='undefined'?window:globalThis);
