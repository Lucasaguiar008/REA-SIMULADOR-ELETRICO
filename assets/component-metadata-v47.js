(()=>{
  'use strict';
  const profiles={
    'fonte-trifasica':{family:'alimentacao',kind:'source',symbol:'source-3ph',function:'Alimentação trifásica',domain:'power-ac',prefix:'PS'},
    'fonte-bifasica':{family:'alimentacao',kind:'source',symbol:'source-2ph',function:'Alimentação bifásica',domain:'power-ac',prefix:'PS'},
    'fonte-monofasica':{family:'alimentacao',kind:'source',symbol:'source-1ph',function:'Alimentação monofásica',domain:'power-ac',prefix:'PS'},
    'fonte-24v':{family:'alimentacao',kind:'source',symbol:'source-dc',function:'Fonte 24 Vcc',domain:'control-dc',prefix:'PS'},
    'transformador-comando':{family:'alimentacao',kind:'transformer',symbol:'transformer',function:'Transformador de comando',domain:'control-ac',prefix:'TR'},
    'trilho-din-perfurado':{family:'infraestrutura',kind:'din-rail',symbol:'din-rail',function:'Infraestrutura mecânica de montagem',domain:'mechanical',prefix:'TR'},
    'canaleta-ranhurada-painel':{family:'infraestrutura',kind:'wire-duct',symbol:'wire-duct',function:'Canaleta ranhurada para organização de condutores',domain:'mechanical',prefix:'CN'},
    'pente-ligacao-1p':{family:'distribuicao',kind:'comb-busbar-1p',symbol:'busbar',function:'Distribuição rígida monopolar para disjuntores',domain:'power-ac',prefix:'PE'},
    'pente-ligacao-2p':{family:'distribuicao',kind:'comb-busbar-2p',symbol:'busbar',function:'Distribuição rígida bipolar para disjuntores',domain:'power-ac',prefix:'PE'},
    'pente-ligacao-3p':{family:'distribuicao',kind:'comb-busbar-3p',symbol:'busbar',function:'Distribuição rígida trifásica para disjuntores',domain:'power-ac',prefix:'PE'},
    'disjuntor-1p':{family:'protecao',kind:'breaker',symbol:'breaker-1p',function:'Proteção e seccionamento monopolar',domain:'power-ac',prefix:'QF'},
    'disjuntor-2p':{family:'protecao',kind:'breaker',symbol:'breaker-2p',function:'Proteção e seccionamento bipolar',domain:'power-ac',prefix:'QF'},
    'disjuntor-3p':{family:'protecao',kind:'breaker',symbol:'breaker-3p',function:'Proteção e seccionamento tripolar',domain:'power-ac',prefix:'QF'},
    'disjuntor-motor-mpcb':{family:'protecao',kind:'motor-breaker',symbol:'mpcb',function:'Proteção e manobra de motor',domain:'power-ac',prefix:'QF'},
    'disjuntor-dr-2p':{family:'protecao',kind:'rcd',symbol:'rcd-2p',function:'Proteção diferencial residual bipolar',domain:'power-ac',prefix:'QF'},
    'disjuntor-dr-3p':{family:'protecao',kind:'rcd',symbol:'rcd-3p',function:'Proteção diferencial residual tripolar',domain:'power-ac',prefix:'QF'},
    'disjuntor-dr-4p':{family:'protecao',kind:'rcd',symbol:'rcd-4p',function:'Proteção diferencial residual tetrapolar',domain:'power-ac',prefix:'QF'},
    'interruptor-dr':{family:'protecao',kind:'rcd',symbol:'rcd',function:'Proteção diferencial residual',domain:'power-ac',prefix:'QF'},
    'dps':{family:'protecao',kind:'surge-protector',symbol:'spd',function:'Proteção contra surtos',domain:'power-ac',prefix:'DPS'},
    'dps-tipo-1':{family:'protecao',kind:'surge-protector',symbol:'spd',function:'Proteção contra surtos Tipo 1',domain:'power-ac',prefix:'DPS'},
    'dps-tipo-3':{family:'protecao',kind:'surge-protector',symbol:'spd',function:'Proteção contra surtos Tipo 3',domain:'power-ac',prefix:'DPS'},
    'dps-1p-n':{family:'protecao',kind:'surge-protector',symbol:'spd',function:'Proteção contra surtos 1P+N',domain:'power-ac',prefix:'DPS'},
    'dps-3p-n':{family:'protecao',kind:'surge-protector',symbol:'spd',function:'Proteção contra surtos 3P+N',domain:'power-ac',prefix:'DPS'},
    'fusivel':{family:'protecao',kind:'fuse',symbol:'fuse',function:'Proteção por fusível',domain:'power-ac',prefix:'FU'},
    'rele-termico':{family:'protecao',kind:'thermal-overload',symbol:'thermal-overload',function:'Proteção térmica de motor',domain:'power-ac',prefix:'FR'},
    'rele-falta-fase':{family:'protecao',kind:'phase-monitor',symbol:'phase-monitor',function:'Monitoramento de falta de fase',domain:'control-ac',prefix:'KA'},
    'contator':{family:'comando',kind:'contactor',symbol:'contactor-3p',function:'Manobra eletromagnética tripolar',domain:'power-control',prefix:'KM'},
    'contator-tripolar-ajustavel':{family:'comando',kind:'contactor',symbol:'contactor-3p',function:'Manobra eletromagnética tripolar com bobina configurável',domain:'power-control',prefix:'KM'},
    'contator-2':{family:'comando',kind:'contactor',symbol:'contactor-3p',function:'Manobra eletromagnética tripolar',domain:'power-control',prefix:'KM'},
    'contator-4p':{family:'comando',kind:'contactor',symbol:'contactor-4p',function:'Manobra eletromagnética de quatro polos',domain:'power-control',prefix:'KM'},
    'contator-reversor':{family:'comando',kind:'reversing-contactor',symbol:'reversing-contactor',function:'Reversão com intertravamento',domain:'power-control',prefix:'KM'},
    'rele-auxiliar':{family:'comando',kind:'aux-relay',symbol:'relay',function:'Relé auxiliar',domain:'control',prefix:'KA'},
    'temporizador':{family:'comando',kind:'timer-relay',symbol:'timer',function:'Temporização de comando',domain:'control',prefix:'KT'},
    'rele-estrela-triangulo':{family:'comando',kind:'star-delta-relay',symbol:'star-delta-relay',function:'Comando estrela-triângulo',domain:'control',prefix:'KA'},
    'temporizador-estrela-triangulo':{family:'comando',kind:'star-delta-timer',symbol:'star-delta-timer',function:'Temporização estrela-triângulo',domain:'control',prefix:'KT'},
    'rele-biestavel-impulso':{family:'comando',kind:'latching-relay',symbol:'latching-relay',function:'Relé biestável por impulso',domain:'control',prefix:'KA'},
    'soft-starter':{family:'partida',kind:'soft-starter',symbol:'soft-starter',function:'Partida eletrônica suave',domain:'power-control',prefix:'SS'},
    'inversor-frequencia':{family:'partida',kind:'vfd',symbol:'vfd',function:'Controle de velocidade e partida',domain:'power-control',prefix:'INV'},
    'motor-trifasico':{family:'carga',kind:'motor-3ph',symbol:'motor-3ph',function:'Motor trifásico',domain:'power-ac',prefix:'M'},
    'motor-bifasico':{family:'carga',kind:'motor-2ph',symbol:'motor',function:'Motor bifásico',domain:'power-ac',prefix:'M'},
    'motor-trifasico-6t':{family:'carga',kind:'motor-3ph-6t',symbol:'motor-3ph-6t',function:'Motor trifásico de seis terminais',domain:'power-ac',prefix:'M'},
    'bomba-trifasica':{family:'carga',kind:'pump-3ph',symbol:'motor-pump',function:'Bomba trifásica',domain:'power-ac',prefix:'M'},
    'bomba-trifasica-polia':{family:'carga',kind:'pump-3ph',symbol:'motor-pump',function:'Bomba trifásica',domain:'power-ac',prefix:'M'},
    'botoeira-liga-tatil-2p':{family:'comando',kind:'pushbutton-no',symbol:'pushbutton-no',function:'Push button tátil momentâneo NA',domain:'control',prefix:'S'},
    'botoeira-liga':{family:'comando',kind:'pushbutton-no',symbol:'pushbutton-no',function:'Comando momentâneo NA',domain:'control',prefix:'S'},
    'botoeira-desliga':{family:'comando',kind:'pushbutton-nc',symbol:'pushbutton-nc',function:'Comando momentâneo NF',domain:'control',prefix:'S'},
    'botao-emergencia':{family:'comando',kind:'emergency-stop',symbol:'emergency-stop',function:'Parada de emergência',domain:'control',prefix:'S'},
    'chave-alavanca-onoff':{family:'comando',kind:'switch',symbol:'switch',function:'Chave liga/desliga',domain:'control',prefix:'S'},
    'chave-seletora-2p':{family:'comando',kind:'selector',symbol:'selector-2pos',function:'Chave seletora duas posições',domain:'control',prefix:'S'},
    'chave-seletora-3p':{family:'comando',kind:'selector',symbol:'selector-3pos',function:'Chave seletora três posições',domain:'control',prefix:'S'},
    'chave-comutadora-rotativa':{family:'comando',kind:'cam-switch',symbol:'cam-switch',function:'Comutação rotativa',domain:'power-control',prefix:'S'},
    'chave-estrela-triangulo-manual':{family:'partida',kind:'star-delta-switch',symbol:'star-delta-switch',function:'Partida estrela-triângulo manual',domain:'power-ac',prefix:'S'},
    'chave-seccionadora':{family:'protecao',kind:'isolator',symbol:'isolator',function:'Seccionamento tripolar',domain:'power-ac',prefix:'QS'},
    'chave-seccionadora-fusivel':{family:'protecao',kind:'fused-isolator',symbol:'fused-isolator',function:'Seccionamento com fusíveis',domain:'power-ac',prefix:'QS'},
    'fim-curso':{family:'sensor',kind:'limit-switch',symbol:'limit-switch',function:'Detecção mecânica de posição',domain:'control',prefix:'S'},
    'pressostato':{family:'sensor',kind:'pressure-switch',symbol:'pressure-switch',function:'Detecção de pressão',domain:'control',prefix:'S'},
    'boia-nivel':{family:'sensor',kind:'float-switch',symbol:'float-switch',function:'Detecção de nível',domain:'control',prefix:'S'},
    'sensor-indutivo':{family:'sensor',kind:'inductive-sensor',symbol:'proximity-sensor',function:'Detecção indutiva',domain:'control-dc',prefix:'B'},
    'sensor-capacitivo':{family:'sensor',kind:'capacitive-sensor',symbol:'proximity-sensor',function:'Detecção capacitiva',domain:'control-dc',prefix:'B'},
    'sensor-fotoeletrico':{family:'sensor',kind:'photoelectric-sensor',symbol:'photoelectric-sensor',function:'Detecção fotoelétrica',domain:'control-dc',prefix:'B'},
    'multimetro-digital':{family:'instrumentacao',kind:'multimeter',symbol:'meter',function:'Medição elétrica',domain:'measurement',prefix:'MM'},
    'resid-lampada':{family:'residencial',kind:'lamp',symbol:'lamp',function:'Iluminação',domain:'power-ac',prefix:'H'},
    'resid-interruptor-home-switch-2p':{family:'residencial',kind:'pushbutton-no',symbol:'pushbutton-no',function:'Home Switch momentâneo tipo pulsador, contato NA L-1',domain:'power-ac',prefix:'S'},
    'resid-interruptor-simples':{family:'residencial',kind:'switch',symbol:'switch-1way',function:'Interruptor simples',domain:'power-ac',prefix:'S'},
    'resid-three-way':{family:'residencial',kind:'switch',symbol:'switch-3way',function:'Interruptor paralelo',domain:'power-ac',prefix:'S'},
    'resid-four-way':{family:'residencial',kind:'switch',symbol:'switch-4way',function:'Interruptor intermediário',domain:'power-ac',prefix:'S'}
  };
  const infer=(type)=>{
    if(profiles[type])return profiles[type];
    if(/^contato-auxiliar-/.test(type))return{family:'comando',kind:'aux-contact',symbol:'aux-contact',function:'Contato auxiliar',domain:'control',prefix:'KA'};
    if(type==='contato-auxiliar-disjuntor')return{family:'protecao',kind:'breaker-aux-contact',symbol:'aux-contact',function:'Contato auxiliar de disjuntor',domain:'control',prefix:'QF'};
    if(type==='contato-rele-termico-9596-9798')return{family:'protecao',kind:'thermal-aux-contact',symbol:'thermal-aux-contact',function:'Contatos auxiliares do relé térmico',domain:'control',prefix:'FR'};
    if(/^sinaleiro-/.test(type))return{family:'sinalizacao',kind:'pilot-light',symbol:'pilot-light',function:'Sinalização luminosa',domain:'control',prefix:'H'};
    if(/^borne-/.test(type)||type==='borne-passagem'||type==='barramento-neutro')return{family:'conexao',kind:'terminal',symbol:'terminal',function:'Conexão elétrica',domain:'mixed',prefix:'X'};
    return{family:'outros',kind:type||'component',symbol:'generic',function:'Componente elétrico',domain:'mixed',prefix:'X'};
  };
  const terminalRole=name=>{
    const n=String(name||'').trim().toUpperCase();
    if(!n)return'unknown';
    if(/^(L[1-4]|R|S|T|LINE|1L1|3L2|5L3)$/.test(n))return'power-input';
    if(/^(T[1-4]|U|V|W|2T1|4T2|6T3)$/.test(n))return'power-output';
    if(/^(U1|V1|W1|U2|V2|W2)$/.test(n))return'motor-winding';
    if(/^(A1|A2)$/.test(n))return'coil';
    if(/^(13|14|23|24|33|34|43|44|97|98)$/.test(n))return'contact-no';
    if(/^(11|12|21|22|31|32|41|42|95|96)$/.test(n))return'contact-nc';
    if(/^(N|NEUTRO)$/.test(n))return'neutral';
    if(/^(PE|TERRA|GND)$/.test(n))return'protective-earth';
    if(/^(\+|\-|\+24V|24V|0V|VCC|COM)$/.test(n))return'dc-control';
    return'terminal';
  };
  const apply=(node,type)=>{
    if(!node)return null;
    const meta={...infer(type||node.dataset.type)};
    node.dataset.techFamily=meta.family;
    node.dataset.techKind=meta.kind;
    node.dataset.diagramSymbol=meta.symbol;
    node.dataset.techFunction=meta.function;
    node.dataset.electricalDomain=meta.domain;
    node.dataset.tagPrefix=meta.prefix;
    node.querySelectorAll('[data-terminal]').forEach(t=>{
      t.dataset.terminalRole=terminalRole(t.dataset.terminal);
      t.dataset.terminalName=t.dataset.terminal||'';
    });
    return meta;
  };
  window.TechRibComponentMeta={profiles,infer,terminalRole,apply,get:type=>({...infer(type)})};
})();
