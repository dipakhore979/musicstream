/*
  MusicStream service worker. Deliberately conservative:
   - It never touches /api/* (private, per-user data) or cross-origin requests (Cloudinary audio and
     images need Range requests, which the browser handles best on its own).
   - Page navigations go network-first, so users always get the latest app; the cached copy is only a
     fallback for when the network is down.
   - Hashed build files (/assets/*) never change, so they're cached forever for fast repeat loads.
*/
const VERSION = "v2";
const STATIC_CACHE = `musicstream-static-${VERSION}`;
const PAGE_CACHE = `musicstream-pages-${VERSION}`;
const PRECACHE = ["/offline.html", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== STATIC_CACHE && k !== PAGE_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || req.headers.has("range")) return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  // Every app route serves the same index.html (single-page app), so one cached copy is the fallback.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(PAGE_CACHE).then((cache) => cache.put("/index.html", copy));
          return res;
        })
        .catch(async () => (await caches.match("/index.html")) || caches.match("/offline.html"))
    );
    return;
  }

  if (url.pathname.startsWith("/assets/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.match(req).then(
        (cached) =>
          cached ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(STATIC_CACHE).then((cache) => cache.put(req, copy));
            }
            return res;
          })
      )
    );
  }
});
