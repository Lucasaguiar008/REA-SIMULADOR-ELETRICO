/* TechRib — Funil / Analytics V1
   Complementa a telemetria já existente sem duplicar os eventos de retenção do usuário logado.
   Visitante: aquisição, CTA, demonstração e primeira resposta visual.
   Cadastrado: interação + mudança observável para medir ativação real. */
(function(){
  'use strict';

  const access=window.TECHRIB_USER_ACCESS||null;
  const authenticated=access?.authenticated===true;
  const csrf=document.querySelector('meta[name="csrf-token"]')?.content||'';
  const workbench=document.querySelector('[data-workbench]');
  const isGuestWorkbench=Boolean(workbench&&String(workbench.dataset.retentionMode||'')==='guest');
  const path=location.pathname||'/';
  const params=new URLSearchParams(location.search);
  let currentExampleId=String(params.get('example')||workbench?.dataset?.guestDemoExample||'');
  let currentExampleName='';
  let simulationActive=false;
  let simulationStarted=false;

  const device=()=>{
    const width=Math.max(document.documentElement.clientWidth||0,window.innerWidth||0);
    return width<=700?'mobile':width<=1024?'tablet':'desktop';
  };
  const base=()=>({
    path:(location.pathname||'/')+(location.search||''),
    page_title:String(document.title||'').slice(0,180),
    device:device(),
    viewport_width:Math.max(document.documentElement.clientWidth||0,window.innerWidth||0),
    viewport_height:Math.max(document.documentElement.clientHeight||0,window.innerHeight||0),
  });
  const post=(event,metadata={})=>{
    const headers={'Content-Type':'application/json'};
    if(csrf)headers['X-CSRF-Token']=csrf;
    return fetch('/?api=saas-retention-event',{
      method:'POST',credentials:'same-origin',keepalive:true,headers,
      body:JSON.stringify({event,metadata:{...base(),...metadata}}),
    }).catch(()=>{});
  };
  const cleanText=value=>String(value||'').replace(/\s+/g,' ').trim().slice(0,100);
  const destinationFor=anchor=>{
    try{const u=new URL(anchor.href,location.href);return u.origin===location.origin?u.pathname+u.search:''}catch{return''}
  };
  const isSimulatorDestination=dest=>dest==='/app'||dest.startsWith('/app?')||dest.startsWith('/demo/');
  const isSignupDestination=dest=>dest==='/cadastro'||dest.startsWith('/cadastro?');

  // Páginas privadas não geram page_view anônimo. Em páginas públicas o servidor ignora esta
  // telemetria quando já existe usuário autenticado, mantendo o topo do funil realmente anônimo.
  const privatePrefixes=['/admin','/conta','/meus-projetos','/component-studio'];
  const publicPage=!workbench&&!privatePrefixes.some(prefix=>path===prefix||path.startsWith(prefix+'/'));
  if(!authenticated&&(publicPage||isGuestWorkbench))post('anonymous_session_started',{source:'web'});
  if(publicPage)post('public_page_view',{source:'web'});
  if(path==='/cadastro')post('signup_started',{source:'registration-page'});

  // V28: presença anônima em tempo quase real. O servidor identifica a sessão pelo
  // visitor_key da própria sessão PHP; não enviamos IP, e robôs conhecidos são ignorados.
  const anonymousPresenceActive=!authenticated&&(publicPage||isGuestWorkbench);
  let anonymousPresenceLast=0;
  const pingAnonymousPresence=()=>{
    if(!anonymousPresenceActive||document.visibilityState==='hidden')return;
    const now=Date.now();
    if(now-anonymousPresenceLast<15000)return;
    anonymousPresenceLast=now;
    fetch('/?api=saas-anonymous-presence-ping',{
      method:'POST',credentials:'same-origin',keepalive:true,
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({path:(location.pathname||'/')+(location.search||''),device:device()}),
    }).catch(()=>{});
  };
  if(anonymousPresenceActive){
    pingAnonymousPresence();
    window.setInterval(pingAnonymousPresence,45000);
    window.addEventListener('focus',pingAnonymousPresence,{passive:true});
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')pingAnonymousPresence();});
  }

  document.addEventListener('click',event=>{
    const anchor=event.target.closest?.('a[href]');
    if(!anchor)return;
    const destination=destinationFor(anchor);
    if(!destination||(!isSimulatorDestination(destination)&&!isSignupDestination(destination)))return;
    post('cta_clicked',{
      cta:cleanText(anchor.getAttribute('data-cta')||anchor.textContent||anchor.getAttribute('aria-label')||'link'),
      destination,
      source:'click',
    });
  },true);

  if(!workbench)return;

  if(isGuestWorkbench){
    post('simulator_opened',{source:'guest-app'});
    if(workbench.dataset.retentionFirstAccess==='1')post('guest_welcome_shown',{source:'guest-entry'});
    if(currentExampleId)post('public_example_viewed',{example_id:currentExampleId,source:'deep-link'});
  }

  document.addEventListener('techrib:official-example-opened',event=>{
    const detail=event.detail||{};
    currentExampleId=String(detail.id||currentExampleId||'');
    currentExampleName=String(detail.name||currentExampleName||'');
    if(isGuestWorkbench)post('public_example_viewed',{
      example_id:currentExampleId,example_name:currentExampleName,premium:Boolean(detail.premium),source:'example-opened',
    });
  });

  document.addEventListener('techrib:simulation-mode',event=>{
    const active=Boolean(event.detail?.active)&&event.detail?.mode!=='paused';
    if(active&&!simulationActive){
      simulationStarted=true;
      if(isGuestWorkbench)post('public_example_demo_started',{
        example_id:currentExampleId,example_name:currentExampleName,source:'toolbar',
      });
    }
    simulationActive=active;
  });

  // V9: nos quatro exemplos guiados, o primeiro sucesso é confirmado pela própria lógica
  // da demonstração (carga/contator/LCD), evitando contar apenas a animação da botoeira.
  document.addEventListener('techrib:guest-demo-first-win',event=>{
    if(!isGuestWorkbench)return;
    const detail=event.detail||{};
    post('public_first_win',{
      example_id:String(detail.example_id||currentExampleId||''),
      example_name:currentExampleName,
      observable:'guided-circuit-response',
      source:String(detail.source||'guided-demo'),
      value:String(detail.mode||'').slice(0,80),
    });
  });

  // Assinatura visual leve para detectar uma mudança observável após a interação.
  // Ignora apenas classes puramente de seleção/foco para não confundir edição visual com resultado da simulação.
  const normalizedClass=node=>String(node?.className||'').split(/\s+/).filter(Boolean)
    .filter(name=>!['selected','is-selected','focused','is-focused','dragging'].includes(name)).sort().join('.');
  const visualSignature=component=>{
    if(!component)return'';
    const nodes=[component,...Array.from(component.querySelectorAll('*')).slice(0,45)];
    return nodes.map(node=>{
      const ds=node.dataset||{};
      return [
        node.tagName||'',normalizedClass(node),String(node.getAttribute?.('style')||''),
        String(ds.state||''),String(ds.value||''),String(ds.active||''),String(ds.on||''),
        cleanText(node.childElementCount?'' : node.textContent||'').slice(0,40),
      ].join('|');
    }).join('~');
  };

  const reportObservableChange=(component,before)=>{
    if(!component?.isConnected||!simulationActive)return;
    const after=visualSignature(component);
    if(!after||after===before)return;
    const meta={
      example_id:currentExampleId,example_name:currentExampleName,
      component_type:String(component.dataset?.type||''),component_id:String(component.dataset?.componentId||''),
      observable:'component-visual-state',source:'simulation-interaction',
    };
    if(isGuestWorkbench){
      if(window.TechRibGuestDemo?.guidedFirstWin!==true)post('public_first_win',meta);
      return;
    }
    if(authenticated){
      post('observable_state_changed',meta);
      const hasProjectContext=Boolean(currentExampleId||document.querySelector('[data-sheet] .placed-component'));
      if(simulationStarted&&hasProjectContext)post('activation_success',meta);
    }
  };

  document.addEventListener('pointerdown',event=>{
    if(!simulationActive)return;
    const component=event.target.closest?.('.placed-component');
    if(!component)return;
    const meta={
      example_id:currentExampleId,example_name:currentExampleName,
      component_type:String(component.dataset?.type||''),component_id:String(component.dataset?.componentId||''),
      interaction_type:'pointer',source:'simulation',
    };
    if(isGuestWorkbench)post('public_demo_interaction',meta);
    else if(authenticated)post('interactive_control_used',meta);

    const before=visualSignature(component);
    [140,420,900].forEach(delay=>window.setTimeout(()=>reportObservableChange(component,before),delay));
  },true);
})();
