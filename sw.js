// GMM Bilingual — offline mode.
// Network-first: a fresh copy always wins online; when the connection drops, the saved copy opens instead.
const CACHE = 'gmm-fr-v177';
const SHELL = ['./', './index.html'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (e) => {
  if (e.data === 'gmm-purge') caches.keys().then((ks) => ks.forEach((k) => caches.delete(k)));
});

const FONT_HOSTS = /(^|\.)fonts\.(googleapis|gstatic)\.com$/;

self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  const same = u.origin === location.origin;
  if (!same && !FONT_HOSTS.test(u.hostname)) return; // sign-in server, translation and outside links always go to the network
  e.respondWith(
    fetch(r)
      .then((res) => {
        if (res && (res.ok || res.type === 'opaque')) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(r, copy)).catch(() => {}); }
        return res;
      })
      .catch(() => caches.match(r, { ignoreSearch: same }).then((hit) => hit ||
        (r.mode === 'navigate' ? caches.match('./index.html').then((h) => h || caches.match('./')) : Response.error())))
  );
});
