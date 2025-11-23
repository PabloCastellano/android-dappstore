/**
 * Error handler middleware
 */
import multer from 'multer';

export function errorHandler(err, req, res, next) {
  console.error('❌ Error:', err);

  // Multer errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        message: 'Maximum file size is 100MB',
      });
    }
    
    return res.status(400).json({
      error: 'Upload error',
      message: err.message,
    });
  }

  // Custom errors
  if (err.message.includes('File too small')) {
    return res.status(400).json({
      error: 'Invalid file size',
      message: err.message,
    });
  }

  if (err.message.includes('Invalid file type')) {
    return res.status(400).json({
      error: 'Invalid file type',
      message: err.message,
    });
  }

  if (err.message.includes('USDFC balance')) {
    return res.status(503).json({
      error: 'Service unavailable',
      message: 'Insufficient USDFC balance for uploads. Please contact the administrator.',
    });
  }

  // Synapse SDK errors
  if (err.message.includes('Synapse') || err.message.includes('Filecoin')) {
    return res.status(503).json({
      error: 'Upload service error',
      message: 'Failed to upload to Filecoin. Please try again later.',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }

  // Default error
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' 
      ? err.message 
      : 'An unexpected error occurred',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}
