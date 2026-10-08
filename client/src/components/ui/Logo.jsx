import { useId } from "react";

// Five rounded "sound bars" on a green tile. The same artwork lives in /public/favicon.svg and the app icons.
const BARS = [
  { x: 11, h: 18 },
  { x: 20, h: 32 },
  { x: 29, h: 44 },
  { x: 38, h: 28 },
  { x: 47, h: 14 },
];

// The bars bounce when you hover anything with the Tailwind `group` class around the logo.
export function LogoMark({ size = 32, className = "" }) {
  const gradientId = `logo-${useId().replace(/:/g, "")}`; // unique per instance, safe inside url(#...)
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} role="img" aria-label="MusicStream" className={`logo-mark ${className}`}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#22e06b" />
          <stop offset="1" stopColor="#0f9d46" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill={`url(#${gradientId})`} />
      {BARS.map((b, i) => (
        <rect
          key={b.x}
          className="logo-bar"
          x={b.x}
          y={32 - b.h / 2}
          width="6"
          height={b.h}
          rx="3"
          fill="#0a0a0a"
          style={{ animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </svg>
  );
}

export function Wordmark({ className = "" }) {
  return (
    <span className={`font-sans font-extrabold tracking-tight ${className}`}>
      <span className="text-white">Music</span>
      <span className="text-brand">Stream</span>
    </span>
  );
}
