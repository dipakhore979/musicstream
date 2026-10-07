import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, GripVertical, ListMusic, X } from "lucide-react";
import CoverImage from "../music/CoverImage.jsx";
import { getSongCover } from "../../lib/format.js";
import { selectCurrentSong, usePlayerStore } from "../../store/playerStore.js";

export default function QueuePanel() {
  const open = usePlayerStore((s) => s.queueOpen);
  const queue = usePlayerStore((s) => s.queue);
  const currentIndex = usePlayerStore((s) => s.currentIndex);
  const current = usePlayerStore(selectCurrentSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const { setQueueOpen, playFromQueue, removeFromQueue, moveInQueue, clearQueue, togglePlay } = usePlayerStore.getState();

  const [dragFrom, setDragFrom] = useState(null);
  const [dragOver, setDragOver] = useState(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setQueueOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setQueueOpen]);

  if (!open) return null;

  // Only upcoming songs are editable; `abs` is the song's real index in the queue.
  const firstUpcoming = currentIndex + 1;
  const upcoming = queue.slice(firstUpcoming);
  const resetDrag = () => {
    setDragFrom(null);
    setDragOver(null);
  };

  return (
    <aside
      aria-label="Play queue"
      className="fixed inset-0 z-50 flex flex-col bg-surface-raised md:inset-auto md:bottom-[5.5rem] md:right-3 md:top-16 md:z-40 md:w-96 md:rounded-lg md:shadow-2xl md:ring-1 md:ring-white/10"
    >
      <header className="flex items-center justify-between p-4">
        <h2 className="text-lg font-bold">Queue</h2>
        <button onClick={() => setQueueOpen(false)} aria-label="Close queue" className="rounded-full p-2 text-muted hover:text-white">
          <X size={20} />
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
        {!current ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center text-muted">
            <ListMusic size={40} />
            <p className="font-semibold text-white">Your queue is empty</p>
            <p className="text-sm">Play a song, or choose “Add to queue” from a song’s menu.</p>
          </div>
        ) : (
          <>
            <h3 className="px-2 pb-1 text-sm font-semibold text-muted">Now playing</h3>
            <button
              onClick={togglePlay}
              className="mb-4 flex w-full items-center gap-3 rounded-md bg-white/5 p-2 text-left"
            >
              <CoverImage src={getSongCover(current)} className="h-12 w-12 shrink-0" />
              <div className="min-w-0">
                <p className="truncate font-medium text-brand">{current.title}</p>
                <p className="truncate text-sm text-muted">{current.artist?.name}</p>
              </div>
              <span className="ml-auto text-xs text-muted">{isPlaying ? "Playing" : "Paused"}</span>
            </button>

            <div className="flex items-center justify-between px-2 pb-1">
              <h3 className="text-sm font-semibold text-muted">Next up</h3>
              {queue.length > 1 && (
                <button onClick={clearQueue} className="text-xs font-semibold text-muted hover:text-white hover:underline">
                  Clear queue
                </button>
              )}
            </div>

            {upcoming.length === 0 ? (
              <p className="px-2 py-4 text-sm text-muted">Nothing queued after this song.</p>
            ) : (
              <ul>
                {upcoming.map((song, i) => {
                  const abs = firstUpcoming + i;
                  const isFirst = i === 0;
                  const isLast = i === upcoming.length - 1;
                  return (
                    <li
                      key={`${song.id}-${abs}`}
                      draggable
                      onDragStart={(e) => {
                        setDragFrom(abs);
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData("text/plain", String(abs));
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOver(abs);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (dragFrom !== null && dragFrom !== abs) moveInQueue(dragFrom, abs);
                        resetDrag();
                      }}
                      onDragEnd={resetDrag}
                      className={`group flex items-center gap-1 rounded-md p-1 hover:bg-white/10 ${
                        dragOver === abs && dragFrom !== abs ? "border-t-2 border-brand" : "border-t-2 border-transparent"
                      } ${dragFrom === abs ? "opacity-40" : ""}`}
                    >
                      <span className="hidden cursor-grab p-1 text-muted md:block" aria-hidden="true">
                        <GripVertical size={16} />
                      </span>
                      <button onClick={() => playFromQueue(abs)} className="flex min-w-0 flex-1 items-center gap-3 p-1 text-left">
                        <CoverImage src={getSongCover(song)} className="h-10 w-10 shrink-0" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{song.title}</p>
                          <p className="truncate text-xs text-muted">{song.artist?.name}</p>
                        </div>
                      </button>
                      <div className="flex items-center">
                        <button
                          onClick={() => moveInQueue(abs, abs - 1)}
                          disabled={isFirst}
                          aria-label={`Move ${song.title} up`}
                          className="rounded p-1.5 text-muted hover:text-white disabled:opacity-30 disabled:hover:text-muted"
                        >
                          <ChevronUp size={16} />
                        </button>
                        <button
                          onClick={() => moveInQueue(abs, abs + 1)}
                          disabled={isLast}
                          aria-label={`Move ${song.title} down`}
                          className="rounded p-1.5 text-muted hover:text-white disabled:opacity-30 disabled:hover:text-muted"
                        >
                          <ChevronDown size={16} />
                        </button>
                        <button
                          onClick={() => removeFromQueue(abs)}
                          aria-label={`Remove ${song.title} from queue`}
                          className="rounded p-1.5 text-muted hover:text-red-400"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
