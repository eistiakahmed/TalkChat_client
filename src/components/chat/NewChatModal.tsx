'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Modal, Input, Button, Tabs, Avatar, Badge, Spinner } from '../ui';
import { useChatStore } from '../../stores/chat.store';
import { chatService } from '../../services/chat.service';
import { userService } from '../../services/user.service';
import type { ParticipantUser } from '../../types/chat.types';
import { Search, UserPlus, Users, X, Check } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export function NewChatModal() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isNewChatModalOpen, setNewChatModalOpen, setActiveConversation } =
    useChatStore();

  const [activeTab, setActiveTab] = React.useState('direct');

  // Direct chat search state
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<ParticipantUser[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [isCreating, setIsCreating] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Group creation state
  const [groupTitle, setGroupTitle] = React.useState('');
  const [groupDescription, setGroupDescription] = React.useState('');
  const [selectedGroupMembers, setSelectedGroupMembers] = React.useState<ParticipantUser[]>([]);

  // Search debouncing
  React.useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const users = await userService.searchUsers(searchQuery);
        setSearchResults(users);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleStartDirectChat = async (user: ParticipantUser) => {
    setIsCreating(true);
    setErrorMsg(null);

    try {
      const conversation = await chatService.createDirectChat({
        participantId: user.id,
      });

      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setActiveConversation(conversation);
      setNewChatModalOpen(false);
      router.push(`/chat/${conversation.id}`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to start chat');
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleMember = (user: ParticipantUser) => {
    setSelectedGroupMembers((prev) => {
      const exists = prev.some((u) => u.id === user.id);
      if (exists) {
        return prev.filter((u) => u.id !== user.id);
      }
      return [...prev, user];
    });
  };

  const handleCreateGroup = async () => {
    if (!groupTitle.trim()) {
      setErrorMsg('Please enter a group title');
      return;
    }

    if (selectedGroupMembers.length === 0) {
      setErrorMsg('Select at least one member to invite');
      return;
    }

    setIsCreating(true);
    setErrorMsg(null);

    try {
      const conversation = await chatService.createGroupChat({
        title: groupTitle.trim(),
        description: groupDescription.trim() || undefined,
        memberIds: selectedGroupMembers.map((m) => m.id),
      });

      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setActiveConversation(conversation);
      setNewChatModalOpen(false);
      router.push(`/chat/${conversation.id}`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to create group');
    } finally {
      setIsCreating(false);
    }
  };

  const modalTabs = [
    { id: 'direct', label: 'Direct Message', icon: <UserPlus className="w-4 h-4" /> },
    { id: 'group', label: 'New Group', icon: <Users className="w-4 h-4" /> },
  ];

  return (
    <Modal
      isOpen={isNewChatModalOpen}
      onClose={() => setNewChatModalOpen(false)}
      title="Start New Conversation"
      description="Connect directly with friends or create a collaborative group channel."
    >
      <div className="space-y-4 pt-2">
        <Tabs tabs={modalTabs} activeTab={activeTab} onChange={setActiveTab} />

        {errorMsg && (
          <div className="p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs font-medium animate-fadeIn">
            {errorMsg}
          </div>
        )}

        {/* Tab 1: Direct Chat */}
        {activeTab === 'direct' && (
          <div className="space-y-3">
            <Input
              placeholder="Search by username, email, or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-muted-foreground" />}
              autoFocus
            />

            <div className="max-h-60 overflow-y-auto space-y-1 py-1">
              {isSearching ? (
                <div className="py-8 flex justify-center text-muted-foreground">
                  <Spinner size="md" />
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleStartDirectChat(user)}
                    disabled={isCreating}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-muted/70 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={user.avatarUrl}
                        name={user.fullName || user.username}
                        size="sm"
                        status={user.isOnline ? 'online' : 'offline'}
                      />
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {user.fullName || user.username}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          @{user.username}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      Chat
                    </Button>
                  </button>
                ))
              ) : searchQuery.trim() ? (
                <p className="text-center py-6 text-sm text-muted-foreground">
                  No users found for &ldquo;{searchQuery}&rdquo;
                </p>
              ) : (
                <p className="text-center py-6 text-xs text-muted-foreground">
                  Type a username or email to search for people
                </p>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Group Chat */}
        {activeTab === 'group' && (
          <div className="space-y-3.5">
            <Input
              label="Group Name"
              placeholder="e.g. Design Team, Family, Project Talk"
              value={groupTitle}
              onChange={(e) => setGroupTitle(e.target.value)}
              required
            />

            <Input
              label="Description (optional)"
              placeholder="Brief description of the group's purpose"
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
            />

            {/* Selected Members Chips */}
            {selectedGroupMembers.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground">
                  Selected Members ({selectedGroupMembers.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedGroupMembers.map((member) => (
                    <Badge
                      key={member.id}
                      variant="primary"
                      className="gap-1.5 pl-2 pr-1 py-1"
                    >
                      <span>{member.fullName || member.username}</span>
                      <button
                        type="button"
                        onClick={() => handleToggleMember(member)}
                        className="hover:bg-white/20 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Search and select members */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground">
                Add Members
              </span>
              <Input
                placeholder="Search people to add..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-4 h-4 text-muted-foreground" />}
              />

              <div className="max-h-40 overflow-y-auto space-y-1 py-1">
                {searchResults.map((user) => {
                  const isSelected = selectedGroupMembers.some(
                    (m) => m.id === user.id
                  );
                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleToggleMember(user)}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted/70 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <Avatar
                          src={user.avatarUrl}
                          name={user.fullName || user.username}
                          size="sm"
                        />
                        <span className="text-sm font-medium text-foreground">
                          {user.fullName || user.username}
                        </span>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'border-border-strong'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <Button
              variant="primary"
              className="w-full mt-2"
              onClick={handleCreateGroup}
              isLoading={isCreating}
              disabled={isCreating || !groupTitle.trim() || selectedGroupMembers.length === 0}
            >
              Create Group Channel
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
