import { Loader2 } from "lucide-react";

export default function Spinner({ size = 20, className = "" }) {
  return <Loader2 size={size} className={`animate-spin ${className}`} aria-label="Loading" />;
}

export function FullScreenSpinner() {
  return (
    <div className="flex h-full items-center justify-center bg-surface-base text-brand">
      <Spinner size={36} />
    </div>
  );
}

export function PageSpinner() {
  return (
    <div className="flex h-64 items-center justify-center text-brand">
      <Spinner size={32} />
    </div>
  );
}
