import React, { useEffect, useRef } from 'react';
import { Check, CheckCheck, Lock, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { EncryptedMessage, Message } from '../../types';
import { Avatar } from '../common/Avatar';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  isGroup: boolean;
  typingUsers: string[];
  onInspectEnvelope: (envelope: EncryptedMessage) => void;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isLoading,
  isGroup,
  typingUsers,
  onInspectEnvelope,
}) => {
  const { user: currentUser } = useAuth();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  const formatTimestamp = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateHeader = (iso: string) => {
    const d = new Date(iso);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-2">
          <div className="w-5 h-5 border-2 border-neutral-300 dark:border-neutral-700 border-t-neutral-800 dark:border-t-neutral-200 rounded-full animate-spin" />
          <span className="text-xs text-neutral-400 font-mono">Decrypting session messages...</span>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="h-10 w-10 rounded-full bg-neutral-100 flex items-center justify-center mb-3 dark:bg-neutral-800">
          <Lock className="h-4 w-4 text-neutral-400" />
        </div>
        <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Encrypted Conversation Started
        </p>
        <p className="text-xs text-neutral-400 max-w-xs mt-1">
          Messages in this conversation are end-to-end encrypted on your device before being transmitted.
        </p>
      </div>
    );
  }

  // Group by date
  const grouped: Array<{ date: string; items: Message[] }> = [];
  messages.forEach((msg) => {
    const dateStr = formatDateHeader(msg.timestamp);
    const lastGroup = grouped[grouped.length - 1];
    if (lastGroup && lastGroup.date === dateStr) {
      lastGroup.items.push(msg);
    } else {
      grouped.push({ date: dateStr, items: [msg] });
    }
  });

  return (
    <div id="message-list-container" className="flex-1 overflow-y-auto p-4 space-y-6">
      {grouped.map((group, gIdx) => (
        <div key={gIdx} className="space-y-3">
          {/* Date Divider */}
          <div className="flex items-center justify-center">
            <span className="rounded-full bg-neutral-100 px-3 py-1 text-[11px] font-medium text-neutral-500 dark:bg-neutral-800/80 dark:text-neutral-400">
              {group.date}
            </span>
          </div>

          {/* Messages */}
          <div className="space-y-2">
            {group.items.map((msg) => {
              const isMe = msg.senderId === currentUser?.id;

              return (
                <div
                  key={msg.id}
                  id={`message-bubble-${msg.id}`}
                  className={`group flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  {/* Avatar for received group messages */}
                  {!isMe && isGroup && (
                    <Avatar name={msg.sender.displayName} size="sm" className="mb-0.5" />
                  )}

                  {/* Message Bubble Container */}
                  <div className={`relative max-w-[85%] sm:max-w-md ${isMe ? 'items-end' : 'items-start'}`}>
                    {/* Sender name for group chats */}
                    {!isMe && isGroup && (
                      <span className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400 ml-1 mb-0.5 block">
                        {msg.sender.displayName}
                      </span>
                    )}

                    <div
                      className={`relative rounded-2xl px-3.5 py-2 text-sm leading-relaxed transition-all shadow-xs ${
                        isMe
                          ? 'bg-neutral-900 text-neutral-50 rounded-br-xs dark:bg-neutral-100 dark:text-neutral-950'
                          : 'bg-white text-neutral-900 border border-neutral-200/80 rounded-bl-xs dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-800'
                      }`}
                    >
                      {/* Plaintext (decrypted in memory only) */}
                      <p className="whitespace-pre-wrap break-words">{msg.plaintext}</p>

                      {/* Timestamp & Status Metadata */}
                      <div
                        className={`flex items-center justify-end gap-1 mt-1 text-[10px] font-mono ${
                          isMe
                            ? 'text-neutral-300 dark:text-neutral-500'
                            : 'text-neutral-400 dark:text-neutral-500'
                        }`}
                      >
                        <span>{formatTimestamp(msg.timestamp)}</span>

                        {isMe && (
                          <span title={`Status: ${msg.status}`}>
                            {msg.status === 'sending' && (
                              <div className="w-2.5 h-2.5 border-1 border-current border-t-transparent rounded-full animate-spin" />
                            )}
                            {msg.status === 'sent' && <Check className="h-3 w-3" />}
                            {(msg.status === 'delivered' || msg.status === 'read') && (
                              <CheckCheck className="h-3 w-3 text-emerald-400 dark:text-emerald-600" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Cryptographic Inspector Hover Trigger */}
                    {msg.rawEnvelope && (
                      <button
                        onClick={() => onInspectEnvelope(msg.rawEnvelope!)}
                        className={`absolute top-1/2 -translate-y-1/2 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 ${
                          isMe ? '-left-8' : '-right-8'
                        }`}
                        title="Inspect E2EE wire envelope & ciphertext"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 pl-2">
          <div className="flex space-x-1">
            <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="font-mono text-[11px]">{typingUsers.join(', ')} is typing...</span>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};
