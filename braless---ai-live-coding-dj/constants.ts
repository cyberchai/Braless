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
  {
    id: 'music-theory',
    name: 'Music Theory Agent',
    role: 'Music Theorist',
    description: 'Detects key, evaluates harmony, validates rhythm. Old academic energy but unhinged underneath.',
    avatarColor: 'amber',
  },
  {
    id: 'mixer-frat',
    name: 'Mixer / Mr. Frat',
    role: 'Vibes Maximizer',
    description: 'DJ mixing engineer. Adjusts volume, panning, brightness. Adds transitions, drops, builds. Absolutely frat energy.',
    avatarColor: 'cyan',
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
  },
  {
    name: 'German Fall',
    code:`stack(
// drums
s("bd,[~ <sd!3 sd(3,4,2)>],hh*8")
.speed(perlin.range(.8,.9)), // random sample speed variation
// bassline
"<a1 b1*2 a1(3,8) e2>" 
.off(1/8,x=>x.add(12).degradeBy(.5)) // random octave jumps
.add(perlin.range(0,.5)) // random pitch variation
.superimpose(add(.05)) // add second, slightly detuned voice
.note() // wrap in "note"
.decay(.15).sustain(0) // make each note of equal length
.s('sawtooth') // waveform
.gain(.4) // turn down
.cutoff(sine.slow(7).range(300,5000)), // automate cutoff
// chords
"<Am7!3 <Em7 E7b13 Em7 Ebm7b5>>".voicings('lefthand') 
.superimpose(x=>x.add(.04)) // add second, slightly detuned voice
.add(perlin.range(0,.5)) // random pitch variation
.note() // wrap in "note"
.s('sawtooth') // waveform
.gain(.16) // turn down
.cutoff(500) // fixed cutoff
.attack(1) // slowly fade in
)
.slow(3/2)`
  },
  {
    name: 'Jazz Wash',
    code: `sound("jazz:0 jazz:1 [jazz:4 jazz:2] jazz:3*2")`
  }
];