import React from 'react';
import { Wifi, WifiOff, RefreshCw, Info } from 'lucide-react';
import { useChat } from '../../context/ChatContext';

export const ConnectionBanner: React.FC = () => {
  const { connectionStatus, reconnectWebSocket } = useChat();

  if (connectionStatus === 'connected') return null;

  if (connectionStatus === 'simulated') {
    return (
      <div
        id="connection-simulated-banner"
        className="flex items-center justify-between border-b border-neutral-200 bg-neutral-100/80 px-4 py-1.5 text-[11px] text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-400"
      >
        <div className="flex items-center gap-2">
          <Info className="h-3.5 w-3.5 text-neutral-500" />
          <span>
            Operating in <strong className="text-neutral-900 dark:text-neutral-200 font-medium">Local Sandbox Mode</strong>. Real-time encryption, typing, and contacts loopback active. (Set <code className="font-mono text-[10px] bg-neutral-200 dark:bg-neutral-800 px-1 py-0.5 rounded">VITE_WS_URL</code> for live Render backend).
          </span>
        </div>
      </div>
    );
  }

  if (connectionStatus === 'reconnecting' || connectionStatus === 'connecting') {
    return (
      <div
        id="connection-reconnecting-banner"
        className="flex items-center justify-between border-b border-amber-200 bg-amber-50 px-4 py-1.5 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300"
      >
        <div className="flex items-center gap-2">
          <RefreshCw className="h-3.5 w-3.5 animate-spin text-amber-600 dark:text-amber-400" />
          <span>Connecting to real-time WebSocket relay...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      id="connection-disconnected-banner"
      className="flex items-center justify-between border-b border-red-200 bg-red-50 px-4 py-1.5 text-xs text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
    >
      <div className="flex items-center gap-2">
        <WifiOff className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
        <span>WebSocket connection offline</span>
      </div>
      <button
        onClick={reconnectWebSocket}
        className="rounded bg-red-100 px-2 py-0.5 font-medium text-red-800 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-200"
      >
        Reconnect
      </button>
    </div>
  );
};
