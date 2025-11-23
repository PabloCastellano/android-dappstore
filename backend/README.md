# 🔐 DApp Store Backend API

Secure backend API for handling file uploads to Filecoin. This keeps your Filecoin/Pinata credentials safe by handling uploads server-side.

## 🎯 Why a Backend?

**Security Problem**: If you put `VITE_PINATA_JWT` in your frontend `.env`, it gets embedded in your JavaScript bundle and anyone can extract it.

**Solution**: Move upload logic to a backend API that:
- ✅ Keeps credentials secure (server-side only)
- ✅ Validates user signatures (proves wallet ownership)
- ✅ Implements rate limiting (prevents abuse)
- ✅ Controls costs (you manage the upload wallet)

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
```bash
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Filecoin Configuration
FILECOIN_NETWORK=calibration
FILECOIN_PRIVATE_KEY=your_private_key_without_0x

```

### 3. Get USDFC Tokens

Your backend wallet needs USDFC tokens to pay for uploads:

1. Create a new wallet or use an existing one
2. Get test USDFC from: https://forest-explorer.chainsafe.dev/faucet/calibnet_usdfc
3. Copy the private key to `.env`

### 4. Start the Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server will start on `http://localhost:3001`

## 📡 API Endpoints

### Health Check

```http
GET /health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "network": "calibration"
}
```

### Upload File

```http
POST /api/upload/file
Content-Type: multipart/form-data
```

Form fields:
- `file`: File to upload
- `walletAddress`: User's wallet address
- `signature`: Signed message from user's wallet
- `message`: Original message that was signed
- `metadata`: Optional JSON metadata

Response:
```json
{
  "success": true,
  "pieceCid": "baga6ea4seaq...",
  "size": 1048576,
  "datasetId": "123",
  "uploadedBy": "0x1234..."
}
```

### Upload JSON

```http
POST /api/upload/json
Content-Type: application/json
```

Body:
```json
{
  "data": { "key": "value" },
  "walletAddress": "0x1234...",
  "signature": "0xabc...",
  "message": "Upload JSON data..."
}
```

Response:
```json
{
  "success": true,
  "pieceCid": "baga6ea4seaq...",
  "size": 256,
  "datasetId": "123",
  "uploadedBy": "0x1234..."
}
```

## 🔒 Security Features

### 1. Signature Verification

Every request requires a valid signature from the user's wallet:

```javascript
// Frontend
const message = `Upload file: ${file.name} - Timestamp: ${Date.now()}`;
const signature = await wallet.signMessage(message);

// Backend verifies:
// - Signature is valid
// - Recovered address matches claimed address
// - Timestamp is recent (< 5 minutes)
```

### 2. Rate Limiting

- **Global**: 100 requests per 15 minutes per IP
- **Upload**: 10 uploads per hour per IP
- **Per Wallet**: 5 uploads per hour per wallet (optional)

### 3. File Validation

- Maximum file size: 100MB
- Minimum file size: 127 bytes (Filecoin requirement)
- Allowed MIME types: APK, images, JSON

### 4. Environment Isolation

- Credentials never exposed to frontend
- Private key stays on server
- CORS restricted to your frontend domain

## 🏗️ Architecture

```
┌──────────────────────┐
│   Frontend (React)   │
│                      │
│  1. User uploads     │
│  2. Signs message    │
│  3. Sends to backend │
└──────────┬───────────┘
           │
           │ POST /api/upload/file
           │ + signature
           ▼
┌──────────────────────┐
│   Backend API        │
│                      │
│  1. Verify signature │
│  2. Rate limit       │
│  3. Upload to        │
│     Filecoin         │
└──────────┬───────────┘
           │
           │ Synapse SDK
           ▼
┌──────────────────────┐
│   Filecoin Network   │
└──────────────────────┘
```

## 🔧 Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 3001) |
| `NODE_ENV` | No | Environment (development/production) |
| `FRONTEND_URL` | Yes | Your frontend URL for CORS |
| `FILECOIN_NETWORK` | Yes | 'calibration' or 'mainnet' |
| `FILECOIN_PRIVATE_KEY` | Yes | Backend wallet private key |

### Rate Limiting

Edit `server.js` to adjust limits:

```javascript
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 uploads per hour
});
```

### File Size Limits

Edit `routes/upload.js`:

```javascript
const upload = multer({
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
});
```

## 📦 Deployment

### Option 1: VPS (DigitalOcean, AWS, etc.)

```bash
# On your server
git clone your-repo
cd backend
npm install
cp .env.example .env
# Edit .env with production values

# Install PM2 for process management
npm install -g pm2

# Start with PM2
pm2 start server.js --name dappstore-api
pm2 save
pm2 startup
```

### Option 2: Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3001
CMD ["node", "server.js"]
```

```bash
docker build -t dappstore-backend .
docker run -p 3001:3001 --env-file .env dappstore-backend
```

### Option 3: Serverless (Vercel, Railway)

The backend works on serverless platforms with some adjustments:

1. Use environment variables from platform UI
2. Adjust timeout limits for large file uploads
3. Consider stateless design (no in-memory rate limiting)

### Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Large file uploads
        client_max_body_size 100M;
    }
}
```

## 🔍 Monitoring

### Check Balance

Monitor your USDFC balance to ensure you can continue uploading:

```javascript
import { getBalance } from './services/filecoin.js';

const balance = await getBalance();
console.log(`Current balance: ${balance.formatted} USDFC`);
```

### Logs

```bash
# Development
npm run dev

# Production with PM2
pm2 logs dappstore-api

# Docker
docker logs container-name
```

### Health Monitoring

Set up monitoring to ping `/health` endpoint:
- Uptime Robot
- Pingdom
- Custom script

## ⚠️ Troubleshooting

### "FILECOIN_PRIVATE_KEY not set"
- Add private key to `.env` file
- Remove `0x` prefix from private key

### "Insufficient USDFC balance"
- Get tokens from faucet
- Check balance with monitoring script

### "Signature verification failed"
- Check frontend is signing correct message format
- Ensure timestamp is recent (< 5 minutes)
- Verify wallet address matches signature

### "CORS error"
- Add your frontend URL to `FRONTEND_URL` in `.env`
- Check CORS configuration in `server.js`

### "Upload too slow"
- Increase timeout in nginx/proxy
- Check network connectivity
- Try different Filecoin provider

## 💡 Best Practices

1. **Use Separate Wallets**
   - Dev: Test wallet with test tokens
   - Prod: Dedicated wallet with limited funds

2. **Monitor Costs**
   - Set up balance alerts
   - Log all uploads
   - Review costs monthly

3. **Rotate Keys**
   - Change private keys periodically
   - Use key management service in production

4. **Rate Limiting**
   - Adjust based on your budget
   - Implement per-wallet limits
   - Use Redis for distributed rate limiting

5. **Error Handling**
   - Log all errors
   - Set up error tracking (Sentry)
   - Implement retry logic

## 📚 Resources

- **Synapse SDK Docs**: https://docs.filoz.ai/
- **Filecoin Docs**: https://docs.filecoin.io/
- **Express.js**: https://expressjs.com/
- **Calibration Testnet**: https://forest-explorer.chainsafe.dev/
