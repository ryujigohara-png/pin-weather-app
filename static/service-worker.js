// ======================================================================================
// PWA サービスワーカー (最小構成：インストールを有効にするため)
// ======================================================================================
const CACHE_NAME = 'pin-weather-cache-v1';

// インストール時
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
});

// アクティベート時
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activated');
});

// フェッチ時 (ネットワーク優先：気象データは常に最新が必要なため)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});