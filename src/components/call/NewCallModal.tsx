'use client';

import * as React from 'react';
import { Search, Phone, Video, X } from 'lucide-react';
import { Modal, Input, Avatar, Button, Spinner } from '../ui';
import { userService } from '../../services/user.service';
import { useWebRTC } from '../../hooks/useWebRTC';
import type { ParticipantUser } from '../../types/chat.types';

interface NewCallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * New Call Contact Picker Modal.
 * 
 * Allows users to search contacts or registered users and initiate
 * an encrypted WebRTC audio or video call with a single tap.
 * 
 * @see https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API
 */
export function NewCallModal({ isOpen, onClose }: NewCallModalProps) {
  const { startCall } = useWebRTC();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [results, setResults] = React.useState<ParticipantUser[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  // Load contacts or search results
  React.useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setResults([]);
      return;
    }

    let isMounted = true;
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        if (searchQuery.trim().length > 0) {
          const users = await userService.searchUsers(searchQuery);
          if (isMounted) setResults(users);
        } else {
          const contacts = await userService.getContacts();
          if (isMounted) setResults(contacts);
        }
      } catch {
        if (isMounted) setResults([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    const timer = setTimeout(fetchUsers, 250);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [isOpen, searchQuery]);

  const handleStartCall = (user: ParticipantUser, type: 'AUDIO' | 'VIDEO') => {
    startCall(
      {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
      },
      type
    );
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Start New Call"
      description="Choose a contact to begin an encrypted voice or video call"
    >
      <div className="space-y-4 pt-2">
        {/* Search Input */}
        <Input
          placeholder="Search by name or username..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search className="w-4 h-4 text-muted-foreground" />}
          autoFocus
        />

        {/* Results List */}
        <div className="max-h-72 overflow-y-auto divide-y divide-border/50 -mx-6 px-6">
          {isLoading ? (
            <div className="py-8 flex justify-center">
              <Spinner size="md" />
            </div>
          ) : results.length > 0 ? (
            results.map((user) => (
              <div
                key={user.id}
                className="py-3 flex items-center justify-between gap-3 hover:bg-muted/40 px-2 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar
                    src={user.avatarUrl}
                    name={user.fullName || user.username}
                    size="md"
                    status={user.isOnline ? 'online' : 'offline'}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {user.fullName || user.username}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      @{user.username}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleStartCall(user, 'AUDIO')}
                    className="h-9 w-9 text-brand-600 hover:bg-brand-500/10"
                    aria-label={`Voice call ${user.fullName || user.username}`}
                  >
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleStartCall(user, 'VIDEO')}
                    className="h-9 w-9 text-brand-600 hover:bg-brand-500/10"
                    aria-label={`Video call ${user.fullName || user.username}`}
                  >
                    <Video className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-xs text-muted-foreground">
              {searchQuery.trim()
                ? 'No matching users found'
                : 'No contacts available yet'}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
