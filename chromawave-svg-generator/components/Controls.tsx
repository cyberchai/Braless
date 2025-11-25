import React, { useState } from 'react';
import { WaveConfig, GenerationStatus } from '../types';
import { BLEND_MODES } from '../constants';
import { generateWaveConfig } from '../services/geminiService';

interface ControlsProps {
  config: WaveConfig;
  onConfigChange: (newConfig: WaveConfig) => void;
}

export const Controls: React.FC<ControlsProps> = ({ config, onConfigChange }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setStatus(GenerationStatus.LOADING);
    const newConfig = await generateWaveConfig(prompt);
    onConfigChange(newConfig);
    setStatus(GenerationStatus.SUCCESS);
    
    // Reset status after a delay
    setTimeout(() => setStatus(GenerationStatus.IDLE), 3000);
  };

  const handleChange = (key: keyof WaveConfig, value: any) => {
    onConfigChange({ ...config, [key]: value });
  };

  return (
    <div className={`fixed top-4 left-4 z-50 transition-all duration-300 ${isOpen ? 'w-80' : 'w-12'}`}>
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header / Toggle */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="w-full p-3 flex items-center justify-between hover:bg-slate-800 transition-colors"
        >
          {isOpen && <span className="font-bold text-white tracking-wider text-sm">CHROMA WAVE</span>}
          <div className="p-1">
             {isOpen ? (
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
             ) : (
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
             )}
          </div>
        </button>

        {isOpen && (
          <div className="p-4 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
            
            {/* AI Generator Section */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase">AI Remix</label>
              <form onSubmit={handleGenerate} className="relative">
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., 'Electric neon jungle', 'Calm ocean waves'"
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg py-2 px-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={status === GenerationStatus.LOADING}
                  className="absolute right-1 top-1 bottom-1 bg-blue-600 hover:bg-blue-500 text-white rounded-md px-3 text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {status === GenerationStatus.LOADING ? '...' : 'GO'}
                </button>
              </form>
              {status === GenerationStatus.SUCCESS && <p className="text-xs text-green-400">Theme generated!</p>}
              {status === GenerationStatus.ERROR && <p className="text-xs text-red-400">Failed to generate.</p>}
            </div>

            <hr className="border-slate-700" />

            {/* Manual Controls */}
            <div className="space-y-4">
              <label className="text-xs font-semibold text-slate-400 uppercase block mb-2">Parameters</label>
              
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Complexity</span>
                  <span>{config.spikeCount}</span>
                </div>
                <input 
                  type="range" min="20" max="300" 
                  value={config.spikeCount} 
                  onChange={(e) => handleChange('spikeCount', Number(e.target.value))}
                  className="w-full accent-blue-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Amplitude</span>
                  <span>{config.amplitude}</span>
                </div>
                <input 
                  type="range" min="20" max="400" 
                  value={config.amplitude} 
                  onChange={(e) => handleChange('amplitude', Number(e.target.value))}
                  className="w-full accent-blue-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Frequency</span>
                  <span>{config.frequency.toFixed(3)}</span>
                </div>
                <input 
                  type="range" min="0.005" max="0.1" step="0.001"
                  value={config.frequency} 
                  onChange={(e) => handleChange('frequency', Number(e.target.value))}
                  className="w-full accent-blue-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Speed</span>
                  <span>{config.speed.toFixed(3)}</span>
                </div>
                <input 
                  type="range" min="0" max="0.1" step="0.001"
                  value={config.speed} 
                  onChange={(e) => handleChange('speed', Number(e.target.value))}
                  className="w-full accent-blue-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>

               <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Opacity</span>
                  <span>{config.opacity.toFixed(1)}</span>
                </div>
                <input 
                  type="range" min="0.1" max="1" step="0.1"
                  value={config.opacity} 
                  onChange={(e) => handleChange('opacity', Number(e.target.value))}
                  className="w-full accent-blue-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <span className="text-xs text-slate-300 block mb-1">Blend Mode</span>
                <div className="grid grid-cols-3 gap-2">
                  {BLEND_MODES.map((mode) => (
                    <button
                      key={mode}
                      onClick={() => handleChange('blendMode', mode)}
                      className={`text-[10px] px-2 py-1 rounded border overflow-hidden text-ellipsis whitespace-nowrap ${
                        config.blendMode === mode 
                        ? 'bg-blue-600 border-blue-500 text-white' 
                        : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-500'
                      }`}
                      title={mode}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};