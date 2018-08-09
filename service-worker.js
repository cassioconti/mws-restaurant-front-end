const idbHelper = require('./js/idbhelper');

const staticCacheName = 'restaurant-review-static-v1';
const dataServer = 'http://localhost:1337';

// Listen for install event, set callback
self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(staticCacheName).then(function (cache) {
            return cache.addAll(
                [
                    '/css/styles.css',
                    '/js/main.js',
                    '/js/restaurant_info.js',
                    '/index.html',
                ]
            );
        })
    );
});

self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys().then(function (cacheNames) {
            return Promise.all(
                cacheNames.filter(function (cacheName) {
                    return cacheName.startsWith('restaurant-review-') &&
                        cacheName !== staticCacheName;
                }).map(function (cacheName) {
                    return caches.delete(cacheName);
                })
            );
        })
    );
});

// Lister for fetch event
self.addEventListener('fetch', function (event) {
    var requestUrl = new URL(event.request.url);
    if (requestUrl.origin === location.origin) {
        event.respondWith(
            caches.open(staticCacheName).then(function (cache) {
                return cache.match(event.request).then(function (response) {
                    if (response) {
                        // Return the cached response, but update the cache asynchronously
                        updateCache(event.request, cache);
                        return response;
                    }

                    return updateCache(event.request, cache);
                });
            })
        );

        return;
    }

    if (requestUrl.origin === dataServer) {
        // Return the cached response if any, but update the cache asynchronously
        switch (true) {
            case new RegExp(`^${dataServer}\\/restaurants$`).test(event.request.url):
                event.respondWith(idbHelper.getAllRestaurants()
                    .then(restaurants => {
                        updateDatabase(event.request, restaurants => idbHelper.addRestaurants(restaurants));
                        return new Response(JSON.stringify(restaurants));
                    })
                    .catch(() => updateDatabase(event.request, restaurants => idbHelper.addRestaurants(restaurants)))
                    .catch(error => console.error(error)));
                break;
            case new RegExp(`^${dataServer}\\/restaurants\\/\\d+$`).test(event.request.url):
                const id = Number(event.request.url.replace(`${dataServer}/restaurants/`, ''));
                event.respondWith(idbHelper.getRestaurant(id)
                    .then(restaurant => {
                        updateDatabase(event.request, restaurant => idbHelper.addRestaurants([restaurant]));
                        return new Response(JSON.stringify(restaurant));
                    })
                    .catch(() => updateDatabase(event.request, restaurant => idbHelper.addRestaurants([restaurant])))
                    .catch(error => console.error(error)));
                break;
            case new RegExp(`^${dataServer}\\/reviews\\?restaurant_id=\\d+$`).test(event.request.url):
                const restaurantId = Number(event.request.url.replace(new RegExp(`^${dataServer}\\/reviews\\?restaurant_id=`), ''));
                event.respondWith(idbHelper.getAllReviewsForRestaurant(restaurantId)
                    .then(reviews => {
                        if (reviews.length === 0) return Promise.reject();

                        updateDatabase(event.request, reviews => idbHelper.addReviews(reviews));
                        return new Response(JSON.stringify(reviews));
                    })
                    .catch(e => updateDatabase(event.request, reviews => idbHelper.addReviews(reviews)))
                    .catch(error => console.error(error)));
                break;
            default:
                break;
        }

        return;
    }

    event.respondWith(
        caches.match(event.request).then(function (response) {
            return response || fetch(event.request);
        })
    );
});


// Update the cache and return the most up to date response
function updateCache(request, cache) {
    return fetch(request).then(function (response) {
        cache.put(request, response.clone());
        return response;
    });
}

function updateDatabase(request, responseHandler) {
    return fetch(request).then(function (response) {
        response.clone().json()
            .then(responseHandler)
            .catch(error => console.error(error));
        return response;
    });
}