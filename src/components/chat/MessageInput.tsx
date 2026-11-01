import React, { useEffect, useRef, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { DirectConversation } from '../../types';

interface MessageInputProps {
  conversationId: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({ conversationId }) => {
  const { sendMessage, sendTyping, isSending, activeConversation } = useChat();
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const peerHandle =
    activeConversation && activeConversation.type === 'direct'
      ? `@${(activeConversation as DirectConversation).participant.username}`
      : activeConversation?.type === 'group'
      ? `#${activeConversation.name}`
      : '@peer';

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 120)}px`;
    }
  }, [text]);

  // Focus on conversation change
  useEffect(() => {
    setText('');
    textareaRef.current?.focus();
  }, [conversationId]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    sendTyping(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter to send, Shift+Enter for newline
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async () => {
    if (!text.trim() || isSending) return;

    const toSend = text;
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      sendTyping(false);
      await sendMessage(toSend);
    } catch (err) {
      console.error('Failed to send message:', err);
      setText(toSend);
    }
  };

  return (
    <div
      id="message-input-container"
      className="p-3 sm:p-4 bg-[#070709] border-t border-[#1A1A22] select-none flex-shrink-0"
    >
      {/* Input Card Container */}
      <div className="rounded-xl border border-[#1E1E28] bg-[#0C0C12] p-2.5 shadow-lg focus-within:border-[#FF5500]/60 focus-within:shadow-[0_0_20px_rgba(255,85,0,0.15)] transition-all">
        {/* Text Area */}
        <textarea
          id="message-textarea"
          ref={textareaRef}
          rows={1}
          placeholder={`Write an encrypted message to ${peerHandle}...`}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className="max-h-28 min-h-[38px] w-full resize-none bg-transparent px-2 py-1 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
        />

        {/* Toolbar Row Inside Card */}
        <div className="flex items-center justify-between pt-1.5 border-t border-[#181822] mt-1">
          {/* Status Indicator */}
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-[#FF5500] shadow-[0_0_6px_#FF5500]" />
            <span>AES-256-GCM client encrypted</span>
          </div>

          {/* Shortcut Hint & Orange Send Button */}
          <div className="flex items-center gap-2.5">
            <span className="hidden sm:inline text-[10px] font-mono text-slate-500">
              ⏎ send · ⇧ newline
            </span>

            <button
              id="send-message-button"
              type="button"
              disabled={!text.trim() || isSending}
              onClick={handleSend}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#FF5500] to-[#FF7700] text-white font-semibold text-xs px-3.5 py-1.5 hover:brightness-110 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-[0_0_15px_rgba(255,85,0,0.35)]"
              title="Send Encrypted Message"
            >
              <span>Send</span>
              {isSending ? (
                <div className="h-3 w-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <ArrowUp className="h-3.5 w-3.5 stroke-[2.5]" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
