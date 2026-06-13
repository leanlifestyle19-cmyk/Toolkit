const CACHE = 'toolkit-v3';
const SHELL = ['./index.html', './manifest.json'];

/* ── INSTALL: cache the app shell ── */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache =>
      Promise.allSettled(
        SHELL.map(url =>
          fetch(url).then(res => { if (res.ok) cache.put(url, res); }).catch(() => {})
        )
      )
    ).then(() => self.skipWaiting())
  );
});

/* ── ACTIVATE: clear old caches ── */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* ── FETCH: cache-first for everything ── */
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.open(CACHE).then(cache =>
      cache.match(e.request).then(cached => {
        // Return cached immediately, update in background
        const fetchPromise = fetch(e.request)
          .then(res => {
            if (res && res.status === 200) {
              cache.put(e.request, res.clone());
            }
            return res;
          })
          .catch(() => cached); // offline fallback

        return cached || fetchPromise;
      })
    )
  );
});