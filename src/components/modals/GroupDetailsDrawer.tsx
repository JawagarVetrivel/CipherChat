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
    <div className="fixed inset-0 z-40 flex justify-end bg-black/60 backdrop-blur-sm select-none">
      <div
        id="group-details-drawer"
        className="h-full w-full max-w-sm border-l border-[#171D28] bg-[#0A0D13] shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#171D28] px-5 py-4 bg-[#0A0D13]">
          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400">
            CHANNEL CONFIGURATION
          </span>
          <button
            id="close-group-details"
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-[#141B28] hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Group Identity Card */}
          <div className="flex flex-col items-center text-center pb-4 border-b border-[#171D28]">
            <div className="h-14 w-14 rounded-2xl bg-[#0B281E] border border-[#00E599]/30 flex items-center justify-center text-lg font-mono text-[#00E599] font-bold mb-3">
              {group.name.slice(0, 2).toUpperCase()}
            </div>

            {isEditingName && isAdmin ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  autoFocus
                  className="rounded border border-[#1E2638] bg-[#0D1118] px-2 py-1 text-xs text-white focus:border-[#00E599] focus:outline-none"
                />
                <button
                  onClick={handleSaveName}
                  className="rounded bg-[#00E599] p-1 text-[#051E14] hover:bg-[#00F5A3]"
                >
                  <Check className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white">
                  {group.name}
                </h3>
                {isAdmin && (
                  <button
                    onClick={() => {
                      setEditedName(group.name);
                      setIsEditingName(true);
                    }}
                    className="text-slate-500 hover:text-white"
                    title="Edit channel name"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}

            {group.description && (
              <p className="text-xs text-slate-400 mt-1 max-w-xs">{group.description}</p>
            )}

            <div className="mt-3 flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-300 bg-[#121824] px-2 py-0.5 rounded border border-[#1E2638]">
                {group.members.length} peers
              </span>
              <span className="text-[10px] font-mono text-[#00E599] bg-[#0B281E] border border-[#00E599]/30 px-2 py-0.5 rounded">
                TreeKEM Ready
              </span>
            </div>
          </div>

          {/* Members Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-200">
                Peers ({group.members.length})
              </span>
              {isAdmin && !isAddingMember && (
                <button
                  onClick={() => setIsAddingMember(true)}
                  className="inline-flex items-center gap-1 text-xs font-mono text-[#00E599] hover:underline"
                >
                  <UserPlus className="h-3 w-3" />
                  <span>+ Add</span>
                </button>
              )}
            </div>

            {/* Add Member inline form */}
            {isAddingMember && (
              <div className="mb-3 rounded-xl border border-[#171D28] bg-[#0D1118] p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono text-slate-400">
                    Add peer by @handle
                  </span>
                  <button
                    onClick={() => {
                      setIsAddingMember(false);
                      setAddSearchQuery('');
                      setAddSearchResults([]);
                    }}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
                <div className="relative mb-2">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Type @username..."
                    value={addSearchQuery}
                    onChange={(e) => handleSearchUsers(e.target.value)}
                    autoFocus
                    className="w-full rounded border border-[#1E2638] bg-[#0A0D13] pl-8 pr-2 py-1 text-xs text-white focus:border-[#00E599] focus:outline-none font-mono"
                  />
                </div>
                {addSearchResults.length > 0 && (
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {addSearchResults.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center justify-between rounded p-1.5 hover:bg-[#141B28]"
                      >
                        <div className="flex items-center gap-2">
                          <Avatar name={u.displayName} size="sm" />
                          <span className="text-xs font-mono text-slate-300">
                            @{u.username}
                          </span>
                        </div>
                        <button
                          onClick={() => handleAddMember(u)}
                          className="rounded bg-[#00E599] px-2 py-0.5 text-[11px] font-bold text-[#051E14] hover:bg-[#00F5A3]"
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
            <div className="space-y-1.5">
              {group.members.map((m) => {
                const isSelf = m.userId === currentUser?.id;
                return (
                  <div
                    key={m.userId}
                    className="flex items-center justify-between rounded-lg p-2 hover:bg-[#0D1118] border border-transparent hover:border-[#171D28] transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Avatar name={m.user.displayName} status={m.user.status} size="sm" />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-white">
                            {m.user.displayName}
                          </span>
                          {isSelf && <span className="text-[10px] text-slate-500 font-mono">(You)</span>}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-mono text-slate-400">
                            @{m.user.username}
                          </span>
                          {m.role === 'admin' && (
                            <span className="text-[9px] font-mono text-[#00E599] bg-[#0B281E] px-1 rounded border border-[#00E599]/30">
                              Admin
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {isAdmin && !isSelf && (
                      <button
                        onClick={() => handleRemoveMember(m.userId)}
                        className="rounded p-1 text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition-colors"
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
          <div className="rounded-xl border border-[#171D28] bg-[#0D1118] p-3 text-xs text-slate-400">
            <div className="flex items-center gap-1.5 font-medium text-[#00E599] mb-1 font-mono">
              <Shield className="h-3.5 w-3.5" />
              <span>Channel Key Rotation</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Designed for Sender Keys / TreeKEM group ratchet protocols. Group member changes will
              re-key the broadcast chain once protocol extensions are activated.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-[#171D28] p-4 bg-[#0A0D13]">
          <button
            onClick={handleLeave}
            className="w-full flex items-center justify-center gap-2 rounded-lg border border-red-900/50 bg-red-950/20 py-2 text-xs font-medium text-red-400 hover:bg-red-950/40 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Leave Channel</span>
          </button>
        </div>
      </div>
    </div>
  );
};
