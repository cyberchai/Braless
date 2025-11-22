export interface Agent {
  id: string;
  name: string;
  role: string;
  description: string;
  avatarColor: string; // Tailwind color class prefix e.g., 'purple'
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  source: 'System' | 'User' | 'AI';
  message: string;
  type: 'info' | 'success' | 'error' | 'code';
}

export enum AudioStatus {
  STOPPED = 'STOPPED',
  PLAYING = 'PLAYING',
  SYNCING = 'SYNCING'
}

export interface CodeSnippet {
  name: string;
  code: string;
}