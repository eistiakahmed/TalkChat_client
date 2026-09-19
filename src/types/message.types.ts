/**
 * TalkChat Real-Time Message Domain Types.
 * 
 * Defines data structures for messages, multi-media attachments,
 * grouped emoji reactions, delivery/read receipts, and cursor pagination.
 * 
 * @see https://www.typescriptlang.org/docs/handbook/2/objects.html
 */

export type MessageType =
  | 'TEXT'
  | 'IMAGE'
  | 'VIDEO'
  | 'AUDIO'
  | 'FILE'
  | 'SYSTEM';

export type DeliveryStatus = 'SENT' | 'DELIVERED' | 'READ';

export interface MessageAttachment {
  id: string;
  fileUrl: string;
  fileType?: MessageType;
  fileName?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
  width?: number | null;
  height?: number | null;
  duration?: number | null;
}

export interface MessageReaction {
  id?: string;
  emoji: string;
  userId: string;
  user?: {
    id: string;
    username: string;
    fullName: string;
  };
}

export interface MessageReceipt {
  userId: string;
  status: DeliveryStatus;
  deliveredAt?: string | null;
  readAt?: string | null;
}

export interface ParentMessagePreview {
  id: string;
  content?: string | null;
  type: MessageType;
  sender?: {
    id: string;
    username: string;
    fullName: string;
  };
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content?: string | null;
  type: MessageType;
  parentMessageId?: string | null;
  parentMessage?: ParentMessagePreview | null;
  isEdited?: boolean;
  isDeleted?: boolean;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
  sender?: {
    id: string;
    username: string;
    fullName: string;
    avatarUrl?: string | null;
  };
  attachments?: MessageAttachment[];
  reactions?: MessageReaction[];
  receipts?: MessageReceipt[];
}

export interface SendMessagePayload {
  conversationId: string;
  content?: string;
  type?: MessageType;
  parentMessageId?: string;
}

export interface GetMessageHistoryPayload {
  conversationId: string;
  limit?: number;
  cursor?: string;
}

export interface EditMessagePayload {
  messageId: string;
  content: string;
}

export interface DeleteMessagePayload {
  messageId: string;
  deleteType: 'FOR_ME' | 'FOR_EVERYONE';
}

export interface ReactMessagePayload {
  messageId: string;
  emoji: string;
}

export interface UpdateReceiptPayload {
  conversationId: string;
  messageIds: string[];
  status: 'DELIVERED' | 'READ';
}
