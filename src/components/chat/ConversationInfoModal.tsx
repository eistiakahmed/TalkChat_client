'use client';

import * as React from 'react';
import {
  ShieldCheck,
  Clock,
  Bell,
  BellOff,
  Users,
  Shield,
  Phone,
  Video,
} from 'lucide-react';
import { Modal, Avatar, Button } from '../ui';
import type { Conversation, ConversationMember } from '../../types/chat.types';
import { useAuthStore } from '../../stores/auth.store';
import { useWebRTC } from '../../hooks/useWebRTC';
import { chatService } from '../../services/chat.service';

interface ConversationInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: Conversation | null;
  onOpenSafetyNumber?: () => void;
  onOpenDisappearing?: () => void;
}

/**
 * Conversation Information & Contact Profile Modal.
 * 
 * Displays chat metadata, participant roster, disappearing timer settings,
 * notification mute toggles, and cryptographic verification status.
 */
export function ConversationInfoModal({
  isOpen,
  onClose,
  conversation,
  onOpenSafetyNumber,
  onOpenDisappearing,
}: ConversationInfoModalProps) {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const { startCall } = useWebRTC();
  const [isMuted, setIsMuted] = React.useState(
    conversation?.userSettings?.isMuted ?? false
  );

  React.useEffect(() => {
    if (conversation) {
      setIsMuted(conversation.userSettings?.isMuted ?? false);
    }
  }, [conversation]);

  if (!conversation) return null;

  const isGroup = conversation.type === 'GROUP';
  const otherMember = conversation.members?.find(
    (m: ConversationMember) => m.userId !== currentUserId
  );

  const title = isGroup
    ? conversation.title || 'Group Chat'
    : otherMember?.user.fullName || otherMember?.user.username || 'Direct Message';

  const avatarUrl = isGroup
    ? conversation.avatarUrl
    : otherMember?.user.avatarUrl;

  const handleToggleMute = async () => {
    try {
      const nextMuted = !isMuted;
      setIsMuted(nextMuted);
      await chatService.toggleMute(conversation.id, nextMuted);
    } catch {
      setIsMuted(isMuted);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isGroup ? 'Group Information' : 'Contact Details'}
    >
      <div className="space-y-6 pt-2 select-none">
        {/* Profile Card */}
        <div className="flex flex-col items-center text-center space-y-3 pb-2">
          <Avatar
            src={avatarUrl}
            name={title}
            size="2xl"
            status={
              isGroup
                ? undefined
                : otherMember?.user.isOnline
                ? 'online'
                : 'offline'
            }
          />
          <div>
            <h3 className="text-lg font-bold text-foreground">{title}</h3>
            <p className="text-xs text-muted-foreground">
              {isGroup
                ? `${conversation.members?.length || 0} participants`
                : `@${otherMember?.user.username || 'user'}`}
            </p>
          </div>

          {/* Direct Calling Quick Actions (for 1-to-1) */}
          {!isGroup && otherMember?.user && (
            <div className="flex items-center gap-3 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  startCall(otherMember.user, 'AUDIO', conversation.id);
                }}
              >
                <Phone className="w-4 h-4 mr-1.5 text-brand-600" />
                Voice Call
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  startCall(otherMember.user, 'VIDEO', conversation.id);
                }}
              >
                <Video className="w-4 h-4 mr-1.5 text-brand-600" />
                Video Call
              </Button>
            </div>
          )}
        </div>

        {/* Action Controls List */}
        <div className="space-y-2">
          {/* Mute Notifications Toggle */}
          <div
            onClick={handleToggleMute}
            className="p-3.5 rounded-2xl bg-card border border-border flex items-center justify-between cursor-pointer hover:bg-muted/40 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-600">
                {isMuted ? (
                  <BellOff className="w-4 h-4" />
                ) : (
                  <Bell className="w-4 h-4" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Mute Notifications
                </p>
                <p className="text-xs text-muted-foreground">
                  {isMuted ? 'Notifications are muted' : 'Receive message alerts'}
                </p>
              </div>
            </div>

            <span className="text-xs font-semibold text-brand-600">
              {isMuted ? 'Unmute' : 'Mute'}
            </span>
          </div>

          {/* Disappearing Messages Trigger */}
          <div
            onClick={() => {
              onClose();
              onOpenDisappearing?.();
            }}
            className="p-3.5 rounded-2xl bg-card border border-border flex items-center justify-between cursor-pointer hover:bg-muted/40 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-600">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Disappearing Messages
                </p>
                <p className="text-xs text-muted-foreground">
                  {conversation.disappearingDuration
                    ? `${conversation.disappearingDuration / 86400} days`
                    : 'Off'}
                </p>
              </div>
            </div>

            <span className="text-xs font-semibold text-brand-600">Change</span>
          </div>

          {/* Encryption & Safety Number (for 1-on-1 chats) */}
          {!isGroup && (
            <div
              onClick={() => {
                onClose();
                onOpenSafetyNumber?.();
              }}
              className="p-3.5 rounded-2xl bg-card border border-border flex items-center justify-between cursor-pointer hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Encryption
                  </p>
                  <p className="text-xs text-muted-foreground">
                    End-to-end encrypted. Tap to verify safety number.
                  </p>
                </div>
              </div>

              <span className="text-xs font-semibold text-brand-600">Verify</span>
            </div>
          )}
        </div>

        {/* Group Participants Roster */}
        {isGroup && conversation.members && (
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              <span>Participants ({conversation.members.length})</span>
            </h4>

            <div className="max-h-52 overflow-y-auto divide-y divide-border/60 -mx-6 px-6">
              {conversation.members.map((member: ConversationMember) => (
                <div
                  key={member.id}
                  className="py-2.5 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar
                      src={member.user.avatarUrl}
                      name={member.user.fullName || member.user.username}
                      size="sm"
                      status={member.user.isOnline ? 'online' : 'offline'}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {member.user.fullName || member.user.username}
                        {member.userId === currentUserId && ' (You)'}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        @{member.user.username}
                      </p>
                    </div>
                  </div>

                  {member.role === 'ADMIN' && (
                    <span className="text-[10px] font-bold text-brand-600 bg-brand-500/10 px-2 py-0.5 rounded-full uppercase">
                      Admin
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
