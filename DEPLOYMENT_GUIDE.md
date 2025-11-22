# 🚀 Guía de Deployment

Esta guía te ayudará a deployar los contratos en diferentes redes.

---

## 📋 Pre-requisitos

1. **Node.js** instalado (v20+)
2. **Wallet** con fondos para gas
3. **RPC Provider** (Alchemy/Infura)
4. **Etherscan API Key** (para verificación)

---

## 🔧 Configuración Inicial

### 1. Crear archivo .env

Copia `.env.example` a `.env`:

```bash
cp .env.example .env
```

### 2. Configurar variables

Edita `.env` con tus valores:

```env
# RPC URLs
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_API_KEY

# Private Key (NUNCA compartir ni commitear)
PRIVATE_KEY=tu_private_key_aqui

# Etherscan API Key
ETHERSCAN_API_KEY=tu_etherscan_api_key
```

⚠️ **IMPORTANTE:** Nunca comitees el archivo `.env` a git.

### 3. Obtener fondos de testnet

#### Sepolia ETH
- https://sepoliafaucet.com/
- https://www.alchemy.com/faucets/ethereum-sepolia
- https://faucet.quicknode.com/ethereum/sepolia

#### Mumbai MATIC (deprecado, usar Amoy)
- https://faucet.polygon.technology/

---

## 🏠 Deployment Local

### 1. Iniciar nodo Hardhat

Terminal 1:
```bash
npm run node
```

Esto iniciará un nodo local en `http://127.0.0.1:8545` con 20 cuentas de prueba.

### 2. Deploy contratos

Terminal 2:
```bash
npm run deploy:local
```

### 3. Verificar deployment

```bash
# Ver deployment info
cat deployments/localhost.json

# Ver config para frontend
cat src/config/contracts.json
```

### 4. Interactuar con contratos

```bash
node scripts/interact.js
```

---

## 🧪 Deployment en Sepolia Testnet

### 1. Verificar configuración

```bash
# Verificar que tienes fondos
# Reemplaza con tu address
cast balance 0xYourAddress --rpc-url $SEPOLIA_RPC_URL

# O usando ethers
node -e "const ethers = require('ethers'); const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL); provider.getBalance('0xYourAddress').then(b => console.log(ethers.formatEther(b)))"
```

### 2. Deploy

```bash
npm run deploy:sepolia
```

El script automáticamente:
- ✅ Desplegará AppStore.sol
- ✅ Desplegará AppStoreERC20.sol
- ✅ Esperará 5 confirmaciones
- ✅ Verificará en Etherscan
- ✅ Guardará deployment info

### 3. Verificar en Etherscan

Visita: https://sepolia.etherscan.io/address/DEPLOYED_ADDRESS

### 4. Verificación manual (si falla automática)

```bash
npx hardhat verify --network sepolia DEPLOYED_ADDRESS
```

---

## 🟣 Deployment en Polygon

### 1. Obtener MATIC

Compra MATIC en un exchange y envía a tu wallet.

### 2. Configurar RPC

Asegúrate de tener `POLYGON_RPC_URL` en `.env`:

```env
POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_API_KEY
```

### 3. Deploy

```bash
npx hardhat run scripts/deploy.js --network polygon
```

### 4. Verificar en PolygonScan

```bash
npx hardhat verify --network polygon DEPLOYED_ADDRESS
```

---

## 🔵 Deployment en Arbitrum

### 1. Agregar red a hardhat.config.js

```javascript
arbitrum: {
  type: "http",
  url: process.env.ARBITRUM_RPC_URL || "https://arb1.arbitrum.io/rpc",
  accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
  chainId: 42161
}
```

### 2. Deploy

```bash
npx hardhat run scripts/deploy.js --network arbitrum
```

---

## 📊 Post-Deployment

### 1. Guardar información importante

Después del deploy, guarda:
- ✅ Addresses de contratos
- ✅ Transaction hashes
- ✅ Block numbers
- ✅ Network info

Todo esto se guarda automáticamente en:
- `deployments/{network}.json`
- `src/config/contracts.json`

### 2. Actualizar frontend

El archivo `src/config/contracts.json` ya está listo para usar en el frontend:

```javascript
import contractsConfig from './config/contracts.json';

const appStoreAddress = contractsConfig.contracts.AppStore.address;
```

### 3. Configurar fee collector

Si quieres cambiar el fee collector del address del deployer:

```bash
npx hardhat console --network sepolia
```

```javascript
const AppStore = await ethers.getContractFactory("AppStore");
const appStore = await AppStore.attach("DEPLOYED_ADDRESS");

await appStore.setFeeCollector("NEW_FEE_COLLECTOR_ADDRESS");
```

### 4. Configurar platform fee

Por defecto es 2.5% (250 basis points). Para cambiar:

```javascript
// 5% = 500 basis points
await appStore.setPlatformFee(500);
```

### 5. Agregar tokens soportados (AppStoreERC20)

```javascript
const AppStoreERC20 = await ethers.getContractFactory("AppStoreERC20");
const appStoreERC20 = await AppStoreERC20.attach("DEPLOYED_ADDRESS");

// Agregar USDC
await appStoreERC20.addSupportedToken("USDC_ADDRESS");

// Agregar DAI
await appStoreERC20.addSupportedToken("DAI_ADDRESS");
```

---

## 🔐 Seguridad Post-Deployment

### 1. Transferir ownership a multisig

```javascript
await appStore.transferOwnership("MULTISIG_ADDRESS");
```

### 2. Configurar Timelock (recomendado)

Usa OpenZeppelin TimelockController para cambios críticos.

### 3. Pausar contratos (si es necesario)

Si implementas Pausable:

```javascript
await appStore.pause();
```

---

## 📝 Checklist de Deployment

### Pre-deployment
- [ ] Contratos compilados sin errores
- [ ] Tests pasando
- [ ] Auditoría completada (producción)
- [ ] Variables de entorno configuradas
- [ ] Fondos suficientes para gas
- [ ] RPC provider configurado

### Durante deployment
- [ ] Deploy en testnet primero
- [ ] Verificar contratos en explorer
- [ ] Probar funciones básicas
- [ ] Configurar fee collector
- [ ] Configurar platform fee
- [ ] Agregar tokens soportados (ERC20)

### Post-deployment
- [ ] Guardar addresses y info
- [ ] Actualizar frontend config
- [ ] Transferir ownership a multisig
- [ ] Documentar deployment
- [ ] Anunciar en comunidad
- [ ] Monitorear eventos

---

## 🐛 Troubleshooting

### Error: "insufficient funds"

**Solución:** Necesitas más ETH/MATIC para gas. Obtén de un faucet o exchange.

### Error: "nonce too low"

**Solución:** 
```bash
# Resetear nonce en Hardhat
npx hardhat clean
```

### Error: "network does not support ENS"

**Solución:** Usa addresses en lugar de ENS names.

### Error: "contract verification failed"

**Solución:** Verifica manualmente:
```bash
npx hardhat verify --network sepolia ADDRESS
```

### Error: "replacement fee too low"

**Solución:** Espera a que la transacción anterior se confirme o aumenta el gas price.

---

## 📊 Estimación de Costos

### Gas Costs (aproximados)

#### Sepolia (Testnet)
- Deploy AppStore: ~3,000,000 gas (~0.003 ETH)
- Deploy AppStoreERC20: ~2,500,000 gas (~0.0025 ETH)
- Register App: ~200,000 gas (~0.0002 ETH)
- Purchase App: ~100,000 gas (~0.0001 ETH)

#### Polygon (Mainnet)
- Deploy AppStore: ~3,000,000 gas (~0.003 MATIC = $0.002)
- Deploy AppStoreERC20: ~2,500,000 gas (~0.0025 MATIC = $0.0017)
- Register App: ~200,000 gas (~0.0002 MATIC = $0.00013)
- Purchase App: ~100,000 gas (~0.0001 MATIC = $0.00007)

**Nota:** Los precios varían según el precio del gas y del token.

---

## 🔗 Recursos Útiles

### Explorers
- Sepolia: https://sepolia.etherscan.io/
- Polygon: https://polygonscan.com/
- Arbitrum: https://arbiscan.io/

### Faucets
- Sepolia: https://sepoliafaucet.com/
- Polygon Mumbai: https://faucet.polygon.technology/

### RPC Providers
- Alchemy: https://www.alchemy.com/
- Infura: https://infura.io/
- QuickNode: https://www.quicknode.com/

### Tools
- Hardhat: https://hardhat.org/
- Etherscan: https://etherscan.io/
- Tenderly: https://tenderly.co/

---

## 📞 Soporte

Si encuentras problemas:
1. Revisa esta guía
2. Revisa `QUICK_START.md`
3. Revisa logs de error
4. Busca en Hardhat docs
5. Pregunta en Discord/Telegram

---

**¡Buena suerte con tu deployment! 🚀**
