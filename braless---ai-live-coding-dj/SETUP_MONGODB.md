# MongoDB Setup Guide

## Quick Start

1. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Configure Environment Variables**
   
   Make sure your `.env.local` file (in the root directory) contains:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
   MONGODB_DB=braless
   VITE_FIREBASE_API_KEY=your_firebase_key
   ```

3. **Start the Backend Server**
   ```bash
   cd backend
   npm start
   ```
   
   The server will run on `http://localhost:3001`

4. **Configure Frontend API URL** (Optional)
   
   If your backend is on a different URL, add to `.env.local`:
   ```
   VITE_API_URL=http://localhost:3001
   ```
   
   If not set, it defaults to `/api` (relative path for same-origin requests)

5. **Start the Frontend**
   ```bash
   npm run dev
   ```

## How It Works

### Data Flow

1. **User clicks "Run Code"** or triggers an agent
2. **Source is tracked** (agent, text input, preset, or manual)
3. **Code is executed** via Strudel
4. **Version is saved** to MongoDB (if user is logged in)

### What Gets Saved

Each time "Run Code" is clicked, a version is saved with:
- **Code**: The full Strudel code
- **Source**: Which agent/text input/preset was used
- **User**: Firebase Auth user ID, email, name
- **Timestamp**: When it was executed
- **Session ID**: Groups versions from the same session
- **Metadata**: Code length, hasStack, hasNote, hasDrums flags

### MongoDB Collections

**songs** - Song metadata
- Groups versions by session
- Tracks total versions, last played time

**songVersions** - Individual code versions
- Each "Run Code" creates a new version
- Linked to parent song via `songId`
- Version numbers auto-increment

## Testing

1. Sign in with Google
2. Write some code or trigger an agent
3. Click "Run Code"
4. Check the session log for "Version saved to database"
5. Check MongoDB to see the saved version

## Retrieving Data

Use the API endpoints:
- `GET /api/songs?userId=YOUR_UID` - Get all your songs
- `GET /api/songs/:songId/versions` - Get all versions for a song
- `GET /api/versions/:versionId` - Get a specific version

## Future Features

The schema supports:
- **Reactions**: Like/love system (collection: `versionReactions`)
- **Sharing**: Public songs (`isPublic` flag)
- **Tags**: Song categorization
- **Collaboration**: Multiple users per song

