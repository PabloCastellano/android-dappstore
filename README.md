# PWA Decentralized App Store - Boilerplate

PWA App Store Boilerplate
React + Vite + Tailwind + Workbox

Instrucciones rápidas:
1) Crear proyecto y pegar los archivos.
2) `npm install` o `yarn`
3) `npm run dev` para desarrollo. `npm run build` y `npm run preview` para producción.

Características incluidas:
- React + Vite
- Tailwind CSS
- PWA manifest + service worker (Workbox)
- Archivo de ejemplo `sw.js` con caching para IPFS
- Registro del service worker en `serviceWorkerRegistration.js`
- Mock UI y uso de la imagen mockup subida por ti

ToDos para producción:
- Añadir pipeline para generar `sw.js` con workbox-build / workbox-cli en el build step
- Reemplazar datos mock por The Graph / subgraph
- Implementar lógica de contratos (ethers.js) y verificación de firmas
- Añadir tests, E2E, y auditoría de seguridad


```
// Exporta un componente React por compatibilidad con la vista previa en canvas.
// Aquí devolvemos el App principal para que se pueda previsualizar rápidamente.
import ReactPreview from './src/App.jsx'
export default ReactPreview
```