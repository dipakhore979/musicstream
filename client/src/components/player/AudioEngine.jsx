import { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { audio } from "../../lib/audio.js";
import { api } from "../../lib/api.js";
import { getSongCover } from "../../lib/format.js";
import { selectCurrentSong, usePlayerStore, useProgressStore } from "../../store/playerStore.js";
import { getOfflineAudioUrl, useOfflineStore } from "../../store/offlineStore.js";

// Renders nothing. It connects the audio element to the store: loads tracks, reports progress,
// advances the queue, and wires up keyboard + OS media controls. Mounted once in AppLayout.
export default function AudioEngine() {
  const playId = usePlayerStore((s) => s.playId);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const volume = usePlayerStore((s) => s.volume);
  const muted = usePlayerStore((s) => s.muted);
  const song = usePlayerStore(selectCurrentSong);
  const countedRef = useRef(false);
  const loadTokenRef = useRef(0);
  const objectUrlRef = useRef(null); // blob: URL of the offline copy currently loaded, if any

  function releaseObjectUrl() {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }

  function handlePlayError(err) {
    if (err?.name === "AbortError") return; // a newer load interrupted this one, which is fine
    usePlayerStore.setState({ isPlaying: false });
    if (err?.name === "NotAllowedError") toast.error("Your browser blocked playback. Press play to start.");
  }

  // Load a new track whenever the store says a new one should start.
  useEffect(() => {
    const { queue, currentIndex, isPlaying: shouldPlay } = usePlayerStore.getState();
    const current = queue[currentIndex];
    countedRef.current = false;
    const token = ++loadTokenRef.current; // lets a newer request cancel an older one that is still loading
    useProgressStore.setState({ currentTime: 0, duration: current?.duration || 0, buffering: Boolean(current) });

    if (!current) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      releaseObjectUrl();
      return;
    }

    // Songs saved inside the app play from the device's own storage, so they work with no internet.
    if (useOfflineStore.getState().ids.has(current.id)) {
      getOfflineAudioUrl(current.id).then((offlineUrl) => {
        if (token !== loadTokenRef.current) {
          if (offlineUrl) URL.revokeObjectURL(offlineUrl); // a newer song was requested meanwhile
          return;
        }
        releaseObjectUrl();
        objectUrlRef.current = offlineUrl;
        audio.src = offlineUrl || current.audio.url; // stream instead if the saved copy has gone missing
        if (usePlayerStore.getState().isPlaying) audio.play().catch(handlePlayError);
      });
      return;
    }

    releaseObjectUrl();
    audio.src = current.audio.url;
    if (shouldPlay) audio.play().catch(handlePlayError);
  }, [playId]);

  // Play / pause requests from the UI.
  useEffect(() => {
    if (!audio.getAttribute("src")) return;
    if (isPlaying && audio.paused) audio.play().catch(handlePlayError);
    else if (!isPlaying && !audio.paused) audio.pause();
  }, [isPlaying]);

  useEffect(() => {
    audio.volume = volume;
    audio.muted = muted;
  }, [volume, muted]);

  // Audio element events -> store.
  useEffect(() => {
    const updatePosition = () => {
      if (!("mediaSession" in navigator) || !Number.isFinite(audio.duration) || audio.duration <= 0) return;
      try {
        navigator.mediaSession.setPositionState({
          duration: audio.duration,
          position: Math.min(audio.currentTime, audio.duration),
          playbackRate: audio.playbackRate,
        });
      } catch {
        /* some browsers reject odd values; position display is optional */
      }
    };

    const on = {
      timeupdate: () => useProgressStore.setState({ currentTime: audio.currentTime }),
      loadedmetadata: () => {
        useProgressStore.setState({ duration: Number.isFinite(audio.duration) ? audio.duration : 0 });
        updatePosition();
      },
      loadstart: () => useProgressStore.setState({ buffering: true }),
      waiting: () => useProgressStore.setState({ buffering: true }),
      canplay: () => useProgressStore.setState({ buffering: false }),
      playing: () => {
        useProgressStore.setState({ buffering: false });
        // Count a play once per loaded track, on the first real playback.
        const song = selectCurrentSong(usePlayerStore.getState());
        if (song && !countedRef.current) {
          countedRef.current = true;
          api.post(`/songs/${song.id}/play`).catch(() => {});
        }
      },
      // Keep the UI honest when the browser/OS pauses us (headphones unplugged, media keys...).
      play: () => usePlayerStore.setState({ isPlaying: true }),
      pause: () => {
        if (!audio.ended && audio.getAttribute("src")) usePlayerStore.setState({ isPlaying: false });
      },
      ended: () => usePlayerStore.getState().next({ auto: true }),
      seeked: updatePosition,
      error: () => {
        const src = audio.getAttribute("src");
        if (!src) return;
        const current = selectCurrentSong(usePlayerStore.getState());

        // A damaged offline copy: delete it and stream the song instead.
        if (src.startsWith("blob:") && current) {
          useOfflineStore.getState().remove(current.id);
          audio.src = current.audio.url;
          audio.play().catch(() => {});
          return;
        }

        toast.error(
          navigator.onLine
            ? `Couldn't play "${current?.title ?? "this track"}"`
            : "You're offline. Songs downloaded inside the app still play; others need internet."
        );
        usePlayerStore.setState({ isPlaying: false });
        useProgressStore.setState({ buffering: false });
      },
    };

    Object.entries(on).forEach(([name, fn]) => audio.addEventListener(name, fn));
    return () => Object.entries(on).forEach(([name, fn]) => audio.removeEventListener(name, fn));
  }, []);

  // Stop everything when the layout unmounts (e.g. on logout).
  useEffect(
    () => () => {
      usePlayerStore.getState().reset();
      releaseObjectUrl();
      document.title = "MusicStream";
    },
    []
  );

  // Browser tab title + lock-screen / media-key integration.
  useEffect(() => {
    document.title = song ? `${song.title} • ${song.artist?.name ?? ""}`.trim() : "MusicStream";
    if (!("mediaSession" in navigator)) return;
    if (!song) {
      navigator.mediaSession.metadata = null;
      return;
    }
    const cover = getSongCover(song);
    navigator.mediaSession.metadata = new window.MediaMetadata({
      title: song.title,
      artist: song.artist?.name ?? "",
      album: song.album?.title ?? "",
      artwork: cover ? [{ src: cover, sizes: "512x512" }] : [],
    });
  }, [song]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    const store = usePlayerStore.getState;
    const handlers = {
      play: () => usePlayerStore.setState({ isPlaying: true }),
      pause: () => usePlayerStore.setState({ isPlaying: false }),
      previoustrack: () => store().previous(),
      nexttrack: () => store().next(),
      seekto: (d) => store().seek(d.seekTime),
    };
    Object.entries(handlers).forEach(([action, fn]) => {
      try {
        navigator.mediaSession.setActionHandler(action, fn);
      } catch {
        /* action not supported in this browser */
      }
    });
    return () => Object.keys(handlers).forEach((a) => {
      try { navigator.mediaSession.setActionHandler(a, null); } catch { /* ignore */ }
    });
  }, []);

  // Space toggles play/pause unless you're typing or focused on something interactive.
  useEffect(() => {
    const onKey = (e) => {
      if (e.code !== "Space" || e.repeat) return;
      const el = e.target;
      if (el?.isContentEditable || ["INPUT", "TEXTAREA", "SELECT", "BUTTON", "A"].includes(el?.tagName)) return;
      e.preventDefault();
      usePlayerStore.getState().togglePlay();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return null;
}
