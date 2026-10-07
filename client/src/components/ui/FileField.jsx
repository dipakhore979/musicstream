import { useEffect, useState } from "react";

export default function FileField({ id, label, accept, file, onChange, required, hint, image = false }) {
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!image || !file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file, image]);

  function handleChange(e) {
    const picked = e.target.files?.[0] || null;
    e.target.value = ""; // lets the user re-pick the same file after clearing the form
    onChange(picked);
  }

  return (
    <div>
      <span className="mb-1 block text-sm font-semibold">
        {label}
        {required && <span className="text-red-400"> *</span>}
      </span>
      <div className="flex items-center gap-3">
        {preview && <img src={preview} alt="Preview" className="h-12 w-12 rounded object-cover" />}
        <label htmlFor={id} className="btn-outline cursor-pointer">
          {file ? "Change" : "Choose file"}
        </label>
        <span className="min-w-0 truncate text-sm text-muted">{file?.name || "No file selected"}</span>
        <input id={id} type="file" accept={accept} onChange={handleChange} className="sr-only" />
      </div>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
