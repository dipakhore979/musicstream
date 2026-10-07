const GRID = "grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 xl:grid-cols-4";

export function CardSkeletonRow({ count = 6 }) {
  return (
    <div className="flex gap-4 overflow-hidden">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="w-40 shrink-0 md:w-44">
          <div className="skeleton aspect-[4/3] w-full" />
          <div className="skeleton mt-2 h-4 w-3/4" />
        </div>
      ))}
    </div>
  );
}

export function SongListSkeleton({ count = 5 }) {
  return (
    <div className="flex flex-col gap-1">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex items-center gap-3 p-2">
          <div className="skeleton h-10 w-10 shrink-0" />
          <div className="flex-1">
            <div className="skeleton mb-2 h-4 w-1/2" />
            <div className="skeleton h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function GridSkeleton({ count = 8 }) {
  return (
    <div className={GRID}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i}>
          <div className="skeleton aspect-[4/3] w-full" />
          <div className="skeleton mt-2 h-4 w-3/4" />
          <div className="skeleton mx-auto mt-3 h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}
