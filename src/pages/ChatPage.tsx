import React, { useState } from 'react';
import { ChatHeader } from '../components/chat/ChatHeader';
import { ConnectionBanner } from '../components/chat/ConnectionBanner';
import { EmptyChatState } from '../components/chat/EmptyChatState';
import { MessageInput } from '../components/chat/MessageInput';
import { MessageList } from '../components/chat/MessageList';
import { IdentitySecurityPanel } from '../components/chat/IdentitySecurityPanel';
import { AppLayout } from '../components/layout/AppLayout';
import { CryptoInspectorModal } from '../components/modals/CryptoInspectorModal';
import { GroupDetailsDrawer } from '../components/modals/GroupDetailsDrawer';
import { NewDirectChatModal } from '../components/modals/NewDirectChatModal';
import { NewGroupModal } from '../components/modals/NewGroupModal';
import { useChat } from '../context/ChatContext';
import { DirectConversation, EncryptedMessage, Group } from '../types';

export const ChatPage: React.FC = () => {
  const { activeConversation, messages, isLoadingMessages, typingUsers, deleteMessage } = useChat();

  const [isGroupDetailsOpen, setIsGroupDetailsOpen] = useState(false);
  const [isSecurityPanelOpen, setIsSecurityPanelOpen] = useState(true);
  const [inspectedEnvelope, setInspectedEnvelope] = useState<EncryptedMessage | null>(null);
  const [isDirectModalOpen, setIsDirectModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  const directParticipant =
    activeConversation && activeConversation.type === 'direct'
      ? (activeConversation as DirectConversation).participant
      : null;

  return (
    <AppLayout>
      <div className="flex h-full w-full overflow-hidden bg-[#080A0F]">
        {/* Main Conversation Column */}
        <div className="flex flex-1 flex-col h-full overflow-hidden min-w-0 bg-[#080A0F]">
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
                onToggleSecurityPanel={() => setIsSecurityPanelOpen(!isSecurityPanelOpen)}
                isSecurityPanelOpen={isSecurityPanelOpen}
              />

              {/* Message History Feed */}
              <MessageList
                messages={messages}
                isLoading={isLoadingMessages}
                isGroup={activeConversation.type === 'group'}
                peerUser={directParticipant || undefined}
                typingUsers={typingUsers}
                onInspectEnvelope={(env) => setInspectedEnvelope(env)}
                onDeleteMessage={(msgId) => deleteMessage(msgId)}
              />

              {/* Message Input Container */}
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
        </div>

        {/* Right "Identity & Security" Panel (Visible on Desktop when active direct chat) */}
        {activeConversation && directParticipant && isSecurityPanelOpen && (
          <div className="hidden xl:flex h-full">
            <IdentitySecurityPanel
              peer={directParticipant}
              onClose={() => setIsSecurityPanelOpen(false)}
            />
          </div>
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
