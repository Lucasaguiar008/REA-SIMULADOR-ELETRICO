(function(root){
  'use strict';
  const create=({sheet,registryBehavior,componentTerminals,terminalStates,electricalNodeKey,wireOnlyConnected}={})=>{
    const required={registryBehavior,componentTerminals,terminalStates,electricalNodeKey,wireOnlyConnected};
    if(!sheet?.querySelectorAll)throw new Error('TechRibElectricalLoadsRuntime: sheet ausente');
    for(const [name,fn] of Object.entries(required))if(typeof fn!=='function')throw new Error(`TechRibElectricalLoadsRuntime: ${name} ausente`);

    const estimateLoadCurrent=(states,sourceIds)=>{
      if(!sourceIds?.size)return 0;
      let total=0;
      sheet.querySelectorAll('.placed-component').forEach(load=>{
        if(registryBehavior(load)?.type==='measurement-instrument')return;
        const sharesSource=componentTerminals(load).some(terminal=>terminalStates(states,terminal).some(state=>sourceIds.has(state.source)));
        if(!sharesSource)return;
        const type=load.dataset.type||'',behavior=registryBehavior(load)?.type||'';
        const active=load.dataset.electricalRunning==='true'||load.dataset.coilEnergized==='true'||load.dataset.energized==='true'||load.dataset.state==='on'||load.dataset.relayEnergized==='true'||load.dataset.indicatorOn==='true'||load.dataset.peripheralActive==='true'||load.dataset.softState==='running';
        if(!active)return;
        let current=Number(load.dataset.estimatedCurrent||load.dataset.ratedCurrent||0);
        if(!current){
          if(type.startsWith('motor-'))current=4.5;
          else if(type.startsWith('bomba-'))current=5.5;
          else if(type.startsWith('contator'))current=.05;
          else if(type.startsWith('sinaleiro-')||type==='resid-lampada'||behavior==='indicator-led')current=.03;
          else if(behavior==='relay-module'||behavior==='relay-module-multi')current=.08;
          else current=.02;
        }
        total+=current;
      });
      return total;
    };

    const evaluateMotorSupply=(component,states)=>{
      const type=component.dataset.type,behavior=registryBehavior(component)||{},kind=String(behavior.kind||''),all=componentTerminals(component),by=new Map(all.map(t=>[t.dataset.terminal,t]));
      const live=name=>terminalStates(states,by.get(name)||null),phaseLive=name=>live(name).filter(s=>s.type==='AC'&&s.phase&&!s.reference),referenceLive=name=>live(name).filter(s=>s.type==='AC'&&s.reference);
      if(kind==='single-phase-line-neutral'){
        const lineName=String((behavior.lineTerminals||[])[0]||'L'),neutralName=String(behavior.neutralTerminal||'N'),lines=phaseLive(lineName),refs=referenceLive(neutralName),pair=lines.find(a=>refs.some(b=>a.source&&a.source===b.source));
        const running=Boolean(pair),sources=[...new Set(lines.map(s=>s.source).filter(Boolean))],status=!lines.length?'fase ausente':!refs.length?'neutro ausente':!running?'fase e neutro de fontes incompatíveis':'alimentação L-N válida';
        return{running,status,requiredPhases:1,phases:[...new Set(lines.map(s=>s.phase))],sources,connection:'line-neutral',direction:'fixed'};
      }
      const six=kind==='three-phase-six-terminal'||type==='motor-trifasico-6t'||type==='bomba-trifasica-6t';
      const two=kind==='two-phase'||type==='motor-bifasico'||type==='bomba-bifasica-220v';
      const phaseTerminals=Array.isArray(behavior.phaseTerminals)&&behavior.phaseTerminals.length?behavior.phaseTerminals:(six?['U1','V1','W1']:two?['L1','L2']:(['U','V','W'].every(n=>by.has(n))?['U','V','W']:['U1','V1','W1']));
      const phaseStates=phaseTerminals.flatMap(phaseLive),phases=new Set(phaseStates.map(s=>s.phase)),sources=new Set(phaseStates.map(s=>s.source).filter(Boolean)),acOnly=phaseStates.every(s=>s.type==='AC');
      let connectionValid=true,connection='direct';
      if(six){
        const staticStar=wireOnlyConnected(by.get('U2'),by.get('V2'))&&wireOnlyConnected(by.get('V2'),by.get('W2'));
        const staticDelta=wireOnlyConnected(by.get('U2'),by.get('V1'))&&wireOnlyConnected(by.get('V2'),by.get('W1'))&&wireOnlyConnected(by.get('W2'),by.get('U1'));
        const contactors=[...sheet.querySelectorAll('.placed-component')].filter(c=>(registryBehavior(c)?.type==='contactor'||['contator','contator-2','contator-4p'].includes(c.dataset.type))&&c.dataset.coilEnergized==='true');
        const terms=c=>new Map(componentTerminals(c).map(t=>[t.dataset.terminal,t]));
        const dynamicStar=contactors.some(c=>{const k=terms(c);return wireOnlyConnected(by.get('U2'),k.get('L1'))&&wireOnlyConnected(by.get('V2'),k.get('L2'))&&wireOnlyConnected(by.get('W2'),k.get('L3'))&&wireOnlyConnected(k.get('T1'),k.get('T2'))&&wireOnlyConnected(k.get('T2'),k.get('T3'))});
        const dynamicDelta=contactors.some(c=>{const k=terms(c);return wireOnlyConnected(by.get('U2'),k.get('L1'))&&wireOnlyConnected(by.get('V2'),k.get('L2'))&&wireOnlyConnected(by.get('W2'),k.get('L3'))&&wireOnlyConnected(k.get('T1'),by.get('V1'))&&wireOnlyConnected(k.get('T2'),by.get('W1'))&&wireOnlyConnected(k.get('T3'),by.get('U1'))});
        const star=staticStar||dynamicStar,delta=staticDelta||dynamicDelta;connectionValid=star||delta;connection=star?'star':delta?'delta':'open';
      }
      const requiredPhases=Number(behavior.requiredPhases|| (two?2:3)),phaseValid=phases.size>=requiredPhases,sourceValid=sources.size<=1,running=acOnly&&phaseValid&&sourceValid&&connectionValid;
      let direction='unknown',sequence=[];
      if(requiredPhases===3&&phaseTerminals.length>=3){sequence=phaseTerminals.slice(0,3).map(name=>phaseLive(name)[0]?.phase||'');const idx=sequence.map(p=>['L1','L2','L3'].indexOf(p));if(idx.every(v=>v>=0)&&new Set(idx).size===3){let inv=0;for(let i=0;i<idx.length;i++)for(let j=i+1;j<idx.length;j++)if(idx[i]>idx[j])inv++;direction=inv%2===0?'cw':'ccw'}}
      const status=!phaseStates.length?'sem alimentação':!acOnly?'tipo de rede inválido':!sourceValid?'fontes incompatíveis':!phaseValid?`faltam fases (${phases.size}/${requiredPhases})`:!connectionValid?'ligação estrela/triângulo incompleta':'alimentação válida';
      return{running,status,requiredPhases,phases:[...phases],sources:[...sources],connection,direction,sequence};
    };

    const motorHasSupply=(component,states)=>evaluateMotorSupply(component,states).running;
    const loadHasSupply=(component,states)=>{
      const terminals=componentTerminals(component);if(terminals.length<2)return false;
      const left=[...(states.get(electricalNodeKey(terminals[0]))?.values()||[])],right=[...(states.get(electricalNodeKey(terminals[1]))?.values()||[])];
      return left.some(a=>right.some(b=>a.type===b.type&&a.source===b.source&&(a.phase!==b.phase||a.polarity!==b.polarity||a.voltage!==b.voltage)));
    };

    return Object.freeze({estimateLoadCurrent,evaluateMotorSupply,motorHasSupply,loadHasSupply});
  };
  root.TechRibElectricalLoadsRuntime=Object.freeze({create});
})(typeof window!=='undefined'?window:globalThis);
