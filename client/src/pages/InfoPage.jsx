// Simple static page for the Premium / Support / Download links in the top bar.
export default function InfoPage({ title, children }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 md:px-8">
      <h1 className="mb-4 text-3xl font-bold md:text-4xl">{title}</h1>
      <div className="space-y-3 text-lg text-muted">{children}</div>
    </div>
  );
}
