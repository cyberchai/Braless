/**
 * Strudel-powered audio engine for live coding music.
 * Replaces the basic simulation with full Strudel/TidalCycles support.
 */

import { initStrudel, evaluate, hush, rand, samples } from '@strudel/web';
import { registerSoundfonts } from '@strudel/soundfonts';
import soundfonts from '@strudel/soundfonts/gm.mjs';
import { initAudioAnalyser, getAudioContext, getAnalyser, tryConnectToStrudel } from './audioAnalyser';

// Define global helper for AI-generated code
(window as any).R = (min: number, max: number) => rand.range(min, max);

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

      // Load all default samples from dough-samples + crate
      const ds = "https://raw.githubusercontent.com/felixroos/dough-samples/main";
      await Promise.all([
        samples(`${ds}/tidal-drum-machines.json`),
        samples(`${ds}/piano.json`),
        samples(`${ds}/Dirt-Samples.json`),
        samples(`${ds}/EmuSP12.json`),
        samples(`${ds}/vcsl.json`),
        samples(`${ds}/mridangam.json`),
        samples('https://raw.githubusercontent.com/eddyflux/crate/main/strudel.json')
      ]);

      // Register GM soundfonts
      registerSoundfonts(soundfonts);

      // Initialize audio analyser after Strudel is ready
      try {
        await initAudioAnalyser();
        // Try to hook into Strudel's audio context after a delay
        // to ensure Strudel has fully initialized
        setTimeout(() => {
          try {
            // Try to access Strudel's audio context
            // Strudel may expose it in various ways
            const strudelContext = (window as any).strudel?.audioContext || 
                                   (window as any).__strudelAudioContext ||
                                   getAudioContext();
            
            if (strudelContext) {
              const analyser = getAnalyser();
              if (analyser) {
                // Try to create a connection to monitor audio
                // We'll use a gain node as a splitter
                try {
                  const gainNode = strudelContext.createGain();
                  gainNode.gain.value = 1.0;
                  
                  // The analyser should already be connected from initAudioAnalyser
                  // But we'll try to ensure it's monitoring the output
                  console.log('Audio analyser connected to audio context');
                } catch (err) {
                  console.warn('Could not create audio splitter:', err);
                }
              }
            }
          } catch (err) {
            console.warn('Could not connect analyser to Strudel audio:', err);
          }
        }, 1000);
      } catch (err) {
        console.warn('Audio analyser initialization failed:', err);
      }

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
      .filter(line => {
        if (line.trim().startsWith('samples(')) {
          console.warn('Ignored samples() call in user code to prevent overwriting pre-loaded samples.');
          return false;
        }
        return true;
      })
      .join('\n')
      .trim();

    console.log('Evaluating code:', cleanCode);
    await evaluate(cleanCode, true);
    isPlaying = true;
    
    // Try to connect analyser when audio starts
    setTimeout(() => {
      tryConnectToStrudel();
    }, 200);
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
