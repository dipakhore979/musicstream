import { useState } from "react";
import toast from "react-hot-toast";
import { api, getErrorMessage, getFieldErrors } from "../../lib/api.js";
import Modal from "../../components/ui/Modal.jsx";
import TextField from "../../components/ui/TextField.jsx";
import TextArea from "../../components/ui/TextArea.jsx";
import SelectField from "../../components/ui/SelectField.jsx";
import FileField from "../../components/ui/FileField.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import CoverImage from "../../components/music/CoverImage.jsx";
import { getSongCover } from "../../lib/format.js";

const IMAGE_TYPES = "image/jpeg,image/png,image/webp";

// Shared by the three edit dialogs: sends the form as multipart (so a new picture can ride along),
// then refreshes the admin lists and closes. Field errors from the server show under their inputs.
function useSave({ url, buildForm, successMessage, onSaved, onClose }) {
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  async function save(e) {
    e.preventDefault();
    const local = buildForm.validate?.();
    if (local) {
      setErrors(local);
      return;
    }
    setSaving(true);
    setErrors({});
    try {
      await api.patch(url, buildForm.build(), { timeout: 120000 });
      toast.success(successMessage);
      onSaved();
      onClose();
    } catch (err) {
      const fieldErrors = getFieldErrors(err);
      if (Object.keys(fieldErrors).length) setErrors(fieldErrors);
      else toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }
  return { errors, saving, save };
}

function Actions({ saving, onClose }) {
  return (
    <div className="mt-2 flex justify-end gap-3">
      <button type="button" onClick={onClose} className="btn-outline">Cancel</button>
      <button type="submit" disabled={saving} className="btn-primary">
        {saving && <Spinner size={16} />} Save changes
      </button>
    </div>
  );
}

function CurrentPicture({ src, round = false }) {
  return (
    <div className="flex items-center gap-3">
      <CoverImage src={src} rounded={round} className="h-14 w-14 shrink-0" />
      <span className="text-xs text-muted">Current picture. Choose a file below to replace it.</span>
    </div>
  );
}

export function EditArtistModal({ artist, onClose, onSaved }) {
  const [form, setForm] = useState({ name: artist.name, bio: artist.bio || "" });
  const [image, setImage] = useState(null);
  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const { errors, saving, save } = useSave({
    url: `/artists/${artist.id}`,
    successMessage: "Artist updated",
    onSaved,
    onClose,
    buildForm: {
      validate: () => (form.name.trim() ? null : { name: "Name is required" }),
      build: () => {
        const fd = new FormData();
        fd.append("name", form.name);
        fd.append("bio", form.bio); // an empty bio clears it
        if (image) fd.append("image", image);
        return fd;
      },
    },
  });

  return (
    <Modal title="Edit artist" onClose={onClose}>
      <form onSubmit={save} className="flex flex-col gap-4" noValidate>
        <TextField id="edit-artist-name" name="name" label="Name" value={form.name} onChange={onChange} error={errors.name} autoFocus />
        <TextArea id="edit-artist-bio" name="bio" label="Bio" value={form.bio} onChange={onChange} error={errors.bio} />
        <CurrentPicture src={artist.image?.url} round />
        <FileField id="edit-artist-image" label="Replace image" accept={IMAGE_TYPES} file={image} onChange={setImage} image hint="JPG, PNG or WebP, up to 5 MB" />
        <Actions saving={saving} onClose={onClose} />
      </form>
    </Modal>
  );
}

export function EditAlbumModal({ album, artists, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: album.title,
    artist: album.artist?.id ?? "",
    releaseYear: album.releaseYear ?? "",
    description: album.description || "",
  });
  const [cover, setCover] = useState(null);
  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const { errors, saving, save } = useSave({
    url: `/albums/${album.id}`,
    successMessage: "Album updated",
    onSaved,
    onClose,
    buildForm: {
      validate: () => {
        const problems = {};
        if (!form.title.trim()) problems.title = "Title is required";
        if (!form.artist) problems.artist = "Choose an artist";
        return Object.keys(problems).length ? problems : null;
      },
      build: () => {
        const fd = new FormData();
        fd.append("title", form.title);
        fd.append("artist", form.artist);
        if (form.releaseYear !== "") fd.append("releaseYear", form.releaseYear);
        fd.append("description", form.description);
        if (cover) fd.append("cover", cover);
        return fd;
      },
    },
  });

  return (
    <Modal title="Edit album" onClose={onClose}>
      <form onSubmit={save} className="flex flex-col gap-4" noValidate>
        <TextField id="edit-album-title" name="title" label="Title" value={form.title} onChange={onChange} error={errors.title} autoFocus />
        <SelectField
          id="edit-album-artist" name="artist" label="Artist" placeholder="Choose an artist" value={form.artist} onChange={onChange}
          options={artists.map((a) => ({ value: a.id, label: a.name }))} error={errors.artist}
        />
        <TextField id="edit-album-year" name="releaseYear" type="number" label="Release year" min="1900" max="2100" value={form.releaseYear} onChange={onChange} error={errors.releaseYear} />
        <TextArea id="edit-album-desc" name="description" label="Description" value={form.description} onChange={onChange} error={errors.description} />
        <CurrentPicture src={album.coverImage?.url} />
        <FileField id="edit-album-cover" label="Replace cover" accept={IMAGE_TYPES} file={cover} onChange={setCover} image hint="JPG, PNG or WebP, up to 5 MB" />
        <Actions saving={saving} onClose={onClose} />
      </form>
    </Modal>
  );
}

export function EditSongModal({ song, artists, albums, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: song.title,
    artist: song.artist?.id ?? "",
    album: song.album?.id ?? "",
    genre: song.genre || "",
    trackNumber: song.trackNumber ?? "",
  });
  const [cover, setCover] = useState(null);
  const [allowDownload, setAllowDownload] = useState(song.downloadable !== false);
  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  // Moving a song to another artist clears its album, because albums belong to one artist.
  const onArtistChange = (e) => setForm((f) => ({ ...f, artist: e.target.value, album: "" }));

  const albumOptions = albums.filter((a) => a.artist?.id === form.artist).map((a) => ({ value: a.id, label: a.title }));

  const { errors, saving, save } = useSave({
    url: `/songs/${song.id}`,
    successMessage: "Song updated",
    onSaved,
    onClose,
    buildForm: {
      validate: () => {
        const problems = {};
        if (!form.title.trim()) problems.title = "Title is required";
        if (!form.artist) problems.artist = "Choose an artist";
        return Object.keys(problems).length ? problems : null;
      },
      build: () => {
        const fd = new FormData();
        fd.append("title", form.title);
        fd.append("artist", form.artist);
        fd.append("album", form.album); // "" turns the song into a single
        fd.append("genre", form.genre);
        if (form.trackNumber !== "") fd.append("trackNumber", form.trackNumber);
        fd.append("downloadable", String(allowDownload));
        if (cover) fd.append("cover", cover);
        return fd;
      },
    },
  });

  return (
    <Modal title="Edit song" onClose={onClose}>
      <form onSubmit={save} className="flex flex-col gap-4" noValidate>
        <TextField id="edit-song-title" name="title" label="Title" value={form.title} onChange={onChange} error={errors.title} autoFocus />
        <SelectField
          id="edit-song-artist" name="artist" label="Artist" placeholder="Choose an artist" value={form.artist} onChange={onArtistChange}
          options={artists.map((a) => ({ value: a.id, label: a.name }))} error={errors.artist}
        />
        <SelectField
          id="edit-song-album" name="album" label="Album" placeholder="No album (single)" value={form.album} onChange={onChange}
          options={albumOptions} error={errors.album}
        />
        <div className="grid grid-cols-2 gap-3">
          <TextField id="edit-song-genre" name="genre" label="Genre" value={form.genre} onChange={onChange} error={errors.genre} />
          <TextField id="edit-song-track" name="trackNumber" type="number" label="Track #" min="1" value={form.trackNumber} onChange={onChange} error={errors.trackNumber} />
        </div>
        <CurrentPicture src={getSongCover(song)} />
        <FileField id="edit-song-cover" label="Replace cover" accept={IMAGE_TYPES} file={cover} onChange={setCover} image hint="Falls back to the album cover if the song has none" />
        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <input type="checkbox" checked={allowDownload} onChange={(e) => setAllowDownload(e.target.checked)} className="mt-1 h-4 w-4 accent-[#1db954]" />
          <span>
            Allow users to download this song
            <span className="block text-xs text-muted">Only enable this for music you have the right to share.</span>
          </span>
        </label>
        <p className="text-xs text-muted">The audio file itself can't be replaced. To change it, delete the song and upload it again.</p>
        <Actions saving={saving} onClose={onClose} />
      </form>
    </Modal>
  );
}
