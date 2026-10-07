import { create } from "zustand";

// Browsers fire `beforeinstallprompt` once, early. Listening at module load (imported from main.jsx)
// guarantees we don't miss it before a component mounts.
let deferredPrompt = null;

export const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;

export const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1); // iPadOS reports as a Mac

export const usePwaStore = create(() => ({
  canInstall: false, // the browser offered an install prompt
  installed: isStandalone(), // already running as an installed app
}));

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault(); // we show our own Install button instead of the browser's mini-infobar
  deferredPrompt = e;
  usePwaStore.setState({ canInstall: true });
});

window.addEventListener("appinstalled", () => {
  deferredPrompt = null;
  usePwaStore.setState({ canInstall: false, installed: true });
});

export async function promptInstall() {
  if (!deferredPrompt) return null;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  usePwaStore.setState({ canInstall: false });
  return outcome; // "accepted" | "dismissed"
}

// Service workers need a production build, so this does nothing under `npm run dev`.
export function registerServiceWorker() {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((err) => console.warn("Service worker registration failed:", err));
  });
}
