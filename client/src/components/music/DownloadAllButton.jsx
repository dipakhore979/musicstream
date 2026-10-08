import { useEffect, useRef, useState } from "react";
import { CircleArrowDown, Download, Trash2 } from "lucide-react";
import { downloadInApp, removeFromApp, saveToDevice } from "../../lib/offlineActions.js";
import { useOfflineStore } from "../../store/offlineStore.js";

const option = "menu-item flex w-full items-start gap-3 rounded px-3 py-2.5 text-left text-sm hover:bg-white/10";

// Download button for album / playlist / Liked Songs pages. The person picks where the music goes:
// inside the app (plays offline in MusicStream) or onto the device as audio files.
export default function DownloadAllButton({ songs }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const savedIds = useOfflineStore((s) => s.ids);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const allowed = songs?.filter((s) => s.downloadable !== false) ?? [];
  if (!allowed.length) return null;

  const saved = allowed.filter((s) => savedIds.has(s.id));
  const allSaved = saved.length === allowed.length;
  const run = (fn) => () => {
    setOpen(false);
    fn();
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Download"
        title="Download"
        className={`icon-btn ${allSaved ? "!text-brand" : ""}`}
      >
        {allSaved ? <CircleArrowDown size={24} className="fill-brand/20" /> : <Download size={24} />}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-1/2 top-full z-30 mt-2 w-72 -translate-x-1/2 rounded-md bg-surface-highlight p-1 text-left shadow-2xl md:left-0 md:translate-x-0"
        >
          {allSaved ? (
            <p className="flex items-center gap-2 px-3 py-2.5 text-sm text-brand">
              <CircleArrowDown size={16} /> All {allowed.length} downloaded in the app
            </p>
          ) : (
            <button role="menuitem" className={option} onClick={run(() => downloadInApp(allowed))}>
              <CircleArrowDown size={18} className="mt-0.5 shrink-0" />
              <span>
                Download in app{allowed.length > 1 ? ` (${allowed.length - saved.length})` : ""}
                <span className="block text-xs text-muted">Listen offline inside MusicStream</span>
              </span>
            </button>
          )}
          <button role="menuitem" className={option} onClick={run(() => saveToDevice(allowed))}>
            <Download size={18} className="mt-0.5 shrink-0" />
            <span>
              Save to device{allowed.length > 1 ? ` (${allowed.length})` : ""}
              <span className="block text-xs text-muted">Audio files in your Downloads folder</span>
            </span>
          </button>
          {saved.length > 0 && (
            <button
              role="menuitem"
              className={`${option} text-red-400`}
              onClick={run(() => {
                if (window.confirm(`Remove ${saved.length} downloaded ${saved.length === 1 ? "song" : "songs"} from the app?`)) {
                  removeFromApp(saved.map((s) => s.id));
                }
              })}
            >
              <Trash2 size={18} className="mt-0.5 shrink-0" />
              <span>Remove app downloads ({saved.length})</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
