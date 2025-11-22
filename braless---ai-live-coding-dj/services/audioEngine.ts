/**
 * This is a lightweight simulation of an audio engine.
 * It parses the pseudo-Strudel code and schedules basic Web Audio sounds.
 * Real Strudel is much more complex, but this provides immediate feedback.
 */

let audioCtx: AudioContext | null = null;
let isPlaying = false;
let nextNoteTime = 0;
let timerID: number | null = null;
let activeOscillators: AudioNode[] = [];

// Initialize Audio Context
export const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
};

export const stopAudio = () => {
  isPlaying = false;
  if (timerID) window.clearTimeout(timerID);
  
  activeOscillators.forEach(node => {
    try {
      (node as any).stop?.();
      node.disconnect();
    } catch (e) { /* ignore */ }
  });
  activeOscillators = [];
};

// Helper to parse simple note patterns e.g., "c3 e3 g3"
const parseNotes = (pattern: string): { note: string, duration: number }[] => {
  // Remove quotes and simple cleanup
  const clean = pattern.replace(/["'()]/g, '');
  const tokens = clean.split(/\s+/);
  return tokens.map(t => ({ note: t, duration: 0.25 })); // Default 16th notes
};

// Simple frequency map
const noteToFreq = (note: string): number => {
  if (note === '.') return 0; // Rest
  const notes = ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b'];
  const octave = parseInt(note.slice(-1)) || 3;
  const key = note.slice(0, -1).toLowerCase();
  const index = notes.indexOf(key);
  if (index === -1) return 0; // Noise or drum
  
  // A4 = 440
  // Formula not perfect but works for demo
  const step = index + (octave - 4) * 12;
  return 440 * Math.pow(2, (step - 9) / 12);
};

const playTone = (freq: number, type: OscillatorType, time: number, duration: number, isDrum = false) => {
  if (!audioCtx) return;
  
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  if (isDrum || freq === 0) {
    // Noise burst simulation for drums/unrecognized notes
    osc.type = 'square'; // Rough approx
    gain.gain.setValueAtTime(0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
    osc.frequency.setValueAtTime(100, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.1);
  } else {
    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);
    gain.gain.setValueAtTime(0.2, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
  }

  osc.start(time);
  osc.stop(time + duration);
  
  activeOscillators.push(osc);
  activeOscillators.push(gain);
  
  // Cleanup
  setTimeout(() => {
    const idx = activeOscillators.indexOf(osc);
    if (idx > -1) activeOscillators.splice(idx, 1);
  }, (duration + 1) * 1000);
};

const scheduler = (code: string) => {
  if (!isPlaying || !audioCtx) return;

  while (nextNoteTime < audioCtx.currentTime + 0.1) {
    // Super basic parser execution
    // We look for lines starting with note("...")
    const lines = code.split('\n');
    lines.forEach((line, lineIdx) => {
      if (line.trim().startsWith('note(')) {
        const content = line.match(/note\("(.+?)"\)/);
        if (content && content[1]) {
          const sequence = parseNotes(content[1]);
          // Play one note from sequence based on time
          // This is a chaotic interpretation, playing random notes from the sequence to simulate a loop
          // A real sequencer would track index.
          
          const beatIndex = Math.floor(audioCtx!.currentTime * 4) % sequence.length;
          const item = sequence[beatIndex];
          
          let wave: OscillatorType = 'sine';
          if (line.includes('sawtooth')) wave = 'sawtooth';
          if (line.includes('square')) wave = 'square';
          if (line.includes('triangle')) wave = 'triangle';
          
          const freq = noteToFreq(item.note);
          // Stagger start slightly per line to avoid phasing
          playTone(freq, wave, nextNoteTime + (lineIdx * 0.01), 0.2, item.note === 'hh' || item.note === 'bd');
        }
      }
    });

    nextNoteTime += 0.25; // Advance 16th note
  }
  
  timerID = window.setTimeout(() => scheduler(code), 25);
};

export const runCode = (code: string) => {
  initAudio();
  if (isPlaying) {
    // Just update context, scheduler picks up new code implicitly if we pass it
    // But for this simple closure, we restart
    stopAudio();
  }
  
  isPlaying = true;
  nextNoteTime = audioCtx!.currentTime + 0.1;
  scheduler(code);
};