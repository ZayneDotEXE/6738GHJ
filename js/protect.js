/* js/protect.js — block devtools / inspect (deterrent, not absolute) */
(function(){
  document.addEventListener('contextmenu', e => e.preventDefault(), {capture:true});
  document.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    if(e.key === 'F12' || (e.ctrlKey && e.shiftKey && (k === 'i' || k === 'j' || k === 'c')) || (e.ctrlKey && k === 'u') || (e.ctrlKey && k === 's')){
      e.preventDefault(); e.stopPropagation(); return false;
    }
  }, {capture:true});
  let triggered = false;
  function block(){
    if(triggered) return; triggered = true;
    try{
      document.documentElement.innerHTML = '<body style="margin:0;background:#050507;color:#e8e8e6;display:grid;place-items:center;height:100vh;font-family:Inter,system-ui,sans-serif;text-align:center;padding:24px;"><div><div style="font-family:Cormorant Garamond,serif;letter-spacing:0.18em;color:#fff;text-shadow:0 0 8px rgba(255,255,255,0.35);font-size:1.1rem;">LONESTAR</div><div style="margin-top:10px;color:#9a9aa0;font-size:0.9rem;">DevTools is disabled on this sanctuary.</div></div></body>';
      window.stop && window.stop();
    }catch{}
  }
  setInterval(()=>{
    const wDiff = Math.abs(window.outerWidth - window.innerWidth);
    const hDiff = Math.abs(window.outerHeight - window.innerHeight);
    if((wDiff > 160 || hDiff > 160) && !triggered){
      if(window.outerWidth && window.innerWidth && hDiff > 120){ block(); }
    }
  }, 800);
  setInterval(()=>{
    const start = performance.now(); debugger; const elapsed = performance.now() - start;
    if(elapsed > 120 && !triggered){ block(); }
  }, 1500);
  if(location.protocol === 'view-source:'){ location.replace('./'); }
})();
