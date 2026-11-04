(()=>{
  'use strict';
  const STYLE_ID='techrib-example-test-guides-v1-style';
  const PANEL_CLASS='techrib-example-test-guide';
  const examples=()=>Array.isArray(window.TECHRIB_STANDARD_EXAMPLES_V34)?window.TECHRIB_STANDARD_EXAMPLES_V34:[];
  const byId=id=>examples().find(e=>String(e?.id||'')===String(id||''));
  const guide=(steps,expected='',tip='')=>({steps,expected,tip});

  const MANUAL={
    'premium-dali2-dt8-tunable-white-g60-v1-test':guide([
      'Clique em ▶ Executar. O Application Controller e o driver DT8-TW devem indicar alimentação e barramento DALI válidos.',
      'Clique em BCAST ON. O nível vai para 100% e os canais CW/WW passam a fornecer tensão PWM média equivalente.',
      'Use CCT − e CCT + no controlador. Em temperaturas mais baixas, o canal WW aumenta; em temperaturas mais altas, o canal CW aumenta.',
      'Confira os dois voltímetros: a soma relativa dos canais muda com a temperatura de cor enquanto o nível geral permanece comandado pelo DALI.',
      'Use LEVEL − / LEVEL + para reduzir ou aumentar o brilho. Em 0% ambos os canais devem cair para aproximadamente 0 V.'
    ],'DT8 permite controlar nível e temperatura de cor usando um único endereço DALI. O exemplo usa dois canais, Cold White e Warm White, e não precisa de ESP32.'),
    'premium-dali2-dt8-rgbw-g61-v1-test':guide([
      'Clique em ▶ Executar. PS24 deve alimentar o estágio RGBW em 24 V e o Application Controller deve energizar o barramento DALI.',
      'Clique em BCAST ON para colocar o nível em 100%. O preview do módulo deve acender inicialmente em WHITE.',
      'Clique em COR ▶ para percorrer WHITE, RED, GREEN, BLUE, AMBER, CYAN e MAGENTA. O preview e as quatro tensões R/G/B/W acompanham a seleção.',
      'Use LEVEL − / LEVEL + para variar o brilho da cor selecionada. Os voltímetros mostram a tensão PWM média equivalente de cada canal.',
      'Clique em BCAST OFF para zerar os quatro canais.'
    ],'Um control gear DT8 RGBW usa um único endereço DALI para controlar vários canais de cor. O estágio de potência é alimentado por 24 Vcc e não há ESP32 no exemplo.'),

'premium-dali2-relay-8ch-g58-v1-test':guide([
  'Clique em ▶ Executar. O Application Controller deve energizar a linha DALI e o DT7-8CH deve indicar DALI e AUX ligados.',
  'Clique em SCAN: o controlador deve contabilizar os 8 endereços do módulo DT7.',
  'Clique em BCAST ON. Os LEDs ADDR 1 a 8 devem ficar verdes e os oito contatos COM/NO devem fechar.',
  'As oito lâmpadas devem acender. BCAST OFF abre todos os relés e apaga as cargas.',
  'Desligue a alimentação auxiliar L/N do módulo: mesmo com DALI presente, o atuador deve indicar SEM ALIMENTAÇÃO AUX. e manter os contatos desligados.'
],'O exemplo demonstra um relé DALI-2 DT7 de alta densidade. Diferente dos pequenos módulos alimentados apenas pelo barramento, este modelo exige alimentação auxiliar AC, como ocorre em módulos DIN reais de oito canais.'),

'premium-dali2-010v-dt5-g59-v1-test':guide([
  'Clique em ▶ Executar. O controlador deve alimentar o barramento DALI e o conversor DT5 deve acender o LED BUS.',
  'A saída começa em 0 V. Clique em LEVEL + no Application Controller para aumentar o nível em passos de 25%.',
  'Confira no conversor e no voltímetro: 25% ≈ 2,5 V; 50% ≈ 5,0 V; 75% ≈ 7,5 V; 100% ≈ 10,0 V.',
  'LEVEL − reduz a tensão nos mesmos passos. BCAST OFF leva o nível a 0% e a saída a 0 V; BCAST ON leva diretamente a 100% / 10 V.',
  'A saída AO+/AO− é uma fonte elétrica DC real do simulador, não apenas uma indicação visual.'
],'O DT5 é o tipo DALI usado para conversão do nível digital em tensão analógica 0/1–10 V, permitindo integrar drivers e reatores analógicos ao barramento DALI.'),
    'premium-dali2-switch-actuator-1ch-g56-v1-test':guide([
      'Clique em ▶ Executar. O Application Controller deve energizar a linha DALI e o RM1 deve indicar BUS ligado.',
      'Clique em SCAN: o controlador deve identificar 1 endereço DALI correspondente ao relé DT7 de um canal.',
      'Clique em BCAST ON: o LED ADDR 1 deve acender verde forte, COM1/NO1 deve fechar e L1 deve acender em 127 V.',
      'Clique em BCAST OFF: o contato abre e L1 apaga.',
      'O relé é um Control Gear DALI-2 DT7; não há ESP32 no exemplo.'
    ],'O exemplo comprova um relé DALI-2 de um canal: o barramento comanda o contato seco e a carga de rede passa somente pelo COM/NO.'),

    'premium-dali2-switch-actuator-2ch-g57-v1-test':guide([
      'Clique em ▶ Executar e confirme BUS ligado no RM2.',
      'Clique em SCAN: o controlador deve contar 2 endereços DALI, um para cada canal do atuador.',
      'Clique em BCAST ON: os LEDs ADDR 1 e ADDR 2 acendem, os dois contatos COM/NO fecham e L1/L2 acendem.',
      'Clique em BCAST OFF: os dois contatos abrem e as lâmpadas apagam.',
      'Os canais são eletricamente independentes; o exemplo não utiliza ESP32.'
    ],'O módulo representa a classe real de atuadores DALI-2 DT7 de dois canais, com dois relés e dois endereços de saída.'),


    'premium-dali2-mains-input-4ch-g54-v1-test':guide([
      'Clique em ▶ Executar. O Application Controller deve alimentar o barramento DALI e o módulo DIN230 deve indicar BUS ligado.',
      'Acione S1. O interruptor aplica aproximadamente 220 Vca entre IN1 e N do módulo de entrada.',
      'O LED IN1 deve acender, EVENT deve piscar e o atuador DT7 deve fechar o endereço/canal 1, ligando L1.',
      'Abra S1: a tensão em IN1 volta a 0 V, o módulo envia OFF e L1 apaga. Repita com S2…S4.',
      'Observe a linha de tensão no frontal do módulo: ela mostra os valores medidos em IN1…IN4. Não há ESP32.'
    ],'Demonstra uma interface DALI-2 que recebe sinais de tensão de rede. As entradas são eletricamente medidas; não são botões fictícios no módulo.'),

    'premium-dali2-universal-input-din-6ch-g55-v1-test':guide([
      'Clique em ▶ Executar. DIN-IN6 e os dois atuadores DT7 devem estar no mesmo barramento DALI.',
      'Pressione a botoeira S1: o módulo detecta o contato seco entre C1 e IN1, o LED 1 acende momentaneamente e EVENT pisca.',
      'O endereço DALI 1 é alternado e L1 liga. Um novo toque em S1 desliga L1.',
      'S2…S4 comandam os canais 2…4 do primeiro atuador. S5 e S6 comandam os endereços 5 e 6 no segundo atuador.',
      'As seis botoeiras são componentes reais do simulador ligados fisicamente ao módulo; não há ESP32.'
    ],'Demonstra um módulo DIN DALI-2 para interruptores, botoeiras e contatos livres de potencial. O exemplo usa seis entradas independentes.'),

'premium-dali2-push-coupler-4ch-g52-v1-test':guide([
  'Clique em ▶ Executar. DALI-CTRL deve energizar o barramento; PB4 e RM4 devem indicar BUS ativo.',
  'Pressione a botoeira S1. PB4 reconhece a entrada 1 e gera um evento DALI-2 Part 301; o indicador EVENT pisca.',
  'O Application Controller traduz o evento para o endereço 1 do atuador DT7. O LED do canal 1 acende e L1 liga.',
  'Solte S1: a lâmpada permanece no estado comandado. Pressione S1 novamente para alternar L1 para OFF.',
  'Repita S2, S3 e S4. Cada botoeira deve comandar somente o canal/lâmpada de mesmo número. Não há ESP32.'
],'Este exemplo mostra a cadeia DALI-2 completa para botoeiras convencionais: contato seco → Push Button Coupler Part 301 → Application Controller → Control Gear DT7 → carga.'),

'premium-dali2-switch-actuator-4ch-g53-v1-test':guide([
  'Clique em ▶ Executar e confirme BUS ativo no RM4.',
  'Clique em SCAN no DALI-CTRL. O controlador deve detectar 4 endereços DALI correspondentes aos quatro canais do atuador.',
  'Clique em BCAST ON. Os quatro relés DT7 devem fechar e L1 a L4 devem acender.',
  'Os quatro LEDs de endereço do RM4 devem ficar verdes e bem visíveis.',
  'Clique em BCAST OFF. Todos os contatos abrem e as quatro lâmpadas apagam. Não usa ESP32.'
],'O módulo representa um switch actuator DALI-2 DT7/Part 208 de quatro canais, com quatro endereços DALI independentes e contatos NA de 16 A.'),


'premium-dali2-sensor-pir-lux-g50-v1-test':guide([
  'Clique em ▶ Executar. O controlador DALI deve receber 220 Vca e alimentar o barramento; o sensor PIR-LUX deve indicar BUS ativo.',
  'Confirme que o sensor inicia em aproximadamente 150 lux e AUSENTE. O LED Driver deve ficar em standby e o voltímetro LED-OUT deve indicar 0 V.',
  'Clique em TEST PRES. no sensor. Como o nível está abaixo de 400 lux, o sensor envia evento OCCUPIED, o controller transmite ON e o LED Driver passa para 100%.',
  'O voltímetro ligado em LED+/LED− deve indicar aproximadamente 24 Vcc.',
  'Clique em AUSENTE: o evento VACANT faz o controller enviar OFF e a saída volta para 0 V. Você também pode elevar LUX acima do limiar para testar a decisão automática.'
],'Demonstra a cadeia DALI-2 correta: o input device fornece informação, o application controller toma a decisão e o control gear (LED Driver DT6) atua sobre a carga.'),

'premium-dali2-led-driver-dt6-g51-v1-test':guide([
  'Clique em ▶ Executar. DALI-CTRL e o LED Driver devem receber 220 Vca; o driver deve indicar PWR e DALI ativos.',
  'Clique em BCAST ON no Application Controller.',
  'O LED OUT do driver deve acender, o display deve mostrar LEVEL 100% e o voltímetro LED-OUT deve indicar aproximadamente 24 Vcc.',
  'Clique em BCAST OFF. O driver volta para standby e a saída elétrica cai para 0 V.',
  'Use SCAN no controlador: com o driver conectado, a contagem de control gear detectado deve ser atualizada pelo runtime.'
],'O G51 representa um control gear DALI-2 DT6 de tensão constante 24 V. A saída elétrica só existe quando rede, barramento e comando DALI estão simultaneamente válidos.'),


'premium-dali2-psu-250ma-g48-v1-test':guide([
  'Clique em ▶ Executar. A rede de 220 Vca deve alimentar PS-DALI pelos bornes L/N.',
  'O LED BUS / POWER OK da fonte deve ficar verde quando a entrada AC estiver válida.',
  'Observe o voltímetro V-DALI ligado em DA+ e DA−: ele deve indicar aproximadamente 16 Vcc.',
  'Desligue ou interrompa a alimentação AC da fonte para confirmar que o barramento DALI perde a tensão.',
  'Este exemplo prova a fonte de barramento eletricamente; não há ESP32.'
],'Uma fonte DALI dedicada fornece a alimentação elétrica do barramento para os dispositivos DALI. O modelo TechRib representa a classe DIN de 250 mA.'),

'premium-dali2-app-controller-g49-v1-test':guide([
  'Clique em ▶ Executar. O controlador deve receber 220 Vca em L/N e mostrar DALI-2 CONTROLLER READY.',
  'O voltímetro BUS-16V deve indicar aproximadamente 16 Vcc em DA+/DA−, pois este controlador possui fonte DALI integrada.',
  'Clique em SCAN: o LED TX pisca e o display registra a varredura da linha.',
  'Clique em BCAST ON e depois BCAST OFF. O display deve mostrar o último estado de broadcast e o LED TX deve piscar a cada comando.',
  'O próximo componente DALI de carga poderá responder a esses broadcasts; este exemplo valida controlador, barramento e comandos sem ESP32.'
],'Application Controllers DALI executam a lógica do sistema e enviam comandos para os control gears. Este componente representa uma versão DIN de uma linha com Ethernet e PSU DALI integrada.'),

'premium-knx-binary-input-16ch-g46-v1-test':guide([
  'Clique em ▶ Executar. PS-KNX deve alimentar BI16 e SW16 pelo barramento KNX TP1.',
  'Pressione uma das 16 botoeiras externas S1…S16. Cada uma está ligada fisicamente ao par C/IN do canal correspondente da Entrada Binária BI16.',
  'Enquanto a botoeira estiver pressionada, o LED verde do canal acende; na borda de acionamento o TX pisca e um telegrama KNX é gerado.',
  'SW16 alterna o relé do mesmo número e a lâmpada correspondente em 127 V. Pressione a mesma botoeira novamente para desligar.',
  'Repita com vários canais para verificar independência entre as 16 entradas e 16 saídas. Não há ESP32.'
],'O BI16 é agora um componente oficial da biblioteca. Ele representa uma entrada KNX de contact scanning para contatos secos reais; as botoeiras externas são ligadas aos pares C1/IN1 até C16/IN16.'),

'premium-knx-binary-input-8ch-230v-g47-v1-test':guide([
  'Clique em ▶ Executar. PS-KNX deve alimentar BI8-230 e SW8 pelo barramento KNX.',
  'Pressione S1. A botoeira fecha 13–14 e aplica 127 Vca fisicamente em IN1, enquanto C1 está ligado ao neutro.',
  'O LED do canal 1 em BI8-230 deve acender, a indicação deve mostrar aproximadamente 127 V AC e o TX deve piscar.',
  'A borda de acionamento alterna o canal 1 do SW8: pressione S1 uma vez para ligar L1 e novamente para desligar.',
  'Repita com S2…S8. Este módulo é para tensão externa 10–230 V AC/DC; não use seus bornes C/IN como simples contato seco.'
],'A versão 10–230 V AC/DC detecta tensão de campo real. Neste exemplo cada botoeira aplica 127 Vca à entrada correspondente e o módulo converte a borda de acionamento em telegrama KNX.'),

'premium-knx-interface-4ch-g44-v1-test':guide([
  'Clique em ▶ Executar. A fonte PS-KNX deve alimentar o barramento em 30 Vcc; IN4 e SW4 devem indicar BUS ligado.',
  'Use os botões frontais 1 a 4 da interface IN4 para simular quatro botoeiras/interruptores convencionais ligados às entradas.',
  'Ao pressionar um número, o LED daquela entrada deve acender e o TX deve indicar o envio do telegrama KNX.',
  'O atuador SW4 deve alternar o canal correspondente: o LED superior do canal acende e a lâmpada do mesmo número liga em 127 V.',
  'Pressione novamente o mesmo canal para desligar a saída. O exemplo não usa ESP32: a interface de entrada e o atuador conversam diretamente pelo barramento KNX.'
],'A interface de botoeira é o módulo usado para conectar interruptores e botoeiras convencionais ao barramento KNX. No simulador, os botões frontais representam o fechamento desses contatos externos.'),

'premium-knx-binary-input-8ch-g45-v1-test':guide([
  'Clique em ▶ Executar. PS-KNX deve energizar o barramento. BI8 e SW8 devem mostrar BUS ligado.',
  'Pressione uma botoeira externa S1…S8. Cada botoeira está ligada fisicamente ao respectivo par C/IN da Entrada Binária BI8.',
  'O LED do canal acende enquanto o contato está fechado; na pressão o TX pisca e um telegrama KNX é enviado.',
  'O atuador SW8 alterna a saída do mesmo número, fechando COM/NO e ligando a lâmpada correspondente. Pressione novamente para desligar.',
  'Acione vários canais para testar independência entre entradas e saídas. Não há ESP32 neste exemplo.'
],'A Entrada Binária KNX 8CH agora existe como componente oficial da biblioteca e recebe contatos secos reais. Os pares C1/IN1 até C8/IN8 são ligados às botoeiras externas.'),
    'premium-knx-switch-24ch-g43-v1-test':guide([
      'Clique em ▶ Executar. PS-KNX deve alimentar o barramento e SW24 deve indicar BUS ligado.',
      'Use os botões manuais 1 a 24 no frontal do atuador.',
      'Ao ligar um canal, o LED verde superior daquele número deve acender com brilho forte e o contato COM/NO correspondente deve fechar.',
      'A lâmpada de mesmo número deve acender em 127 V. Os demais canais permanecem independentes.',
      'Acione vários canais ao mesmo tempo para testar a operação de alta densidade e clique novamente em cada botão para desligar.'
    ],'O exemplo demonstra um atuador KNX compacto de 24 saídas, classe encontrada em equipamentos DIN de 12 módulos. Não há ESP32: o próprio atuador é o equipamento KNX de saída.'),

    'premium-knx-switch-2ch-g41-v1-test':guide([
      'Clique em ▶ Executar. A fonte PS-KNX deve receber a rede AC e alimentar o TP1 em aproximadamente 30 Vcc.',
      'SW2 deve indicar BUS ligado e 2 CANAIS PRONTOS.',
      'Clique no botão manual 1: o LED superior do canal 1 acende forte, COM1/NO1 fecha e somente L1 acende.',
      'Clique no botão 2: L2 acende independentemente de L1. Clique novamente para desligar cada saída.',
      'O exemplo não usa ESP32: o atuador KNX é o próprio equipamento de saída.'
    ],'Este é um switch actuator KNX: recebe comandos pelo barramento e realiza liga/desliga de cargas através de relés independentes. O teste frontal permite conferir cada canal sem controlador externo.'),
    'premium-knx-switch-20ch-g42-v1-test':guide([
      'Clique em ▶ Executar e confirme BUS ligado no SW20.',
      'Use os botões manuais 1 a 20. Cada LED verde superior deve ficar claramente visível quando o canal estiver ligado.',
      'Cada contato COM/NO comanda somente a lâmpada do mesmo número.',
      'Acione vários canais simultaneamente para verificar que as 20 saídas são independentes.',
      'Desligue PS-KNX: o módulo perde o barramento e deixa de aceitar novos comandos manuais.'
    ],'O modelo de 20 canais representa os atuadores KNX de alta densidade encontrados em quadros grandes, mantendo contatos independentes e operação manual por canal.'),

    'premium-knx-bus-psu-g39-v1-test':guide([
      'Clique em ▶ Executar. A REDE deve alimentar a fonte PS-KNX em L/N.',
      'O LED RUN / U OK da PS-KNX deve acender e o barramento KNX+/KNX− deve ficar em aproximadamente 30 Vcc.',
      'Com o barramento presente, o atuador AK4 deve indicar BUS ligado / canais prontos.',
      'Clique no botão manual do canal 1 no AK4. O contato COM1/NO1 fecha e L1 deve acender.',
      'Desligue a alimentação AC da PS-KNX para confirmar que o atuador perde o barramento e deixa de aceitar comando manual.'
    ],'Este exemplo prova a função da fonte KNX: converter a rede AC em uma linha TP1 de 30 Vcc com drossel integrada e alimentar dispositivos do barramento.'),
    'premium-knx-shutter-4ch-g40-v1-test':guide([
      'Clique em ▶ Executar. PS-KNX deve alimentar o barramento e PS24 deve alimentar as cargas de persiana.',
      'No JAL4, use ▲ do canal 1. P1 deve começar a subir enquanto P2, P3 e P4 permanecem paradas.',
      'Clique ■ no canal 1 para parar; depois clique ▼ e veja P1 descer.',
      'Repita nos canais 2, 3 e 4. Cada par de relés é intertravado: o comando de uma direção desliga automaticamente a direção oposta.',
      'Observe os LEDs ▲/▼ do canal correspondente: eles devem ficar bem visíveis quando o respectivo relé estiver ativo.'
    ],'O atuador KNX de persiana usa dois relés intertravados por motor. O barramento KNX alimenta a eletrônica do módulo; os contatos de saída comandam a alimentação da carga.'),
    'premium-knx-relay-12ch-g37-v1-test':guide([
      'Clique em ▶ Executar e confirme a alimentação de PS-KNX.',
      'AK12 deve indicar KNX TP1 • 12 CANAIS PRONTOS.',
      'Clique nos botões manuais 1 a 12 do frontal.',
      'Cada botão deve fechar somente o respectivo COM/NO e acender apenas a lâmpada do mesmo número.',
      'Teste vários canais simultaneamente e depois desligue cada um separadamente.',
      'O exemplo não usa ESP32.'
    ],'Os 12 relés devem operar independentemente e as 12 cargas devem acompanhar seus respectivos canais.'),
    'premium-knx-relay-16ch-g38-v1-test':guide([
      'Clique em ▶ Executar e confirme a alimentação de PS-KNX.',
      'AK16 deve indicar KNX TP1 • 16 CANAIS PRONTOS.',
      'Use os botões manuais 1 a 16 do frontal.',
      'Cada botão deve fechar somente seu contato COM/NO e acender apenas a lâmpada correspondente.',
      'Acione vários canais juntos para verificar a independência dos 16 relés.',
      'O botão PROG representa somente o modo de programação KNX; ele não comanda cargas.'
    ],'Os 16 canais devem funcionar separadamente, como em um atuador KNX DIN de alta densidade.'),

    'premium-knx-relay-4ch-g35-v1-test':guide([
      'Clique em ▶ Executar e confirme que PS-KNX está alimentada pela rede 127 V.',
      'O atuador AK4 deve indicar KNX TP1 • 4 CANAIS PRONTOS quando receber 24 Vcc em KNX+/KNX−.',
      'Clique no botão manual 1 do próprio AK4. O LED do canal 1 deve acender, COM1/NO1 fechar e L1 acender.',
      'Repita nos botões 2, 3 e 4 e observe L2, L3 e L4 independentemente.',
      'Clique novamente em qualquer canal para desligá-lo. O botão PROG apenas representa o modo de programação KNX e não aciona carga.'
    ],'Cada canal deve comutar somente sua própria carga. O exemplo prova a operação manual local do atuador KNX sem exigir ESP32.'),
    'premium-knx-relay-8ch-g36-v1-test':guide([
      'Clique em ▶ Executar e confirme PS-KNX ligada.',
      'O atuador AK8 deve indicar KNX TP1 • 8 CANAIS PRONTOS.',
      'Use os botões manuais 1 a 8 no frontal do atuador.',
      'Cada botão deve fechar apenas o respectivo contato COM/NO e acender somente a lâmpada do mesmo número.',
      'Teste vários canais simultaneamente e depois desligue-os individualmente.',
      'O exemplo não usa ESP32: trata-se de um atuador KNX DIN com operação manual local.'
    ],'Os oito relés devem operar de forma independente, reproduzindo o comportamento de um atuador KNX multicanal de quadro.'),
    'premium-thread-border-router-g33-v1-test':guide([
      'Clique em ▶ Executar. Não há ESP32 neste exemplo: PS5 alimenta TBR1/KR1 e PS3V3 alimenta o Matter Device.',
      'Confirme PWR, LAN e THREAD no TBR1 e THREAD no MD1.',
      'Clique em MATTER ON no TBR1. MD1 recebe o comando, OUT sobe para 3,3 V, KR1 fecha COM1/NO1 e o sinaleiro verde H1 acende.',
      'Clique em MATTER OFF: OUT volta para 0 V, KR1 abre e H1 apaga.',
      'Desative BACKBONE e tente um novo comando: sem o Border Router online, o endpoint não deve aceitar um novo comando vindo da infraestrutura.'
    ],'Agora o efeito é visível numa carga real: TBR1 faz a ponte Thread ↔ IPv6/LAN; MD1 é o dispositivo Matter; KR1/H1 apenas mostram a atuação elétrica.'),
    'premium-matter-device-g34-v1-test':guide([
      'Clique em ▶ Executar. Este exemplo também funciona sem ESP32 auxiliar.',
      'PS5 alimenta TBR1/KR1 e PS3V3 alimenta MD1. Confirme THREAD pronto.',
      'Clique em MATTER ON no TBR1: MD1 mostra MATTER RX • ON e OUT sobe para 3,3 V.',
      'KR1 deve energizar, fechar COM1/NO1 e alimentar a lâmpada residencial L1 em 127 V.',
      'Clique em MATTER OFF: OUT = 0 V, KR1 abre e L1 apaga.',
      'Desligue BACKBONE e tente um novo comando para observar a perda da rota externa.'
    ],'A lâmpada agora é o componente resid-lampada válido da biblioteca, ligada fisicamente ao contato do relé. O ESP32 anterior foi removido porque servia apenas como fonte de 3,3 V.'),
    'premium-matter-thread-g31-v1-test':guide([
      'Clique em ▶ Executar.',
      'Confirme MT-R como ROUTER e MT-E como END-DEVICE. PWR, UART e THREAD devem indicar rede pronta nos dois módulos.',
      'Clique em ENVIAR MATTER no MT-E. O enlace entre os dois ESP32-H2 é sem fio, usando Thread/802.15.4.',
      'O MT-R deve indicar MATTER RX; sua TXD gera atividade elétrica e chega ao GPIO16 do ESP-A.',
      'Repita no sentido contrário usando ENVIAR MATTER no MT-R.',
      'Use TROCAR ROLE para observar que a rede deixa de ficar pronta se nenhum nó estiver no papel ROUTER.'
    ],'Matter é tratado como aplicação sobre IP/Thread; o componente representa o ESP32-H2 como coprocessador de rádio 802.15.4 conectado ao ESP32 host por UART.'),
    'premium-knx-g32-v1-test':guide([
      'Clique em ▶ Executar e confirme que PS-KNX está alimentada pela rede.',
      'Os dois ESP32 alimentam suas interfaces em 3,3 V e trocam dados com elas por RXD/TXD.',
      'Confirme que KNX+ e KNX− ligam KNX-A e KNX-B no mesmo barramento e que o LED BUS indica barramento pronto.',
      'No KNX-A, clique em ENVIAR TELEGRAMA. O KNX-B deve indicar RX TELEGRAMA.',
      'Durante a recepção, TXD do KNX-B gera atividade elétrica para GPIO16 do ESP-B.',
      'Repita no sentido contrário usando ENVIAR TELEGRAMA no KNX-B.'
    ],'O exemplo deve manter dois nós no mesmo par KNX TP1. O telegrama viaja pelo barramento KNX+/KNX−; a UART existe apenas entre cada interface e seu ESP32.'),
    'premium-lora-g29-v1-test':guide([
      'Clique em ▶ Executar.',
      'Confirme PWR e SPI acesos em LORA-A e LORA-B. Os dois módulos devem indicar 433 MHz • PRONTO e mostrar pelo menos um par RF.',
      'No LORA-A, clique em TRANSMITIR PACOTE. O LED TX de A acende; no LORA-B o LED RX acende e DIO0 vai eletricamente para HIGH.',
      'Observe o DIO0 de LORA-B chegar ao GPIO26 do ESP-B como indicação RX Done.',
      'Repita no sentido contrário usando TRANSMITIR PACOTE em LORA-B.',
      'Não deve existir fio entre LORA-A e LORA-B: o enlace de 433 MHz é simulado pelo runtime de rádio.'
    ],'Os dois SX1278 devem comunicar sem fio quando alimentados, com SPI completo e na mesma frequência. O módulo receptor sinaliza o pacote por DIO0 HIGH; o ESP32 não força artificialmente o estado RF.'),
    'premium-zigbee-g30-v1-test':guide([
      'Clique em ▶ Executar.',
      'Confirme ZB-C como COORDINATOR e ZB-R como ROUTER. PWR, UART e NET devem acender nos dois módulos.',
      'No ZB-R, clique em ENVIAR FRAME. O LED TX do Router acende e o Coordenador indica RX FRAME.',
      'Durante a recepção, TXD do módulo receptor gera atividade elétrica na UART e chega ao GPIO16 do respectivo ESP32.',
      'Repita enviando pelo Coordenador para testar o sentido inverso.',
      'O botão TROCAR ROLE permite alterar o papel do módulo; se não existir Coordenador na mesma PAN/canal, a rede deve deixar de ficar pronta.'
    ],'A rede Zigbee deve exigir pelo menos um Coordenador e outro nó no mesmo PAN/canal. A comunicação RF é sem fio; cada CC2530 troca dados com seu ESP32 pela UART RXD/TXD.'),
    'industrial-envasadora-processo':guide([
      'Clique em ▶ Executar.',
      'No painel ENVASADORA, clique em INICIAR AUTO (ou use RUN/VALVE pelo CTRL).',
      'Observe a garrafa avançar, parar centralizada sob o bico e só então iniciar o enchimento.',
      'Confirme que o nível sobe gradualmente e que a garrafa só parte depois de cheia.',
      'Pare o processo e confirme que esteira e válvula retornam ao repouso.'
    ],'A garrafa deve parar sob o bico antes do fluxo; nunca deve encher fora da posição de envase.'),
    'industrial-esteira-rejeicao':guide([
      'Clique em ▶ Executar.',
      'Inicie a esteira pelo comando START do exemplo.',
      'Acompanhe a passagem das peças pelo sensor de inspeção.',
      'Observe uma peça NOK ser desviada pelo rejeitador e teste STOP/RESET.'
    ],'A esteira deve transportar, detectar e rejeitar peças conforme a sequência.'),
    'industrial-esteira-pesagem':guide([
      'Clique em ▶ Executar.',
      'No painel da estação, selecione os pesos de teste 450 g, 750 g e 1200 g.',
      'Observe a leitura do módulo de pesagem para cada valor.',
      'Compare a decisão: 500–1000 g aprovado; fora dessa faixa rejeitado.'
    ],'750 g deve ser aprovado; 450 g e 1200 g devem ser rejeitados.'),
    'industrial-camara-fria-convencional':guide([
      'Clique em ▶ Executar.',
      'Confirme QF1 ligado e os relés térmicos sem disparo.',
      'No painel da câmara, altere a temperatura para provocar pedido de refrigeração.',
      'Observe KM-COMP/KM-FAN, compressor, ventilador e a queda de temperatura.',
      'Abra a porta ou altere a temperatura e observe a resposta do controle.'
    ],'Compressor e ventilador devem atuar de acordo com o termostato e a alimentação real.'),
    'industrial-camara-fria-esp32':guide([
      'Clique em ▶ Executar.',
      'Confirme QF1 ligado e os dois relés térmicos em condição normal.',
      'Altere a temperatura no painel da câmara/sensor LM35.',
      'Observe GPIO25/GPIO26, KR1, os contatores e as cargas da câmara.',
      'Teste também porta/temperatura para acompanhar a resposta do ESP32.'
    ],'O ESP32 deve comandar compressor e ventilador conforme a temperatura medida.'),
    'industrial-irrigacao-automatica':guide([
      'Clique em ▶ Executar.',
      'Clique em INICIAR CICLO no painel de irrigação.',
      'Observe a Zona 1 abrir, a bomba ligar e a umidade Z1 subir.',
      'Perto de 65%, acompanhe a troca automática para a Zona 2.',
      'Use Z1/Z2 SECO e MOLHADO para forçar os sensores e testar a sequência.'
    ],'Após Z1 e Z2 atingirem a faixa úmida, válvulas e bomba devem desligar.'),
    'industrial-irrigacao-esp32':guide([
      'Clique em ▶ Executar.',
      'Use o painel de irrigação para iniciar o ciclo e simular solo seco/molhado.',
      'Observe GPIO25 comandar a bomba e GPIO26/GPIO27 as válvulas Z1/Z2.',
      'Acompanhe GPIO34/GPIO35 refletirem os sensores de umidade.',
      'Verifique a troca automática entre as duas zonas.'
    ],'O ESP32 deve irrigar uma zona por vez e encerrar quando as duas atingirem a umidade alvo.'),
    'industrial-compressor-esp32':guide([
      'Clique em ▶ Executar.',
      'Acione a partida física para armar o controle.',
      'No painel COMPRESSOR • TESTE DE PRESSÃO, selecione pressão BAIXA.',
      'Observe GPIO25, relé de interface, KM1 e o compressor entrarem em marcha.',
      'Selecione pressão ALTA e teste também STOP, emergência e RT1.'
    ],'Pressão baixa pede compressor; pressão alta interrompe o compressor.'),
    'industrial-ats-rede-gerador':guide([
      'Clique em ▶ Executar. Com QF-REDE e QF-GER fechados, KT-RET deve temporizar e depois KM-REDE alimenta a carga.',
      'Abra QF-REDE para simular falta da Rede: FF1 muda para 11–12 e energiza KT-GER.',
      'Quando KT-GER concluir o tempo ajustado, seu contato 15–18 envia 220 V ao START do gerador.',
      'Após partida/estabilização, READY libera KM-GER pelo intertravamento NC de KM-REDE e a carga volta a funcionar.',
      'Feche QF-REDE: KT-RET temporiza o retorno; 15–16 mantém o gerador durante a espera e 15–18 libera KM-REDE depois.',
      'Para alterar os tempos, dê duplo clique em KT-GER/KT-RET ou abra Propriedades.'
    ],'Os temporizadores usam contatos elétricos reais; KM-REDE e KM-GER nunca devem permanecer fechados simultaneamente.'),
    'industrial-compressor-arduino':guide([
      'Clique em ▶ Executar.',
      'Acione a partida física para habilitar o compressor.',
      'Altere/simule a pressão do reservatório entre baixa e alta.',
      'Observe D8, relé de interface, KM1 e o compressor.',
      'Teste STOP, emergência e relé térmico.'
    ],'O Arduino deve manter pressão por histerese e respeitar a cadeia de segurança.'),
    'industrial-pump-alternation':guide([
      'Clique em ▶ Executar. O exemplo deve iniciar em NÍVEL ALTO, com B1 e B2 paradas.',
      'No painel REVEZAMENTO • DUAS BOMBAS, clique em NÍVEL BAIXO • PEDIR ÁGUA.',
      'No primeiro ciclo, KA1 alterna para B1; KM1 deve armar e somente B1 deve entrar em marcha.',
      'Clique em NÍVEL ALTO • PARAR e confirme que a bomba para.',
      'Clique novamente em NÍVEL BAIXO • PEDIR ÁGUA; agora KA1 deve alternar e B2 deve assumir.',
      'Repita ALTO → BAIXO para confirmar B1 → B2 → B1 sem as duas bombas ligadas ao mesmo tempo.',
      'Dispare RT1 ou RT2 para conferir que o contato 95–96 bloqueia a respectiva bobina; abra QF1 para conferir a supervisão de FF1.'
    ],'Cada novo ciclo deve selecionar a bomba seguinte. O painel muda somente a boia B0; contatores, térmicos e relé de fase continuam decidindo eletricamente se a bomba pode funcionar.'),
    'industrial-duas-bombas-esp32':guide([
      'Clique em ▶ Executar. O estado inicial agora é NÍVEL NORMAL, com B1 e B2 paradas.',
      'Use o painel DUAS BOMBAS • ALTERNÂNCIA, visível junto ao diagrama, e mantenha o modo AUTO.',
      'Clique em NÍVEL BAIXO: B1 deve ser a primeira principal e GPIO25 deve comandar KR1/KM1.',
      'Clique em NÍVEL ALTO: B1 para e a indicação PRÓXIMA PRINCIPAL muda para B2.',
      'Volte para NÍVEL BAIXO: B2 deve entrar pelo GPIO26/KR1/KM2.',
      'Use SIMULAR SECO para bloquear imediatamente as duas bombas.',
      'Dispare RT1/RT2 para conferir a reserva saudável e observe FF1 supervisionando a mesma rede trifásica.'
    ],'A simulação deve iniciar parada; cada ciclo baixo→alto alterna B1/B2, e seco/térmico/falta de fase impedem operação insegura.'),
    'industrial-poco-artesiano-automatico':guide([
      'Clique em ▶ Executar.',
      'Selecione AUTO e simule reservatório superior pedindo água.',
      'Confirme água disponível no poço e observe KM1/bomba entrarem em marcha.',
      'Acompanhe o nível subir até o máximo.',
      'Teste falta de água no poço, STOP e relé térmico.'
    ],'A bomba deve encher o reservatório sem permitir funcionamento a seco.'),
    'premium-mmwave-g14-test':guide([
      'Clique em ▶ Executar.',
      'No próprio sensor MW1, clique em MOVIMENTO. O LED PRES deve acender e o estado deve indicar MOVIMENTO.',
      'Observe OUT ficar em HIGH, GPIO34 do ESP32 receber a presença, GPIO32 ir para HIGH, KR1 fechar e a lâmpada L1 acender.',
      'Clique em PRESENÇA PARADA. Mesmo sem movimento, OUT deve continuar HIGH e a lâmpada deve permanecer acesa.',
      'Clique em LIMPAR. O sensor volta para SEM PRESENÇA, OUT retorna a LOW, KR1 abre e a lâmpada apaga.',
      'TX e RX do LD2410C ficam livres neste exemplo; eles são usados somente para configuração/comunicação UART quando necessário.'
    ],'O mmWave deve detectar tanto movimento quanto presença estática. O ESP32 apenas lê OUT no GPIO34 e comanda o relé pelo GPIO32; ele não força artificialmente o estado do sensor.'),
    'premium-gas-co-g24-v1-test':guide([
      'Clique em ▶ Executar.',
      'Com GS1 em AR NORMAL, confira o LED PWR aceso e DO em HIGH; GPIO34 deve permanecer HIGH e H1 apagado.',
      'No próprio sensor GS1, clique em DETECTAR GÁS / CO.',
      'O estado deve mudar para GÁS/CO DETECTADO e, como a saída é ativa em LOW, DO deve cair para 0 V / LOW.',
      'O ESP32 lê GPIO34 em LOW, coloca GPIO32 em HIGH, energiza KR1 e o contato seco liga o sinaleiro vermelho H1 em 127 V.',
      'Clique em LIMPAR: DO volta a HIGH, GPIO32 retorna a LOW, KR1 abre e H1 apaga.'
    ],'O alarme deve ser gerado pelo sensor e chegar eletricamente ao ESP32 por DO. O ESP32 apenas interpreta o nível lógico e comanda o relé; sem alimentação em GS1 não deve existir saída ativa do sensor.'),
    'premium-lan8720-g27-v1-test':guide([
      'Clique em ▶ Executar.',
      'Confirme o LAN8720 alimentado em 3,3 V e o LED RMII aceso, indicando que MDC/MDIO e todos os sinais RMII estão ligados ao ESP32.',
      'No próprio PHY1, clique em CABO RJ45. O LED LINK deve acender e o estado deve indicar LINK 100M • PRONTO.',
      'Clique em TRÁFEGO. O LED ACT deve piscar; CRS_DV e RXD0 são levados eletricamente a HIGH durante o quadro de teste.',
      'Observe GPIO27 (CRS_DV) e GPIO25 (RXD0) do ESP32 responderem. REF_CLK chega ao GPIO16 no ESP32 DevKit V1 usado neste exemplo.',
      'Clique novamente em CABO RJ45 para derrubar o link e confirme que o tráfego deixa de ser aceito.'
    ],'O LAN8720 deve funcionar como PHY Ethernet RMII: o ESP32 gerencia o PHY por MDC/MDIO, usa as linhas RMII para dados e o link depende do cabo RJ45. O ESP32 não controla diretamente o estado de LINK.'),
    'premium-can-g28-v1-test':guide([
      'Clique em ▶ Executar.',
      'Confirme PWR e BUS acesos nos módulos CAN-A e CAN-B. Isso indica que os dois ESP32 têm TXD/RXD conectados e CANH/CANL formam um mesmo barramento.',
      'No módulo CAN-A, clique em SIMULAR FRAME. O LED TX de CAN-A deve acender e os LEDs RX dos dois transceivers devem responder.',
      'Durante o quadro, RXD fica eletricamente em LOW nos dois nós, representando o estado dominante CAN; depois retorna a HIGH no repouso recessivo.',
      'Repita usando SIMULAR FRAME em CAN-B para verificar comunicação no sentido oposto.',
      'Desfaça CANH ou CANL em uma cópia do exemplo para observar que BUS deixa de ficar pronto.'
    ],'Os dois transceivers devem compartilhar CANH/CANL e reproduzir no RXD de ambos o estado dominante/recessivo do barramento. TXD/RXD são sinais lógicos do controlador CAN/TWAI do ESP32; CANH/CANL são o meio diferencial.'),
    'premium-analog010-g25-v1-test':guide([
      'Clique em ▶ Executar.',
      'Gire o potenciômetro P1. Ele recebe 3,3 V do ESP32 e entrega ao terminal DAC de IO1 um valor entre 0 e 3,3 V.',
      'Observe IO1: DAC deve variar de 0–3,3 V e AO deve variar proporcionalmente de 0–10 V.',
      'O AO de IO1 está ligado ao AI de IO2. Observe IO2 receber o mesmo valor de 0–10 V e reconverter em ADC 0–3,3 V.',
      'Confirme que o ADC de IO2 está fisicamente ligado ao GPIO34 do ESP32. Em 50% do potenciômetro, espere aproximadamente DAC 1,65 V, AO/AI 5,0 V e ADC 1,65 V.',
      'Abra a rede 127 V que alimenta PS24 ou desligue a fonte: as duas interfaces devem deixar de publicar ADC/AO.'
    ],'A cadeia deve acompanhar linearmente 0 V → 0 V, 1,65 V → 5,0 V e 3,3 V → 10,0 V, com retorno proporcional ao GPIO34.'),
    'premium-w5500-g26-v1-test':guide([
      'Clique em ▶ Executar.',
      'Confirme PWR e SPI no W5500. O ESP32 deve estar ligado por GPIO18/SCLK, GPIO23/MOSI, GPIO19/MISO e GPIO5/CS; GPIO4 recebe INT e GPIO2 controla RST.',
      'No próprio ETH1, clique em CABO RJ45. O estado deve mudar para LINK 100M • PRONTO e o LED LINK deve acender.',
      'Clique em TRÁFEGO. O LED ACT deve piscar e INT deve ir temporariamente para LOW, chegando eletricamente ao GPIO4.',
      'Clique novamente em CABO RJ45 para desconectar. LINK deve apagar e TRÁFEGO não deve gerar atividade válida.',
      'Remova a alimentação de 3,3 V do W5500 para conferir que LINK/SPI deixam de ficar ativos.'
    ],'O W5500 só deve indicar LINK quando estiver alimentado, com o barramento SPI completo e o cabo RJ45 simulado como conectado. Durante TRÁFEGO, INT é ativo em LOW.'),
    'techrib-board32-4ch-demo':guide([
      'Clique em ▶ Executar.',
      'Pressione S1 e S2 e observe os canais 1 e 2 enquanto a botoeira estiver acionada.',
      'Acione S3 e S4 para testar o comportamento travado/toggle.',
      'Observe os quatro relés e as quatro lâmpadas 127 V.',
      'Abra o gerador de código para conferir o mapeamento dos quatro canais.'
    ],'Cada comando deve atuar somente no canal correspondente da placa TechRib.'),

    'resid-simple-lamp':guide(['Clique em ▶ Executar.','Clique no interruptor simples.','Observe a lâmpada acender e apagar a cada mudança de posição.'],'A fase deve ser interrompida pelo interruptor e o neutro permanecer direto na carga.'),
    'resid-three-way-lamp':guide(['Clique em ▶ Executar.','Alterne o primeiro interruptor paralelo.','Alterne o segundo interruptor paralelo.','Teste combinações diferentes dos dois pontos.'],'A lâmpada deve poder mudar de estado por qualquer um dos dois interruptores.'),
    'resid-four-way-lamp':guide(['Clique em ▶ Executar.','Alterne cada um dos dois paralelos e o interruptor intermediário.','Teste os três pontos em ordens diferentes.'],'Qualquer um dos três pontos deve conseguir alterar o estado da lâmpada.'),
    'resid-four-points-lamp':guide(['Clique em ▶ Executar.','Alterne os dois paralelos e os dois intermediários.','Teste os quatro pontos de comando individualmente.'],'A lâmpada deve poder ser comandada de qualquer um dos quatro locais.'),
    'resid-qdc-completo':guide(['Clique em ▶ Executar.','Confirme DR e disjuntores dos circuitos ligados.','Acione o interruptor da iluminação e observe a lâmpada.','Confira tomada e chuveiro energizados em seus respectivos circuitos.','Abra um disjuntor por vez para observar qual carga é desligada.'],'Iluminação, tomada e chuveiro devem responder apenas aos dispositivos de proteção do próprio circuito.'),
    'resid-qdc-iluminacao-tomadas':guide(['Clique em ▶ Executar.','Ligue DR e disjuntores.','Acione o interruptor e observe a iluminação.','Confira as duas tomadas e abra os disjuntores individualmente.'],'Cada circuito deve poder ser isolado sem desligar indevidamente os demais.'),
    'resid-qdc-chuveiro-220':guide(['Clique em ▶ Executar.','Confirme DR e disjuntor bipolar fechados.','Observe o chuveiro receber 220 V entre as duas fases.','Abra o disjuntor ou DR e confirme o desligamento da carga.'],'O chuveiro só deve aquecer quando as duas fases protegidas estiverem presentes.'),
    'resid-qdc-dps-aterramento':guide(['Clique em ▶ Executar.','Confirme DR/disjuntor fechados.','Observe a tomada energizada com fase, neutro e PE.','Abra o disjuntor para confirmar a perda de alimentação da tomada.'],'O exemplo deve evidenciar a separação entre neutro, proteção PE e circuito ativo.'),

    'industrial-esp32-relay-pump':guide(['Clique em ▶ Executar.','No ESP32, acione GPIO25 pelo controle lógico/manual disponível.','Observe o módulo de relé fechar o contato.','Confira a bobina da contatora e a bomba trifásica entrando em marcha.','Desative GPIO25 e confirme a parada.'],'O GPIO não alimenta a bomba diretamente; ele atua pelo relé e pela contatora.'),

    'premium-elevator-demo':guide(['Clique em ▶ Executar.','Use as chamadas dos andares no painel do elevador.','Observe deslocamento da cabine, abertura/fechamento de porta e indicação do piso.','Faça chamadas para andares diferentes.'],'O elevador deve atender as chamadas em sequência e atualizar a posição visual.'),
    'premium-elevator-lab':guide(['Clique em ▶ Executar.','Abra/use o laboratório do elevador.','Teste chamadas, sensores de piso, porta, freio e condições de segurança disponíveis.','Observe como cada ajuste interfere na movimentação.'],'O laboratório deve permitir testar isoladamente os sinais do sistema de elevador.'),
    'premium-elevator-wiring':guide(['Clique em ▶ Executar.','Use as botoeiras/chamadas do exemplo.','Observe a cadeia de comando da Soft Starter e o acionamento do motor/elevador.','Teste parada e proteções antes de novas chamadas.'],'O movimento deve ocorrer somente quando comando, potência e segurança estiverem liberados.'),
    'premium-elevator-s3-softstarter':guide(['Clique em ▶ Executar.','Faça uma chamada de andar.','Observe os GPIOs do ESP32 comandarem a Soft Starter digital.','Acompanhe rampa, motor, freio, sensores e parada no piso solicitado.'],'ESP32 e Soft Starter devem trabalhar juntos no ciclo de movimentação.'),
    'premium-elevator-delta-ms300-vip':guide(['Clique em ▶ Executar.','Use o painel do elevador para selecionar um andar.','Observe o Delta MS300 acelerar, movimentar e desacelerar a cabine.','Teste chamadas em sentidos diferentes e a parada no piso.'],'A frequência do inversor deve acompanhar a aceleração e desaceleração do elevador.'),
    'premium-elevator-delta-ms300-esp32':guide(['Clique em ▶ Executar.','Faça uma chamada pelo painel do elevador.','Observe o ESP32 processar sinais e comandar o Delta MS300.','Acompanhe encoder/sensores, freio e parada no andar.','Teste uma condição de segurança disponível.'],'O ESP32 deve coordenar o inversor sem ignorar os sinais de segurança.'),
    'premium-elevator-provolt-pi550-vip':guide(['Clique em ▶ Executar.','Selecione um andar no painel.','Observe o Provolt PI550 comandar a velocidade da cabine.','Acompanhe aceleração, desaceleração, freio e parada no piso.'],'A cabine deve seguir o perfil de velocidade definido pelo inversor.'),
    'premium-elevator-provolt-pi550-esp32':guide(['Clique em ▶ Executar.','Faça uma chamada de andar.','Observe ESP32, PI550 e cadeia de segurança durante o movimento.','Teste sensores/freio e uma condição de segurança antes de repetir a chamada.'],'O movimento deve ser bloqueado quando a cadeia de segurança não estiver liberada.'),

    'premium-pump-demo':guide(['Clique em ▶ Executar.','Use o painel/boias do sistema para solicitar enchimento.','Observe a bomba e o fluxo entre os reservatórios.','Altere os níveis e acompanhe a parada automática.'],'O bombeamento deve seguir os níveis mínimo/máximo do sistema.'),
    'premium-pump-lab':guide(['Clique em ▶ Executar.','Abra/use os controles do laboratório.','Force níveis baixo/alto e falta de água na origem.','Observe bomba, fluxo, alarmes e sensores.'],'O laboratório deve permitir verificar cada condição de nível separadamente.'),
    'premium-pump-wiring':guide(['Clique em ▶ Executar.','Use as boias para criar condição de pedido de água.','Acione a botoeira de partida quando o circuito exigir comando manual.','Observe contator/bomba e depois force nível máximo ou condição de parada.'],'As boias e botoeiras devem controlar a bomba pela cadeia elétrica de comando.'),
    'premium-pump-esp32':guide(['Clique em ▶ Executar.','Altere as boias/níveis do sistema.','Observe as entradas do ESP32 mudarem conforme os sensores.','Acompanhe GPIO de saída, acionamento da bomba e fluxo.','Force nível máximo ou falta de água para confirmar a parada.'],'O ESP32 deve comandar a bomba de acordo com os níveis e intertravamentos.'),

    'premium-gate-demo':guide(['Clique em ▶ Executar.','Use ABRIR/FECHAR no painel do portão.','Observe deslocamento e atuação dos fins de curso.','Teste um ciclo completo de abertura e fechamento.'],'O portão deve parar automaticamente nos limites de curso.'),
    'premium-gate-lab':guide(['Clique em ▶ Executar.','Abra/use o laboratório do portão.','Teste abrir, fechar, parar, fins de curso e sensor de obstáculo.','Observe os estados e a animação.'],'Os comandos devem respeitar limites de curso e condições de segurança.'),
    'premium-gate-wiring':guide(['Clique em ▶ Executar.','Acione as botoeiras de ABRIR e FECHAR.','Observe os sinais chegarem ao macrocomponente do portão.','Teste PARAR, fim de curso e obstáculo.'],'O portão deve responder aos comandos elétricos e interromper o movimento nas condições de parada.'),
    'premium-gate-esp32':guide(['Clique em ▶ Executar.','Use os comandos ligados ao ESP32 para abrir/fechar/parar.','Observe os GPIOs de saída e as entradas de fim de curso/obstáculo.','Complete um ciclo nos dois sentidos.'],'O ESP32 deve impedir continuidade do movimento ao atingir os limites ou detectar obstáculo.'),

    'premium-conveyor-demo':guide(['Clique em ▶ Executar.','Inicie a esteira pelo painel local.','Observe caixas, sensores e contagem durante o transporte.','Pare e reinicie o sistema.'],'A esteira deve movimentar as caixas e atualizar os sensores do processo.'),
    'premium-conveyor-lab':guide(['Clique em ▶ Executar.','Abra/use o laboratório da esteira.','Ajuste velocidade e teste partida/parada.','Simule falha ou travamento e observe os sensores.'],'O laboratório deve mostrar claramente operação normal e condição de falha.'),
    'premium-conveyor-wiring':guide(['Clique em ▶ Executar.','Pressione START e observe a esteira entrar em movimento.','Pressione STOP e depois RESET conforme necessário.','Acompanhe os contatos dos sensores de entrada/saída.'],'Os comandos físicos devem controlar o macrocomponente e os sensores devem refletir a passagem das peças.'),
    'premium-conveyor-esp32':guide(['Clique em ▶ Executar.','Use os comandos do ESP32 para START/STOP/RESET.','Observe GPIO34/GPIO35 nos sensores de entrada/saída e GPIO32 na condição de falha.','Simule movimento e travamento.'],'O ESP32 deve comandar a esteira e receber os estados reais dos sensores.'),

    'premium-crane-demo':guide(['Clique em ▶ Executar.','Use os controles da ponte rolante.','Movimente para esquerda/direita e suba/desça a carga.','Observe os fins de curso e a posição da carga.'],'A ponte deve interromper o movimento ao atingir os limites correspondentes.'),
    'premium-crane-lab':guide(['Clique em ▶ Executar.','Abra/use o laboratório da ponte rolante.','Teste movimentos, velocidade, presença/ausência de carga e fins de curso.','Observe os estados do painel durante cada condição.'],'O laboratório deve permitir testar cada eixo e proteção separadamente.'),
    'premium-crane-wiring':guide(['Clique em ▶ Executar.','Pressione as botoeiras ESQUERDA, DIREITA, SUBIR e DESCER.','Use PARAR durante um movimento.','Observe fins de curso e presença de carga.'],'As botoeiras devem comandar os movimentos sem ultrapassar os limites.'),
    'premium-crane-esp32':guide(['Clique em ▶ Executar.','Acione os comandos do ESP32 para cada movimento.','Observe GPIO34/35/32/33 nos fins de curso e GPIO39 na presença de carga.','Teste PARAR e os limites de cada eixo.'],'O ESP32 deve comandar os movimentos respeitando todos os sinais de limite.'),

    'industrial-separacao-pecas':guide(['Clique em ▶ Executar.','Pressione START para iniciar a linha.','Observe o sensor detectar as peças e o atuador separar/rejeitar quando necessário.','Use STOP e RESET para testar o ciclo.'],'A linha deve transportar, detectar e separar peças com atualização da contagem.'),
    'industrial-tanque-mistura':guide(['Clique em ▶ Executar.','Inicie o ciclo no comando do processo.','Observe enchimento até o nível definido, depois o agitador.', 'Acompanhe a etapa de drenagem e use STOP/RESET para reiniciar o processo.'],'O ciclo esperado é encher → misturar → drenar → retornar ao estado inicial.'),
    'industrial-compressor':guide(['Clique em ▶ Executar.','Confirme o disjuntor ligado e o relé térmico normal.','Pressione START e observe contator/compressor.', 'Acompanhe a pressão do reservatório e teste STOP/RT1.'],'O compressor deve operar pela cadeia de comando e refletir o aumento de pressão.'),
    'industrial-exaustao':guide(['Clique em ▶ Executar.','Confirme alimentação e disjuntor.','Pressione START e observe a rampa da Soft Starter.', 'Acompanhe o exaustor/fluxo de ar e teste STOP.'],'O exaustor deve acelerar e desacelerar suavemente pela Soft Starter.'),
    'industrial-delta-ms300-exaustor':guide(['Clique em ▶ Executar.','Use a IHM local do Delta MS300 para RUN/STOP.', 'Altere a frequência de referência.', 'Observe a frequência subir/descer e a animação do exaustor acompanhar.'],'A velocidade/fluxo do exaustor deve variar proporcionalmente à frequência do inversor.'),
    'industrial-delta-ms300-bornes':guide(['Clique em ▶ Executar.','Use a chave ligada à MI1 para FWD/STOP.', 'Use a chave ligada à MI3 para selecionar a multivelocidade.', 'Observe a frequência do MS300 e a velocidade do compressor.'],'As entradas digitais do inversor devem alterar comando e frequência sem usar a IHM local.'),
    'industrial-provolt-pi550-exaustor':guide(['Clique em ▶ Executar.','Use os controles locais do PI550 para RUN/STOP.', 'Ajuste a frequência próxima de 45 Hz e teste outra referência.', 'Observe a animação do exaustor acompanhar a frequência.'],'A saída do PI550 deve controlar gradualmente a velocidade do exaustor.'),
    'industrial-provolt-pi550-pid':guide(['Clique em ▶ Executar.','Observe o transmissor 4–20 mA e a pressão inicial.', 'Inicie o controle PID do PI550.', 'Acompanhe a frequência variar enquanto a pressão se aproxima do setpoint de ~7,2 bar.'],'O inversor deve modular a frequência automaticamente para estabilizar a pressão.'),
    'industrial-direct-start':guide(['Clique em ▶ Executar.','Confirme disjuntor e relé térmico em condição normal.', 'Pressione START e observe o contator selar pelo contato 13/14.', 'Pressione STOP e teste o disparo do relé térmico.'],'O motor deve permanecer ligado após soltar START e desligar por STOP ou proteção.'),
    'industrial-soft-starter':guide(['Clique em ▶ Executar.','Confirme o disjuntor ligado.', 'Pressione START e observe a rampa de aceleração da Soft Starter.', 'Pressione STOP e acompanhe a parada suave.'],'O motor deve partir/parar com rampa em vez de uma comutação instantânea.'),
    'industrial-pump-alternation':guide(['Clique em ▶ Executar.','Altere a boia de nível para solicitar bombeamento.', 'Selecione/teste a bomba principal conforme o comando disponível.', 'Observe qual contator/bomba entra e teste a condição de parada por nível.'],'Somente a bomba selecionada deve atender o pedido de nível nesta etapa didática.'),

    'industrial-nr12-partida-direta-24vac':guide(['Clique em ▶ Executar.','Confirme alimentação trifásica, relé de fase normal e comando 24 VCA presente.', 'Libere a emergência e pressione START.', 'Observe contator/motor e selo; teste STOP, emergência, falta de fase e relé térmico.'],'Qualquer dispositivo de segurança/proteção deve derrubar a bobina do contator.'),
    'industrial-nr12-partida-direta-12vac':guide(['Clique em ▶ Executar.','Confirme alimentação trifásica, relé de fase normal e comando 12 VCA presente.', 'Libere a emergência e pressione START.', 'Observe contator/motor e teste STOP, emergência, falta de fase e relé térmico.'],'O comando deve operar em 12 VCA e a proteção deve interromper a partida quando necessário.'),
    'industrial-nr12-mpcb-24vac':guide(['Clique em ▶ Executar.','Confirme o MPCB ligado, relé de fase normal e comando 24 VCA.', 'Libere emergência e pressione START.', 'Observe contator/motor; teste STOP, emergência, falta de fase e abertura/disparo do MPCB.'],'O MPCB deve bloquear a potência do motor e a cadeia de comando deve respeitar os dispositivos de segurança.'),
    'industrial-nr12-mpcb-12vac':guide(['Clique em ▶ Executar.','Confirme o MPCB ligado, relé de fase normal e comando 12 VCA.', 'Libere emergência e pressione START.', 'Observe contator/motor; teste STOP, emergência, falta de fase e abertura/disparo do MPCB.'],'O circuito deve operar em 12 VCA no comando e ser interrompido pelas proteções.'),

    'panel-direct-starter-p':guide(['Clique em ▶ Executar.','Confirme QF1 ligado e S0 liberado.', 'Pressione S1 (LIGA) e observe KM1, motor e H1.', 'Pressione S2 ou S0 e teste RT1 para observar parada/falha.'],'O selo deve manter KM1 ligado após soltar S1; H2 deve indicar falha quando aplicável.'),
    'panel-reversing-m':guide(['Clique em ▶ Executar.','Confirme QF1 ligado e S0 liberado.', 'Pressione S1 para FRENTE e observe o sentido.', 'Pare e pressione S2 para RÉ.', 'Tente observar o intertravamento e teste S3/S0/RT1.'],'KM-FRENTE e KM-RÉ não devem ser energizados simultaneamente.'),
    'panel-star-delta-g':guide(['Clique em ▶ Executar.','Confirme QF1 ligado e S0 liberado.', 'Pressione S1 e observe KM1 + contator de ESTRELA.', 'Aguarde KT1 e observe a comutação para TRIÂNGULO.', 'Teste S2, S0 e RT1.'],'KM2 (estrela) e KM3 (triângulo) nunca devem ficar ligados ao mesmo tempo; o motor 6 terminais deve indicar ESTRELA e depois TRIÂNGULO conforme KT1.'),
    'panel-pumps-gg':guide(['Clique em ▶ Executar.','Confirme QF1/QF2 ligados e S0 liberado.', 'Pressione S1 para Bomba 1 e S2 para Bomba 2.', 'Use SA1 para observar indicação de AUTO e S3 para parar.', 'Teste RT1/RT2 e observe a sinalização de falha.'],'Cada bomba deve ter partida e proteção independentes; S3/S0 interrompem ambas.'),
    'premium-knx-ip-interface-ha-g62-v1-test':guide([
      'Clique em ▶ Executar. PS-KNX deve energizar IN4, SW4 e a KNX/IP Interface pelo mesmo barramento TP1.',
      'Use os botões 1–4 de IN4. O atuador SW4 deve alternar a lâmpada correspondente normalmente.',
      'A KNX/IP Interface deve indicar POWER, KNX e LAN ativos quando receber aproximadamente 30 Vcc do barramento.',
      'Abra GERAR. Home Assistant / KNX e openHAB / KNX devem aparecer como DISPONÍVEIS porque existe uma KNX/IP Interface explícita na prancha.',
      'Em Nomear canais KNX/DALI, dê nomes às saídas e confira que esses aliases aparecem no pacote KNX/Home Assistant sem alterar CH1…CH4.'
    ],'O circuito KNX continua funcional em TP1; a interface IP não gera firmware e apenas habilita o acesso de integração quando realmente está desenhada no projeto.'),
    'premium-knx-ip-router-openhab-g63-v1-test':guide([
      'Clique em ▶ Executar e confirme o barramento KNX em aproximadamente 30 Vcc.',
      'Acione IN4 e confira SW4/lâmpadas para validar que a parte TP1 continua funcional.',
      'O KNX/IP Router deve indicar barramento e LAN ativos. O botão PROG apenas simula o estado de programação.',
      'Abra GERAR. openHAB / KNX e Home Assistant / KNX devem ficar DISPONÍVEIS.',
      'Gere openHAB / KNX e confira o arquivo knx.things com Bridge KNX/IP e os itens sugeridos.'
    ],'O router representa routing/tunneling KNXnet/IP. O TechRib libera integração pela capacidade declarada do componente, não por um firmware inventado.'),
    'premium-knx-dali-gateway-g64-v1-test':guide([
      'Clique em ▶ Executar. PS-KNX deve alimentar IN4 e o lado KNX do gateway; a rede também deve alimentar L/N do gateway.',
      'Confirme no gateway os LEDs PWR, KNX e DALI ativos.',
      'Clique no botão frontal 1 de IN4. O gateway deve converter a mudança do CH1 em Broadcast DALI ON e o relé DT7 deve ligar L1.',
      'Clique novamente no botão 1. O gateway envia Broadcast OFF, o DT7 abre e L1 apaga.',
      'Abra GERAR: KNX ↔ DALI deve ficar DISPONÍVEL e o pacote deve conter o mapa KNX-DALI, endereços KNX e Short Addresses DALI sugeridos.'
    ],'Este exemplo comprova a ponte didática KNX→DALI no runtime e, separadamente, a geração de um mapa de comissionamento. Os endereços continuam sendo sugestões editáveis.'),
    'premium-dali-ip-sunricher-ha-g65-v1-test':guide([
      'Clique em ▶ Executar. A rede deve alimentar PS24, que fornece aproximadamente 24 Vcc ao SR-GW-EDA em V+/V−.',
      'O gateway deve indicar POWER/LAN/DALI ativos e publicar a linha DALI integrada.',
      'Clique em BCAST ON. O relé DT7 deve fechar e L1 deve acender; BCAST OFF deve abrir o contato e apagar a lâmpada.',
      'Clique em SCAN para conferir atividade DALI e detecção do endereço do relé.',
      'Abra GERAR: Home Assistant / DALI deve ficar DISPONÍVEL porque o SR-GW-EDA tem um contrato explícito de integração; o TechRib gera plano/mapa e não um YAML universal falso.'
    ],'O gateway DALI/IP usa alimentação real de 24 Vcc na simulação. Sua compatibilidade Home Assistant é declarada pelo modelo suportado, mantendo a regra de bloquear gateways genéricos sem comprovação.'),
  };

  const boardGuide=(id,name)=>{
    if(id==='boards-esp32-codegen-3-lamps'||id==='boards-arduino-uno-codegen-3-lamps')return guide(['Clique em ▶ Executar.','Pressione S1, S2 e S3 uma de cada vez.','Observe cada saída acionar seu relé e sua lâmpada correspondente.','Abra o Gerador de Código e confira entradas, saídas e comportamento de toggle.'], 'Cada botoeira deve controlar apenas a própria lâmpada e o gerador deve refletir a topologia do exemplo.');
    if(id==='boards-esp32-mcp23017-16-relays-lamps'||id==='boards-arduino-uno-mcp23017-16-relays-lamps')return guide(['Clique em ▶ Executar.','Teste as botoeiras S1 até S16, começando por alguns canais de cada MCP23017.','Observe o canal correspondente do módulo de 8 relés e a respectiva lâmpada.','Repita em canais diferentes para conferir os dois expansores I²C.','Abra o Gerador de Código para conferir endereços, entradas e saídas.'], 'Cada uma das 16 entradas deve atuar somente no seu canal de saída correspondente.');
    if(id.endsWith('relay-4ch-loads'))return guide(['Clique em ▶ Executar.','Pressione as quatro botoeiras uma por vez.','Observe os quatro canais do módulo de relé e as quatro cargas.','Repita os comandos para verificar o modo configurado de cada entrada.'], 'Cada botão deve comandar somente o canal associado.');
    if(id.endsWith('water-tank'))return guide(['Clique em ▶ Executar.','Altere os sensores/boias de nível para simular reservatório vazio e cheio.','Observe as entradas isoladas no microcontrolador.','Acompanhe a saída de bomba/relé e force nível máximo ou falta de água para provocar parada.'], 'A bomba deve funcionar apenas quando os níveis indicarem necessidade e condição segura.');
    if(id==='boards-esp32-motor-protection')return guide(['Clique em ▶ Executar.','Use o controle do GPIO25 para solicitar o motor.','Observe relé, contatora e motor.', 'Dispare/restaure o relé térmico e acompanhe GPIO34 e a parada da carga.'], 'A proteção térmica deve interromper o acionamento mesmo com comando de marcha presente.');
    if(id==='boards-esp32-conveyor-counter'||id==='boards-pico-conveyor-opto')return guide(['Clique em ▶ Executar.','Inicie a esteira pelo comando disponível.','Observe sensores de entrada/saída e a contagem de peças.','Simule falha/travamento quando disponível e depois pare/reset.'], 'O controlador deve acompanhar sensores e atualizar a contagem durante o transporte.');
    if(id.includes('traffic-light'))return guide(['Clique em ▶ Executar.','Observe a sequência normal vermelho/amarelo/verde.','Pressione a botoeira de pedestre/comando do exemplo.','Acompanhe a mudança de sequência e o retorno ao ciclo normal.'], 'As três lâmpadas devem seguir a sequência programada sem estados incompatíveis.');
    if(id.includes('temperature-fan')||id.includes('analog-fan'))return guide(['Clique em ▶ Executar.','Altere o valor do sensor de temperatura/analógico.','Observe a entrada do microcontrolador e a saída de comando do ventilador/exaustor.','Teste valores abaixo e acima do limiar.'], 'A carga de ventilação deve mudar de estado conforme a leitura do sensor.');
    if(id==='boards-arduino-relay-1ch-button-opto')return guide(['Clique em ▶ Executar.','Pressione a botoeira ligada ao PC817.','Observe a entrada isolada no Arduino, o relé de 1 canal e a lâmpada.','Solte/pressione novamente para verificar o comportamento configurado.'], 'A botoeira deve chegar ao Arduino por isolamento óptico e a saída deve comandar a lâmpada via relé.');
    if(id==='boards-pico-led-button-opto')return guide(['Clique em ▶ Executar.','Pressione a botoeira ligada ao PC817.','Observe a entrada do Raspberry Pi Pico e o LED de saída.','Repita o acionamento para confirmar resposta estável.'], 'A entrada isolada deve comandar o LED conforme a lógica do exemplo.');
    if(id==='boards-pico-relay-2ch-loads')return guide(['Clique em ▶ Executar.','Acione os dois comandos/saídas do Pico.', 'Observe cada canal do módulo de 2 relés e sua carga correspondente.', 'Teste os canais separadamente e em conjunto.'], 'Os dois canais devem operar independentemente.');
    if(id==='boards-arduino-mega-codegen-mixed')return guide(['Clique em ▶ Executar.','Teste as quatro botoeiras das lâmpadas e observe as quatro saídas.', 'Use START/STOP do motor e observe o respectivo acionamento.', 'Abra o Gerador de Código e confira o projeto misto de iluminação + motor.'], 'O Arduino Mega deve tratar os circuitos de iluminação e motor de forma independente.');
    if(id==='boards-arduino-motor-reversal')return guide(['Clique em ▶ Executar.','Com o motor parado, acione o comando de FRENTE.', 'Pare e acione o comando de RÉ.', 'Tente solicitar sentidos opostos e observe o intertravamento.'], 'Os dois sentidos nunca devem ser comandados simultaneamente.');
    return guide(['Clique em ▶ Executar.','Acione as entradas/botoeiras mostradas no exemplo.','Observe GPIOs, módulos de interface e cargas correspondentes.','Repita o teste em cada canal disponível.'], `Os sinais de ${name} devem seguir o mapeamento mostrado no diagrama.`);
  };

  const familyGuide=example=>{
    const id=String(example?.id||''),name=String(example?.name||'Exemplo');
    if(/^sonoff-(basic|mini-r2|pow-r2)-example-v1$/.test(id))return guide([
      'Clique em ▶ Executar e confirme que a alimentação de rede do exemplo está presente.',
      'Acione o Sonoff pelo controle interativo disponível no próprio exemplo.',
      'Observe L_OUT comutar a fase para a lâmpada enquanto o neutro permanece pelo caminho N_IN/N_OUT.',
      'Desligue novamente o canal e confirme que a lâmpada apaga sem alterar a ligação do neutro.',
      'Abra Diagnóstico se a carga não responder e confira L_IN, L_OUT, N_IN e N_OUT.'
    ],`${name} deve ligar e desligar apenas a lâmpada associada, mantendo a alimentação e o neutro coerentes com a topologia.`);
    if(id==='sonoff-4ch-pro-r3-example-v1')return guide([
      'Clique em ▶ Executar e confirme a alimentação AC do Sonoff 4CH Pro R3.',
      'Acione o canal 1 e observe somente a lâmpada 1. Repita com os canais 2, 3 e 4.',
      'Teste mais de um canal ligado ao mesmo tempo para confirmar a independência dos quatro relés.',
      'Desligue cada canal separadamente e observe os contatos COM/NO/NC correspondentes.',
      'Use Diagnóstico para conferir que os contatos dos canais são secos e recebem a fase que será comutada.'
    ],'Cada um dos quatro canais deve atuar somente sobre sua própria carga; ligar ou desligar um canal não deve alterar os demais.');
    if(/^building-lcd16x2-(esp32|arduino-uno|arduino-mega|pico)-lamp$/.test(id))return guide([
      'Clique em ▶ Executar.',
      'Pressione a botoeira de liga/desliga da lâmpada e observe a saída da placa acionar o módulo relé.',
      'Confira a lâmpada de 127 V e o LCD 16×2: os dois devem indicar o mesmo estado.',
      'Use também o único controle de saída mostrado no painel da placa; ele deve comandar somente a lâmpada.',
      'Os sinais RS, E e D4–D7 continuam trabalhando no LCD, mas não aparecem como botões do painel.'
    ],`${name}: a lâmpada e o texto do LCD 16×2 devem alternar juntos entre LIGADA e DESLIGADA.`);
    if(/^industrial-lcd20x4-(esp32|arduino-uno|arduino-mega|pico)-duas-bombas$/.test(id))return guide([
      'Clique em ▶ Executar.',
      'Acione a botoeira da Bomba 1 e depois a da Bomba 2, verificando cada canal separadamente.',
      'Observe o módulo de 2 relés, as duas bombas e as linhas do LCD 20×4 acompanharem os estados.',
      'Use os dois controles do painel da placa para ligar/desligar Bomba 1 e Bomba 2 sem interferência entre os canais.',
      'Os pinos do barramento paralelo do LCD permanecem ativos, porém não aparecem como controles manuais da placa.'
    ],`${name}: Bomba 1 e Bomba 2 devem funcionar independentemente e o LCD 20×4 deve mostrar o estado correto de cada uma.`);
    if(/^building-fita-led-rgb-(esp32|arduino-uno|arduino-mega|pico)$/.test(id))return guide([
      'Clique em ▶ Executar.',
      'Pressione as botoeiras Vermelho, Verde e Azul uma de cada vez e observe o respectivo canal da fita.',
      'Use também os três controles R/G/B do painel da placa e confirme que eles ficam sincronizados com os estados da fita.',
      'Ligue dois canais juntos para observar as misturas de cor e, depois, ligue R+G+B para obter branco.',
      'Confirme que a fita permanece alimentada em 12 V e que cada canal é chaveado pelo seu MOSFET.'
    ],`${name}: os três canais R, G e B devem atuar de forma independente e suas combinações devem produzir as cores compostas esperadas.`);
    return null;
  };
  const genericGuide=example=>{
    const id=String(example?.id||''),name=String(example?.name||'Exemplo');
    if(id.startsWith('boards-'))return boardGuide(id,name);
    return guide(['Clique em ▶ Executar.','Use as botoeiras, chaves, sensores ou painel presentes no exemplo.','Observe os estados dos componentes e da carga durante cada comando.','Use PARAR/RESET/proteções quando disponíveis para conferir a resposta do circuito.'], example?.description||`Observe o funcionamento previsto de ${name}.`);
  };
  const getGuide=example=>MANUAL[String(example?.id||'')]||familyGuide(example)||genericGuide(example);

  const textForGuide=(example,data)=>{
    const lines=['COMO TESTAR A SIMULAÇÃO'];
    (data.steps||[]).forEach((step,index)=>lines.push(`${index+1}. ${step}`));
    if(data.expected)lines.push('',`RESULTADO ESPERADO: ${data.expected}`);
    return lines.join('\n');
  };

  const FORMATS={
    'a0-landscape':[4494,3179],'a0-portrait':[3179,4494],
    'a1-landscape':[3179,2245],'a1-portrait':[2245,3179],
    'a2-landscape':[2245,1587],'a2-portrait':[1587,2245],
    'a3-landscape':[1587,1123],'a3-portrait':[1123,1587],
    'a4-landscape':[1123,794],'a4-portrait':[794,1123],
    'a5-landscape':[794,559],'a5-portrait':[559,794]
  };
  const rectOverlap=(a,b)=>Math.max(0,Math.min(a.r,b.r)-Math.max(a.l,b.l))*Math.max(0,Math.min(a.b,b.b)-Math.max(a.t,b.t));
  const findPosition=(width,height)=>{
    const sheet=document.querySelector('[data-sheet]');
    const fmt=String(sheet?.dataset?.format||'a1-landscape');
    const [sw,sh]=FORMATS[fmt]||FORMATS['a1-landscape'];
    const margin=55;
    const boxes=[...sheet.querySelectorAll('.placed-component')]
      .filter(n=>n.dataset.type!=='text-block-object'&&n.dataset.routingRole!=='annotation')
      .map(n=>({l:n.offsetLeft,t:n.offsetTop,r:n.offsetLeft+Math.max(20,n.offsetWidth),b:n.offsetTop+Math.max(20,n.offsetHeight)}));
    const maxX=Math.max(margin,sw-width-margin),maxY=Math.max(margin,sh-height-margin);
    const candidates=[];
    const push=(x,y,bonus=0)=>{x=Math.max(margin,Math.min(maxX,Math.round(x/10)*10));y=Math.max(margin,Math.min(maxY,Math.round(y/10)*10));const r={l:x,t:y,r:x+width,b:y+height};const overlap=boxes.reduce((sum,b)=>sum+rectOverlap(r,b),0);candidates.push({x,y,score:overlap+bonus})};
    push(sw-width-80,sh-height-90,0);push(sw-width-80,80,1);push(80,sh-height-90,2);push(80,80,3);
    for(let y=60;y<=maxY;y+=120)for(let x=60;x<=maxX;x+=140)push(x,y,10+Math.abs((sw-width-80)-x)*.01+Math.abs((sh-height-90)-y)*.01);
    candidates.sort((a,b)=>a.score-b.score);
    return candidates[0]||{x:120,y:120};
  };

  const installEditableBlock=detail=>{
    const example=byId(detail?.id)||{id:String(detail?.id||''),name:String(detail?.name||detail?.id||'Exemplo')};if(!example.id)return;
    const api=window.TechRibTextBlockApi;if(!api?.create)return;
    const marker=`${example.id}-test`;
    if(api.findByMarker?.(marker))return;
    const data=getGuide(example),text=textForGuide(example,data);
    const stepCount=(data.steps||[]).length;
    const sheet=document.querySelector('[data-sheet]'),fmt=String(sheet?.dataset?.format||example.format||'a1-landscape');
    const sw=(FORMATS[fmt]||FORMATS['a1-landscape'])[0];
    const width=Math.min(900,Math.max(620,sw-140));
    const estimatedHeight=Math.min(650,Math.max(230,105+stepCount*42+(data.expected?70:0)));
    const pos=findPosition(width,estimatedHeight);
    const node=api.create(pos.x+52,pos.y+50,{text,fontSize:17,fontFamily:'Inter, Arial, sans-serif',color:'#173b55',bold:false,italic:false,align:'left',width,height:estimatedHeight,background:'transparent',border:'#64748b',fitContent:true});
    if(!node)return;
    node.dataset.exampleTextBlock=marker;
    node.dataset.tag='NOTA-TESTE';
    node.dataset.label='Como testar a simulação';
    node.dataset.routingRole='annotation';
    node.title='Bloco de texto editável — duplo clique para editar';
    requestAnimationFrame(()=>api.fit?.());
  };

  document.addEventListener('techrib:official-example-opened',event=>requestAnimationFrame(()=>requestAnimationFrame(()=>installEditableBlock(event.detail||{}))));
  window.TechRibExampleTestGuides=Object.freeze({version:6,getGuide,installEditableBlock,manualCount:Object.keys(MANUAL).length,mode:'editable-text-block'});
})();
