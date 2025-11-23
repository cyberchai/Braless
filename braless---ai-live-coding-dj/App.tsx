import React, { useState, useEffect, useCallback, useRef } from 'react';
import CodeEditor from './components/CodeEditor';
import Visualizer from './components/Visualizer';
import AgentPanel from './components/AgentPanel';
import ChatInterface from './components/ChatInterface';
import BralessLogo from './components/BralessLogo';
import DancingBanana from './components/DancingBanana';
import { INITIAL_CODE, AGENTS, PRESETS } from './constants';
import { Agent, LogEntry, AudioStatus } from './types';
import { geminiService } from './services/geminiService';
import { runCode, stopAudio } from './services/audioEngine';

const App: React.FC = () => {
  // History State Management
  // We use refs to access latest state inside async timeouts/callbacks without dependency issues
  const [history, setHistory] = useState<string[]>([INITIAL_CODE]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const historyRef = useRef<string[]>([INITIAL_CODE]);
  const indexRef = useRef(0);
  
  // Sync refs with state
  useEffect(() => { historyRef.current = history; }, [history]);
  useEffect(() => { indexRef.current = historyIndex; }, [historyIndex]);

  const [code, setCode] = useState<string>(INITIAL_CODE);
  const [status, setStatus] = useState<AudioStatus>(AudioStatus.STOPPED);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const debounceRef = useRef<number | null>(null);

  const addLog = (source: LogEntry['source'], message: string, type: LogEntry['type'] = 'info') => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      source,
      message,
      type
    };
    setLogs(prev => [newLog, ...prev].slice(0, 50));
  };

  // Commit code to history
  const commitToHistory = useCallback((newCode: string) => {
    const currentHist = historyRef.current;
    const currentIndex = indexRef.current;

    // Avoid duplicates if nothing changed (e.g. quick undo/redo spam)
    if (currentHist[currentIndex] === newCode) return;

    const newHistory = currentHist.slice(0, currentIndex + 1);
    newHistory.push(newCode);

    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, []);

  // Handle user typing (Debounced history commit)
  const handleUserCodeChange = (newCode: string) => {
    setCode(newCode);
    
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }

    debounceRef.current = window.setTimeout(() => {
      commitToHistory(newCode);
    }, 750);
  };

  // Handle programmatic changes (Immediate history commit)
  const handleImmediateCodeChange = (newCode: string) => {
    setCode(newCode);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    commitToHistory(newCode);
  };

  const handleUndo = useCallback(() => {
    if (indexRef.current > 0) {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      
      const newIndex = indexRef.current - 1;
      setHistoryIndex(newIndex);
      setCode(historyRef.current[newIndex]);
      addLog('System', 'Undo', 'info');
    }
  }, []);

  const handleRedo = useCallback(() => {
    if (indexRef.current < historyRef.current.length - 1) {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);

      const newIndex = indexRef.current + 1;
      setHistoryIndex(newIndex);
      setCode(historyRef.current[newIndex]);
      addLog('System', 'Redo', 'info');
    }
  }, []);

  const handleRun = useCallback(async () => {
    try {
      setStatus(AudioStatus.PLAYING);
      await runCode(code);
      addLog('User', 'Updated live code', 'success');
    } catch (e) {
      addLog('System', 'Error running code', 'error');
    }
  }, [code]);

  const handleStop = useCallback(() => {
    stopAudio();
    setStatus(AudioStatus.STOPPED);
    addLog('System', 'Audio stopped', 'info');
  }, []);

  const handleAgentTrigger = async (agent: Agent) => {
    setIsProcessing(true);
    addLog('System', `${agent.name} is thinking...`, 'info');
    try {
      const newCode = await geminiService.agentAction(agent.role, code);
      handleImmediateCodeChange(newCode);
      addLog('AI', `${agent.name} modified the pattern`, 'code');
      // Auto-run the new code for live coding feel
      await runCode(newCode);
      if (status === AudioStatus.STOPPED) setStatus(AudioStatus.PLAYING);
    } catch (e) {
      addLog('System', `Agent ${agent.name} failed to respond`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleChatRequest = async (message: string) => {
    setIsProcessing(true);
    addLog('User', message, 'info');
    try {
      const newCode = await geminiService.modifyCode(code, message);
      handleImmediateCodeChange(newCode);
      addLog('AI', 'Applied requested changes', 'code');
      await runCode(newCode);
      if (status === AudioStatus.STOPPED) setStatus(AudioStatus.PLAYING);
    } catch (e) {
      addLog('System', 'Failed to process request', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const loadPreset = (presetCode: string, name: string) => {
    handleImmediateCodeChange(presetCode);
    addLog('System', `Loaded preset: ${name}`, 'info');
    handleStop();
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col md:flex-row overflow-hidden">
      <style>{`
        @keyframes slow-glow {
          0%, 100% { 
            box-shadow: 0 0 25px rgba(99, 102, 241, 0.2);
          }
          25% { 
            box-shadow: 0 0 28px rgba(99, 102, 241, 0.23);
          }
          50% { 
            box-shadow: 0 0 35px rgba(99, 102, 241, 0.3);
          }
          75% { 
            box-shadow: 0 0 28px rgba(99, 102, 241, 0.23);
          }
        }
        @keyframes slow-glow-top {
          0%, 100% { 
            box-shadow: 0 4px 25px rgba(99, 102, 241, 0.15);
          }
          25% { 
            box-shadow: 0 4px 28px rgba(99, 102, 241, 0.18);
          }
          50% { 
            box-shadow: 0 4px 35px rgba(99, 102, 241, 0.25);
          }
          75% { 
            box-shadow: 0 4px 28px rgba(99, 102, 241, 0.18);
          }
        }
        @keyframes slow-glow-yellow {
          0%, 100% { 
            box-shadow: 0 0 25px rgba(255, 215, 0, 0.2);
          }
          25% { 
            box-shadow: 0 0 28px rgba(255, 215, 0, 0.23);
          }
          50% { 
            box-shadow: 0 0 35px rgba(255, 215, 0, 0.3);
          }
          75% { 
            box-shadow: 0 0 28px rgba(255, 215, 0, 0.23);
          }
        }
        @keyframes slow-glow-purple {
          0%, 100% { 
            box-shadow: 0 0 25px rgba(139, 92, 246, 0.25);
          }
          25% { 
            box-shadow: 0 0 28px rgba(139, 92, 246, 0.28);
          }
          50% { 
            box-shadow: 0 0 35px rgba(139, 92, 246, 0.35);
          }
          75% { 
            box-shadow: 0 0 28px rgba(139, 92, 246, 0.28);
          }
        }
        @keyframes slow-glow-editor {
          0%, 100% { 
            box-shadow: 0 0 30px rgba(99, 102, 241, 0.3);
          }
          25% { 
            box-shadow: 0 0 33px rgba(99, 102, 241, 0.33);
          }
          50% { 
            box-shadow: 0 0 40px rgba(99, 102, 241, 0.4);
          }
          75% { 
            box-shadow: 0 0 33px rgba(99, 102, 241, 0.33);
          }
        }
        .animate-slow-glow {
          animation: slow-glow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .animate-slow-glow-top {
          animation: slow-glow-top 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .animate-slow-glow-yellow {
          animation: slow-glow-yellow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .animate-slow-glow-purple {
          animation: slow-glow-purple 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .animate-slow-glow-editor {
          animation: slow-glow-editor 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
      
      {/* Sidebar / Left Panel */}
      <div className="w-full md:w-80 bg-zinc-950 border-r border-zinc-900 flex flex-col animate-slow-glow">
        <div className="p-6 border-b border-zinc-900">
          <BralessLogo />
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Presets</h3>
            <div className="space-y-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => loadPreset(preset.code, preset.name)}
                  className="w-full text-left px-3 py-2 rounded text-sm text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Session Log</h3>
            <div className="space-y-3 font-mono text-xs">
              {logs.map((log) => (
                <div key={log.id} className="border-l-2 border-zinc-800 pl-3 py-1 shadow-[inset_2px_0_10px_rgba(99,102,241,0.2)]">
                  <div className="flex justify-between text-zinc-600 mb-0.5">
                    <span>{log.source}</span>
                    <span>{log.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}</span>
                  </div>
                  <div className={`${log.type === 'error' ? 'text-red-400' : log.type === 'code' ? 'text-cyan-400' : 'text-zinc-300'}`}>
                    {log.message}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="p-4 border-t border-zinc-900">
           <div className="flex items-center gap-2 text-zinc-600 text-xs">
             <span className={`w-2 h-2 rounded-full ${status === AudioStatus.PLAYING ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
             Status: {status}
           </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Top Bar (Visualizer + Global Controls) */}
        <div className="h-64 p-6 border-b border-zinc-900 bg-zinc-900/20 animate-slow-glow-top">
          <div className="flex justify-between items-center mb-4">
             <h2 className="text-lg font-semibold">Main Stage</h2>
          </div>
          <div className="grid grid-cols-3 gap-4 h-48">
            <div className="col-span-2">
              <Visualizer isPlaying={status === AudioStatus.PLAYING} />
            </div>
            <div className="bg-zinc-900/50 rounded-lg border border-zinc-800 flex items-center justify-center animate-slow-glow-yellow overflow-hidden">
              <DancingBanana isPlaying={status === AudioStatus.PLAYING} />
            </div>
          </div>
        </div>

        {/* Workspace */}
        <div className="flex-1 p-6 overflow-y-auto">
          
          {/* AI Bandmates */}
          <AgentPanel 
            agents={AGENTS} 
            isProcessing={isProcessing} 
            onTriggerAgent={handleAgentTrigger} 
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]">
            
            {/* Code Editor Area */}
            <div className="lg:col-span-2 h-full flex flex-col">
              <CodeEditor 
                code={code} 
                onChange={handleUserCodeChange} 
                onRun={handleRun}
                onUndo={handleUndo}
                onRedo={handleRedo}
                canUndo={historyIndex > 0}
                canRedo={historyIndex < history.length - 1}
              />
            </div>

            {/* Prompt Area */}
            <div className="flex flex-col justify-between bg-zinc-900/50 rounded-lg border border-zinc-800 p-4 animate-slow-glow-purple">
              <div className="space-y-4">
                 <div>
                   <h3 className="font-semibold text-indigo-400 mb-1">AI Director</h3>
                   <p className="text-sm text-zinc-400">Use natural language to instruct the AI to modify the code. It understands musical terms.</p>
                 </div>
                 <div className="bg-black/40 p-3 rounded text-xs text-zinc-500 font-mono">
                    Examples:
                    <ul className="list-disc list-inside mt-2 space-y-1">
                       <li>"Make the bassline faster"</li>
                       <li>"Add a dreamy reverb pad"</li>
                       <li>"Drop the beat"</li>
                       <li>"Switch to a minor key"</li>
                    </ul>
                 </div>
              </div>
              <ChatInterface onSend={handleChatRequest} isProcessing={isProcessing} />
            </div>

          </div>
        </div>
      </div>

      {/* Floating Control Buttons at Bottom */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-3">
        <button 
          onClick={handleRun}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-full shadow-lg shadow-indigo-500/20 text-sm font-semibold transition-all active:scale-95 flex items-center gap-2 shadow-[0_0_25px_rgba(99,102,241,0.6)] hover:shadow-[0_0_35px_rgba(99,102,241,0.8)]"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          Run Code
        </button>
        <button 
          onClick={handleStop}
          className="text-red-400 hover:text-red-300 text-sm font-mono border border-red-900 bg-red-900/20 px-6 py-3 rounded-full shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:shadow-[0_0_25px_rgba(239,68,68,0.6)] transition-all active:scale-95 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 10h6v4H9z"></path></svg>
          Stop
        </button>
      </div>
    </div>
  );
};

export default App;