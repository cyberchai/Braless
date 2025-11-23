# Quick Start Guide

## Running the Application

### 1. Start the Backend Server (Required for saving songs)

```bash
cd backend
npm install  # First time only
npm start
```

The backend will run on `http://localhost:3001`

### 2. Start the Frontend

In a new terminal:

```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

### 3. Environment Variables

Make sure your `.env.local` file contains:

```
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB=braless
VITE_FIREBASE_API_KEY=your_firebase_key
```

## Troubleshooting

### "Failed to save version" Error

If you see this error, it means:
1. **Backend server is not running** - Start it with `cd backend && npm start`
2. **MongoDB connection issue** - Check your `MONGODB_URI` in `.env.local`
3. **Backend dependencies not installed** - Run `cd backend && npm install`

### 404 Error on `/api/songs/versions`

- Make sure the backend server is running on port 3001
- Check that Vite proxy is configured (it should be automatic)
- Verify `.env.local` has `MONGODB_URI` set

## Development Workflow

1. **Terminal 1**: Backend server (`cd backend && npm start`)
2. **Terminal 2**: Frontend dev server (`npm run dev`)
3. Open browser to `http://localhost:3000`
4. Sign in with Google
5. Create music and click "Run Code" - versions will auto-save!

