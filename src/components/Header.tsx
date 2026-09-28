'use client';

import React from 'react';
import Image from 'next/image';
import { Leader } from '@/lib/types';
import { LogOut, Database, ShieldCheck, User } from 'lucide-react';

interface HeaderProps {
  currentLeader: Leader | null;
  isAdmin: boolean;
  neonMode: 'neon' | 'in-memory' | 'checking';
  onLogout: () => void;
  onAdminClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentLeader,
  isAdmin,
  neonMode,
  onLogout,
  onAdminClick,
}) => {
  return (
    <header className="app-header flex items-center justify-between px-4 sm:px-6 no-print">
      {/* Brand & Logo */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-[var(--gold)] border-2 border-[var(--gold-light)] relative flex-shrink-0 shadow-md">
          {/* Fallback image */}
          <img
            src="https://i.ibb.co/NRNJnvg/regal-youth-logo.png"
            alt="Regal Youth Ministry Logo"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex flex-col">
          <h1 className="font-serif text-white text-base sm:text-lg font-bold leading-tight tracking-wide">
            Regal Youth Ministry
          </h1>
          <div className="flex items-center gap-2">
            <span className="text-[var(--gold-light)] text-[10px] sm:text-xs font-semibold uppercase tracking-wider opacity-85">
              Fold Follow-Up System
            </span>
            {/* Database indicator */}
            <span
              className={`inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full font-mono ${
                neonMode === 'neon'
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-950/80 text-amber-300 border border-amber-500/30'
              }`}
              title={
                neonMode === 'neon'
                  ? 'Connected to Neon PostgreSQL'
                  : 'Running in Local / Seed mode (DATABASE_URL not configured)'
              }
            >
              <Database className="w-2.5 h-2.5" />
              {neonMode === 'neon' ? 'Neon DB' : 'Local DB'}
            </span>
          </div>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 sm:gap-3">
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
              <span className="font-semibold text-white truncate max-w-[120px] sm:max-w-[160px]">
                {currentLeader.name}
              </span>
              <span className="text-[10px] text-[var(--gold-light)] opacity-75 hidden sm:inline">
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
        ) : (
          <button
            onClick={onAdminClick}
            className="flex items-center gap-1 text-xs text-[var(--gold-light)] bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full border border-[var(--gold)]/30 transition-all font-medium"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[var(--gold)]" />
            <span>Admin</span>
          </button>
        )}
      </div>
    </header>
  );
};
