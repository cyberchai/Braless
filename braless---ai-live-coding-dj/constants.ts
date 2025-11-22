import { Agent, CodeSnippet } from './types';

export const INITIAL_CODE = `// Welcome to Braless
// Live coding environment
// Shift+Enter to run

note("c3 e3 g3 b3")
  .s("sawtooth")
  .lpf(500)
  .room(1)
  .clip(1)
  
note("c2 . . g2")
  .s("sine")
  .gain(1.5)
`;

export const AGENTS: Agent[] = [
  {
    id: 'rhythm-droid',
    name: 'Rhythm Droid',
    role: 'Percussionist',
    description: 'Generates drum patterns and rhythmic textures.',
    avatarColor: 'emerald',
  },
  {
    id: 'melody-maker',
    name: 'Melody Maker',
    role: 'Lead Synth',
    description: 'Creates melodic hooks and harmonies.',
    avatarColor: 'fuchsia',
  },
  {
    id: 'chaos-engine',
    name: 'The Glitch',
    role: 'FX Specialist',
    description: 'Applies distortion, time-stretching, and randomization.',
    avatarColor: 'rose',
  },
];

export const PRESETS: CodeSnippet[] = [
  {
    name: 'Basic Techno',
    code: `note("c2 c2 . c2")
  .s("square")
  .cutoff(400)

note("hh hh oh hh")
  .s("noise")
  .decay(0.1)`
  },
  {
    name: 'Ambient Pad',
    code: `note("c3 e3 g3 b3")
  .s("triangle")
  .attack(0.5)
  .release(2)
  .reverb(0.8)`
  },
  {
    name: 'Acid Bass',
    code: `note("c2 c3 c2 .")
  .s("sawtooth")
  .filter(env().mul(1000))
  .resonance(10)`
  }
];