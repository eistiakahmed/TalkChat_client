'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

/**
 * Avatar size variants using CVA.
 */
const avatarVariants = cva(
  'relative inline-flex items-center justify-center shrink-0 rounded-full select-none overflow-hidden font-semibold uppercase transition-transform',
  {
    variants: {
      size: {
        xs: 'w-6 h-6 text-[10px]',
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-12 h-12 text-base',
        xl: 'w-16 h-16 text-lg',
        '2xl': 'w-24 h-24 text-2xl',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

const statusBadgeVariants = cva(
  'absolute bottom-0 right-0 rounded-full ring-2 ring-background transition-colors',
  {
    variants: {
      size: {
        xs: 'w-1.5 h-1.5',
        sm: 'w-2.5 h-2.5',
        md: 'w-3 h-3',
        lg: 'w-3.5 h-3.5',
        xl: 'w-4 h-4',
        '2xl': 'w-6 h-6',
      },
      status: {
        online: 'bg-emerald-500 shadow-xs shadow-emerald-500/50',
        offline: 'bg-zinc-500',
        busy: 'bg-rose-500',
        away: 'bg-amber-500',
      },
    },
    defaultVariants: {
      size: 'md',
      status: 'offline',
    },
  }
);

export interface AvatarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
  src?: string | null;
  alt?: string;
  name?: string;
  icon?: React.ReactNode;
  isOnline?: boolean;
  status?: 'online' | 'offline' | 'busy' | 'away';
  hasStory?: boolean;
  storyViewed?: boolean;
}

/**
 * Reusable Avatar Component.
 * 
 * Displays user profile picture with graceful fallback to two-letter initials or custom icon.
 * Supports online presence status indicators and ephemeral story rings.
 * 
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img
 */
export function Avatar({
  src,
  alt,
  name = 'User',
  icon,
  size = 'md',
  isOnline,
  status,
  hasStory = false,
  storyViewed = false,
  className,
  ...props
}: AvatarProps) {
  const [imageError, setImageError] = React.useState(false);

  // Compute initials: "Alice Walker" -> "AW"
  const initials = React.useMemo(() => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return (name.slice(0, 2) || 'U').toUpperCase();
  }, [name]);

  // Derive status
  const currentStatus = status || (isOnline ? 'online' : undefined);

  return (
    <div className="relative inline-block shrink-0">
      {/* Optional Story Ring Wrapper */}
      <div
        className={cn(
          'p-0.5 rounded-full transition-all',
          hasStory &&
            !storyViewed &&
            'bg-gradient-to-tr from-blue-600 via-blue-500 to-sky-400 shadow-xs',
          hasStory && storyViewed && 'bg-border-strong'
        )}
      >
        <div
          className={cn(
            avatarVariants({ size }),
            'bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 text-slate-200 shadow-xs',
            hasStory && 'border-2 border-surface',
            className
          )}
          {...props}
        >
          {src && !imageError ? (
            <img
              src={src}
              alt={alt || name}
              onError={() => setImageError(true)}
              className="w-full h-full object-cover"
            />
          ) : icon ? (
            <span className="flex items-center justify-center text-slate-400">
              {icon}
            </span>
          ) : (
            <span className="font-semibold tracking-wider text-slate-200">
              {initials}
            </span>
          )}
        </div>
      </div>

      {/* Online Status Dot Indicator */}
      {currentStatus && (
        <span
          className={cn(statusBadgeVariants({ size, status: currentStatus }))}
          aria-label={`Status: ${currentStatus}`}
        />
      )}
    </div>
  );
}
