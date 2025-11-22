/**
 * Página de apps compradas por el usuario
 * Muestra historial de compras y permite re-descargar
 */

import React, { useState, useEffect } from 'react';
import { useAppStore } from '../hooks/useAppStore';
import { downloadFromIPFS, downloadJSONFromIPFS } from '../services/ipfs';
import AppIcon from '../components/AppIcon';

export default function MyApps({ wallet, onAppClick }) {
  const { checkPurchase } = useAppStore(wallet);
  const [purchasedApps, setPurchasedApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);

  // Mock de apps para demo - en producción vendría del subgraph
  const MOCK_APPS = [
    { slug: 'chatty', name: 'Chatty', price: '0.1 ETH', icon: '💬', purchaseDate: '2024-01-15' },
    { slug: 'nftgallery', name: 'NFT Gallery', price: '0.05 ETH', icon: '🖼️', purchaseDate: '2024-01-10' },
    { slug: 'defi-tracker', name: 'DeFi Tracker', price: '0.02 ETH', icon: '📊', purchaseDate: '2024-01-05' }
  ];

  useEffect(() => {
    loadPurchasedApps();
  }, [wallet?.address]);

  const loadPurchasedApps = async () => {
    if (!wallet?.isConnected) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // En producción, esto vendría del subgraph o eventos del contrato
      // Por ahora usamos mock data
      setPurchasedApps(MOCK_APPS);
    } catch (err) {
      console.error('Error loading purchased apps:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (slug) => {
    setDownloading(slug);
    try {
      // Simular descarga
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Downloaded:', slug);
      alert(`Descargando ${slug}...`);
    } catch (err) {
      console.error('Error downloading:', err);
      alert('Error al descargar');
    } finally {
      setDownloading(null);
    }
  };

  if (!wallet?.isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-8 text-center">
            <div className="text-6xl mb-4">🔐</div>
            <h2 className="text-2xl font-bold text-yellow-900 mb-2">
              Conecta tu Wallet
            </h2>
            <p className="text-yellow-700">
              Conecta tu wallet para ver tus apps compradas
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando tus apps...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Mis Apps</h1>
          <p className="text-gray-600">
            Apps que has comprado y puedes descargar en cualquier momento
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="text-3xl mb-2">📱</div>
            <div className="text-3xl font-bold text-gray-900">{purchasedApps.length}</div>
            <div className="text-sm text-gray-600">Apps compradas</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="text-3xl mb-2">💰</div>
            <div className="text-3xl font-bold text-gray-900">
              {purchasedApps.reduce((sum, app) => sum + parseFloat(app.price), 0).toFixed(2)}
            </div>
            <div className="text-sm text-gray-600">ETH gastados</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="text-3xl mb-2">📅</div>
            <div className="text-3xl font-bold text-gray-900">
              {purchasedApps.length > 0 ? purchasedApps[0].purchaseDate : '-'}
            </div>
            <div className="text-sm text-gray-600">Última compra</div>
          </div>
        </div>

        {/* Apps List */}
        {purchasedApps.length > 0 ? (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6 border-b bg-gray-50">
              <h2 className="text-xl font-bold">Tus Aplicaciones</h2>
            </div>

            <div className="divide-y">
              {purchasedApps.map((app) => (
                <div key={app.slug} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex items-center gap-6">
                    {/* Icon */}
                    <AppIcon
                      src={null}
                      alt={app.name}
                      slug={app.slug}
                      size="lg"
                      className="flex-shrink-0"
                    />

                    {/* Info */}
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">
                        {app.name}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>💰 {app.price}</span>
                        <span>📅 Comprada: {app.purchaseDate}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => onAppClick && onAppClick(app.slug)}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
                      >
                        Ver Detalles
                      </button>

                      <button
                        onClick={() => handleDownload(app.slug)}
                        disabled={downloading === app.slug}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                      >
                        {downloading === app.slug ? (
                          <span>⏳ Descargando...</span>
                        ) : (
                          <span>📥 Descargar</span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No has comprado ninguna app aún
            </h2>
            <p className="text-gray-600 mb-6">
              Explora el store y encuentra apps increíbles
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
            >
              Explorar Apps
            </button>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <h3 className="font-bold text-blue-900 mb-2">💡 ¿Sabías que...?</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Puedes re-descargar tus apps en cualquier momento</li>
            <li>• Tus compras están registradas en blockchain</li>
            <li>• No necesitas pagar de nuevo para descargar</li>
            <li>• Todas las descargas incluyen verificación de integridad</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
