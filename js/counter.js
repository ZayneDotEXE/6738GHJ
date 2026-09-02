const Counter = (() => {
  const NAMESPACE = "lonestar-modder-v1"; 
  const API = "https://abacus.jasoncameron.dev";

  function fmt(n){
    const v = Number(n) || 0;
    if(v >= 1000000) return (v/1000000).toFixed(1).replace(/\.0$/,'') + 'M';
    if(v >= 1000) return (v/1000).toFixed(1).replace(/\.0$/,'') + 'k';
    return String(v);
  }

  async function hit(key, el){
    const lsKey = `views:${NAMESPACE}:${key}`;

    try{
      const url = `${API}/hit/${encodeURIComponent(NAMESPACE)}/${encodeURIComponent(key)}`;
      const r = await fetch(url, { cache: "no-store" });
      if(!r.ok) throw new Error(`counter ${r.status}`);
      const j = await r.json();
      const val = j.value ?? j.count ?? j.data?.value;
      if(typeof val === "number"){
        localStorage.setItem(lsKey, String(val));
        if(el) el.textContent = el.id === "mainViews" ? fmt(val) : `${fmt(val)} views`;

        window.dispatchEvent(new CustomEvent("counter:hit", { detail: { key, value: val }}));
        return val;
      }
      throw new Error("no value");
    }catch(err){

      let v = parseInt(localStorage.getItem(lsKey) || "0", 10);
      v += 1;
      localStorage.setItem(lsKey, String(v));
      if(el) el.textContent = el.id === "mainViews" ? `${fmt(v)}` : `${fmt(v)} views • offline`;
      console.warn("[counter] remote failed, using local", err?.message || err);
      return v;
    }
  }

  async function get(key, el){
    try{
      const r = await fetch(`${API}/get/${encodeURIComponent(NAMESPACE)}/${encodeURIComponent(key)}`, { cache: "no-store" });
      if(r.ok){
        const j = await r.json();
        const val = j.value ?? j.count ?? 0;
        if(el) el.textContent = el.id === "mainViews" ? fmt(val) : `${fmt(val)} views`;
        return val;
      }
    }catch{}
    const v = parseInt(localStorage.getItem(`views:${NAMESPACE}:${key}`) || "0", 10);
    if(el) el.textContent = el.id === "mainViews" ? fmt(v) : `${fmt(v)} views • offline`;
    return v;
  }

  return { hit, get, NAMESPACE, fmt };
})();

if(typeof window !== "undefined"){
  window.Counter = Counter;
  document.addEventListener("DOMContentLoaded", ()=>{
    const isProfile = location.pathname.includes("profile.html") || location.pathname.includes("/@");
    if(isProfile){
      const mainEl = document.getElementById("mainViews");
      if(mainEl) Counter.get("main", mainEl);
      return;
    }
    const el = document.getElementById("mainViews");
    if(el) Counter.hit("main", el);
  });
}
