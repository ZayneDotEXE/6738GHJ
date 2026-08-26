/**
 * js/background.js — Cinematic background loader
 * Supports JPG/JPEG/PNG/WebP/GIF/MP4/WebM with fallback, overlay, vignette-safe
 * Lazy, cleans up previous video, never shows broken media.
 */

const Background = (() => {
  let currentVideo = null;
  let currentImg = null;

  function isVideoType(type) {
    return type === "video" || type === "mp4" || type === "webm";
  }
  function isGifType(type, src) {
    return type === "gif" || (src && src.toLowerCase().endsWith(".gif"));
  }
  function extType(src) {
    const s = (src || "").toLowerCase();
    if (s.endsWith(".mp4") || s.endsWith(".webm") || s.endsWith(".mov")) return "video";
    if (s.endsWith(".gif")) return "gif";
    return "image";
  }

  /**
   * Load background into container (expects .bg-media child with img/video)
   * @param {HTMLElement} container - .bg-media or wrapper
   * @param {{src:string, type?:string, fallback?:string}} opts
   * @returns {{kind:string, el:HTMLElement}}
   */
  function load(container, opts) {
    const src = opts.src;
    const type = (opts.type || extType(src)).toLowerCase();
    const fallback = opts.fallback || "";
    if (!container) return null;

    // Cleanup previous
    _cleanup(container);

    const overlay = container.parentElement?.querySelector(".background-overlay");

    if (isVideoType(type)) {
      return _loadVideo(container, src, fallback);
    } else {
      // gif / image / webp / png / jpg
      return _loadImage(container, src, fallback, isGifType(type, src));
    }
  }

  function _loadImage(container, src, fallback, isGif) {
    const img = container.querySelector("img") || document.createElement("img");
    img.alt = "";
    img.loading = "eager";
    img.decoding = "async";
    img.style.cssText = "width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity 0.6s ease;";
    if (!img.parentElement) container.appendChild(img);
    currentImg = img;

    const trySrc = (url, isFallback) => {
      img.onerror = () => {
        if (!isFallback && fallback) {
          console.warn("[bg] image failed, trying fallback:", fallback);
          trySrc(fallback, true);
        } else if (!isFallback) {
          // default site bg
          img.src = "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1920&q=80&auto=format&fit=crop";
          img.style.opacity = "0.62";
        } else {
          img.style.display = "none";
        }
      };
      img.onload = () => { img.style.opacity = isGif ? "0.72" : "0.62"; };
      img.src = url;
    };
    trySrc(src, false);
    container.querySelector("video")?.style.setProperty("display", "none");
    img.style.display = "block";
    return { kind: "image", el: img };
  }

  function _loadVideo(container, src, fallback) {
    let video = container.querySelector("video");
    if (!video) {
      video = document.createElement("video");
      container.appendChild(video);
    }
    currentVideo = video;
    video.autoplay = true;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    // important for GitHub Pages / mobile
    video.setAttribute("autoplay", "");
    video.setAttribute("muted", "");
    video.setAttribute("loop", "");
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    video.preload = "metadata";
    video.style.cssText = "width:100%;height:100%;object-fit:cover;display:block;opacity:0;transition:opacity 0.6s ease;";
    video.controls = false;
    video.disablePictureInPicture = true;

    // hide img
    const img = container.querySelector("img");
    if (img) img.style.display = "none";

    video.onerror = () => {
      console.warn("[bg] video failed, fallback to image");
      video.style.display = "none";
      if (fallback) {
        _loadImage(container, fallback, "", false);
      } else {
        _loadImage(container, "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=1920&q=80&auto=format&fit=crop", "", false);
      }
    };
    video.oncanplay = () => {
      video.style.opacity = "0.62";
      video.play().catch(() => {
        // autoplay may be blocked — still show poster frame
        video.style.opacity = "0.62";
      });
    };
    // Ensure loop via native attribute; also JS fallback
    video.onended = () => { video.currentTime = 0; video.play().catch(()=>{}); };

    // If src is remote mp4, set directly; if local asset missing, error will trigger fallback
    video.src = src;
    video.load();
    return { kind: "video", el: video };
  }

  function _cleanup(container) {
    if (currentVideo) {
      try { currentVideo.pause(); currentVideo.removeAttribute("src"); currentVideo.load(); } catch {}
      currentVideo.style.display = "none";
    }
  }

  function setOverlayOpacity(overlayEl, darkness01) {
    // darkness 0-100 → a1 0.22-0.62, a2 0.48-0.80
    const a1 = (0.22 + darkness01 * 0.004).toFixed(2);
    const a2 = (0.48 + darkness01 * 0.0032).toFixed(2);
    if (overlayEl) overlayEl.style.background = `linear-gradient(rgba(0,0,0,${a1}), rgba(0,0,0,${a2}))`;
  }

  // Parallax on mouse (subtle, cinematic)
  function enableParallax(bgMediaEl) {
    let raf = 0;
    window.addEventListener("mousemove", (e) => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const x = (e.clientX / window.innerWidth - 0.5) * 18;
        const y = (e.clientY / window.innerHeight - 0.5) * 12;
        bgMediaEl.style.transform = `translate3d(${x}px, ${y}px, 0) scale(1.04)`;
      });
    }, { passive: true });
  }

  return { load, setOverlayOpacity, enableParallax };
})();

if (typeof window !== "undefined") window.Background = Background;
