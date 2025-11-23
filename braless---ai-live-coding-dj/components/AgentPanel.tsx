import React from 'react';
import { Agent } from '../types';

interface AgentPanelProps {
  agents: Agent[];
  isProcessing: boolean;
  onTriggerAgent: (agent: Agent) => void;
}

const AgentPanel: React.FC<AgentPanelProps> = ({ agents, isProcessing, onTriggerAgent }) => {
  
  // Helper to map string colors to Tailwind classes safely
  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      emerald: 'bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400',
      fuchsia: 'bg-fuchsia-500/10 border-fuchsia-500/30 hover:bg-fuchsia-500/20 text-fuchsia-400',
      rose: 'bg-rose-500/10 border-rose-500/30 hover:bg-rose-500/20 text-rose-400',
      amber: 'bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20 text-amber-400',
      cyan: 'bg-cyan-500/10 border-cyan-500/30 hover:bg-cyan-500/20 text-cyan-400',
    };
    return colors[color] || 'bg-zinc-800 border-zinc-700 text-zinc-300';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {agents.map((agent) => (
        <button
          key={agent.id}
          onClick={() => onTriggerAgent(agent)}
          disabled={isProcessing}
          className={`
            relative p-4 rounded-xl border text-left transition-all duration-200
            ${getColorClasses(agent.avatarColor)}
            ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-1 shadow-lg'}
            ${agent.avatarColor === 'emerald' ? 'shadow-[0_0_25px_rgba(16,185,129,0.35)] hover:shadow-[0_0_35px_rgba(16,185,129,0.55)]' : ''}
            ${agent.avatarColor === 'fuchsia' ? 'shadow-[0_0_25px_rgba(217,70,239,0.35)] hover:shadow-[0_0_35px_rgba(217,70,239,0.55)]' : ''}
            ${agent.avatarColor === 'rose' ? 'shadow-[0_0_25px_rgba(244,63,94,0.35)] hover:shadow-[0_0_35px_rgba(244,63,94,0.55)]' : ''}
            ${agent.avatarColor === 'amber' ? 'shadow-[0_0_25px_rgba(245,158,11,0.35)] hover:shadow-[0_0_35px_rgba(245,158,11,0.55)]' : ''}
            ${agent.avatarColor === 'cyan' ? 'shadow-[0_0_25px_rgba(6,182,212,0.35)] hover:shadow-[0_0_35px_rgba(6,182,212,0.55)]' : ''}
          `}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="font-bold text-lg">{agent.name}</div>
            <div className={`w-2 h-2 rounded-full animate-pulse ${
              agent.avatarColor === 'emerald' ? 'bg-emerald-500' : 
              agent.avatarColor === 'fuchsia' ? 'bg-fuchsia-500' : 
              agent.avatarColor === 'rose' ? 'bg-rose-500' : 
              agent.avatarColor === 'amber' ? 'bg-amber-500' : 
              agent.avatarColor === 'cyan' ? 'bg-cyan-500' : 
              'bg-zinc-500'
            }`}></div>
          </div>
          <div className="text-xs font-mono opacity-80 mb-2 uppercase tracking-wider">{agent.role}</div>
          <p className="text-sm opacity-70 leading-tight">{agent.description}</p>
          
          {isProcessing && (
             <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl">
               <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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