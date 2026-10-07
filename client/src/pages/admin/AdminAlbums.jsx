import { useState } from "react";
import toast from "react-hot-toast";
import { Disc3, Trash2 } from "lucide-react";
import { api, getErrorMessage, getFieldErrors } from "../../lib/api.js";
import { usePaginatedList } from "../../hooks/usePaginatedList.js";
import TextField from "../../components/ui/TextField.jsx";
import TextArea from "../../components/ui/TextArea.jsx";
import SelectField from "../../components/ui/SelectField.jsx";
import FileField from "../../components/ui/FileField.jsx";
import LoadMore from "../../components/ui/LoadMore.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import CoverImage from "../../components/music/CoverImage.jsx";

const EMPTY = { title: "", artist: "", releaseYear: "", description: "" };

export default function AdminAlbums({ artists, reload: reloadOptions }) {
  const list = usePaginatedList("/albums", {}, { limit: 10 });
  const [form, setForm] = useState(EMPTY);
  const [cover, setCover] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    if (!form.artist) {
      setErrors({ artist: "Choose an artist" });
      return;
    }
    setSaving(true);
    setErrors({});
    try {
      const fd = new FormData();
      fd.append("title", form.title);
      fd.append("artist", form.artist);
      if (form.releaseYear) fd.append("releaseYear", form.releaseYear);
      if (form.description) fd.append("description", form.description);
      if (cover) fd.append("cover", cover);
      await api.post("/albums", fd, { timeout: 120000 });
      toast.success("Album created");
      setForm(EMPTY);
      setCover(null);
      list.reload();
      reloadOptions();
    } catch (err) {
      const fe = getFieldErrors(err);
      if (Object.keys(fe).length) setErrors(fe);
      else toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(album) {
    if (!window.confirm(`Delete album "${album.title}"? Its songs will stay as singles.`)) return;
    try {
      await api.delete(`/albums/${album.id}`);
      toast.success("Album deleted");
      list.reload();
      reloadOptions();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,24rem)_1fr]">
      <form onSubmit={onSubmit} className="flex flex-col gap-4 rounded-lg bg-surface-raised p-4" noValidate>
        <h2 className="text-lg font-bold">New album</h2>
        <TextField id="album-title" name="title" label="Title" value={form.title} onChange={onChange} error={errors.title} required />
        <SelectField
          id="album-artist" name="artist" label="Artist" placeholder="Choose an artist" value={form.artist} onChange={onChange}
          options={artists.map((a) => ({ value: a.id, label: a.name }))} error={errors.artist}
        />
        {artists.length === 0 && <p className="-mt-2 text-xs text-muted">No artists yet. Create one in the Artists tab first.</p>}
        <TextField id="album-year" name="releaseYear" type="number" label="Release year (optional)" value={form.releaseYear} onChange={onChange} error={errors.releaseYear} min="1900" max="2100" />
        <TextArea id="album-desc" name="description" label="Description (optional)" value={form.description} onChange={onChange} error={errors.description} />
        <FileField id="album-cover" label="Cover (optional)" accept="image/jpeg,image/png,image/webp" file={cover} onChange={setCover} image hint="JPG, PNG or WebP, up to 5 MB" />
        <button type="submit" disabled={saving} className="btn-primary self-start">
          {saving && <Spinner size={16} />} Create album
        </button>
      </form>

      <div>
        <h2 className="mb-3 text-lg font-bold">All albums {list.total > 0 && <span className="text-muted">({list.total})</span>}</h2>
        {list.loading && <div className="skeleton h-40 w-full" />}
        {list.error && <p className="text-red-400">{list.error}</p>}
        {!list.loading && !list.error && list.items.length === 0 && (
          <EmptyState icon={Disc3} title="No albums yet" message="Create your first album using the form." />
        )}
        <ul className="flex flex-col gap-2">
          {list.items.map((a) => (
            <li key={a.id} className="flex items-center gap-3 rounded-md bg-surface-raised p-2">
              <CoverImage src={a.coverImage?.url} icon={Disc3} className="h-12 w-12 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{a.title}</p>
                <p className="truncate text-sm text-muted">{[a.releaseYear, a.artist?.name].filter(Boolean).join(" • ")}</p>
              </div>
              <button onClick={() => onDelete(a)} aria-label={`Delete ${a.title}`} className="rounded p-2 text-muted hover:bg-white/10 hover:text-red-400">
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
