'use client';

import React from 'react';
import { Users, ClipboardCheck, Flame, ShieldCheck, HeartHandshake } from 'lucide-react';

interface BottomNavProps {
  currentScreen: 'dashboard' | 'attendance' | 'admin';
  isAdmin: boolean;
  onNavigate: (screen: 'dashboard' | 'attendance' | 'admin') => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentScreen,
  isAdmin,
  onNavigate,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-[var(--nav-h)] bg-[#FFFDF9] border-t border-[var(--border)] shadow-lg flex items-center justify-around z-40 sm:hidden no-print">
      <button
        onClick={() => onNavigate('dashboard')}
        className={`flex flex-col items-center gap-1 py-1 px-3 transition-colors ${
          currentScreen === 'dashboard'
            ? 'text-[var(--gold)] font-bold'
            : 'text-[var(--muted)] hover:text-[var(--deep)] font-medium'
        }`}
      >
        <Users className="w-5 h-5" />
        <span className="text-[10px]">My Fold</span>
      </button>

      <button
        onClick={() => onNavigate('attendance')}
        className={`flex flex-col items-center gap-1 py-1 px-3 transition-colors ${
          currentScreen === 'attendance'
            ? 'text-[var(--gold)] font-bold'
            : 'text-[var(--muted)] hover:text-[var(--deep)] font-medium'
        }`}
      >
        <ClipboardCheck className="w-5 h-5" />
        <span className="text-[10px]">Attendance</span>
      </button>

      <button
        onClick={() => onNavigate('admin')}
        className={`flex flex-col items-center gap-1 py-1 px-3 transition-colors ${
          currentScreen === 'admin'
            ? 'text-[var(--gold)] font-bold'
            : 'text-[var(--muted)] hover:text-[var(--deep)] font-medium'
        }`}
      >
        <ShieldCheck className="w-5 h-5" />
        <span className="text-[10px]">{isAdmin ? 'Admin' : 'Admin Portal'}</span>
      </button>
    </nav>
  );
};
