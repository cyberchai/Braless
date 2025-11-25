import React, { useState, useEffect } from 'react';
import { Waveform } from './components/Waveform';
import { Controls } from './components/Controls';
import { DEFAULT_CONFIG } from './constants';
import { WaveConfig } from './types';

const App: React.FC = () => {
  const [config, setConfig] = useState<WaveConfig>(DEFAULT_CONFIG);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="relative w-screen h-screen bg-slate-950 overflow-hidden flex items-center justify-center">
      
      {/* Background Gradient Mesh for Depth */}
      <div className="absolute inset-0 z-0">
         <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black opacity-80 pointer-events-none" />
      </div>

      {/* Main Waveform SVG */}
      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <Waveform 
          config={config} 
          width={windowSize.width} 
          height={windowSize.height} 
        />
      </div>

      {/* Floating UI Controls */}
      <Controls 
        config={config} 
        onConfigChange={setConfig} 
      />

      {/* Title / Watermark */}
      <div className="absolute bottom-6 right-6 z-20 pointer-events-none opacity-50">
        <h1 className="text-white text-4xl font-black tracking-tighter mix-blend-overlay">
          CHROMA
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-pink-500">
            WAVE
          </span>
        </h1>
      </div>
    </div>
  );
};

export default App;