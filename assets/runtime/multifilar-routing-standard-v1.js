(function(root){
'use strict';
const VERSION=1;
const MARKER='TECHRIB_TMRS_AMBIGUOUS_PORT_SIDE_RESCUE_V353K_M';
const MAX_DETOUR_RATIO=1.85;
const ENDPOINT_TOLERANCE=3;
const REJECT_REASONS=Object.freeze(['NO_PLAN','NO_CORRIDOR','NO_CANDIDATE','ASTAR_FAILED','DETOUR_LIMIT','BOUNDING_REGION','COMPONENT_INTERSECTION','WIRE_OVERLAP','NON_ORTHOGONAL','NON_ORTHOGONAL_FINAL','ENDPOINT_MISMATCH','ROUTE_METRIC_INVALID','FINAL_VALIDATION_FAILED','UNSAFE_FALLBACK','NO_SAFE_EMERGENCY_ROUTE','CORRIDOR_CLASS_MISMATCH','ENDPOINT_ESCAPE_FAILED','ROUTE_COMMIT_BLOCKED','OTHER']);
const createDiagnostics=()=>({tmrsAttempted:0,tmrsAccepted:0,tmrsRejected:0,rejectReasons:Object.fromEntries(REJECT_REASONS.map(reason=>[reason,0])),rejectedWires:[],acceptedTmrsWires:[],fallbackWires:[],unsafeFallbackBlocked:0,safeEmergencyRoutes:0,routeMetricErrors:0,unresolvedSafeRoutes:0,rescueAttempts:0,rescueFailures:0,portGateUsed:0,rescueParallelRelaxed:0,rescueOwnObstacleRelaxed:0,denseRescueAttempts:0,denseRescueSuccesses:0,obstacleOnlyRescueAttempts:0,obstacleOnlyRescueSuccesses:0,softConflictCommitted:0,endpointSideRescueAttempts:0,endpointSideRescueSuccesses:0,endpointSideOverridesCommitted:0,endpointSideOverrideDetails:[],ambiguousPortSideRescue:true,sharedEndpointAStarSearch:true,endpointObstacleGateSearch:true,committedConflictRouting:true,sharedEndpointValidation:true,obstacleFirstCompletion:true});
const recordOutcome=(diagnostics,accepted,reason='OTHER',detail=null)=>{if(!diagnostics)return;diagnostics.tmrsAttempted++;if(accepted){diagnostics.tmrsAccepted++;if(detail)diagnostics.acceptedTmrsWires.push(detail);return}diagnostics.tmrsRejected++;const key=REJECT_REASONS.includes(reason)?reason:'OTHER';diagnostics.rejectReasons[key]=(diagnostics.rejectReasons[key]||0)+1;if(detail)diagnostics.rejectedWires.push({...detail,reason:key})};
const CLASS_PRIORITY=Object.freeze({PROTECTIVE_EARTH:70,NEUTRAL:65,POWER:60,CONTROL:50,COMMUNICATION:45,LOGIC:40,GENERIC:10});
const num=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
const pt=v=>({x:num(v?.x),y:num(v?.y)});
const same=(a,b)=>Math.abs(num(a?.x)-num(b?.x))<.01&&Math.abs(num(a?.y)-num(b?.y))<.01;
const within=(a,b,tolerance)=>Math.abs(num(a?.x)-num(b?.x))<=tolerance&&Math.abs(num(a?.y)-num(b?.y))<=tolerance;
const manhattan=(a,b)=>Math.abs(num(a?.x)-num(b?.x))+Math.abs(num(a?.y)-num(b?.y));
const snap=(value,grid)=>Math.round(num(value)/grid)*grid;
const compact=values=>{
  const out=[];
  (values||[]).map(pt).forEach(v=>{if(!out.length||!same(out.at(-1),v))out.push(v)});
  const between=(v,a,b)=>v>=Math.min(a,b)-.01&&v<=Math.max(a,b)+.01;
  for(let i=1;i<out.length-1;){const a=out[i-1],b=out[i],c=out[i+1],vertical=a.x===b.x&&b.x===c.x&&between(b.y,a.y,c.y),horizontal=a.y===b.y&&b.y===c.y&&between(b.x,a.x,c.x);if(vertical||horizontal)out.splice(i,1);else i++}
  return out;
};
function normalizeOrthogonalPoints(points,options={}){
  const values=(points||[]).map(pt);if(values.length<2)return values;const grid=Math.max(1,num(options.grid,5)),tolerance=Math.max(.1,num(options.tolerance,3)),lastIndex=values.length-1,out=[values[0]];
  for(let index=1;index<values.length;index++){const endpoint=index===lastIndex,q=endpoint?values[index]:{x:snap(values[index].x,grid),y:snap(values[index].y,grid)},previous=out.at(-1),dx=Math.abs(q.x-previous.x),dy=Math.abs(q.y-previous.y);if(dx>.01&&dy>.01){if(endpoint){if(dx<=tolerance)out.push({x:q.x,y:previous.y});else if(dy<=tolerance)out.push({x:previous.x,y:q.y})}else if(dx<=tolerance)q.x=previous.x;else if(dy<=tolerance)q.y=previous.y}out.push(q)}
  return compact(out);
}
const lower=v=>String(v??'').trim().toLowerCase();
const first=(wire,names)=>{
  for(const name of names){const v=wire?.[name];if(Array.isArray(v)){const x=v.find(item=>String(item??'').trim());if(x!==undefined)return String(x)}else if(String(v??'').trim())return String(v)}
  return '';
};
const special=v=>{
  const s=lower(v);if(!s)return'';
  if(/protective[\s_-]*earth|terra[\s_-]*prote|(^|[^a-z])pe([^a-z]|$)|green[\s_-]*yellow|verde[\s_-]*amarel/.test(s))return'PROTECTIVE_EARTH';
  if(/(^|[^a-z])neutral([^a-z]|$)|(^|[^a-z])neutro([^a-z]|$)|(^|[\s_-])n($|[\s_-])/.test(s))return'NEUTRAL';
  if(/communication|comunica|modbus|can[\s_-]*bus|ethernet|rs[\s_-]*485|rs[\s_-]*232|i2c|spi|uart/.test(s))return'COMMUNICATION';
  return'';
};
const broad=v=>{
  const s=lower(v);if(!s)return'';
  const specific=special(s);if(specific)return specific;
  if(/(^|[^a-z])(logic|gpio|signal|sinal|digital|analog)([^a-z]|$)|3v3|5vdc/.test(s))return'LOGIC';
  if(/control|comando|coil|bobina|relay|rel[eé]|contactor|contator|button|botoeira|sinaleiro|auxiliar/.test(s))return'CONTROL';
  if(/power|pot[eê]ncia|phase|fase|mains|motor|trif[aá]s|monof[aá]s|127v|220v|380v|(^|[^a-z])l[123]([^a-z]|$)/.test(s))return'POWER';
  return'';
};
function classifyWire(wire={},netFallback=''){
  const authoritative=[first(wire,['domain']),first(wire,['conductorRole','conductor_role'])];
  for(const value of authoritative){const result=special(value)||broad(value);if(result)return result}
  const semanticLabel=first(wire,['wireLabel','wire_label','label','identification']);
  const semanticSpecial=special(semanticLabel);if(semanticSpecial)return semanticSpecial;
  const profile=first(wire,['profile']);if(profile){const result=special(profile)||broad(profile);if(result)return result}
  const secondary=[first(wire,['voltageClass','voltage_class']),semanticLabel];
  for(const value of secondary){const result=special(value)||broad(value);if(result)return result}
  const fallback=special(netFallback)||broad(netFallback);if(fallback)return fallback;
  const color=lower(first(wire,['color']));
  if(/green.*yellow|yellow.*green|verde.*amarel/.test(color))return'PROTECTIVE_EARTH';
  if(/blue|azul/.test(color))return'NEUTRAL';
  if(/red|black|brown|vermelh|preto|marrom/.test(color))return'POWER';
  return'GENERIC';
}
const phaseOrder=wire=>{const m=lower(first(wire,['wireLabel','wire_label','label','identification','conductorRole','conductor_role'])).match(/(^|[^a-z0-9])l([123])([^a-z0-9]|$)/);return m?Number(m[2])-1:99};
const endpoint=(wire,side)=>{const e=wire?.[side]||{};return{type:String(e.type||'terminal'),point:pt(e.point||e),stub:pt(e.stub||e.point||e),junctionId:e.junctionId||e.junction_id||null,componentId:e.componentId||e.component_id||null,terminalId:e.terminalId||e.terminal_id||null}};
const rect=v=>{const x1=num(v?.x1,v?.left),y1=num(v?.y1,v?.top),x2=num(v?.x2,v?.right),y2=num(v?.y2,v?.bottom);return{x1:Math.min(x1,x2),y1:Math.min(y1,y2),x2:Math.max(x1,x2),y2:Math.max(y1,y2),id:v?.id||null}};
const boundsOf=v=>({left:num(v?.left,0),top:num(v?.top,0),right:num(v?.right,1200),bottom:num(v?.bottom,800)});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const median=values=>{const s=values.filter(Number.isFinite).slice().sort((a,b)=>a-b);if(!s.length)return 0;const m=Math.floor(s.length/2);return s.length%2?s[m]:(s[m-1]+s[m])/2};
const region=(points,bounds,margin)=>{const values=points.map(pt);if(!values.length)return{...bounds};const xs=values.map(v=>v.x),ys=values.map(v=>v.y);return{left:clamp(Math.min(...xs)-margin,bounds.left,bounds.right),top:clamp(Math.min(...ys)-margin,bounds.top,bounds.bottom),right:clamp(Math.max(...xs)+margin,bounds.left,bounds.right),bottom:clamp(Math.max(...ys)+margin,bounds.top,bounds.bottom)}};
const axisFor=points=>{const values=points.map(pt);if(values.length<2)return'horizontal';const xs=values.map(v=>v.x),ys=values.map(v=>v.y);return Math.max(...xs)-Math.min(...xs)>=Math.max(...ys)-Math.min(...ys)?'horizontal':'vertical'};
const laneBlocked=(axis,coordinate,start,end,obstacles)=>{const lo=Math.min(start,end),hi=Math.max(start,end);return obstacles.some(o=>axis==='horizontal'?coordinate>o.y1+.1&&coordinate<o.y2-.1&&hi>o.x1+.1&&lo<o.x2-.1:coordinate>o.x1+.1&&coordinate<o.x2-.1&&hi>o.y1+.1&&lo<o.y2-.1)};
const findLane=(axis,wanted,start,end,obstacles,bounds,gap)=>{
  const min=axis==='horizontal'?bounds.top+gap:bounds.left+gap,max=axis==='horizontal'?bounds.bottom-gap:bounds.right-gap;
  for(const offset of [0,1,-1,2,-2,3,-3,4,-4,5,-5,6,-6,8,-8,10,-10]){const value=clamp(wanted+offset*gap,min,max);if(!laneBlocked(axis,value,start,end,obstacles))return value}
  return clamp(wanted,min,max);
};
const bands={POWER:0,CONTROL:2,LOGIC:-2,NEUTRAL:3,PROTECTIVE_EARTH:-3,COMMUNICATION:-1,GENERIC:1};
const routingKey=(wire,kind,axis,netId)=>{const bundle=String(wire?.bundleKey||wire?.bundle_key||'').trim();if(kind==='POWER'&&phaseOrder(wire)<3&&bundle)return'POWER:PHASE:'+bundle+':'+axis;if(['CONTROL','LOGIC','NEUTRAL','PROTECTIVE_EARTH','COMMUNICATION'].includes(kind))return kind+':'+axis;return kind+':'+(bundle||netId)+':'+axis};
const anchors=(wire,axis,lane,gap)=>{
  if(wire?.manual)return[];
  const from=endpoint(wire,'from'),to=endpoint(wire,'to'),create=value=>compact(axis==='horizontal'?[{x:from.stub.x,y:value},{x:to.stub.x,y:value}]:[{x:value,y:from.stub.y},{x:value,y:to.stub.y}]);
  return[create(lane),create(lane+gap),create(lane-gap)].filter((value,index,array)=>value.length&&array.findIndex(item=>JSON.stringify(item)===JSON.stringify(value))===index);
};
const orthogonalReferenceDistance=(from,to,obstacles,clearance)=>{
  const escape=manhattan(from.point,from.stub)+manhattan(to.stub,to.point),core=manhattan(from.stub,to.stub),a=[from.stub,{x:to.stub.x,y:from.stub.y},to.stub],b=[from.stub,{x:from.stub.x,y:to.stub.y},to.stub],blocked=routeIntersectsObstacles(a,obstacles)&&routeIntersectsObstacles(b,obstacles),obstacleMargin=blocked?Math.max(clearance*4,manhattan(from.stub,to.stub)*.12):0;return Math.max(1,escape+core+obstacleMargin);
};
function plan(input={}){
  const clearance=Math.max(4,num(input.clearance,14)),gap=Math.max(clearance,8),endpointTolerance=Math.max(.1,num(input.endpointTolerance,ENDPOINT_TOLERANCE)),bounds=boundsOf(input.bounds),obstacles=(input.obstacles||[]).map(rect),wires=(input.wires||[]).filter(w=>w?.id);
  if(input.agentGenerated!==true)return{enabled:false,marker:MARKER,version:VERSION,maxDetourRatio:MAX_DETOUR_RATIO,netPlans:[],routingGroups:[],corridors:[],wireHints:{}};
  const junctionMap=new Map((input.junctions||[]).filter(v=>v?.id).map(v=>[String(v.id),pt(v)])),netMap=new Map();
  wires.forEach(wire=>{const id=String(wire.netId||wire.net_id||'UNASSIGNED:'+wire.id);if(!netMap.has(id))netMap.set(id,[]);netMap.get(id).push(wire)});
  const netPlans=[];
  netMap.forEach((netWires,netId)=>{
    const endpoints=[],junctionIds=new Set();
    netWires.forEach(wire=>{const from=endpoint(wire,'from'),to=endpoint(wire,'to');endpoints.push({wireId:String(wire.id),side:'from',...from},{wireId:String(wire.id),side:'to',...to});[from,to].forEach(e=>{if(e.junctionId)junctionIds.add(String(e.junctionId))})});
    const geometry=endpoints.flatMap(e=>[e.point,e.stub]);junctionIds.forEach(id=>{if(junctionMap.has(id))geometry.push(junctionMap.get(id))});
    const classes=netWires.map(classifyWire),kind=classes.slice().sort((a,b)=>classes.filter(v=>v===b).length-classes.filter(v=>v===a).length||CLASS_PRIORITY[b]-CLASS_PRIORITY[a])[0]||'GENERIC',axis=axisFor(geometry);
    netPlans.push({netId,wireIds:netWires.map(w=>String(w.id)),junctionIds:[...junctionIds],endpoints,profile:first(netWires[0],['profile']),domain:first(netWires[0],['domain']),conductor_role:first(netWires[0],['conductorRole','conductor_role']),voltage_class:first(netWires[0],['voltageClass','voltage_class']),classification:kind,priority:CLASS_PRIORITY[kind],dominantAxis:axis,preferredCorridor:null,laneAssignments:{},preferredBoundingRegion:region(geometry,bounds,clearance*4),routingGroups:[]});
  });
  const netById=new Map(netPlans.map(v=>[v.netId,v])),groups=new Map();
  wires.forEach(wire=>{
    const netId=String(wire.netId||wire.net_id||'UNASSIGNED:'+wire.id),net=netById.get(netId),kind=classifyWire(wire,net?.classification),axis=net?.dominantAxis||axisFor([endpoint(wire,'from').stub,endpoint(wire,'to').stub]),key=routingKey(wire,kind,axis,netId);
    if(!groups.has(key))groups.set(key,{id:key,classification:kind,axis,wires:[],netIds:new Set(),points:[]});
    const group=groups.get(key),from=endpoint(wire,'from'),to=endpoint(wire,'to');group.wires.push(wire);group.netIds.add(netId);group.points.push(from.point,from.stub,to.stub,to.point);if(from.junctionId&&junctionMap.has(String(from.junctionId)))group.points.push(junctionMap.get(String(from.junctionId)));if(to.junctionId&&junctionMap.has(String(to.junctionId)))group.points.push(junctionMap.get(String(to.junctionId)));
  });
  const wireHints={},corridors=[],routingGroups=[];
  groups.forEach(group=>{
    const axis=group.axis,main=group.points.map(v=>axis==='horizontal'?v.x:v.y),cross=group.points.map(v=>axis==='horizontal'?v.y:v.x),start=Math.min(...main),end=Math.max(...main),coordinate=findLane(axis,median(cross)+num(bands[group.classification])*gap,start,end,obstacles,bounds,gap),box=region(group.points,bounds,clearance*4),corridor={id:'CORRIDOR:'+group.id,routingGroupId:group.id,classification:group.classification,dominantAxis:axis,coordinate,laneGap:gap,preferredBoundingRegion:box};
    corridors.push(corridor);
    const sorted=group.wires.slice().sort((a,b)=>phaseOrder(a)-phaseOrder(b)||String(a.id).localeCompare(String(b.id))),assignments=[];
    sorted.forEach((wire,index)=>{
      const from=endpoint(wire,'from'),to=endpoint(wire,'to'),wanted=coordinate+(index-(sorted.length-1)/2)*gap,lane=findLane(axis,wanted,axis==='horizontal'?from.stub.x:from.stub.y,axis==='horizontal'?to.stub.x:to.stub.y,obstacles,bounds,gap),netId=String(wire.netId||wire.net_id||'UNASSIGNED:'+wire.id),manual=wire.manual===true,hint={wireId:String(wire.id),netId,classification:group.classification,priority:CLASS_PRIORITY[group.classification],routingGroupId:group.id,corridorId:corridor.id,dominantAxis:axis,laneIndex:index,laneCoordinate:lane,laneGap:gap,endpointTolerance,maxDetourRatio:MAX_DETOUR_RATIO,preferredBoundingRegion:box,sourcePoint:from.point,targetPoint:to.point,sourceStub:from.stub,targetStub:to.stub,junctionIds:[from.junctionId,to.junctionId].filter(Boolean).map(String),protectedManual:manual,orthogonalReferenceDistance:orthogonalReferenceDistance(from,to,obstacles,clearance),anchorCandidates:anchors(wire,axis,lane,gap)};
      wireHints[String(wire.id)]=hint;assignments.push({wireId:String(wire.id),laneIndex:index,laneCoordinate:lane});
      const net=netById.get(netId);if(net){net.laneAssignments[String(wire.id)]={laneIndex:index,laneCoordinate:lane,corridorId:corridor.id};if(!net.routingGroups.includes(group.id))net.routingGroups.push(group.id);if(!net.preferredCorridor)net.preferredCorridor={id:corridor.id,axis,coordinate,laneGap:gap}}
    });
    routingGroups.push({id:group.id,classification:group.classification,netIds:[...group.netIds],wireIds:sorted.map(w=>String(w.id)),dominantAxis:axis,corridorId:corridor.id,laneAssignments:assignments});
  });
  return{enabled:true,marker:MARKER,version:VERSION,maxDetourRatio:MAX_DETOUR_RATIO,clearance,netPlans,routingGroups,corridors,wireHints};
}
const routeLength=points=>{const values=compact(points);return values.slice(1).reduce((sum,v,i)=>sum+Math.abs(v.x-values[i].x)+Math.abs(v.y-values[i].y),0)};
const orthogonal=points=>{const values=compact(points);return values.slice(1).every((v,i)=>v.x===values[i].x||v.y===values[i].y)};
const inside=(v,r)=>v.x>=r.left-.1&&v.x<=r.right+.1&&v.y>=r.top-.1&&v.y<=r.bottom+.1;
function inspectRoute(hint={},points=[]){
  const values=compact(points),source=pt(hint.sourcePoint),target=pt(hint.targetPoint),directDistance=Math.hypot(target.x-source.x,target.y-source.y),rawManhattan=manhattan(source,target),manhattanReference=Math.max(1,rawManhattan,num(hint.orthogonalReferenceDistance,rawManhattan)),length=routeLength(values),metricValid=values.length>=2&&length+.01>=directDistance,detourRatio=metricValid?length/manhattanReference:Infinity,isOrthogonal=orthogonal(values),endpointTolerance=Math.max(.1,num(hint.endpointTolerance,ENDPOINT_TOLERANCE)),endpointCorrect=values.length>=2&&within(values[0],source,endpointTolerance)&&within(values.at(-1),target,endpointTolerance),axis=hint.dominantAxis||'horizontal',expected=axis==='horizontal'?target.x-source.x:target.y-source.y,direction=Math.sign(expected);
  let backtrackEvents=0,corridorViolations=0;
  values.slice(1).forEach((v,i)=>{const a=values[i],delta=axis==='horizontal'?v.x-a.x:v.y-a.y,parallel=axis==='horizontal'?v.y===a.y:v.x===a.x;if(direction&&parallel&&delta*direction<-num(hint.laneGap,14)*.5)backtrackEvents++;if(parallel&&i>0&&i<values.length-2&&Math.abs((axis==='horizontal'?v.y:v.x)-num(hint.laneCoordinate))>num(hint.laneGap,14)*3)corridorViolations++});
  const boundingViolations=hint.preferredBoundingRegion?values.filter(v=>!inside(v,hint.preferredBoundingRegion)).length:0,longDetour=metricValid&&detourRatio>num(hint.maxDetourRatio,MAX_DETOUR_RATIO)+.0001,valid=isOrthogonal&&endpointCorrect&&metricValid&&!longDetour,score=valid?length+backtrackEvents*manhattanReference*4+boundingViolations*manhattanReference*3+corridorViolations*manhattanReference*2:Infinity;
  return{valid,orthogonal:isOrthogonal,endpointCorrect,metricValid,length,directDistance,manhattanReference,detourRatio,longDetour,backtrackEvents,boundingViolations,corridorViolations,score};
}
function selectCandidate(hint,candidates=[]){const accepted=candidates.map(points=>({points:compact(points),assessment:inspectRoute(hint,points)})).filter(v=>v.assessment.valid).sort((a,b)=>a.assessment.score-b.assessment.score);return accepted[0]||null}
const segmentHitsRect=(a,b,value)=>{const r=rect(value);if(a.x===b.x)return a.x>r.x1+.1&&a.x<r.x2-.1&&Math.max(a.y,b.y)>r.y1+.1&&Math.min(a.y,b.y)<r.y2-.1;if(a.y===b.y)return a.y>r.y1+.1&&a.y<r.y2-.1&&Math.max(a.x,b.x)>r.x1+.1&&Math.min(a.x,b.x)<r.x2-.1;return true};
function routeIntersectsObstacles(points,obstacles=[]){const values=compact(points);for(let i=1;i<values.length;i++)if(obstacles.some(r=>segmentHitsRect(values[i-1],values[i],r)))return true;return false}
root.TechRibMultifilarRoutingStandardV1=Object.freeze({VERSION,MARKER,MAX_DETOUR_RATIO,ENDPOINT_TOLERANCE,REJECT_REASONS,CLASS_PRIORITY,classifyWire,plan,inspectRoute,selectCandidate,createDiagnostics,recordOutcome,routeIntersectsObstacles,normalizeOrthogonalPoints,orthogonalReferenceDistance,compactPoints:compact});
})(typeof window!=='undefined'?window:globalThis);
