(()=>{
  'use strict';
  const openButton=document.querySelector('[data-component-import-open]');
  if(!openButton)return;
  const csrf=document.querySelector('meta[name="csrf-token"]')?.content||'';
  const modal=document.createElement('div');
  modal.className='component-import-modal';
  modal.hidden=true;
  modal.innerHTML=`
    <div class="component-import-dialog" role="dialog" aria-modal="true" aria-label="Adicionar componente à biblioteca">
      <header><div><small>NOVO COMPONENTE</small><h2>Importar SVG para a biblioteca</h2></div><button type="button" data-import-close aria-label="Fechar">×</button></header>
      <div class="component-import-body">
        <section class="component-import-form">
          <label><span>Arquivo SVG</span><div class="file-picker"><input type="file" accept="image/svg+xml,.svg" data-import-file><b data-import-file-name>Nenhum arquivo selecionado</b><em>Escolher SVG</em></div></label>
          <div class="import-row"><label><span>Nome do componente</span><input data-import-name maxlength="90" placeholder="Ex.: ESP32-C3 TechRib"></label><label><span>ID</span><input data-import-id maxlength="72" placeholder="esp32-c3-techrib"></label></div>
          <div class="import-row"><label><span>Salvar na biblioteca</span><select data-import-library><optgroup label="COMPONENTES"><option value="industrial::Fontes">Fontes</option><option value="industrial::Instrumentos de medição">Instrumentos de medição</option><option value="industrial::Disjuntores">Disjuntores</option><option value="industrial::DR">DR</option><option value="industrial::DPS">DPS</option><option value="industrial::Interruptores Residenciais">Interruptores residenciais</option><option value="industrial::Contatoras">Contatoras</option><option value="industrial::Relés térmicos">Relés térmicos</option><option value="industrial::Relés de falta de fase">Relés de falta de fase</option><option value="industrial::Relés">Relés</option><option value="industrial::Inversores de frequência">Inversores de frequência</option><option value="industrial::Soft Starters">Soft Starters</option><option value="industrial::Motores/Bombas">Motores/Bombas</option><option value="industrial::Comandos">Comandos</option><option value="industrial::Bornes e barramentos">Bornes e barramentos</option><option value="industrial::Sensores e contatos">Sensores e contatos</option><option value="industrial::Componentes importados" selected>Componentes importados</option></optgroup><optgroup label="AUTOMAÇÃO"><option value="logic::Lógica & Automação">Lógica & Automação</option><option value="logic::Eletrônica • Passivos">Eletrônica • Passivos</option><option value="logic::Semicondutores">Semicondutores</option><option value="logic::Optoacopladores">Optoacopladores</option><option value="logic::Transistores e drivers">Transistores e drivers</option><option value="logic::LEDs eletrônicos">LEDs eletrônicos</option><option value="logic::Módulos de relé">Módulos de relé</option><option value="logic::Proteções e filtros">Proteções e filtros</option></optgroup></select></label><label><span>Tipo / perfil</span><select data-import-profile><optgroup label="COMPONENTES"><option value="generic" selected>Componente genérico</option></optgroup><optgroup label="MICROCONTROLADORES"><option value="esp32-3v3">ESP32 / microcontrolador 3,3 V</option><option value="microcontroller-3v3">Microcontrolador genérico 3,3 V</option><option value="arduino-5v">Arduino / microcontrolador 5 V</option></optgroup><optgroup label="MÓDULOS"><option value="relay-5v">Módulo relé 1 canal 5 V</option></optgroup><optgroup label="FONTES E ALIMENTAÇÃO"><option value="ac-single">Alimentador monofásico F + N + PE</option><option value="ac-two">Alimentador bifásico 2F + N + PE</option><option value="ac-three-pe">Alimentador trifásico 3F + PE</option><option value="ac-three-n">Alimentador trifásico 3F + N + PE</option><option value="dc-3v3">Fonte DC 3,3 V</option><option value="dc-5v">Fonte DC 5 V</option><option value="dc-12v">Fonte DC 12 V</option><option value="dc-24v">Fonte DC 24 V</option><option value="dc-configurable">Fonte DC configurável</option><option value="transformer-ac">Transformador AC</option></optgroup></select></label></div>
          <div data-import-source-settings hidden>
            <div data-import-ac-settings hidden><div class="import-row"><label><span>Sistema de tensão</span><select data-import-voltage-system><option value="220:127">220/127 V</option><option value="380:220">380/220 V</option><option value="440:254">440/254 V</option><option value="custom">Personalizado</option></select></label><label><span>Frequência</span><select data-import-frequency><option value="50">50 Hz</option><option value="60" selected>60 Hz</option></select></label></div><div class="import-row" data-import-custom-ac hidden><label><span>Tensão fase-fase</span><input data-import-line-voltage type="number" min="12" max="1000" step="1" value="220"></label><label><span>Tensão fase-neutro</span><input data-import-phase-voltage type="number" min="12" max="1000" step="1" value="127"></label></div></div>
            <div data-import-dc-settings hidden><div class="import-row"><label><span>Tensão de saída (V)</span><input data-import-dc-voltage type="number" min="1" max="60" step="0.1" value="24"></label><span></span></div></div>
            <div data-import-transformer-settings hidden><div class="import-row"><label><span>Entrada (V)</span><input data-import-primary-voltage type="number" min="12" max="1000" step="1" value="220"></label><label><span>Saída (V)</span><input data-import-secondary-voltage type="number" min="1" max="1000" step="1" value="24"></label></div><div class="import-row"><label><span>Frequência</span><select data-import-transformer-frequency><option value="50">50 Hz</option><option value="60" selected>60 Hz</option></select></label><span></span></div></div>
            <p class="import-status" data-import-profile-status>Selecione um SVG para validar este perfil.</p>
          </div>
          <label class="replace-option"><input type="checkbox" data-import-replace><span>Substituir componente se este ID já existir</span></label>
          <div class="import-actions"><button type="button" data-import-analyze>Analisar SVG</button><button class="primary" type="button" data-import-save disabled>Adicionar à biblioteca</button></div>
          <p class="import-status" data-import-status>Selecione um SVG gerado no TechRib SVG Studio.</p>
        </section>
        <section class="component-import-preview">
          <div class="preview-frame"><img data-import-preview alt="Pré-visualização do componente"><div class="preview-empty" data-import-preview-empty>SVG</div></div>
          <div class="analysis-card"><div><span>Bornes</span><b data-import-terminal-count>0</b></div><div><span>Âncoras</span><b data-import-anchor-count>0</b></div><div class="analysis-viewbox"><span>viewBox</span><b data-import-viewbox>—</b></div></div>
          <div class="terminal-list" data-import-terminal-list><p>Os terminais <code>data-terminal</code> aparecerão aqui.</p></div>
        </section>
      </div>
      <footer><span>O simulador gera <b>visual.svg + component.json</b> na biblioteca escolhida. “Exemplos” recebe projetos completos, não componentes SVG.</span><button type="button" data-import-close>Cancelar</button></footer>
    </div>`;
  document.body.appendChild(modal);

  const fileInput=modal.querySelector('[data-import-file]');
  const nameInput=modal.querySelector('[data-import-name]');
  const idInput=modal.querySelector('[data-import-id]');
  const library=modal.querySelector('[data-import-library]');
  const profile=modal.querySelector('[data-import-profile]');
  const replace=modal.querySelector('[data-import-replace]');
  const save=modal.querySelector('[data-import-save]');
  const status=modal.querySelector('[data-import-status]');
  const preview=modal.querySelector('[data-import-preview]');
  const previewEmpty=modal.querySelector('[data-import-preview-empty]');
  const sourceSettings=modal.querySelector('[data-import-source-settings]'),acSettings=modal.querySelector('[data-import-ac-settings]'),dcSettings=modal.querySelector('[data-import-dc-settings]'),transformerSettings=modal.querySelector('[data-import-transformer-settings]'),profileStatus=modal.querySelector('[data-import-profile-status]');
  const voltageSystem=modal.querySelector('[data-import-voltage-system]'),customAc=modal.querySelector('[data-import-custom-ac]'),lineVoltage=modal.querySelector('[data-import-line-voltage]'),phaseVoltage=modal.querySelector('[data-import-phase-voltage]'),frequency=modal.querySelector('[data-import-frequency]'),dcVoltage=modal.querySelector('[data-import-dc-voltage]'),primaryVoltage=modal.querySelector('[data-import-primary-voltage]'),secondaryVoltage=modal.querySelector('[data-import-secondary-voltage]'),transformerFrequency=modal.querySelector('[data-import-transformer-frequency]');
  let analysis=null,previewUrl='';
  const sourceProfiles=new Set(['ac-single','ac-two','ac-three-pe','ac-three-n','dc-3v3','dc-5v','dc-12v','dc-24v','dc-configurable','transformer-ac']);
  const slug=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,72);
  const setStatus=(text,state='')=>{status.textContent=text;status.dataset.state=state};
  const close=()=>{modal.hidden=true};
  const open=()=>{modal.hidden=false;setTimeout(()=>fileInput.focus(),50)};
  modal.querySelectorAll('[data-import-close]').forEach(button=>button.addEventListener('click',close));
  modal.addEventListener('pointerdown',event=>{if(event.target===modal)close()});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!modal.hidden)close()});
  openButton.addEventListener('click',open);

  const analyzeText=(text)=>{
    const doc=new DOMParser().parseFromString(text,'image/svg+xml');
    if(doc.querySelector('parsererror')||doc.documentElement.localName.toLowerCase()!=='svg')throw new Error('Arquivo SVG inválido.');
    const terms=[...new Set([...doc.querySelectorAll('[data-terminal]')].map(node=>node.getAttribute('data-terminal')?.trim()).filter(Boolean))];
    const anchors=[...new Set([...doc.querySelectorAll('[data-wire-anchor]')].map(node=>node.getAttribute('data-wire-anchor')?.trim()).filter(Boolean))];
    return{terminals:terms,anchors,viewBox:doc.documentElement.getAttribute('viewBox')||'—',missing:terms.filter(t=>!anchors.includes(t))};
  };
  const findAlias=aliases=>{const lookup=new Map((analysis?.terminals||[]).map(term=>[term.toUpperCase(),term]));for(const alias of aliases)if(lookup.has(alias.toUpperCase()))return lookup.get(alias.toUpperCase());return null};
  const sourceProfileValidation=()=>{
    const value=profile.value;if(!sourceProfiles.has(value))return{compatible:true,missing:[],found:[]};let expected=[];
    if(value==='ac-single')expected=[['L1/F',['L','F','L1']],['N',['N']],['PE',['PE','EARTH','TERRA']]];
    else if(value==='ac-two')expected=[['L1',['L1','F1']],['L2',['L2','F2']],['N',['N']],['PE',['PE','EARTH','TERRA']]];
    else if(value==='ac-three-pe'||value==='ac-three-n'){expected=[['L1',['L1','F1']],['L2',['L2','F2']],['L3',['L3','F3']]];if(value==='ac-three-n')expected.push(['N',['N']]);expected.push(['PE',['PE','EARTH','TERRA']])}
    else if(value.startsWith('dc-')){const volts={'dc-3v3':'3V3','dc-5v':'5V','dc-12v':'12V','dc-24v':'24V','dc-configurable':'24V'}[value],positive=['+'+volts,volts,'VCC','V+','+','OUT+'],negative=['0V','GND','V-','-','OUT-'];if(value==='dc-configurable')positive.push('+3V3','3V3','+5V','5V','+12V','12V','+24V','24V');expected=[['saída positiva',positive],['0V/GND',negative]];const hasInput=[...['L','F','L1','N','PE','EARTH','TERRA']].some(alias=>findAlias([alias]));if(hasInput)expected.push(['entrada L',['L','F','L1']],['entrada N',['N']],['entrada PE',['PE','EARTH','TERRA']])}
    else if(value==='transformer-ac')expected=[['P1/L',['P1','L']],['P2/N',['P2','N']],['S1/OUT1',['S1','OUT1']],['S2/OUT2',['S2','OUT2']]];
    const found=expected.map(([label,aliases])=>[label,findAlias(aliases)]),missing=found.filter(([,actual])=>!actual).map(([label])=>label);return{compatible:!!analysis&&missing.length===0,missing,found}
  };
  const renderProfileCompatibility=()=>{if(!sourceProfiles.has(profile.value)){save.disabled=!analysis?.terminals.length;return}const result=sourceProfileValidation();profileStatus.textContent=!analysis?'Selecione um SVG para validar este perfil.':result.compatible?`Perfil compatível com o SVG • ${result.found.map(([label])=>`${label} ✓`).join(' • ')}`:`Falta o terminal ${result.missing.join(', ')} • ${result.found.map(([label,actual])=>`${label} ${actual?'✓':'✗'}`).join(' • ')}`;profileStatus.dataset.state=!analysis?'':result.compatible?'ok':'error';save.disabled=!result.compatible};
  const refreshSourceSettings=()=>{const value=profile.value,isSource=sourceProfiles.has(value),isAc=value.startsWith('ac-'),isDc=value==='dc-configurable',isTransformer=value==='transformer-ac';sourceSettings.hidden=!isSource;acSettings.hidden=!isAc;dcSettings.hidden=!isDc;transformerSettings.hidden=!isTransformer;if(isSource){library.value='industrial::Fontes';library.disabled=true}else library.disabled=false;renderProfileCompatibility()};
  const applyVoltageSystem=()=>{if(voltageSystem.value==='custom'){customAc.hidden=false;return}const [line,phase]=voltageSystem.value.split(':');lineVoltage.value=line;phaseVoltage.value=phase;customAc.hidden=true};
  voltageSystem.addEventListener('change',applyVoltageSystem);
  const renderAnalysis=()=>{
    modal.querySelector('[data-import-terminal-count]').textContent=String(analysis?.terminals.length||0);
    modal.querySelector('[data-import-anchor-count]').textContent=String(analysis?.anchors.length||0);
    modal.querySelector('[data-import-viewbox]').textContent=analysis?.viewBox||'—';
    const list=modal.querySelector('[data-import-terminal-list]');list.replaceChildren();
    if(!analysis?.terminals.length){list.innerHTML='<p>Nenhum <code>data-terminal</code> encontrado.</p>';return}
    analysis.terminals.forEach(term=>{const chip=document.createElement('span');chip.textContent=term;if(analysis.missing.includes(term)){chip.classList.add('missing');chip.title='Sem data-wire-anchor correspondente'}list.appendChild(chip)});
    renderProfileCompatibility();
  };
  const readAndAnalyze=async()=>{
    const file=fileInput.files?.[0];if(!file)throw new Error('Selecione um arquivo SVG.');
    const text=await file.text();analysis=analyzeText(text);renderAnalysis();
    if(previewUrl)URL.revokeObjectURL(previewUrl);previewUrl=URL.createObjectURL(file);preview.src=previewUrl;preview.hidden=false;previewEmpty.hidden=true;
    const missing=analysis.missing.length?` • ${analysis.missing.length} borne(s) sem âncora`:'';
    setStatus(`${analysis.terminals.length} borne(s) detectados${missing}.` ,analysis.terminals.length?'ok':'warn');
    renderProfileCompatibility();
    return analysis;
  };
  fileInput.addEventListener('change',async()=>{
    const file=fileInput.files?.[0];modal.querySelector('[data-import-file-name]').textContent=file?.name||'Nenhum arquivo selecionado';
    if(file){const base=file.name.replace(/\.svg$/i,'');if(!nameInput.value)nameInput.value=base;if(!idInput.value)idInput.value=slug(base);try{await readAndAnalyze()}catch(error){analysis=null;save.disabled=true;setStatus(error.message,'error')}}
  });
  nameInput.addEventListener('input',()=>{if(!idInput.dataset.touched)idInput.value=slug(nameInput.value)});
  idInput.addEventListener('input',()=>{idInput.dataset.touched='1';idInput.value=slug(idInput.value)});
  const libraryTarget=()=>{const [category,group]=String(library.value||'industrial::Componentes importados').split('::');return{category,group}};
  profile.addEventListener('change',()=>{if(sourceProfiles.has(profile.value))library.value='industrial::Fontes';else if(profile.value!=='generic')library.value='logic::Lógica & Automação';refreshSourceSettings()});
  library.addEventListener('change',()=>{if(libraryTarget().category==='industrial'&&profile.value!=='generic'&&!sourceProfiles.has(profile.value)){profile.value='generic';refreshSourceSettings()}});
  modal.querySelector('[data-import-analyze]').addEventListener('click',()=>readAndAnalyze().catch(error=>setStatus(error.message,'error')));

  save.addEventListener('click',async()=>{
    try{
      if(!analysis)await readAndAnalyze();
      const file=fileInput.files?.[0];const name=nameInput.value.trim();const id=slug(idInput.value||name);
      if(!file)throw new Error('Selecione um SVG.');if(!name)throw new Error('Informe o nome do componente.');if(!id)throw new Error('Informe um ID válido.');
      const compatibility=sourceProfileValidation();if(sourceProfiles.has(profile.value)&&!compatibility.compatible)throw new Error(`Falta o terminal ${compatibility.missing.join(', ')}.`);
      save.disabled=true;setStatus('Importando e gerando component.json…','busy');
      const target=libraryTarget(),body=new FormData();body.append('svg',file);body.append('name',name);body.append('id',id);body.append('category',target.category);body.append('group',target.group);body.append('profile',profile.value);body.append('replace',replace.checked?'1':'0');body.append('lineVoltage',lineVoltage.value);body.append('phaseVoltage',phaseVoltage.value);body.append('frequency',profile.value==='transformer-ac'?transformerFrequency.value:frequency.value);body.append('dcVoltage',dcVoltage.value);body.append('primaryVoltage',primaryVoltage.value);body.append('secondaryVoltage',secondaryVoltage.value);
      const response=await fetch('/?api=component-import',{method:'POST',headers:{'X-CSRF-Token':csrf},body});
      const result=await response.json().catch(()=>({error:'Resposta inválida do servidor.'}));
      if(!response.ok)throw new Error(result.error||`Erro HTTP ${response.status}`);
      setStatus(`✓ ${result.name} salvo em ${result.group}. ${result.terminalCount} bornes reconhecidos.`,'ok');
      sessionStorage.setItem('techrib-library-tab',result.category==='logic'?'automation':'components');
      sessionStorage.setItem('techrib-library-search',result.name||'');
      setTimeout(()=>location.reload(),650);
    }catch(error){setStatus(error.message||String(error),'error');renderProfileCompatibility()}
  });

  const wantedTab=sessionStorage.getItem('techrib-library-tab');
  if(wantedTab){sessionStorage.removeItem('techrib-library-tab');setTimeout(()=>document.querySelector(`[data-library-tab="${wantedTab}"]`)?.click(),180)}
  const wantedSearch=sessionStorage.getItem('techrib-library-search');
  if(wantedSearch){sessionStorage.removeItem('techrib-library-search');setTimeout(()=>{const input=document.querySelector('.component-search input');if(input){input.value=wantedSearch;input.dispatchEvent(new Event('input',{bubbles:true}))}},260)}
  applyVoltageSystem();refreshSourceSettings();
})();
