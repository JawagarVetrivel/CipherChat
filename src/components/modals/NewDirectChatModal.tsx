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
        setResults(users);
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="new-direct-chat-modal"
        className="w-full max-w-md rounded-2xl border border-[#22222E] bg-[#0E0E14] shadow-[0_0_35px_rgba(0,0,0,0.8)] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1E1E28] px-5 py-4 bg-[#0A0A0E]">
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-[#FF5500]" />
            <h2 className="text-xs font-semibold text-white tracking-tight">
              Initialize Peer Key Exchange
            </h2>
          </div>
          <button
            id="close-direct-chat-modal"
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-[#181822] hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search input */}
        <div className="p-4 border-b border-[#1E1E28]">
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
              className="w-full rounded-lg border border-[#22222E] bg-[#070709] pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:border-[#FF5500] focus:outline-none transition-colors font-mono"
            />
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
            <Shield className="h-3 w-3 text-[#FF5500]" />
            <span>Zero MITM directory. Cryptographic public keys verified on peer selection.</span>
          </div>
        </div>

        {/* User list */}
        <div className="max-h-72 overflow-y-auto p-2">
          {isSearching ? (
            <div className="py-8 text-center text-xs font-mono text-[#FF7A1A]">
              Querying key directory...
            </div>
          ) : results.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No registered peers found matching <span className="font-mono text-slate-400">"{query}"</span>.
            </div>
          ) : (
            <div className="space-y-1">
              {results.map((peer) => (
                <button
                  key={peer.id}
                  onClick={() => handleSelectUser(peer)}
                  disabled={isCreating}
                  className="w-full flex items-center justify-between rounded-xl p-2.5 hover:bg-[#151520] transition-colors text-left group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={peer.displayName} status={peer.status} size="md" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white truncate">
                          {peer.displayName}
                        </span>
                        <StatusBadge status={peer.status} />
                      </div>
                      <span className="text-[11px] font-mono text-slate-500 block truncate">
                        @{peer.username}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-slate-500 group-hover:text-[#FF7A1A] transition-colors">
                    <span className="text-[11px] font-mono hidden sm:inline">Connect</span>
                    <MessageSquare className="h-4 w-4" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
