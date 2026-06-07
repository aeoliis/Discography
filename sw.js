const CACHE = 'discography-v1';
const SHELL = ['/Discography/', '/Discography/index.html'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Always fetch MusicBrainz API calls from network
  if (url.hostname.includes('musicbrainz.org')) {
    e.respondWith(fetch(e.request));
    return;
  }

  // For Google Fonts, try network first then cache
  if (url.hostname.includes('fonts')) {
    e.respondWith(
      fetch(e.request).then(r => {
        const clone = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return r;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  // App shell: cache first
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(r2 => {
      const clone = r2.clone();
      caches.open(CACHE).then(c => c.put(e.request, clone));
      return r2;
    }))
  );
});
