export default function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg bg-surface-raised/60 px-6 py-12 text-center">
      {Icon && <Icon size={40} className="text-muted" />}
      <h3 className="text-lg font-bold">{title}</h3>
      {message && <p className="max-w-sm text-sm text-muted">{message}</p>}
      {action}
    </div>
  );
}
