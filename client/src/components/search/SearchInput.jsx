import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Search, X } from "lucide-react";
import { useSearchHistoryStore } from "../../store/searchHistoryStore.js";

const DEBOUNCE_MS = 300;

// The URL (?q=...) is the single source of truth, so searches are shareable and Back works.
// Typing from ANY page jumps to /search after a 300ms pause; leaving /search clears the box.
// `compact` is the small pill used in the sidebar.
export default function SearchInput({ className = "", id, compact = false }) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const urlQuery = params.get("q") ?? "";

  const [text, setText] = useState(urlQuery);
  const lastPushed = useRef(urlQuery);
  const urlRef = useRef(urlQuery);
  const pathRef = useRef(pathname);
  const inputRef = useRef(null);
  urlRef.current = urlQuery;
  pathRef.current = pathname;

  // URL -> input, but only for changes we didn't make ourselves (otherwise fast typing gets overwritten).
  useEffect(() => {
    if (urlQuery !== lastPushed.current) {
      lastPushed.current = urlQuery;
      setText(urlQuery);
    }
  }, [urlQuery]);

  // input -> URL (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      const next = text.trim();
      const onSearch = pathRef.current === "/search";
      if (next === urlRef.current) return;
      if (!next && !onSearch) return; // clearing the box elsewhere shouldn't navigate
      lastPushed.current = next;
      navigate(
        { pathname: "/search", search: next ? `?${new URLSearchParams({ q: next })}` : "" },
        { replace: onSearch }
      );
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [text, navigate]);

  function clear() {
    setText("");
    inputRef.current?.focus();
  }

  const size = compact ? "h-9 pl-9 pr-8 font-sans text-xs" : "h-12 pl-12 pr-11 text-sm";
  const iconPos = compact ? "left-3" : "left-4";

  return (
    <div role="search" className={`relative ${className}`}>
      <Search size={compact ? 15 : 20} className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted ${iconPos}`} />
      <input
        id={id}
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && useSearchHistoryStore.getState().add(text)}
        placeholder="What do you want to play?"
        aria-label="Search songs, artists and albums"
        enterKeyHint="search"
        autoComplete="off"
        maxLength={100}
        className={`w-full rounded-full bg-[#242424] outline-none ring-1 ring-transparent transition placeholder:text-muted hover:ring-white/30 focus:ring-2 focus:ring-white ${size}`}
      />
      {text && (
        <button
          type="button"
          onClick={clear}
          aria-label="Clear search"
          className={`absolute top-1/2 -translate-y-1/2 rounded-full p-1 text-muted hover:text-white ${compact ? "right-2" : "right-3"}`}
        >
          <X size={compact ? 14 : 18} />
        </button>
      )}
    </div>
  );
}
