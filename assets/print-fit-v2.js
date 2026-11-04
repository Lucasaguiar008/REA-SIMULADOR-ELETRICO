(()=>{
'use strict';

const PAPER_MM={
  a0:[841,1189],
  a1:[594,841],
  a2:[420,594],
  a3:[297,420],
  a4:[210,297],
  a5:[148,210]
};
const MM_TO_PX=96/25.4;
const STORAGE_KEY='techrib.print.output.v2';
const CROP_SAFETY_PX=8; // folga em coordenadas da prancha para não cortar a espessura da moldura
const PAGE_MARGIN_MM=7; // margem segura para PDF e impressoras com área não-imprimível
let overlay=null;
let printStyle=null;
let cleanupTimer=0;

const access=()=>window.TECHRIB_USER_ACCESS||{};
const canPrint=()=>{
  const a=access(),caps=a.capabilities||{};
  return a.isAdmin===true||caps.can_edit_project===true;
};
const num=(value,fallback=0)=>{const n=parseFloat(value);return Number.isFinite(n)?n:fallback};
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

const storedConfig=()=>{
  try{
    const parsed=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');
    return {
      paper:PAPER_MM[parsed.paper]?parsed.paper:'a4',
      orientation:['auto','portrait','landscape'].includes(parsed.orientation)?parsed.orientation:'auto'
    };
  }catch(_){return {paper:'a4',orientation:'auto'}}
};
const saveConfig=config=>{try{localStorage.setItem(STORAGE_KEY,JSON.stringify(config))}catch(_){}};

const buildDialog=()=>{
  if(overlay)return overlay;
  overlay=document.createElement('div');
  overlay.className='techrib-print-dialog-overlay';
  overlay.hidden=true;
  overlay.innerHTML=`<section class="techrib-print-dialog" role="dialog" aria-modal="true" aria-labelledby="techrib-print-title">
    <header><div><small>IMPRESSÃO DA PRANCHA</small><h2 id="techrib-print-title">Ajustar projeto ao papel</h2></div><button class="close" type="button" data-print-close aria-label="Fechar">×</button></header>
    <div class="body">
      <p class="description">Será impressa somente a área dentro da moldura técnica da prancha. A grade e a interface do simulador não entram na impressão.</p>
      <div class="grid">
        <label>Papel de saída<select data-print-paper><option value="a5">A5</option><option value="a4">A4</option><option value="a3">A3</option><option value="a2">A2</option><option value="a1">A1</option><option value="a0">A0</option></select></label>
        <label>Orientação<select data-print-orientation><option value="auto">Automática</option><option value="landscape">Paisagem</option><option value="portrait">Retrato</option></select></label>
      </div>
      <p class="hint" data-print-hint>A prancha será redimensionada proporcionalmente para caber inteira em uma única folha.</p>
    </div>
    <footer><button type="button" data-print-close>Cancelar</button><button class="primary" type="button" data-print-confirm>Continuar para impressão</button></footer>
  </section>`;
  document.body.appendChild(overlay);
  const paper=overlay.querySelector('[data-print-paper]'),orientation=overlay.querySelector('[data-print-orientation]');
  const initial=storedConfig();paper.value=initial.paper;orientation.value=initial.orientation;
  const close=()=>{overlay.hidden=true};
  overlay.querySelectorAll('[data-print-close]').forEach(button=>button.addEventListener('click',close));
  overlay.addEventListener('pointerdown',event=>{if(event.target===overlay)close()});
  overlay.querySelector('[data-print-confirm]').addEventListener('click',()=>{
    const config={paper:paper.value,orientation:orientation.value};
    saveConfig(config);overlay.hidden=true;startPrint(config);
  });
  const updateHint=()=>{
    const sheet=document.querySelector('[data-sheet]');
    if(!sheet)return;
    const sw=sheet.offsetWidth||1,sh=sheet.offsetHeight||1;
    const ori=orientation.value==='auto'?(sw>=sh?'landscape':'portrait'):orientation.value;
    const label=paper.options[paper.selectedIndex]?.textContent||paper.value.toUpperCase();
    overlay.querySelector('[data-print-hint]').textContent=`Saída: ${label} ${ori==='landscape'?'paisagem':'retrato'}. A moldura será centralizada e ajustada proporcionalmente para uma única folha.`;
  };
  paper.addEventListener('change',updateHint);orientation.addEventListener('change',updateHint);
  overlay._techribUpdateHint=updateHint;
  return overlay;
};

const openDialog=()=>{
  if(!canPrint())return false;
  const dialog=buildDialog(),cfg=storedConfig();
  dialog.querySelector('[data-print-paper]').value=cfg.paper;
  dialog.querySelector('[data-print-orientation]').value=cfg.orientation;
  dialog._techribUpdateHint?.();dialog.hidden=false;
  requestAnimationFrame(()=>dialog.querySelector('[data-print-confirm]')?.focus());
  return true;
};

const sheetCrop=()=>{
  const sheet=document.querySelector('[data-sheet]');
  if(!sheet)return null;
  const border=sheet.querySelector('.sheet-border');
  const sw=sheet.offsetWidth||num(getComputedStyle(sheet).width,1123);
  const sh=sheet.offsetHeight||num(getComputedStyle(sheet).height,794);
  let left=28,top=28,right=28,bottom=28;
  if(border){
    const s=getComputedStyle(border);
    left=num(s.left,left);top=num(s.top,top);right=num(s.right,right);bottom=num(s.bottom,bottom);
  }
  left=clamp(left,0,sw/4);right=clamp(right,0,sw/4);top=clamp(top,0,sh/4);bottom=clamp(bottom,0,sh/4);

  // O recorte anterior terminava exatamente sobre a linha da moldura. Como CSS
  // trabalha com uma extremidade exclusiva e a borda possui espessura, alguns
  // pixels do lado direito/inferior podiam ser cortados. Incluímos uma pequena
  // margem branca FORA da moldura, mas ainda dentro da prancha.
  const borderWidth=border?Math.max(
    num(getComputedStyle(border).borderLeftWidth,0),
    num(getComputedStyle(border).borderRightWidth,0),
    num(getComputedStyle(border).borderTopWidth,0),
    num(getComputedStyle(border).borderBottomWidth,0)
  ):0;
  const safety=Math.max(CROP_SAFETY_PX,borderWidth*3);
  const cropLeft=clamp(left-safety,0,sw);
  const cropTop=clamp(top-safety,0,sh);
  const cropRight=clamp(right-safety,0,sw);
  const cropBottom=clamp(bottom-safety,0,sh);
  return {
    sheet,sw,sh,
    left:cropLeft,top:cropTop,right:cropRight,bottom:cropBottom,
    frameLeft:left,frameTop:top,frameRight:right,frameBottom:bottom,
    safety,
    width:Math.max(1,sw-cropLeft-cropRight),
    height:Math.max(1,sh-cropTop-cropBottom)
  };
};

const resolvePage=(config,crop)=>{
  const dims=PAPER_MM[config.paper]||PAPER_MM.a4;
  const orientation=config.orientation==='auto'?(crop.width>=crop.height?'landscape':'portrait'):config.orientation;
  const short=Math.min(...dims),long=Math.max(...dims);
  const widthMm=orientation==='landscape'?long:short;
  const heightMm=orientation==='landscape'?short:long;
  return {orientation,widthMm,heightMm};
};

const applyPrintLayout=(config=storedConfig())=>{
  const crop=sheetCrop();if(!crop)return false;
  const page=resolvePage(config,crop),marginMm=PAGE_MARGIN_MM;
  const contentW=Math.max(20,(page.widthMm-marginMm*2)*MM_TO_PX);
  const contentH=Math.max(20,(page.heightMm-marginMm*2)*MM_TO_PX);
  // Folga adicional absorve arredondamento do Chrome e diferenças da área
  // imprimível entre PDF e impressoras físicas.
  const scale=Math.max(.02,Math.min(contentW/crop.width,contentH/crop.height)*.975);
  const stageW=crop.width*scale,stageH=crop.height*scale;
  const root=document.documentElement;
  root.style.setProperty('--techrib-print-scale',String(scale));
  root.style.setProperty('--techrib-print-stage-width',`${stageW}px`);
  root.style.setProperty('--techrib-print-stage-height',`${stageH}px`);
  root.style.setProperty('--techrib-print-sheet-left',`${-crop.left*scale}px`);
  root.style.setProperty('--techrib-print-sheet-top',`${-crop.top*scale}px`);
  document.body.classList.add('techrib-print-fit-active');
  document.body.dataset.techribPrintPaper=config.paper;
  document.body.dataset.techribPrintOrientation=page.orientation;
  if(!printStyle){printStyle=document.createElement('style');printStyle.id='techrib-print-page-v2';document.head.appendChild(printStyle)}
  printStyle.textContent=`@page{size:${config.paper.toUpperCase()} ${page.orientation};margin:${marginMm}mm}`;
  return true;
};

const cleanupPrintLayout=()=>{
  clearTimeout(cleanupTimer);
  document.body.classList.remove('techrib-print-fit-active');
  delete document.body.dataset.techribPrintPaper;delete document.body.dataset.techribPrintOrientation;
};

const startPrint=config=>{
  if(!applyPrintLayout(config))return;
  // Redesenha fios antes do snapshot de impressão, se a ponte atual expuser o método.
  try{window.dispatchEvent(new CustomEvent('techrib:before-print-fit'))}catch(_){}
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    window.print();
    // Alguns navegadores não disparam afterprint ao cancelar a prévia.
    cleanupTimer=setTimeout(cleanupPrintLayout,3000);
  }));
};

// Intercepta o botão antes do listener antigo, que imprimia o viewport inteiro.
document.addEventListener('click',event=>{
  const button=event.target.closest?.('[data-action="print"]');
  if(!button||!canPrint())return;
  event.preventDefault();event.stopImmediatePropagation();openDialog();
},true);

// Ctrl+P usa o mesmo fluxo de ajuste ao papel.
document.addEventListener('keydown',event=>{
  if(!(event.ctrlKey||event.metaKey)||event.key.toLowerCase()!=='p'||!canPrint())return;
  event.preventDefault();event.stopImmediatePropagation();openDialog();
},true);

window.addEventListener('beforeprint',()=>{if(!document.body.classList.contains('techrib-print-fit-active'))applyPrintLayout(storedConfig())});
window.addEventListener('afterprint',cleanupPrintLayout);
window.TechRibPrintFitV2={open:openDialog,apply:applyPrintLayout,cleanup:cleanupPrintLayout,version:'2.1',cropSafetyPx:CROP_SAFETY_PX,pageMarginMm:PAGE_MARGIN_MM};
})();
