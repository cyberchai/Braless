// MongoDB service for saving song versions
import { User } from 'firebase/auth';

export interface SourceInfo {
  type: 'agent' | 'text' | 'preset' | 'manual';
  agentId?: string;
  agentName?: string;
  agentRole?: string;
  textInput?: string;
  presetName?: string;
}

export interface SaveVersionParams {
  userId: string;
  userEmail: string | null;
  userName: string | null;
  code: string;
  source: SourceInfo;
  sessionId: string;
}

// Generate session ID once per app session
let sessionId: string = crypto.randomUUID();

export const getSessionId = () => sessionId;

export const resetSessionId = () => {
  sessionId = crypto.randomUUID();
};

// Helper to create agent source info
export const getAgentSource = (agent: { id: string; name: string; role: string }): SourceInfo => ({
  type: 'agent',
  agentId: agent.id,
  agentName: agent.name,
  agentRole: agent.role,
});

// Helper to create text input source info
export const getTextSource = (message: string): SourceInfo => ({
  type: 'text',
  textInput: message,
});

// Helper to create preset source info
export const getPresetSource = (presetName: string): SourceInfo => ({
  type: 'preset',
  presetName: presetName,
});

// Helper to create manual source info
export const getManualSource = (): SourceInfo => ({
  type: 'manual',
});

// Save song version directly to MongoDB using Atlas Data API
export const saveSongVersion = async (params: SaveVersionParams): Promise<{ success: boolean; versionId?: string; songId?: string }> => {
  if (!params.userId) {
    throw new Error('User must be logged in to save');
  }

  const DATA_API_URL = import.meta.env.VITE_MONGODB_DATA_API_URL;
  const DATA_API_KEY = import.meta.env.VITE_MONGODB_DATA_API_KEY;
  const MONGODB_DB = import.meta.env.VITE_MONGODB_DB || 'braless';

  // Require Data API configuration - no backend fallback
  if (!DATA_API_URL || !DATA_API_KEY) {
    throw new Error(
      'MongoDB Data API not configured. Add to .env.local:\n' +
      'VITE_MONGODB_DATA_API_URL=your_data_api_url\n' +
      'VITE_MONGODB_DATA_API_KEY=your_api_key\n' +
      'VITE_MONGODB_DB=braless\n' +
      'See MONGODB_DATA_API_SETUP.md for setup instructions.'
    );
  }

  try {
    return await saveViaDataAPI(params, DATA_API_URL, DATA_API_KEY, MONGODB_DB);
  } catch (error: any) {
    console.error('Error saving song version:', error);
    // Provide helpful error messages
    if (error.message && error.message.includes('api-key')) {
      throw new Error('Invalid MongoDB Data API key. Check VITE_MONGODB_DATA_API_KEY in .env.local');
    }
    if (error.message && error.message.includes('dataSource')) {
      throw new Error('Invalid cluster name. Check VITE_MONGODB_CLUSTER_NAME in .env.local (default: Cluster0)');
    }
    throw error;
  }
};

// Save directly to MongoDB using Atlas Data API
async function saveViaDataAPI(
  params: SaveVersionParams, 
  dataApiUrl: string, 
  dataApiKey: string,
  dbName: string
): Promise<{ success: boolean; versionId?: string; songId?: string }> {
  const { userId, userEmail, userName, code, source, sessionId } = params;
  const executedAt = new Date().toISOString();
  const clusterName = import.meta.env.VITE_MONGODB_CLUSTER_NAME || 'Cluster0';

  // Find or create song for this session
  const findSongResponse = await fetch(`${dataApiUrl}/action/findOne`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': dataApiKey,
    },
    body: JSON.stringify({
      dataSource: clusterName,
      database: dbName,
      collection: 'songs',
      filter: {
        userId,
        'metadata.sessionId': sessionId,
      },
    }),
  });

  if (!findSongResponse.ok) {
    const error = await findSongResponse.json().catch(() => ({ error: 'Failed to find song' }));
    throw new Error(error.error || 'Failed to query MongoDB');
  }

  const findResult = await findSongResponse.json();
  let song: any = findResult.document || null; // document will be null if not found

  let songId: string;

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
        lastPlayedAt: new Date(),
      },
    };

    const insertSongResponse = await fetch(`${dataApiUrl}/action/insertOne`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': dataApiKey,
      },
      body: JSON.stringify({
        dataSource: clusterName,
        database: dbName,
        collection: 'songs',
        document: songDoc,
      }),
    });

    if (!insertSongResponse.ok) {
      const error = await insertSongResponse.json().catch(() => ({ error: 'Failed to create song' }));
      throw new Error(error.error || 'Failed to create song');
    }

    const insertResult = await insertSongResponse.json();
    songId = insertResult.insertedId;
    song = { _id: { $oid: songId }, metadata: { totalVersions: 0 } };
  } else {
    songId = song._id.$oid || song._id;
  }

  // Get next version number
  const versionNumber = (song.metadata?.totalVersions || 0) + 1;

  // Create version document
  const versionDoc = {
    songId: { $oid: songId },
    versionNumber,
    code,
    source: source || { type: 'manual' },
    userId,
    createdAt: new Date(),
    executedAt: new Date(executedAt),
    sessionId: sessionId || 'unknown',
    metadata: {
      codeLength: code.length,
      hasStack: code.includes('stack('),
      hasNote: code.includes('note('),
      hasDrums: code.includes('s('),
    },
  };

  // Save version
  const insertVersionResponse = await fetch(`${dataApiUrl}/action/insertOne`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': dataApiKey,
    },
      body: JSON.stringify({
        dataSource: clusterName,
        database: dbName,
        collection: 'songVersions',
        document: versionDoc,
      }),
  });

  if (!insertVersionResponse.ok) {
    const error = await insertVersionResponse.json().catch(() => ({ error: 'Failed to save version' }));
    throw new Error(error.error || 'Failed to save version');
  }

  const versionResult = await insertVersionResponse.json();
  const versionId = versionResult.insertedId;

  // Update song metadata
  await fetch(`${dataApiUrl}/action/updateOne`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': dataApiKey,
    },
      body: JSON.stringify({
        dataSource: clusterName,
        database: dbName,
        collection: 'songs',
        filter: { _id: { $oid: songId } },
        update: {
          $set: {
            updatedAt: new Date(),
            'metadata.totalVersions': versionNumber,
            'metadata.lastPlayedAt': new Date(),
          },
        },
      }),
  });

  return {
    success: true,
    versionId: versionId,
    songId: songId,
  };
}

// Get user's songs (for future retrieval)
export const getUserSongs = async (userId: string) => {
  try {
    const API_URL = import.meta.env.VITE_API_URL || '';
    
    const response = await fetch(`${API_URL}/api/songs?userId=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch songs');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching songs:', error);
    throw error;
  }
};

// Get versions for a specific song
export const getSongVersions = async (songId: string) => {
  try {
    const API_URL = import.meta.env.VITE_API_URL || '';
    
    const response = await fetch(`${API_URL}/api/songs/${songId}/versions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch versions');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching versions:', error);
    throw error;
  }
};

