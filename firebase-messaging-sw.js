importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
// Local mode service worker stub: no Firebase Cloud Messaging.
self.addEventListener('install', function () {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', function () {
  // No-op in local database mode.
});