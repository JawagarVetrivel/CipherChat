import React from 'react';
import { MessageSquare, Users, Shield } from 'lucide-react';

interface EmptyChatStateProps {
  onStartDirect: () => void;
  onStartGroup: () => void;
}

export const EmptyChatState: React.FC<EmptyChatStateProps> = ({
  onStartDirect,
  onStartGroup,
}) => {
  return (
    <div
      id="empty-chat-state"
      className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-neutral-50/50 dark:bg-neutral-950/50"
    >
      <div className="max-w-md w-full p-8 rounded-2xl border border-neutral-200/80 bg-white shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
        <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center mx-auto mb-4 dark:bg-neutral-800">
          <Shield className="h-6 w-6 text-neutral-800 dark:text-neutral-200" />
        </div>

        <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
          CipherChat
        </h2>
        <p className="text-xs text-neutral-500 mb-6 leading-relaxed">
          Select an active conversation from the sidebar, find someone by their username,
          or create a new group. All communications are client-side encrypted before network transit.
        </p>

        <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
          <button
            id="empty-start-direct-button"
            onClick={onStartDirect}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-xs font-medium text-white hover:bg-neutral-800 active:scale-95 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Direct Message</span>
          </button>

          <button
            id="empty-start-group-button"
            onClick={onStartGroup}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 active:scale-95 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            <Users className="h-3.5 w-3.5" />
            <span>New Group</span>
          </button>
        </div>
      </div>
    </div>
  );
};
