import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const network = hre.network.name;
  console.log("🔗 Interacting with AppStore on network:", network, "\n");

  // Cargar deployment info
  const deploymentPath = path.join(__dirname, "..", "deployments", `${network}.json`);
  
  if (!fs.existsSync(deploymentPath)) {
    console.error("❌ Deployment file not found. Please deploy first.");
    process.exit(1);
  }

  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const appStoreAddress = deploymentInfo.contracts.AppStore.address;

  console.log("📍 AppStore address:", appStoreAddress);

  const [signer] = await hre.ethers.getSigners();
  console.log("👤 Using account:", signer.address, "\n");

  // Conectar al contrato
  const AppStore = await hre.ethers.getContractFactory("AppStore");
  const appStore = AppStore.attach(appStoreAddress);

  // Ejemplo: Registrar una app de prueba
  console.log("📱 Registering test app...");
  
  const slug = "test-app-" + Date.now();
  const manifestCid = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
  const price = hre.ethers.parseEther("0.01");
  const versionCode = 1;

  try {
    const tx = await appStore.registerApp(slug, manifestCid, price, versionCode);
    console.log("⏳ Transaction sent:", tx.hash);
    
    const receipt = await tx.wait();
    console.log("✅ App registered! Gas used:", receipt.gasUsed.toString());

    // Leer información de la app
    console.log("\n📊 App info:");
    const app = await appStore.getApp(slug);
    console.log("   Slug:", app.slug);
    console.log("   Publisher:", app.publisher);
    console.log("   Price:", hre.ethers.formatEther(app.priceWei), "ETH");
    console.log("   Active:", app.active);
    console.log("   Total downloads:", app.totalDownloads.toString());

    // Leer versiones
    const versionCount = await appStore.getVersionCount(slug);
    console.log("\n📦 Versions:", versionCount.toString());
    
    for (let i = 0; i < versionCount; i++) {
      const version = await appStore.getVersion(slug, i);
      console.log(`   Version ${i}:`);
      console.log(`      CID: ${version.manifestCid}`);
      console.log(`      Code: ${version.versionCode}`);
      console.log(`      Deprecated: ${version.deprecated}`);
    }

    // Estadísticas generales
    console.log("\n📈 Store stats:");
    const totalApps = await appStore.totalApps();
    const platformFee = await appStore.platformFee();
    const feeCollector = await appStore.feeCollector();
    
    console.log("   Total apps:", totalApps.toString());
    console.log("   Platform fee:", Number(platformFee) / 100, "%");
    console.log("   Fee collector:", feeCollector);

  } catch (error) {
    console.error("❌ Error:", error.message);
  }

  console.log("\n✨ Done!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
