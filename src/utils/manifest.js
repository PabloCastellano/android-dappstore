/**
 * Utilidades para crear, validar y firmar manifests de apps
 */

import { calculateSHA256 } from '../services/ipfs.js';

/**
 * Estructura de un manifest de app
 * @typedef {Object} AppManifest
 * @property {string} name - Nombre de la app
 * @property {string} slug - Identificador único
 * @property {string} package - Package name (com.example.app)
 * @property {string} version - Versión semántica (1.0.0)
 * @property {number} versionCode - Código de versión numérico
 * @property {string} description - Descripción
 * @property {string} apk_cid - CID del APK en IPFS
 * @property {string} apk_sha256 - Hash SHA-256 del APK
 * @property {number} apk_size - Tamaño del APK en bytes
 * @property {string} icon_cid - CID del icono en IPFS
 * @property {string[]} screenshots_cids - CIDs de screenshots
 * @property {string[]} permissions - Permisos de Android
 * @property {string} min_sdk - Versión mínima de Android
 * @property {string} target_sdk - Versión target de Android
 * @property {string} publisher - Address del publisher
 * @property {string} publisher_name - Nombre del publisher
 * @property {string} website - Website de la app
 * @property {string} source_code - URL del código fuente
 * @property {string} license - Licencia (MIT, GPL, etc)
 * @property {string[]} categories - Categorías
 * @property {string} created_at - Timestamp ISO
 * @property {string} signature - Firma EIP-712 del manifest
 */

/**
 * Crear un manifest básico
 * @param {Object} appData - Datos de la app
 * @param {Object} apkInfo - Información del APK
 * @returns {AppManifest}
 */
export function createManifest(appData, apkInfo) {
  const manifest = {
    // Información básica
    name: appData.name,
    slug: appData.slug,
    package: appData.package,
    version: appData.version,
    versionCode: appData.versionCode,
    description: appData.description || '',

    // APK
    apk_cid: apkInfo.cid,
    apk_sha256: apkInfo.sha256,
    apk_size: apkInfo.size,

    // Assets
    icon_cid: appData.icon_cid || '',
    screenshots_cids: appData.screenshots_cids || [],

    // Permisos y compatibilidad
    permissions: appData.permissions || [],
    min_sdk: appData.min_sdk || '21',
    target_sdk: appData.target_sdk || '34',

    // Publisher
    publisher: appData.publisher,
    publisher_name: appData.publisher_name || '',
    website: appData.website || '',
    source_code: appData.source_code || '',
    license: appData.license || 'Proprietary',

    // Categorías
    categories: appData.categories || [],

    // Metadata
    created_at: new Date().toISOString(),
    
    // Firma (se agrega después)
    signature: ''
  };

  return manifest;
}

/**
 * Validar estructura de manifest
 * @param {Object} manifest - Manifest a validar
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validateManifest(manifest) {
  const errors = [];

  // Campos requeridos
  const requiredFields = [
    'name', 'slug', 'package', 'version', 'versionCode',
    'apk_cid', 'apk_sha256', 'apk_size', 'publisher'
  ];

  for (const field of requiredFields) {
    if (!manifest[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Validar slug (solo lowercase, números y guiones)
  if (manifest.slug && !/^[a-z0-9-]+$/.test(manifest.slug)) {
    errors.push('Slug must contain only lowercase letters, numbers, and hyphens');
  }

  // Validar package name
  if (manifest.package && !/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(manifest.package)) {
    errors.push('Invalid package name format (e.g., com.example.app)');
  }

  // Validar versión semántica
  if (manifest.version && !/^\d+\.\d+\.\d+$/.test(manifest.version)) {
    errors.push('Version must follow semantic versioning (e.g., 1.0.0)');
  }

  // Validar versionCode
  if (manifest.versionCode && (!Number.isInteger(manifest.versionCode) || manifest.versionCode < 1)) {
    errors.push('Version code must be a positive integer');
  }

  // Validar CIDs
  const cidFields = ['apk_cid', 'icon_cid'];
  for (const field of cidFields) {
    if (manifest[field] && !isValidCID(manifest[field])) {
      errors.push(`Invalid CID format: ${field}`);
    }
  }

  // Validar SHA-256
  if (manifest.apk_sha256 && !/^[a-f0-9]{64}$/.test(manifest.apk_sha256)) {
    errors.push('Invalid SHA-256 hash format');
  }

  // Validar address de Ethereum
  if (manifest.publisher && !/^0x[a-fA-F0-9]{40}$/.test(manifest.publisher)) {
    errors.push('Invalid Ethereum address');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validar CID de IPFS
 */
function isValidCID(cid) {
  if (!cid || typeof cid !== 'string') return false;
  const cidv0Regex = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;
  const cidv1Regex = /^b[a-z2-7]{58,}$/;
  return cidv0Regex.test(cid) || cidv1Regex.test(cid);
}

/**
 * Crear mensaje para firma EIP-712
 * @param {AppManifest} manifest - Manifest a firmar
 * @param {string} chainId - Chain ID
 * @returns {Object} - Mensaje EIP-712
 */
export function createEIP712Message(manifest, chainId = 1) {
  const domain = {
    name: 'DApp Store',
    version: '1',
    chainId: chainId
  };

  const types = {
    AppManifest: [
      { name: 'name', type: 'string' },
      { name: 'slug', type: 'string' },
      { name: 'package', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'versionCode', type: 'uint256' },
      { name: 'apk_cid', type: 'string' },
      { name: 'apk_sha256', type: 'string' },
      { name: 'publisher', type: 'address' }
    ]
  };

  const message = {
    name: manifest.name,
    slug: manifest.slug,
    package: manifest.package,
    version: manifest.version,
    versionCode: manifest.versionCode,
    apk_cid: manifest.apk_cid,
    apk_sha256: manifest.apk_sha256,
    publisher: manifest.publisher
  };

  return {
    domain,
    types,
    message,
    primaryType: 'AppManifest'
  };
}

/**
 * Firmar manifest con EIP-712
 * @param {AppManifest} manifest - Manifest a firmar
 * @param {Object} signer - Signer de ethers.js
 * @param {string} chainId - Chain ID
 * @returns {Promise<string>} - Firma
 */
export async function signManifest(manifest, signer, chainId) {
  try {
    const eip712Message = createEIP712Message(manifest, chainId);
    
    // Firmar con EIP-712
    const signature = await signer.signTypedData(
      eip712Message.domain,
      eip712Message.types,
      eip712Message.message
    );

    console.log('✅ Manifest signed:', signature);
    return signature;
  } catch (error) {
    console.error('❌ Error signing manifest:', error);
    throw error;
  }
}

/**
 * Verificar firma de manifest
 * @param {AppManifest} manifest - Manifest con firma
 * @param {string} chainId - Chain ID
 * @returns {Promise<{valid: boolean, recoveredAddress: string}>}
 */
export async function verifyManifestSignature(manifest, chainId) {
  try {
    const { ethers } = await import('ethers');
    const eip712Message = createEIP712Message(manifest, chainId);
    
    // Recuperar address del firmante
    const recoveredAddress = ethers.verifyTypedData(
      eip712Message.domain,
      eip712Message.types,
      eip712Message.message,
      manifest.signature
    );

    const valid = recoveredAddress.toLowerCase() === manifest.publisher.toLowerCase();

    console.log('✅ Signature verified:', { valid, recoveredAddress });
    
    return { valid, recoveredAddress };
  } catch (error) {
    console.error('❌ Error verifying signature:', error);
    return { valid: false, recoveredAddress: null };
  }
}

/**
 * Extraer información de un APK (simulado - requiere backend)
 * En producción, esto debería hacerse en el backend con herramientas como aapt2
 * @param {File} apkFile - Archivo APK
 * @returns {Promise<Object>}
 */
export async function extractAPKInfo(apkFile) {
  // En producción, esto debería ser una llamada a un backend que use aapt2
  // Por ahora, retornamos información básica
  
  const sha256 = await calculateSHA256(apkFile);
  
  return {
    size: apkFile.size,
    sha256,
    // Estos valores deberían venir del análisis del APK
    package: 'com.example.app',
    version: '1.0.0',
    versionCode: 1,
    min_sdk: '21',
    target_sdk: '34',
    permissions: []
  };
}

/**
 * Formatear tamaño de archivo
 * @param {number} bytes - Tamaño en bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Validar permisos de Android
 * @param {string[]} permissions - Lista de permisos
 * @returns {{valid: boolean, dangerous: string[]}}
 */
export function validatePermissions(permissions) {
  const dangerousPermissions = [
    'READ_CONTACTS',
    'WRITE_CONTACTS',
    'READ_CALENDAR',
    'WRITE_CALENDAR',
    'READ_CALL_LOG',
    'WRITE_CALL_LOG',
    'CAMERA',
    'RECORD_AUDIO',
    'ACCESS_FINE_LOCATION',
    'ACCESS_COARSE_LOCATION',
    'READ_PHONE_STATE',
    'CALL_PHONE',
    'READ_SMS',
    'SEND_SMS',
    'RECEIVE_SMS',
    'READ_EXTERNAL_STORAGE',
    'WRITE_EXTERNAL_STORAGE'
  ];

  const dangerous = permissions.filter(p => 
    dangerousPermissions.some(dp => p.includes(dp))
  );

  return {
    valid: true,
    dangerous
  };
}

/**
 * Generar slug desde nombre
 * @param {string} name - Nombre de la app
 * @returns {string}
 */
export function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default {
  createManifest,
  validateManifest,
  createEIP712Message,
  signManifest,
  verifyManifestSignature,
  extractAPKInfo,
  formatFileSize,
  validatePermissions,
  generateSlug
};
