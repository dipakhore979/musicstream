import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Clock, SearchX, X } from "lucide-react";
import { api } from "../lib/api.js";
import { useSearch } from "../hooks/useSearch.js";
import { useMediaQuery } from "../hooks/useMediaQuery.js";
import { useSearchHistoryStore } from "../store/searchHistoryStore.js";
import { playAlbumById, playArtistById } from "../lib/playback.js";
import SearchInput from "../components/search/SearchInput.jsx";
import TopResultCard from "../components/search/TopResultCard.jsx";
import MediaCard from "../components/music/MediaCard.jsx";
import Section from "../components/music/Section.jsx";
import SongList from "../components/music/SongList.jsx";
import { SongListSkeleton, CardSkeletonRow } from "../components/music/Skeletons.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";

const PALETTE = ["#e8115b", "#1e3264", "#8d67ab", "#e13300", "#477d95", "#ba5d07", "#148a08", "#509bf5", "#af2896", "#503750", "#0d73ec", "#dc148c"];
const colorFor = (name) => PALETTE[[...name].reduce((n, c) => n + c.charCodeAt(0), 0) % PALETTE.length];

// ---------- shown when the search box is empty ----------
function RecentSearches() {
  const items = useSearchHistoryStore((s) => s.items);
  const remove = useSearchHistoryStore((s) => s.remove);
  const clear = useSearchHistoryStore((s) => s.clear);
  const [, setParams] = useSearchParams();
  if (!items.length) return null;

  return (
    <Section title="Recent searches">
      <ul className="mb-2">
        {items.map((q) => (
          <li key={q} className="group flex items-center gap-1 rounded-md hover:bg-white/10">
            <button onClick={() => setParams({ q })} className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-left">
              <Clock size={18} className="shrink-0 text-muted" />
              <span className="truncate">{q}</span>
            </button>
            <button onClick={() => remove(q)} aria-label={`Remove ${q} from recent searches`} className="mr-1 rounded-full p-2 text-muted hover:text-white">
              <X size={16} />
            </button>
          </li>
        ))}
      </ul>
      <button onClick={clear} className="btn-outline">Clear recent searches</button>
    </Section>
  );
}

function BrowseGenres() {
  const [genres, setGenres] = useState(null);
  const [, setParams] = useSearchParams();

  useEffect(() => {
    let cancelled = false;
    api.get("/search/genres").then((res) => !cancelled && setGenres(res.data.data)).catch(() => !cancelled && setGenres([]));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Section title="Browse all">
      {genres === null && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => <div key={i} className="skeleton h-28 rounded-lg" />)}
        </div>
      )}
      {genres?.length === 0 && (
        <p className="text-sm text-muted">Genres will appear here once songs are uploaded with a genre.</p>
      )}
      {genres?.length > 0 && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {genres.map((g) => (
            <button
              key={g.name}
              onClick={() => setParams({ q: g.name })}
              style={{ backgroundColor: colorFor(g.name) }}
              className="relative h-28 overflow-hidden rounded-lg p-4 text-left transition hover:scale-[1.02] md:h-32"
            >
              <span className="block break-words text-xl font-extrabold tracking-tight md:text-2xl">{g.name}</span>
              <span className="absolute bottom-3 left-4 text-xs font-semibold text-white/80">
                {g.count} song{g.count === 1 ? "" : "s"}
              </span>
              <span aria-hidden="true" className="absolute -bottom-3 -right-4 h-20 w-20 rotate-[25deg] rounded-md bg-black/20" />
            </button>
          ))}
        </div>
      )}
    </Section>
  );
}

// ---------- results ----------
function Results({ data, loading, q }) {
  const addHistory = useSearchHistoryStore((s) => s.add);
  const [showAllSongs, setShowAllSongs] = useState(false);
  useEffect(() => setShowAllSongs(false), [q]);

  const total = data.songs.length + data.artists.length + data.albums.length;
  if (total === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title={`No results found for “${data.query}”`}
        message="Check your spelling, or try fewer or different keywords."
      />
    );
  }

  const songs = showAllSongs ? data.songs : data.songs.slice(0, 4);

  return (
    // Clicking anything in the results counts as a "real" search, so it's saved to Recent searches.
    <div onClickCapture={() => addHistory(q)} className={`transition-opacity ${loading ? "opacity-60" : ""}`}>
      <div className="mb-8 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        {data.topResult && (
          <section>
            <h2 className="mb-2 text-xl font-bold tracking-tight md:text-2xl">Top result</h2>
            <TopResultCard key={`${data.topResult.type}-${data.topResult.item.id}`} result={data.topResult} />
          </section>
        )}
        {data.songs.length > 0 && (
          <section className={data.topResult ? "" : "lg:col-span-2"}>
            <h2 className="mb-2 text-xl font-bold tracking-tight md:text-2xl">Songs</h2>
            <SongList songs={songs} showAlbum={false} />
            {data.songs.length > 4 && (
              <button onClick={() => setShowAllSongs((v) => !v)} className="mt-2 px-2 text-sm font-bold text-muted hover:text-white hover:underline">
                {showAllSongs ? "Show less" : `Show all ${data.songs.length}`}
              </button>
            )}
          </section>
        )}
      </div>

      {data.artists.length > 0 && (
        <Section title="Artists">
          <div className="-mx-3 flex gap-1 overflow-x-auto pb-2">
            {data.artists.map((a) => (
              <MediaCard key={a.id} to={`/artists/${a.id}`} image={a.image?.url} title={a.name} subtitle="Artist" round onPlay={() => playArtistById(a.id)} />
            ))}
          </div>
        </Section>
      )}

      {data.albums.length > 0 && (
        <Section title="Albums">
          <div className="-mx-3 flex gap-1 overflow-x-auto pb-2">
            {data.albums.map((a) => (
              <MediaCard
                key={a.id}
                to={`/albums/${a.id}`}
                image={a.coverImage?.url}
                title={a.title}
                subtitle={[a.releaseYear, a.artist?.name].filter(Boolean).join(" • ")}
                onPlay={() => playAlbumById(a.id)}
              />
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

export default function Search() {
  const [params] = useSearchParams();
  const q = (params.get("q") ?? "").trim();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { loading, data, error, retry } = useSearch(q);

  // On desktop the search box is in the sidebar, so focus it when arriving here.
  useEffect(() => {
    if (isDesktop) document.getElementById("sidebar-search")?.focus();
  }, [isDesktop]);

  return (
    <div className="px-4 pb-8 pt-6 md:px-8">
      {/* On desktop the search box lives in the top bar; on phones it sits at the top of the page. */}
      {!isDesktop && <SearchInput className="mb-6" />}

      {!q && (
        <>
          <RecentSearches />
          <BrowseGenres />
        </>
      )}

      {q && loading && !data && (
        <>
          <SongListSkeleton count={4} />
          <div className="mt-8"><CardSkeletonRow /></div>
        </>
      )}

      {q && error && (
        <EmptyState
          icon={SearchX}
          title="Search failed"
          message={error}
          action={<button className="btn-outline" onClick={retry}>Try again</button>}
        />
      )}

      {q && data && !error && <Results data={data} loading={loading} q={q} />}
    </div>
  );
}
