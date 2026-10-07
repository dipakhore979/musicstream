import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "../../hooks/useOnlineStatus.js";

export default function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;

  return (
    <div role="status" className="flex items-center justify-center gap-2 bg-yellow-500 px-4 py-1.5 text-center font-sans text-xs font-semibold text-black">
      <WifiOff size={14} />
      You're offline. Songs that already loaded may keep playing, but browsing needs a connection.
    </div>
  );
}
