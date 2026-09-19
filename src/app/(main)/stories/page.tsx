'use client';

import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Radio, Clock, Eye } from 'lucide-react';
import { Button, Avatar, Spinner } from '../../../components/ui';
import { StoryTray } from '../../../components/story/StoryTray';
import { CreateStoryModal } from '../../../components/story/CreateStoryModal';
import { StoryViewerModal } from '../../../components/story/StoryViewerModal';
import { storyService } from '../../../services/story.service';
import { useAuthStore } from '../../../stores/auth.store';
import type { StoryAuthorGroup } from '../../../types/story.types';
import { formatDistanceToNow } from 'date-fns';

/**
 * Ephemeral Stories & Statuses Page.
 * 
 * Manages 24-hour disappearing media statuses, viewer analytics,
 * and contact story feeds.
 */
export default function StoriesPage() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);

  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [activeViewerGroup, setActiveViewerGroup] = React.useState<StoryAuthorGroup | null>(null);

  // Fetch story feed
  const { data: feedData, isLoading, refetch } = useQuery({
    queryKey: ['storyFeed'],
    queryFn: () => storyService.getStoryFeed({ limit: 50 }),
  });

  const feed = feedData?.feed || [];
  const ownGroup = feed.find((g) => g.author.id === currentUser?.id);
  const friendsGroups = feed.filter((g) => g.author.id !== currentUser?.id);

  return (
    <div className="flex-1 h-full flex flex-col bg-background select-none overflow-y-auto">
      {/* Header */}
      <header className="p-6 border-b border-border bg-card/60 backdrop-blur-md flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-600">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Stories & Status</h1>
            <p className="text-xs text-muted-foreground">Disappearing photos and videos (24 hours)</p>
          </div>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsCreateOpen(true)}
        >
          <Plus className="w-4 h-4 mr-1.5" />
          New Status
        </Button>
      </header>

      {/* Top Story Tray Carousel */}
      <StoryTray
        onOpenViewer={(group) => setActiveViewerGroup(group)}
        onOpenCreate={() => setIsCreateOpen(true)}
      />

      {/* Main Content Area */}
      <div className="max-w-4xl w-full mx-auto p-6 space-y-8">
        {/* User's Own Status Section */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            My Status
          </h2>

          {ownGroup && ownGroup.stories.length > 0 ? (
            <div
              onClick={() => setActiveViewerGroup(ownGroup)}
              className="p-4 rounded-2xl bg-card border border-border flex items-center justify-between cursor-pointer hover:border-brand-500/40 transition-all group shadow-xs"
            >
              <div className="flex items-center gap-3.5">
                <Avatar
                  src={currentUser?.avatarUrl}
                  name={currentUser?.fullName || currentUser?.username}
                  size="lg"
                  hasStory
                  storyViewed={ownGroup.allViewed}
                />
                <div>
                  <h3 className="font-semibold text-sm text-foreground">
                    My Status ({ownGroup.stories.length} active)
                  </h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {formatDistanceToNow(new Date(ownGroup.stories[0].createdAt), { addSuffix: true })}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-brand-600 bg-brand-500/10 px-3 py-1.5 rounded-full">
                <Eye className="w-3.5 h-3.5" />
                <span>{ownGroup.stories[0].viewsCount || 0} views</span>
              </div>
            </div>
          ) : (
            <div
              onClick={() => setIsCreateOpen(true)}
              className="p-4 rounded-2xl bg-card border border-dashed border-border flex items-center gap-3.5 cursor-pointer hover:border-brand-500/50 hover:bg-brand-500/5 transition-all"
            >
              <div className="w-12 h-12 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-600">
                <Plus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-foreground">Add to my status</h3>
                <p className="text-xs text-muted-foreground">Share an update with your contacts</p>
              </div>
            </div>
          )}
        </section>

        {/* Recent Updates from Contacts */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Recent Updates
          </h2>

          {isLoading ? (
            <div className="py-12 flex justify-center">
              <Spinner size="lg" />
            </div>
          ) : friendsGroups.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {friendsGroups.map((group) => {
                const isUnviewed = !group.allViewed;
                return (
                  <div
                    key={group.author.id}
                    onClick={() => setActiveViewerGroup(group)}
                    className="p-3.5 rounded-2xl bg-card border border-border flex items-center justify-between cursor-pointer hover:border-brand-500/40 hover:bg-muted/40 transition-all shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={group.author.avatarUrl}
                        name={group.author.fullName || group.author.username}
                        size="md"
                        hasStory
                        storyViewed={group.allViewed}
                      />
                      <div>
                        <h4 className="font-semibold text-sm text-foreground">
                          {group.author.fullName || group.author.username}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(group.stories[0].createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>

                    {isUnviewed && (
                      <span className="w-2.5 h-2.5 rounded-full bg-brand-600" />
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 p-6 rounded-2xl bg-card/40 border border-border space-y-2">
              <p className="text-sm font-semibold text-foreground">No recent stories</p>
              <p className="text-xs text-muted-foreground">
                Stories from your contacts will appear here for 24 hours.
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Modals */}
      <CreateStoryModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

      {activeViewerGroup && (
        <StoryViewerModal
          group={activeViewerGroup}
          onClose={() => setActiveViewerGroup(null)}
          onStoryDeleted={() => {
            queryClient.invalidateQueries({ queryKey: ['storyFeed'] });
            refetch();
          }}
        />
      )}
    </div>
  );
}
