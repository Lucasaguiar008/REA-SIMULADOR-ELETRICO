(function(root){
  'use strict';
  // Bornes superiores dos disjuntores 2P/3P: 115.414 * 234 / 620.
  const DIN_POLE_PITCH=115.414*234/620;
  const SCALE=160/180, STEP=DIN_POLE_PITCH/SCALE;
  const MODES=Object.freeze({
    '1F + N':['L1','N'],
    '1F + N + PE':['L1','N','PE'],
    '2F + N + PE':['L1','L2','N','PE'],
    '3F + N + PE':['L1','L2','L3','N','PE']
  });
  const layout=count=>{const width=56+(count-1)*STEP;return{width,svgWidth:width*SCALE,boxWidth:width*SCALE+24,positions:Array.from({length:count},(_,i)=>28+i*STEP)}};
  const FIXED=Object.freeze({'fonte-monofasica':['L','N','PE'],'fonte-bifasica':['L1','L2','N','PE'],'fonte-trifasica':['L1','L2','L3','N','PE']});
  const resizeBody=(svg,width)=>{
    const body=svg.querySelector('g[data-wire-obstacle="true"]');
    if(!body){svg.querySelector('[data-component-body]')?.setAttribute('width',String(width-16));return}
    const shell=body.querySelector('rect');
    const oldWidth=Number(shell.getAttribute('width'))+16;
    shell.setAttribute('width',String(width-16));
    body.querySelector('rect[y="18"]')?.setAttribute('width',String(width-34));
    body.querySelector('rect[y="23"]')?.setAttribute('width',String(width-48));
    body.querySelector('path[fill="#7b8a93"]')?.setAttribute('d',`M12 77 H${width-12} V83 Q${width-12} 90 ${width-20} 92 H20 Q12 92 12 84 Z`);
    body.querySelectorAll('text[text-anchor="middle"]').forEach(el=>el.setAttribute('x',String(width/2)));
    body.querySelectorAll('text[text-anchor="end"]').forEach(el=>el.setAttribute('x',String(width-31)));
    body.querySelectorAll('g > circle').forEach(el=>{if(Number(el.getAttribute('cx'))>oldWidth/2)el.setAttribute('cx',String(width-18))});
    body.querySelectorAll('g > path').forEach(el=>{const match=el.getAttribute('d')?.match(/^M([\d.]+) (20|72)h3$/);if(match&&Number(match[1])>oldWidth/2)el.setAttribute('d',`M${width-19.5} ${match[2]}h3`)});
  };
  const apply=(node,{beforeRemove=()=>{},metadata=()=>{},refreshHitbox=()=>{}}={})=>{
    const configurable=node?.dataset?.type==='alimentacao-ac-configuravel',fixed=FIXED[node?.dataset?.type];
    if(!configurable&&!fixed)return;
    const svg=node.querySelector(':scope > svg');if(!svg)return;
    const mode=Object.hasOwn(MODES,node.dataset.supplyMode)?node.dataset.supplyMode:'1F + N + PE',names=fixed||MODES[mode],size=layout(names.length);
    if(configurable)node.dataset.supplyMode=mode;
    if(!node.acSupplyTemplates)node.acSupplyTemplates=new Map([...svg.querySelectorAll('[data-terminal]')].map(g=>[g.dataset.terminal,g.cloneNode(true)]));
    [...svg.querySelectorAll('[data-terminal]')].forEach(g=>{if(!names.includes(g.dataset.terminal)){beforeRemove(g);g.remove()}});
    names.forEach((name,index)=>{
      let g=svg.querySelector(`[data-terminal="${name}"]`);
      if(!g){g=node.acSupplyTemplates.get(name)?.cloneNode(true);if(!g)throw Error(`Terminal AC ausente: ${name}`)}
      const origin=Number(g.querySelector('[data-wire-anchor]')?.getAttribute('cx')||0);
      g.setAttribute('transform',`translate(${size.positions[index]-origin} 0)`);
      if(configurable)g.dataset.terminalId=`${node.dataset.componentId}:${name}:${index+1}`;
      svg.appendChild(g);metadata(g);
    });
    svg.setAttribute('viewBox',`0 0 ${size.width} 120`);
    resizeBody(svg,size.width);
    const title=svg.querySelector('[data-ac-supply-title]');if(title){title.setAttribute('x',String(size.width/2));title.textContent=`${names.filter(n=>/^L/.test(n)).length}~`}
    const caption=svg.querySelector('[data-ac-supply-caption]');if(caption)caption.textContent=`${names.filter(n=>/^L/.test(n)).length} ${names.includes('L2')?'FASES':'FASE'} • N${names.includes('PE')?' • PE':''}`;
    node.style.setProperty('width',`${size.boxWidth}px`,'important');
    node.style.setProperty('min-height','140px','important');node.style.setProperty('padding','10px','important');
    svg.style.setProperty('width',`${size.svgWidth}px`,'important');svg.style.setProperty('height',`${120*SCALE}px`,'important');svg.style.setProperty('max-width','none','important');svg.style.setProperty('max-height','none','important');
    if(configurable){node.dataset.lineVoltage=node.dataset.lineVoltage||'127';
    node.dataset.phaseVoltage=String(names.includes('L2')?Math.round(Number(node.dataset.lineVoltage)/Math.sqrt(3)):Number(node.dataset.lineVoltage));}
    refreshHitbox(node);
    return size;
  };
  root.TechRibAcSupplyLayout=Object.freeze({DIN_POLE_PITCH,MODES,layout,apply});
})(globalThis);
