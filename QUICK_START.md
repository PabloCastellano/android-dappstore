# Quick Start - Smart Contracts

## 🚀 Inicio Rápido

### 1. Compilar Contratos

```bash
npm run compile
```

Esto compilará `AppStore.sol` y `AppStoreERC20.sol` usando Solidity 0.8.24.

### 2. Iniciar Nodo Local

En una terminal separada:

```bash
npm run node
```

Esto iniciará un nodo Hardhat local en `http://127.0.0.1:8545` con 20 cuentas de prueba.

### 3. Deploy en Local

En otra terminal:

```bash
npm run deploy:local
```

Esto desplegará ambos contratos y guardará la configuración en:
- `deployments/localhost.json` - Info del deployment
- `src/config/contracts.json` - Config para el frontend

### 4. Interactuar con los Contratos

```bash
node scripts/interact.js
```

Este script:
- Registra una app de prueba
- Muestra la información de la app
- Muestra estadísticas del store

## 📝 Ejemplo de Uso Manual

### Conectar a Hardhat Console

```bash
npx hardhat console --network localhost
```

### Registrar una App

```javascript
const AppStore = await ethers.getContractFactory("AppStore");
const appStore = await AppStore.attach("DEPLOYED_ADDRESS");

const tx = await appStore.registerApp(
  "my-app",                                           // slug
  "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG", // manifest CID
  ethers.parseEther("0.01"),                         // price (0.01 ETH)
  1                                                   // version code
);

await tx.wait();
console.log("App registered!");
```

### Comprar una App

```javascript
const [, , buyer] = await ethers.getSigners();

const tx = await appStore.connect(buyer).purchaseApp(
  "my-app",
  { value: ethers.parseEther("0.01") }
);

await tx.wait();
console.log("App purchased!");
```

### Ver Información de una App

```javascript
const app = await appStore.getApp("my-app");
console.log("Publisher:", app.publisher);
console.log("Price:", ethers.formatEther(app.priceWei), "ETH");
console.log("Downloads:", app.totalDownloads.toString());
console.log("Revenue:", ethers.formatEther(app.totalRevenue), "ETH");
```

### Publicar Nueva Versión

```javascript
const tx = await appStore.publishVersion(
  "my-app",
  "QmNewVersionCID",
  2  // new version code
);

await tx.wait();
console.log("New version published!");
```

## 🌐 Deploy en Testnet (Sepolia)

### 1. Configurar Variables de Entorno

Crea un archivo `.env`:

```bash
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
PRIVATE_KEY=your_private_key_here
ETHERSCAN_API_KEY=your_etherscan_api_key
```

⚠️ **NUNCA** comitees el archivo `.env` a git.

### 2. Obtener ETH de Testnet

Consigue Sepolia ETH de un faucet:
- https://sepoliafaucet.com/
- https://www.alchemy.com/faucets/ethereum-sepolia

### 3. Deploy

```bash
npm run deploy:sepolia
```

El script automáticamente:
- Desplegará los contratos
- Esperará confirmaciones
- Verificará en Etherscan
- Guardará la configuración

## 🔧 Configuración de Frontend

Después del deploy, encontrarás la configuración en `src/config/contracts.json`:

```json
{
  "contracts": {
    "AppStore": {
      "address": "0x...",
      "abi": "artifacts/contracts/AppStore.sol/AppStore.json"
    }
  },
  "network": {
    "name": "localhost",
    "chainId": "31337"
  }
}
```

Usa esta configuración en tu frontend React:

```javascript
import contractsConfig from './config/contracts.json';
import { ethers } from 'ethers';

const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

const appStore = new ethers.Contract(
  contractsConfig.contracts.AppStore.address,
  AppStoreABI,
  signer
);
```

## 📊 Verificar en Etherscan

Si el deploy automático no verificó, hazlo manualmente:

```bash
npx hardhat verify --network sepolia DEPLOYED_ADDRESS
```

## 🧪 Testing

Los tests están escritos en `test/AppStore.test.js`. Para ejecutarlos (requiere configuración adicional de Hardhat 3):

```bash
npm test
```

## 🔍 Explorar Contratos

### Ver Código Compilado

```bash
cat artifacts/contracts/AppStore.sol/AppStore.json
```

### Ver ABI

```bash
cat artifacts/contracts/AppStore.sol/AppStore.json | jq '.abi'
```

## 📱 Estructura de Manifest (IPFS)

Cuando registres una app, el manifest CID debe apuntar a un JSON como este:

```json
{
  "name": "My Awesome App",
  "slug": "my-awesome-app",
  "package": "com.example.myapp",
  "version": "1.0.0",
  "versionCode": 1,
  "description": "A decentralized messaging app",
  "apk_cid": "QmAPKFileHash...",
  "apk_sha256": "abc123def456...",
  "icon_cid": "QmIconHash...",
  "screenshots": ["QmScreen1...", "QmScreen2..."],
  "permissions": ["CAMERA", "INTERNET", "WRITE_EXTERNAL_STORAGE"],
  "publisher": "0xYourEthereumAddress",
  "signature": "0xSignatureOfThisManifest",
  "timestamp": 1234567890,
  "category": "social",
  "tags": ["messaging", "decentralized", "privacy"]
}
```

## 🎯 Próximos Pasos

1. **Frontend**: Integrar contratos con React usando ethers.js
2. **IPFS**: Implementar upload de APKs y manifests
3. **Indexing**: Crear subgraph de The Graph para búsquedas
4. **Android**: Desarrollar cliente Android nativo
5. **Testing**: Configurar y ejecutar tests completos

## 💡 Tips

- Usa Sepolia para testing (Mumbai de Polygon está deprecado)
- Considera usar Polygon o Arbitrum para fees bajos en producción
- Implementa meta-transactions para UX sin gas
- Usa Pinata o Infura para pinning de IPFS
- Implementa firma de manifests con EIP-712

## 🆘 Troubleshooting

### Error: "Insufficient funds"
Necesitas ETH en tu wallet para pagar gas.

### Error: "App slug already exists"
El slug debe ser único. Usa otro nombre.

### Error: "Not the publisher"
Solo el publisher original puede actualizar la app.

### Error: "Already purchased"
El usuario ya compró esta app. No puede comprarla de nuevo.

## 📚 Recursos

- [Hardhat Docs](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [Ethers.js Docs](https://docs.ethers.org/v6/)
- [IPFS Docs](https://docs.ipfs.tech/)
- [The Graph Docs](https://thegraph.com/docs/)

---

¿Preguntas? Revisa `CONTRACTS_SUMMARY.md` para más detalles.
