(function(){
  'use strict';
  let timer=0,lastPing=0;
  const ping=()=>{
    if(document.visibilityState==='hidden')return;
    const now=Date.now();if(now-lastPing<30000)return;lastPing=now;
    fetch('/?api=saas-presence-ping',{method:'POST',credentials:'same-origin',headers:{'X-Requested-With':'XMLHttpRequest'},cache:'no-store',keepalive:true}).catch(()=>{});
  };
  const start=()=>{ping();clearInterval(timer);timer=setInterval(ping,60000)};
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')ping()});
  window.addEventListener('focus',ping);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
