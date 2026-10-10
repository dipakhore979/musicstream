import { useEffect } from "react";
import { X } from "lucide-react";

// Centered dialog: closes with Escape, the X button, or a click on the dark backdrop.
export default function Modal({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/70 p-4 sm:items-center"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div role="dialog" aria-modal="true" aria-label={title} className="animate-fade-up my-auto w-full max-w-lg rounded-lg bg-surface-highlight p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="icon-btn !p-1">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
