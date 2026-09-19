'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { Avatar } from '../ui';
import { storyService } from '../../services/story.service';
import { useAuthStore } from '../../stores/auth.store';
import type { StoryAuthorGroup } from '../../types/story.types';
import { cn } from '../../utils/cn';

export interface StoryTrayProps {
  onOpenViewer: (group: StoryAuthorGroup, initialIndex?: number) => void;
  onOpenCreate: () => void;
}

/**
 * Ephemeral Story Tray Carousel Component.
 * 
 * Displays horizontal circular avatars with electric blue gradient rings
 * for unviewed stories, and quick status creation for the authenticated user.
 */
export function StoryTray({ onOpenViewer, onOpenCreate }: StoryTrayProps) {
  const currentUser = useAuthStore((s) => s.user);

  const { data: feedData, isLoading } = useQuery({
    queryKey: ['storyFeed'],
    queryFn: () => storyService.getStoryFeed({ limit: 30 }),
    refetchInterval: 30000,
  });

  const feed = feedData?.feed || [];

  // Separate user's own stories from friends' stories
  const ownGroup = feed.find((g) => g.author.id === currentUser?.id);
  const friendsGroups = feed.filter((g) => g.author.id !== currentUser?.id);

  const hasOwnStories = !!ownGroup && ownGroup.stories.length > 0;

  return (
    <div className="w-full overflow-x-auto py-2 px-4 flex items-center gap-3.5 select-none no-scrollbar border-b border-border-subtle bg-card/40">
      {/* 1. Current User's Story Circle */}
      <div className="flex flex-col items-center gap-1 shrink-0">
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              if (hasOwnStories && ownGroup) {
                onOpenViewer(ownGroup);
              } else {
                onOpenCreate();
              }
            }}
            className="group block rounded-full focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            aria-label={hasOwnStories ? 'View your story' : 'Add story'}
          >
            <Avatar
              src={currentUser?.avatarUrl}
              name={currentUser?.fullName || currentUser?.username}
              size="md"
              hasStory={hasOwnStories}
              storyViewed={ownGroup?.allViewed}
            />
          </button>

          {/* Plus Add Button Overlay */}
          <button
            type="button"
            onClick={onOpenCreate}
            className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-brand-600 text-white flex items-center justify-center border-2 border-card shadow-xs hover:scale-110 transition-transform"
            aria-label="Create new story"
          >
            <Plus className="w-3 h-3 stroke-[3]" />
          </button>
        </div>
        <span className="text-[10px] font-medium text-foreground truncate max-w-[56px]">
          Your Story
        </span>
      </div>

      {/* 2. Loading Skeletons */}
      {isLoading && (
        <div className="flex items-center gap-3">
          {[...Array(4)].map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: skeleton items
            <div key={i} className="flex flex-col items-center gap-1 shrink-0 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-muted" />
              <div className="w-8 h-2 rounded bg-muted" />
            </div>
          ))}
        </div>
      )}

      {/* 3. Friends' Stories Circles */}
      {friendsGroups.map((group) => {
        const isUnviewed = !group.allViewed;
        return (
          <button
            key={group.author.id}
            type="button"
            onClick={() => onOpenViewer(group)}
            className="flex flex-col items-center gap-1 shrink-0 group focus:outline-none focus:ring-2 focus:ring-brand-500/50 rounded-full"
            aria-label={`View story by ${group.author.fullName || group.author.username}`}
          >
            <Avatar
              src={group.author.avatarUrl}
              name={group.author.fullName || group.author.username}
              size="md"
              hasStory={true}
              storyViewed={group.allViewed}
              className="group-hover:scale-105 transition-transform"
            />
            <span
              className={cn(
                'text-[10px] truncate max-w-[56px]',
                isUnviewed ? 'font-semibold text-foreground' : 'text-muted-foreground'
              )}
            >
              {group.author.fullName?.split(' ')[0] || group.author.username}
            </span>
          </button>
        );
      })}
    </div>
  );
}
