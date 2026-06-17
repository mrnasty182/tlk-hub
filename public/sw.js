// TLK Hub Service Worker — offline-first
// Strategy:
//   - Songs/setlists cached at runtime (Cache.put on successful network response)
//   - Read requests: stale-while-revalidate (show cached, fetch fresh in background)
//   - Write requests: queue in IndexedDB if offline, replay on reconnect
//   - Static assets: cache-first

const CACHE_VERSION = 'tlk-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const QUEUE_DB = 'tlk-offline-queue';

const STATIC_ASSETS = [
  '/',
  '/songs',
  '/composer',
  '/setlists',
  '/scales',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !k.startsWith(CACHE_VERSION)).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Stale-while-revalidate for GET
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  // Don't cache Supabase API responses (they include auth headers, sensitive)
  if (url.hostname.includes('supabase.co')) return;
  // Don't cache auth
  if (url.pathname.startsWith('/api/')) return;

  event.respondWith(
    caches.open(RUNTIME_CACHE).then(async (cache) => {
      const cached = await cache.match(request);
      const network = fetch(request)
        .then((response) => {
          if (response && response.status === 200) cache.put(request, response.clone());
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});

// IndexedDB queue for offline writes
function openQueue() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(QUEUE_DB, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore('requests', { autoIncrement: true });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function enqueue(request) {
  const db = await openQueue();
  const body = await request.clone().text();
  const entry = { url: request.url, method: request.method, headers: [...request.headers], body, ts: Date.now() };
  await new Promise((resolve, reject) => {
    const tx = db.transaction('requests', 'readwrite');
    tx.objectStore('requests').add(entry);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

async function flushQueue() {
  const db = await openQueue();
  const items = await new Promise((resolve, reject) => {
    const tx = db.transaction('requests', 'readonly');
    const req = tx.objectStore('requests').getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  for (const item of items) {
    try {
      await fetch(item.url, { method: item.method, headers: item.headers, body: item.body });
    } catch (e) {
      // Stop on first failure — will retry on next online event
      return;
    }
  }
  // All flushed, clear
  const tx = db.transaction('requests', 'readwrite');
  tx.objectStore('requests').clear();
}

self.addEventListener('sync', (event) => {
  if (event.tag === 'flush-tlk-queue') event.waitUntil(flushQueue());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'flush') event.waitUntil(flushQueue());
});
