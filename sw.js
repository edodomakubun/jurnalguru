self.addEventListener('install', (e) => {
  console.log('[Service Worker] Install');
});
self.addEventListener('fetch', (e) => {
  // Hanya bypass untuk PWA (bisa dikembangkan untuk caching offline penuh)
});
