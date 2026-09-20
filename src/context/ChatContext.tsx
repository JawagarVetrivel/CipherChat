import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { chatService } from '../services/api/chatService';
import { WebSocketConnectionStatus, wsClient } from '../services/websocket/WebSocketClient';
import { Conversation, DirectConversation, Group, Message, TypingEventPayload, User } from '../types';
import { useAuth } from './AuthContext';

interface ChatContextType {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  activeConversationId: string | null;
  messages: Message[];
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  isSending: boolean;
  connectionStatus: WebSocketConnectionStatus;
  typingUsers: string[]; // usernames typing in active conversation
  selectConversation: (id: string | null) => void;
  sendMessage: (plaintext: string) => Promise<void>;
  sendTyping: (isTyping: boolean) => void;
  startDirectConversation: (peerUser: Omit<User, 'email'>) => Promise<DirectConversation>;
  createGroup: (name: string, members: Array<Omit<User, 'email'>>, description?: string) => Promise<Group>;
  addGroupMembers: (groupId: string, members: Array<Omit<User, 'email'>>) => Promise<void>;
  removeGroupMember: (groupId: string, memberId: string) => Promise<void>;
  updateGroupName: (groupId: string, newName: string) => Promise<void>;
  leaveGroup: (groupId: string) => Promise<void>;
  reconnectWebSocket: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<WebSocketConnectionStatus>(wsClient.getStatus());
  const [typingUsersMap, setTypingUsersMap] = useState<Record<string, { username: string; expires: number }>>({});

  const typingTimeoutRef = useRef<number | null>(null);
  const activeConversationIdRef = useRef<string | null>(null);
  activeConversationIdRef.current = activeConversationId;

  // Load conversations when user authenticates
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setConversations([]);
      setMessages([]);
      setActiveConversationId(null);
      setIsLoadingConversations(false);
      return;
    }

    chatService.setUserId(user.id);
    setIsLoadingConversations(true);

    chatService
      .getConversations()
      .then((convs) => {
        setConversations(convs);
        // If desktop and no active selection, default to first conversation
        if (convs.length > 0 && !activeConversationIdRef.current) {
          setActiveConversationId(convs[0].id);
        }
      })
      .finally(() => setIsLoadingConversations(false));

    const unsubscribeConvs = chatService.onConversationsChange((updated) => {
      setConversations(updated);
    });

    const unsubscribeStatus = wsClient.onStatusChange((status) => {
      setConnectionStatus(status);
    });

    return () => {
      unsubscribeConvs();
      unsubscribeStatus();
    };
  }, [isAuthenticated, user]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }

    setIsLoadingMessages(true);
    chatService.markAsRead(activeConversationId);

    chatService
      .getMessagesForConversation(activeConversationId)
      .then((msgs) => {
        setMessages(msgs);
      })
      .finally(() => {
        setIsLoadingMessages(false);
      });
  }, [activeConversationId]);

  // Subscribe to live incoming messages
  useEffect(() => {
    const unsubscribeNewMsg = chatService.onNewMessage((newMsg) => {
      if (newMsg.conversationId === activeConversationIdRef.current) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        chatService.markAsRead(newMsg.conversationId);
      }
    });

    return () => {
      unsubscribeNewMsg();
    };
  }, []);

  // Listen to typing events
  useEffect(() => {
    const unsubscribeTyping = wsClient.onTyping((event: TypingEventPayload) => {
      if (event.conversationId !== activeConversationIdRef.current) return;
      if (user && event.userId === user.id) return;

      setTypingUsersMap((prev) => {
        const next = { ...prev };
        if (event.isTyping) {
          next[event.userId] = {
            username: event.username,
            expires: Date.now() + 4000,
          };
        } else {
          delete next[event.userId];
        }
        return next;
      });
    });

    // Cleanup expired typing indicators
    const interval = window.setInterval(() => {
      const now = Date.now();
      setTypingUsersMap((prev) => {
        let changed = false;
        const next = { ...prev };
        for (const [uid, data] of Object.entries(next)) {
          if (data.expires < now) {
            delete next[uid];
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 1500);

    return () => {
      unsubscribeTyping();
      clearInterval(interval);
    };
  }, [user]);

  const activeConversation = conversations.find((c) => c.id === activeConversationId) || null;

  const selectConversation = useCallback((id: string | null) => {
    setActiveConversationId(id);
    setTypingUsersMap({});
  }, []);

  const sendMessage = useCallback(
    async (plaintext: string) => {
      if (!activeConversationId || !plaintext.trim() || isSending) return;

      setIsSending(true);
      try {
        const sentMsg = await chatService.sendMessage(activeConversationId, plaintext);
        setMessages((prev) => [...prev, sentMsg]);
      } catch (err) {
        console.error('Failed to send encrypted message:', err);
        throw err;
      } finally {
        setIsSending(false);
      }
    },
    [activeConversationId, isSending]
  );

  const sendTyping = useCallback(
    (isTyping: boolean) => {
      if (!activeConversationId || !user) return;

      wsClient.sendTyping(activeConversationId, user.id, user.username, isTyping);

      if (isTyping) {
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = window.setTimeout(() => {
          if (activeConversationIdRef.current) {
            wsClient.sendTyping(activeConversationIdRef.current, user.id, user.username, false);
          }
        }, 3000);
      }
    },
    [activeConversationId, user]
  );

  const startDirectConversation = useCallback(
    async (peerUser: Omit<User, 'email'>): Promise<DirectConversation> => {
      const conv = await chatService.getOrCreateDirectConversation(peerUser);
      setActiveConversationId(conv.id);
      return conv;
    },
    []
  );

  const createGroup = useCallback(
    async (name: string, members: Array<Omit<User, 'email'>>, description?: string): Promise<Group> => {
      const newGroup = await chatService.createGroup(name, members, description);
      setActiveConversationId(newGroup.id);
      return newGroup;
    },
    []
  );

  const addGroupMembers = useCallback(
    async (groupId: string, members: Array<Omit<User, 'email'>>) => {
      await chatService.addGroupMembers(groupId, members);
    },
    []
  );

  const removeGroupMember = useCallback(async (groupId: string, memberId: string) => {
    await chatService.removeGroupMember(groupId, memberId);
  }, []);

  const updateGroupName = useCallback(async (groupId: string, newName: string) => {
    await chatService.updateGroupName(groupId, newName);
  }, []);

  const leaveGroup = useCallback(
    async (groupId: string) => {
      await chatService.leaveGroup(groupId);
      if (activeConversationId === groupId) {
        const remaining = conversations.filter((c) => c.id !== groupId);
        setActiveConversationId(remaining.length > 0 ? remaining[0].id : null);
      }
    },
    [activeConversationId, conversations]
  );

  const reconnectWebSocket = useCallback(() => {
    wsClient.reconnect();
  }, []);

  const typingUsernames = Object.values(typingUsersMap).map((d) => d.username);

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversation,
        activeConversationId,
        messages,
        isLoadingConversations,
        isLoadingMessages,
        isSending,
        connectionStatus,
        typingUsers: typingUsernames,
        selectConversation,
        sendMessage,
        sendTyping,
        startDirectConversation,
        createGroup,
        addGroupMembers,
        removeGroupMember,
        updateGroupName,
        leaveGroup,
        reconnectWebSocket,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
