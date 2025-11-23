// Backend API server for MongoDB operations
// Run with: node backend/server.js
// Make sure to install dependencies: npm install (in backend directory)

import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local in parent directory
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'braless';

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not defined in .env.local');
  process.exit(1);
}

let client;
let db;

// Connect to MongoDB
async function connectDB() {
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(MONGODB_DB);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// Initialize collections with indexes (optional - will fail gracefully if user lacks permissions)
async function initCollections() {
  try {
    const songsCollection = db.collection('songs');
    const versionsCollection = db.collection('songVersions');
    
    // Try to create indexes for better query performance
    // Note: These may fail if the MongoDB user doesn't have createIndex permissions
    // The server will still work without indexes, just with potentially slower queries
    try {
      await songsCollection.createIndex({ userId: 1, createdAt: -1 });
      await songsCollection.createIndex({ 'metadata.sessionId': 1 });
      await versionsCollection.createIndex({ songId: 1, versionNumber: 1 });
      await versionsCollection.createIndex({ userId: 1, executedAt: -1 });
      await versionsCollection.createIndex({ sessionId: 1 });
      console.log('Collections initialized with indexes');
    } catch (indexError) {
      // Index creation failed - log warning but continue
      console.warn('Could not create indexes (this is OK if user lacks permissions):', indexError.message);
      console.log('Server will continue without indexes. Queries may be slower.');
    }
  } catch (error) {
    console.error('Error initializing collections:', error);
    // Don't throw - allow server to start even if index creation fails
  }
}

// POST /api/songs/versions - Save a new version
app.post('/api/songs/versions', async (req, res) => {
  try {
    const { userId, userEmail, userName, code, source, sessionId, executedAt } = req.body;
    
    console.log('Received save request:', { userId, sessionId, codeLength: code?.length, sourceType: source?.type });
    
    if (!userId || !code) {
      return res.status(400).json({ error: 'userId and code are required' });
    }
    
    if (!db) {
      return res.status(500).json({ error: 'Database not connected' });
    }
    
    const songsCollection = db.collection('songs');
    const versionsCollection = db.collection('songVersions');
    
    // Find or create song for this session
    let song;
    try {
      song = await songsCollection.findOne({ 
        userId, 
        'metadata.sessionId': sessionId 
      });
    } catch (findError) {
      console.error('Error finding song:', findError);
      throw findError;
    }
    
    if (!song) {
      // Create new song
      const songDoc = {
        userId,
        userEmail: userEmail || null,
        userName: userName || null,
        title: `Session ${new Date().toLocaleDateString()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        isPublic: false,
        tags: [],
        metadata: {
          sessionId,
          totalVersions: 0,
          lastPlayedAt: new Date()
        }
      };
      
      try {
        const songResult = await songsCollection.insertOne(songDoc);
        song = { _id: songResult.insertedId, metadata: { totalVersions: 0 } };
        console.log('Created new song:', songResult.insertedId.toString());
      } catch (insertError) {
        console.error('Error creating song:', insertError);
        throw insertError;
      }
    } else {
      console.log('Found existing song:', song._id.toString());
    }
    
    // Get next version number
    const versionNumber = (song.metadata?.totalVersions || 0) + 1;
    
    // Create version document
    const versionDoc = {
      songId: song._id,
      versionNumber,
      code,
      source: source || { type: 'manual' },
      userId,
      createdAt: new Date(),
      executedAt: executedAt ? new Date(executedAt) : new Date(),
      sessionId: sessionId || 'unknown',
      metadata: {
        codeLength: code.length,
        hasStack: code.includes('stack('),
        hasNote: code.includes('note('),
        hasDrums: code.includes('s(')
      }
    };
    
    // Save version
    let versionResult;
    try {
      versionResult = await versionsCollection.insertOne(versionDoc);
      console.log('Saved version:', versionResult.insertedId.toString());
    } catch (insertError) {
      console.error('Error saving version:', insertError);
      throw insertError;
    }
    
    // Update song metadata
    try {
      await songsCollection.updateOne(
        { _id: song._id },
        { 
          $set: { 
            updatedAt: new Date(),
            'metadata.totalVersions': versionNumber,
            'metadata.lastPlayedAt': new Date()
          }
        }
      );
    } catch (updateError) {
      console.error('Error updating song metadata:', updateError);
      // Don't fail the request if metadata update fails - version is already saved
    }
    
    res.json({ 
      success: true, 
      versionId: versionResult.insertedId.toString(), 
      songId: song._id.toString(),
      versionNumber 
    });
  } catch (error) {
    console.error('Error saving version:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to save version', 
      details: error.message,
      code: error.code,
      codeName: error.codeName
    });
  }
});

// GET /api/songs - Get user's songs
app.get('/api/songs', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    const songsCollection = db.collection('songs');
    const songs = await songsCollection
      .find({ userId })
      .sort({ updatedAt: -1 })
      .toArray();
    
    res.json({ success: true, songs });
  } catch (error) {
    console.error('Error fetching songs:', error);
    res.status(500).json({ error: 'Failed to fetch songs', details: error.message });
  }
});

// GET /api/songs/:songId/versions - Get versions for a song
app.get('/api/songs/:songId/versions', async (req, res) => {
  try {
    const { songId } = req.params;
    
    if (!ObjectId.isValid(songId)) {
      return res.status(400).json({ error: 'Invalid songId' });
    }
    
    const versionsCollection = db.collection('songVersions');
    const versions = await versionsCollection
      .find({ songId: new ObjectId(songId) })
      .sort({ versionNumber: 1 })
      .toArray();
    
    res.json({ success: true, versions });
  } catch (error) {
    console.error('Error fetching versions:', error);
    res.status(500).json({ error: 'Failed to fetch versions', details: error.message });
  }
});

// GET /api/versions/:versionId - Get a specific version
app.get('/api/versions/:versionId', async (req, res) => {
  try {
    const { versionId } = req.params;
    
    if (!ObjectId.isValid(versionId)) {
      return res.status(400).json({ error: 'Invalid versionId' });
    }
    
    const versionsCollection = db.collection('songVersions');
    const version = await versionsCollection.findOne({ _id: new ObjectId(versionId) });
    
    if (!version) {
      return res.status(404).json({ error: 'Version not found' });
    }
    
    res.json({ success: true, version });
  } catch (error) {
    console.error('Error fetching version:', error);
    res.status(500).json({ error: 'Failed to fetch version', details: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
async function startServer() {
  await connectDB();
  await initCollections();
  
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`MongoDB database: ${MONGODB_DB}`);
  });
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  if (client) {
    await client.close();
  }
  process.exit(0);
});

startServer().catch(console.error);

export default app;

