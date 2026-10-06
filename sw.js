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
            return key !== CACHE && key !== "logo-cache";
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

  var reqUrl = new URL(url);

  // SHOP LOGO
  if (reqUrl.pathname.indexOf("/logo-cache/") >= 0) {
    e.respondWith(
      caches.open("logo-cache").then(function (cache) {
        return cache.match(e.request).then(function (cached) {
          if (cached) {
            return cached;
          }

          return new Response(null, {
            status: 404
          });
        });
      })
    );

    return;
  }

  // SHOP-SPECIFIC MANIFEST
  if (
    reqUrl.pathname.endsWith("manifest.json") &&
    reqUrl.searchParams.has("shop")
  ) {
    var shop = reqUrl.searchParams.get("shop") || "";
    var name = reqUrl.searchParams.get("name") || "Barber";
    var hasLogo = reqUrl.searchParams.get("hasLogo") === "1";

    var encodedShop = encodeURIComponent(shop);

    var logoPath =
      "logo-cache/" + encodedShop + ".png";

    var icons;

    if (hasLogo) {
      icons = [
        {
          src: logoPath,
          sizes: "192x192",
          type: "image/png",
          purpose: "any"
        },
        {
          src: logoPath,
          sizes: "512x512",
          type: "image/png",
          purpose: "any maskable"
        }
      ];
    } else {
      icons = [
        {
          src: "icon.svg",
          sizes: "any",
          type: "image/svg+xml",
          purpose: "any maskable"
        },
        {
          src: "icon-512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any"
        }
      ];
    }

    var manifest = {
      /*
       * IMPORTANT:
       * Each shop gets a different PWA identity.
       * The identity is a real same-origin URL path,
       * not the client.html?shop=... URL.
       */
      id: "/barber-shop-" + encodeURIComponent(shop),

      name: name,

      short_name: name,

      /*
       * Keep the actual shop page here.
       */
      start_url:
        "./client.html?shop=" +
        encodeURIComponent(shop),

      /*
       * Keep the scope of the application.
       */
      scope: "./",

      display: "standalone",

      background_color: "#F3EEFB",

      theme_color: "#7C5CFF",

      icons: icons
    };

    e.respondWith(
      new Response(
        JSON.stringify(manifest),
        {
          status: 200,
          headers: {
            "Content-Type": "application/manifest+json",
            "Cache-Control": "no-store"
          }
        }
      )
    );

    return;
  }

  // NORMAL APP REQUESTS
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
