'use client';

import React from 'react';
import { Users, ClipboardCheck, ShieldCheck, Crown } from 'lucide-react';

interface BottomNavProps {
  currentScreen: 'dashboard' | 'attendance' | 'executive' | 'admin';
  hasFold: boolean;
  isAdmin: boolean;
  isExecutive: boolean;
  onNavigate: (screen: 'dashboard' | 'attendance' | 'executive' | 'admin') => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentScreen,
  hasFold,
  isAdmin,
  isExecutive,
  onNavigate,
}) => {
  // The Admin and Executive tabs only render once that access is already granted --
  // never a one-tap way for a logged-in fold leader to grant themselves access.
  // "My Fold" only hides for the passcode-only admin session, which has no fold at all --
  // a Fold Coordinator or Super Admin still has one and keeps this tab.
  const items: { id: 'dashboard' | 'attendance' | 'executive' | 'admin'; label: string; Icon: typeof Users }[] = [
    ...(hasFold ? [{ id: 'dashboard' as const, label: 'My Fold', Icon: Users }] : []),
    { id: 'attendance', label: 'Attendance', Icon: ClipboardCheck },
    ...(isExecutive ? [{ id: 'executive' as const, label: 'Executive', Icon: Crown }] : []),
    ...(isAdmin ? [{ id: 'admin' as const, label: 'Admin', Icon: ShieldCheck }] : []),
  ];

  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 left-0 right-0 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:bottom-4 bg-[var(--card)]/95 backdrop-blur-sm border-t border-[var(--border-light)] sm:border sm:rounded-2xl sm:shadow-lg flex items-stretch justify-around z-40 no-print px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:py-1.5 sm:w-auto sm:min-w-[22rem]"
    >
      {items.map(({ id, label, Icon }) => {
        const active = currentScreen === id;
        return (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            aria-current={active ? 'page' : undefined}
            className={`flex-1 flex flex-col items-center gap-0.5 py-1 min-h-[52px] transition-colors ${
              active ? 'text-[#7A5C00] font-semibold' : 'text-[var(--muted)] font-medium'
            }`}
          >
            <span
              className={`h-7 w-14 rounded-full flex items-center justify-center transition-colors ${
                active ? 'bg-[var(--gold-pale)] ring-1 ring-inset ring-[var(--gold)]/40' : ''
              }`}
            >
              <Icon className="w-5 h-5" />
            </span>
            <span className="text-[11px]">{label}</span>
          </button>
        );
      })}
    </nav>
  );
};
