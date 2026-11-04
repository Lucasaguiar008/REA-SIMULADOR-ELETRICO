/* TechRib V30 — serialização do projeto extraída do app-v51.js. */
(function(root){
  'use strict';
  const VERSION=30;

  function create(options={}){
    const projectSchema=options.projectSchema;
    if(!projectSchema||typeof projectSchema.endpointData!=='function'||typeof projectSchema.componentRecord!=='function')throw new Error('ProjectSerialization V30 requer projectSchema válido');
    const projectName=options.projectName;
    const formatSelect=options.formatSelect;
    const technicalScaleRuntime=options.technicalScaleRuntime;
    const sheet=options.sheet;
    const junctions=options.junctions||[];
    const wires=options.wires||[];
    const conduits=options.conduits||[];
    const endpointData=endpoint=>projectSchema.endpointData(endpoint);
    const serialize=()=>({
      schema:projectSchema.schema,
      version:projectSchema.version,
      wireRoutingStateVersion:2,
      name:projectName?.value?.trim()||'Projeto sem título',
      format:formatSelect?.value||'a4-landscape',
      technicalScale:technicalScaleRuntime?.serialize?.()||null,
      titleFields:[...(sheet?.querySelectorAll?.('.title-block input')||[])].map(input=>input.value),
      components:[...(sheet?.querySelectorAll?.('.placed-component')||[])].map(node=>projectSchema.componentRecord(node)),
      junctions:junctions.map(j=>({id:j.id,uid:j.uid||'',x:j.x,y:j.y})),
      wires:wires.map(w=>({
        id:w.id||null,
        number:w.number,
        identification:w.identification||w.number,
        color:w.color,
        profile:w.profile||'control',
        crossSectionMm2:w.crossSectionMm2,
        crossSectionMode:w.crossSectionMode||'auto',
        visualThickness:w.visualThickness||'auto',
        terminalType:w.terminalType||'ferrule',
        sleeveMode:w.sleeveMode||'on',
        routeLocked:w.routeLocked===true,
        from:endpointData(w.from),
        to:endpointData(w.to),
        waypoints:w.waypoints.map(p=>({x:p.x,y:p.y,manual:p.manual===true}))
      })),
      conduits:conduits.map(c=>({id:c.id,diameter:c.diameter,material:c.material,xray:c.xray===true,points:c.points.map(p=>({x:p.x,y:p.y}))}))
    });
    return Object.freeze({version:VERSION,endpointData,serialize});
  }

  root.TechRibProjectSerializationV30=Object.freeze({VERSION,create});
})(typeof window!=='undefined'?window:globalThis);
