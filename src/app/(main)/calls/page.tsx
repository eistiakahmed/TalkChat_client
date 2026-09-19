'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Phone,
  Video,
  PhoneCall,
  PhoneMissed,
  PhoneOutgoing,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Clock,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button, Avatar, Spinner } from '../../../components/ui';
import { callService } from '../../../services/call.service';
import { useAuthStore } from '../../../stores/auth.store';
import { useWebRTC } from '../../../hooks/useWebRTC';
import { NewCallModal } from '../../../components/call/NewCallModal';
import type { CallLog } from '../../../types/call.types';
import { cn } from '../../../utils/cn';

function formatDuration(seconds?: number | null): string {
  if (!seconds || seconds <= 0) return '';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
}

/**
 * WebRTC Calling History and Roster Page.
 * 
 * Provides an overview of incoming, outgoing, and missed encrypted audio/video
 * calls with one-tap callback triggers.
 * 
 * @see https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API
 */
export default function CallsPage() {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const { startCall } = useWebRTC();

  const [activeTab, setActiveTab] = React.useState<'ALL' | 'MISSED'>('ALL');
  const [isNewCallOpen, setIsNewCallOpen] = React.useState(false);

  // Fetch call history
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['callsHistory'],
    queryFn: () => callService.getCallHistory({ limit: 50 }),
    refetchInterval: 10000, // Poll every 10s for new call logs
  });

  const calls = data?.calls || [];

  const filteredCalls = React.useMemo(() => {
    if (activeTab === 'MISSED') {
      return calls.filter(
        (c) =>
          c.receiverId === currentUserId &&
          (c.status === 'MISSED' || c.status === 'REJECTED' || c.status === 'BUSY')
      );
    }
    return calls;
  }, [calls, activeTab, currentUserId]);

  return (
    <div className="flex-1 h-full flex flex-col bg-background select-none overflow-y-auto">
      {/* 1. Header */}
      <header className="p-6 border-b border-border bg-card/60 backdrop-blur-md flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-600">
            <Phone className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Calls</h1>
            <p className="text-xs text-muted-foreground">
              End-to-end encrypted audio & video calling
            </p>
          </div>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsNewCallOpen(true)}
        >
          <Plus className="w-4 h-4 mr-1.5" />
          New Call
        </Button>
      </header>

      {/* 2. Main Content */}
      <div className="max-w-4xl w-full mx-auto p-6 space-y-6">
        {/* Filter Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-border pb-3">
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
            All Calls ({calls.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('MISSED')}
            className={cn(
              'px-4 py-1.5 text-xs font-semibold rounded-full transition-all',
              activeTab === 'MISSED'
                ? 'bg-danger text-white shadow-sm shadow-danger/20'
                : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
            )}
          >
            Missed
          </button>
        </div>

        {/* Call Logs List */}
        {isLoading ? (
          <div className="py-20 flex justify-center">
            <Spinner size="lg" />
          </div>
        ) : filteredCalls.length > 0 ? (
          <div className="rounded-2xl border border-border bg-card/40 divide-y divide-border/60 overflow-hidden shadow-xs">
            {filteredCalls.map((call: CallLog) => {
              const isOutgoing = call.callerId === currentUserId;
              const peer = isOutgoing ? call.receiver : call.caller;
              const isMissed =
                !isOutgoing &&
                (call.status === 'MISSED' ||
                  call.status === 'REJECTED' ||
                  call.status === 'BUSY');
              const isVideo = call.type === 'VIDEO';
              const durationStr = formatDuration(call.duration);

              return (
                <div
                  key={call.id}
                  className="p-4 flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <Avatar
                      src={peer.avatarUrl}
                      name={peer.fullName || peer.username}
                      size="md"
                    />

                    <div className="min-w-0">
                      <h3
                        className={cn(
                          'text-sm font-semibold truncate',
                          isMissed ? 'text-danger' : 'text-foreground'
                        )}
                      >
                        {peer.fullName || peer.username}
                      </h3>

                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-0.5">
                        {/* Direction Arrow */}
                        {isOutgoing ? (
                          <ArrowUpRight className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                        ) : isMissed ? (
                          <ArrowDownLeft className="w-3.5 h-3.5 text-danger shrink-0" />
                        ) : (
                          <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        )}

                        {/* Call Type Indicator */}
                        <span className="capitalize">
                          {isOutgoing ? 'Outgoing' : isMissed ? 'Missed' : 'Incoming'}
                        </span>

                        <span>•</span>

                        {/* Timestamp */}
                        <span>
                          {formatDistanceToNow(new Date(call.createdAt), {
                            addSuffix: true,
                          })}
                        </span>

                        {durationStr && (
                          <>
                            <span>•</span>
                            <span className="font-medium">{durationStr}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Callback Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        startCall(peer, 'AUDIO', call.conversationId || undefined)
                      }
                      className="h-9 w-9 text-brand-600 hover:bg-brand-500/10"
                      aria-label={`Call ${peer.fullName || peer.username}`}
                    >
                      <Phone className="w-4 h-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        startCall(peer, 'VIDEO', call.conversationId || undefined)
                      }
                      className="h-9 w-9 text-brand-600 hover:bg-brand-500/10"
                      aria-label={`Video call ${peer.fullName || peer.username}`}
                    >
                      <Video className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 p-8 rounded-2xl bg-card/40 border border-border space-y-3">
            <div className="w-12 h-12 rounded-full bg-brand-500/10 text-brand-600 mx-auto flex items-center justify-center">
              <PhoneCall className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-foreground">
              {activeTab === 'MISSED' ? 'No missed calls' : 'No call history yet'}
            </p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {activeTab === 'MISSED'
                ? 'You have answered all incoming calls.'
                : 'Calls you make and receive will be listed here with encrypted peer-to-peer security.'}
            </p>
            {activeTab === 'ALL' && (
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsNewCallOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Make your first call
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* New Call Contact Picker Modal */}
      <NewCallModal
        isOpen={isNewCallOpen}
        onClose={() => setIsNewCallOpen(false)}
      />
    </div>
  );
}
