export default function TextArea({ label, id, error, ...props }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-semibold">{label}</label>
      <textarea id={id} rows={3} className="input resize-y" {...props} />
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  );
}
