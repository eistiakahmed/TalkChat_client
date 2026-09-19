'use client';

import * as React from 'react';
import { MessageSquare, ShieldCheck, Plus } from 'lucide-react';
import { Button } from '../../../components/ui';
import { useChatStore } from '../../../stores/chat.store';

/**
 * Default Active Chat Placeholder Page.
 * 
 * Displayed on desktop views when no specific conversation thread is selected.
 */
export default function ChatIndexPage() {
  const setNewChatModalOpen = useChatStore((s) => s.setNewChatModalOpen);

  return (
    <div className="flex-1 h-full flex flex-col items-center justify-center p-8 text-center bg-[#090a0f] select-none relative">
      <div className="max-w-md space-y-6 relative z-1">
        <div className="w-16 h-16 rounded-2xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-500 mx-auto shadow-lg shadow-blue-500/10">
          <MessageSquare className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-white">
            TalkChat Messenger
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Select a conversation from the sidebar or start a new encrypted direct message or group conversation.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="primary"
            onClick={() => setNewChatModalOpen(true)}
            className="w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Start New Chat
          </Button>
        </div>

        <div className="pt-6 border-t border-white/[0.08] inline-flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-blue-500" />
          <span>Messages are protected by End-to-End Encryption</span>
        </div>
      </div>
    </div>
  );
}
