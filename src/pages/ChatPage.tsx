import React, { useState } from 'react';
import { ChatHeader } from '../components/chat/ChatHeader';
import { ConnectionBanner } from '../components/chat/ConnectionBanner';
import { EmptyChatState } from '../components/chat/EmptyChatState';
import { MessageInput } from '../components/chat/MessageInput';
import { MessageList } from '../components/chat/MessageList';
import { AppLayout } from '../components/layout/AppLayout';
import { CryptoInspectorModal } from '../components/modals/CryptoInspectorModal';
import { GroupDetailsDrawer } from '../components/modals/GroupDetailsDrawer';
import { NewDirectChatModal } from '../components/modals/NewDirectChatModal';
import { NewGroupModal } from '../components/modals/NewGroupModal';
import { useChat } from '../context/ChatContext';
import { EncryptedMessage, Group } from '../types';

export const ChatPage: React.FC = () => {
  const { activeConversation, messages, isLoadingMessages, typingUsers } = useChat();

  const [isGroupDetailsOpen, setIsGroupDetailsOpen] = useState(false);
  const [inspectedEnvelope, setInspectedEnvelope] = useState<EncryptedMessage | null>(null);
  const [isDirectModalOpen, setIsDirectModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  return (
    <AppLayout>
      <div className="flex h-full flex-col overflow-hidden bg-white dark:bg-neutral-950">
        {/* Connection status banner */}
        <ConnectionBanner />

        {activeConversation ? (
          <>
            {/* Conversation Header */}
            <ChatHeader
              conversation={activeConversation}
              onOpenGroupDetails={() => setIsGroupDetailsOpen(true)}
              onInspectSecurity={() => {
                if (messages.length > 0 && messages[messages.length - 1].rawEnvelope) {
                  setInspectedEnvelope(messages[messages.length - 1].rawEnvelope!);
                }
              }}
            />

            {/* Message History & Live Stream */}
            <MessageList
              messages={messages}
              isLoading={isLoadingMessages}
              isGroup={activeConversation.type === 'group'}
              typingUsers={typingUsers}
              onInspectEnvelope={(env) => setInspectedEnvelope(env)}
            />

            {/* Message Input */}
            <MessageInput conversationId={activeConversation.id} />

            {/* Group Management Drawer */}
            {activeConversation.type === 'group' && (
              <GroupDetailsDrawer
                group={activeConversation as Group}
                isOpen={isGroupDetailsOpen}
                onClose={() => setIsGroupDetailsOpen(false)}
              />
            )}
          </>
        ) : (
          <EmptyChatState
            onStartDirect={() => setIsDirectModalOpen(true)}
            onStartGroup={() => setIsGroupModalOpen(true)}
          />
        )}

        {/* Cryptographic Inspector Modal */}
        <CryptoInspectorModal
          envelope={inspectedEnvelope}
          isOpen={!!inspectedEnvelope}
          onClose={() => setInspectedEnvelope(null)}
        />

        {/* Empty state modals */}
        <NewDirectChatModal
          isOpen={isDirectModalOpen}
          onClose={() => setIsDirectModalOpen(false)}
        />
        <NewGroupModal
          isOpen={isGroupModalOpen}
          onClose={() => setIsGroupModalOpen(false)}
        />
      </div>
    </AppLayout>
  );
};
