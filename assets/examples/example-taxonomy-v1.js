(function(root){
  'use strict';

  const CATEGORIES=[
    {id:'commands',label:'Comandos Elétricos',icon:'⚡'},
    {id:'installations',label:'Instalações Elétricas',icon:'💡'},
    {id:'drives',label:'Motores e Acionamentos',icon:'⚙'},
    {id:'microcontrollers',label:'ESP32 e Microcontroladores',icon:'🧠'},
    {id:'industrial-automation',label:'Automação Industrial',icon:'🏭'},
    {id:'building-automation',label:'Automação Residencial e Predial',icon:'⌂'},
    {id:'networks',label:'Redes e Protocolos',icon:'📡'},
    {id:'knx-dali',label:'Automação Predial • KNX e DALI',icon:'◇'},
    {id:'instrumentation',label:'Instrumentação e Controle',icon:'◉'},
    {id:'robotics-motion',label:'Robótica e Movimento',icon:'↔'},
    {id:'techrib-boards',label:'Placas TechRib',icon:'32R'},
    {id:'learn',label:'Aprenda do Zero',icon:'🎓'},
    {id:'interactive-learning',label:'Aprenda na Prática',icon:'🎯'}
  ];
  const CATEGORY_MAP=new Map(CATEGORIES.map(item=>[item.id,item]));

  const normalize=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9+./-]+/g,' ').replace(/\s+/g,' ').trim();
  const unique=items=>[...new Set(items.filter(Boolean))];
  const words=(value)=>normalize(value).split(' ').filter(Boolean);
  const componentTypes=example=>{
    const source=Array.isArray(example?.components)?example.components:Array.isArray(example?.project?.components)?example.project.components:[];
    return unique(source.map(entry=>Array.isArray(entry)?String(entry[1]||''):String(entry?.type||entry?.dataset?.type||''))).filter(Boolean);
  };
  const wireCount=example=>Array.isArray(example?.wires)?example.wires.length:Array.isArray(example?.project?.wires)?example.project.wires.length:0;
  const componentCount=example=>componentTypes(example).length;
  const textFor=example=>normalize([
    example?.id,example?.name,example?.description,example?.category,example?.categoryLabel,
    ...(Array.isArray(example?.tags)?example.tags:[]),...componentTypes(example)
  ].filter(Boolean).join(' '));
  const has=(text,pattern)=>pattern.test(text);
  const explicitCategories=example=>unique(Array.isArray(example?.categories)?example.categories.map(String):[]).filter(id=>CATEGORY_MAP.has(id));

  const LEARN_IDS=new Set([
    'resid-simple-lamp','resid-three-way-lamp','resid-four-way-lamp','resid-four-points-lamp',
    'industrial-direct-start','boards-pico-led-button-opto','boards-arduino-traffic-light',
    'boards-esp32-codegen-3-lamps','boards-arduino-uno-codegen-3-lamps','industrial-esp32-relay-pump'
  ]);

  function classify(example){
    const id=String(example?.id||'');
    const text=textFor(example);
    const types=componentTypes(example);
    const typeText=normalize(types.join(' '));
    const identityCore=normalize([example?.id,example?.name,example?.category,example?.categoryLabel].filter(Boolean).join(' '));
    const identityText=normalize([identityCore,...types].filter(Boolean).join(' '));
    const categories=new Set(explicitCategories(example));
    const tags=new Set(Array.isArray(example?.tags)?example.tags.map(normalize).filter(Boolean):[]);
    const add=(category,...tagValues)=>{if(CATEGORY_MAP.has(category))categories.add(category);tagValues.flatMap(words).forEach(tag=>tags.add(tag))};

    const premium=id.startsWith('premium-')||String(example?.access||'').toLowerCase()==='premium';
    const techrib=has(identityCore,/\btechrib\b|placa inteligente 32|32 reles|32r\b/)||has(typeText,/(techrib-placa-32|techrib-board32)/);
    const knx=has(text,/\bknx\b/)|has(typeText,/\bknx-/);
    const dali=has(text,/\bdali(?:-?2)?\b|\bdt[5678]\b/)|has(typeText,/\bdali/);
    const network=has(text,/\b(rs485|max485|max3485|modbus|w5500|lan8720|ethernet|can|twai|lora|sx1278|zigbee|cc2530|matter|thread|ipv6|rfid|wifi|wi-fi)\b/)|has(typeText,/(rs485|modbus|w5500|lan8720|can|twai|lora|zigbee|matter|thread|ethernet)/);
    const micro=has(identityText,/\b(esp32|esp8266|arduino|raspberry pi pico|pico|stm32|mcp23017|pcf8574|74hc595|74hc165|pca9685|ds3231)\b/)|has(typeText,/(esp32|arduino|pico|stm32|mcp23017|pcf8574|74hc595|74hc165|pca9685|ds3231)/);
    const instrumentation=has(text,/\b(0 ?[-–]? ?10 ?v|4 ?[-–]? ?20 ?ma|ads1115|adc|sensor|temperatura|pressao|pressostato|nivel|vazao|pid|medidor|energia|voltimetro|corrente|pir|mmwave|gas|co\b|lux|analogico|analogo)\b/)|has(typeText,/(sensor|voltimetro|amperimetro|medidor|ads1115|pir|mmwave|gas|analog|current-loop)/);
    const robotics=has(identityText,/\b(robo|robotico|robotica|scara|cnc|servo|pca9685|motor de passo|stepper|estacionamento inteligente)\b/)|has(typeText,/(servo|stepper|robot|cnc|pca9685)/);
    const residentialInstall=id.startsWith('resid-')||has(text,/\b(lampada|interruptor|tomada|chuveiro|quadro residencial|dr\b|dps\b|aterramento residencial)\b/);
    // A categoria Comandos Elétricos é reservada a comandos convencionais.
    // Não usamos tags/categorias já gravadas como evidência, pois metadados antigos
    // continham "comandos eletricos" e faziam projetos ESP32/Arduino/KNX/DALI
    // voltarem para a categoria mesmo depois de uma correção manual.
    const commandEvidenceText=normalize([example?.id,example?.name,example?.description,...types].filter(Boolean).join(' '));
    const commandHasMicro=has(commandEvidenceText,/\b(esp32|esp8266|arduino|raspberry pi pico|pico|stm32|mcp23017|pcf8574|74hc595|74hc165|pca9685|ds3231)\b/);
    const commandHasKnxDali=has(commandEvidenceText,/\b(knx|dali(?:-?2)?|dt[5678])\b/);
    const commandHasNetwork=has(commandEvidenceText,/\b(rs485|max485|max3485|modbus|w5500|lan8720|ethernet|can|twai|lora|sx1278|zigbee|cc2530|matter|thread|ipv6|wifi|wi-fi|rfid)\b/);
    const commandHasSmartPlatform=has(commandEvidenceText,/\b(techrib-placa-32|techrib-board32|sonoff|home assistant|esphome|openhab|io broker|iobroker)\b/);
    const programmableControl=commandHasMicro||commandHasKnxDali||commandHasNetwork||commandHasSmartPlatform;
    const conventionalCommandEvidence=id.startsWith('panel-')||has(commandEvidenceText,/\b(partida(?: direta)?|reversao|estrela triangulo|estrela-triangulo|intertravamento|circuito de comando|comando e potencia|comando completo|contator|contatora|rele termico|temporizador|disjuntor-motor|mpcb|nr-?12|revezamento|ats\b)\b/)|has(typeText,/(contator|rele-termico|temporizador|soft-starter|inversor|disjuntor-motor|mpcb)/);
    const commands=conventionalCommandEvidence&&!programmableControl;
    const drives=has(text,/\b(motor|soft starter|soft-starter|inversor|vfd|delta ms300|provolt|pi550|bomba|compressor|exaustor|elevador|ponte rolante)\b/)|has(typeText,/(motor|soft-starter|inversor|bomba|compressor|elevador)/);
    const industrial=id.startsWith('industrial-')||id.startsWith('panel-')||has(text,/\b(industrial|esteira|envasadora|bombeamento|bomba|compressor|camara fria|irrigacao|poco artesiano|tanque|mistura|processo|ats\b|elevador|ponte rolante)\b/);
    const building=has(text,/\b(portao|porta automatica|persiana|residencial|predial|home assistant|esphome|iluminacao)\b/)||residentialInstall||knx||dali;

    if(techrib)add('techrib-boards','techrib','placa 32 canais');
    // Remove metadado legado antes de reaplicar a regra atual. Assim um exemplo
    // programável nunca permanece em Comandos apenas porque já veio com categories:['commands'].
    if(!commands)categories.delete('commands');
    if(commands)add('commands','comandos eletricos');
    if(residentialInstall)add('installations','instalacoes eletricas');
    if(drives)add('drives','motores','acionamentos');
    if(micro)add('microcontrollers','microcontroladores');
    if(industrial)add('industrial-automation','automacao industrial');
    if(building)add('building-automation','automacao predial','automacao residencial');
    if(network||knx||dali)add('networks','redes','protocolos');
    if(knx||dali)add('knx-dali',knx?'knx':'',dali?'dali':'');
    if(instrumentation)add('instrumentation','instrumentacao','controle');
    if(robotics)add('robotics-motion','robotica','movimento');
    if(LEARN_IDS.has(id))add('learn','aprender','basico');

    // Regras específicas que melhoram a descoberta cruzada.
    if(has(text,/\bcaixa d agua|caixa-d agua|bombeamento|bomba|poco artesiano\b/))add('industrial-automation','bombeamento');
    if(has(text,/\bportao|porta automatica|persiana\b/))add('building-automation','portoes','persianas');
    if(has(text,/\besteira|envasadora|tanque|camara fria|irrigacao\b/))add('industrial-automation');
    if(has(text,/\bsoft starter|soft-starter|delta ms300|provolt|pi550|inversor|vfd\b/))add('drives');
    if(has(text,/\b0 ?[-–]? ?10 ?v|4 ?[-–]? ?20 ?ma|pid\b/))add('instrumentation');
    if(has(text,/\bpca9685|servo\b/))add('robotics-motion');

    // Fallbacks para catálogos legados que ainda não trazem metadados modernos.
    if(!categories.size){
      const legacy=normalize(example?.category||example?.categoryLabel||'');
      if(legacy.includes('esp32')||legacy.includes('arduino')||legacy.includes('pico')||legacy.includes('maker'))add('microcontrollers');
      else if(legacy.includes('sensor')||legacy.includes('display'))add('instrumentation');
      else if(legacy.includes('comunic'))add('networks');
      else if(legacy.includes('techrib'))add('techrib-boards');
      else if(id.startsWith('resid-'))add('installations');
      else add('industrial-automation');
    }

    let primary=String(example?.primaryCategory||example?.category||'');
    // Corrige também exemplos antigos cuja categoria principal foi salva como commands.
    // O exemplo continua existindo; apenas passa a ter uma categoria principal coerente.
    if(primary==='commands'&&!commands)primary='';
    if(!CATEGORY_MAP.has(primary)){
      const commandFocused=commands&&(id.startsWith('panel-')||has(identityText,/\b(partida direta|nr-?12|reversao|estrela triangulo|estrela-triangulo)\b/));
      const driveFocused=has(identityText,/\b(soft starter|soft-starter|delta ms300|provolt|pi550|inversor|vfd)\b/);
      const industrialProcess=has(identityText,/\b(envasadora|esteira|camara fria|irrigacao|compressor|bomba|bombeamento|caixa d agua|poco artesiano|tanque|mistura|ats|elevador|ponte rolante)\b/);
      const buildingFocused=id.startsWith('premium-gate-')||has(identityText,/\b(portao|porta automatica|persiana|home assistant|esphome)\b/);
      const preferred=[
        techrib&&'techrib-boards',(knx||dali)&&'knx-dali',buildingFocused&&'building-automation',
        commandFocused&&'commands',driveFocused&&'drives',industrialProcess&&'industrial-automation',
        network&&'networks',robotics&&'robotics-motion',micro&&'microcontrollers',
        residentialInstall&&'installations',instrumentation&&!industrial&&'instrumentation',
        industrial&&'industrial-automation',commands&&'commands',drives&&'drives',
        [...categories][0]
      ].filter(Boolean);
      primary=preferred.find(id=>categories.has(id))||[...categories][0];
    }
    categories.add(primary);

    const explicitLevel=String(example?.level||'').toLowerCase();
    let level=['basic','intermediate','advanced'].includes(explicitLevel)?explicitLevel:'';
    if(!level){
      const c=componentCount(example),w=wireCount(example);
      if(LEARN_IDS.has(id)||(c<=4&&w<=7&&!knx&&!dali&&!network))level='basic';
      else if(c>=14||w>=30||has(text,/\b(vip|ponte rolante|elevador|mcp23017.*16|20ch|24ch|16ch|8ch.*8 lampadas)\b/))level='advanced';
      else level='intermediate';
    }

    const recognized=[
      ['esp32',/\besp32\b/],['arduino',/\barduino\b/],['pico',/\bpico\b/],['knx',/\bknx\b/],['dali',/\bdali/],
      ['modbus',/\bmodbus\b/],['rs485',/\brs485\b/],['ethernet',/\bethernet\b|\bw5500\b|\blan8720\b/],['can',/\bcan\b|\btwai\b/],
      ['lora',/\blora\b/],['zigbee',/\bzigbee\b/],['matter',/\bmatter\b/],['thread',/\bthread\b/],['bombeamento',/\bbomba|bombeamento|poco artesiano\b/],
      ['esteira',/\besteira\b/],['elevador',/\belevador\b/],['soft-starter',/soft starter|soft-starter/],['inversor',/\binversor|vfd|ms300|pi550\b/],
      ['0-10v',/0 ?[-–]? ?10 ?v/],['4-20ma',/4 ?[-–]? ?20 ?ma/],['sensor',/\bsensor\b/],['rele',/\brele\b/],['lampada',/\blampada\b/]
    ];
    recognized.forEach(([tag,re])=>{if(re.test(text))tags.add(tag)});
    categories.forEach(id=>tags.add(normalize(CATEGORY_MAP.get(id)?.label||id)));

    const orderedCategories=CATEGORIES.map(item=>item.id).filter(id=>categories.has(id));
    return {
      access:premium?'premium':'standard',
      primaryCategory:primary,
      categories:orderedCategories,
      tags:unique([...tags]).slice(0,32),
      level,
      searchText:normalize([example?.name,example?.description,id,...orderedCategories.map(id=>CATEGORY_MAP.get(id)?.label),...tags].filter(Boolean).join(' '))
    };
  }

  const enrich=example=>{const meta=classify(example);Object.assign(example,meta);return example};
  const meta=id=>CATEGORY_MAP.get(String(id||''))||null;
  const levelLabel=level=>level==='basic'?'Básico':level==='advanced'?'Avançado':'Intermediário';
  const accessLabel=access=>access==='premium'?'Premium':'';

  root.TechRibExampleTaxonomyV1={version:'1.2.0',categories:CATEGORIES.map(item=>({...item})),normalize,classify,enrich,meta,levelLabel,accessLabel,componentTypes};
})(typeof window!=='undefined'?window:globalThis);
