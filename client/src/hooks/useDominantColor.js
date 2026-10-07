import { useEffect, useState } from "react";

const cache = new Map();
export const DEFAULT_HERO_COLOR = "#3a3a4a";

// Samples a tiny copy of the image and returns its dominant colour (favouring saturated pixels,
// darkened so white text stays readable). Cloudinary sends CORS headers, so canvas reads are allowed.
export function getDominantColor(src) {
  if (!src) return Promise.resolve(null);
  if (cache.has(src)) return Promise.resolve(cache.get(src));

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const size = 16;
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);

        let r = 0, g = 0, b = 0, weight = 0;
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] < 125) continue;
          const max = Math.max(data[i], data[i + 1], data[i + 2]);
          const min = Math.min(data[i], data[i + 1], data[i + 2]);
          const w = 0.2 + (max === 0 ? 0 : (max - min) / max); // grey pixels count less
          r += data[i] * w; g += data[i + 1] * w; b += data[i + 2] * w; weight += w;
        }
        if (!weight) return resolve(null);
        r /= weight; g /= weight; b /= weight;

        const k = Math.min(1, 150 / Math.max(r, g, b, 1)); // cap brightness
        const color = `rgb(${Math.round(r * k)}, ${Math.round(g * k)}, ${Math.round(b * k)})`;
        cache.set(src, color);
        resolve(color);
      } catch {
        resolve(null); // canvas tainted or unreadable: fall back to the default colour
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export function useDominantColor(src, fallback = DEFAULT_HERO_COLOR) {
  const [color, setColor] = useState(() => cache.get(src) || fallback);

  useEffect(() => {
    let cancelled = false;
    if (!src) {
      setColor(fallback);
      return;
    }
    getDominantColor(src).then((c) => !cancelled && setColor(c || fallback));
    return () => {
      cancelled = true;
    };
  }, [src, fallback]);

  return color;
}
