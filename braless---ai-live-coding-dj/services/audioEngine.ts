/**
 * Strudel-powered audio engine for live coding music.
 * Replaces the basic simulation with full Strudel/TidalCycles support.
 */

import { initStrudel, evaluate, hush } from '@strudel/web';

let isInitialized = false;
let isPlaying = false;
let initPromise: Promise<void> | null = null;

/**
 * Initialize Strudel (async, call once on app start)
 */
export const initAudio = async () => {
  if (isInitialized) {
    return;
  }
  
  if (initPromise) {
    await initPromise;
    return;
  }
  
  initPromise = (async () => {
    try {
      await initStrudel();
      isInitialized = true;
      console.log('Strudel audio engine initialized');
    } catch (error) {
      console.error('Failed to initialize Strudel:', error);
      initPromise = null;
      throw error;
    }
  })();
  
  await initPromise;
};

/**
 * Stop all audio playback
 */
export const stopAudio = () => {
  try {
    hush();
    isPlaying = false;
  } catch (error) {
    console.error('Error stopping audio:', error);
  }
};

/**
 * Run/evaluate Strudel code
 * This will start or update the live coding session
 */
export const runCode = async (code: string) => {
  // Ensure Strudel is initialized
  if (!isInitialized) {
    await initAudio();
  }
  
  // Wait a bit to ensure everything is ready
  await new Promise(resolve => setTimeout(resolve, 100));
  
  try {
    // Evaluate the code - Strudel will handle scheduling and playback
    // The evaluate function automatically plays patterns
    const trimmedCode = code.trim();
    if (!trimmedCode) {
      throw new Error('Empty code provided');
    }
    
    // Remove comments and clean up the code
    const cleanCode = trimmedCode
      .split('\n')
      .filter(line => !line.trim().startsWith('//'))
      .join('\n')
      .trim();
    
    console.log('Evaluating code:', cleanCode);
    await evaluate(cleanCode, true);
    isPlaying = true;
  } catch (error) {
    console.error('Error running code:', error);
    isPlaying = false;
    // Re-throw so the UI can handle it
    throw error;
  }
};

// Auto-initialize on module load (non-blocking)
initAudio().catch(err => {
  console.warn('Strudel initialization deferred:', err);
});
