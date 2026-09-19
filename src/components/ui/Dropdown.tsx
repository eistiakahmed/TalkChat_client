'use client';

import * as React from 'react';
import { cn } from '../../utils/cn';

export interface DropdownItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  isDanger?: boolean;
  danger?: boolean;
  disabled?: boolean;
  isDivider?: boolean;
}

export interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
  direction?: 'down' | 'up' | 'right';
  className?: string;
}

/**
 * Reusable Accessible Dropdown Popover Component.
 * 
 * Provides contextual actions (Edit, Mute, Delete, Block) with outside click dismissal
 * and intelligent upward/downward viewport overflow protection.
 * 
 * @see https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/menu_role
 */
export function Dropdown({
  trigger,
  items,
  align = 'right',
  direction,
  className,
}: DropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [autoDirection, setAutoDirection] = React.useState<'down' | 'up'>('down');
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Auto-detect if opening downwards would overflow the screen
  React.useEffect(() => {
    if (!direction && isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow < 250 && rect.top > 250) {
        setAutoDirection('up');
      } else {
        setAutoDirection('down');
      }
    }
  }, [isOpen, direction]);

  // Click outside to dismiss
  React.useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const finalDirection = direction || autoDirection;

  return (
    <div ref={containerRef} className={cn('relative inline-block', className)}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen((prev) => !prev);
          }
        }}
        className="cursor-pointer select-none"
      >
        {trigger}
      </div>

      {isOpen && (
        <div
          role="menu"
          className={cn(
            'absolute z-50 w-52 rounded-2xl bg-[#15161c] border border-white/[0.12] shadow-2xl p-1.5 flex flex-col gap-0.5',
            'animate-in fade-in zoom-in-95 duration-150',
            finalDirection === 'up' && 'bottom-full mb-2.5',
            finalDirection === 'down' && 'top-full mt-1.5',
            finalDirection === 'right' && 'left-full bottom-0 ml-3',
            finalDirection !== 'right' && (align === 'right' ? 'right-0' : 'left-0')
          )}
        >
          {items.map((item) => {
            if (item.isDivider) {
              return (
                <div
                  key={item.id}
                  className="my-1 border-t border-white/[0.08]"
                />
              );
            }

            const isDangerous = item.isDanger || item.danger;

            return (
              <button
                key={item.id}
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  item.onClick();
                  setIsOpen(false);
                }}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl text-left transition-colors select-none cursor-pointer',
                  'hover:bg-white/[0.08] text-slate-200 hover:text-white',
                  isDangerous && 'text-rose-400 hover:text-rose-300 hover:bg-rose-500/15',
                  item.disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                {item.icon && <span className="w-4 h-4 shrink-0">{item.icon}</span>}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
