import { useEffect, useState } from "react";
import { Camera, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { api, getErrorMessage, getFieldErrors } from "../lib/api.js";
import { useAuthStore } from "../store/authStore.js";
import TextField from "../components/ui/TextField.jsx";
import Spinner from "../components/ui/Spinner.jsx";
import { Avatar } from "../components/layout/TopBar.jsx";

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function Profile() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [name, setName] = useState(user?.name ?? "");
  const [file, setFile] = useState(null); // newly picked photo, not uploaded until Save
  const [preview, setPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (!user) return null;

  const dirty = name.trim() !== user.name || Boolean(file);

  function pickFile(e) {
    const picked = e.target.files?.[0];
    e.target.value = "";
    if (!picked) return;
    // Check here too so people get instant feedback instead of waiting for an upload to fail.
    if (!TYPES.includes(picked.type)) return toast.error("Choose a JPG, PNG or WebP image");
    if (picked.size > MAX_BYTES) return toast.error("Image must be under 5 MB");
    setFile(picked);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      const fd = new FormData();
      if (name.trim() !== user.name) fd.append("name", name.trim());
      if (file) fd.append("avatar", file);
      const { data } = await api.patch("/users/me", fd, { timeout: 120000 });
      setUser(data.data);
      setName(data.data.name);
      setFile(null);
      toast.success("Profile updated");
    } catch (err) {
      const fe = getFieldErrors(err);
      if (Object.keys(fe).length) setErrors(fe);
      else toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function removePhoto() {
    if (file) return setFile(null); // just discard the picked (unsaved) photo
    setRemoving(true);
    try {
      const { data } = await api.delete("/users/me/avatar");
      setUser(data.data);
      toast.success("Photo removed");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setRemoving(false);
    }
  }

  const hasPhoto = Boolean(file || user.avatar?.url);
  const joined = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long" })
    : null;

  return (
    <div className="px-4 pb-10 pt-6 md:px-8">
      <h1 className="mb-8 text-3xl font-bold md:text-4xl">Profile</h1>

      <form onSubmit={onSubmit} className="flex max-w-2xl flex-col gap-8 sm:flex-row sm:items-start" noValidate>
        <div className="flex shrink-0 flex-col items-center gap-3">
          <label htmlFor="avatar-input" className="group relative block cursor-pointer overflow-hidden rounded-full">
            {preview ? (
              <img src={preview} alt="New profile photo preview" className="h-40 w-40 rounded-full object-cover" />
            ) : (
              <Avatar user={user} size={160} />
            )}
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/60 font-sans text-xs font-semibold opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
              <Camera size={28} /> Choose photo
            </span>
          </label>
          <input id="avatar-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={pickFile} className="sr-only" />

          {hasPhoto && (
            <button type="button" onClick={removePhoto} disabled={removing} className="flex items-center gap-1 font-sans text-xs text-muted hover:text-red-400">
              {removing ? <Spinner size={14} /> : <Trash2 size={14} />}
              {file ? "Discard new photo" : "Remove photo"}
            </button>
          )}
        </div>

        <div className="flex w-full flex-1 flex-col gap-4">
          <TextField id="profile-name" name="name" label="Name" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} maxLength={50} />
          <TextField id="profile-email" name="email" label="Email" value={user.email} readOnly disabled />

          <dl className="grid grid-cols-2 gap-y-1 text-sm">
            <dt className="text-muted">Account type</dt>
            <dd className="capitalize">{user.role}</dd>
            {joined && (
              <>
                <dt className="text-muted">Member since</dt>
                <dd>{joined}</dd>
              </>
            )}
          </dl>

          <button type="submit" disabled={!dirty || saving} className="btn-primary self-start">
            {saving && <Spinner size={16} />} Save changes
          </button>
        </div>
      </form>
    </div>
  );
}
