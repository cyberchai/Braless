import React from 'react';
import { Agent } from '../types';

interface AgentPanelProps {
  agents: Agent[];
  isProcessing: boolean;
  onTriggerAgent: (agent: Agent) => void;
}

const AgentPanel: React.FC<AgentPanelProps> = ({ agents, isProcessing, onTriggerAgent }) => {
  
  // Map agent colors to visualizer-style colors (matching the wave gradient colors)
  // Visualizer uses: warmColors: ['#FF00CC', '#FF9900', '#FF3366', '#FFCC00']
  //                  coolColors: ['#3333FF', '#9900FF', '#00CCFF', '#CC00FF']
  // Using similar opacity and clean styling as visualizer (opacity: 1.0, no blur/glow)
  const getColorStyles = (color: string) => {
    const colorMap: Record<string, { bg: string; border: string; text: string; dot: string }> = {
      emerald: {
        bg: 'bg-[#00CCFF]', // cyan from coolColors
        border: 'border-[#00CCFF]',
        text: 'text-black',
        dot: 'bg-[#00CCFF]'
      },
      fuchsia: {
        bg: 'bg-[#9900FF]', // purple from coolColors
        border: 'border-[#9900FF]',
        text: 'text-white',
        dot: 'bg-[#9900FF]'
      },
      rose: {
        bg: 'bg-[#FF3366]', // pink-red from warmColors
        border: 'border-[#FF3366]',
        text: 'text-white',
        dot: 'bg-[#FF3366]'
      },
      amber: {
        bg: 'bg-[#FF9900]', // orange from warmColors
        border: 'border-[#FF9900]',
        text: 'text-black',
        dot: 'bg-[#FF9900]'
      },
      cyan: {
        bg: 'bg-[#3333FF]', // blue from coolColors
        border: 'border-[#3333FF]',
        text: 'text-white',
        dot: 'bg-[#3333FF]'
      },
    };
    return colorMap[color] || { bg: 'bg-zinc-800', border: 'border-zinc-700', text: 'text-zinc-300', dot: 'bg-zinc-500' };
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
      {agents.map((agent) => {
        const colors = getColorStyles(agent.avatarColor);
        return (
          <button
            key={agent.id}
            onClick={() => onTriggerAgent(agent)}
            disabled={isProcessing}
            className={`
              relative p-2.5 rounded-lg border text-left transition-opacity duration-200
              ${colors.bg} ${colors.border} ${colors.text}
              ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90 active:opacity-75'}
            `}
            style={{
              opacity: 1.0
            }}
          >
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-1">
                <div className="font-semibold text-sm leading-tight">{agent.name}</div>
                <div className={`w-1.5 h-1.5 rounded-full ${colors.dot} flex-shrink-0 mt-0.5`}></div>
              </div>
              <div className="text-[10px] font-mono uppercase tracking-wider mb-1 opacity-90">{agent.role}</div>
              <p className="text-[11px] leading-tight opacity-90">{agent.description}</p>
            </div>
            
            {isProcessing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg z-20">
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default AgentPanel;