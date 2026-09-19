'use client';

import * as React from 'react';
import { X, ChevronLeft, ChevronRight, Eye, Trash2 } from 'lucide-react';
import { Avatar, Spinner } from '../ui';
import { storyService } from '../../services/story.service';
import { useAuthStore } from '../../stores/auth.store';
import type { StoryAuthorGroup, StoryViewer } from '../../types/story.types';
import { formatDistanceToNow } from 'date-fns';

export interface StoryViewerModalProps {
  group: StoryAuthorGroup | null;
  initialIndex?: number;
  onClose: () => void;
  onStoryDeleted?: () => void;
}

const STORY_DURATION_MS = 5000;

export function StoryViewerModal({
  group,
  initialIndex = 0,
  onClose,
  onStoryDeleted,
}: StoryViewerModalProps) {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex);
  const [progress, setProgress] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);

  // Viewers roster sheet state for authors
  const [showViewers, setShowViewers] = React.useState(false);
  const [viewers, setViewers] = React.useState<StoryViewer[]>([]);
  const [isLoadingViewers, setIsLoadingViewers] = React.useState(false);

  const stories = group?.stories || [];
  const currentStory = stories[currentIndex];
  const isAuthor = group?.author.id === currentUserId;

  // Mark current story as viewed
  React.useEffect(() => {
    if (!currentStory) return;

    if (!isAuthor && !currentStory.hasViewed) {
      storyService.viewStory(currentStory.id).catch(() => {});
      currentStory.hasViewed = true;
    }
  }, [currentStory, isAuthor]);

  // Story Timer Animation
  React.useEffect(() => {
    if (!currentStory || isPaused || showViewers) return;

    setProgress(0);
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min((elapsed / STORY_DURATION_MS) * 100, 100);
      setProgress(pct);

      if (pct >= 100) {
        clearInterval(interval);
        handleNext();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [currentIndex, currentStory, isPaused, showViewers]);

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setProgress(0);
    }
  };

  const handleLoadViewers = async () => {
    if (!currentStory || !isAuthor) return;
    setIsPaused(true);
    setShowViewers(true);
    setIsLoadingViewers(true);
    try {
      const roster = await storyService.getStoryViewers(currentStory.id);
      setViewers(roster);
    } catch {
      setViewers([]);
    } finally {
      setIsLoadingViewers(false);
    }
  };

  const handleDeleteCurrentStory = async () => {
    if (!currentStory || !isAuthor) return;
    try {
      await storyService.deleteStory(currentStory.id);
      onStoryDeleted?.();
      onClose();
    } catch {
      // Ignore failure
    }
  };

  if (!group || !currentStory) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Story Viewer"
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center select-none backdrop-blur-sm"
      onMouseDown={() => setIsPaused(true)}
      onMouseUp={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* Viewer Canvas Container */}
      <div className="relative w-full max-w-md h-full max-h-[92vh] sm:rounded-3xl overflow-hidden bg-zinc-950 flex flex-col justify-between shadow-2xl border border-zinc-800">
        {/* 1. Top Segmented Progress Bars */}
        <div className="absolute top-3 left-3 right-3 z-30 flex items-center gap-1.5">
          {stories.map((s, idx) => {
            let width = '0%';
            if (idx < currentIndex) width = '100%';
            else if (idx === currentIndex) width = `${progress}%`;

            return (
              <div
                key={s.id}
                className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
              >
                <div
                  className="h-full bg-white transition-all duration-75"
                  style={{ width }}
                />
              </div>
            );
          })}
        </div>

        {/* 2. Top Header Metadata */}
        <div className="absolute top-6 left-4 right-4 z-30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Avatar
              src={group.author.avatarUrl}
              name={group.author.fullName || group.author.username}
              size="sm"
            />
            <div>
              <p className="text-xs font-bold text-white leading-none">
                {group.author.fullName || group.author.username}
              </p>
              <span className="text-[10px] text-white/70">
                {formatDistanceToNow(new Date(currentStory.createdAt), { addSuffix: true })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {isAuthor && (
              <button
                type="button"
                onClick={handleDeleteCurrentStory}
                className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10"
                aria-label="Delete Story"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10"
              aria-label="Close story viewer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 3. Media Presentation Area */}
        <div className="flex-1 flex items-center justify-center overflow-hidden relative">
          {currentStory.mediaType === 'VIDEO' ? (
            <video
              src={currentStory.mediaUrl}
              autoPlay
              playsInline
              className="w-full h-full object-contain"
            />
          ) : (
            <img
              src={currentStory.mediaUrl}
              alt="Story"
              className="w-full h-full object-contain"
            />
          )}

          {/* Left / Right Click Nav Zones */}
          <div
            className="absolute inset-y-0 left-0 w-1/3 z-20 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
          />
          <div
            className="absolute inset-y-0 right-0 w-2/3 z-20 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
          />
        </div>

        {/* 4. Bottom Caption Overlay */}
        <div className="absolute bottom-0 inset-x-0 p-4 pt-12 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-30">
          {currentStory.caption && (
            <p className="text-white text-sm text-center mb-2 font-medium">
              {currentStory.caption}
            </p>
          )}

          {/* Author View Count Pill */}
          {isAuthor && (
            <button
              type="button"
              onClick={handleLoadViewers}
              className="mx-auto flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-semibold backdrop-blur-md transition-colors"
            >
              <Eye className="w-4 h-4" />
              <span>{currentStory.viewsCount || 0} views</span>
            </button>
          )}
        </div>

        {/* 5. Viewers Roster Sheet Overlay */}
        {showViewers && (
          <div className="absolute inset-0 z-40 bg-black/95 flex flex-col p-4 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="text-sm font-bold text-white">
                Viewers ({viewers.length})
              </span>
              <button
                type="button"
                onClick={() => setShowViewers(false)}
                className="p-1 rounded-full text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-2">
              {isLoadingViewers ? (
                <div className="py-8 flex justify-center text-white">
                  <Spinner size="md" />
                </div>
              ) : viewers.length > 0 ? (
                viewers.map((v) => (
                  <div key={v.id} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar
                        src={v.viewer.avatarUrl}
                        name={v.viewer.fullName || v.viewer.username}
                        size="sm"
                      />
                      <span className="text-xs font-semibold text-white">
                        {v.viewer.fullName || v.viewer.username}
                      </span>
                    </div>
                    <span className="text-[10px] text-white/60">
                      {formatDistanceToNow(new Date(v.viewedAt), { addSuffix: true })}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-center py-8 text-xs text-white/60">
                  No views yet
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Desktop Prev / Next Floating Arrows */}
      <button
        type="button"
        onClick={handlePrev}
        className="hidden md:flex absolute left-8 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
        aria-label="Previous story"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        type="button"
        onClick={handleNext}
        className="hidden md:flex absolute right-8 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
        aria-label="Next story"
      >
        <ChevronRight className="w-6 h-6" />
      </button>
    </div>
  );
}
