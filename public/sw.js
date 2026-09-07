const CACHE_NAME = "iballpassyou-static-v2";
const STATIC_PREFIXES = ["/_next/static/", "/brand/", "/icon.svg", "/manifest.webmanifest"];

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;
  const path = new URL(request.url).pathname;
  if (path.endsWith(".mp4")) return;
  if (!STATIC_PREFIXES.some((prefix) => path.startsWith(prefix))) return;
  event.respondWith(caches.open(CACHE_NAME).then(async (cache) => {
    const cached = await cache.match(request);
    const network = fetch(request).then((response) => { if (response.ok) cache.put(request, response.clone()); return response; }).catch(() => cached);
    return cached || network;
  }));
});
