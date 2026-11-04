(function(global){
  'use strict';

  const HELP_STYLE_ID='techrib-super-help-style-v1';
  const HELP_ROOT_ID='techrib-super-help-v1';

  const helpTopics=[
    {
      id:'start',icon:'🚀',group:'COMECE AQUI',title:'Primeiros passos',summary:'Um roteiro curto para entender a interface e testar o primeiro projeto sem se perder.',keywords:'iniciar começar tutorial primeiro projeto guia rapido aprender',
      sections:[
        ['Roteiro em 7 passos',[
          'Clique em Exemplos para abrir a Central de Exemplos e escolha um circuito simples para conhecer o fluxo do simulador.',
          'Use a roda do mouse ou os controles de zoom e depois “Ajustar à tela” para enquadrar a prancha.',
          'Clique em ▶ Executar para iniciar a simulação virtual.',
          'Interaja somente com os controles disponíveis no exemplo: botoeiras, chaves, sensores, painéis ou laboratórios.',
          'Abra Diagnóstico para conferir erros, avisos e informações do circuito.',
          'Use Passo a passo para acompanhar a sequência de ligações do projeto.',
          'Quando quiser criar seu próprio projeto, clique em Novo e arraste componentes da biblioteca para a prancha.'
        ]],
        ['Dica para aprender mais rápido',[
          'Comece por exemplos pequenos e compare a prancha com o Diagnóstico, a lista de Conexões e o modo Diagrama.',
          'Salve uma cópia antes de fazer alterações grandes em um exemplo.'
        ]]
      ],actions:[['Abrir Exemplos','examples'],['Ajustar prancha','fit'],['Executar simulação','simulate']]
    },
    {
      id:'interface',icon:'🧭',group:'COMECE AQUI',title:'Conhecendo a interface',summary:'Onde ficam biblioteca, menus, ferramentas, prancha, propriedades e controles de simulação.',keywords:'interface tela barra biblioteca rodape menu toolbar sidebar',
      sections:[
        ['Barra superior',[
          'Mostra o projeto atual e atalhos para Novo, Renomear, Salvar, Som e Passo a passo.',
          'O menu principal reúne Arquivo, Editar, Desenhar, Simulação, Exemplos, Exibir, Prancha, Janela, Tela cheia e Ajuda.'
        ]],
        ['Biblioteca à esquerda',[
          'A aba TechRib contém os componentes oficiais organizados por categoria.',
          'A aba de usuário reúne componentes pessoais quando esse recurso está disponível para a conta.',
          'A aba Exemplos reúne projetos prontos e exemplos Premium disponíveis para a conta.'
        ]],
        ['Prancha e rodapé',[
          'A região central é a área de montagem. No rodapé você controla formato, escala técnica, grade, fundo e zoom.',
          'Use “Encaixe”/snap para facilitar alinhamentos quando estiver posicionando itens.'
        ]]
      ],actions:[['Mostrar/ocultar biblioteca','sidebar'],['Tela cheia','fullscreen']]
    },
    {
      id:'projects',icon:'💾',group:'PROJETOS',title:'Projetos: novo, abrir, salvar e imprimir',summary:'Como organizar seu trabalho e evitar perder alterações.',keywords:'novo abrir salvar renomear projeto json imprimir backup',
      sections:[
        ['Fluxo recomendado',[
          'Use Novo para iniciar uma prancha limpa e Renomear para identificar o projeto.',
          'Salvar grava o projeto conforme as permissões da conta. Abrir carrega projetos compatíveis.',
          'Imprimir gera a visualização da prancha para documentação.'
        ]],
        ['Antes de alterações grandes',[
          'Salve o projeto antes de reorganizar muitos fios, substituir componentes ou editar componentes SVG.',
          'Se estiver trabalhando a partir de um exemplo oficial, prefira salvar sua própria cópia quando essa opção estiver disponível.'
        ]]
      ],actions:[['Novo projeto','new'],['Abrir projeto','open'],['Salvar','save'],['Imprimir','print']]
    },
    {
      id:'examples',icon:'🧪',group:'PROJETOS',title:'Exemplos e laboratórios didáticos',summary:'Como usar a Central de Exemplos, abrir projetos prontos e descobrir o que clicar durante a simulação.',keywords:'exemplos premium laboratorio como testar passo teste demonstração',
      sections:[
        ['Abrindo um exemplo',[
          'Clique em Exemplos para abrir a Central de Exemplos, pesquise ou escolha uma categoria e abra o projeto desejado.',
          'Depois de carregar, use “Ajustar à tela” para visualizar a prancha completa.'
        ]],
        ['Como testar',[
          'Muitos exemplos possuem um guia “Como testar a simulação” com ações específicas daquele projeto.',
          'Alguns componentes especiais possuem painel ou laboratório próprio. Procure botões como AJUSTES, controles de nível, chamadas, sensores ou comandos no próprio desenho.'
        ]],
        ['Se nada acontecer',[
          'Confirme que a simulação está realmente em execução.',
          'Verifique disjuntores, proteções e condições de segurança virtuais do exemplo.',
          'Abra Diagnóstico para localizar uma ligação ausente, curto, incompatibilidade ou proteção atuada.'
        ]]
      ],actions:[['Abrir Exemplos','examples'],['Passo a passo','wiring-steps'],['Diagnóstico','diagnostics']]
    },
    {
      id:'components',icon:'🧩',group:'MONTAGEM',title:'Componentes e propriedades',summary:'Arrastar, selecionar, mover, copiar, girar, espelhar, alinhar e editar propriedades.',keywords:'componentes arrastar mover copiar colar duplicar girar espelhar alinhar distribuir propriedades borne',
      sections:[
        ['Inserindo e posicionando',[
          'Arraste um componente da biblioteca para a prancha e solte na posição desejada.',
          'Use Selecionar para mover itens. Para vários itens, use os recursos de seleção disponíveis no editor correspondente.',
          'Girar, Espelhar, Alinhar e Distribuir ajudam a padronizar a apresentação da prancha.'
        ]],
        ['Propriedades',[
          'Selecione um componente e abra Propriedades para verificar os parâmetros disponíveis para aquele tipo.',
          'Bornes e metadados elétricos são usados pelo diagnóstico, pela simulação e pela geração de código.'
        ]],
        ['Copiar e duplicar',[
          'Use Ctrl+C/Ctrl+V ou Duplicar quando quiser repetir partes do projeto.',
          'Depois de duplicar, revise identificações, conexões e parâmetros para evitar elementos repetidos indevidamente.'
        ]]
      ],actions:[['Selecionar','select'],['Propriedades','properties'],['Duplicar selecionado','duplicate']]
    },
    {
      id:'wiring',icon:'〰️',group:'MONTAGEM',title:'Fiação: condutores, cores e organização',summary:'Como criar fios no simulador, escolher perfil/cor e organizar as rotas sem mover os componentes.',keywords:'fio fiação condutor cor potencia comando logica organizar libavoid rota anilha terminal',
      sections:[
        ['Criar uma ligação',[
          'Ative Condutor e clique no borne de origem e no borne de destino.',
          'Escolha o tipo e a cor do condutor pela paleta de fios antes ou durante a montagem.',
          'A ligação é lógica/virtual: o simulador usa os bornes e a topologia para diagnóstico e simulação.'
        ]],
        ['Organizar fios',[
          'Organizar fios tenta melhorar somente as rotas, sem mover os componentes da prancha.',
          'Se uma rota automática não puder ser aplicada com segurança, a rota anterior pode ser preservada.',
          'Posicionar componentes com espaço livre entre eles costuma produzir rotas mais legíveis.'
        ]],
        ['Perfis elétricos',[
          'Potência, comando e lógica podem ter comportamentos visuais e validações diferentes.',
          'Não escolha o perfil apenas pela aparência: o tipo do circuito e os bornes conectados também importam para a análise.'
        ]]
      ],actions:[['Ativar Condutor','wire'],['Abrir paleta de fios','wire-palette'],['Organizar fios','organize-wires']]
    },
    {
      id:'junctions',icon:'●',group:'MONTAGEM',title:'Junções e cruzamentos de fios',summary:'A diferença entre fios apenas cruzando e fios eletricamente unidos.',keywords:'junção cruzamento ponte microponte conectar derivar derivação fio',
      sections:[
        ['Cruzamento',[
          'Quando dois fios apenas se cruzam, a microponte visual indica que não existe conexão elétrica naquele ponto.',
          'A microponte é somente uma indicação gráfica; ela não cria um novo nó elétrico.'
        ]],
        ['Junção',[
          'Use Junção quando vários condutores precisam pertencer ao mesmo ponto elétrico no projeto.',
          'Uma junção verdadeira participa da topologia e pode alterar diagnóstico, simulação e geração de documentação.'
        ]],
        ['Boa prática visual',[
          'Evite excesso de cruzamentos. Prefira corredores paralelos e derivações próximas do ponto onde a conexão realmente faz sentido.'
        ]]
      ],actions:[['Criar junção','junction'],['Organizar fios','organize-wires']]
    },
    {
      id:'sheet',icon:'📐',group:'MONTAGEM',title:'Prancha, grade, zoom, fundo e escala',summary:'Como ajustar a área de trabalho para projetos pequenos ou grandes.',keywords:'prancha grade zoom fundo escuro claro escala tecnica formato a1 a2 a3 encaixe',
      sections:[
        ['Visualização',[
          'Ajustar à tela enquadra a prancha inteira. Aproximar e Afastar alteram o zoom.',
          'A grade pode ser ligada ou desligada para facilitar alinhamento e leitura.',
          'O fundo pode ser alterado no rodapé conforme sua preferência de visualização.'
        ]],
        ['Formato e escala técnica',[
          'O formato da prancha define a área disponível para o desenho.',
          'A escala técnica, quando ativada, permite que recursos compatíveis estimem comprimentos a partir da geometria da prancha.'
        ]]
      ],actions:[['Ajustar à tela','fit'],['Alternar grade','toggle-grid']]
    },
    {
      id:'simulation',icon:'▶',group:'SIMULAÇÃO',title:'Executar, pausar e parar a simulação',summary:'O fluxo correto para testar o comportamento virtual do circuito.',keywords:'simular executar pausar parar reset estado botoeira sensor som',
      sections:[
        ['Controles principais',[
          'Executar inicia o estado de simulação. Pausar congela a execução quando o recurso estiver disponível. Parar encerra o teste.',
          'Durante a simulação, interaja com botoeiras, seletores, sensores e painéis previstos no exemplo.'
        ]],
        ['Estados e proteções',[
          'Componentes podem mudar de estado conforme a energia virtual, as entradas lógicas, os contatos e as proteções.',
          'Se uma carga não atuar, use Diagnóstico antes de modificar aleatoriamente a fiação.'
        ]],
        ['Som',[
          'O controle Som ativa ou desativa os efeitos sonoros de componentes e exemplos que possuem áudio.'
        ]]
      ],actions:[['Executar','simulate'],['Pausar','pause-simulation'],['Parar','stop-simulation']]
    },
    {
      id:'diagnostics',icon:'✓',group:'SIMULAÇÃO',title:'Diagnóstico elétrico e falhas',summary:'Como interpretar erros, avisos, redes elétricas e o diagnóstico visual.',keywords:'diagnostico erro aviso curto circuito falha borne potencial tensão proteção aterramento overlay',
      sections:[
        ['O que o Diagnóstico verifica',[
          'O painel cruza topologia, bornes, potenciais, perfis elétricos e regras conhecidas do simulador.',
          'Resultados podem aparecer como erro, aviso ou informação. Corrija primeiro os erros bloqueantes.'
        ]],
        ['Curto e incompatibilidades',[
          'Uma mensagem de curto indica que o simulador encontrou potenciais incompatíveis conectados na mesma rede virtual.',
          'Em vez de apagar fios ao acaso, identifique o condutor informado e confira seus dois endpoints.'
        ]],
        ['Diagnóstico visual',[
          'O overlay visual pode mostrar bornes, potenciais, hitboxes, redes/fios, I²C e falhas para facilitar investigação.',
          'Use esse modo como ferramenta de depuração e desligue-o quando terminar para voltar à prancha limpa.'
        ]]
      ],actions:[['Abrir Diagnóstico','diagnostics']]
    },
    {
      id:'controllers',icon:'🧠',group:'AUTOMAÇÃO',title:'ESP32, Arduino, Pico e expansores',summary:'Como o simulador representa GPIOs, entradas, saídas, alimentação lógica e I²C.',keywords:'esp32 arduino pico raspberry gpio entrada saida mcp23017 i2c logica rele 3v3 5v gnd',
      sections:[
        ['GPIO e topologia',[
          'Os controladores usam os bornes/GPIOs conectados para descobrir sinais de entrada e saída.',
          'Evite ligar diretamente redes de potência a GPIOs. No simulador, use componentes de interface/isolação quando o projeto exigir essa separação.'
        ]],
        ['Alimentação lógica',[
          '3,3 V, 5 V e GND são redes distintas e o diagnóstico pode apontar incompatibilidades quando são conectadas de forma indevida.',
          'Confira sempre os rótulos dos bornes do componente antes de criar o fio.'
        ]],
        ['MCP23017 / I²C',[
          'Projetos compatíveis podem detectar expansores MCP23017, endereços I²C, entradas e saídas para simulação e geração de código.',
          'Se o gerador mostrar erro de I²C, revise SDA, SCL, alimentação e a topologia do expansor no projeto virtual.'
        ]]
      ],actions:[['Gerar código','codegen'],['Diagnóstico','diagnostics']]
    },
    {
      id:'sonoff',icon:'📶',group:'AUTOMAÇÃO RESIDENCIAL',title:'Sonoff: Basic, Mini R2, POW R2 e 4CH Pro R3',summary:'Como usar os módulos Sonoff disponíveis na biblioteca e testar seus exemplos sem confundir alimentação, neutro e contatos de saída.',keywords:'sonoff basic mini r2 pow r2 4ch pro r3 wifi smart home automacao residencial rele lampada 127v',
      sections:[
        ['Modelos disponíveis',[
          'Sonoff Basic e Sonoff POW R2 usam entrada de rede L/N e entregam fase comutada em L_OUT; o neutro passa pelo caminho N_IN/N_OUT representado no componente.',
          'Sonoff Mini R2 acrescenta os bornes S1/S2 para comando externo por contato seco no exemplo compatível.',
          'Sonoff 4CH Pro R3 possui quatro canais independentes com contatos COM/NO/NC; a alimentação AC do módulo é separada dos contatos secos dos relés.'
        ]],
        ['Como testar nos exemplos',[
          'Abra a Central de Exemplos e pesquise por Sonoff. Existem exemplos para Basic, Mini R2, POW R2 e 4CH Pro R3.',
          'Clique em ▶ Executar e use os controles do próprio módulo ou do exemplo. Observe a lâmpada ou as quatro cargas correspondentes.',
          'No 4CH Pro R3, cada canal deve atuar de forma independente; ligar um canal não deve alterar os outros.'
        ]],
        ['Atenção à topologia',[
          'Não trate COM/NO/NC do 4CH Pro R3 como saída de tensão própria: são contatos secos e precisam receber a alimentação que será comutada.',
          'Use Diagnóstico para conferir rede, neutro e contatos antes de concluir que o componente não está respondendo.'
        ]]
      ],actions:[['Abrir Central de Exemplos','examples'],['Executar simulação','simulate'],['Diagnóstico','diagnostics']]
    },
    {
      id:'lcd',icon:'▤',group:'AUTOMAÇÃO',title:'LCD 16×2 e LCD 20×4',summary:'Ligação e teste dos displays de caracteres em modo paralelo de 4 bits com ESP32, Arduino UNO, Mega 2560 e Raspberry Pi Pico.',keywords:'lcd 16x2 lcd 20x4 hd44780 display rs e d4 d5 d6 d7 arduino uno mega esp32 pico bomba lampada',
      sections:[
        ['Ligação em 4 bits',[
          'Os exemplos usam alimentação VDD/VSS, controle RS/E e as linhas D4, D5, D6 e D7. O pino RW permanece referenciado conforme o projeto.',
          'Os bornes LED_A e LED_K pertencem à iluminação de fundo do display e não substituem a alimentação lógica do LCD.',
          'O LCD 16×2 e o LCD 20×4 usam a mesma ideia de interface paralela; o que muda é a quantidade de linhas exibidas e o conteúdo mostrado.'
        ]],
        ['Controles da placa',[
          'Nos exemplos LCD, o painel do microcontrolador mostra somente as saídas que o usuário deve comandar, como LÂMPADA, BOMBA 1 e BOMBA 2.',
          'RS, E e D4–D7 continuam conectados e funcionando como sinais do display, mas não aparecem como botões do painel porque não são comandos manuais da carga.'
        ]],
        ['Exemplos disponíveis',[
          'Há versões do LCD 16×2 com controle de lâmpada para ESP32, Arduino UNO, Arduino Mega 2560 e Raspberry Pi Pico.',
          'Há versões do LCD 20×4 Azul com duas bombas para as mesmas quatro placas. O display acompanha o estado das cargas durante a simulação.'
        ]]
      ],actions:[['Abrir Central de Exemplos','examples'],['Executar simulação','simulate'],['Gerar código','codegen']]
    },
    {
      id:'rgb',icon:'🌈',group:'AUTOMAÇÃO',title:'Fita LED RGB 12 V',summary:'Como funciona o exemplo de fita RGB 12 V com três canais, MOSFETs, push buttons e controles GPIO.',keywords:'rgb fita led 12v vermelho verde azul mosfet pwm push button gpio mistura cores esp32 arduino uno mega pico',
      sections:[
        ['Alimentação e potência',[
          'A fita RGB de 12 V possui um comum +12V e canais separados R, G e B. Nos exemplos, cada canal é chaveado por seu próprio MOSFET.',
          'O microcontrolador trabalha apenas no comando lógico dos gates; a alimentação de 12 V da fita permanece separada da alimentação lógica da placa.',
          'O GND de referência do comando é compartilhado conforme a topologia do exemplo para que os MOSFETs recebam níveis lógicos válidos.'
        ]],
        ['Três canais independentes',[
          'As botoeiras físicas alternam Vermelho, Verde e Azul separadamente. O painel da placa também oferece exatamente três controles correspondentes aos canais R/G/B.',
          'Combinações de canais produzem outras cores no simulador: vermelho+verde, verde+azul, vermelho+azul e os três canais juntos.'
        ]],
        ['Placas disponíveis',[
          'O mesmo exemplo existe para ESP32, Arduino UNO, Arduino Mega 2560 e Raspberry Pi Pico, preservando a mesma lógica de três entradas e três saídas.',
          'Ao comparar as versões, observe que mudam os nomes dos pinos da placa, mas a função elétrica dos três canais permanece equivalente.'
        ]]
      ],actions:[['Abrir Central de Exemplos','examples'],['Executar simulação','simulate'],['Diagnóstico','diagnostics']]
    },
    {
      id:'knx',icon:'KNX',group:'AUTOMAÇÃO PREDIAL',title:'KNX e KNX/IP',summary:'Barramento KNX, entradas binárias, atuadores, persianas, gateways e os arquivos técnicos gerados a partir da topologia.',keywords:'knx knx ip knx/ip tp barramento entrada binaria atuador rele persiana gateway commissioning comissionamento home assistant openhab grupo endereco',
      sections:[
        ['Como o KNX aparece no simulador',[
          'Os dispositivos KNX usam o barramento e seus bornes próprios para representar alimentação/comunicação, entradas, atuadores e interfaces de automação predial.',
          'Na biblioteca existem módulos como entradas binárias, atuadores liga/desliga e atuadores de persiana. Use a Central de Exemplos para localizar aplicações KNX prontas.'
        ]],
        ['Entradas, canais e endereços',[
          'Uma entrada binária transforma o estado de uma botoeira, chave ou contato em informação para a lógica KNX; o atuador executa a função no canal associado.',
          'Antes de gerar arquivos técnicos, dê nomes claros aos canais e confira a topologia. Isso melhora os mapas de grupos, canais e integrações produzidos pelo gerador.'
        ]],
        ['Geração e integração',[
          'Quando a topologia é compatível, o Gerador pode oferecer arquivos de comissionamento KNX e bases de integração para Home Assistant KNX e openHAB KNX.',
          'Esses arquivos são apoio técnico para configuração e comissionamento. O endereço de grupo e a parametrização final devem ser conferidos conforme o equipamento real usado no projeto.'
        ]]
      ],actions:[['Abrir Central de Exemplos','examples'],['Gerar código / arquivos','codegen'],['Diagnóstico','diagnostics']]
    },
    {
      id:'dali',icon:'DALI',group:'AUTOMAÇÃO PREDIAL',title:'DALI e DALI-2',summary:'Barramento de iluminação digital, drivers, dispositivos de entrada, DT7/DT8 e integração KNX ↔ DALI.',keywords:'dali dali-2 dali2 driver dt7 dt8 iluminacao digital control gear input device gateway knx dali commissioning comissionamento home assistant',
      sections:[
        ['Como o DALI aparece no simulador',[
          'O DALI é tratado como uma rede digital de iluminação, com barramento, dispositivos de controle, drivers/control gear e componentes compatíveis com os exemplos disponíveis.',
          'A biblioteca inclui recursos DALI/DALI-2 e famílias específicas como entradas, relés/DT7, controle analógico/DT5 e recursos DT8 conforme o componente usado.'
        ]],
        ['Teste e identificação',[
          'Abra um exemplo DALI na Central de Exemplos e confira primeiro a alimentação e os dois condutores do barramento antes de testar comandos ou cenas representadas no projeto.',
          'Use nomes de canais e cargas que descrevam o ambiente ou circuito; isso facilita leitura, diagnóstico e geração dos arquivos de integração.'
        ]],
        ['Geração e ponte KNX ↔ DALI',[
          'Quando o projeto possui topologia compatível, o Gerador pode produzir arquivos de comissionamento DALI, bases para integração Home Assistant DALI e mapas de uma ponte KNX ↔ DALI.',
          'O mapa KNX ↔ DALI é uma proposta baseada no projeto e deve ser ajustado aos objetos, grupos e endereços do gateway real durante o comissionamento.'
        ]]
      ],actions:[['Abrir Central de Exemplos','examples'],['Gerar código / arquivos','codegen'],['Diagnóstico','diagnostics']]
    },
    {
      id:'codegen',icon:'</>',group:'AUTOMAÇÃO',title:'Gerador de código',summary:'Como gerar código e pacotes técnicos a partir da topologia real do projeto e entender as validações.',keywords:'codigo codegen arduino esphome esp-idf rainmaker zip yaml ino gpio topologia knx dali commissioning comissionamento home assistant openhab',
      sections:[
        ['Antes de gerar',[
          'Adicione um controlador compatível e conecte seus GPIOs aos dispositivos do projeto.',
          'Abra Diagnóstico e corrija erros de hardware/topologia antes de gerar código.'
        ]],
        ['Alvos disponíveis',[
          'O gerador possui suporte para alvos como Arduino, ESP32 com framework Arduino, ESPHome e ESP-IDF conforme o controlador e os recursos detectados.',
          'Em topologias compatíveis de automação predial, também podem aparecer pacotes KNX, DALI, Home Assistant/openHAB e mapeamento KNX ↔ DALI; em ESP-IDF, opções como ESP RainMaker podem aparecer.'
        ]],
        ['O que é analisado',[
          'O gerador lê a topologia e os metadados dos componentes; ele não depende apenas da posição visual deles na prancha.',
          'Revise o código gerado antes de usá-lo em qualquer hardware real.'
        ]]
      ],actions:[['Abrir Gerador de código','codegen'],['Abrir Diagnóstico','diagnostics']]
    },
    {
      id:'docs',icon:'📋',group:'DOCUMENTAÇÃO',title:'Materiais, conexões e passo a passo',summary:'Ferramentas para transformar a prancha em documentação didática e técnica.',keywords:'materiais bom lista conexões passo a passo relatorio documentação exportar csv pdf',
      sections:[
        ['Lista de materiais',[
          'Materiais reúne os componentes e itens reconhecidos no projeto para conferência e documentação.',
          'Quando a escala técnica está ativa, recursos compatíveis podem incluir informações derivadas da geometria.'
        ]],
        ['Lista de conexões',[
          'Conexões gera uma relação técnica baseada nos endpoints dos fios existentes no projeto.',
          'É útil para localizar rapidamente de qual borne um condutor sai e em qual borne termina.'
        ]],
        ['Passo a passo',[
          'Passo a passo organiza as ligações em uma sequência didática para facilitar a leitura do projeto virtual.'
        ]]
      ],actions:[['Materiais','bom'],['Conexões','connections'],['Passo a passo','wiring-steps']]
    },
    {
      id:'multifilar',icon:'👁',group:'DOCUMENTAÇÃO',title:'Visualização real e diagrama multifilar',summary:'Quando usar a aparência realista e quando usar a representação multifilar.',keywords:'diagrama multifilar real simbolo visualização esquema',
      sections:[
        ['Visual real',[
          'Ajuda a reconhecer o componente pela aparência e pelos bornes físicos representados no simulador.'
        ]],
        ['Multifilar',[
          'O modo Diagrama apresenta uma representação técnica alternativa quando o projeto e os componentes possuem dados suficientes.',
          'Alterne entre os modos para comparar a montagem visual com a leitura esquemática.'
        ]]
      ],actions:[['Alternar Diagrama','multi-line']]
    },
    {
      id:'editor',icon:'◇',group:'EDITOR',title:'Editor de Componentes SVG',summary:'Como ajustar o visual, peças, bornes e metadados dos componentes.',keywords:'editor svg component studio selecionar area conjunto girar escala texto borne eletrica contatos animação salvar componente',
      sections:[
        ['Ferramentas visuais',[
          'O editor permite selecionar elementos, selecionar por área, mover conjuntos, ajustar escala, girar, inserir texto e trabalhar com bornes.',
          'Use a seleção por área quando precisar alterar várias partes do SVG como um conjunto.'
        ]],
        ['Bornes e parte técnica',[
          'As abas de borne, elétrica, contatos, animação e informações descrevem como o componente participa da simulação e do diagnóstico.',
          'Um componente bonito mas com bornes ou metadados incorretos pode simular de forma errada.'
        ]],
        ['Salvar',[
          'Antes de substituir um componente oficial, valide o visual e os bornes. Quando disponível, use “Salvar como...” para criar uma variante sem sobrescrever a base.'
        ]]
      ],actions:[['Abrir Editor SVG','component-editor']]
    },
    {
      id:'troubleshooting',icon:'🛠',group:'SUPORTE',title:'Solução de problemas',summary:'Checklist para os problemas mais comuns antes de alterar o projeto.',keywords:'problema erro não funciona sumiu grade fio organizar componente cache atualizar bug solução',
      sections:[
        ['O exemplo abriu estranho',[
          'Use Ajustar à tela e confira o zoom.',
          'Se a grade não aparecer, alterne Grade uma vez e volte ao estado desejado.',
          'Se acabou de instalar um patch, faça uma atualização forçada da página para evitar JavaScript antigo em cache.'
        ]],
        ['A simulação não responde',[
          'Confirme que Executar está ativo.',
          'Abra Diagnóstico e corrija erros antes de mexer em várias conexões.',
          'Confira se o componente possui o controle interativo esperado e se uma proteção virtual não está impedindo a atuação.'
        ]],
        ['Organizar fios não mudou nada',[
          'A organização pode preservar a rota anterior quando não encontra uma alternativa válida.',
          'Tente aumentar o espaço entre componentes e executar Organizar fios novamente.'
        ]],
        ['Componente não aparece corretamente no editor',[
          'Confirme se o componente usa SVG/estrutura suportada pelo editor e se o visual está dentro da área do desenho.',
          'Use as abas Visual, Peças e Camadas para descobrir se partes ficaram ocultas, agrupadas ou fora da seleção.'
        ]]
      ],actions:[['Ajustar à tela','fit'],['Diagnóstico','diagnostics'],['Organizar fios','organize-wires']]
    },
    {
      id:'shortcuts',icon:'⌨',group:'SUPORTE',title:'Atalhos do teclado',summary:'Os principais atalhos para trabalhar mais rápido.',keywords:'atalho teclado ctrl salvar copiar colar duplicar desfazer refazer delete girar propriedades esc',
      sections:[
        ['Edição',[
          'Ctrl+S — salvar projeto',
          'Ctrl+X — recortar',
          'Ctrl+C — copiar',
          'Ctrl+V — colar',
          'Ctrl+D — duplicar',
          'Ctrl+Z — desfazer',
          'Ctrl+Y — refazer',
          'Delete — excluir seleção'
        ]],
        ['Ferramentas',[
          'R — girar componente',
          'T — inserir texto',
          'P — propriedades',
          'Esc — voltar para seleção',
          'F1 — abrir esta Central de Ajuda'
        ]]
      ]
    },
    {
      id:'glossary',icon:'📚',group:'SUPORTE',title:'Glossário rápido',summary:'Termos usados no simulador explicados em linguagem simples.',keywords:'glossario borne terminal rede topologia gpio junção potência comando lógica pe gnd',
      sections:[
        ['Termos essenciais',[
          'Borne / terminal — ponto de conexão de um componente no projeto.',
          'Endpoint — uma das extremidades de um fio.',
          'Rede elétrica virtual — conjunto de pontos ligados eletricamente pela topologia do simulador.',
          'Junção — ponto que une eletricamente dois ou mais condutores.',
          'Cruzamento — encontro visual de fios sem ligação elétrica.',
          'Topologia — quem está ligado a quem, independentemente da posição visual.',
          'GPIO — pino lógico de entrada/saída de um microcontrolador.',
          'PE — referência de proteção/aterramento usada pelo modelo elétrico.',
          'GND — referência de retorno lógico/DC; não é automaticamente igual a PE.',
          'BOM / Materiais — lista de materiais do projeto.'
        ]]
      ]
    },
    {
      id:'safety',icon:'⚠',group:'SUPORTE',title:'Limites, segurança e uso didático',summary:'O que o simulador pode ajudar a verificar e o que ele não substitui.',keywords:'segurança limite didatico engenharia real instalação eletrica aviso',
      sections:[
        ['Uso didático',[
          'O TechRib ajuda a estudar topologia, lógica, documentação e comportamento virtual de circuitos.',
          'Diagnósticos e cálculos do simulador não substituem projeto, inspeção, normas aplicáveis ou validação profissional de uma instalação real.',
          'Não use uma simulação como autorização para trabalhar em circuitos reais energizados.'
        ]],
        ['Código gerado',[
          'Código automático deve ser revisado e testado em ambiente apropriado antes de qualquer uso fora do simulador.',
          'A validação virtual reduz erros de projeto, mas não garante compatibilidade com todo hardware ou instalação real.'
        ]]
      ]
    }
  ];

  const quickActions={
    examples:()=>{document.querySelector('[data-action="show-examples"]')?.click()},
    fit:()=>{document.querySelector('[data-zoom="fit"]')?.click()},
    simulate:()=>{document.querySelector('[data-action="simulate"]')?.click()},
    'pause-simulation':()=>{document.querySelector('[data-action="pause-simulation"]')?.click()},
    'stop-simulation':()=>{document.querySelector('[data-action="stop-simulation"]')?.click()},
    diagnostics:()=>{document.querySelector('[data-action="diagnostics"]')?.click()},
    'wiring-steps':()=>{document.querySelector('[data-action="wiring-steps"]')?.click()},
    sidebar:()=>{document.querySelector('.sidebar-toggle')?.click()},
    fullscreen:()=>{document.querySelector('[data-action="fullscreen"]')?.click()},
    new:()=>{document.querySelector('[data-action="new"]')?.click()},
    open:()=>{document.querySelector('[data-action="open"]')?.click()},
    save:()=>{document.querySelector('[data-action="save"]')?.click()},
    print:()=>{document.querySelector('[data-action="print"]')?.click()},
    select:()=>{document.querySelector('[data-tool="select"]')?.click()},
    properties:()=>{document.querySelector('[data-action="properties"]')?.click()},
    duplicate:()=>{document.querySelector('[data-action="duplicate"]')?.click()},
    wire:()=>{document.querySelector('[data-tool="wire"]')?.click()},
    'wire-palette':()=>{document.querySelector('[data-action="wire-palette"]')?.click()},
    'organize-wires':()=>{document.querySelector('[data-action="organize-wires"]')?.click()},
    junction:()=>{document.querySelector('[data-tool="junction"]')?.click()},
    'toggle-grid':()=>{document.querySelector('[data-action="toggle-grid"]')?.click()},
    codegen:()=>{document.querySelector('[data-action="codegen"]')?.click()},
    bom:()=>{document.querySelector('[data-action="bom"]')?.click()},
    connections:()=>{document.querySelector('[data-action="connections"]')?.click()},
    'multi-line':()=>{document.querySelector('[data-action="multi-line"]')?.click()},
    'component-editor':()=>{document.querySelector('[data-action="component-editor"]')?.click()}
  };

  let currentExampleContext=null;
  let helpServerExamples=[];
  let helpServerExamplesPromise=null;
  const helpEscape=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const staticExampleCatalog=()=>Array.isArray(global.TECHRIB_STANDARD_EXAMPLES_V34)?global.TECHRIB_STANDARD_EXAMPLES_V34:[];
  const serverRecordAsExample=record=>{
    const project=record?.project&&typeof record.project==='object'?record.project:{};
    return {
      id:String(record?.id||''),
      name:String(record?.name||project?.name||record?.id||'Exemplo'),
      category:String(record?.categoryLabel||record?.category||'Exemplo oficial'),
      categories:Array.isArray(record?.categories)?record.categories:[],
      tags:Array.isArray(record?.tags)?record.tags:[],
      level:String(record?.level||''),
      description:String(record?.description||''),
      format:String(project?.format||''),
      managed:record?.managed===true
    };
  };
  const refreshHelpServerExamples=()=>{
    if(helpServerExamplesPromise)return helpServerExamplesPromise;
    helpServerExamplesPromise=fetch('/?api=standard-examples',{cache:'no-store'})
      .then(response=>response.ok?response.json():[])
      .then(records=>{helpServerExamples=Array.isArray(records)?records.filter(record=>record?.id&&record?.project).map(serverRecordAsExample):[];return helpServerExamples})
      .catch(error=>{console.warn('TechRib Ajuda: não foi possível atualizar a lista de exemplos salvos.',error);return helpServerExamples})
      .finally(()=>{helpServerExamplesPromise=null});
    return helpServerExamplesPromise;
  };
  const exampleCatalog=()=>{
    const merged=new Map(staticExampleCatalog().map(example=>[String(example?.id||''),example]));
    helpServerExamples.forEach(example=>{
      const id=String(example?.id||'');if(!id)return;
      const current=merged.get(id)||{};
      merged.set(id,{...current,...example,description:example.description||current.description||'Exemplo oficial criado ou atualizado na biblioteca TechRib.'});
    });
    return [...merged.values()].filter(example=>example?.id);
  };
  const resolveExample=(id,name='')=>{
    const key=String(id||'');
    const base=exampleCatalog().find(item=>String(item?.id||'')===key)||{};
    return {...base,id:key||String(base.id||''),name:String(name||base.name||key||'Exemplo')};
  };
  const guideForExample=example=>{
    const api=global.TechRibExampleTestGuides;
    if(api?.getGuide){
      try{return api.getGuide(example)||{};}catch(error){console.warn('TechRib Ajuda: falha ao obter guia do exemplo.',error);}
    }
    return {steps:['Clique em ▶ Executar.','Interaja com os controles disponíveis no projeto.','Observe os componentes, sinais e cargas durante o teste.'],expected:String(example?.description||'Confira o comportamento indicado pelo diagrama.')};
  };
  const exampleSearchText=example=>`${example?.name||''} ${example?.category||''} ${example?.description||''} ${example?.id||''}`.toLowerCase();
  document.addEventListener('techrib:official-example-opened',event=>{
    const detail=event.detail||{};
    currentExampleContext=resolveExample(detail.id,detail.name);
    document.dispatchEvent(new CustomEvent('techrib:help-example-context-changed',{detail:currentExampleContext}));
  });
  document.addEventListener('techrib:official-example-closed',()=>{
    currentExampleContext=null;
    document.dispatchEvent(new CustomEvent('techrib:help-example-context-changed',{detail:null}));
  });

  function injectHelpStyles(){
    if(document.getElementById(HELP_STYLE_ID))return;
    const style=document.createElement('style');style.id=HELP_STYLE_ID;style.textContent=`
      body.techrib-help-open{overflow:hidden!important}
      .techrib-help-overlay{position:fixed;inset:0;z-index:120000;background:rgba(2,8,14,.76);backdrop-filter:blur(4px);display:flex;align-items:stretch;justify-content:center;padding:18px}
      .techrib-help-overlay[hidden]{display:none!important}
      .techrib-help-shell{width:min(1460px,100%);height:100%;max-height:940px;margin:auto;background:#071821;border:1px solid #214553;border-radius:18px;box-shadow:0 28px 90px rgba(0,0,0,.55);overflow:hidden;display:grid;grid-template-rows:auto 1fr;color:#e8f6fb;font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif}
      .techrib-help-top{display:grid;grid-template-columns:minmax(250px,1fr) minmax(260px,520px) auto;gap:18px;align-items:center;padding:18px 20px;border-bottom:1px solid #1b3945;background:linear-gradient(135deg,#0a222d,#0a1820)}
      .techrib-help-brand small{display:block;color:#46d8ff;font-size:10px;letter-spacing:.18em;font-weight:800}.techrib-help-brand h2{margin:3px 0 0;font-size:22px;line-height:1.1}.techrib-help-brand p{margin:5px 0 0;color:#8fb2bf;font-size:12px}
      .techrib-help-search{position:relative}.techrib-help-search input{width:100%;height:42px;border-radius:10px;border:1px solid #31515d;background:#0c2631;color:#effaff;padding:0 42px 0 14px;outline:none;font-size:13px}.techrib-help-search input:focus{border-color:#29c9ef;box-shadow:0 0 0 3px rgba(41,201,239,.12)}.techrib-help-search span{position:absolute;right:14px;top:11px;color:#7ca1ae}
      .techrib-help-close{width:42px;height:42px;border:1px solid #31515d;border-radius:10px;background:#0d2732;color:#fff;font-size:20px;cursor:pointer}.techrib-help-close:hover{background:#173845}
      .techrib-help-body{min-height:0;display:grid;grid-template-columns:300px 1fr}
      .techrib-help-side{min-height:0;overflow:auto;border-right:1px solid #1b3945;background:#081c25;padding:12px}
      .techrib-help-side-group{margin:12px 8px 7px;color:#5f8c9b;font-size:10px;letter-spacing:.12em;font-weight:800}
      .techrib-help-topic-btn{width:100%;display:grid;grid-template-columns:28px 1fr;gap:8px;align-items:center;text-align:left;border:1px solid transparent;background:transparent;color:#c8dce3;border-radius:9px;padding:9px 10px;cursor:pointer;font-size:12px}.techrib-help-topic-btn span:first-child{font-size:16px}.techrib-help-topic-btn:hover{background:#0f2a35;border-color:#1d4453}.techrib-help-topic-btn.active{background:#133747;border-color:#2c829a;color:#fff}.techrib-help-topic-btn[hidden]{display:none!important}
      .techrib-help-main{min-width:0;min-height:0;overflow:auto;background:#0a1e27;padding:26px clamp(18px,3vw,42px) 50px}
      .techrib-help-hero{background:linear-gradient(135deg,#0e3341,#102832);border:1px solid #245160;border-radius:16px;padding:22px;margin-bottom:18px}.techrib-help-kicker{font-size:10px;letter-spacing:.14em;color:#5ddaff;font-weight:800}.techrib-help-hero h1{font-size:27px;margin:7px 0}.techrib-help-hero p{margin:0;color:#a9c7d1;max-width:850px;line-height:1.55;font-size:13px}
      .techrib-help-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}.techrib-help-action{border:1px solid #2b6071;background:#102f3b;color:#dcf7ff;border-radius:9px;padding:9px 12px;font-weight:700;font-size:11px;cursor:pointer}.techrib-help-action:hover{background:#174657;border-color:#43cdeb}
      .techrib-help-section{background:#0b2631;border:1px solid #1d4350;border-radius:13px;padding:17px 19px;margin:12px 0}.techrib-help-section h3{font-size:14px;margin:0 0 11px;color:#f2fbff}.techrib-help-section ul,.techrib-help-section ol{margin:0;padding-left:20px;display:grid;gap:8px}.techrib-help-section li{color:#bdd2d9;font-size:12.5px;line-height:1.55}.techrib-help-section li::marker{color:#33c9ee}.techrib-help-section>p{margin:0;color:#bdd2d9;font-size:12.5px;line-height:1.6}
      .techrib-help-home-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:16px}.techrib-help-home-card{border:1px solid #1f4654;background:#0c2934;border-radius:13px;padding:15px;text-align:left;color:#e9f8fc;cursor:pointer}.techrib-help-home-card:hover{transform:translateY(-1px);border-color:#37bddd;background:#10313d}.techrib-help-home-card b{display:block;font-size:13px;margin:6px 0}.techrib-help-home-card small{display:block;color:#91b2bd;font-size:11px;line-height:1.45}.techrib-help-home-card .ico{font-size:20px}
      .techrib-help-search-results{display:grid;gap:10px}.techrib-help-result{border:1px solid #214957;background:#0c2833;border-radius:12px;padding:15px;cursor:pointer}.techrib-help-result:hover{border-color:#38c5e7}.techrib-help-result b{font-size:13px}.techrib-help-result p{margin:5px 0 0;color:#9cbac4;font-size:11px;line-height:1.45}
      .techrib-help-empty{text-align:center;padding:70px 20px;color:#7fa2ad}.techrib-help-footer-note{margin-top:22px;padding:14px 16px;border-radius:11px;background:#132a31;border:1px solid #3c5961;color:#a9c0c8;font-size:11px;line-height:1.5}.techrib-help-footer-note strong{color:#ffd27a}
      .techrib-help-example-banner{display:grid;grid-template-columns:1fr auto;gap:14px;align-items:center;margin:0 0 16px;padding:16px 18px;border:1px solid #2c7188;border-radius:14px;background:linear-gradient(135deg,#103746,#0c2934);color:#e8f9ff;cursor:pointer;text-align:left}.techrib-help-example-banner:hover{border-color:#50d5f3;background:linear-gradient(135deg,#124150,#0f3340)}.techrib-help-example-banner small{display:block;color:#67dbf4;font-size:10px;letter-spacing:.12em;font-weight:800}.techrib-help-example-banner b{display:block;margin-top:5px;font-size:14px}.techrib-help-example-banner span:last-child{font-size:22px;color:#6ce6ff}
      .techrib-help-example-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.techrib-help-example-card{border:1px solid #214957;background:#0c2833;border-radius:12px;padding:14px 15px;color:#e8f6fb;text-align:left;cursor:pointer}.techrib-help-example-card:hover{border-color:#38c5e7;background:#10313d}.techrib-help-example-card small{display:block;color:#58d6f2;font-size:9px;letter-spacing:.08em;font-weight:800;text-transform:uppercase}.techrib-help-example-card b{display:block;margin:5px 0 4px;font-size:12.5px;line-height:1.35}.techrib-help-example-card p{margin:0;color:#91b2bd;font-size:10.5px;line-height:1.4}.techrib-help-example-meta{display:flex;gap:7px;flex-wrap:wrap;margin-top:12px}.techrib-help-example-meta span{border:1px solid #2b5361;border-radius:999px;background:#0c2934;color:#9cc0cb;padding:5px 8px;font-size:9.5px}.techrib-help-expected{border-color:#2b7258;background:#0c3028}.techrib-help-expected h3{color:#8ff0bd}.techrib-help-tip{border-color:#6d5b2d;background:#302817}.techrib-help-tip h3{color:#ffd27a}
      @media(max-width:900px){.techrib-help-example-grid{grid-template-columns:1fr}.techrib-help-example-banner{grid-template-columns:1fr}.techrib-help-overlay{padding:0}.techrib-help-shell{border-radius:0;max-height:none}.techrib-help-top{grid-template-columns:1fr auto}.techrib-help-search{grid-column:1/-1;grid-row:2}.techrib-help-body{grid-template-columns:1fr}.techrib-help-side{display:flex;gap:6px;overflow:auto;border-right:0;border-bottom:1px solid #1b3945;padding:8px}.techrib-help-side-group{display:none}.techrib-help-topic-btn{width:auto;min-width:max-content;grid-template-columns:22px auto;padding:7px 9px}.techrib-help-main{padding:18px 14px 34px}.techrib-help-home-grid{grid-template-columns:1fr 1fr}}
      @media(max-width:560px){.techrib-help-brand p{display:none}.techrib-help-top{padding:12px}.techrib-help-hero h1{font-size:21px}.techrib-help-home-grid{grid-template-columns:1fr}}
    `;document.head.appendChild(style);
  }

  function createHelpCenter(){
    injectHelpStyles();
    let root=document.getElementById(HELP_ROOT_ID),activeId='start';
    const topicById=id=>helpTopics.find(t=>t.id===id)||null;
    if(!root){
      root=document.createElement('div');root.id=HELP_ROOT_ID;root.className='techrib-help-overlay';root.hidden=true;root.innerHTML=`
        <section class="techrib-help-shell" role="dialog" aria-modal="true" aria-label="Central de Ajuda TechRib">
          <header class="techrib-help-top">
            <div class="techrib-help-brand"><small>TECHRIB • AJUDA DIDÁTICA</small><h2>Central de Ajuda</h2><p>Pesquise uma dúvida ou escolha um assunto.</p></div>
            <label class="techrib-help-search"><input type="search" placeholder="Pesquisar ajuda ou nome de exemplo..." aria-label="Pesquisar na ajuda"><span>⌕</span></label>
            <button class="techrib-help-close" type="button" title="Fechar ajuda" aria-label="Fechar ajuda">×</button>
          </header>
          <div class="techrib-help-body"><aside class="techrib-help-side"></aside><main class="techrib-help-main"></main></div>
        </section>`;
      document.body.appendChild(root);
    }
    const side=root.querySelector('.techrib-help-side'),main=root.querySelector('.techrib-help-main'),search=root.querySelector('input[type="search"]');
    const close=()=>{root.hidden=true;document.body.classList.remove('techrib-help-open');search.value='';filterSide('')};
    const actionButton=([label,key])=>`<button class="techrib-help-action" type="button" data-help-action="${key}">${label}</button>`;
    const clearSideActive=()=>side.querySelectorAll('[data-help-topic],[data-help-special]').forEach(b=>b.classList.remove('active'));
    const renderTopic=id=>{
      const t=topicById(id)||helpTopics[0];activeId=t.id;search.value='';filterSide('');
      clearSideActive();side.querySelector(`[data-help-topic="${CSS.escape(t.id)}"]`)?.classList.add('active');
      main.innerHTML=`<div class="techrib-help-hero"><div class="techrib-help-kicker">${t.group}</div><h1>${t.icon} ${t.title}</h1><p>${t.summary}</p>${t.actions?.length?`<div class="techrib-help-actions">${t.actions.map(actionButton).join('')}</div>`:''}</div>${t.sections.map(([title,items])=>`<section class="techrib-help-section"><h3>${title}</h3><ul>${items.map(x=>`<li>${x}</li>`).join('')}</ul></section>`).join('')}<div class="techrib-help-footer-note"><strong>Segurança:</strong> esta ajuda descreve o uso do simulador. Ela não substitui normas, projeto, inspeção ou orientação profissional para instalações elétricas reais.</div>`;
      main.scrollTop=0;
    };
    const renderExampleGuide=input=>{
      const example=typeof input==='string'?resolveExample(input):resolveExample(input?.id,input?.name);
      if(!example.id){renderExampleLibrary();return}
      const data=guideForExample(example),steps=Array.isArray(data.steps)?data.steps:[];
      activeId='example-guide';search.value='';filterSide('');clearSideActive();
      if(currentExampleContext?.id===example.id)side.querySelector('[data-help-special="current-example"]')?.classList.add('active');
      else side.querySelector('[data-help-special="example-guides"]')?.classList.add('active');
      const category=helpEscape(example.category||'GUIA DO EXEMPLO');
      const description=helpEscape(example.description||'Use o passo a passo abaixo para testar este projeto no simulador.');
      main.innerHTML=`<div class="techrib-help-hero"><div class="techrib-help-kicker">${category}</div><h1>🧪 ${helpEscape(example.name)}</h1><p>${description}</p><div class="techrib-help-example-meta"><span>${helpEscape(example.id)}</span>${currentExampleContext?.id===example.id?'<span>● ABERTO AGORA</span>':''}</div><div class="techrib-help-actions"><button class="techrib-help-action" data-help-action="simulate">▶ Executar</button><button class="techrib-help-action" data-help-action="diagnostics">✓ Diagnóstico</button><button class="techrib-help-action" data-help-action="examples">▦ Central de Exemplos</button></div></div><section class="techrib-help-section"><h3>Como testar a simulação</h3><ol>${steps.map(step=>`<li>${helpEscape(step)}</li>`).join('')}</ol></section>${data.expected?`<section class="techrib-help-section techrib-help-expected"><h3>Resultado esperado</h3><p>${helpEscape(data.expected)}</p></section>`:''}${data.tip?`<section class="techrib-help-section techrib-help-tip"><h3>Dica</h3><p>${helpEscape(data.tip)}</p></section>`:''}<div class="techrib-help-footer-note"><strong>Guia vinculado ao exemplo:</strong> esta ajuda usa o mesmo roteiro didático do projeto oficial e acompanha o exemplo selecionado.</div>`;
      main.scrollTop=0;
    };
    const renderCurrentExample=()=>{
      if(currentExampleContext){renderExampleGuide(currentExampleContext);return}
      activeId='current-example';search.value='';filterSide('');clearSideActive();side.querySelector('[data-help-special="current-example"]')?.classList.add('active');
      main.innerHTML=`<div class="techrib-help-hero"><div class="techrib-help-kicker">AJUDA DO EXEMPLO ATUAL</div><h1>🧪 Abra um exemplo para receber o guia específico</h1><p>Quando você abrir um projeto pela Central de Exemplos, esta área passa a mostrar automaticamente o passo a passo, o resultado esperado e as ações de teste daquele exemplo.</p><div class="techrib-help-actions"><button class="techrib-help-action" data-help-action="examples">▦ Abrir Central de Exemplos</button></div></div><div class="techrib-help-footer-note"><strong>Como funciona:</strong> a Central de Ajuda acompanha o exemplo oficial que estiver aberto no simulador.</div>`;
      main.scrollTop=0;
    };
    const renderExampleLibrary=()=>{
      activeId='example-guides';search.value='';filterSide('');clearSideActive();side.querySelector('[data-help-special="example-guides"]')?.classList.add('active');
      const examples=exampleCatalog();
      main.innerHTML=`<div class="techrib-help-hero"><div class="techrib-help-kicker">GUIAS DOS EXEMPLOS</div><h1>📚 Ajuda organizada por projeto</h1><p>Escolha qualquer exemplo oficial para ver como testar a simulação e qual resultado deve ser observado. Você também pode pesquisar o nome do projeto no campo acima.</p></div>${currentExampleContext?`<button class="techrib-help-example-banner" data-help-example-id="${helpEscape(currentExampleContext.id)}"><span><small>EXEMPLO ABERTO AGORA</small><b>${helpEscape(currentExampleContext.name)}</b></span><span>→</span></button>`:''}<div class="techrib-help-example-grid">${examples.map(example=>`<button class="techrib-help-example-card" data-help-example-id="${helpEscape(example.id)}"><small>${helpEscape(example.category||'Exemplo')}</small><b>${helpEscape(example.name)}</b><p>${helpEscape(example.description||'Abrir o guia de teste deste exemplo.')}</p></button>`).join('')}</div><div class="techrib-help-footer-note"><strong>${examples.length} exemplos indexados:</strong> os guias são obtidos do roteiro de teste usado pelo próprio simulador.</div>`;
      main.scrollTop=0;
    };
    const renderHome=()=>{
      activeId='start';clearSideActive();
      const currentCard=currentExampleContext?`<button class="techrib-help-example-banner" data-help-special="current-example"><span><small>AJUDA DO EXEMPLO ABERTO</small><b>${helpEscape(currentExampleContext.name)}</b></span><span>→</span></button>`:'';
      main.innerHTML=`<div class="techrib-help-hero"><div class="techrib-help-kicker">CENTRAL DE AJUDA TECHRIB</div><h1>Encontre rapidamente o que precisa</h1><p>Além dos assuntos gerais do simulador, a ajuda agora acompanha cada exemplo: abra um projeto e veja o roteiro específico de teste, ou pesquise qualquer exemplo oficial pelo nome.</p><div class="techrib-help-actions"><button class="techrib-help-action" data-help-special="example-guides">📚 Guias dos exemplos</button><button class="techrib-help-action" data-help-topic-jump="start">🚀 Guia de início</button><button class="techrib-help-action" data-help-topic-jump="troubleshooting">🛠 Resolver um problema</button></div></div>${currentCard}<div class="techrib-help-home-grid"><button class="techrib-help-home-card" data-help-special="example-guides"><span class="ico">📚</span><b>Guias de cada exemplo</b><small>Localize um projeto e veja como testar a simulação e o resultado esperado.</small></button>${helpTopics.filter(t=>['start','wiring','simulation','diagnostics','controllers','sonoff','lcd','rgb','knx','dali','codegen','docs','editor','troubleshooting'].includes(t.id)).map(t=>`<button class="techrib-help-home-card" data-help-topic-jump="${t.id}"><span class="ico">${t.icon}</span><b>${t.title}</b><small>${t.summary}</small></button>`).join('')}</div><div class="techrib-help-footer-note"><strong>Dica:</strong> pressione <b>F1</b> em qualquer momento. Se um exemplo oficial estiver aberto, o guia dele aparecerá em destaque.</div>`;
      main.scrollTop=0;
    };
    const searchText=t=>`${t.group} ${t.title} ${t.summary} ${t.keywords||''} ${t.sections.flatMap(s=>[s[0],...s[1]]).join(' ')}`.toLowerCase();
    function filterSide(q){const term=String(q||'').trim().toLowerCase();side.querySelectorAll('[data-help-topic]').forEach(b=>{const t=topicById(b.dataset.helpTopic);b.hidden=!!term&&(!t||!searchText(t).includes(term))})}
    const renderSearch=q=>{
      const term=String(q||'').trim().toLowerCase();if(!term){renderHome();return}
      const found=helpTopics.filter(t=>searchText(t).includes(term));
      const exampleMatches=exampleCatalog().filter(example=>exampleSearchText(example).includes(term)).slice(0,40);
      if(currentExampleContext&&exampleSearchText(currentExampleContext).includes(term)&&!exampleMatches.some(example=>String(example.id)===String(currentExampleContext.id)))exampleMatches.unshift(currentExampleContext);
      filterSide(term);clearSideActive();
      const total=found.length+exampleMatches.length;
      main.innerHTML=`<div class="techrib-help-hero"><div class="techrib-help-kicker">PESQUISA</div><h1>Resultados para “${helpEscape(q)}”</h1><p>${total} resultado(s) encontrado(s), incluindo assuntos da ajuda e exemplos oficiais.</p></div>${found.length?`<div class="techrib-help-search-results">${found.map(t=>`<article class="techrib-help-result" data-help-topic-jump="${t.id}"><b>${t.icon} ${t.title}</b><p>${t.summary}</p></article>`).join('')}</div>`:''}${exampleMatches.length?`<section class="techrib-help-section"><h3>Exemplos encontrados</h3><div class="techrib-help-example-grid">${exampleMatches.map(example=>`<button class="techrib-help-example-card" data-help-example-id="${helpEscape(example.id)}"><small>${helpEscape(example.category||'Exemplo')}</small><b>${helpEscape(example.name)}</b><p>Ver o guia específico deste projeto.</p></button>`).join('')}</div></section>`:''}${!total?'<div class="techrib-help-empty">Nenhum resultado encontrado. Tente palavras como <b>fio</b>, <b>ESP32</b>, <b>KNX</b>, <b>DALI</b>, <b>Sonoff</b>, <b>LCD</b>, <b>RGB</b>, <b>bomba</b>, <b>Arduino</b> ou parte do nome de um exemplo.</div>':''}`;
      main.scrollTop=0;
    };
    const buildSide=()=>{
      side.replaceChildren();
      const group=document.createElement('div');group.className='techrib-help-side-group';group.textContent='EXEMPLOS';side.appendChild(group);
      const currentButton=document.createElement('button');currentButton.type='button';currentButton.className='techrib-help-topic-btn';currentButton.dataset.helpSpecial='current-example';currentButton.innerHTML=`<span>🧪</span><span data-current-example-help-label>Ajuda do exemplo atual</span>`;side.appendChild(currentButton);
      const guidesButton=document.createElement('button');guidesButton.type='button';guidesButton.className='techrib-help-topic-btn';guidesButton.dataset.helpSpecial='example-guides';guidesButton.innerHTML='<span>📚</span><span>Guias de cada exemplo</span>';side.appendChild(guidesButton);
      let current='';helpTopics.forEach(t=>{if(t.group!==current){current=t.group;const g=document.createElement('div');g.className='techrib-help-side-group';g.textContent=current;side.appendChild(g)}const b=document.createElement('button');b.type='button';b.className='techrib-help-topic-btn';b.dataset.helpTopic=t.id;b.innerHTML=`<span>${t.icon}</span><span>${t.title}</span>`;side.appendChild(b)});
    };
    const refreshExampleContextLabel=()=>{const label=side.querySelector('[data-current-example-help-label]');if(label)label.textContent=currentExampleContext?`Exemplo: ${currentExampleContext.name}`:'Ajuda do exemplo atual'};
    buildSide();refreshExampleContextLabel();
    document.addEventListener('techrib:help-example-context-changed',()=>{refreshExampleContextLabel();if(!root.hidden&&activeId==='current-example')renderCurrentExample()});
    root.querySelector('.techrib-help-close').onclick=close;
    root.addEventListener('click',e=>{
      if(e.target===root)close();
      const example=e.target.closest('[data-help-example-id]');if(example){renderExampleGuide(example.dataset.helpExampleId);return}
      const special=e.target.closest('[data-help-special]');if(special){const id=special.dataset.helpSpecial;if(id==='current-example')renderCurrentExample();else if(id==='example-guides')renderExampleLibrary();return}
      const topic=e.target.closest('[data-help-topic],[data-help-topic-jump]');if(topic){renderTopic(topic.dataset.helpTopic||topic.dataset.helpTopicJump);return}
      const action=e.target.closest('[data-help-action]');if(action){const fn=quickActions[action.dataset.helpAction];close();setTimeout(()=>fn?.(),40)}
    });
    search.addEventListener('input',()=>renderSearch(search.value));
    search.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();if(search.value){search.value='';renderHome();filterSide('')}else close()}});
    const rerenderAfterExampleRefresh=()=>{if(root.hidden)return;if(activeId==='example-guides')renderExampleLibrary();else if(activeId==='current-example')renderCurrentExample();else if(search.value)renderSearch(search.value)};
    const open=id=>{root.hidden=false;document.body.classList.add('techrib-help-open');if(id==='current-example')renderCurrentExample();else if(id==='example-guides')renderExampleLibrary();else if(id&&topicById(id))renderTopic(id);else renderHome();refreshHelpServerExamples().then(rerenderAfterExampleRefresh);setTimeout(()=>search.focus(),30)};
    return{open,close,renderTopic,renderCurrentExample,renderExampleGuide,renderExampleLibrary,topics:helpTopics};
  }

  const isAdmin=Boolean(global.TECHRIB_USER_ACCESS?.isAdmin);
  const definitions={
    file:[['Novo projeto',{action:'new'}],['Abrir arquivo JSON',{action:'open'}],['Salvar projeto',{action:'save'}],['Salvar como exemplo',{action:'save-example'}],['Central de Exemplos',{action:'show-examples'}],['Imprimir prancha',{action:'print'}]],
    edit:[['Desfazer',{action:'undo'}],['Refazer',{action:'redo'}],['Recortar',{action:'cut'}],['Copiar',{action:'copy'}],['Colar',{action:'paste'}],['Duplicar',{action:'duplicate'}],['Excluir',{action:'delete'}]],
    draw:[['Selecionar',{tool:'select'}],['Criar condutor',{tool:'wire'}],['Escolher cor do fio',{action:'wire-palette'}],['Criar junção',{tool:'junction'}],['Inserir borne',{action:'insert-terminal'}],['Organizar fios',{action:'organize-wires'}],['Adicionar texto',{tool:'text'}],['Adicionar plaqueta',{tool:'plaque'}]],
    simulation:[['Executar',{action:'simulate'}],['Pausar',{action:'pause-simulation'}],['Parar',{action:'stop-simulation'}],['Diagnóstico elétrico',{action:'diagnostics'}],['Passo a passo',{action:'wiring-steps'}]],
    view:[['Mostrar/ocultar biblioteca',{sidebar:true}],['Mostrar/ocultar grade',{action:'toggle-grid'}],['Mostrar bornes de desenvolvimento',{action:'toggle-anchors'}],...(isAdmin?[['Alternar real/multifilar',{action:'multi-line'}]]:[])],
    sheet:[['Ajustar à tela',{zoom:'fit'}],['Aproximar',{zoom:'in'}],['Afastar',{zoom:'out'}],['Escolher formato da prancha',{format:true}],['Escala técnica / comprimentos',{scale:true}],['Imprimir prancha',{action:'print'}]],
    window:[['Biblioteca de componentes',{sidebar:true}],['Propriedades do componente',{action:'properties'}],['Editor de componentes SVG',{action:'component-editor'}]],
    help:[
      ['★ Central de Ajuda completa',{helpCenter:'home'}],
      ['🧪 Ajuda do exemplo atual',{helpCenter:'current-example'}],
      ['📚 Guias de cada exemplo',{helpCenter:'example-guides'}],
      ['Primeiros passos',{helpCenter:'start'}],
      ['Fiação e junções',{helpCenter:'wiring'}],
      ['Simulação e diagnóstico',{helpCenter:'diagnostics'}],
      ['ESP32 / Arduino / Automação',{helpCenter:'controllers'}],
      ['Sonoff / Smart Home',{helpCenter:'sonoff'}],
      ['LCD 16×2 / 20×4',{helpCenter:'lcd'}],
      ['Fita LED RGB 12 V',{helpCenter:'rgb'}],
      ['KNX / KNX-IP',{helpCenter:'knx'}],
      ['DALI / DALI-2',{helpCenter:'dali'}],
      ['Gerador de código',{helpCenter:'codegen'}],
      ['Editor de Componentes SVG',{helpCenter:'editor'}],
      ['Solução de problemas',{helpCenter:'troubleshooting'}],
      ['Trocar logo da prancha',{help:'sheet-logo'}],
      ['Atalhos do teclado',{helpCenter:'shortcuts'}],
      ['Sobre o simulador',{help:'about'}]
    ]
  };
  const help={
    'sheet-logo':['Como trocar o logo da prancha',['1. Crie ou abra um projeto já salvo.','2. No canto superior direito do simulador, clique em “Personalização”.','3. Desmarque “Usar logo padrão TechRib”.','4. Em “Meu logo”, escolha uma imagem PNG, JPG ou WEBP de até 2 MB.','5. Clique em “Salvar personalização”.','A alteração é salva somente no projeto atual. Contas Desenvolvedor, Demo e Assinante possuem acesso a essa função.']],
    about:['Sobre o TechRib',['Simulador elétrico didático para montagem, documentação e teste lógico de circuitos.','Os cálculos e diagnósticos auxiliam o aprendizado, mas não substituem projeto, inspeção ou laudo de engenharia.']]
  };

  let sharedHelpCenter=null;
  const getHelpCenter=()=>sharedHelpCenter||(sharedHelpCenter=createHelpCenter());

  function create(options={}){
    const workbench=options.workbench,selectLibraryTab=options.selectLibraryTab||(()=>{}),notify=options.notify||(()=>{}),formatSelect=options.formatSelect,technicalScaleSelect=options.technicalScaleSelect,showReport=options.showReport||(()=>{}),root=options.root||document;
    let menuPopover=null;
    const close=()=>{if(menuPopover)menuPopover.hidden=true;root.querySelectorAll('[data-menu]').forEach(button=>button.classList.remove('menu-open'))};
    const run=command=>{
      close();
      if(command.helpCenter){getHelpCenter().open(command.helpCenter==='home'?null:command.helpCenter);return}
      if(command.action==='show-examples'){if(global.TechRibExamplesCenter?.open){global.TechRibExamplesCenter.open();return}workbench?.classList.remove('sidebar-hidden');selectLibraryTab('examples');notify('Biblioteca de exemplos');return}
      if(command.action){root.querySelector(`[data-action="${command.action}"]`)?.click();return}
      if(command.tool){root.querySelector(`[data-tool="${command.tool}"]`)?.click();return}
      if(command.zoom){root.querySelector(`[data-zoom="${command.zoom}"]`)?.click();return}
      if(command.sidebar){root.querySelector('.sidebar-toggle')?.click();return}
      if(command.format){formatSelect?.focus();formatSelect?.click();return}
      if(command.scale){technicalScaleSelect?.focus();notify('Escolha a escala técnica na barra inferior da prancha');return}
      if(command.help&&help[command.help])showReport(...help[command.help]);
    };
    const bindMenus=()=>{
      if(menuPopover)return menuPopover;
      menuPopover=document.createElement('div');menuPopover.className='cad-menu-popover';menuPopover.hidden=true;document.body.appendChild(menuPopover);
      root.querySelectorAll('[data-menu]').forEach(trigger=>trigger.addEventListener('click',event=>{
        event.preventDefault();event.stopPropagation();const key=trigger.dataset.menu,items=definitions[key]||[],wasOpen=!menuPopover.hidden&&trigger.classList.contains('menu-open');close();if(wasOpen)return;menuPopover.replaceChildren();
        items.forEach(([label,command])=>{const button=document.createElement('button');button.type='button';button.textContent=label;button.addEventListener('click',()=>run(command));menuPopover.appendChild(button)});
        const rect=trigger.getBoundingClientRect();menuPopover.style.left=`${Math.min(rect.left,innerWidth-270)}px`;menuPopover.style.top=`${rect.bottom+2}px`;menuPopover.hidden=false;trigger.classList.add('menu-open');
      }));
      document.addEventListener('pointerdown',event=>{if(!event.target.closest('.cad-menu-popover,[data-menu]'))close()});
      document.addEventListener('keydown',event=>{if(event.key==='F1'){event.preventDefault();getHelpCenter().open()}else if(event.key==='Escape'&&!document.getElementById(HELP_ROOT_ID)?.hidden)getHelpCenter().close()});
      return menuPopover;
    };
    return {definitions,run,close,bindMenus};
  }

  global.TechRibHelpCenter={open:id=>getHelpCenter().open(id),close:()=>getHelpCenter().close(),topics:helpTopics,currentExample:()=>currentExampleContext};
  global.TechRibUiToolsRuntime={create,definitions,capabilities:Object.freeze({technicalScaleMenu:true,superHelpCenter:true,helpSearch:true,helpF1:true})};
})(window);
