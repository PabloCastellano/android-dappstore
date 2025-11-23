# 🚀 Decentralized App Store - Ethereum + Filecoin

Decentralized App Store using **Smart Contracts** (Ethereum), **Filecoin** for storage (via Synapse SDK), and **React PWA** for the frontend.

## 🎯 Overview

A fully decentralized platform where:
- 📱 Developers publish Android apps (APKs)
- 💰 Direct monetization with crypto (ETH/tokens)
- 🔒 No censorship or intermediaries
- 📦 Filecoin decentralized storage
- ⛓️ On-chain metadata and payments
- 🔍 Full transparency

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
- Filecoin storage via Synapse SDK
- PWA manifest + service worker (Workbox)
- Service worker registration in `serviceWorkerRegistration.js`
- Modern decentralized storage

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
│  - MetaMask wallet integration                              │
│  - Synapse SDK for Filecoin storage                         │
└─────────────────┬────────────────────────────────────────────┘
                  │
                  ├─── ethers.js ───┐
                  │                  │
                  ├─── Synapse SDK ───┤
                  │                  │
┌─────────────────┴──────────┐      │
│   SMART CONTRACTS (L2)     │      │
│  - AppStore.sol            │◄─────┘
│  - AppStoreERC20.sol       │
│  - App registry            │
│  - Payment system          │
│  - Versioning              │
└─────────────┬──────────────┘
              │
              │ Events
              ┴
┌─────────────────────────┐
│   THE GRAPH (Indexer)   │
│  - Subgraph             │
│  - GraphQL API          │
│  - Fast search          │
└─────────────────────────┘

┌─────────────────────────┐
│   FILECOIN NETWORK      │
│  - APK files            │
│  - Manifests (JSON)     │
│  - Decentralized CDN    │
│  - Warm Storage         │
└─────────────────────────┘
```

## 📋 Documentation

- **`IMPLEMENTATION_COMPLETE.md`** - ✅ Complete implementation summary
- **`FILECOIN_GUIDE.md`** - 📦 Filecoin storage integration guide
- **`TROUBLESHOOTING.md`** - 🔧 Common issues and solutions
- **`FRONTEND_INTEGRATION.md`** - ✅ Frontend integration summary
- **`APP_DETAIL_GUIDE.md`** - 📱 App detail page guide
- **`QUICK_START.md`** - 🚀 Quick start guide
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
- ✅ Complete Filecoin integration (Synapse SDK)
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