import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

/**
 * Pill Badge component variants using CVA.
 */
export const badgeVariants = cva(
  'inline-flex items-center justify-center font-semibold rounded-full select-none transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-card text-txt-secondary border border-border-subtle',
        primary: 'bg-accent text-accent-fg shadow-xs',
        success: 'bg-success/15 text-success border border-success/30',
        warning: 'bg-warning/15 text-warning border border-warning/30',
        danger: 'bg-danger text-white shadow-xs',
        outline: 'border border-border-strong text-txt-primary',
      },
      size: {
        sm: 'text-[10px] h-5 min-w-5 px-1.5 leading-none',
        md: 'text-xs h-6 min-w-6 px-2.5 leading-none',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'sm',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  count?: number;
  maxCount?: number;
}

/**
 * Reusable Minimalist Badge Component.
 * 
 * Used for unread message counters, member roles (Admin/Mod), and status labels.
 * 
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/span
 */
export function Badge({
  className,
  variant,
  size,
  count,
  maxCount = 99,
  children,
  ...props
}: BadgeProps) {
  let content = children;
  if (typeof count === 'number') {
    content = count > maxCount ? `${maxCount}+` : count.toString();
  }

  return (
    <span className={cn(badgeVariants({ variant, size, className }))} {...props}>
      {content}
    </span>
  );
}
