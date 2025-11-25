export interface WaveConfig {
  spikeCount: number;
  amplitude: number;
  frequency: number;
  speed: number;
  warmColors: string[];
  coolColors: string[];
  strokeWidth: number;
  opacity: number;
  blendMode: 'normal' | 'multiply' | 'screen' | 'overlay' | 'lighten';
}

export interface PromptInput {
  description: string;
}

export enum GenerationStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}