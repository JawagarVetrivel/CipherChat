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
      className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#080A0F]"
    >
      <div className="max-w-md w-full p-8 rounded-2xl border border-[#171D28] bg-[#0D1118] shadow-2xl">
        <div className="w-12 h-12 rounded-xl bg-[#0B281E] border border-[#00E599]/30 flex items-center justify-center mx-auto mb-4 text-[#00E599]">
          <Shield className="h-6 w-6 text-[#00E599]" />
        </div>

        <h2 className="text-base font-semibold text-white mb-1">
          CipherChat Core Workspace
        </h2>
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          Select an active conversation or peer from the sidebar, or initialize a new cryptographic session.
          All communications are client-side encrypted with Signal Protocol Double Ratchet before network transit.
        </p>

        <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
          <button
            id="empty-start-direct-button"
            onClick={onStartDirect}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#00E599] text-[#051E14] font-semibold px-4 py-2 text-xs hover:bg-[#00F5A3] active:scale-95 transition-all shadow-[0_0_12px_rgba(0,229,153,0.25)]"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Direct Message</span>
          </button>

          <button
            id="empty-start-group-button"
            onClick={onStartGroup}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#1E2638] bg-[#141B28] px-4 py-2 text-xs font-medium text-slate-200 hover:bg-[#1E2638] active:scale-95 transition-all"
          >
            <Users className="h-3.5 w-3.5" />
            <span>New Group</span>
          </button>
        </div>
      </div>
    </div>
  );
};
