/**
 * Página de detalle de una app
 * Muestra información completa, permite descargar
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../hooks/useSubgraph';
import { useAppStore } from '../hooks/useAppStore';
import { downloadFromIPFS, downloadJSONFromIPFS, verifyFileIntegrity } from '../services/ipfs';

export default function AppDetail({ slug, wallet, onBack }) {
  // Hook del subgraph para obtener datos de la app
  const { app: subgraphApp, loading: subgraphLoading, error: subgraphError } = useApp(slug);
  
  // Hook del contrato para interacciones (descargas, etc)
  const { downloadApp } = useAppStore(wallet);
  
  const [manifest, setManifest] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [txHash, setTxHash] = useState(null);

  // Cargar manifest cuando la app esté disponible
  useEffect(() => {
    if (subgraphApp && subgraphApp.latestManifestCid) {
      loadManifest();
    }
  }, [subgraphApp]);

  const loadManifest = async () => {
    try {
      console.log('📥 Descargando manifest desde IPFS:', subgraphApp.latestManifestCid);
      const manifestData = await downloadJSONFromIPFS(subgraphApp.latestManifestCid);
      setManifest(manifestData);
      console.log('✅ Manifest cargado:', manifestData);
    } catch (err) {
      console.error('❌ Error descargando manifest:', err);
      // No es crítico, podemos mostrar la app sin el manifest completo
    }
  };

  // Descargar app (registra en el contrato)
  const handleDownloadApp = async () => {
    if (!wallet?.isConnected) {
      setError('Conecta tu wallet para descargar');
      return;
    }

    try {
      setError(null);
      console.log('📥 Registrando descarga en blockchain...');
      
      const result = await downloadApp(slug);
      
      if (result.success) {
        setTxHash(result.txHash);
        console.log('✅ Descarga registrada! Tx:', result.txHash);
        
        // Ahora descargar el APK
        await handleDownloadAPK();
      } else {
        setError(result.error || 'Error al registrar la descarga');
      }
    } catch (err) {
      console.error('❌ Error registrando descarga:', err);
      setError(err.message || 'Error al registrar la descarga');
    }
  };

  // Descargar APK desde IPFS
  const handleDownloadAPK = async () => {
    if (!manifest) {
      setError('Manifest no disponible');
      return;
    }

    setDownloading(true);
    setDownloadProgress(0);
    setError(null);

    try {
      console.log('📥 Descargando APK desde IPFS:', manifest.apk_cid);

      // 1. Descargar APK
      setDownloadProgress(20);
      const apkBlob = await downloadFromIPFS(manifest.apk_cid);
      
      setDownloadProgress(60);
      console.log('✅ APK descargado, tamaño:', apkBlob.size);

      // 2. Verificar integridad
      if (manifest.apk_sha256) {
        console.log('🔍 Verificando integridad...');
        const isValid = await verifyFileIntegrity(apkBlob, manifest.apk_sha256);
        
        setDownloadProgress(80);

        if (!isValid) {
          throw new Error('⚠️ Verificación de integridad falló. El archivo puede estar corrupto.');
        }

        console.log('✅ Integridad verificada!');
      }

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
  if (subgraphLoading) {
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
  if (subgraphError || !subgraphApp) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-red-900 mb-2">App no encontrada</h2>
            <p className="text-red-700 mb-4">{subgraphError || error || 'No se pudo cargar la aplicación'}</p>
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

  // En el contrato simplificado, todas las apps son gratuitas
  const canDownload = true;

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
                {manifest?.icon_cid ? (
                  <img
                    src={`https://gateway.pinata.cloud/ipfs/${manifest.icon_cid}`}
                    alt={manifest?.name || subgraphApp.name}
                    className="w-full h-full object-cover rounded-2xl"
                  />
                ) : (
                  '📱'
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{manifest?.name || subgraphApp.name}</h1>
                <p className="text-blue-100 mb-3">{manifest?.description || 'App descentralizada'}</p>
                
                <div className="flex items-center gap-4 text-sm">
                  <span className="bg-white/20 px-3 py-1 rounded-full">
                    {manifest ? `v${manifest.version}` : 'v1.0'}
                  </span>
                  {manifest?.package && <span>📦 {manifest.package}</span>}
                  <span>⬇️ {subgraphApp.totalDownloads} descargas</span>
                </div>
              </div>

              {/* Badge On-Chain */}
              <div className="text-right">
                <div className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                  ⛓️ On-Chain
                </div>
                <div className="mt-2 text-blue-100 text-sm">
                  GRATIS
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-6 border-b">
            <div className="flex gap-4">
              <button
                onClick={handleDownloadApp}
                disabled={downloading || !wallet?.isConnected}
                className="flex-1 bg-green-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
              >
                {downloading ? (
                  <span>📥 Descargando... {downloadProgress}%</span>
                ) : (
                  <span>📥 Descargar APK</span>
                )}
              </button>
            </div>

            {!wallet?.isConnected && (
              <p className="text-sm text-yellow-600 mt-2 text-center">
                ⚠️ Conecta tu wallet para registrar la descarga en blockchain
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
                ✅ ¡Descarga registrada en blockchain!
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
                  <p className="font-medium">{manifest?.publisher_name || 'Anónimo'}</p>
                  <p className="text-xs font-mono text-gray-500">{subgraphApp.publisher?.address || subgraphApp.publisher?.id}</p>
                </div>

                {manifest && (
                  <>
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
                  </>
                )}

                {manifest?.website && (
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

                {manifest?.source_code && (
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
              
              {manifest?.permissions && manifest.permissions.length > 0 ? (
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
              {manifest?.categories && manifest.categories.length > 0 && (
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
          {subgraphApp.versions && subgraphApp.versions.length > 0 && (
            <div className="p-6 border-t">
              <h3 className="text-lg font-bold mb-4">Historial de Versiones</h3>
              <div className="space-y-3">
                {subgraphApp.versions.map((version, index) => (
                  <div
                    key={version.id || index}
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
                      {new Date(Number(version.publishedAt) * 1000).toLocaleDateString()}
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
                <p className="font-medium">{subgraphApp.totalDownloads}</p>
              </div>
              <div>
                <span className="text-gray-600">Slug:</span>
                <p className="font-medium">{subgraphApp.slug}</p>
              </div>
              <div>
                <span className="text-gray-600">Registrada:</span>
                <p className="font-medium">{new Date(Number(subgraphApp.createdAt) * 1000).toLocaleDateString()}</p>
              </div>
              <div>
                <span className="text-gray-600">Estado:</span>
                <p className="font-medium">{subgraphApp.active ? '✅ Activa' : '❌ Inactiva'}</p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t">
              <span className="text-gray-600 text-sm">Manifest CID:</span>
              <p className="font-mono text-xs text-gray-700 break-all mt-1">
                {subgraphApp.latestManifestCid}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
