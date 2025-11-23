import React from 'react';
import { Agent } from '../types';

interface AgentPanelProps {
  agents: Agent[];
  isProcessing: boolean;
  onTriggerAgent: (agent: Agent) => void;
}

const AgentPanel: React.FC<AgentPanelProps> = ({ agents, isProcessing, onTriggerAgent }) => {
  
  // Helper to map string colors to Tailwind classes safely with 3D liquid glass effect
  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      emerald: 'bg-gradient-to-br from-emerald-400/80 via-emerald-300/70 to-emerald-500/90 border-emerald-200/80 hover:from-emerald-400/95 hover:via-emerald-300/85 hover:to-emerald-500/100 text-emerald-50',
      fuchsia: 'bg-gradient-to-br from-fuchsia-400/80 via-fuchsia-300/70 to-fuchsia-500/90 border-fuchsia-200/80 hover:from-fuchsia-400/95 hover:via-fuchsia-300/85 hover:to-fuchsia-500/100 text-fuchsia-50',
      rose: 'bg-gradient-to-br from-rose-400/80 via-rose-300/70 to-rose-500/90 border-rose-200/80 hover:from-rose-400/95 hover:via-rose-300/85 hover:to-rose-500/100 text-rose-50',
      amber: 'bg-gradient-to-br from-amber-400/80 via-amber-300/70 to-amber-500/90 border-amber-200/80 hover:from-amber-400/95 hover:via-amber-300/85 hover:to-amber-500/100 text-amber-50',
      cyan: 'bg-gradient-to-br from-cyan-400/80 via-cyan-300/70 to-cyan-500/90 border-cyan-200/80 hover:from-cyan-400/95 hover:via-cyan-300/85 hover:to-cyan-500/100 text-cyan-50',
    };
    return colors[color] || 'bg-zinc-800 border-zinc-700 text-zinc-300';
  };

  // Helper to get glass highlight overlay styles
  const getGlassHighlight = (color: string) => {
    const highlights: Record<string, string> = {
      emerald: 'before:bg-gradient-to-br before:from-emerald-100/50 before:via-transparent before:to-transparent',
      fuchsia: 'before:bg-gradient-to-br before:from-fuchsia-100/50 before:via-transparent before:to-transparent',
      rose: 'before:bg-gradient-to-br before:from-rose-100/50 before:via-transparent before:to-transparent',
      amber: 'before:bg-gradient-to-br before:from-amber-100/50 before:via-transparent before:to-transparent',
      cyan: 'before:bg-gradient-to-br before:from-cyan-100/50 before:via-transparent before:to-transparent',
    };
    return highlights[color] || '';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {agents.map((agent) => (
        <button
          key={agent.id}
          onClick={() => onTriggerAgent(agent)}
          disabled={isProcessing}
          className={`
            relative p-4 rounded-xl border-2 text-left transition-all duration-300
            backdrop-blur-md overflow-hidden
            ${getColorClasses(agent.avatarColor)}
            ${getGlassHighlight(agent.avatarColor)}
            before:absolute before:inset-0 before:rounded-xl before:pointer-events-none
            ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-1 hover:scale-[1.02]'}
            ${agent.avatarColor === 'emerald' 
              ? 'shadow-[0_8px_32px_rgba(52,211,153,0.6),0_0_0_1px_rgba(110,231,183,0.4),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_12px_48px_rgba(52,211,153,0.8),0_0_0_1px_rgba(110,231,183,0.5),inset_0_1px_0_rgba(255,255,255,0.3)]'
              : ''}
            ${agent.avatarColor === 'fuchsia' 
              ? 'shadow-[0_8px_32px_rgba(240,171,252,0.6),0_0_0_1px_rgba(250,232,255,0.4),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_12px_48px_rgba(240,171,252,0.8),0_0_0_1px_rgba(250,232,255,0.5),inset_0_1px_0_rgba(255,255,255,0.3)]'
              : ''}
            ${agent.avatarColor === 'rose' 
              ? 'shadow-[0_8px_32px_rgba(251,113,133,0.6),0_0_0_1px_rgba(255,228,230,0.4),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_12px_48px_rgba(251,113,133,0.8),0_0_0_1px_rgba(255,228,230,0.5),inset_0_1px_0_rgba(255,255,255,0.3)]'
              : ''}
            ${agent.avatarColor === 'amber' 
              ? 'shadow-[0_8px_32px_rgba(251,191,36,0.6),0_0_0_1px_rgba(254,243,199,0.4),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_12px_48px_rgba(251,191,36,0.8),0_0_0_1px_rgba(254,243,199,0.5),inset_0_1px_0_rgba(255,255,255,0.3)]'
              : ''}
            ${agent.avatarColor === 'cyan' 
              ? 'shadow-[0_8px_32px_rgba(103,232,249,0.6),0_0_0_1px_rgba(165,243,252,0.4),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_12px_48px_rgba(103,232,249,0.8),0_0_0_1px_rgba(165,243,252,0.5),inset_0_1px_0_rgba(255,255,255,0.3)]'
              : ''}
          `}
        >
          {/* Inner glow effect */}
          <div className={`absolute inset-0 rounded-xl opacity-40 pointer-events-none ${
            agent.avatarColor === 'emerald' ? 'bg-gradient-to-t from-emerald-300/40 to-transparent' :
            agent.avatarColor === 'fuchsia' ? 'bg-gradient-to-t from-fuchsia-300/40 to-transparent' :
            agent.avatarColor === 'rose' ? 'bg-gradient-to-t from-rose-300/40 to-transparent' :
            agent.avatarColor === 'amber' ? 'bg-gradient-to-t from-amber-300/40 to-transparent' :
            agent.avatarColor === 'cyan' ? 'bg-gradient-to-t from-cyan-300/40 to-transparent' :
            ''
          }`}></div>
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-2">
              <div className="font-bold text-lg drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">{agent.name}</div>
              <div className={`w-2 h-2 rounded-full animate-pulse shadow-lg ${
                agent.avatarColor === 'emerald' ? 'bg-emerald-200 shadow-emerald-300/70' : 
                agent.avatarColor === 'fuchsia' ? 'bg-fuchsia-200 shadow-fuchsia-300/70' : 
                agent.avatarColor === 'rose' ? 'bg-rose-200 shadow-rose-300/70' : 
                agent.avatarColor === 'amber' ? 'bg-amber-200 shadow-amber-300/70' : 
                agent.avatarColor === 'cyan' ? 'bg-cyan-200 shadow-cyan-300/70' : 
                'bg-zinc-500'
              }`}></div>
            </div>
            <div className="text-xs font-mono opacity-90 mb-2 uppercase tracking-wider drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">{agent.role}</div>
            <p className="text-sm opacity-85 leading-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">{agent.description}</p>
          </div>
          
          {isProcessing && (
             <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm rounded-xl z-20">
               <svg className="animate-spin h-5 w-5 text-white drop-shadow-lg" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
             </div>
          )}
        </button>
      ))}
    </div>
  );
};

export default AgentPanel;