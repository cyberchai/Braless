/**
 * Strudel-powered audio engine for live coding music.
 * Replaces the basic simulation with full Strudel/TidalCycles support.
 */

import { initStrudel, evaluate, hush } from '@strudel/web';

let isInitialized = false;
let isPlaying = false;

/**
 * Initialize Strudel (async, call once on app start)
 */
export const initAudio = async () => {
  if (isInitialized) {
    return;
  }
  
  try {
    await initStrudel();
    isInitialized = true;
    console.log('Strudel audio engine initialized');
  } catch (error) {
    console.error('Failed to initialize Strudel:', error);
    throw error;
  }
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
  
  try {
    // Evaluate the code - Strudel will handle scheduling and playback
    // The evaluate function automatically plays patterns
    const trimmedCode = code.trim();
    if (!trimmedCode) {
      throw new Error('Empty code provided');
    }
    await evaluate(trimmedCode, true);
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
