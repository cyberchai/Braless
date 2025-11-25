import { WaveConfig } from './types';

export const DEFAULT_CONFIG: WaveConfig = {
  spikeCount: 250, // High resolution for smooth curves
  amplitude: 150, // Increased amplitude for dramatic defined waves
  frequency: 0.025, // Lower frequency for elegant, readable curves
  speed: 0.01, // Relaxed speed
  // Pink to Orange gradient
  warmColors: ['#FF00CC', '#FF9900', '#FF3366', '#FFCC00'],
  // Blue to Purple gradient
  coolColors: ['#3333FF', '#9900FF', '#00CCFF', '#CC00FF'],
  strokeWidth: 1,
  opacity: 0.85,
  blendMode: 'screen',
};

export const BLEND_MODES = [
  'normal', 
  'multiply', 
  'screen', 
  'overlay', 
  'lighten', 
  'color-dodge', 
  'difference',
  'exclusion'
];