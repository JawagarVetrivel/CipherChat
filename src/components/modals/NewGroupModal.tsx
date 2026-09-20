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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setGroupName('');
      setDescription('');
      setSearchQuery('');
      setSelectedUsers([]);
      setError(null);
      return;
    }

    // Default peer suggestions
    userService.searchUsers('', currentUser?.id).then((users) => {
      userService.searchUsers(' ', currentUser?.id).then(setSearchResults);
    });
  }, [isOpen, currentUser]);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      userService.searchUsers(searchQuery, currentUser?.id).then(setSearchResults);
    }, 200);

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
    if (!groupName.trim()) {
      setError('Please provide a group name.');
      return;
    }
    if (selectedUsers.length === 0) {
      setError('Please select at least one member for the group.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await createGroup(groupName.trim(), selectedUsers, description.trim());
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create group.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="new-group-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[1px]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="new-group-modal"
        className="w-full max-w-lg rounded-xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-900 overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Create New Group
            </h2>
          </div>
          <button
            id="close-group-modal-button"
            onClick={onClose}
            className="rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleCreate} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-5 space-y-4 overflow-y-auto flex-1">
            {error && (
              <div className="flex items-center gap-2 rounded-md bg-red-50 p-2.5 text-xs text-red-600 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-900/40">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Group Name */}
            <div>
              <label
                htmlFor="group-name-input"
                className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1"
              >
                Group Name <span className="text-neutral-400">*</span>
              </label>
              <input
                id="group-name-input"
                type="text"
                placeholder="e.g. Cryptography Lab Team"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                required
                className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:bg-white focus:outline-none dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-600 dark:focus:border-neutral-400"
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="group-description-input"
                className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1"
              >
                Description (Optional)
              </label>
              <input
                id="group-description-input"
                type="text"
                placeholder="Brief purpose or project topic..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:bg-white focus:outline-none dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-600 dark:focus:border-neutral-400"
              />
            </div>

            {/* Selected Chips */}
            {selectedUsers.length > 0 && (
              <div>
                <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400 block mb-1.5">
                  Selected Members ({selectedUsers.length})
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {selectedUsers.map((u) => (
                    <span
                      key={u.id}
                      className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2 py-1 text-xs text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200"
                    >
                      <span>@{u.username}</span>
                      <button
                        type="button"
                        onClick={() => toggleSelectUser(u)}
                        className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
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
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Add Members by Username
              </label>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search @username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 bg-neutral-50 pl-9 pr-3 py-1.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:bg-white focus:outline-none dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-600 dark:focus:border-neutral-400"
                />
              </div>

              <div className="max-h-40 overflow-y-auto rounded-lg border border-neutral-200 p-1 dark:border-neutral-800">
                {searchResults.length === 0 ? (
                  <div className="py-4 text-center text-xs text-neutral-400">No users found</div>
                ) : (
                  searchResults.map((peer) => {
                    const isSelected = selectedUsers.some((u) => u.id === peer.id);
                    return (
                      <div
                        key={peer.id}
                        onClick={() => toggleSelectUser(peer)}
                        className={`flex items-center justify-between rounded-md p-2 cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-neutral-100 dark:bg-neutral-800'
                            : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Avatar name={peer.displayName} status={peer.status} size="sm" />
                          <div>
                            <span className="text-xs font-medium text-neutral-900 dark:text-neutral-100 block">
                              {peer.displayName}
                            </span>
                            <span className="text-[11px] font-mono text-neutral-500">
                              @{peer.username}
                            </span>
                          </div>
                        </div>

                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
                            isSelected
                              ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900'
                              : 'border-neutral-300 dark:border-neutral-700'
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3" />}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-neutral-200 bg-neutral-50 px-5 py-3 dark:border-neutral-800 dark:bg-neutral-950">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-100 dark:border-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800"
            >
              Cancel
            </button>
            <button
              id="submit-create-group-button"
              type="submit"
              disabled={isSubmitting || !groupName.trim() || selectedUsers.length === 0}
              className="rounded-md bg-neutral-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 active:scale-95 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
            >
              {isSubmitting ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
