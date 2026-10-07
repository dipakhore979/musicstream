import { useEffect, useState } from "react";
import { Music2 } from "lucide-react";

// Shows the image, or a gradient placeholder when there's no URL or it fails to load.
export default function CoverImage({ src, alt = "", rounded = false, icon: Icon = Music2, className = "" }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);

  const shape = rounded ? "rounded-full" : "rounded-md";

  if (!src || failed) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-surface-highlight to-surface-raised text-muted ${shape} ${className}`}
      >
        <Icon size="40%" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`object-cover ${shape} ${className}`}
    />
  );
}
