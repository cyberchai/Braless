# MongoDB Atlas Data API Setup

## Quick Setup (No Backend Server Needed!)

The app now uses MongoDB Atlas Data API, which allows direct frontend access without a backend server.

### 1. Enable Data API in MongoDB Atlas

1. Go to your MongoDB Atlas dashboard
2. Navigate to your cluster
3. Click "Data API" in the left sidebar
4. Click "Create Data API" or "Enable Data API"
5. Copy the **Data API URL** (looks like: `https://data.mongodb-api.com/app/xxxxx/endpoint/data/v1`)
6. Create an **API Key**:
   - Go to "API Keys" tab
   - Click "Create API Key"
   - Give it a name (e.g., "Braless App")
   - Copy the API key

### 2. Update .env.local

Add these to your `.env.local` file:

```
VITE_MONGODB_DATA_API_URL=https://data.mongodb-api.com/app/xxxxx/endpoint/data/v1
VITE_MONGODB_DATA_API_KEY=your_api_key_here
VITE_MONGODB_DB=braless
VITE_MONGODB_CLUSTER_NAME=Cluster0
```

**Important**: Replace:
- `xxxxx` with your actual app ID from the Data API URL
- `your_api_key_here` with your actual API key
- `braless` with your database name (if different)
- `Cluster0` with your actual cluster name (check in Atlas dashboard)

### 4. That's It!

Now you can:
- Run `npm run dev` (no backend needed!)
- Sign in with Google
- Click "Run Code" - versions will save directly to MongoDB!

## How It Works

- Frontend makes HTTP requests directly to MongoDB Atlas Data API
- No backend server required
- All data operations happen via REST API
- Secure - uses API keys for authentication

## Fallback

If Data API is not configured, it will try to use the backend server (if running). This allows for flexible deployment options.

