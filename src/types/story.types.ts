/**
 * TalkChat Ephemeral 24-Hour Stories (Statuses) Domain Types.
 * 
 * Defines schemas for media stories, feed grouping by contact author,
 * viewer rosters, and creation payloads.
 * 
 * @see https://www.typescriptlang.org/docs/handbook/2/objects.html
 */

export type StoryMediaType = 'IMAGE' | 'VIDEO' | 'TEXT';
export type StoryPrivacy = 'ALL_CONTACTS' | 'CLOSE_FRIENDS' | 'SELECTED';

export interface StoryItem {
  id: string;
  mediaUrl: string;
  mediaType: StoryMediaType;
  caption?: string | null;
  hasViewed?: boolean;
  viewsCount?: number;
  createdAt: string;
  expiresAt: string;
}

export interface StoryAuthor {
  id: string;
  fullName: string;
  username: string;
  avatarUrl?: string | null;
}

export interface StoryAuthorGroup {
  author: StoryAuthor;
  allViewed: boolean;
  stories: StoryItem[];
}

export interface StoryFeedResponse {
  feed: StoryAuthorGroup[];
  nextCursor?: string | null;
}

export interface StoryViewer {
  id: string;
  viewerId: string;
  viewedAt: string;
  viewer: StoryAuthor;
}

export interface CreateStoryPayload {
  mediaUrl: string;
  mediaPublicId?: string;
  mediaType?: StoryMediaType;
  caption?: string;
  privacy?: StoryPrivacy;
  allowedUserIds?: string[];
}
