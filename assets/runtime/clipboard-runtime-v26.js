(function(root){
  'use strict';

  const VERSION=26;
  const DEFAULT_KEY='techrib.componentClipboard.v26';
  const LEGACY_KEYS=Object.freeze(['techrib.componentClipboard.v46']);
  const fallbackEscape=value=>String(value||'').replace(/[^a-zA-Z0-9_-]/g,'\\$&');
  const numeric=value=>{const parsed=parseFloat(String(value??''));return Number.isFinite(parsed)?parsed:0};

  function create(options={}){
    const storage=options.storage||root.localStorage;
    const storageKey=options.storageKey||DEFAULT_KEY;
    const legacyKeys=Array.isArray(options.legacyKeys)?options.legacyKeys:LEGACY_KEYS;
    const schema=options.projectSchema||null;
    const registryDefinition=typeof options.registryDefinition==='function'?options.registryDefinition:()=>null;
    const selectedComponents=typeof options.selectedComponents==='function'?options.selectedComponents:()=>[];
    const notify=typeof options.notify==='function'?options.notify:()=>{};
    const select=typeof options.select==='function'?options.select:()=>{};
    const setSelected=typeof options.setSelected==='function'?options.setSelected:()=>{};
    const createComponent=typeof options.createComponent==='function'?options.createComponent:()=>null;
    const sourceForType=typeof options.sourceForType==='function'?options.sourceForType:()=>null;
    const buildEmbeddedSource=typeof options.buildEmbeddedSource==='function'?options.buildEmbeddedSource:record=>{
      if(!record?.svg||!root.document?.createElement)return null;
      const source=root.document.createElement('button');
      source.dataset.component=record.type;
      source.dataset.label=record.label||record.type;
      source.innerHTML=record.svg;
      return source;
    };
    const refreshComponent=typeof options.refreshComponent==='function'?options.refreshComponent:()=>{};
    const restoreSpecialNode=typeof options.restoreSpecialNode==='function'?options.restoreSpecialNode:()=>{};
    const nextComponentTag=typeof options.nextComponentTag==='function'?options.nextComponentTag:()=>'';
    const redrawWires=typeof options.redrawWires==='function'?options.redrawWires:()=>{};
    const historyCapture=typeof options.historyCapture==='function'?options.historyCapture:()=>{};
    const refreshPropertiesPanel=typeof options.refreshPropertiesPanel==='function'?options.refreshPropertiesPanel:()=>{};
    const removeSelected=typeof options.removeSelected==='function'?options.removeSelected:()=>{};
    const rootDocument=options.root||root.document;
    const escapeSelector=root.CSS?.escape||fallbackEscape;

    const extraDropFor=node=>{
      const definition=registryDefinition(node)||{};
      return Array.isArray(definition?.persistence?.datasetDrop)?definition.persistence.datasetDrop:[];
    };

    const persistentDataset=node=>{
      const raw={...(node?.dataset||{})};
      if(schema?.serializeDataset)return schema.serializeDataset(raw,extraDropFor(node));
      delete raw.componentId;
      return raw;
    };

    const persistentClasses=node=>{
      if(schema?.serializeClasses)return schema.serializeClasses(node?.classList||[]);
      return Array.from(node?.classList||[]).filter(name=>!['selected','multi-selected'].includes(name));
    };

    const cloneRecord=node=>{
      const official=schema?.isOfficial?schema.isOfficial(node):Boolean(registryDefinition(node));
      const record={
        version:VERSION,
        type:node?.dataset?.type||'',
        label:node?.dataset?.label||node?.dataset?.type||'',
        left:numeric(node?.style?.left),
        top:numeric(node?.style?.top),
        dataset:persistentDataset(node),
        classes:persistentClasses(node),
        visualSource:official?'registry':'embedded'
      };
      if(!official)record.svg=node?.querySelector?.('svg')?.outerHTML||'';
      return record;
    };

    const write=data=>{
      if(!storage?.setItem)return false;
      storage.setItem(storageKey,JSON.stringify(Array.isArray(data)?data:[]));
      return true;
    };

    const parse=text=>{
      try{const value=JSON.parse(String(text||'[]'));return Array.isArray(value)?value:[]}catch(_){return[]}
    };

    const sanitizeLegacyRecord=record=>{
      if(!record||typeof record!=='object')return null;
      const type=String(record.type||'');
      if(!type)return null;
      const official=Boolean(registryDefinition(type));
      const definition=registryDefinition(type)||{};
      const extraDrop=Array.isArray(definition?.persistence?.datasetDrop)?definition.persistence.datasetDrop:[];
      const dataset=schema?.serializeDataset?schema.serializeDataset(record.dataset||{},extraDrop):{...(record.dataset||{})};
      delete dataset.componentId;
      const classes=schema?.serializeClasses?schema.serializeClasses(record.classes||[]):Array.from(record.classes||[]).filter(name=>!['selected','multi-selected'].includes(name));
      const clean={
        version:VERSION,
        type,
        label:String(record.label||type),
        left:numeric(record.left),
        top:numeric(record.top),
        dataset,
        classes,
        visualSource:official?'registry':(record.visualSource||'embedded')
      };
      if(!official&&record.svg)clean.svg=String(record.svg);
      return clean;
    };

    const read=()=>{
      if(!storage?.getItem)return[];
      let data=parse(storage.getItem(storageKey));
      if(data.length)return data.map(sanitizeLegacyRecord).filter(Boolean);
      for(const key of legacyKeys){
        data=parse(storage.getItem(key));
        if(!data.length)continue;
        const migrated=data.map(sanitizeLegacyRecord).filter(Boolean);
        if(migrated.length)write(migrated);
        return migrated;
      }
      return[];
    };

    const copy=()=>{
      const nodes=selectedComponents();
      if(!nodes.length){notify('Selecione um componente');return[]}
      const data=nodes.map(cloneRecord);
      write(data);
      notify(`${data.length} componente(s) copiado(s)`);
      return data;
    };

    const resolveSource=async record=>{
      const source=await sourceForType(record.type);
      if(source)return source;
      if(record.svg)return buildEmbeddedSource(record);
      // Compatibilidade com um registry que tenha sido carregado após a cópia.
      if(rootDocument?.querySelector){
        const direct=rootDocument.querySelector(`[data-component="${escapeSelector(record.type)}"]`);
        if(direct)return direct;
      }
      return null;
    };

    const paste=async()=>{
      const data=read();
      if(!data.length){notify('Área de transferência vazia');return[]}
      select(null);
      const created=[];
      for(let index=0;index<data.length;index++){
        const record=data[index];
        const source=await resolveSource(record);
        if(!source)continue;
        if(record.type==='functional-area-object')source.dataset.deferHistory='true';
        const node=createComponent(source,record.left+82,record.top+82);
        if(!node)continue;
        Object.entries(record.dataset||{}).forEach(([key,value])=>{
          if(!['componentId','tag','type','label'].includes(key))node.dataset[key]=value;
        });
        node.techribRefresh32Controller?.();
        refreshComponent(node);
        node.techribApplyLogicPanelPosition?.();
        node.techribApply32ControllerPosition?.();
        const classes=(record.classes||[]).filter(name=>!['placed-component','selected','multi-selected'].includes(name));
        node.className='placed-component'+(classes.length?' '+classes.join(' '):'');
        node.style.left=`${record.left+40+index*4}px`;
        node.style.top=`${record.top+40+index*4}px`;
        node.dataset.tag=record.type==='plaque-object'||record.type==='text-object'?'':nextComponentTag(record.type);
        const code=node.querySelector?.('small');
        if(code)code.textContent=node.dataset.tag;
        restoreSpecialNode(node,record);
        created.push(node);
      }
      created.forEach((node,index)=>node.classList.toggle(index?'multi-selected':'selected',true));
      setSelected(created[0]||null);
      redrawWires();
      historyCapture();
      refreshPropertiesPanel();
      notify(`${created.length} componente(s) colado(s)`);
      return created;
    };

    const duplicate=async()=>{copy();return await paste()};
    const cut=()=>{
      if(!selectedComponents().length){notify('Selecione um componente');return[]}
      const data=copy();
      removeSelected();
      notify('Componente(s) recortado(s) com suas conexões removidas');
      return data;
    };

    let bound=false;
    const bindActions=()=>{
      if(bound||!rootDocument?.querySelectorAll)return false;
      bound=true;
      rootDocument.querySelectorAll('[data-action="cut"]').forEach(button=>button.addEventListener('click',cut));
      rootDocument.querySelectorAll('[data-action="copy"]').forEach(button=>button.addEventListener('click',copy));
      rootDocument.querySelectorAll('[data-action="paste"]').forEach(button=>button.addEventListener('click',paste));
      rootDocument.querySelectorAll('[data-action="duplicate"]').forEach(button=>button.addEventListener('click',duplicate));
      return true;
    };

    return Object.freeze({version:VERSION,storageKey,cloneRecord,read,copy,paste,duplicate,cut,bindActions});
  }

  root.TechRibClipboardRuntime=Object.freeze({VERSION,DEFAULT_KEY,LEGACY_KEYS,create});
})(typeof window!=='undefined'?window:globalThis);
