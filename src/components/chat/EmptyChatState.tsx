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
      className="relative flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#070709] overflow-hidden"
    >
      {/* Bottom glowing amber horizon like the reference image */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#FF4500]/15 via-[#FF4500]/5 to-transparent z-0" />

      <div className="relative z-10 max-w-md w-full p-8 rounded-2xl border border-[#22222E] bg-[#0E0E14] shadow-[0_0_35px_rgba(0,0,0,0.8)]">
        <div className="w-12 h-12 rounded-xl bg-[#18120E] border border-[#FF5500]/40 flex items-center justify-center mx-auto mb-4 text-[#FF7A1A] shadow-[0_0_15px_rgba(255,85,0,0.25)]">
          <Shield className="h-6 w-6 text-[#FF5500]" />
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
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#FF5500] to-[#FF7700] text-white font-semibold px-4 py-2 text-xs hover:brightness-110 active:scale-95 transition-all shadow-[0_0_15px_rgba(255,85,0,0.35)]"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Direct Message</span>
          </button>

          <button
            id="empty-start-group-button"
            onClick={onStartGroup}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#242430] bg-[#14141C] px-4 py-2 text-xs font-medium text-slate-200 hover:bg-[#1C1C26] hover:text-[#FF7A1A] active:scale-95 transition-all"
          >
            <Users className="h-3.5 w-3.5 text-[#FF5500]" />
            <span>New Group</span>
          </button>
        </div>
      </div>
    </div>
  );
};
