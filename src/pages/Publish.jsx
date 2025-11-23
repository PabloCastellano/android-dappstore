/**
 * Página para publicar apps
 * Combina APKUploader con RegisterApp
 */

import React, { useState } from 'react';
import APKUploader from '../components/APKUploader';
import { useAppStore } from '../hooks/useAppStore';

export default function Publish({ wallet }) {
  const { registerApp } = useAppStore(wallet);
  const [uploadResult, setUploadResult] = useState(null);
  const [registering, setRegistering] = useState(false);
  const [txHash, setTxHash] = useState(null);

  const handleUploadComplete = async ({ manifest, manifestCID, apkCID, iconCID }) => {
    console.log('✅ Upload complete!');
    console.log('Manifest CID:', manifestCID);
    console.log('APK CID:', apkCID);
    
    setUploadResult({ manifest, manifestCID, apkCID, iconCID });
  };

  const handleRegisterOnChain = async () => {
    if (!uploadResult) return;

    setRegistering(true);
    try {
      const result = await registerApp({
        slug: uploadResult.manifest.slug,
        manifestCid: uploadResult.manifestCID,
        versionCode: uploadResult.manifest.versionCode
      });

      if (result.success) {
        setTxHash(result.txHash);
        alert('¡App registrada exitosamente en blockchain!');
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Publicar App</h1>
          <p className="text-gray-600">
            Sube tu APK a IPFS y regístrala en el blockchain
          </p>
        </div>

        {/* APK Uploader */}
        <APKUploader onComplete={handleUploadComplete} wallet={wallet} />

        {/* Register on Blockchain */}
        {uploadResult && !txHash && (
          <div className="mt-8 bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-4">Paso Final: Registrar en Blockchain</h2>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800 mb-2">
                Tu app ha sido subida a IPFS exitosamente. Ahora debes registrarla en el smart contract.
              </p>
              <div className="text-xs font-mono space-y-1">
                <div><strong>Manifest CID:</strong> {uploadResult.manifestCID}</div>
                <div><strong>Slug:</strong> {uploadResult.manifest.slug}</div>
                <div><strong>Version:</strong> {uploadResult.manifest.version}</div>
              </div>
            </div>

            <button
              onClick={handleRegisterOnChain}
              disabled={registering || !wallet.isConnected}
              className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {registering ? 'Registering on Blockchain...' : 'Register App on Blockchain'}
            </button>

            {!wallet.isConnected && (
              <p className="text-sm text-red-600 mt-2">
                ⚠️ Connect your wallet to register the app
              </p>
            )}
          </div>
        )}

        {/* Success */}
        {txHash && (
          <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-green-900 mb-2">
              App Published Successfully!
            </h2>
            <p className="text-green-800 mb-4">
              Your app is now available on the DApp Store
            </p>
            <div className="bg-white rounded p-4 text-left">
              <p className="text-sm font-mono break-all">
                <strong>Transaction:</strong> {txHash}
              </p>
            </div>
            <button
              onClick={() => {
                setUploadResult(null);
                setTxHash(null);
              }}
              className="mt-4 bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700"
            >
              Publicar Otra App
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
