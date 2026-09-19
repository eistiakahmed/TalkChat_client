'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import {
  User as UserIcon,
  Camera,
  Check,
  ArrowLeft,
  Mail,
  AtSign,
} from 'lucide-react';
import { Button, Input, Avatar, Spinner } from '../../../components/ui';
import { useAuthStore } from '../../../stores/auth.store';
import { userService } from '../../../services/user.service';

/**
 * User Profile & Account Details Page.
 * 
 * Allows users to inspect account metadata, update their display name,
 * and upload custom avatar images.
 */
export default function ProfilePage() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();

  const [fullName, setFullName] = React.useState(user?.fullName || '');
  const [selectedAvatarFile, setSelectedAvatarFile] = React.useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = React.useState<string | null>(
    user?.avatarUrl || null
  );
  const [feedback, setFeedback] = React.useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedAvatarFile(file);
      const objectUrl = URL.createObjectURL(file);
      setAvatarPreviewUrl(objectUrl);
    }
  };

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append('fullName', fullName.trim());
      if (selectedAvatarFile) {
        formData.append('avatar', selectedAvatarFile);
      }
      return userService.updateProfile(formData);
    },
    onSuccess: (updatedUser) => {
      updateUser(updatedUser);
      setFeedback({
        type: 'success',
        message: 'Profile updated successfully!',
      });
      setTimeout(() => setFeedback(null), 3000);
    },
    onError: (err: any) => {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to update profile.',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;
    updateProfileMutation.mutate();
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-background select-none overflow-y-auto">
      {/* 1. Header */}
      <header className="p-6 border-b border-border bg-card/60 backdrop-blur-md flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/settings')}
            className="-ml-2"
            aria-label="Back to settings"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-600">
            <UserIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">My Profile</h1>
            <p className="text-xs text-muted-foreground">
              Manage your identity and display settings
            </p>
          </div>
        </div>
      </header>

      {/* 2. Main Content Form */}
      <div className="max-w-2xl w-full mx-auto p-6">
        <form
          onSubmit={handleSubmit}
          className="space-y-6 p-6 rounded-3xl bg-card border border-border shadow-xs"
        >
          {/* Avatar Upload Section */}
          <div className="flex flex-col items-center text-center space-y-3 pb-2">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <Avatar
                src={avatarPreviewUrl}
                name={fullName || user?.username}
                size="2xl"
                className="ring-4 ring-brand-500/20 shadow-xl"
              />
              <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                <Camera className="w-6 h-6" />
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />

            <div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="w-4 h-4 mr-1.5" />
                Change Avatar
              </Button>
            </div>
          </div>

          {/* Feedback Alert */}
          {feedback && (
            <div
              className={`p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
                feedback.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                  : 'bg-danger/10 text-danger border border-danger/20'
              }`}
            >
              {feedback.type === 'success' && <Check className="w-4 h-4" />}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-4">
            <Input
              label="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your display name"
              required
            />

            <Input
              label="Username"
              value={user?.username || ''}
              disabled
              leftIcon={<AtSign className="w-4 h-4 text-muted-foreground" />}
              helperText="Usernames cannot be changed once registered"
            />

            <Input
              label="Email Address"
              value={user?.email || ''}
              disabled
              leftIcon={<Mail className="w-4 h-4 text-muted-foreground" />}
              helperText="Your verified account email address"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => router.push('/settings')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <Spinner size="sm" />
                  <span>Saving...</span>
                </div>
              ) : (
                'Save Profile'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
