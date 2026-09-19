'use client';

import * as React from 'react';
import type { Conversation, ConversationMember } from '../../types/chat.types';
import { useAuthStore } from '../../stores/auth.store';
import { Avatar, Badge } from '../ui';
import { formatConversationTime } from '../../utils/date.util';
import { Clock, VolumeX, Users } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}

/**
 * Conversation List Item Component.
 * 
 * Renders individual conversations in the sidebar with avatar,
 * presence indicator, unread pill badge, disappearing timer icon,
 * and relative timestamp.
 */
export function ConversationItem({
  conversation,
  isActive,
  onClick,
}: ConversationItemProps) {
  const currentUserId = useAuthStore((s) => s.user?.id);

  // Identify display metadata depending on Direct or Group conversation
  const isGroup = conversation.type === 'GROUP';

  const otherMember = conversation.members?.find(
    (m: ConversationMember) => m.userId !== currentUserId
  );

  const displayName = isGroup
    ? conversation.title || 'Unnamed Group'
    : otherMember?.user.fullName || otherMember?.user.username || 'Direct Message';

  const avatarUrl = isGroup
    ? conversation.avatarUrl
    : otherMember?.user.avatarUrl;

  const isOnline = !isGroup && (otherMember?.user.isOnline ?? false);

  const unreadCount = conversation.userSettings?.unreadCount || 0;
  const isMuted = conversation.userSettings?.isMuted || false;
  const isDisappearing =
    conversation.disappearingDuration !== undefined &&
    conversation.disappearingDuration !== null &&
    conversation.disappearingDuration > 0;

  const timestamp = formatConversationTime(
    conversation.lastMessageAt || conversation.updatedAt
  );

  const lastMessageText = React.useMemo(() => {
    if (!conversation.lastMessage) return 'No messages yet';
    if (conversation.lastMessage.isDeleted) return 'This message was deleted';
    const content = conversation.lastMessage.content;
    if (content?.includes('"_type":"CALL_LOG"')) {
      try {
        const data = JSON.parse(content);
        const isAudio = data.callType === 'AUDIO';
        if (data.status === 'MISSED' || data.status === 'CANCELLED') {
          return `📞 Missed ${isAudio ? 'audio' : 'video'} call`;
        }
        if (data.status === 'REJECTED' || data.status === 'BUSY') {
          return `📞 Declined ${isAudio ? 'audio' : 'video'} call`;
        }
        if (data.status === 'ENDED') {
          if (data.duration && data.duration > 0) {
            const mins = Math.floor(data.duration / 60);
            const secs = data.duration % 60;
            const dur = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
            return `${isAudio ? '📞 Audio' : '📹 Video'} call (${dur})`;
          }
          return `${isAudio ? '📞 Audio' : '📹 Video'} call ended`;
        }
        return `${isAudio ? '📞 Audio' : '📹 Video'} call`;
      } catch {
        return content;
      }
    }
    if (content?.trim()) {
      return content;
    }
    if (conversation.lastMessage.type === 'IMAGE') return '📷 Photo';
    if (conversation.lastMessage.type === 'VIDEO') return '🎥 Video';
    if (conversation.lastMessage.type === 'AUDIO') return '🎵 Audio';
    return '📎 Attachment';
  }, [conversation.lastMessage]);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 select-none group cursor-pointer',
        isActive
          ? 'bg-blue-600/15 border border-blue-500/25 shadow-xs'
          : 'hover:bg-white/[0.04] border border-transparent'
      )}
    >
      {/* Avatar Container */}
      <div className="relative shrink-0">
        <Avatar
          src={avatarUrl}
          name={displayName}
          size="md"
          status={isGroup ? undefined : isOnline ? 'online' : 'offline'}
          icon={isGroup ? <Users className="w-5 h-5 text-slate-400" /> : undefined}
        />
      </div>

      {/* Main Metadata & Message Preview */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <span
            className={cn(
              'font-semibold text-sm truncate transition-colors',
              isActive ? 'text-blue-400 font-bold' : 'text-white group-hover:text-white'
            )}
          >
            {displayName}
          </span>
          {timestamp && (
            <span
              className={cn(
                'text-[11px] shrink-0 font-medium',
                unreadCount > 0
                  ? 'text-blue-400 font-semibold'
                  : 'text-slate-400 group-hover:text-slate-300'
              )}
            >
              {timestamp}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <p
            className={cn(
              'text-xs truncate max-w-[190px]',
              unreadCount > 0 ? 'font-medium text-white' : 'text-slate-400'
            )}
          >
            {lastMessageText}
          </p>

          {/* Indicators: Muted, Disappearing Clock, Unread Pill */}
          <div className="flex items-center gap-1.5 shrink-0">
            {isMuted && <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
            {isDisappearing && (
              <Clock className="w-3.5 h-3.5 text-blue-400" />
            )}
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center px-2 py-0.5 min-w-5 h-5 rounded-full text-[10px] font-bold bg-blue-600 text-white shadow-sm shadow-blue-600/30">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
