/**
 * Dashboard para publishers
 * Gestión de apps, versiones, precios y estadísticas
 */

import React, { useState, useEffect } from 'react';
import { useAppStore } from '../hooks/useAppStore';
import { uploadToPinata, uploadJSONToPinata } from '../services/ipfs';
import { createManifest, signManifest } from '../utils/manifest';

export default function PublisherDashboard({ wallet }) {
  const { getApp, publishVersion, updatePrice } = useAppStore(wallet);
  
  const [myApps, setMyApps] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'versions' | 'pricing' | 'stats'
  
  // Modals
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  
  // Form states
  const [newVersion, setNewVersion] = useState({ apkFile: null, versionCode: '', changelog: '' });
  const [newPrice, setNewPrice] = useState('');
  const [processing, setProcessing] = useState(false);

  // Mock data - en producción vendría del subgraph
  const MOCK_PUBLISHER_APPS = [
    {
      slug: 'my-game',
      name: 'My Game',
      priceEth: '0.05',
      totalDownloads: 150,
      totalRevenue: '7.5',
      versions: 3,
      lastUpdate: '2024-01-15',
      active: true
    },
    {
      slug: 'my-tool',
      name: 'My Tool',
      priceEth: '0',
      totalDownloads: 500,
      totalRevenue: '0',
      versions: 5,
      lastUpdate: '2024-01-10',
      active: true
    }
  ];

  useEffect(() => {
    loadPublisherApps();
  }, [wallet?.address]);

  const loadPublisherApps = async () => {
    if (!wallet?.isConnected) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // En producción, filtrar apps por publisher address desde subgraph
      setMyApps(MOCK_PUBLISHER_APPS);
    } catch (err) {
      console.error('Error loading apps:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePublishVersion = async () => {
    if (!selectedApp || !newVersion.apkFile || !newVersion.versionCode) {
      alert('Completa todos los campos');
      return;
    }

    setProcessing(true);
    try {
      // 1. Upload APK a IPFS
      console.log('📤 Uploading APK...');
      const apkResult = await uploadToPinata(newVersion.apkFile, {
        name: `${selectedApp.slug}-v${newVersion.versionCode}.apk`
      });

      // 2. Crear y firmar manifest
      console.log('📝 Creating manifest...');
      const manifest = {
        ...selectedApp,
        version: newVersion.versionCode,
        versionCode: parseInt(newVersion.versionCode),
        apk_cid: apkResult.cid,
        changelog: newVersion.changelog
      };

      const signature = await signManifest(manifest, wallet.signer, wallet.chainId);
      manifest.signature = signature;

      // 3. Upload manifest
      const manifestResult = await uploadJSONToPinata(manifest);

      // 4. Registrar en blockchain
      console.log('⛓️ Publishing to blockchain...');
      const result = await publishVersion({
        slug: selectedApp.slug,
        manifestCid: manifestResult.cid,
        versionCode: parseInt(newVersion.versionCode)
      });

      if (result.success) {
        alert('✅ New version published!');
        setShowVersionModal(false);
        setNewVersion({ apkFile: null, versionCode: '', changelog: '' });
        loadPublisherApps();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (err) {
      console.error('Error publishing version:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdatePrice = async () => {
    if (!selectedApp || !newPrice) {
      alert('Enter a valid price');
      return;
    }

    setProcessing(true);
    try {
      const result = await updatePrice(selectedApp.slug, newPrice);

      if (result.success) {
        alert('✅ Price updated!');
        setShowPriceModal(false);
        setNewPrice('');
        loadPublisherApps();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (err) {
      console.error('Error updating price:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  if (!wallet?.isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-8 text-center">
            <div className="text-6xl mb-4">🔐</div>
            <h2 className="text-2xl font-bold text-yellow-900 mb-2">
              Connect Your Wallet
            </h2>
            <p className="text-yellow-700">
              Connect your wallet to access the publisher dashboard
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
            <p className="text-gray-600">Loading your apps...</p>
          </div>
        </div>
      </div>
    );
  }

  const totalDownloads = myApps.reduce((sum, app) => sum + app.totalDownloads, 0);
  const totalRevenue = myApps.reduce((sum, app) => sum + parseFloat(app.totalRevenue), 0);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Publisher Dashboard</h1>
          <p className="text-gray-600">
            Manage your applications, versions and statistics
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="text-3xl mb-2">📱</div>
            <div className="text-3xl font-bold text-gray-900">{myApps.length}</div>
            <div className="text-sm text-gray-600">Published apps</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="text-3xl mb-2">⬇️</div>
            <div className="text-3xl font-bold text-gray-900">{totalDownloads}</div>
            <div className="text-sm text-gray-600">Total downloads</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="text-3xl mb-2">💰</div>
            <div className="text-3xl font-bold text-gray-900">{totalRevenue.toFixed(2)}</div>
            <div className="text-sm text-gray-600">ETH earned</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="text-3xl mb-2">⭐</div>
            <div className="text-3xl font-bold text-gray-900">4.5</div>
            <div className="text-sm text-gray-600">Average rating</div>
          </div>
        </div>

        {/* Apps List */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 border-b bg-gray-50">
            <h2 className="text-xl font-bold">Your Applications</h2>
          </div>

          {myApps.length > 0 ? (
            <div className="divide-y">
              {myApps.map((app) => (
                <div key={app.slug} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex items-center gap-6">
                    {/* Icon */}
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center text-3xl shrink-0">
                      📱
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{app.name}</h3>
                        {app.active ? (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                            Inactive
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-4 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Price:</span> {app.priceEth === '0' ? 'Free' : `${app.priceEth} ETH`}
                        </div>
                        <div>
                          <span className="font-medium">Downloads:</span> {app.totalDownloads}
                        </div>
                        <div>
                          <span className="font-medium">Revenue:</span> {app.totalRevenue} ETH
                        </div>
                        <div>
                          <span className="font-medium">Versions:</span> {app.versions}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedApp(app);
                          setShowVersionModal(true);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                      >
                        📦 New Version
                      </button>

                      <button
                        onClick={() => {
                          setSelectedApp(app);
                          setNewPrice(app.priceEth);
                          setShowPriceModal(true);
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                      >
                        💰 Change Price
                      </button>

                      <button
                        onClick={() => setSelectedApp(app)}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition text-sm"
                      >
                        📊 Statistics
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">📱</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                You haven't published any apps yet
              </h3>
              <p className="text-gray-600 mb-6">
                Publish your first app to get started
              </p>
              <button
                onClick={() => window.location.href = '/publish'}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
              >
                Publish App
              </button>
            </div>
          )}
        </div>

        {/* Selected App Details */}
        {selectedApp && !showVersionModal && !showPriceModal && (
          <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">{selectedApp.name} - Statistics</h2>
              <button
                onClick={() => setSelectedApp(null)}
                className="text-gray-600 hover:text-gray-900"
              >
                ✕ Close
              </button>
            </div>

            <div className="grid grid-cols-3 gap-6">
              {/* Downloads Chart */}
              <div className="col-span-2 bg-gray-50 rounded-lg p-6">
                <h3 className="font-bold mb-4">Downloads per day</h3>
                <div className="h-48 flex items-end gap-2">
                  {[20, 35, 28, 42, 38, 50, 45].map((height, i) => (
                    <div key={i} className="flex-1 bg-blue-600 rounded-t" style={{ height: `${height}%` }}></div>
                  ))}
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-600">
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                  <span>Sun</span>
                </div>
              </div>

              {/* Revenue */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-bold mb-4">Revenue</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-600">This week</div>
                    <div className="text-2xl font-bold">{(parseFloat(selectedApp.totalRevenue) * 0.2).toFixed(2)} ETH</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">This month</div>
                    <div className="text-2xl font-bold">{(parseFloat(selectedApp.totalRevenue) * 0.6).toFixed(2)} ETH</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Total</div>
                    <div className="text-2xl font-bold">{selectedApp.totalRevenue} ETH</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Version Modal */}
        {showVersionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold mb-6">Publish New Version</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    APK File
                  </label>
                  <input
                    type="file"
                    accept=".apk"
                    onChange={(e) => setNewVersion({ ...newVersion, apkFile: e.target.files[0] })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código de Versión
                  </label>
                  <input
                    type="number"
                    value={newVersion.versionCode}
                    onChange={(e) => setNewVersion({ ...newVersion, versionCode: e.target.value })}
                    placeholder="2"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Changelog (opcional)
                  </label>
                  <textarea
                    value={newVersion.changelog}
                    onChange={(e) => setNewVersion({ ...newVersion, changelog: e.target.value })}
                    placeholder="- Bug fixes&#10;- New features"
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowVersionModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-100"
                  disabled={processing}
                >
                  Cancel
                </button>
                <button
                  onClick={handlePublishVersion}
                  disabled={processing || !newVersion.apkFile || !newVersion.versionCode}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {processing ? 'Publishing...' : 'Publish'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Price Modal */}
        {showPriceModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold mb-6">Update Price</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Price (ETH)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="0.05"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter 0 to make the app free
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    💡 The price change will be applied immediately on blockchain
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowPriceModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-100"
                  disabled={processing}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdatePrice}
                  disabled={processing || newPrice === ''}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {processing ? 'Updating...' : 'Update'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
