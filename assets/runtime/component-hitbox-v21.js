(function(global){
  'use strict';

  const SVG_NS='http://www.w3.org/2000/svg';
  const VERSION='21.0.0';
  const HITBOX_ATTR='data-component-selection-hitbox';
  const HITBOX_SELECTOR='[data-component-selection-hitbox="true"]';
  const EXPLICIT_SELECTION='[data-selection-hitbox="true"],[data-selection-hitbox-source="true"],[data-component-body],[data-physical-body]';
  const EXPLICIT_WIRE='[data-wire-obstacle="true"],[data-physical-body],[data-component-body]';
  const GRAPHICS='path,rect,circle,ellipse,line,polyline,polygon,text,image,use';
  const NON_RENDERED_ANCESTORS=new Set(['defs','clipPath','mask','marker','pattern','symbol','metadata','title','desc','style','script']);

  const finite=n=>Number.isFinite(Number(n));
  const num=(value,fallback=0)=>finite(value)?Number(value):fallback;
  const transparentColor=value=>{
    const v=String(value||'').trim().toLowerCase();
    if(!v||v==='none'||v==='transparent')return true;
    const rgba=v.match(/^rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)$/);
    if(rgba&&Number(rgba[1])<=.001)return true;
    return false;
  };
  const ancestorHidden=(element,root)=>{
    for(let node=element;node&&node!==root;node=node.parentElement){
      if(NON_RENDERED_ANCESTORS.has(node.tagName))return true;
      const style=global.getComputedStyle?.(node);
      if(style&&(style.display==='none'||style.visibility==='hidden'||num(style.opacity,1)<=.001))return true;
    }
    return false;
  };
  const elementPainted=(element,root)=>{
    if(!element||ancestorHidden(element,root))return false;
    const style=global.getComputedStyle?.(element);
    if(!style)return true;
    if(style.display==='none'||style.visibility==='hidden'||num(style.opacity,1)<=.001)return false;
    const tag=String(element.tagName||'').toLowerCase();
    if(tag==='image'||tag==='use')return true;
    const fillVisible=!transparentColor(style.fill);
    const strokeVisible=!transparentColor(style.stroke)&&num(style.strokeWidth,0)>0;
    if(tag==='line'||tag==='polyline')return strokeVisible;
    return fillVisible||strokeVisible;
  };
  const boxCorners=(element,svg)=>{
    try{
      const box=element.getBBox?.();
      if(!box||box.width<0||box.height<0)return null;
      if(typeof global.DOMPoint==='undefined')return{x1:box.x,y1:box.y,x2:box.x+box.width,y2:box.y+box.height};
      const elementCTM=element.getScreenCTM?.(),svgCTM=svg.getScreenCTM?.();
      if(!elementCTM||!svgCTM)return{x1:box.x,y1:box.y,x2:box.x+box.width,y2:box.y+box.height};
      const inverse=svgCTM.inverse();
      const points=[[box.x,box.y],[box.x+box.width,box.y],[box.x+box.width,box.y+box.height],[box.x,box.y+box.height]]
        .map(([x,y])=>new global.DOMPoint(x,y).matrixTransform(elementCTM).matrixTransform(inverse));
      const xs=points.map(p=>p.x),ys=points.map(p=>p.y);
      return{x1:Math.min(...xs),y1:Math.min(...ys),x2:Math.max(...xs),y2:Math.max(...ys)};
    }catch{return null}
  };
  const mergeBounds=(a,b)=>!a?b:!b?a:{x1:Math.min(a.x1,b.x1),y1:Math.min(a.y1,b.y1),x2:Math.max(a.x2,b.x2),y2:Math.max(a.y2,b.y2)};
  const explicitBounds=(svg,selector)=>{
    const source=svg.querySelector?.(selector);
    if(!source)return null;
    const bounds=boxCorners(source,svg);
    return bounds&&bounds.x2>bounds.x1&&bounds.y2>bounds.y1?{...bounds,source,mode:'explicit'}:null;
  };
  const paintedBounds=svg=>{
    let merged=null,count=0;
    svg.querySelectorAll?.(GRAPHICS).forEach(element=>{
      if(element.matches?.(HITBOX_SELECTOR)||!elementPainted(element,svg))return;
      const bounds=boxCorners(element,svg);
      if(!bounds||bounds.x2<=bounds.x1||bounds.y2<=bounds.y1)return;
      merged=mergeBounds(merged,bounds);count++;
    });
    if(merged)return{...merged,source:svg,mode:'painted',count};
    try{
      const box=svg.getBBox?.();
      if(box&&box.width>0&&box.height>0)return{x1:box.x,y1:box.y,x2:box.x+box.width,y2:box.y+box.height,source:svg,mode:'svg-fallback',count:0};
    }catch{}
    return null;
  };
  const svgOf=node=>node?.querySelector?.(':scope > svg')||node?.querySelector?.('svg')||null;
  const localBounds=(node,purpose='selection')=>{
    const svg=svgOf(node);if(!svg)return null;
    const selector=purpose==='wire'?EXPLICIT_WIRE:EXPLICIT_SELECTION;
    return explicitBounds(svg,selector)||paintedBounds(svg);
  };
  const insertBehindGraphics=(svg,rect)=>{
    const children=[...svg.children];
    const firstGraphic=children.find(child=>!NON_RENDERED_ANCESTORS.has(child.tagName));
    if(firstGraphic)svg.insertBefore(rect,firstGraphic);else svg.appendChild(rect);
  };
  const remove=node=>{const svg=svgOf(node);svg?.querySelector?.(HITBOX_SELECTOR)?.remove();if(node?.dataset){delete node.dataset.techribHitbox;delete node.dataset.techribHitboxBounds;delete node.dataset.techribHitboxMode}};
  const prepare=(node,{padding=null}={})=>{
    if(!node)return null;
    if(node.dataset?.type==='canaleta-ranhurada-painel'){
      const svg=svgOf(node);
      svg?.querySelector?.(HITBOX_SELECTOR)?.remove();
      node.dataset.hitboxMode='wrapper';
      node.dataset.techribHitbox='wrapper-only';
      node.dataset.techribHitboxMode='wrapper';
      delete node.dataset.techribHitboxBounds;
      return{rect:null,bounds:null,mode:'wrapper',count:0};
    }
    if(node.dataset?.hitboxMode==='wrapper')return null;
    const svg=svgOf(node);if(!svg)return null;
    svg.querySelector?.(HITBOX_SELECTOR)?.remove();
    const bounds=localBounds(node,'selection');if(!bounds)return null;
    const requested=padding??node.dataset?.selectionHitboxPadding??svg.dataset?.selectionHitboxPadding??0;
    const pad=Math.max(0,num(requested,0));
    const x1=bounds.x1-pad,y1=bounds.y1-pad,x2=bounds.x2+pad,y2=bounds.y2+pad;
    if(!(x2>x1&&y2>y1))return null;
    const rect=global.document.createElementNS(SVG_NS,'rect');
    rect.setAttribute(HITBOX_ATTR,'true');rect.setAttribute('class','component-selection-hitbox');
    rect.setAttribute('x',String(x1));rect.setAttribute('y',String(y1));rect.setAttribute('width',String(x2-x1));rect.setAttribute('height',String(y2-y1));
    rect.setAttribute('fill','rgba(0,0,0,0.001)');rect.setAttribute('stroke','none');rect.setAttribute('vector-effect','non-scaling-stroke');
    rect.dataset.hitboxMode=bounds.mode||'unknown';rect.dataset.hitboxVersion=VERSION;
    insertBehindGraphics(svg,rect);
    node.dataset.techribHitbox='universal-v1';node.dataset.techribHitboxMode=bounds.mode||'unknown';
    node.dataset.techribHitboxBounds=JSON.stringify({x1,y1,x2,y2});
    return{rect,bounds:{x1,y1,x2,y2},mode:bounds.mode,count:bounds.count||0};
  };
  const sourceForWire=node=>{
    const svg=svgOf(node);if(!svg)return null;
    return svg.querySelector?.(EXPLICIT_WIRE)||svg.querySelector?.(HITBOX_SELECTOR)||svg;
  };
  const sourceForSelection=node=>{
    const svg=svgOf(node);if(!svg)return null;
    return svg.querySelector?.(HITBOX_SELECTOR)||svg.querySelector?.(EXPLICIT_SELECTION)||svg;
  };
  const debug=(node,on=true)=>{if(node?.dataset)node.dataset.techribHitboxDebug=on?'true':'false'};

  global.TechRibComponentHitboxRuntime={VERSION,HITBOX_SELECTOR,prepare,refresh:prepare,remove,localBounds,sourceForWire,sourceForSelection,debug};
})(typeof window!=='undefined'?window:globalThis);
