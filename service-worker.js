/*
// Initialize required variables
var shellCacheName = 'shell@0.0.1';
var filesToCache = [
  '/index.html',
  '/main.js',
  '/style.css',

  '/modules/Navball/Renderer.js',
  '/modules/Convert.js',
  '/modules/KRPC.js',
  '/modules/Map.js',
  '/modules/Navball.js',
  '/modules/Table.js',

  '/img/skybox.jpg',
  '/img/textures/navball.png',
  '/img/textures/navball-normal.png',

  '/img/indicators/antinormal.png',
  '/img/indicators/antitarget.png',
  '/img/indicators/level.png',
  '/img/indicators/maneuver.png',
  '/img/indicators/normal.png',
  '/img/indicators/prograde.png',
  '/img/indicators/radialout.png',
  '/img/indicators/radial.png',
  '/img/indicators/retrograde.png',
  '/img/indicators/surfacepro.png',
  '/img/indicators/surfaceretro.png',
  '/img/indicators/target.png',

  '/img/icons/favicon.png',
  '/img/icons/favicon2x.png',
  '/img/icons/favicon3x.png',
  '/img/icons/favicon4x.png',
];

// Listen to installation event
self.addEventListener('install', function(e) {
  console.log('[ServiceWorker] Install');
  e.waitUntil(
    caches.open(shellCacheName).then(function(cache) {
      console.log('[ServiceWorker] Caching app shell');
      return cache.addAll(filesToCache);
    })
  );
});


self.addEventListener('activate', function(e) {
  console.log('[ServiceWorker] Activate');
  e.waitUntil(
    // Get all cache containers
    caches.keys().then(function(keyList) {
      return Promise.all(keyList.map(function(key) {
        // Check and remove invalid cache containers
        if (key !== shellCacheName) {
          console.log('[ServiceWorker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );

  // Enforce immediate scope control
  return self.clients.claim();
});

// Listen to fetching event
self.addEventListener('fetch', function(e) {
  console.log('[ServiceWorker] Fetch', e.request.url);
  e.respondWith(
    caches.match(e.request).then(function(response) {
      return response || fetch(e.request);
    })
  );
});
*/
