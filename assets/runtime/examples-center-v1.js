(function(global){
  'use strict';

  const ROOT_ID='techrib-examples-center-v1';
  const STYLE_ID='techrib-examples-center-style-v1';
  const normalize=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9+./-]+/g,' ').replace(/\s+/g,' ').trim();
  const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const taxonomy=()=>global.TechRibExampleTaxonomyV1||{categories:[],meta:()=>null,levelLabel:l=>l==='basic'?'Básico':l==='advanced'?'Avançado':'Intermediário'};
  const cssEscape=value=>global.CSS?.escape?global.CSS.escape(String(value)):String(value).replace(/["\\]/g,'\\$&');

  let state={query:'',category:'all',access:'all',level:'all'};
  let root=null,main=null,side=null,search=null,observer=null,renderTimer=0;

  function injectStyles(){
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement('style');style.id=STYLE_ID;style.textContent=`
      body.techrib-examples-center-open{overflow:hidden}
      .techrib-examples-center-overlay{position:fixed;inset:0;z-index:120020;display:grid;place-items:center;padding:22px;background:rgba(2,12,18,.82);backdrop-filter:blur(9px)}
      .techrib-examples-center-overlay[hidden]{display:none!important}
      .techrib-examples-center-shell{display:grid;grid-template-rows:auto minmax(0,1fr);width:min(1480px,96vw);height:min(900px,94vh);overflow:hidden;border:1px solid #244b59;border-radius:19px;background:#081b24;color:#e9f8fc;box-shadow:0 30px 90px rgba(0,0,0,.48);font-family:Inter,Arial,sans-serif}
      .techrib-examples-center-top{display:grid;grid-template-columns:minmax(280px,.85fr) minmax(300px,1.35fr) auto;align-items:center;gap:22px;padding:17px 20px;border-bottom:1px solid #1d3d49;background:linear-gradient(135deg,#0b2530,#0d3440)}
      .techrib-examples-center-brand small{display:block;margin-bottom:4px;color:#5fd8d0;font-size:9px;font-weight:900;letter-spacing:.16em}.techrib-examples-center-brand h2{margin:0;font-size:20px}.techrib-examples-center-brand p{margin:4px 0 0;color:#91adb7;font-size:11px}
      .techrib-examples-center-search{display:grid;grid-template-columns:1fr 32px;align-items:center;height:42px;padding-left:13px;border:1px solid #315665;border-radius:11px;background:#071820}.techrib-examples-center-search:focus-within{border-color:#4bc6da;box-shadow:0 0 0 3px rgba(75,198,218,.10)}.techrib-examples-center-search input{min-width:0;border:0;outline:0;background:transparent;color:#f4fbfd;font:600 12px Inter,Arial,sans-serif}.techrib-examples-center-search input::placeholder{color:#6f909d}.techrib-examples-center-search span{color:#63c9da;font-size:18px;text-align:center}
      .techrib-examples-center-close{display:grid;place-items:center;width:38px;height:38px;border:1px solid #31515e;border-radius:10px;background:#102c37;color:#c8e0e6;font-size:24px;cursor:pointer}.techrib-examples-center-close:hover{border-color:#de7f61;color:#fff}
      .techrib-examples-center-body{display:grid;grid-template-columns:270px minmax(0,1fr);min-height:0}.techrib-examples-center-side{min-height:0;overflow:auto;padding:14px 10px 24px;border-right:1px solid #193844;background:#071a22}.techrib-examples-side-title{padding:9px 10px 7px;color:#678b98;font-size:9px;font-weight:900;letter-spacing:.13em}.techrib-examples-category{display:grid;grid-template-columns:32px minmax(0,1fr) auto;align-items:center;gap:6px;width:100%;margin:2px 0;padding:9px 10px;border:1px solid transparent;border-radius:10px;background:transparent;color:#a9c4cc;text-align:left;cursor:pointer}.techrib-examples-category:hover{background:#0c2933;color:#fff}.techrib-examples-category.active{border-color:#2f7384;background:#10333e;color:#fff}.techrib-examples-category .icon{display:grid;place-items:center;width:29px;height:29px;border-radius:8px;background:#102f3a;color:#73d8e4;font-size:13px;font-weight:900}.techrib-examples-category b{overflow:hidden;text-overflow:ellipsis;font-size:10px;white-space:nowrap}.techrib-examples-category small{padding:2px 6px;border-radius:999px;background:#07171e;color:#72929e;font-size:9px;font-weight:800}
      .techrib-examples-center-main{min-height:0;overflow:auto;padding:22px 24px 42px;background:radial-gradient(circle at 92% 0,rgba(30,136,159,.10),transparent 28%),#09202a}
      .techrib-examples-hero{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:24px;align-items:end;padding:21px;border:1px solid #214855;border-radius:16px;background:linear-gradient(135deg,#0d2d38,#102f38)}.techrib-examples-kicker{margin-bottom:6px;color:#69d6d1;font-size:9px;font-weight:900;letter-spacing:.15em}.techrib-examples-hero h1{margin:0 0 7px;font-size:25px;letter-spacing:-.02em}.techrib-examples-hero p{max-width:720px;margin:0;color:#9ab7c0;font-size:11px;line-height:1.55}.techrib-examples-stats{display:flex;gap:8px}.techrib-examples-stats span{min-width:90px;padding:10px;border:1px solid #2b5360;border-radius:11px;background:#09232c;text-align:center}.techrib-examples-stats b{display:block;color:#fff;font-size:19px}.techrib-examples-stats small{display:block;margin-top:2px;color:#789ca7;font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:.06em}
      .techrib-examples-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:17px 0 12px}.techrib-examples-filterset{display:flex;gap:6px;flex-wrap:wrap}.techrib-examples-filter{padding:7px 10px;border:1px solid #294c59;border-radius:999px;background:#0a2530;color:#91b1bb;font:800 9px Inter,Arial,sans-serif;cursor:pointer}.techrib-examples-filter:hover{color:#fff}.techrib-examples-filter.active{border-color:#47a9bf;background:#163d49;color:#fff}.techrib-examples-count{color:#7f9fab;font-size:10px;font-weight:700}.techrib-examples-count b{color:#d8edf2}
      .techrib-examples-category-spotlight{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin:0 0 18px}.techrib-examples-spot{display:grid;grid-template-columns:38px 1fr;gap:10px;align-items:center;padding:12px;border:1px solid #214652;border-radius:12px;background:#0b2832;color:#e6f4f7;text-align:left;cursor:pointer}.techrib-examples-spot:hover{transform:translateY(-1px);border-color:#41a8ba;background:#10323d}.techrib-examples-spot i{display:grid;place-items:center;width:38px;height:38px;border-radius:10px;background:#123945;color:#69d6df;font-style:normal;font-weight:900}.techrib-examples-spot b{display:block;font-size:10px;line-height:1.3}.techrib-examples-spot small{display:block;margin-top:3px;color:#718f99;font-size:9px}
      .techrib-examples-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.techrib-example-center-card{display:grid;grid-template-columns:42px minmax(0,1fr) auto;gap:11px;align-items:center;min-height:88px;padding:13px;border:1px solid #234a57;border-radius:13px;background:#0c2934;color:#eaf6f8;text-align:left;cursor:pointer}.techrib-example-center-card:hover{transform:translateY(-1px);border-color:#45b0c5;background:#103540}.techrib-example-center-card .card-icon{display:grid;place-items:center;width:42px;height:42px;border-radius:11px;background:#123b47;color:#7ddae6;font-size:17px;font-weight:900}.techrib-example-center-card h3{margin:0 0 5px;font-size:11px;line-height:1.35}.techrib-example-center-card p{display:-webkit-box;overflow:hidden;margin:0;color:#7f9fac;font-size:9px;line-height:1.4;-webkit-line-clamp:2;-webkit-box-orient:vertical}.techrib-example-center-card .go{color:#5fc9da;font-size:20px}.techrib-example-badges{display:flex;gap:5px;flex-wrap:wrap;margin-top:7px}.techrib-example-badge{padding:3px 6px;border-radius:999px;background:#153741;color:#9fc3cd;font-size:8px;font-weight:850}.techrib-example-badge.premium{background:#3b2e12;color:#ffd46d}.techrib-example-badge.knx{background:#272a4a;color:#bec6ff}.techrib-example-badge.dali{background:#253d2c;color:#aee8b8}
      .techrib-examples-empty{padding:70px 20px;border:1px dashed #31505b;border-radius:14px;color:#7898a4;text-align:center}.techrib-examples-empty b{display:block;margin-bottom:6px;color:#c5dce2}.techrib-examples-secondary{margin-top:16px;padding-top:14px;border-top:1px solid #1c3d48}.techrib-examples-secondary button{border:0;background:transparent;color:#60c9dc;font:800 10px Inter,Arial,sans-serif;cursor:pointer}
      @media(max-width:1100px){.techrib-examples-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.techrib-examples-category-spotlight{grid-template-columns:repeat(2,minmax(0,1fr))}.techrib-examples-center-body{grid-template-columns:220px 1fr}.techrib-examples-hero{grid-template-columns:1fr}.techrib-examples-stats{justify-content:flex-start}}
      @media(max-width:760px){.techrib-examples-center-overlay{padding:0}.techrib-examples-center-shell{width:100vw;height:100vh;border-radius:0}.techrib-examples-center-top{grid-template-columns:1fr auto}.techrib-examples-center-search{grid-column:1/-1;grid-row:2}.techrib-examples-center-brand p{display:none}.techrib-examples-center-body{grid-template-columns:1fr}.techrib-examples-center-side{display:flex;gap:5px;overflow-x:auto;min-height:auto;padding:8px;border-right:0;border-bottom:1px solid #193844}.techrib-examples-side-title{display:none}.techrib-examples-category{min-width:max-content;grid-template-columns:25px auto auto}.techrib-examples-category .icon{width:25px;height:25px}.techrib-examples-center-main{padding:15px 12px 30px}.techrib-examples-grid{grid-template-columns:1fr}.techrib-examples-category-spotlight{grid-template-columns:1fr 1fr}.techrib-examples-stats{flex-wrap:wrap}}
      @media(max-width:480px){.techrib-examples-category-spotlight{grid-template-columns:1fr}.techrib-examples-toolbar{align-items:flex-start;flex-direction:column}}
    `;document.head.appendChild(style);
  }

  function sourceCards(){return [...document.querySelectorAll('.examples-group .example-card[data-example-id]')];}

  function getItems(){
    const map=new Map();
    sourceCards().forEach(card=>{
      const id=String(card.dataset.exampleId||'').trim();if(!id||map.has(id))return;
      const name=String(card.querySelector('.example-card-copy>b')?.textContent||card.textContent||id).trim();
      const cats=String(card.dataset.exampleCategories||card.dataset.examplePrimaryCategory||'').split(/\s+/).filter(Boolean);
      const primary=String(card.dataset.examplePrimaryCategory||cats[0]||'');
      const titleParts=String(card.title||'').split('\n').map(x=>x.trim()).filter(Boolean);
      const description=titleParts.find(part=>!part.includes(' • ')&&!/premium|básico|intermediário|avançado/i.test(part))||titleParts[0]||'Abra este projeto didático diretamente na prancha.';
      const searchText=normalize([name,description,card.dataset.search,cats.join(' ')].join(' '));
      map.set(id,{id,name,description,access:card.dataset.exampleAccess||'standard',level:card.dataset.exampleLevel||'intermediate',primary,categories:cats,searchText});
    });
    return [...map.values()].sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
  }

  function categoryMeta(id){
    if(id==='all')return{id:'all',label:'Todos os exemplos',icon:'▤'};
    if(id==='mine')return{id:'mine',label:'Meus exemplos',icon:'★'};
    return taxonomy().meta?.(id)||taxonomy().categories?.find(x=>x.id===id)||{id,label:id,icon:'◇'};
  }

  function filtered(items){
    const q=normalize(state.query);
    return items.filter(item=>(state.category==='all'||(state.category==='mine'&&item.access==='personal')||item.categories.includes(state.category))&&(state.access==='all'||item.access===state.access)&&(state.level==='all'||item.level===state.level)&&(!q||item.searchText.includes(q)));
  }

  function openOriginal(id){
    close();
    setTimeout(()=>{
      const selector=`.examples-group .example-card[data-example-id="${cssEscape(id)}"]`;
      const card=document.querySelector(selector);if(!card)return;
      const target=card.matches('button')?card:card.querySelector('[data-open-example],[data-open-managed-premium],[data-open-managed-standard],[data-open-managed]')||card;
      target.click();
    },45);
  }

  function render(){
    if(!root||root.hidden)return;
    const items=getItems();
    if(!items.length){main.innerHTML='<div class="techrib-examples-empty"><b>Preparando a biblioteca de exemplos…</b>Os exemplos serão exibidos assim que o catálogo terminar de carregar.</div>';return;}
    const result=filtered(items),premium=items.filter(x=>x.access==='premium').length,knxDali=items.filter(x=>x.categories.includes('knx-dali')).length;
    const categoryCounts=new Map();taxonomy().categories?.forEach(c=>categoryCounts.set(c.id,items.filter(x=>x.categories.includes(c.id)).length));
    const mineCount=items.filter(item=>item.access==='personal').length;
    side.innerHTML='<div class="techrib-examples-side-title">NAVEGAR POR ÁREA</div>'+[
      {id:'all',label:'Todos os exemplos',icon:'▤'},...(mineCount?[{id:'mine',label:'Meus exemplos',icon:'★'}]:[]),...(taxonomy().categories||[])
    ].filter(c=>c.id==='all'||c.id==='mine'||(categoryCounts.get(c.id)||0)>0).map(c=>`<button type="button" class="techrib-examples-category ${state.category===c.id?'active':''}" data-center-category="${esc(c.id)}"><span class="icon">${esc(c.icon||'◇')}</span><b>${esc(c.label)}</b><small>${c.id==='all'?items.length:c.id==='mine'?mineCount:(categoryCounts.get(c.id)||0)}</small></button>`).join('');

    const spotlight=(taxonomy().categories||[]).filter(c=>(categoryCounts.get(c.id)||0)>0).sort((a,b)=>(categoryCounts.get(b.id)||0)-(categoryCounts.get(a.id)||0)).slice(0,8);
    const cat=categoryMeta(state.category);
    main.innerHTML=`
      <section class="techrib-examples-hero"><div><div class="techrib-examples-kicker">CENTRAL DE EXEMPLOS LUCASAGUIAR</div><h1>${state.category==='all'?'Escolha o circuito que quer estudar ou testar':esc(cat.icon||'◇')+' '+esc(cat.label)}</h1><p>Pesquise por aplicação, tecnologia ou protocolo. Você pode filtrar por nível, abrir exemplos Premium e encontrar rapidamente projetos de ESP32, automação industrial, KNX, DALI e outras áreas.</p></div><div class="techrib-examples-stats"><span><b>${items.length}</b><small>exemplos</small></span><span><b>${premium}</b><small>premium</small></span><span><b>${knxDali}</b><small>KNX / DALI</small></span></div></section>
      ${state.category==='all'&&!state.query?`<div class="techrib-examples-category-spotlight">${spotlight.map(c=>`<button type="button" class="techrib-examples-spot" data-center-category="${esc(c.id)}"><i>${esc(c.icon||'◇')}</i><span><b>${esc(c.label)}</b><small>${categoryCounts.get(c.id)||0} exemplo(s)</small></span></button>`).join('')}</div>`:''}
      <div class="techrib-examples-toolbar"><div class="techrib-examples-filterset"><button class="techrib-examples-filter ${state.access==='all'?'active':''}" data-center-access="all">Todos</button><button class="techrib-examples-filter ${state.access==='premium'?'active':''}" data-center-access="premium">Premium</button><button class="techrib-examples-filter ${state.level==='basic'?'active':''}" data-center-level="basic">Básico</button><button class="techrib-examples-filter ${state.level==='intermediate'?'active':''}" data-center-level="intermediate">Intermediário</button><button class="techrib-examples-filter ${state.level==='advanced'?'active':''}" data-center-level="advanced">Avançado</button>${state.level!=='all'?'<button class="techrib-examples-filter" data-center-level="all">Limpar nível</button>':''}</div><div class="techrib-examples-count"><b>${result.length}</b> resultado(s)</div></div>
      ${result.length?`<div class="techrib-examples-grid">${result.map(item=>{const meta=categoryMeta(item.primary),n=normalize(item.name),knx=n.includes('knx'),dali=n.includes('dali');return `<button type="button" class="techrib-example-center-card" data-open-center-example="${esc(item.id)}"><span class="card-icon">${esc(meta.icon||'▤')}</span><span><h3>${esc(item.name)}</h3><p>${esc(item.description)}</p><span class="techrib-example-badges">${item.access==='premium'?'<span class="techrib-example-badge premium">Premium</span>':''}<span class="techrib-example-badge">${esc(taxonomy().levelLabel?.(item.level)||item.level)}</span>${knx?'<span class="techrib-example-badge knx">KNX</span>':''}${dali?'<span class="techrib-example-badge dali">DALI</span>':''}</span></span><span class="go">›</span></button>`}).join('')}</div>`:'<div class="techrib-examples-empty"><b>Nenhum exemplo encontrado.</b>Altere a pesquisa ou os filtros para ampliar os resultados.</div>'}
      <div class="techrib-examples-secondary"><button type="button" data-open-classic-library>▤ Abrir a biblioteca lateral clássica</button></div>`;
  }

  function scheduleRender(){clearTimeout(renderTimer);renderTimer=setTimeout(render,60);}

  function ensureRoot(){
    injectStyles();if(root)return;
    root=document.createElement('div');root.id=ROOT_ID;root.className='techrib-examples-center-overlay';root.hidden=true;root.innerHTML=`<section class="techrib-examples-center-shell" role="dialog" aria-modal="true" aria-label="Central de Exemplos LucasAguiar"><header class="techrib-examples-center-top"><div class="techrib-examples-center-brand"><small>LUCASAGUIAR • BIBLIOTECA DIDÁTICA</small><h2>Central de Exemplos</h2><p>Pesquise, filtre e abra um projeto em poucos cliques.</p></div><label class="techrib-examples-center-search"><input type="search" placeholder="Pesquisar: KNX, DALI, ESP32, bomba, Modbus..." aria-label="Pesquisar exemplos"><span>⌕</span></label><button class="techrib-examples-center-close" type="button" aria-label="Fechar Central de Exemplos" title="Fechar">×</button></header><div class="techrib-examples-center-body"><aside class="techrib-examples-center-side"></aside><main class="techrib-examples-center-main"></main></div></section>`;document.body.appendChild(root);
    side=root.querySelector('.techrib-examples-center-side');main=root.querySelector('.techrib-examples-center-main');search=root.querySelector('input[type="search"]');
    root.querySelector('.techrib-examples-center-close').addEventListener('click',close);
    root.addEventListener('click',event=>{
      if(event.target===root){close();return}
      const cat=event.target.closest('[data-center-category]');if(cat){state.category=cat.dataset.centerCategory||'all';render();main.scrollTop=0;return}
      const acc=event.target.closest('[data-center-access]');if(acc){state.access=acc.dataset.centerAccess||'all';render();return}
      const lvl=event.target.closest('[data-center-level]');if(lvl){state.level=lvl.dataset.centerLevel||'all';render();return}
      const card=event.target.closest('[data-open-center-example]');if(card){openOriginal(card.dataset.openCenterExample);return}
      if(event.target.closest('[data-open-classic-library]')){close();document.querySelector('.workbench')?.classList.remove('sidebar-hidden');document.querySelector('[data-library-tab="examples"]')?.click()}
    });
    search.addEventListener('input',()=>{state.query=search.value;render()});
    search.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();if(search.value){search.value='';state.query='';render()}else close()}});
  }

  function open(){
    ensureRoot();state={query:'',category:'all',access:'all',level:'all'};search.value='';root.hidden=false;document.body.classList.add('techrib-examples-center-open');render();setTimeout(()=>search.focus(),30);
    const grid=document.querySelector('.examples-group .example-grid');if(grid&&!observer){observer=new MutationObserver(scheduleRender);observer.observe(grid,{childList:true,subtree:true,attributes:true,attributeFilter:['data-example-access','data-example-level','data-example-categories','data-example-primary-category']})}
  }
  function close(){if(!root)return;root.hidden=true;document.body.classList.remove('techrib-examples-center-open')}

  document.addEventListener('click',event=>{
    const trigger=event.target.closest?.('[data-action="show-examples"]');if(!trigger)return;
    event.preventDefault();event.stopImmediatePropagation();open();
  },true);
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&root&&!root.hidden){event.preventDefault();close()}},true);
  document.addEventListener('techrib:official-example-opened',scheduleRender);
  document.addEventListener('techrib:user-examples-updated',scheduleRender);

  global.TechRibExamplesCenter={open,close,refresh:scheduleRender,getItems};
})(window);
