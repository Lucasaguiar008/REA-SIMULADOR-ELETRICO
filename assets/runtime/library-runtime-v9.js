(function(global){
  'use strict';

  const asText=value=>String(value||'').trim();
  const escapeSelector=value=>global.CSS?.escape?global.CSS.escape(String(value)):String(value).replace(/[^a-zA-Z0-9_-]/g,'\\$&');
  const canonicalRegistryVisualTypes=new Set([
    'fonte-monofasica',
    'fonte-bifasica',
    'fonte-trifasica',
    'disjuntor-1p',
    'disjuntor-2p',
    'disjuntor-3p',
    'disjuntor-4p',
    'disjuntor-dr-2p',
    'disjuntor-dr-3p',
    'disjuntor-dr-4p',
    'disjuntor-motor-mpcb'
  ]);

  function create(options={}){
    const registry=options.registry||{};
    const visuals=options.visuals||{};
    const urls=options.urls||{};
    const runtimeFallbacks=options.runtimeFallbacks||{};
    const buildSource=typeof options.buildSource==='function'?options.buildSource:()=>null;
    const root=options.root||document;
    const promises=new Map();
    const generations=new Map();

    const definition=value=>registry[typeof value==='string'?value:value?.dataset?.type||value?.dataset?.component]||null;
    const inlineSource=type=>{
      const selector=`[data-component="${escapeSelector(type)}"]`;
      return root.querySelector(`.component-sidebar ${selector}`)||root.querySelector(selector);
    };

    const load=async type=>{
      const cached=asText(visuals[type]);
      if(cached)return cached;
      if(promises.has(type))return promises.get(type);
      const url=urls[type],fallback=asText(runtimeFallbacks[type]);
      if(!url){
        if(fallback){visuals[type]=fallback;global.TECHRIB_COMPONENT_VISUALS=visuals;return fallback}
        return '';
      }
      const generation=generations.get(type)||0;
      const promise=fetch(url,{credentials:'same-origin',cache:type==='modulo-pcf8574-8io'?'no-cache':'force-cache'}).then(async response=>{
        if(!response.ok)throw new Error(`HTTP ${response.status}`);
        const svg=await response.text();
        if(!/<svg\b/i.test(svg))throw new Error('Resposta visual inválida');
        if((generations.get(type)||0)!==generation)return asText(visuals[type])||svg;
        visuals[type]=svg;global.TECHRIB_COMPONENT_VISUALS=visuals;return svg;
      }).catch(error=>{
        console.warn(`TechRib visual ${type}:`,error);
        if(fallback){visuals[type]=fallback;global.TECHRIB_COMPONENT_VISUALS=visuals;return fallback}
        return '';
      }).finally(()=>promises.delete(type));
      promises.set(type,promise);
      return promise;
    };

    const sourceSync=type=>{
      const inline=inlineSource(type);
      const visual=asText(visuals[type]);
      if(canonicalRegistryVisualTypes.has(type)&&visual)return buildSource(type,visual);
      if(inline?.querySelector(':scope > svg'))return inline;
      if(visual)return buildSource(type,visual);
      return definition(type)?null:inline;
    };

    const source=async type=>{
      if(canonicalRegistryVisualTypes.has(type)){
        const visual=await load(type);
        return buildSource(type,visual)||sourceSync(type);
      }
      return sourceSync(type)||buildSource(type,await load(type));
    };
    const preload=async types=>{
      const unique=[...new Set((types||[]).filter(type=>definition(type)))];
      await Promise.all(unique.map(type=>load(type)));
      return unique.length;
    };
    const set=(type,svg)=>{
      generations.set(type,(generations.get(type)||0)+1);
      if(asText(svg)){visuals[type]=String(svg);global.TECHRIB_COMPONENT_VISUALS=visuals}
      return visuals[type]||'';
    };
    const publicApi={load,source,sourceSync,url:type=>urls[type]||'',set,preload};
    return {definition,load,source,sourceSync,preload,set,publicApi,pending:promises};
  }

  global.TechRibLibraryRuntime={create};
})(window);
