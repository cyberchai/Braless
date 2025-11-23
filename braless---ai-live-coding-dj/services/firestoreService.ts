// Firestore service for saving song versions
import { db } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  increment,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';

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

// Save song version to Firestore
export const saveSongVersion = async (params: SaveVersionParams): Promise<{ success: boolean; versionId?: string; songId?: string }> => {
  if (!params.userId) {
    throw new Error('User must be logged in to save');
  }

  try {
    const { userId, userEmail, userName, code, source, sessionId } = params;
    const executedAt = Timestamp.now();

    // Find or create song for this session
    const songsRef = collection(db, 'songs');
    const songQuery = query(
      songsRef,
      where('userId', '==', userId),
      where('metadata.sessionId', '==', sessionId),
      limit(1)
    );

    const songSnapshot = await getDocs(songQuery);
    let songId: string;
    let versionNumber: number;

    if (songSnapshot.empty) {
      // Create new song
      const songDoc = {
        userId,
        userEmail: userEmail || null,
        userName: userName || null,
        title: `Session ${new Date().toLocaleDateString()}`,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isPublic: false,
        tags: [],
        metadata: {
          sessionId,
          totalVersions: 0,
          lastPlayedAt: serverTimestamp(),
        },
      };

      const newSongRef = doc(songsRef);
      await setDoc(newSongRef, songDoc);
      songId = newSongRef.id;
      versionNumber = 1;
    } else {
      // Get existing song
      const songDoc = songSnapshot.docs[0];
      songId = songDoc.id;
      const songData = songDoc.data();
      versionNumber = (songData.metadata?.totalVersions || 0) + 1;

      // Update song metadata
      await updateDoc(doc(songsRef, songId), {
        updatedAt: serverTimestamp(),
        'metadata.totalVersions': versionNumber,
        'metadata.lastPlayedAt': serverTimestamp(),
      });
    }

    // Create version document
    const versionsRef = collection(db, 'songVersions');
    const versionRef = doc(versionsRef);
    const versionDoc = {
      songId,
      versionNumber,
      code,
      source: source || { type: 'manual' },
      userId,
      createdAt: serverTimestamp(),
      executedAt,
      sessionId: sessionId || 'unknown',
      metadata: {
        codeLength: code.length,
        hasStack: code.includes('stack('),
        hasNote: code.includes('note('),
        hasDrums: code.includes('s('),
      },
    };

    await setDoc(versionRef, versionDoc);

    return {
      success: true,
      versionId: versionRef.id,
      songId: songId,
    };
  } catch (error: any) {
    console.error('Error saving song version:', error);
    // Provide helpful error messages
    if (error.code === 'permission-denied') {
      throw new Error(
        'Firestore permission denied. Please:\n' +
        '1. Make sure you are signed in\n' +
        '2. Set up Firestore security rules (see FIRESTORE_SETUP.md)\n' +
        '3. Make sure Firestore is enabled in Firebase Console'
      );
    }
    throw new Error(`Failed to save version: ${error.message}`);
  }
};

// Get user's songs (for future retrieval)
export const getUserSongs = async (userId: string) => {
  try {
    const songsRef = collection(db, 'songs');
    const songQuery = query(
      songsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(songQuery);
    const songs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return { success: true, songs };
  } catch (error: any) {
    console.error('Error fetching songs:', error);
    throw new Error(`Failed to fetch songs: ${error.message}`);
  }
};

// Get versions for a specific song
export const getSongVersions = async (songId: string) => {
  try {
    const versionsRef = collection(db, 'songVersions');
    const versionQuery = query(
      versionsRef,
      where('songId', '==', songId),
      orderBy('versionNumber', 'asc')
    );

    const snapshot = await getDocs(versionQuery);
    const versions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return { success: true, versions };
  } catch (error: any) {
    console.error('Error fetching versions:', error);
    throw new Error(`Failed to fetch versions: ${error.message}`);
  }
};

