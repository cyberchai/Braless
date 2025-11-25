/**
 * Rhythm parser service
 * Extracts beat/rhythm information from Strudel code
 */

interface BeatPattern {
  beats: number[]; // Array of beat positions (0-1, normalized)
  bpm: number; // Estimated BPM
  patternLength: number; // Pattern length in beats
}

/**
 * Parse Strudel code to extract rhythm patterns
 * Looks for drum patterns (s() calls) and extracts beat positions
 */
export const parseRhythmFromCode = (code: string): BeatPattern => {
  const defaultPattern: BeatPattern = {
    beats: [0, 0.25, 0.5, 0.75], // Default 4/4 pattern
    bpm: 120,
    patternLength: 1
  };

  if (!code || !code.trim()) {
    return defaultPattern;
  }

  try {
    // Find all s() patterns (drum patterns)
    const sPatternRegex = /s\(["']([^"']+)["']\)/g;
    const matches = Array.from(code.matchAll(sPatternRegex));
    
    if (matches.length === 0) {
      // No drum patterns found, return default
      return defaultPattern;
    }

    // Extract the first drum pattern (usually the main rhythm)
    const firstPattern = matches[0][1];
    
    // Parse the pattern string to find beat positions
    // Patterns use spaces to separate events, '~' for rests
    const events = firstPattern.split(/\s+/).filter(e => e.trim() !== '');
    
    // Calculate beat positions
    const beats: number[] = [];
    let currentPosition = 0;
    const stepSize = 1 / events.length; // Normalize to 0-1 range
    
    events.forEach((event, index) => {
      // Skip rests
      if (event !== '~' && !event.startsWith('~')) {
        beats.push(currentPosition);
      }
      currentPosition += stepSize;
    });

    // If we found beats, use them; otherwise use default
    if (beats.length > 0) {
      // Normalize beats to 0-1 range
      const normalizedBeats = beats.map(b => b / currentPosition);
      
      // Estimate BPM (default 120, could be adjusted based on .slow() or .fast())
      // Strudel's default tempo is typically around 120 BPM
      let bpm = 120;
      
      // Check for .slow() or .fast() modifiers (these affect the whole pattern)
      if (code.includes('.slow(')) {
        const slowMatch = code.match(/\.slow\(([\d.]+)\)/);
        if (slowMatch) {
          const slowFactor = parseFloat(slowMatch[1]);
          bpm = 120 / slowFactor;
        }
      } else if (code.includes('.fast(')) {
        const fastMatch = code.match(/\.fast\(([\d.]+)\)/);
        if (fastMatch) {
          const fastFactor = parseFloat(fastMatch[1]);
          bpm = 120 * fastFactor;
        }
      }
      
      // Clamp BPM to reasonable range (60-180 BPM)
      bpm = Math.max(60, Math.min(180, bpm));

      return {
        beats: normalizedBeats,
        bpm,
        patternLength: 1
      };
    }
  } catch (error) {
    console.warn('Error parsing rhythm from code:', error);
  }

  return defaultPattern;
};

/**
 * Get current beat position based on time and BPM
 * Returns a value 0-1 indicating position in the beat cycle
 */
export const getBeatPosition = (time: number, bpm: number): number => {
  const beatDuration = 60 / bpm; // Duration of one beat in seconds
  const cycleTime = time % beatDuration;
  return cycleTime / beatDuration;
};

/**
 * Check if we're on a beat (within a threshold)
 */
export const isOnBeat = (beatPosition: number, beats: number[], threshold: number = 0.1): boolean => {
  return beats.some(beat => {
    const distance = Math.min(
      Math.abs(beatPosition - beat),
      Math.abs(beatPosition - (beat + 1)),
      Math.abs(beatPosition - (beat - 1))
    );
    return distance < threshold;
  });
};

/**
 * Get beat intensity (how close to a beat we are)
 * Returns 0-1, where 1 is exactly on a beat
 * Uses smoother falloff for less "crazy" response
 */
export const getBeatIntensity = (beatPosition: number, beats: number[]): number => {
  if (beats.length === 0) return 0;
  
  const minDistance = Math.min(
    ...beats.map(beat => {
      const d1 = Math.abs(beatPosition - beat);
      const d2 = Math.abs(beatPosition - (beat + 1));
      const d3 = Math.abs(beatPosition - (beat - 1));
      return Math.min(d1, d2, d3);
    })
  );
  
  // Convert distance to intensity (closer = higher intensity)
  // Use gentler falloff (reduced from 5 to 3) for smoother, less aggressive response
  // Also use a narrower window - only respond when very close to beat
  const window = 0.15; // Only respond within 15% of beat position
  if (minDistance > window) return 0;
  
  // Smooth exponential falloff
  const normalizedDistance = minDistance / window;
  return Math.max(0, 1 - (normalizedDistance * normalizedDistance * 2)); // Quadratic falloff for smoother curve
};

