import { Download, Smartphone } from "lucide-react";
import InfoPage from "./InfoPage.jsx";
import { useInstallApp } from "../hooks/useInstallApp.js";

export default function DownloadPage() {
  const { installed, install } = useInstallApp();

  return (
    <InfoPage title="Install MusicStream">
      <p>
        MusicStream installs like a normal app: it gets its own icon and window, opens fast, and
        works without the browser toolbar. It's free and takes a few seconds.
      </p>

      {installed ? (
        <p className="flex items-center gap-2 font-bold text-brand">
          <Smartphone size={20} /> MusicStream is installed on this device.
        </p>
      ) : (
        <button onClick={install} className="btn-primary !text-base">
          <Download size={18} /> Install App
        </button>
      )}

      <h2 className="pt-4 text-xl font-bold text-white">Install manually</h2>
      <ul className="list-disc space-y-2 pl-5 text-base">
        <li><strong className="text-white">Chrome or Edge (computer):</strong> click the install icon at the right end of the address bar, or open the menu and choose “Install MusicStream”.</li>
        <li><strong className="text-white">Android (Chrome):</strong> open the menu (⋮) and choose “Install app” or “Add to Home screen”.</li>
        <li><strong className="text-white">iPhone and iPad (Safari):</strong> tap the Share button, then “Add to Home Screen”.</li>
      </ul>
    </InfoPage>
  );
}
