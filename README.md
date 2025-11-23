# 🚀 Decentralized App Store - Ethereum + IPFS

Decentralized App Store using **Smart Contracts** (Ethereum), **IPFS** for storage, and **React PWA** for the frontend.

## 🎯 Overview

A fully decentralized platform where:
- 📱 Developers publish Android apps (APKs)
- 💰 Direct monetization with crypto (ETH/tokens)
- 🔒 No censorship or intermediaries
- 📦 Filecoin/IPFS storage (public and permissionless)
- ⛓️ On-chain metadata, payments, and download tracking
- 🔍 Full transparency and traceability

> **Note**: Files stored on IPFS are publicly accessible by design. The blockchain tracks downloads for statistics and traceability, not access control. See [Download Security Model](#-download-security-model) for details.

## ⚡ Quick Start

### 1. Install dependencies
```bash
npm install
# or
yarn
```

### 2. Compile contracts
```bash
npm run compile
```

### 3. Start development
```bash
# Terminal 1: Local Hardhat node
npm run node

# Terminal 2: Deploy contracts
npm run deploy:local

# Terminal 3: Frontend
npm run dev
```

See `QUICK_START.md` for detailed instructions.

Included features:
- React + Vite
- Tailwind CSS
- PWA manifest + service worker (Workbox)
- Example `sw.js` file with IPFS caching
- Service worker registration in `serviceWorkerRegistration.js`
- Mock UI and usage of uploaded mockup image

## Smart Contracts

Contracts are implemented in `/contracts`:
- **AppStore.sol** - Main contract with ETH payments
- **AppStoreERC20.sol** - Support for ERC20 token payments

## Hardhat Usage

### Running Tests

To run all the tests in the project, execute the following command:

```shell
npx hardhat test
```

You can also selectively run the Solidity or `node:test` tests:

```shell
npx hardhat test solidity
npx hardhat test nodejs
```

### Make a deployment to Sepolia

This project includes an example Ignition module to deploy the contract. You can deploy this module to a locally simulated chain or to Sepolia.

To run the deployment to a local chain:

```shell
npx hardhat ignition deploy ignition/modules/Counter.ts
```

To run the deployment to Sepolia, you need an account with funds to send the transaction. The provided Hardhat configuration includes a Configuration Variable called `SEPOLIA_PRIVATE_KEY`, which you can use to set the private key of the account you want to use.

You can set the `SEPOLIA_PRIVATE_KEY` variable using the `hardhat-keystore` plugin or by setting it as an environment variable.

To set the `SEPOLIA_PRIVATE_KEY` config variable using `hardhat-keystore`:

```shell
npx hardhat keystore set SEPOLIA_PRIVATE_KEY
```

After setting the variable, you can run the deployment with the Sepolia network:

```shell
npx hardhat ignition deploy --network sepolia ignition/modules/AppStore.ts
```

### Available commands:
```bash
npm run compile      # Compile contracts
npm test            # Run tests
npm run node        # Start local Hardhat node
npm run deploy:local    # Deploy on localhost
npm run deploy:sepolia  # Deploy on Sepolia testnet
```

See `/contracts/README.md` for complete documentation.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (React PWA)                    │
│  - UI for discovering and purchasing apps                   │
│  - MetaMask/WalletConnect integration                       │
│  - Service Worker for IPFS caching                          │
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
│  - App registry            │
│  - Payment system          │
│  - Versioning              │
└─────────────┬──────────────┘
              │
              │ Events
              ▼
┌─────────────────────────┐
│   THE GRAPH (Indexer)   │
│  - Subgraph             │
│  - GraphQL API          │
│  - Fast search          │
└─────────────────────────┘

┌─────────────────────────┐
│   IPFS / Arweave        │
│  - APK files            │
│  - Manifests (JSON)     │
│  - Icons & screenshots  │
└─────────────────────────┘
```

## � Download Security Model

### How Downloads Work

The download process has two distinct phases:

**1. Blockchain Registration (Required)**
```javascript
// User clicks "Download APK"
// → Opens MetaMask to sign transaction
// → Executes downloadApp(slug) on smart contract
// → Records download on-chain with:
//   - Downloader's wallet address
//   - Timestamp
//   - Increments download counter
```

**2. File Download (After Registration)**
```javascript
// Only executed if blockchain registration succeeds
// → Downloads APK from Filecoin/IPFS
// → Verifies integrity (SHA-256)
// → Triggers browser download
```

### What Blockchain Registration Provides

✅ **On-chain statistics**: Reliable download counts  
✅ **Traceability**: Know who downloaded (wallet address)  
✅ **Timestamps**: When downloads occurred  
✅ **Opt-in analytics**: Users consciously register downloads  
✅ **Future monetization**: Foundation for paid downloads  

### What It Does NOT Prevent

The decentralized nature of IPFS/Filecoin means:

❌ **Cannot prevent direct IPFS access**: Anyone with a CID can download  
❌ **Cannot enforce authentication**: IPFS is public and permissionless  
❌ **Cannot block technical users**: Browser console access exists  

```javascript
// Technically possible (but not through UI):
// 1. Get manifest CID from subgraph
// 2. Download manifest from IPFS
// 3. Extract APK CID from manifest
// 4. Download APK directly from any IPFS gateway
```

### Web3 Philosophy

```
Content on IPFS/Filecoin is PUBLIC by design.
Blockchain registration is for TRACEABILITY, not ACCESS CONTROL.
This aligns with decentralized and censorship-resistant principles.
```

### When You Need Strict Access Control

If you require true access control, consider:

1. **File Encryption**
   - Encrypt APKs before uploading to IPFS
   - Provide decryption keys only after successful transaction
   - Adds complexity but enables real control

2. **Token Gating**
   ```solidity
   function downloadApp(string calldata slug) external {
       require(nftContract.balanceOf(msg.sender) > 0, "Need NFT");
       _recordDownload(key);
   }
   ```

3. **Paid Downloads**
   ```solidity
   function downloadApp(string calldata slug) external payable {
       require(msg.value >= price, "Insufficient payment");
       _recordDownload(key);
       payable(publisher).transfer(msg.value);
   }
   ```

**Current implementation prioritizes**: Simplicity, decentralization, and transparency over strict access control.

## 📋 Documentation

- **`IMPLEMENTATION_COMPLETE.md`** - ✅ Complete implementation summary
- **`SECURE_UPLOAD_MIGRATION.md`** - 🔐 Secure backend upload migration guide
- **`backend/README.md`** - 🔐 Backend API documentation
- **`IPFS_IMPLEMENTATION.md`** - ✅ IPFS integration summary
- **`FRONTEND_INTEGRATION.md`** - ✅ Frontend integration summary
- **`APP_DETAIL_GUIDE.md`** - 📱 App detail page guide
- **`QUICK_START.md`** - 🚀 Quick start guide
- **`IPFS_GUIDE.md`** - 📦 Complete IPFS guide
- **`ACCESSING_UI.md`** - 🎨 How to access the UI
- **`DEPLOYMENT_GUIDE.md`** - 🚀 Deployment guide
- **`CONTRACTS_SUMMARY.md`** - 📊 Technical contracts documentation
- **`contracts/README.md`** - 📝 Solidity contracts details
- **`subgraph/README.md`** - 📊 Subgraph documentation
- **`ROADMAP.md`** - 🗺️ Project roadmap

## ✅ Project Status

### Completed (100%)
- ✅ Smart contracts implemented and compiled
- ✅ Basic contract tests written
- ✅ Deployment scripts configured
- ✅ Complete IPFS integration (Pinata)
- ✅ APK upload/download service
- ✅ Manifest system with EIP-712 signing
- ✅ APKUploader component with wizard
- ✅ Functional useWallet hook (MetaMask)
- ✅ Functional useAppStore hook
- ✅ Wallet UI in header
- ✅ Complete publication page
- ✅ App detail page
- ✅ Purchase system with ETH
- ✅ APK download system
- ✅ Integrity verification (SHA-256)
- ✅ Search system
- ✅ Category and price filters
- ✅ App sorting
- ✅ Purchase history page
- ✅ Complete publisher dashboard
- ✅ Existing app management
- ✅ New version publishing
- ✅ Price updates
- ✅ Statistics and analytics
- ✅ Complete navigation
- ✅ The Graph subgraph (schema, mappings, client)
- ✅ React hooks for subgraph
- ✅ Complete GraphQL queries
- ✅ Complete documentation
- ✅ Download security model documentation
- ✅ Secure backend API for uploads
- ✅ Signature-based authentication
- ✅ Rate limiting and abuse prevention

### Optional Extras
- ⏳ Subgraph deployment (manual)
- ⏳ Native Android client
- ⏳ Complete E2E testing
- ⏳ Security audit
- ⏳ Testnet/mainnet deployment
- ⏳ Reviews and ratings system


```
// Exports a React component for canvas preview compatibility.
// Here we return the main App so it can be quickly previewed.
import ReactPreview from './src/App.jsx'
export default ReactPreview
```