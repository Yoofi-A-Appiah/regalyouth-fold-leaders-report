'use client';

import React, { useState } from 'react';
import { Leader } from '@/lib/types';
import { ShieldCheck, LogIn, ChevronRight, Search, Users } from 'lucide-react';

interface LoginScreenProps {
  leaders: Leader[];
  onLoginLeader: (leader: Leader) => void;
  onLoginAdmin: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  leaders,
  onLoginLeader,
  onLoginAdmin,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [filterSearch, setFilterSearch] = useState('');

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = inputValue.trim();
    if (!val) {
      setErrorMsg('Please enter your Leader ID or Admin Passcode');
      return;
    }

    // Check Admin Passcodes
    if (val === 'admin-regal2026' || val === 'regaladmin2026' || val.toLowerCase() === 'admin') {
      setErrorMsg('');
      onLoginAdmin();
      return;
    }

    // Check Leader ID or exact Name
    const found = leaders.find(
      l =>
        l.id.toLowerCase() === val.toLowerCase() ||
        l.name.toLowerCase() === val.toLowerCase()
    );

    if (found) {
      setErrorMsg('');
      onLoginLeader(found);
    } else {
      setErrorMsg(`Leader "${val}" not found. Check your Leader ID (e.g. FL-001) or choose from the list below.`);
    }
  };

  const filteredLeaders = leaders.filter(
    l =>
      l.name.toLowerCase().includes(filterSearch.toLowerCase()) ||
      l.id.toLowerCase().includes(filterSearch.toLowerCase())
  );

  return (
    <div className="min-h-[calc(100vh-var(--header-h))] flex flex-col items-center justify-center p-4 sm:p-6 bg-[radial-gradient(ellipse_at_top,_var(--gold-pale)_0%,_var(--bg)_70%)]">
      <div className="w-full max-w-md">
        {/* Welcome card */}
        <div className="regal-card p-6 sm:p-8 bg-white/90 backdrop-blur-sm border-[var(--border)] shadow-xl rounded-2xl text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-[var(--gold-pale)] border-2 border-[var(--gold)] flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Users className="w-8 h-8 text-[#8A6800]" />
          </div>

          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[var(--deep)] mb-1">
            Fold Follow-Up
          </h2>
          <p className="text-xs sm:text-sm text-[var(--muted)] mb-6">
            Enter your Leader ID or select your fold to begin reporting
          </p>

          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Enter Leader ID (e.g. FL-001) or Admin Code"
                value={inputValue}
                onChange={e => {
                  setInputValue(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                className="regal-input text-center text-base font-medium tracking-wide uppercase placeholder:normal-case placeholder:font-normal"
                autoFocus
              />
              {errorMsg && (
                <p className="text-xs text-[var(--error)] mt-2 font-medium bg-[var(--error-bg)] p-2 rounded-lg border border-[var(--error)]/20 animate-fade-in">
                  {errorMsg}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="btn-gold w-full py-3 text-sm font-semibold flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Continue to Dashboard</span>
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border)]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-[var(--muted)] font-semibold">
                Or Select Your Fold
              </span>
            </div>
          </div>

          {/* Quick filter & fold selection */}
          <div className="space-y-2 text-left">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[var(--muted)]" />
              <input
                type="text"
                placeholder="Filter leader name or ID..."
                value={filterSearch}
                onChange={e => setFilterSearch(e.target.value)}
                className="regal-input pl-8 py-2 text-xs"
              />
            </div>

            <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 pt-1">
              {filteredLeaders.map(leader => (
                <button
                  key={leader.id}
                  onClick={() => onLoginLeader(leader)}
                  type="button"
                  className="w-full flex items-center justify-between p-2.5 rounded-lg border border-[var(--border-light)] hover:border-[var(--gold)] bg-[#FFFDF8] hover:bg-[var(--gold-pale)] transition-colors group text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-[var(--bg2)] text-[var(--deep)] border border-[var(--border)]">
                      {leader.id}
                    </span>
                    <span className="text-xs font-semibold text-[var(--deep)] group-hover:text-[#8A6800]">
                      {leader.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-[var(--muted)]">
                      {leader.members.length} {leader.members.length === 1 ? 'youth' : 'youth'}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-[var(--muted)] group-hover:text-[var(--gold)]" />
                  </div>
                </button>
              ))}

              {filteredLeaders.length === 0 && (
                <p className="text-xs text-center text-[var(--muted)] py-4">
                  No leaders found matching "{filterSearch}"
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Admin shortcut */}
        <div className="text-center">
          <button
            onClick={onLoginAdmin}
            className="inline-flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-[var(--deep)] font-medium transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-[var(--gold)]" />
            <span>Ministry Leadership & Admin Portal</span>
          </button>
        </div>
      </div>
    </div>
  );
};
