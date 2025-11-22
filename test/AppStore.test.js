import { expect } from "chai";
import hre from "hardhat";

const { ethers } = hre;

describe("AppStore", function () {
  let appStore;
  let owner;
  let publisher;
  let buyer;
  let feeCollector;

  const SLUG = "my-awesome-app";
  const MANIFEST_CID = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
  const PRICE = ethers.parseEther("0.1");
  const VERSION_CODE = 1;

  beforeEach(async function () {
    [owner, publisher, buyer, feeCollector] = await ethers.getSigners();

    const AppStore = await ethers.getContractFactory("AppStore");
    appStore = await AppStore.deploy();
    await appStore.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await appStore.owner()).to.equal(owner.address);
    });

    it("Should set fee collector to owner initially", async function () {
      expect(await appStore.feeCollector()).to.equal(owner.address);
    });

    it("Should set platform fee to 2.5%", async function () {
      expect(await appStore.platformFee()).to.equal(250);
    });
  });

  describe("App Registration", function () {
    it("Should register a new app", async function () {
      await expect(
        appStore.connect(publisher).registerApp(SLUG, MANIFEST_CID, PRICE, VERSION_CODE)
      )
        .to.emit(appStore, "AppRegistered")
        .and.to.emit(appStore, "VersionPublished");

      const app = await appStore.getApp(SLUG);
      expect(app.publisher).to.equal(publisher.address);
      expect(app.slug).to.equal(SLUG);
      expect(app.priceWei).to.equal(PRICE);
      expect(app.exists).to.be.true;
      expect(app.active).to.be.true;
    });

    it("Should not allow duplicate slugs", async function () {
      await appStore.connect(publisher).registerApp(SLUG, MANIFEST_CID, PRICE, VERSION_CODE);
      
      await expect(
        appStore.connect(publisher).registerApp(SLUG, MANIFEST_CID, PRICE, VERSION_CODE)
      ).to.be.revertedWith("App slug already exists");
    });

    it("Should not allow empty slug", async function () {
      await expect(
        appStore.connect(publisher).registerApp("", MANIFEST_CID, PRICE, VERSION_CODE)
      ).to.be.revertedWith("Slug cannot be empty");
    });

    it("Should increment total apps", async function () {
      expect(await appStore.totalApps()).to.equal(0);
      
      await appStore.connect(publisher).registerApp(SLUG, MANIFEST_CID, PRICE, VERSION_CODE);
      
      expect(await appStore.totalApps()).to.equal(1);
    });
  });

  describe("Version Management", function () {
    beforeEach(async function () {
      await appStore.connect(publisher).registerApp(SLUG, MANIFEST_CID, PRICE, VERSION_CODE);
    });

    it("Should publish a new version", async function () {
      const newCid = "QmNewVersion123";
      const newVersionCode = 2;

      await expect(
        appStore.connect(publisher).publishVersion(SLUG, newCid, newVersionCode)
      ).to.emit(appStore, "VersionPublished");

      const versionCount = await appStore.getVersionCount(SLUG);
      expect(versionCount).to.equal(2);

      const latestManifest = await appStore.getLatestManifest(SLUG);
      expect(latestManifest).to.equal(newCid);
    });

    it("Should not allow non-publisher to publish version", async function () {
      await expect(
        appStore.connect(buyer).publishVersion(SLUG, "QmNew", 2)
      ).to.be.revertedWith("Not the publisher");
    });

    it("Should require increasing version codes", async function () {
      await expect(
        appStore.connect(publisher).publishVersion(SLUG, "QmNew", 1)
      ).to.be.revertedWith("Version code must be greater than previous");
    });

    it("Should allow deprecating a version", async function () {
      await appStore.connect(publisher).deprecateVersion(SLUG, 0);
      
      const version = await appStore.getVersion(SLUG, 0);
      expect(version.deprecated).to.be.true;
    });
  });

  describe("Purchases", function () {
    beforeEach(async function () {
      await appStore.connect(publisher).registerApp(SLUG, MANIFEST_CID, PRICE, VERSION_CODE);
    });

    it("Should allow purchasing a paid app", async function () {
      const publisherBalanceBefore = await ethers.provider.getBalance(publisher.address);
      
      await expect(
        appStore.connect(buyer).purchaseApp(SLUG, { value: PRICE })
      ).to.emit(appStore, "AppPurchased");

      const hasPurchased = await appStore.hasUserPurchased(buyer.address, SLUG);
      expect(hasPurchased).to.be.true;

      const app = await appStore.getApp(SLUG);
      expect(app.totalDownloads).to.equal(1);
    });

    it("Should distribute payment correctly with platform fee", async function () {
      const platformFee = (PRICE * 250n) / 10000n; // 2.5%
      const publisherAmount = PRICE - platformFee;

      const publisherBalanceBefore = await ethers.provider.getBalance(publisher.address);
      const feeCollectorBalanceBefore = await ethers.provider.getBalance(owner.address);

      await appStore.connect(buyer).purchaseApp(SLUG, { value: PRICE });

      const publisherBalanceAfter = await ethers.provider.getBalance(publisher.address);
      const feeCollectorBalanceAfter = await ethers.provider.getBalance(owner.address);

      expect(publisherBalanceAfter - publisherBalanceBefore).to.equal(publisherAmount);
      expect(feeCollectorBalanceAfter - feeCollectorBalanceBefore).to.equal(platformFee);
    });

    it("Should not allow purchasing twice", async function () {
      await appStore.connect(buyer).purchaseApp(SLUG, { value: PRICE });
      
      await expect(
        appStore.connect(buyer).purchaseApp(SLUG, { value: PRICE })
      ).to.be.revertedWith("Already purchased");
    });

    it("Should revert if insufficient payment", async function () {
      await expect(
        appStore.connect(buyer).purchaseApp(SLUG, { value: ethers.parseEther("0.05") })
      ).to.be.revertedWith("Insufficient payment");
    });

    it("Should refund excess payment", async function () {
      const overpayment = ethers.parseEther("0.2");
      const buyerBalanceBefore = await ethers.provider.getBalance(buyer.address);

      const tx = await appStore.connect(buyer).purchaseApp(SLUG, { value: overpayment });
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const buyerBalanceAfter = await ethers.provider.getBalance(buyer.address);
      
      // Debería haber pagado solo el precio + gas, no el overpayment completo
      const actualSpent = buyerBalanceBefore - buyerBalanceAfter;
      expect(actualSpent).to.be.closeTo(PRICE + gasUsed, ethers.parseEther("0.001"));
    });
  });

  describe("Free Apps", function () {
    beforeEach(async function () {
      await appStore.connect(publisher).registerApp(SLUG, MANIFEST_CID, 0, VERSION_CODE);
    });

    it("Should allow downloading free apps without payment", async function () {
      await expect(
        appStore.connect(buyer).purchaseApp(SLUG)
      ).to.emit(appStore, "AppDownloaded");

      const app = await appStore.getApp(SLUG);
      expect(app.totalDownloads).to.equal(1);
    });

    it("Should not mark free app as purchased", async function () {
      await appStore.connect(buyer).purchaseApp(SLUG);
      
      const hasPurchased = await appStore.hasUserPurchased(buyer.address, SLUG);
      expect(hasPurchased).to.be.false;
    });
  });

  describe("Price Updates", function () {
    beforeEach(async function () {
      await appStore.connect(publisher).registerApp(SLUG, MANIFEST_CID, PRICE, VERSION_CODE);
    });

    it("Should allow publisher to update price", async function () {
      const newPrice = ethers.parseEther("0.2");
      
      await expect(
        appStore.connect(publisher).updatePrice(SLUG, newPrice)
      ).to.emit(appStore, "AppUpdated");

      const app = await appStore.getApp(SLUG);
      expect(app.priceWei).to.equal(newPrice);
    });

    it("Should not allow non-publisher to update price", async function () {
      await expect(
        appStore.connect(buyer).updatePrice(SLUG, ethers.parseEther("0.2"))
      ).to.be.revertedWith("Not the publisher");
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update platform fee", async function () {
      await appStore.setPlatformFee(500); // 5%
      expect(await appStore.platformFee()).to.equal(500);
    });

    it("Should not allow fee higher than 10%", async function () {
      await expect(
        appStore.setPlatformFee(1001)
      ).to.be.revertedWith("Fee too high (max 10%)");
    });

    it("Should allow owner to update fee collector", async function () {
      await appStore.setFeeCollector(feeCollector.address);
      expect(await appStore.feeCollector()).to.equal(feeCollector.address);
    });

    it("Should allow owner to deactivate app", async function () {
      await appStore.connect(publisher).registerApp(SLUG, MANIFEST_CID, PRICE, VERSION_CODE);
      
      await appStore.setAppStatus(SLUG, false);
      
      const app = await appStore.getApp(SLUG);
      expect(app.active).to.be.false;
    });

    it("Should not allow purchasing deactivated app", async function () {
      await appStore.connect(publisher).registerApp(SLUG, MANIFEST_CID, PRICE, VERSION_CODE);
      await appStore.setAppStatus(SLUG, false);
      
      await expect(
        appStore.connect(buyer).purchaseApp(SLUG, { value: PRICE })
      ).to.be.revertedWith("App is not active");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await appStore.connect(publisher).registerApp(SLUG, MANIFEST_CID, PRICE, VERSION_CODE);
    });

    it("Should return correct version count", async function () {
      expect(await appStore.getVersionCount(SLUG)).to.equal(1);
      
      await appStore.connect(publisher).publishVersion(SLUG, "QmNew", 2);
      
      expect(await appStore.getVersionCount(SLUG)).to.equal(2);
    });

    it("Should return version details", async function () {
      const version = await appStore.getVersion(SLUG, 0);
      
      expect(version.manifestCid).to.equal(MANIFEST_CID);
      expect(version.versionCode).to.equal(VERSION_CODE);
      expect(version.deprecated).to.be.false;
    });

    it("Should return purchase count", async function () {
      expect(await appStore.getPurchaseCount(SLUG)).to.equal(0);
      
      await appStore.connect(buyer).purchaseApp(SLUG, { value: PRICE });
      
      expect(await appStore.getPurchaseCount(SLUG)).to.equal(1);
    });
  });
});
