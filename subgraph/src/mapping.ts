import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import {
  AppRegistered,
  VersionPublished,
  AppPurchased,
  AppDownloaded,
  AppUpdated,
  AppStatusChanged
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
  app.priceWei = event.params.priceWei;
  app.priceEth = event.params.priceWei.toBigDecimal().div(BigInt.fromI32(10).pow(18).toBigDecimal()).toString();
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
  // TODO: El evento ahora usa appKey (bytes32) en lugar de slug (string)
  // Necesitamos mantener un mapeo appKey -> slug en handleAppRegistered
  // Por ahora, este handler está deshabilitado
  // 
  // let appKey = event.params.appKey;
  // let slug = resolveSlugFromAppKey(appKey); // Función a implementar
  // let app = App.load(slug);
  // ...
}

// Evento: AppPurchased
export function handleAppPurchased(event: AppPurchased): void {
  // TODO: El evento ahora usa appKey (bytes32) en lugar de slug (string)
  // y los parámetros son: (appKey, buyer, amountPaid, platformFee)
  // Necesitamos resolver appKey -> slug
  // 
  // let appKey = event.params.appKey;
  // let buyer = event.params.buyer;
  // let amountPaid = event.params.amountPaid;
  // let platformFee = event.params.platformFee;
  // ...
}

// Evento: AppDownloaded
export function handleAppDownloaded(event: AppDownloaded): void {
  // TODO: El evento ahora usa appKey (bytes32) en lugar de slug (string)
  // y los parámetros son: (appKey, downloader)
  // Necesitamos resolver appKey -> slug
  // 
  // let appKey = event.params.appKey;
  // let downloader = event.params.downloader;
  // ...
}

// Evento: AppUpdated
export function handleAppUpdated(event: AppUpdated): void {
  // El appKey es el hash del slug, necesitamos buscar la app por appKey
  // Por ahora, buscamos todas las apps y comparamos el appKey
  // En producción, considera mantener un mapeo appKey -> slug
  let appKey = event.params.appKey;
  
  // Como el schema usa slug como ID, necesitamos encontrar la app correspondiente
  // Esto es una limitación: no podemos mapear fácilmente appKey -> slug sin mantener estado adicional
  // Por ahora, esta función necesitará que la app ya esté cargada
  // Solución temporal: skip if we can't find it
  // TODO: Mejorar esto agregando un mapeo en handleAppRegistered
}

// Evento: AppStatusChanged
export function handleAppStatusChanged(event: AppStatusChanged): void {
  // Similar a handleAppUpdated, necesitamos resolver appKey -> slug
  // Por ahora, esta funcionalidad está limitada sin un mapeo adicional
  // TODO: Mejorar esto agregando un mapeo en handleAppRegistered
}
