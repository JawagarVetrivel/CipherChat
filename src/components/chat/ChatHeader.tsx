import React from 'react';
import {
  ArrowLeft,
  Lock,
  Phone,
  Video,
  Search,
  Info,
  Users,
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { Conversation, DirectConversation, Group } from '../../types';

interface ChatHeaderProps {
  conversation: Conversation;
  onOpenGroupDetails?: () => void;
  onInspectSecurity?: () => void;
  onToggleSecurityPanel?: () => void;
  isSecurityPanelOpen?: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  conversation,
  onOpenGroupDetails,
  onInspectSecurity,
  onToggleSecurityPanel,
  isSecurityPanelOpen,
}) => {
  const { selectConversation, typingUsers } = useChat();

  const isDirect = conversation.type === 'direct';
  const directParticipant = isDirect ? (conversation as DirectConversation).participant : null;
  const group = !isDirect ? (conversation as Group) : null;

  const isSomeoneTyping = typingUsers.length > 0;

  return (
    <header
      id="chat-header"
      className="flex h-12 items-center justify-between border-b border-[#171D28] bg-[#0A0D13] px-4 flex-shrink-0 select-none z-10"
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile Back Button */}
        <button
          id="chat-mobile-back-button"
          onClick={() => selectConversation(null)}
          className="rounded p-1 text-slate-400 hover:bg-[#151C28] hover:text-white md:hidden"
          title="Back to conversations"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        {/* Title & Status */}
        {isDirect && directParticipant && (
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <h1 className="text-xs sm:text-sm font-semibold text-white truncate">
              {directParticipant.displayName}
            </h1>
            <span className="text-[11px] font-mono text-slate-400 truncate hidden xs:inline">
              @{directParticipant.username}
            </span>

            {/* Status indicator */}
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 ml-1">
              {isSomeoneTyping ? (
                <span className="text-[#00E599] animate-pulse font-medium">● typing...</span>
              ) : directParticipant.status === 'away' ? (
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 inline-block" />
                  <span className="hidden sm:inline">Away · London (GMT+1)</span>
                  <span className="sm:hidden">Away</span>
                </span>
              ) : directParticipant.status === 'offline' ? (
                <span className="flex items-center gap-1.5 text-slate-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-500 inline-block" />
                  <span>Offline</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#00E599] inline-block shadow-[0_0_6px_#00E599]" />
                  <span className="hidden sm:inline">Active · Verified</span>
                  <span className="sm:hidden">Active</span>
                </span>
              )}
            </div>
          </div>
        )}

        {!isDirect && group && (
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="font-mono text-slate-400 text-sm">#</span>
            <h1 className="text-xs sm:text-sm font-semibold text-white truncate">{group.name}</h1>
            <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
              <Users className="h-3 w-3" />
              <span>{group.members.length} members</span>
            </div>
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Ratchet Counter Badge */}
        <button
          onClick={onInspectSecurity}
          className="flex items-center gap-1.5 rounded-md border border-[#00E599]/30 bg-[#0B281E]/60 px-2.5 py-1 text-[11px] font-mono font-medium text-[#00E599] hover:bg-[#0E3528] transition-colors"
          title="Signal Protocol Double Ratchet #142 Active"
        >
          <Lock className="h-3 w-3 text-[#00E599]" />
          <span>Ratchet #142</span>
        </button>

        {/* Inert Voice Call Button (Visual match per request) */}
        <button
          className="rounded p-1.5 text-slate-400 hover:bg-[#141B28] hover:text-white transition-colors cursor-not-allowed opacity-80"
          title="Encrypted Voice Call (Coming Soon)"
        >
          <Phone className="h-4 w-4" />
        </button>

        {/* Inert Video Call Button */}
        <button
          className="rounded p-1.5 text-slate-400 hover:bg-[#141B28] hover:text-white transition-colors cursor-not-allowed opacity-80"
          title="Encrypted Video Call (Coming Soon)"
        >
          <Video className="h-4 w-4" />
        </button>

        {/* Search in Chat */}
        <button
          onClick={onInspectSecurity}
          className="rounded p-1.5 text-slate-400 hover:bg-[#141B28] hover:text-white transition-colors"
          title="Search conversation messages"
        >
          <Search className="h-4 w-4" />
        </button>

        {/* Info Toggle for Identity & Security Panel */}
        <button
          id="identity-security-toggle"
          onClick={onToggleSecurityPanel || onOpenGroupDetails}
          className={`rounded p-1.5 transition-colors ${
            isSecurityPanelOpen
              ? 'bg-[#151C28] text-[#00E599]'
              : 'text-slate-400 hover:bg-[#141B28] hover:text-white'
          }`}
          title="Toggle Identity & Security panel"
        >
          <Info className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
};
