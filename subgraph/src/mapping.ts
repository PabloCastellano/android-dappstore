import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import {
  AppRegistered,
  VersionPublished,
  AppDownloaded,
  AppStatusChanged
} from "../generated/AppStore/AppStore";
import {
  App,
  AppVersion,
  Publisher,
  User,
  Download,
  GlobalStats
} from "../generated/schema";

// Helper: Obtener o crear GlobalStats
function getOrCreateGlobalStats(): GlobalStats {
  let stats = GlobalStats.load("global");
  if (stats == null) {
    stats = new GlobalStats("global");
    stats.totalApps = BigInt.fromI32(0);
    stats.totalPublishers = BigInt.fromI32(0);
    stats.totalUsers = BigInt.fromI32(0);
    stats.totalDownloads = BigInt.fromI32(0);
    stats.updatedAt = BigInt.fromI32(0);
  }
  return stats;
}

// Helper: Obtener o crear Publisher
function getOrCreatePublisher(address: Bytes, timestamp: BigInt): Publisher {
  let publisher = Publisher.load(address.toHexString());
  if (publisher == null) {
    publisher = new Publisher(address.toHexString());
    publisher.address = address;
    publisher.totalApps = BigInt.fromI32(0);
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

// Helper: Obtener o crear User
function getOrCreateUser(address: Bytes, timestamp: BigInt): User {
  let user = User.load(address.toHexString());
  if (user == null) {
    user = new User(address.toHexString());
    user.address = address;
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
  app.name = event.params.slug; // Se puede actualizar con datos del manifest
  app.latestManifestCid = event.params.manifestCid;
  app.totalDownloads = BigInt.fromI32(0);
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
  // El evento incluye appKey (bytes32), manifestCid, y versionCode
  // Necesitamos encontrar la app por el appKey
  // Como el ID de la app es el slug, y el appKey es keccak256(slug),
  // no podemos recuperar directamente el slug del appKey
  // Solución: mantener un mapeo adicional o iterar (no ideal)
  // Por ahora, este handler queda limitado sin un mapeo adicional
  
  // TODO: Implementar mapeo appKey -> slug si es necesario
  // Alternativamente, cambiar el ID de App a usar appKey en lugar de slug
}

// Evento: AppDownloaded
export function handleAppDownloaded(event: AppDownloaded): void {
  // NOTA: Este evento usa appKey (bytes32) que es keccak256(slug)
  // Sin un mapeo adicional appKey->slug, no podemos vincular fácilmente
  // la descarga con la App específica
  // 
  // Solución temporal: Registrar la descarga sin vincularla a la app
  // TODO: Implementar mapeo appKey -> slug en handleAppRegistered
  
  // Crear o actualizar user
  let user = getOrCreateUser(event.params.downloader, event.block.timestamp);
  user.save();
  
  // Actualizar stats globales
  let stats = getOrCreateGlobalStats();
  stats.totalDownloads = stats.totalDownloads.plus(BigInt.fromI32(1));
  stats.updatedAt = event.block.timestamp;
  stats.save();
  
  // NOTA: No podemos crear la entidad Download sin vincularla a una App
  // porque app es un campo requerido. Necesitamos el mapeo appKey->slug
}

// Evento: AppStatusChanged
export function handleAppStatusChanged(event: AppStatusChanged): void {
  // Similar a otros handlers, necesitamos resolver appKey -> slug
  
  // TODO: Implementar mapeo appKey -> slug si es necesario
}
