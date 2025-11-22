// Este archivo es un ejemplo simple de service worker con Workbox runtime caching.
// En producción genera un service worker con workbox-build para incluir precache manifest.

importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js')

if (workbox) {
  workbox.setConfig({ debug: false })
  // precache manifest se injecta por workbox-build en el pipeline de build
  workbox.precaching.precacheAndRoute(self.__WB_MANIFEST || [])

  // Cache para recursos de IPFS (content-addressed) - CacheFirst
  workbox.routing.registerRoute(
    ({url}) => url.hostname.includes('ipfs') || url.pathname.includes('/ipfs/'),
    new workbox.strategies.CacheFirst({
      cacheName: 'ipfs-cache',
      plugins: [
        new workbox.expiration.ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 7 * 24 * 60 * 60 })
      ]
    })
  )

  // API responses - StaleWhileRevalidate
  workbox.routing.registerRoute(
    ({url}) => url.pathname.startsWith('/api/'),
    new workbox.strategies.StaleWhileRevalidate({ cacheName: 'api-cache' })
  )
}
