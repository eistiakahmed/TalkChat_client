'use client';

import * as React from 'react';
import { format } from 'date-fns';
import {
  Check,
  CheckCheck,
  Reply,
  Trash2,
  Smile,
  MoreHorizontal,
  FileText,
  Download,
  ExternalLink,
  X,
  Phone,
  PhoneMissed,
  PhoneOff,
  Video,
  VideoOff,
} from 'lucide-react';
import type { Message, MessageReaction, MessageAttachment } from '../../types/message.types';
import { Avatar, Dropdown } from '../ui';
import { cn } from '../../utils/cn';

export interface MessageBubbleProps {
  message: Message;
  isSelf: boolean;
  isGroup?: boolean;
  onReply?: (message: Message) => void;
  onReact?: (messageId: string, emoji: string) => void;
  onDelete?: (messageId: string) => void;
  onCall?: (type: 'AUDIO' | 'VIDEO') => void;
}

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

/**
 * Message Bubble Component.
 * 
 * Supports sent/received distinct styling, quote replies, media attachments,
 * delivery checkmarks (Sent, Delivered, Read), and emoji reaction counters.
 */
export function MessageBubble({
  message,
  isSelf,
  isGroup,
  onReply,
  onReact,
  onDelete,
  onCall,
}: MessageBubbleProps) {
  const [showEmojiBar, setShowEmojiBar] = React.useState(false);
  const [previewImageUrl, setPreviewImageUrl] = React.useState<string | null>(null);

  const formattedTime = React.useMemo(() => {
    try {
      return format(new Date(message.createdAt), 'p'); // e.g. 10:45 AM
    } catch {
      return '';
    }
  }, [message.createdAt]);

  // Check if this message is a Call Log Card (Messenger Call UI)
  if (message.content?.includes('"_type":"CALL_LOG"')) {
    try {
      const callLog = JSON.parse(message.content);
      if (callLog._type === 'CALL_LOG') {
        const isCaller = isSelf;
        const isIncoming = !isCaller;
        const isAudio = callLog.callType === 'AUDIO';
        const isMissed = callLog.status === 'MISSED' || callLog.status === 'CANCELLED';
        const isDeclined = callLog.status === 'REJECTED' || callLog.status === 'BUSY';
        const isEnded = callLog.status === 'ENDED';
        const duration = callLog.duration ?? 0;

        let title = '';
        let subtitle = formattedTime;
        const buttonText = isIncoming ? 'Call back' : 'Call again';

        if (isMissed) {
          title = `Missed ${isAudio ? 'audio' : 'video'} call`;
        } else if (isDeclined) {
          title = `Declined ${isAudio ? 'audio' : 'video'} call`;
        } else if (isEnded) {
          title = `${isAudio ? 'Audio' : 'Video'} call`;
          if (duration > 0) {
            const mins = Math.floor(duration / 60);
            const secs = duration % 60;
            const durText = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
            subtitle = `${durText} • ${formattedTime}`;
          }
        } else {
          title = `${isAudio ? 'Audio' : 'Video'} call`;
        }

        const isRedBadge = isIncoming && isMissed;

        return (
          <div
            className={cn(
              'w-full flex my-1.5',
              isIncoming ? 'justify-start' : 'justify-end'
            )}
          >
            <div className="flex items-end gap-2 max-w-[85%] sm:max-w-[70%]">
              {isIncoming && isGroup && (
                <Avatar
                  src={message.sender?.avatarUrl}
                  name={message.sender?.fullName || message.sender?.username}
                  size="xs"
                  className="mb-1 shrink-0"
                />
              )}

              <div className="bg-[#282A2F] rounded-[18px] p-3 w-[240px] shadow-sm select-none">
                {/* Top Row: Circular Badge + Title & Timestamp */}
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-[38px] h-[38px] rounded-full flex items-center justify-center shrink-0 text-white',
                      isRedBadge
                        ? 'bg-[#FA3E3E]'
                        : isDeclined
                        ? 'bg-amber-500'
                        : isEnded
                        ? 'bg-indigo-600'
                        : 'bg-[#636773]'
                    )}
                  >
                    {isMissed ? (
                      isAudio ? <PhoneMissed className="w-[18px] h-[18px]" /> : <VideoOff className="w-[18px] h-[18px]" />
                    ) : isDeclined ? (
                      <PhoneOff className="w-[18px] h-[18px]" />
                    ) : isAudio ? (
                      <Phone className="w-[18px] h-[18px]" />
                    ) : (
                      <Video className="w-[18px] h-[18px]" />
                    )}
                  </div>

                  <div className="flex flex-col min-w-0 flex-1 text-left">
                    <span className="text-[14.5px] font-bold text-white truncate leading-tight">
                      {title}
                    </span>
                    <span className="text-[12px] text-slate-400 mt-0.5">
                      {subtitle}
                    </span>
                  </div>
                </div>

                {/* Bottom Pill Button */}
                {onCall && (
                  <button
                    type="button"
                    onClick={() => onCall(callLog.callType)}
                    className="w-full mt-2.5 py-2 px-3 bg-[#3D4048] hover:bg-[#484B54] active:scale-[0.98] rounded-xl text-[13.5px] font-semibold text-white text-center transition-all cursor-pointer"
                  >
                    {buttonText}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      }
    } catch {}
  }

  // Helper to reliably detect image attachments across formats, MIME types and file extensions
  const isImageAttachment = React.useCallback((att: MessageAttachment) => {
    if (att.fileType === 'IMAGE' || message.type === 'IMAGE') return true;
    if (att.mimeType?.startsWith('image/')) return true;
    const name = `${att.fileName || ''} ${att.fileUrl || ''}`.toLowerCase();
    return /\.(png|jpe?g|gif|webp|svg|bmp|avif)(\?.*)?$/i.test(name);
  }, [message.type]);

  // Helper to detect video attachments
  const isVideoAttachment = React.useCallback((att: MessageAttachment) => {
    if (att.fileType === 'VIDEO' || message.type === 'VIDEO') return true;
    if (att.mimeType?.startsWith('video/')) return true;
    const name = `${att.fileName || ''} ${att.fileUrl || ''}`.toLowerCase();
    return /\.(mp4|webm|ogg|mov|mkv)(\?.*)?$/i.test(name);
  }, [message.type]);

  // Helper to detect audio attachments
  const isAudioAttachment = React.useCallback((att: MessageAttachment) => {
    if (att.fileType === 'AUDIO' || message.type === 'AUDIO') return true;
    if (att.mimeType?.startsWith('audio/')) return true;
    const name = `${att.fileName || ''} ${att.fileUrl || ''}`.toLowerCase();
    return /\.(mp3|wav|ogg|m4a|aac|flac)(\?.*)?$/i.test(name);
  }, [message.type]);

  // Derive delivery receipt status for self-sent messages
  const receiptStatus = React.useMemo(() => {
    if (!isSelf || !message.receipts || message.receipts.length === 0) {
      return 'SENT';
    }
    const hasRead = message.receipts.some((r) => r.status === 'READ');
    if (hasRead) return 'READ';
    const hasDelivered = message.receipts.some((r) => r.status === 'DELIVERED');
    if (hasDelivered) return 'DELIVERED';
    return 'SENT';
  }, [isSelf, message.receipts]);

  // Group reactions by emoji
  const groupedReactions = React.useMemo(() => {
    const map = new Map<string, number>();
    message.reactions?.forEach((r) => {
      map.set(r.emoji, (map.get(r.emoji) || 0) + 1);
    });
    return Array.from(map.entries()).map(([emoji, count]) => ({ emoji, count }));
  }, [message.reactions]);


  const menuItems = [
    {
      id: 'reply',
      label: 'Reply',
      icon: <Reply className="w-4 h-4" />,
      onClick: () => onReply?.(message),
    },
    ...(isSelf
      ? [
          {
            id: 'delete',
            label: 'Delete for everyone',
            icon: <Trash2 className="w-4 h-4" />,
            danger: true,
            onClick: () => onDelete?.(message.id),
          },
        ]
      : []),
  ];

  return (
    <div
      className={cn(
        'group relative flex flex-col my-1.5',
        isSelf ? 'items-end' : 'items-start'
      )}
      onMouseLeave={() => setShowEmojiBar(false)}
    >
      <div
        className={cn(
          'flex items-end gap-2 max-w-[85%] sm:max-w-[70%]',
          isSelf && 'flex-row-reverse'
        )}
      >
        {/* Other participant avatar in groups */}
        {!isSelf && isGroup && (
          <Avatar
            src={message.sender?.avatarUrl}
            name={message.sender?.fullName || message.sender?.username}
            size="xs"
            className="mb-5 shrink-0"
          />
        )}

        {/* Message Bubble + Timestamp Column */}
        <div className={cn('flex flex-col', isSelf ? 'items-end' : 'items-start')}>
          {/* Message Bubble Box */}
          <div
            className={cn(
              'relative select-text transition-all',
              message.attachments && message.attachments.length > 0 && !message.content?.trim()
                ? 'p-1.5'
                : 'px-4 py-2.5',
              isSelf
                ? 'bg-blue-600 text-white rounded-2xl rounded-tr-xs shadow-md shadow-blue-600/20'
                : 'bg-[#181920] border border-white/[0.1] text-white rounded-2xl rounded-tl-xs shadow-sm'
            )}
          >
            {/* Quoted Reply Parent Context */}
            {message.parentMessage && (
              <div
                className={cn(
                  'mb-2 px-2.5 py-1.5 rounded-lg text-xs border-l-2 select-none',
                  isSelf
                    ? 'bg-black/25 border-white text-white'
                    : 'bg-[#101116] border-blue-500 text-slate-300'
                )}
              >
                <span className="font-bold block text-[10px] text-blue-400">
                  {message.parentMessage.sender?.fullName ||
                    message.parentMessage.sender?.username ||
                    'Message'}
                </span>
                <p className="truncate line-clamp-1 opacity-90">
                  {message.parentMessage.content || 'Attachment'}
                </p>
              </div>
            )}

            {/* Media Attachments */}
            {message.attachments && message.attachments.length > 0 && (
              <div className={cn('space-y-2', message.content?.trim() && 'mb-2')}>
                {message.attachments.map((att) => (
                  <div key={att.id} className="rounded-xl overflow-hidden">
                    {isImageAttachment(att) ? (
                      <div className="relative group/media overflow-hidden rounded-xl bg-black/25">
                        <img
                          src={att.fileUrl}
                          alt={att.fileName || 'Attached Image'}
                          loading="lazy"
                          onClick={() => setPreviewImageUrl(att.fileUrl)}
                          className="max-h-80 w-auto min-w-[160px] max-w-full object-cover rounded-xl cursor-pointer hover:opacity-95 transition-opacity"
                        />
                        <button
                          type="button"
                          onClick={() => setPreviewImageUrl(att.fileUrl)}
                          className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/60 text-white/90 opacity-0 group-hover/media:opacity-100 transition-opacity backdrop-blur-xs hover:bg-black/80 cursor-pointer"
                          aria-label="View Fullscreen"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : isVideoAttachment(att) ? (
                      <div className="rounded-xl overflow-hidden bg-black/40">
                        <video
                          controls
                          preload="metadata"
                          src={att.fileUrl}
                          className="max-h-80 w-full rounded-xl"
                        />
                      </div>
                    ) : isAudioAttachment(att) ? (
                      <audio controls src={att.fileUrl} className="w-full h-10 rounded-lg" />
                    ) : (
                      <a
                        href={att.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={att.fileName || 'attachment'}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-xl transition-all border select-none',
                          isSelf
                            ? 'bg-black/20 hover:bg-black/30 border-white/20 text-white'
                            : 'bg-[#15161c] hover:bg-[#1a1c24] border-white/10 text-slate-200'
                        )}
                      >
                        <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold truncate leading-tight">
                            {att.fileName || 'Download attachment'}
                          </p>
                          {att.fileSize ? (
                            <span className="text-[10.5px] opacity-75">
                              {(att.fileSize / 1024).toFixed(0)} KB
                            </span>
                          ) : null}
                        </div>
                        <Download className="w-4 h-4 opacity-80 hover:opacity-100 shrink-0 ml-1" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Text Content */}
            {message.isDeleted ? (
              <p className="italic text-xs opacity-60">This message was deleted</p>
            ) : message.content?.trim() ? (
              <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap break-words font-normal text-white px-1">
                {message.content}
              </p>
            ) : null}
          </div>

          {/* Timestamp and Receipt Indicators BELOW bubble box */}
          <div
            className={cn(
              'flex items-center gap-1.5 mt-1 text-[11px] text-slate-400 select-none px-1',
              isSelf ? 'justify-end' : 'justify-start'
            )}
          >
            {message.isEdited && <span className="opacity-80">(edited)</span>}
            <span>{formattedTime}</span>

            {isSelf && !message.isDeleted && (
              <span aria-label={`Status: ${receiptStatus}`}>
                {receiptStatus === 'SENT' ? (
                  <Check className="w-3.5 h-3.5 text-slate-400" />
                ) : receiptStatus === 'DELIVERED' ? (
                  <CheckCheck className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <CheckCheck className="w-3.5 h-3.5 text-blue-400 font-bold" />
                )}
              </span>
            )}
          </div>
        </div>

        {/* Hover Quick Action Buttons (Reply, React, Options) */}
        {!message.isDeleted && (
          <div
            className={cn(
              'opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 shrink-0 mb-5',
              isSelf ? 'flex-row-reverse' : 'flex-row'
            )}
          >
            <button
              type="button"
              onClick={() => onReply?.(message)}
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
              aria-label="Reply"
            >
              <Reply className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setShowEmojiBar(!showEmojiBar)}
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
              aria-label="React"
            >
              <Smile className="w-3.5 h-3.5" />
            </button>

            <Dropdown
              trigger={
                <button
                  type="button"
                  className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
                  aria-label="More Options"
                >
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </button>
              }
              items={menuItems}
              align={isSelf ? 'right' : 'left'}
            />
          </div>
        )}
      </div>

      {/* Quick Reaction Emoji Popover Bar */}
      {showEmojiBar && (
        <div
          className={cn(
            'flex items-center gap-1.5 p-1.5 bg-[#15161c]/95 backdrop-blur-md border border-white/[0.12] shadow-xl rounded-full mt-1.5 z-20 animate-fadeIn',
            isSelf ? 'mr-2' : 'ml-2'
          )}
        >
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                onReact?.(message.id, emoji);
                setShowEmojiBar(false);
              }}
              className="text-base p-1 hover:scale-125 transition-transform cursor-pointer"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Rendered Reaction Pills */}
      {groupedReactions.length > 0 && (
        <div
          className={cn(
            'flex items-center gap-1 mt-1 z-10',
            isSelf ? 'mr-1' : 'ml-1'
          )}
        >
          {groupedReactions.map(({ emoji, count }) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onReact?.(message.id, emoji)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#15161c] border border-white/[0.1] text-xs font-medium shadow-xs hover:bg-[#1f2028] transition-colors cursor-pointer"
            >
              <span>{emoji}</span>
              {count > 1 && <span className="text-blue-400 text-[11px] font-bold">{count}</span>}
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Image Lightbox Modal */}
      {previewImageUrl && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setPreviewImageUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/90 backdrop-blur-md animate-fadeIn cursor-zoom-out"
        >
          <div
            className="relative max-w-5xl max-h-[90vh] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute -top-10 right-0 flex items-center gap-3 z-10">
              <a
                href={previewImageUrl}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
                aria-label="Download image"
              >
                <Download className="w-4 h-4" />
              </a>
              <button
                type="button"
                onClick={() => setPreviewImageUrl(null)}
                className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
                aria-label="Close preview"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <img
              src={previewImageUrl}
              alt="Full Preview"
              className="max-h-[85vh] max-w-full rounded-xl object-contain shadow-2xl border border-white/10 cursor-default"
            />
          </div>
        </div>
      )}
    </div>
  );
}
