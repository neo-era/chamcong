// ─── sw.js ────────────────────────────────────────────────────────────────────
// Service worker PWA (NC-H). Cache tĩnh để mở nhanh; KHÔNG cache API Apps Script.
// Đổi CACHE mỗi khi release phiên bản mới → SW mới cài → báo trang reload.

const CACHE = 'cscc-v1.0.1';
const ASSETS = [
  'css/main.css', 'js/config.js', 'js/auth.js', 'js/api.js',
  'chamcong.html', 'icon.svg', 'manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS).catch(() => {})));
  // Không skipWaiting ngay — giữ SW cũ chạy đến khi user reload
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ type: 'window' }))
      .then(clients => clients.forEach(c => c.postMessage({ type: 'UPDATE_READY', version: CACHE })))
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || req.url.indexOf('script.google') !== -1 || req.url.indexOf('googleusercontent') !== -1) return;
  e.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(resp => {
      const copy = resp.clone();
      caches.open(CACHE).then(c => c.put(req, copy).catch(() => {}));
      return resp;
    }).catch(() => caches.match('chamcong.html')))
  );
});

// Nhận lệnh skipWaiting từ trang (khi user bấm "Tải lại")
self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});
