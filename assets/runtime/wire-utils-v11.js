(function(root){
  'use strict';
  const snapPoint=(x,y,step=5)=>({x:Math.round(x/step)*step,y:Math.round(y/step)*step});
  const pathData=points=>{points=points.filter((p,i)=>!i||p.x!==points[i-1].x||p.y!==points[i-1].y);if(points.length<2)return'';const WIRE_CORNER_RADIUS=6;let d=`M ${points[0].x} ${points[0].y}`;for(let i=1;i<points.length-1;i++){const prev=points[i-1],corner=points[i],next=points[i+1],before=Math.abs(corner.x-prev.x)+Math.abs(corner.y-prev.y),after=Math.abs(next.x-corner.x)+Math.abs(next.y-corner.y),radius=Math.min(WIRE_CORNER_RADIUS,before/2,after/2),inPoint={x:corner.x+(prev.x-corner.x)*radius/before,y:corner.y+(prev.y-corner.y)*radius/before},outPoint={x:corner.x+(next.x-corner.x)*radius/after,y:corner.y+(next.y-corner.y)*radius/after};d+=` L ${inPoint.x} ${inPoint.y} Q ${corner.x} ${corner.y} ${outPoint.x} ${outPoint.y}`}const last=points.at(-1);return`${d} L ${last.x} ${last.y}`};
  const conduitWidthPixels=diameter=>Math.max(18,Math.min(56,Number(diameter||20)*1.08));
  const conduitMaterialLabel=material=>material==='galvanizado'?'Galvanizado':material==='pvc-rigido'?'PVC rígido':'PVC corrugado';
  const conduitPointDistance=(point,a,b)=>{const dx=b.x-a.x,dy=b.y-a.y,len2=dx*dx+dy*dy;if(!len2)return Math.hypot(point.x-a.x,point.y-a.y);const t=Math.max(0,Math.min(1,((point.x-a.x)*dx+(point.y-a.y)*dy)/len2));return Math.hypot(point.x-(a.x+t*dx),point.y-(a.y+t*dy))};
  const segmentAxisInfo=(a,b)=>Math.abs(b.x-a.x)>=Math.abs(b.y-a.y)?{axis:'h',fixed:(a.y+b.y)/2,min:Math.min(a.x,b.x),max:Math.max(a.x,b.x)}:{axis:'v',fixed:(a.x+b.x)/2,min:Math.min(a.y,b.y),max:Math.max(a.y,b.y)};
  const segmentIntersection=(a,b,c,d)=>{const r={x:b.x-a.x,y:b.y-a.y},q={x:d.x-c.x,y:d.y-c.y},den=r.x*q.y-r.y*q.x;if(Math.abs(den)<.0001)return null;const ca={x:c.x-a.x,y:c.y-a.y},t=(ca.x*q.y-ca.y*q.x)/den,u=(ca.x*r.y-ca.y*r.x)/den;if(t<=.04||t>=.96||u<=.04||u>=.96)return null;return{x:a.x+t*r.x,y:a.y+t*r.y,t,u}};
  const routeLength=points=>points.slice(1).reduce((sum,p,i)=>sum+Math.abs(p.x-points[i].x)+Math.abs(p.y-points[i].y),0);
  const routeBends=points=>Math.max(0,points.length-2);
  const pointInsideRect=(p,r)=>p.x>r.x1+.1&&p.x<r.x2-.1&&p.y>r.y1+.1&&p.y<r.y2-.1;
  const segmentOverlapLength=(a,b,c,d)=>{if(a.y===b.y&&c.y===d.y&&Math.abs(a.y-c.y)<1)return Math.max(0,Math.min(Math.max(a.x,b.x),Math.max(c.x,d.x))-Math.max(Math.min(a.x,b.x),Math.min(c.x,d.x)));if(a.x===b.x&&c.x===d.x&&Math.abs(a.x-c.x)<1)return Math.max(0,Math.min(Math.max(a.y,b.y),Math.max(c.y,d.y))-Math.max(Math.min(a.y,b.y),Math.min(c.y,d.y)));return 0};
  root.TechRibWireUtils=Object.freeze({snapPoint,pathData,conduitWidthPixels,conduitMaterialLabel,conduitPointDistance,segmentAxisInfo,segmentIntersection,routeLength,routeBends,pointInsideRect,segmentOverlapLength});
})(typeof window!=='undefined'?window:globalThis);
