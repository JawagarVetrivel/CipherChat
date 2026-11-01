import React, { useEffect, useState } from 'react';
import { Users, X, Search, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { userService } from '../../services/api/userService';
import { User } from '../../types';
import { Avatar } from '../common/Avatar';

interface NewGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewGroupModal: React.FC<NewGroupModalProps> = ({ isOpen, onClose }) => {
  const { user: currentUser } = useAuth();
  const { createGroup } = useChat();

  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<Omit<User, 'email'>>>([]);
  const [selectedUsers, setSelectedUsers] = useState<Array<Omit<User, 'email'>>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPeers, setIsLoadingPeers] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // When modal opens, load all peers right away
  useEffect(() => {
    if (!isOpen) {
      setGroupName('');
      setDescription('');
      setSearchQuery('');
      setSelectedUsers([]);
      setError(null);
      return;
    }

    setIsLoadingPeers(true);
    userService.searchUsers('', currentUser?.id)
      .then((peers) => {
        setSearchResults(peers);
      })
      .finally(() => setIsLoadingPeers(false));
  }, [isOpen, currentUser]);

  // Handle live search
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      userService.searchUsers(searchQuery, currentUser?.id).then(setSearchResults);
    }, 150);

    return () => clearTimeout(timer);
  }, [searchQuery, isOpen, currentUser]);

  if (!isOpen) return null;

  const toggleSelectUser = (user: Omit<User, 'email'>) => {
    if (selectedUsers.some((u) => u.id === user.id)) {
      setSelectedUsers((prev) => prev.filter((u) => u.id !== user.id));
    } else {
      setSelectedUsers((prev) => [...prev, user]);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = groupName.trim();
    if (!cleanName) {
      setError('Please provide a channel or group name.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await createGroup(cleanName, selectedUsers, description.trim());
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create channel.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="new-group-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="new-group-modal"
        className="w-full max-w-lg rounded-2xl border border-[#22222E] bg-[#0E0E14] shadow-[0_0_35px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1E1E28] px-5 py-4 bg-[#0A0A0E]">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[#FF5500]" />
            <h2 className="text-xs font-semibold text-white tracking-tight">
              Create Encrypted Channel / Group
            </h2>
          </div>
          <button
            id="close-group-modal-button"
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-[#181822] hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleCreate} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-5 space-y-4 overflow-y-auto flex-1">
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-950/40 p-2.5 text-xs text-red-400 border border-red-900/50">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Group Name */}
            <div>
              <label
                htmlFor="group-name-input"
                className="block text-xs font-mono text-slate-300 mb-1"
              >
                Channel Name <span className="text-[#FF5500]">*</span>
              </label>
              <input
                id="group-name-input"
                type="text"
                placeholder="e.g. crypto-lab, dev-team, security-audit"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                required
                autoFocus
                className="w-full rounded-lg border border-[#22222E] bg-[#070709] px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:border-[#FF5500] focus:outline-none transition-colors"
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="group-description-input"
                className="block text-xs font-mono text-slate-300 mb-1"
              >
                Description (Optional)
              </label>
              <input
                id="group-description-input"
                type="text"
                placeholder="Brief purpose or project scope..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg border border-[#22222E] bg-[#070709] px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:border-[#FF5500] focus:outline-none transition-colors"
              />
            </div>

            {/* Selected Chips */}
            {selectedUsers.length > 0 && (
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1.5">
                  Selected Peers ({selectedUsers.length})
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {selectedUsers.map((u) => (
                    <span
                      key={u.id}
                      className="inline-flex items-center gap-1.5 rounded-md bg-[#FF5500]/15 border border-[#FF5500]/30 px-2 py-0.5 text-xs text-[#FFA040] font-mono"
                    >
                      <span>@{u.username}</span>
                      <button
                        type="button"
                        onClick={() => toggleSelectUser(u)}
                        className="hover:text-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* User Search & Selection */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-mono text-slate-300">
                  Select Peers to Add (Optional)
                </label>
                <span className="text-[10px] font-mono text-slate-500">
                  {selectedUsers.length} selected
                </span>
              </div>

              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter peers by @username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-[#22222E] bg-[#070709] pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:border-[#FF5500] focus:outline-none transition-colors font-mono"
                />
              </div>

              <div className="max-h-48 overflow-y-auto rounded-lg border border-[#1E1E28] bg-[#070709] p-1 space-y-0.5">
                {isLoadingPeers ? (
                  <div className="py-6 text-center text-xs font-mono text-[#FF7A1A]">Loading available peers...</div>
                ) : searchResults.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-500 font-mono">No peers found</div>
                ) : (
                  searchResults.map((peer) => {
                    const isSelected = selectedUsers.some((u) => u.id === peer.id);
                    return (
                      <div
                        key={peer.id}
                        onClick={() => toggleSelectUser(peer)}
                        className={`flex items-center justify-between rounded-lg p-2 cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-[#181824] border border-[#FF5500]/30'
                            : 'hover:bg-[#121218] border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Avatar name={peer.displayName} status={peer.status} size="sm" />
                          <div>
                            <span className="text-xs font-medium text-white block">
                              {peer.displayName}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">
                              @{peer.username}
                            </span>
                          </div>
                        </div>

                        <div
                          className={`flex h-4 w-4 items-center justify-center rounded transition-colors ${
                            isSelected
                              ? 'bg-gradient-to-r from-[#FF5500] to-[#FF7700] text-white shadow-[0_0_6px_#FF5500]'
                              : 'border border-[#262638]'
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-[#1E1E28] bg-[#0A0A0E] px-5 py-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#242432] px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              id="submit-create-group-button"
              type="submit"
              disabled={isSubmitting || !groupName.trim()}
              className="rounded-lg bg-gradient-to-r from-[#FF5500] to-[#FF7700] px-4 py-1.5 text-xs font-bold text-white hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all shadow-[0_0_12px_rgba(255,85,0,0.35)]"
            >
              {isSubmitting ? 'Creating Channel...' : 'Create Channel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
