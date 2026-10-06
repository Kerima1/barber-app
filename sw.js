const CACHE = "barber-v25";

// Everything the apps need to open with no internet. Saved the moment the
// service worker installs, so it doesn't depend on the person having already
// used every screen while online. Each file is saved on its own: one that
// fails (bad signal) never blocks the others.
const PRECACHE = [
  "./",
  "index.html",
  "client.html",
  "manifest.json",
  "client-manifest.json",
  "icon.svg",
  "icon-512.png",
  "apple-touch-icon.png",
  "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js",
  "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js",
  "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js",
  "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
  "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js",
  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css",
  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js",
  "https://cdn.jsdelivr.net/npm/leaflet.markercluster@1.5.3/dist/MarkerCluster.css",
  "https://cdn.jsdelivr.net/npm/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css",
  "https://cdn.jsdelivr.net/npm/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js"
];

// If the network hasn't answered after this long and we have a saved copy,
// use the saved copy. Covers "connected to wifi but no actual internet", where
// a request can hang for a very long time instead of failing straight away.
const NETWORK_TIMEOUT_MS = 4000;

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return Promise.all(
        PRECACHE.map(function (url) {
          return cache.add(url).catch(function () {});
        })
      );
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys
          .filter(function (key) {
            return key !== CACHE;
          })
          .map(function (key) {
            return caches.delete(key);
          })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;

  var url = e.request.url;

  // Never intercept Firebase requests.
  if (url.indexOf("firestore.googleapis.com") >= 0) return;
  if (url.indexOf("identitytoolkit.googleapis.com") >= 0) return;
  if (url.indexOf("securetoken.googleapis.com") >= 0) return;

  var isNavigation = e.request.mode === "navigate";
  // For pages, ignore the ?shop=... part when looking for a saved copy: the
  // page itself is the same file for every shop.
  var matchOpts = isNavigation ? { ignoreSearch: true } : undefined;

  function fromCache() {
    return caches.match(e.request, matchOpts).then(function (cached) {
      if (cached) return cached;
      if (!isNavigation) return undefined;
      var isClientPage = url.indexOf("client.html") >= 0;
      return caches.match(isClientPage ? "client.html" : "index.html");
    });
  }

  // Network first (so updates always arrive), saved copy as the fallback.
  e.respondWith(
    new Promise(function (resolve) {
      var settled = false;

      var timer = setTimeout(function () {
        fromCache().then(function (cached) {
          if (cached && !settled) {
            settled = true;
            resolve(cached);
          }
        });
      }, NETWORK_TIMEOUT_MS);

      fetch(e.request)
        .then(function (response) {
          clearTimeout(timer);
          if (response && response.status === 200) {
            var clone = response.clone();
            caches.open(CACHE).then(function (cache) {
              cache.put(e.request, clone);
            });
          }
          if (!settled) {
            settled = true;
            resolve(response);
          }
        })
        .catch(function () {
          clearTimeout(timer);
          if (settled) return;
          fromCache().then(function (cached) {
            if (settled) return;
            settled = true;
            resolve(cached || Response.error());
          });
        });
    })
  );
});
