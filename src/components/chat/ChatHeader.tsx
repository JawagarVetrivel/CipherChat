import React from 'react';
import {
  ArrowLeft,
  Lock,
  MoreVertical,
  Users,
  ShieldCheck,
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { Conversation, DirectConversation, Group } from '../../types';
import { Avatar } from '../common/Avatar';
import { StatusBadge } from '../common/StatusBadge';

interface ChatHeaderProps {
  conversation: Conversation;
  onOpenGroupDetails?: () => void;
  onInspectSecurity?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  conversation,
  onOpenGroupDetails,
  onInspectSecurity,
}) => {
  const { selectConversation, typingUsers } = useChat();

  const isDirect = conversation.type === 'direct';
  const directParticipant = isDirect ? (conversation as DirectConversation).participant : null;
  const group = !isDirect ? (conversation as Group) : null;

  const isSomeoneTyping = typingUsers.length > 0;

  return (
    <header
      id="chat-header"
      className="flex h-14 items-center justify-between border-b border-neutral-200 bg-white/80 px-4 backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/80"
    >
      <div className="flex items-center gap-3">
        {/* Mobile Back Button */}
        <button
          id="chat-mobile-back-button"
          onClick={() => selectConversation(null)}
          className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 md:hidden dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
          title="Back to conversations"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        {/* Avatar & Title */}
        {isDirect && directParticipant && (
          <div className="flex items-center gap-3">
            <Avatar
              name={directParticipant.displayName}
              status={directParticipant.status}
              size="md"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  {directParticipant.displayName}
                </h1>
                <span className="text-xs font-mono text-neutral-400">
                  @{directParticipant.username}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {isSomeoneTyping ? (
                  <span className="text-emerald-600 dark:text-emerald-400 animate-pulse font-medium">
                    typing...
                  </span>
                ) : (
                  <StatusBadge status={directParticipant.status} showLabel />
                )}
              </div>
            </div>
          </div>
        )}

        {!isDirect && group && (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-200 font-mono text-xs font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
              {group.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {group.name}
              </h1>
              <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                <Users className="h-3 w-3" />
                <span>{group.members.length} members</span>
                {isSomeoneTyping && (
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium ml-1 animate-pulse">
                    • {typingUsers.join(', ')} typing...
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* E2EE Lock Badge */}
        <button
          onClick={onInspectSecurity}
          className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-[11px] font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-800 transition-colors"
          title="End-to-End Encrypted. Click to inspect protocol session."
        >
          <Lock className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
          <span>E2EE Active</span>
        </button>

        {/* Group Management Drawer toggle */}
        {!isDirect && (
          <button
            id="group-info-toggle"
            onClick={onOpenGroupDetails}
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800"
            title="Group settings & members"
          >
            <Users className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Members</span>
          </button>
        )}

        {isDirect && (
          <button
            onClick={onInspectSecurity}
            className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
            title="Security & Fingerprint"
          >
            <ShieldCheck className="h-4 w-4" />
          </button>
        )}
      </div>
    </header>
  );
};
