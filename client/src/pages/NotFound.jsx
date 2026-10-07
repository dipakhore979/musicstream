import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-4xl font-bold">Page not found</h1>
      <p className="text-muted">We couldn't find what you were looking for.</p>
      <Link
        to="/"
        className="rounded-full bg-white px-6 py-2 font-semibold text-black transition-transform hover:scale-105"
      >
        Back to Home
      </Link>
    </div>
  );
}
