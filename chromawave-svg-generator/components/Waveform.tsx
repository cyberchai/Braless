import React, { useEffect, useRef, useState, useMemo } from 'react';
import { WaveConfig } from '../types';

interface WaveformProps {
  config: WaveConfig;
  width: number;
  height: number;
}

export const Waveform: React.FC<WaveformProps> = ({ config, width, height }) => {
  const [time, setTime] = useState(0);
  const requestRef = useRef<number>();

  const animate = (t: number) => {
    setTime((prev) => prev + config.speed);
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [config.speed]);

  // Generate 3 layers of smooth paths
  const layers = useMemo(() => {
    const generatedLayers = [];
    const layerCount = 3;
    const centerY = height / 2;
    const resolution = Math.max(50, config.spikeCount); // Ensure high resolution for curves
    const step = width / resolution;

    // Scale factor for x-axis to make frequency control intuitive.
    // 0.02 frequency ~ 2-3 waves across screen
    const spatialFactor = config.frequency * 80; 

    for (let layer = 0; layer < layerCount; layer++) {
      let topPoints: string[] = [];
      let bottomPoints: string[] = [];

      // Distinct physics for each layer to make them independent
      // Layer 0: Slow, background, heavy
      // Layer 1: Medium, main focus
      // Layer 2: Fast, accent, erratic
      const layerSpeedMult = 0.5 + (layer * 0.4); 
      const layerDir = layer % 2 === 0 ? 1 : -1;
      const layerTime = time * layerSpeedMult * layerDir;
      
      const phaseOffset = layer * (Math.PI * 2 / 3) + 143; // Random starting offset

      // Loop across width
      for (let i = 0; i <= resolution; i++) {
        const x = i * step;
        
        // Normalize X for calculation (0 to ~10-20 depending on frequency)
        const waveX = (x / width) * 10 * (config.frequency * 10);
        
        // --- 1. SPINE CALCULATION (Vertical Position) ---
        // The center line of the ribbon moves up and down
        
        // Primary Carrier Wave
        const carrier = Math.sin(waveX + layerTime + phaseOffset);
        
        // Secondary Harmonic (adds complexity/imperfection)
        const harmonic = Math.sin(waveX * 2.3 - layerTime * 1.5 + layer) * 0.35;
        
        // Combined vertical displacement signal (-1.35 to 1.35 approx)
        const displacementSignal = carrier + harmonic;
        
        // Apply Amplitude (scaled down slightly as we add thickness later)
        const currentSpineY = centerY + (displacementSignal * config.amplitude * 0.55);


        // --- 2. THICKNESS CALCULATION (Ribbon Width) ---
        // The ribbon breathes slightly but maintains solid form
        
        const baseThickness = config.amplitude * 0.25;
        const breathing = Math.cos(waveX * 0.8 + time * 2 + layer) * 0.15;
        const currentThickness = baseThickness * (1 + breathing);

        // --- 3. POINT GENERATION ---
        // Create parallel curves offset from the spine
        
        const yTop = currentSpineY - currentThickness;
        const yBottom = currentSpineY + currentThickness;

        topPoints.push(`${x.toFixed(1)},${yTop.toFixed(1)}`);
        // Unshift bottom points to prepare for reverse drawing order
        bottomPoints.unshift(`${x.toFixed(1)},${yBottom.toFixed(1)}`);
      }

      // Construct continuous ribbon path
      // Move to Top-Left -> Line to Top-Right -> Line to Bottom-Right -> Line to Bottom-Left -> Close
      const d = `M ${topPoints[0]} L ${topPoints.join(' L ')} L ${bottomPoints[0]} L ${bottomPoints.join(' L ')} Z`;
      
      generatedLayers.push({
        id: layer,
        path: d,
        gradientId: `waveGradient-${layer}`
      });
    }
    return generatedLayers;
  }, [config, time, width, height]);

  // Create gradient definitions based on current palette
  const gradients = useMemo(() => {
    return [
      { id: 'waveGradient-0', colors: config.warmColors, transform: 'rotate(0)' },
      { id: 'waveGradient-1', colors: config.coolColors, transform: 'rotate(90)' }, // Rotate for visual interest
      { id: 'waveGradient-2', colors: [...config.warmColors].reverse(), transform: 'rotate(45)' },
    ];
  }, [config.warmColors, config.coolColors]);

  return (
    <svg 
      width={width} 
      height={height} 
      className="w-full h-full block"
      // Soft glow filter
      style={{ filter: 'drop-shadow(0px 0px 20px rgba(0,0,0,0.3))' }}
    >
      <defs>
        {gradients.map((g, i) => (
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
              // Alternating blend modes for rich overlap
              mixBlendMode: index === 1 ? 'screen' : 'normal',
            }}
          />
        ))}
      </g>
    </svg>
  );
};