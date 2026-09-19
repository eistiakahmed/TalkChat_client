'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';

/**
 * Reusable Button Component variants using class-variance-authority.
 * 
 * Supports primary, secondary, outline, ghost, and danger aesthetics,
 * adhering to the Clean Minimalist Dual-Theme design system.
 * 
 * @see https://cva.style/docs
 */
export const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer',
  {
    variants: {
      variant: {
        primary:
          'bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-md shadow-blue-600/25 active:scale-[0.97]',
        secondary:
          'bg-card/90 text-white hover:bg-card-hover border border-border-subtle shadow-xs active:scale-[0.97]',
        outline:
          'border border-border-strong text-white hover:bg-white/[0.06] active:scale-[0.97]',
        ghost:
          'text-slate-300 hover:text-white hover:bg-white/[0.06] active:scale-[0.97]',
        danger:
          'bg-danger text-white hover:bg-red-600 shadow-sm shadow-red-500/20 active:scale-[0.97]',
      },
      size: {
        sm: 'h-8 px-3 text-xs gap-1.5',
        md: 'h-10 px-4 text-sm gap-2',
        lg: 'h-12 px-6 text-base gap-2.5',
        icon: 'h-10 w-10 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        {children}
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
