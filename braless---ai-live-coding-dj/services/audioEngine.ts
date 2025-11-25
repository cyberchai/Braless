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

      // Expose samples function globally so it's available in user code
      (window as any).samples = samples;

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
 * Extract and execute samples() calls from code
 * Returns the code with samples() calls removed and executes them first
 * Handles multi-line calls with object literals and multiple arguments
 */
const extractAndExecuteSamples = async (code: string): Promise<string> => {
  const samplesCalls: Array<{ call: string; start: number; end: number }> = [];
  
  // Find all samples() calls by tracking balanced parentheses
  // This handles multi-line calls with object literals
  const samplesRegex = /(?:await\s+)?samples\s*\(/g;
  let match;
  
  while ((match = samplesRegex.exec(code)) !== null) {
    const startPos = match.index;
    const afterSamples = startPos + match[0].length;
    
    // Track parentheses to find the matching closing paren
    let depth = 1;
    let pos = afterSamples;
    let inString = false;
    let stringChar = '';
    let escaped = false;
    
    while (pos < code.length && depth > 0) {
      const char = code[pos];
      
      if (escaped) {
        escaped = false;
        pos++;
        continue;
      }
      
      if (char === '\\') {
        escaped = true;
        pos++;
        continue;
      }
      
      if (!inString && (char === '"' || char === "'" || char === '`')) {
        inString = true;
        stringChar = char;
      } else if (inString && char === stringChar) {
        inString = false;
        stringChar = '';
      } else if (!inString) {
        if (char === '(') {
          depth++;
        } else if (char === ')') {
          depth--;
        }
      }
      
      pos++;
    }
    
    if (depth === 0) {
      // Found complete samples() call
      const fullCall = code.substring(startPos, pos).trim();
      samplesCalls.push({ call: fullCall, start: startPos, end: pos });
    }
  }
  
  // Execute all samples() calls first
  if (samplesCalls.length > 0) {
    console.log('Loading samples:', samplesCalls.map(s => s.call));
    try {
      for (const { call } of samplesCalls) {
        // Remove 'await' if present since we're already in an async context
        const callWithoutAwait = call.replace(/^await\s+/, '');
        // Execute in global context with samples function available
        const func = new Function('samples', `return ${callWithoutAwait}`);
        await func(samples);
      }
      console.log('Samples loaded successfully');
    } catch (error) {
      console.error('Error loading samples:', error);
      // Continue anyway - the samples might still work
    }
    
    // Remove all samples() calls from code (in reverse order to preserve indices)
    let cleanedCode = code;
    for (let i = samplesCalls.length - 1; i >= 0; i--) {
      const { start, end } = samplesCalls[i];
      const before = cleanedCode.substring(0, start);
      let after = cleanedCode.substring(end);
      
      // Remove trailing semicolon and whitespace
      while (after.length > 0 && /[\s;]/.test(after[0])) {
        after = after.substring(1);
      }
      
      // Remove newline if the call was on its own line
      if (after.length > 0 && after[0] === '\n') {
        after = after.substring(1);
      }
      
      cleanedCode = before + after;
    }
    
    return cleanedCode.trim();
  }
  
  // No samples calls found, return code as-is
  return code.trim();
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
    // Note: samples() calls are now allowed - they will add to the existing sample library
    const codeWithoutComments = trimmedCode
      .split('\n')
      .filter(line => !line.trim().startsWith('//'))
      .join('\n')
      .trim();

    // Extract and execute samples() calls first, then get the remaining code
    let cleanCode = await extractAndExecuteSamples(codeWithoutComments);

    if (!cleanCode) {
      // If only samples() calls were in the code, that's fine
      console.log('Code only contained samples() calls - samples loaded');
      return;
    }

    // Remove ._scope() calls - they're for visualization only, not audio
    // This handles both single-line and multi-line ._scope() calls
    cleanCode = cleanCode
      .replace(/\._scope\(\)/g, '') // Remove ._scope() calls
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Clean up extra blank lines
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
