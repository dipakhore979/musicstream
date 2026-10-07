import { Link } from "react-router-dom";
import CoverImage from "../music/CoverImage.jsx";
import PlayButton from "../music/PlayButton.jsx";
import { getSongCover } from "../../lib/format.js";
import { playAlbumById, playArtistById } from "../../lib/playback.js";
import { usePlayerStore } from "../../store/playerStore.js";

// The big "Top result" card: an artist, album or song, whichever matched best.
export default function TopResultCard({ result }) {
  const playSongs = usePlayerStore((s) => s.playSongs);
  const { type, item } = result;

  const config = {
    artist: {
      to: `/artists/${item.id}`, title: item.name, image: item.image?.url, round: true,
      label: "Artist", sub: "", play: () => playArtistById(item.id),
    },
    album: {
      to: `/albums/${item.id}`, title: item.title, image: item.coverImage?.url, round: false,
      label: "Album", sub: item.artist?.name, play: () => playAlbumById(item.id),
    },
    song: {
      to: item.album ? `/albums/${item.album.id}` : `/artists/${item.artist?.id}`,
      title: item.title, image: getSongCover(item), round: false,
      label: "Song", sub: item.artist?.name, play: () => playSongs([item], 0),
    },
  }[type];

  return (
    <div className="group relative rounded-lg bg-surface-raised p-5 transition-colors hover:bg-surface-highlight">
      <Link to={config.to} className="block">
        <CoverImage src={config.image} alt="" rounded={config.round} className="mb-5 h-24 w-24 shadow-[0_8px_24px_rgba(0,0,0,0.5)]" />
        <h3 className="mb-2 truncate text-3xl font-extrabold tracking-tight">{config.title}</h3>
        <p className="flex items-center gap-2 text-sm text-muted">
          <span className="rounded-full bg-black/40 px-3 py-1 font-bold text-white">{config.label}</span>
          {config.sub && <span className="truncate font-semibold text-white">{config.sub}</span>}
        </p>
      </Link>
      <PlayButton
        onClick={config.play}
        label={`Play ${config.title}`}
        className="absolute bottom-5 right-5 translate-y-2 opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 focus-visible:translate-y-0 focus-visible:opacity-100"
      />
    </div>
  );
}
