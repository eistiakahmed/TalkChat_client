'use client';

import * as React from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import type { Message } from '../../types/message.types';
import { MessageBubble } from './MessageBubble';
import { useShallow } from 'zustand/react/shallow';
import { useAuthStore } from '../../stores/auth.store';
import { useSocketStore, type TypingUser } from '../../stores/socket.store';
import { Spinner } from '../ui';
import { Shield } from 'lucide-react';

const EMPTY_TYPING_USERS: TypingUser[] = [];
const selectCurrentUserId = (s: { user: { id: string } | null }) => s.user?.id;

export interface MessageListProps {
  conversationId: string;
  messages: Message[];
  isLoading?: boolean;
  isGroup?: boolean;
  disappearingDuration?: number | null;
  onReply: (message: Message) => void;
  onReact: (messageId: string, emoji: string) => void;
  onDelete: (messageId: string) => void;
  onCall?: (type: 'AUDIO' | 'VIDEO') => void;
}

/**
 * Format message date separator header.
 */
function formatDateSeparator(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMMM d, yyyy');
  } catch {
    return dateStr;
  }
}

/**
 * Real-Time Message History Timeline Component.
 * 
 * Renders chronological message stream with date headers,
 * auto-scroll management, and active typing presence indicators.
 */
export function MessageList({
  conversationId,
  messages,
  isLoading,
  isGroup,
  disappearingDuration,
  onReply,
  onReact,
  onDelete,
  onCall,
}: MessageListProps) {
  const currentUserId = useAuthStore(selectCurrentUserId);
  const typingUsers = useSocketStore(
    useShallow(
      (s) => s.typingUsers[conversationId] || EMPTY_TYPING_USERS
    )
  );

  const containerRef = React.useRef<HTMLDivElement>(null);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on messages update
  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, typingUsers.length]);

  // Group messages chronologically by day with duplicate ID protection
  const groupedByDate = React.useMemo(() => {
    // 1. Filter duplicate message IDs defensively
    const seen = new Set<string>();
    const uniqueMessages: Message[] = [];
    for (const msg of messages) {
      if (msg?.id && !seen.has(msg.id)) {
        seen.add(msg.id);
        uniqueMessages.push(msg);
      }
    }

    // 2. Sort chronologically
    uniqueMessages.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    // 3. Group by day
    const groups: Array<{ date: string; dateKey: string; items: Message[] }> = [];
    let currentDayKey = '';

    uniqueMessages.forEach((msg) => {
      const dayKey = new Date(msg.createdAt).toDateString();
      if (dayKey !== currentDayKey) {
        currentDayKey = dayKey;
        groups.push({ date: msg.createdAt, dateKey: dayKey, items: [msg] });
      } else {
        groups[groups.length - 1].items.push(msg);
      }
    });

    return groups;
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-3">
        <Spinner size="lg" />
        <p className="text-xs text-muted-foreground animate-pulse">
          Loading encrypted messages...
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto px-4 md:px-8 py-5 space-y-4 select-none relative z-1"
    >
      {/* Encryption Header Notice - Only shown on new chats before messages are sent */}
      {messages.length === 0 && (
        <div className="mx-auto max-w-sm text-center px-4 py-3 rounded-2xl bg-[#15161c]/80 backdrop-blur-md border border-white/[0.08] shadow-sm space-y-1 my-6 animate-fadeIn">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400">
            <Shield className="w-3.5 h-3.5 text-blue-400" />
            End-to-End Encrypted
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Messages and calls are secured with X3DH signal protocol. No one outside of this chat can read or listen to them.
          </p>
        </div>
      )}

      {/* Disappearing Messages Duration Notification */}
      {disappearingDuration && disappearingDuration > 0 ? (
        <div className="flex justify-center">
          <span className="px-3.5 py-1 rounded-full bg-[#15161c]/80 backdrop-blur-md border border-white/[0.08] text-[11px] font-medium text-slate-300 shadow-xs">
            Disappearing messages enabled ({disappearingDuration / 3600}h lifespan)
          </span>
        </div>
      ) : null}

      {/* Grouped Messages Stream */}
      {groupedByDate.map((group) => (
        <div key={group.dateKey} className="space-y-2">
          {/* Day Divider Pill */}
          <div className="flex justify-center my-4">
            <span className="px-3.5 py-1 rounded-full bg-[#15161c]/90 backdrop-blur-md text-[11px] font-semibold text-slate-200 border border-white/[0.08] shadow-xs">
              {formatDateSeparator(group.date)}
            </span>
          </div>

          {/* Messages for this day */}
          {group.items.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isSelf={message.senderId === currentUserId}
              isGroup={isGroup}
              onReply={onReply}
              onReact={onReact}
              onDelete={onDelete}
              onCall={onCall}
            />
          ))}
        </div>
      ))}

      {/* Active Typing Indicator Dots */}
      {typingUsers.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-slate-300 animate-fadeIn pl-2">
          <div className="flex gap-1.5 py-1.5 px-3 rounded-full bg-[#15161c]/95 backdrop-blur-md border border-white/[0.08] shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" />
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:0.2s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:0.4s]" />
          </div>
          <span className="italic font-medium text-slate-400">
            {typingUsers.map((u) => u.username).join(', ')}{' '}
            {typingUsers.length > 1 ? 'are typing...' : 'is typing...'}
          </span>
        </div>
      )}

      {/* Anchor for auto-scrolling */}
      <div ref={bottomRef} />
    </div>
  );
}
