import { useState } from "react";
import toast from "react-hot-toast";
import { Music2, Trash2 } from "lucide-react";
import { api, getErrorMessage, getFieldErrors } from "../../lib/api.js";
import { usePaginatedList } from "../../hooks/usePaginatedList.js";
import { formatDuration, getSongCover } from "../../lib/format.js";
import TextField from "../../components/ui/TextField.jsx";
import SelectField from "../../components/ui/SelectField.jsx";
import FileField from "../../components/ui/FileField.jsx";
import LoadMore from "../../components/ui/LoadMore.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import CoverImage from "../../components/music/CoverImage.jsx";

const EMPTY = { title: "", artist: "", album: "", genre: "", trackNumber: "" };

export default function AdminSongs({ artists, albums }) {
  const list = usePaginatedList("/songs", { sort: "newest" }, { limit: 10 });
  const [form, setForm] = useState(EMPTY);
  const [audio, setAudio] = useState(null);
  const [cover, setCover] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  // Changing the artist invalidates the chosen album, so reset it.
  const onArtistChange = (e) => setForm((f) => ({ ...f, artist: e.target.value, album: "" }));

  const albumOptions = albums
    .filter((a) => a.artist?.id === form.artist)
    .map((a) => ({ value: a.id, label: a.title }));

  async function onSubmit(e) {
    e.preventDefault();
    const local = {};
    if (!form.artist) local.artist = "Choose an artist";
    if (!audio) local.audio = "Choose an audio file";
    if (Object.keys(local).length) {
      setErrors(local);
      return;
    }

    setSaving(true);
    setErrors({});
    setProgress(0);
    try {
      const fd = new FormData();
      fd.append("title", form.title);
      fd.append("artist", form.artist);
      if (form.album) fd.append("album", form.album);
      if (form.genre) fd.append("genre", form.genre);
      if (form.trackNumber) fd.append("trackNumber", form.trackNumber);
      fd.append("audio", audio);
      if (cover) fd.append("cover", cover);

      await api.post("/songs", fd, {
        timeout: 0, // large files on slow connections can take a while
        onUploadProgress: (ev) => ev.total && setProgress(Math.round((ev.loaded * 100) / ev.total)),
      });
      toast.success("Song uploaded");
      setForm(EMPTY);
      setAudio(null);
      setCover(null);
      list.reload();
    } catch (err) {
      const fe = getFieldErrors(err);
      if (Object.keys(fe).length) setErrors(fe);
      else toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(song) {
    if (!window.confirm(`Delete "${song.title}"? This also removes the audio file.`)) return;
    try {
      await api.delete(`/songs/${song.id}`);
      toast.success("Song deleted");
      list.reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,24rem)_1fr]">
      <form onSubmit={onSubmit} className="flex flex-col gap-4 rounded-lg bg-surface-raised p-4" noValidate>
        <h2 className="text-lg font-bold">Upload song</h2>
        <TextField id="song-title" name="title" label="Title" value={form.title} onChange={onChange} error={errors.title} required />
        <SelectField
          id="song-artist" name="artist" label="Artist" placeholder="Choose an artist" value={form.artist} onChange={onArtistChange}
          options={artists.map((a) => ({ value: a.id, label: a.name }))} error={errors.artist}
        />
        <SelectField
          id="song-album" name="album" label="Album (optional)" placeholder={form.artist ? "No album (single)" : "Choose an artist first"}
          value={form.album} onChange={onChange} options={albumOptions} error={errors.album}
        />
        <div className="grid grid-cols-2 gap-3">
          <TextField id="song-genre" name="genre" label="Genre" value={form.genre} onChange={onChange} error={errors.genre} />
          <TextField id="song-track" name="trackNumber" type="number" label="Track #" min="1" value={form.trackNumber} onChange={onChange} error={errors.trackNumber} />
        </div>
        <FileField id="song-audio" label="Audio file" required accept="audio/*" file={audio} onChange={setAudio} hint="MP3, WAV, OGG, M4A or FLAC, up to 30 MB" />
        {errors.audio && <p className="-mt-3 text-sm text-red-400">{errors.audio}</p>}
        <FileField id="song-cover" label="Cover (optional)" accept="image/jpeg,image/png,image/webp" file={cover} onChange={setCover} image hint="Falls back to the album cover if empty" />

        {saving && (
          <div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-highlight">
              <div className="h-full bg-brand transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-1 text-xs text-muted">
              {progress < 100 ? `Uploading… ${progress}%` : "Processing audio, almost done…"}
            </p>
          </div>
        )}

        <button type="submit" disabled={saving} className="btn-primary self-start">
          {saving && <Spinner size={16} />} Upload song
        </button>
      </form>

      <div>
        <h2 className="mb-3 text-lg font-bold">All songs {list.total > 0 && <span className="text-muted">({list.total})</span>}</h2>
        {list.loading && <div className="skeleton h-40 w-full" />}
        {list.error && <p className="text-red-400">{list.error}</p>}
        {!list.loading && !list.error && list.items.length === 0 && (
          <EmptyState icon={Music2} title="No songs yet" message="Upload your first song using the form." />
        )}
        <ul className="flex flex-col gap-2">
          {list.items.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center gap-3 rounded-md bg-surface-raised p-2">
              <CoverImage src={getSongCover(s)} className="h-12 w-12 shrink-0" />
              <div className="min-w-0 flex-1 basis-40">
                <p className="truncate font-medium">{s.title}</p>
                <p className="truncate text-sm text-muted">
                  {s.artist?.name}
                  {s.album && ` • ${s.album.title}`} • {formatDuration(s.duration)}
                </p>
              </div>
              {/* Lets the admin verify the upload actually plays */}
              <audio controls preload="none" src={s.audio?.url} className="h-8 w-full max-w-[220px]" />
              <button onClick={() => onDelete(s)} aria-label={`Delete ${s.title}`} className="rounded p-2 text-muted hover:bg-white/10 hover:text-red-400">
                <Trash2 size={18} />
              </button>
            </li>
          ))}
        </ul>
        <LoadMore hasMore={list.hasMore} loading={list.loadingMore} onClick={list.loadMore} />
      </div>
    </div>
  );
}
