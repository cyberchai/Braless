import { Agent, CodeSnippet } from './types';

export const INITIAL_CODE = `note('c e a').s('sawtooth')`;

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
    code: `stack(
  note('c2 c2 ~ c2').s('square').lpf(400),
  s('bd hh sd hh')
)`
  },
  {
    name: 'Ambient Pad',
    code: `note('c3 e3 g3 b3').s('triangle').attack(0.5).release(2).room(0.8)`
  },
  {
    name: 'Acid Bass',
    code: `note('c2 c3 c2 ~').s('sawtooth').lpf(sine.range(200, 2000)).resonance(10)`
  }
];