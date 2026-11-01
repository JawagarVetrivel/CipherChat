import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  SlidersHorizontal,
  MoreVertical,
  LogOut,
  Settings,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { DirectConversation, Group } from '../../types';

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
  } = useChat();
  const navigate = useNavigate();

  const [filterQuery, setFilterQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Filter conversations
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
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    const diffDays = Math.round((now.getTime() - d.getTime()) / (1000 * 3600 * 24));
    if (diffDays <= 1) return 'Yday';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const userInitials = user?.displayName
    ? user.displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'RS';

  return (
    <aside
      id="app-sidebar"
      className="flex h-full w-full flex-col border-r border-[#1A1A22] bg-[#0A0A0E] select-none flex-shrink-0"
    >
      {/* Top Header: CHATS & PEERS */}
      <div className="flex h-11 items-center justify-between border-b border-[#1A1A22] px-3.5">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-300">
            CHATS & PEERS
          </span>
        </div>
        <button
          id="sidebar-new-chat-button"
          onClick={onOpenNewDirect}
          className="rounded p-1 text-slate-400 hover:bg-[#14141C] hover:text-[#FF7A1A] transition-colors"
          title="New direct chat or channel"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Conversation List Scroll Area */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {/* CHANNELS Section */}
        <div>
          <div className="flex items-center justify-between px-2 mb-1.5">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400">
              CHANNELS
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-slate-500">
                {filteredGroups.length}
              </span>
              <button
                id="sidebar-new-group-button"
                onClick={onOpenNewGroup}
                className="rounded p-0.5 text-slate-400 hover:bg-[#14141C] hover:text-[#FF7A1A] transition-colors"
                title="Create new channel"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="space-y-0.5">
            {/* Real group conversations */}
            {filteredGroups.map((group) => {
              const isActive = activeConversationId === group.id;
              return (
                <button
                  key={group.id}
                  id={`group-item-${group.id}`}
                  onClick={() => selectConversation(group.id)}
                  className={`w-full text-left flex items-center justify-between rounded-lg px-2.5 py-1.5 transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-[#FF5500]/20 via-[#FF5500]/5 to-transparent text-white font-medium border-l-2 border-[#FF5500] pl-2'
                      : 'hover:bg-[#121218] text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[#FF6B00] font-mono text-xs font-semibold">#</span>
                    <span className="text-xs truncate font-medium">{group.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 ml-2 flex-shrink-0">
                    {formatTime(group.lastMessage?.timestamp || group.updatedAt)}
                  </span>
                </button>
              );
            })}

            {/* If there are no groups yet, show create channel prompt */}
            {filteredGroups.length === 0 && (
              <div className="px-2 py-1">
                <button
                  onClick={onOpenNewGroup}
                  className="w-full text-left flex items-center gap-2 rounded-lg px-2.5 py-2 border border-dashed border-[#242430] text-slate-400 hover:border-[#FF5500]/50 hover:text-[#FF7A1A] transition-colors text-xs"
                >
                  <Plus className="h-3.5 w-3.5 text-[#FF5500]" />
                  <span>+ Create new channel</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* DIRECT MESSAGES Section */}
        <div>
          <div className="flex items-center justify-between px-2 mb-1.5">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400">
              DIRECT MESSAGES
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-slate-500">
                {filteredDirect.length > 0 ? `1-${filteredDirect.length}` : '0'}
              </span>
              <button
                id="sidebar-new-dm-button"
                onClick={onOpenNewDirect}
                className="rounded p-0.5 text-slate-400 hover:bg-[#14141C] hover:text-[#FF7A1A] transition-colors"
                title="New direct peer chat"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {filteredDirect.length === 0 ? (
            <div className="px-2 py-3 text-center">
              <p className="text-[11px] text-slate-500 font-mono">No active direct peers.</p>
              <button
                onClick={onOpenNewDirect}
                className="mt-2 text-xs text-[#FF7A1A] hover:underline font-mono"
              >
                + Connect to peer
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredDirect.map((conv) => {
                const isActive = activeConversationId === conv.id;
                const peer = conv.participant;
                const lastMsgText =
                  conv.lastMessage?.plaintext || `@${peer.username}`;

                return (
                  <button
                    key={conv.id}
                    id={`conversation-item-${conv.id}`}
                    onClick={() => selectConversation(conv.id)}
                    className={`w-full text-left flex items-center justify-between rounded-xl p-2 transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-[#FF5500]/20 via-[#FF5500]/5 to-transparent border-l-2 border-[#FF5500] pl-2 text-white shadow-xs'
                        : 'hover:bg-[#121218] border border-transparent text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {/* Squircle Avatar with Status Dot */}
                      <div className="relative flex-shrink-0">
                        <div
                          className={`h-8 w-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
                            isActive
                              ? 'bg-gradient-to-br from-[#FF5500] to-[#CC3700] text-white shadow-[0_0_10px_rgba(255,85,0,0.35)]'
                              : 'bg-[#18120E] text-[#FF8800] border border-[#FF5500]/30'
                          }`}
                        >
                          {peer.displayName.slice(0, 2).toUpperCase()}
                        </div>
                        {/* Status dot */}
                        <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#FF5500] ring-2 ring-[#0A0A0E] shadow-[0_0_4px_#FF5500]" />
                      </div>

                      {/* Name & Last Message */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-semibold text-white truncate">
                            {peer.displayName}
                          </span>
                          <span
                            className={`text-[10px] font-mono flex-shrink-0 ${
                              isActive ? 'text-[#FF8800] font-medium' : 'text-slate-500'
                            }`}
                          >
                            {formatTime(conv.lastMessage?.timestamp || conv.updatedAt)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-1 mt-0.5">
                          <p className="text-[11px] text-slate-400 truncate">
                            @{peer.username} · {lastMsgText}
                          </p>
                          {/* Unread indicator */}
                          {conv.unreadCount > 0 ? (
                            <span className="h-2 w-2 rounded-full bg-[#FF5500] flex-shrink-0 shadow-[0_0_4px_#FF5500]" />
                          ) : isActive ? (
                            <span className="h-1.5 w-1.5 rounded-full bg-[#FF5500] flex-shrink-0 shadow-[0_0_4px_#FF5500]" />
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Profile Bar */}
      <div className="border-t border-[#1A1A22] p-2.5 bg-[#0A0A0E] relative">
        <div className="flex items-center justify-between rounded-lg p-1 hover:bg-[#121218] transition-colors">
          <Link to="/settings" className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="relative flex-shrink-0">
              <div className="h-7 w-7 rounded-lg bg-[#18120E] text-[#FF7A1A] border border-[#FF5500]/30 flex items-center justify-center font-mono font-bold text-xs">
                {userInitials}
              </div>
              <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-[#FF5500] ring-1 ring-[#0A0A0E] shadow-[0_0_4px_#FF5500]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-white truncate">
                {user?.displayName || 'Rahul Sharma'}
              </div>
              <div className="text-[10px] font-mono text-slate-400 truncate">
                @{user?.username || 'rahul123'}
              </div>
            </div>
          </Link>

          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#14141C] transition-colors"
            title="User options"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>

        {/* User Popup Menu */}
        {showUserMenu && (
          <div className="absolute bottom-14 right-2 w-48 rounded-xl border border-[#22222E] bg-[#0E0E14] p-1.5 shadow-[0_0_25px_rgba(0,0,0,0.8)] z-50">
            <Link
              to="/settings"
              onClick={() => setShowUserMenu(false)}
              className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 hover:bg-[#181822] hover:text-[#FF7A1A] transition-colors"
            >
              <Settings className="h-3.5 w-3.5 text-slate-400" />
              <span>Identity Settings</span>
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-red-400 hover:bg-red-950/30 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
