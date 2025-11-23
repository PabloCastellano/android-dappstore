/**
 * Filecoin Service - Backend upload logic using Synapse SDK
 */
import { Synapse, RPC_URLS, TOKENS, TIME_CONSTANTS } from '@filoz/synapse-sdk';
import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

// Configuration
const NETWORK = process.env.FILECOIN_NETWORK || 'calibration';
const PRIVATE_KEY = process.env.FILECOIN_PRIVATE_KEY;
const MINIMUM_UPLOAD_SIZE = 127; // bytes - Filecoin requirement

if (!PRIVATE_KEY) {
  console.error('❌ FILECOIN_PRIVATE_KEY not set in environment variables');
  process.exit(1);
}

let synapseInstance = null;
let isPaymentSetup = false;

/**
 * Initialize Synapse SDK with backend private key
 */
async function initSynapse() {
  if (synapseInstance) {
    return synapseInstance;
  }

  try {
    console.log('🔄 Initializing Synapse SDK...');
    
    synapseInstance = await Synapse.create({
      rpcURL: RPC_URLS[NETWORK].http,
      privateKey: PRIVATE_KEY,
    });

    console.log(`✅ Synapse SDK initialized on ${NETWORK}`);
    
    // Auto-setup payments if not done yet
    if (!isPaymentSetup) {
      await setupPayments();
    }

    return synapseInstance;
  } catch (error) {
    console.error('❌ Error initializing Synapse SDK:', error);
    throw error;
  }
}

/**
 * Setup payments once on initialization
 */
async function setupPayments() {
  try {
    const synapse = await initSynapse();
    
    // Check current balance
    const balance = await synapse.payments.walletBalance(TOKENS.USDFC);
    const formatted = ethers.formatUnits(balance, 18);
    
    console.log(`💰 Current USDFC Balance: ${formatted}`);
    
    if (balance === 0n) {
      console.warn('⚠️ No USDFC balance. Get tokens from:');
      console.warn('   https://forest-explorer.chainsafe.dev/faucet/calibnet_usdfc');
      return;
    }

    // Setup payment approval if we have balance
    const depositAmount = ethers.parseUnits("2.5", 18);
    
    if (balance >= depositAmount && !isPaymentSetup) {
      console.log('📤 Setting up payment approval...');
      
      const tx = await synapse.payments.depositWithPermitAndApproveOperator(
        depositAmount,
        synapse.getWarmStorageAddress(),
        ethers.MaxUint256,
        ethers.MaxUint256,
        TIME_CONSTANTS.EPOCHS_PER_MONTH,
      );

      console.log('⏳ Waiting for transaction confirmation...');
      await tx.wait();
      
      // Wait for payment to be processed
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      isPaymentSetup = true;
      console.log('✅ Payment setup complete!');
    }
  } catch (error) {
    console.error('❌ Error setting up payments:', error);
    // Don't throw - allow server to start even if payment setup fails
  }
}

/**
 * Upload file to Filecoin
 * @param {Buffer|Uint8Array} fileBuffer - File data
 * @param {Object} metadata - File metadata
 */
export async function uploadFile(fileBuffer, metadata = {}) {
  const synapse = await initSynapse();
  
  // Convert Buffer to Uint8Array
  const data = fileBuffer instanceof Buffer 
    ? new Uint8Array(fileBuffer) 
    : fileBuffer;

  // Validate minimum size
  if (data.length < MINIMUM_UPLOAD_SIZE) {
    throw new Error(
      `File too small. Minimum size is ${MINIMUM_UPLOAD_SIZE} bytes. ` +
      `Current size: ${data.length} bytes.`
    );
  }

  console.log(`📤 Uploading ${data.length} bytes to Filecoin...`);

  // Retry logic
  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await synapse.storage.upload(data, {
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
          network: NETWORK,
        },
      });

      console.log('✅ File uploaded successfully:', result.pieceCid);

      return {
        pieceCid: result.pieceCid,
        size: data.length,
        datasetId: result.datasetId,
      };
    } catch (error) {
      console.error(`❌ Upload attempt ${attempt}/${maxRetries} failed:`, error.message);
      
      const isRetryable = error.message.includes('Failed to upload') || 
                         error.message.includes('commP calculation');
      
      if (attempt < maxRetries && isRetryable) {
        console.log(`⏳ Retrying in 2s...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }
      
      throw error;
    }
  }
}

/**
 * Upload JSON data to Filecoin
 * @param {Object} jsonData - JSON object to upload
 * @param {Object} metadata - Additional metadata
 */
export async function uploadJSON(jsonData, metadata = {}) {
  const synapse = await initSynapse();
  
  // Convert JSON to bytes
  const jsonString = JSON.stringify(jsonData);
  const data = new TextEncoder().encode(jsonString);

  // Validate minimum size
  if (data.length < MINIMUM_UPLOAD_SIZE) {
    throw new Error(
      `JSON too small. Minimum size is ${MINIMUM_UPLOAD_SIZE} bytes. ` +
      `Current size: ${data.length} bytes.`
    );
  }

  console.log(`📤 Uploading JSON (${data.length} bytes) to Filecoin...`);

  // Retry logic
  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await synapse.storage.upload(data, {
        metadata: {
          ...metadata,
          contentType: 'application/json',
          timestamp: new Date().toISOString(),
          network: NETWORK,
        },
      });

      console.log('✅ JSON uploaded successfully:', result.pieceCid);

      return {
        pieceCid: result.pieceCid,
        size: data.length,
        datasetId: result.datasetId,
      };
    } catch (error) {
      console.error(`❌ Upload attempt ${attempt}/${maxRetries} failed:`, error.message);
      
      const isRetryable = error.message.includes('Failed to upload') || 
                         error.message.includes('commP calculation');
      
      if (attempt < maxRetries && isRetryable) {
        console.log(`⏳ Retrying in 2s...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }
      
      throw error;
    }
  }
}

/**
 * Get current balance (for monitoring)
 */
export async function getBalance() {
  const synapse = await initSynapse();
  const balance = await synapse.payments.walletBalance(TOKENS.USDFC);
  return {
    balance: balance.toString(),
    formatted: ethers.formatUnits(balance, 18),
  };
}

// Initialize on module load
initSynapse().catch(err => {
  console.error('Failed to initialize Synapse on startup:', err);
});
