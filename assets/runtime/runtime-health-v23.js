/* TechRib V23 — verificação de integridade dos runtimes.
   Substitui o antigo runtime-compat-v12b, que duplicava e podia sobrescrever módulos atuais.
   Este arquivo NÃO redefine runtimes: apenas valida que as implementações oficiais carregaram. */
(function(root){
  'use strict';

  const requirements=Object.freeze([
    ['TechRibLibraryRuntime', value=>typeof value?.create==='function'],
    ['TechRibProjectRuntime', value=>typeof value?.create==='function'],
    ['TechRibExamplesRuntime', value=>typeof value?.create==='function'],
    ['TechRibReportsRuntime', value=>typeof value?.create==='function'],
    ['TechRibBomRuntime', value=>typeof value?.create==='function'&&value?.capabilities?.technicalScale===true&&value?.capabilities?.wireTechnicalCalculation===true],
    ['TechRibUiToolsRuntime', value=>typeof value?.create==='function'&&value?.capabilities?.technicalScaleMenu===true],
    ['TechRibElectricalUtils', value=>typeof value?.normalizeVoltageClass==='function'&&typeof value?.incompatiblePotentials==='function'],
    ['TechRibComponentBehaviors', value=>typeof value?.normalizeGpioMode==='function'&&typeof value?.canonicalGpioPinValue==='function'],
    ['TechRibWireUtils', value=>typeof value?.pathData==='function'&&typeof value?.routeLength==='function'],
    ['TechRibTerminalMetadataRuntime', value=>typeof value?.create==='function'],
    ['TechRibElectricalValidationRuntime', value=>typeof value?.create==='function'],
    ['TechRibPremiumVisualFallbacksV30', value=>typeof value?.install==='function'&&value?.VERSION===30],
    ['TechRibLibraryCatalogV30', value=>typeof value?.create==='function'&&value?.VERSION===30],
    ['TechRibProjectSerializationV30', value=>typeof value?.create==='function'&&value?.VERSION===30],
    ['TechRibComponentInteractionRuntime', value=>typeof value?.create==='function'&&value?.VERSION===27],
    ['TechRibComponentInstantiationRuntime', value=>typeof value?.create==='function'&&value?.VERSION===27],
    ['TechRibSpecialControllersRuntime', value=>typeof value?.create==='function'&&value?.VERSION===28],
    ['TechRibSimulationModeRuntime', value=>typeof value?.create==='function'&&value?.VERSION===29],
    ['TechRibDiagnosticVisualRuntime', value=>typeof value?.create==='function'&&value?.VERSION===29],
    ['TechRibShortCircuitProtectionRuntime', value=>typeof value?.create==='function'&&value?.VERSION===29],
    ['TechRibClipboardRuntime', value=>typeof value?.create==='function'&&value?.VERSION===26],
  ]);

  const inspect=()=>{
    const missing=[];
    for(const [name,validate] of requirements){
      let ok=false;
      try{ok=validate(root[name])===true}catch(_){ok=false}
      if(!ok)missing.push(name);
    }
    return Object.freeze({ok:missing.length===0,missing:Object.freeze(missing),checked:requirements.length});
  };

  const report=inspect();
  root.TechRibRuntimeHealthV23=Object.freeze({version:23,requirements,inspect,report});
  root.TECHRIB_RUNTIME_HEALTH=report;
  if(!report.ok){
    console.error('[TechRib] Falha de integridade dos runtimes. Módulos ausentes/incompatíveis:',report.missing.join(', '));
    root.document?.documentElement?.setAttribute?.('data-techrib-runtime-health','error');
  }else{
    root.document?.documentElement?.setAttribute?.('data-techrib-runtime-health','ok');
  }
})(typeof window!=='undefined'?window:globalThis);
