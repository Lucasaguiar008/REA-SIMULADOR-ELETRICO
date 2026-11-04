/* TechRib IoT Cloud — seletor universal, fase de validação de topologia.
 * Não produzir firmware com perfil fixo enquanto os drivers universais não existem.
 * A geração operacional será habilitada somente após drivers e manifesto homologados.
 */
(()=>{
'use strict';
const modal=document.querySelector('[data-codegen-modal]');if(!modal)return;
const target=modal.querySelector('[data-codegen-target]');if(!target)return;
const key='techrib-iot-cloud-espidf';
// Recurso operacional restrito à equipe TechRib até que a exportação real esteja disponível.
// O acesso visual não substitui permissões de servidor para qualquer API futura.
const access=window.TECHRIB_USER_ACCESS||{};
const techribInternal=access.isAdmin===true || access.canEditStandardExamples===true;
if(!techribInternal){
 let cleaning=false;
 const hideCloud=()=>{
  if(cleaning)return;
  cleaning=true;
  try{
   if(target.value===key)target.value='espidf';
   for(const o of [...target.querySelectorAll('option')])if(o.value===key)o.remove();
   for(const b of modal.querySelectorAll('[data-techrib-cloud-ir],[data-iot-cloud-preview]'))b.remove();
   for(const p of modal.querySelectorAll('[data-stage4]'))p.hidden=true;
  }finally{cleaning=false;}
 };
 const observer=new MutationObserver(hideCloud);
 observer.observe(target,{childList:true,subtree:true});
 observer.observe(modal,{childList:true,subtree:true});
 hideCloud();
 return;
}
const panel=modal.querySelector('section[data-stage4]')||document.createElement('section');
panel.dataset.stage4='';panel.hidden=true;
panel.style.cssText='margin:10px 0;padding:14px;border:1px solid #52708a;border-radius:10px;color:inherit';
panel.innerHTML='<b>TechRib IoT Cloud — configuração do projeto</b>'+
 '<p>Componentes, bornes e conexões identificados conforme a topologia do circuito.</p>'+
 '<p>Confira as características e eventuais incompatibilidades do circuito antes de exportar o projeto.</p>'+
 '<p data-stage4-status>Selecione o controlador e clique em Analisar e gerar.</p>';
modal.querySelector('.codegen-dialog')?.append(panel);
const cloudActions=document.createElement('div');
cloudActions.dataset.cloudActions='';
cloudActions.style.cssText='display:flex;gap:8px;flex-wrap:wrap;margin:12px 0 0';
panel.appendChild(cloudActions);
const toolbar=modal.querySelector('.codegen-toolbar');
const moveActions=()=>{
 if(!toolbar)return;
 for(const b of toolbar.querySelectorAll('[data-techrib-cloud-ir],[data-iot-cloud-preview]')){
  cloudActions.appendChild(b);
 }
};
if(toolbar){new MutationObserver(moveActions).observe(toolbar,{childList:true});moveActions();}
let updating=false;
const ensureOption=()=>{
 if(updating)return;
 updating=true;
 try {
  let opt=[...target.options].find(o=>o.value===key);
  const idf=[...target.options].find(o=>o.value==='espidf');
  const group=idf?.parentElement?.tagName==='OPTGROUP'?idf.parentElement:null;
  if(!opt){opt=document.createElement('option');opt.value=key;opt.textContent='TechRib IoT Cloud';}
  if(group&&(opt.parentElement!==group||idf.nextElementSibling!==opt))idf.after(opt);
  else if(!opt.parentElement)target.append(opt);
 } finally{updating=false;}
};
new MutationObserver(ensureOption).observe(target,{childList:true,subtree:true});ensureOption();
const status=(text)=>{const s=panel.querySelector('[data-stage4-status]');if(s)s.textContent=text;};
// A janela principal tem overflow:hidden para os outros destinos. No Cloud,
// os paineis adicionais ficam ABAIXO do editor e precisam de rolagem propria.
const dialog=modal.querySelector('.codegen-dialog');
if(dialog && !document.querySelector('style[data-techrib-cloud-scroll-style]')){
 const style=document.createElement('style');
 style.dataset.techribCloudScrollStyle='';
 style.textContent=`
 .codegen-dialog.techrib-cloud-scroll {
   overflow-y:auto;
   overflow-x:hidden;
   overscroll-behavior-y:contain;
   scrollbar-gutter:stable;
   touch-action:pan-y;
 }
 .codegen-dialog.techrib-cloud-scroll > .codegen-content {
   flex:0 0 auto;
   height:clamp(230px,38vh,400px);
   min-height:0;
 }
 .codegen-dialog.techrib-cloud-scroll > section {
   flex:0 0 auto;
 }
 @media(max-width:700px){
   .codegen-dialog.techrib-cloud-scroll > .codegen-content {
     height:clamp(200px,38dvh,320px);
   }
 }
 `;
 document.head.appendChild(style);
}
const show=()=>{
 const isCloud=target.value===key;
 panel.hidden=!isCloud;
 dialog?.classList.toggle('techrib-cloud-scroll',isCloud);
};
target.addEventListener('change',show,true);show();
// Recupera o módulo de topologia quando a carga inicial do navegador falhou.
// A URL é fixa e same-origin; não carrega código de terceiros nem ignora ACL.
let validatorLoad=null;
let capabilitiesLoad=null;
async function requireCloudCapabilities(){
 if(window.TechRibCloudCapabilitiesV1?.families)return window.TechRibCloudCapabilitiesV1;
 if(!capabilitiesLoad)capabilitiesLoad=fetch('/assets/runtime/techrib-cloud-capabilities-v1.json',{credentials:'same-origin',cache:'no-cache'})
  .then(response=>{if(!response.ok)throw Error('Registro de capacidades Cloud indisponível.');return response.json();})
  .then(data=>{if(data?.schema!=='techrib.cloud.capabilities'||data?.contractVersion!=='2.0.0')throw Error('Registro de capacidades Cloud incompatível.');window.TechRibCloudCapabilitiesV1=data;return data;});
 return capabilitiesLoad;
}
void requireCloudCapabilities().catch(error=>console.warn('[TechRib Cloud] Registro de capacidades:',error));
async function requireCloudValidator(){
 if(typeof window.TechRibCloudIRV2?.build==='function')return;
 if(!validatorLoad){
  validatorLoad=new Promise((resolve,reject)=>{
   const script=document.createElement('script');
   script.dataset.techribCloudValidatorRetry='';
   script.async=true;
   script.src='/assets/runtime/techrib-cloud-ir-v2.js?retry='+Date.now();
   let finished=false;
   const finish=error=>{
    if(finished)return;
    finished=true;clearTimeout(timer);
    script.onload=null;script.onerror=null;
    if(error){console.error('[TechRib Cloud] Falha ao carregar módulo de topologia:',error);reject(error);}
    else resolve();
   };
   const timer=setTimeout(()=>finish(new Error('Tempo esgotado ao carregar o validador Cloud.')),8000);
   script.onload=()=>finish(null);
   script.onerror=()=>finish(new Error('Arquivo de validação Cloud indisponível no servidor.'));
   (document.head||document.body).appendChild(script);
  });
 }
 await validatorLoad;
 if(typeof window.TechRibCloudIRV2?.build!=='function')
  throw Error('O validador do circuito não pôde ser carregado. Recarregue a página.');
}
async function analyze(){
 const id=modal.querySelector('[data-codegen-controller]')?.value;
 const ctrl=[...document.querySelectorAll('.schematic-sheet .placed-component')].find(x=>x.dataset.componentId===id);
 if(!ctrl)throw Error('Selecione um controlador válido na prancha.');
 if(typeof window.TechRibCodeGenerator?.analyze!=='function')throw Error('Não foi possível acessar a análise do circuito. Recarregue a página.');
 const capabilities=await requireCloudCapabilities();
 await requireCloudValidator();
 if(!window.TechRibIoTCloudMappingV1?.catalog?.types)throw Error('Não foi possível carregar o catálogo de componentes Cloud. Recarregue a página.');
 const data=window.TechRibCodeGenerator.analyze(ctrl,'espidf');
 const schema=window.TechRibIoTCloudMappingV1?.catalog;
 const mappings=window.TechRibCloudIRPanel?.getMappings?.()||{};
 const ir=window.TechRibCloudIRV2.build(data,{catalog:schema,mappings,capabilities});
 if(!ir)throw Error('Não foi possível interpretar a topologia.');
 return ir;
}
// A prévia usa o próprio ZIP retornado pelo servidor, evitando mostrar código
// diferente daquele que foi efetivamente exportado. O ZIP Cloud atual usa
// entradas STORE (sem compressão) e possui limite de 2,5 MB no endpoint.
function cloudPreviewFromZip(buffer,ir){
 const view=new DataView(buffer),bytes=new Uint8Array(buffer);
 const decoder=new TextDecoder('utf-8');
 const files=[];let offset=0,scanned=0;
 while(offset+4<=bytes.length&&scanned++<512){
  const signature=view.getUint32(offset,true);
  if(signature!==0x04034b50)break;
  if(offset+30>bytes.length)throw Error('Cabeçalho ZIP incompleto.');
  const flags=view.getUint16(offset+6,true),method=view.getUint16(offset+8,true);
  if((flags&8)||method!==0)throw Error('Formato de prévia ZIP não suportado.');
  const size=view.getUint32(offset+18,true);
  const filenameLen=view.getUint16(offset+26,true),extraLen=view.getUint16(offset+28,true);
  const nameStart=offset+30,dataStart=nameStart+filenameLen+extraLen;
  if(dataStart>bytes.length||size>bytes.length-dataStart)throw Error('Entrada ZIP incompleta.');
  const name=decoder.decode(bytes.subarray(nameStart,nameStart+filenameLen));
  files.push({name,start:dataStart,size});
  offset=dataStart+size;
 }
 if(!files.length||scanned>512)throw Error('ZIP sem arquivos válidos para prévia.');
 const read=(name)=>{
  const item=files.find(x=>x.name===name);
  return item?decoder.decode(bytes.subarray(item.start,item.start+item.size)):null;
 };
 const summary=[
  'TECHRIB IOT CLOUD — PROJETO ESP-IDF GERADO',
  `Controlador: ${ir.controller?.type||'ESP32'}  |  Destino: ${ir.controller?.idfTarget||'esp32'}`,
  `Componentes: ${(ir.components||[]).filter(c=>c.exposure!=='auxiliary').length}  |  Arquivos ZIP: ${files.length}`,
  'O projeto compilável completo está no ZIP exportado.',
  '', 'ARQUIVOS DO PROJETO',...files.map(f=>'  '+f.name),
 ];
 for(const name of ['techrib-diagnostics.json','README.md','techrib-manifest-plan.json','main/app_main.c','main/techrib_mixed.c']){
  const content=read(name);
  if(content!==null)summary.push('',`========== ${name} ==========`,content);
 }
 return {code:summary.join('\n'),count:files.length};
}
function cloudFallbackPreview(ir){
 const components=(ir.components||[]).filter(c=>c.exposure!=='auxiliary');
 return ['TECHRIB IOT CLOUD — PROJETO ESP-IDF GERADO',
  `Controlador: ${ir.controller?.type||'ESP32'}`,
  `Componentes: ${components.length}`,
  '', 'COMPONENTES E RECURSOS',
  ...components.map(c=>`${c.name||c.id} [${c.type||'tipo indefinido'}] → ${(c.bindings||[]).map(b=>`GPIO${b.gpio} (${b.mode})`).join(', ')}`),
  '', 'Para acessar o código C completo, abra o ZIP exportado.'].join('\n');
}

let generating=false;
async function generateCloud(){
 if(generating)return;
 generating=true;
 try{
  const ir=await analyze();
  const blockers=ir.issues.filter(x=>x.level==='error'&&x.category==='structural');
  if(blockers.length || ir.blocking){
   status(`Foram encontradas ${blockers.length} incompatibilidades estruturais. Confira os componentes e suas conexões.`);
   window.TechRibCloudIRPanel?.open?.();return;
  }
  status('Preparando o projeto ESP-IDF TechRib IoT Cloud…');
  const res=await fetch('/?api=techrib-iot-cloud-codegen-v4',{
   method:'POST',credentials:'same-origin',headers:{
    'Content-Type':'application/json',
    'X-CSRF-Token':document.querySelector('meta[name="csrf-token"]')?.content||''
   },body:JSON.stringify(ir)
  });
  if(!res.ok){let why='Não foi possível gerar o projeto.';try{const data=await res.json();why=data.error||why;}catch{}throw Error(why);}
  const zip=await res.blob();
  if(zip.size<1000||zip.size>2500000)throw Error('Pacote gerado com tamanho inválido.');
  let projectPreview=cloudFallbackPreview(ir),fileCount=null;
  try{
   const generated=cloudPreviewFromZip(await zip.arrayBuffer(),ir);
   projectPreview=generated.code;fileCount=generated.count;
  }catch(previewError){
   // A falha de leitura da prévia não impede o download do ZIP já validado.
   console.warn('TechRib Cloud: prévia limitada ao resumo do projeto.',previewError);
  }
  const codeEl=modal.querySelector('[data-codegen-code]');
  const summaryEl=modal.querySelector('[data-codegen-summary]');
  if(codeEl)codeEl.textContent=projectPreview;
  if(summaryEl)summaryEl.textContent=`ESP-IDF Cloud • ${(ir.components||[]).filter(c=>c.exposure!=='auxiliary').length} componentes`+(fileCount!==null?` • ${fileCount} arquivos no ZIP`:'');
  const url=URL.createObjectURL(zip);
  const link=document.createElement('a');link.href=url;link.download='techrib-iot-cloud-espidf.zip';
  document.body.appendChild(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),30000);
  const disabled=(ir.components||[]).filter(c=>c.exposure!=='auxiliary'&&c.runtimeEnabled!==true).length;
  status(`Projeto ESP-IDF exportado${disabled?` com ${disabled} recurso(s) desativado(s) e documentado(s)`:''}. Confira techrib-diagnostics.json e valide em bancada.`);
 }catch(err){status('Geração não concluída: '+(err?.message||String(err)));}
 finally{generating=false;}
}
modal.querySelector('[data-codegen-run]')?.addEventListener('click',e=>{
 if(target.value!==key)return;
 e.preventDefault();e.stopImmediatePropagation();show();void generateCloud();
},true);
modal.querySelector('[data-codegen-download]')?.addEventListener('click',e=>{
 if(target.value!==key)return;
 e.preventDefault();e.stopImmediatePropagation();show();void generateCloud();
},true);
modal.querySelector('[data-codegen-copy]')?.addEventListener('click',async e=>{
 if(target.value!==key)return;
 e.preventDefault();e.stopImmediatePropagation();show();
 const preview=modal.querySelector('[data-codegen-code]')?.textContent||'';
 if(!preview||preview.startsWith('// O código aparecerá')){
  status('Gere o projeto antes de copiar a prévia.');return;
 }
 try{await navigator.clipboard.writeText(preview);status('Prévia do projeto copiada. O ZIP contém os arquivos completos.');}
 catch{status('Não foi possível copiar a prévia automaticamente.');}
},true);
})();
