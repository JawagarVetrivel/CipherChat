import React, { useEffect, useRef, useState } from 'react';
import {
  Paperclip,
  Code,
  Smile,
  Mic,
  ArrowUp,
} from 'lucide-react';
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
      className="p-3 sm:p-4 bg-[#080A0F] border-t border-[#171D28]/80 select-none flex-shrink-0"
    >
      {/* Input Card Container */}
      <div className="rounded-xl border border-[#1E2638] bg-[#0D1118] p-2.5 shadow-lg focus-within:border-[#00E599]/50 transition-colors">
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
        <div className="flex items-center justify-between pt-1 border-t border-[#171D28]/60 mt-1">
          {/* Action Icons */}
          <div className="flex items-center gap-1 text-slate-400">
            <button
              type="button"
              className="p-1.5 rounded hover:bg-[#141B28] hover:text-white transition-colors"
              title="Attach File"
            >
              <Paperclip className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="p-1.5 rounded hover:bg-[#141B28] hover:text-white transition-colors"
              title="Code Snippet"
            >
              <Code className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="p-1.5 rounded hover:bg-[#141B28] hover:text-white transition-colors"
              title="Emoji"
            >
              <Smile className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="p-1.5 rounded hover:bg-[#141B28] hover:text-white transition-colors"
              title="Encrypted Voice Note"
            >
              <Mic className="h-4 w-4" />
            </button>
          </div>

          {/* Shortcut Hint & Emerald Send Button */}
          <div className="flex items-center gap-2.5">
            <span className="hidden sm:inline text-[10px] font-mono text-slate-500">
              ⏎ send · ⇧ newline
            </span>

            <button
              id="send-message-button"
              type="button"
              disabled={!text.trim() || isSending}
              onClick={handleSend}
              className="flex items-center gap-1.5 rounded-lg bg-[#00E599] text-[#051E14] font-semibold text-xs px-3 py-1.5 hover:bg-[#00F5A3] active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-[0_0_10px_rgba(0,229,153,0.2)]"
              title="Send Encrypted Message"
            >
              <span>Send</span>
              {isSending ? (
                <div className="h-3 w-3 border-2 border-[#051E14]/40 border-t-[#051E14] rounded-full animate-spin" />
              ) : (
                <ArrowUp className="h-3.5 w-3.5 stroke-[2.5]" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Footer Status Indicators */}
      <div className="mt-2 flex items-center justify-between px-1 text-[10px] font-mono text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#00E599] shadow-[0_0_4px_#00E599]" />
          <span>Client-side AES-256-GCM encryption enabled</span>
        </div>
        <span className="text-slate-400">Ratchet state: synchronized</span>
      </div>
    </div>
  );
};
