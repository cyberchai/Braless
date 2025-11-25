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

/**
 * Scope pattern interface
 */
export interface ScopePattern {
  sequence: number[]; // Sequence of values (0-1 normalized)
  speed: number; // Speed multiplier from .fast() or .slow()
  patternLength: number; // Length of pattern in beats
}

/**
 * Parse ._scope() pattern from Strudel code
 * Extracts the pattern that comes before ._scope() and parses it
 * Works even if ._scope() has been stripped from the code (for audio)
 */
export const parseScopePattern = (code: string): ScopePattern | null => {
  // Look for ._scope() or try to find scope patterns even if ._scope() was removed
  // We'll look for patterns that typically use ._scope() - patterns with .n() and note()
  const hasScopeMarker = code.includes('._scope()');
  const hasScopePattern = code.includes('.n(') && (code.includes('note(') || code.includes('s('));
  
  if (!code || (!hasScopeMarker && !hasScopePattern)) {
    return null;
  }

  try {
    // Find the pattern before ._scope() or use the entire relevant pattern
    let patternCode: string;
    
    if (hasScopeMarker) {
      const scopeMatch = code.match(/([\s\S]*?)\._scope\(\)/);
      if (scopeMatch) {
        patternCode = scopeMatch[1].trim();
      } else {
        // Fallback: look for the last pattern before ._scope()
        const lastScopeIndex = code.lastIndexOf('._scope()');
        patternCode = code.substring(0, lastScopeIndex).trim();
      }
    } else {
      // No ._scope() marker, but we found a scope-like pattern
      // Extract the pattern that contains .n()
      const nMatch = code.match(/([\s\S]*?\.n\([^)]+\)[\s\S]*?)(?:\n\n|\n\s*$|$)/);
      if (nMatch) {
        patternCode = nMatch[1].trim();
      } else {
        // Fallback: use code up to .n() pattern
        const nIndex = code.indexOf('.n(');
        if (nIndex > 0) {
          // Find the start of the pattern (look backwards for note( or s()
          let startIndex = 0;
          const noteMatch = code.substring(0, nIndex).match(/(note\(|s\()[\s\S]*$/);
          if (noteMatch) {
            startIndex = code.substring(0, nIndex).lastIndexOf(noteMatch[1]);
          }
          patternCode = code.substring(startIndex, code.length).trim();
        } else {
          return null;
        }
      }
    }
    
    // Extract .n() pattern which defines the sequence
    // Example: .n("<1 2 3 4 5 6 7 8 9 10>/2")
    const nPatternMatch = patternCode.match(/\.n\(["']([^"']+)["']\)/);
    
    let sequence: number[] = [];
    let speed = 1;
    let patternLength = 1;

    if (nPatternMatch) {
      const nPattern = nPatternMatch[1];
      
      // Parse the pattern - handle different formats
      // Format: "<1 2 3 4 5 6 7 8 9 10>/2" or "1 2 3 4 5"
      let patternString = nPattern;
      
      // Remove angle brackets if present
      patternString = patternString.replace(/^<|>$/g, '');
      
      // Handle division (e.g., "/2" means divide by 2)
      let divisor = 1;
      if (patternString.includes('/')) {
        const parts = patternString.split('/');
        patternString = parts[0];
        divisor = parseFloat(parts[1]) || 1;
      }
      
      // Extract numbers from the pattern
      const numbers = patternString.match(/[\d.]+/g);
      if (numbers) {
        // Convert to numbers and normalize to 0-1 range
        const maxValue = Math.max(...numbers.map(n => parseFloat(n)));
        sequence = numbers.map(n => parseFloat(n) / maxValue / divisor);
        patternLength = sequence.length;
      }
    } else {
      // If no .n() pattern, create a default sequence based on note pattern
      // Look for note patterns like note("<[g3,b3,e4]!2 [a3,c3,e4] [b3,d3,f#4]>")
      const noteMatch = patternCode.match(/note\(["']([^"']+)["']\)/);
      if (noteMatch) {
        const notePattern = noteMatch[1];
        // Count note groups (separated by spaces or brackets)
        const noteGroups = notePattern.match(/\[[^\]]+\]|[^\s\[\]]+/g) || [];
        patternLength = noteGroups.length;
        // Create a sequence that pulses on each note group
        sequence = Array.from({ length: patternLength }, (_, i) => i / patternLength);
      } else {
        // Default sequence
        sequence = [0, 0.25, 0.5, 0.75];
        patternLength = 4;
      }
    }

    // Extract speed from .fast() or .slow()
    if (patternCode.includes('.fast(')) {
      const fastMatch = patternCode.match(/\.fast\(([\d.]+)\)/);
      if (fastMatch) {
        speed = parseFloat(fastMatch[1]);
      }
    } else if (patternCode.includes('.slow(')) {
      const slowMatch = patternCode.match(/\.slow\(([\d.]+)\)/);
      if (slowMatch) {
        speed = 1 / parseFloat(slowMatch[1]);
      }
    }

    return {
      sequence,
      speed,
      patternLength
    };
  } catch (error) {
    console.warn('Error parsing scope pattern:', error);
    return null;
  }
};

/**
 * Get scope pattern intensity at a given position
 * Returns the value from the sequence at the current position
 */
export const getScopeIntensity = (position: number, pattern: ScopePattern): number => {
  if (!pattern || pattern.sequence.length === 0) {
    return 0;
  }

  // Calculate which index in the sequence we're at
  const normalizedPosition = (position * pattern.speed) % 1;
  const index = Math.floor(normalizedPosition * pattern.sequence.length);
  const nextIndex = (index + 1) % pattern.sequence.length;
  
  // Interpolate between current and next value for smooth transitions
  const localPosition = (normalizedPosition * pattern.sequence.length) % 1;
  const currentValue = pattern.sequence[index];
  const nextValue = pattern.sequence[nextIndex];
  
  return currentValue + (nextValue - currentValue) * localPosition;
};

