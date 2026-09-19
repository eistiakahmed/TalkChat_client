'use client';

import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Modal, Input, Button, Tabs } from '../ui';
import { storyService } from '../../services/story.service';
import type { StoryMediaType, StoryPrivacy } from '../../types/story.types';
import { Image as ImageIcon, Upload, Users, Shield } from 'lucide-react';

export interface CreateStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateStoryModal({ isOpen, onClose }: CreateStoryModalProps) {
  const queryClient = useQueryClient();

  const [mediaUrl, setMediaUrl] = React.useState('');
  const [caption, setCaption] = React.useState('');
  const [mediaType, setMediaType] = React.useState<StoryMediaType>('IMAGE');
  const [privacy, setPrivacy] = React.useState<StoryPrivacy>('ALL_CONTACTS');
  const [isUploading, setIsUploading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('video/')) {
      setMediaType('VIDEO');
    } else {
      setMediaType('IMAGE');
    }

    // Convert to local data URL for preview and payload
    const reader = new FileReader();
    reader.onload = () => {
      setMediaUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleShare = async () => {
    if (!mediaUrl.trim()) {
      setErrorMsg('Please select an image or video to share');
      return;
    }

    setIsUploading(true);
    setErrorMsg(null);

    try {
      await storyService.createStory({
        mediaUrl: mediaUrl.trim(),
        mediaType,
        caption: caption.trim() || undefined,
        privacy,
      });

      queryClient.invalidateQueries({ queryKey: ['storyFeed'] });
      setMediaUrl('');
      setCaption('');
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to create story');
    } finally {
      setIsUploading(false);
    }
  };

  const privacyTabs = [
    { id: 'ALL_CONTACTS', label: 'All Contacts', icon: <Users className="w-4 h-4" /> },
    { id: 'CLOSE_FRIENDS', label: 'Close Friends', icon: <Shield className="w-4 h-4" /> },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create 24h Story"
      description="Share an ephemeral photo or video visible to your contacts for 24 hours."
    >
      <div className="space-y-4 pt-2 select-none">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs font-medium animate-fadeIn">
            {errorMsg}
          </div>
        )}

        {/* Media Preview Box / File Picker */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {mediaUrl ? (
          <div className="relative rounded-2xl overflow-hidden bg-black/90 max-h-72 flex items-center justify-center border border-border-subtle group">
            {mediaType === 'VIDEO' ? (
              <video src={mediaUrl} controls className="max-h-72 w-full object-contain" />
            ) : (
              <img src={mediaUrl} alt="Story preview" className="max-h-72 w-full object-contain" />
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-card/80 backdrop-blur-md text-xs font-medium text-foreground hover:bg-card transition-colors shadow-md"
            >
              Change Media
            </button>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border rounded-2xl p-8 flex flex-col items-center justify-center gap-3 text-center cursor-pointer hover:border-brand-500 hover:bg-brand-500/5 transition-all"
          >
            <div className="w-12 h-12 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-600">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Click to upload photo or video
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                PNG, JPG, MP4, or WebM (Max 24h auto-expiry)
              </p>
            </div>
          </div>
        )}

        {/* Optional Media URL write-in */}
        <Input
          placeholder="Or paste an image URL directly..."
          value={mediaUrl.startsWith('data:') ? '' : mediaUrl}
          onChange={(e) => {
            setMediaUrl(e.target.value);
            setMediaType('IMAGE');
          }}
          leftIcon={<ImageIcon className="w-4 h-4 text-muted-foreground" />}
        />

        {/* Caption */}
        <Input
          label="Caption (optional)"
          placeholder="Add a thought or caption..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />

        {/* Privacy Selector */}
        <div className="space-y-1.5">
          <span className="text-xs font-semibold text-muted-foreground">
            Story Audience
          </span>
          <Tabs
            tabs={privacyTabs}
            activeTab={privacy}
            onChange={(tab) => setPrivacy(tab as StoryPrivacy)}
            size="sm"
          />
        </div>

        {/* Action Button */}
        <Button
          variant="primary"
          className="w-full mt-2"
          onClick={handleShare}
          disabled={!mediaUrl.trim() || isUploading}
          isLoading={isUploading}
        >
          Share to Status
        </Button>
      </div>
    </Modal>
  );
}
