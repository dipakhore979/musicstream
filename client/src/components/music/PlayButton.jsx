import { useState } from "react";
import { Loader2, Play } from "lucide-react";
import toast from "react-hot-toast";

const SIZES = { sm: "h-10 w-10", md: "h-12 w-12", lg: "h-14 w-14" };

// Green circular play button. onClick may be async (e.g. fetch songs first); a spinner shows meanwhile.
export default function PlayButton({ onClick, size = "md", label = "Play", className = "" }) {
  const [busy, setBusy] = useState(false);

  async function handle(e) {
    e.preventDefault();
    e.stopPropagation(); // don't trigger the surrounding card/link
    if (busy) return;
    setBusy(true);
    try {
      await onClick?.();
    } catch (err) {
      toast.error(err?.userMessage || err?.message || "Couldn't start playback");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handle}
      aria-label={label}
      className={`flex items-center justify-center rounded-full bg-brand text-black shadow-xl transition hover:scale-105 hover:bg-brand-hover active:scale-100 ${SIZES[size]} ${className}`}
    >
      {busy ? <Loader2 size={20} className="animate-spin" /> : <Play size={22} className="ml-0.5 fill-black" />}
    </button>
  );
}
