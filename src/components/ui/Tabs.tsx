'use client';

import { cn } from '../../utils/cn';

export interface TabOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number | string;
}

export interface TabsProps {
  tabs: TabOption[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
  size?: 'sm' | 'md';
}

/**
 * Reusable Minimalist Segmented Tabs Switcher Component.
 * 
 * Used for switching between Direct/Group chats, Contacts, and Call categories.
 * 
 * @see https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/tab_role
 */
export function Tabs({
  tabs,
  activeTab,
  onChange,
  className,
  size = 'md',
}: TabsProps) {
  return (
    <div
      role="tablist"
      className={cn(
        'flex items-center p-1 rounded-xl bg-card/70 backdrop-blur-md border border-border-subtle gap-1 w-full select-none',
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 font-medium rounded-lg transition-all duration-200 cursor-pointer',
              size === 'sm' ? 'py-1.5 text-xs' : 'py-2 text-sm',
              isActive
                ? 'bg-blue-600/15 text-blue-400 font-semibold shadow-xs border border-blue-500/25'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
            )}
          >
            {tab.icon && <span className="w-4 h-4 shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge !== '' && tab.badge !== 0 && (
              <span
                className={cn(
                  'text-[10px] px-1.5 py-0.2 rounded-full font-bold transition-colors',
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
