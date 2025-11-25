import React, { useEffect, useRef, useState, useMemo } from 'react';
import { getFrequencyData, initAudioAnalyser } from '../services/audioAnalyser';
import { parseRhythmFromCode, getBeatIntensity } from '../services/rhythmParser';

interface VisualizerProps {
  isPlaying: boolean;
  code: string;
}

interface WaveConfig {
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

const Visualizer: React.FC<VisualizerProps> = ({ isPlaying, code }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [time, setTime] = useState(0);
  const requestRef = useRef<number>();
  const [activeAmplitude, setActiveAmplitude] = useState(0);
  const targetAmplitudeRef = useRef(105);
  const transitionSpeed = 0.05; // How fast the transition happens (0-1, higher = faster)
  const [frequencyData, setFrequencyData] = useState({ bass: 0, mid: 0, treble: 0, overall: 0 });
  const [beatIntensity, setBeatIntensity] = useState(0);
  const rhythmPatternRef = useRef(parseRhythmFromCode(code));
  const startTimeRef = useRef<number>(0);
  
  // Initialize audio analyser on mount
  useEffect(() => {
    initAudioAnalyser().catch(err => {
      console.warn('Audio analyser init failed:', err);
    });
  }, []);

  // Parse rhythm from code when code changes
  useEffect(() => {
    rhythmPatternRef.current = parseRhythmFromCode(code);
    if (isPlaying) {
      startTimeRef.current = performance.now() / 1000; // Reset start time when code changes
    }
  }, [code, isPlaying]);

  // Configuration as specified
  const config: WaveConfig = useMemo(() => ({
    spikeCount: 228, // Complexity
    amplitude: 105,
    frequency: 0.056,
    speed: isPlaying ? 0.02 : 0, // Variable speed based on playing state
    warmColors: ['#FF00CC', '#FF9900', '#FF3366', '#FFCC00'],
    coolColors: ['#3333FF', '#9900FF', '#00CCFF', '#CC00FF'],
    strokeWidth: 1,
    opacity: 1.0,
    blendMode: 'screen',
  }), [isPlaying]);

  // Update target amplitude when playing state changes
  useEffect(() => {
    targetAmplitudeRef.current = isPlaying ? 105 : 0;
  }, [isPlaying]);

  // Update dimensions when container size changes
  useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    updateDimensions();
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  // Animation loop - continue running even when stopped to allow flatline transition
  useEffect(() => {
    if (isPlaying && startTimeRef.current === 0) {
      startTimeRef.current = performance.now() / 1000;
    }

    const animate = (t: number) => {
      // Get frequency data from audio analyser
      if (isPlaying) {
        const freqData = getFrequencyData();
        setFrequencyData(freqData);
        
        // Calculate beat position based on elapsed time and BPM
        // Use a more stable timing approach
        const currentTime = performance.now() / 1000;
        const elapsedTime = currentTime - startTimeRef.current;
        
        // Add small offset to account for audio latency (typically 50-100ms)
        const audioLatencyOffset = 0.08; // 80ms offset to sync with audio
        const adjustedElapsedTime = elapsedTime + audioLatencyOffset;
        
        // Calculate beat duration - use pattern length to determine full cycle
        // Most patterns are 1 bar (4 beats), so we'll use that as default
        const beatsPerBar = 4;
        const barDuration = (60 / rhythmPatternRef.current.bpm) * beatsPerBar; // Duration of one bar in seconds
        const beatDuration = 60 / rhythmPatternRef.current.bpm; // Duration of one beat in seconds
        
        // Calculate position within the bar (0-1)
        const barPosition = (adjustedElapsedTime % barDuration) / barDuration;
        
        // Get beat intensity (how close we are to a beat)
        // Use a smoothed version to reduce jitter
        const rawIntensity = getBeatIntensity(barPosition, rhythmPatternRef.current.beats);
        
        // Smooth the intensity to reduce "crazy" jumps
        setBeatIntensity(prev => {
          const smoothing = 0.3; // How much to blend with previous value (0-1)
          return prev * smoothing + rawIntensity * (1 - smoothing);
        });
        
        // Advance time based on overall energy (more energy = faster animation)
        const speedMultiplier = 0.5 + (freqData.overall * 1.5); // 0.5x to 2x speed
        setTime((prev) => prev + config.speed * speedMultiplier);
      } else {
        // When stopped, gradually reduce frequency data and beat intensity
        setFrequencyData(prev => ({
          bass: prev.bass * 0.95,
          mid: prev.mid * 0.95,
          treble: prev.treble * 0.95,
          overall: prev.overall * 0.95
        }));
        setBeatIntensity(prev => prev * 0.95);
        startTimeRef.current = 0; // Reset start time
      }
      
      // Smoothly interpolate active amplitude towards target
      setActiveAmplitude((prev) => {
        const target = targetAmplitudeRef.current;
        const diff = target - prev;
        // Use smooth easing - the closer we get, the slower we approach
        const easeFactor = Math.abs(diff) < 0.1 ? diff : diff * transitionSpeed;
        return prev + easeFactor;
      });
      
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [config.speed, isPlaying]);

  // Generate 3 layers of smooth paths with smooth amplitude transition
  const layers = useMemo(() => {
    const generatedLayers = [];
    const layerCount = 3;
    const centerY = dimensions.height / 2;
    const resolution = Math.max(50, config.spikeCount);
    const step = dimensions.width / resolution;

    // Use activeAmplitude for smooth transitions (0 = flat, 105 = full waves)
    const currentAmplitude = activeAmplitude;
    const amplitudeRatio = currentAmplitude / config.amplitude; // 0 to 1

    // Map each layer to a different frequency band
    // Layer 0: Rhythm (follows beat pattern from code)
    // Layer 1: Mid (mid frequencies)
    // Layer 2: Treble (high frequencies)
    const frequencyBands = [
      frequencyData.bass, // Layer 0 uses bass but also responds to rhythm
      frequencyData.mid,
      frequencyData.treble
    ];

    for (let layer = 0; layer < layerCount; layer++) {
      let topPoints: string[] = [];
      let bottomPoints: string[] = [];

      // Get the frequency response for this layer
      const layerFrequency = frequencyBands[layer] || 0;
      
      // Layer 0 follows the rhythm/beat pattern
      let rhythmMultiplier = 1;
      let rhythmAmplitudeBoost = 1;
      if (layer === 0) {
        // Pulse on beats - more subtle response (reduced from 0.8/0.6 to 0.3/0.25)
        rhythmMultiplier = 1 + (beatIntensity * 0.3); // 1x to 1.3x speed on beat (was 1.8x)
        rhythmAmplitudeBoost = 1 + (beatIntensity * 0.25); // 1x to 1.25x amplitude on beat (was 1.6x)
      }
      
      // Modulate speed based on frequency response and rhythm
      const layerSpeedMult = 0.5 + (layer * 0.4);
      const frequencySpeedBoost = 1 + (layerFrequency * 0.5); // 1x to 1.5x speed boost
      const layerDir = layer % 2 === 0 ? 1 : -1;
      const layerTime = time * layerSpeedMult * layerDir * frequencySpeedBoost * rhythmMultiplier;
      const phaseOffset = layer * (Math.PI * 2 / 3) + 143;

      // Modulate amplitude based on frequency response and rhythm
      const frequencyAmplitudeMultiplier = 0.7 + (layerFrequency * 0.6); // 0.7x to 1.3x amplitude
      const layerAmplitude = currentAmplitude * frequencyAmplitudeMultiplier * rhythmAmplitudeBoost;

      for (let i = 0; i <= resolution; i++) {
        const x = i * step;
        const waveX = (x / dimensions.width) * 10 * (config.frequency * 10);

        // Primary Carrier Wave - add frequency-based and rhythm-based modulation
        const frequencyModulation = layerFrequency * Math.sin(waveX * 0.5 + time * 3);
        let rhythmModulation = 0;
        if (layer === 0) {
          // Layer 0 pulses with the beat - more subtle modulation (reduced from 0.4 to 0.2)
          rhythmModulation = beatIntensity * Math.sin(waveX * 1.5 + time * 3) * 0.2;
        }
        const carrier = Math.sin(waveX + layerTime + phaseOffset + frequencyModulation * 0.3 + rhythmModulation);

        // Secondary Harmonic - also respond to frequency and rhythm
        const harmonicModulation = layerFrequency * Math.cos(waveX * 1.2 - time * 2);
        let harmonicRhythmMod = 0;
        if (layer === 0) {
          // More subtle rhythm modulation (reduced from 0.3 to 0.15)
          harmonicRhythmMod = beatIntensity * Math.cos(waveX * 1.2 - time * 2.5) * 0.15;
        }
        const harmonic = Math.sin(waveX * 2.3 - layerTime * 1.5 + layer + harmonicModulation * 0.2 + harmonicRhythmMod) * 0.35;

        // Combined vertical displacement signal
        const displacementSignal = carrier + harmonic;

        // Apply layer-specific amplitude (modulated by frequency response)
        const currentSpineY = centerY + (displacementSignal * layerAmplitude * 0.55);

        // Thickness calculation - respond to frequency and rhythm
        const baseThickness = layerAmplitude * 0.25;
        const frequencyBreathing = layerFrequency * Math.cos(waveX * 0.8 + time * 2 + layer) * 0.2;
        let rhythmBreathing = 0;
        if (layer === 0) {
          // Layer 0 thickness pulses with beats - more subtle (reduced from 0.25 to 0.15)
          rhythmBreathing = beatIntensity * Math.cos(waveX * 1.0 + time * 2.5) * 0.15;
        }
        const breathing = amplitudeRatio > 0.1 ? Math.cos(waveX * 0.8 + time * 2 + layer) * 0.15 + frequencyBreathing + rhythmBreathing : 0;
        const currentThickness = Math.max(1, baseThickness * (1 + breathing * amplitudeRatio));

        // Point generation
        const yTop = currentSpineY - currentThickness;
        const yBottom = currentSpineY + currentThickness;

        topPoints.push(`${x.toFixed(1)},${yTop.toFixed(1)}`);
        bottomPoints.unshift(`${x.toFixed(1)},${yBottom.toFixed(1)}`);
      }

      // Construct continuous ribbon path
      const d = `M ${topPoints[0]} L ${topPoints.join(' L ')} L ${bottomPoints[0]} L ${bottomPoints.join(' L ')} Z`;

      generatedLayers.push({
        id: layer,
        path: d,
        gradientId: `waveGradient-${layer}`
      });
    }
    return generatedLayers;
  }, [config, time, dimensions.width, dimensions.height, activeAmplitude, frequencyData, beatIntensity]);

  // Create gradient definitions
  const gradients = useMemo(() => {
    return [
      { id: 'waveGradient-0', colors: config.warmColors, transform: 'rotate(0)' },
      { id: 'waveGradient-1', colors: config.coolColors, transform: 'rotate(90)' },
      { id: 'waveGradient-2', colors: [...config.warmColors].reverse(), transform: 'rotate(45)' },
    ];
  }, [config.warmColors, config.coolColors]);

  return (
    <div 
      ref={containerRef}
      className="w-full h-48 bg-zinc-900/50 rounded-lg overflow-hidden border border-zinc-800 shadow-inner relative shadow-[0_0_30px_rgba(139,92,246,0.2),0_0_15px_rgba(139,92,246,0.1)] ring-1 ring-purple-500/20"
    >
      <div className="absolute top-2 left-2 text-xs text-zinc-500 uppercase font-mono tracking-widest z-10">
          Visualizer Output
       </div>
      {dimensions.width > 0 && dimensions.height > 0 && (
        <svg 
          width={dimensions.width} 
          height={dimensions.height} 
          className="w-full h-full block"
          style={{ filter: 'drop-shadow(0px 0px 20px rgba(0,0,0,0.3))' }}
        >
          <defs>
            {gradients.map((g) => (
              <linearGradient 
                key={g.id} 
                id={g.id} 
                x1="0%" y1="0%" x2="100%" y2="0%"
                gradientTransform={g.transform}
              >
                {g.colors.map((c, idx) => (
                  <stop 
                    key={idx} 
                    offset={`${(idx / (g.colors.length - 1)) * 100}%`} 
                    stopColor={c} 
                  />
                ))}
              </linearGradient>
            ))}
          </defs>
          
          <g style={{ mixBlendMode: config.blendMode as any }}>
            {layers.map((layer, index) => (
              <path
                key={layer.id}
                d={layer.path}
                fill={`url(#${layer.gradientId})`}
                fillOpacity={config.opacity}
                stroke={`url(#${layer.gradientId})`}
                strokeWidth={1}
                strokeOpacity={0.8}
                style={{ 
                  mixBlendMode: index === 1 ? 'screen' : 'normal',
                }}
              />
            ))}
          </g>
        </svg>
      )}
    </div>
  );
};

export default Visualizer;