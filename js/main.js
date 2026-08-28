/* js/main.js — Homepage: hierarchy, Discord, background, music, cinematic FX */

const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];

const HIERARCHY_ORDER = ["Founder", "Godmother", "Sins", "Shits"];
const HIERARCHY_LABEL = {
  Founder: "Founder — Highest Prominence",
  Godmother: "Godmother — Distinct",
  Sins: "Sins — Member Collection",
  Shits: "Shits — Member Collection"
};

function toast(msg, isError=false) {
  const el = $("#toast");
  if (!el) return;
  el.textContent = msg;
  el.style.background = isError ? "rgba(18,10,10,0.72)" : "rgba(10,10,14,0.68)";
  el.style.borderColor = isError ? "rgba(255,90,90,0.22)" : "rgba(255,255,255,0.10)";
  el.style.color = isError ? "#ffcfcf" : "#e8e8e6";
  el.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(()=> el.classList.remove("show"), 2600);
}
window.toast = toast;

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, m=> ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

// Loading
window.addEventListener("load", () => setTimeout(()=> $("#loading")?.classList.add("hidden"), 650));

// Mouse glow + edge lighting
const glow = $("#cursorGlow");
let raf=0, mx=0, my=0, gx=0, gy=0, glowEnabled=true;
function onMove(e){
  mx=e.clientX; my=e.clientY;
  if(!raf) raf=requestAnimationFrame(tick);
  $$(".edge-light").forEach(el=>{
    const r=el.getBoundingClientRect();
    el.style.setProperty("--mx", (mx - r.left)+"px");
    el.style.setProperty("--my", (my - r.top)+"px");
  });
}
function tick(){
  raf=0;
  gx += (mx - gx)*0.07;
  gy += (my - gy)*0.07;
  if(glow){ glow.style.left=gx+"px"; glow.style.top=gy+"px"; glow.style.opacity=glowEnabled?"1":"0"; }
  if(glowEnabled && Math.hypot(mx-gx, my-gy)>0.5) raf=requestAnimationFrame(tick);
}
window.addEventListener("mousemove", onMove, {passive:true});
window.addEventListener("mouseenter", ()=> { if(glow) glow.style.opacity=glowEnabled?"1":"0"; });
window.addEventListener("mouseleave", ()=> { if(glow) glow.style.opacity="0"; });

// Particles — subtle floating haze
function spawnParticles(){
  const c = $("#particles");
  if(!c || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const n = 14;
  for(let i=0;i<n;i++){
    const p=document.createElement("span");
    p.className="particle";
    const left = Math.random()*100;
    const dur = 16 + Math.random()*14;
    const delay = Math.random()*8;
    const size = 1 + Math.random()*2.2;
    p.style.left=left+"%";
    p.style.width=size+"px"; p.style.height=size+"px";
    p.style.animation=`floatY ${dur}s linear ${delay}s infinite`;
    p.style.opacity=(0.22+Math.random()*0.35).toFixed(2);
    c.appendChild(p);
  }
}
spawnParticles();

// Background: homepage from site config
async function initHomepageBG(site){
  const bgMedia = $("#bgMedia");
  if(!bgMedia) return;
  const src = site?.homepageBackground || "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1920&q=80&auto=format&fit=crop";
  const type = site?.homepageBackgroundType || "image";
  const fallback = site?.homepageBackgroundFallback || "";
  window.Background.load(bgMedia, { src, type, fallback });
  window.Background.enableParallax(bgMedia.querySelector("img, video") || bgMedia);
}

// Music homepage — enter experience unlocks
let __siteMusic = null;
function syncPlayUI(){
  const playBtn=$("#playBtn"), viz=$("#viz");
  if(!playBtn || !viz) return;
  try{
    const playing = window.Music.isPlaying();
    playBtn.textContent = playing ? "❚❚" : "▶";
    playBtn.style.fontSize = playing ? "0.68rem" : "0.78rem";
    viz.style.display = playing ? "flex" : "none";
  }catch{}
}
function dismissSplash(){
  const overlay = document.getElementById("enterOverlay");
  if(!overlay || overlay.dataset.dismissed==="1") return;
  overlay.dataset.dismissed="1";
  try{ window.Music.setInteract(); }catch{}
  overlay.style.opacity="0";
  overlay.style.visibility="hidden";
  overlay.style.pointerEvents="none";
  let done=false;
  const hide = ()=>{ if(done) return; done=true; overlay.style.display="none"; overlay.setAttribute("aria-hidden","true"); document.body.style.overflow=""; };
  overlay.addEventListener("transitionend", hide, {once:true});
  setTimeout(hide, 780);
  // try to play site music if available
  if(__siteMusic){
    try{
      window.Music.load(__siteMusic, {autoplay:true});
      window.Music.play().then(syncPlayUI).catch(()=>syncPlayUI());
    }catch{ syncPlayUI(); }
  } else {
    syncPlayUI();
  }
}
// attach immediately — not after fetch (fixes click not working before data loads)
(function initSplashEarly(){
  const attach = ()=>{
    const btn=document.getElementById("enterBtn");
    if(btn && !btn.dataset.bound){
      btn.dataset.bound="1";
      btn.addEventListener("click", (e)=>{ e.preventDefault(); dismissSplash(); });
    }
  };
  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded", attach);
  } else {
    attach();
  }
  // also observe in case button is re-rendered
  setTimeout(attach, 300);
  setTimeout(attach, 1000);
  document.addEventListener("keydown", (e)=>{
    if(e.key==="Enter"){
      const ov=document.getElementById("enterOverlay");
      if(ov && ov.dataset.dismissed!=="1" && getComputedStyle(ov).display!=="none") dismissSplash();
    }
  });
})();

function initHomepageMusic(site){
  __siteMusic = site?.homepageMusic || null;
  // background-only: preload silently, no UI
  if(__siteMusic){
    try{ window.Music.load(__siteMusic, { autoplay:false }); }catch{}
  }
}

// Fetch members.json repo-relative
async function fetchMembers(){
  const urls = ["./data/members.json", "data/members.json", "/data/members.json"];
  for(const u of urls){
    try{
      const r = await fetch(u, { cache:"no-store" });
      if(!r.ok) continue;
      const j = await r.json();
      return j;
    }catch{}
  }
  throw new Error("Cannot load data/members.json — check path for GitHub Pages (must be ./data/members.json)");
}

// Render hierarchy in strict order
function tierContainer(hierarchy, members){
  const count = members.length;
  const label = HIERARCHY_LABEL[hierarchy] || hierarchy;
  const section = document.createElement("section");
  section.className="tier reveal";
  section.dataset.hierarchy=hierarchy;
  section.innerHTML = `
    <div class="tier-label">
      <h3>${escapeHtml(hierarchy)}</h3>
      <div class="tier-line"></div>
      <span class="tier-count">${count} ${count===1?"Member":"Members"} · ${escapeHtml(label)}</span>
    </div>
    <div class="members" id="tier-${hierarchy}"></div>
  `;
  return section;
}

function memberCardHTML(entry, discord){
  const name = escapeHtml(discord.displayName || discord.username || "Unknown");
  const uname = escapeHtml(discord.username || "unknown");
  const hierarchy = escapeHtml(entry.hierarchy || "");
  const avatar = escapeHtml(discord.avatar);
  const badges = window.DiscordAPI.renderBadges(discord.badges || []);
  const id = escapeHtml(entry.discordId);
  const title = escapeHtml(entry.profileTitle || "");
  const hasMusic = !!entry.music;
  const rawPres = String(entry.presence || entry.status || discord.presence || "offline").toLowerCase();
  const pres = rawPres === "invisible" ? "offline" : rawPres;
  const pcls = ["online","idle","dnd","offline"].includes(pres) ? pres : "offline";
  return `
    <article class="member-card glass ${hierarchy==="Founder"?"glass-strong":hierarchy==="Godmother"?"glass":"glass-subtle"} glass-hover edge-light" data-id="${id}" data-username="${uname}" role="link" tabindex="0" aria-label="Open profile ${name}">
      <div class="member-top">
        <div class="member-avatar-wrap">
          <img class="member-avatar" src="${avatar}" alt="${name}" loading="lazy" onerror="this.src='https://cdn.discordapp.com/embed/avatars/0.png'" />
          <span class="presence-dot ${pcls}" title="${pcls}"></span>
        </div>
        <div style="min-width:0; flex:1;">
          <div class="member-name">${name}</div>
          <div class="member-role">@${uname} · ${hierarchy}${title?` · ${title}`:""}</div>
        </div>
      </div>
      <div class="badges" style="margin-top:10px;">${badges || `<span class="badge" style="opacity:0.62;">No badges</span>`}</div>
      <div class="member-foot">
        <span class="member-tag">${hierarchy}</span>
        <span class="text-dim" style="font-size:0.70rem;">${hasMusic?"♫":""} ↗</span>
      </div>
    </article>
  `;
}

async function buildHierarchy(data){
  const members = Array.isArray(data.members) ? data.members : Array.isArray(data) ? data : [];
  const site = data.site || {};
  const root = $("#tiersRoot");
  const statusText = $("#statusText");
  const memberCount = $("#memberCount");
  const empty = $("#emptyState");

  if(!members.length){
    root.innerHTML = `<div class="glass" style="padding:18px; border-radius:14px; text-align:center; color:#9a9aa0;">No members configured. Add Discord IDs to <code>data/members.json</code>.</div>`;
    statusText.textContent = "No members";
    memberCount.textContent = "0 members";
    return { site, members };
  }

  // Validate hierarchy values
  const valid = new Set(HIERARCHY_ORDER);
  const normalized = members.map(m=> ({...m, hierarchy: valid.has(m.hierarchy)?m.hierarchy:"Shits"}));

  // Group by hierarchy in order
  const groups = HIERARCHY_ORDER.map(h=> [h, normalized.filter(m=> m.hierarchy===h)]);

  // Render skeletons first (for perceived performance, lazy)
  root.innerHTML="";
  for(const [h, list] of groups){
    if(!list.length) continue;
    const sec = tierContainer(h, list);
    root.appendChild(sec);
  }

  // Update counts
  const total = members.length;
  memberCount.textContent = `${total} ${total===1?"member":"members"}`;
  statusText.textContent = `Resolving ${total} Discord profiles…`;

  // Resolve Discord in parallel per tier but with error isolation per member
  let resolved = 0;
  for(const [h, list] of groups){
    const grid = document.getElementById(`tier-${h}`);
    if(!grid) continue;
    // Create placeholders
    grid.innerHTML = list.map(()=> `<div class="member-card glass" style="min-height:118px; display:grid; place-items:center; opacity:0.62;"><span class="loader-ring" style="width:22px;height:22px;border-width:2px;"></span></div>`).join("");
    // Fetch each Discord user
    const cards = await Promise.all(list.map(async (entry)=>{
      const id = String(entry.discordId||"").trim();
      if(!window.DiscordAPI.isValidSnowflake(id)){
        return `<div class="member-card glass" style="border-color:rgba(255,90,90,0.22);"><div class="member-name" style="color:#ff9a9a;">Invalid ID</div><div class="text-dim" style="font-size:0.72rem; margin-top:6px;">${escapeHtml(id||"(empty)")} — must be 17-22 digit snowflake</div></div>`;
      }
      try{
        const user = await window.DiscordAPI.getDiscordUser(id);
        resolved++;
        statusText.textContent = `Resolved ${resolved}/${total}…`;
        return memberCardHTML(entry, user);
      }catch(err){
        console.warn("Discord resolve failed", id, err);
        // graceful fallback still shows card with mock
        const fallback = { displayName:"Unknown Identity", username:"unknown", avatar:"https://cdn.discordapp.com/embed/avatars/0.png", badges:[] };
        return memberCardHTML(entry, fallback);
      }
    }));
    grid.innerHTML = cards.join("");
    // Attach navigation
    [...grid.children].forEach(card=>{
      const id = card.getAttribute("data-id");
      const uname = card.getAttribute("data-username");
      if(!id) return;
      const go = ()=> { window.Music.stop();
        // username in URL as requested: ?username=_lowquality, ?u=ZAYNE, and clean /@... handled in profile.js + 404.html
        const target = uname ? `./profile.html?username=${encodeURIComponent(uname)}` : `./profile.html?id=${encodeURIComponent(id)}`;
        location.href = target;
      };
      card.addEventListener("click", go);
      card.addEventListener("keydown", e=> { if(e.key==="Enter"||e.key===" "){ e.preventDefault(); go(); } });
    });
  }

  statusText.textContent = `Ready — ${resolved} profiles`;
  if(empty) empty.style.display = members.length ? "none" : "block";

  // Reveal observer
  const obs = new IntersectionObserver(es=>{
    es.forEach(e=> { if(e.isIntersecting) e.target.classList.add("in"); });
  }, { threshold:0.12 });
  $$(".reveal").forEach(el=> obs.observe(el));
  // Trigger immediate for above-fold
  setTimeout(()=> $$(".reveal").forEach(el=> el.classList.add("in")), 120);

  document.getElementById("siteTagline") && (document.getElementById("siteTagline").textContent = site.tagline || document.getElementById("siteTagline").textContent);

  return { site, members };
}

// Explore button smooth scroll
$("#exploreBtn")?.addEventListener("click", e=>{
  e.preventDefault();
  $("#hierarchy")?.scrollIntoView({behavior:"smooth", block:"start"});
});

// Boot
(async ()=>{
  try{
    const data = await fetchMembers();
    const { site } = await buildHierarchy(data);
    initHomepageBG(site);
    initHomepageMusic(site);
  }catch(err){
    console.error(err);
    $("#tiersRoot").innerHTML = `<div class="glass" style="padding:18px; border-radius:14px; border-color:rgba(255,90,90,0.22);"><div style="color:#ff9a9a; font-weight:600;">Failed to load members</div><div class="text-dim" style="font-size:0.82rem; margin-top:6px;">${escapeHtml(err.message)}</div><pre style="margin-top:10px; overflow:auto; background:rgba(0,0,0,0.32); padding:10px; border-radius:10px; font-size:0.72rem;">${escapeHtml(String(err.stack||err))}</pre></div>`;
    toast("Load error — see console", true);
  } finally {
    // hide loading
    setTimeout(()=> $("#loading")?.classList.add("hidden"), 400);
  }
})();
