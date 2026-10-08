import { Link } from "react-router-dom";
import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "../../hooks/useOnlineStatus.js";

export default function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;

  return (
    <div role="status" className="flex flex-wrap items-center justify-center gap-x-2 bg-yellow-500 px-4 py-1.5 text-center font-sans text-xs font-semibold text-black">
      <WifiOff size={14} />
      You're offline.
      <Link to="/downloads" className="underline">Open your downloads</Link>
      to keep listening.
    </div>
  );
}
