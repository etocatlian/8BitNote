// 8BitNote offline helper: keeps the app and its web fonts so it opens without a connection.
const CACHE = '8bitnote-v57';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-256.png', './icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // never cache Google sign-in or Drive
  if (/accounts\.google\.com|googleapis\.com\/(upload|drive)/.test(url.href)) return;
  // the app itself: try the network first (to pick up new versions), fall back to the saved copy
  if (url.origin === location.origin) {
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(CACHE).then(k => k.put(req, c)); return r; }).catch(() => caches.match(req).then(r => r || caches.match('./index.html'))));
    return;
  }
  // web fonts: saved after the first visit
  if (/fonts\.(googleapis|gstatic)\.com|api\.fontshare\.com|cdn\.fontshare\.com/.test(url.host)) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => { const c = r.clone(); caches.open(CACHE).then(k => k.put(req, c)); return r; })));
  }
});
