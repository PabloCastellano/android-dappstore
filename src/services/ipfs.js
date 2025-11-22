/**
 * Servicio de IPFS para subir y descargar archivos
 * Soporta múltiples métodos: Helia (local), Pinata API, y gateways públicos
 */

import { create } from 'ipfs-http-client';

// Configuración de gateways IPFS públicos
const IPFS_GATEWAYS = [
  'https://ipfs.io/ipfs/',
  'https://gateway.pinata.cloud/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://dweb.link/ipfs/',
  'https://w3s.link/ipfs/'
];

// Configuración de Pinata
const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY;
const PINATA_SECRET_KEY = import.meta.env.VITE_PINATA_SECRET_KEY;
const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;

/**
 * Cliente IPFS HTTP (para nodo local o Infura)
 */
let ipfsClient = null;

/**
 * Inicializar cliente IPFS
 */
export function initIPFSClient(config = {}) {
  try {
    const defaultConfig = {
      host: config.host || 'localhost',
      port: config.port || 5001,
      protocol: config.protocol || 'http'
    };

    ipfsClient = create(defaultConfig);
    console.log('✅ IPFS client initialized:', defaultConfig);
    return ipfsClient;
  } catch (error) {
    console.error('❌ Error initializing IPFS client:', error);
    return null;
  }
}

/**
 * Subir archivo a IPFS usando cliente local
 * @param {File|Blob|ArrayBuffer|Uint8Array} file - Archivo a subir
 * @param {Object} options - Opciones adicionales
 * @returns {Promise<{cid: string, size: number}>}
 */
export async function uploadToIPFS(file, options = {}) {
  if (!ipfsClient) {
    throw new Error('IPFS client not initialized. Call initIPFSClient() first.');
  }

  try {
    let content;
    
    // Convertir File/Blob a ArrayBuffer
    if (file instanceof File || file instanceof Blob) {
      content = new Uint8Array(await file.arrayBuffer());
    } else if (file instanceof ArrayBuffer) {
      content = new Uint8Array(file);
    } else {
      content = file;
    }

    // Subir a IPFS
    const result = await ipfsClient.add(content, {
      progress: options.onProgress,
      pin: options.pin !== false, // Pin por defecto
      wrapWithDirectory: options.wrapWithDirectory || false
    });

    console.log('✅ File uploaded to IPFS:', result.cid.toString());

    return {
      cid: result.cid.toString(),
      size: result.size,
      path: result.path
    };
  } catch (error) {
    console.error('❌ Error uploading to IPFS:', error);
    throw error;
  }
}

/**
 * Subir archivo a Pinata (servicio de pinning)
 * @param {File|Blob} file - Archivo a subir
 * @param {Object} metadata - Metadata del archivo
 * @returns {Promise<{cid: string, size: number}>}
 */
export async function uploadToPinata(file, metadata = {}) {
  if (!PINATA_JWT && !PINATA_API_KEY) {
    throw new Error('Pinata credentials not configured. Set VITE_PINATA_JWT or VITE_PINATA_API_KEY in .env');
  }

  try {
    const formData = new FormData();
    formData.append('file', file);

    // Agregar metadata
    if (metadata.name || metadata.keyvalues) {
      const pinataMetadata = {
        name: metadata.name || file.name,
        keyvalues: metadata.keyvalues || {}
      };
      formData.append('pinataMetadata', JSON.stringify(pinataMetadata));
    }

    // Opciones de pinning
    if (metadata.pinataOptions) {
      formData.append('pinataOptions', JSON.stringify(metadata.pinataOptions));
    }

    // Headers de autenticación
    const headers = PINATA_JWT
      ? { Authorization: `Bearer ${PINATA_JWT}` }
      : {
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_SECRET_KEY
        };

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers,
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Pinata upload failed: ${error.error || response.statusText}`);
    }

    const data = await response.json();
    
    console.log('✅ File uploaded to Pinata:', data.IpfsHash);

    return {
      cid: data.IpfsHash,
      size: data.PinSize,
      timestamp: data.Timestamp
    };
  } catch (error) {
    console.error('❌ Error uploading to Pinata:', error);
    throw error;
  }
}

/**
 * Subir JSON a Pinata
 * @param {Object} jsonData - Datos JSON a subir
 * @param {Object} metadata - Metadata
 * @returns {Promise<{cid: string}>}
 */
export async function uploadJSONToPinata(jsonData, metadata = {}) {
  if (!PINATA_JWT && !PINATA_API_KEY) {
    throw new Error('Pinata credentials not configured');
  }

  try {
    const headers = PINATA_JWT
      ? {
          'Authorization': `Bearer ${PINATA_JWT}`,
          'Content-Type': 'application/json'
        }
      : {
          'pinata_api_key': PINATA_API_KEY,
          'pinata_secret_api_key': PINATA_SECRET_KEY,
          'Content-Type': 'application/json'
        };

    const body = {
      pinataContent: jsonData,
      pinataMetadata: {
        name: metadata.name || 'manifest.json',
        keyvalues: metadata.keyvalues || {}
      }
    };

    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Pinata JSON upload failed: ${error.error || response.statusText}`);
    }

    const data = await response.json();
    
    console.log('✅ JSON uploaded to Pinata:', data.IpfsHash);

    return {
      cid: data.IpfsHash,
      size: data.PinSize,
      timestamp: data.Timestamp
    };
  } catch (error) {
    console.error('❌ Error uploading JSON to Pinata:', error);
    throw error;
  }
}

/**
 * Descargar archivo desde IPFS
 * @param {string} cid - CID del archivo
 * @param {Object} options - Opciones
 * @returns {Promise<Blob>}
 */
export async function downloadFromIPFS(cid, options = {}) {
  const gatewayIndex = options.gatewayIndex || 0;
  const gateway = IPFS_GATEWAYS[gatewayIndex] || IPFS_GATEWAYS[0];
  const url = `${gateway}${cid}`;

  try {
    const response = await fetch(url, {
      signal: options.signal,
      headers: options.headers || {}
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const blob = await response.blob();
    console.log('✅ File downloaded from IPFS:', cid);
    
    return blob;
  } catch (error) {
    console.error(`❌ Error downloading from gateway ${gateway}:`, error);
    
    // Intentar con el siguiente gateway
    if (gatewayIndex < IPFS_GATEWAYS.length - 1) {
      console.log(`🔄 Trying next gateway...`);
      return downloadFromIPFS(cid, { ...options, gatewayIndex: gatewayIndex + 1 });
    }
    
    throw error;
  }
}

/**
 * Descargar JSON desde IPFS
 * @param {string} cid - CID del JSON
 * @returns {Promise<Object>}
 */
export async function downloadJSONFromIPFS(cid) {
  try {
    const blob = await downloadFromIPFS(cid);
    const text = await blob.text();
    const json = JSON.parse(text);
    
    console.log('✅ JSON downloaded from IPFS:', cid);
    return json;
  } catch (error) {
    console.error('❌ Error downloading JSON from IPFS:', error);
    throw error;
  }
}

/**
 * Verificar si un CID es válido
 * @param {string} cid - CID a verificar
 * @returns {boolean}
 */
export function isValidCID(cid) {
  if (!cid || typeof cid !== 'string') return false;
  
  // CIDv0: Qm... (46 caracteres)
  const cidv0Regex = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;
  
  // CIDv1: bafy... o b... (variable)
  const cidv1Regex = /^b[a-z2-7]{58,}$/;
  
  return cidv0Regex.test(cid) || cidv1Regex.test(cid);
}

/**
 * Obtener URL de gateway para un CID
 * @param {string} cid - CID del archivo
 * @param {number} gatewayIndex - Índice del gateway a usar
 * @returns {string}
 */
export function getIPFSUrl(cid, gatewayIndex = 0) {
  const gateway = IPFS_GATEWAYS[gatewayIndex] || IPFS_GATEWAYS[0];
  return `${gateway}${cid}`;
}

/**
 * Calcular hash SHA-256 de un archivo
 * @param {File|Blob|ArrayBuffer} file - Archivo
 * @returns {Promise<string>}
 */
export async function calculateSHA256(file) {
  let buffer;
  
  if (file instanceof File || file instanceof Blob) {
    buffer = await file.arrayBuffer();
  } else {
    buffer = file;
  }

  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}

/**
 * Verificar integridad de archivo descargado
 * @param {Blob} file - Archivo descargado
 * @param {string} expectedHash - Hash esperado
 * @returns {Promise<boolean>}
 */
export async function verifyFileIntegrity(file, expectedHash) {
  try {
    const actualHash = await calculateSHA256(file);
    return actualHash === expectedHash;
  } catch (error) {
    console.error('❌ Error verifying file integrity:', error);
    return false;
  }
}

/**
 * Obtener información de un pin en Pinata
 * @param {string} cid - CID del archivo
 * @returns {Promise<Object>}
 */
export async function getPinataMetadata(cid) {
  if (!PINATA_JWT && !PINATA_API_KEY) {
    throw new Error('Pinata credentials not configured');
  }

  try {
    const headers = PINATA_JWT
      ? { Authorization: `Bearer ${PINATA_JWT}` }
      : {
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_SECRET_KEY
        };

    const response = await fetch(
      `https://api.pinata.cloud/data/pinList?hashContains=${cid}`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`Failed to get Pinata metadata: ${response.statusText}`);
    }

    const data = await response.json();
    return data.rows[0] || null;
  } catch (error) {
    console.error('❌ Error getting Pinata metadata:', error);
    throw error;
  }
}

export default {
  initIPFSClient,
  uploadToIPFS,
  uploadToPinata,
  uploadJSONToPinata,
  downloadFromIPFS,
  downloadJSONFromIPFS,
  isValidCID,
  getIPFSUrl,
  calculateSHA256,
  verifyFileIntegrity,
  getPinataMetadata,
  IPFS_GATEWAYS
};
