const CACHE_VERSION = "mcu-viewing-order-v8";
const APP_SHELL = [
  "/mcu/",
  "/mcu/index.html",
  "/mcu/style.css",
  "/mcu/nav.js",
  "/mcu/script.js",
  "/mcu/mcu.json",
  "/mcu/upcoming/",
  "/mcu/upcoming/index.html",
  "/mcu/upcoming.json",
  "/mcu/shows/",
  "/mcu/shows/index.html",
  "/mcu/shows.json",
  "/mcu/faq/",
  "/mcu/faq/index.html",
  "/mcu/changelog/",
  "/mcu/changelog/index.html",
  "/mcu/offline.html",
  "/mcu/manifest.webmanifest",
  "/mcu/icon.svg",
  "/mcu/icon-192.png",
  "/mcu/icon-512.png",
  "/mcu/icon-maskable-512.png",
  "/favicon/favicon-96x96.png",
  "/menubar/home.svg",
  "/menubar/articles.svg",
  "/menubar/products.svg",
  "/menubar/faq.svg",
  "/menubar/projects.svg",
  "/menubar/import.svg",
  "/menubar/discord.svg",
  "/menubar/x.svg",
  "/menubar/pay.svg",
  "/menubar/toggletheme.svg",
  "/menubar/notifications.svg",
  "/menubar/add-to-home.svg"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith("mcu-viewing-order-") && key !== CACHE_VERSION).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

async function networkFirst(request, fallbackUrl) {
  const cache = await caches.open(CACHE_VERSION);
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch (error) {
    return (await cache.match(request)) || (fallbackUrl ? await cache.match(fallbackUrl) : Response.error());
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_VERSION);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then(response => {
      if (response && response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);
  return cached || (await network) || Response.error();
}

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate" && url.pathname.startsWith("/mcu/")) {
    event.respondWith(networkFirst(request, "/mcu/offline.html"));
    return;
  }

  if (url.pathname.startsWith("/mcu/") && url.pathname.endsWith(".json")) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (url.pathname.startsWith("/mcu/") || url.pathname.startsWith("/menubar/") || url.pathname.startsWith("/favicon/")) {
    event.respondWith(staleWhileRevalidate(request));
  }
});
