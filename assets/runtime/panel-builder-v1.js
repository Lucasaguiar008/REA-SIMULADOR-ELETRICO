(function(){
'use strict';
const TYPE_DUCT='canaleta-ranhurada-painel', TYPE_RAIL='trilho-din-perfurado', TYPE_RES='resid-quadro-din', MODULE_PX=72, MM_TO_PX=4, PANEL_REFERENCE_PX_PER_MM=2.6, CABINET_MM_TO_PX=PANEL_REFERENCE_PX_PER_MM, RES_PANEL_MM_TO_PX=PANEL_REFERENCE_PX_PER_MM;
const isComb=n=>/^pente-ligacao-[123]p$/.test(n?.dataset?.type||'');
const num=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const roundTo=(v,step)=>Math.round(v/step)*step;
const sheet=()=>document.querySelector('.schematic-sheet');
const placed=()=>[...(sheet()?.querySelectorAll('.placed-component')||[])];
const selected=()=>sheet()?.querySelector('.placed-component.selected')||sheet()?.querySelector('.placed-component.multi-selected')||null;
const panelTarget=()=>{const id=panelSection?.dataset?.panelBuilderTargetId||'';return(id&&sheet()?.querySelector(`.placed-component[data-component-id="${CSS.escape(id)}"]`))||selected()};
const hooks=()=>window.TechRibRegressionHooks;
const setImportant=(n,k,v)=>n?.style?.setProperty(k,v,'important');

function ductSettings(n){
  return{
    length:Math.max(50,Math.min(1000,num(n.dataset.panelDuctLengthMm,180))),
    width:[25,40,60,80,100].includes(num(n.dataset.panelDuctWidthMm,40))?num(n.dataset.panelDuctWidthMm,40):40,
    height:[25,40,60,80].includes(num(n.dataset.panelDuctHeightMm,40))?num(n.dataset.panelDuctHeightMm,40):40,
    orientation:n.dataset.panelDuctOrientation==='vertical'?'vertical':'horizontal',
    cover:n.dataset.panelDuctCover==='closed'?'closed':'open'
  };
}

function renderDuct(n){
  if(!n||n.dataset.type!==TYPE_DUCT)return false;
  const s=ductSettings(n);
  Object.assign(n.dataset,{panelDuctLengthMm:String(s.length),panelDuctWidthMm:String(s.width),panelDuctHeightMm:String(s.height),panelDuctOrientation:s.orientation,panelDuctCover:s.cover,routingRole:'wire-management',layerRole:'mechanical-infrastructure',electricalRole:'none',nonElectrical:'true'});n.classList.toggle('position-locked',n.dataset.positionLocked==='true');
  const long=Math.round(s.length*MM_TO_PX),thick=Math.round(s.width*MM_TO_PX),w=s.orientation==='horizontal'?long:thick,h=s.orientation==='horizontal'?thick:long;
  setImportant(n,'width',w+'px');setImportant(n,'height',h+'px');setImportant(n,'min-width','0');setImportant(n,'min-height',h+'px');setImportant(n,'max-width','none');setImportant(n,'max-height','none');setImportant(n,'padding','0');setImportant(n,'z-index',s.cover==='closed'?'6':'3');n.dataset.panelDuctRenderedOrientation=s.orientation;
  n.classList.toggle('panel-duct-closed',s.cover==='closed');
  const svg=n.querySelector(':scope>svg');if(!svg)return true;
  svg.setAttribute('viewBox',`0 0 ${w} ${h}`);svg.setAttribute('preserveAspectRatio','none');setImportant(svg,'width',w+'px');setImportant(svg,'height',h+'px');setImportant(svg,'max-width','none');setImportant(svg,'max-height','none');svg.style.overflow='hidden';
  const body=svg.querySelector('[data-duct-body]'),cavity=svg.querySelector('[data-duct-cavity]'),a=svg.querySelector('[data-duct-slots-a]'),b=svg.querySelector('[data-duct-slots-b]'),label=svg.querySelector('[data-duct-label]');
  if(body){body.setAttribute('width',Math.max(1,w-2));body.setAttribute('height',Math.max(1,h-2))}
  if(cavity){
    if(s.orientation==='horizontal'){
      cavity.setAttribute('x',Math.min(16,w*.08));cavity.setAttribute('y',Math.max(12,h*.20));cavity.setAttribute('width',Math.max(20,w-32));cavity.setAttribute('height',Math.max(18,h*.60));
    }else{
      cavity.setAttribute('x',Math.max(12,w*.20));cavity.setAttribute('y',Math.min(16,h*.08));cavity.setAttribute('width',Math.max(18,w*.60));cavity.setAttribute('height',Math.max(20,h-32));
    }
    cavity.setAttribute('fill',s.cover==='closed'?'#d9dedb':'#424b4c');
  }
  if(a&&b){
    if(s.orientation==='horizontal'){
      a.setAttribute('x','4');a.setAttribute('y','4');a.setAttribute('width',Math.max(1,w-8));a.setAttribute('height',Math.max(10,h*.18));
      b.setAttribute('x','4');b.setAttribute('y',Math.max(1,h-h*.18-4));b.setAttribute('width',Math.max(1,w-8));b.setAttribute('height',Math.max(10,h*.18));
    }else{
      a.setAttribute('x','4');a.setAttribute('y','4');a.setAttribute('width',Math.max(10,w*.18));a.setAttribute('height',Math.max(1,h-8));
      b.setAttribute('x',Math.max(1,w-w*.18-4));b.setAttribute('y','4');b.setAttribute('width',Math.max(10,w*.18));b.setAttribute('height',Math.max(1,h-8));
    }
    a.style.display=s.cover==='closed'?'none':'';b.style.display=s.cover==='closed'?'none':'';
  }
  if(label){
    label.setAttribute('x',w/2);label.setAttribute('y',h/2+7);label.textContent=s.cover==='closed'?`CANALETA ${s.width}×${s.height} • TAMPA`:`CANALETA ${s.width}×${s.height} • ABERTA`;label.setAttribute('font-size',String(Math.max(12,Math.min(21,thick*.13))));
    if(s.orientation==='vertical')label.setAttribute('transform',`rotate(-90 ${w/2} ${h/2})`);else label.removeAttribute('transform');
  }
  return true;
}


function resetDuctFusion(n){if(!(n instanceof HTMLElement))return;delete n.dataset.ductFuseLeft;delete n.dataset.ductFuseRight;delete n.dataset.ductFuseTop;delete n.dataset.ductFuseBottom;delete n.dataset.ductCornerJoin;setImportant(n,'clip-path','none');setImportant(n,'-webkit-clip-path','none')}
function setDuctFuse(n,side){if(!(n instanceof HTMLElement)||!side)return;const key='ductFuse'+side.charAt(0).toUpperCase()+side.slice(1);n.dataset[key]='true';n.dataset.ductCornerJoin='fused'}
function applyDuctFusion(n,s,w,h){
  if(!(n instanceof HTMLElement)||n.dataset.type!==TYPE_DUCT)return false;
  const body=n.querySelector('svg [data-duct-body]'),cavity=n.querySelector('svg [data-duct-cavity]'),a=n.querySelector('svg [data-duct-slots-a]'),b=n.querySelector('svg [data-duct-slots-b]');
  const fuseLeft=n.dataset.ductFuseLeft==='true',fuseRight=n.dataset.ductFuseRight==='true',fuseTop=n.dataset.ductFuseTop==='true',fuseBottom=n.dataset.ductFuseBottom==='true';
  const overlap=clamp(Math.round((s.orientation==='horizontal'?h:w)*0.20),10,22);
  n.style.overflow='visible';
  const svg=n.querySelector(':scope>svg');if(svg)svg.style.overflow='visible';
  if(s.orientation==='horizontal'){
    const sx=fuseLeft?-overlap:0, ex=fuseRight?overlap:0;
    if(body){body.setAttribute('x',1+sx);body.setAttribute('width',Math.max(1,w-2-sx+ex))}
    if(cavity){const cx=Math.min(16,w*.08),cw=Math.max(20,w-32);cavity.setAttribute('x',cx+sx);cavity.setAttribute('width',Math.max(20,cw-sx+ex))}
    if(a){a.setAttribute('x',4+sx);a.setAttribute('width',Math.max(1,w-8-sx+ex))}
    if(b){b.setAttribute('x',4+sx);b.setAttribute('width',Math.max(1,w-8-sx+ex))}
  } else {
    const sy=fuseTop?-overlap:0, ey=fuseBottom?overlap:0;
    if(body){body.setAttribute('y',1+sy);body.setAttribute('height',Math.max(1,h-2-sy+ey))}
    if(cavity){const cy=Math.min(16,h*.08),ch=Math.max(20,h-32);cavity.setAttribute('y',cy+sy);cavity.setAttribute('height',Math.max(20,ch-sy+ey))}
    if(a){a.setAttribute('y',4+sy);a.setAttribute('height',Math.max(1,h-8-sy+ey))}
    if(b){b.setAttribute('y',4+sy);b.setAttribute('height',Math.max(1,h-8-sy+ey))}
  }
  return true;
}
function ductEndpointRect(n,side){const r=rect(n),s=ductSettings(n),cx=r.x+r.w/2,cy=r.y+r.h/2;if(s.orientation==='horizontal'){if(side==='left')return{x:r.x,y:cy};if(side==='right')return{x:r.x+r.w,y:cy};}else{if(side==='top')return{x:cx,y:r.y};if(side==='bottom')return{x:cx,y:r.y+r.h};}return null}
function refreshDuctFusion(){
  const ducts=placed().filter(n=>n.dataset.type===TYPE_DUCT);ducts.forEach(resetDuctFusion);
  const threshold=42;
  for(let i=0;i<ducts.length;i++)for(let j=i+1;j<ducts.length;j++){
    const a=ducts[i],b=ducts[j],sa=ductSettings(a),sb=ductSettings(b);if(sa.orientation===sb.orientation)continue;
    const h=sa.orientation==='horizontal'?a:b,v=sa.orientation==='vertical'?a:b;
    ['left','right'].forEach(hs=>['top','bottom'].forEach(vs=>{
      const hp=ductEndpointRect(h,hs),vp=ductEndpointRect(v,vs);if(!hp||!vp)return;
      const d=Math.hypot(hp.x-vp.x,hp.y-vp.y);if(d>threshold)return;
      setDuctFuse(h,hs);setDuctFuse(v,vs);
    }));
  }
  ducts.forEach(n=>{const s=ductSettings(n);const long=Math.round(s.length*MM_TO_PX),thick=Math.round(s.width*MM_TO_PX),w=s.orientation==='horizontal'?long:thick,h=s.orientation==='horizontal'?thick:long;applyDuctFusion(n,s,w,h)});
}
function combModules(n){const poles=Math.max(1,num((n.dataset.type.match(/([123])p$/)||[])[1],1)),raw=num(n.dataset.combModules,12),step=poles;return Math.max(poles,Math.min(18,Math.round(raw/step)*step))}
function renderComb(n){
  if(!isComb(n))return false;
  const modules=combModules(n),w=modules*MODULE_PX,h=150;
  n.dataset.combModules=String(modules);n.dataset.electricalRole='conductor';n.dataset.routingRole='passthrough';
  setImportant(n,'width',w+'px');setImportant(n,'height',h+'px');setImportant(n,'min-height',h+'px');setImportant(n,'padding','0');setImportant(n,'z-index','1');
  const svg=n.querySelector(':scope>svg');
  if(svg){svg.setAttribute('viewBox',`0 0 ${w} ${h}`);svg.setAttribute('preserveAspectRatio','none');setImportant(svg,'width',w+'px');setImportant(svg,'height',h+'px');setImportant(svg,'max-width','none');setImportant(svg,'max-height','none');setImportant(svg,'overflow','hidden')}
  const active=new Set(Array.from({length:modules},(_,i)=>'D'+(i+1)));
  n.querySelectorAll('[data-terminal]').forEach(t=>{const on=active.has(t.dataset.terminal);t.style.pointerEvents=on?'':'none';t.style.opacity=on?'1':'0'});
  return true;
}

function renderRail(n){
  if(n?.dataset?.type!==TYPE_RAIL)return false;
  const mm=Math.max(72,Math.min(990,Math.round(num(n.dataset.dinRailLengthMm,180)/18)*18)),modules=Math.round(mm/18),w=modules*MODULE_PX,h=96;
  n.dataset.dinRailLengthMm=String(mm);
  setImportant(n,'width',w+'px');setImportant(n,'height',h+'px');setImportant(n,'min-height',h+'px');setImportant(n,'z-index','2');
  const svg=n.querySelector(':scope>svg');if(svg){svg.setAttribute('viewBox',`0 0 ${w} ${h}`);svg.setAttribute('preserveAspectRatio','none');setImportant(svg,'width',w+'px');setImportant(svg,'height',h+'px')}
  return true;
}

function cabinetDefaults(type){
  const key=String(type||'');
  if(key==='quadro-comando-p')return{width:300,height:300,depth:200,label:'P'};
  if(key==='quadro-comando-m')return{width:400,height:300,depth:200,label:'M'};
  if(key==='quadro-comando-g')return{width:500,height:400,depth:200,label:'G'};
  if(key==='quadro-comando-gg')return{width:600,height:400,depth:200,label:'GG'};
  return{width:400,height:300,depth:200,label:'M'};
}
function cabinetSettings(n){
  const d=cabinetDefaults(n?.dataset?.type||'');
  return{
    width:clamp(roundTo(num(n?.dataset?.cabinetWidthMm,d.width),50),250,1200),
    height:clamp(roundTo(num(n?.dataset?.cabinetHeightMm,d.height),50),250,2000),
    depth:clamp(roundTo(num(n?.dataset?.cabinetDepthMm,d.depth),50),120,600),
    label:d.label
  };
}
function renderCommandCabinet(n){
  if(!(n instanceof HTMLElement)||n.dataset.commandCabinet!=='true')return false;
  const s=cabinetSettings(n);
  Object.assign(n.dataset,{cabinetWidthMm:String(s.width),cabinetHeightMm:String(s.height),cabinetDepthMm:String(s.depth),routingRole:'mechanical',layerRole:'mechanical-background',electricalRole:'none',nonElectrical:'true'});n.classList.toggle('position-locked',n.dataset.positionLocked==='true');
  const frame=44,bodyW=Math.round(s.width*CABINET_MM_TO_PX+frame),bodyH=Math.round(s.height*CABINET_MM_TO_PX+frame),doorGap=Math.round(clamp(bodyW*.018,18,34)),doorFrameInset=8,doorW=Math.round(Math.max(260,bodyW-doorFrameInset*2)),doorH=Math.round(Math.max(260,bodyH-40)),totalW=bodyW+doorGap+doorW+18,totalH=bodyH+24;
  setImportant(n,'width',totalW+'px');setImportant(n,'height',totalH+'px');setImportant(n,'min-height',totalH+'px');setImportant(n,'padding','0');setImportant(n,'z-index','1');
  const svg=n.querySelector(':scope>svg');if(!svg)return true;
  svg.setAttribute('viewBox',`0 0 ${totalW} ${totalH}`);svg.setAttribute('preserveAspectRatio','none');setImportant(svg,'width',totalW+'px');setImportant(svg,'height',totalH+'px');setImportant(svg,'max-width','none');setImportant(svg,'max-height','none');
  const plateMarginX=36,plateMarginTop=64,plateMarginBottom=62;
  const outer=svg.querySelector('[data-panel-body]');if(outer){outer.setAttribute('x','20');outer.setAttribute('y','20');outer.setAttribute('width',bodyW);outer.setAttribute('height',bodyH);outer.setAttribute('rx','24')}
  const inner=svg.querySelector('[data-panel-inner]');if(inner){inner.setAttribute('x','42');inner.setAttribute('y','42');inner.setAttribute('width',Math.max(100,bodyW-44));inner.setAttribute('height',Math.max(100,bodyH-44));inner.setAttribute('rx','16')}
  const plate=svg.querySelector('[data-panel-mount-area]');if(plate){plate.setAttribute('x',String(plateMarginX));plate.setAttribute('y',String(plateMarginTop));plate.setAttribute('width',String(Math.max(120,bodyW-plateMarginX*2)));plate.setAttribute('height',String(Math.max(120,bodyH-plateMarginTop-plateMarginBottom)));plate.setAttribute('rx','10')}
  const plateLabel=svg.querySelector('[data-panel-plate-label]');if(plateLabel){plateLabel.setAttribute('x',String(Math.round(bodyW/2)));plateLabel.setAttribute('y','56');plateLabel.textContent=`PLACA DE MONTAGEM • ${s.width}×${s.height}×${s.depth} mm`}
  const railHint=svg.querySelector('[data-panel-rail-hint]');if(railHint){railHint.setAttribute('x',String(Math.round(bodyW/2)));railHint.setAttribute('y',String(Math.max(86,bodyH-22)));railHint.textContent='Infraestrutura independente: arraste trilhos DIN, canaletas e dispositivos para dentro do quadro'}
  const rightX=bodyW+doorGap;
  const doorOuter=svg.querySelector('[data-door-outer]');if(doorOuter){doorOuter.setAttribute('x',String(rightX));doorOuter.setAttribute('y','54');doorOuter.setAttribute('width',String(doorW));doorOuter.setAttribute('height',String(doorH));doorOuter.setAttribute('rx','18')}
  const doorSurface=svg.querySelector('[data-door-surface]');if(doorSurface){doorSurface.setAttribute('x',String(rightX+12));doorSurface.setAttribute('y','68');doorSurface.setAttribute('width',String(Math.max(80,doorW-24)));doorSurface.setAttribute('height',String(Math.max(80,doorH-28)));doorSurface.setAttribute('rx','12')}
  const handleBase=svg.querySelector('[data-door-handle-base]');if(handleBase){handleBase.setAttribute('x',String(rightX+doorW-38));handleBase.setAttribute('y',String(Math.round(doorH/2)));handleBase.setAttribute('width','14');handleBase.setAttribute('height','76');handleBase.setAttribute('rx','7')}
  const handleGrip=svg.querySelector('[data-door-handle-grip]');if(handleGrip){handleGrip.setAttribute('cx',String(rightX+doorW-24));handleGrip.setAttribute('cy',String(Math.round(54+doorH/2+8)));handleGrip.setAttribute('r','16')}
  const hingeTop=svg.querySelector('[data-door-hinge-top]');if(hingeTop){hingeTop.setAttribute('x',String(rightX-8));hingeTop.setAttribute('y','150');hingeTop.setAttribute('width','14');hingeTop.setAttribute('height','94');hingeTop.setAttribute('rx','5')}
  const hingeBottom=svg.querySelector('[data-door-hinge-bottom]');if(hingeBottom){hingeBottom.setAttribute('x',String(rightX-8));hingeBottom.setAttribute('y',String(Math.max(250,doorH-10)));hingeBottom.setAttribute('width','14');hingeBottom.setAttribute('height','94');hingeBottom.setAttribute('rx','5')}
  const cable=svg.querySelector('[data-door-cable-entry]');if(cable){cable.setAttribute('cx',String(bodyW+14));cable.setAttribute('cy',String(bodyH-94));cable.setAttribute('r','14')}
  const cableLine1=svg.querySelector('[data-door-cable-line-a]');if(cableLine1){cableLine1.setAttribute('x1',String(bodyW+10));cableLine1.setAttribute('y1',String(bodyH-82));cableLine1.setAttribute('x2',String(rightX+12));cableLine1.setAttribute('y2',String(bodyH-42))}
  const cableLine2=svg.querySelector('[data-door-cable-line-b]');if(cableLine2){cableLine2.setAttribute('x1',String(bodyW+24));cableLine2.setAttribute('y1',String(bodyH-108));cableLine2.setAttribute('x2',String(rightX+28));cableLine2.setAttribute('y2',String(bodyH-58))}
  const label=svg.querySelector('[data-cabinet-title]');if(label){label.setAttribute('x',String(Math.round(bodyW/2)));label.setAttribute('y','38');label.textContent=`QUADRO DE COMANDO ${s.label} • ${s.width}×${s.height}×${s.depth} mm`}
  const foot=svg.querySelector('[data-cabinet-footnote]');if(foot){foot.setAttribute('x',String(rightX+doorW/2));foot.setAttribute('y',String(bodyH+10));foot.textContent='Porta com área para sinaleiros, botoeiras e instrumentos'}
  return true;
}

function residentialRowsForHeight(height){if(height<=320)return 1;if(height<=470)return 2;if(height<=620)return 3;return 4}
function residentialPanelSettings(n){
  const width=clamp(roundTo(num(n?.dataset?.residPanelWidthMm,360),30),240,720);
  const height=clamp(roundTo(num(n?.dataset?.residPanelHeightMm,450),30),220,980);
  const depth=clamp(roundTo(num(n?.dataset?.residPanelDepthMm,110),10),80,180);
  return{width,height,depth,rows:residentialRowsForHeight(height)};
}
function renderResidentialPanel(n){
  if(!(n instanceof HTMLElement)||n.dataset.type!==TYPE_RES)return false;
  const s=residentialPanelSettings(n);
  Object.assign(n.dataset,{residPanelWidthMm:String(s.width),residPanelHeightMm:String(s.height),residPanelDepthMm:String(s.depth),routingRole:'mechanical',layerRole:'mechanical-background',electricalRole:'none',nonElectrical:'true'});n.classList.toggle('position-locked',n.dataset.positionLocked==='true');
  const frame=56,outerW=Math.round(s.width*RES_PANEL_MM_TO_PX+frame),outerH=Math.round(s.height*RES_PANEL_MM_TO_PX+frame),innerX=30,innerY=30,innerW=outerW-60,innerH=outerH-60,plateX=58,plateY=84,plateW=outerW-116,plateH=outerH-164;
  setImportant(n,'width',outerW+'px');setImportant(n,'height',outerH+'px');setImportant(n,'min-height',outerH+'px');setImportant(n,'padding','0');setImportant(n,'z-index','1');
  const svg=n.querySelector(':scope>svg');if(!svg)return true;
  svg.setAttribute('viewBox',`0 0 ${outerW} ${outerH}`);svg.setAttribute('preserveAspectRatio','none');setImportant(svg,'width',outerW+'px');setImportant(svg,'height',outerH+'px');setImportant(svg,'max-width','none');setImportant(svg,'max-height','none');
  const rects=svg.querySelectorAll('rect');
  if(rects[0]){rects[0].setAttribute('x','18');rects[0].setAttribute('y','18');rects[0].setAttribute('width',String(outerW-36));rects[0].setAttribute('height',String(outerH-36));rects[0].setAttribute('rx','34')}
  if(rects[1]){rects[1].setAttribute('x',String(innerX));rects[1].setAttribute('y',String(innerY));rects[1].setAttribute('width',String(innerW));rects[1].setAttribute('height',String(innerH));rects[1].setAttribute('rx','26')}
  if(rects[2]){rects[2].setAttribute('x',String(plateX));rects[2].setAttribute('y',String(plateY));rects[2].setAttribute('width',String(plateW));rects[2].setAttribute('height',String(plateH));rects[2].setAttribute('rx','18')}
  const rails=[...svg.querySelectorAll('[data-resid-rail]')];
  while(rails.length<s.rows){const base=rails[0]?.cloneNode(true);if(base){svg.appendChild(base);rails.push(base)}else break}
  rails.forEach((rail,index)=>{rail.style.display=index<s.rows?'':'none';if(index>=s.rows)return;const slot=s.rows===1 ? 0.5 : (index/(s.rows-1));const y=Math.round(plateY+96+slot*Math.max(20,plateH-192));rail.setAttribute('x',String(plateX+26));rail.setAttribute('y',String(y));rail.setAttribute('width',String(Math.max(120,plateW-52)));rail.setAttribute('height','34');rail.setAttribute('rx','8')});
  const guide=svg.querySelector('[data-resid-guide]');if(guide){guide.setAttribute('d',`M ${plateX+18} ${plateY+42}h ${plateW-36} M ${plateX+18} ${plateY+plateH-34}h ${plateW-36}`)}
  const title=svg.querySelector('[data-resid-title]');if(title){title.setAttribute('x',String(Math.round(outerW/2)));title.setAttribute('y','74');title.textContent=`QDC • ${s.width}×${s.height}×${s.depth} mm • ${s.rows} fileira(s) DIN`}
  const foot=svg.querySelector('[data-resid-footnote]');if(foot){foot.setAttribute('x',String(Math.round(outerW/2)));foot.setAttribute('y',String(outerH-42));foot.textContent='Altura e largura configuráveis • trilhos internos se ajustam automaticamente'}
  return true;
}

function initializeNode(n){
  if(!(n instanceof HTMLElement)||!n.classList.contains('placed-component'))return;
  if(n.dataset.type===TYPE_DUCT)renderDuct(n);
  else if(isComb(n))renderComb(n);
  else if(n.dataset.type===TYPE_RAIL)renderRail(n);
  else if(n.dataset.commandCabinet==='true')renderCommandCabinet(n);
  else if(n.dataset.type===TYPE_RES)renderResidentialPanel(n);
}

function rect(n){return{x:num(n.style.left,n.offsetLeft),y:num(n.style.top,n.offsetTop),w:n.offsetWidth||num(n.style.width),h:n.offsetHeight||num(n.style.height)}}
function isDinMountable(n){const t=n?.dataset?.type||'';if(!t||t===TYPE_RAIL||t===TYPE_DUCT||isComb(n)||n.dataset.commandCabinet==='true'||n.dataset.doorMount==='true'||t===TYPE_RES)return false;if(n.dataset.nonElectrical==='true')return false;return /^(?:disjuntor|interruptor-dr|dps|contator|rele-|temporizador|fonte-24|transformador-comando|borne|knx-|dali-|modulo-io-modbus|medidor-modbus|pcf8574|mcp23017|pca9685)/.test(t)}
function nearestRail(n){const r=rect(n),cx=r.x+r.w/2,cy=r.y+r.h/2;let best=null;placed().filter(x=>x.dataset.type===TYPE_RAIL).forEach(rail=>{const q=rect(rail),ry=q.y+q.h/2;if(cx<q.x-120||cx>q.x+q.w+120)return;const d=Math.abs(cy-ry);if(d<=Math.max(180,r.h*.6)&&(!best||d<best.d))best={rail,q,d}});return best}
function snapDin(n){
  if(!isDinMountable(n))return false;
  const best=nearestRail(n);if(!best){delete n.dataset.dinMountedOn;return false}
  const r=rect(n),anchor=best.q.x+12,maxSlot=Math.max(0,Math.floor((best.q.w-Math.max(72,r.w-24))/MODULE_PX)),slot=clamp(Math.round((r.x-anchor)/MODULE_PX),0,maxSlot),x=anchor+slot*MODULE_PX,y=best.q.y+best.q.h/2-r.h/2;
  n.style.left=Math.round(x)+'px';n.style.top=Math.round(y)+'px';n.dataset.dinMountedOn=best.rail.dataset.componentId||'';n.dataset.dinSlot=String(slot+1);
  return true;
}
function breakerInputs(br){return [...br.querySelectorAll('[data-terminal]')].filter(t=>['1','3','5','7'].includes(String(t.dataset.terminal||''))||String(t.dataset.terminalFunction||'')==='power-input')}
function sheetPointForElement(el){const sh=sheet(),sr=sh?.getBoundingClientRect?.(),er=el?.getBoundingClientRect?.();if(!sh||!sr||!er)return null;const zx=sr.width/Math.max(1,sh.offsetWidth||sh.clientWidth||sr.width),zy=sr.height/Math.max(1,sh.offsetHeight||sh.clientHeight||sr.height);return{x:(er.left+er.width/2-sr.left)/Math.max(.001,zx),y:(er.top+er.height/2-sr.top)/Math.max(.001,zy)}}
function snapComb(n){
  if(!isComb(n))return false;
  const r=rect(n),bottom=r.y+r.h;
  const targets=[];
  placed().filter(x=>/^disjuntor-[123]p$/.test(x.dataset.type||'')).forEach(br=>{
    const inputs=breakerInputs(br);if(!inputs.length)return;
    inputs.forEach(t=>{const p=sheetPointForElement(t);if(p)targets.push({br,t,p})});
  });
  targets.sort((a,b)=>a.p.x-b.p.x);
  const sameRow=targets.filter(item=>Math.abs(item.p.y-bottom)<=200);
  const leftmost=sameRow[0]||targets[0]||null;
  if(leftmost){
    const firstComb=n.querySelector('[data-terminal="D1"]')||n.querySelector('[data-terminal]');
    const cp=sheetPointForElement(firstComb),bp=leftmost.p;
    if(cp&&bp){
      n.style.left=Math.round(num(n.style.left,n.offsetLeft)+(bp.x-cp.x))+'px';
      n.style.top=Math.round(num(n.style.top,n.offsetTop)+(bp.y-cp.y)+26)+'px';
    }else{
      const br=rect(leftmost.br);
      n.style.left=Math.round(br.x-18)+'px';n.style.top=Math.round(br.y-86)+'px';
    }
    n.dataset.combMountedRow='breaker';n.dataset.combMountedBreakerId=leftmost.br.dataset.componentId||'';
    return true;
  }
  const rail=nearestRail(n);
  if(rail){n.style.left=Math.round(rail.q.x+12)+'px';n.style.top=Math.round(rail.q.y-86)+'px';return true}
  return false;
}
function combElectricalPairs(comb){if(!isComb(comb)||comb.dataset.combMountedRow!=='breaker')return[];const modules=combModules(comb),teeth=[...comb.querySelectorAll('[data-terminal]')].filter(t=>{const m=String(t.dataset.terminal||'').match(/^D(\d+)$/);return m&&Number(m[1])<=modules}),breakers=placed().filter(x=>/^disjuntor-[123]p$/.test(x.dataset.type||'')),targets=[];breakers.forEach(br=>breakerInputs(br).forEach(t=>{const p=sheetPointForElement(t);if(p)targets.push({t,p,br})}));const pairs=[];teeth.forEach(t=>{const p=sheetPointForElement(t);if(!p)return;let best=null;targets.forEach(q=>{const dx=Math.abs(q.p.x-p.x),dy=Math.abs(q.p.y-p.y),d=Math.hypot(dx,dy);if(dx<=34&&dy<=42&&(!best||d<best.d))best={...q,d}});if(best)pairs.push([t,best.t])});comb.dataset.combDockedTeeth=String(pairs.length);return pairs}
function doorBounds(cab){const surf=cab.querySelector('[data-door-surface]');if(!surf)return null;const x=num(surf.getAttribute('x')),y=num(surf.getAttribute('y')),w=num(surf.getAttribute('width')),h=num(surf.getAttribute('height')),c=rect(cab);return{x:c.x+x,y:c.y+y,w,h,cab}}
function snapDoor(n){if(n?.dataset?.doorMount!=='true')return false;const r=rect(n),cx=r.x+r.w/2,cy=r.y+r.h/2;let best=null;placed().filter(x=>x.dataset.commandCabinet==='true').forEach(cab=>{const d=doorBounds(cab);if(!d)return;const inside=cx>=d.x-70&&cx<=d.x+d.w+70&&cy>=d.y-70&&cy<=d.y+d.h+70;if(!inside)return;const dist=Math.abs(cx-(d.x+d.w/2))+Math.abs(cy-(d.y+d.h/2));if(!best||dist<best.dist)best={...d,dist}});if(!best)return false;let x=Math.round((r.x-best.x)/10)*10+best.x,y=Math.round((r.y-best.y)/10)*10+best.y;x=Math.max(best.x+8,Math.min(best.x+best.w-r.w-8,x));y=Math.max(best.y+8,Math.min(best.y+best.h-r.h-8,y));n.style.left=Math.round(x)+'px';n.style.top=Math.round(y)+'px';n.dataset.mountedCabinetId=best.cab.dataset.componentId||'';return true}
function snapMovedComponents(nodes){(nodes||[]).forEach(n=>{initializeNode(n);if(isComb(n))snapComb(n);else if(n.dataset.doorMount==='true')snapDoor(n);else snapDin(n)});refreshDuctFusion();hooks()?.redraw?.()}
function wirePoints(w){if(Array.isArray(w?.visualPoints)&&w.visualPoints.length>1)return w.visualPoints.map(p=>({x:num(p.x),y:num(p.y)}));try{const path=w.path;if(path&&path.getAttribute('d')){const nums=(path.getAttribute('d').match(/-?\d+(?:\.\d+)?/g)||[]).map(Number),pts=[];for(let i=0;i+1<nums.length;i+=2)pts.push({x:nums[i],y:nums[i+1]});if(pts.length>1)return pts}}catch{}return[]}
function segHits(a,b,r){if(!a||!b)return false;const minx=Math.min(a.x,b.x),maxx=Math.max(a.x,b.x),miny=Math.min(a.y,b.y),maxy=Math.max(a.y,b.y);return !(maxx<r.x||minx>r.x+r.w||maxy<r.y||miny>r.y+r.h)}
function wiresInDuct(n){const r=rect(n);return (hooks()?.wires?.()||[]).filter(w=>{const p=wirePoints(w);for(let i=1;i<p.length;i++)if(segHits(p[i-1],p[i],r))return true;return false})}
function occupancy(n){const s=ductSettings(n),ws=wiresInDuct(n),usable=Math.max(1,s.width*s.height*.45),used=ws.reduce((sum,w)=>sum+Math.max(.5,num(w.crossSectionMm2,.75))*2.6,0),pct=Math.min(100,used/usable*100);return{count:ws.length,pct}}
function visualSegmentForDuct(w,r,s){const p=wirePoints(w);let best=null;for(let j=1;j<p.length;j++){const a=p[j-1],b=p[j];if(!segHits(a,b,r))continue;const horizontal=Math.abs(a.y-b.y)<=Math.abs(a.x-b.x),ok=s.orientation==='horizontal'?horizontal:!horizontal;if(!ok)continue;const len=Math.hypot(b.x-a.x,b.y-a.y);if(!best||len>best.len)best={index:j,a,b,len,points:p}}return best}
function rebuildDoorWireThroughDuct(w,r,s,lane){const seg=visualSegmentForDuct(w,r,s),bridge=hooks()?.replaceWireWaypoints;if(!seg||typeof bridge!=='function')return false;const margin=Math.min(18,Math.max(8,(s.orientation==='horizontal'?r.w:r.h)*.04));let p1,p2;if(s.orientation==='horizontal'){let lo=Math.max(r.x+margin,Math.min(seg.a.x,seg.b.x)),hi=Math.min(r.x+r.w-margin,Math.max(seg.a.x,seg.b.x));if(hi-lo<24){lo=r.x+margin;hi=r.x+r.w-margin}p1={x:lo,y:lane};p2={x:hi,y:lane};if(seg.b.x<seg.a.x)[p1,p2]=[p2,p1]}else{let lo=Math.max(r.y+margin,Math.min(seg.a.y,seg.b.y)),hi=Math.min(r.y+r.h-margin,Math.max(seg.a.y,seg.b.y));if(hi-lo<24){lo=r.y+margin;hi=r.y+r.h-margin}p1={x:lane,y:lo};p2={x:lane,y:hi};if(seg.b.y<seg.a.y)[p1,p2]=[p2,p1]}const route=seg.points,before=route.slice(0,seg.index),after=route.slice(seg.index),full=[...before,p1,p2,...after].filter((p,i,a)=>!i||Math.abs(p.x-a[i-1].x)>.5||Math.abs(p.y-a[i-1].y)>.5);const ok=bridge(w,full,[p1,p2]);if(ok){w.panelDuctId=n.dataset.componentId||'';w.routeLocked=true}return Boolean(ok)}
function organizeDuct(n){if(n?.dataset.type!==TYPE_DUCT)return;const ws=wiresInDuct(n);if(!ws.length){toast('Nenhum fio atravessa esta canaleta ainda. Arraste um trecho de fio sobre ela para encaixar.');return}const r=rect(n),s=ductSettings(n),spacing=Math.min(12,Math.max(5,(s.orientation==='horizontal'?r.h:r.w)/Math.max(2,ws.length+1))),center=s.orientation==='horizontal'?r.y+r.h/2:r.x+r.w/2;let organized=0;ws.forEach((w,i)=>{const lane=center+(i-(ws.length-1)/2)*spacing;const pts=w.waypoints||[];let best=-1,score=Infinity;if(pts.length>=2){for(let j=1;j<pts.length;j++){const a=pts[j-1],b=pts[j];if(segHits(a,b,r)){const horizontal=Math.abs(a.y-b.y)<=Math.abs(a.x-b.x),ok=s.orientation==='horizontal'?horizontal:!horizontal;if(ok){const d=s.orientation==='horizontal'?Math.abs((a.y+b.y)/2-center):Math.abs((a.x+b.x)/2-center);if(d<score){score=d;best=j}}}}}if(best>0){const a=pts[best-1],b=pts[best];if(s.orientation==='horizontal'){a.y=lane;b.y=lane}else{a.x=lane;b.x=lane}a.manual=b.manual=true;w.routeLocked=true;w.panelDuctId=n.dataset.componentId||'';organized++;return}if(rebuildDoorWireThroughDuct(w,r,s,lane))organized++});hooks()?.redraw?.();hooks()?.historyCapture?.();hooks()?.scheduleAutosave?.();toast(`${organized} de ${ws.length} condutor(es) organizado(s) nesta canaleta.`);refreshPanelSection()}
function toast(msg){const old=document.querySelector('[data-panel-builder-toast]');old?.remove();const d=document.createElement('div');d.dataset.panelBuilderToast='true';d.textContent=msg;Object.assign(d.style,{position:'fixed',right:'22px',bottom:'70px',zIndex:100000,background:'#0f172a',color:'#fff',padding:'10px 14px',borderRadius:'8px',font:'700 12px Arial',boxShadow:'0 6px 18px #0004'});document.body.appendChild(d);setTimeout(()=>d.remove(),2800)}
let panelSection=null,ductFields={},combFields={},cabFields={},resFields={};
function ensurePanelSection(){
  const p=document.querySelector('[data-properties-panel]');if(!p||panelSection)return;
  panelSection=document.createElement('section');panelSection.dataset.propPanelBuilderGroup='true';panelSection.hidden=true;
  panelSection.innerHTML=`<h4 data-pb-title>Montagem de quadro</h4>
    <div data-pb-duct hidden>
      <label>Comprimento (mm)<input data-pb-length type="number" min="50" max="1000" step="10"></label>
      <label>Largura<select data-pb-width><option>25</option><option>40</option><option>60</option><option>80</option><option>100</option></select></label>
      <label>Altura / profundidade<select data-pb-height><option>25</option><option>40</option><option>60</option><option>80</option></select></label>
      <label>Orientação<select data-pb-orientation><option value="horizontal">Horizontal</option><option value="vertical">Vertical</option></select></label>
      <label>Tampa<select data-pb-cover><option value="open">Aberta — fios visíveis</option><option value="closed">Fechada — fios ocultos</option></select></label>
      <label class="check"><input data-pb-duct-lock type="checkbox"> Bloquear posição da canaleta</label>
      <small data-pb-occupancy></small>
      <button type="button" class="panel-builder-action" data-pb-organize>Organizar fios nesta canaleta</button>
    </div>
    <div data-pb-comb hidden>
      <label>Módulos do pente<input data-pb-modules type="number" min="1" max="18" step="1"></label>
      <small data-pb-comb-info>Passo DIN de 18 mm. O pente é um condutor elétrico rígido e possui continuidade interna por fase.</small>
    </div>
    <div data-pb-rail hidden><small>Encaixe automático ativo: componentes DIN soltos perto deste trilho alinham no passo de 18 mm.</small></div>
    <div data-pb-cab hidden>
      <label>Largura (mm)<input data-pb-cab-width type="number" min="250" max="1200" step="50"></label>
      <label>Altura (mm)<input data-pb-cab-height type="number" min="250" max="2000" step="50"></label>
      <label>Profundidade (mm)<input data-pb-cab-depth type="number" min="120" max="600" step="50"></label>
      <label class="check"><input data-pb-cab-lock type="checkbox"> Bloquear posição do quadro</label>
      <small data-pb-cab-info>Quadro industrial configurável com proporção baseada em dimensões reais de mercado. O tamanho visual acompanha a escala dos dispositivos DIN.</small>
    </div>
    <div data-pb-res hidden>
      <label>Largura (mm)<input data-pb-res-width type="number" min="240" max="720" step="30"></label>
      <label>Altura (mm)<input data-pb-res-height type="number" min="220" max="980" step="30"></label>
      <label>Profundidade (mm)<input data-pb-res-depth type="number" min="80" max="180" step="10"></label>
      <label class="check"><input data-pb-res-lock type="checkbox"> Bloquear posição do quadro</label>
      <small data-pb-res-info>Quadro residencial configurável. A quantidade de fileiras DIN internas se ajusta automaticamente conforme a altura.</small>
    </div>`;
  const footer=p.querySelector('footer');p.insertBefore(panelSection,footer);
  ductFields={wrap:panelSection.querySelector('[data-pb-duct]'),length:panelSection.querySelector('[data-pb-length]'),width:panelSection.querySelector('[data-pb-width]'),height:panelSection.querySelector('[data-pb-height]'),orientation:panelSection.querySelector('[data-pb-orientation]'),cover:panelSection.querySelector('[data-pb-cover]'),lock:panelSection.querySelector('[data-pb-duct-lock]'),occ:panelSection.querySelector('[data-pb-occupancy]')};
  combFields={wrap:panelSection.querySelector('[data-pb-comb]'),modules:panelSection.querySelector('[data-pb-modules]')};
  cabFields={wrap:panelSection.querySelector('[data-pb-cab]'),width:panelSection.querySelector('[data-pb-cab-width]'),height:panelSection.querySelector('[data-pb-cab-height]'),depth:panelSection.querySelector('[data-pb-cab-depth]'),lock:panelSection.querySelector('[data-pb-cab-lock]'),info:panelSection.querySelector('[data-pb-cab-info]')};
  resFields={wrap:panelSection.querySelector('[data-pb-res]'),width:panelSection.querySelector('[data-pb-res-width]'),height:panelSection.querySelector('[data-pb-res-height]'),depth:panelSection.querySelector('[data-pb-res-depth]'),lock:panelSection.querySelector('[data-pb-res-lock]'),info:panelSection.querySelector('[data-pb-res-info]')};
  panelSection.querySelector('[data-pb-organize]').addEventListener('click',e=>{e.preventDefault();const n=panelTarget();if(n)organizeDuct(n)});
  const applyDuctEditorNow=()=>{const n=panelTarget();if(!n||n.dataset.type!==TYPE_DUCT)return;n.dataset.panelDuctLengthMm=ductFields.length.value;n.dataset.panelDuctWidthMm=ductFields.width.value;n.dataset.panelDuctHeightMm=ductFields.height.value;n.dataset.panelDuctOrientation=ductFields.orientation.value==='vertical'?'vertical':'horizontal';n.dataset.panelDuctCover=ductFields.cover.value==='closed'?'closed':'open';renderDuct(n);refreshDuctFusion();hooks()?.redraw?.()};
  ductFields.orientation.addEventListener('change',()=>{applyDuctEditorNow();setTimeout(refreshPanelSection,0)});
  ductFields.length.addEventListener('change',applyDuctEditorNow);ductFields.width.addEventListener('change',applyDuctEditorNow);ductFields.height.addEventListener('change',applyDuctEditorNow);ductFields.cover.addEventListener('change',applyDuctEditorNow);

  const applyLockImmediately=(input,kind)=>{if(!input)return;input.addEventListener('change',()=>{const n=panelTarget();if(!n)return;const valid=kind==='industrial'?n.dataset.commandCabinet==='true':kind==='residential'?n.dataset.type===TYPE_RES:n.dataset.type===TYPE_DUCT;if(!valid)return;n.dataset.positionLocked=String(Boolean(input.checked));n.classList.toggle('position-locked',input.checked);try{hooks()?.historyCapture?.()}catch{}try{hooks()?.scheduleAutosave?.()}catch{}const noun=kind==='duct'?'Canaleta':'Quadro';toast(input.checked?`${noun} bloqueado: posição fixa.`:`${noun} desbloqueado: posição livre.`);refreshPanelSection()})};
  applyLockImmediately(ductFields.lock,'duct');
  applyLockImmediately(cabFields.lock,'industrial');
  applyLockImmediately(resFields.lock,'residential');
  p.querySelector('[data-prop-apply]')?.addEventListener('click',()=>{
    const n=panelTarget();if(!n)return;
    if(n.dataset.type===TYPE_DUCT){n.dataset.panelDuctLengthMm=ductFields.length.value;n.dataset.panelDuctWidthMm=ductFields.width.value;n.dataset.panelDuctHeightMm=ductFields.height.value;n.dataset.panelDuctOrientation=ductFields.orientation.value;n.dataset.panelDuctCover=ductFields.cover.value;n.dataset.positionLocked=String(Boolean(ductFields.lock?.checked));renderDuct(n);refreshDuctFusion();hooks()?.redraw?.()}
    else if(isComb(n)){n.dataset.combModules=combFields.modules.value;renderComb(n);hooks()?.redraw?.()}
    else if(n.dataset.commandCabinet==='true'){n.dataset.cabinetWidthMm=cabFields.width.value;n.dataset.cabinetHeightMm=cabFields.height.value;n.dataset.cabinetDepthMm=cabFields.depth.value;n.dataset.positionLocked=String(Boolean(cabFields.lock?.checked));renderCommandCabinet(n);hooks()?.redraw?.()}
    else if(n.dataset.type===TYPE_RES){n.dataset.residPanelWidthMm=resFields.width.value;n.dataset.residPanelHeightMm=resFields.height.value;n.dataset.residPanelDepthMm=resFields.depth.value;n.dataset.positionLocked=String(Boolean(resFields.lock?.checked));renderResidentialPanel(n);hooks()?.redraw?.()}
    setTimeout(refreshPanelSection,0);
  });
}
function refreshPanelSection(){
  ensurePanelSection();refreshDuctFusion();if(!panelSection)return;
  const n=selected(),isD=n?.dataset.type===TYPE_DUCT,isC=isComb(n),isR=n?.dataset.type===TYPE_RAIL,isCab=n?.dataset.commandCabinet==='true',isRes=n?.dataset.type===TYPE_RES;if(n?.dataset?.componentId)panelSection.dataset.panelBuilderTargetId=n.dataset.componentId;
  panelSection.hidden=!(isD||isC||isR||isCab||isRes);
  panelSection.querySelector('[data-pb-duct]').hidden=!isD;panelSection.querySelector('[data-pb-comb]').hidden=!isC;panelSection.querySelector('[data-pb-rail]').hidden=!isR;panelSection.querySelector('[data-pb-cab]').hidden=!isCab;panelSection.querySelector('[data-pb-res]').hidden=!isRes;
  if(isD){const s=ductSettings(n),o=occupancy(n);ductFields.length.value=s.length;ductFields.width.value=s.width;ductFields.height.value=s.height;ductFields.orientation.value=s.orientation;ductFields.cover.value=s.cover;if(ductFields.lock)ductFields.lock.checked=n.dataset.positionLocked==='true';ductFields.occ.textContent=`${o.count} fio(s) detectado(s) • ocupação estimada ${o.pct.toFixed(1)}% • tampa ${s.cover==='closed'?'fechada':'aberta'} • ${n.dataset.positionLocked==='true'?'🔒 posição bloqueada':'posição livre'}.`}
  if(isC){const poles=num((n.dataset.type.match(/([123])p$/)||[])[1],1);combFields.modules.step=String(poles);combFields.modules.min=String(poles);combFields.modules.value=String(combModules(n))}
  if(isCab){const s=cabinetSettings(n);cabFields.width.value=String(s.width);cabFields.height.value=String(s.height);cabFields.depth.value=String(s.depth);if(cabFields.lock)cabFields.lock.checked=n.dataset.positionLocked==='true';cabFields.info.textContent=`Calibração DIN: ${s.width} × ${s.height} × ${s.depth} mm • referência visual baseada em disjuntores reais de 85–89 mm. ${n.dataset.positionLocked==='true'?'🔒 Posição bloqueada.':'Posição livre.'} A porta acompanha praticamente toda a frente do gabinete.`}
  if(isRes){const s=residentialPanelSettings(n);resFields.width.value=String(s.width);resFields.height.value=String(s.height);resFields.depth.value=String(s.depth);if(resFields.lock)resFields.lock.checked=n.dataset.positionLocked==='true';resFields.info.textContent=`Calibração DIN: ${s.width} × ${s.height} × ${s.depth} mm • ${s.rows} fileira(s) DIN automáticas. ${n.dataset.positionLocked==='true'?'🔒 Posição bloqueada.':'Posição livre.'}`}
}
function init(){ensurePanelSection();placed().forEach(initializeNode);refreshDuctFusion();const sh=sheet();if(sh)new MutationObserver(records=>{let sel=false;records.forEach(r=>{if(r.type==='childList')r.addedNodes.forEach(n=>{if(n instanceof HTMLElement){if(n.matches?.('.placed-component'))initializeNode(n);n.querySelectorAll?.('.placed-component').forEach(initializeNode)}});if(r.type==='attributes'&&(r.attributeName==='class'||r.attributeName==='style'||r.attributeName?.startsWith?.('data-')))sel=true});if(sel)requestAnimationFrame(refreshPanelSection)}).observe(sh,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style','data-panel-duct-length-mm','data-panel-duct-width-mm','data-panel-duct-height-mm','data-panel-duct-orientation','data-panel-duct-cover','data-comb-modules','data-cabinet-width-mm','data-cabinet-height-mm','data-cabinet-depth-mm','data-resid-panel-width-mm','data-resid-panel-height-mm','data-resid-panel-depth-mm']});document.addEventListener('click',()=>setTimeout(refreshPanelSection,0),true);refreshPanelSection()}
window.TechRibPanelBuilderV1={snapMovedComponents,renderDuct,renderComb,renderRail,renderCommandCabinet,renderResidentialPanel,organizeDuct,occupancy,combElectricalPairs,refreshDuctFusion,refresh:()=>{placed().forEach(initializeNode);refreshDuctFusion();refreshPanelSection()}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,0));else setTimeout(init,0);
})();
