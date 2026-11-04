(()=>{
  'use strict';

  // TECHRIB COMPONENT SIZE PROFILES V1
  // Camada visual central e aditiva. Componentes Contract V1 podem declarar
  // ui.sizeProfile sem carregar medidas fixas em cada component.json.
  // Compatibilidade: ui.placedWidth legado continua sendo respeitado.
  const PROFILES=Object.freeze({
    'electronics-tiny':Object.freeze({placedWidth:105,padding:6}),
    'compact':Object.freeze({placedWidth:145,padding:6}),
    'module-small':Object.freeze({placedWidth:165,padding:7}),
    'module-medium':Object.freeze({placedWidth:200,padding:8}),
    'module-wide':Object.freeze({placedWidth:260,padding:8}),
    'signal-conditioner':Object.freeze({placedWidth:240,padding:8}),
    'module-large':Object.freeze({placedWidth:320,padding:10}),
    'remote-io-bank':Object.freeze({placedWidth:510,padding:10,widthByTerminals:Object.freeze({base:270,perTerminal:15,min:420,max:720})}),
    'controller':Object.freeze({placedWidth:360,padding:10}),
    'equipment-medium':Object.freeze({placedWidth:560,padding:10}),
    'system-large':Object.freeze({placedWidth:760,padding:10}),
    'system-xlarge':Object.freeze({placedWidth:900,padding:10})
  });

  // Defaults por família de comportamento. Só são usados quando o componente
  // não possui ui.sizeProfile nem ui.placedWidth. Isso permite que novas famílias
  // nasçam proporcionais sem regra por ID e sem alterar componentes legados.
  const BEHAVIOR_DEFAULTS=Object.freeze({
    'isolated-digital-input':'module-medium',
    'rs485-transceiver':'module-medium',
    'i2c-adc':'module-wide',
    'i2c-quasi-gpio-expander':'module-large',
    'current-loop-receiver':'signal-conditioner',
    'presence-sensor-digital':'module-small',
    'shutter-actuator':'equipment-medium',
    'modbus-energy-meter':'module-wide',
    'modbus-rtu-io':'remote-io-bank',
    'digital-io-module':'module-large',
    'analog-io-module':'module-large',
    'sensor-interface':'module-small'
  });

  const clampWidth=value=>Math.max(70,Math.min(900,Math.round(Number(value)||0)));
  const cloneProfile=(profileId,source,definition=null)=>{
    const p=PROFILES[profileId];
    if(!p)return null;
    let placedWidth=p.placedWidth;
    const dynamic=p.widthByTerminals;
    if(dynamic&&definition&&typeof definition==='object'){
      const terminalCount=Object.keys(definition.terminals||{}).length;
      const computed=Number(dynamic.base||0)+terminalCount*Number(dynamic.perTerminal||0);
      if(Number.isFinite(computed)&&computed>0)placedWidth=Math.max(Number(dynamic.min||70),Math.min(Number(dynamic.max||900),Math.round(computed)));
    }
    return Object.freeze({profileId,source,placedWidth,padding:p.padding,minHeight:p.minHeight??null,terminalCount:definition?Object.keys(definition.terminals||{}).length:null});
  };

  const resolve=definition=>{
    if(!definition||typeof definition!=='object')return null;
    const ui=definition.ui&&typeof definition.ui==='object'?definition.ui:{};
    const explicitProfile=String(ui.sizeProfile||'').trim();
    if(explicitProfile&&PROFILES[explicitProfile])return cloneProfile(explicitProfile,'ui.sizeProfile',definition);

    // Compatibilidade V1: medidas explícitas antigas têm precedência sobre defaults.
    const legacyWidth=Number(ui.placedWidth);
    if(Number.isFinite(legacyWidth)&&legacyWidth>=70){
      const width=clampWidth(legacyWidth);
      return Object.freeze({profileId:null,source:'ui.placedWidth',placedWidth:width,padding:width<=150?6:width<=260?8:10,minHeight:null});
    }

    const behaviorType=String(definition.behavior?.type||'').trim();
    const inherited=BEHAVIOR_DEFAULTS[behaviorType];
    if(inherited)return cloneProfile(inherited,'behavior.type',definition);
    return null;
  };

  const api=Object.freeze({
    version:'techrib.component-size-profiles/v1',
    profiles:PROFILES,
    behaviorDefaults:BEHAVIOR_DEFAULTS,
    resolve,
    has:profileId=>Boolean(PROFILES[String(profileId||'').trim()]),
    get:profileId=>cloneProfile(String(profileId||'').trim(),'api.get')
  });

  globalThis.TechRibComponentSizeProfiles=api;
})();
