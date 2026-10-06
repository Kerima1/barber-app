const CACHE = "barber-v23";

self.addEventListener("install", function (e) {
  self.skipWaiting();
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
    })
  );

  self.clients.claim();
});

self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;

  var url = e.request.url;

  // Never intercept Firebase requests.
  if (url.indexOf("firestore.googleapis.com") >= 0) return;
  if (url.indexOf("identitytoolkit.googleapis.com") >= 0) return;
  if (url.indexOf("securetoken.googleapis.com") >= 0) return;

  // ---------------------------------------------------------
  // NORMAL APP REQUESTS
  // ---------------------------------------------------------
  //
  // Network first. If there is no internet, use the cached version.
  // manifest.json / client-manifest.json are now plain static files —
  // every shop shares the same one app identity, so there's nothing
  // shop-specific to generate here anymore.
  //
  e.respondWith(
    fetch(e.request)
      .then(function (response) {
        if (response && response.status === 200) {
          var clone = response.clone();

          caches.open(CACHE).then(function (cache) {
            cache.put(e.request, clone);
          });
        }

        return response;
      })
      .catch(function () {
        return caches.match(e.request).then(function (cached) {
          if (cached) {
            return cached;
          }

          var isClientPage =
            url.indexOf("client.html") >= 0;

          return caches.match(
            isClientPage
              ? "client.html"
              : "index.html"
          );
        });
      })
  );
});
