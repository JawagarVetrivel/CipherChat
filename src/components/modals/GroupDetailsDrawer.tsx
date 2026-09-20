import React, { useState } from 'react';
import {
  X,
  UserPlus,
  Trash2,
  LogOut,
  Edit2,
  Check,
  Shield,
  Search,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { userService } from '../../services/api/userService';
import { Group, User } from '../../types';
import { Avatar } from '../common/Avatar';
import { Badge } from '../common/Badge';

interface GroupDetailsDrawerProps {
  group: Group;
  isOpen: boolean;
  onClose: () => void;
}

export const GroupDetailsDrawer: React.FC<GroupDetailsDrawerProps> = ({
  group,
  isOpen,
  onClose,
}) => {
  const { user: currentUser } = useAuth();
  const { addGroupMembers, removeGroupMember, updateGroupName, leaveGroup } = useChat();

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(group.name);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [addSearchQuery, setAddSearchQuery] = useState('');
  const [addSearchResults, setAddSearchResults] = useState<Array<Omit<User, 'email'>>>([]);

  if (!isOpen) return null;

  const isAdmin = group.members.some(
    (m) => m.userId === currentUser?.id && m.role === 'admin'
  );

  const handleSaveName = async () => {
    if (!editedName.trim() || editedName === group.name) {
      setIsEditingName(false);
      return;
    }
    try {
      await updateGroupName(group.id, editedName.trim());
      setIsEditingName(false);
    } catch (err) {
      console.error('Failed to update group name:', err);
    }
  };

  const handleSearchUsers = async (q: string) => {
    setAddSearchQuery(q);
    if (!q.trim()) {
      setAddSearchResults([]);
      return;
    }
    const results = await userService.searchUsers(q, currentUser?.id);
    const existingIds = new Set(group.members.map((m) => m.userId));
    setAddSearchResults(results.filter((u) => !existingIds.has(u.id)));
  };

  const handleAddMember = async (user: Omit<User, 'email'>) => {
    try {
      await addGroupMembers(group.id, [user]);
      setAddSearchQuery('');
      setAddSearchResults([]);
      setIsAddingMember(false);
    } catch (err) {
      console.error('Failed to add member:', err);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (window.confirm('Are you sure you want to remove this member from the group?')) {
      try {
        await removeGroupMember(group.id, memberId);
      } catch (err) {
        console.error('Failed to remove member:', err);
      }
    }
  };

  const handleLeave = async () => {
    if (window.confirm('Are you sure you want to leave this group?')) {
      try {
        await leaveGroup(group.id);
        onClose();
      } catch (err) {
        console.error('Failed to leave group:', err);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/30 backdrop-blur-[1px]">
      <div
        id="group-details-drawer"
        className="h-full w-full max-w-sm border-l border-neutral-200 bg-white shadow-xl flex flex-col dark:border-neutral-800 dark:bg-neutral-900 animate-in slide-in-from-right duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Group Details
          </span>
          <button
            id="close-group-details"
            onClick={onClose}
            className="rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Group Identity Card */}
          <div className="flex flex-col items-center text-center pb-4 border-b border-neutral-100 dark:border-neutral-800">
            <div className="h-16 w-16 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center text-xl font-mono text-neutral-700 mb-3 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300">
              {group.name.slice(0, 2).toUpperCase()}
            </div>

            {isEditingName && isAdmin ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  autoFocus
                  className="rounded border border-neutral-300 px-2 py-1 text-sm font-medium text-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                />
                <button
                  onClick={handleSaveName}
                  className="rounded bg-neutral-900 p-1 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900"
                >
                  <Check className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                  {group.name}
                </h3>
                {isAdmin && (
                  <button
                    onClick={() => {
                      setEditedName(group.name);
                      setIsEditingName(true);
                    }}
                    className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                    title="Edit group name"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}

            {group.description && (
              <p className="text-xs text-neutral-500 mt-1 max-w-xs">{group.description}</p>
            )}

            <div className="mt-3 flex items-center gap-2">
              <Badge variant="neutral">{group.members.length} members</Badge>
              <Badge variant="success">E2EE Group Protocol Ready</Badge>
            </div>
          </div>

          {/* Members Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Members ({group.members.length})
              </span>
              {isAdmin && !isAddingMember && (
                <button
                  onClick={() => setIsAddingMember(true)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-neutral-900 hover:underline dark:text-neutral-100"
                >
                  <UserPlus className="h-3 w-3" />
                  <span>Add</span>
                </button>
              )}
            </div>

            {/* Add Member inline form */}
            {isAddingMember && (
              <div className="mb-3 rounded-lg border border-neutral-200 bg-neutral-50 p-2.5 dark:border-neutral-800 dark:bg-neutral-950">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                    Add member by @username
                  </span>
                  <button
                    onClick={() => {
                      setIsAddingMember(false);
                      setAddSearchQuery('');
                      setAddSearchResults([]);
                    }}
                    className="text-neutral-400 hover:text-neutral-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
                <div className="relative mb-2">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Type @username..."
                    value={addSearchQuery}
                    onChange={(e) => handleSearchUsers(e.target.value)}
                    autoFocus
                    className="w-full rounded border border-neutral-200 bg-white pl-8 pr-2 py-1 text-xs text-neutral-900 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                  />
                </div>
                {addSearchResults.length > 0 && (
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {addSearchResults.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center justify-between rounded p-1.5 hover:bg-neutral-200/60 dark:hover:bg-neutral-800"
                      >
                        <div className="flex items-center gap-2">
                          <Avatar name={u.displayName} size="sm" />
                          <span className="text-xs text-neutral-800 dark:text-neutral-200">
                            @{u.username}
                          </span>
                        </div>
                        <button
                          onClick={() => handleAddMember(u)}
                          className="rounded bg-neutral-900 px-2 py-0.5 text-[11px] font-medium text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900"
                        >
                          Add
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Member List */}
            <div className="space-y-2">
              {group.members.map((m) => {
                const isSelf = m.userId === currentUser?.id;
                return (
                  <div
                    key={m.userId}
                    className="flex items-center justify-between rounded-lg p-2 hover:bg-neutral-50 dark:hover:bg-neutral-800/40"
                  >
                    <div className="flex items-center gap-2.5">
                      <Avatar name={m.user.displayName} status={m.user.status} size="sm" />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-neutral-900 dark:text-neutral-100">
                            {m.user.displayName}
                          </span>
                          {isSelf && <span className="text-[10px] text-neutral-400">(You)</span>}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-mono text-neutral-500">
                            @{m.user.username}
                          </span>
                          {m.role === 'admin' && (
                            <Badge variant="accent" size="sm">
                              Admin
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {isAdmin && !isSelf && (
                      <button
                        onClick={() => handleRemoveMember(m.userId)}
                        className="rounded p-1 text-neutral-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                        title="Remove member"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cryptography notice */}
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-600 dark:border-neutral-800 dark:bg-neutral-950/60 dark:text-neutral-400">
            <div className="flex items-center gap-1.5 font-medium text-neutral-900 dark:text-neutral-200 mb-1">
              <Shield className="h-3.5 w-3.5 text-neutral-700 dark:text-neutral-300" />
              <span>Group Key Management</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Designed for Sender Keys / TreeKEM group ratchet protocols. Group member changes will
              re-key the broadcast chain once protocol extensions are activated.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-neutral-200 p-4 dark:border-neutral-800">
          <button
            onClick={handleLeave}
            className="w-full flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50/50 py-2 text-xs font-medium text-red-600 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/40"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Leave Group</span>
          </button>
        </div>
      </div>
    </div>
  );
};
