import React, { useEffect, useRef, useState } from 'react';
import { ArrowUp, Lock } from 'lucide-react';
import { useChat } from '../../context/ChatContext';

interface MessageInputProps {
  conversationId: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({ conversationId }) => {
  const { sendMessage, sendTyping, isSending } = useChat();
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 140)}px`;
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
      // Restore on failure
      setText(toSend);
    }
  };

  return (
    <div
      id="message-input-container"
      className="border-t border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <div className="relative flex items-end rounded-xl border border-neutral-200 bg-neutral-50/80 p-1.5 transition-colors focus-within:border-neutral-900 focus-within:bg-white dark:border-neutral-800 dark:bg-neutral-950/80 dark:focus-within:border-neutral-400 dark:focus-within:bg-neutral-950">
        <textarea
          id="message-textarea"
          ref={textareaRef}
          rows={1}
          placeholder="Type an end-to-end encrypted message..."
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className="max-h-36 min-h-[40px] w-full resize-none bg-transparent px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none dark:text-neutral-100 dark:placeholder:text-neutral-500"
        />

        <button
          id="send-message-button"
          type="button"
          disabled={!text.trim() || isSending}
          onClick={handleSend}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-neutral-900 text-white transition-all hover:bg-neutral-800 active:scale-95 disabled:opacity-30 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
          title="Send message (Enter)"
        >
          {isSending ? (
            <div className="h-3.5 w-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin dark:border-neutral-900/40 dark:border-t-neutral-900" />
          ) : (
            <ArrowUp className="h-4 w-4" />
          )}
        </button>
      </div>

      <div className="mt-1.5 flex items-center justify-between px-1 text-[11px] text-neutral-400">
        <span className="flex items-center gap-1">
          <Lock className="h-3 w-3 text-neutral-400" />
          <span>Encrypted client-side with Double Ratchet envelope</span>
        </span>
        <span className="hidden sm:inline">Press Enter to send, Shift+Enter for newline</span>
      </div>
    </div>
  );
};
