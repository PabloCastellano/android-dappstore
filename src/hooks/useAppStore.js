/**
 * Hook para interactuar con el contrato AppStore
 * Versión funcional - reemplaza useAppStore.example.js
 */

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

// ABI del contrato AppStore (solo las funciones que usamos)
const APP_STORE_ABI = [
  "function registerApp(string calldata slug, string calldata manifestCid, uint256 versionCode) external",
  "function publishVersion(string calldata slug, string calldata manifestCid, uint256 versionCode) external",
  "function downloadApp(string calldata slug) external",
  "function deprecateVersion(string calldata slug, uint256 versionIndex) external",
  "function getApp(string calldata slug) external view returns (tuple(address publisher, string slug, string latestManifestCid, uint256 totalDownloads, bool exists, bool active, uint256 createdAt))",
  "function getLatestManifest(string calldata slug) external view returns (string memory)",
  "function getVersionCount(string calldata slug) external view returns (uint256)",
  "function getVersion(string calldata slug, uint256 index) external view returns (tuple(string manifestCid, uint256 timestamp, uint256 versionCode, bool deprecated))",
  "function totalApps() external view returns (uint256)",
  "event AppRegistered(bytes32 indexed appKey, string slug, address indexed publisher, string manifestCid)",
  "event AppDownloaded(bytes32 indexed appKey, address indexed downloader)",
  "event VersionPublished(bytes32 indexed appKey, string manifestCid, uint256 versionCode)"
];

export function useAppStore(wallet) {
  const [contract, setContract] = useState(null);
  const [contractAddress, setContractAddress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cargar dirección del contrato desde Ignition deployments
  useEffect(() => {
    const loadContractAddress = async () => {
      try {
        // Intentar cargar desde Ignition deployment (localhost = chain 31337)
        const chainId = wallet?.chainId || 31337;
        const response = await fetch(`/ignition/deployments/chain-${chainId}/deployed_addresses.json`);
        
        if (response.ok) {
          const addresses = await response.json();
          // Ignition usa el formato: "ModuleName#ContractName"
          const address = addresses['AppStoreModule#AppStore'];
          if (address) {
            setContractAddress(address);
            console.log('✅ Contract address loaded from Ignition:', address);
            return;
          }
        }
      } catch (err) {
        console.warn('⚠️ Could not load from Ignition deployments:', err.message);
      }

      console.error('⚠️  Deploy contracts first with: npm run deploy:local');
    };

    loadContractAddress();
  }, [wallet?.chainId]);

  // Crear instancia del contrato cuando hay wallet y address
  useEffect(() => {
    if (wallet?.signer && contractAddress) {
      try {
        const contractInstance = new ethers.Contract(
          contractAddress,
          APP_STORE_ABI,
          wallet.signer
        );
        setContract(contractInstance);
        console.log('✅ Contract instance created');
      } catch (err) {
        console.error('❌ Error creating contract:', err);
        setError('Error al crear instancia del contrato');
      }
    }
  }, [wallet?.signer, contractAddress]);

  // Registrar nueva app
  const registerApp = useCallback(async ({ slug, manifestCid, versionCode }) => {
    if (!contract) {
      return { success: false, error: 'Contrato no inicializado' };
    }

    setLoading(true);
    setError(null);

    try {
      console.log('📝 Registering app:', { slug, manifestCid, versionCode });

      const tx = await contract.registerApp(slug, manifestCid, versionCode);
      console.log('⏳ Transaction sent:', tx.hash);

      const receipt = await tx.wait();
      console.log('✅ App registered! Block:', receipt.blockNumber);

      return {
        success: true,
        txHash: tx.hash,
        receipt
      };
    } catch (err) {
      console.error('❌ Error registering app:', err);
      const errorMessage = err.reason || err.message || 'Error al registrar app';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [contract]);

  // Publicar nueva versión
  const publishVersion = useCallback(async ({ slug, manifestCid, versionCode }) => {
    if (!contract) {
      return { success: false, error: 'Contrato no inicializado' };
    }

    setLoading(true);
    setError(null);

    try {
      console.log('📝 Publishing version:', { slug, manifestCid, versionCode });

      const tx = await contract.publishVersion(slug, manifestCid, versionCode);
      console.log('⏳ Transaction sent:', tx.hash);

      const receipt = await tx.wait();
      console.log('✅ Version published! Block:', receipt.blockNumber);

      return {
        success: true,
        txHash: tx.hash,
        receipt
      };
    } catch (err) {
      console.error('❌ Error publishing version:', err);
      const errorMessage = err.reason || err.message || 'Error al publicar versión';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [contract]);

  // Descargar app
  const downloadApp = useCallback(async (slug) => {
    if (!contract) {
      return { success: false, error: 'Contrato no inicializado' };
    }

    setLoading(true);
    setError(null);

    try {
      console.log('📥 Downloading app:', { slug });

      const tx = await contract.downloadApp(slug);
      console.log('⏳ Transaction sent:', tx.hash);

      const receipt = await tx.wait();
      console.log('✅ App downloaded! Block:', receipt.blockNumber);

      return {
        success: true,
        txHash: tx.hash,
        receipt
      };
    } catch (err) {
      console.error('❌ Error downloading app:', err);
      const errorMessage = err.reason || err.message || 'Error al descargar app';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [contract]);

  // Obtener información de app
  const getApp = useCallback(async (slug) => {
    if (!contract) {
      throw new Error('Contrato no inicializado');
    }

    try {
      const app = await contract.getApp(slug);
      
      return {
        publisher: app.publisher,
        slug: app.slug,
        latestManifestCid: app.latestManifestCid,
        totalDownloads: Number(app.totalDownloads),
        exists: app.exists,
        active: app.active,
        createdAt: new Date(Number(app.createdAt) * 1000)
      };
    } catch (err) {
      console.error('❌ Error getting app:', err);
      throw err;
    }
  }, [contract]);


  // Obtener versiones de una app
  const getVersions = useCallback(async (slug) => {
    if (!contract) {
      throw new Error('Contrato no inicializado');
    }

    try {
      const count = await contract.getVersionCount(slug);
      const versions = [];

      for (let i = 0; i < Number(count); i++) {
        const version = await contract.getVersion(slug, i);
        versions.push({
          manifestCid: version.manifestCid,
          timestamp: new Date(Number(version.timestamp) * 1000),
          versionCode: Number(version.versionCode),
          deprecated: version.deprecated
        });
      }

      return versions;
    } catch (err) {
      console.error('❌ Error getting versions:', err);
      throw err;
    }
  }, [contract]);

  // Obtener total de apps
  const getTotalApps = useCallback(async () => {
    if (!contract) {
      return 0;
    }

    try {
      const total = await contract.totalApps();
      return Number(total);
    } catch (err) {
      console.error('❌ Error getting total apps:', err);
      return 0;
    }
  }, [contract]);

  // Obtener todas las apps del contrato
  // NOTA: El contrato no tiene función para listar apps, solo retorna el total
  // Por ahora retornamos array vacío y usamos enrichAppsWithContractData
  const getAllAppsFromContract = useCallback(async () => {
    if (!contract) {
      return [];
    }

    try {
      // El contrato solo tiene totalApps() pero no una forma de iterar
      // Retornamos array vacío para que se usen los mocks enriquecidos
      return [];
    } catch (err) {
      console.error('❌ Error getting apps from contract:', err);
      return [];
    }
  }, [contract]);

  // Enriquecer apps con datos del contrato si existen
  const enrichAppsWithContractData = useCallback(async (apps) => {
    if (!contract) {
      return apps;
    }

    try {
      const enrichedApps = await Promise.all(
        apps.map(async (app) => {
          try {
            // Intentar obtener datos del contrato para este slug
            const contractApp = await contract.getApp(app.slug);
            
            if (contractApp.exists) {
              // App existe en el contrato, enriquecer con datos reales
              return {
                ...app,
                publisher: contractApp.publisher,
                latestManifestCid: contractApp.latestManifestCid,
                totalDownloads: Number(contractApp.totalDownloads),
                active: contractApp.active,
                createdAt: new Date(Number(contractApp.createdAt) * 1000),
                onChain: true
              };
            }
          } catch (err) {
            // App no existe en el contrato, mantener datos mock
            console.log(`ℹ️ App ${app.slug} not on chain, using mock data`);
          }
          return { ...app, onChain: false };
        })
      );

      return enrichedApps;
    } catch (err) {
      console.error('❌ Error enriching apps:', err);
      return apps;
    }
  }, [contract]);

  return {
    // Estado
    contract,
    contractAddress,
    loading,
    error,
    isReady: !!contract,

    // Métodos de escritura
    registerApp,
    publishVersion,
    downloadApp,

    // Métodos de lectura
    getApp,
    getVersions,
    getTotalApps,
    getAllAppsFromContract,
    enrichAppsWithContractData
  };
}

export default useAppStore;
