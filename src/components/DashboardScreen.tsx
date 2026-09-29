'use client';

import React, { useState } from 'react';
import { Leader, Member, Submission, PrayerRequest, NeedsInfoItem } from '@/lib/types';
import {
  Calendar,
  CheckCircle,
  Clock,
  Phone,
  Search,
  MessageCircle,
  HelpCircle,
  Flame,
  ChevronRight,
  ClipboardCheck,
} from 'lucide-react';

interface DashboardScreenProps {
  currentLeader: Leader;
  periodKey: string;
  submissions: Submission[];
  prayerList: PrayerRequest[];
  needsInfoList: NeedsInfoItem[];
  onSelectMember: (member: Member) => void;
  onOpenAttendance: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  currentLeader,
  periodKey,
  submissions,
  prayerList,
  needsInfoList,
  onSelectMember,
  onOpenAttendance,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Format today's date
  const todayFormatted = new Date().toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  // Calculate progress for this leader's members in the current period
  const members = currentLeader.members || [];
  const totalMembers = members.length;

  // Filter submissions for this period and this leader
  const periodSubs = submissions.filter(
    s => s.period === periodKey && s.leaderId === currentLeader.id
  );

  const reportedMemberNames = new Set(
    periodSubs.map(s => s.memberName.trim().toLowerCase())
  );

  const completedCount = members.filter(m =>
    reportedMemberNames.has(m.name.trim().toLowerCase())
  ).length;

  const percentComplete =
    totalMembers > 0 ? Math.round((completedCount / totalMembers) * 100) : 0;

  // Helper to check member statuses
  const getMemberStatus = (member: Member) => {
    const memName = member.name.trim().toLowerCase();
    const hasFollowUp = periodSubs.some(
      s => s.type === 'followup' && s.memberName.trim().toLowerCase() === memName
    );
    const hasVisitation = periodSubs.some(
      s => s.type === 'visitation' && s.memberName.trim().toLowerCase() === memName
    );
    const onPrayer = prayerList.some(
      p =>
        p.leaderId === currentLeader.id &&
        p.memberName.trim().toLowerCase() === memName &&
        (p.active === true || p.active === 'true')
    );
    const needsInfo = needsInfoList.some(
      n =>
        n.leaderId === currentLeader.id &&
        n.memberName.trim().toLowerCase() === memName &&
        (n.active === true || n.active === 'true')
    );

    return { hasFollowUp, hasVisitation, onPrayer, needsInfo };
  };

  // Helper for initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .filter(Boolean)
      .map(part => part[0].toUpperCase())
      .slice(0, 2)
      .join('');
  };

  // Filter members by search
  const filteredMembers = members.filter(
    m =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.phone.includes(searchQuery)
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10 space-y-8">
      {/* Hero */}
      <section className="hero-panel p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-3">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-[var(--gold)] text-[var(--deep)]">
                {currentLeader.id}
              </span>
              <span className="text-xs text-[var(--gold-light)] font-medium tnum">Period {periodKey}</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold leading-[1.1] text-balance text-white">
              Welcome, {currentLeader.name}
            </h2>
            <div className="flex items-center gap-2 text-sm text-[#D9CDB2] mt-2">
              <Calendar className="w-4 h-4 text-[var(--gold-light)]" />
              <span>{todayFormatted}</span>
            </div>
          </div>

          <button
            onClick={onOpenAttendance}
            className="btn-gold px-5 py-2.5 text-sm flex items-center justify-center gap-2 flex-shrink-0"
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>Mark Event Attendance</span>
          </button>
        </div>

        <div className="mt-7">
          <div className="flex items-baseline justify-between gap-3 text-sm mb-2.5">
            <span className="text-[#D9CDB2]">Fold reporting progress</span>
            <span className="text-white font-semibold tnum">
              {completedCount} of {totalMembers}
              <span className="text-[var(--gold-light)] font-medium ml-1.5">{percentComplete}%</span>
            </span>
          </div>
          <div
            className="w-full h-2 bg-white/15 rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={percentComplete}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Fold reporting progress"
          >
            <div
              className="h-full bg-[var(--gold-light)] rounded-full transition-[width] duration-700 ease-out"
              style={{ width: `${percentComplete}%` }}
            />
          </div>
          {percentComplete === 100 && totalMembers > 0 && (
            <p className="text-sm text-[var(--gold-light)] font-semibold mt-3 flex items-center gap-1.5 animate-fade-in">
              <CheckCircle className="w-4 h-4" />
              Everyone in your fold has been reported this period. Well done.
            </p>
          )}
        </div>
      </section>

      {/* Roster */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h3 className="font-serif text-xl font-bold text-[var(--deep)]">
              Fold members <span className="text-[var(--muted)] font-normal tnum">{members.length}</span>
            </h3>
            <p className="text-sm text-[var(--muted)] mt-0.5">
              Tap a member to log a follow-up, visitation or prayer need.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none" />
            <input
              type="search"
              placeholder="Search name or phone"
              aria-label="Search fold members"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="regal-input pl-10"
            />
          </div>
        </div>

        <div className="regal-card overflow-hidden divide-y divide-[var(--border-light)] stagger">
          {filteredMembers.map((member, idx) => {
            const status = getMemberStatus(member);
            const isDone = status.hasFollowUp || status.hasVisitation;

            return (
              <button
                type="button"
                key={`${member.name}-${idx}`}
                onClick={() => onSelectMember(member)}
                className="row-link w-full text-left px-4 sm:px-5 py-4 flex items-center gap-4 group"
              >
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                    isDone
                      ? 'bg-[var(--success)] text-white'
                      : 'bg-[var(--gold-pale)] text-[#7A5C00] ring-1 ring-inset ring-[var(--gold)]/40'
                  }`}
                >
                  {isDone ? <CheckCircle className="w-5 h-5" /> : getInitials(member.name)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-[15px] text-[var(--deep)] truncate">{member.name}</div>
                  <div className="text-[13px] text-[var(--muted)] mt-0.5 flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-[var(--gold)]" />
                    {member.phone ? (
                      <span className="tnum">{member.phone}</span>
                    ) : (
                      <span className="italic">No phone on file</span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                    {status.hasFollowUp ? (
                      <span className="badge badge-done">
                        <CheckCircle className="w-3 h-3" />
                        Follow-up
                      </span>
                    ) : (
                      <span className="badge badge-pending">
                        <Clock className="w-3 h-3" />
                        Follow-up due
                      </span>
                    )}
                    {status.hasVisitation && (
                      <span className="badge badge-done">
                        <CheckCircle className="w-3 h-3" />
                        Visited
                      </span>
                    )}
                    {status.onPrayer && (
                      <span className="badge badge-prayer">
                        <Flame className="w-3 h-3" />
                        Prayer
                      </span>
                    )}
                    {status.needsInfo && (
                      <span className="badge badge-needsinfo">
                        <HelpCircle className="w-3 h-3" />
                        Needs info
                      </span>
                    )}
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-[var(--border)] group-hover:text-[var(--gold)] flex-shrink-0 transition-transform group-hover:translate-x-0.5" />
              </button>
            );
          })}

          {filteredMembers.length === 0 && (
            <div className="p-10 text-center">
              <p className="text-sm text-[var(--muted)]">
                {searchQuery ? `No one matches "${searchQuery}".` : 'No members in this fold yet.'}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
