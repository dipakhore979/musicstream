import Spinner from "./Spinner.jsx";

export default function LoadMore({ hasMore, loading, onClick }) {
  if (!hasMore) return null;
  return (
    <div className="mt-4 flex justify-center">
      <button onClick={onClick} disabled={loading} className="btn-outline">
        {loading && <Spinner size={16} />}
        Load more
      </button>
    </div>
  );
}
