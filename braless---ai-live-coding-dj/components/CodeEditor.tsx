import React, { useEffect, useRef, useState, useMemo } from 'react';
import { AgentChange } from '../types';
import { computeDiff, computeInlineDiffResult, InlineDiffLine } from '../utils/diff';

interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
  onRun: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  agentChanges?: AgentChange[];
  showChanges?: boolean;
  onToggleChanges?: () => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ 
  code, 
  onChange, 
  onRun, 
  onUndo, 
  onRedo, 
  canUndo, 
  canRedo,
  agentChanges = [],
  showChanges = true,
  onToggleChanges
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const codeDisplayRef = useRef<HTMLDivElement>(null);
  const [hoveredLineIndex, setHoveredLineIndex] = useState<number | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);

  // Get the most recent agent change that matches current code
  const currentChange = useMemo(() => {
    if (!showChanges || agentChanges.length === 0) return null;
    // Find the most recent change where newCode matches current code
    const matchingChange = agentChanges.find(change => change.newCode === code);
    return matchingChange || null;
  }, [code, agentChanges, showChanges]);

  // Compute inline diff if we have a change to show
  const inlineDiff = useMemo(() => {
    if (!currentChange || !showChanges) return null;
    return computeInlineDiffResult(currentChange.oldCode, currentChange.newCode);
  }, [currentChange, showChanges]);


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

  const handleSegmentHover = (lineIndex: number, event: React.MouseEvent) => {
    if (!inlineDiff || !currentChange) return;
    
    const line = inlineDiff[lineIndex];
    if (line && line.segments.some(s => s.type === 'added' || s.type === 'removed')) {
      setHoveredLineIndex(lineIndex);
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      setTooltipPosition({
        x: rect.left + rect.width / 2,
        y: rect.top
      });
    } else {
      setHoveredLineIndex(null);
      setTooltipPosition(null);
    }
  };

  const handleLineLeave = () => {
    setHoveredLineIndex(null);
    setTooltipPosition(null);
  };

  const renderCodeWithDiff = () => {
    if (!inlineDiff || !showChanges) {
      return code.split('\n').map((line, i) => (
        <div 
          key={i} 
          className="text-blue-300 code-display" 
          style={{ 
            minHeight: '20px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'normal',
            overflowWrap: 'break-word',
            margin: 0,
            padding: 0
          }}
        >
          {line || ' '}
        </div>
      ));
    }

    // Get the actual current code lines to ensure perfect alignment
    const currentCodeLines = code.split('\n');
    
    return inlineDiff.map((line, lineIndex) => {
      const hasChanges = line.segments.some(s => s.type === 'added' || s.type === 'removed');
      const isHovered = hoveredLineIndex === lineIndex && hasChanges;
      
      // Use the actual current code line to ensure perfect alignment
      const actualLine = lineIndex < currentCodeLines.length ? currentCodeLines[lineIndex] : '';
      
      // Only show segments that are in the current code (new line)
      const visibleSegments = line.segments.filter(s => s.type === 'added' || s.type === 'unchanged');
      
      // Build character-level highlighting map from segments
      const highlightRanges: Array<{ start: number; end: number }> = [];
      let charPos = 0;
      
      visibleSegments.forEach(segment => {
        if (segment.type === 'added') {
          highlightRanges.push({
            start: charPos,
            end: charPos + segment.text.length
          });
        }
        charPos += segment.text.length;
      });
      
      // Render the line character by character with highlights
      const renderLineWithHighlights = () => {
        if (highlightRanges.length === 0) {
          return <span className="text-blue-300">{actualLine || ' '}</span>;
        }
        
        const parts: React.ReactNode[] = [];
        let lastIndex = 0;
        
        highlightRanges.forEach((range, rangeIndex) => {
          // Add text before highlight
          if (range.start > lastIndex) {
            parts.push(
              <span key={`before-${rangeIndex}`} className="text-blue-300">
                {actualLine.substring(lastIndex, range.start)}
              </span>
            );
          }
          
          // Add highlighted text
          parts.push(
            <span
              key={`highlight-${rangeIndex}`}
              className="text-green-300 diff-highlight"
              style={{
                backgroundColor: isHovered ? 'rgba(34, 197, 94, 0.25)' : 'rgba(34, 197, 94, 0.15)',
                borderBottom: '2px solid rgb(34, 197, 94)',
                textDecoration: 'underline',
                textDecorationColor: 'rgb(34, 197, 94)',
                textDecorationThickness: '2px',
                textUnderlineOffset: '2px',
                textDecorationSkipInk: 'none',
                textDecorationSkip: 'none',
                boxDecorationBreak: 'clone'
              }}
            >
              {actualLine.substring(range.start, range.end)}
            </span>
          );
          
          lastIndex = range.end;
        });
        
        // Add remaining text after last highlight
        if (lastIndex < actualLine.length) {
          parts.push(
            <span key="after" className="text-blue-300">
              {actualLine.substring(lastIndex)}
            </span>
          );
        }
        
        return <>{parts}</>;
      };
      
      return (
        <div
          key={lineIndex}
          className="code-display"
          style={{ 
            minHeight: '20px',
            pointerEvents: hasChanges ? 'auto' : 'none',
            whiteSpace: 'pre-wrap',
            wordBreak: 'normal',
            overflowWrap: 'break-word',
            margin: 0,
            padding: 0
          }}
          onMouseEnter={(e) => hasChanges && handleSegmentHover(lineIndex, e)}
          onMouseLeave={handleLineLeave}
        >
          {renderLineWithHighlights()}
        </div>
      );
    });
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
        .code-textarea {
          caret-color: #60a5fa;
        }
        .code-textarea::selection {
          background: rgba(99, 102, 241, 0.3);
        }
        /* Ensure underlines continue across line breaks */
        .diff-highlight {
          text-decoration-skip-ink: none;
          text-decoration-skip: none;
          -webkit-text-decoration-skip: none;
          box-decoration-break: clone;
          -webkit-box-decoration-break: clone;
        }
        /* Prevent breaking inside strings and improve code wrapping */
        .code-textarea,
        .code-display {
          word-break: normal;
          overflow-wrap: break-word;
        }
        /* Add break opportunities before dots in method chains */
        .code-textarea::before,
        .code-display::before {
          content: '';
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
          {agentChanges.length > 0 && onToggleChanges && (
            <button
              onClick={onToggleChanges}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                showChanges 
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white' 
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400'
              }`}
              title={showChanges ? 'Hide agent changes' : 'Show agent changes'}
            >
              {showChanges ? 'Hide Changes' : 'Show Changes'}
            </button>
          )}
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
      
      <div className="relative flex-1 overflow-auto">
        {/* Code display with diff highlighting (background layer, only for highlighting) */}
        {showChanges && inlineDiff && currentChange && (
          <div
            ref={codeDisplayRef}
            className="absolute inset-0 p-4 text-sm leading-relaxed overflow-auto pointer-events-none"
            style={{ 
              fontFamily: 'monospace',
              zIndex: 0,
              lineHeight: '1.5rem',
              wordBreak: 'normal',
              overflowWrap: 'break-word',
              whiteSpace: 'pre-wrap',
              padding: '1rem', // Match textarea p-4 class (1rem)
              fontSize: '0.875rem', // Match text-sm
              letterSpacing: 'normal',
              boxSizing: 'border-box'
            }}
          >
            {renderCodeWithDiff()}
          </div>
        )}
        
        {/* Textarea for editing (always present, on top when showing diffs) */}
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="code-textarea relative w-full p-4 bg-transparent text-sm leading-relaxed focus:outline-none resize-none"
          spellCheck={false}
          autoComplete="off"
          style={{
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
            tabSize: 2,
            caretColor: '#60a5fa',
            color: '#93c5fd',
            minHeight: '100%',
            zIndex: 1,
            lineHeight: '1.5rem',
            background: 'transparent',
            wordBreak: 'normal',
            overflowWrap: 'break-word',
            padding: '1rem', // Match overlay padding exactly
            boxSizing: 'border-box'
          }}
          onScroll={(e) => {
            if (codeDisplayRef.current && showChanges && inlineDiff) {
              codeDisplayRef.current.scrollTop = e.currentTarget.scrollTop;
              codeDisplayRef.current.scrollLeft = e.currentTarget.scrollLeft;
            }
          }}
        />
      </div>

      {/* Tooltip */}
      {hoveredLineIndex !== null && tooltipPosition && currentChange && (
        <div
          className="fixed z-50 bg-zinc-800 border border-zinc-700 rounded-lg p-3 shadow-xl max-w-sm pointer-events-none"
          style={{
            left: `${Math.min(tooltipPosition.x, window.innerWidth - 200)}px`,
            top: `${Math.max(tooltipPosition.y - 10, 10)}px`,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className="text-xs text-zinc-400 mb-1">
            {currentChange.agentName || 'Agent'} Change
          </div>
          <div className="text-sm text-zinc-200">
            {currentChange.explanation}
          </div>
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-zinc-700"></div>
        </div>
      )}
      </div>
    </>
  );
};

export default CodeEditor;
