import { useEffect, useState } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import TextField from "../ui/TextField.jsx";
import TextArea from "../ui/TextArea.jsx";
import Spinner from "../ui/Spinner.jsx";
import { getErrorMessage, getFieldErrors } from "../../lib/api.js";
import { useLibraryStore } from "../../store/libraryStore.js";

export default function EditPlaylistModal({ playlist, onClose, onSaved }) {
  const updatePlaylist = useLibraryStore((s) => s.updatePlaylist);
  const [form, setForm] = useState({ name: playlist.name, description: playlist.description || "" });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      setErrors({ name: "Name can't be empty" });
      return;
    }
    setSaving(true);
    setErrors({});
    try {
      const updated = await updatePlaylist(playlist.id, { name: form.name, description: form.description });
      onSaved(updated);
      toast.success("Playlist updated");
      onClose();
    } catch (err) {
      const fe = getFieldErrors(err);
      if (Object.keys(fe).length) setErrors(fe);
      else toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <form
        onSubmit={onSubmit}
        role="dialog"
        aria-modal="true"
        aria-label="Edit details"
        className="flex w-full max-w-md flex-col gap-4 rounded-lg bg-surface-highlight p-6 shadow-2xl"
        noValidate
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Edit details</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1 text-muted hover:text-white">
            <X size={20} />
          </button>
        </div>
        <TextField id="pl-name" name="name" label="Name" value={form.name} onChange={onChange} error={errors.name} autoFocus />
        <TextArea id="pl-desc" name="description" label="Description" value={form.description} onChange={onChange} error={errors.description} placeholder="Add an optional description" />
        <button type="submit" disabled={saving} className="btn-primary self-end">
          {saving && <Spinner size={16} />} Save
        </button>
      </form>
    </div>
  );
}
