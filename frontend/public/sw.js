/**
 * Service Worker — CASIC Task
 * Cache toàn bộ app để dùng offline hoàn toàn
 */

const CACHE_NAME = 'casictask-v2';
const API_CACHE  = 'casictask-api-v2';

// ── Install: cache app shell + tất cả assets ─────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      // Cache trang chủ trước
      try { await cache.add('/'); } catch {}
      try { await cache.add('/index.html'); } catch {}

      // Fetch index.html để lấy danh sách assets cần cache
      try {
        const res  = await fetch('/index.html');
        const html = await res.text();

        // Tìm tất cả file JS và CSS trong HTML
        const jsMatches  = [...html.matchAll(/src="(\/assets\/[^"]+\.js)"/g)].map(m => m[1]);
        const cssMatches = [...html.matchAll(/href="(\/assets\/[^"]+\.css)"/g)].map(m => m[1]);
        const assets     = [...jsMatches, ...cssMatches];

        // Cache từng asset
        await Promise.allSettled(assets.map(url => cache.add(url)));
        console.log('[SW] Cached assets:', assets);
      } catch (e) {
        console.warn('[SW] Could not pre-cache assets:', e.message);
      }

      await self.skipWaiting();
    })()
  );
});

// ── Activate: xóa cache cũ ────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME && k !== API_CACHE)
          .map(k => { console.log('[SW] Deleting old cache:', k); return caches.delete(k); })
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch ─────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (!url.protocol.startsWith('http')) return;

  // API → Network First với fallback cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstAPI(request));
    return;
  }

  // Uploads → Cache First
  if (url.pathname.startsWith('/uploads/')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Assets (JS/CSS) → Cache First (immutable)
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // HTML pages → Network First với SPA fallback
  event.respondWith(networkFirstHTML(request));
});

// ── Network First cho API ─────────────────────────────────
async function networkFirstAPI(request) {
  try {
    const response = await fetch(request.clone(), { signal: AbortSignal.timeout(10000) });
    if (response.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(
      JSON.stringify({ success: false, offline: true, data: null }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// ── Cache First cho assets ────────────────────────────────
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

// ── Network First cho HTML (SPA) ──────────────────────────
async function networkFirstHTML(request) {
  try {
    const response = await fetch(request, { signal: AbortSignal.timeout(8000) });
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Offline → trả về cached page hoặc index.html (SPA fallback)
    const cached = await caches.match(request);
    if (cached) return cached;

    const index = await caches.match('/') || await caches.match('/index.html');
    if (index) return index;

    return new Response(
      `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>CASIC Task - Offline</title>
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <style>body{font-family:sans-serif;background:#0b1929;color:#e0f2fe;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;flex-direction:column;gap:16px}
      .icon{font-size:64px}.title{font-size:22px;font-weight:800;color:#f59e0b}
      .msg{font-size:14px;color:#94a3b8;text-align:center;max-width:300px;line-height:1.6}
      .btn{padding:12px 28px;background:#0ea5e9;color:#fff;border:none;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;margin-top:8px}</style>
      </head><body>
      <div class="icon">📵</div>
      <div class="title">Đang offline</div>
      <div class="msg">Không có kết nối đến máy chủ.<br>Vui lòng kết nối WiFi công ty và thử lại.</div>
      <button class="btn" onclick="location.reload()">🔄 Thử lại</button>
      </body></html>`,
      { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
}
