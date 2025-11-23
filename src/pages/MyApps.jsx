/**
 * Página de apps publicadas por el usuario
 * Muestra las apps que el usuario ha registrado on-chain
 */

import React, { useState } from 'react';
import { usePublisherApps } from '../hooks/useSubgraph';
import AppIcon from '../components/AppIcon';

export default function MyApps({ wallet, onAppClick }) {
  const [downloading, setDownloading] = useState(null);
  
  // Obtener apps del publisher desde el subgraph
  const { 
    publisher, 
    apps: publishedApps, 
    loading, 
    error 
  } = usePublisherApps(wallet?.address);

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
              Conecta tu wallet para ver las apps que has publicado
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
            <p className="text-gray-600">Cargando tus apps desde blockchain...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-red-900 mb-2">
              Error al cargar apps
            </h2>
            <p className="text-red-700 mb-4">
              {error}
            </p>
            <p className="text-sm text-red-600">
              Asegúrate de que el subgraph esté corriendo y desplegado.
            </p>
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Mis Apps Publicadas</h1>
          <p className="text-gray-600">
            Apps que has registrado en blockchain como publisher
          </p>
          {publisher && (
            <div className="mt-3 inline-block bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
              <span className="text-xs text-blue-600 font-medium">Publisher:</span>
              <span className="ml-2 text-xs font-mono text-blue-800">{wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="text-3xl mb-2">📱</div>
            <div className="text-3xl font-bold text-gray-900">{publishedApps?.length || 0}</div>
            <div className="text-sm text-gray-600">Apps publicadas</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="text-3xl mb-2">📥</div>
            <div className="text-3xl font-bold text-gray-900">
              {publishedApps?.reduce((sum, app) => sum + Number(app.totalDownloads || 0), 0) || 0}
            </div>
            <div className="text-sm text-gray-600">Descargas totales</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="text-3xl mb-2">⛓️</div>
            <div className="text-3xl font-bold text-gray-900">
              On-Chain
            </div>
            <div className="text-sm text-gray-600">Estado</div>
          </div>
        </div>

        {/* Apps List */}
        {publishedApps && publishedApps.length > 0 ? (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6 border-b bg-gray-50">
              <h2 className="text-xl font-bold">Tus Aplicaciones</h2>
            </div>

            <div className="divide-y">
              {publishedApps.map((app) => (
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
                        <span>📥 {app.totalDownloads} descargas</span>
                        <span>📅 {new Date(Number(app.createdAt) * 1000).toLocaleDateString()}</span>
                        <span className="inline-flex items-center px-2 py-1 rounded bg-green-100 text-green-800 text-xs font-medium">
                          ⛓️ On-Chain
                        </span>
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
            <div className="text-6xl mb-4">📱</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No has publicado ninguna app aún
            </h2>
            <p className="text-gray-600 mb-6">
              Publica tu primera app en blockchain y compártela con el mundo
            </p>
            <button
              onClick={() => window.location.href = '/publish'}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
            >
              Publicar App
            </button>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <h3 className="font-bold text-blue-900 mb-2">💡 Como Publisher</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Tus apps están registradas permanentemente en blockchain</li>
            <li>• Puedes publicar nuevas versiones en cualquier momento</li>
            <li>• Las estadísticas de descarga son transparentes y verificables</li>
            <li>• Los usuarios pueden verificar la autenticidad de tus apps</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
