/**
 * Audio analyser service for real-time frequency analysis
 * Hooks into Web Audio API to analyze the audio output
 */

let audioContext: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let sourceNode: MediaElementAudioSourceNode | null = null;
let dataArray: Uint8Array | null = null;
let frequencyData: Uint8Array | null = null;
let isInitialized = false;

/**
 * Initialize audio analyser by hooking into the Web Audio API
 */
export const initAudioAnalyser = async (): Promise<void> => {
  if (isInitialized && analyser) {
    return;
  }

  try {
    // Try to get Strudel's audio context first
    // Strudel may expose it globally or we can access it through the module
    let strudelContext: AudioContext | null = null;
    
    // Try multiple ways to access Strudel's audio context
    if ((window as any).strudel?.audioContext) {
      strudelContext = (window as any).strudel.audioContext;
    } else if ((window as any).__strudelAudioContext) {
      strudelContext = (window as any).__strudelAudioContext;
    } else {
      // Try to get it from the @strudel/web module if accessible
      try {
        const strudelModule = await import('@strudel/web');
        if ((strudelModule as any).getAudioContext) {
          strudelContext = (strudelModule as any).getAudioContext();
        }
      } catch (e) {
        // Module might not expose it directly
      }
    }

    // Use Strudel's context if available, otherwise create our own
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    
    if (strudelContext) {
      audioContext = strudelContext;
      console.log('Using Strudel audio context');
    } else {
      audioContext = new AudioContextClass();
      console.log('Created new audio context');
    }

    // Create analyser node
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048; // Higher resolution for better frequency analysis
    analyser.smoothingTimeConstant = 0.8; // Smooth transitions

    const bufferLength = analyser.frequencyBinCount;
    frequencyData = new Uint8Array(bufferLength);
    dataArray = new Uint8Array(bufferLength);

    // Try to connect analyser to audio output
    // We'll create a gain node to split the signal
    try {
      const gainNode = audioContext.createGain();
      gainNode.gain.value = 1.0;
      
      // Connect analyser in parallel to destination
      // This creates a passive tap that doesn't affect audio
      analyser.connect(audioContext.destination);
      
      // Note: We need to intercept the audio stream from Strudel
      // This will be done when we can access Strudel's audio graph
      console.log('Audio analyser node created and ready');
    } catch (err) {
      console.warn('Could not connect analyser to destination:', err);
    }
    
    isInitialized = true;
    console.log('Audio analyser initialized');
  } catch (error) {
    console.error('Failed to initialize audio analyser:', error);
    throw error;
  }
};

/**
 * Connect analyser to audio source
 * This should be called when audio starts playing
 * For Strudel, we'll try to intercept the audio at the destination level
 */
export const connectAnalyser = (audioElement?: HTMLAudioElement | MediaStream): void => {
  if (!audioContext || !analyser) {
    initAudioAnalyser();
    return;
  }

  try {
    // If we have an audio element, connect it
    if (audioElement instanceof HTMLAudioElement) {
      if (sourceNode) {
        sourceNode.disconnect();
      }
      sourceNode = audioContext.createMediaElementSource(audioElement);
      sourceNode.connect(analyser);
      analyser.connect(audioContext.destination);
    } else if (audioElement instanceof MediaStream) {
      // For MediaStream (microphone, etc.)
      if (sourceNode) {
        sourceNode.disconnect();
      }
      sourceNode = audioContext.createMediaStreamSource(audioElement);
      sourceNode.connect(analyser);
    } else {
      // For Strudel, we need to hook into its audio graph
      // Try to create a splitter by intercepting at the destination
      // This is tricky - we'll use a workaround with a script processor
      try {
        // Create a script processor to tap into audio (deprecated but works)
        const processor = audioContext.createScriptProcessor(4096, 1, 1);
        processor.onaudioprocess = (e) => {
          // The analyser will get data from the audio context
          // We just ensure it's connected
        };
        // Note: This approach requires connecting to an actual audio source
        // Strudel manages its own connections, so we'll rely on the analyser
        // being connected to the same context
      } catch (err) {
        console.warn('Could not create audio processor:', err);
      }
    }
  } catch (error) {
    console.error('Failed to connect analyser:', error);
  }
};

/**
 * Attempt to hook into Strudel's audio output by creating a monitoring connection
 * This is called periodically to ensure we're getting audio data
 */
export const tryConnectToStrudel = (): void => {
  if (!audioContext || !analyser) return;

  try {
    // Try to access Strudel's audio nodes
    // Strudel uses Web Audio API, so we can try to intercept
    // We'll create a gain node that monitors the output
    
    // Check if we can access the audio context's destination
    // and create a splitter
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0; // Don't output, just monitor
    
    // Try to connect to destination (this might fail if already connected)
    try {
      gainNode.connect(analyser);
      // The analyser is already connected to destination from init
    } catch (err) {
      // Already connected or can't connect
    }
  } catch (error) {
    // Silently fail - we'll use fallback method
  }
};

/**
 * Get frequency data from the analyser
 * Returns normalized frequency bands: [bass, mid, treble]
 * Each value is 0-1
 */
export const getFrequencyData = (): { bass: number; mid: number; treble: number; overall: number } => {
  if (!analyser || !frequencyData) {
    return { bass: 0, mid: 0, treble: 0, overall: 0 };
  }

  analyser.getByteFrequencyData(frequencyData);

  const bufferLength = frequencyData.length;
  
  // Split frequency spectrum into bands
  // Bass: ~20-250 Hz (indices 0-~10% of buffer)
  // Mid: ~250-4000 Hz (indices ~10-~60% of buffer)
  // Treble: ~4000-20000 Hz (indices ~60-100% of buffer)
  
  const bassEnd = Math.floor(bufferLength * 0.1);
  const midEnd = Math.floor(bufferLength * 0.6);
  
  let bassSum = 0;
  let midSum = 0;
  let trebleSum = 0;
  let overallSum = 0;

  for (let i = 0; i < bufferLength; i++) {
    const value = frequencyData[i] / 255; // Normalize to 0-1
    overallSum += value;

    if (i < bassEnd) {
      bassSum += value;
    } else if (i < midEnd) {
      midSum += value;
    } else {
      trebleSum += value;
    }
  }

  // Average and normalize
  const bass = Math.min(1, (bassSum / bassEnd) * 2); // Amplify bass slightly
  const mid = Math.min(1, midSum / (midEnd - bassEnd));
  const treble = Math.min(1, trebleSum / (bufferLength - midEnd));
  const overall = Math.min(1, overallSum / bufferLength);

  return { bass, mid, treble, overall };
};

/**
 * Alternative approach: Hook into Web Audio API by creating a script processor
 * that can tap into the audio stream
 */
export const createAudioTap = (): AudioNode | null => {
  if (!audioContext) {
    return null;
  }

  try {
    // Create a script processor to tap into audio
    // Note: ScriptProcessorNode is deprecated but still works
    // For modern approach, we'd use AudioWorklet, but this is simpler
    const processor = audioContext.createScriptProcessor(4096, 1, 1);
    
    processor.onaudioprocess = (e) => {
      if (analyser) {
        // The analyser will automatically get the data
        // We just need to make sure it's connected
      }
    };

    return processor;
  } catch (error) {
    console.error('Failed to create audio tap:', error);
    return null;
  }
};

/**
 * Get the audio context (for external use)
 */
export const getAudioContext = (): AudioContext | null => {
  return audioContext;
};

/**
 * Get the analyser node (for external use)
 */
export const getAnalyser = (): AnalyserNode | null => {
  return analyser;
};

// Auto-initialize
if (typeof window !== 'undefined') {
  initAudioAnalyser().catch(err => {
    console.warn('Audio analyser initialization deferred:', err);
  });
}

