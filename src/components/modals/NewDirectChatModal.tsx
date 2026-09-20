import React, { useEffect, useState } from 'react';
import { Search, UserPlus, X, MessageSquare, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { userService } from '../../services/api/userService';
import { User } from '../../types';
import { Avatar } from '../common/Avatar';
import { StatusBadge } from '../common/StatusBadge';

interface NewDirectChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewDirectChatModal: React.FC<NewDirectChatModalProps> = ({ isOpen, onClose }) => {
  const { user: currentUser } = useAuth();
  const { startDirectConversation } = useChat();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<Omit<User, 'email'>>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      return;
    }

    // Pre-populate with default contacts if query is empty
    setIsSearching(true);
    userService.searchUsers('', currentUser?.id)
      .then((users) => {
        // If query is empty, show all available demo peers
        if (!query.trim()) {
          const all = userService.searchUsers(' ', currentUser?.id);
          all.then(setResults);
        }
      })
      .finally(() => setIsSearching(false));
  }, [isOpen, currentUser]);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      setIsSearching(true);
      userService.searchUsers(query, currentUser?.id)
        .then(setResults)
        .finally(() => setIsSearching(false));
    }, 200);

    return () => clearTimeout(timer);
  }, [query, isOpen, currentUser]);

  if (!isOpen) return null;

  const handleSelectUser = async (peer: Omit<User, 'email'>) => {
    setIsCreating(true);
    try {
      await startDirectConversation(peer);
      onClose();
    } catch (err) {
      console.error('Failed to start conversation:', err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div
      id="new-direct-chat-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[1px]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="new-direct-chat-modal"
        className="w-full max-w-md rounded-xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-900 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Start Conversation
            </h2>
          </div>
          <button
            id="close-direct-chat-modal"
            onClick={onClose}
            className="rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search input */}
        <div className="p-4 border-b border-neutral-100 dark:border-neutral-800/80">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              id="search-user-input"
              type="text"
              placeholder="Search by username (e.g. @rahul123)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50 pl-9 pr-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:bg-white focus:outline-none dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-600 dark:focus:border-neutral-400"
            />
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-neutral-500">
            <Shield className="h-3 w-3 text-neutral-400" />
            <span>Email addresses are protected and hidden from user search.</span>
          </div>
        </div>

        {/* Results List */}
        <div className="max-h-72 overflow-y-auto p-2">
          {isSearching ? (
            <div className="py-8 text-center text-xs text-neutral-400">Searching directory...</div>
          ) : results.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                No users found matching &quot;{query}&quot;
              </p>
              <p className="text-[11px] text-neutral-400 mt-1">
                Try searching for @rahul123, @priya_k, or @alex_c
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {results.map((peer) => (
                <div
                  key={peer.id}
                  id={`user-search-result-${peer.username}`}
                  className="flex items-center justify-between rounded-lg p-2.5 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800/60"
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={peer.displayName} status={peer.status} size="md" />
                    <div>
                      <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {peer.displayName}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-neutral-500">
                          @{peer.username}
                        </span>
                        <StatusBadge status={peer.status} showLabel={false} />
                      </div>
                    </div>
                  </div>

                  <button
                    id={`message-user-button-${peer.username}`}
                    disabled={isCreating}
                    onClick={() => handleSelectUser(peer)}
                    className="inline-flex items-center gap-1.5 rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 active:scale-95 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
                  >
                    <MessageSquare className="h-3 w-3" />
                    <span>Message</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-100 bg-neutral-50/50 px-4 py-3 text-right dark:border-neutral-800 dark:bg-neutral-950/40">
          <button
            onClick={onClose}
            className="rounded-md border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-100 dark:border-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
