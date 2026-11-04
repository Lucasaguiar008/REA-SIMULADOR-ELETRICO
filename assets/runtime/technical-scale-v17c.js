(function(global){
  'use strict';

  const PX_PER_MM=96/25.4;
  const PRESETS=[1,2,5,10,20,50,100];
  const finitePositive=value=>Number.isFinite(Number(value))&&Number(value)>0;
  const normalize=config=>{
    if(config==null||config===false)return{enabled:false,ratio:null,mode:'none'};
    if(typeof config==='number'&&finitePositive(config))return{enabled:true,ratio:Number(config),mode:'preset'};
    if(typeof config==='string'){
      if(config==='none'||config==='')return{enabled:false,ratio:null,mode:'none'};
      const ratio=Number(config.replace(/^1:/,''));
      return finitePositive(ratio)?{enabled:true,ratio,mode:PRESETS.includes(ratio)?'preset':'custom'}:{enabled:false,ratio:null,mode:'none'};
    }
    const ratio=Number(config.ratio);
    if(config.enabled!==true||!finitePositive(ratio))return{enabled:false,ratio:null,mode:'none'};
    return{enabled:true,ratio,mode:PRESETS.includes(ratio)?'preset':'custom'};
  };
  const label=config=>{const state=normalize(config);return state.enabled?`1:${String(state.ratio).replace('.',',')}`:'sem escala técnica'};
  const paperMillimetersFromPixels=pixels=>Number(pixels||0)/PX_PER_MM;
  const metersFromPixels=(pixels,config)=>{const state=normalize(config);if(!state.enabled)return null;return paperMillimetersFromPixels(pixels)*state.ratio/1000};

  function create(options={}){
    const select=options.select||document.querySelector('[data-technical-scale]');
    const sheet=options.sheet||document.querySelector('.schematic-sheet');
    const notify=options.notify||(()=>{}),onChange=options.onChange||(()=>{});
    let state={enabled:false,ratio:null,mode:'none'};

    const ensureCustomOption=ratio=>{
      if(!select||!finitePositive(ratio)||PRESETS.includes(Number(ratio)))return;
      let option=select.querySelector('option[data-custom-scale]');
      if(!option){option=document.createElement('option');option.dataset.customScale='true';select.appendChild(option)}
      option.value=`custom:${ratio}`;option.textContent=`Personalizada • 1:${String(ratio).replace('.',',')}`;
    };
    const syncUi=()=>{
      if(sheet){sheet.dataset.technicalScaleEnabled=String(state.enabled);sheet.dataset.technicalScaleRatio=state.enabled?String(state.ratio):''}
      if(!select)return;
      select.dataset.scaleActive=String(state.enabled);
      if(!state.enabled){select.value='none';return}
      if(PRESETS.includes(state.ratio)){select.value=String(state.ratio);return}
      ensureCustomOption(state.ratio);select.value=`custom:${state.ratio}`;
    };
    const set=(config,{silent=false}={})=>{
      const next=normalize(config),changed=next.enabled!==state.enabled||next.ratio!==state.ratio;
      state=next;syncUi();
      if(changed&&!silent){onChange(snapshot());notify(state.enabled?`Escala técnica ${label(state)} ativada. Comprimentos e quedas serão estimados pela geometria da prancha.`:'Escala técnica desativada. Comprimentos e quedas deixam de ser calculados.')}
      return snapshot();
    };
    const setFromSelect=()=>{
      if(!select)return;
      const value=select.value;
      if(value==='none')return set(null);
      if(value==='custom'){
        const answer=global.prompt?.('Informe o denominador da escala técnica. Ex.: 25 para escala 1:25','25');
        if(answer==null){syncUi();return}
        const ratio=Number(String(answer).replace(',','.'));
        if(!finitePositive(ratio)){notify('Escala inválida. Informe um número maior que zero.');syncUi();return}
        return set({enabled:true,ratio});
      }
      if(value.startsWith('custom:'))return set({enabled:true,ratio:Number(value.slice(7))});
      return set({enabled:true,ratio:Number(value)});
    };
    const bind=()=>{if(!select||select.dataset.technicalScaleBound==='true')return;select.dataset.technicalScaleBound='true';select.addEventListener('change',setFromSelect);syncUi()};
    const snapshot=()=>({enabled:state.enabled,ratio:state.enabled?state.ratio:null,mode:state.mode,label:label(state)});
    const serialize=()=>({enabled:state.enabled,ratio:state.enabled?state.ratio:null});
    const load=(config,{silent=true}={})=>set(config,{silent});
    const reset=({silent=true}={})=>set(null,{silent});
    const lengthFromPixels=pixels=>{const meters=metersFromPixels(pixels,state);return{available:meters!=null,meters,paperMillimeters:paperMillimetersFromPixels(pixels),scale:snapshot()}};
    const caution=()=>state.enabled?`Estimativa geométrica em ${label(state)}; use apenas se a posição dos componentes representar a instalação física.`:'Sem escala física definida: comprimento e queda de tensão não são calculados.';
    return{bind,set,load,reset,snapshot,serialize,lengthFromPixels,caution,paperMillimetersFromPixels:p=>paperMillimetersFromPixels(p)};
  }

  global.TechRibTechnicalScaleRuntime={create,normalize,label,paperMillimetersFromPixels,metersFromPixels,PX_PER_MM,PRESETS};
})(window);
