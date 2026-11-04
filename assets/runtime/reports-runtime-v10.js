(function(global){
  'use strict';

  const slug=value=>String(value||'relatorio').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'relatorio';

  function create(options={}){
    const root=options.root||document;
    const modal=()=>root.querySelector(options.modalSelector||'[data-report-modal]');
    const snapshot=()=>{
      const node=modal();
      return node?{
        node,
        title:node.querySelector('[data-report-title]')?.textContent||'Relatório',
        lines:[...node.querySelectorAll('.report-line')].map(item=>item.textContent),
        kind:node.dataset.reportKind||''
      }:null;
    };
    const show=(title,lines,settings={})=>{
      const node=modal();
      if(!node)return false;
      const titleNode=node.querySelector('[data-report-title]');
      if(titleNode)titleNode.textContent=title;
      node.dataset.reportKind=settings.kind||'';
      const body=node.querySelector('[data-report-body]');
      if(body){
        body.innerHTML='';
        (lines||[]).forEach(line=>{const item=document.createElement('div');item.className='report-line';item.textContent=line;body.appendChild(item)});
      }
      const pdfButton=node.querySelector('[data-report-pdf]'),csvButton=node.querySelector('[data-report-csv]');
      if(pdfButton)pdfButton.hidden=settings.pdf!==true;
      if(csvButton)csvButton.hidden=settings.csv!==true;
      node.hidden=false;
      return true;
    };
    const close=()=>{const node=modal();if(node)node.hidden=true};
    const downloadText=()=>{
      const data=snapshot();if(!data)return false;
      const blob=new Blob([[data.title,...data.lines].join('\n')],{type:'text/plain;charset=utf-8'}),a=document.createElement('a');
      a.href=URL.createObjectURL(blob);a.download=`${slug(data.title)}.txt`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);return true;
    };
    const bind=()=>{
      root.querySelectorAll('[data-report-close]').forEach(button=>button.addEventListener('click',close));
      root.querySelector('[data-report-download]')?.addEventListener('click',downloadText);
    };
    return {show,close,snapshot,downloadText,bind,slug};
  }

  global.TechRibReportsRuntime={create};
})(window);
