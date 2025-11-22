/**
 * Hook para gestión de wallet (MetaMask/WalletConnect)
 * Versión funcional - reemplaza useWallet.example.js
 */

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

export function useWallet() {
  const [address, setAddress] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [balance, setBalance] = useState('0');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [error, setError] = useState(null);

  // Detectar si MetaMask está instalado
  const isMetaMaskInstalled = useCallback(() => {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
  }, []);

  // Obtener balance
  const fetchBalance = useCallback(async (address, provider) => {
    try {
      const balance = await provider.getBalance(address);
      setBalance(ethers.formatEther(balance));
    } catch (err) {
      console.error('Error fetching balance:', err);
    }
  }, []);

  // Conectar wallet
  const connect = useCallback(async () => {
    if (!isMetaMaskInstalled()) {
      setError('MetaMask no está instalado. Por favor instálalo desde https://metamask.io');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Solicitar acceso a la cuenta
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length === 0) {
        throw new Error('No se seleccionó ninguna cuenta');
      }

      // Crear provider y signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const network = await provider.getNetwork();
      const address = accounts[0];

      setProvider(provider);
      setSigner(signer);
      setAddress(address);
      setChainId(Number(network.chainId));
      setIsConnected(true);

      // Obtener balance
      await fetchBalance(address, provider);

      console.log('✅ Wallet connected:', address);
      console.log('📡 Network:', network.name, '(chainId:', Number(network.chainId), ')');

    } catch (err) {
      console.error('❌ Error connecting wallet:', err);
      setError(err.message || 'Error al conectar wallet');
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
  }, [isMetaMaskInstalled, fetchBalance]);

  // Desconectar wallet
  const disconnect = useCallback(() => {
    setAddress(null);
    setChainId(null);
    setBalance('0');
    setIsConnected(false);
    setProvider(null);
    setSigner(null);
    setError(null);
    console.log('👋 Wallet disconnected');
  }, []);

  // Cambiar de red
  const switchNetwork = useCallback(async (targetChainId) => {
    if (!isMetaMaskInstalled()) {
      setError('MetaMask no está instalado');
      return;
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }]
      });
    } catch (err) {
      // Si la red no está agregada, intentar agregarla
      if (err.code === 4902) {
        console.log('Network not added, attempting to add...');
        // Aquí podrías agregar lógica para agregar la red
      }
      console.error('Error switching network:', err);
      setError(err.message || 'Error al cambiar de red');
    }
  }, [isMetaMaskInstalled]);

  // Agregar red personalizada
  const addNetwork = useCallback(async (networkConfig) => {
    if (!isMetaMaskInstalled()) {
      setError('MetaMask no está instalado');
      return;
    }

    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [networkConfig]
      });
    } catch (err) {
      console.error('Error adding network:', err);
      setError(err.message || 'Error al agregar red');
    }
  }, [isMetaMaskInstalled]);

  // Formatear address (0x1234...5678)
  const formatAddress = useCallback((addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }, []);

  // Escuchar cambios de cuenta
  useEffect(() => {
    if (!isMetaMaskInstalled()) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnect();
      } else if (accounts[0] !== address) {
        setAddress(accounts[0]);
        if (provider) {
          fetchBalance(accounts[0], provider);
        }
        console.log('🔄 Account changed:', accounts[0]);
      }
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
    };
  }, [isMetaMaskInstalled, address, provider, disconnect, fetchBalance]);

  // Escuchar cambios de red
  useEffect(() => {
    if (!isMetaMaskInstalled()) return;

    const handleChainChanged = (chainIdHex) => {
      const newChainId = parseInt(chainIdHex, 16);
      setChainId(newChainId);
      console.log('🔄 Network changed:', newChainId);
      // Recargar la página es la forma recomendada por MetaMask
      window.location.reload();
    };

    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [isMetaMaskInstalled]);

  // Auto-conectar si ya estaba conectado
  useEffect(() => {
    const autoConnect = async () => {
      if (!isMetaMaskInstalled()) return;

      try {
        const accounts = await window.ethereum.request({
          method: 'eth_accounts'
        });

        if (accounts.length > 0) {
          // Ya hay una cuenta conectada, reconectar
          await connect();
        }
      } catch (err) {
        console.error('Error auto-connecting:', err);
      }
    };

    autoConnect();
  }, [isMetaMaskInstalled, connect]);

  // Obtener nombre de la red
  const getNetworkName = useCallback((chainId) => {
    const networks = {
      1: 'Ethereum Mainnet',
      5: 'Goerli Testnet',
      11155111: 'Sepolia Testnet',
      137: 'Polygon Mainnet',
      80001: 'Mumbai Testnet',
      42161: 'Arbitrum One',
      10: 'Optimism',
      8453: 'Base',
      31337: 'Hardhat Local'
    };
    return networks[chainId] || `Chain ID ${chainId}`;
  }, []);

  return {
    // Estado
    address,
    chainId,
    balance,
    isConnected,
    isConnecting,
    provider,
    signer,
    error,
    
    // Métodos
    connect,
    disconnect,
    switchNetwork,
    addNetwork,
    formatAddress,
    getNetworkName,
    isMetaMaskInstalled: isMetaMaskInstalled()
  };
}

export default useWallet;
