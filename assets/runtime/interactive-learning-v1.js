/* TechRib — Aprenda na Prática V6.0
   Desafios interativos públicos de diagnóstico elétrico.
   01: ligação ausente START 14 -> K1 A1.
   02: selo ausente K1 14 -> K1 A1; K1 arma enquanto START é pressionado e cai ao soltar.
   03: ESP32 aciona o relé, mas falta KR1 NO1 -> contatora A2; ensina a cadeia lógica -> interface -> potência.
   04: alternância de duas bombas; ao falhar B1 o ESP32 chama B2, mas falta KR1 NO2 -> KM2 A1.
   05: diagnóstico guiado; K1 arma, mas falta uma fase de potência FT1 4 -> M1 V.
   06: reversão; FRENTE funciona, mas falta S2 14 -> K1-NF 11 no comando de RÉ. */
(function(){
  'use strict';

  const PROFILES={
    'learn-contactor-wont-pull-in-01':{
      id:'learn-contactor-wont-pull-in-01',
      kind:'missing-start-coil',
      title:'Desafio 01 — Por que esta contatora não arma?',
      objective:'descobrir uma única falha no circuito de comando e fazer K1 acionar o motor.',
      startId:'start',stopId:'stop',contactorId:'k1',
      motorSelector:'.placed-component[data-tag="M1"],.placed-component[data-type^="bomba-"]',
      solution:{fromId:'start',fromTerminal:'14',toId:'k1',toTerminal:'A1',color:'#ef4444'}
    },
    'learn-contactor-seal-02':{
      id:'learn-contactor-seal-02',
      kind:'missing-seal',
      title:'Desafio 02 — Você sabe o que mantém a contatora ligada depois de soltar o botão?',
      objective:'descobrir como o contato auxiliar 13/14 mantém K1 energizada depois que START é solto.',
      startId:'start',stopId:'stop',contactorId:'k1',
      motorSelector:'.placed-component[data-tag="M1"],.placed-component[data-type^="bomba-"]',
      solution:{fromId:'k1',fromTerminal:'14',toId:'k1',toTerminal:'A1',color:'#ef4444'}
    },
    'learn-esp32-relay-contactor-03':{
      id:'learn-esp32-relay-contactor-03',
      kind:'relay-contactor-link',
      title:'Desafio 03 — Como um ESP32 consegue comandar um motor trifásico sem ligar o motor direto no ESP32?',
      objective:'entender a cadeia GPIO25 → relé de interface → bobina da contatora → contatos de potência → motor trifásico.',
      espId:'esp',relayId:'elec-relay-module-1ch-mu340cpt-9',contactorId:'contator-tripolar-ajustavel-mu34cqvl-8',
      motorSelector:'.placed-component[data-component-id="p1"]',
      solution:{fromId:'elec-relay-module-1ch-mu340cpt-9',fromTerminal:'NO1',toId:'contator-tripolar-ajustavel-mu34cqvl-8',toTerminal:'A2',color:'#facc15'}
    },
    'learn-dual-pumps-failover-04':{
      id:'learn-dual-pumps-failover-04',
      kind:'dual-pump-failover',
      title:'Desafio 04 — Se uma bomba parar, quem assume?',
      objective:'entender como a bomba reserva deve assumir automaticamente quando RT1 retira B1 de serviço.',
      espId:'esp',relayId:'kr2',selectorId:'sel',lowId:'low',highId:'high',thermal1Id:'fr1',thermal2Id:'fr2',
      contactor1Id:'contator-tripolar-ajustavel-mu464yhy-19',contactor2Id:'contator-tripolar-ajustavel-mu4651rd-20',
      pump1Id:'bomba-trifasica-polia-mu46zzn9-21',pump2Id:'bomba-trifasica-polia-mu4707un-22',
      solution:{fromId:'kr2',fromTerminal:'NO2',toId:'contator-tripolar-ajustavel-mu4651rd-20',toTerminal:'A1',color:'#f97316'}
    },
    'learn-guided-diagnostic-05':{
      id:'learn-guided-diagnostic-05',
      kind:'guided-diagnostic-missing-phase',
      title:'Desafio 05 — Tem alguma coisa errada neste circuito. Você consegue achar?',
      objective:'usar o Diagnóstico do TechRib para separar comando e potência, localizar a fase ausente e fazer M1 funcionar.',
      startId:'start',stopId:'stop',contactorId:'k1',thermalId:'ft1',motorId:'bomba-trifasica-polia-mu426wve-9',
      motorSelector:'.placed-component[data-component-id="bomba-trifasica-polia-mu426wve-9"]',
      solution:{fromId:'ft1',fromTerminal:'4',toId:'bomba-trifasica-polia-mu426wve-9',toTerminal:'V',color:'#111827'}
    },
    'learn-reversing-interlock-06':{
      id:'learn-reversing-interlock-06',
      kind:'reversing-interlock-open-command',
      title:'Desafio 06 — O motor vai para frente, mas não entra em RÉ. Por quê?',
      objective:'entender o intertravamento elétrico cruzado entre KM1 e KM2 e restaurar o caminho S2 14 → K1-NF 11.',
      forwardId:'fwd',reverseId:'rev',stopId:'stop',forwardContactorId:'k1',reverseContactorId:'k2',interlockId:'i1',otherInterlockId:'i2',motorId:'m1',
      solution:{fromId:'rev',fromTerminal:'14',toId:'i1',toTerminal:'11',color:'#f59e0b'}
    }
  };

  const workbench=document.querySelector('[data-workbench]');
  const sheet=document.querySelector('[data-sheet]');
  if(!workbench||!sheet)return;

  let profile=null,active=false,stage=0,attempted=false,completed=false,autoFixed=false,checkTimer=0,readyForValidation=false;
  let heldResponseSeen=false,releaseObserved=false,validationPressSeen=false,validationReleaseSeen=false;
  let validationRelaySawOff=false,validationRelayCommandSeen=false;
  let primarySeen=false,validationThermalSawHealthy=false,validationPrimaryRunningSeen=false,validationFailoverSeen=false;
  let dualGuideStep=0,dualAutoObserved=false,dualLowObserved=false;
  let diagnosticUsed=false;
  let reversingGuideStep=0,reversingForwardSeen=false,reversingStopSeen=false,reversingReverseAttempted=false;
  let validationReverseForwardOk=false,validationReverseStopped=false,validationReverseOk=false,validationInterlockClick=false;
  let panel=null,reopenChip=null,stepEl=null,stateEl=null,questionEl=null,copyEl=null,actionsEl=null,progressEl=null,titleEl=null,miniEl=null;

  // O Fullscreen API renderiza apenas o elemento que entrou em tela cheia e seus descendentes.
  // O coach acompanha o workbench em fullscreen e volta ao body ao sair.
  const fullscreenElement=()=>document.fullscreenElement||document.webkitFullscreenElement||null;
  const coachMountTarget=()=>fullscreenElement()===workbench?workbench:document.body;
  const syncCoachFullscreenMount=()=>{
    if(!panel&&!reopenChip)return;
    const target=coachMountTarget();
    if(panel&&panel.parentElement!==target)target.appendChild(panel);
    if(reopenChip&&reopenChip.parentElement!==target)target.appendChild(reopenChip);
  };

  const esc=value=>window.CSS?.escape?CSS.escape(String(value)):String(value).replace(/["\\]/g,'\\$&');
  const component=id=>sheet.querySelector(`.placed-component[data-component-id="${esc(id)}"]`);
  const hooks=()=>window.TechRibRegressionHooks||null;
  const terminal=(id,name)=>{
    const c=component(id);if(!c)return null;
    const h=hooks();
    if(h?.terminal)return h.terminal(c,name)||null;
    return [...c.querySelectorAll('[data-terminal]')].find(t=>String(t.dataset.terminal||'')===String(name))||null;
  };
  const startNode=()=>profile?component(profile.startId):null;
  const startPressed=()=>Boolean(startNode()?.classList.contains('pressed'));
  const relayOn=()=>{const r=profile?.relayId?component(profile.relayId):null;return Boolean(r&&(r.dataset.relayEnergized==='true'||r.classList.contains('relay-energized')))};
  const contactorOn=()=>{const c=profile?component(profile.contactorId):null;return Boolean(c&&(c.dataset.coilEnergized==='true'||c.dataset.contactorState==='closed'||c.classList.contains('device-active')))};
  const motorOn=()=>{const m=profile?sheet.querySelector(profile.motorSelector):null;return Boolean(m&&(m.dataset.electricalRunning==='true'||m.classList.contains('running')))};
  const componentOn=id=>{const c=component(id);return Boolean(c&&(c.dataset.coilEnergized==='true'||c.dataset.contactorState==='closed'||c.classList.contains('device-active')))};
  const machineOn=id=>{const m=component(id);return Boolean(m&&(m.dataset.electricalRunning==='true'||m.dataset.ipRunning==='true'||m.classList.contains('running')))};
  const thermalTripped=id=>{const t=component(id);return Boolean(t&&(t.dataset.tripped==='true'||t.classList.contains('tripped')))};
  const gpioHigh=(id,pin)=>{const c=component(id);if(!c)return false;try{const states=JSON.parse(c.dataset.gpioStates||'{}');return String(states?.[pin]||'LOW').toUpperCase()==='HIGH'}catch{return false}};
  const dualPanel=()=>sheet.querySelector('.lote1-machine-panel[data-kind="dual-pumps"]');
  const selectorAuto=()=>Number(component(profile?.selectorId)?.dataset.selectorPosition||0)===0;
  const deviceActive=id=>{const c=component(id);return Boolean(c&&(c.classList.contains('device-active')||c.dataset.electricalInternalState==='energized'||c.dataset.state==='on'))};
  const markCallout=(node,label)=>{if(!node)return null;node.classList.add('techrib-learn-callout');node.dataset.techribLearnLabel=label||'';return node};
  const focusNode=node=>{try{node?.scrollIntoView?.({behavior:'smooth',block:'center',inline:'center'})}catch{}};
  const highlightControl=(id,selector,label)=>{const c=component(id);if(!c)return null;c.classList.add('techrib-learn-highlight');markCallout(c,label);c.querySelector(selector)?.classList.add('techrib-learn-control-target');return c};
  const highlightDualAuto=()=>{const c=highlightControl(profile?.selectorId,'[data-selector-knob]','S1 • AUTO / MANUAL');const mode=dualPanel()?.querySelector('[data-value="mode"]');if(mode){mode.classList.add('techrib-learn-toolbar-highlight');markCallout(mode,selectorAuto()?'MODO = AUTO':'MODO = MANUAL')}return c};
  const highlightDualLow=()=>{const button=dualPanel()?.querySelector('[data-level="low"]');if(button){button.classList.add('techrib-learn-toolbar-highlight');markCallout(button,'CLIQUE AQUI • NÍVEL BAIXO')}const low=component(profile?.lowId);if(low){low.classList.add('techrib-learn-highlight');markCallout(low,'BMIN • boia de nível baixo')}return button||low};
  const highlightThermalReset=id=>{const c=component(id);if(!c)return null;c.classList.add('techrib-learn-highlight');markCallout(c,'RT1 • CLIQUE NO RESET AZUL');const reset=c.querySelector('[data-thermal-reset-button]')||c.querySelector('[data-thermal-reset]');if(reset)reset.classList.add('techrib-learn-control-target');return c};
  const simulationRunning=()=>workbench.classList.contains('simulation-running');
  const clearWireHighlight=()=>document.querySelectorAll('.techrib-learn-solution-wire').forEach(n=>n.classList.remove('techrib-learn-solution-wire'));
  const clearHighlights=()=>{
    sheet.querySelectorAll('.techrib-learn-highlight').forEach(n=>n.classList.remove('techrib-learn-highlight'));
    sheet.querySelectorAll('.techrib-learn-terminal').forEach(n=>n.classList.remove('techrib-learn-terminal'));
    document.querySelectorAll('.techrib-learn-toolbar-highlight').forEach(n=>n.classList.remove('techrib-learn-toolbar-highlight'));
    document.querySelectorAll('.techrib-learn-control-target').forEach(n=>n.classList.remove('techrib-learn-control-target'));
    document.querySelectorAll('.techrib-learn-callout').forEach(n=>{n.classList.remove('techrib-learn-callout');delete n.dataset.techribLearnLabel});
    clearWireHighlight();
  };
  const highlightExecute=()=>document.querySelector('[data-action="simulate"]')?.classList.add('techrib-learn-toolbar-highlight');
  const highlightOrganize=()=>document.querySelector('[data-action="organize-wires"]')?.classList.add('techrib-learn-toolbar-highlight');
  const highlightConductor=()=>document.querySelector('[data-tool="wire"]')?.classList.add('techrib-learn-toolbar-highlight');
  const highlightDiagnostic=()=>document.querySelector('[data-action="diagnostics"]')?.classList.add('techrib-learn-toolbar-highlight');
  const highlightPush=(id,label)=>{const c=component(id);if(!c)return null;c.classList.add('techrib-learn-highlight');markCallout(c,label);const cap=c.querySelector('[data-push-cap]');if(cap)cap.classList.add('techrib-learn-control-target');return c};
  const highlightComponent=id=>component(id)?.classList.add('techrib-learn-highlight');
  const highlightTerminal=(id,name)=>{const t=terminal(id,name);if(t){t.classList.add('techrib-learn-terminal');t.closest('.placed-component')?.classList.add('techrib-learn-highlight')}return t};

  const syncPanelProfile=()=>{
    if(!profile||!panel)return;
    if(titleEl)titleEl.textContent=profile.title;
    if(miniEl)miniEl.innerHTML=`<b>Objetivo:</b> ${profile.objective}`;
  };
  const buildPanel=()=>{
    if(panel?.isConnected){syncPanelProfile();return}
    panel=document.createElement('aside');panel.className='techrib-learn-coach';panel.hidden=true;panel.setAttribute('aria-live','polite');
    panel.innerHTML='<div class="techrib-learn-head"><div class="techrib-learn-icon">🎯</div><div class="techrib-learn-title"><small>Aprenda na Prática</small><b></b></div><button class="techrib-learn-close" type="button" title="Fechar orientação">×</button></div><div class="techrib-learn-body"><div class="techrib-learn-status"><span class="techrib-learn-step"></span><span class="techrib-learn-state"></span></div><h3 class="techrib-learn-question"></h3><p class="techrib-learn-copy"></p><div class="techrib-learn-progress"><span></span><span></span><span></span><span></span><span></span></div><div class="techrib-learn-actions"></div><div class="techrib-learn-mini"></div></div>';
    document.body.appendChild(panel);
    reopenChip=document.createElement('button');reopenChip.type='button';reopenChip.className='techrib-learn-reopen';reopenChip.textContent='🎯 Desafio';reopenChip.hidden=true;reopenChip.addEventListener('click',()=>{reopenChip.hidden=true;panel.hidden=false;render()});document.body.appendChild(reopenChip);
    syncCoachFullscreenMount();
    titleEl=panel.querySelector('.techrib-learn-title b');miniEl=panel.querySelector('.techrib-learn-mini');stepEl=panel.querySelector('.techrib-learn-step');stateEl=panel.querySelector('.techrib-learn-state');questionEl=panel.querySelector('.techrib-learn-question');copyEl=panel.querySelector('.techrib-learn-copy');actionsEl=panel.querySelector('.techrib-learn-actions');progressEl=panel.querySelector('.techrib-learn-progress');
    panel.querySelector('.techrib-learn-close').addEventListener('click',()=>{panel.hidden=true;if(reopenChip)reopenChip.hidden=false;clearHighlights()});
    syncPanelProfile();
  };
  const btn=(label,action,kind='')=>{const b=document.createElement('button');b.type='button';b.textContent=label;if(kind)b.className=kind;b.addEventListener('click',action);actionsEl.appendChild(b);return b};
  const setProgress=index=>{[...progressEl.children].forEach((n,i)=>{n.classList.toggle('done',i<index);n.classList.toggle('on',i===index)})};

  const renderChallenge01=()=>{
    if(completed){
      stepEl.textContent='Concluído';stateEl.textContent='Circuito funcionando';questionEl.textContent='✓ Resolvido! A contatora armou e o motor respondeu.';
      copyEl.innerHTML='A falha era a ligação entre a saída <strong>14 do START</strong> e a bobina <strong>A1 de K1</strong>. Você também organizou o novo condutor antes do teste final, deixando o circuito mais legível.';
      setProgress(5);btn('Rever os pontos',()=>{highlightTerminal('start','14');highlightTerminal('k1','A1')});return;
    }
    if(stage===0){
      stepEl.textContent='Etapa 1 de 5';stateEl.textContent='Observe o defeito';questionEl.textContent='Por que esta contatora não arma?';
      copyEl.innerHTML='Há <strong>uma única falha proposital</strong>. Clique em <strong>▶ Executar</strong> e depois pressione a botoeira <strong>LIGA / START</strong>. Primeiro observe o que acontece.';
      setProgress(0);highlightExecute();btn('Destacar ▶ Executar',highlightExecute);return;
    }
    if(stage===1){
      stepEl.textContent='Etapa 2 de 5';
      if(readyForValidation){stateEl.textContent='Correção pronta para teste';questionEl.textContent='Agora teste a ligação corrigida';copyEl.innerHTML='Com o novo fio já organizado, pressione <strong>LIGA / START</strong>. Se a ligação estiver correta, K1 deve armar e o motor deve entrar em funcionamento.';}
      else{stateEl.textContent=attempted?'A contatora não respondeu':'Faça o primeiro teste';questionEl.textContent=attempted?'Ela não armou. Onde está a falha?':'Agora pressione LIGA / START';copyEl.innerHTML=attempted?'Você confirmou o sintoma. Tente localizar sozinho antes de pedir ajuda. A potência está montada; o defeito está em algum ponto do <strong>comando</strong>.':'Com a simulação executando, pressione a botoeira verde. A contatora deveria fechar e permanecer selada pelo contato 13/14.';}
      setProgress(1);highlightComponent('start');if(readyForValidation)btn('Destacar LIGA / START',()=>highlightComponent('start'),'primary');else if(attempted){btn('Dica 1',()=>{stage=2;render()},'primary');btn('Tentar novamente',()=>highlightComponent('start'))}return;
    }
    if(stage===2){
      stepEl.textContent='Etapa 3 de 5';stateEl.textContent='Dica progressiva';questionEl.textContent='Dica 1 — procure no circuito de comando';
      copyEl.innerHTML='A alimentação chega pelo STOP e pela proteção térmica. A falha está no trecho que deveria levar o comando da botoeira <strong>START até a bobina da contatora</strong>. A ferramenta <strong>Condutor</strong> já está piscando na barra superior porque a solução exige criar uma ligação. Clique em <strong>Mostrar os pontos</strong> para ver exatamente onde.';
      setProgress(2);highlightComponent('start');highlightComponent('k1');highlightConductor();btn('Mostrar os pontos',()=>{highlightConductor();stage=3;render()},'primary');btn('Tentar sem revelar',()=>{stage=1;render()});return;
    }
    if(stage===3){
      stepEl.textContent='Etapa 4 de 5';stateEl.textContent='Pontos da falha destacados';questionEl.textContent='Está faltando uma ligação';
      copyEl.innerHTML='Observe os terminais destacados: <code>START 14</code> deve chegar à bobina <code>K1 A1</code>. Para fazer a ligação manualmente, primeiro clique na ferramenta <strong>Condutor</strong> que está piscando na barra superior.';
      setProgress(3);highlightTerminal('start','14');highlightTerminal('k1','A1');highlightConductor();btn('Corrigir automaticamente',autoFix,'success');btn('Vou ligar sozinho',()=>showManualWireInstructions());return;
    }
    renderOrganizeStage();
  };

  const renderChallenge02=()=>{
    if(completed){
      stepEl.textContent='Concluído';stateEl.textContent='Selo funcionando';questionEl.textContent='✓ Resolvido! K1 continuou ligada depois que você soltou o START.';
      copyEl.innerHTML='O <strong>contato auxiliar NA 13/14 de K1</strong> fecha quando a bobina arma. A ligação <strong>K1 14 → K1 A1</strong> cria um caminho em paralelo ao START e mantém a bobina energizada até o circuito ser interrompido pelo STOP ou pela proteção.';
      setProgress(5);btn('Rever o contato 13/14',()=>{highlightTerminal('k1','13');highlightTerminal('k1','14');highlightTerminal('k1','A1')});btn('Destacar STOP',()=>highlightComponent('stop'));return;
    }
    if(stage===0){
      stepEl.textContent='Etapa 1 de 5';stateEl.textContent='Observe o comportamento';questionEl.textContent='O que mantém a contatora ligada depois de soltar o START?';
      copyEl.innerHTML='Este circuito tem <strong>uma única falha proposital no selo</strong>. Clique em <strong>▶ Executar</strong>. Depois pressione e solte <strong>LIGA / START</strong> normalmente e observe K1 e o motor.';
      setProgress(0);highlightExecute();btn('Destacar ▶ Executar',highlightExecute);return;
    }
    if(stage===1){
      stepEl.textContent='Etapa 2 de 5';
      if(readyForValidation){
        stateEl.textContent='Correção pronta para teste';questionEl.textContent='Pressione LIGA e solte o botão';
        copyEl.innerHTML='Agora o teste é diferente: pressione <strong>LIGA / START</strong> e <strong>solte</strong>. O desafio só será concluído se K1 e o motor continuarem ligados depois que a botoeira voltar a abrir.';
        setProgress(1);highlightComponent('start');btn('Destacar LIGA / START',()=>highlightComponent('start'),'primary');return;
      }
      stateEl.textContent=attempted?'K1 armou, mas caiu ao soltar':'Faça o primeiro teste';
      questionEl.textContent=attempted?'Por que ela só fica ligada enquanto você segura o START?':'Pressione LIGA / START e solte';
      copyEl.innerHTML=attempted?(heldResponseSeen?'Você viu o detalhe importante: <strong>K1 e o motor responderam enquanto START estava pressionado</strong>, mas desligaram quando o botão foi solto. A alimentação inicial existe; o defeito está no caminho que deveria manter a bobina energizada.':'O circuito perdeu o comando ao liberar START. Pense em qual caminho deveria manter <strong>A1</strong> alimentado depois que a botoeira NA volta a abrir.'):'Pressione a botoeira verde e solte normalmente. Observe primeiro se K1 chega a armar e o que acontece logo depois que o botão retorna.';
      setProgress(1);highlightComponent('start');if(attempted){btn('Dica 1',()=>{stage=2;render()},'primary');btn('Tentar novamente',()=>highlightComponent('start'))}return;
    }
    if(stage===2){
      stepEl.textContent='Etapa 3 de 5';stateEl.textContent='Dica progressiva';questionEl.textContent='Dica 1 — procure o selo da contatora';
      copyEl.innerHTML='START é um contato momentâneo: ao soltar, <strong>13/14 da botoeira abre novamente</strong>. Para K1 continuar ligada, outro contato NA precisa assumir esse caminho. Observe o <strong>contato auxiliar 13/14 da própria K1</strong>. A ferramenta <strong>Condutor</strong> já está piscando porque falta uma ligação.';
      setProgress(2);highlightComponent('start');highlightComponent('k1');highlightConductor();btn('Mostrar os pontos',()=>{stage=3;render()},'primary');btn('Tentar sem revelar',()=>{stage=1;render()});return;
    }
    if(stage===3){
      stepEl.textContent='Etapa 4 de 5';stateEl.textContent='Pontos do selo destacados';questionEl.textContent='Feche o caminho de auto-retenção';
      copyEl.innerHTML='O borne <code>K1 13</code> já recebe alimentação. Quando K1 arma, o contato auxiliar fecha entre <code>13 e 14</code>. Falta levar a saída <code>K1 14</code> até a bobina <code>K1 A1</code>. Use <strong>Condutor</strong> e ligue os dois pontos destacados.';
      setProgress(3);highlightTerminal('k1','13');highlightTerminal('k1','14');highlightTerminal('k1','A1');highlightConductor();btn('Corrigir automaticamente',autoFix,'success');btn('Vou ligar sozinho',()=>showManualWireInstructions());return;
    }
    renderOrganizeStage();
  };

  const renderChallenge03=()=>{
    const relayId=profile.relayId,contactorId=profile.contactorId;
    if(completed){
      stepEl.textContent='Concluído';stateEl.textContent='Cadeia de comando funcionando';questionEl.textContent='✓ Resolvido! GPIO25 comandou o relé, a contatora e a bomba.';
      copyEl.innerHTML='O <strong>ESP32 não alimenta o motor trifásico diretamente</strong>. O GPIO25 fornece apenas o sinal lógico para a entrada do relé. O contato seco <strong>COM1/NO1 de KR1</strong> então comuta a tensão do circuito de comando para a <strong>bobina da contatora</strong>. Só a contatora fecha os três polos de potência que alimentam a bomba.';
      setProgress(5);btn('Rever a cadeia',()=>{highlightComponent(profile.espId);highlightComponent(relayId);highlightComponent(contactorId);highlightComponent('p1')});btn('Rever NO1 → A2',()=>{highlightTerminal(relayId,'NO1');highlightTerminal(contactorId,'A2')});return;
    }
    if(stage===0){
      stepEl.textContent='Etapa 1 de 5';stateEl.textContent='Observe a cadeia de acionamento';questionEl.textContent='Como o ESP32 comanda um motor trifásico sem ligar o motor direto nele?';
      copyEl.innerHTML='Há <strong>uma única ligação propositalmente ausente</strong>. Clique em <strong>▶ Executar</strong>. Depois, no ESP32, acione <strong>GPIO25</strong> pelo controle lógico/manual e observe quais dispositivos respondem.';
      setProgress(0);highlightExecute();highlightComponent(profile.espId);btn('Destacar ▶ Executar',highlightExecute);return;
    }
    if(stage===1){
      stepEl.textContent='Etapa 2 de 5';
      if(readyForValidation){
        stateEl.textContent='Correção pronta para teste';questionEl.textContent='Desligue e ligue GPIO25 novamente';
        copyEl.innerHTML='Para validar de verdade, coloque <strong>GPIO25 em LOW/desligado</strong> e depois ative novamente. O desafio só conclui quando o novo comando faz <strong>KR1 energizar, a contatora fechar e a bomba entrar em funcionamento</strong>.';
        setProgress(1);highlightComponent(profile.espId);highlightComponent(relayId);return;
      }
      stateEl.textContent=attempted?'KR1 respondeu • contatora e bomba não':'Faça o primeiro teste';
      questionEl.textContent=attempted?'Se o relé recebeu o comando do ESP32, por que o motor ainda não parte?':'Acione GPIO25 no ESP32';
      copyEl.innerHTML=attempted?'Você encontrou uma pista importante: <strong>GPIO25 conseguiu energizar KR1</strong>. Portanto a parte lógica ESP32 → entrada do relé está funcionando. O defeito está depois do relé, no caminho que deveria levar a tensão de comando até a bobina da contatora.':'Com a simulação executando, use o controle lógico do ESP32 para colocar <strong>GPIO25 em nível ativo</strong>. Observe o LED/estado de KR1, a contatora e a bomba.';
      setProgress(1);highlightComponent(profile.espId);highlightComponent(relayId);if(attempted){btn('Dica 1',()=>{stage=2;render()},'primary');btn('Observar novamente',()=>{highlightComponent(relayId);highlightComponent(contactorId)})}return;
    }
    if(stage===2){
      stepEl.textContent='Etapa 3 de 5';stateEl.textContent='Dica progressiva';questionEl.textContent='Dica 1 — separe lógica, interface e potência';
      copyEl.innerHTML='O <strong>GPIO25</strong> trabalha no lado lógico e apenas aciona a entrada <strong>IN1</strong> do módulo de relé. O ESP32 não deve alimentar a bobina de potência nem o motor. Quando KR1 energiza, quem deve continuar o comando é o <strong>contato seco COM1/NO1</strong> do relé, levando a tensão adequada até a bobina da contatora.';
      setProgress(2);highlightComponent(profile.espId);highlightComponent(relayId);highlightComponent(contactorId);highlightConductor();btn('Mostrar os pontos',()=>{stage=3;render()},'primary');btn('Tentar sem revelar',()=>{stage=1;render()});return;
    }
    if(stage===3){
      stepEl.textContent='Etapa 4 de 5';stateEl.textContent='Pontos da interface destacados';questionEl.textContent='Complete a saída do relé até a bobina da contatora';
      copyEl.innerHTML='O borne <code>COM1</code> de KR1 já recebe a alimentação do comando. Quando GPIO25 energiza o relé, <code>COM1</code> fecha com <code>NO1</code>. Falta ligar <code>KR1 NO1</code> ao borne <code>A2</code> da contatora. Use <strong>Condutor</strong> e una os dois pontos destacados.';
      setProgress(3);highlightTerminal(relayId,'NO1');highlightTerminal(contactorId,'A2');highlightConductor();btn('Corrigir automaticamente',autoFix,'success');btn('Vou ligar sozinho',()=>showManualWireInstructions());return;
    }
    renderOrganizeStage();
  };


  const renderChallenge04=()=>{
    const t1=profile.thermal1Id,k1=profile.contactor1Id,k2=profile.contactor2Id,p1=profile.pump1Id,p2=profile.pump2Id;
    const auto=selectorAuto(),lowOn=deviceActive(profile.lowId);
    if(completed){
      stepEl.textContent='Concluído';stateEl.textContent='Reserva assumiu automaticamente';questionEl.textContent='✓ Resolvido! B2 assumiu quando RT1 retirou B1 de serviço.';
      copyEl.innerHTML='Você acompanhou toda a sequência: <strong>S1 em AUTO → NÍVEL BAIXO → B1 em marcha → RT1 em falha → GPIO26/KR1 canal 2 → KM2 → B2</strong>. Em um sistema principal/reserva, a automação detecta a indisponibilidade da principal e transfere o comando para a bomba saudável.';
      setProgress(5);btn('Rever a sequência',()=>{highlightDualAuto();highlightDualLow();highlightComponent(profile.espId);highlightComponent(profile.relayId);highlightComponent(k2);highlightComponent(p2)});btn('Rever NO2 → KM2 A1',()=>{highlightTerminal(profile.relayId,'NO2');highlightTerminal(k2,'A1')});return;
    }
    if(stage===0){
      stepEl.textContent='Etapa 1 • iniciar';stateEl.textContent='Primeiro ligue a simulação';questionEl.textContent='Vamos testar a alternância passo a passo';
      copyEl.innerHTML='Este projeto tem mais elementos que os desafios anteriores. Por isso o guia vai indicar <strong>cada comando na ordem</strong>. Comece clicando em <strong>▶ Executar</strong>. Depois eu vou mostrar a chave S1, o NÍVEL BAIXO, B1 e RT1.';
      setProgress(0);highlightExecute();btn('Destacar ▶ Executar',highlightExecute);return;
    }
    if(stage===1){
      setProgress(1);
      if(readyForValidation){
        if(!auto){
          stepEl.textContent='Teste final • 1/4';stateEl.textContent='Coloque S1 em AUTO';questionEl.textContent='Antes de repetir a falha, confirme o modo automático';
          copyEl.innerHTML='A <strong>chave seletora física S1</strong> define AUTO/MANUAL. Clique nela até o painel mostrar <strong>MODO = AUTO</strong>. Sem AUTO a lógica de principal/reserva não faz a transferência.';
          const n=highlightDualAuto();btn('Localizar S1',()=>focusNode(n),'primary');return;
        }
        if(!validationThermalSawHealthy){
          stepEl.textContent='Teste final • 2/4';stateEl.textContent='Rearme RT1';questionEl.textContent='Devolva B1 ao serviço';
          copyEl.innerHTML='RT1 ainda está disparado. Clique novamente no <strong>botão azul RESET de RT1</strong> para rearmar a proteção. O destaque mostra o relé térmico da B1.';
          const n=highlightThermalReset(t1);btn('Localizar RT1',()=>focusNode(n),'primary');return;
        }
        if(!validationPrimaryRunningSeen){
          stepEl.textContent='Teste final • 3/4';stateEl.textContent=lowOn?'Pedido de nível baixo ativo':'Solicite NÍVEL BAIXO';questionEl.textContent='Faça B1 funcionar antes de provocar a falha';
          copyEl.innerHTML=lowOn?'O pedido de <strong>NÍVEL BAIXO</strong> já está ativo. Aguarde B1 entrar em marcha. Observe a sequência <strong>GPIO25 → KR1 canal 1 → KM1 → B1</strong>.':'No painel <strong>DUAS BOMBAS • ALTERNÂNCIA</strong>, clique no botão destacado <strong>NÍVEL BAIXO</strong>. Também destacamos BMIN, a boia que representa essa condição no circuito.';
          const n=highlightDualLow();highlightComponent(p1);btn('Localizar NÍVEL BAIXO',()=>focusNode(n),'primary');return;
        }
        stepEl.textContent='Teste final • 4/4';stateEl.textContent='Provoque a falha novamente';questionEl.textContent='Dispare RT1 e acompanhe B2 assumir';
        copyEl.innerHTML='B1 já foi confirmada em marcha. Agora clique no <strong>botão azul RESET de RT1</strong> para disparar a proteção. Observe: B1 sai, o ESP32 chama <strong>GPIO26</strong>, KR1 canal 2 fecha, KM2 recebe comando e <strong>B2 deve entrar em marcha</strong>.';
        const n=highlightThermalReset(t1);highlightComponent(profile.espId);highlightComponent(profile.relayId);highlightComponent(k2);highlightComponent(p2);btn('Localizar RT1',()=>focusNode(n),'primary');return;
      }

      if(dualGuideStep===0){
        stepEl.textContent='Etapa 2 • modo AUTO';stateEl.textContent=auto?'S1 já está em AUTO':'S1 está em MANUAL';questionEl.textContent='1. Localize a chave seletora S1 e confirme AUTO';
        copyEl.innerHTML=auto?'A chave física <strong>S1</strong> já está na posição AUTO. Repare também no painel: o campo <strong>MODO</strong> deve mostrar AUTO. Mesmo já estando correto, estou destacando os dois locais para você saber onde fica esse comando.':'A chave física <strong>S1</strong> está em MANUAL. Clique na chave destacada até o campo <strong>MODO</strong> do painel mudar para AUTO. Só depois siga para o nível.';
        const n=highlightDualAuto();btn('Localizar S1',()=>focusNode(n),'primary');if(auto)btn('AUTO confirmado • próximo',()=>{dualGuideStep=1;dualAutoObserved=true;render()},'success');return;
      }
      if(dualGuideStep===1){
        stepEl.textContent='Etapa 3 • pedir bombeamento';stateEl.textContent=lowOn?'NÍVEL BAIXO ativo':'Aguardando NÍVEL BAIXO';questionEl.textContent='2. Clique em NÍVEL BAIXO';
        copyEl.innerHTML=lowOn?'Perfeito: o pedido de <strong>NÍVEL BAIXO</strong> já chegou ao controlador. A boia BMIN e o botão do painel estão destacados. Agora vamos observar quem deve partir primeiro.':'No painel <strong>DUAS BOMBAS • ALTERNÂNCIA</strong>, clique no botão que está piscando: <strong>NÍVEL BAIXO</strong>. Esse comando simula a boia BMIN pedindo água e deve iniciar a bomba principal.';
        const n=highlightDualLow();btn('Localizar NÍVEL BAIXO',()=>focusNode(n),'primary');if(lowOn)btn('NÍVEL BAIXO confirmado • próximo',()=>{dualGuideStep=2;dualLowObserved=true;render()},'success');return;
      }
      if(dualGuideStep===2){
        const p1On=machineOn(p1);
        stepEl.textContent='Etapa 4 • observar B1';stateEl.textContent=p1On?'B1 está em marcha':'Aguardando B1';questionEl.textContent='3. Veja o caminho da bomba principal';
        copyEl.innerHTML=p1On?'B1 entrou em marcha. Observe o caminho: <strong>ESP32 GPIO25 → KR1 canal 1 → KM1 → RT1 → B1</strong>. Essa é a bomba principal neste primeiro ciclo. O próximo passo é provocar uma falha em RT1.':'Com AUTO e NÍVEL BAIXO ativos, B1 deve ser a primeira principal. Observe o ESP32, o módulo KR1, KM1, RT1 e a bomba B1. Aguarde B1 entrar em marcha antes de continuar.';
        highlightComponent(profile.espId);highlightTerminal(profile.espId,'GPIO25');highlightComponent(profile.relayId);highlightComponent(k1);highlightComponent(t1);highlightComponent(p1);
        if(p1On)btn('B1 em marcha • simular falha',()=>{primarySeen=true;dualGuideStep=3;render()},'success');else btn('Localizar B1',()=>focusNode(component(p1)),'primary');return;
      }
      if(dualGuideStep===3){
        stepEl.textContent='Etapa 5 • criar a falha';stateEl.textContent='B1 funcionando • agora dispare RT1';questionEl.textContent='4. Simule a sobrecarga da bomba principal';
        copyEl.innerHTML='Localize <strong>RT1</strong>, o relé térmico de B1. Clique no <strong>botão azul RESET</strong> destacado no próprio RT1 para provocar o disparo manual. Isso representa uma sobrecarga/falha da bomba principal. O sistema em AUTO deve então tentar transferir para B2.';
        const n=highlightThermalReset(t1);highlightComponent(p1);btn('Localizar RT1 / RESET',()=>focusNode(n),'primary');return;
      }

      stateEl.textContent='ESP32 chamou B2 • a reserva não entrou';questionEl.textContent='5. A transferência foi pedida, mas onde ela parou?';
      copyEl.innerHTML='<strong>RT1 retirou B1 de serviço</strong> e o ESP32 mudou o comando para <strong>GPIO26</strong>. O canal 2 de KR1 recebe o comando, mas KM2 e B2 continuam paradas. Agora siga visualmente a cadeia destacada: <strong>ESP32 → KR1 → KM2 → B2</strong>. A falha está no trecho de comando entre o relé e KM2.';
      highlightComponent(profile.espId);highlightTerminal(profile.espId,'GPIO26');highlightComponent(profile.relayId);highlightComponent(k2);highlightComponent(p2);btn('Dica 1 • seguir o circuito',()=>{stage=2;render()},'primary');btn('Localizar KM2',()=>focusNode(component(k2)));return;
    }
    if(stage===2){
      stepEl.textContent='Etapa 6 • diagnóstico';stateEl.textContent='Siga a transferência';questionEl.textContent='Dica — compare o canal 1 com o canal 2';
      copyEl.innerHTML='A lógica fez sua parte: <strong>GPIO26</strong> chamou o canal 2. Agora compare com B1. Para B2 funcionar, o caminho precisa ser <strong>COM2/NO2 de KR1 → bobina A1 de KM2 → contatos de potência → RT2 → B2</strong>. COM2 já está alimentado; procure o ponto onde a continuidade termina.';
      setProgress(2);highlightComponent(profile.espId);highlightTerminal(profile.espId,'GPIO26');highlightComponent(profile.relayId);highlightComponent(k2);highlightComponent(profile.thermal2Id);highlightComponent(p2);highlightConductor();btn('Mostrar exatamente os dois pontos',()=>{stage=3;render()},'primary');btn('Tentar localizar sozinho',()=>{dualGuideStep=4;stage=1;render()});return;
    }
    if(stage===3){
      stepEl.textContent='Etapa 7 • corrigir';stateEl.textContent='Dois pontos destacados';questionEl.textContent='Complete o comando da contatora KM2';
      copyEl.innerHTML='Encontramos a interrupção: falta levar a saída <code>KR1 NO2</code> até a bobina <code>KM2 A1</code>. O borne <code>COM2</code> já recebe a alimentação do circuito de comando. Use <strong>Condutor</strong> e ligue exatamente os dois pontos destacados.';
      setProgress(3);highlightTerminal(profile.relayId,'NO2');highlightTerminal(k2,'A1');highlightConductor();btn('Corrigir automaticamente',autoFix,'success');btn('Vou ligar sozinho',()=>showManualWireInstructions());return;
    }
    renderOrganizeStage();
  };


  const renderChallenge05=()=>{
    const motorId=profile.motorId,thermalId=profile.thermalId;
    if(completed){
      stepEl.textContent='Concluído';stateEl.textContent='Falha de potência corrigida';questionEl.textContent='✓ Resolvido! K1 arma e M1 agora recebe as três fases.';
      copyEl.innerHTML='O comando estava funcionando. O defeito estava no <strong>circuito de potência</strong>: o borne <code>V</code> do motor M1 estava sem alimentação porque faltava a ligação <strong>FT1 4 → M1 V</strong>. O Diagnóstico ajudou a separar rapidamente comando e potência.';
      setProgress(5);btn('Rever a fase corrigida',()=>{highlightTerminal('ft1','4');highlightTerminal(motorId,'V')});btn('Rever Diagnóstico',()=>highlightDiagnostic());return;
    }
    if(stage===0){
      stepEl.textContent='Etapa 1 de 5';stateEl.textContent='Primeiro observe o sintoma';questionEl.textContent='Tem alguma coisa errada neste circuito. Você consegue achar?';
      copyEl.innerHTML='Existe <strong>uma única falha proposital</strong>. Clique em <strong>▶ Executar</strong> e pressione <strong>LIGA / START</strong>. Não tente corrigir ainda: primeiro observe se a contatora e o motor respondem da mesma forma.';
      setProgress(0);highlightExecute();btn('Destacar ▶ Executar',highlightExecute);return;
    }
    if(stage===1){
      stepEl.textContent='Etapa 2 de 5';setProgress(1);
      if(readyForValidation){
        stateEl.textContent='Correção pronta para teste';questionEl.textContent='Teste novamente a partida';
        copyEl.innerHTML='Pressione <strong>LIGA / START</strong>. O desafio só conclui se <strong>K1 armar e M1 realmente entrar em marcha</strong> com as três fases presentes.';
        highlightComponent('start');btn('Destacar LIGA / START',()=>highlightComponent('start'),'primary');return;
      }
      if(attempted){
        stateEl.textContent='K1 arma • M1 continua parado';questionEl.textContent='O comando funcionou. Então onde está o defeito?';
        copyEl.innerHTML='A contatora <strong>K1 armou normalmente</strong>, mas o motor M1 não entrou em marcha. Isso já é uma pista: a falha não está necessariamente na botoeira ou na bobina. Agora use uma ferramenta do próprio TechRib para investigar antes de receber a resposta.';
        highlightComponent('k1');highlightComponent(motorId);btn('Ir para o Diagnóstico',()=>{stage=2;render()},'primary');return;
      }
      stateEl.textContent='Faça o primeiro teste';questionEl.textContent='Pressione LIGA / START';
      copyEl.innerHTML='Com a simulação executando, pressione a botoeira verde. Observe separadamente <strong>K1</strong> e <strong>M1</strong>: descobrir qual deles responde ajuda a definir se o problema está no comando ou na potência.';
      highlightComponent('start');return;
    }
    if(stage===2){
      stepEl.textContent='Etapa 3 de 5';stateEl.textContent=diagnosticUsed?'Diagnóstico executado':'Use a ferramenta Diagnóstico';questionEl.textContent=diagnosticUsed?'Leia a ocorrência encontrada para M1':'Clique em Diagnóstico na barra superior';
      copyEl.innerHTML=diagnosticUsed?'O relatório aponta que <strong>M1 possui potência sem ligação no borne V</strong> e que apenas parte do caminho trifásico chega à fonte. Feche o relatório quando terminar de ler e volte ao desafio para localizar fisicamente esse trecho.':'O botão <strong>Diagnóstico</strong> está destacado na barra superior. Clique nele. O TechRib vai analisar o circuito real e mostrar uma ocorrência específica no motor, em vez de apenas revelar a solução pelo guia.';
      setProgress(2);highlightDiagnostic();highlightComponent(motorId);
      if(diagnosticUsed)btn('Li o diagnóstico • localizar no circuito',()=>{stage=3;render()},'success');else btn('Destacar Diagnóstico',highlightDiagnostic,'primary');return;
    }
    if(stage===3){
      stepEl.textContent='Etapa 4 de 5';stateEl.textContent='Falha localizada no circuito de potência';questionEl.textContent='O borne V de M1 ficou sem uma fase';
      copyEl.innerHTML='Compare as três saídas do relé térmico FT1: <code>2 → U</code> e <code>6 → W</code> estão ligadas. Falta o caminho central: <code>FT1 4 → M1 V</code>. Use <strong>Condutor</strong> e una exatamente os dois pontos destacados.';
      setProgress(3);highlightComponent(thermalId);highlightComponent(motorId);highlightTerminal('ft1','4');highlightTerminal(motorId,'V');highlightConductor();btn('Corrigir automaticamente',autoFix,'success');btn('Vou ligar sozinho',()=>showManualWireInstructions());return;
    }
    renderOrganizeStage();
  };


  const renderChallenge06=()=>{
    const fwd=profile.forwardId,rev=profile.reverseId,stop=profile.stopId,k1=profile.forwardContactorId,k2=profile.reverseContactorId,i1=profile.interlockId,m1=profile.motorId;
    const k1On=componentOn(k1),k2On=componentOn(k2),mOn=machineOn(m1);
    if(completed){
      stepEl.textContent='Concluído';stateEl.textContent='Reversão e intertravamento funcionando';questionEl.textContent='✓ Resolvido! FRENTE e RÉ funcionam sem permitir os dois contatores juntos.';
      copyEl.innerHTML='A falha estava no comando de RÉ: faltava <strong>S2 14 → K1-NF 11</strong>. Esse contato NF de KM1 fica fechado quando KM1 está desligado e abre quando KM1 arma. Assim, o comando de KM2 passa pelo contator oposto e cria o <strong>intertravamento elétrico cruzado</strong>.';
      setProgress(5);btn('Rever S2 → K1-NF',()=>{highlightTerminal(rev,'14');highlightTerminal(i1,'11')});btn('Rever os dois NFs',()=>{highlightComponent(profile.interlockId);highlightComponent(profile.otherInterlockId)});return;
    }
    if(stage===0){
      stepEl.textContent='Etapa 1 de 5';stateEl.textContent='Teste os dois sentidos';questionEl.textContent='FRENTE funciona. E o comando de RÉ?';
      copyEl.innerHTML='Há <strong>uma única falha proposital</strong>. Clique em <strong>▶ Executar</strong>. Primeiro vamos confirmar FRENTE, depois parar o motor e tentar RÉ.';
      setProgress(0);highlightExecute();btn('Destacar ▶ Executar',highlightExecute);return;
    }
    if(stage===1){
      setProgress(1);
      if(readyForValidation){
        if(!validationReverseForwardOk){
          stepEl.textContent='Teste final • 1/4';stateEl.textContent='Confirme FRENTE';questionEl.textContent='Pressione S1 • FRENTE';
          copyEl.innerHTML='Depois da correção, confirme primeiro o circuito original de FRENTE. <strong>KM1 e M1 devem entrar em funcionamento</strong>.';
          const n=highlightPush(fwd,'S1 • FRENTE');highlightComponent(k1);highlightComponent(m1);btn('Localizar S1',()=>focusNode(n),'primary');return;
        }
        if(!validationReverseStopped){
          stepEl.textContent='Teste final • 2/4';stateEl.textContent='Pare antes de inverter';questionEl.textContent='Pressione S3 • PARAR';
          copyEl.innerHTML='Antes de inverter o sentido, pare o circuito. Aguarde <strong>KM1 desligar</strong>; isso fecha novamente o contato NF K1-NF e libera o caminho de RÉ.';
          const n=highlightPush(stop,'S3 • PARAR');highlightComponent(k1);btn('Localizar PARAR',()=>focusNode(n),'primary');return;
        }
        if(!validationReverseOk){
          stepEl.textContent='Teste final • 3/4';stateEl.textContent='Agora teste RÉ';questionEl.textContent='Pressione S2 • RÉ';
          copyEl.innerHTML='Agora S2 deve levar o comando através de <strong>K1-NF 11/12</strong> até KM2. O desafio espera <strong>KM2 e M1 em funcionamento</strong>.';
          const n=highlightPush(rev,'S2 • RÉ');highlightComponent(i1);highlightComponent(k2);highlightComponent(m1);btn('Localizar S2',()=>focusNode(n),'primary');return;
        }
        stepEl.textContent='Teste final • 4/4';stateEl.textContent='Com RÉ ligado, teste o intertravamento';questionEl.textContent='Agora pressione S1 • FRENTE sem parar RÉ';
        copyEl.innerHTML='Este é o teste do intertravamento: com <strong>KM2 ligado</strong>, pressione FRENTE. O contato <strong>K2-NF</strong> deve bloquear KM1. KM2 deve continuar ligado e <strong>KM1 não pode armar</strong>.';
        const n=highlightPush(fwd,'TESTE • FRENTE COM RÉ ATIVO');highlightComponent(profile.otherInterlockId);highlightComponent(k1);highlightComponent(k2);btn('Localizar S1',()=>focusNode(n),'primary');return;
      }
      if(reversingGuideStep===0){
        stepEl.textContent='Etapa 2 • testar FRENTE';stateEl.textContent=k1On&&mOn?'FRENTE funcionando':'Aguardando S1';questionEl.textContent='1. Pressione S1 • FRENTE';
        copyEl.innerHTML=k1On&&mOn?'Perfeito: <strong>KM1 armou e M1 entrou em funcionamento</strong>. Isso confirma que alimentação, proteção e o caminho de FRENTE estão funcionando. Agora pare o circuito.':'Pressione a botoeira <strong>S1 • FRENTE</strong>. O primeiro objetivo é provar que uma metade da reversão está funcionando antes de procurar a falha.';
        const n=highlightPush(fwd,'S1 • FRENTE');highlightComponent(k1);highlightComponent(m1);btn('Localizar FRENTE',()=>focusNode(n),'primary');return;
      }
      if(reversingGuideStep===1){
        stepEl.textContent='Etapa 3 • parar';stateEl.textContent='FRENTE confirmado';questionEl.textContent='2. Pressione S3 • PARAR';
        copyEl.innerHTML='Antes de pedir o sentido oposto, desligue KM1. Isso também faz o contato auxiliar <strong>K1-NF voltar ao estado fechado</strong>, condição necessária para permitir o comando de KM2.';
        const n=highlightPush(stop,'S3 • PARAR');highlightComponent(k1);highlightComponent(i1);btn('Localizar PARAR',()=>focusNode(n),'primary');return;
      }
      if(reversingGuideStep===2){
        stepEl.textContent='Etapa 4 • testar RÉ';stateEl.textContent='KM1 desligado';questionEl.textContent='3. Pressione S2 • RÉ';
        copyEl.innerHTML='Agora tente o sentido oposto. Pressione <strong>S2 • RÉ</strong> e observe KM2. Neste desafio, ele não deverá armar — esse é o sintoma que precisamos diagnosticar.';
        const n=highlightPush(rev,'S2 • RÉ');highlightComponent(k2);btn('Localizar RÉ',()=>focusNode(n),'primary');return;
      }
      stateEl.textContent='S2 foi pressionado • KM2 não armou';questionEl.textContent='FRENTE funciona, mas RÉ não. Onde o comando foi interrompido?';
      copyEl.innerHTML='Como FRENTE funcionou e KM1 foi desligado antes do teste, a alimentação principal está presente. Agora procure o caminho entre <strong>S2</strong>, o <strong>contato NF associado a KM1</strong> e a bobina de <strong>KM2</strong>.';
      highlightComponent(rev);highlightComponent(i1);highlightComponent(k2);btn('Dica 1 — entender o intertravamento',()=>{stage=2;render()},'primary');btn('Tentar RÉ novamente',()=>highlightPush(rev,'S2 • RÉ'));return;
    }
    if(stage===2){
      stepEl.textContent='Etapa 3 de 5';stateEl.textContent='Dica — intertravamento elétrico';questionEl.textContent='Por que o comando de RÉ passa por um contato NF de KM1?';
      copyEl.innerHTML='Em uma reversão, KM1 e KM2 não devem receber comando juntos. Por isso a bobina de <strong>KM2</strong> é alimentada através de um contato <strong>NF de KM1</strong>. Quando KM1 arma, esse NF abre e bloqueia RÉ. Quando KM1 desliga, o NF fecha e permite que S2 comande KM2. Neste circuito, o trecho entre <strong>S2 e esse NF</strong> está interrompido.';
      setProgress(2);highlightComponent(k1);highlightComponent(i1);highlightComponent(k2);highlightConductor();btn('Mostrar os dois pontos',()=>{stage=3;render()},'primary');btn('Tentar localizar sozinho',()=>{stage=1;reversingGuideStep=3;render()});return;
    }
    if(stage===3){
      stepEl.textContent='Etapa 4 de 5';stateEl.textContent='Ligação ausente destacada';questionEl.textContent='Complete S2 até o contato NF de KM1';
      copyEl.innerHTML='Falta exatamente a ligação <code>S2 14 → K1-NF 11</code>. A saída <code>K1-NF 12</code> já segue para <code>KM2 A1</code>. Use <strong>Condutor</strong> e una os dois pontos destacados.';
      setProgress(3);highlightTerminal(rev,'14');highlightTerminal(i1,'11');highlightConductor();btn('Corrigir automaticamente',autoFix,'success');btn('Vou ligar sozinho',()=>showManualWireInstructions());return;
    }
    renderOrganizeStage();
  };

  const renderOrganizeStage=()=>{
    if(stage!==4)return;
    stepEl.textContent='Etapa 5 de 5';stateEl.textContent='Ligação feita • organize o trajeto';questionEl.textContent='Boa! Agora organize este fio';
    copyEl.innerHTML='O fio destacado está eletricamente ligado, mas o trajeto pode ficar desorganizado. <strong>Clique no fio destacado</strong> e depois escolha <strong>Organizar fios</strong> na barra superior. Também é possível usar o botão direito e escolher <strong>Organizar esta ligação</strong>.';
    setProgress(4);highlightSolutionWire();btn('Destacar Organizar fios',()=>{highlightSolutionWire();highlightOrganize()},'primary');btn('Já organizei • testar',()=>{readyForValidation=true;validationPressSeen=false;validationReleaseSeen=false;validationRelaySawOff=false;validationRelayCommandSeen=false;validationThermalSawHealthy=false;validationPrimaryRunningSeen=false;validationFailoverSeen=false;validationReverseForwardOk=false;validationReverseStopped=false;validationReverseOk=false;validationInterlockClick=false;stage=1;attempted=true;render()},'success');
  };

  const solutionLabels=()=>profile?.kind==='missing-seal'?['K1 14','K1 A1']:profile?.kind==='relay-contactor-link'?['KR1 NO1','Contatora A2']:profile?.kind==='dual-pump-failover'?['KR1 NO2','KM2 A1']:profile?.kind==='guided-diagnostic-missing-phase'?['FT1 4','M1 V']:profile?.kind==='reversing-interlock-open-command'?['S2 14','K1-NF 11']:['START 14','K1 A1'];
  const showManualWireInstructions=()=>{
    if(!profile)return;
    stateEl.textContent='1. Selecione a ferramenta Condutor';
    const [fromLabel,toLabel]=solutionLabels();
    copyEl.innerHTML=`Clique em <strong>Condutor</strong> na barra superior — o botão está piscando. Depois clique no terminal <code>${fromLabel}</code> e, em seguida, no terminal <code>${toLabel}</code>. Assim que o TechRib detectar o novo fio, ele será destacado.`;
    highlightTerminal(profile.solution.fromId,profile.solution.fromTerminal);highlightTerminal(profile.solution.toId,profile.solution.toTerminal);if(profile.kind==='missing-seal')highlightTerminal('k1','13');highlightConductor();
  };

  const render=()=>{
    if(!active||!panel||!profile)return;panel.hidden=false;actionsEl.innerHTML='';clearHighlights();syncPanelProfile();
    if(profile.kind==='missing-seal')renderChallenge02();else if(profile.kind==='relay-contactor-link')renderChallenge03();else if(profile.kind==='dual-pump-failover')renderChallenge04();else if(profile.kind==='guided-diagnostic-missing-phase')renderChallenge05();else if(profile.kind==='reversing-interlock-open-command')renderChallenge06();else renderChallenge01();
  };

  const wireConnects=(wire,a,b)=>{const f=wire?.from?.el||wire?.from?.terminal||null,t=wire?.to?.el||wire?.to?.terminal||null;return(f===a&&t===b)||(f===b&&t===a)};
  const solutionWire=()=>{
    if(!profile)return null;
    const h=hooks(),a=terminal(profile.solution.fromId,profile.solution.fromTerminal),b=terminal(profile.solution.toId,profile.solution.toTerminal);
    if(!h||!a||!b)return null;try{return(h.wires?.()||[]).find(w=>wireConnects(w,a,b))||null}catch{return null}
  };
  const hasSolutionWire=()=>Boolean(solutionWire());
  const highlightSolutionWire=()=>{const wire=solutionWire();if(!wire)return null;[wire.path,wire.stripePath].filter(Boolean).forEach(node=>node.classList?.add('techrib-learn-solution-wire'));return wire};

  function autoFix(){
    if(!active||completed||!profile)return;
    const h=hooks(),from=component(profile.solution.fromId),to=component(profile.solution.toId);
    if(!h?.createWire||!from||!to){stateEl.textContent='Não foi possível criar a ligação automaticamente';return}
    if(hasSolutionWire()){autoFixed=true;stage=4;attempted=true;readyForValidation=false;render();return}
    try{
      const wire=h.createWire(from,profile.solution.fromTerminal,to,profile.solution.toTerminal,{color:profile.solution.color});
      wire?.path?.classList?.add('techrib-learn-auto-wire');window.setTimeout(()=>wire?.path?.classList?.remove('techrib-learn-auto-wire'),2300);
      h.recalculate?.();h.historyCapture?.();autoFixed=true;stage=4;attempted=true;readyForValidation=false;validationPressSeen=false;validationReleaseSeen=false;validationRelaySawOff=false;validationRelayCommandSeen=false;validationThermalSawHealthy=false;validationPrimaryRunningSeen=false;validationFailoverSeen=false;validationReverseForwardOk=false;validationReverseStopped=false;validationReverseOk=false;validationInterlockClick=false;render();stateEl.textContent='Ligação criada • organize o fio';highlightSolutionWire();
    }catch(error){console.warn('TechRib Aprenda na Prática:',error);stateEl.textContent='Falha ao criar a ligação automaticamente'}
  }

  const completeChallenge=()=>{
    if(completed||!profile)return;
    completed=true;render();
    document.dispatchEvent(new CustomEvent('techrib:interactive-challenge-completed',{detail:{id:profile.id,auto_fixed:autoFixed}}));
  };
  const checkSuccess=()=>{
    if(!active||completed||!profile)return;
    if(hasSolutionWire()&&stage!==4&&!readyForValidation){stage=4;readyForValidation=false;render();return}
    if(profile.kind==='relay-contactor-link'&&!readyForValidation&&simulationRunning()&&stage===1&&relayOn()&&!hasSolutionWire()){
      if(!attempted){attempted=true;render()}return;
    }
    if(profile.kind==='dual-pump-failover'&&!readyForValidation&&simulationRunning()&&stage===1&&!hasSolutionWire()){
      const auto=selectorAuto(),lowOn=deviceActive(profile.lowId),p1On=machineOn(profile.pump1Id),t1Failed=thermalTripped(profile.thermal1Id),reserveCommand=gpioHigh(profile.espId,'GPIO26'),p2On=machineOn(profile.pump2Id);
      if(dualGuideStep===0&&auto!==dualAutoObserved){dualAutoObserved=auto;render();return}
      if(dualGuideStep===1&&lowOn!==dualLowObserved){dualLowObserved=lowOn;render();return}
      if(dualGuideStep===2&&p1On&&!primarySeen){primarySeen=true;render();return}
      if(t1Failed&&reserveCommand&&!p2On&&!attempted){attempted=true;primarySeen=true;dualGuideStep=4;render();return}
      return;
    }
    if(profile.kind==='guided-diagnostic-missing-phase'&&!readyForValidation&&simulationRunning()&&stage===1&&!hasSolutionWire()){
      if(contactorOn()&&!motorOn()&&!attempted){attempted=true;render();return}
    }
    if(profile.kind==='reversing-interlock-open-command'&&!readyForValidation&&simulationRunning()&&stage===1&&!hasSolutionWire()){
      const fwdOn=componentOn(profile.forwardContactorId),revOn=componentOn(profile.reverseContactorId),mOn=machineOn(profile.motorId);
      if(reversingGuideStep===0&&fwdOn&&mOn&&!reversingForwardSeen){reversingForwardSeen=true;reversingGuideStep=1;render();return}
      if(reversingGuideStep===1&&reversingForwardSeen&&!fwdOn&&!revOn&&!reversingStopSeen){reversingStopSeen=true;reversingGuideStep=2;render();return}
    }
    if(!readyForValidation||!simulationRunning())return;
    if(profile.kind==='reversing-interlock-open-command'){
      const fwdOn=componentOn(profile.forwardContactorId),revOn=componentOn(profile.reverseContactorId),mOn=machineOn(profile.motorId);
      if(!validationReverseForwardOk&&fwdOn&&mOn){validationReverseForwardOk=true;render();return}
      if(validationReverseForwardOk&&!validationReverseStopped&&!fwdOn&&!revOn){validationReverseStopped=true;render();return}
      if(validationReverseStopped&&!validationReverseOk&&revOn&&mOn){validationReverseOk=true;render();return}
      if(validationReverseOk&&validationInterlockClick&&revOn&&!fwdOn&&mOn){completeChallenge();return}
      return;
    }
    if(profile.kind==='missing-seal'){
      if(validationPressSeen&&validationReleaseSeen&&!startPressed()&&contactorOn()&&motorOn())completeChallenge();
      return;
    }
    if(profile.kind==='relay-contactor-link'){
      const energized=relayOn();
      if(!energized){validationRelaySawOff=true;return}
      if(validationRelaySawOff&&energized)validationRelayCommandSeen=true;
      if(validationRelayCommandSeen&&contactorOn()&&motorOn())completeChallenge();
      return;
    }
    if(profile.kind==='dual-pump-failover'){
      const t1Failed=thermalTripped(profile.thermal1Id),p1On=machineOn(profile.pump1Id),reserveCommand=gpioHigh(profile.espId,'GPIO26');
      if(!selectorAuto())return;
      if(!t1Failed)validationThermalSawHealthy=true;
      if(validationThermalSawHealthy&&p1On)validationPrimaryRunningSeen=true;
      if(validationThermalSawHealthy&&validationPrimaryRunningSeen&&t1Failed)validationFailoverSeen=true;
      if(validationFailoverSeen&&reserveCommand&&componentOn(profile.contactor2Id)&&machineOn(profile.pump2Id))completeChallenge();
      return;
    }
    if(contactorOn()&&motorOn())completeChallenge();
  };

  const hideChallengeCanvasNotes=()=>sheet.querySelectorAll('.placed-component.text-block-object,.placed-component[data-type="text-block-object"]').forEach(node=>node.classList.add('techrib-learn-hidden-note'));
  const restoreChallengeCanvasNotes=()=>sheet.querySelectorAll('.techrib-learn-hidden-note').forEach(node=>node.classList.remove('techrib-learn-hidden-note'));
  const collapseSidebar=()=>{if(workbench.classList.contains('sidebar-hidden'))return;const button=document.querySelector('.close-sidebar')||document.querySelector('.sidebar-toggle');if(button)button.click();else workbench.classList.add('sidebar-hidden')};
  const resetState=()=>{stage=simulationRunning()?1:0;attempted=false;completed=false;autoFixed=false;readyForValidation=false;heldResponseSeen=false;releaseObserved=false;validationPressSeen=false;validationReleaseSeen=false;validationRelaySawOff=false;validationRelayCommandSeen=false;primarySeen=false;validationThermalSawHealthy=false;validationPrimaryRunningSeen=false;validationFailoverSeen=false;dualGuideStep=0;dualAutoObserved=false;dualLowObserved=false;diagnosticUsed=false;reversingGuideStep=0;reversingForwardSeen=false;reversingStopSeen=false;reversingReverseAttempted=false;validationReverseForwardOk=false;validationReverseStopped=false;validationReverseOk=false;validationInterlockClick=false};
  const activate=id=>{
    const next=PROFILES[String(id||'')];if(!next)return;
    profile=next;active=true;resetState();document.documentElement.classList.add('techrib-interactive-learning-active');document.body.classList.add('techrib-interactive-learning-active');collapseSidebar();hideChallengeCanvasNotes();buildPanel();render();clearInterval(checkTimer);checkTimer=window.setInterval(checkSuccess,180);
  };
  const deactivate=()=>{active=false;profile=null;readyForValidation=false;clearInterval(checkTimer);checkTimer=0;clearHighlights();restoreChallengeCanvasNotes();document.documentElement.classList.remove('techrib-interactive-learning-active');document.body.classList.remove('techrib-interactive-learning-active');if(panel)panel.hidden=true;if(reopenChip)reopenChip.hidden=true};

  document.addEventListener('techrib:official-example-opened',event=>{const id=String(event.detail?.id||'');if(PROFILES[id])window.setTimeout(()=>activate(id),120);else deactivate()});
  document.addEventListener('techrib:official-example-closed',deactivate);
  document.addEventListener('fullscreenchange',syncCoachFullscreenMount);document.addEventListener('webkitfullscreenchange',syncCoachFullscreenMount);

  const classObserver=new MutationObserver(()=>{
    if(!active||completed)return;
    if(simulationRunning()&&stage===0){stage=1;render();return}
    if(!simulationRunning()&&stage===1&&!attempted&&!hasSolutionWire()&&!readyForValidation){stage=0;render()}
  });
  classObserver.observe(workbench,{attributes:true,attributeFilter:['class']});

  // Desafio 06: acompanha a sequência física FRENTE → PARAR → RÉ e o teste final do intertravamento.
  document.addEventListener('click',event=>{
    if(!active||completed||!profile||profile.kind!=='reversing-interlock-open-command'||!simulationRunning())return;
    const c=event.target.closest?.('.placed-component');if(!c)return;
    const id=String(c.dataset.componentId||'');
    if(!readyForValidation&&stage===1&&reversingGuideStep===2&&id===profile.reverseId){
      reversingReverseAttempted=true;
      window.setTimeout(()=>{if(!active||completed||readyForValidation||profile?.kind!=='reversing-interlock-open-command')return;if(!componentOn(profile.reverseContactorId)){attempted=true;reversingGuideStep=3;render()}},340);
      return;
    }
    if(readyForValidation&&validationReverseOk&&id===profile.forwardId){
      validationInterlockClick=true;
      window.setTimeout(()=>checkSuccess(),260);
    }
  },true);

  // Desafio 05: registra que o usuário realmente executou o Diagnóstico do TechRib.
  document.addEventListener('click',event=>{
    if(!active||completed||!profile||profile.kind!=='guided-diagnostic-missing-phase'||stage!==2)return;
    const button=event.target.closest?.('[data-action="diagnostics"]');if(!button)return;
    diagnosticUsed=true;
    window.setTimeout(()=>{if(active&&profile?.kind==='guided-diagnostic-missing-phase'&&stage===2)render()},260);
  },true);

  // Orienta a seleção da ferramenta Condutor em qualquer desafio com ligação ausente.
  document.addEventListener('click',event=>{
    if(!active||completed||stage!==3||hasSolutionWire()||!profile)return;
    const tool=event.target.closest?.('[data-tool]');if(!tool)return;const selected=String(tool.dataset.tool||'');
    const [fromLabel,toLabel]=solutionLabels();
    if(selected==='wire'){
      document.querySelectorAll('.techrib-learn-toolbar-highlight').forEach(n=>n.classList.remove('techrib-learn-toolbar-highlight'));
      stateEl.textContent='Condutor selecionado • agora ligue os pontos';questionEl.textContent=`Faça a ligação ${fromLabel} → ${toLabel}`;
      copyEl.innerHTML=profile.kind==='missing-seal'?'Perfeito. Agora clique primeiro no terminal <code>K1 14</code> e depois no terminal <code>K1 A1</code>. O borne 13 já está alimentado e o novo fio completará o selo.':profile.kind==='relay-contactor-link'?'Perfeito. Agora clique primeiro no terminal <code>KR1 NO1</code> e depois no terminal <code>Contatora A2</code>. Essa ligação leva a tensão comutada pelo contato seco do relé até a bobina da contatora.':profile.kind==='dual-pump-failover'?'Perfeito. Agora clique primeiro no terminal <code>KR1 NO2</code> e depois no terminal <code>KM2 A1</code>. Assim o canal 2 do relé poderá entregar o comando da bomba reserva à bobina de KM2.':profile.kind==='guided-diagnostic-missing-phase'?'Perfeito. Agora clique primeiro no terminal <code>FT1 4</code> e depois no terminal <code>M1 V</code>. Esse é o condutor da fase central que o Diagnóstico identificou como ausente.':profile.kind==='reversing-interlock-open-command'?'Perfeito. Agora clique primeiro no terminal <code>S2 14</code> e depois no terminal <code>K1-NF 11</code>. Esse condutor leva o pedido de RÉ até o contato NF que faz o intertravamento com KM1.':'Perfeito. Agora clique primeiro no terminal <code>START 14</code> e depois no terminal <code>K1 A1</code>. Os dois pontos continuam destacados para orientar a ligação.';
      highlightTerminal(profile.solution.fromId,profile.solution.fromTerminal);highlightTerminal(profile.solution.toId,profile.solution.toTerminal);if(profile.kind==='missing-seal')highlightTerminal('k1','13');return;
    }
    window.setTimeout(()=>{if(!active||completed||stage!==3||hasSolutionWire()||!profile)return;const [a,b]=solutionLabels();stateEl.textContent='Use a ferramenta Condutor';questionEl.textContent='Selecione Condutor para criar a ligação';copyEl.innerHTML=`Para desenhar o fio deste desafio, escolha <strong>Condutor</strong> na barra superior. O botão está piscando. Depois ligue <code>${a}</code> a <code>${b}</code>.`;highlightTerminal(profile.solution.fromId,profile.solution.fromTerminal);highlightTerminal(profile.solution.toId,profile.solution.toTerminal);highlightConductor()},60);
  },false);

  document.addEventListener('click',event=>{
    if(!active||completed||stage!==4)return;const wire=solutionWire();if(!wire)return;
    if(event.target===wire.path||event.target===wire.stripePath||event.target===wire.hitPath){highlightSolutionWire();highlightOrganize();stateEl.textContent='Fio selecionado • agora use Organizar fios';copyEl.innerHTML='Perfeito. Com este condutor selecionado, clique em <strong>Organizar fios</strong> na barra superior. O TechRib organizará somente a ligação selecionada sem mover os componentes.'}
  },false);

  // Captura o ciclo físico da botoeira antes que o runtime elétrico interrompa a propagação do evento.
  let trackedStartPointer=null;
  const startActuatorFromEvent=event=>{
    if(!active||!profile||!simulationRunning())return null;
    const cap=event.target?.closest?.('[data-push-cap]');if(!cap)return null;
    const node=cap.closest?.('.placed-component');return String(node?.dataset?.componentId||'')===profile.startId?node:null;
  };
  document.addEventListener('pointerdown',event=>{
    const node=startActuatorFromEvent(event);if(!node||completed)return;trackedStartPointer=event.pointerId;
    if(readyForValidation){validationPressSeen=true;validationReleaseSeen=false}
    window.setTimeout(()=>{
      if(!active||completed||!simulationRunning()||!profile)return;
      if(contactorOn()&&motorOn()){
        if(profile.kind==='missing-seal'&&!hasSolutionWire()&&!readyForValidation){heldResponseSeen=true;if(stage===1&&panel&&!panel.hidden){stateEl.textContent='K1 armou enquanto START está pressionado';questionEl.textContent='Agora solte o botão';copyEl.innerHTML='Enquanto você segura START, a bobina recebe alimentação e o motor responde. <strong>Solte o botão agora</strong> e observe se K1 consegue se manter ligada sozinha.'}}
        if(readyForValidation&&profile.kind!=='missing-seal')checkSuccess();
      }
    },110);
  },true);
  const observeStartRelease=event=>{
    if(!active||!profile||trackedStartPointer===null||event.pointerId!==trackedStartPointer)return;trackedStartPointer=null;
    window.setTimeout(()=>{
      if(!active||completed||!profile)return;
      if(readyForValidation){validationReleaseSeen=true;checkSuccess();return}
      if(hasSolutionWire())return;
      attempted=true;releaseObserved=true;if(stage<1)stage=1;render();
    },320);
  };
  document.addEventListener('pointerup',observeStartRelease,true);document.addEventListener('pointercancel',observeStartRelease,true);

  // Compatibilidade com clique por teclado ou runtimes que sintetizam click sem pointerup.
  document.addEventListener('click',event=>{
    if(!active||completed||!simulationRunning()||!profile||readyForValidation)return;
    const c=event.target.closest?.('.placed-component');if(!c||String(c.dataset.componentId||'')!==profile.startId)return;
    window.setTimeout(()=>{if(!active||completed||hasSolutionWire())return;attempted=true;if(stage<1)stage=1;render()},650);
  },false);

  // Se o desafio abriu via deep-link antes deste runtime terminar de carregar.
  window.setTimeout(()=>{const current=window.TechRibSaaSBridge?.currentOfficial?.();const id=String(current?.id||'');if(PROFILES[id])activate(id)},550);

  window.TechRibInteractiveLearning={version:'6.0.0',challengeIds:Object.keys(PROFILES),reopen:()=>{if(active){buildPanel();panel.hidden=false;render()}},hasSolutionWire,solutionWire,currentChallenge:()=>profile?.id||''};
})();
