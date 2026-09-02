const Music = (() => {
  let audio = null;
  let currentSrc = "";
  let onProgress = null;
  let progressTimer = 0;
  let isInteracted = false;

  function ensureAudio() {
    if (audio) return audio;
    audio = new Audio();
    audio.preload = "metadata";
    audio.loop = true;
    audio.volume = 0.52;
    audio.addEventListener("play", () => _startProgress());
    audio.addEventListener("pause", () => _stopProgress());
    audio.addEventListener("ended", () => _stopProgress());
    audio.addEventListener("error", () => {
      console.warn("[music] load error:", currentSrc);
      _stopProgress();
      if (typeof window !== "undefined" && window.toast) window.toast("Music unavailable — file missing");
    });
    return audio;
  }

  function _startProgress() {
    _stopProgress();
    progressTimer = setInterval(() => {
      if (!audio || !audio.duration) return;
      const pct = (audio.currentTime / audio.duration) * 100;
      if (typeof onProgress === "function") onProgress(pct, audio.currentTime, audio.duration);

      window.dispatchEvent(new CustomEvent("music:progress", { detail: { pct, t: audio.currentTime, d: audio.duration } }));
    }, 120);
  }
  function _stopProgress() { clearInterval(progressTimer); progressTimer = 0; }

  function setInteract() { isInteracted = true; }
  function hasInteracted() { return isInteracted; }
  function load(src, opts = {}) {
    if (!src) { stop(); return false; }
    const a = ensureAudio();
    if (currentSrc === src && a.src) {
      if (opts.autoplay && isInteracted) play();
      return true;
    }
    stop();
    currentSrc = src;
    a.src = src;
    a.load();
    if (opts.autoplay && isInteracted) {
      return play();
    }
    return true;
  }

  function play() {
    const a = ensureAudio();
    if (!a.src) return Promise.resolve(false);
    const p = a.play();
    if (p && typeof p.then === "function") {
      return p.then(() => true).catch(err => {
        console.warn("[music] autoplay blocked:", err?.message);
        return false;
      });
    }
    return Promise.resolve(true);
  }
  function pause() { ensureAudio().pause(); }
  function stop() {
    _stopProgress();
    if (!audio) return;
    try { audio.pause(); audio.currentTime = 0; } catch {}
  }
  function toggle() {
    const a = ensureAudio();
    if (a.paused) return play();
    pause();
    return Promise.resolve(false);
  }
  function setVolume(v) { ensureAudio().volume = Math.max(0, Math.min(1, v)); }
  function getVolume() { return ensureAudio().volume; }
  function seek(pct) {
    const a = ensureAudio();
    if (!a.duration) return;
    a.currentTime = (pct / 100) * a.duration;
  }
  function isPlaying() { return audio && !audio.paused; }
  function getAudio() { return ensureAudio(); }
  function onProgressCb(cb) { onProgress = cb; }

  if (typeof window !== "undefined") {
    window.addEventListener("beforeunload", stop);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && audio && !audio.paused) {
      }
    });
  }

  return {
    load, play, pause, stop, toggle, setVolume, getVolume, seek, isPlaying, getAudio, onProgress: onProgressCb,
    setInteract, hasInteracted
  };
})();

if (typeof window !== "undefined") {
  window.Music = Music;
  document.addEventListener("click", () => Music.setInteract(), { once: true, capture: true });
  document.addEventListener("keydown", () => Music.setInteract(), { once: true, capture: true });
  document.addEventListener("touchstart", () => Music.setInteract(), { once: true, capture: true });
}
