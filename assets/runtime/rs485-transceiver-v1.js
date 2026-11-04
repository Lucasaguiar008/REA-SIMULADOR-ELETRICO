(function(root){
  'use strict';
  const create=({sheet,componentTerminals,registryDefinition,boardPowerState,measureBetween,wireOnlyConnected}={})=>{
    if(!sheet?.querySelectorAll)throw new Error('TechRibRs485TransceiverRuntimeV1: sheet ausente');
    for(const [name,fn] of Object.entries({componentTerminals,registryDefinition,boardPowerState,measureBetween,wireOnlyConnected}))if(typeof fn!=='function')throw new Error(`TechRibRs485TransceiverRuntimeV1: ${name} ausente`);

    const byName=component=>new Map(componentTerminals(component).map(t=>[t.dataset.terminal,t]));
    const setLed=(component,selector,on,onColor='#22c55e',offColor='#64748b')=>{const led=component.querySelector?.(selector);if(!led)return;led.setAttribute('fill',on?onColor:offColor);if(on)led.style.filter=`drop-shadow(0 0 6px ${onColor})`;else led.style.removeProperty?.('filter')};
    const logicalHigh=(component,states,terminalName,behavior,map)=>{const terminal=map.get(terminalName),ground=map.get(behavior.power?.ground||'GND');if(!terminal||!ground)return false;const m=measureBetween(states,terminal,ground,'DC');return m.type==='DC'&&Number(m.voltage||0)>=Number(behavior.logicHighMin??1.8)};
    const activeFromSpec=(high,spec,defaultActive)=>String(spec?.active||defaultActive||'HIGH').toUpperCase()==='LOW'?!high:high;
    const pinsOf=(definition)=>({ro:'RO',re:'RE',de:'DE',di:'DI',a:'A',b:'B',...(definition?.behavior?.pins||{})});
    const busEndpoint=(component)=>{const definition=registryDefinition(component),behavior=definition?.behavior||{};if(behavior.type==='rs485-transceiver')return null;const transport=String(behavior.bus?.transport||behavior.bus?.protocol||'').toLowerCase();if(transport!=='rs485'&&!(definition?.contract?.protocols||[]).map(String).some(x=>x.toLowerCase()==='rs485'))return null;const map=byName(component),a=map.get(behavior.bus?.a||'A'),b=map.get(behavior.bus?.b||'B');return a&&b?{component,definition,behavior,map,busA:a,busB:b}:null};
    const dataSnapshot=component=>['rs485Powered','rs485SupplyVoltage','rs485SupplySource','rs485DriverEnabled','rs485ReceiverEnabled','rs485DiHigh','rs485RoHigh','rs485BusState','rs485BusValid','rs485BusCollision','rs485PolarityFault','rs485ConnectedPeers'].map(k=>component.dataset[k]||'').join('|');

    const evaluateNetwork=states=>{
      const allComponents=[...sheet.querySelectorAll('.placed-component[data-registry-id]')];
      const nodes=allComponents.filter(component=>registryDefinition(component)?.behavior?.type==='rs485-transceiver').map(component=>{
        const definition=registryDefinition(component),behavior=definition.behavior||{},pins=pinsOf(definition),map=byName(component),power=boardPowerState(component,states,behavior),deHigh=logicalHigh(component,states,pins.de,behavior,map),reHigh=logicalHigh(component,states,pins.re,behavior,map),diHigh=logicalHigh(component,states,pins.di,behavior,map),driverEnabled=power.powered&&activeFromSpec(deHigh,behavior.driverEnable,'HIGH'),receiverEnabled=power.powered&&activeFromSpec(reHigh,behavior.receiverEnable,'LOW');
        return{component,definition,behavior,pins,map,power,deHigh,reHigh,diHigh,driverEnabled,receiverEnabled,busA:map.get(pins.a),busB:map.get(pins.b),before:dataSnapshot(component)};
      });
      const passiveEndpoints=allComponents.map(busEndpoint).filter(Boolean);
      if(!nodes.length)return false;
      const parent=nodes.map((_,i)=>i),find=i=>parent[i]===i?i:(parent[i]=find(parent[i])),join=(a,b)=>{a=find(a);b=find(b);if(a!==b)parent[b]=a};
      const reversed=new Set();
      for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){
        const a=nodes[i],b=nodes[j];if(!a.busA||!a.busB||!b.busA||!b.busB)continue;
        const normal=wireOnlyConnected(a.busA,b.busA)&&wireOnlyConnected(a.busB,b.busB);
        const swapped=wireOnlyConnected(a.busA,b.busB)&&wireOnlyConnected(a.busB,b.busA);
        if(normal)join(i,j);else if(swapped){reversed.add(i);reversed.add(j)}
      }
      const groups=new Map();nodes.forEach((node,i)=>{const key=find(i);if(!groups.has(key))groups.set(key,[]);groups.get(key).push({node,index:i})});
      for(const entries of groups.values()){
        const group=entries.map(x=>x.node),drivers=group.filter(x=>x.driverEnabled),collision=drivers.length>1;
        const externalNormal=new Set(),externalSwapped=new Set();
        passiveEndpoints.forEach(endpoint=>{for(const member of group){if(!member.busA||!member.busB)continue;const normal=wireOnlyConnected(member.busA,endpoint.busA)&&wireOnlyConnected(member.busB,endpoint.busB),swapped=wireOnlyConnected(member.busA,endpoint.busB)&&wireOnlyConnected(member.busB,endpoint.busA);if(normal){externalNormal.add(endpoint.component);break}if(swapped){externalSwapped.add(endpoint.component);break}}});
        const externalPeers=externalNormal.size,peerCountBase=Math.max(0,group.length-1)+externalPeers,connected=peerCountBase>0,busValid=drivers.length===1&&!collision&&connected,busHigh=busValid?drivers[0].diHigh:false;
        group.forEach(node=>{
          const c=node.component,polarityFault=reversed.has(nodes.indexOf(node))||externalSwapped.size>0,peers=peerCountBase,valid=busValid&&!polarityFault,roHigh=node.receiverEnabled&&valid&&busHigh;
          c.dataset.rs485Powered=String(node.power.powered);c.dataset.rs485SupplyVoltage=String(Math.round(Number(node.power.voltage||0)*100)/100);c.dataset.rs485SupplySource=node.power.source||'';
          c.dataset.rs485DriverEnabled=String(node.driverEnabled);c.dataset.rs485ReceiverEnabled=String(node.receiverEnabled);c.dataset.rs485DiHigh=String(node.diHigh);c.dataset.rs485RoHigh=String(roHigh);c.dataset.rs485BusValid=String(valid);c.dataset.rs485BusCollision=String(collision);c.dataset.rs485PolarityFault=String(polarityFault);c.dataset.rs485ConnectedPeers=String(peers);
          c.dataset.rs485BusState=polarityFault?'polarity-fault':collision?'collision':!connected?'disconnected':!drivers.length?'idle':busHigh?'HIGH':'LOW';
          c.classList.toggle('peripheral-powered',node.power.powered);c.classList.toggle('peripheral-active',node.driverEnabled||node.receiverEnabled&&valid);c.classList.toggle('electrical-conflict',collision||polarityFault);
          setLed(c,'[data-rs485-power-led]',node.power.powered);setLed(c,'[data-rs485-tx-led]',node.driverEnabled,node.diHigh?'#22c55e':'#f59e0b');setLed(c,'[data-rs485-rx-led]',node.receiverEnabled&&valid,roHigh?'#22c55e':'#38bdf8');setLed(c,'[data-rs485-fault-led]',collision||polarityFault,'#ef4444');
          c.title=!node.power.powered?`${node.definition.name} • sem alimentação`:polarityFault?`${node.definition.name} • A/B invertidos`:collision?`${node.definition.name} • COLISÃO: mais de um driver RS485 habilitado`:!connected?`${node.definition.name} • barramento A/B sem outro transceptor`:node.driverEnabled?`${node.definition.name} • TX ${node.diHigh?'HIGH':'LOW'} • ${peers} nó(s) remoto(s)`:node.receiverEnabled?`${node.definition.name} • RX ${valid?(roHigh?'HIGH':'LOW'):'IDLE'} • ${peers} nó(s) remoto(s)`:`${node.definition.name} • transceptor em alta impedância`;
        });
      }
      return nodes.some(node=>node.before!==dataSnapshot(node.component));
    };
    const reset=()=>{sheet.querySelectorAll('.placed-component[data-registry-id]').forEach(component=>{if(registryDefinition(component)?.behavior?.type!=='rs485-transceiver')return;['rs485Powered','rs485SupplyVoltage','rs485SupplySource','rs485DriverEnabled','rs485ReceiverEnabled','rs485DiHigh','rs485RoHigh','rs485BusValid','rs485BusCollision','rs485PolarityFault','rs485ConnectedPeers','rs485BusState'].forEach(k=>delete component.dataset[k]);component.classList.remove('peripheral-powered','peripheral-active','electrical-conflict');setLed(component,'[data-rs485-power-led]',false);setLed(component,'[data-rs485-tx-led]',false);setLed(component,'[data-rs485-rx-led]',false);setLed(component,'[data-rs485-fault-led]',false)})};
    return Object.freeze({evaluateNetwork,reset});
  };
  root.TechRibRs485TransceiverRuntimeV1=Object.freeze({version:'techrib.rs485-transceiver-runtime/v1',create});
})(typeof window!=='undefined'?window:globalThis);
