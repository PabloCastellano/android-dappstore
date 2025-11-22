import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("🚀 Deploying AppStore contracts...\n");

  const [deployer] = await hre.ethers.getSigners();
  const network = hre.network.name;

  console.log("📍 Network:", network);
  console.log("👤 Deploying with account:", deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Deploy AppStore
  console.log("📦 Deploying AppStore...");
  const AppStore = await hre.ethers.getContractFactory("AppStore");
  const appStore = await AppStore.deploy();
  await appStore.waitForDeployment();
  const appStoreAddress = await appStore.getAddress();
  
  console.log("✅ AppStore deployed to:", appStoreAddress);

  // Deploy AppStoreERC20
  console.log("\n📦 Deploying AppStoreERC20...");
  const AppStoreERC20 = await hre.ethers.getContractFactory("AppStoreERC20");
  const appStoreERC20 = await AppStoreERC20.deploy();
  await appStoreERC20.waitForDeployment();
  const appStoreERC20Address = await appStoreERC20.getAddress();
  
  console.log("✅ AppStoreERC20 deployed to:", appStoreERC20Address);

  // Configuración inicial
  console.log("\n⚙️  Initial configuration...");
  
  const platformFee = await appStore.platformFee();
  const feeCollector = await appStore.feeCollector();
  
  console.log("   Platform fee:", platformFee.toString(), "basis points (", Number(platformFee) / 100, "%)");
  console.log("   Fee collector:", feeCollector);

  // Guardar deployment info
  const deploymentInfo = {
    network: network,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      AppStore: {
        address: appStoreAddress,
        constructorArgs: []
      },
      AppStoreERC20: {
        address: appStoreERC20Address,
        constructorArgs: []
      }
    }
  };

  // Crear directorio deployments si no existe
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  // Guardar deployment info
  const deploymentPath = path.join(deploymentsDir, `${network}.json`);
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  
  console.log("\n💾 Deployment info saved to:", deploymentPath);

  // Generar archivo de configuración para el frontend
  const frontendConfig = {
    contracts: {
      AppStore: {
        address: appStoreAddress,
        abi: "artifacts/contracts/AppStore.sol/AppStore.json"
      },
      AppStoreERC20: {
        address: appStoreERC20Address,
        abi: "artifacts/contracts/AppStoreERC20.sol/AppStoreERC20.json"
      }
    },
    network: {
      name: network,
      chainId: deploymentInfo.chainId
    }
  };

  const configPath = path.join(__dirname, "..", "src", "config", "contracts.json");
  const configDir = path.dirname(configPath);
  
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  
  fs.writeFileSync(configPath, JSON.stringify(frontendConfig, null, 2));
  console.log("📝 Frontend config saved to:", configPath);

  // Verificación en Etherscan (solo para testnets/mainnet)
  if (network !== "hardhat" && network !== "localhost") {
    console.log("\n⏳ Waiting for block confirmations...");
    await appStore.deploymentTransaction().wait(5);
    
    console.log("\n🔍 Verifying contracts on Etherscan...");
    
    try {
      await hre.run("verify:verify", {
        address: appStoreAddress,
        constructorArguments: []
      });
      console.log("✅ AppStore verified");
    } catch (error) {
      console.log("⚠️  AppStore verification failed:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: appStoreERC20Address,
        constructorArguments: []
      });
      console.log("✅ AppStoreERC20 verified");
    } catch (error) {
      console.log("⚠️  AppStoreERC20 verification failed:", error.message);
    }
  }

  console.log("\n✨ Deployment completed!\n");
  console.log("📋 Summary:");
  console.log("   AppStore:", appStoreAddress);
  console.log("   AppStoreERC20:", appStoreERC20Address);
  console.log("\n🎉 Ready to use!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
