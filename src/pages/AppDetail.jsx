/**
 * App detail page
 * Shows complete information, allows downloading
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../hooks/useSubgraph';
import { useAppStore } from '../hooks/useAppStore';
import { useSynapse } from '../hooks/useSynapse';

export default function AppDetail({ slug, wallet, onBack }) {
  // Subgraph hook to get app data
  const { app: subgraphApp, loading: subgraphLoading, error: subgraphError } = useApp(slug);
  
  // Contract hook for interactions (downloads, etc)
  const { downloadApp } = useAppStore(wallet);
  
  // Synapse hook for Filecoin storage
  const { downloadFile, downloadJSON, verifyIntegrity } = useSynapse();
  
  const [manifest, setManifest] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [txHash, setTxHash] = useState(null);

  // Load manifest when app is available
  useEffect(() => {
    if (subgraphApp && subgraphApp.latestManifestCid) {
      loadManifest();
    }
  }, [subgraphApp]);

  const loadManifest = async () => {
    try {
      console.log('📦 Loading manifest from Filecoin:', subgraphApp.latestManifestCid);
      const manifestData = await downloadJSON(subgraphApp.latestManifestCid);
      console.log('✅ Manifest loaded:', manifestData);
      setManifest(manifestData);
    } catch (err) {
      console.error('❌ Error loading manifest:', err);
      // Not critical, we continue with subgraph data
    }
  };

  // Download app (register on contract)
  const handleDownloadApp = async () => {
    if (!wallet?.isConnected) {
      setError('Connect your wallet to download');
      return;
    }

    try {
      setError(null);
      console.log('📥 Registering download on blockchain...');
      
      const result = await downloadApp(slug);
      
      if (result.success) {
        setTxHash(result.txHash);
        console.log('✅ Download registered! Tx:', result.txHash);
        
        // Now download the APK
        await handleDownloadAPK();
      } else {
        setError(result.error || 'Error registering download');
      }
    } catch (err) {
      console.error('❌ Error registering download:', err);
      setError(err.message || 'Error registering download');
    }
  };

  // Download APK from Filecoin
  const handleDownloadAPK = async () => {
    if (!manifest) {
      setError('Manifest not loaded');
      return;
    }

    setDownloading(true);
    setDownloadProgress(0);
    setError(null);

    try {
      console.log('📥 Downloading APK from Filecoin:', manifest.apk_cid);

      // 1. Download APK
      setDownloadProgress(20);
      const apkData = await downloadFile(manifest.apk_cid);
      const apkBlob = new Blob([apkData], { type: 'application/vnd.android.package-archive' });
      
      setDownloadProgress(60);
      console.log('✅ APK downloaded, size:', apkBlob.size);

      // 2. Verify integrity
      if (manifest.apk_sha256) {
        console.log('🔍 Verifying integrity...');
        const isValid = await verifyIntegrity(apkBlob, manifest.apk_sha256);
        
        setDownloadProgress(80);

        if (!isValid) {
          throw new Error('Invalid APK integrity');
        }
      }

      // 3. Download file
      setDownloadProgress(90);
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
      setError(err.message || 'Error downloading APK');
    } finally {
      setDownloading(false);
      setDownloadProgress(0);
    }
  };

  // Loading state
  if (subgraphLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading app...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (subgraphError || !subgraphApp) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">App not found</h2>
          <p className="text-gray-600 mb-6">{subgraphError || 'This app does not exist'}</p>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to home
          </button>
        </div>
      </div>
    );
  }

  // In the simplified contract, all apps are free
  const canDownload = true;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
        >
          <span>←</span> Back
        </button>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
            <div className="flex items-start gap-6">
              {/* Icon */}
              <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center text-4xl flex-shrink-0">
                {'📱'}
              </div>

              {/* Info */}
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{manifest?.name || subgraphApp.name}</h1>
                <p className="text-blue-100 mb-3">{manifest?.description || 'Decentralized app'}</p>
                
                <div className="flex items-center gap-4 text-sm">
                  <span className="bg-white/20 px-3 py-1 rounded-full">
                    {manifest ? `v${manifest.version}` : 'v1.0'}
                  </span>
                  {manifest?.package && <span>📦 {manifest.package}</span>}
                  <span>⬇️ {subgraphApp.totalDownloads} downloads</span>
                </div>
              </div>

              {/* Badge On-Chain */}
              <div className="text-right">
                <div className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                  ⛓️ On-Chain
                </div>
                <div className="mt-2 text-blue-100 text-sm">
                  FREE
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
                  <span>📥 Downloading... {downloadProgress}%</span>
                ) : (
                  <span>📥 Download APK</span>
                )}
              </button>
            </div>

            {!wallet?.isConnected && (
              <p className="text-sm text-yellow-600 mt-2 text-center">
                ⚠️ Connect your wallet to register the download on blockchain
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
                ✅ Download registered on blockchain!
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
              <h3 className="text-lg font-bold mb-4">Information</h3>
              
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-600">Publisher:</span>
                  <p className="font-medium">{manifest?.publisher_name || 'Anonymous'}</p>
                  <p className="text-xs font-mono text-gray-500">{subgraphApp.publisher?.address || subgraphApp.publisher?.id}</p>
                </div>

                {manifest && (
                  <>
                    <div>
                      <span className="text-gray-600">Version:</span>
                      <p className="font-medium">{manifest.version} (code {manifest.versionCode})</p>
                    </div>

                    <div>
                      <span className="text-gray-600">Size:</span>
                      <p className="font-medium">{(manifest.apk_size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>

                    <div>
                      <span className="text-gray-600">SDK:</span>
                      <p className="font-medium">Min: {manifest.min_sdk} | Target: {manifest.target_sdk}</p>
                    </div>

                    <div>
                      <span className="text-gray-600">License:</span>
                      <p className="font-medium">{manifest.license || 'Not specified'}</p>
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
                    <span className="text-gray-600">Source code:</span>
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
              <h3 className="text-lg font-bold mb-4">Permissions</h3>
              
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
                <p className="text-sm text-gray-500">No special permissions required</p>
              )}

              {/* Categories */}
              {manifest?.categories && manifest.categories.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-bold mb-3">Categories</h3>
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
              <h3 className="text-lg font-bold mb-4">Version History</h3>
              <div className="space-y-3">
                {subgraphApp.versions.map((version, index) => (
                  <div
                    key={version.id || index}
                    className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg"
                  >
                    <div>
                      <span className="font-medium">Version {version.versionCode}</span>
                      {version.deprecated && (
                        <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                          Deprecated
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
            <h3 className="text-lg font-bold mb-3">Blockchain Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Total downloads:</span>
                <p className="font-medium">{subgraphApp.totalDownloads}</p>
              </div>
              <div>
                <span className="text-gray-600">Slug:</span>
                <p className="font-medium">{subgraphApp.slug}</p>
              </div>
              <div>
                <span className="text-gray-600">Registered:</span>
                <p className="font-medium">{new Date(Number(subgraphApp.createdAt) * 1000).toLocaleDateString()}</p>
              </div>
              <div>
                <span className="text-gray-600">Status:</span>
                <p className="font-medium">{subgraphApp.active ? '✅ Active' : '❌ Inactive'}</p>
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
