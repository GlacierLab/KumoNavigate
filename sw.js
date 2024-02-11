var APP_PREFIX = '云酱游戏导航';
var VERSION = '2.20240211';
var CACHE_NAME = APP_PREFIX + VERSION
var URLS = []

// Respond with cached resources
self.addEventListener('fetch', function (event) {
    if (event.request.url.indexOf("getVersionWorker") > 0) {
        event.respondWith(new Response(VERSION));
        return;
    }
    const getCacheName = url => {
        if (url.indexOf("/static/") > 0 && url.split("/").length >= 6) {
            return "StaticCache"
        };
        return CACHE_NAME;
    }

    if (event.request.method == "GET" && (event.request.url.indexOf("http") == 0) && (event.request.url.indexOf("ForceNoCache") == -1) && (event.request.url.indexOf("doubleclick") == -1) && (event.request.url.indexOf("google") == -1)) {
        event.respondWith(
            caches.open(getCacheName(event.request.url)).then(function (cache) {
                return cache.match(event.request).then(function (response) {
                    return response || fetch(event.request).then(function (response) {
                        cache.put(event.request, response.clone());
                        return response;
                    });
                });
            })

        );
    } else {
        event.respondWith(fetch(event.request))
    }
});
// Cache resources
self.addEventListener('install', function (e) {
    e.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            console.log('installing cache : ' + CACHE_NAME)
            return cache.addAll(URLS)
        })
    )
})

// Delete outdated caches
self.addEventListener('activate', function (e) {
    e.waitUntil(
        caches.keys().then(function (keyList) {
            // `keyList` contains all cache names under your username.github.io
            // filter out ones that has this app prefix to create white list
            var cacheWhitelist = keyList.filter(function (key) {
                return key.indexOf(APP_PREFIX)
            })
            // add current cache name to white list
            cacheWhitelist.push(CACHE_NAME)
            cacheWhitelist.push("StaticCache")

            return Promise.all(keyList.map(function (key, i) {
                if (cacheWhitelist.indexOf(key) === -1) {
                    console.log('deleting cache : ' + keyList[i])
                    return caches.delete(keyList[i])
                }
            }))
        })
    )
})
