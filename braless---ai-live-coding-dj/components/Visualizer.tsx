import React, { useEffect, useRef, useState, useMemo } from 'react';

interface VisualizerProps {
  isPlaying: boolean;
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

const Visualizer: React.FC<VisualizerProps> = ({ isPlaying }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [time, setTime] = useState(0);
  const requestRef = useRef<number>();
  const [activeAmplitude, setActiveAmplitude] = useState(0);
  const targetAmplitudeRef = useRef(105);
  const transitionSpeed = 0.05; // How fast the transition happens (0-1, higher = faster)

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
    const animate = (t: number) => {
      // Only advance time when playing, but keep animation running for smooth transitions
      if (isPlaying) {
        setTime((prev) => prev + config.speed);
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

    for (let layer = 0; layer < layerCount; layer++) {
      let topPoints: string[] = [];
      let bottomPoints: string[] = [];

      const layerSpeedMult = 0.5 + (layer * 0.4);
      const layerDir = layer % 2 === 0 ? 1 : -1;
      const layerTime = time * layerSpeedMult * layerDir;
      const phaseOffset = layer * (Math.PI * 2 / 3) + 143;

      for (let i = 0; i <= resolution; i++) {
        const x = i * step;
        const waveX = (x / dimensions.width) * 10 * (config.frequency * 10);

        // Primary Carrier Wave
        const carrier = Math.sin(waveX + layerTime + phaseOffset);

        // Secondary Harmonic
        const harmonic = Math.sin(waveX * 2.3 - layerTime * 1.5 + layer) * 0.35;

        // Combined vertical displacement signal
        const displacementSignal = carrier + harmonic;

        // Apply active amplitude (smoothly transitions between 0 and full amplitude)
        const currentSpineY = centerY + (displacementSignal * currentAmplitude * 0.55);

        // Thickness calculation - also smoothly transitions
        const baseThickness = currentAmplitude * 0.25;
        const breathing = amplitudeRatio > 0.1 ? Math.cos(waveX * 0.8 + time * 2 + layer) * 0.15 : 0;
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
  }, [config, time, dimensions.width, dimensions.height, activeAmplitude]);

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