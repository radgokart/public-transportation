var staticCacheName = 'dom-static';
var bartStationCache = 'dom-bart-stations';
var tripAttrCache = 'dom-trip-attributes';
var allCaches = [
  staticCacheName,
  bartStationCache,
  tripAttrCache
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(staticCacheName).then(function(cache) {
      return cache.addAll([
        'https://rubalcava.github.io/public-transportation/index.html',
        'https://rubalcava.github.io/public-transportation/js/indexController.js',
        'https://rubalcava.github.io/public-transportation/js/lib/jquery-3.1.0.min.js',
        'https://rubalcava.github.io/public-transportation/js/lib/knockout-min.js',
        'https://rubalcava.github.io/public-transportation/css/bootstrap.min.css',
        'https://rubalcava.github.io/public-transportation/css/styles.css'
      ]);
    })
  );
});

self.addEventListener('fetch', function(event) {
    /* This adds the response full of stations to the cache if not already there. KOjs can work with it offline now. */
    if (event.request.url.startsWith('https://api.bart.gov/api/stn')) {
        caches.match(event.request).then(function(response) {
            if (response === undefined) {
                caches.open(bartStationCache).then(function(cache) {
                    cache.add('https://api.bart.gov/api/stn.aspx?cmd=stns&key=MW9S-E7SL-26DU-VV8V');
                });
            }
        });
    }
    /* This adds the response for the route request to the cache if not already there. KOjs can work with it offline now. */
    if (event.request.url.startsWith('https://api.bart.gov/api/sched')) {
        caches.match(event.request).then(function(response) {
            if (response === undefined) {
                caches.open(tripAttrCache).then(function(cache) {
                    cache.add(event.request.url);
                });
            }
        });
    }
    event.respondWith(
        caches.match(event.request).then(function(response) {
            return response || fetch(event.request).catch(function(error) {
                console.log('Requested resource not in cache, and network request failed.');
            });
    })
  );
});
