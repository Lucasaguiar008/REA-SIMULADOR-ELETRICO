(()=>{
  'use strict';
  const sizes={
    'relay-1ch-5v':{box:92,svg:76,min:130,pad:6},
    'elec-relay-module-1ch':{box:92,svg:76,min:130,pad:6},
    'elec-relay-module-2ch':{box:146,svg:130,min:130,pad:6},
    'elec-relay-module-4ch':{box:243,svg:227,min:130,pad:6},
    'elec-relay-module-8ch':{box:430,svg:415,min:130,pad:6}
  };
  const setImportant=(style,key,value)=>{
    if(style.getPropertyValue(key)===value&&style.getPropertyPriority(key)==='important')return false;
    style.setProperty(key,value,'important');return true;
  };
  const normalize=node=>{
    if(!(node instanceof Element)||!node.matches('.placed-component'))return false;
    const type=String(node.dataset.type||''),size=sizes[type];
    if(!size)return false;
    let changed=false;
    changed=setImportant(node.style,'width',`${size.box}px`)||changed;
    changed=setImportant(node.style,'height','auto')||changed;
    changed=setImportant(node.style,'min-height',`${size.min}px`)||changed;
    changed=setImportant(node.style,'max-height','none')||changed;
    changed=setImportant(node.style,'padding',`${size.pad}px`)||changed;
    const svg=node.querySelector(':scope>svg');
    if(svg){
      changed=setImportant(svg.style,'width',`${size.svg}px`)||changed;
      changed=setImportant(svg.style,'height','auto')||changed;
      changed=setImportant(svg.style,'max-width','none')||changed;
      changed=setImportant(svg.style,'max-height','none')||changed;
      changed=setImportant(svg.style,'overflow','visible')||changed;
    }
    node.dataset.relayProportion='v2-restored-v5';
    return changed;
  };
  const normalizeAll=root=>root?.querySelectorAll?.('.placed-component')?.forEach(normalize);
  const hideLegacyCard=()=>{
    document.querySelectorAll('.component-item[data-component="relay-1ch-5v"]').forEach(item=>{
      item.hidden=true;
      item.style.setProperty('display','none','important');
      item.setAttribute('aria-hidden','true');
      item.dataset.techribLegacyHidden='true';
    });
  };
  const enforce=()=>{normalizeAll(document);hideLegacyCard()};
  const schedule=()=>requestAnimationFrame(()=>requestAnimationFrame(enforce));
  const boot=()=>{
    enforce();schedule();
    const sheet=document.querySelector('.schematic-sheet');
    if(sheet){
      const sheetObserver=new MutationObserver(records=>{
        let needs=false;
        for(const record of records){
          if(record.type==='attributes'){
            if(record.target?.matches?.('.placed-component')){normalize(record.target);needs=true}
          }else{
            for(const added of record.addedNodes||[]){
              if(!(added instanceof Element))continue;
              if(added.matches?.('.placed-component'))normalize(added);
              added.querySelectorAll?.('.placed-component')?.forEach(normalize);
              needs=true;
            }
          }
        }
        if(needs)schedule();
      });
      sheetObserver.observe(sheet,{childList:true,subtree:true,attributes:true,attributeFilter:['style','class','data-type']});
    }
    const library=document.querySelector('.component-sidebar')||document.body;
    const libraryObserver=new MutationObserver(()=>hideLegacyCard());
    libraryObserver.observe(library,{childList:true,subtree:true});
    ['load','pageshow','visibilitychange'].forEach(evt=>window.addEventListener(evt,schedule,{passive:true}));
    document.addEventListener('pointerup',schedule,{passive:true});
    window.TechRibNormalizeRelayModuleSizes=()=>{enforce();return true};
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
