import React, { useEffect, useRef } from 'react';

interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
  onRun: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ 
  code, 
  onChange, 
  onRun, 
  onUndo, 
  onRedo, 
  canUndo, 
  canRedo 
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Run Shortcut
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      onRun();
      return;
    }

    // Undo/Redo Shortcuts
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault();
      if (e.shiftKey) {
        onRedo();
      } else {
        onUndo();
      }
      return;
    }
    
    // Alternative Redo Shortcut (Ctrl+Y)
    if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
      e.preventDefault();
      onRedo();
      return;
    }

    // Tab Handling
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newValue = code.substring(0, start) + "  " + code.substring(end);
      onChange(newValue);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    }
  };

  return (
    <>
      <style>{`
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
        .animate-slow-glow-editor {
          animation: slow-glow-editor 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
      <div className="relative flex flex-col h-full bg-zinc-950 rounded-lg border border-zinc-800 overflow-hidden font-mono animate-slow-glow-editor">
        <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800 shadow-[0_2px_15px_rgba(99,102,241,0.2)]">
        <div className="flex items-center space-x-4">
          <div className="flex space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
          </div>
          <span className="text-xs text-zinc-500">main.js</span>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-zinc-800 rounded-md p-0.5">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className={`p-1 rounded hover:bg-zinc-700 transition-colors ${!canUndo ? 'text-zinc-600 cursor-not-allowed' : 'text-zinc-400 hover:text-white'}`}
              title="Undo (Ctrl+Z)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path></svg>
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className={`p-1 rounded hover:bg-zinc-700 transition-colors ${!canRedo ? 'text-zinc-600 cursor-not-allowed' : 'text-zinc-400 hover:text-white'}`}
              title="Redo (Ctrl+Shift+Z)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6"></path></svg>
            </button>
          </div>
          <div className="text-xs text-zinc-500 border-l border-zinc-800 pl-3">Shift+Enter to Run</div>
        </div>
      </div>
      
      <textarea
        ref={textareaRef}
        value={code}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        className="flex-1 w-full p-4 bg-transparent text-sm leading-relaxed text-blue-300 focus:outline-none resize-none"
        spellCheck={false}
        autoComplete="off"
      />
      </div>
    </>
  );
};

export default CodeEditor;