(()=>{
  'use strict';
  const defs={
    'elevator.motor':{file:'/assets/sounds/elevator_motor_loop.wav',loop:true,volume:.34},
    'elevator.doorOpen':{file:'/assets/sounds/elevator_door_open.wav',volume:.46},
    'elevator.doorClose':{file:'/assets/sounds/elevator_door_close.wav',volume:.48},
    'elevator.ding':{file:'/assets/sounds/elevator_ding.wav',volume:.42},
    'elevator.brake':{file:'/assets/sounds/mechanical_clack.wav',volume:.35},
    'pump.motor':{file:'/assets/sounds/pump_motor_loop.wav',loop:true,volume:.30},
    'pump.start':{file:'/assets/sounds/pump_start.wav',volume:.28},
    'gate.motor':{file:'/assets/sounds/gate_motor_loop.wav',loop:true,volume:.26},
    'gate.obstacle':{file:'/assets/sounds/gate_obstacle_beep.wav',volume:.34},
    'gate.stop':{file:'/assets/sounds/mechanical_clack.wav',volume:.25},
    'conveyor.motor':{file:'/assets/sounds/conveyor_motor_loop.wav',loop:true,volume:.25},
    'conveyor.jam':{file:'/assets/sounds/conveyor_jam.wav',volume:.38},
    'crane.motor':{file:'/assets/sounds/elevator_motor_loop.wav',loop:true,volume:.24},
    'crane.stop':{file:'/assets/sounds/mechanical_clack.wav',volume:.22},
    'crane.alert':{file:'/assets/sounds/soft_alert.wav',volume:.28},
    'system.alert':{file:'/assets/sounds/soft_alert.wav',volume:.28},
    'compressor.motor':{file:'/assets/sounds/compressor_motor_loop.wav',loop:true,volume:.30},
    'generator.motor':{file:'/assets/sounds/generator_motor_loop.wav',loop:true,volume:.30},
    'water.flow':{file:'/assets/sounds/water_flow_loop.wav',loop:true,volume:.22},
    'solenoid.open':{file:'/assets/sounds/solenoid_click.wav',volume:.34},
    'solenoid.close':{file:'/assets/sounds/solenoid_click.wav',volume:.30},
    'filling.flow':{file:'/assets/sounds/filling_flow_loop.wav',loop:true,volume:.22},
    'servo.motor':{file:'/assets/sounds/servo_whirr_loop.wav',loop:true,volume:.24},
    'sensor.ping':{file:'/assets/sounds/ultrasonic_ping.wav',volume:.20},
    'parking.chime':{file:'/assets/sounds/parking_chime.wav',volume:.34},
    'motion.step':{file:'/assets/sounds/motion_step_click.wav',volume:.22},
    'motion.stepper':{file:'/assets/sounds/motion_stepper_loop.wav',loop:true,volume:.22},
    'motion.dc':{file:'/assets/sounds/motion_dc_motor_loop.wav',loop:true,volume:.20},
    'motion.encoder':{file:'/assets/sounds/motion_encoder_click.wav',volume:.24}
  };
  let context=null,master=null,enabled=true,masterVolume=.62;
  const buffers=new Map(),loops=new Map(),pending=new Map(),loopRequests=new Map();
  const AudioEngine=()=>window.AudioContext||window.webkitAudioContext;
  const ensureContext=async()=>{
    const Engine=AudioEngine();if(!Engine)throw new Error('Web Audio não suportado');
    if(!context){context=new Engine({latencyHint:'interactive'});master=context.createGain();master.gain.value=enabled?masterVolume:.0001;master.connect(context.destination)}
    if(context.state==='suspended')await context.resume();
    return context;
  };
  const unlock=async()=>{try{await ensureContext();return true}catch{return false}};
  const load=async name=>{
    const def=defs[name];if(!def)throw new Error(`Som não registrado: ${name}`);
    if(buffers.has(name))return buffers.get(name);
    if(pending.has(name))return pending.get(name);
    const promise=(async()=>{const ctx=await ensureContext();const response=await fetch(def.file,{cache:'force-cache'});if(!response.ok)throw new Error(`Falha ao carregar ${def.file}`);const data=await response.arrayBuffer(),buffer=await ctx.decodeAudioData(data);buffers.set(name,buffer);pending.delete(name);return buffer})().catch(error=>{pending.delete(name);throw error});
    pending.set(name,promise);return promise;
  };
  const fadeGain=(gain,from,to,duration)=>{const now=context.currentTime;gain.gain.cancelScheduledValues(now);gain.gain.setValueAtTime(Math.max(.0001,from),now);gain.gain.exponentialRampToValueAtTime(Math.max(.0001,to),now+Math.max(.01,duration))};
  const play=async(name,{volume=1,playbackRate=1}={})=>{
    if(!enabled)return null;const def=defs[name];if(!def)return null;const ctx=await ensureContext(),buffer=await load(name);if(!enabled)return null;
    const source=ctx.createBufferSource(),gain=ctx.createGain();source.buffer=buffer;source.playbackRate.value=Math.max(.25,Math.min(4,Number(playbackRate)||1));gain.gain.value=Math.max(.0001,Math.min(1,def.volume*(Number(volume)||1)));source.connect(gain).connect(master);source.start();return{source,gain,name}
  };
  const stopLoop=(owner,fade=.14)=>{
    if(!owner)return;loopRequests.delete(owner);const active=loops.get(owner);if(!active)return;loops.delete(owner);if(!context){try{active.source.stop()}catch{};return}const now=context.currentTime;try{active.gain.gain.cancelScheduledValues(now);active.gain.gain.setValueAtTime(Math.max(.0001,active.gain.gain.value),now);active.gain.gain.exponentialRampToValueAtTime(.0001,now+fade);setTimeout(()=>{try{active.source.stop()}catch{}},Math.ceil((fade+.04)*1000))}catch{try{active.source.stop()}catch{}}
  };
  const startLoop=(owner,name,{volume=1,playbackRate=1}={})=>{
    if(!owner||!enabled)return Promise.resolve(null);const def=defs[name];if(!def?.loop)return Promise.resolve(null);const current=loops.get(owner);if(current?.name===name)return Promise.resolve(current);const queued=loopRequests.get(owner);if(queued?.name===name)return queued.promise;if(current)stopLoop(owner,.08);
    const token=Symbol(name),promise=(async()=>{try{const ctx=await ensureContext(),buffer=await load(name),request=loopRequests.get(owner);if(!enabled||request?.token!==token||!owner.isConnected)return null;const source=ctx.createBufferSource(),gain=ctx.createGain();source.buffer=buffer;source.loop=true;source.playbackRate.value=Math.max(.25,Math.min(4,Number(playbackRate)||1));gain.gain.value=.0001;source.connect(gain).connect(master);source.start();const target=Math.max(.0001,Math.min(1,def.volume*(Number(volume)||1)));fadeGain(gain,.0001,target,.16);const active={name,source,gain};loops.set(owner,active);return active}finally{if(loopRequests.get(owner)?.token===token)loopRequests.delete(owner)}})();
    loopRequests.set(owner,{name,token,promise});return promise
  };
  const setLoopRate=(owner,rate)=>{const active=loops.get(owner);if(active)active.source.playbackRate.setTargetAtTime(Math.max(.25,Math.min(4,Number(rate)||1)),context.currentTime,.04)};
  const hasLoop=owner=>loops.has(owner);
  const stopAll=()=>{const owners=new Set([...loops.keys(),...loopRequests.keys()]);owners.forEach(owner=>stopLoop(owner,.08))};
  const setEnabled=value=>{enabled=Boolean(value);if(!enabled)stopAll();if(master&&context){const now=context.currentTime;master.gain.cancelScheduledValues(now);master.gain.setTargetAtTime(enabled?masterVolume:.0001,now,.03)}};
  const setMasterVolume=value=>{masterVolume=Math.max(.05,Math.min(1,Number(value)||.62));if(master&&enabled)master.gain.setTargetAtTime(masterVolume,context.currentTime,.03)};
  const preload=names=>Promise.all((names||Object.keys(defs)).filter(name=>defs[name]).map(name=>load(name).catch(()=>null)));
  window.TechRibSoundLibrary={defs,unlock,load,play,startLoop,stopLoop,stopAll,hasLoop,setLoopRate,setEnabled,setMasterVolume,get enabled(){return enabled},get masterVolume(){return masterVolume},preload};
})();
