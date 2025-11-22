import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import {
  AppRegistered,
  VersionPublished,
  AppPurchased,
  AppDownloaded,
  PriceUpdated,
  AppDeactivated,
  AppReactivated
} from "../generated/AppStore/AppStore";
import {
  App,
  AppVersion,
  Publisher,
  Purchase,
  User,
  Download,
  PriceUpdate,
  GlobalStats
} from "../generated/schema";

// Helper para obtener o crear GlobalStats
function getOrCreateGlobalStats(): GlobalStats {
  let stats = GlobalStats.load("global");
  if (stats == null) {
    stats = new GlobalStats("global");
    stats.totalApps = BigInt.fromI32(0);
    stats.totalPublishers = BigInt.fromI32(0);
    stats.totalUsers = BigInt.fromI32(0);
    stats.totalPurchases = BigInt.fromI32(0);
    stats.totalDownloads = BigInt.fromI32(0);
    stats.totalRevenue = BigInt.fromI32(0);
    stats.updatedAt = BigInt.fromI32(0);
  }
  return stats;
}

// Helper para obtener o crear Publisher
function getOrCreatePublisher(address: Bytes, timestamp: BigInt): Publisher {
  let publisher = Publisher.load(address.toHexString());
  if (publisher == null) {
    publisher = new Publisher(address.toHexString());
    publisher.address = address;
    publisher.totalApps = BigInt.fromI32(0);
    publisher.totalRevenue = BigInt.fromI32(0);
    publisher.totalDownloads = BigInt.fromI32(0);
    publisher.createdAt = timestamp;
    
    // Actualizar stats globales
    let stats = getOrCreateGlobalStats();
    stats.totalPublishers = stats.totalPublishers.plus(BigInt.fromI32(1));
    stats.updatedAt = timestamp;
    stats.save();
  }
  return publisher;
}

// Helper para obtener o crear User
function getOrCreateUser(address: Bytes, timestamp: BigInt): User {
  let user = User.load(address.toHexString());
  if (user == null) {
    user = new User(address.toHexString());
    user.address = address;
    user.totalPurchases = BigInt.fromI32(0);
    user.totalSpent = BigInt.fromI32(0);
    user.createdAt = timestamp;
    
    // Actualizar stats globales
    let stats = getOrCreateGlobalStats();
    stats.totalUsers = stats.totalUsers.plus(BigInt.fromI32(1));
    stats.updatedAt = timestamp;
    stats.save();
  }
  return user;
}

// Evento: AppRegistered
export function handleAppRegistered(event: AppRegistered): void {
  let app = new App(event.params.slug);
  
  // Crear o actualizar publisher
  let publisher = getOrCreatePublisher(event.params.publisher, event.block.timestamp);
  publisher.totalApps = publisher.totalApps.plus(BigInt.fromI32(1));
  publisher.save();
  
  // Configurar app
  app.publisher = publisher.id;
  app.slug = event.params.slug;
  app.name = event.params.slug; // Se actualizará con datos del manifest
  app.latestManifestCid = event.params.manifestCid;
  app.priceWei = event.params.price;
  app.priceEth = event.params.price.toBigDecimal().div(BigInt.fromI32(10).pow(18).toBigDecimal()).toString();
  app.totalDownloads = BigInt.fromI32(0);
  app.totalRevenue = BigInt.fromI32(0);
  app.active = true;
  app.createdAt = event.block.timestamp;
  app.updatedAt = event.block.timestamp;
  app.save();
  
  // Crear primera versión
  let version = new AppVersion(event.params.slug + "-1");
  version.app = app.id;
  version.versionCode = 1;
  version.manifestCid = event.params.manifestCid;
  version.publishedAt = event.block.timestamp;
  version.publishedBy = event.params.publisher;
  version.deprecated = false;
  version.save();
  
  app.latestVersion = version.id;
  app.save();
  
  // Actualizar stats globales
  let stats = getOrCreateGlobalStats();
  stats.totalApps = stats.totalApps.plus(BigInt.fromI32(1));
  stats.updatedAt = event.block.timestamp;
  stats.save();
}

// Evento: VersionPublished
export function handleVersionPublished(event: VersionPublished): void {
  let app = App.load(event.params.slug);
  if (app == null) return;
  
  // Deprecar versión anterior
  if (app.latestVersion != null) {
    let oldVersion = AppVersion.load(app.latestVersion!);
    if (oldVersion != null) {
      oldVersion.deprecated = true;
      oldVersion.save();
    }
  }
  
  // Crear nueva versión
  let versionId = event.params.slug + "-" + event.params.versionCode.toString();
  let version = new AppVersion(versionId);
  version.app = app.id;
  version.versionCode = event.params.versionCode.toI32();
  version.manifestCid = event.params.manifestCid;
  version.publishedAt = event.block.timestamp;
  version.publishedBy = event.transaction.from;
  version.deprecated = false;
  version.save();
  
  // Actualizar app
  app.latestManifestCid = event.params.manifestCid;
  app.latestVersion = version.id;
  app.updatedAt = event.block.timestamp;
  app.save();
}

// Evento: AppPurchased
export function handleAppPurchased(event: AppPurchased): void {
  let app = App.load(event.params.slug);
  if (app == null) return;
  
  // Crear o actualizar user
  let user = getOrCreateUser(event.params.buyer, event.block.timestamp);
  user.totalPurchases = user.totalPurchases.plus(BigInt.fromI32(1));
  user.totalSpent = user.totalSpent.plus(event.params.price);
  user.save();
  
  // Crear purchase
  let purchaseId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  let purchase = new Purchase(purchaseId);
  purchase.app = app.id;
  purchase.buyer = user.id;
  purchase.price = event.params.price;
  purchase.timestamp = event.block.timestamp;
  purchase.transactionHash = event.transaction.hash;
  purchase.save();
  
  // Actualizar app
  app.totalRevenue = app.totalRevenue.plus(event.params.price);
  app.updatedAt = event.block.timestamp;
  app.save();
  
  // Actualizar publisher
  let publisher = Publisher.load(app.publisher);
  if (publisher != null) {
    publisher.totalRevenue = publisher.totalRevenue.plus(event.params.price);
    publisher.save();
  }
  
  // Actualizar stats globales
  let stats = getOrCreateGlobalStats();
  stats.totalPurchases = stats.totalPurchases.plus(BigInt.fromI32(1));
  stats.totalRevenue = stats.totalRevenue.plus(event.params.price);
  stats.updatedAt = event.block.timestamp;
  stats.save();
}

// Evento: AppDownloaded
export function handleAppDownloaded(event: AppDownloaded): void {
  let app = App.load(event.params.slug);
  if (app == null) return;
  
  // Crear download
  let downloadId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  let download = new Download(downloadId);
  download.app = app.id;
  download.user = event.params.downloader;
  download.timestamp = event.block.timestamp;
  download.transactionHash = event.transaction.hash;
  download.save();
  
  // Actualizar app
  app.totalDownloads = app.totalDownloads.plus(BigInt.fromI32(1));
  app.updatedAt = event.block.timestamp;
  app.save();
  
  // Actualizar publisher
  let publisher = Publisher.load(app.publisher);
  if (publisher != null) {
    publisher.totalDownloads = publisher.totalDownloads.plus(BigInt.fromI32(1));
    publisher.save();
  }
  
  // Actualizar stats globales
  let stats = getOrCreateGlobalStats();
  stats.totalDownloads = stats.totalDownloads.plus(BigInt.fromI32(1));
  stats.updatedAt = event.block.timestamp;
  stats.save();
}

// Evento: PriceUpdated
export function handlePriceUpdated(event: PriceUpdated): void {
  let app = App.load(event.params.slug);
  if (app == null) return;
  
  // Crear registro de actualización
  let updateId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  let priceUpdate = new PriceUpdate(updateId);
  priceUpdate.app = app.id;
  priceUpdate.oldPrice = app.priceWei;
  priceUpdate.newPrice = event.params.newPrice;
  priceUpdate.timestamp = event.block.timestamp;
  priceUpdate.transactionHash = event.transaction.hash;
  priceUpdate.save();
  
  // Actualizar app
  app.priceWei = event.params.newPrice;
  app.priceEth = event.params.newPrice.toBigDecimal().div(BigInt.fromI32(10).pow(18).toBigDecimal()).toString();
  app.updatedAt = event.block.timestamp;
  app.save();
}

// Evento: AppDeactivated
export function handleAppDeactivated(event: AppDeactivated): void {
  let app = App.load(event.params.slug);
  if (app == null) return;
  
  app.active = false;
  app.updatedAt = event.block.timestamp;
  app.save();
}

// Evento: AppReactivated
export function handleAppReactivated(event: AppReactivated): void {
  let app = App.load(event.params.slug);
  if (app == null) return;
  
  app.active = true;
  app.updatedAt = event.block.timestamp;
  app.save();
}
