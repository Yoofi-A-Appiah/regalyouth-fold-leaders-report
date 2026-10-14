'use client';

import React from 'react';
import Image from 'next/image';
import { Leader } from '@/lib/types';
import { LogOut, ShieldCheck, User } from 'lucide-react';

interface HeaderProps {
  currentLeader: Leader | null;
  isAdmin: boolean;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentLeader,
  isAdmin,
  onLogout,
}) => {
  return (
    <header className="app-header flex items-center justify-between px-4 sm:px-6 no-print">
      {/* Brand & Logo */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-[var(--gold)] ring-2 ring-[var(--gold-light)]/70 ring-offset-2 ring-offset-[var(--deep)] relative flex-shrink-0">
          {/* Fallback image */}
          <img
            src="https://i.ibb.co/NRNJnvg/regal-youth-logo.png"
            alt="Regal Youth Ministry Logo"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex flex-col min-w-0">
          <h1 className="font-serif text-white text-[15px] sm:text-lg font-bold leading-tight truncate">
            Regal Youth<span className="hidden sm:inline"> Ministry</span>
          </h1>
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-[var(--gold-light)] text-[11px] sm:text-xs font-semibold uppercase tracking-wider whitespace-nowrap">
              Fold Follow-Up System
            </span>
          </div>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {isAdmin ? (
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1 bg-[#2C1F0A] text-[var(--gold-light)] text-xs font-semibold px-2.5 py-1 rounded-full border border-[var(--gold)]/30">
              <ShieldCheck className="w-3.5 h-3.5 text-[var(--gold)]" />
              Administrator
            </span>
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 text-xs text-stone-300 hover:text-white bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-full border border-white/20 transition-all font-medium"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exit Admin</span>
            </button>
          </div>
        ) : currentLeader ? (
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 bg-[#2C1F0A] text-[var(--gold-light)] text-xs font-medium px-3 py-1 rounded-full border border-[var(--gold)]/30">
              <User className="w-3.5 h-3.5 text-[var(--gold)]" />
              <span className="font-semibold text-white truncate max-w-[96px] sm:max-w-[160px]">
                {currentLeader.name}
              </span>
              <span className="text-[11px] text-[var(--gold-light)] opacity-75 hidden sm:inline">
                ({currentLeader.id})
              </span>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-1 text-xs text-stone-300 hover:text-white bg-white/10 hover:bg-white/15 px-2.5 py-1.5 rounded-full border border-white/20 transition-all font-medium"
              title="Switch Leader / Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Switch</span>
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
};
