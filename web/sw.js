// ─── sw.js ────────────────────────────────────────────────────────────────────
// Service worker PWA (NC-H). Cache tĩnh để mở nhanh; KHÔNG cache API Apps Script.

const CACHE = 'cscc-v1';
const ASSETS = [
  'css/main.css', 'js/config.js', 'js/auth.js', 'js/api.js',
  'chamcong.html', 'icon.svg', 'manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS).catch(() => {})));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  // Bỏ qua API (Apps Script) và request không phải GET → luôn đi mạng
  if (req.method !== 'GET' || req.url.indexOf('script.google') !== -1 || req.url.indexOf('googleusercontent') !== -1) return;
  e.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(resp => {
      const copy = resp.clone();
      caches.open(CACHE).then(c => c.put(req, copy).catch(() => {}));
      return resp;
    }).catch(() => caches.match('chamcong.html')))
  );
});
