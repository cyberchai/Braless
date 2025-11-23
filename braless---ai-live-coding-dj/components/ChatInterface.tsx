import React, { useState } from 'react';

interface ChatInterfaceProps {
  onSend: (message: string) => void;
  isProcessing: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onSend, isProcessing }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isProcessing) {
      onSend(input);
      setInput('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="AI Director..."
        disabled={isProcessing}
        className="w-64 bg-zinc-900 border border-zinc-700 text-zinc-200 rounded-full py-3 pl-4 pr-12 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder-zinc-600 focus:shadow-[0_0_20px_rgba(99,102,241,0.6)] shadow-[0_0_15px_rgba(99,102,241,0.2)]"
      />
      <button
        type="submit"
        disabled={!input.trim() || isProcessing}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-zinc-800 hover:bg-indigo-600 rounded-full text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
      </button>
    </form>
  );
};

export default ChatInterface;