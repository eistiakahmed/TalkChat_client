'use client';

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  SquarePen,
  Search,
  X,
  MessageSquareOff,
  Filter,
} from 'lucide-react';
import { Button, Input, Tabs, Spinner } from '../ui';
import { ConversationItem } from './ConversationItem';
import { NewChatModal } from './NewChatModal';
import { chatService } from '../../services/chat.service';
import { useChatStore, type ChatFilterTab } from '../../stores/chat.store';
import type { Conversation, ConversationType } from '../../types/chat.types';
import { cn } from '../../utils/cn';

/**
 * Conversation Sidebar Component.
 * 
 * 380px fixed width sidebar managing conversation discovery,
 * real-time search filtering, segmented category tabs,
 * and direct message / group initialization.
 * 
 * @see https://tanstack.com/query/v5/docs/framework/react/guides/queries
 */
export function ConversationSidebar() {
  const router = useRouter();
  const params = useParams();
  const currentChatId = (params?.id as string) || null;
  const queryClient = useQueryClient();

  const {
    filterTab,
    setFilterTab,
    searchQuery,
    setSearchQuery,
    setNewChatModalOpen,
    setActiveConversation,
  } = useChatStore();

  // Map filterTab to ConversationType API filter
  const apiType: ConversationType | undefined =
    filterTab === 'direct' ? 'DIRECT' : filterTab === 'groups' ? 'GROUP' : undefined;

  const {
    data: conversations = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['conversations', apiType],
    queryFn: () => chatService.getConversations({ type: apiType }),
    refetchInterval: 10000, // Background polling fallback
  });

  const rawConversations: Conversation[] = Array.isArray(conversations) ? conversations : [];

  // Local filtering for Search Query and 'unread' Tab
  const filteredConversations = React.useMemo(() => {
    let list = rawConversations;

    if (filterTab === 'unread') {
      list = list.filter((c) => (c.userSettings?.unreadCount || 0) > 0);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((conv) => {
        const titleMatch = conv.title?.toLowerCase().includes(q);
        const memberMatch = conv.members?.some((m) =>
          m.user.fullName?.toLowerCase().includes(q) ||
          m.user.username.toLowerCase().includes(q)
        );
        const lastMsgMatch = conv.lastMessage?.content?.toLowerCase().includes(q);
        return titleMatch || memberMatch || lastMsgMatch;
      });
    }

    return list;
  }, [rawConversations, filterTab, searchQuery]);

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'direct', label: 'Direct' },
    { id: 'groups', label: 'Groups' },
    {
      id: 'unread',
      label: 'Unread',
      badge: rawConversations.filter((c) => (c.userSettings?.unreadCount || 0) > 0).length || undefined,
    },
  ];

  const handleSelectConversation = (conversation: Conversation) => {
    setActiveConversation(conversation);

    // Optimistically zero out unread counter for instant feedback (0ms latency)
    queryClient.setQueriesData<any>(
      { queryKey: ['conversations'] },
      (old: any) => {
        if (!old) return old;
        const resetUnread = (c: any) => {
          if (c.id !== conversation.id) return c;
          return {
            ...c,
            userSettings: {
              ...c.userSettings,
              unreadCount: 0,
            },
          };
        };
        if (Array.isArray(old)) return old.map(resetUnread);
        if (old.items && Array.isArray(old.items)) {
          return { ...old, items: old.items.map(resetUnread) };
        }
        return old;
      }
    );

    // Persist to backend
    chatService.markAsRead(conversation.id).catch(() => {});

    router.push(`/chat/${conversation.id}`);
  };

  return (
    <aside
      aria-label="Conversations Sidebar"
      className="w-full md:w-[360px] lg:w-[380px] h-screen border-r border-white/[0.08] bg-[#0f1015] flex flex-col shrink-0 select-none overflow-hidden"
    >
      {/* Sidebar Header */}
      <div className="p-4 pb-3 space-y-3.5 border-b border-white/[0.06]">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Chats
          </h1>
          <button
            type="button"
            onClick={() => setNewChatModalOpen(true)}
            aria-label="New Conversation"
            className="w-9 h-9 rounded-xl bg-white/[0.05] hover:bg-blue-600/20 text-white hover:text-blue-400 border border-white/[0.08] hover:border-blue-500/30 transition-all flex items-center justify-center cursor-pointer shadow-xs active:scale-95"
          >
            <SquarePen className="w-4 h-4" />
          </button>
        </div>

        {/* Real-Time Search Bar */}
        <Input
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search className="w-4 h-4 text-muted-foreground" />}
          rightIcon={
            searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="hover:text-foreground text-muted-foreground transition-colors p-1"
                aria-label="Clear Search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : null
          }
        />

        {/* Category Segmented Tabs */}
        <Tabs
          tabs={tabs}
          activeTab={filterTab}
          onChange={(tab) => setFilterTab(tab as ChatFilterTab)}
          size="sm"
        />
      </div>

      {/* Conversations Scrollable List */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {isLoading ? (
          <div className="space-y-2 p-2">
            {[...Array(6)].map((_, i) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholder
                key={i}
                className="flex items-center gap-3 p-3 rounded-xl animate-pulse"
              >
                <div className="w-10 h-10 rounded-full bg-muted shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-muted rounded w-3/5" />
                  <div className="h-3 bg-muted rounded w-4/5" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="py-12 text-center px-4 space-y-3">
            <p className="text-sm text-danger font-medium">
              Failed to load conversations
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Try Again
            </Button>
          </div>
        ) : filteredConversations.length > 0 ? (
          filteredConversations.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isActive={currentChatId === conv.id}
              onClick={() => handleSelectConversation(conv)}
            />
          ))
        ) : (
          <div className="py-16 text-center px-6 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-muted/60 border border-border-subtle flex items-center justify-center mx-auto text-muted-foreground">
              <MessageSquareOff className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                {searchQuery ? 'No matching chats' : 'No conversations yet'}
              </p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                {searchQuery
                  ? 'Try searching with a different name or username.'
                  : 'Start a direct chat or create a group to begin messaging.'}
              </p>
            </div>
            {!searchQuery && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setNewChatModalOpen(true)}
                className="mt-2"
              >
                Start Chatting
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Modal Dialog for New Chat / Group Creation */}
      <NewChatModal />
    </aside>
  );
}
