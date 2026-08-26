/**
 * js/discord.js — Secure Discord abstraction for GitHub Pages
 * -----------------------------------------------------------
 * Architecture (never expose secrets in frontend):
 *   GitHub Pages Frontend → Secure Serverless/API Endpoint → Discord API → Website
 *
 * 1) Create a private Serverless endpoint (Vercel / Cloudflare Workers / Netlify Functions)
 *    that holds your BOT_TOKEN or OAuth secret server-side.
 * 2) Endpoint should expose GET /api/discord/user/:id returning { id, username, displayName, avatar, banner, badges, flags }
 * 3) Set DISCORD_API_ENDPOINT below to your deployed URL. Leave empty for demo/fallback mode.
 *
 * Frontend contains ZERO secrets. No base64, no obfuscation — just a public fetch to your endpoint.
 * If endpoint is not configured, graceful mock fallback ensures site never breaks.
 */

const DISCORD_CONFIG = {
  // >>> SET THIS TO YOUR SERVERLESS URL e.g. "https://your-worker.workers.dev"
  // Keep empty for demo mode (no secret needed, uses mock + CDN patterns).
  apiEndpoint: "",

  // Optional: cache TTL ms (5 min)
  cacheTtlMs: 5 * 60 * 1000,

  // Fallback CDN for avatar when API unavailable (DiceBear or Discord default)
  fallbackAvatar: (id) => `https://cdn.discordapp.com/embed/avatars/${Number(BigInt(id) % 5n)}.png`
};

/** Mock dataset — real LONESTAR Discord IDs. Live Discord data will override these when apiEndpoint is set. */
const MOCK_USERS = {
  // Founder
  "575999868804399119": {
    id: "575999868804399119",
    username: "lonestar.founder",
    displayName: "LONESTAR FOUNDER",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=320&q=80&auto=format&fit=crop",
    banner: null,
    avatarDecoration: null,
    badges: ["HOUSE_BRAVERY", "EARLY_SUPPORTER"],
    accentColor: null
  },
  // Godmother
  "641532736024215553": {
    id: "641532736024215553",
    username: "nocturnalxx1",
    displayName: "notyouraxtxm",
    avatar: "https://cdn.discordapp.com/avatars/641532736024215553/2595e16f01965c92eeb15d22995cf525.png?size=256",
    banner: null,
    avatarDecoration: null,
    badges: ["HOUSE_BRILLIANCE", "NITRO"],
    accentColor: null
  },
  "863299682045132800": {
    id: "863299682045132800",
    username: "lonestar.godmother",
    displayName: "LONESTAR GODMOTHER",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=320&q=80&auto=format&fit=crop",
    banner: null,
    badges: ["HOUSE_BRILLIANCE"],
    accentColor: null
  },
  // Sins
  "744471375208775722": {
    id: "744471375208775722",
    username: "lonestar.sin1",
    displayName: "SIN — 7444",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=320&q=80&auto=format&fit=crop",
    banner: null,
    badges: ["ACTIVE_DEVELOPER"],
    accentColor: null
  },
  "453997598077091842": {
    id: "453997598077091842",
    username: "lonestar.sin2",
    displayName: "SIN — 4539",
    avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=320&q=80&auto=format&fit=crop",
    banner: null,
    badges: [],
    accentColor: null
  },
  "776121152299991061": {
    id: "776121152299991061",
    username: "lonestar.sin3",
    displayName: "SIN — 7761",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=320&q=80&auto=format&fit=crop",
    banner: null,
    badges: ["HOUSE_BRAVERY"],
    accentColor: null
  },
  "996787931974996129": {
    id: "996787931974996129",
    username: "lonestar.sin4",
    displayName: "SIN — 9967",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=320&q=80&auto=format&fit=crop",
    banner: null,
    badges: [],
    accentColor: null
  },
  "746710459859861524": {
    id: "746710459859861524",
    username: "lonestar.sin5",
    displayName: "SIN — 7467",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=320&q=80&auto=format&fit=crop",
    banner: null,
    badges: [],
    accentColor: null
  },
  "976341248984100915": {
    id: "976341248984100915",
    username: "lonestar.sin6",
    displayName: "SIN — 9763",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=320&q=80&auto=format&fit=crop",
    banner: null,
    badges: ["HOUSE_BALANCE"],
    accentColor: null
  },
  // Shits
  "1126909367028031488": {
    id: "1126909367028031488",
    username: "lonestar.shit1",
    displayName: "SHIT — 1126",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=320&q=80&auto=format&fit=crop",
    banner: null,
    badges: [],
    accentColor: null
  },
  "1375842523456471050": {
    id: "1375842523456471050",
    username: "lonestar.shit2",
    displayName: "SHIT — 1375",
    avatar: "https://images.unsplash.com/photo-1521119989659-a83eee488004?w=320&q=80&auto=format&fit=crop",
    banner: null,
    badges: [],
    accentColor: null
  },
  "941726919068647425": {
    id: "941726919068647425",
    username: "lonestar.shit3",
    displayName: "SHIT — 9417",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=320&q=80&auto=format&fit=crop",
    banner: null,
    badges: [],
    accentColor: null
  },
  "709422905045417985": {
    id: "709422905045417985",
    username: "lonestar.shit4",
    displayName: "SHIT — 7094",
    avatar: "https://images.unsplash.com/photo-1544725121-be3bf52e2dc8?w=320&q=80&auto=format&fit=crop",
    banner: null,
    badges: [],
    accentColor: null
  },
  "681133772879822860": {
    id: "681133772879822860",
    username: "lonestar.shit5",
    displayName: "SHIT — 6811",
    avatar: "https://images.unsplash.com/photo-1519345182560-3f2917c47231?w=320&q=80&auto=format&fit=crop",
    banner: null,
    badges: [],
    accentColor: null
  }
};

/** Badge metadata for rendering */
const BADGE_META = {
  STAFF: { label: "Staff", icon: "✦" },
  PARTNER: { label: "Partner", icon: "◆" },
  HYPESQUAD: { label: "HypeSquad", icon: "⬢" },
  BUG_HUNTER_LEVEL_1: { label: "Bug Hunter", icon: "◈" },
  BUG_HUNTER_LEVEL_2: { label: "Bug Hunter Gold", icon: "⬣" },
  HYPESQUAD_ONLINE_HOUSE_1: { label: "Bravery", icon: "♜" },
  HYPESQUAD_ONLINE_HOUSE_2: { label: "Brilliance", icon: "♛" },
  HYPESQUAD_ONLINE_HOUSE_3: { label: "Balance", icon: "♞" },
  HOUSE_BRAVERY: { label: "Bravery", icon: "♜" },
  HOUSE_BRILLIANCE: { label: "Brilliance", icon: "♛" },
  HOUSE_BALANCE: { label: "Balance", icon: "♞" },
  PREMIUM_EARLY_SUPPORTER: { label: "Early Supporter", icon: "✧" },
  EARLY_SUPPORTER: { label: "Early Supporter", icon: "✧" },
  TEAM_PSEUDO_USER: { label: "Team", icon: "⚑" },
  VERIFIED_BOT: { label: "Verified Bot", icon: "✓" },
  VERIFIED_DEVELOPER: { label: "Verified Dev", icon: "⌖" },
  ACTIVE_DEVELOPER: { label: "Active Dev", icon: "⌖" },
  CERTIFIED_MODERATOR: { label: "Mod", icon: "♦" },
  NITRO: { label: "Nitro", icon: "⬥" }
};

const _cache = new Map();

function isValidSnowflake(id) {
  return typeof id === "string" && /^\d{17,22}$/.test(id);
}

function toDiscordCdnAvatarUrl(id, hash, ext = "png", size = 256) {
  if (!hash) return DISCORD_CONFIG.fallbackAvatar(id);
  const animated = hash.startsWith("a_");
  const fmt = animated ? "gif" : ext;
  return `https://cdn.discordapp.com/avatars/${id}/${hash}.${fmt}?size=${size}`;
}

function normalizeUser(raw, id) {
  if (!raw) return null;
  // Support both serverless shape and raw Discord API shape
  const avatarHash = raw.avatar ?? raw.avatarHash ?? null;
  const avatarUrl = raw.avatarUrl || (avatarHash ? toDiscordCdnAvatarUrl(id, avatarHash) : raw.avatar || MOCK_USERS[id]?.avatar || DISCORD_CONFIG.fallbackAvatar(id));
  const bannerUrl = raw.bannerUrl || raw.banner || null;
  return {
    id: String(raw.id || id),
    username: raw.username || raw.user?.username || "unknown",
    displayName: raw.displayName || raw.global_name || raw.display_name || raw.username || "Unknown",
    avatar: avatarUrl,
    banner: bannerUrl,
    avatarDecoration: raw.avatarDecoration || raw.avatar_decoration_data || null,
    badges: Array.isArray(raw.badges) ? raw.badges : Array.isArray(raw.flags) ? raw.flags : [],
    accentColor: raw.accentColor ?? raw.accent_color ?? null,
    raw
  };
}

/**
 * Main abstraction — rest of site calls only this.
 * @param {string} discordId
 * @returns {Promise<{id,username,displayName,avatar,banner,badges}|null>}
 */
async function getDiscordUser(discordId) {
  if (!isValidSnowflake(discordId)) {
    console.warn("[discord] invalid snowflake:", discordId);
    return _mockFallback(discordId);
  }
  const cached = _cache.get(discordId);
  if (cached && Date.now() - cached.t < DISCORD_CONFIG.cacheTtlMs) return cached.v;

  // 1) Try secure serverless endpoint if configured
  if (DISCORD_CONFIG.apiEndpoint) {
    try {
      const url = `${DISCORD_CONFIG.apiEndpoint.replace(/\/$/, "")}/api/discord/user/${encodeURIComponent(discordId)}`;
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(`Discord API ${res.status}`);
      const json = await res.json();
      const user = normalizeUser(json.data || json.user || json, discordId);
      if (user) {
        _cache.set(discordId, { v: user, t: Date.now() });
        return user;
      }
    } catch (err) {
      console.warn("[discord] endpoint failed, falling back:", err?.message || err);
    }
  }

  // 2) Mock fallback — never breaks site
  return _mockFallback(discordId);
}

function _mockFallback(id) {
  const mock = MOCK_USERS[id];
  if (mock) {
    _cache.set(id, { v: mock, t: Date.now() });
    return Promise.resolve(mock);
  }
  // Generic fallback for unknown IDs (so manual add never crashes)
  const generic = {
    id,
    username: "user_" + id.slice(-4),
    displayName: "Unknown Identity",
    avatar: DISCORD_CONFIG.fallbackAvatar(id),
    banner: null,
    avatarDecoration: null,
    badges: [],
    accentColor: null
  };
  _cache.set(id, { v: generic, t: Date.now() });
  return Promise.resolve(generic);
}

function renderBadges(badges) {
  if (!badges || !badges.length) return "";
  return badges.map(b => {
    const meta = BADGE_META[b] || { label: b.replace(/_/g, " "), icon: "●" };
    return `<span class="badge badge-discord" title="${meta.label}">${meta.icon} ${meta.label}</span>`;
  }).join("");
}

// Expose globally for non-module script loading (GitHub Pages simple)
if (typeof window !== "undefined") {
  window.DiscordAPI = { getDiscordUser, renderBadges, DISCORD_CONFIG, isValidSnowflake, BADGE_META };
}
// ES module export (if loaded as module)
try { if (typeof module !== "undefined") module.exports = { getDiscordUser }; } catch {}
