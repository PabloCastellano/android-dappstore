/**
 * Página de detalle de una app
 * Muestra información completa, permite comprar y descargar
 */

import React, { useState, useEffect } from 'react';
import { useAppStore } from '../hooks/useAppStore';
import { downloadFromIPFS, downloadJSONFromIPFS, verifyFileIntegrity } from '../services/ipfs';

export default function AppDetail({ slug, wallet, onBack }) {
  const { getApp, purchaseApp, checkPurchase, getVersions } = useAppStore(wallet);
  
  const [app, setApp] = useState(null);
  const [manifest, setManifest] = useState(null);
  const [versions, setVersions] = useState([]);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [txHash, setTxHash] = useState(null);

  // Cargar datos de la app
  useEffect(() => {
    loadAppData();
  }, [slug, wallet?.address]);

  const loadAppData = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Obtener datos del contrato
      const appData = await getApp(slug);
      setApp(appData);

      // 2. Descargar manifest desde IPFS
      const manifestData = await downloadJSONFromIPFS(appData.latestManifestCid);
      setManifest(manifestData);

      // 3. Verificar si el usuario ya compró la app
      if (wallet?.address) {
        const purchased = await checkPurchase(slug);
        setHasPurchased(purchased);
      }

      // 4. Obtener historial de versiones
      const versionHistory = await getVersions(slug);
      setVersions(versionHistory);

      console.log('✅ App data loaded:', { appData, manifestData, purchased: hasPurchased });
    } catch (err) {
      console.error('❌ Error loading app:', err);
      setError('Error al cargar la aplicación');
    } finally {
      setLoading(false);
    }
  };

  // Comprar app
  const handlePurchase = async () => {
    if (!wallet?.isConnected) {
      setError('Conecta tu wallet para comprar');
      return;
    }

    if (!app) return;

    setPurchasing(true);
    setError(null);

    try {
      console.log('💰 Purchasing app:', slug, 'Price:', app.priceEth);

      const result = await purchaseApp(slug, app.priceEth);

      if (result.success) {
        setTxHash(result.txHash);
        setHasPurchased(true);
        console.log('✅ Purchase successful! Tx:', result.txHash);
        
        // Recargar datos
        await loadAppData();
      } else {
        setError(result.error || 'Error al comprar la app');
      }
    } catch (err) {
      console.error('❌ Error purchasing:', err);
      setError(err.message || 'Error al comprar la app');
    } finally {
      setPurchasing(false);
    }
  };

  // Descargar APK
  const handleDownload = async () => {
    if (!manifest) {
      setError('Manifest no disponible');
      return;
    }

    // Verificar si la app es gratis o si el usuario ya la compró
    const isFree = app?.priceEth === '0.0' || app?.priceWei === '0';
    if (!isFree && !hasPurchased) {
      setError('Debes comprar la app primero');
      return;
    }

    setDownloading(true);
    setDownloadProgress(0);
    setError(null);

    try {
      console.log('📥 Downloading APK from IPFS:', manifest.apk_cid);

      // 1. Descargar APK
      setDownloadProgress(20);
      const apkBlob = await downloadFromIPFS(manifest.apk_cid);
      
      setDownloadProgress(60);
      console.log('✅ APK downloaded, size:', apkBlob.size);

      // 2. Verificar integridad
      console.log('🔍 Verifying integrity...');
      const isValid = await verifyFileIntegrity(apkBlob, manifest.apk_sha256);
      
      setDownloadProgress(80);

      if (!isValid) {
        throw new Error('⚠️ Verificación de integridad falló. El archivo puede estar corrupto.');
      }

      console.log('✅ Integrity verified!');

      // 3. Descargar archivo
      setDownloadProgress(100);
      const url = URL.createObjectURL(apkBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${manifest.slug}-v${manifest.version}.apk`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log('✅ Download complete!');
    } catch (err) {
      console.error('❌ Error downloading:', err);
      setError(err.message || 'Error al descargar el APK');
    } finally {
      setDownloading(false);
      setDownloadProgress(0);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando aplicación...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (!app || !manifest) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-red-900 mb-2">App no encontrada</h2>
            <p className="text-red-700 mb-4">{error || 'No se pudo cargar la aplicación'}</p>
            <button
              onClick={onBack}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isFree = app.priceEth === '0.0' || app.priceWei === '0';
  const canDownload = isFree || hasPurchased;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
        >
          <span>←</span> Volver
        </button>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
            <div className="flex items-start gap-6">
              {/* Icon */}
              <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center text-4xl flex-shrink-0">
                {manifest.icon_cid ? (
                  <img
                    src={`https://gateway.pinata.cloud/ipfs/${manifest.icon_cid}`}
                    alt={manifest.name}
                    className="w-full h-full object-cover rounded-2xl"
                  />
                ) : (
                  '📱'
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{manifest.name}</h1>
                <p className="text-blue-100 mb-3">{manifest.description}</p>
                
                <div className="flex items-center gap-4 text-sm">
                  <span className="bg-white/20 px-3 py-1 rounded-full">
                    v{manifest.version}
                  </span>
                  <span>📦 {manifest.package}</span>
                  <span>⬇️ {app.totalDownloads} descargas</span>
                </div>
              </div>

              {/* Price */}
              <div className="text-right">
                <div className="text-3xl font-bold">
                  {isFree ? 'GRATIS' : `${app.priceEth} ETH`}
                </div>
                {hasPurchased && (
                  <div className="mt-2 bg-green-500 text-white px-3 py-1 rounded-full text-sm">
                    ✓ Comprada
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-6 border-b">
            <div className="flex gap-4">
              {canDownload ? (
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="flex-1 bg-green-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                >
                  {downloading ? (
                    <span>📥 Descargando... {downloadProgress}%</span>
                  ) : (
                    <span>📥 Descargar APK</span>
                  )}
                </button>
              ) : (
                <button
                  onClick={handlePurchase}
                  disabled={purchasing || !wallet?.isConnected}
                  className="flex-1 bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                >
                  {purchasing ? (
                    <span>⏳ Comprando...</span>
                  ) : (
                    <span>💰 Comprar por {app.priceEth} ETH</span>
                  )}
                </button>
              )}
            </div>

            {!wallet?.isConnected && !isFree && (
              <p className="text-sm text-red-600 mt-2 text-center">
                ⚠️ Conecta tu wallet para comprar
              </p>
            )}

            {downloading && (
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${downloadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">⚠️ {error}</p>
            </div>
          )}

          {/* Success Message */}
          {txHash && (
            <div className="mx-6 mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800 mb-2">
                ✅ ¡Compra exitosa! Ahora puedes descargar la app.
              </p>
              <p className="text-xs font-mono text-green-700 break-all">
                Tx: {txHash}
              </p>
            </div>
          )}

          {/* Details */}
          <div className="p-6 grid grid-cols-2 gap-6">
            {/* Left Column */}
            <div>
              <h3 className="text-lg font-bold mb-4">Información</h3>
              
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-600">Publisher:</span>
                  <p className="font-medium">{manifest.publisher_name || 'Anónimo'}</p>
                  <p className="text-xs font-mono text-gray-500">{app.publisher}</p>
                </div>

                <div>
                  <span className="text-gray-600">Versión:</span>
                  <p className="font-medium">{manifest.version} (código {manifest.versionCode})</p>
                </div>

                <div>
                  <span className="text-gray-600">Tamaño:</span>
                  <p className="font-medium">{(manifest.apk_size / 1024 / 1024).toFixed(2)} MB</p>
                </div>

                <div>
                  <span className="text-gray-600">SDK:</span>
                  <p className="font-medium">Min: {manifest.min_sdk} | Target: {manifest.target_sdk}</p>
                </div>

                <div>
                  <span className="text-gray-600">Licencia:</span>
                  <p className="font-medium">{manifest.license || 'No especificada'}</p>
                </div>

                {manifest.website && (
                  <div>
                    <span className="text-gray-600">Website:</span>
                    <a
                      href={manifest.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline block"
                    >
                      {manifest.website}
                    </a>
                  </div>
                )}

                {manifest.source_code && (
                  <div>
                    <span className="text-gray-600">Código fuente:</span>
                    <a
                      href={manifest.source_code}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline block"
                    >
                      {manifest.source_code}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column */}
            <div>
              <h3 className="text-lg font-bold mb-4">Permisos</h3>
              
              {manifest.permissions && manifest.permissions.length > 0 ? (
                <div className="space-y-2">
                  {manifest.permissions.map((permission, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-sm bg-gray-50 px-3 py-2 rounded"
                    >
                      <span className="text-yellow-600">⚠️</span>
                      <span>{permission}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No requiere permisos especiales</p>
              )}

              {/* Categories */}
              {manifest.categories && manifest.categories.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-bold mb-3">Categorías</h3>
                  <div className="flex flex-wrap gap-2">
                    {manifest.categories.map((category, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Version History */}
          {versions.length > 0 && (
            <div className="p-6 border-t">
              <h3 className="text-lg font-bold mb-4">Historial de Versiones</h3>
              <div className="space-y-3">
                {versions.map((version, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg"
                  >
                    <div>
                      <span className="font-medium">Versión {version.versionCode}</span>
                      {version.deprecated && (
                        <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                          Obsoleta
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      {version.timestamp.toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Blockchain Info */}
          <div className="p-6 bg-gray-50 border-t">
            <h3 className="text-lg font-bold mb-3">Información Blockchain</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Total descargas:</span>
                <p className="font-medium">{app.totalDownloads}</p>
              </div>
              <div>
                <span className="text-gray-600">Revenue total:</span>
                <p className="font-medium">{app.totalRevenue} ETH</p>
              </div>
              <div>
                <span className="text-gray-600">Registrada:</span>
                <p className="font-medium">{app.createdAt.toLocaleDateString()}</p>
              </div>
              <div>
                <span className="text-gray-600">Estado:</span>
                <p className="font-medium">{app.active ? '✅ Activa' : '❌ Inactiva'}</p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t">
              <span className="text-gray-600 text-sm">Manifest CID:</span>
              <p className="font-mono text-xs text-gray-700 break-all mt-1">
                {app.latestManifestCid}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
