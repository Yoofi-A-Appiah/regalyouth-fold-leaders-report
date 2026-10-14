'use client';

import React, { useRef, useState } from 'react';
import { Leader } from '@/lib/types';
import { ShieldCheck, LogIn, ChevronRight, Search, FileText, Lock, ArrowLeft } from 'lucide-react';

interface LoginScreenProps {
  leaders: Leader[];
  onLoginLeader: (leader: Leader) => void;
  onLoginAdmin: () => void;
}

// A leader flagged with an elevated role can't just be tapped in the picker list --
// they (or whoever's holding their session) must also know that role's passcode.
// A leader with no flags logs in exactly as before, no extra step.
function requiredPasscode(leader: Leader): { code: string; role: string } | null {
  if (leader.isSuperAdmin) return { code: 'regalsuperadmin2026', role: 'Super Admin' };
  if (leader.isFoldCoordinator) return { code: 'regaladmin2026', role: 'Fold Coordinator' };
  if (leader.isExecutive) return { code: 'regalexecutive2026', role: 'Executive' };
  return null;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  leaders,
  onLoginLeader,
  onLoginAdmin,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [filterSearch, setFilterSearch] = useState('');
  const passcodeInputRef = useRef<HTMLInputElement>(null);

  // Role passcode gate, shown after picking/typing a leader with an elevated flag
  const [pendingLeader, setPendingLeader] = useState<Leader | null>(null);
  const [roleCode, setRoleCode] = useState('');
  const [roleError, setRoleError] = useState('');

  const attemptLogin = (leader: Leader) => {
    const gate = requiredPasscode(leader);
    if (!gate) {
      onLoginLeader(leader);
      return;
    }
    setPendingLeader(leader);
    setRoleCode('');
    setRoleError('');
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = inputValue.trim();
    if (!val) {
      setErrorMsg('Please enter your Leader ID or Admin Passcode');
      return;
    }

    // Check Admin Passcode (identity-less session, no fold attached)
    if (val === 'regaladmin2026') {
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
      attemptLogin(found);
    } else {
      setErrorMsg(`Leader "${val}" not found. Check your Leader ID (e.g. FL-001) or choose from the list below.`);
    }
  };

  const handleRoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingLeader) return;
    const gate = requiredPasscode(pendingLeader);
    if (gate && roleCode.trim() === gate.code) {
      onLoginLeader(pendingLeader);
      setPendingLeader(null);
    } else {
      setRoleError(`Incorrect ${gate?.role} passcode.`);
    }
  };

  const filteredLeaders = leaders.filter(
    l =>
      l.name.toLowerCase().includes(filterSearch.toLowerCase()) ||
      l.id.toLowerCase().includes(filterSearch.toLowerCase())
  );

  if (pendingLeader) {
    const gate = requiredPasscode(pendingLeader);
    return (
      <div className="min-h-[calc(100vh-var(--header-h))] flex flex-col items-center justify-center px-4 py-8 sm:p-6 bg-[radial-gradient(ellipse_at_top,_var(--gold-pale)_0%,_var(--bg)_65%)]">
        <div className="w-full max-w-md">
          <div className="regal-card p-6 sm:p-8 shadow-xl">
            <button
              onClick={() => setPendingLeader(null)}
              className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--deep)] font-medium transition-colors mb-5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Not you?</span>
            </button>

            <div className="text-center mb-7">
              <div className="w-14 h-14 rounded-full bg-[var(--gold-pale)] border-2 border-[var(--gold)] flex items-center justify-center mx-auto mb-4">
                <Lock className="w-6 h-6 text-[#8A6800]" />
              </div>
              <h2 className="font-serif text-2xl font-bold text-[var(--deep)] text-balance">
                {gate?.role} Access
              </h2>
              <p className="text-sm text-[var(--muted)] mt-1.5">
                {pendingLeader.name} ({pendingLeader.id}) is flagged as {gate?.role}. Enter the {gate?.role} passcode to continue.
              </p>
            </div>

            <form onSubmit={handleRoleSubmit} className="space-y-4">
              <div>
                <input
                  type="password"
                  placeholder={`${gate?.role} passcode`}
                  value={roleCode}
                  onChange={e => {
                    setRoleCode(e.target.value);
                    if (roleError) setRoleError('');
                  }}
                  className="regal-input text-center font-medium tracking-wide"
                  autoFocus
                />
                {roleError && (
                  <p role="alert" className="text-sm text-[var(--error)] mt-2 font-medium bg-[var(--error-bg)] px-3 py-2 rounded-xl animate-fade-in">
                    {roleError}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="btn-gold w-full py-3 text-sm flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Confirm & Continue</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-var(--header-h))] flex flex-col items-center justify-center px-4 py-8 sm:p-6 bg-[radial-gradient(ellipse_at_top,_var(--gold-pale)_0%,_var(--bg)_65%)]">
      <div className="w-full max-w-md">
        <div className="regal-card p-6 sm:p-8 shadow-xl mb-6">
          <div className="text-center mb-7">
            <img
              src="https://i.ibb.co/NRNJnvg/regal-youth-logo.png"
              alt=""
              className="w-16 h-16 rounded-full object-cover mx-auto mb-4 ring-2 ring-[var(--gold)] ring-offset-4 ring-offset-[var(--card)]"
            />
            <h2 className="font-serif text-3xl font-bold text-[var(--deep)] text-balance">
              Fold Follow-Up
            </h2>
            <p className="text-sm text-[var(--muted)] mt-1.5">
              Enter your Leader ID or pick your name to begin reporting.
            </p>
          </div>

          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <input
                ref={passcodeInputRef}
                type="text"
                placeholder="Enter Leader ID (e.g. FL-001)"
                value={inputValue}
                onChange={e => {
                  setInputValue(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                className="regal-input text-center font-medium tracking-wide uppercase placeholder:normal-case placeholder:font-normal"
                autoFocus
              />
              {errorMsg && (
                <p role="alert" className="text-sm text-[var(--error)] mt-2 font-medium bg-[var(--error-bg)] px-3 py-2 rounded-xl animate-fade-in">
                  {errorMsg}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="btn-gold w-full py-3 text-sm flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Continue</span>
            </button>
          </form>

          <a
            href="/fold-leaders-manual.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex w-full items-center justify-center gap-1.5 text-xs font-semibold text-[var(--muted)] hover:text-[#8A6800] transition-colors py-1.5"
          >
            <FileText className="w-3.5 h-3.5 text-[var(--gold)]" />
            <span>Fold Leaders Manual</span>
          </a>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border)]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[var(--card)] px-3 text-[var(--muted)] font-medium normal-case">
                or choose your name
              </span>
            </div>
          </div>

          {/* Quick filter & fold selection */}
          <div className="space-y-2 text-left">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none" />
              <input
                type="text"
                placeholder="Filter by name or ID"
                value={filterSearch}
                onChange={e => setFilterSearch(e.target.value)}
                className="regal-input pl-10"
              />
            </div>

            <div className="max-h-64 overflow-y-auto -mx-2 px-2 divide-y divide-[var(--border-light)]">
              {filteredLeaders.map(leader => (
                <button
                  key={leader.id}
                  onClick={() => attemptLogin(leader)}
                  type="button"
                  className="row-link w-full flex items-center justify-between gap-3 px-2 py-3 rounded-lg group text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded-md bg-[var(--bg2)] text-[var(--deep)]">
                      {leader.id}
                    </span>
                    <span className="text-sm font-semibold text-[var(--deep)]">
                      {leader.name}
                    </span>
                    {requiredPasscode(leader) && (
                      <Lock className="w-3 h-3 text-[var(--muted)]" />
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-[var(--muted)] tnum">
                      {leader.members.length} youth
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-[var(--muted)] group-hover:text-[var(--gold)]" />
                  </div>
                </button>
              ))}

              {filteredLeaders.length === 0 && (
                <p className="text-sm text-center text-[var(--muted)] py-4">
                  No leaders found matching "{filterSearch}"
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Admin: no separate one-tap entry -- type the passcode above like everyone else */}
        <div className="text-center">
          <button
            onClick={() => passcodeInputRef.current?.focus()}
            className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--deep)] font-medium transition-colors py-2"
          >
            <ShieldCheck className="w-4 h-4 text-[var(--gold)]" />
            <span>Ministry Leadership? Enter your admin passcode above</span>
          </button>
        </div>
      </div>
    </div>
  );
};
