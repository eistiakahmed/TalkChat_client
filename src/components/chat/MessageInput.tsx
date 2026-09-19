'use client';

import * as React from 'react';
import {
  Send,
  Paperclip,
  Smile,
  X,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';
import { Button } from '../ui';
import { socketClient } from '../../services/socket.client';
import type { Message } from '../../types/message.types';

export interface MessageInputProps {
  conversationId: string;
  onSendMessage: (content: string, file?: File, parentMessageId?: string) => Promise<void>;
  replyingTo?: Message | null;
  onCancelReply?: () => void;
  disabled?: boolean;
}

const COMMON_EMOJIS = [
  '😀', '😂', '😍', '🎉', '👍', '🔥', '❤️', '🙌',
  '😎', '🤔', '👏', '🚀', '💯', '✨', '👋', '🥳',
];

/**
 * Real-Time Message Input Composer Component.
 * 
 * Manages auto-expanding textarea, file attachments, quoting replies,
 * emoji insertion, and debounced typing indicator emissions.
 */
export function MessageInput({
  conversationId,
  onSendMessage,
  replyingTo,
  onCancelReply,
  disabled,
}: MessageInputProps) {
  const [content, setContent] = React.useState('');
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false);
  const [isSending, setIsSending] = React.useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Handle typing status debounce
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);

    // Emit typing indicator
    socketClient.startTyping(conversationId);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socketClient.stopTyping(conversationId);
    }, 2000);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSend = async () => {
    const trimmed = content.trim();
    if ((!trimmed && !selectedFile) || isSending || disabled) return;

    setIsSending(true);
    socketClient.stopTyping(conversationId);

    try {
      await onSendMessage(
        trimmed,
        selectedFile || undefined,
        replyingTo?.id
      );

      setContent('');
      setSelectedFile(null);
      onCancelReply?.();
      setShowEmojiPicker(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const insertEmoji = (emoji: string) => {
    setContent((prev) => prev + emoji);
    textareaRef.current?.focus();
  };

  return (
    <div className="border-t border-white/[0.08] bg-[#0f1015]/95 backdrop-blur-xl px-4 py-3 select-none flex flex-col gap-2 shrink-0 shadow-lg">
      {/* 1. Reply Context Banner */}
      {replyingTo && (
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#15161c] border border-white/[0.08] border-l-2 border-l-blue-500 text-xs shadow-xs animate-fadeIn">
          <div className="pl-2 min-w-0">
            <span className="font-bold text-blue-400 block text-[11px]">
              Replying to {replyingTo.sender?.fullName || replyingTo.sender?.username || 'user'}
            </span>
            <p className="text-slate-300 truncate">
              {replyingTo.content || 'Attachment'}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
            aria-label="Cancel reply"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. File Preview Chip */}
      {selectedFile && (
        <div className="flex items-center justify-between p-2 rounded-xl bg-blue-600/15 border border-blue-500/30 text-xs animate-fadeIn">
          <div className="flex items-center gap-2 truncate">
            {selectedFile.type.startsWith('image/') ? (
              <ImageIcon className="w-4 h-4 text-blue-400 shrink-0" />
            ) : (
              <FileText className="w-4 h-4 text-blue-400 shrink-0" />
            )}
            <span className="truncate font-medium text-slate-200">
              {selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedFile(null);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
            className="p-1 rounded-full hover:bg-blue-500/25 text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Remove attachment"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 3. Emoji Picker Popover Drawer */}
      {showEmojiPicker && (
        <div className="p-3 bg-[#15161c]/95 backdrop-blur-md border border-white/[0.12] rounded-2xl shadow-xl flex flex-wrap gap-2 animate-fadeIn max-w-sm">
          {COMMON_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => insertEmoji(emoji)}
              className="text-lg p-1.5 rounded-lg hover:bg-white/[0.08] transition-transform hover:scale-125 cursor-pointer"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* 4. Composer Input Row */}
      <div className="flex items-end gap-2">
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
        />

        {/* Attachment Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Attach File"
          className="w-10 h-10 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] transition-all flex items-center justify-center shrink-0 mb-0.5 cursor-pointer"
        >
          <Paperclip className="w-4 h-4" />
        </button>

        {/* Text Area Container */}
        <div className="flex-1 relative bg-[#15161c] rounded-2xl border border-white/[0.1] focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
          <textarea
            ref={textareaRef}
            rows={1}
            value={content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (Press Enter to send)"
            disabled={disabled || isSending}
            className="w-full max-h-32 min-h-[42px] px-3.5 py-2.5 pr-10 bg-transparent text-sm text-white placeholder:text-slate-500 resize-none focus:outline-none"
          />

          {/* Emoji Trigger */}
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="absolute right-3 bottom-2.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Emoji picker"
          >
            <Smile className="w-4 h-4" />
          </button>
        </div>

        {/* Send Button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={(!content.trim() && !selectedFile) || isSending || disabled}
          aria-label="Send Message"
          className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/25 flex items-center justify-center shrink-0 mb-0.5 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer active:scale-95 group"
        >
          <Send className="w-4 h-4 text-white transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
}
