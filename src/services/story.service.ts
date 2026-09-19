import { apiClient } from './api.client';
import type { ApiResponse } from '../types/auth.types';
import type {
  StoryItem,
  StoryAuthorGroup,
  StoryFeedResponse,
  StoryViewer,
  CreateStoryPayload,
} from '../types/story.types';

/**
 * Ephemeral Stories API Service.
 * 
 * Interacts with TalkChat 24-hour status endpoints, strictly
 * sending all parameters via HTTP request bodies (`req.body`).
 * 
 * @see https://github.com/eistiakahmed/TalkChat_server
 */
export const storyService = {
  /**
   * Post a new 24-hour expiring story.
   */
  async createStory(payload: CreateStoryPayload): Promise<StoryItem> {
    const response = await apiClient.post<ApiResponse<{ story: StoryItem }>>(
      '/stories/create',
      payload
    );

    if (!response.data?.story) {
      throw new Error(response.message || 'Failed to create story');
    }

    return response.data.story;
  },

  /**
   * Retrieve active stories feed grouped by author.
   */
  async getStoryFeed(payload: { limit?: number; cursor?: string } = {}): Promise<StoryFeedResponse> {
    const response = await apiClient.post<ApiResponse<StoryFeedResponse>>(
      '/stories/feed',
      payload
    );

    return response.data || { feed: [] };
  },

  /**
   * Record a view on a story.
   */
  async viewStory(storyId: string): Promise<void> {
    await apiClient.post<ApiResponse<void>>('/stories/view', {
      storyId,
    });
  },

  /**
   * Fetch viewer roster for a story (creator only).
   */
  async getStoryViewers(storyId: string, limit = 50): Promise<StoryViewer[]> {
    const response = await apiClient.post<
      ApiResponse<{ viewers: StoryViewer[] }>
    >('/stories/viewers', {
      storyId,
      limit,
    });

    return response.data?.viewers || [];
  },

  /**
   * Delete an active story manually.
   */
  async deleteStory(storyId: string): Promise<void> {
    await apiClient.post<ApiResponse<void>>('/stories/delete', {
      storyId,
    });
  },

  /**
   * Retrieve user's own active stories.
   */
  async getMyStories(): Promise<StoryItem[]> {
    const response = await apiClient.post<
      ApiResponse<{ stories: StoryItem[] }>
    >('/stories/me', {});

    return response.data?.stories || [];
  },
};
