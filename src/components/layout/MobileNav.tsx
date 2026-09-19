'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, Users, Phone, Radio } from 'lucide-react';
import { cn } from '../../utils/cn';

/**
 * Mobile Bottom Navigation Bar Component.
 * 
 * Fixed fluid bottom bar for mobile screens (touch-optimized),
 * providing one-tap access to Chats, Stories, Calls, and Contacts.
 * 
 * @see https://developer.mozilla.org/en-US/docs/Web/CSS/position#fixed
 */
export function MobileNav() {
  const pathname = usePathname();

  const navItems = [
    {
      id: 'chats',
      label: 'Chats',
      icon: MessageSquare,
      href: '/chat',
      isActive: pathname.startsWith('/chat'),
    },
    {
      id: 'stories',
      label: 'Stories',
      icon: Radio,
      href: '/stories',
      isActive: pathname.startsWith('/stories'),
    },
    {
      id: 'calls',
      label: 'Calls',
      icon: Phone,
      href: '/calls',
      isActive: pathname.startsWith('/calls'),
    },
    {
      id: 'contacts',
      label: 'Contacts',
      icon: Users,
      href: '/contacts',
      isActive: pathname.startsWith('/contacts'),
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t border-white/[0.08] bg-[#0f1015]/95 backdrop-blur-xl px-4 flex items-center justify-around z-30 select-none shadow-lg"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.id}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-all',
              item.isActive
                ? 'text-blue-500 font-bold scale-105'
                : 'text-slate-400 hover:text-white'
            )}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[11px] leading-none">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
