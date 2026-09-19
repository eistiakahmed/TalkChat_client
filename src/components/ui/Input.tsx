'use client';

import * as React from 'react';
import { cn } from '../../utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

/**
 * Reusable Minimalist Input Component.
 * 
 * Provides crisp borders, accessible focus outlines, error handling,
 * and icon slots for search bars and authentication inputs.
 * 
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || React.useId();

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-medium text-txt-secondary select-none"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center w-full">
          {leftIcon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-muted-foreground">
              {leftIcon}
            </div>
          )}

          <input
            id={inputId}
            ref={ref}
            type={type}
            disabled={disabled}
            aria-invalid={!!error}
            className={cn(
              'w-full h-10 px-3.5 text-sm rounded-xl transition-all duration-200',
              'bg-card/80 text-foreground placeholder:text-muted-foreground/70 border border-border-subtle shadow-xs',
              'focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-card',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error && 'border-danger focus:border-danger focus:ring-danger',
              className
            )}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3.5 flex items-center text-muted-foreground">
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <p className="text-xs text-danger font-medium animate-in fade-in duration-150">
            {error}
          </p>
        )}

        {!error && helperText && (
          <p className="text-xs text-txt-muted">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
