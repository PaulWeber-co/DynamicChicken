/* Knuddl Service Worker — offline-first für eine reine Static-Site. */
const VERSION = 'knuddl-v1';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './config.js',
  './styles/tokens.css',
  './styles/base.css',
  './styles/island.css',
  './styles/screens.css',
  './styles/games.css',
  './src/main.js',
  './src/games/eggDuel.js',
  './src/games/grainRush.js',
  './src/games/heartbeat.js',
  './src/games/index.js',
  './src/games/memory.js',
  './src/games/moodMatch.js',
  './src/pet/chicken.js',
  './src/pet/moods.js',
  './src/state/catalog.js',
  './src/state/events.js',
  './src/state/model.js',
  './src/state/store.js',
  './src/sync/carrier.js',
  './src/sync/cloud.js',
  './src/sync/index.js',
  './src/sync/solo.js',
  './src/ui/actions.js',
  './src/ui/gameHost.js',
  './src/ui/island.js',
  './src/ui/sheet.js',
  './src/ui/shell.js',
  './src/ui/toast.js',
  './src/ui/screens/games.js',
  './src/ui/screens/home.js',
  './src/ui/screens/settings.js',
  './src/ui/screens/shop.js',
  './src/ui/screens/us.js',
  './src/util/codec.js',
  './src/util/dom.js',
  './src/util/feedback.js',
  './src/util/rng.js',
  './src/util/time.js',
  './icons/favicon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './icons/maskable-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(VERSION)
      // einzeln, damit eine fehlende Datei nicht die ganze Installation kippt
      .then((c) => Promise.all(SHELL.map((u) => c.add(u).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Cloud-Sync nie cachen

  // Navigationen: Netz zuerst, sonst die gecachte Shell (SPA bleibt offline nutzbar)
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).catch(() => caches.match('./index.html', { ignoreSearch: true }))
    );
    return;
  }

  // Assets: aus dem Cache, im Hintergrund auffrischen
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => {
      const net = fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => hit);
      return hit || net;
    })
  );
});

self.addEventListener('message', (e) => {
  if (e.data === 'skip-waiting') self.skipWaiting();
});
