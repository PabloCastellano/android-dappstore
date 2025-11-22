/**
 * Hook para interactuar con el contrato AppStore
 * Versión funcional - reemplaza useAppStore.example.js
 */

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

// ABI del contrato AppStore (solo las funciones que usamos)
const APP_STORE_ABI = [
  "function registerApp(string calldata slug, string calldata manifestCid, uint256 priceWei, uint256 versionCode) external",
  "function publishVersion(string calldata slug, string calldata manifestCid, uint256 versionCode) external",
  "function purchaseApp(string calldata slug) external payable",
  "function updatePrice(string calldata slug, uint256 newPriceWei) external",
  "function getApp(string calldata slug) external view returns (tuple(address publisher, string slug, string latestManifestCid, uint256 priceWei, uint256 totalDownloads, uint256 totalRevenue, bool exists, bool active, uint256 createdAt))",
  "function getLatestManifest(string calldata slug) external view returns (string memory)",
  "function getVersionCount(string calldata slug) external view returns (uint256)",
  "function getVersion(string calldata slug, uint256 index) external view returns (tuple(string manifestCid, uint256 timestamp, uint256 versionCode, bool deprecated))",
  "function hasUserPurchased(address user, string calldata slug) external view returns (bool)",
  "function totalApps() external view returns (uint256)",
  "function platformFee() external view returns (uint256)",
  "event AppRegistered(bytes32 indexed appKey, string slug, address indexed publisher, string manifestCid, uint256 priceWei)",
  "event AppPurchased(bytes32 indexed appKey, address indexed buyer, uint256 amountPaid, uint256 platformFee)",
  "event VersionPublished(bytes32 indexed appKey, string manifestCid, uint256 versionCode)"
];

export function useAppStore(wallet) {
  const [contract, setContract] = useState(null);
  const [contractAddress, setContractAddress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cargar dirección del contrato desde config
  useEffect(() => {
    const loadContractAddress = async () => {
      try {
        // Intentar cargar desde archivo de configuración
        const response = await fetch('/src/config/contracts.json');
        if (response.ok) {
          const config = await response.json();
          const address = config.contracts?.AppStore?.address;
          if (address) {
            setContractAddress(address);
            console.log('✅ Contract address loaded:', address);
          }
        }
      } catch (err) {
        console.warn('⚠️ Could not load contract config:', err.message);
        // Usar dirección por defecto para desarrollo local
        setContractAddress('0x5FbDB2315678afecb367f032d93F642f64180aa3');
      }
    };

    loadContractAddress();
  }, []);

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
  const registerApp = useCallback(async ({ slug, manifestCid, priceEth, versionCode }) => {
    if (!contract) {
      return { success: false, error: 'Contrato no inicializado' };
    }

    setLoading(true);
    setError(null);

    try {
      const priceWei = ethers.parseEther(priceEth.toString());
      
      console.log('📝 Registering app:', { slug, manifestCid, priceWei: priceWei.toString(), versionCode });

      const tx = await contract.registerApp(slug, manifestCid, priceWei, versionCode);
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

  // Comprar app
  const purchaseApp = useCallback(async (slug, priceEth) => {
    if (!contract) {
      return { success: false, error: 'Contrato no inicializado' };
    }

    setLoading(true);
    setError(null);

    try {
      const priceWei = ethers.parseEther(priceEth.toString());
      
      console.log('💰 Purchasing app:', { slug, price: priceEth });

      const tx = await contract.purchaseApp(slug, { value: priceWei });
      console.log('⏳ Transaction sent:', tx.hash);

      const receipt = await tx.wait();
      console.log('✅ App purchased! Block:', receipt.blockNumber);

      return {
        success: true,
        txHash: tx.hash,
        receipt
      };
    } catch (err) {
      console.error('❌ Error purchasing app:', err);
      const errorMessage = err.reason || err.message || 'Error al comprar app';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [contract]);

  // Actualizar precio
  const updatePrice = useCallback(async (slug, newPriceEth) => {
    if (!contract) {
      return { success: false, error: 'Contrato no inicializado' };
    }

    setLoading(true);
    setError(null);

    try {
      const priceWei = ethers.parseEther(newPriceEth.toString());
      
      console.log('💵 Updating price:', { slug, newPrice: newPriceEth });

      const tx = await contract.updatePrice(slug, priceWei);
      console.log('⏳ Transaction sent:', tx.hash);

      const receipt = await tx.wait();
      console.log('✅ Price updated! Block:', receipt.blockNumber);

      return {
        success: true,
        txHash: tx.hash,
        receipt
      };
    } catch (err) {
      console.error('❌ Error updating price:', err);
      const errorMessage = err.reason || err.message || 'Error al actualizar precio';
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
        priceWei: app.priceWei.toString(),
        priceEth: ethers.formatEther(app.priceWei),
        totalDownloads: Number(app.totalDownloads),
        totalRevenue: ethers.formatEther(app.totalRevenue),
        exists: app.exists,
        active: app.active,
        createdAt: new Date(Number(app.createdAt) * 1000)
      };
    } catch (err) {
      console.error('❌ Error getting app:', err);
      throw err;
    }
  }, [contract]);

  // Verificar si usuario compró app
  const checkPurchase = useCallback(async (slug) => {
    if (!contract || !wallet?.address) {
      return false;
    }

    try {
      const hasPurchased = await contract.hasUserPurchased(wallet.address, slug);
      return hasPurchased;
    } catch (err) {
      console.error('❌ Error checking purchase:', err);
      return false;
    }
  }, [contract, wallet?.address]);

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

  // Obtener platform fee
  const getPlatformFee = useCallback(async () => {
    if (!contract) {
      return 0;
    }

    try {
      const fee = await contract.platformFee();
      return Number(fee) / 100; // Convertir basis points a porcentaje
    } catch (err) {
      console.error('❌ Error getting platform fee:', err);
      return 0;
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
    purchaseApp,
    updatePrice,

    // Métodos de lectura
    getApp,
    checkPurchase,
    getVersions,
    getTotalApps,
    getPlatformFee
  };
}

export default useAppStore;
