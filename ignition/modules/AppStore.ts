import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * Hardhat Ignition module for deploying AppStore contract
 * 
 * This module deploys:
 * 1. AppStore - Main contract for app registry and downloads
 */
const AppStoreModule = buildModule("AppStoreModule", (m) => {
  // Deploy AppStore contract
  const appStore = m.contract("AppStore", [], {
    id: "AppStore",
  });

  // Return contract for access in scripts
  return { appStore };
});

export default AppStoreModule;
