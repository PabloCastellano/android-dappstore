import React, { useState } from 'react'
import Home from './pages/Home'
import Publish from './pages/Publish'
import { useWallet } from './hooks/useWallet'

export default function App() {
  const [currentPage, setCurrentPage] = useState('home') // 'home' | 'publish'
  const wallet = useWallet()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 
              className="text-3xl font-semibold cursor-pointer hover:text-blue-600 transition"
              onClick={() => setCurrentPage('home')}
            >
              📱 DApp Store
            </h1>
            
            <nav className="flex gap-4 items-center">
              <button
                onClick={() => setCurrentPage('home')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  currentPage === 'home' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                🏠 Home
              </button>
              
              <button
                onClick={() => setCurrentPage('publish')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  currentPage === 'publish' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                📤 Publicar
              </button>
              
              {/* Wallet Connection */}
              {wallet.isConnected ? (
                <div className="flex items-center gap-3">
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">
                      {wallet.formatAddress(wallet.address)}
                    </div>
                    <div className="text-gray-500 text-xs">
                      {wallet.balance.slice(0, 6)} ETH
                    </div>
                  </div>
                  <button
                    onClick={wallet.disconnect}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium transition text-sm"
                  >
                    Desconectar
                  </button>
                </div>
              ) : (
                <button
                  onClick={wallet.connect}
                  disabled={wallet.isConnecting}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {wallet.isConnecting ? '🔄 Conectando...' : '🔗 Connect Wallet'}
                </button>
              )}
            </nav>
          </div>
          
          {/* Error Message */}
          {wallet.error && (
            <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">⚠️ {wallet.error}</p>
            </div>
          )}
          
          {/* Network Info */}
          {wallet.isConnected && (
            <div className="mt-3 flex items-center gap-2 text-sm">
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded font-medium">
                {wallet.getNetworkName(wallet.chainId)}
              </span>
              {wallet.chainId !== 31337 && wallet.chainId !== 11155111 && (
                <span className="text-yellow-600 text-xs">
                  ⚠️ Considera usar Sepolia o Hardhat local
                </span>
              )}
            </div>
          )}
        </div>
      </header>

      <main>
        {currentPage === 'home' && <Home wallet={wallet} />}
        {currentPage === 'publish' && <Publish wallet={wallet} />}
      </main>
    </div>
  )
}
