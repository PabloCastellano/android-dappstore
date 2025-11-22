# Smart Contracts - Decentralized App Store

## Contratos Implementados

### 1. AppStore.sol
Contrato principal que gestiona el registro de apps, versiones y pagos con ETH.

**Características:**
- ✅ Registro de apps con slug único
- ✅ Sistema de versiones con CIDs de IPFS
- ✅ Pagos en ETH con fee de plataforma configurable
- ✅ Apps gratuitas y de pago
- ✅ Control de acceso (solo publisher puede actualizar)
- ✅ Sistema de moderación (owner puede desactivar apps)
- ✅ Protección contra reentrancy
- ✅ Estadísticas de descargas y revenue

**Funciones principales:**
```solidity
// Registrar nueva app
registerApp(slug, manifestCid, priceWei, versionCode)

// Publicar nueva versión
publishVersion(slug, manifestCid, versionCode)

// Comprar/descargar app
purchaseApp(slug) payable

// Actualizar precio
updatePrice(slug, newPriceWei)

// Ver información
getApp(slug)
getLatestManifest(slug)
getVersionCount(slug)
hasUserPurchased(user, slug)
```

### 2. AppStoreERC20.sol
Extensión que permite pagos con tokens ERC20 (USDC, DAI, etc).

**Características:**
- ✅ Soporte multi-token
- ✅ Precios configurables por token
- ✅ Evita volatilidad usando stablecoins
- ✅ SafeERC20 para transferencias seguras

**Funciones principales:**
```solidity
// Establecer precio en token
setTokenPrice(slug, token, price)

// Comprar con token
purchaseAppWithToken(slug, token, amount)

// Admin: agregar token soportado
addSupportedToken(token)
```

## Estructura de Datos

### App
```solidity
struct App {
    address publisher;       // Desarrollador
    string slug;            // ID único
    string latestManifestCid; // CID IPFS del manifest
    uint256 priceWei;       // Precio en wei
    uint256 totalDownloads; // Total descargas
    uint256 totalRevenue;   // Revenue total
    bool exists;            // Si existe
    bool active;            // Si está activa
    uint256 createdAt;      // Timestamp creación
}
```

### Version
```solidity
struct Version {
    string manifestCid;      // CID del manifest
    uint256 timestamp;       // Timestamp publicación
    uint256 versionCode;     // Código versión
    bool deprecated;         // Si está deprecada
}
```

### Manifest (Off-chain, en IPFS)
```json
{
  "name": "My App",
  "slug": "my-app",
  "package": "com.example.myapp",
  "version": "1.0.0",
  "versionCode": 1,
  "description": "App description",
  "apk_cid": "QmAPK...",
  "apk_sha256": "abc123...",
  "icon_cid": "QmIcon...",
  "permissions": ["CAMERA", "INTERNET"],
  "publisher": "0xPublisherAddress",
  "signature": "0xSignature..."
}
```

## Deployment

### Local (Hardhat Network)
```bash
# Terminal 1: Iniciar nodo local
npm run node

# Terminal 2: Deploy
npm run deploy:local
```

### Testnet (Sepolia)
```bash
# Configurar .env con SEPOLIA_RPC_URL y PRIVATE_KEY
npm run deploy:sepolia
```

### Mainnet / L2
```bash
# Polygon
npm run deploy:polygon

# Otras redes: editar hardhat.config.js
```

## Testing

```bash
# Ejecutar todos los tests
npm test

# Con coverage
npx hardhat coverage

# Con gas reporter
REPORT_GAS=true npm test
```

## Verificación en Etherscan

```bash
npx hardhat verify --network sepolia DEPLOYED_ADDRESS
```

## Seguridad

### Implementado
- ✅ ReentrancyGuard en funciones de pago
- ✅ Ownable para funciones admin
- ✅ SafeERC20 para tokens
- ✅ Checks-Effects-Interactions pattern
- ✅ Input validation
- ✅ Access control

### Recomendaciones Pre-Producción
- 🔒 Auditoría profesional de contratos
- 🔒 Tests exhaustivos con fuzzing
- 🔒 Multisig para owner
- 🔒 Timelock para cambios críticos
- 🔒 Circuit breaker / pause mechanism
- 🔒 Rate limiting on-chain o via relayer

## Gas Optimization

- Usa `calldata` en lugar de `memory` para strings
- Packing de variables en storage
- Eventos en lugar de storage cuando sea posible
- Batch operations para múltiples apps

## Eventos

Todos los eventos críticos están emitidos para indexado:
- `AppRegistered` - Nueva app
- `VersionPublished` - Nueva versión
- `AppPurchased` - Compra realizada
- `AppDownloaded` - Descarga gratuita
- `AppUpdated` - Cambio de precio
- `AppStatusChanged` - Activación/desactivación

## Integración con The Graph

Los eventos están diseñados para ser indexados por The Graph. Ver `/subgraph` para el schema y mappings.

## Roadmap

### Futuras mejoras
- [ ] Sistema de reviews y ratings on-chain
- [ ] NFT receipts para compras (ERC-721)
- [ ] Subscripciones recurrentes
- [ ] Sistema de refunds con timelock
- [ ] Marketplace secundario de licenses
- [ ] Staking de publishers para reputación
- [ ] DAO para moderación descentralizada
- [ ] Multi-sig para publishers (equipos)
- [ ] Royalties para actualizaciones

## Licencia

MIT
