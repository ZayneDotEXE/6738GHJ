/* js/profile.js — Dynamic profile from ?id= — Discord + bio typing + BG + music + socials */

const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];

function toast(msg, isError=false){
  const el=$("#toast");
  if(!el) return;
  el.textContent=msg;
  el.style.background=isError?"rgba(18,10,10,0.72)":"rgba(10,10,14,0.68)";
  el.style.borderColor=isError?"rgba(255,90,90,0.22)":"rgba(255,255,255,0.10)";
  el.style.color=isError?"#ffcfcf":"#e8e8e6";
  el.classList.add("show");
  clearTimeout(toast._t);
  toast._t=setTimeout(()=>el.classList.remove("show"),2600);
}
window.toast=toast;
function escapeHtml(s){ return String(s).replace(/[&<>"']/g, m=> ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function qp(name){ return new URLSearchParams(location.search).get(name); }

// Glow cursor + particles (reuse)
(function initFX(){
  const glow=$("#cursorGlow");
  let raf=0, mx=0,my=0,gx=0,gy=0;
  window.addEventListener("mousemove", e=>{
    mx=e.clientX; my=e.clientY;
    if(!raf) raf=requestAnimationFrame(function tick(){
      raf=0; gx+=(mx-gx)*0.07; gy+=(my-gy)*0.07;
      if(glow){ glow.style.left=gx+"px"; glow.style.top=gy+"px"; glow.style.opacity="1"; }
      $$(".edge-light").forEach(el=>{
        const r=el.getBoundingClientRect();
        el.style.setProperty("--mx",(mx-r.left)+"px");
      });
      if(Math.hypot(mx-gx,my-gy)>0.5) raf=requestAnimationFrame(tick);
    });
  }, {passive:true});
   const c=$("#particles");
  if(c && !matchMedia("(prefers-reduced-motion: reduce)").matches){
    for(let i=0;i<28;i++){
      const p=document.createElement("span");
      p.className="particle";
      p.style.left=(Math.random()*100)+"%";
      p.style.animation=`floatY ${16+Math.random()*12}s linear ${Math.random()*6}s infinite`;
      p.style.opacity=(0.18+Math.random()*0.3).toFixed(2);
      const sz=1+Math.random()*2;
      p.style.width=sz+"px"; p.style.height=sz+"px";
      c.appendChild(p);
    }
  }
})();

// Typing bio
function typeBio(el, text, speed=22, delay=180){
  if(!el) return;
  el.textContent="";
  let i=0;
  const cursor=document.createElement("span");
  cursor.className="typing-cursor";
  function step(){
    el.textContent = text.slice(0,i);
    el.appendChild(cursor);
    if(i < text.length){
      i++;
      const jitter = Math.random()*18;
      setTimeout(step, speed + jitter);
    } else {
      setTimeout(()=> cursor.style.opacity="0", 900);
    }
  }
  setTimeout(step, delay);
}

async function fetchMembers(){
  const urls=["./data/members.json","data/members.json"];
  for(const u of urls){
    try{ const r=await fetch(u, {cache:"no-store"}); if(!r.ok) continue; return await r.json(); }catch{}
  }
  throw new Error("Cannot load data/members.json");
}

function renderSocials(links){
  const grid=$("#socials");
  const no=$("#noSocials");
  if(!grid) return;
  const MAP = {
    instagram: { label:"Instagram", icon:"◎" },
    tiktok: { label:"TikTok", icon:"♪" },
    github: { label:"GitHub", icon:"⌖" },
    youtube: { label:"YouTube", icon:"▶" },
    twitter: { label:"X / Twitter", icon:"𝕏" },
    x: { label:"X", icon:"𝕏" },
    website: { label:"Website", icon:"↗" },
    custom: { label:"Link", icon:"↗" }
  };
  const entries = Object.entries(links||{}).filter(([,v])=> typeof v==="string" && v.trim() );
  // sanitize URLs
  const safe = entries.filter(([,v])=>{
    try{ const u=new URL(v); return u.protocol==="http:"||u.protocol==="https:"; }catch{ return false; }
  });
  if(!safe.length){
    grid.innerHTML="";
    grid.style.display="none";
    if(no) no.style.display="block";
    return;
  }
  grid.style.display="flex";
  if(no) no.style.display="none";
  grid.innerHTML = safe.map(([k,v])=>{
    const meta=MAP[k.toLowerCase()]||{label:k, icon:"↗"};
    const href=escapeHtml(v);
    const label=escapeHtml(meta.label);
    return `<a class="social-pill" href="${href}" target="_blank" rel="noopener noreferrer"><i></i> ${label} <span style="opacity:0.62; font-weight:400;">↗</span></a>`;
  }).join("");
}

function initMusic(entry, discord){
  const src = entry.music || "";
  if(!src) return;
  // background-only: loop, auto-play after any gesture, no visible controls
  try{
    window.Music.load(src, { autoplay:false });
    // try immediate if already interacted, otherwise wait for first click/touch
    const tryPlay = ()=> window.Music.play().catch(()=>{});
    if(window.Music.hasInteracted()){
      tryPlay();
    } else {
      const once = ()=>{ window.Music.setInteract(); tryPlay(); document.removeEventListener("click", once); document.removeEventListener("touchstart", once); };
      document.addEventListener("click", once, {once:true});
      document.addEventListener("touchstart", once, {once:true});
      // also try after 600ms if user already clicked Enter on previous page (interact persisted via Music singleton)
      setTimeout(()=>{ if(window.Music.hasInteracted()) tryPlay(); }, 600);
    }
  }catch{}
}

function getAllParams(){
  const p = new URLSearchParams(location.search);
  const byId = (p.get("id")||"").trim();
  const byUser = (p.get("username")||p.get("u")||p.get("user")||p.get("name")||"").trim();
  // clean URL: /@_lowquality or /@ZAYNE or /6738GHJ/@_lowquality
  let clean = "";
  const path = location.pathname;
  const atIdx = path.indexOf("/@");
  if(atIdx !== -1){
    clean = decodeURIComponent(path.slice(atIdx+2).split("/")[0].split("?")[0].split("#")[0]).trim();
  }
  return { byId, byUser: byUser || clean };
}

async function boot(){
  const loading=$("#loading"), sanctuary=$("#sanctuary"), errorPanel=$("#errorPanel"), hero=$("#hero");
  try{
    const data = await fetchMembers();
    const members = Array.isArray(data.members)? data.members : Array.isArray(data)? data : [];
    const { byId, byUser } = getAllParams();
    let id = byId;
    let entry = null;
    // 1) direct id
    if(id && window.DiscordAPI.isValidSnowflake(id)){
      entry = members.find(m=> String(m.discordId).trim()===id);
    }
    // 2) username / display name (case-insensitive) -> find entry via MOCK_USERS or live lookup
    if(!entry && byUser){
      const want = byUser.toLowerCase();
      // try to find in members via mock username/displayName
      for(const m of members){
        const mock = (window.DiscordAPI && window.DiscordAPI.BADGE_META) ? null : null; // keep reference
        // we need to check via MOCK_USERS if available, else will fetch later
        const mid = String(m.discordId);
        // try mock first (instant)
        try{
          const mockUser = (typeof MOCK_USERS !== 'undefined' && MOCK_USERS[mid]) ? MOCK_USERS[mid] : null;
          if(mockUser){
            if((mockUser.username||"").toLowerCase()===want || (mockUser.displayName||"").toLowerCase()===want){
              entry = m; id = mid; break;
            }
          }
        }catch{}
      }
      // if not found via mock, try live: fetch all and match (fallback, may be slower)
      if(!entry){
        // try to match by live Discord fetch for each member (first match)
        for(const m of members){
          try{
            const u = await window.DiscordAPI.getDiscordUser(String(m.discordId));
            if((u.username||"").toLowerCase()===want || (u.displayName||"").toLowerCase()===want){
              entry = m; id = String(m.discordId); break;
            }
          }catch{}
        }
      }
      if(!entry){
        throw Object.assign(new Error(`User "${byUser}" not in data/members.json — add their Discord ID` ), { code:"NOT_CONFIGURED" });
      }
    }
    if(!id){
      throw Object.assign(new Error(`Missing ?id= or ?username= — open via a member card`), { code:"INVALID_ID" });
    }
    if(!window.DiscordAPI.isValidSnowflake(id)){
      throw Object.assign(new Error(`Invalid Discord ID "${id}"`), { code:"INVALID_ID" });
    }
    // if we resolved via username, keep username in URL (user wants username in bar), else ensure entry found
    if(!entry) entry = members.find(m=> String(m.discordId).trim()===id);
    if(!entry){
      const user = await window.DiscordAPI.getDiscordUser(id);
      throw Object.assign(new Error(`ID ${id} not in data/members.json — add it to make it appear`), { code:"NOT_CONFIGURED", user });
    }
    // keep clean username in bar if accessed via username (already is), no need to replace

    // Resolve Discord
    const discord = await window.DiscordAPI.getDiscordUser(id);
    // BG
    const bgMedia=$("#bgMedia");
    const bgOpts = { src: entry.background || "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1920&q=80&auto=format&fit=crop", type: entry.backgroundType || "image", fallback: entry.backgroundFallback || "" };
    window.Background.load(bgMedia, bgOpts);
    window.Background.enableParallax(bgMedia.querySelector("img,video")||bgMedia);

    // Fill profile
    $("#avatar").src = discord.avatar;
    $("#avatar").onerror = function(){ this.src="https://cdn.discordapp.com/embed/avatars/0.png"; };
    $("#displayName").textContent = discord.displayName || discord.username;
    $("#username").textContent = `@${discord.username} · ID ${discord.id}`;
    $("#hierarchyLabel").textContent = (entry.hierarchy||"Member").toUpperCase();
    $("#did").textContent = discord.id;
    $("#hier").textContent = entry.hierarchy || "—";
    const t = $("#profileTitle");
    if(entry.profileTitle){ t.textContent = entry.profileTitle; t.style.display="inline-flex"; }
    else t.style.display="none";

    const badgesHtml = window.DiscordAPI.renderBadges(discord.badges||[]);
    $("#badges").innerHTML = badgesHtml || `<span class="badge" style="opacity:0.62;">No badges</span>`;
    // presence dot bottom-right — entry.presence overrides Discord (fixes Lanyard 404 -> offline)
    const dot = document.getElementById("presenceDot");
    if(dot){
      const raw = String(entry.presence || entry.status || discord.presence || "offline").toLowerCase();
      const s = raw === "invisible" ? "offline" : raw;
      const cls = ["online","idle","dnd","offline"].includes(s) ? s : "offline";
      dot.className = "presence-dot " + cls;
      dot.title = cls;
    }

    // Bio typing
    const bio = entry.bio || "No biography configured.";
    typeBio($("#bioText"), bio, 22, 280);

    renderSocials(entry.links);
    initMusic(entry, discord);

    // Copy handlers
    $("#copyId")?.addEventListener("click", async()=>{
      try{ await navigator.clipboard.writeText(id); toast("ID copied"); }catch{ toast(id); }
    });
    $("#copyLink")?.addEventListener("click", async()=>{
      const url = location.href;
      try{ await navigator.clipboard.writeText(url); toast("Profile link copied"); }catch{ toast(url); }
    });

    // Show sanctuary
    sanctuary.style.display="grid";
    errorPanel.style.display="none";
    document.title = `${discord.displayName} — LONESTAR`;

  }catch(err){
    console.warn("[profile]", err);
    sanctuary.style.display="grid";
    hero.style.display="none";
    $("#bioText").parentElement.style.display="none";
    $("#socials").parentElement.style.display="none";
    const ep=$("#errorPanel");
    ep.style.display="block";
    // If we have a fallback user from error, show minimal
    if(err.user){
      hero.style.display="flex";
      $("#avatar").src = err.user.avatar;
      $("#displayName").textContent = err.user.displayName;
      $("#username").textContent = `@${err.user.username} · ID ${err.user.id}`;
      $("#badges").innerHTML = window.DiscordAPI.renderBadges(err.user.badges||[]);
    }
    // Show reason inside error panel
    const p = ep.querySelector("p");
    if(p) p.textContent = err.message;
    toast(err.message, true);
    // still set BG fallback
    try{
      const bgMedia=$("#bgMedia");
      window.Background.load(bgMedia, { src:"https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1920&q=80&auto=format&fit=crop", type:"image", fallback:"" });
    }catch{}
  } finally {
    setTimeout(()=> loading?.classList.add("hidden"), 520);
  }
}

window.addEventListener("DOMContentLoaded", boot);
