import { useState } from "react";
import toast from "react-hot-toast";
import { Trash2, User } from "lucide-react";
import { api, getErrorMessage, getFieldErrors } from "../../lib/api.js";
import { usePaginatedList } from "../../hooks/usePaginatedList.js";
import TextField from "../../components/ui/TextField.jsx";
import TextArea from "../../components/ui/TextArea.jsx";
import FileField from "../../components/ui/FileField.jsx";
import LoadMore from "../../components/ui/LoadMore.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import CoverImage from "../../components/music/CoverImage.jsx";

const EMPTY = { name: "", bio: "" };

export default function AdminArtists({ reload: reloadOptions }) {
  const list = usePaginatedList("/artists", {}, { limit: 10 });
  const [form, setForm] = useState(EMPTY);
  const [image, setImage] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      const fd = new FormData();
      fd.append("name", form.name);
      if (form.bio) fd.append("bio", form.bio);
      if (image) fd.append("image", image);
      await api.post("/artists", fd, { timeout: 120000 });
      toast.success("Artist created");
      setForm(EMPTY);
      setImage(null);
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

  async function onDelete(artist) {
    if (!window.confirm(`Delete artist "${artist.name}"?`)) return;
    try {
      await api.delete(`/artists/${artist.id}`);
      toast.success("Artist deleted");
      list.reload();
      reloadOptions();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,24rem)_1fr]">
      <form onSubmit={onSubmit} className="flex flex-col gap-4 rounded-lg bg-surface-raised p-4" noValidate>
        <h2 className="text-lg font-bold">New artist</h2>
        <TextField id="artist-name" name="name" label="Name" value={form.name} onChange={onChange} error={errors.name} required />
        <TextArea id="artist-bio" name="bio" label="Bio (optional)" value={form.bio} onChange={onChange} error={errors.bio} />
        <FileField id="artist-image" label="Image (optional)" accept="image/jpeg,image/png,image/webp" file={image} onChange={setImage} image hint="JPG, PNG or WebP, up to 5 MB" />
        <button type="submit" disabled={saving} className="btn-primary self-start">
          {saving && <Spinner size={16} />} Create artist
        </button>
      </form>

      <div>
        <h2 className="mb-3 text-lg font-bold">All artists {list.total > 0 && <span className="text-muted">({list.total})</span>}</h2>
        {list.loading && <div className="skeleton h-40 w-full" />}
        {list.error && <p className="text-red-400">{list.error}</p>}
        {!list.loading && !list.error && list.items.length === 0 && (
          <EmptyState icon={User} title="No artists yet" message="Create your first artist using the form." />
        )}
        <ul className="flex flex-col gap-2">
          {list.items.map((a) => (
            <li key={a.id} className="flex items-center gap-3 rounded-md bg-surface-raised p-2">
              <CoverImage src={a.image?.url} rounded icon={User} className="h-12 w-12 shrink-0" />
              <span className="min-w-0 flex-1 truncate font-medium">{a.name}</span>
              <button onClick={() => onDelete(a)} aria-label={`Delete ${a.name}`} className="rounded p-2 text-muted hover:bg-white/10 hover:text-red-400">
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
