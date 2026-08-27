/**
 * js/counter.js — View counters for GitHub Pages (no backend)
 * Uses abacus.jasoncameron.dev (CORS *) with localStorage fallback
 * Main page: hit("main") -> #mainViews
 * Profile: hit("profile-<discordId>") -> #profileViews
 * Namespace is fixed so counts persist across deploys. Change to reset.
 */
const Counter = (() => {
  const NAMESPACE = "lonestar-modder-v1"; // change to reset all counts
  const API = "https://abacus.jasoncameron.dev";

  function fmt(n){
    const v = Number(n) || 0;
    if(v >= 1000000) return (v/1000000).toFixed(1).replace(/\.0$/,'') + 'M';
    if(v >= 1000) return (v/1000).toFixed(1).replace(/\.0$/,'') + 'k';
    return String(v);
  }

  async function hit(key, el){
    const lsKey = `views:${NAMESPACE}:${key}`;
    // try remote abacus
    try{
      const url = `${API}/hit/${encodeURIComponent(NAMESPACE)}/${encodeURIComponent(key)}`;
      const r = await fetch(url, { cache: "no-store" });
      if(!r.ok) throw new Error(`counter ${r.status}`);
      const j = await r.json();
      const val = j.value ?? j.count ?? j.data?.value;
      if(typeof val === "number"){
        localStorage.setItem(lsKey, String(val));
        if(el) el.textContent = el.id === "mainViews" ? fmt(val) : `${fmt(val)} views`;
        // also dispatch event
        window.dispatchEvent(new CustomEvent("counter:hit", { detail: { key, value: val }}));
        return val;
      }
      throw new Error("no value");
    }catch(err){
      // fallback: localStorage increment (per-browser, still shows something)
      let v = parseInt(localStorage.getItem(lsKey) || "0", 10);
      v += 1;
      localStorage.setItem(lsKey, String(v));
      if(el) el.textContent = el.id === "mainViews" ? `${fmt(v)}` : `${fmt(v)} views • offline`;
      console.warn("[counter] remote failed, using local", err?.message || err);
      return v;
    }
  }

  async function get(key, el){
    // read without increment (uses abacus get)
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
  // auto-hit based on page
  document.addEventListener("DOMContentLoaded", ()=>{
    const isProfile = location.pathname.includes("profile.html");
    if(isProfile){
      const id = new URLSearchParams(location.search).get("id");
      const el = document.getElementById("profileViews");
      if(id) Counter.hit(`profile-${id}`, el);
      // also show main views read-only on profile
      const mainEl = document.getElementById("mainViews");
      if(mainEl) Counter.get("main", mainEl);
    } else {
      const el = document.getElementById("mainViews");
      if(el) Counter.hit("main", el);
    }
  });
}
