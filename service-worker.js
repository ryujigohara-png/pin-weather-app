// ======================================================================================
// PWA サービスワーカー (staticフォルダ配置版)
// ======================================================================================
const CACHE_NAME = 'pin-weather-cache-v1';
const ASSETS_TO_CACHE = [
  '../index.html',
  './manifest.json',
  '../css/style.css',
  '../js/main.js'
];

// インストール時
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
});

// アクティベート時
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activated');
});

// フェッチ時 (ネットワーク優先)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});