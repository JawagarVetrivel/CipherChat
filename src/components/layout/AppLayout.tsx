import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { NewDirectChatModal } from '../modals/NewDirectChatModal';
import { NewGroupModal } from '../modals/NewGroupModal';
import { Sidebar } from './Sidebar';

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeConversationId } = useChat();

  const [isDirectModalOpen, setIsDirectModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      {/* Sidebar: on mobile, hidden if an active conversation is selected */}
      <div
        className={`${
          activeConversationId ? 'hidden md:flex' : 'flex'
        } h-full w-full md:w-80 flex-shrink-0`}
      >
        <Sidebar
          onOpenNewDirect={() => setIsDirectModalOpen(true)}
          onOpenNewGroup={() => setIsGroupModalOpen(true)}
        />
      </div>

      {/* Main Area: on mobile, hidden if no active conversation */}
      <main
        className={`${
          !activeConversationId ? 'hidden md:flex' : 'flex'
        } h-full flex-1 flex-col overflow-hidden bg-white dark:bg-neutral-950`}
      >
        {children}
      </main>

      {/* Modals */}
      <NewDirectChatModal
        isOpen={isDirectModalOpen}
        onClose={() => setIsDirectModalOpen(false)}
      />
      <NewGroupModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
      />
    </div>
  );
};
