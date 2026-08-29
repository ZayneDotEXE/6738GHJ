/* js/protect.js — block devtools / inspect (deterrent, not absolute) */
(function(){
  // disable right-click
  document.addEventListener('contextmenu', e => e.preventDefault(), {capture:true});
  // disable common devtools shortcuts
  document.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    if(
      e.key === 'F12' ||
      (e.ctrlKey && e.shiftKey && (k === 'i' || k === 'j' || k === 'c')) ||
      (e.ctrlKey && k === 'u') ||
      (e.ctrlKey && k === 's')
    ){
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, {capture:true});

  // devtools detection via window size (works when docked) + debugger timing
  let triggered = false;
  function block(){
    if(triggered) return;
    triggered = true;
    try{
      document.documentElement.innerHTML = '<body style="margin:0;background:#050507;color:#e8e8e6;display:grid;place-items:center;height:100vh;font-family:Inter,system-ui,sans-serif;text-align:center;padding:24px;"><div><div style="font-family:Cormorant Garamond,serif;letter-spacing:0.18em;color:#fff;text-shadow:0 0 8px rgba(255,255,255,0.35);font-size:1.1rem;">LONESTAR</div><div style="margin-top:10px;color:#9a9aa0;font-size:0.9rem;letter-spacing:0.06em;">DevTools is disabled on this sanctuary.</div><div style="margin-top:14px;"><a href="./" style="color:#fff;border:1px solid rgba(255,255,255,0.14);padding:8px 14px;border-radius:999px;text-decoration:none;font-size:0.72rem;letter-spacing:0.12em;">Return</a></div></div></body>';
      // stop further JS
      window.stop && window.stop();
    }catch{}
  }

  // size-based detection (check every 800ms)
  setInterval(()=>{
    const wDiff = Math.abs(window.outerWidth - window.innerWidth);
    const hDiff = Math.abs(window.outerHeight - window.innerHeight);
    // threshold 160 covers docked devtools
    if((wDiff > 160 || hDiff > 160) && !triggered){
      // extra check: devtools open often makes inner size much smaller
      if(window.outerWidth && window.innerWidth && hDiff > 120){
        block();
      }
    }
  }, 800);

  // debugger timing trap (when devtools open, debugger pauses longer)
  setInterval(()=>{
    const start = performance.now();
    debugger;
    const elapsed = performance.now() - start;
    if(elapsed > 120 && !triggered){
      block();
    }
  }, 1500);

  // also block view-source via location
  if(location.protocol === 'view-source:'){
    location.replace('./');
  }
})();
