/**
 * TalkChat Conversation and Chat Domain Types.
 * 
 * Defines data structures for 1-to-1 direct conversations and group chats,
 * participant rosters, unread counters, and disappearing message settings.
 * 
 * @see https://www.typescriptlang.org/docs/handbook/2/objects.html
 */

export type ConversationType = 'DIRECT' | 'GROUP';
export type MemberRole = 'ADMIN' | 'MODERATOR' | 'MEMBER';

export interface ParticipantUser {
  id: string;
  username: string;
  fullName: string;
  avatarUrl?: string | null;
  isOnline?: boolean;
  lastSeen?: string | null;
}

export interface ConversationMember {
  id?: string;
  userId: string;
  role: MemberRole;
  user: ParticipantUser;
}

export interface ConversationUserSettings {
  unreadCount: number;
  isMuted: boolean;
  mutedUntil?: string | null;
  role: MemberRole;
}

export interface LastMessagePreview {
  id: string;
  content?: string | null;
  senderId?: string;
  type?: string;
  createdAt?: string;
  isDeleted?: boolean;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  title?: string | null;
  description?: string | null;
  avatarUrl?: string | null;
  creatorId?: string | null;
  lastMessageId?: string | null;
  lastMessageAt?: string | null;
  disappearingDuration?: number | null;
  createdAt: string;
  updatedAt: string;
  members: ConversationMember[];
  userSettings?: ConversationUserSettings;
  lastMessage?: LastMessagePreview | null;
}

export interface ConversationsListResponse {
  items: Conversation[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateDirectChatPayload {
  participantId: string;
}

export interface CreateGroupChatPayload {
  title: string;
  description?: string;
  memberIds: string[];
}

export interface UpdateDisappearingTimerPayload {
  conversationId: string;
  duration: number; // in seconds (e.g. 86400, 0 for off)
}
