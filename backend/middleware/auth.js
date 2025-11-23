/**
 * Authentication middleware - Verify wallet signatures
 */
import { ethers } from 'ethers';

/**
 * Verify wallet signature to prove ownership
 * Expects:
 * - walletAddress: The claimed wallet address
 * - message: The original message that was signed
 * - signature: The signature from wallet.signMessage()
 */
export async function verifySignature(req, res, next) {
  try {
    const { walletAddress, message, signature } = req.body;

    // Validate required fields
    if (!walletAddress) {
      return res.status(400).json({
        error: 'Missing wallet address',
        message: 'walletAddress is required',
      });
    }

    if (!message) {
      return res.status(400).json({
        error: 'Missing message',
        message: 'message is required',
      });
    }

    if (!signature) {
      return res.status(400).json({
        error: 'Missing signature',
        message: 'signature is required',
      });
    }

    // Validate wallet address format
    if (!ethers.isAddress(walletAddress)) {
      return res.status(400).json({
        error: 'Invalid wallet address',
        message: 'walletAddress must be a valid Ethereum address',
      });
    }

    // Recover the signer's address from the signature
    const recoveredAddress = ethers.verifyMessage(message, signature);

    // Compare recovered address with claimed address
    if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      return res.status(401).json({
        error: 'Invalid signature',
        message: 'Signature does not match wallet address',
        expected: walletAddress,
        recovered: recoveredAddress,
      });
    }

    // Optional: Check message timestamp to prevent replay attacks
    // Message format should be: "Upload file: [filename] - Timestamp: [timestamp]"
    const timestampMatch = message.match(/Timestamp: (\d+)/);
    if (timestampMatch) {
      const timestamp = parseInt(timestampMatch[1]);
      const now = Date.now();
      const maxAge = 5 * 60 * 1000; // 5 minutes

      if (now - timestamp > maxAge) {
        return res.status(401).json({
          error: 'Signature expired',
          message: 'Signature is too old. Please sign a new message.',
        });
      }
    }

    // Signature is valid - attach wallet address to request
    req.walletAddress = walletAddress;
    next();
  } catch (error) {
    console.error('❌ Signature verification error:', error);
    
    return res.status(401).json({
      error: 'Signature verification failed',
      message: error.message,
    });
  }
}

/**
 * Optional: Rate limiting per wallet address
 * Store upload counts per wallet in memory or Redis
 */
const uploadCounts = new Map();

export function walletRateLimit(maxUploadsPerHour = 5) {
  return (req, res, next) => {
    const wallet = req.walletAddress;
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    if (!uploadCounts.has(wallet)) {
      uploadCounts.set(wallet, []);
    }

    const uploads = uploadCounts.get(wallet);
    
    // Remove old uploads (older than 1 hour)
    const recentUploads = uploads.filter(timestamp => now - timestamp < oneHour);
    uploadCounts.set(wallet, recentUploads);

    // Check if limit exceeded
    if (recentUploads.length >= maxUploadsPerHour) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: `Maximum ${maxUploadsPerHour} uploads per hour per wallet`,
        retryAfter: Math.ceil((recentUploads[0] + oneHour - now) / 1000),
      });
    }

    // Add current upload timestamp
    recentUploads.push(now);
    uploadCounts.set(wallet, recentUploads);

    next();
  };
}
