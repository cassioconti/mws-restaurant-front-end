const staticCacheName = 'restaurant-review-static-v1';

// Listen for install event, set callback
self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(staticCacheName).then(function (cache) {
            return cache.addAll(
                [
                    '/css/styles.css',
                    '/data/restaurants.json',
                    '/js/dbhelper.js',
                    '/js/main.js',
                    '/js/restaurant_info.js',
                    '/index.html',
                ]
            );
        })
    );
});

function updateCache(request, cache) {
    return fetch(request).then(function (response) {
        cache.put(request, response.clone());
        return response;
    });
}

self.addEventListener('fetch', function (event) {
    var requestUrl = new URL(event.request.url);
    if (requestUrl.origin === location.origin) {
        event.respondWith(
            caches.open(staticCacheName).then(function (cache) {
                return cache.match(event.request).then(function (response) {
                    if (response) {
                        updateCache(event.request, cache);
                        return response;
                    }

                    return updateCache(event.request, cache);
                });
            })
        );

        return;
    }

    event.respondWith(
        caches.match(event.request).then(function (response) {
            return response || fetch(event.request);
        })
    );
});