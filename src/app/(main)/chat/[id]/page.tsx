'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatService } from '../../../../services/chat.service';
import { messageService } from '../../../../services/message.service';
import { useAuthStore } from '../../../../stores/auth.store';
import { useChatStore } from '../../../../stores/chat.store';
import { useWebRTC } from '../../../../hooks/useWebRTC';
import type { ConversationMember } from '../../../../types/chat.types';
import type { Message, MessageType, MessageReaction } from '../../../../types/message.types';
import { Avatar, Button, Spinner, Dropdown } from '../../../../components/ui';
import { MessageList } from '../../../../components/chat/MessageList';
import { MessageInput } from '../../../../components/chat/MessageInput';
import { DisappearingMessagesModal } from '../../../../components/chat/DisappearingMessagesModal';
import { SafetyNumberModal } from '../../../../components/chat/SafetyNumberModal';
import { ConversationInfoModal } from '../../../../components/chat/ConversationInfoModal';
import {
  ArrowLeft,
  Phone,
  Video,
  MoreVertical,
  Clock,
  ShieldCheck,
} from 'lucide-react';

import { soundUtil } from '../../../../utils/sound.util';

const EMPTY_MESSAGES: Message[] = [];
const selectCurrentUserId = (s: { user: { id: string } | null }) => s.user?.id;
const selectSetActiveConversation = (s: { setActiveConversation: (conv: any) => void }) => s.setActiveConversation;

/**
 * Active Conversation Thread Page.
 * 
 * Displays full real-time encrypted messaging channel with
 * timeline history, sent/delivered/read receipts, replies, and reactions.
 */
export default function ActiveChatPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params?.id as string;
  const queryClient = useQueryClient();

  const currentUserId = useAuthStore(selectCurrentUserId);
  const setActiveConversation = useChatStore(selectSetActiveConversation);

  // WebRTC calling triggers
  const { startCall } = useWebRTC();

  const [replyingTo, setReplyingTo] = React.useState<Message | null>(null);
  const [isInfoOpen, setIsInfoOpen] = React.useState(false);
  const [isDisappearingOpen, setIsDisappearingOpen] = React.useState(false);
  const [isSafetyNumberOpen, setIsSafetyNumberOpen] = React.useState(false);

  // 1. Fetch conversation details
  const {
    data: conversation,
    isLoading: isLoadingConv,
    isError: isErrorConv,
  } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => chatService.getConversationDetails(conversationId),
    enabled: !!conversationId,
  });

  // 2. Fetch messages history
  const {
    data: messagesData,
    isLoading: isLoadingMessages,
  } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      const res = await messageService.getMessageHistory({
        conversationId,
        limit: 50,
      });
      // Backend returns newest first; reverse for chronological stream (oldest to newest)
      const reversed = [...res.messages].reverse();
      const seen = new Set<string>();
      return reversed.filter((msg) => {
        if (!msg?.id || seen.has(msg.id)) return false;
        seen.add(msg.id);
        return true;
      });
    },
    enabled: !!conversationId,
  });

  const messages = messagesData || EMPTY_MESSAGES;

  React.useEffect(() => {
    if (conversation && useChatStore.getState().activeConversationId !== conversation.id) {
      setActiveConversation(conversation);
    }
  }, [conversation, setActiveConversation]);

  // Mark conversation as read and send read receipts when actively viewing
  React.useEffect(() => {
    if (!conversationId || !currentUserId) return;

    // 1. Optimistically clear unread count for this conversation in the conversations cache
    queryClient.setQueriesData<any>(
      { queryKey: ['conversations'] },
      (old: any) => {
        if (!old) return old;
        const resetUnread = (c: any) => {
          if (c.id !== conversationId) return c;
          return {
            ...c,
            userSettings: {
              ...c.userSettings,
              unreadCount: 0,
            },
          };
        };
        if (Array.isArray(old)) return old.map(resetUnread);
        if (old.items && Array.isArray(old.items)) {
          return { ...old, items: old.items.map(resetUnread) };
        }
        return old;
      }
    );

    // 2. Persist mark as read to backend
    chatService.markAsRead(conversationId).catch(() => {});

    // 3. Mark unread peer messages as read
    if (messagesData && messagesData.length > 0) {
      const unreadPeerMessages = messagesData.filter(
        (m) =>
          m.senderId !== currentUserId &&
          !m.receipts?.some((r) => r.userId === currentUserId && r.status === 'READ')
      );

      if (unreadPeerMessages.length > 0) {
        messageService
          .updateReceipts({
            conversationId,
            messageIds: unreadPeerMessages.map((m) => m.id),
            status: 'READ',
          })
          .catch(() => {});
      }
    }
  }, [conversationId, currentUserId, messagesData, queryClient]);

  // Send Message Mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({
      content,
      file,
      parentMessageId,
    }: {
      content: string;
      file?: File;
      parentMessageId?: string;
    }) => {
      let type: MessageType = 'TEXT';
      if (file) {
        if (file.type.startsWith('image/')) type = 'IMAGE';
        else if (file.type.startsWith('audio/')) type = 'AUDIO';
        else if (file.type.startsWith('video/')) type = 'VIDEO';
        else type = 'FILE';
      }

      return messageService.sendMessage(
        {
          conversationId,
          content: content || undefined,
          type,
          parentMessageId,
        },
        file
      );
    },
    onSuccess: (newMessage) => {
      soundUtil.playMessageSent();
      queryClient.setQueryData<Message[]>(
        ['messages', conversationId],
        (old = []) => {
          if (old.some((m) => m.id === newMessage.id)) return old;
          return [...old, newMessage];
        }
      );
      queryClient.setQueriesData<any>(
        { queryKey: ['conversations'] },
        (old: any) => {
          if (!old) return old;
          const updateConv = (conv: any) => {
            if (conv.id !== conversationId) return conv;
            return {
              ...conv,
              lastMessageAt: newMessage.createdAt,
              lastMessage: {
                id: newMessage.id,
                content: newMessage.content,
                type: newMessage.type,
                senderId: newMessage.senderId,
                createdAt: newMessage.createdAt,
                isDeleted: newMessage.isDeleted,
              },
              userSettings: {
                ...conv.userSettings,
                unreadCount: 0,
              },
            };
          };

          if (Array.isArray(old)) return old.map(updateConv);
          if (old.items && Array.isArray(old.items)) {
            return { ...old, items: old.items.map(updateConv) };
          }
          return old;
        }
      );
      chatService.markAsRead(conversationId).catch(() => {});
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setReplyingTo(null);
    },
  });

  // Reaction Mutation with Instant Optimistic UI Update
  const reactMutation = useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      await messageService.toggleReaction({ messageId, emoji });
    },
    onMutate: async ({ messageId, emoji }) => {
      if (!currentUserId) return;

      // Cancel outgoing refetches so they don't overwrite optimistic update
      await queryClient.cancelQueries({ queryKey: ['messages', conversationId] });

      // Snapshot previous messages for rollback on error
      const previousMessages = queryClient.getQueryData<Message[]>(['messages', conversationId]);

      // Optimistically update React Query cache immediately (0ms delay!)
      queryClient.setQueryData<Message[]>(['messages', conversationId], (old = []) =>
        old.map((m) => {
          if (m.id !== messageId) return m;

          const currentReactions = m.reactions || [];
          const alreadyReactedWithThisEmoji = currentReactions.some(
            (r) => r.userId === currentUserId && r.emoji === emoji
          );

          let updatedReactions: MessageReaction[];
          if (alreadyReactedWithThisEmoji) {
            // Toggle off: remove this emoji reaction
            updatedReactions = currentReactions.filter(
              (r) => !(r.userId === currentUserId && r.emoji === emoji)
            );
          } else {
            // Toggle on: remove any other emoji from this user (single reaction) and add new emoji
            updatedReactions = [
              ...currentReactions.filter((r) => r.userId !== currentUserId),
              {
                id: `temp-${Date.now()}`,
                userId: currentUserId,
                emoji,
              },
            ];
          }

          return {
            ...m,
            reactions: updatedReactions,
          };
        })
      );

      return { previousMessages };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(['messages', conversationId], context.previousMessages);
      }
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (messageId: string) => {
      await messageService.deleteMessage({
        messageId,
        deleteType: 'FOR_EVERYONE',
      });
    },
    onSuccess: (_, messageId) => {
      queryClient.setQueryData<Message[]>(
        ['messages', conversationId],
        (old = []) =>
          old.map((m) =>
            m.id === messageId
              ? { ...m, isDeleted: true, content: 'This message was deleted' }
              : m
          )
      );
    },
  });

  const isGroup = conversation?.type === 'GROUP';
  const otherMember = conversation?.members?.find(
    (m: ConversationMember) => m.userId !== currentUserId
  );

  const title = isGroup
    ? conversation?.title || 'Group Chat'
    : otherMember?.user.fullName || otherMember?.user.username || 'Direct Message';

  const avatarUrl = isGroup
    ? conversation?.avatarUrl
    : otherMember?.user.avatarUrl;

  const isOnline = !isGroup && (otherMember?.user.isOnline ?? false);
  const subtitle = isGroup
    ? `${conversation?.members?.length || 0} participants`
    : isOnline
    ? 'Online'
    : otherMember?.user.lastSeen
    ? 'Recently active'
    : 'Offline';

  const chatMenuItems = React.useMemo(
    () => [
      {
        id: 'details',
        label: isGroup ? 'Group Information' : 'Contact Details',
        onClick: () => setIsInfoOpen(true),
      },
      {
        id: 'disappearing',
        label: 'Disappearing Messages',
        icon: <Clock className="w-4 h-4" />,
        onClick: () => setIsDisappearingOpen(true),
      },
      ...(!isGroup && otherMember?.user
        ? [
            {
              id: 'safetyNumber',
              label: 'Verify Safety Number',
              icon: <ShieldCheck className="w-4 h-4" />,
              onClick: () => setIsSafetyNumberOpen(true),
            },
          ]
        : []),
      {
        id: 'mute',
        label: conversation?.userSettings?.isMuted
          ? 'Unmute'
          : 'Mute Notifications',
        onClick: async () => {
          const nextMuted = !conversation?.userSettings?.isMuted;
          await chatService.toggleMute(conversationId, nextMuted);
          queryClient.invalidateQueries({
            queryKey: ['conversation', conversationId],
          });
        },
      },
    ],
    [
      isGroup,
      otherMember?.user,
      conversation?.userSettings?.isMuted,
      conversationId,
      queryClient,
    ]
  );

  if (isLoadingConv) {
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center space-y-3 bg-card/20">
        <Spinner size="lg" />
        <p className="text-xs text-muted-foreground animate-pulse">
          Opening conversation...
        </p>
      </div>
    );
  }

  if (isErrorConv || !conversation) {
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center p-6 text-center space-y-4">
        <p className="text-sm font-semibold text-danger">
          Failed to load conversation details
        </p>
        <Button variant="outline" size="sm" onClick={() => router.push('/chat')}>
          Back to Chats
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full flex flex-col bg-[#090a0f] overflow-hidden select-none relative">
      {/* 1. Header */}
      <header className="h-16 border-b border-white/[0.08] bg-[#0f1015]/95 backdrop-blur-xl px-4 md:px-6 flex items-center justify-between z-10 shrink-0 shadow-sm">
        <div
          onClick={() => setIsInfoOpen(true)}
          className="flex items-center gap-3 min-w-0 cursor-pointer hover:opacity-90 transition-opacity"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              router.push('/chat');
            }}
            className="md:hidden -ml-2 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06]"
            aria-label="Back to conversations"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <Avatar
            src={avatarUrl}
            name={title}
            size="md"
            status={isGroup ? undefined : isOnline ? 'online' : 'offline'}
          />

          <div className="min-w-0">
            <h2 className="text-sm font-bold text-white truncate tracking-tight">{title}</h2>
            <p className="text-xs truncate flex items-center gap-1.5 font-medium">
              {isOnline ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <span className="text-emerald-400">Online</span>
                </>
              ) : (
                <span className="text-slate-400">{subtitle}</span>
              )}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Start Voice Call"
            disabled={isGroup || !otherMember?.user}
            onClick={() => {
              if (otherMember?.user) {
                startCall(otherMember.user, 'AUDIO', conversationId);
              }
            }}
            className="w-9 h-9 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] disabled:opacity-30 transition-all flex items-center justify-center cursor-pointer"
          >
            <Phone className="w-4 h-4" />
          </button>

          <button
            type="button"
            aria-label="Start Video Call"
            disabled={isGroup || !otherMember?.user}
            onClick={() => {
              if (otherMember?.user) {
                startCall(otherMember.user, 'VIDEO', conversationId);
              }
            }}
            className="w-9 h-9 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] disabled:opacity-30 transition-all flex items-center justify-center cursor-pointer"
          >
            <Video className="w-4 h-4" />
          </button>

          <Dropdown
            trigger={
              <button
                type="button"
                aria-label="Chat Options"
                className="w-9 h-9 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all flex items-center justify-center cursor-pointer"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            }
            items={chatMenuItems}
            align="right"
          />
        </div>
      </header>

      {/* 2. Real-Time Message Stream Canvas */}
      <MessageList
        conversationId={conversationId}
        messages={messages}
        isLoading={isLoadingMessages}
        isGroup={isGroup}
        disappearingDuration={conversation.disappearingDuration}
        onReply={(msg) => setReplyingTo(msg)}
        onReact={(msgId, emoji) => reactMutation.mutate({ messageId: msgId, emoji })}
        onDelete={(msgId) => deleteMutation.mutate(msgId)}
        onCall={(type) => {
          if (otherMember?.user) {
            startCall(otherMember.user, type, conversationId);
          }
        }}
      />

      {/* 3. Composer Input Bar */}
      <MessageInput
        conversationId={conversationId}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        onSendMessage={async (content, file, parentMessageId) => {
          await sendMessageMutation.mutateAsync({
            content,
            file,
            parentMessageId,
          });
        }}
      />

      {/* 4. Modals */}
      <ConversationInfoModal
        isOpen={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
        conversation={conversation}
        onOpenSafetyNumber={() => setIsSafetyNumberOpen(true)}
        onOpenDisappearing={() => setIsDisappearingOpen(true)}
      />

      <DisappearingMessagesModal
        isOpen={isDisappearingOpen}
        onClose={() => setIsDisappearingOpen(false)}
        conversationId={conversationId}
        currentDuration={conversation.disappearingDuration}
      />

      {otherMember?.user && (
        <SafetyNumberModal
          isOpen={isSafetyNumberOpen}
          onClose={() => setIsSafetyNumberOpen(false)}
          targetUser={otherMember.user}
        />
      )}
    </div>
  );
}
