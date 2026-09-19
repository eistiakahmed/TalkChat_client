'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Search,
  UserPlus,
  MessageSquare,
  Phone,
  Video,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { Button, Input, Avatar, Modal, Spinner } from '../../../components/ui';
import { userService } from '../../../services/user.service';
import { chatService } from '../../../services/chat.service';
import { useWebRTC } from '../../../hooks/useWebRTC';
import { SafetyNumberModal } from '../../../components/chat/SafetyNumberModal';
import type { ParticipantUser } from '../../../types/chat.types';
import { cn } from '../../../utils/cn';

/**
 * Contacts Roster & Directory Page.
 * 
 * Manages user contacts, discovery, presence status, and one-tap communication
 * channels (direct messaging, encrypted voice/video calls, and safety verification).
 */
export default function ContactsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { startCall } = useWebRTC();

  const [searchFilter, setSearchFilter] = React.useState('');
  const [activeTab, setActiveTab] = React.useState<'ALL' | 'ONLINE'>('ALL');
  const [isAddContactOpen, setIsAddContactOpen] = React.useState(false);
  const [selectedSafetyUser, setSelectedSafetyUser] = React.useState<ParticipantUser | null>(null);

  // Search state inside Add Contact modal
  const [addSearchQuery, setAddSearchQuery] = React.useState('');
  const [addSearchResults, setAddSearchResults] = React.useState<ParticipantUser[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = React.useState(false);
  const [requestedIds, setRequestedIds] = React.useState<Record<string, boolean>>({});

  // 1. Fetch user's contacts
  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => userService.getContacts(),
    refetchInterval: 15000,
  });

  // Filter contacts by search query & online tab
  const filteredContacts = React.useMemo(() => {
    return contacts.filter((c) => {
      const matchesSearch =
        c.fullName.toLowerCase().includes(searchFilter.toLowerCase()) ||
        c.username.toLowerCase().includes(searchFilter.toLowerCase());

      if (activeTab === 'ONLINE') {
        return matchesSearch && c.isOnline;
      }
      return matchesSearch;
    });
  }, [contacts, searchFilter, activeTab]);

  // Navigate to or create direct chat
  const handleStartChat = async (contact: ParticipantUser) => {
    try {
      const conv = await chatService.createDirectChat({
        participantId: contact.id,
      });
      router.push(`/chat/${conv.id}`);
    } catch (err) {
      console.error('Failed to open direct chat:', err);
    }
  };

  // Debounced search inside Add Contact modal
  React.useEffect(() => {
    if (!isAddContactOpen || !addSearchQuery.trim()) {
      setAddSearchResults([]);
      return;
    }

    let isMounted = true;
    const timer = setTimeout(async () => {
      setIsSearchingUsers(true);
      try {
        const results = await userService.searchUsers(addSearchQuery);
        if (isMounted) setAddSearchResults(results);
      } catch {
        if (isMounted) setAddSearchResults([]);
      } finally {
        if (isMounted) setIsSearchingUsers(false);
      }
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [isAddContactOpen, addSearchQuery]);

  // Send contact request mutation
  const sendRequestMutation = useMutation({
    mutationFn: async (contactId: string) => {
      await userService.sendContactRequest(contactId);
    },
    onSuccess: (_, contactId) => {
      setRequestedIds((prev) => ({ ...prev, [contactId]: true }));
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });

  return (
    <div className="flex-1 h-full flex flex-col bg-background select-none overflow-y-auto">
      {/* 1. Header */}
      <header className="p-6 border-b border-border bg-card/60 backdrop-blur-md flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-600">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Contacts</h1>
            <p className="text-xs text-muted-foreground">
              {contacts.length} saved contacts
            </p>
          </div>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsAddContactOpen(true)}
        >
          <UserPlus className="w-4 h-4 mr-1.5" />
          Add Contact
        </Button>
      </header>

      {/* 2. Main Content Area */}
      <div className="max-w-4xl w-full mx-auto p-6 space-y-6">
        {/* Controls Toolbar: Search & Filter Tabs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="w-full sm:w-80">
            <Input
              placeholder="Search contacts..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-muted-foreground" />}
            />
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              className={cn(
                'px-4 py-1.5 text-xs font-semibold rounded-full transition-all',
                activeTab === 'ALL'
                  ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/20'
                  : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
              )}
            >
              All ({contacts.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ONLINE')}
              className={cn(
                'px-4 py-1.5 text-xs font-semibold rounded-full transition-all',
                activeTab === 'ONLINE'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/20'
                  : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
              )}
            >
              Online ({contacts.filter((c) => c.isOnline).length})
            </button>
          </div>
        </div>

        {/* Contacts Roster */}
        {isLoading ? (
          <div className="py-20 flex justify-center">
            <Spinner size="lg" />
          </div>
        ) : filteredContacts.length > 0 ? (
          <div className="rounded-2xl border border-border bg-card/40 divide-y divide-border/60 overflow-hidden shadow-xs">
            {filteredContacts.map((contact) => (
              <div
                key={contact.id}
                className="p-4 flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <Avatar
                    src={contact.avatarUrl}
                    name={contact.fullName || contact.username}
                    size="md"
                    status={contact.isOnline ? 'online' : 'offline'}
                  />

                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-foreground truncate">
                      {contact.fullName || contact.username}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate flex items-center gap-1.5">
                      <span>@{contact.username}</span>
                      <span>•</span>
                      <span
                        className={
                          contact.isOnline
                            ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                            : ''
                        }
                      >
                        {contact.isOnline ? 'Online' : 'Offline'}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Quick Action Triggers */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleStartChat(contact)}
                    className="h-9 w-9 text-brand-600 hover:bg-brand-500/10"
                    aria-label={`Message ${contact.fullName}`}
                  >
                    <MessageSquare className="w-4 h-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => startCall(contact, 'AUDIO')}
                    className="h-9 w-9 text-brand-600 hover:bg-brand-500/10"
                    aria-label={`Voice call ${contact.fullName}`}
                  >
                    <Phone className="w-4 h-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => startCall(contact, 'VIDEO')}
                    className="h-9 w-9 text-brand-600 hover:bg-brand-500/10"
                    aria-label={`Video call ${contact.fullName}`}
                  >
                    <Video className="w-4 h-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedSafetyUser(contact)}
                    className="h-9 w-9 text-emerald-600 hover:bg-emerald-500/10"
                    aria-label={`Verify encryption with ${contact.fullName}`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 p-8 rounded-2xl bg-card/40 border border-border space-y-3">
            <div className="w-12 h-12 rounded-full bg-brand-500/10 text-brand-600 mx-auto flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-foreground">
              {searchFilter ? 'No contacts match your search' : 'No contacts saved yet'}
            </p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {searchFilter
                ? 'Try searching with a different name or username.'
                : 'Connect with friends and colleagues to start encrypted conversations and high-definition calls.'}
            </p>
            {!searchFilter && (
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddContactOpen(true)}
                >
                  <UserPlus className="w-4 h-4 mr-1.5" />
                  Add Your First Contact
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Contact Modal */}
      <Modal
        isOpen={isAddContactOpen}
        onClose={() => {
          setIsAddContactOpen(false);
          setAddSearchQuery('');
          setAddSearchResults([]);
        }}
        title="Add New Contact"
        description="Search users by username, email, or name to connect"
      >
        <div className="space-y-4 pt-2">
          <Input
            placeholder="Type username, email, or full name..."
            value={addSearchQuery}
            onChange={(e) => setAddSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-muted-foreground" />}
            autoFocus
          />

          <div className="max-h-72 overflow-y-auto divide-y divide-border/60 -mx-6 px-6">
            {isSearchingUsers ? (
              <div className="py-8 flex justify-center">
                <Spinner size="md" />
              </div>
            ) : addSearchResults.length > 0 ? (
              addSearchResults.map((user) => {
                const isRequested = requestedIds[user.id];
                const isExisting = contacts.some((c) => c.id === user.id);

                return (
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

                    <div>
                      {isExisting ? (
                        <span className="text-xs font-semibold text-muted-foreground px-3 py-1">
                          Connected
                        </span>
                      ) : isRequested ? (
                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-500/10 px-3 py-1.5 rounded-full flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>Sent</span>
                        </span>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => sendRequestMutation.mutate(user.id)}
                          disabled={sendRequestMutation.isPending}
                        >
                          Connect
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-xs text-muted-foreground">
                {addSearchQuery.trim()
                  ? 'No matching users found'
                  : 'Search for someone by their username to connect'}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Safety Number Verification Modal */}
      {selectedSafetyUser && (
        <SafetyNumberModal
          isOpen={!!selectedSafetyUser}
          onClose={() => setSelectedSafetyUser(null)}
          targetUser={selectedSafetyUser}
        />
      )}
    </div>
  );
}
