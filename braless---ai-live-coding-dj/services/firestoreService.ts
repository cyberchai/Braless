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
  serverTimestamp,
  deleteDoc
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

// Save a preset
export const savePreset = async (userId: string, name: string, code: string): Promise<{ success: boolean; presetId?: string }> => {
  if (!userId) {
    throw new Error('User must be logged in to save presets');
  }

  try {
    const presetsRef = collection(db, 'presets');
    const presetRef = doc(presetsRef);
    
    const presetDoc = {
      userId,
      name,
      code,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(presetRef, presetDoc);

    return {
      success: true,
      presetId: presetRef.id,
    };
  } catch (error: any) {
    console.error('Error saving preset:', error);
    if (error.code === 'permission-denied') {
      throw new Error('Firestore permission denied. Please check your security rules.');
    }
    throw new Error(`Failed to save preset: ${error.message}`);
  }
};

// Get user's presets
export const getUserPresets = async (userId: string) => {
  try {
    const presetsRef = collection(db, 'presets');
    const presetQuery = query(
      presetsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(presetQuery);
    const presets = snapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      code: doc.data().code,
    }));

    return { success: true, presets };
  } catch (error: any) {
    console.error('Error fetching presets:', error);
    throw new Error(`Failed to fetch presets: ${error.message}`);
  }
};

// Delete a preset
export const deletePreset = async (presetId: string, userId: string): Promise<void> => {
  if (!userId) {
    throw new Error('User must be logged in to delete presets');
  }

  try {
    const presetRef = doc(db, 'presets', presetId);
    const presetDoc = await getDoc(presetRef);
    
    if (!presetDoc.exists()) {
      throw new Error('Preset not found');
    }

    const presetData = presetDoc.data();
    if (presetData.userId !== userId) {
      throw new Error('You can only delete your own presets');
    }

    await deleteDoc(presetRef);
  } catch (error: any) {
    console.error('Error deleting preset:', error);
    throw new Error(`Failed to delete preset: ${error.message}`);
  }
};

// Get user's tracks with latest versions
export const getUserTracks = async (userId: string) => {
  try {
    const songsRef = collection(db, 'songs');
    // Try to order by updatedAt, fall back to createdAt if index doesn't exist
    let snapshot;
    try {
      const songQuery = query(
        songsRef,
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc')
      );
      snapshot = await getDocs(songQuery);
    } catch (indexError: any) {
      // Fall back to createdAt if updatedAt index doesn't exist
      if (indexError?.code === 'failed-precondition') {
        const songQuery = query(
          songsRef,
          where('userId', '==', userId),
          orderBy('createdAt', 'desc')
        );
        snapshot = await getDocs(songQuery);
      } else {
        throw indexError;
      }
    }
    
    const songs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // For each song, get the latest version
    const tracksWithVersions = await Promise.all(
      songs.map(async (song) => {
        const versionsRef = collection(db, 'songVersions');
        const versionQuery = query(
          versionsRef,
          where('songId', '==', song.id),
          orderBy('versionNumber', 'desc'),
          limit(1)
        );

        const versionSnapshot = await getDocs(versionQuery);
        const latestVersion = versionSnapshot.empty 
          ? null 
          : {
              id: versionSnapshot.docs[0].id,
              ...versionSnapshot.docs[0].data(),
            };

        return {
          id: song.id,
          title: song.title || `Session ${new Date(song.createdAt?.toDate?.() || Date.now()).toLocaleDateString()}`,
          createdAt: song.createdAt,
          updatedAt: song.updatedAt,
          latestVersion: latestVersion ? {
            code: latestVersion.code,
            versionNumber: latestVersion.versionNumber,
            createdAt: latestVersion.createdAt,
          } : null,
        };
      })
    );

    return { success: true, tracks: tracksWithVersions };
  } catch (error: any) {
    console.error('Error fetching tracks:', error);
    throw new Error(`Failed to fetch tracks: ${error.message}`);
  }
};

// Update song title
export const updateSongTitle = async (songId: string, userId: string, newTitle: string): Promise<void> => {
  if (!userId) {
    throw new Error('User must be logged in to update songs');
  }

  try {
    const songRef = doc(db, 'songs', songId);
    const songDoc = await getDoc(songRef);
    
    if (!songDoc.exists()) {
      throw new Error('Song not found');
    }

    const songData = songDoc.data();
    if (songData.userId !== userId) {
      throw new Error('You can only update your own songs');
    }

    await updateDoc(songRef, {
      title: newTitle.trim(),
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    console.error('Error updating song title:', error);
    throw new Error(`Failed to update song title: ${error.message}`);
  }
};

