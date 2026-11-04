(function(root){
  'use strict';

  const VERSION=27;
  const DEFAULT_IGNORE_SELECTOR='[data-terminal],[data-push-cap],[data-emergency-cap],[data-breaker-toggle],[data-signal-lens],[data-selector-knob],[data-toggle-lever],[data-contact-actuator],[data-thermal-reset],[data-sensor-actuator],[data-generic-actuator],[data-elevator-call],[data-soft-prg-button],[data-soft-esc-button],[data-soft-up-button],[data-soft-down-button],[data-soft-start-button],[data-soft-stop-button],[data-soft-reset-button],[data-soft-pot]';

  const number=value=>{const parsed=parseFloat(String(value??''));return Number.isFinite(parsed)?parsed:0};
  const intersects=(a,b)=>a.x1<=b.x2&&a.x2>=b.x1&&a.y1<=b.y2&&a.y2>=b.y1;

  function create(options={}){
    const sheet=options.sheet;
    const rootDocument=options.root||root.document;
    const getActiveTool=typeof options.getActiveTool==='function'?options.getActiveTool:()=>String(options.activeTool||'select');
    const canEdit=typeof options.canEdit==='function'?options.canEdit:()=>true;
    const notify=typeof options.notify==='function'?options.notify:()=>{};
    const refreshPropertiesPanel=typeof options.refreshPropertiesPanel==='function'?options.refreshPropertiesPanel:()=>{};
    const onPrimaryChange=typeof options.onPrimaryChange==='function'?options.onPrimaryChange:()=>{};
    const onSelectionChange=typeof options.onSelectionChange==='function'?options.onSelectionChange:()=>{};
    const redrawWires=typeof options.redrawWires==='function'?options.redrawWires:()=>{};
    const getWires=typeof options.getWires==='function'?options.getWires:()=>[];
    const endpointComponent=typeof options.endpointComponent==='function'?options.endpointComponent:endpoint=>endpoint?.el?.closest?.('.placed-component')||null;
    const rerouteWire=typeof options.rerouteWire==='function'?options.rerouteWire:()=>{};
    const componentObstacleRect=typeof options.componentObstacleRect==='function'?options.componentObstacleRect:node=>({x1:number(node?.style?.left),y1:number(node?.style?.top),x2:number(node?.style?.left)+(node?.offsetWidth||0),y2:number(node?.style?.top)+(node?.offsetHeight||0)});
    const wirePolylinePoints=typeof options.wirePolylinePoints==='function'?options.wirePolylinePoints:()=>[];
    const segmentHitsRect=typeof options.segmentHitsRect==='function'?options.segmentHitsRect:()=>false;
    const historyCapture=typeof options.historyCapture==='function'?options.historyCapture:()=>{};
    const scheduleAutosave=typeof options.scheduleAutosave==='function'?options.scheduleAutosave:()=>{};
    const getZoomScale=typeof options.getZoomScale==='function'?options.getZoomScale:()=>1;
    const sheetPointFromEvent=typeof options.sheetPointFromEvent==='function'?options.sheetPointFromEvent:event=>({x:event.clientX,y:event.clientY});
    const snapGrid=Math.max(1,Number(options.snapGrid)||10);
    const wireLaneGap=Math.max(1,Number(options.wireLaneGap)||10);
    const ignoreSelector=options.ignoreSelector||DEFAULT_IGNORE_SELECTOR;
    const shouldAffectWiring=typeof options.shouldAffectWiring==='function'?options.shouldAffectWiring:()=>true;
    let primary=null;
    let marqueeBound=false;
    const moveBound=new WeakSet();

    const allComponents=()=>sheet?[...sheet.querySelectorAll('.placed-component')]:[];
    const selectedComponents=()=>sheet?[...sheet.querySelectorAll('.placed-component.selected,.placed-component.multi-selected')]:[];
    const isSelected=node=>Boolean(node&&(node.classList?.contains('selected')||node.classList?.contains('multi-selected')));

    const updateSelectionTools=()=>{
      const total=selectedComponents().length;
      rootDocument?.querySelectorAll?.('[data-action="rotate"]').forEach(button=>button.disabled=total<1);
      rootDocument?.querySelectorAll?.('[data-action="align"]').forEach(button=>button.disabled=total<2);
      rootDocument?.querySelectorAll?.('[data-action="distribute"]').forEach(button=>button.disabled=total<3);
      return total;
    };

    const normalizeSelection=()=>{
      const nodes=selectedComponents().filter(node=>node?.isConnected!==false);
      if(primary&&!nodes.includes(primary))primary=null;
      if(!primary)primary=nodes[0]||null;
      nodes.forEach(node=>{
        node.classList.toggle('selected',node===primary);
        node.classList.toggle('multi-selected',node!==primary);
      });
      onPrimaryChange(primary);
      updateSelectionTools();
      refreshPropertiesPanel();
      onSelectionChange(nodes.slice(),primary);
      return nodes;
    };

    const setSelection=(nodes=[],primaryNode=null)=>{
      const allowed=new Set((Array.isArray(nodes)?nodes:[]).filter(Boolean));
      allComponents().forEach(node=>node.classList.remove('selected','multi-selected'));
      const ordered=[...allowed];
      primary=primaryNode&&allowed.has(primaryNode)?primaryNode:(ordered[0]||null);
      ordered.forEach(node=>node.classList.add(node===primary?'selected':'multi-selected'));
      return normalizeSelection();
    };

    const select=(node,add=false)=>{
      if(!node){if(!add)setSelection([]);return primary}
      if(!add){setSelection([node],node);return primary}
      const current=selectedComponents();
      const set=new Set(current);
      if(set.has(node))set.delete(node);else set.add(node);
      let nextPrimary=primary;
      if(node===primary&&!set.has(node))nextPrimary=[...set][0]||null;
      setSelection([...set],nextPrimary);
      return primary;
    };

    const adoptDomSelection=primaryNode=>{
      primary=primaryNode||selectedComponents().find(node=>node.classList.contains('selected'))||selectedComponents()[0]||null;
      return normalizeSelection();
    };

    const connectedWiresFor=targets=>{
      const set=targets instanceof Set?targets:new Set(targets||[]);
      return getWires().filter(wire=>set.has(endpointComponent(wire.from))||set.has(endpointComponent(wire.to)));
    };

    const rerouteTargets=(targets,{raf=true}={})=>{
      const affected=connectedWiresFor(targets);
      affected.forEach(rerouteWire);
      redrawWires();
      if(raf&&typeof root.requestAnimationFrame==='function')root.requestAnimationFrame(redrawWires);
      return affected;
    };

    const componentRectInSheet=node=>{
      const scale=Math.max(.001,Number(getZoomScale())||1);
      if(node?.getBoundingClientRect&&sheet?.getBoundingClientRect){
        const rect=node.getBoundingClientRect(),sheetRect=sheet.getBoundingClientRect();
        return{x1:(rect.left-sheetRect.left)/scale,y1:(rect.top-sheetRect.top)/scale,x2:(rect.right-sheetRect.left)/scale,y2:(rect.bottom-sheetRect.top)/scale};
      }
      const x=number(node?.style?.left),y=number(node?.style?.top);
      return{x1:x,y1:y,x2:x+(node?.offsetWidth||0),y2:y+(node?.offsetHeight||0)};
    };

    const bindMarquee=()=>{
      if(marqueeBound||!sheet?.addEventListener)return false;
      marqueeBound=true;
      sheet.addEventListener('pointerdown',event=>{
        if(event.button!==0||event.target!==sheet||getActiveTool()!=='select'||!canEdit())return;
        const pointerId=event.pointerId,start=sheetPointFromEvent(event),additive=event.ctrlKey||event.metaKey||event.shiftKey;
        let moved=false;
        const box=rootDocument.createElement('div');
        box.className='component-selection-marquee';
        box.hidden=true;
        sheet.appendChild(box);
        const draw=current=>{
          const x=Math.min(start.x,current.x),y=Math.min(start.y,current.y),w=Math.abs(current.x-start.x),h=Math.abs(current.y-start.y);
          box.style.left=`${x}px`;box.style.top=`${y}px`;box.style.width=`${w}px`;box.style.height=`${h}px`;box.hidden=false;
        };
        const move=e=>{
          if(e.pointerId!==pointerId)return;
          const current=sheetPointFromEvent(e);
          if(Math.hypot(current.x-start.x,current.y-start.y)>=4)moved=true;
          if(moved){e.preventDefault();draw(current)}
        };
        const finish=e=>{
          if(e.pointerId!==pointerId)return;
          root.removeEventListener('pointermove',move,true);root.removeEventListener('pointerup',finish,true);root.removeEventListener('pointercancel',cancel,true);
          const current=sheetPointFromEvent(e);box.remove();
          if(!moved){if(!additive)setSelection([]);return}
          const area={x1:Math.min(start.x,current.x),y1:Math.min(start.y,current.y),x2:Math.max(start.x,current.x),y2:Math.max(start.y,current.y)};
          const hits=allComponents().filter(node=>node.dataset?.type!=='functional-area-object'&&intersects(componentRectInSheet(node),area));
          if(additive){const combined=new Set(selectedComponents());hits.forEach(node=>combined.add(node));setSelection([...combined],primary||hits[0]||null)}else setSelection(hits,hits[0]||null);
        };
        const cancel=e=>{if(e.pointerId!==pointerId)return;root.removeEventListener('pointermove',move,true);root.removeEventListener('pointerup',finish,true);root.removeEventListener('pointercancel',cancel,true);box.remove()};
        root.addEventListener('pointermove',move,true);root.addEventListener('pointerup',finish,true);root.addEventListener('pointercancel',cancel,true);
      });
      return true;
    };

    const enableMove=node=>{
      if(!node?.addEventListener||moveBound.has(node))return node;
      moveBound.add(node);
      node.addEventListener('pointerdown',event=>{
        if(event.button!==0||event.target?.closest?.(ignoreSelector))return;
        if(!canEdit())return;
        event.preventDefault();
        const additive=event.ctrlKey||event.metaKey||event.shiftKey;
        const alreadySelected=isSelected(node);
        let toggleOnClick=false;
        if(!alreadySelected)select(node,additive);
        else if(additive)toggleOnClick=true;
        else if(selectedComponents().length===1&&primary!==node)setSelection([node],node);
        const positionLocked=item=>item?.dataset?.positionLocked==='true'||item?.classList?.contains('position-locked');
        if(positionLocked(node)){
          event.stopPropagation();
          notify(node.dataset.type==='functional-area-object'?'Área funcional bloqueada. Use Editar ou o menu de contexto para desbloquear.':node.dataset.commandCabinet==='true'||node.dataset.type==='resid-quadro-din'?'Quadro bloqueado. Desmarque “Bloquear posição do quadro” nas Propriedades para mover.':'Componente bloqueado.');
          return;
        }
        const targets=(isSelected(node)?selectedComponents():[node]).filter(item=>!positionLocked(item));
        if(!targets.length)return;
        const targetSet=new Set(targets);
        let previousRoutes=null;
        const rerouteAfterMove=(wire,final=false)=>{const saved=previousRoutes?.get(wire);return rerouteWire(wire,{componentMove:true,final,movedComponents:targetSet,previousPoints:saved?.points,fixedPoints:saved?.fixed,manualPoints:saved?.manual})};
        const starts=targets.map(item=>({node:item,left:number(item.style.left)||item.offsetLeft||0,top:number(item.style.top)||item.offsetTop||0,obstacle:shouldAffectWiring(item)?componentObstacleRect(item):null}));
        const influences=starts.filter(item=>item.obstacle).map(item=>({x1:item.obstacle.x1-wireLaneGap*3,y1:item.obstacle.y1-wireLaneGap*3,x2:item.obstacle.x2+wireLaneGap*3,y2:item.obstacle.y2+wireLaneGap*3}));
        const pointerId=event.pointerId,startX=event.clientX,startY=event.clientY,scale=Math.max(.001,Number(getZoomScale())||1);
        let ended=false,rerouteFrame=0,moved=false,lastDx=0,lastDy=0;
        const cleanup=()=>{root.removeEventListener('pointermove',move,true);root.removeEventListener('pointerup',up,true);root.removeEventListener('pointercancel',cancel,true)};
        const renderMove=(dx,dy)=>{
          if(!previousRoutes)previousRoutes=new Map(getWires().map(wire=>[wire,{points:wirePolylinePoints(wire).map(point=>({x:point.x,y:point.y})),fixed:(wire.routeLocked?wire.waypoints:wire.waypoints.filter(point=>point.manual)).map(point=>({x:point.x,y:point.y})),manual:wire.waypoints.filter(point=>point.manual).map(point=>({x:point.x,y:point.y}))}]));
          starts.forEach(item=>{item.node.style.left=`${item.left+dx}px`;item.node.style.top=`${item.top+dy}px`});
          if(!rerouteFrame&&typeof root.requestAnimationFrame==='function')rerouteFrame=root.requestAnimationFrame(()=>{rerouteFrame=0;connectedWiresFor(targetSet).forEach(wire=>rerouteAfterMove(wire,false));redrawWires()});
          else if(typeof root.requestAnimationFrame!=='function'){connectedWiresFor(targetSet).forEach(wire=>rerouteAfterMove(wire,false));redrawWires()}
        };
        const move=e=>{
          if(ended||e.pointerId!==pointerId)return;
          e.preventDefault();
          const dx=Math.round(((e.clientX-startX)/scale)/snapGrid)*snapGrid,dy=Math.round(((e.clientY-startY)/scale)/snapGrid)*snapGrid;
          if(dx===lastDx&&dy===lastDy)return;
          lastDx=dx;lastDy=dy;moved=moved||dx!==0||dy!==0;renderMove(dx,dy);
        };
        const finish=e=>{
          if(ended||e.pointerId!==pointerId)return;
          ended=true;cleanup();
          if(rerouteFrame&&typeof root.cancelAnimationFrame==='function'){root.cancelAnimationFrame(rerouteFrame);rerouteFrame=0}
          if(!moved){if(toggleOnClick)select(node,true);return}
          try{window.TechRibPanelBuilderV1?.snapMovedComponents?.(targets)}catch(error){console.warn('TechRib Panel Builder: snap indisponível',error)}
          const movedObstacles=starts.filter(item=>shouldAffectWiring(item.node)).map(item=>componentObstacleRect(item.node));
          const affected=getWires().filter(wire=>{
            if(targetSet.has(endpointComponent(wire.from))||targetSet.has(endpointComponent(wire.to)))return true;
            const points=wirePolylinePoints(wire);
            for(let i=1;i<points.length;i++){
              if(movedObstacles.some(rect=>segmentHitsRect(points[i-1],points[i],rect)))return true;
              if(influences.some(rect=>segmentHitsRect(points[i-1],points[i],rect)))return true;
            }
            return false;
          });
          affected.forEach(wire=>rerouteAfterMove(wire,true));redrawWires();if(typeof root.requestAnimationFrame==='function')root.requestAnimationFrame(redrawWires);
          historyCapture();scheduleAutosave();
        };
        const up=e=>finish(e),cancel=e=>finish(e);
        root.addEventListener('pointermove',move,true);root.addEventListener('pointerup',up,true);root.addEventListener('pointercancel',cancel,true);
      });
      return node;
    };

    const applyComponentTransform=node=>{
      if(!node)return;
      const angle=Number(node.dataset.rotation||0),mirrored=node.dataset.mirrored==='true';
      node.style.transform=`rotate(${angle}deg) scaleX(${mirrored?-1:1})`;
    };

    const rotateSelection=()=>{
      if(!canEdit())return false;
      const targets=selectedComponents().filter(node=>node.dataset?.type!=='functional-area-object');if(!targets.length){notify('Áreas funcionais são redimensionadas pela alça');return false}
      targets.forEach(node=>{node.dataset.rotation=String((Number(node.dataset.rotation||0)+90)%360);applyComponentTransform(node)});
      rerouteTargets(targets);historyCapture();scheduleAutosave();notify(targets.length>1?`${targets.length} componentes girados 90°`:'Componente girado 90°');return true;
    };

    const mirrorSelection=()=>{
      if(!canEdit())return false;
      const targets=selectedComponents().filter(node=>node.dataset?.type!=='functional-area-object');if(!targets.length){notify('Áreas funcionais não são espelhadas');return false}
      targets.forEach(node=>{node.dataset.mirrored=String(node.dataset.mirrored!=='true');applyComponentTransform(node)});
      rerouteTargets(targets);historyCapture();scheduleAutosave();notify(targets.length>1?`${targets.length} componentes espelhados`:'Componente espelhado horizontalmente');return true;
    };

    const alignSelection=mode=>{
      if(!canEdit())return false;
      const targets=selectedComponents();if(targets.length<2){notify('Selecione dois ou mais componentes');return false}
      const boxes=targets.map(node=>({node,left:number(node.style.left),top:number(node.style.top),width:node.offsetWidth||0,height:node.offsetHeight||0}));
      if(mode==='left'){const v=Math.min(...boxes.map(b=>b.left));boxes.forEach(b=>b.node.style.left=`${v}px`)}
      if(mode==='right'){const v=Math.max(...boxes.map(b=>b.left+b.width));boxes.forEach(b=>b.node.style.left=`${v-b.width}px`)}
      if(mode==='top'){const v=Math.min(...boxes.map(b=>b.top));boxes.forEach(b=>b.node.style.top=`${v}px`)}
      if(mode==='bottom'){const v=Math.max(...boxes.map(b=>b.top+b.height));boxes.forEach(b=>b.node.style.top=`${v-b.height}px`)}
      if(mode==='center-x'){const v=boxes.reduce((sum,b)=>sum+b.left+b.width/2,0)/boxes.length;boxes.forEach(b=>b.node.style.left=`${Math.round(v-b.width/2)}px`)}
      if(mode==='center-y'){const v=boxes.reduce((sum,b)=>sum+b.top+b.height/2,0)/boxes.length;boxes.forEach(b=>b.node.style.top=`${Math.round(v-b.height/2)}px`)}
      rerouteTargets(targets);historyCapture();scheduleAutosave();notify('Componentes alinhados');return true;
    };

    const distributeSelection=axis=>{
      if(!canEdit())return false;
      const targets=selectedComponents();if(targets.length<3){notify('Selecione três ou mais componentes');return false}
      const horizontal=axis==='horizontal';
      const items=targets.map(node=>({node,pos:number(horizontal?node.style.left:node.style.top),size:horizontal?(node.offsetWidth||0):(node.offsetHeight||0)})).sort((a,b)=>a.pos-b.pos);
      const start=items[0].pos,end=items.at(-1).pos+items.at(-1).size,total=items.reduce((sum,item)=>sum+item.size,0),gap=Math.max(10,(end-start-total)/(items.length-1));
      let cursor=start;items.forEach(item=>{if(horizontal)item.node.style.left=`${Math.round(cursor)}px`;else item.node.style.top=`${Math.round(cursor)}px`;cursor+=item.size+gap});
      rerouteTargets(targets);historyCapture();scheduleAutosave();notify('Componentes distribuídos');return true;
    };

    bindMarquee();
    updateSelectionTools();

    return Object.freeze({
      version:VERSION,capabilities:Object.freeze({singleSelection:true,multiSelection:true,areaSelection:true,groupDrag:true,wireFollow:true,rotation:true,mirror:true,align:true,distribute:true}),
      selectedComponents,isSelected,select,setSelection,adoptDomSelection,updateSelectionTools,enableMove,applyComponentTransform,rotateSelection,mirrorSelection,alignSelection,distributeSelection,bindMarquee,getPrimary:()=>primary
    });
  }

  root.TechRibComponentInteractionRuntime=Object.freeze({VERSION,DEFAULT_IGNORE_SELECTOR,create});
})(typeof window!=='undefined'?window:globalThis);
