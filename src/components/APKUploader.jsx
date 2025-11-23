/**
 * Component for uploading APKs to IPFS and generating manifests
 */

import React, { useState } from 'react';
import { uploadToPinata, uploadJSONToPinata, calculateSHA256 } from '../services/ipfs.js';
import { createManifest, validateManifest, signManifest, extractAPKInfo, formatFileSize, generateSlug } from '../utils/manifest.js';

export default function APKUploader({ onComplete, wallet }) {
  
  const [step, setStep] = useState(1); // 1: Upload APK, 2: Metadata, 3: Review, 4: Upload to IPFS
  const [apkFile, setApkFile] = useState(null);
  const [iconFile, setIconFile] = useState(null);
  const [apkInfo, setApkInfo] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    package: '',
    version: '1.0.0',
    versionCode: 1,
    description: '',
    publisher_name: '',
    website: '',
    source_code: '',
    license: 'Proprietary',
    categories: [],
    min_sdk: '21',
    target_sdk: '34'
  });

  const [manifest, setManifest] = useState(null);
  const [manifestCID, setManifestCID] = useState(null);

  // Handle APK selection
  const handleAPKSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.apk')) {
      setError('Please select a valid APK file');
      return;
    }

    setError(null);
    setApkFile(file);
    
    // Extract APK information
    try {
      const info = await extractAPKInfo(file);
      setApkInfo(info);
      
      // Pre-fill some fields
      setFormData(prev => ({
        ...prev,
        package: info.package,
        version: info.version,
        versionCode: info.versionCode,
        min_sdk: info.min_sdk,
        target_sdk: info.target_sdk
      }));
    } catch (err) {
      console.error('Error extracting APK info:', err);
      setError('Error parsing APK. Continue manually.');
    }
  };

  // Handle icon selection
  const handleIconSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image');
      return;
    }

    setIconFile(file);
  };

  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-generate slug from name
    if (name === 'name' && !formData.slug) {
      setFormData(prev => ({
        ...prev,
        slug: generateSlug(value)
      }));
    }
  };

  // Step 1 -> 2
  const handleNextToMetadata = () => {
    if (!apkFile) {
      setError('Please select an APK file');
      return;
    }
    setError(null);
    setStep(2);
  };

  // Step 2 -> 3
  const handleNextToReview = () => {
    // Validate required fields
    if (!formData.name || !formData.slug || !formData.package) {
      setError('Please complete all required fields');
      return;
    }

    if (!wallet.isConnected) {
      setError('Please connect your wallet');
      return;
    }

    setError(null);
    setStep(3);
  };

  // Step 3 -> 4: Upload to IPFS
  const handleUploadToIPFS = async () => {
    if (!wallet.isConnected) {
      setError('Wallet not connected');
      return;
    }

    setUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // 1. Upload APK to IPFS
      setUploadProgress(10);
      console.log('📤 Uploading APK to IPFS...');
      
      const apkResult = await uploadToPinata(apkFile, {
        name: `${formData.slug}-${formData.version}.apk`,
        keyvalues: {
          type: 'apk',
          slug: formData.slug,
          version: formData.version
        }
      });

      setUploadProgress(40);

      // 2. Upload icon to IPFS (if exists)
      let iconCID = '';
      if (iconFile) {
        console.log('📤 Uploading icon to IPFS...');
        const iconResult = await uploadToPinata(iconFile, {
          name: `${formData.slug}-icon.png`,
          keyvalues: {
            type: 'icon',
            slug: formData.slug
          }
        });
        iconCID = iconResult.cid;
      }

      setUploadProgress(60);

      // 3. Create manifest
      console.log('📝 Creating manifest...');
      const manifestData = createManifest(
        {
          ...formData,
          publisher: wallet.address,
          icon_cid: iconCID
        },
        {
          cid: apkResult.cid,
          sha256: apkInfo.sha256,
          size: apkFile.size
        }
      );

      setUploadProgress(70);

      // 4. Sign manifest
      console.log('✍️ Signing manifest...');
      const signature = await signManifest(manifestData, wallet.signer, wallet.chainId);
      manifestData.signature = signature;

      setUploadProgress(80);

      // 5. Validate manifest
      const validation = validateManifest(manifestData);
      if (!validation.valid) {
        throw new Error(`Invalid manifest: ${validation.errors.join(', ')}`);
      }

      setUploadProgress(90);

      // 6. Upload manifest to IPFS
      console.log('📤 Uploading manifest to IPFS...');
      const manifestResult = await uploadJSONToPinata(manifestData, {
        name: `${formData.slug}-manifest.json`,
        keyvalues: {
          type: 'manifest',
          slug: formData.slug,
          version: formData.version
        }
      });

      setUploadProgress(100);

      console.log('✅ Upload complete!');
      setManifest(manifestData);
      setManifestCID(manifestResult.cid);
      setStep(4);

      // Callback with results
      if (onComplete) {
        onComplete({
          manifest: manifestData,
          manifestCID: manifestResult.cid,
          apkCID: apkResult.cid,
          iconCID
        });
      }

    } catch (err) {
      console.error('❌ Upload error:', err);
      setError(err.message || 'Error uploading files to IPFS');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  step >= s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {s}
                </div>
                {s < 4 && (
                  <div className={`w-24 h-1 ${step > s ? 'bg-blue-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm">
            <span>APK</span>
            <span>Metadata</span>
            <span>Review</span>
            <span>Upload</span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Step 1: Upload APK */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">1. Select APK</h2>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                type="file"
                accept=".apk"
                onChange={handleAPKSelect}
                className="hidden"
                id="apk-upload"
              />
              <label htmlFor="apk-upload" className="cursor-pointer">
                <div className="text-6xl mb-4">📦</div>
                <p className="text-lg font-medium mb-2">
                  {apkFile ? apkFile.name : 'Click to select APK'}
                </p>
                {apkFile && (
                  <p className="text-sm text-gray-500">
                    Size: {formatFileSize(apkFile.size)}
                  </p>
                )}
              </label>
            </div>

            {apkInfo && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold mb-2">APK Information:</h3>
                <ul className="text-sm space-y-1">
                  <li>Package: {apkInfo.package}</li>
                  <li>Version: {apkInfo.version} (code: {apkInfo.versionCode})</li>
                  <li>SDK: {apkInfo.min_sdk} - {apkInfo.target_sdk}</li>
                  <li>SHA-256: {apkInfo.sha256.slice(0, 16)}...</li>
                </ul>
              </div>
            )}

            <button
              onClick={handleNextToMetadata}
              disabled={!apkFile}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
            >
              Next →
            </button>
          </div>
        )}

        {/* Step 2: Metadata */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">2. App Information</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-2">Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Slug *</label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  pattern="[a-z0-9-]+"
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Package *</label>
                <input
                  type="text"
                  name="package"
                  value={formData.package}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium mb-2">Icon</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleIconSelect}
                  className="w-full"
                />
                {iconFile && (
                  <p className="text-sm text-gray-500 mt-1">{iconFile.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Publisher Name</label>
                <input
                  type="text"
                  name="publisher_name"
                  value={formData.publisher_name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Website</label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300"
              >
                ← Back
              </button>
              <button
                onClick={handleNextToReview}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">3. Review and Confirm</h2>
            
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <div>
                <h3 className="font-semibold mb-2">APK</h3>
                <p className="text-sm">{apkFile.name} ({formatFileSize(apkFile.size)})</p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">App Info</h3>
                <ul className="text-sm space-y-1">
                  <li><strong>Name:</strong> {formData.name}</li>
                  <li><strong>Slug:</strong> {formData.slug}</li>
                  <li><strong>Package:</strong> {formData.package}</li>
                  <li><strong>Version:</strong> {formData.version} (code: {formData.versionCode})</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Publisher</h3>
                <p className="text-sm font-mono">{wallet.address}</p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                ⚠️ Files will be uploaded to IPFS (Pinata) and a signed manifest will be generated.
                This process may take several minutes depending on APK size.
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(2)}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300"
              >
                ← Back
              </button>
              <button
                onClick={handleUploadToIPFS}
                disabled={uploading}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400"
              >
                {uploading ? 'Uploading...' : 'Upload to IPFS →'}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Complete */}
        {step === 4 && (
          <div className="space-y-6 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold">Upload Complete!</h2>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-left">
              <h3 className="font-semibold mb-4">Manifest Information:</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Manifest CID:</strong>
                  <p className="font-mono break-all">{manifestCID}</p>
                </div>
                <div>
                  <strong>APK CID:</strong>
                  <p className="font-mono break-all">{manifest?.apk_cid}</p>
                </div>
                {manifest?.icon_cid && (
                  <div>
                    <strong>Icon CID:</strong>
                    <p className="font-mono break-all">{manifest.icon_cid}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                💡 Use the <strong>Manifest CID</strong> to register the app on the smart contract.
              </p>
            </div>

            <button
              onClick={() => {
                setStep(1);
                setApkFile(null);
                setIconFile(null);
                setManifest(null);
                setManifestCID(null);
              }}
              className="bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700"
            >
              Upload Another App
            </button>
          </div>
        )}

        {/* Upload Progress */}
        {uploading && (
          <div className="mt-6">
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-center text-sm text-gray-600 mt-2">
              {uploadProgress}% - {
                uploadProgress < 40 ? 'Uploading APK...' :
                uploadProgress < 60 ? 'Uploading icon...' :
                uploadProgress < 80 ? 'Creating manifest...' :
                uploadProgress < 100 ? 'Uploading manifest...' :
                'Complete!'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
