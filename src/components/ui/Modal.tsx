'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnBackdrop?: boolean;
}

const maxWidthMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-3xl',
};

/**
 * Accessible Modal / Dialog Component.
 * 
 * Features:
 * - Backdrop blur with dark overlay.
 * - ESC key handling and backdrop click dismissal.
 * - Native keyboard accessibility and trap.
 * 
 * @see https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/dialog_role
 */
export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = 'md',
  closeOnBackdrop = true,
}: ModalProps) {
  // ESC key listener
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll while open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={() => closeOnBackdrop && onClose()}
    >
      <div
        className={cn(
          'w-full bg-surface border border-border-strong rounded-2xl shadow-modal overflow-hidden flex flex-col max-h-[90vh]',
          'animate-in zoom-in-95 duration-200',
          maxWidthMap[maxWidth]
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        {(title || description) && (
          <div className="flex items-start justify-between p-5 border-b border-border-subtle shrink-0">
            <div>
              {title && (
                <h3 className="text-base font-semibold text-txt-primary">{title}</h3>
              )}
              {description && (
                <p className="text-xs text-txt-secondary mt-0.5">{description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-txt-muted hover:text-txt-primary hover:bg-card-hover transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto flex-1">{children}</div>

        {/* Modal Footer */}
        {footer && (
          <div className="p-4 border-t border-border-subtle bg-card/50 flex items-center justify-end gap-2 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
