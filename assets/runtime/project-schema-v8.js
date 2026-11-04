(function(global){
  'use strict';

  const VERSION=8;
  const SCHEMA='techrib-project';

  // Campos reconstruídos pelo registry/createComponent e que não precisam ser duplicados.
  const REDUNDANT_DATASET_KEYS=new Set([
    'type','label','componentId','registryId','electricalFamily','behaviorType',
    'techribHitbox','techribHitboxBounds','techribHitboxMode','techribHitboxDebug'
  ]);

  // Estado transitório/calculado durante a simulação. Configurações do usuário que não
  // aparecem aqui continuam sendo preservadas para manter compatibilidade com componentes
  // antigos e futuros.
  const TRANSIENT_DATASET_KEYS=new Set([
    'energized','powered','electricalRunning','motorElectricalStatus','speed',
    'logicPowered','logicFault','logicFaultDetails','logicFaultPin','logicFaultVoltage','logicFaultLimit','logicFaultLabel',
    'logicRuntime','logicSupplySource','gpioStates','gpioInputStates','gpioManualOverrides',
    'mcpPowered','mcpSupplySource','mcpVdd','mcpStates',
    'relayChannels','relayEnergized','relayTestOverride',
    'mosfetOn','transistorOn','optoOn','driverChannels','indicatorOn','rgbState',
    'peripheralPowered','peripheralActive','peripheralSupplySource','sensorPowered','sensorOutputVoltage',
    'rs485Powered','rs485SupplyVoltage','rs485SupplySource','rs485DriverEnabled','rs485ReceiverEnabled','rs485DiHigh','rs485RoHigh','rs485BusState','rs485BusValid','rs485BusCollision','rs485PolarityFault','rs485ConnectedPeers',
    'modbusPowered','modbusSupplyVoltage','modbusSupplySource','modbusInputs','modbusCoils','modbusCommunication','modbusAddressConflict','modbusPolarityFault','modbusLastFunction','modbusLastMaster','modbusRtuStatus','modbusRtuUnitId','modbusRtuLastResponse',
    'i2cAdcPowered','i2cAdcSupplyVoltage','i2cAdcAddress','i2cAdcReadings','i2cAdcConnected','i2cAdcAddressConflict','i2cAdcFault','i2cAdcLastMaster','i2cAdcLastChannel','i2cAdcStatus','i2cAdcLastRead',
    'i2cGpioPowered','i2cGpioSupplyVoltage','i2cGpioSupplySource','i2cGpioAddress','i2cGpioLatch','i2cGpioPins','i2cGpioConnected','i2cGpioAddressConflict','i2cGpioFault','i2cGpioLastMaster','i2cGpioStatus','i2cGpioLastRead',
    'currentLoopPowered','currentLoopInputMilliamp','currentLoopOutputVoltage','currentLoopSourceId','currentLoopActive','currentLoopFault','analogCurrentMilliamp','analogCurrentValid',
    'presenceDetected','presenceDetectedMode','presenceSensorPowered','presenceSensorActive','presenceSensorMode','presenceSensorSupplyVoltage','presenceSensorSource','presenceSensorTestUntil','presenceSensorTestMode',
    'muxEnabled','muxChannel','electronicState',
    'coilEnergized','coilMeasuredVoltage','coilCompatible','coilStatus',
    'contactSwitched','phaseOk','rectifierActive','rectifierOutputVoltage','rectifierSource',
    'transformerActive','transformerInputSource','powerSupplyActive','powerSupplyInputSource',
    'measuredVoltage','measuredCurrent','estimatedCurrent','estimatedPower',
    'overloadRatio','overloadStartedAt','overloadTripDueAt','overloadState','protectionTripped',
    'meterError','multimeterDisplay','multimeterUnit',
    'tlRed','tlYellow','tlGreen','illuminated',
    'techrib32Latched','techrib32ManualPressed','techrib32PreviousInputs','techrib32PhysicalInputs',
    'i2cLogicRuntime','physicalOptoInputs',
    'arduinoTempDemand','arduinoTempLastAt','arduinoTrafficStage','arduinoTrafficStageAt','arduinoWaterDemand',
    'espTempDemand','espTempLastAt','espTrafficStage','espTrafficStageAt',
    'picoTempDemand','picoTempLastAt','picoTrafficStage','picoTrafficStageAt','picoWaterDemand',
    'elevatorMoving','elevatorDirection','elevatorTargetFloor','elevatorQueuedFloor','elevatorLastExternalCall','elevatorExternalInputs',
    'elevatorBrakeState','elevatorEncoderCount','elevatorEmergency','elevatorOverload',
    'pumpRunning','pumpDemand','pumpAutoDemand','pumpManualOn','pumpElectricalPowered','pumpElectricalStatus','pumpContactSignature',
    'gateMotion','gateSoundMotion','gatePhotoBlocked','gateContactSignature',
    'conveyorRunning','conveyorDemand','conveyorFault','conveyorContactSignature','conveyorExternalInputs',
    'craneRunning','craneMotion','craneContactSignature','craneExternalInputs',
    'ipRunning','ipDemand','ipElectricalPowered','ipContactSignature','ipInputs','ipRejectActive',
    'vfdRunning','vfdCurrentFrequency','vfdTargetFrequency','vfdPowerOk','vfdFault','vfdCommand','vfdFreqBucket',
    'softState','outputLevel','runCommand','bypass','localSoftCommand','resetRequested',
    's3SoftState','s3TargetFloor','s3QueuedFloor','s3FaultReason','s3MotionIssued','s3SeenMoving','s3StartedAt','s3StopFromLevel','s3StopReason','s3StopStartedAt',
    'scrOutputLevel','scrEnabled','scrFault','scrFireA','scrFireB','scrFireC','scrPhaseOk','scrState',
    'lastCoilPowered','reverseState','ydState','timerDone','timerCoilPowered','timerProgress','timerStartedAt','generatorStartCommand','generatorStartVoltage','visualPreviewRunning','validationError','validationWarning','validationOk'
  ]);

  const TRANSIENT_CLASSES=new Set([
    'selected','multi-selected','logic-powered','logic-fault','relay-energized','electronic-active',
    'mosfet-on','driver-active','peripheral-powered','peripheral-active','running','energized','closed',
    'lamp-on','resid-load-on','phase-ok','meter-fault','electronic-led-on'
  ]);

  const asObject=value=>value&&typeof value==='object'&&!Array.isArray(value)?value:{};

  const LEGACY_COMPONENT_ALIASES=Object.freeze({
    'esp32-devkit-v1':'esp32-devkit',
    'esp32-devkit-v1-svg':'esp32-devkit',
    'board-esp32-devkit-v1':'esp32-devkit'
  });
  const LEGACY_TERMINAL_ALIASES=Object.freeze({
    'board-esp32-devkit-v1':Object.freeze({D15:'GPIO15',GND_2:'GND2'})
  });

  const migrateLegacyComponentAliases=data=>{
    if(!data||!Array.isArray(data.components))return data;
    const legacyByInstance=new Map();
    data.components.forEach(component=>{
      const compact=Array.isArray(component),instanceId=String(compact?(component[0]??''):(component?.componentId??'')),legacyType=String(compact?(component[1]??''):(component?.type??'')),canonicalType=LEGACY_COMPONENT_ALIASES[legacyType];
      if(!canonicalType)return;
      if(instanceId)legacyByInstance.set(instanceId,legacyType);
      if(compact)component[1]=canonicalType;else component.type=canonicalType;
      if(!compact&&component.dataset&&typeof component.dataset==='object'){
        if(LEGACY_COMPONENT_ALIASES[component.dataset.type])component.dataset.type=canonicalType;
        if(LEGACY_COMPONENT_ALIASES[component.dataset.registryId])component.dataset.registryId=canonicalType;
      }
    });
    const terminalName=(instanceId,name)=>LEGACY_TERMINAL_ALIASES[legacyByInstance.get(String(instanceId))]?.[String(name)]||name;
    if(Array.isArray(data.wires))data.wires.forEach(wire=>{
      if(Array.isArray(wire)){
        if(wire.length>1)wire[1]=terminalName(wire[0],wire[1]);
        if(wire.length>3)wire[3]=terminalName(wire[2],wire[3]);
        return;
      }
      if(!wire||typeof wire!=='object')return;
      ['from','to'].forEach(side=>{const endpoint=wire[side];if(endpoint?.type==='terminal')endpoint.name=terminalName(endpoint.componentId,endpoint.name)});
    });
    return data;
  };

  const serializeDataset=(dataset,extraDrop=[])=>{
    const drop=new Set([...TRANSIENT_DATASET_KEYS,...extraDrop]);
    const result={};
    Object.entries(asObject(dataset)).forEach(([key,value])=>{
      if(REDUNDANT_DATASET_KEYS.has(key)||drop.has(key))return;
      if(value===undefined||value===null)return;
      result[key]=String(value);
    });
    return result;
  };

  const serializeClasses=classList=>Array.from(classList||[]).filter(name=>!TRANSIENT_CLASSES.has(name));

  const cleanStyle=node=>{
    const raw=String(node?.getAttribute?.('style')||'');
    if(!raw)return '';
    // --motor-speed é calculado durante a simulação e não deve contaminar o projeto salvo.
    return raw.replace(/(?:^|;)\s*--motor-speed\s*:[^;]*/gi,'').replace(/^\s*;|;\s*$/g,'').trim();
  };

  function create(options={}){
    const registryDefinition=typeof options.registryDefinition==='function'?options.registryDefinition:()=>null;
    const terminalMetadata=typeof options.terminalMetadata==='function'?options.terminalMetadata:()=>null;

    const isOfficial=nodeOrType=>Boolean(registryDefinition(nodeOrType));

    const componentRecord=node=>{
      const official=isOfficial(node);
      const definition=registryDefinition(node)||{};
      const extraDrop=Array.isArray(definition?.persistence?.datasetDrop)?definition.persistence.datasetDrop:[];
      const record={
        type:node.dataset.type,
        label:node.dataset.label||node.dataset.type,
        componentId:node.dataset.componentId,
        left:node.style.left,
        top:node.style.top,
        style:cleanStyle(node),
        dataset:serializeDataset({...node.dataset},extraDrop),
        classes:serializeClasses(node.classList),
        visualSource:official?'registry':'embedded'
      };
      if(!official){
        record.terminalMetadata=[...node.querySelectorAll('[data-terminal]')].map(terminal=>terminalMetadata(terminal));
        record.svg=node.querySelector('svg')?.outerHTML||'';
      }
      return record;
    };

    const endpointData=endpoint=>{
      if(endpoint.type!=='terminal')return{type:'junction',id:endpoint.junction.id,uid:endpoint.junction.uid||''};
      const component=endpoint.el.closest('.placed-component'),terminals=[...component.querySelectorAll('[data-terminal]')];
      return{
        type:'terminal',
        componentId:component.dataset.componentId,
        name:endpoint.el.dataset.terminal||'',
        index:terminals.indexOf(endpoint.el)
      };
    };

    const normalize=data=>{
      if(!data||!Array.isArray(data.components)||!Array.isArray(data.wires))throw new Error('Projeto inválido');
      const version=Number(data.version||1);
      if(Number.isFinite(version)&&version>VERSION)throw new Error(`Projeto versão ${version} não suportado por esta versão do simulador`);
      return migrateLegacyComponentAliases(data);
    };

    const registryTypes=components=>[...new Set((components||[]).map(item=>item?.type).filter(type=>type&&isOfficial(type)))];

    return{
      version:VERSION,
      schema:SCHEMA,
      componentRecord,
      endpointData,
      normalize,
      registryTypes,
      isOfficial,
      migrateLegacyComponentAliases,
      legacyComponentAliases:LEGACY_COMPONENT_ALIASES,
      legacyTerminalAliases:LEGACY_TERMINAL_ALIASES,
      serializeDataset,
      serializeClasses
    };
  }

  global.TechRibProjectSchemaV8={VERSION,SCHEMA,create,migrateLegacyComponentAliases,LEGACY_COMPONENT_ALIASES,LEGACY_TERMINAL_ALIASES,serializeDataset,serializeClasses};
})(typeof window!=='undefined'?window:globalThis);
