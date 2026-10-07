import { useCallback } from "react";
import toast from "react-hot-toast";
import { isIOS, promptInstall, usePwaStore } from "../lib/pwa.js";

// One install action for the whole UI. Uses the native prompt where the browser supports it
// (Chrome, Edge, Android) and explains the manual steps where it doesn't (iPhone/iPad Safari, Firefox).
export function useInstallApp() {
  const installed = usePwaStore((s) => s.installed);
  const canInstall = usePwaStore((s) => s.canInstall);

  const install = useCallback(async () => {
    if (usePwaStore.getState().canInstall) {
      const outcome = await promptInstall();
      if (outcome === "accepted") toast.success("Installing MusicStream…");
      return;
    }
    if (isIOS()) {
      toast("On iPhone or iPad: tap the Share button, then “Add to Home Screen”.", { duration: 8000 });
    } else {
      toast("Open your browser menu and choose “Install app” (or “Add to Home screen”).", { duration: 6000 });
    }
  }, []);

  return { installed, canInstall, install };
}
