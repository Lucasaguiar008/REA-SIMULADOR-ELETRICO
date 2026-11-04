/* TechRib — Retenção / Primeiro Acesso V4
   - onboarding somente no primeiro acesso da conta;
   - rastreia exemplos, simulação, centrais livres e permanência ativa;
   - mede primeira sessão em faixas de 1 e 5 minutos;
   - KNX e DALI permanecem no primeiro acesso. */
(function(){
  'use strict';

  const workbench=document.querySelector('[data-workbench]');
  if(!workbench)return;
  const access=window.TECHRIB_USER_ACCESS||{};
  const csrf=document.querySelector('meta[name="csrf-token"]')?.content||'';
  let currentExampleId=new URLSearchParams(location.search).get('example')||'';
  let simulationWasActive=false;

  const deviceLabel=()=>{
    const width=Math.max(document.documentElement.clientWidth||0,window.innerWidth||0);
    if(width<=700)return 'mobile';
    if(width<=1024)return 'tablet';
    return 'desktop';
  };
  const referrerHost=()=>{try{return document.referrer?new URL(document.referrer).hostname:''}catch{return''}};
  const baseMetadata=()=>({
    device:deviceLabel(),
    viewport_width:Math.max(document.documentElement.clientWidth||0,window.innerWidth||0),
    viewport_height:Math.max(document.documentElement.clientHeight||0,window.innerHeight||0),
    referrer_host:referrerHost(),
  });
  const post=(event,metadata={})=>{
    if(!csrf)return Promise.resolve();
    return fetch('/?api=saas-retention-event',{
      method:'POST',
      credentials:'same-origin',
      keepalive:true,
      headers:{'Content-Type':'application/json','X-CSRF-Token':csrf},
      body:JSON.stringify({event,metadata:{...baseMetadata(),...metadata}}),
    }).catch(()=>{});
  };

  document.addEventListener('techrib:official-example-opened',event=>{
    const detail=event.detail||{};
    currentExampleId=String(detail.id||currentExampleId||'');
    post('example_opened',{
      example_id:currentExampleId,
      example_name:String(detail.name||''),
      premium:Boolean(detail.premium),
      source:new URLSearchParams(location.search).has('example')?'deep-link':'library',
    });
  });

  document.addEventListener('techrib:simulation-mode',event=>{
    const active=Boolean(event.detail?.active);
    if(active&&!simulationWasActive){
      const title=document.querySelector('[data-project-name], input[data-project-name], .project-name input, #project-name')?.value||'';
      post('simulation_started',{example_id:currentExampleId,example_name:String(title||''),source:'toolbar'});
    }
    simulationWasActive=active;
  });

  // Métricas das duas centrais que continuam livres no acesso gratuito.
  document.addEventListener('click',event=>{
    const examples=event.target.closest?.('[data-action="show-examples"],[data-library-tab="examples"],[data-examples-center-open]');
    if(examples)post('examples_center_opened',{source:'app'});
    const help=event.target.closest?.('[data-menu="help"],[data-action="help"],[data-help-open]');
    if(help)post('help_center_opened',{source:'app'});
  },true);
  document.addEventListener('keydown',event=>{
    if(event.key==='F1')post('help_center_opened',{source:'keyboard'});
  },true);

  // Permanência ativa: conta apenas tempo em que a aba do simulador está visível.
  // São apenas dois checkpoints por sessão para não gerar volume desnecessário no audit_logs.
  let activeMs=0,lastActiveTick=Date.now(),sent60=false,sent300=false;
  const activeTick=()=>{
    const now=Date.now();
    if(document.visibilityState==='visible')activeMs+=Math.min(10000,Math.max(0,now-lastActiveTick));
    lastActiveTick=now;
    if(!sent60&&activeMs>=60000){sent60=true;post('session_60s',{active_seconds:Math.round(activeMs/1000),source:'app'})}
    if(!sent300&&activeMs>=300000){sent300=true;post('session_300s',{active_seconds:Math.round(activeMs/1000),source:'app'})}
  };
  window.setInterval(activeTick,5000);
  document.addEventListener('visibilitychange',activeTick);
  window.addEventListener('focus',activeTick);

  const welcomeMode=String(workbench.dataset.retentionMode||'user')==='guest'?'guest':'user';
  const hasExampleParam=new URLSearchParams(location.search).has('example');
  const skipSaved= (() => { try { return localStorage.getItem('techrib.first-access.hide.v1') === '1'; } catch { return false; } })();
  const shouldAutoShow=workbench.dataset.retentionFirstAccess==='1' && !hasExampleParam && !skipSaved;
  const guestCfg=window.TECHRIB_GUEST_DEMO||{};

  const userExampleIds={
    electrical:String(workbench.dataset.retentionExampleElectrical||'resid-simple-lamp'),
    esp32:String(workbench.dataset.retentionExampleEsp32||'industrial-esp32-relay-pump'),
    industrial:String(workbench.dataset.retentionExampleIndustrial||'industrial-soft-starter'),
    knx:String(workbench.dataset.retentionExampleKnx||'premium-knx-interface-4ch-g44-v1-test'),
    dali:String(workbench.dataset.retentionExampleDali||'premium-dali2-push-coupler-4ch-g52-v1-test'),
  };

  let activeOverlay=null;
  const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const guestChoices=Array.isArray(guestCfg.welcomeChoices)?guestCfg.welcomeChoices.filter(item=>item&&item.id):[];
  const query=new URLSearchParams(location.search);
  const demoReturn=welcomeMode==='user'&&query.get('demo_return')==='1';
  const demoStage=String(query.get('demo_stage')||'').slice(0,60);

  const clearDemoReturnParams=()=>{
    try{
      const url=new URL(location.href);
      url.searchParams.delete('demo_return');
      url.searchParams.delete('demo_stage');
      history.replaceState(null,'',url.pathname+(url.search||''));
    }catch{}
  };
  const pulseDemoEditTargets=()=>{
    const targets=[];
    const select=document.querySelector('[data-tool="select"]');
    if(select)targets.push(select);
    const firstComponent=document.querySelector('[data-sheet] .placed-component');
    if(firstComponent)targets.push(firstComponent);
    targets.forEach(node=>node.classList.add('techrib-demo-return-focus'));
    window.setTimeout(()=>targets.forEach(node=>node.classList.remove('techrib-demo-return-focus')),6500);
  };
  const showDemoReturn=({exampleName=''}={})=>{
    if(activeOverlay&&document.body.contains(activeOverlay))return;
    post('first_access',{source:'demo-return',example_id:currentExampleId});
    post('onboarding_shown',{source:'demo-return',example_id:currentExampleId});

    const fullAccess=access.can_save_project===true;
    const blockedFeature=demoStage.startsWith('locked-')?demoStage.slice(7):'';
    const featureLabels={save:'salvar o projeto',codegen:'gerar código',export:'exportar / imprimir'};
    const attempted=featureLabels[blockedFeature]||'';
    const overlay=document.createElement('div');
    activeOverlay=overlay;
    overlay.className='techrib-first-access techrib-demo-return';
    const name=escapeHtml(exampleName||document.querySelector('[data-project-name]')?.value||'este circuito');
    const accessNote=fullAccess
      ? 'Sua conta já possui acesso aos recursos de salvamento disponíveis no seu plano.'
      : 'No acesso gratuito, o projeto é temporário. Salvar, exportar e gerar código dependem do TechRib Completo.';
    const attemptedNote=attempted&&!fullAccess
      ? `<div class="techrib-demo-return-warning">O recurso que você tentou usar — <b>${escapeHtml(attempted)}</b> — continua sendo do TechRib Completo. A edição e a simulação já estão liberadas com sua conta.</div>`
      : '';
    overlay.innerHTML=`<section class="techrib-first-access-card techrib-demo-return-card" role="dialog" aria-modal="true" aria-labelledby="techrib-demo-return-title">
      <button class="techrib-first-access-close" type="button" data-demo-return-close aria-label="Fechar">×</button>
      <div class="techrib-first-access-brand"><span>⚡</span><b>LucasAguiar</b></div>
      <p class="techrib-first-access-kicker">CONTA CONECTADA • CIRCUITO PRESERVADO</p>
      <h1 id="techrib-demo-return-title">Você voltou para o mesmo circuito.</h1>
      <p class="techrib-first-access-lead"><b>${name}</b> foi reaberto com sua conta. Agora você pode selecionar componentes, alterar a montagem e testar suas mudanças sem começar do zero.</p>
      <div class="techrib-demo-return-success">✓ Sua demonstração virou um ponto de partida para continuar explorando.</div>
      ${attemptedNote}
      <div class="techrib-demo-return-actions">
        <button type="button" class="primary" data-demo-return-edit>Editar este circuito agora</button>
        <button type="button" data-demo-return-examples>Explorar outros exemplos</button>
      </div>
      <p class="techrib-first-access-note">${escapeHtml(accessNote)}</p>
    </section>`;
    document.body.appendChild(overlay);
    requestAnimationFrame(()=>overlay.classList.add('show'));

    const remove=({focus=false,examples=false}={})=>{
      overlay.classList.remove('show');
      if(activeOverlay===overlay)activeOverlay=null;
      clearDemoReturnParams();
      window.setTimeout(()=>{
        overlay.remove();
        if(focus)pulseDemoEditTargets();
        if(examples){
          const showExamples=document.querySelector('[data-action="show-examples"]');
          if(showExamples){showExamples.click();return}
          workbench.classList.remove('sidebar-hidden');
          document.querySelector('[data-library-tab="examples"]')?.click();
        }
      },180);
    };
    overlay.querySelector('[data-demo-return-edit]')?.addEventListener('click',()=>remove({focus:true}));
    overlay.querySelector('[data-demo-return-examples]')?.addEventListener('click',()=>remove({examples:true}));
    overlay.querySelector('[data-demo-return-close]')?.addEventListener('click',()=>remove());
    const esc=event=>{if(event.key==='Escape'&&document.body.contains(overlay)){document.removeEventListener('keydown',esc);remove()}};
    document.addEventListener('keydown',esc);
  };

  const showWelcome=({source='entry'}={})=>{
    if(activeOverlay&&document.body.contains(activeOverlay))return;
    if(welcomeMode==='user'){
      post('first_access',{source:'app'});
      post('onboarding_shown',{source});
    }

    const overlay=document.createElement('div');
    activeOverlay=overlay;
    overlay.className='techrib-first-access';
    overlay.dataset.firstAccess='';

    const userMain=`
      <div data-first-access-main>
        <p class="techrib-first-access-kicker">BEM-VINDO AO SIMULADOR</p>
        <h1 id="techrib-first-access-title">O que você quer experimentar primeiro?</h1>
        <p class="techrib-first-access-lead">Escolha um caminho e abra um exemplo pronto. Você pode executar a simulação imediatamente.</p>
        <div class="techrib-first-access-options techrib-first-access-options-main">
          <button type="button" data-first-access-choice="electrical"><span class="choice-icon">💡</span><span><b>Comandos elétricos</b><small>Começar por um circuito simples e visual.</small></span><i>→</i></button>
          <button type="button" data-first-access-choice="esp32"><span class="choice-icon">▣</span><span><b>ESP32 + Automação</b><small>Ver microcontrolador comandando uma carga real.</small></span><i>→</i></button>
          <button type="button" data-first-access-choice="industrial"><span class="choice-icon">⚙</span><span><b>Automação industrial</b><small>Abrir uma partida de motor pronta para simular.</small></span><i>→</i></button>
          <button type="button" data-first-access-tech><span class="choice-icon">⌁</span><span><b>KNX / DALI</b><small>Explorar automação predial e iluminação profissional.</small></span><i>→</i></button>
        </div>
        <button class="techrib-first-access-explore" type="button" data-first-access-explore>Prefiro explorar todos os exemplos</button>
      </div>
      <div data-first-access-tech-view hidden>
        <button class="techrib-first-access-back" type="button" data-first-access-back>← Voltar</button>
        <p class="techrib-first-access-kicker">AUTOMAÇÃO PREDIAL</p><h2>Qual tecnologia você quer conhecer?</h2>
        <p class="techrib-first-access-lead">Abra um exemplo didático já montado e veja o barramento funcionando no simulador.</p>
        <div class="techrib-first-access-options techrib-first-access-options-tech">
          <button type="button" data-first-access-choice="knx"><span class="choice-icon">K</span><span><b>KNX</b><small>Interface de botoeira + atuador em barramento KNX.</small></span><i>→</i></button>
          <button type="button" data-first-access-choice="dali"><span class="choice-icon">D</span><span><b>DALI / DALI-2</b><small>Entrada de comando + atuador de iluminação DALI-2.</small></span><i>→</i></button>
        </div>
      </div>`;

    const icons=['⚡','⚙','▣','⌁'];
    const guestCards=guestChoices.map((item,index)=>`<button type="button" data-guest-example-id="${escapeHtml(item.id)}"><span class="choice-icon">${icons[index%icons.length]}</span><span><b>${escapeHtml(item.name)}</b><small>${escapeHtml(String(item.category||'Exemplo LucasAguiar').replace(/^Padrão\s*•\s*/i,''))}</small></span><i>→</i></button>`).join('');
    const guestMain=`
      <div data-first-access-main>
        <p class="techrib-first-access-kicker">DEMONSTRAÇÃO INTERATIVA</p>
        <h1 id="techrib-first-access-title">O que você quer experimentar?</h1>
        <p class="techrib-first-access-lead">Escolha um exemplo liberado no simulador, execute a simulação e veja o circuito responder. Não é necessário cadastro para esta demonstração.</p>
        <div class="techrib-first-access-options techrib-first-access-options-main">${guestCards||'<div class="techrib-first-access-empty">Nenhuma demonstração pública foi configurada ainda.</div>'}</div>
        <button class="techrib-first-access-explore" type="button" data-first-access-explore>Explorar o catálogo de exemplos</button>
      </div>`;

    overlay.innerHTML=`<section class="techrib-first-access-card" role="dialog" aria-modal="true" aria-labelledby="techrib-first-access-title">
      <button class="techrib-first-access-close" type="button" data-first-access-close aria-label="Fechar">×</button>
      <div class="techrib-first-access-brand"><span>⚡</span><b>TechRib</b></div>
      ${welcomeMode==='guest'?guestMain:userMain}
      ${welcomeMode==='user'?'<label class="techrib-first-access-skip"><input type="checkbox" data-first-access-hide> Não mostrar novamente ao entrar no simulador</label>':''}
    </section>`;
    document.body.appendChild(overlay);
    requestAnimationFrame(()=>overlay.classList.add('show'));

    const hideCheck=overlay.querySelector('[data-first-access-hide]');
    const persistPreference=()=>{
      if(welcomeMode!=='user'||!hideCheck?.checked)return Promise.resolve();
      try { localStorage.setItem('techrib.first-access.hide.v1', '1'); } catch {}
      return post('onboarding_skip_next',{skip_next:true,source:'welcome'});
    };
    const removeOverlay=()=>{
      overlay.classList.remove('show');
      if(activeOverlay===overlay)activeOverlay=null;
      window.setTimeout(()=>overlay.remove(),180);
    };
    const close=choice=>{
      const jobs=[];
      if(welcomeMode==='user'&&choice)jobs.push(post('onboarding_choice',{choice,source:'onboarding'}));
      jobs.push(persistPreference());
      Promise.allSettled(jobs).finally(removeOverlay);
    };
    const navigateUser=choice=>{
      const exampleId=String(userExampleIds[choice]||'');
      if(!exampleId)return;
      Promise.allSettled([post('onboarding_choice',{choice,example_id:exampleId,source:'onboarding'}),persistPreference()])
        .finally(()=>location.assign((window.__LUCASAGUIAR_BASE_PATH__||'./')+'?example='+encodeURIComponent(exampleId)));
    };
    const navigateGuest=exampleId=>{
      exampleId=String(exampleId||'');
      if(!exampleId)return;
      location.assign((window.__LUCASAGUIAR_BASE_PATH__||'./')+'?example='+encodeURIComponent(exampleId));
    };

    overlay.querySelectorAll('[data-first-access-choice]').forEach(button=>button.addEventListener('click',()=>navigateUser(String(button.dataset.firstAccessChoice||''))));
    overlay.querySelectorAll('[data-guest-example-id]').forEach(button=>button.addEventListener('click',()=>navigateGuest(button.dataset.guestExampleId)));
    const mainView=overlay.querySelector('[data-first-access-main]');
    const techView=overlay.querySelector('[data-first-access-tech-view]');
    overlay.querySelector('[data-first-access-tech]')?.addEventListener('click',()=>{if(mainView)mainView.hidden=true;if(techView)techView.hidden=false});
    overlay.querySelector('[data-first-access-back]')?.addEventListener('click',()=>{if(techView)techView.hidden=true;if(mainView)mainView.hidden=false});
    overlay.querySelector('[data-first-access-explore]')?.addEventListener('click',()=>{
      const jobs=welcomeMode==='user'?[post('onboarding_choice',{choice:'explore',source:'onboarding'}),persistPreference()]:[];
      Promise.allSettled(jobs).finally(()=>{
        removeOverlay();
        const showExamples=document.querySelector('[data-action="show-examples"]');
        if(showExamples){showExamples.click();return}
        workbench.classList.remove('sidebar-hidden');
        document.querySelector('[data-library-tab="examples"]')?.click();
      });
    });
    overlay.querySelector('[data-first-access-close]')?.addEventListener('click',()=>close('close'));
    const esc=event=>{if(event.key==='Escape'&&document.body.contains(overlay)){document.removeEventListener('keydown',esc);close('escape')}};
    document.addEventListener('keydown',esc);
  };

  // “Início” permite reabrir a tela mesmo que o usuário tenha optado por não mostrá-la automaticamente.
  document.addEventListener('click',event=>{
    const button=event.target.closest?.('[data-action="welcome"]');
    if(!button)return;
    event.preventDefault();event.stopImmediatePropagation();showWelcome({source:'manual'});
  },true);

  if(demoReturn){
    let shown=false;
    const reveal=detail=>{
      if(shown)return;
      if(currentExampleId&&detail?.id&&String(detail.id)!==String(currentExampleId))return;
      shown=true;
      window.setTimeout(()=>showDemoReturn({exampleName:String(detail?.name||'')}),260);
    };
    document.addEventListener('techrib:official-example-opened',event=>reveal(event.detail||{}));
    window.setTimeout(()=>reveal({id:currentExampleId,name:document.querySelector('[data-project-name]')?.value||''}),1800);
  }else if(shouldAutoShow)showWelcome({source:welcomeMode==='guest'?'guest-entry':'login'});
})();
