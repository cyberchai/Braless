# Braless Backend API

Backend server for MongoDB operations to save and retrieve song versions.

## Setup

1. Install dependencies:
```bash
cd backend
npm install
```

2. Make sure your `.env.local` file (in the parent directory) contains:
```
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB=braless
```

3. Start the server:
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

The server will run on `http://localhost:3001` by default.

## API Endpoints

### POST /api/songs/versions
Save a new song version.

**Request Body:**
```json
{
  "userId": "firebase_uid",
  "userEmail": "user@example.com",
  "userName": "User Name",
  "code": "note('c e g').s('sawtooth')",
  "source": {
    "type": "agent",
    "agentId": "rhythm-droid",
    "agentName": "Rhythm Droid",
    "agentRole": "Percussionist"
  },
  "sessionId": "uuid",
  "executedAt": "2024-01-01T00:00:00.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "versionId": "version_id",
  "songId": "song_id",
  "versionNumber": 1
}
```

### GET /api/songs?userId=firebase_uid
Get all songs for a user.

**Response:**
```json
{
  "success": true,
  "songs": [...]
}
```

### GET /api/songs/:songId/versions
Get all versions for a specific song.

**Response:**
```json
{
  "success": true,
  "versions": [...]
}
```

### GET /api/versions/:versionId
Get a specific version by ID.

**Response:**
```json
{
  "success": true,
  "version": {...}
}
```

### GET /api/health
Health check endpoint.

## MongoDB Collections

### songs
- Stores song metadata
- Indexed by `userId` and `metadata.sessionId`

### songVersions
- Stores individual code versions
- Indexed by `songId`, `userId`, and `sessionId`

## Environment Variables

- `MONGODB_URI`: MongoDB connection string
- `MONGODB_DB`: Database name (default: `braless`)
- `PORT`: Server port (default: `3001`)

