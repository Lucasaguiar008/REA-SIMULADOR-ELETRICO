(function(global){
  'use strict';

  const terminalName=type=>({ferrule:'Ponteira',ring:'Terminal olhal',fork:'Terminal garfo',pin:'Terminal pino',none:'Sem terminal'}[type]||type||'Ponteira');
  const sectionLabel=value=>`${Number(value||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})} mm²`;
  const csvEscape=value=>`"${String(value??'').replace(/"/g,'""')}"`;

  function create(options={}){
    const sheet=options.sheet;
    const getWires=options.getWires||(()=>[]),getJunctions=options.getJunctions||(()=>[]);
    const registryDefinition=options.registryDefinition||(()=>null),technicalComponentTag=options.technicalComponentTag||(()=>''),wireColorName=options.wireColorName||(value=>value||'Não definida');
    const projectName=options.projectName||(()=> 'Projeto sem título'),fileBase=options.fileBase||(()=> 'projeto');
    const notify=options.notify||(()=>{}),makeSimplePdf=options.makeSimplePdf,canvasJpegBytes=options.canvasJpegBytes,report=options.report,wireTechnicalCalculation=options.wireTechnicalCalculation||(()=>null),technicalScale=options.technicalScale||(()=>({enabled:false,ratio:null,label:'sem escala técnica'}));

    const componentSpecification=node=>{const definition=registryDefinition(node),properties=definition?.properties||{},parts=[];if(node.dataset.type==='trilho-din-perfurado')parts.push(`comprimento ${Number(node.dataset.dinRailLengthMm||properties.lengthMm?.default||180)} mm`,`perfil DIN 35 mm perfurado`);if(node.dataset.model)parts.push(`modelo ${node.dataset.model}`);if(node.dataset.coilRatedVoltage)parts.push(`bobina ${node.dataset.coilRatedVoltage} V ${node.dataset.coilType||''}`.trim());if(properties.resistanceOhm)parts.push(`${properties.resistanceOhm} Ω`);if(properties.powerW)parts.push(`${properties.powerW} W`);if(properties.capacitance)parts.push(String(properties.capacitance));if(properties.maxVoltage)parts.push(`${properties.maxVoltage} V máx.`);if(node.dataset.lineVoltage)parts.push(`${node.dataset.lineVoltage} V`);if(node.dataset.outputVoltage)parts.push(`saída ${node.dataset.outputVoltage} V`);return parts.join(' • ')};

    const buildRows=()=>{
      const rows=[],wires=getWires(),junctions=getJunctions();
      const components=new Map();
      [...sheet.querySelectorAll('.placed-component')].filter(n=>!['text-object','plaque-object'].includes(n.dataset.type)).forEach(n=>{
        const name=n.dataset.label||registryDefinition(n)?.name||n.dataset.type,spec=componentSpecification(n),mechanical=n.dataset.nonElectrical==='true'||registryDefinition(n)?.classification==='mechanical',key=`${mechanical?'MECHANICAL':'ELECTRICAL'}|${name}|${spec}`,current=components.get(key)||{qty:0,name,spec,tags:[],mechanical};
        current.qty++;const tag=technicalComponentTag(n);if(tag)current.tags.push(tag);components.set(key,current);
      });
      [...components.values()].sort((a,b)=>a.name.localeCompare(b.name,'pt-BR')).forEach(x=>rows.push({qty:x.qty,description:[x.name,x.spec,x.tags.length?`IDs: ${x.tags.join(', ')}`:''].filter(Boolean).join(' | '),category:x.mechanical?'ACESSÓRIOS':'COMPONENTES'}));

      const conductors=new Map();
      wires.forEach(w=>{const section=Number(w.crossSectionMm2)||0,color=wireColorName(w.color),profile=w.profile||'control',key=`${section}|${color}|${profile}`,current=conductors.get(key)||{qty:0,section,color,profile,lengthMeters:0,lengthCount:0};current.qty++;const calc=wireTechnicalCalculation(w);if(calc?.lengthAvailable&&Number.isFinite(calc.length)){current.lengthMeters+=calc.length;current.lengthCount++}conductors.set(key,current)});
      [...conductors.values()].sort((a,b)=>a.section-b.section||a.color.localeCompare(b.color,'pt-BR')).forEach(x=>{const length=x.lengthCount===x.qty&&x.qty?` | comprimento estimado total ${x.lengthMeters.toFixed(2).replace('.',',')} m`:'';rows.push({qty:x.qty,description:`Condutor ${sectionLabel(x.section)} ${x.color} | perfil ${x.profile==='logic'?'LÓGICA':x.profile==='power'?'POTÊNCIA':'COMANDO'}${length}`,category:'CONDUTORES'})});

      const terminals=new Map();
      wires.forEach(w=>{if((w.terminalType||'ferrule')==='none')return;const terminalEnds=[w.from,w.to].filter(endpoint=>endpoint?.type==='terminal').length;if(!terminalEnds)return;const section=Number(w.crossSectionMm2)||0,type=w.terminalType||'ferrule',key=`${type}|${section}`,current=terminals.get(key)||{qty:0,type,section};current.qty+=terminalEnds;terminals.set(key,current)});
      [...terminals.values()].sort((a,b)=>a.section-b.section||a.type.localeCompare(b.type,'pt-BR')).forEach(x=>rows.push({qty:x.qty,description:`${terminalName(x.type)} ${sectionLabel(x.section)}`,category:'TERMINAIS'}));

      const sleeves=new Map();
      wires.forEach(w=>{const terminalEnds=[w.from,w.to].filter(endpoint=>endpoint?.type==='terminal').length;if(!terminalEnds)return;const section=Number(w.crossSectionMm2)||0,identification=String(w.identification||w.number||'').trim()||String(w.number||''),key=`${identification}|${section}`,current=sleeves.get(key)||{qty:0,identification,section};current.qty+=terminalEnds;sleeves.set(key,current)});
      [...sleeves.values()].sort((a,b)=>a.identification.localeCompare(b.identification,'pt-BR',{numeric:true})||a.section-b.section).forEach(x=>rows.push({qty:x.qty,description:`Anilha ${x.identification} | ${sectionLabel(x.section)}`,category:'ANILHAS'}));

      if(junctions.length)rows.push({qty:junctions.length,description:'Junção/derivação de condutor',category:'ACESSÓRIOS'});
      return rows;
    };

    const build=()=>{const rows=buildRows(),order=['COMPONENTES','CONDUTORES','TERMINAIS','ANILHAS','ACESSÓRIOS'],lines=[];order.forEach(category=>{const group=rows.filter(row=>row.category===category);if(!group.length)return;if(lines.length)lines.push('');lines.push(category);group.forEach(row=>lines.push(`${row.qty} × ${row.description}`))});if(getWires().length){if(lines.length)lines.push('');const scale=technicalScale();lines.push(scale?.enabled?`Observação: metragem estimada pela geometria da prancha em ${scale.label}. Não inclui folgas, subidas, descidas, reservas técnicas ou percursos fora do desenho.`:'Observação: metragem de condutores não informada porque a prancha ainda não possui escala física confiável. Foram contabilizados os condutores e as terminações reais do circuito.')}return lines};
    const open=()=>{const lines=build();report?.show('Lista de materiais',lines.length?lines:['Nenhum componente inserido.'],{pdf:true,csv:true,kind:'materials'});return lines};
    const downloadCsv=()=>{const rows=buildRows(),csv=['Categoria;Quantidade;Descrição',...rows.map(row=>[row.category,row.qty,row.description].map(csvEscape).join(';'))].join('\r\n'),blob=new Blob(['\ufeff',csv],{type:'text/csv;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`${fileBase()}-lista-de-materiais.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);notify('CSV compatível com Excel gerado')};

    const pdfCanvas=()=>{const lines=build(),project=projectName()||'Projeto sem título',author=(document.querySelector('.user-button b')?.textContent||'TechRib').trim(),date=new Date().toLocaleDateString('pt-BR'),canvas=document.createElement('canvas');canvas.width=1240;canvas.height=1754;const ctx=canvas.getContext('2d');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.strokeStyle='#173b55';ctx.lineWidth=3;ctx.strokeRect(46,46,1148,1662);ctx.fillStyle='#173b55';ctx.font='700 34px Arial';ctx.fillText('LISTA DE MATERIAIS',82,112);ctx.font='700 23px Arial';ctx.fillText(project,82,154);ctx.fillStyle='#64748b';ctx.font='18px Arial';ctx.fillText(`Autor: ${author}`,82,190);ctx.fillText(`Data: ${date}`,820,190);ctx.fillText(`Total de itens: ${lines.reduce((sum,line)=>sum+(Number((line.match(/^\s*(\d+)/)||[])[1])||0),0)}`,82,224);ctx.fillStyle='#f57c00';ctx.font='700 28px Arial';ctx.fillText('Tech',972,112);const techWidth=ctx.measureText('Tech').width;ctx.fillStyle='#12a5d6';ctx.fillText('Rib',972+techWidth,112);ctx.strokeStyle='#cbd5e1';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(82,252);ctx.lineTo(1158,252);ctx.stroke();ctx.fillStyle='#0f2d46';ctx.font='700 19px Arial';ctx.fillText('QTD.',92,292);ctx.fillText('DESCRIÇÃO',205,292);ctx.strokeStyle='#e2e8f0';ctx.beginPath();ctx.moveTo(82,310);ctx.lineTo(1158,310);ctx.stroke();let y=354;ctx.font='20px Arial';const rows=lines.length?lines:['Nenhum componente inserido.'];for(const line of rows){const m=line.match(/^\s*(\d+)\s*[×x]\s*(.+)$/i),qty=m?m[1]:'-',desc=m?m[2]:line;ctx.fillStyle='#0f172a';ctx.font='700 20px Arial';ctx.fillText(qty,104,y);ctx.font='20px Arial';ctx.fillText(desc,205,y);ctx.strokeStyle='#eef2f7';ctx.beginPath();ctx.moveTo(82,y+22);ctx.lineTo(1158,y+22);ctx.stroke();y+=48;if(y>1608){ctx.fillStyle='#64748b';ctx.font='16px Arial';ctx.fillText('A lista excedeu o espaço desta página. Use também o TXT para conferir todos os itens.',82,1648);break}}ctx.fillStyle='#64748b';ctx.font='15px Arial';ctx.fillText('Gerado pelo TechRib Simulador Elétrico',82,1690);return canvas};
    const downloadPdf=()=>{try{if(typeof makeSimplePdf!=='function'||typeof canvasJpegBytes!=='function')throw new Error('Gerador PDF indisponível');const canvas=pdfCanvas(),blob=makeSimplePdf(canvasJpegBytes(canvas),canvas.width,canvas.height),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`${fileBase()}-lista-de-materiais.pdf`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1200);notify('PDF da lista de materiais gerado')}catch(error){console.error(error);notify('Não foi possível gerar o PDF da lista de materiais')}};
    const bind=()=>{
      document.querySelectorAll('[data-action="bom"]').forEach(button=>button.addEventListener('click',open));
      document.querySelector('[data-report-csv]')?.addEventListener('click',()=>{if(report?.snapshot()?.kind==='materials')downloadCsv()});
      document.querySelector('[data-report-pdf]')?.addEventListener('click',()=>{if(report?.snapshot()?.kind==='materials')downloadPdf()});
    };
    return {buildRows,build,open,downloadCsv,downloadPdf,pdfCanvas,bind};
  }

  global.TechRibBomRuntime={create,capabilities:Object.freeze({technicalScale:true,wireTechnicalCalculation:true})};
})(window);
