import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Lock,
  Search,
  Plus,
  Settings,
  MessageSquare,
  Users,
  LogOut,
  Hash,
  Check,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { DirectConversation, Group } from '../../types';
import { Avatar } from '../common/Avatar';
import { Badge } from '../common/Badge';

interface SidebarProps {
  onOpenNewDirect: () => void;
  onOpenNewGroup: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onOpenNewDirect,
  onOpenNewGroup,
}) => {
  const { user, logout } = useAuth();
  const {
    conversations,
    activeConversationId,
    selectConversation,
    connectionStatus,
  } = useChat();
  const navigate = useNavigate();

  const [filterQuery, setFilterQuery] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Filter conversations based on query
  const directConversations = conversations.filter(
    (c): c is DirectConversation => c.type === 'direct'
  );
  const groupConversations = conversations.filter((c): c is Group => c.type === 'group');

  const filteredDirect = directConversations.filter((c) => {
    if (!filterQuery.trim()) return true;
    const q = filterQuery.toLowerCase().replace(/^@/, '');
    return (
      c.participant.displayName.toLowerCase().includes(q) ||
      c.participant.username.toLowerCase().includes(q)
    );
  });

  const filteredGroups = groupConversations.filter((c) => {
    if (!filterQuery.trim()) return true;
    return c.name.toLowerCase().includes(filterQuery.toLowerCase());
  });

  const formatTime = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <aside
      id="app-sidebar"
      className="flex h-full w-full flex-col border-r border-neutral-200 bg-neutral-50/60 dark:border-neutral-800 dark:bg-neutral-900/60 select-none md:w-80 flex-shrink-0"
    >
      {/* Brand Header */}
      <div className="flex h-14 items-center justify-between border-b border-neutral-200 px-4 dark:border-neutral-800">
        <Link to="/app" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-950">
            <Lock className="h-3.5 w-3.5" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
            CipherChat
          </span>
        </Link>

        {/* Quick action buttons */}
        <div className="flex items-center gap-1">
          <button
            id="sidebar-new-dm-button"
            onClick={onOpenNewDirect}
            className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-200/60 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
            title="Start new direct conversation"
          >
            <MessageSquare className="h-4 w-4" />
          </button>
          <button
            id="sidebar-new-group-button"
            onClick={onOpenNewGroup}
            className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-200/60 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
            title="Create new group"
          >
            <Users className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="p-3 border-b border-neutral-200/70 dark:border-neutral-800/70">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
          <input
            id="sidebar-filter-input"
            type="text"
            placeholder="Search chats or @username..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full rounded-lg border border-neutral-200 bg-white pl-8 pr-3 py-1.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-600 dark:focus:border-neutral-400"
          />
        </div>
      </div>

      {/* Conversations Sections */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {/* Direct Messages */}
        <div>
          <div className="flex items-center justify-between px-2 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              Direct Messages
            </span>
            <button
              onClick={onOpenNewDirect}
              className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
              title="New direct message"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {filteredDirect.length === 0 ? (
            <p className="px-2 py-1 text-[11px] text-neutral-400">No direct messages</p>
          ) : (
            <div className="space-y-0.5">
              {filteredDirect.map((conv) => {
                const isActive = activeConversationId === conv.id;
                return (
                  <button
                    key={conv.id}
                    id={`conversation-item-${conv.id}`}
                    onClick={() => selectConversation(conv.id)}
                    className={`w-full text-left flex items-center justify-between rounded-lg px-2.5 py-2 transition-colors ${
                      isActive
                        ? 'bg-neutral-200/80 text-neutral-900 font-medium dark:bg-neutral-800 dark:text-neutral-100'
                        : 'hover:bg-neutral-100 text-neutral-700 dark:hover:bg-neutral-800/50 dark:text-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar
                        name={conv.participant.displayName}
                        status={conv.participant.status}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs truncate font-medium">
                            {conv.participant.displayName}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-500 truncate dark:text-neutral-400">
                          {conv.lastMessage?.plaintext || `@${conv.participant.username}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-2">
                      <span className="text-[10px] text-neutral-400 font-mono">
                        {formatTime(conv.lastMessage?.timestamp || conv.updatedAt)}
                      </span>
                      {conv.unreadCount > 0 && (
                        <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-neutral-900 px-1 text-[10px] font-medium text-white dark:bg-neutral-100 dark:text-neutral-900">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Groups */}
        <div>
          <div className="flex items-center justify-between px-2 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              Groups
            </span>
            <button
              onClick={onOpenNewGroup}
              className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
              title="Create new group"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {filteredGroups.length === 0 ? (
            <p className="px-2 py-1 text-[11px] text-neutral-400">No groups</p>
          ) : (
            <div className="space-y-0.5">
              {filteredGroups.map((group) => {
                const isActive = activeConversationId === group.id;
                return (
                  <button
                    key={group.id}
                    id={`group-item-${group.id}`}
                    onClick={() => selectConversation(group.id)}
                    className={`w-full text-left flex items-center justify-between rounded-lg px-2.5 py-2 transition-colors ${
                      isActive
                        ? 'bg-neutral-200/80 text-neutral-900 font-medium dark:bg-neutral-800 dark:text-neutral-100'
                        : 'hover:bg-neutral-100 text-neutral-700 dark:hover:bg-neutral-800/50 dark:text-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-200 font-mono text-[11px] font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 flex-shrink-0">
                        #
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs truncate font-medium">{group.name}</div>
                        <p className="text-[11px] text-neutral-500 truncate dark:text-neutral-400">
                          {group.lastMessage?.plaintext || `${group.members.length} members`}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-2">
                      <span className="text-[10px] text-neutral-400 font-mono">
                        {formatTime(group.lastMessage?.timestamp || group.updatedAt)}
                      </span>
                      {group.unreadCount > 0 && (
                        <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-neutral-900 px-1 text-[10px] font-medium text-white dark:bg-neutral-100 dark:text-neutral-900">
                          {group.unreadCount}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* User Profile & Footer */}
      <div className="border-t border-neutral-200 p-3 dark:border-neutral-800 bg-white/40 dark:bg-neutral-950/40">
        <div className="flex items-center justify-between">
          <Link
            to="/settings"
            className="flex items-center gap-2.5 rounded-lg p-1.5 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800 flex-1 min-w-0 mr-1"
            title="Open settings"
          >
            {user && <Avatar name={user.displayName} status={user.status} size="sm" />}
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium text-neutral-900 truncate dark:text-neutral-100">
                {user?.displayName}
              </div>
              <div className="text-[10px] font-mono text-neutral-500 truncate">
                @{user?.username}
              </div>
            </div>
          </Link>

          <div className="flex items-center">
            <Link
              id="sidebar-settings-link"
              to="/settings"
              className="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
              title="Settings"
            >
              <Settings className="h-4 w-4" />
            </Link>
            <button
              id="sidebar-logout-button"
              onClick={handleLogout}
              className="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-red-600 dark:hover:bg-neutral-800 dark:hover:text-red-400"
              title="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
