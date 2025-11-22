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

## Smart Contracts

Los contratos están implementados en `/contracts`:
- **AppStore.sol** - Contrato principal con pagos en ETH
- **AppStoreERC20.sol** - Soporte para pagos con tokens ERC20

### Comandos disponibles:
```bash
npm run compile      # Compilar contratos
npm test            # Ejecutar tests
npm run node        # Iniciar nodo local Hardhat
npm run deploy:local    # Deploy en localhost
npm run deploy:sepolia  # Deploy en Sepolia testnet
```

Ver `/contracts/README.md` para documentación completa.

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (React PWA)                    │
│  - UI para descubrir y comprar apps                         │
│  - Conexión con MetaMask/WalletConnect                      │
│  - Service Worker para caching IPFS                         │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ├─── ethers.js ───┐
                  │                  │
                  ├─── IPFS ────────┤
                  │                  │
┌─────────────────▼──────────┐      │
│   SMART CONTRACTS (L2)     │      │
│  - AppStore.sol            │◄─────┘
│  - AppStoreERC20.sol       │
│  - Registro de apps        │
│  - Sistema de pagos        │
│  - Versionado              │
└─────────────┬──────────────┘
              │
              │ Events
              ▼
┌─────────────────────────┐
│   THE GRAPH (Indexer)   │
│  - Subgraph             │
│  - GraphQL API          │
│  - Búsqueda rápida      │
└─────────────────────────┘

┌─────────────────────────┐
│   IPFS / Arweave        │
│  - APK files            │
│  - Manifests (JSON)     │
│  - Icons & screenshots  │
└─────────────────────────┘
```

## 📋 Documentación

- **`IMPLEMENTATION_COMPLETE.md`** - ✅ Resumen completo de implementación
- **`IPFS_IMPLEMENTATION.md`** - ✅ Resumen de integración IPFS
- **`FRONTEND_INTEGRATION.md`** - ✅ Resumen de integración frontend
- **`APP_DETAIL_GUIDE.md`** - 📱 Guía de página de detalle
- **`QUICK_START.md`** - 🚀 Guía de inicio rápido
- **`IPFS_GUIDE.md`** - 📦 Guía completa de IPFS
- **`ACCESSING_UI.md`** - 🎨 Cómo acceder a la UI
- **`DEPLOYMENT_GUIDE.md`** - 🚀 Guía de deployment
- **`CONTRACTS_SUMMARY.md`** - 📊 Documentación técnica de contratos
- **`contracts/README.md`** - 📝 Detalles de contratos Solidity
- **`subgraph/README.md`** - 📊 Documentación del subgraph
- **`ROADMAP.md`** - 🗺️ Roadmap del proyecto

## ✅ Estado del Proyecto

### Completado (100%)
- ✅ Smart contracts implementados y compilados
- ✅ Tests básicos de contratos escritos
- ✅ Scripts de deployment configurados
- ✅ Integración IPFS completa (Pinata)
- ✅ Servicio de upload/download de APKs
- ✅ Sistema de manifests con firma EIP-712
- ✅ Componente APKUploader con wizard
- ✅ Hook useWallet funcional (MetaMask)
- ✅ Hook useAppStore funcional
- ✅ UI de wallet en header
- ✅ Página de publicación completa
- ✅ Página de detalle de app
- ✅ Sistema de compra con ETH
- ✅ Sistema de descarga de APKs
- ✅ Verificación de integridad (SHA-256)
- ✅ Sistema de búsqueda
- ✅ Filtros por categoría y precio
- ✅ Ordenamiento de apps
- ✅ Página de historial de compras
- ✅ Dashboard de publisher completo
- ✅ Gestión de apps existentes
- ✅ Publicación de nuevas versiones
- ✅ Actualización de precios
- ✅ Estadísticas y analytics
- ✅ Navegación completa
- ✅ Subgraph de The Graph (schema, mappings, cliente)
- ✅ Hooks React para subgraph
- ✅ Queries GraphQL completas
- ✅ Documentación completa

### Extras Opcionales
- ⏳ Deployment del subgraph (manual)
- ⏳ Cliente Android nativo
- ⏳ Testing E2E completo
- ⏳ Auditoría de seguridad
- ⏳ Deployment en testnet/mainnet
- ⏳ Sistema de reviews y ratings


```
// Exporta un componente React por compatibilidad con la vista previa en canvas.
// Aquí devolvemos el App principal para que se pueda previsualizar rápidamente.
import ReactPreview from './src/App.jsx'
export default ReactPreview
```