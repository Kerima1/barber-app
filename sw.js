const CACHE = "barber-v20";

self.addEventListener("install", function (e) {
  self.skipWaiting();
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (key) { return key !== CACHE; })
            .map(function (key) { return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;

  var url = e.request.url;
  // Never touch Firebase's own network calls — let those go straight through.
  if (url.indexOf("firestore.googleapis.com") >= 0) return;
  if (url.indexOf("identitytoolkit.googleapis.com") >= 0) return;
  if (url.indexOf("securetoken.googleapis.com") >= 0) return;

  // A shop's client page asks for manifest.json?shop=slug&name=... — this
  // is a REAL fetchable URL (unlike a blob: URL), which is what Chrome's
  // installability check requires before it'll offer "Install" at all.
  // We synthesize the response here instead of needing an actual file per shop.
  var reqUrl = new URL(url);
  if (reqUrl.pathname.endsWith("manifest.json") && reqUrl.searchParams.has("shop")) {
    var shop = reqUrl.searchParams.get("shop");
    var name = reqUrl.searchParams.get("name") || "Barber";
    var manifest = {
      id: "./client.html?shop=" + shop,
      name: name,
      short_name: name,
      start_url: "client.html?shop=" + shop,
      scope: "./",
      display: "standalone",
      background_color: "#F3EEFB",
      theme_color: "#7C5CFF",
      icons: [
        { src: "icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" },
        { src: "icon-512.png", sizes: "512x512", type: "image/png" }
      ]
    };
    e.respondWith(new Response(JSON.stringify(manifest), {
      headers: { "Content-Type": "application/manifest+json" }
    }));
    return;
  }

  // Network-first: always try to get the latest version. Only fall back to
  // a cached copy if the network request fails (e.g. no internet).
  e.respondWith(
    fetch(e.request).then(function (response) {
      if (response && response.status === 200) {
        var clone = response.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, clone); });
      }
      return response;
    }).catch(function () {
      return caches.match(e.request).then(function (cached) {
        if (cached) return cached;
        // No exact cached copy for this URL — fall back to the SAME kind of
        // page (client vs owner), never cross the two.
        var isClientPage = url.indexOf("client.html") >= 0;
        return caches.match(isClientPage ? "client.html" : "index.html");
      });
    })
  );
});
