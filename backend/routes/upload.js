/**
 * Upload routes - Handle file uploads to Filecoin
 */
import express from 'express';
import multer from 'multer';
import { verifySignature } from '../middleware/auth.js';
import { uploadFile, uploadJSON } from '../services/filecoin.js';

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Accept only certain file types
    const allowedMimes = [
      'application/vnd.android.package-archive', // APK
      'application/octet-stream',
      'image/png',
      'image/jpeg',
      'image/webp',
      'application/json',
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}`));
    }
  },
});

/**
 * POST /api/upload/file
 * Upload a file to Filecoin
 * 
 * Body (multipart/form-data):
 * - file: File to upload
 * - walletAddress: User's wallet address
 * - signature: Signed message proving ownership
 * - message: Original message that was signed
 * - metadata: Optional JSON metadata
 */
router.post('/file', upload.single('file'), verifySignature, async (req, res, next) => {
  try {
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({
        error: 'No file provided',
        message: 'Please upload a file',
      });
    }

    console.log(`📤 Uploading file: ${file.originalname} (${file.size} bytes)`);

    // Parse optional metadata
    let metadata = {};
    if (req.body.metadata) {
      try {
        metadata = JSON.parse(req.body.metadata);
      } catch (e) {
        console.warn('Invalid metadata JSON, ignoring');
      }
    }

    // Upload to Filecoin
    const result = await uploadFile(file.buffer, {
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      uploader: req.walletAddress, // From signature verification
      ...metadata,
    });

    console.log(`✅ File uploaded: ${result.pieceCid}`);

    res.json({
      success: true,
      pieceCid: result.pieceCid,
      size: result.size,
      datasetId: result.datasetId,
      uploadedBy: req.walletAddress,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/upload/json
 * Upload JSON data to Filecoin
 * 
 * Body (application/json):
 * - data: JSON object to upload
 * - walletAddress: User's wallet address
 * - signature: Signed message proving ownership
 * - message: Original message that was signed
 */
router.post('/json', verifySignature, async (req, res, next) => {
  try {
    const { data } = req.body;
    
    if (!data) {
      return res.status(400).json({
        error: 'No data provided',
        message: 'Please provide data to upload',
      });
    }

    console.log('📤 Uploading JSON data...');

    // Upload JSON to Filecoin
    const result = await uploadJSON(data, {
      uploader: req.walletAddress,
    });

    console.log(`✅ JSON uploaded: ${result.pieceCid}`);

    res.json({
      success: true,
      pieceCid: result.pieceCid,
      size: result.size,
      datasetId: result.datasetId,
      uploadedBy: req.walletAddress,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
