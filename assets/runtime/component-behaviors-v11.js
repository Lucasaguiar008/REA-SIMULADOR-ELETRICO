(function(root){
  'use strict';
  const normalizeGpioMode=value=>{const mode=String(value||'output').trim().toLowerCase().replace(/[\s-]+/g,'_');if(mode==='i2c_sda'||mode==='i2csda'||mode==='sda')return'i2c_sda';if(mode==='i2c_scl'||mode==='i2cscl'||mode==='scl')return'i2c_scl';if(mode==='input_pullup'||mode==='inputpullup'||mode==='pullup')return'input_pullup';if(mode==='analog_input'||mode==='analoginput'||mode==='adc')return'analog-input';if(mode==='input')return'input';return'output'};
  const isGpioInputMode=value=>{const mode=normalizeGpioMode(value);return mode==='input'||mode==='input_pullup'||mode==='analog-input'};
  const canonicalGpioPinValue=(pin,aliases={},picoFamily=false)=>{const value=String(pin||'').trim().toUpperCase(),safeAliases=aliases&&typeof aliases==='object'?aliases:{};for(const [alias,target] of Object.entries(safeAliases)){if(String(alias).trim().toUpperCase()===value)return String(target).trim().toUpperCase()}if(picoFamily){const match=value.match(/^GPIO(\d+)$/);if(match)return`GP${match[1]}`}return value};
  const initialInputStates=program=>{const states={};Object.entries(program?.pinModes||{}).forEach(([pin,mode])=>{const normalized=normalizeGpioMode(mode);if(normalized==='input_pullup')states[pin]='HIGH';else if(normalized==='input'||normalized==='analog-input')states[pin]='LOW'});return states};
  const clampPercent=value=>Math.max(0,Math.min(100,Number(value)||0));
  const gateClamp=clampPercent,conveyorClamp=clampPercent,craneClamp=clampPercent,industrialClamp=clampPercent,pumpClamp=clampPercent;
  const vfdClampFreq=(value,max=600)=>Math.max(0,Math.min(Number(max)||600,Number(value)||0));
  root.TechRibComponentBehaviors=Object.freeze({normalizeGpioMode,isGpioInputMode,canonicalGpioPinValue,initialInputStates,clampPercent,gateClamp,conveyorClamp,craneClamp,industrialClamp,pumpClamp,vfdClampFreq});
})(typeof window!=='undefined'?window:globalThis);
