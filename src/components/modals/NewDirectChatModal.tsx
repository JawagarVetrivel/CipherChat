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

    setIsSearching(true);
    userService.searchUsers('', currentUser?.id)
      .then((users) => {
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="new-direct-chat-modal"
        className="w-full max-w-md rounded-2xl border border-[#1E2638] bg-[#0D1118] shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#171D28] px-5 py-4 bg-[#0A0D13]">
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-[#00E599]" />
            <h2 className="text-xs font-semibold text-white tracking-tight">
              Initialize Peer Key Exchange
            </h2>
          </div>
          <button
            id="close-direct-chat-modal"
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-[#141B28] hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search input */}
        <div className="p-4 border-b border-[#171D28]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              id="search-user-input"
              type="text"
              placeholder={
                currentUser?.username === 'rahul123'
                  ? 'Search by username (e.g. @priya_k)...'
                  : 'Search by username (e.g. @rahul123)...'
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              className="w-full rounded-lg border border-[#1E2638] bg-[#0A0D13] pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:border-[#00E599] focus:outline-none transition-colors font-mono"
            />
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
            <Shield className="h-3 w-3 text-[#00E599]" />
            <span>Zero MITM directory. Cryptographic public keys verified on peer selection.</span>
          </div>
        </div>

        {/* Results List */}
        <div className="max-h-72 overflow-y-auto p-2">
          {isSearching ? (
            <div className="py-8 text-center text-xs font-mono text-[#00E599]">Searching directory...</div>
          ) : results.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-xs font-medium text-slate-300">
                No users found matching &quot;{query}&quot;
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                {currentUser?.username === 'rahul123'
                  ? 'Try searching for @priya_k or @marcus'
                  : 'Try searching for @rahul123 or @priya_k'}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {results.map((peer) => (
                <div
                  key={peer.id}
                  id={`user-search-result-${peer.username}`}
                  className="flex items-center justify-between rounded-xl p-2.5 transition-colors hover:bg-[#121824] border border-transparent hover:border-[#1E2638]"
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={peer.displayName} status={peer.status} size="md" />
                    <div>
                      <div className="text-xs font-semibold text-white">
                        {peer.displayName}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-slate-400">
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
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#00E599] px-3 py-1.5 text-xs font-bold text-[#051E14] hover:bg-[#00F5A3] active:scale-95 disabled:opacity-50 transition-all shadow-[0_0_10px_rgba(0,229,153,0.2)]"
                  >
                    <MessageSquare className="h-3 w-3" />
                    <span>Connect</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[#171D28] bg-[#0A0D13] px-4 py-3 text-right">
          <button
            onClick={onClose}
            className="rounded-lg border border-[#1E2638] px-3 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-[#141B28] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
