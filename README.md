# 🚀 Decentralized App Store - Ethereum + IPFS

App Store descentralizada usando **Smart Contracts** (Ethereum), **IPFS** para almacenamiento y **React PWA** para el frontend.

## 🎯 Visión General

Una plataforma completamente descentralizada donde:
- 📱 Developers publican apps Android (APKs)
- 💰 Monetización directa con crypto (ETH/tokens)
- 🔒 Sin censura ni intermediarios
- 📦 Almacenamiento en IPFS
- ⛓️ Metadata y pagos on-chain
- 🔍 Transparencia total

## ⚡ Quick Start

### 1. Instalar dependencias
```bash
npm install
# o
yarn
```

### 2. Compilar contratos
```bash
npm run compile
```

### 3. Iniciar desarrollo
```bash
# Terminal 1: Nodo Hardhat local
npm run node

# Terminal 2: Deploy contratos
npm run deploy:local

# Terminal 3: Frontend
npm run dev
```

Ver `QUICK_START.md` para instrucciones detalladas.

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