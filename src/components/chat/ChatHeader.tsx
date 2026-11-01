import React from 'react';
import {
  ArrowLeft,
  Lock,
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
      className="flex h-12 items-center justify-between border-b border-[#1A1A22] bg-[#0A0A0E] px-4 flex-shrink-0 select-none z-10"
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile Back Button */}
        <button
          id="chat-mobile-back-button"
          onClick={() => selectConversation(null)}
          className="rounded p-1 text-slate-400 hover:bg-[#14141C] hover:text-white md:hidden"
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
            <span className="text-[11px] font-mono text-slate-500 truncate hidden xs:inline">
              @{directParticipant.username}
            </span>

            {/* Status indicator */}
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 ml-1">
              {isSomeoneTyping ? (
                <span className="text-[#FF7A1A] animate-pulse font-medium">● typing...</span>
              ) : directParticipant.status === 'away' ? (
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 inline-block" />
                  <span>Away</span>
                </span>
              ) : directParticipant.status === 'offline' ? (
                <span className="flex items-center gap-1.5 text-slate-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-600 inline-block" />
                  <span>Offline</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#FF5500] inline-block shadow-[0_0_6px_#FF5500]" />
                  <span>Active</span>
                </span>
              )}
            </div>
          </div>
        )}

        {!isDirect && group && (
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="font-mono text-[#FF5500] text-sm font-bold">#</span>
            <h1 className="text-xs sm:text-sm font-semibold text-white truncate">{group.name}</h1>
            <button
              onClick={onOpenGroupDetails}
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white font-mono bg-[#111117] hover:bg-[#181822] border border-[#22222E] px-2 py-0.5 rounded-md transition-colors"
              title="View channel members and settings"
            >
              <Users className="h-3 w-3 text-[#FF5500]" />
              <span>{group.members.length} members</span>
            </button>
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Ratchet Counter Badge */}
        <button
          onClick={onInspectSecurity}
          className="flex items-center gap-1.5 rounded-md border border-[#FF5500]/30 bg-[#FF5500]/10 px-2.5 py-1 text-[11px] font-mono font-medium text-[#FF7A1A] hover:bg-[#FF5500]/20 transition-all shadow-xs"
          title="Signal Protocol Double Ratchet #142 Active (Click to inspect ciphertext)"
        >
          <Lock className="h-3 w-3 text-[#FF5500]" />
          <span>Ratchet #142</span>
        </button>

        {/* Group Details or Identity & Security Panel Toggle */}
        {isDirect ? (
          <button
            id="identity-security-toggle"
            onClick={onToggleSecurityPanel}
            className={`rounded p-1.5 transition-colors ${
              isSecurityPanelOpen
                ? 'bg-[#181822] text-[#FF7A1A]'
                : 'text-slate-400 hover:bg-[#14141C] hover:text-white'
            }`}
            title="Toggle Identity & Security panel"
          >
            <Info className="h-4 w-4" />
          </button>
        ) : (
          <button
            id="group-info-toggle"
            onClick={onOpenGroupDetails}
            className="rounded p-1.5 text-slate-400 hover:bg-[#14141C] hover:text-white transition-colors"
            title="Channel members & configuration"
          >
            <Info className="h-4 w-4" />
          </button>
        )}
      </div>
    </header>
  );
};
