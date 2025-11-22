// Registra el service worker en producción y en dev si existe.
import { Workbox } from 'workbox-window'

export function registerSW() {
  if ('serviceWorker' in navigator) {
    // intenta registrar workbox-generated service worker en /sw.js
    const wb = new Workbox('/sw.js')
    wb.addEventListener('installed', (event) => {
      if (event.isUpdate) {
        console.log('New content is available; please refresh.')
      }
    })
    wb.register().catch(err => console.log('SW register failed:', err))
  }
}

/*
Workbox service worker (build step should inject precache manifest via workbox-cli or workbox-build).
Si prefieres usar workbox-build, crea un script node que genere el sw.js en /dist durante build.
*/
