import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * Hardhat Ignition module for deploying AppStore contracts
 * 
 * This module deploys:
 * 1. AppStore - Main contract for app registry and purchases
 * 2. AppStoreERC20 - Contract for ERC20 token payments
 */
const AppStoreModule = buildModule("AppStoreModule", (m) => {
  // Deploy AppStore contract
  const appStore = m.contract("AppStore", [], {
    id: "AppStore",
  });

  // Deploy AppStoreERC20 contract
  const appStoreERC20 = m.contract("AppStoreERC20", [], {
    id: "AppStoreERC20",
  });

  // Return both contracts for access in scripts
  return { appStore, appStoreERC20 };
});

export default AppStoreModule;
